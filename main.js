// Proceso principal: ventana en la segunda pantalla, bandeja del sistema,
// arranque con Windows, juegos y arte.

const { app, BrowserWindow, Tray, Menu, screen, ipcMain, shell, session, nativeImage, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const { Config, detectType } = require('./src/config');
const steam = require('./src/steam');
const media = require('./src/media');
const { Launcher } = require('./src/launcher');
const { SteamWeb } = require('./src/steamweb');
const { Spotify } = require('./src/spotify');

const IS_DEV = process.argv.includes('--dev');

const APP_NAME = 'NostalHub';
const APP_ID = 'cl.xarlord.nostalhub';
// Nombres anteriores de la app: su carpeta de datos se traspasa sola y su arranque con Windows se quita
const OLD_NAMES = [{ dir: 'Canales', id: 'cl.cristobal.canales' }];

// Cambia las rutas guardadas en config.json que apuntaban a la carpeta vieja
function fixSavedPaths(file, oldDir, newDir) {
  try {
    const low = oldDir.toLowerCase();
    const walk = (v) => {
      if (typeof v === 'string') return v.toLowerCase().startsWith(low) ? newDir + v.slice(oldDir.length) : v;
      if (Array.isArray(v)) return v.map(walk);
      if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
      return v;
    };
    const data = walk(JSON.parse(fs.readFileSync(file, 'utf8')));
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch {}
}

// Si existe la carpeta de datos con el nombre viejo y aún no la nueva, la traspasa
// (consolas, imágenes, claves de Steam y Discord, sesión de Discord, ajustes).
function migrateDataDir(appData, newDir) {
  if (fs.existsSync(newDir)) return;
  for (const old of OLD_NAMES) {
    const oldDir = path.join(appData, old.dir);
    if (!fs.existsSync(oldDir)) continue;
    try {
      fs.renameSync(oldDir, newDir);
    } catch {
      try {
        fs.cpSync(oldDir, newDir, { recursive: true }); // si estaba en uso, se copia
      } catch {
        continue;
      }
    }
    fixSavedPaths(path.join(newDir, 'config.json'), oldDir, newDir);
    return;
  }
}

app.setName(APP_NAME);
const USER_DATA = path.join(app.getPath('appData'), APP_NAME);
migrateDataDir(app.getPath('appData'), USER_DATA);
app.setPath('userData', USER_DATA);
if (process.platform === 'win32') app.setAppUserModelId(APP_ID);

// Una sola instancia: si ya está abierta, no abre otra.
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

const DATA_DIR = app.getPath('userData');
const MEDIA_DIR = path.join(DATA_DIR, 'media');
const CUSTOM_DIR = path.join(DATA_DIR, 'personalizar');
const CONSOLES_DIR = path.join(DATA_DIR, 'consolas');

const config = new Config(DATA_DIR);
let win = null;
let tray = null;
const launcher = new Launcher((gameId, reason) => {
  send('game:ended', { gameId, reason });
  refreshSteamUser(); // actualiza "jugado por última vez" y horas
});
const steamWeb = new SteamWeb(DATA_DIR);
const { DiscordVoice } = require('./src/discord');
const spotify = new Spotify((state) => send('spotify:update', state), path.join(DATA_DIR, 'cache', 'spotify.log'));
const discord = new DiscordVoice({
  dataDir: DATA_DIR,
  onUpdate: (state) => send('discord:update', state),
  log: (line) => {
    try {
      fs.mkdirSync(path.join(DATA_DIR, 'cache'), { recursive: true });
      fs.appendFileSync(path.join(DATA_DIR, 'cache', 'discord.log'), `${new Date().toISOString().slice(0, 19)}  ${line}\r\n`);
    } catch {}
  },
});
// En la app instalada, MANUAL.md queda afuera del archivo comprimido (app.asar.unpacked) para poder abrirlo
const MANUAL_FILE = path.join(__dirname, 'MANUAL.md').replace(`app.asar${path.sep}`, `app.asar.unpacked${path.sep}`);

// Usuario de Steam de este PC y sus estadísticas locales (última vez jugado, horas)
let steamUser = null;
let localStats = {};
async function refreshSteamUser() {
  try {
    steamUser = await steam.getSteamUser();
    localStats = steamUser ? await steam.getLocalAppStats(steamUser.accountId) : {};
  } catch (e) {
    console.warn('No se pudo leer el usuario de Steam:', e.message);
  }
  pushGamesSoon();
}

// ---------- Utilidades ----------

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function fileUrl(p) {
  if (!p || !fs.existsSync(p)) return null;
  const v = Math.round(fs.statSync(p).mtimeMs);
  return `${pathToFileURL(p).href}?v=${v}`;
}

// Nombre de carpeta seguro para Windows a partir del nombre del juego.
function folderName(game) {
  return game.name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').replace(/[. ]+$/, '').trim() || media.safeId(game.id);
}

function customFilesFor(game) {
  // Acepta personalizar/<Nombre del juego>/ o personalizar/<id>/
  const byName = media.findCustomFiles(path.join(CUSTOM_DIR, folderName(game)));
  const byId = media.findCustomFiles(path.join(CUSTOM_DIR, media.safeId(game.id)));
  return { ...byId, ...byName };
}

function ensureCustomFolders() {
  fs.mkdirSync(CUSTOM_DIR, { recursive: true });
  for (const g of config.games) {
    const dir = path.join(CUSTOM_DIR, folderName(g));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
  const readme = path.join(CUSTOM_DIR, 'LEEME.txt');
  if (!fs.existsSync(readme)) {
    fs.writeFileSync(
      readme,
      [
        'Cada carpeta corresponde a un juego. Deja aquí los archivos que quieras usar en vez del arte automático:',
        '',
        '  video.mp4 / video.webm / video.gif  -> animación de la pantalla de canal',
        '  fondo.jpg / fondo.png               -> fondo de la pantalla de canal',
        '  logo.png                            -> título (mejor con fondo transparente)',
        '  canal.jpg / canal.png / canal.mp4   -> cuadrito del juego en el menú',
        '  modelo.glb / modelo.gltf            -> modelo 3D (tema PS2), por ejemplo exportado desde Blockbench',
        '  descripcion.txt                     -> descripción propia del juego (reemplaza la de Steam)',
        '',
        'Los cambios se aplican solos al guardar el archivo. Para volver al arte automático, borra el archivo.',
        '',
      ].join('\r\n'),
      'utf8'
    );
  }
}

// Lo que ve la interfaz (rutas convertidas a file:// y prioridades resueltas).
function gamesView() {
  return config.games
    .filter((g) => !g.hidden)
    .map((g) => {
      const c = { ...customFilesFor(g), ...pickExisting(g.custom) };
      const m = g.media || {};
      const tile = c.tile || m.tile;
      const video = c.video || null;
      return {
        id: g.id,
        name: g.name,
        type: g.type,
        tile: fileUrl(tile),
        tileIsVideo: media.isVideoFile(tile),
        tileIsCustom: !!c.tile, // canal.* propio: se muestra tal cual, sin título encima
        tileTitle: config.data.tileTitle !== false,
        hero: fileUrl(c.hero || m.hero || m.tile),
        heroIsReal: !!(c.hero || m.hero), // false = el fondo es la portada (que ya trae el nombre)
        logo: fileUrl(c.logo || m.logo),
        video: fileUrl(video),
        videoIsGif: !!video && /\.gif$/i.test(video),
        trailer: !video && config.data.trailers ? m.trailer || null : null,
        trailerMp4: !video && config.data.trailers ? m.trailerMp4 || null : null,
        model: fileUrl(c.model),
        description: readDescription(c.description) || m.description || '',
        appId: g.appId || null,
        cover: fileUrl(c.cover || m.cover), // carátula vertical (Xbox 360)
        bubble: fileUrl(c.bubble), // burbuja redonda propia (PS Vita)
        lastPlayed: Math.max((g.appId && localStats[g.appId] && localStats[g.appId].lastPlayed) || 0, (config.data.launchLog || {})[g.id] || 0),
        playtimeMin: (g.appId && localStats[g.appId] && localStats[g.appId].playtimeMin) || 0,
      };
    });
}

function readDescription(file) {
  if (!file) return '';
  try {
    return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').trim().slice(0, 800);
  } catch {
    return '';
  }
}

function pickExisting(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v && fs.existsSync(v)) out[k] = v;
  return out;
}

let updateTimer = null;
function pushGamesSoon() {
  clearTimeout(updateTimer);
  updateTimer = setTimeout(() => send('games:updated', gamesView()), 400);
}

// ---------- Consolas (selector) ----------

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
  intro: { base: 'intro', ext: ['.mp4', '.webm', '.mov', '.m4v'] },
};

// Copia de la imagen sin los bordes vacíos (transparentes o del mismo color del fondo), guardada en cache.
// Devuelve la ruta de la copia, o null si no se pudo (gif, svg, webp: se usan tal cual).
function trimImage(src, key) {
  try {
    if (!['.png', '.jpg', '.jpeg'].includes(path.extname(src).toLowerCase())) return null;
    const st = fs.statSync(src);
    const dir = path.join(DATA_DIR, 'cache', 'consolas');
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
  fs.mkdirSync(CONSOLES_DIR, { recursive: true });
  const out = {};
  for (const id of ids || []) {
    const safe = media.safeId(id);
    const dir = path.join(CONSOLES_DIR, safe);
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
      found[kind] = fileUrl((kind === 'icon' || kind === 'logo') && trimImage(file, `${safe}-${kind}`)) || fileUrl(file);
    }
    out[id] = found;
  }
  // El LEEME se reescribe si cambió (es un archivo de la app, no tuyo)
  const readme = path.join(CONSOLES_DIR, 'LEEME.txt');
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
    '',
    'Se aplica solo al guardar el archivo. Más detalles en MANUAL.md, en la carpeta del proyecto.',
    '',
  ].join('\r\n');
  try {
    if (!fs.existsSync(readme) || fs.readFileSync(readme, 'utf8') !== text) fs.writeFileSync(readme, text, 'utf8');
  } catch {}
  return out;
}

