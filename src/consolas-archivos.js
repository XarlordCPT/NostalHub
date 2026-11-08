// Archivos de cada consola del selector (%APPDATA%\NostalHub\consolas\<id>\): ícono, logo, fondo, modelo 3D,
// música, sonidos y video de inicio (CONSOLE_FILES), los fondos propios de la PS3, la PS4 y la 3DS (fondos\) y cómo
// se para el modelo 3D. El ícono y el logo se recortan solos (trimImage) para que todos se vean del mismo tamaño.
// main.js lo conecta con registrar(nh).

const fs = require('fs');
const path = require('path');
const { ipcMain, nativeImage } = require('electron');
const media = require('./media');
const { anotar } = require('./registro');

let nh = null;

const CONSOLE_FILES = {
  icon: { base: 'icono', ext: ['.png', '.webp', '.gif', '.jpg', '.jpeg', '.svg'] },
  background: { base: 'fondo', ext: ['.jpg', '.jpeg', '.png', '.webp', '.gif'] },
  logo: { base: 'logo', ext: ['.png', '.webp', '.svg', '.gif'] },
  model: { base: 'modelo', ext: ['.glb', '.gltf'] },
  // Sonido: música de fondo, efectos y video de inicio
  music: { base: 'musica', ext: ['.mp3', '.ogg', '.m4a', '.wav', '.opus', '.webm', '.flac'] },
  move: { base: 'mover', ext: ['.wav', '.mp3', '.ogg', '.m4a'] },
  select: { base: 'elegir', ext: ['.wav', '.mp3', '.ogg', '.m4a'] },
  back: { base: 'volver', ext: ['.wav', '.mp3', '.ogg', '.m4a'] },
  page: { base: 'pagina', ext: ['.wav', '.mp3', '.ogg', '.m4a'] },
  start: { base: 'inicio', ext: ['.wav', '.mp3', '.ogg', '.m4a'] },
  gameboot: { base: 'gameboot', ext: ['.wav', '.mp3', '.ogg', '.m4a'] },
  achievement: { base: 'logro', ext: ['.wav', '.mp3', '.ogg', '.m4a'] },
  option: { base: 'opciones', ext: ['.wav', '.mp3', '.ogg', '.m4a'] },
  error: { base: 'error', ext: ['.wav', '.mp3', '.ogg', '.m4a'] },
  border: { base: 'borde', ext: ['.wav', '.mp3', '.ogg', '.m4a'] },
  // Switch: un sonido para cada botón redondo
  'b-party': { base: 'boton-grupo', ext: ['.wav', '.mp3', '.ogg', '.m4a'] },
  'b-music': { base: 'boton-musica', ext: ['.wav', '.mp3', '.ogg', '.m4a'] },
  'b-store': { base: 'boton-tienda', ext: ['.wav', '.mp3', '.ogg', '.m4a'] },
  'b-trophies': { base: 'boton-logros', ext: ['.wav', '.mp3', '.ogg', '.m4a'] },
  'b-library': { base: 'boton-software', ext: ['.wav', '.mp3', '.ogg', '.m4a'] },
  'b-friends': { base: 'boton-amigos', ext: ['.wav', '.mp3', '.ogg', '.m4a'] },
  'b-settings': { base: 'boton-ajustes', ext: ['.wav', '.mp3', '.ogg', '.m4a'] },
  'b-power': { base: 'boton-energia', ext: ['.wav', '.mp3', '.ogg', '.m4a'] },
  intro: { base: 'intro', ext: ['.mp4', '.webm', '.mov', '.m4v'] },
};

// Copia de la imagen sin los bordes vacíos (transparentes o del mismo color del fondo), guardada en cache.
// Devuelve la ruta de la copia, o null si no se pudo (gif, svg, webp: se usan tal cual).
function trimImage(src, key) {
  try {
    if (!['.png', '.jpg', '.jpeg'].includes(path.extname(src).toLowerCase())) return null;
    const st = fs.statSync(src);
    const dir = path.join(nh.dataDir, 'cache', 'consolas');
    const name = `${key}-${Math.round(st.mtimeMs)}-${st.size}.png`;
    const out = path.join(dir, name);
    if (fs.existsSync(out)) return out;
    const img = nativeImage.createFromPath(src);
    if (img.isEmpty()) return null;
    const { width: w, height: h } = img.getSize();
    const px = img.toBitmap(); // BGRA, 4 bytes por punto
    if (px.length < w * h * 4) return null;
    const at = (x, y) => (y * w + x) * 4;
    // ¿Tiene transparencia? Si no, el "vacío" es el color de la esquina
    const c0 = at(0, 0);
    const opaque = px[c0 + 3] > 250 && px[at(w - 1, h - 1) + 3] > 250;
    const empty = opaque
      ? (i) => Math.abs(px[i] - px[c0]) < 26 && Math.abs(px[i + 1] - px[c0 + 1]) < 26 && Math.abs(px[i + 2] - px[c0 + 2]) < 26
      : (i) => px[i + 3] < 14;
    let x0 = w;
    let y0 = h;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (empty(at(x, y))) continue;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    if (x1 < 0) return null; // todo vacío
    const m = 2;
    const rect = { x: Math.max(0, x0 - m), y: Math.max(0, y0 - m) };
    rect.width = Math.min(w, x1 + m + 1) - rect.x;
    rect.height = Math.min(h, y1 + m + 1) - rect.y;
    fs.mkdirSync(dir, { recursive: true });
    // borra las copias viejas de esta misma imagen
    for (const old of fs.readdirSync(dir)) if (old.startsWith(`${key}-`) && old !== name) fs.rmSync(path.join(dir, old), { force: true });
    fs.writeFileSync(out, img.crop(rect).toPNG());
    return out;
  } catch {
    return null;
  }
}

