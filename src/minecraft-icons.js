// Íconos de los progresos de Minecraft, sacados del mismo juego que tienes instalado
// (.minecraft\versions\<versión>\<versión>.jar, que es un .zip):
//   data/minecraft/advancement/**.json   qué objeto usa cada progreso de ícono ("minecraft:stone_pickaxe")
//   assets/minecraft/lang/en_us.json     el nombre en inglés de cada progreso ("Stone Age"), como sale en el chat
//   assets/minecraft/textures/item|block/<objeto>.png   el dibujo de 16×16
// El ícono se agranda sin suavizar (pixel art) sobre un cuadro oscuro y se guarda en cache\minecraft\<versión>\.
// Los progresos de mods no están en el juego base: esos salen con la copa de siempre.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 128; // tamaño del ícono
const SCALE = 6; // 16 px × 6 = 96 px, con borde alrededor
const BG = [0x2b, 0x2b, 0x2b]; // gris oscuro, como los cuadros del inventario

// Lee el índice de un .zip (sin descomprimir todo): nombre → dónde está
function zipIndex(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 70000); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('no es un zip');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const map = new Map();
  for (let n = 0; n < count && buf.readUInt32LE(p) === 0x02014b50; n++) {
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extra = buf.readUInt16LE(p + 30);
    const comment = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    map.set(buf.toString('utf8', p + 46, p + 46 + nameLen), { method, size, local });
    p += 46 + nameLen + extra + comment;
  }
  return map;
}

function zipRead(buf, entry) {
  if (!entry) return null;
  const p = entry.local;
  const start = p + 30 + buf.readUInt16LE(p + 26) + buf.readUInt16LE(p + 28);
  const data = buf.subarray(start, start + entry.size);
  return entry.method === 8 ? zlib.inflateRawSync(data) : Buffer.from(data);
}

// Dibujo de 16×16 → ícono de 128×128 en BGRA (como lo usa nativeImage)
function upscale(png, nativeImage) {
  const img = nativeImage.createFromBuffer(png);
  const { width: w } = img.getSize();
  if (!w) return null;
  const src = img.toBitmap(); // si es animado (tira vertical), se usa el primer cuadro
  const out = Buffer.alloc(SIZE * SIZE * 4);
  for (let i = 0; i < SIZE * SIZE; i++) out.set([BG[2], BG[1], BG[0], 255], i * 4);
  const k = Math.max(1, Math.floor((SCALE * 16) / w));
  const off = Math.floor((SIZE - w * k) / 2);
  for (let y = 0; y < w; y++) {
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4;
      const a = src[s + 3] / 255;
      if (!a) continue;
      for (let dy = 0; dy < k; dy++) {
        for (let dx = 0; dx < k; dx++) {
          const d = ((off + y * k + dy) * SIZE + off + x * k + dx) * 4;
          for (let c = 0; c < 3; c++) out[d + c] = Math.round(src[s + c] * a + out[d + c] * (1 - a));
        }
      }
    }
  }
  return nativeImage.createFromBitmap(out, { width: SIZE, height: SIZE }).toPNG();
}

class MinecraftIcons {
  constructor({ gameDir, cacheDir, log = () => {} }) {
    this.gameDir = gameDir;
    this.cacheDir = cacheDir;
    this.log = log;
    this.indexes = new Map(); // versión → Promise<{ título: objeto }>
  }

  // El .jar del juego: el de la versión que dice el log, o el más nuevo que haya
  jarFor(version) {
    const dir = path.join(this.gameDir, 'versions');
    if (version) {
      const jar = path.join(dir, version, `${version}.jar`);
      if (fs.existsSync(jar)) return { version, jar };
    }
    let best = null;
    try {
      for (const v of fs.readdirSync(dir)) {
        const jar = path.join(dir, v, `${v}.jar`);
        try {
          const t = fs.statSync(jar).mtimeMs;
          if (!best || t > best.t) best = { version: v, jar, t };
        } catch {}
      }
    } catch {}
    return best;
  }

  // { "Stone Age": "stone_pickaxe", … } de esa versión (se guarda para no leer el .jar cada vez)
  index(version) {
    const found = this.jarFor(version);
    if (!found) return Promise.resolve(null);
    if (!this.indexes.has(found.version)) {
      this.indexes.set(found.version, this.build(found).catch((e) => (this.log('Minecraft: no se pudieron leer los íconos:', e.message), null)));
    }
    return this.indexes.get(found.version);
  }

  async build({ version, jar }) {
    const dir = path.join(this.cacheDir, version);
    const file = path.join(dir, 'progresos.json');
    try {
      return { dir, jar, map: JSON.parse(fs.readFileSync(file, 'utf8')) };
    } catch {}
    const buf = await fs.promises.readFile(jar);
    const zip = zipIndex(buf);
    const lang = JSON.parse(zipRead(buf, zip.get('assets/minecraft/lang/en_us.json')) || '{}');
    const map = {};
    for (const [name, entry] of zip) {
      if (!/^data\/minecraft\/advancements?\/.+\.json$/.test(name)) continue;
      try {
        const d = JSON.parse(zipRead(buf, entry)).display;
        const t = d && d.title && (d.title.translate ? lang[d.title.translate] : d.title.text || d.title);
        const icon = d && d.icon && (d.icon.id || d.icon.item);
        if (typeof t === 'string' && icon) map[t] = String(icon).replace(/^minecraft:/, '');
      } catch {}
    }
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(map));
    return { dir, jar, map };
  }

  // Ruta del ícono del progreso (o null). version: la que salió en el log, si se sabe
  async iconFor(title, version) {
    const idx = await this.index(version);
    const item = idx && idx.map[title];
    if (!item) return null;
    const out = path.join(idx.dir, `${item}.png`);
    if (fs.existsSync(out)) return out;
    try {
      const { nativeImage } = require('electron');
      const buf = await fs.promises.readFile(idx.jar);
      const zip = zipIndex(buf);
      const T = 'assets/minecraft/textures/';
      const names = [`item/${item}`, `block/${item}`, `block/${item}_front`, `block/${item}_side`, `block/${item}_top`];
      const entry = names.map((n) => zip.get(`${T}${n}.png`)).find(Boolean);
      const png = entry && upscale(zipRead(buf, entry), nativeImage);
      if (!png) return null;
      fs.writeFileSync(out, png);
      return out;
    } catch (e) {
      this.log('Minecraft: no se pudo armar el ícono', item, e.message);
      return null;
    }
  }
}

module.exports = { MinecraftIcons };
