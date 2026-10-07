// Todo lo relacionado con Steam: encontrar la instalación, leer la
// biblioteca local, buscar arte en caché y saber qué juego está corriendo.

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { parseVdf } = require('./vdf');

// Herramientas que Steam instala como "apps" pero que no son juegos.
const NOT_GAMES_IDS = new Set([
  '228980',  // Steamworks Common Redistributables
  '250820',  // SteamVR
  '1070560', // Steam Linux Runtime
  '1391110', // Steam Linux Runtime - Soldier
  '1628350', // Steam Linux Runtime - Sniper
  '1493710', // Proton Experimental
  '1826330', // Proton EasyAntiCheat Runtime
  '1161040', // Proton BattlEye Runtime
  '431960',  // Wallpaper Engine
  '1905180', // OBS Studio
]);
const NOT_GAMES_NAMES = /^(proton\b|steamworks|steam linux runtime|steamvr|.*redistributable|.*dedicated server|.*\bsdk\b)/i;

function regQuery(key, value) {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') return resolve(null);
    execFile('reg', ['query', key, '/v', value], { windowsHide: true }, (err, stdout) => {
      if (err) return resolve(null);
      // Línea tipo:     SteamPath    REG_SZ    c:/program files (x86)/steam
      const line = stdout.split(/\r?\n/).find((l) => l.trim().startsWith(value));
      if (!line) return resolve(null);
      const parts = line.trim().split(/\s{2,}|\t+/);
      resolve(parts.length >= 3 ? parts.slice(2).join(' ').trim() : null);
    });
  });
}

let cachedSteamPath;
async function findSteamPath() {
  if (cachedSteamPath !== undefined) return cachedSteamPath;
  const candidates = [
    await regQuery('HKCU\\Software\\Valve\\Steam', 'SteamPath'),
    await regQuery('HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam', 'InstallPath'),
    await regQuery('HKLM\\SOFTWARE\\Valve\\Steam', 'InstallPath'),
    'C:\\Program Files (x86)\\Steam',
    'C:\\Program Files\\Steam',
    path.join(process.env.HOME || '', '.steam', 'steam'), // por si algún día corre en Linux
  ].filter(Boolean);

  for (const c of candidates) {
    const p = path.normalize(c);
    if (fs.existsSync(path.join(p, 'steamapps'))) {
      cachedSteamPath = p;
      return p;
    }
  }
  cachedSteamPath = null;
  return null;
}

