// Emuladores: encuentra el programa y tus juegos, y arma cómo abrir cada uno directo.
// Por ahora PCSX2 (PS2) y RetroArch con el núcleo mGBA (GBA).
// NostalHub no trae emuladores, juegos ni BIOS: solo abre lo que ya tienes.

const fs = require('fs');
const os = require('os');
const path = require('path');

const MAX_DEPTH = 6;

// ---------- RetroArch ----------
function retroarchExe() {
  const roots = ['C:\\RetroArch-Win64', 'C:\\RetroArch'];
  for (const base of [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs'), process.env.APPDATA]) {
    if (base) roots.push(path.join(base, 'RetroArch'), path.join(base, 'RetroArch-Win64'));
  }
  for (const root of roots) {
    const file = path.join(root, 'retroarch.exe');
    if (fs.existsSync(file)) return file;
  }
  return null;
}
// Una opción de retroarch.cfg (solo se lee la que se pide). ":\\cores" significa la carpeta de RetroArch.
function retroarchOption(exe, name) {
  for (const file of [path.join(path.dirname(exe), 'retroarch.cfg'), process.env.APPDATA && path.join(process.env.APPDATA, 'RetroArch', 'retroarch.cfg')]) {
    let text = '';
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const m = text.match(new RegExp(`^${name}\\s*=\\s*"([^"]*)"`, 'm'));
    if (!m || !m[1] || m[1] === 'default') return null;
    if (m[1].startsWith(':')) return path.join(path.dirname(exe), m[1].slice(1));
    return m[1].startsWith('~') ? path.join(os.homedir(), m[1].slice(1)) : m[1]; // RetroArch guarda tu carpeta personal como ~
  }
  return null;
}
function retroarchCore(exe, dll) {
  return path.join(retroarchOption(exe, 'libretro_directory') || path.join(path.dirname(exe), 'cores'), dll);
}

const EMULATORS = {
  pcsx2: {
    name: 'PCSX2',
    system: 'PS2',
    idPrefix: 'ps2',
    artRepo: 'Sony_-_PlayStation_2', // carátulas por nombre de archivo (libretro-thumbnails)
    raConsole: 21, // número de la consola en RetroAchievements
    exts: ['.iso', '.chd', '.cso', '.zso', '.gz', '.cue', '.mdf'],
    exe: () => {
      const roots = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs')];
      for (const root of roots.filter(Boolean)) {
        const file = path.join(root, 'PCSX2', 'pcsx2-qt.exe');
        if (fs.existsSync(file)) return file;
      }
      return null;
    },
    // Las carpetas que ya configuraste en PCSX2 (Ajustes → Lista de juegos)
    folders(exe, documents) {
      const portable = fs.existsSync(path.join(path.dirname(exe), 'portable.txt')) || fs.existsSync(path.join(path.dirname(exe), 'portable.ini'));
      const ini = path.join(portable ? path.dirname(exe) : path.join(documents, 'PCSX2'), 'inis', 'PCSX2.ini');
      let text = '';
      try {
        text = fs.readFileSync(ini, 'utf8');
      } catch {
        return [];
      }
      const section = (text.split(/^\[GameList\]\s*$/m)[1] || '').split(/^\[/m)[0];
      const out = [];
      for (const m of section.matchAll(/^(Recursive)?Paths\s*=\s*(.+?)\s*$/gm)) out.push({ dir: m[2], recursive: !!m[1] });
      return out;
    },
    // -batch: al cerrar el juego se cierra el emulador. Con su ventana principal (no -nogui), para que la pantalla
    // completa salga en la pantalla donde dejaste PCSX2: no tiene opción para elegirla y sin ventana sale en cualquiera
    args: (rom) => ['-batch', '-fullscreen', '--', rom],
  },
  gba: {
    name: 'RetroArch',
    system: 'GBA',
    idPrefix: 'gba',
    artRepo: 'Nintendo_-_Game_Boy_Advance',
    raConsole: 5,
    exts: ['.gba'],
    exe: retroarchExe,
    // La carpeta inicial de RetroArch (Ajustes → Directorio → Explorador de archivos)
    folders(exe) {
      const dir = retroarchOption(exe, 'rgui_browser_directory');
      return dir ? [{ dir, recursive: true }] : [];
    },
    problem: (exe) => (fs.existsSync(retroarchCore(exe, 'mgba_libretro.dll')) ? null : 'Falta el núcleo mGBA: bájalo en RetroArch, en Online Updater → Core Downloader'),
    args: (rom, exe) => ['-L', retroarchCore(exe, 'mgba_libretro.dll'), '--fullscreen', rom],
    // Su registro dice al instante qué logro ganaste (no guarda tu token)
    liveLog: {
      args: (file) => ['--verbose', `--log-file=${file}`],
      game: /\[RCHEEVOS\] Identified game: (\d+) /,
      unlock: /\[RCHEEVOS\] Awarding achievement (\d+): (.*)$/,
    },
  },
};

// Lee las líneas nuevas de un archivo mientras otro programa lo escribe. Devuelve la función para dejar de leer.
function tailFile(file, onLine, everyMs = 500) {
  let pos = 0;
  const timer = setInterval(() => {
    let fd = null;
    try {
      const size = fs.statSync(file).size;
      if (size < pos) pos = 0; // empezó de nuevo
      if (size === pos) return;
      fd = fs.openSync(file, 'r');
      const buf = Buffer.alloc(size - pos);
      fs.readSync(fd, buf, 0, buf.length, pos);
      const end = buf.lastIndexOf(10); // solo líneas completas
      if (end < 0) return;
      pos += end + 1;
      buf.toString('utf8', 0, end).replace(/\r$/, '').split(/\r?\n/).forEach(onLine);
    } catch {
      // Todavía no existe el archivo
    } finally {
      if (fd !== null) fs.closeSync(fd);
    }
  }, everyMs);
  return () => clearInterval(timer);
}

// Todos los juegos dentro de las carpetas
function scanFolders(folders, exts) {
  const found = new Set();
  const walk = (dir, recursive, depth) => {
    let items = [];
    try {
      items = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const it of items) {
      const file = path.join(dir, it.name);
      if (it.isDirectory()) {
        if (recursive && depth < MAX_DEPTH) walk(file, true, depth + 1);
      } else if (exts.includes(path.extname(it.name).toLowerCase())) found.add(file);
    }
  };
  for (const f of folders) walk(f.dir, f.recursive, 0);
  return [...found].sort((a, b) => a.localeCompare(b, 'es'));
}

// "Guitar Hero (USA).iso" → "Guitar Hero"
function gameName(file) {
  const stem = path.basename(file, path.extname(file));
  return stem.replace(/(\s*[([][^)\]]*[)\]])+\s*$/, '').trim() || stem;
}

function gameId(prefix, file) {
  const slug = path
    .basename(file, path.extname(file))
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${prefix}-${slug}`;
}

module.exports = { EMULATORS, scanFolders, gameName, gameId, tailFile };