// ---------- Steam ----------

// Agrega lo nuevo de Steam: juegos instalados y los "juegos que no son de Steam" que agregaste a Steam.
// Devuelve la lista de nombres agregados.
async function importSteamGames() {
  const addedNames = [];
  const installed = await steam.listInstalledGames();
  const known = new Set(config.games.filter((g) => g.type === 'steam').map((g) => g.appId));
  for (const s of installed) {
    if (known.has(s.appId)) continue;
    config.games.push({
      id: `steam-${s.appId}`,
      name: s.name,
      type: 'steam',
      appId: s.appId,
      args: [],
      hidden: false,
      media: {},
      custom: {},
      mediaCheckedAt: 0,
    });
    addedNames.push(s.name);
  }

  // Accesos directos de Steam (shortcuts.vdf)
  let changed = false;
  try {
    const user = steamUser || (await steam.getSteamUser());
    const shortcuts = user ? await steam.listShortcuts(user.accountId) : [];
    for (const sc of shortcuts) {
      const id = `steam-shortcut-${sc.appId || sc.name}`;
      const game = config.games.find((g) => g.id === id);
      const fields = {
        name: sc.name,
        type: detectType(sc.exe),
        target: sc.exe,
        args: splitArgs(sc.launchOptions),
        steamShortcut: sc.appId,
        startDir: sc.startDir || undefined,
        media: sc.art, // las imágenes que le pusiste en Steam
      };
      if (!game) {
        config.games.push({ id, hidden: false, custom: {}, mediaCheckedAt: 0, ...fields });
        addedNames.push(sc.name);
      } else if (JSON.stringify({ ...game, ...fields }) !== JSON.stringify(game)) {
        Object.assign(game, fields); // cambió algo en Steam (nombre, ruta o imágenes)
        changed = true;
      }
    }
  } catch (e) {
    console.warn('No se pudieron leer los accesos directos de Steam:', e.message);
  }

  if (addedNames.length || changed) config.save();
  ensureCustomFolders();
  return addedNames;
}

