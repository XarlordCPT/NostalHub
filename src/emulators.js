// Emuladores: encuentra el programa y tus juegos, y arma cómo abrir cada uno directo. Por ahora PCSX2 (PS2).
// NostalHub no trae emuladores, juegos ni BIOS: solo abre lo que ya tienes.

const fs = require('fs');
const path = require('path');

const MAX_DEPTH = 6;

const EMULATORS = {
  pcsx2: {
    name: 'PCSX2',
    system: 'PS2',
    idPrefix: 'ps2',
    artRepo: 'Sony_-_PlayStation_2', // carátulas por nombre de archivo (libretro-thumbnails)
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
};

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

module.exports = { EMULATORS, scanFolders, gameName, gameId };