function consoleAssets(ids) {
  fs.mkdirSync(nh.consolesDir, { recursive: true });
  const out = {};
  for (const id of ids || []) {
    const safe = media.safeId(id);
    const dir = path.join(nh.consolesDir, safe);
    fs.mkdirSync(dir, { recursive: true });
    let files = [];
    try {
      files = fs.readdirSync(dir);
    } catch {}
    const found = {};
    for (const [kind, spec] of Object.entries(CONSOLE_FILES)) {
      const f = files.find((n) => {
        const ext = path.extname(n).toLowerCase();
        return path.basename(n, path.extname(n)).toLowerCase() === spec.base && spec.ext.includes(ext);
      });
      if (!f) continue;
      const file = path.join(dir, f);
      // El ícono y el logo se recortan solos (sin bordes vacíos) para que todos se vean del mismo tamaño
      found[kind] = nh.fileUrl((kind === 'icon' || kind === 'logo') && trimImage(file, `${safe}-${kind}`)) || nh.fileUrl(file);
    }
    out[id] = found;
  }
  // El LEEME se reescribe si cambió (es un archivo de la app, no tuyo)
  const readme = path.join(nh.consolesDir, 'LEEME.txt');
  const text = [
    'Una carpeta por consola del selector. Deja aquí:',
    '',
    '  icono.png   -> imagen de la consola a la derecha (ideal PNG con fondo transparente, cuadrada)',
    '  fondo.jpg   -> fondo propio del selector cuando esa consola está marcada (opcional)',
    '  logo.png    -> logo con las letras de la consola, en vez del nombre escrito (opcional)',
    '  modelo.glb  -> modelo 3D de la consola: gira en el selector en vez de icono.png (opcional)',
    '  musica.mp3  -> música de fondo del menú de esa consola (se repite)',
    '  mover.wav   -> sonido al pasar el mouse o moverse con las flechas',
    '  elegir.wav  -> sonido al elegir (clic / Enter)',
    '  volver.wav  -> sonido al volver (Esc)',
    '  intro.mp4   -> video que se reproduce al entrar a esa consola (Enter, Esc o clic para saltarlo)',
    '  inicio.wav  -> sonido al terminar de entrar a la consola (después del video, si hay)',
    '  pagina.wav  -> (Wii y PS Vita) sonido al pasar de página o de tarjeta',
    '  gameboot.wav -> (PS3) sonido al abrir un juego',
    '  opciones.wav -> (PS3) sonido al abrir el menú de opciones (tecla O)',
    '  error.wav    -> sonido cuando algo no se pudo hacer (PS3 y Switch)',
    '  borde.wav    -> (Switch) al llegar al final de la fila',
    '  boton-grupo.wav, boton-musica.wav, boton-tienda.wav, boton-logros.wav, boton-software.wav,',
    '  boton-amigos.wav, boton-ajustes.wav, boton-energia.wav -> (Switch) al abrir cada botón redondo',
    '  fondos\\    -> (PS3, PS4 y 3DS) carpeta con tus imágenes para elegirlas de fondo dentro de la consola',
    '',
    'Se aplica solo al guardar el archivo. Más detalles en MANUAL.md, en la carpeta del proyecto.',
    '',
  ].join('\r\n');
  try {
    if (!fs.existsSync(readme) || fs.readFileSync(readme, 'utf8') !== text) fs.writeFileSync(readme, text, 'utf8');
  } catch (e) {
    anotar('consolas', `no se pudo escribir el LEEME: ${e.message}`);
  }
  return out;
}

// ---------- Canales (preload.js) ----------
ipcMain.handle('consoles:get', (_e, ids) => ({ assets: consoleAssets(ids), last: nh.config.data.lastConsole || null, modelTilt: nh.config.data.modelTilt || {} }));
// Fondos propios para elegir en la consola (PS3, PS4 y 3DS): las imágenes de consolas\<id>\fondos\
function consoleBackgroundsDir(id) {
  const dir = path.join(nh.consolesDir, media.safeId(String(id || '')), 'fondos');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
ipcMain.handle('consoles:backgrounds', (_e, id) => {
  if (!/^[a-z0-9]{2,12}$/.test(String(id || ''))) return [];
  try {
    const dir = consoleBackgroundsDir(id);
    return fs
      .readdirSync(dir)
      .filter((n) => /\.(jpe?g|png|webp|gif|bmp)$/i.test(n))
      .sort((a, b) => a.localeCompare(b, 'es'))
      .map((n) => ({ file: n, name: path.basename(n, path.extname(n)), url: nh.fileUrl(path.join(dir, n)) }));
  } catch {
    return [];
  }
});
// Cómo se para el modelo 3D de cada consola en el selector (clic derecho sobre el modelo)
ipcMain.handle('consoles:model-tilt', (_e, id, tilt) => {
  nh.config.data.modelTilt = { ...(nh.config.data.modelTilt || {}), [String(id)]: String(tilt) };
  nh.config.save();
  return nh.config.data.modelTilt;
});

// nh: { config, dataDir, consolesDir, fileUrl }
function registrar(contexto) {
  nh = contexto;
}

module.exports = { registrar, consoleAssets, consoleBackgroundsDir, CONSOLE_FILES };
