// Abre un juego según su tipo y avisa cuando termina (si se puede saber).

const fs = require('fs');
const path = require('path');
const { spawn, execFile } = require('child_process');
const { shell } = require('electron');
const steam = require('./steam');

const STEAM_START_TIMEOUT_MS = 3 * 60 * 1000; // si en 3 min no arranca, se asume que se canceló
const LAUNCHER_START_TIMEOUT_MS = 10 * 60 * 1000; // en Minecraft eliges versión o mods; Epic puede estar actualizando
const POLL_MS = 3000;
// Un juego de otro launcher pasa por varios programas (Fortnite: Bootstrapper → Launcher → Client): el cierre se da por
// hecho solo si ninguno aparece durante este rato
const HANDOFF_MS = 15000;
const NOT_THE_GAME = /crash|unins|setup|redist|update/i;
const STORE_APPS = /^(epicgameslauncher|steam|galaxyclient|battle\.net|eadesktop|upc)\.exe$/i;
// El aviso de "terminó" nunca llega antes de esto: así no se pierde durante la animación de abrir el juego
// (si llegaba en medio, la pantalla "Jugando" quedaba pegada)
const MIN_PLAY_MS = 4000;

// ¿Hay algún proceso abierto con uno de esos nombres (ej. "Minecraft.exe")?
function isRunning(exeNames) {
  return new Promise((resolve) => {
    execFile('tasklist', ['/fo', 'csv', '/nh'], { windowsHide: true, maxBuffer: 8 * 1024 * 1024 }, (err, out) => {
      if (err) return resolve(null); // no se pudo saber
      const text = String(out).toLowerCase();
      resolve(exeNames.some((name) => text.includes(`"${name.toLowerCase()}"`)));
    });
  });
}

class Launcher {
  constructor(onEnded) {
    this.onEnded = onEnded; // (gameId, reason) => void
    this.session = null;
  }

  async launch(game, extraArgs = []) {
    this.stopWatching();
    this.startedAt = Date.now();
    switch (game.type) {
      case 'steam':
        await shell.openExternal(`steam://rungameid/${game.appId}`);
        this.watchSteam(game);
        return { ok: true, tracking: true };

      case 'url':
        await shell.openExternal(game.target);
        return { ok: true, tracking: false };

      case 'emulator': // el emulador con el juego: se cierra junto con el juego
      case 'exe': {
        if (!fs.existsSync(game.target)) return { ok: false, error: `No se encontró ${path.basename(game.target)}` };
        if (game.rom && !fs.existsSync(game.rom)) return { ok: false, error: `No se encontró ${path.basename(game.rom)}` };
        const child = spawn(game.target, [...extraArgs, ...(game.args || [])], {
          cwd: game.startDir || path.dirname(game.target),
          detached: true,
          stdio: 'ignore',
          windowsHide: false,
        });
        child.on('error', () => this.end(game.id, 'error'));
        child.on('exit', () => this.end(game.id, 'exited'));
        child.unref();
        this.session = { gameId: game.id, child, seen: true };
        return { ok: true, tracking: true };
      }

      // Minecraft Java: se abre el launcher y se vigila el juego (javaw.exe), que arranca cuando apretas Jugar
      case 'minecraft': {
        const t = game.target || '';
        if (/^shell:/i.test(t)) spawn('explorer.exe', [t], { detached: true, stdio: 'ignore' }).unref();
        else if (fs.existsSync(t)) spawn(t, [], { cwd: path.dirname(t), detached: true, stdio: 'ignore' }).unref();
        else return { ok: false, error: 'No se encontró el launcher de Minecraft' };
        this.watchProcess(game, ['javaw.exe'], LAUNCHER_START_TIMEOUT_MS);
        return { ok: true, tracking: true };
      }

      case 'shortcut':
      default: {
        const err = await shell.openPath(game.target);
        if (err) return { ok: false, error: err };
        // Acceso directo a un .exe: se vigila ese programa para volver solo al menú cuando se cierre
        const exe = this.shortcutExe(game.target);
        if (exe) {
          this.watchProcess(game, [path.basename(exe)]);
          return { ok: true, tracking: true };
        }
        // Acceso directo de otro launcher (.url de Epic): se vigilan los programas de la carpeta del juego
        const programs = this.urlShortcutPrograms(game.target);
        if (!programs) return { ok: true, tracking: false };
        this.watchProcess(game, programs, LAUNCHER_START_TIMEOUT_MS, HANDOFF_MS);
        return { ok: true, tracking: true };
      }
    }
  }