// "--a b --c=\"d e\"" -> ['--a', 'b', '--c=d e']
function splitArgs(str) {
  const out = [];
  const re = /"([^"]*)"|(\S+)/g;
  let m;
  while ((m = re.exec(String(str || '')))) out.push(m[1] !== undefined ? m[1] : m[2]);
  return out;
}

// Juegos que no son de Steam ni están en Steam: se eligen con una ventana de Windows
async function addGameFromFile() {
  const res = await dialog.showOpenDialog(win || undefined, {
    title: 'Elige el juego o programa',
    properties: ['openFile'],
    filters: [
      { name: 'Juegos y accesos directos', extensions: ['exe', 'lnk', 'url', 'bat', 'cmd'] },
      { name: 'Todos los archivos', extensions: ['*'] },
    ],
  });
  if (res.canceled || !res.filePaths.length) return;
  const file = res.filePaths[0];
  if (config.games.some((g) => g.target && path.normalize(g.target) === path.normalize(file))) {
    send('toast', 'Ese juego ya estaba en la lista');
    return;
  }
  const name = path.basename(file, path.extname(file));
  const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let id = `juego-${slug || Date.now()}`;
  while (config.games.some((g) => g.id === id)) id += '-2';
  config.games.push({ id, name, type: detectType(file), target: file, args: [], hidden: false, media: {}, custom: {}, mediaCheckedAt: 0 });
  config.save();
  ensureCustomFolders();
  pushGamesSoon();
  send('toast', `Se agregó ${name}`);
}

