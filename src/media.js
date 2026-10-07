// Consigue el arte de cada juego:
//  1. Lo que Steam ya tiene en caché en tu PC (rápido, sin internet).
//  2. Lo que falte, desde la tienda/CDN de Steam.
//  3. Lo que pongas tú en la carpeta "personalizar" gana siempre.

const fs = require('fs');
const path = require('path');
const steam = require('./steam');

const CDN_BASES = [
  'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps',
  'https://cdn.akamai.steamstatic.com/steam/apps',
];
const RETRY_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // reintenta lo que falte cada 7 días

const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const VIDEO_EXT = ['.mp4', '.webm', '.m4v', '.mov'];

// Nombres de archivo que puedes dejar en personalizar/<id-del-juego>/
const CUSTOM_FILES = {
  video: { base: 'video', ext: [...VIDEO_EXT, '.gif'] }, // animación de la pantalla de canal
  hero: { base: 'fondo', ext: IMAGE_EXT },               // fondo de la pantalla de canal
  logo: { base: 'logo', ext: ['.png', '.webp', '.gif'] }, // título
  tile: { base: 'canal', ext: [...IMAGE_EXT, ...VIDEO_EXT] }, // imagen del cuadrito en el menú
  model: { base: 'modelo', ext: ['.glb', '.gltf'] },        // modelo 3D (tema PS2)
  description: { base: 'descripcion', ext: ['.txt'] },      // descripción propia del juego
  cover: { base: 'caratula', ext: IMAGE_EXT },              // carátula vertical (tema Xbox 360)
  bubble: { base: 'burbuja', ext: IMAGE_EXT },              // imagen de la burbuja redonda (tema PS Vita)
};

function safeId(id) {
  return String(id).replace(/[^a-z0-9_-]/gi, '_');
}

async function fetchWithTimeout(url, ms = 15000) {
  return fetch(url, { signal: AbortSignal.timeout(ms), headers: { 'User-Agent': 'Mozilla/5.0 NostalHub' } });
}

async function downloadImage(url, destNoExt) {
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || '';
    if (!type.startsWith('image/')) return null;
    const ext = type.includes('png') ? '.png' : type.includes('webp') ? '.webp' : '.jpg';
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1024) return null; // placeholders vacíos
    const dest = destNoExt + ext;
    fs.writeFileSync(dest, buf);
    return dest;
  } catch {
    return null;
  }
}

