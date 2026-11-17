// Emuladores: encuentra el programa y tus juegos, y arma cómo abrir cada uno directo.
// Por ahora PCSX2 (PS2), RetroArch con el núcleo mGBA (GBA) y Dolphin (Wii).
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

// ---------- Dolphin ----------
function dolphinExe(home = os.homedir()) {
  const roots = ['C:\\Dolphin', 'C:\\Dolphin-x64'];
  for (const base of [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs')]) {
    if (base) roots.push(path.join(base, 'Dolphin'), path.join(base, 'Dolphin-x64'), path.join(base, 'Dolphin Emulator'));
  }
  for (const root of roots) {
    const file = path.join(root, 'Dolphin.exe');
    if (fs.existsSync(file)) return file;
  }
  // Dolphin suele bajarse portable (un .zip): se busca en Documentos, Escritorio y Descargas, hasta dos carpetas adentro
  for (const base of ['Documents', 'Desktop', 'Downloads'].map((d) => path.join(home, d))) {
    const found = findFile(base, 'dolphin.exe', 2);
    if (found) return found;
  }
  return null;
}
// Un archivo por su nombre (sin importar mayúsculas), hasta cierta profundidad
function findFile(dir, name, depth) {
  let items = [];
  try {
    items = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  const hit = items.find((it) => it.isFile() && it.name.toLowerCase() === name);
  if (hit) return path.join(dir, hit.name);
  if (depth <= 0) return null;
  for (const it of items) {
    if (!it.isDirectory() || it.name.startsWith('.') || it.name === 'node_modules') continue;
    const found = findFile(path.join(dir, it.name), name, depth - 1);
    if (found) return found;
  }
  return null;
}
// La carpeta de datos de Dolphin, como la busca él: portable (portable.txt junto al programa → User\), la antigua en
// Documentos si existe, o la de AppData
function dolphinUserDir(exe, documents) {
  if (exe && fs.existsSync(path.join(path.dirname(exe), 'portable.txt'))) return path.join(path.dirname(exe), 'User');
  const old = documents && path.join(documents, 'Dolphin Emulator');
  if (old && fs.existsSync(old)) return old;
  return path.join(process.env.APPDATA || '', 'Dolphin Emulator');
}
// ¿Es un juego de Wii o de GameCube? Se mira la cabecera del archivo: 'wii', 'gc' o null si no se sabe
const WII_MAGIC = 0x5d1c9ea3;
const GC_MAGIC = 0xc2339f3d;
function discSystem(file) {
  let fd = null;
  try {
    fd = fs.openSync(file, 'r');
    const b = Buffer.alloc(0x60);
    const n = fs.readSync(fd, b, 0, b.length, 0);
    const magic = b.toString('latin1', 0, 4);
    if (magic === 'WBFS') return 'wii';
    if ((magic === 'RVZ\x01' || magic === 'WIA\x01') && n >= 0x4c) return { 1: 'gc', 2: 'wii' }[b.readUInt32BE(0x48)] || null; // tipo de disco
    if (b.readUInt32LE(0) === 0xb10bc001 && n >= 8) return { 0: 'gc', 1: 'wii' }[b.readUInt32LE(4)] || null; // .gcz
    if (n >= 0x20 && b.readUInt32BE(0x18) === WII_MAGIC) return 'wii'; // .iso
    if (n >= 0x20 && b.readUInt32BE(0x1c) === GC_MAGIC) return 'gc';
    return null;
  } catch {
    return null;
  } finally {
    if (fd !== null) fs.closeSync(fd);
  }
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
  // Wii con Dolphin. Los juegos de GameCube de las mismas carpetas no se agregan (only).
  wii: {
    name: 'Dolphin',
    system: 'Wii',
    idPrefix: 'wii',
    artRepo: 'Nintendo_-_Wii',
    raConsole: 19,
    exts: ['.rvz', '.iso', '.wbfs', '.wia', '.gcz', '.ciso'],
    only: (file) => discSystem(file) !== 'gc',
    exe: dolphinExe,
    // Las carpetas de su lista de juegos (Opciones → Configuración → Rutas)
    folders(exe, documents) {
      let text = '';
      try {
        text = fs.readFileSync(path.join(dolphinUserDir(exe, documents), 'Config', 'Dolphin.ini'), 'utf8');
      } catch {
        return [];
      }
      const section = (text.split(/^\[General\]\s*$/m)[1] || '').split(/^\[/m)[0];
      const recursive = /^RecursiveISOPaths\s*=\s*True\s*$/im.test(section);
      return [...section.matchAll(/^ISOPath\d+\s*=\s*(.+?)\s*$/gm)].map((m) => ({ dir: path.normalize(m[1]), recursive }));
    },
    // -b: al cerrar el juego se cierra Dolphin; -e: el juego
    args: (rom) => ['-b', '-e', rom],
    // Su registro dice al instante qué logro ganaste. Se enciende solo para esta vez (-C no cambia tu configuración) y
    // se escribe en su archivo de siempre (User\Logs\dolphin.log): se lee desde donde estaba (fromEnd) y, si estaba
    // vacío, se vuelve a dejar vacío al cerrar (keep: es de Dolphin, no se borra). No guarda tu token (probado).
    liveLog: {
      file: (exe, documents) => path.join(dolphinUserDir(exe, documents), 'Logs', 'dolphin.log'),
      keep: true,
      args: () => ['-C', 'Logger.Options.WriteToFile=True', '-C', 'Logger.Logs.RetroAchievements=True', '-C', 'Logger.Options.Verbosity=4'],
      game: /\]: Identified game: (\d+) /,
      unlock: /\]: Awarding achievement (\d+): (.*)$/,
    },
  },
};

// Lee las líneas nuevas de un archivo mientras otro programa lo escribe. Devuelve la función para dejar de leer.
// fromEnd: no lee lo que ya había (el archivo es del emulador y puede traer sesiones anteriores)
function tailFile(file, onLine, everyMs = 500, fromEnd = false) {
  let pos = 0;
  if (fromEnd) {
    try {
      pos = fs.statSync(file).size;
    } catch {}
  }
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

module.exports = { EMULATORS, scanFolders, gameName, gameId, tailFile, discSystem, dolphinUserDir };