// Detecta solo los juegos que instalas (o agregas a Steam) mientras NostalHub está abierta
let steamWatchers = [];
let steamWatchTimer = null;
async function watchSteamLibrary() {
  steamWatchers.forEach((w) => w.close && w.close());
  steamWatchers = [];
  const user = steamUser || (await steam.getSteamUser());
  const { apps, shortcuts } = await steam.watchPaths(user && user.accountId);
  const later = () => {
    clearTimeout(steamWatchTimer);
    steamWatchTimer = setTimeout(async () => {
      const added = await importSteamGames();
      pushGamesSoon();
      if (added.length) {
        send('toast', added.length === 1 ? `Nuevo juego: ${added[0]}` : `Se agregaron ${added.length} juegos`);
        refreshMedia();
      }
    }, 4000);
  };
  for (const dir of apps) {
    try {
      steamWatchers.push(fs.watch(dir, (_ev, file) => file && /^appmanifest_\d+\.acf$/i.test(file) && later()));
    } catch {}
  }
  if (shortcuts) {
    fs.watchFile(shortcuts, { interval: 4000 }, later);
    steamWatchers.push({ close: () => fs.unwatchFile(shortcuts) });
  }
}

let mediaRunning = false;
async function refreshMedia({ force = false } = {}) {
  if (mediaRunning) return;
  mediaRunning = true;
  try {
    for (const g of config.games) {
      if (g.type !== 'steam') continue;
      const changed = await media.ensureSteamMedia(g, MEDIA_DIR, { force });
      config.save();
      if (changed) pushGamesSoon();
    }
  } finally {
    mediaRunning = false;
    pushGamesSoon();
  }
}

// ---------- Pantallas y ventana ----------

function sortedDisplays() {
  return screen.getAllDisplays().sort((a, b) => a.bounds.x - b.bounds.x || a.bounds.y - b.bounds.y);
}

function pickDisplay() {
  const displays = sortedDisplays();
  const primary = screen.getPrimaryDisplay();
  if (config.data.display !== 'auto') {
    const d = displays[Number(config.data.display) - 1];
    if (d) return d;
  }
  const others = displays.filter((d) => d.id !== primary.id);
  if (!others.length) return null;
  const right = others.find((d) => d.bounds.x >= primary.bounds.x + primary.bounds.width);
  return right || others[others.length - 1];
}

function placeWindow() {
  if (!win) return;
  const d = pickDisplay();
  if (!d) {
    // Solo hay una pantalla: ventana normal para no tapar todo.
    const wa = screen.getPrimaryDisplay().workArea;
    const w = Math.min(1280, wa.width), h = Math.min(720, wa.height);
    win.setBounds({ x: wa.x + Math.round((wa.width - w) / 2), y: wa.y + Math.round((wa.height - h) / 2), width: w, height: h });
    return;
  }
  const area = config.data.fullscreen ? d.bounds : d.workArea;
  win.setBounds(area);
  // Segunda pasada: en Windows con escalas distintas por monitor a veces queda corrido.
  setTimeout(() => win && !win.isDestroyed() && win.setBounds(area), 300);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    frame: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    autoHideMenuBar: true,
    backgroundColor: '#ebebeb',
    title: 'NostalHub',
    icon: path.join(__dirname, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      autoplayPolicy: 'no-user-gesture-required', // la música de fondo suena sin tener que hacer clic primero
    },
  });
  placeWindow();
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.once('ready-to-show', () => {
    placeWindow();
    win.showInactive(); // aparece sin robarle el foco a lo que estés haciendo
    if (IS_DEV) win.webContents.openDevTools({ mode: 'detach' });
  });
  // Los enlaces nunca abren ventanas nuevas dentro de la app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  // Alt+F4 no la cierra: la app vive en la bandeja. Para cerrarla, "Salir".
  win.on('close', (e) => {
    if (!isQuitting) e.preventDefault();
  });
  win.on('closed', () => (win = null));
}

let isQuitting = false;
app.on('before-quit', () => {
  isQuitting = true;
  spotify.dispose();
  discord.dispose();
});

function showWindow() {
  if (!win) createWindow();
  else {
    if (win.isMinimized()) win.restore();
    win.showInactive();
    placeWindow();
  }
}

// ---------- Arranque con Windows ----------

function loginItemOptions() {
  // En desarrollo (npm start) hay que decirle a Windows qué carpeta abrir con electron.exe.
  return app.isPackaged ? {} : { path: process.execPath, args: [path.resolve(app.getAppPath())] };
}

