// Editor de imágenes de cada juego (clic derecho o tecla I en cualquier consola): elegir, arrastrar, pegar o recortar
// una imagen, volver a la automática, la descripción y abrir la carpeta del juego. También lee el portapapeles.
// Las imágenes se guardan en personalizar\<Nombre del juego>\ (src/media.js → CUSTOM_FILES dice cómo se llama cada una).
// main.js lo conecta con registrar(nh), pasándole lo suyo: config, carpetas, la ventana y algunas funciones.

const fs = require('fs');
const path = require('path');
const { ipcMain, dialog, shell, clipboard, nativeImage } = require('electron');
const media = require('./media');

let nh = null;

// ---------- Portapapeles (en Electron 44 se lee con promesas, como en el navegador) ----------
async function clipboardText() {
  try {
    return String((await clipboard.readText()) || '').trim();
  } catch {
    return '';
  }
}
// Imagen copiada (por ejemplo "Copiar imagen" en el navegador) como PNG, o null
async function clipboardImagePng() {
  try {
    const items = await clipboard.read();
    for (const it of items || []) {
      const type = (it.types || []).find((t) => /^image\//i.test(t));
      if (!type) continue;
      const blob = await it.getType(type);
      const buf = Buffer.from(await blob.arrayBuffer());
      const img = nativeImage.createFromBuffer(buf);
      if (!img.isEmpty()) return img.toPNG();
      if (/png/i.test(type)) return buf;
    }
  } catch {}
  return null;
}

// ---------- Cambiar imágenes y descripción de un juego desde la app (clic derecho) ----------
// Las imágenes se guardan en personalizar/<Nombre del juego>/ con el nombre que corresponde (canal.png, burbuja.png…)
const EDITABLE = ['tile', 'hero', 'logo', 'video', 'model', 'cover', 'bubble', 'square', 'icon0', 'music', 'thumb'];
function gameById(id) {
  return nh.config.games.find((g) => g.id === id) || null;
}
function customDirs(g) {
  return [path.join(nh.customDir, nh.folderName(g)), path.join(nh.customDir, media.safeId(g.id))];
}
// Borra los archivos propios de ese tipo (cualquier extensión) en las carpetas del juego
function removeCustom(g, kind) {
  const spec = media.CUSTOM_FILES[kind];
  for (const dir of customDirs(g)) {
    let files = [];
    try {
      files = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const f of files) {
      if (path.basename(f, path.extname(f)).toLowerCase() === spec.base && spec.ext.includes(path.extname(f).toLowerCase())) {
        try {
          fs.rmSync(path.join(dir, f), { force: true });
        } catch {}
      }
    }
  }
}
function customInfo(id) {
  const g = gameById(id);
  if (!g) return null;
  const c = nh.customFilesFor(g);
  const m = g.media || {};
  const auto = { tile: m.tile, hero: m.hero, logo: m.logo, cover: m.cover, bubble: m.cover, icon0: m.header };
  const slots = {};
  for (const kind of EDITABLE) {
    const file = c[kind] || null;
    slots[kind] = {
      custom: nh.fileUrl(file),
      customName: file ? path.basename(file) : null,
      auto: nh.fileUrl(auto[kind]),
      isVideo: !!file && media.isVideoFile(file),
    };
  }
  return {
    id: g.id,
    name: g.name,
    type: g.type,
    slots,
    description: { custom: c.description ? nh.readDescription(c.description) : '', steam: m.description || '' },
  };
}
function saveCustomFile(g, kind, src) {
  const spec = media.CUSTOM_FILES[kind];
  const ext = path.extname(src).toLowerCase();
  if (!spec || !spec.ext.includes(ext)) return { ok: false, message: `Ese tipo de archivo no sirve aquí. Usa: ${spec.ext.join(', ')}` };
  const dir = customDirs(g)[0];
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, spec.base + ext);
  const tmp = dest + '.tmp';
  fs.copyFileSync(src, tmp); // primero se copia (src podría ser el mismo archivo que se borra)
  removeCustom(g, kind);
  fs.renameSync(tmp, dest);
  return { ok: true };
}
function afterCustomChange(id) {
  nh.pushGamesSoon();
  return { ok: true, info: customInfo(id) };
}
// Recortar antes de guardar: las imágenes fijas pasan por la pantalla de recorte (renderer/game-editor.js). Lo demás
// (video, modelo, música, animaciones) se guarda tal cual: recortar una animación dejaría solo un cuadro.
const CROPPABLE = ['tile', 'hero', 'logo', 'cover', 'square', 'icon0', 'bubble', 'thumb'];
const CROP_MAX_BYTES = 40 * 1024 * 1024;
let CROP_DIR = null; // cache\recorte (se sabe al registrar)
function isStillImage(file) {
  const ext = path.extname(file).toLowerCase();
  if (['.jpg', '.jpeg', '.png'].includes(ext)) return true;
  if (ext !== '.webp') return false;
  try {
    const fd = fs.openSync(file, 'r');
    const head = Buffer.alloc(21);
    fs.readSync(fd, head, 0, 21, 0);
    fs.closeSync(fd);
    return !(head.toString('latin1', 12, 16) === 'VP8X' && head[20] & 2); // bit de "animada"
  } catch {
    return false;
  }
}
function clearCropDir(except) {
  try {
    for (const n of fs.readdirSync(CROP_DIR)) {
      const f = path.join(CROP_DIR, n);
      if (f !== except) fs.rmSync(f, { force: true });
    }
  } catch {}
}
// Lo pasa a la pantalla de recorte si se puede; si no, lo guarda al tiro
function offerOrSave(g, id, kind, file) {
  const ext = path.extname(file).toLowerCase();
  let size = Infinity;
  try {
    size = fs.statSync(file).size;
  } catch {}
  if (CROPPABLE.includes(kind) && media.CUSTOM_FILES[kind].ext.includes(ext) && size <= CROP_MAX_BYTES && isStillImage(file)) {
    clearCropDir(file);
    const mime = { '.png': 'image/png', '.webp': 'image/webp' }[ext] || 'image/jpeg';
    return { ok: true, crop: { preview: `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`, source: file, ext } };
  }
  const res = saveCustomFile(g, kind, file);
  if (path.dirname(file) === CROP_DIR) clearCropDir();
  return res.ok ? afterCustomChange(id) : res;
}
async function downloadForCrop(url) {
  fs.mkdirSync(CROP_DIR, { recursive: true });
  return media.downloadImage(url, path.join(CROP_DIR, `img-${Date.now()}`));
}
ipcMain.handle('game:custom-crop', (_e, id, kind, bytes, extArg) => {
  const g = gameById(id);
  const ext = String(extArg);
  const buf = Buffer.from(bytes || []);
  if (!g || !CROPPABLE.includes(kind) || !media.CUSTOM_FILES[kind].ext.includes(ext)) return { ok: false, message: 'No se pudo guardar el recorte.' };
  const isPng = ext === '.png' && buf.toString('latin1', 1, 4) === 'PNG';
  const isJpg = ext === '.jpg' && buf[0] === 0xff && buf[1] === 0xd8;
  if ((!isPng && !isJpg) || buf.length > CROP_MAX_BYTES) return { ok: false, message: 'No se pudo guardar el recorte.' };
  fs.mkdirSync(CROP_DIR, { recursive: true });
  const tmp = path.join(CROP_DIR, `recorte${ext}`);
  fs.writeFileSync(tmp, buf);
  const res = saveCustomFile(g, kind, tmp);
  clearCropDir();
  return res.ok ? afterCustomChange(id) : res;
});
ipcMain.handle('game:custom-get', (_e, id) => customInfo(id));
ipcMain.handle('game:custom-pick', async (_e, id, kind) => {
  const g = gameById(id);
  const spec = media.CUSTOM_FILES[kind];
  if (!g || !spec) return { ok: false, message: 'No se encontró el juego.' };
  const names = { tile: 'Imagen o video', video: 'Video', model: 'Modelo 3D', music: 'Música' };
  const r = await dialog.showOpenDialog(nh.ventana(), {
    title: `Elegir archivo para ${g.name}`,
    properties: ['openFile'],
    filters: [{ name: names[kind] || 'Imagen', extensions: spec.ext.map((e) => e.slice(1)) }],
  });
  if (r.canceled || !r.filePaths[0]) return { ok: false, canceled: true };
  return offerOrSave(g, id, kind, r.filePaths[0]);
});
// Archivo arrastrado (ruta) o imagen arrastrada desde el navegador (dirección web)
ipcMain.handle('game:custom-from', async (_e, id, kind, from) => {
  const g = gameById(id);
  if (!g || !media.CUSTOM_FILES[kind]) return { ok: false, message: 'No se encontró el juego.' };
  if (from && from.path && fs.existsSync(from.path)) {
    if (!from.whole) return offerOrSave(g, id, kind, from.path);
    const res = saveCustomFile(g, kind, from.path); // "Usar completa"
    clearCropDir();
    return res.ok ? afterCustomChange(id) : res;
  }
  if (from && /^https?:\/\//i.test(from.url || '')) {
    const file = await downloadForCrop(from.url);
    if (!file) return { ok: false, message: 'No se pudo descargar esa imagen. Prueba guardándola en tu PC y eligiéndola.' };
    return offerOrSave(g, id, kind, file);
  }
  return { ok: false, message: 'Eso no es un archivo que se pueda usar.' };
});
// Imagen copiada (por ejemplo "Copiar imagen" en el navegador), o una ruta / dirección copiada
ipcMain.handle('game:custom-paste', async (_e, id, kind) => {
  const g = gameById(id);
  const spec = media.CUSTOM_FILES[kind];
  if (!g || !spec) return { ok: false, message: 'No se encontró el juego.' };
  const png = spec.ext.includes('.png') ? await clipboardImagePng() : null;
  if (png) {
    fs.mkdirSync(CROP_DIR, { recursive: true });
    const tmp = path.join(CROP_DIR, `pegada-${Date.now()}.png`);
    fs.writeFileSync(tmp, png);
    return offerOrSave(g, id, kind, tmp);
  }
  const text = (await clipboardText()).replace(/^"(.*)"$/, '$1');
  if (text && fs.existsSync(text)) return offerOrSave(g, id, kind, text);
  if (/^https?:\/\//i.test(text)) {
    const file = await downloadForCrop(text);
    if (file) return offerOrSave(g, id, kind, file);
  }
  return { ok: false, message: 'No hay una imagen copiada. En el navegador: clic derecho en la imagen → "Copiar imagen".' };
});
ipcMain.handle('game:custom-clear', (_e, id, kind) => {
  const g = gameById(id);
  if (!g || !media.CUSTOM_FILES[kind]) return { ok: false };
  removeCustom(g, kind);
  return afterCustomChange(id);
});
ipcMain.handle('game:description-set', (_e, id, text) => {
  const g = gameById(id);
  if (!g) return { ok: false };
  removeCustom(g, 'description');
  const t = String(text || '').trim().slice(0, 800);
  if (t) {
    const dir = customDirs(g)[0];
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'descripcion.txt'), t, 'utf8');
  }
  return afterCustomChange(id);
});
ipcMain.handle('game:open-folder', (_e, id) => {
  const g = gameById(id);
  if (!g) return;
  const dir = customDirs(g)[0];
  fs.mkdirSync(dir, { recursive: true });
  return shell.openPath(dir);
});

// nh: { config, dataDir, customDir, ventana(), folderName, customFilesFor, readDescription, fileUrl, pushGamesSoon }
function registrar(contexto) {
  nh = contexto;
  CROP_DIR = path.join(nh.dataDir, 'cache', 'recorte');
}

module.exports = { registrar, clipboardText };