function readVdfFile(file) {
  try {
    return parseVdf(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function getLibraryFolders(steamPath) {
  const folders = new Set([path.normalize(steamPath)]);
  const vdf = readVdfFile(path.join(steamPath, 'steamapps', 'libraryfolders.vdf'));
  const root = vdf && (vdf.libraryfolders || vdf.LibraryFolders);
  if (root) {
    for (const entry of Object.values(root)) {
      // Formato nuevo: { "path": "D:\\SteamLibrary", "apps": {...} }
      // Formato viejo: "1" "D:\\SteamLibrary"
      const p = typeof entry === 'string' ? entry : entry && entry.path;
      if (p && fs.existsSync(path.join(p, 'steamapps'))) folders.add(path.normalize(p));
    }
  }
  return [...folders];
}

function isGame(appId, name) {
  return !NOT_GAMES_IDS.has(String(appId)) && !NOT_GAMES_NAMES.test(name || '');
}

// Devuelve [{ appId, name, installDir, library }] de los juegos instalados.
async function listInstalledGames() {
  const steamPath = await findSteamPath();
  if (!steamPath) return [];
  const games = new Map();
  for (const lib of getLibraryFolders(steamPath)) {
    const appsDir = path.join(lib, 'steamapps');
    let files = [];
    try {
      files = fs.readdirSync(appsDir).filter((f) => /^appmanifest_\d+\.acf$/i.test(f));
    } catch {
      continue;
    }
    for (const f of files) {
      const acf = readVdfFile(path.join(appsDir, f));
      const st = acf && (acf.AppState || acf.appstate);
      if (!st || !st.appid) continue;
      if (!isGame(st.appid, st.name)) continue;
      // Si todavía se está descargando, se agrega cuando termine
      if (st.StateFlags !== undefined && !(Number(st.StateFlags) & 4)) continue;
      games.set(st.appid, {
        appId: String(st.appid),
        name: st.name || `App ${st.appid}`,
        installDir: st.installdir ? path.join(appsDir, 'common', st.installdir) : null,
        library: lib,
      });
    }
  }
  return [...games.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

// Busca arte que el cliente de Steam ya tiene guardado en caché.
// Soporta el formato viejo (<appid>_header.jpg) y el nuevo (<appid>/header.jpg,
// a veces dentro de una subcarpeta con hash).
async function findLocalArt(appId) {
  const steamPath = await findSteamPath();
  const result = {};
  if (!steamPath) return result;
  const cache = path.join(steamPath, 'appcache', 'librarycache');
  const wanted = {
    header: ['header.jpg'],
    hero: ['library_hero.jpg'],
    logo: ['logo.png'],
    capsule: ['library_600x900.jpg', 'library_capsule.jpg'],
  };

  // Formato viejo
  for (const [kind, names] of Object.entries(wanted)) {
    for (const name of names) {
      const p = path.join(cache, `${appId}_${name}`);
      if (!result[kind] && fs.existsSync(p)) result[kind] = p;
    }
  }

  // Formato nuevo
  const dir = path.join(cache, String(appId));
  const walk = (d, depth) => {
    let entries = [];
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory() && depth < 2) walk(full, depth + 1);
      else if (e.isFile()) {
        for (const [kind, names] of Object.entries(wanted)) {
          if (!result[kind] && names.includes(e.name.toLowerCase())) result[kind] = full;
        }
      }
    }
  };
  walk(dir, 0);
  return result;
}

// AppID del juego de Steam que está corriendo ahora (0 si ninguno).
async function getRunningAppId() {
  const v = await regQuery('HKCU\\Software\\Valve\\Steam', 'RunningAppID');
  if (!v) return 0;
  return parseInt(v, v.startsWith('0x') ? 16 : 10) || 0;
}

// ---------- Usuario de Steam (sin internet) ----------

const STEAMID64_BASE = 76561197960265728n;

// Usuario que inició sesión por última vez en este PC: { steamId, accountId, name, avatarFile }
async function getSteamUser() {
  const steamPath = await findSteamPath();
  if (!steamPath) return null;
  const vdf = readVdfFile(path.join(steamPath, 'config', 'loginusers.vdf'));
  const users = vdf && (vdf.users || vdf.Users);
  if (!users) return null;
  const list = Object.entries(users).map(([id, u]) => ({
    steamId: id,
    name: u.PersonaName || u.AccountName || 'Jugador',
    mostRecent: String(u.MostRecent || u.mostrecent || '0') === '1',
    ts: Number(u.Timestamp || 0),
  }));
  if (!list.length) return null;
  list.sort((a, b) => Number(b.mostRecent) - Number(a.mostRecent) || b.ts - a.ts);
  const u = list[0];
  let accountId = null;
  try {
    accountId = String(BigInt(u.steamId) - STEAMID64_BASE);
  } catch {}
  const avatar = path.join(steamPath, 'config', 'avatarcache', `${u.steamId}.png`);
  return { steamId: u.steamId, accountId, name: u.name, avatarFile: fs.existsSync(avatar) ? avatar : null };
}

// Última vez jugado y horas jugadas por juego, desde la configuración local de Steam.
// Devuelve { [appId]: { lastPlayed: ms, playtimeMin } }
let localStatsCache = { file: null, mtime: 0, data: {} };
async function getLocalAppStats(accountId) {
  const steamPath = await findSteamPath();
  if (!steamPath || !accountId) return {};
  const file = path.join(steamPath, 'userdata', accountId, 'config', 'localconfig.vdf');
  let mtime = 0;
  try {
    mtime = fs.statSync(file).mtimeMs;
  } catch {
    return {};
  }
  if (localStatsCache.file === file && localStatsCache.mtime === mtime) return localStatsCache.data;
  const vdf = readVdfFile(file);
  const get = (o, ...keys) => keys.reduce((acc, k) => {
    if (!acc) return null;
    const hit = Object.keys(acc).find((x) => x.toLowerCase() === k.toLowerCase());
    return hit ? acc[hit] : null;
  }, o);
  const apps = get(vdf, 'UserLocalConfigStore', 'Software', 'Valve', 'Steam', 'apps') || {};
  const data = {};
  for (const [appId, a] of Object.entries(apps)) {
    if (!a || typeof a !== 'object') continue;
    const last = Number(get(a, 'LastPlayed') || 0);
    const play = Number(get(a, 'Playtime') || 0);
    if (last || play) data[appId] = { lastPlayed: last * 1000, playtimeMin: play };
  }
  localStatsCache = { file, mtime, data };
  return data;
}

// ---------- Juegos que no son de Steam agregados A Steam ("Añadir un juego que no es de Steam") ----------
// Steam los guarda en userdata/<cuenta>/config/shortcuts.vdf, en formato binario.
function parseBinaryVdf(buf) {
  let i = 0;
  const readStr = () => {
    const end = buf.indexOf(0, i);
    const s = buf.toString('utf8', i, end < 0 ? buf.length : end);
    i = end < 0 ? buf.length : end + 1;
    return s;
  };
  const readMap = () => {
    const obj = {};
    while (i < buf.length) {
      const type = buf[i++];
      if (type === 0x08) return obj; // fin del bloque
      const key = readStr().toLowerCase();
      if (type === 0x00) obj[key] = readMap();
      else if (type === 0x01) obj[key] = readStr();
      else if (type === 0x02) {
        obj[key] = buf.readUInt32LE(i);
        i += 4;
      } else if (type === 0x07) {
        obj[key] = buf.readBigUInt64LE(i);
        i += 8;
      } else throw new Error(`shortcuts.vdf: tipo desconocido ${type}`);
    }
    return obj;
  };
  return readMap();
}

const unquote = (s) => String(s || '').trim().replace(/^"(.*)"$/, '$1');

// Imágenes que pusiste en Steam para ese acceso directo (Steam las guarda en config/grid)
function shortcutArt(gridDir, appId) {
  const find = (base) => {
    for (const ext of ['.png', '.jpg', '.jpeg', '.webp']) {
      const f = path.join(gridDir, base + ext);
      if (fs.existsSync(f)) return f;
    }
    return null;
  };
  const art = { tile: find(`${appId}`), cover: find(`${appId}p`), hero: find(`${appId}_hero`), logo: find(`${appId}_logo`) };
  for (const k of Object.keys(art)) if (!art[k]) delete art[k];
  return art;
}

// Devuelve [{ appId, name, exe, startDir, launchOptions, art }]
async function listShortcuts(accountId) {
  const steamPath = await findSteamPath();
  if (!steamPath || !accountId) return [];
  const cfg = path.join(steamPath, 'userdata', String(accountId), 'config');
  let root;
  try {
    root = parseBinaryVdf(fs.readFileSync(path.join(cfg, 'shortcuts.vdf')));
  } catch {
    return [];
  }
  const list = Object.values(root.shortcuts || {});
  return list
    .filter((s) => s && (s.appname || s.exe) && !s.ishidden)
    .map((s) => {
      const appId = s.appid !== undefined ? String(s.appid >>> 0) : null;
      const exe = unquote(s.exe);
      return {
        appId,
        name: s.appname || path.basename(exe, path.extname(exe)),
        exe,
        startDir: unquote(s.startdir) || null,
        launchOptions: s.launchoptions || '',
        art: appId ? shortcutArt(path.join(cfg, 'grid'), appId) : {},
      };
    })
    .filter((s) => s.exe);
}

// Carpetas donde aparecen los juegos nuevos que descargas (para detectarlos al tiro)
async function watchPaths(accountId) {
  const steamPath = await findSteamPath();
  if (!steamPath) return { apps: [], shortcuts: null };
  return {
    apps: getLibraryFolders(steamPath).map((l) => path.join(l, 'steamapps')),
    shortcuts: accountId ? path.join(steamPath, 'userdata', String(accountId), 'config', 'shortcuts.vdf') : null,
  };
}

module.exports = {
  findSteamPath,
  getLibraryFolders,
  listInstalledGames,
  findLocalArt,
  getRunningAppId,
  isGame,
  getSteamUser,
  getLocalAppStats,
  listShortcuts,
  watchPaths,
  parseBinaryVdf,
};