function applyAutoStart() {
  if (process.platform !== 'win32' && process.platform !== 'darwin') return;
  app.setLoginItemSettings({ openAtLogin: !!config.data.autoStart, name: APP_ID, ...loginItemOptions() });
  // Quita el arranque con Windows que quedó registrado con el nombre anterior (si no, se abriría dos veces)
  if (process.platform === 'win32') {
    for (const old of OLD_NAMES) app.setLoginItemSettings({ openAtLogin: false, name: old.id, ...loginItemOptions() });
  }
}

// ---------- Opciones (menú de la bandeja y menú de ajustes de cada consola) ----------
// Las opciones se escriben una sola vez, como datos. De aquí salen:
// - el menú normal de Windows (clic derecho en el ícono junto al reloj), y
// - el menú con el estilo de cada consola (engranaje de la Wii, Guía de la Xbox, Configuración de la PS2).
// Tipos: 'action' (hace algo), 'toggle' (activado / desactivado) y 'choice' (elegir una entre varias).

function menuSections() {
  const displays = sortedDisplays();
  const primary = screen.getPrimaryDisplay();
  const setOption = (key, value) => {
    config.data[key] = value;
    config.save();
  };
  const sound = (key) => (v) => (setOption(key, v), send('settings:changed', soundSettings()));
  const near = (a, b) => Math.abs(a - b) < 0.01;
  const ss = soundSettings();

  return [
    {
      id: 'general',
      title: 'General',
      items: [
        { id: 'show', type: 'action', label: 'Mostrar el menú', trayOnly: true, run: showWindow },
        {
          id: 'consoles',
          type: 'action',
          label: 'Cambiar de consola',
          desc: 'Vuelve al selector de consolas.',
          closes: true,
          run: () => (showWindow(), send('shell:selector')),
        },
        { id: 'reload', type: 'action', label: 'Recargar', desc: 'Vuelve a cargar la pantalla, por si algo se ve raro.', closes: true, run: () => win && win.reload() },
        { id: 'open-manual', type: 'action', label: 'Abrir manual', desc: 'Dónde va cada archivo que pones a mano.', run: () => shell.openPath(MANUAL_FILE) },
        { id: 'quit', type: 'action', label: 'Salir de NostalHub', desc: 'Cierra la app. Vuelve a abrirla desde su acceso directo, o se abre sola al prender el PC.', confirm: true, run: () => app.quit() },
      ],
    },
    {
      id: 'games',
      title: 'Juegos',
      items: [
        {
          id: 'import',
          type: 'action',
          label: 'Buscar juegos nuevos de Steam',
          desc: 'Agrega los juegos de Steam instalados y los que agregaste a Steam como "juego que no es de Steam".',
          run: async () => {
            const added = await importSteamGames();
            const n = added.length;
            send('toast', n ? `Se agregaron ${n} juego${n === 1 ? '' : 's'}` : 'No hay juegos nuevos');
            pushGamesSoon();
            refreshMedia();
          },
        },
        {
          id: 'add-game',
          type: 'action',
          label: 'Agregar juego o programa',
          desc: 'Elige el .exe o el acceso directo de un juego que no es de Steam.',
          run: () => addGameFromFile(),
        },
        {
          id: 'art',
          type: 'action',
          label: 'Volver a descargar el arte',
          desc: 'Descarga otra vez las imágenes de Steam de todos los juegos.',
          run: () => {
            send('toast', 'Descargando arte…');
            refreshMedia({ force: true });
          },
        },
        {
          id: 'tileTitle',
          type: 'toggle',
          label: 'Título encima de cada canal',
          desc: 'En la Wii, pone el logo del juego encima de su imagen de fondo.',
          value: config.data.tileTitle !== false,
          set: (v) => (setOption('tileTitle', v), pushGamesSoon()),
        },
        {
          id: 'trailers',
          type: 'toggle',
          label: 'Mostrar tráileres de Steam',
          desc: 'Usa el tráiler de Steam como animación del juego (necesita internet).',
          value: !!config.data.trailers,
          set: (v) => (setOption('trailers', v), pushGamesSoon()),
        },
      ],
    },
    {
      id: 'screen',
      title: 'Pantalla',
      items: [
        {
          id: 'display',
          type: 'choice',
          label: 'Pantalla',
          desc: 'En qué pantalla se muestra NostalHub.',
          options: [
            { value: 'auto', label: 'Automática (la secundaria)', short: 'Automática' },
            ...displays.map((d, i) => ({
              value: String(i + 1),
              label: `Pantalla ${i + 1} — ${d.size.width}×${d.size.height}${d.id === primary.id ? ' (principal)' : ''}`,
              short: `Pantalla ${i + 1}`,
            })),
          ],
          value: config.data.display === 'auto' ? 'auto' : String(config.data.display),
          set: (v) => (setOption('display', v === 'auto' ? 'auto' : Number(v)), placeWindow()),
        },
        {
          id: 'fullscreen',
          type: 'toggle',
          label: 'Cubrir la barra de tareas',
          desc: 'Desactívalo si la barra de Windows aparece encima del menú.',
          value: !!config.data.fullscreen,
          set: (v) => (setOption('fullscreen', v), placeWindow()),
        },
        {
          id: 'autoStart',
          type: 'toggle',
          label: 'Iniciar con Windows',
          desc: 'Abre NostalHub sola al prender el PC.',
          value: !!config.data.autoStart,
          set: (v) => (setOption('autoStart', v), applyAutoStart()),
        },
      ],
    },
    {
      id: 'sound',
      title: 'Sonido',
      items: [
        { id: 'music', type: 'toggle', label: 'Música de fondo', desc: 'La música de cada consola (musica.mp3).', value: ss.music, set: sound('music') },
        { id: 'sounds', type: 'toggle', label: 'Sonidos del menú', desc: 'Los sonidos al moverte, elegir y volver.', value: ss.sounds, set: sound('sounds') },
        { id: 'intros', type: 'toggle', label: 'Videos de inicio de las consolas', desc: 'El video (intro.mp4) al entrar a una consola.', value: ss.intros, set: sound('intros') },
        {
          id: 'musicVolume',
          type: 'choice',
          label: 'Volumen de la música',
          options: [
            ['Bajo', 0.15],
            ['Medio', 0.35],
            ['Alto', 0.6],
            ['Máximo', 1],
          ].map(([label, v]) => ({ value: v, label })),
          value: [0.15, 0.35, 0.6, 1].find((v) => near(v, ss.musicVolume)),
          set: (v) => sound('musicVolume')(Number(v)),
        },
        {
          id: 'sfxVolume',
          type: 'choice',
          label: 'Volumen de los sonidos',
          options: [
            ['Bajo', 0.3],
            ['Medio', 0.6],
            ['Alto', 1],
          ].map(([label, v]) => ({ value: v, label })),
          value: [0.3, 0.6, 1].find((v) => near(v, ss.sfxVolume)),
          set: (v) => sound('sfxVolume')(Number(v)),
        },
      ],
    },
    {
      id: 'files',
      title: 'Archivos',
      items: [
        { id: 'open-custom', type: 'action', label: 'Carpeta de personalización', desc: 'Logos, fondos, videos y modelos de cada juego.', run: () => (ensureCustomFolders(), shell.openPath(CUSTOM_DIR)) },
        {
          id: 'open-consoles',
          type: 'action',
          label: 'Carpeta de consolas',
          desc: 'Íconos, música, sonidos y videos de inicio de cada consola.',
          run: () => (fs.mkdirSync(CONSOLES_DIR, { recursive: true }), shell.openPath(CONSOLES_DIR)),
        },
        { id: 'open-config', type: 'action', label: 'Abrir config.json', desc: 'Lista de juegos y opciones.', run: () => shell.openPath(config.file) },
        { id: 'open-apikey', type: 'action', label: 'Clave de API de Steam (logros)', desc: 'Para ver tus logros. Los pasos están en el manual.', run: () => shell.openPath(steamWeb.ensureKeyFile()) },
        { id: 'open-discord', type: 'action', label: 'Datos de Discord (grupo)', desc: 'Para ver tu canal de voz en la PS4. Los pasos están en el manual.', run: () => shell.openPath(discord.ensureKeyFile()) },
        { id: 'devtools', type: 'action', label: 'Herramientas de desarrollo', desc: 'Para ver errores.', run: () => win && win.webContents.openDevTools({ mode: 'detach' }) },
      ],
    },
  ];
}