async function getAppDetails(appId) {
  try {
    const res = await fetchWithTimeout(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=spanish`);
    if (!res.ok) return null;
    const json = await res.json();
    const entry = json && json[appId];
    return entry && entry.success ? entry.data : null;
  } catch {
    return null;
  }
}

// Texto de Steam viene con entidades HTML (&quot; etc.) y a veces etiquetas
function cleanText(html) {
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&([aeiouAEIOU])(acute|grave|uml|circ);/g, (_, v, k) => v.normalize('NFD') + { acute: '\u0301', grave: '\u0300', uml: '\u0308', circ: '\u0302' }[k])
    .replace(/&([nN])tilde;/g, (_, n) => n + '\u0303')
    .replace(/&(iexcl|iquest|laquo|raquo|hellip|mdash|ndash|trade|reg|copy);/g, (_, k) => ({ iexcl: '¡', iquest: '¿', laquo: '«', raquo: '»', hellip: '…', mdash: '—', ndash: '–', trade: '™', reg: '®', copy: '©' })[k])
    .replace(/&amp;/g, '&')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
}

function copyLocal(src, destNoExt) {
  try {
    const dest = destNoExt + path.extname(src).toLowerCase();
    fs.copyFileSync(src, dest);
    return dest;
  } catch {
    return null;
  }
}

function fileOk(p) {
  return !!p && fs.existsSync(p);
}

// Rellena game.media para un juego de Steam. Devuelve true si cambió algo.
async function ensureSteamMedia(game, mediaRoot, { force = false } = {}) {
  if (game.type !== 'steam' || !game.appId) return false;
  const m = game.media || (game.media = {});
  const missing = () => ['tile', 'hero', 'logo'].filter((k) => !fileOk(m[k]));
  const needsTrailer = !m.trailer;
  const needsDescription = m.description === undefined;
  const needsCover = !fileOk(m.cover) && !m.coverTried; // carátula vertical (tema Xbox 360)

  if (!force && missing().length === 0 && !needsTrailer && !needsDescription && !needsCover) return false;
  if (
    !force &&
    !needsDescription &&
    !needsCover &&
    game.mediaCheckedAt &&
    Date.now() - game.mediaCheckedAt < RETRY_AFTER_MS &&
    missing().length < 3
  ) {
    return false;
  }

  const dir = path.join(mediaRoot, safeId(game.id));
  fs.mkdirSync(dir, { recursive: true });
  const before = JSON.stringify(m);

  // 1. Caché local de Steam
  const local = await steam.findLocalArt(game.appId);
  if (!fileOk(m.tile) && (local.header || local.capsule)) m.tile = copyLocal(local.header || local.capsule, path.join(dir, 'tile'));
  if (!fileOk(m.hero) && local.hero) m.hero = copyLocal(local.hero, path.join(dir, 'hero'));
  if (!fileOk(m.logo) && local.logo) m.logo = copyLocal(local.logo, path.join(dir, 'logo'));
  if (!fileOk(m.cover) && local.capsule) m.cover = copyLocal(local.capsule, path.join(dir, 'cover'));

  // 2. Tienda de Steam (también trae el tráiler)
  let details = null;
  if (missing().length || needsTrailer || needsDescription || force) details = await getAppDetails(game.appId);

  if (details) {
    m.description = cleanText(details.short_description || '');
    if (!fileOk(m.tile) && details.header_image) m.tile = await downloadImage(details.header_image, path.join(dir, 'tile'));
    const movie = (details.movies || []).find((mv) => mv.highlight) || (details.movies || [])[0];
    if (movie) {
      m.trailer = movie.hls_h264 || null;
      m.trailerMp4 = (movie.mp4 && (movie.mp4['480'] || movie.mp4.max)) || (movie.webm && (movie.webm['480'] || movie.webm.max)) || null;
    }
  }

  // 3. URLs conocidas del CDN
  for (const base of CDN_BASES) {
    if (!fileOk(m.hero)) m.hero = await downloadImage(`${base}/${game.appId}/library_hero.jpg`, path.join(dir, 'hero'));
    if (!fileOk(m.logo)) m.logo = await downloadImage(`${base}/${game.appId}/logo.png`, path.join(dir, 'logo'));
    if (!fileOk(m.tile)) m.tile = await downloadImage(`${base}/${game.appId}/header.jpg`, path.join(dir, 'tile'));
    if (!fileOk(m.cover)) m.cover = await downloadImage(`${base}/${game.appId}/library_600x900_2x.jpg`, path.join(dir, 'cover'));
    if (!fileOk(m.cover)) m.cover = await downloadImage(`${base}/${game.appId}/library_600x900.jpg`, path.join(dir, 'cover'));
  }
  m.coverTried = true;

  // 4. Si no hay "hero", usa una captura del juego o el fondo de la tienda
  if (!fileOk(m.hero) && details) {
    const shot = details.screenshots && details.screenshots[0] && details.screenshots[0].path_full;
    if (shot) m.hero = await downloadImage(shot, path.join(dir, 'hero'));
    if (!fileOk(m.hero) && details.background_raw) m.hero = await downloadImage(details.background_raw, path.join(dir, 'hero'));
  }

  for (const k of ['tile', 'hero', 'logo', 'cover']) if (!fileOk(m[k])) delete m[k];
  game.mediaCheckedAt = Date.now();
  return JSON.stringify(m) !== before;
}

// Archivos que el usuario dejó en una carpeta de personalizar/ (tienen prioridad).
function findCustomFiles(dir) {
  const found = {};
  let files = [];
  try {
    files = fs.readdirSync(dir);
  } catch {
    return found;
  }
  for (const [kind, spec] of Object.entries(CUSTOM_FILES)) {
    const f = files.find((name) => {
      const ext = path.extname(name).toLowerCase();
      return path.basename(name, path.extname(name)).toLowerCase() === spec.base && spec.ext.includes(ext);
    });
    if (f) found[kind] = path.join(dir, f);
  }
  return found;
}

function isVideoFile(p) {
  return !!p && VIDEO_EXT.includes(path.extname(p).toLowerCase());
}

module.exports = { ensureSteamMedia, findCustomFiles, safeId, isVideoFile, downloadImage, CUSTOM_FILES };
