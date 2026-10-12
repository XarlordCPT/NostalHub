// Abre un juego según su tipo y avisa cuando termina (si se puede saber).

const fs = require('fs');
const path = require('path');
const { spawn, execFile } = require('child_process');
const { shell } = require('electron');
const steam = require('./steam');

const STEAM_START_TIMEOUT_MS = 3 * 60 * 1000; // si en 3 min no arranca, se asume que se canceló
const POLL_MS = 3000;
// El aviso de "terminó" nunca llega antes de esto: así no se pierde durante la animación de abrir el juego
// (si llegaba en medio, la pantalla "Jugando" quedaba pegada)
const MIN_PLAY_MS = 4000;

// ¿Hay un proceso con ese nombre (ej. "Minecraft.exe") abierto?
function isRunning(exeName) {
  return new Promise((resolve) => {
    execFile('tasklist', ['/fo', 'csv', '/nh', '/fi', `imagename eq ${exeName}`], { windowsHide: true }, (err, out) => {
      if (err) return resolve(null); // no se pudo saber
      resolve(String(out).toLowerCase().includes(`"${exeName.toLowerCase()}"`));
    });
  });
}

class Launcher {
  constructor(onEnded) {
    this.onEnded = onEnded; // (gameId, reason) => void
    this.session = null;
  }

  async launch(game) {
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

      case 'exe': {
        if (!fs.existsSync(game.target)) return { ok: false, error: `No se encontró ${path.basename(game.target)}` };
        const child = spawn(game.target, game.args || [], {
          cwd: game.startDir || path.dirname(game.target),
          detached: true,
          stdio: 'ignore',
          windowsHide: false,
        });
        child.on('error', () => this.end(game.id, 'error'));
        child.on('exit', () => this.end(game.id, 'exited'));
        child.unref();
        this.session = { gameId: game.id, child };
        return { ok: true, tracking: true };
      }

      case 'shortcut':
      default: {
        const err = await shell.openPath(game.target);
        if (err) return { ok: false, error: err };
        // Acceso directo a un .exe: se vigila ese programa para volver solo al menú cuando se cierre
        const exe = this.shortcutExe(game.target);
        if (!exe) return { ok: true, tracking: false };
        this.watchProcess(game, path.basename(exe));
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

  // Vigila un programa por su nombre: cuando aparece y después se cierra, el juego terminó.
  // Si no aparece en 3 minutos se deja de vigilar (queda el botón "Volver al menú").
  watchProcess(game, exeName) {
    let seenRunning = false;
    let checking = false;
    const timer = setInterval(async () => {
      if (checking) return;
      checking = true;
      const running = await isRunning(exeName);
      checking = false;
      if (!this.session || this.session.timer !== timer) return;
      if (running) seenRunning = true;
      else if (running === false && seenRunning) this.end(game.id, 'exited');
      else if (!seenRunning && Date.now() - this.startedAt > STEAM_START_TIMEOUT_MS) this.stopWatching();
    }, POLL_MS);
    this.session = { gameId: game.id, timer };
  }

  end(gameId, reason) {
    if (!this.session || this.session.gameId !== gameId) return;
    this.stopWatching();
    const wait = Math.max(0, MIN_PLAY_MS - (Date.now() - (this.startedAt || 0)));
    setTimeout(() => this.onEnded(gameId, reason), wait);
  }

  stopWatching() {
    if (this.session && this.session.timer) clearInterval(this.session.timer);
    this.session = null;
  }
}

module.exports = { Launcher };