// Menú normal de Windows (bandeja), armado con las mismas opciones
function buildMenu() {
  const template = [];
  const sections = menuSections();
  const quit = sections[0].items.find((it) => it.id === 'quit');
  for (const sec of sections) {
    if (template.length) template.push({ type: 'separator' });
    for (const it of sec.items) {
      if (it === quit) continue; // "Salir" va al final
      if (it.type === 'action') template.push({ label: it.label, click: () => it.run() });
      else if (it.type === 'toggle') template.push({ label: it.label, type: 'checkbox', checked: !!it.value, click: (m) => it.set(m.checked) });
      else if (it.type === 'choice')
        template.push({
          label: it.label,
          submenu: it.options.map((o) => ({ label: o.label, type: 'radio', checked: String(o.value) === String(it.value), click: () => it.set(o.value) })),
        });
    }
  }
  template.push({ type: 'separator' }, { label: 'Salir', click: () => app.quit() });
  return Menu.buildFromTemplate(template);
}

// Versión para la interfaz: solo datos (sin funciones)
function menuModel() {
  return menuSections().map((sec) => ({
    id: sec.id,
    title: sec.title,
    items: sec.items
      .filter((it) => !it.trayOnly)
      .map(({ run, set, trayOnly, ...it }) => it),
  }));
}

