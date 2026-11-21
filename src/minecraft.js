// Minecraft Java Edition (launcher oficial): dónde está el launcher y logros al instante leyendo el log del juego.
// Cuando consigues un progreso, Minecraft lo escribe en .minecraft\logs\latest.log como mensaje del chat:
//   [Render thread/INFO]: [System] [CHAT] Xarlord has made the advancement [Stone Age]
// Sirve en mundos propios y en servidores (si el servidor anuncia los progresos). Solo en inglés.
// Modpacks de la app de Modrinth: cada uno es una carpeta en %APPDATA%\ModrinthApp\profiles con su propio logs\latest.log
// (cada modpack es un juego aparte en NostalHub, con sus horas y sus progresos).

const fs = require('fs');
const path = require('path');

const GAME_DIR = path.join(process.env.APPDATA || '', '.minecraft');
const MODRINTH_DIR = path.join(process.env.APPDATA || '', 'ModrinthApp'); // profiles\<modpack> y meta\versions (los .jar)
const STORE_ID = 'Microsoft.4297127D64EC6_8wekyb3d8bbwe'; // launcher de la Microsoft Store / app de Xbox

// Tipo de progreso → trofeo y puntos (como en la pantalla de progresos del juego)
const KINDS = {
  'made the advancement': { tier: 'bronze', gamerscore: 15 },
  'reached the goal': { tier: 'silver', gamerscore: 30 },
  'completed the challenge': { tier: 'gold', gamerscore: 50 },
};
const LINE = /\[CHAT\]\s+(.*?)\s+has (made the advancement|reached the goal|completed the challenge) \[(.+)\]\s*$/;
const USER = /Setting user: (\S+)/;
const VERSION = /Loading Minecraft (\d[^\s,]*)|--fml\.mcVersion,? (\d[^\s,]*)/; // con Fabric / NeoForge (el normal no lo dice)

// Dónde se abre el launcher: el de la Microsoft Store / Xbox o el instalador clásico (MinecraftLauncher.exe)
function findLauncher() {
  const local = process.env.LOCALAPPDATA || '';
  if (fs.existsSync(path.join(local, 'Packages', STORE_ID))) return `shell:AppsFolder\\${STORE_ID}!Minecraft`;
  const exes = [
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Minecraft Launcher', 'MinecraftLauncher.exe'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Minecraft Launcher', 'MinecraftLauncher.exe'),
    path.join(local, 'Programs', 'Minecraft Launcher', 'MinecraftLauncher.exe'),
    'C:\\XboxGames\\Minecraft Launcher\\Content\\Minecraft.exe',
  ];
  return exes.find((p) => fs.existsSync(p)) || null;
}

// La app de Modrinth (Jugar abre la app: ahí se aprieta Jugar en el modpack)
function findModrinth() {
  const exes = [
    path.join(process.env.LOCALAPPDATA || '', 'Modrinth App', 'Modrinth App.exe'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Modrinth App', 'Modrinth App.exe'),
  ];
  return exes.find((p) => fs.existsSync(p)) || null;
}

// "Xars-Create-Survival-1.2.0" → "Xars Create Survival" (sin la versión del modpack)
function modpackName(folder) {
  return String(folder).replace(/[-_ ]v?\d+(\.\d+)+$/i, '').replace(/[-_]+/g, ' ').trim() || String(folder);
}

// Los modpacks instalados en la app de Modrinth: [{ folder, name, dir }]
function modrinthProfiles(base = MODRINTH_DIR) {
  const root = path.join(base, 'profiles');
  try {
    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => ({ folder: d.name, name: modpackName(d.name), dir: path.join(root, d.name) }));
  } catch {
    return [];
  }
}

// El comienzo del log, con la hora en que se abrió Minecraft (para saber si es otro archivo). null si aún está vacío
function head(file) {
  try {
    const fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(40);
    const n = fs.readSync(fd, buf, 0, 40, 0);
    fs.closeSync(fd);
    return n >= 40 ? buf.toString('latin1') : null;
  } catch {
    return '';
  }
}

const strip = (s) => String(s).replace(/§./g, ''); // quita los colores de Minecraft (§a, §l…)

// Vigila latest.log y avisa cada progreso tuyo (no los de otros jugadores del servidor)
class MinecraftWatcher {
  // gameDir: la carpeta del juego (.minecraft, o la del modpack de Modrinth)
  constructor({ onUnlock, log = () => {}, gameDir = GAME_DIR }) {
    this.gameDir = gameDir;
    this.logFile = path.join(gameDir, 'logs', 'latest.log');
    this.onUnlock = onUnlock;
    this.log = log;
    this.timer = null;
    this.offset = 0;
    this.user = null;
    this.rest = '';
    this.head = '';
    this.version = null; // versión del juego (para buscar los íconos en su .jar)
  }

  start() {
    if (this.timer || !fs.existsSync(this.gameDir)) return;
    // Lo que ya estaba escrito no se avisa: solo se busca con qué cuenta se está jugando
    try {
      const st = fs.statSync(this.logFile);
      this.offset = st.size;
      this.head = head(this.logFile) || '';
      const m = fs.readFileSync(this.logFile, 'utf8').match(new RegExp(USER.source, 'g'));
      if (m) this.user = m[m.length - 1].match(USER)[1];
      const v = fs.readFileSync(this.logFile, 'utf8').slice(0, 20000).match(VERSION);
      this.version = v ? v[1] || v[2] : null;
    } catch {
      this.offset = 0;
    }
    this.timer = setInterval(() => this.poll(), 1500);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }

  poll() {
    let size;
    try {
      const st = fs.statSync(this.logFile);
      size = st.size;
      // Archivo nuevo (Minecraft se abrió de nuevo): cambia la primera línea. La fecha de creación no sirve,
      // porque Windows la copia del archivo anterior si se crea otro con el mismo nombre al tiro.
      const h = head(this.logFile);
      if (h === null) return;
      if (h !== this.head) {
        this.head = h;
        this.offset = Infinity;
      }
    } catch {
      return; // todavía no hay log
    }
    if (size < this.offset) {
      // Minecraft se abrió de nuevo: latest.log empieza de cero
      this.offset = 0;
      this.rest = '';
      this.user = null;
      this.version = null;
    }
    if (size === this.offset) return;
    let text = '';
    try {
      const fd = fs.openSync(this.logFile, 'r');
      const buf = Buffer.alloc(Math.min(size - this.offset, 4 * 1024 * 1024));
      fs.readSync(fd, buf, 0, buf.length, this.offset);
      fs.closeSync(fd);
      this.offset += buf.length;
      text = this.rest + buf.toString('utf8');
    } catch (e) {
      return this.log('No se pudo leer el log de Minecraft:', e.message);
    }
    const lines = text.split(/\r?\n/);
    this.rest = lines.pop(); // la última puede venir a medias
    for (const line of lines) {
      const u = line.match(USER);
      if (u) this.user = u[1];
      const v = !this.version && line.match(VERSION);
      if (v) this.version = v[1] || v[2];
      const m = line.match(LINE);
      if (!m) continue;
      const who = strip(m[1]).split(/\s+/).pop().replace(/^<|>$/g, ''); // "[Admin] Xarlord" → "Xarlord"
      if (this.user && who.toLowerCase() !== this.user.toLowerCase()) continue;
      this.onUnlock({ name: strip(m[3]), version: this.version, ...KINDS[m[2]] });
    }
  }
}

module.exports = { MinecraftWatcher, findLauncher, findModrinth, modrinthProfiles, modpackName, GAME_DIR, MODRINTH_DIR };