  watchSteam(game) {
    const appId = Number(game.appId);
    const startedAt = Date.now();
    let seenRunning = false;
    const timer = setInterval(async () => {
      const running = await steam.getRunningAppId();
      if (running === appId) {
        seenRunning = true;
      } else if (seenRunning) {
        this.end(game.id, 'exited');
      } else if (Date.now() - startedAt > STEAM_START_TIMEOUT_MS) {
        this.end(game.id, 'not-started');
      }
    }, POLL_MS);
    this.session = { gameId: game.id, timer };
  }

  // El .exe al que apunta un acceso directo (.lnk), o null si no apunta a un .exe
  shortcutExe(target) {
    if (process.platform !== 'win32' || !/\.lnk$/i.test(target || '')) return null;
    try {
      const t = shell.readShortcutLink(target).target;
      return t && /\.exe$/i.test(t) && fs.existsSync(t) ? t : null;
    } catch {
      return null;
    }
  }

  // Los programas de un acceso .url: su ícono es el .exe del juego, y se toman todos los de esa carpeta.
  // null si no se puede saber (no es .url, su ícono no es un .exe, o es el programa de la tienda).
  urlShortcutPrograms(target) {
    if (process.platform !== 'win32' || !/\.url$/i.test(target || '')) return null;
    try {
      const m = fs.readFileSync(target, 'latin1').match(/^IconFile=(.+\.exe)\s*$/im);
      if (!m || !fs.existsSync(m[1])) return null;
      const programs = fs.readdirSync(path.dirname(m[1])).filter((f) => /\.exe$/i.test(f) && !NOT_THE_GAME.test(f));
      return programs.length && !programs.some((f) => STORE_APPS.test(f)) ? programs : null;
    } catch {
      return null;
    }
  }

  // Vigila programas por su nombre: cuando aparece uno y después no queda ninguno, el juego terminó.
  // Si no aparece en 3 minutos (o el tiempo que se pida) se deja de vigilar (queda el botón "Volver al menú").
  watchProcess(game, exeNames, startTimeout = STEAM_START_TIMEOUT_MS, handoffMs = 0) {
    let seenRunning = false;
    let checking = false;
    let lastSeen = 0;
    const timer = setInterval(async () => {
      if (checking) return;
      checking = true;
      const running = await isRunning(exeNames);
      checking = false;
      if (!this.session || this.session.timer !== timer) return;
      if (running) {
        seenRunning = this.session.seen = true;
        lastSeen = Date.now();
      } else if (running === false && seenRunning) {
        if (Date.now() - lastSeen >= handoffMs) this.end(game.id, 'exited');
      } else if (!seenRunning && Date.now() - this.startedAt > startTimeout) this.stopWatching();
    }, POLL_MS);
    this.session = { gameId: game.id, timer };
  }

  // El juego que no es de Steam abierto ahora (los de Steam se ven directo en Steam, aunque se abran por fuera)
  playingId() {
    return this.session && this.session.seen ? this.session.gameId : null;
  }

  // "Volver al menú" con el juego abierto: la pantalla ya no espera, pero sus horas se siguen contando
  dismiss() {
    if (this.session) this.session.dismissed = true;
  }

  end(gameId, reason) {
    if (!this.session || this.session.gameId !== gameId) return;
    const dismissed = this.session.dismissed;
    this.stopWatching();
    if (dismissed) return;
    const wait = Math.max(0, MIN_PLAY_MS - (Date.now() - (this.startedAt || 0)));
    setTimeout(() => this.onEnded(gameId, reason), wait);
  }

  stopWatching() {
    if (this.session && this.session.timer) clearInterval(this.session.timer);
    this.session = null;
  }
}

module.exports = { Launcher };