ipcMain.handle('menu:model', () => menuModel());
ipcMain.handle('menu:run', async (_e, id, value) => {
  const it = menuSections()
    .flatMap((s) => s.items)
    .find((x) => x.id === id);
  if (!it) return menuModel();
  try {
    if (it.type === 'action') await it.run();
    else if (it.type === 'toggle') it.set(value === undefined ? !it.value : !!value);
    else if (it.type === 'choice') {
      const opt = it.options.find((o) => String(o.value) === String(value));
      if (opt) it.set(opt.value);
    }
  } catch (e) {
    send('toast', `No se pudo: ${e.message}`);
  }
  return menuModel();
});

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png'));
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip(`NostalHub v${app.getVersion()}`);
  tray.on('click', showWindow);
  tray.on('right-click', () => tray.popUpContextMenu(buildMenu()));
}

// ---------- IPC ----------

ipcMain.handle('state:get', () => ({ games: gamesView() }));

ipcMain.handle('consoles:get', (_e, ids) => ({ assets: consoleAssets(ids), last: config.data.lastConsole || null }));

// Espacio libre del disco donde están la mayoría de tus juegos (para el tema PS2)
ipcMain.handle('system:free-space', async () => {
  let target = DATA_DIR;
  try {
    const installed = await steam.listInstalledGames();
    const count = {};
    for (const g of installed) {
      const root = path.parse(g.library).root || g.library;
      count[root] = (count[root] || 0) + 1;
    }
    const best = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
    if (best) target = best[0];
  } catch {}
  try {
    const st = await fs.promises.statfs(target);
    return { bytes: Number(st.bavail) * Number(st.bsize), drive: path.parse(target).root };
  } catch {
    return { bytes: null };
  }
});

// ---------- Sonido (música, efectos, videos de inicio) ----------
function soundSettings() {
  const d = config.data;
  return {
    music: d.music !== false,
    sounds: d.sounds !== false,
    intros: d.intros !== false,
    musicVolume: typeof d.musicVolume === 'number' ? d.musicVolume : 0.35,
    sfxVolume: typeof d.sfxVolume === 'number' ? d.sfxVolume : 0.6,
  };
}
ipcMain.handle('settings:get', () => soundSettings());

ipcMain.handle('console:select', (_e, id) => {
  config.data.lastConsole = String(id);
  config.save();
});

ipcMain.handle('game:launch', async (_e, id) => {
  const game = config.findGame(id);
  if (!game) return { ok: false, error: 'Juego no encontrado' };
  try {
    config.data.launchLog = { ...(config.data.launchLog || {}), [game.id]: Date.now() };
    config.save();
    pushGamesSoon();
    return await launcher.launch(game);
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('game:dismiss', () => launcher.stopWatching());

ipcMain.handle('app:quit', () => app.quit());

// ---------- Steam (perfil y logros) ----------
ipcMain.handle('steam:profile', async () => {
  const u = steamUser;
  const web = u ? await steamWeb.profile(u.steamId) : null;
  return {
    steamId: u ? u.steamId : null,
    name: (web && web.name) || (u && u.name) || 'Jugador',
    avatar: (web && web.avatar) || (u && fileUrl(u.avatarFile)) || null,
    hasKey: !!steamWeb.key,
  };
});

ipcMain.handle('steam:achievements', (_e, appId) => steamWeb.achievements(String(appId), steamUser && steamUser.steamId));

ipcMain.handle('steam:summary', () => ({ ...steamWeb.summary(), hasKey: !!steamWeb.key }));

// ---------- Spotify ----------
ipcMain.handle('spotify:watch', (_e, on) => spotify.watch(!!on));
ipcMain.handle('spotify:control', (_e, cmd) => spotify.control(String(cmd)));

// ---------- Discord (canal de voz para la PS4) ----------
ipcMain.handle('discord:watch', (_e, on) => discord.watch(!!on));
ipcMain.handle('discord:authorize', () => discord.authorize());

// ---------- Abrir carpetas y archivos desde los menús ----------
ipcMain.handle('app:open', (_e, what) => {
  switch (what) {
    case 'custom':
      ensureCustomFolders();
      return shell.openPath(CUSTOM_DIR);
    case 'consoles':
      fs.mkdirSync(CONSOLES_DIR, { recursive: true });
      return shell.openPath(CONSOLES_DIR);
    case 'config':
      return shell.openPath(config.file);
    case 'data':
      return shell.openPath(DATA_DIR);
    case 'manual':
      return shell.openPath(MANUAL_FILE);
    case 'apikey':
      return shell.openPath(steamWeb.ensureKeyFile());
    case 'discord':
      return shell.openPath(discord.ensureKeyFile());
    case 'discord-app':
      return shell.openExternal('discord://');
    case 'discord-portal':
      return shell.openExternal('https://discord.com/developers/applications');
    case 'steam-friends':
      return shell.openExternal('steam://open/friends');
    case 'steam-store':
      return shell.openExternal('steam://store');
    case 'steam-activity':
      return shell.openExternal('steam://url/SteamIDControlPage');
    case 'steam-profile':
      return shell.openExternal(steamUser ? `steam://url/SteamIDPage/${steamUser.steamId}` : 'steam://open/main');
    default:
      return null;
  }
});

function refreshAchievementTotals() {
  if (!steamUser || !steamWeb.key) return;
  const ids = config.games
    .filter((g) => g.type === 'steam' && g.appId && !g.hidden)
    .sort((a, b) => ((localStats[b.appId] || {}).lastPlayed || 0) - ((localStats[a.appId] || {}).lastPlayed || 0))
    .map((g) => g.appId);
  steamWeb.refreshTotals(ids, steamUser.steamId, (summary) => send('steam:summary', { ...summary, hasKey: true }));
}

ipcMain.handle('menu:popup', () => {
  if (win) buildMenu().popup({ window: win });
});

// ---------- Inicio ----------

app.on('second-instance', showWindow);

app.whenReady().then(async () => {
  config.load();
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  ensureCustomFolders();

  // Los tráileres de Steam vienen de otro dominio: les permitimos cargar en la ventana.
  session.defaultSession.webRequest.onHeadersReceived({ urls: ['https://*.steamstatic.com/*'] }, (details, cb) => {
    const headers = {};
    for (const [k, v] of Object.entries(details.responseHeaders || {})) {
      if (k.toLowerCase() !== 'access-control-allow-origin') headers[k] = v;
    }
    headers['Access-Control-Allow-Origin'] = ['*'];
    cb({ responseHeaders: headers });
  });

  createWindow();
  createTray();
  applyAutoStart();

  screen.on('display-added', placeWindow);
  screen.on('display-removed', placeWindow);
  screen.on('display-metrics-changed', placeWindow);

  // Si cambias algo en la carpeta de personalización, se actualiza solo.
  try {
    fs.watch(CUSTOM_DIR, { recursive: true }, pushGamesSoon);
  } catch {}

  // Íconos y fondos de consolas
  fs.mkdirSync(CONSOLES_DIR, { recursive: true });
  let consolesTimer = null;
  try {
    fs.watch(CONSOLES_DIR, { recursive: true }, () => {
      clearTimeout(consolesTimer);
      consolesTimer = setTimeout(() => send('consoles:updated'), 400);
    });
  } catch {}

  // Si editas config.json a mano con la app abierta, se recarga al guardar.
  fs.watchFile(config.file, { interval: 1500 }, (cur) => {
    if (!cur.mtimeMs || cur.mtimeMs === config.lastWriteMs) return;
    config.lastWriteMs = cur.mtimeMs;
    config.load();
    ensureCustomFolders();
    applyAutoStart();
    send('settings:changed', soundSettings());
    placeWindow();
    pushGamesSoon();
  });

  if (config.data.importSteamAutomatically) {
    const added = await importSteamGames();
    if (added.length) pushGamesSoon();
  }
  refreshMedia();
  watchSteamLibrary();

  // Perfil de Steam, horas jugadas y logros
  await refreshSteamUser();
  refreshAchievementTotals();
  setInterval(refreshSteamUser, 2 * 60 * 1000);
  steamWeb.ensureKeyFile();
  fs.watchFile(steamWeb.keyFile, { interval: 2000 }, () => {
    send('steam:changed');
    refreshAchievementTotals();
  });
});

// La app sigue viva en la bandeja aunque no haya ventana.
app.on('window-all-closed', () => {});
