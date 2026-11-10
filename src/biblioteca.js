// Tu biblioteca, del lado de main.js:
// - importSteamGames: los juegos de Steam instalados (y desinstalados, que se esconden) y los accesos directos que
//   agregaste a Steam ("juego que no es de Steam").
// - addGameFromFile: Ajustes → Juegos → Agregar juego o programa (un .exe, .lnk, .url…).
// - watchSteamLibrary: vigila Steam mientras NostalHub está abierta (lo que instalas aparece solo).
// - refreshMedia: descarga el arte que falta (Steam y emuladores) a %APPDATA%\NostalHub\media.
// main.js lo conecta con registrar(nh).

const fs = require('fs');
const path = require('path');
const { dialog } = require('electron');
const steam = require('./steam');
const media = require('./media');
const emulators = require('./emulators');
const { detectType } = require('./config');
const { anotar } = require('./registro');
const riot = require('./riot');

let nh = null;

// Agrega lo nuevo de Steam: juegos instalados y los "juegos que no son de Steam" que agregaste a Steam.
// Devuelve la lista de nombres agregados.
async function importSteamGames() {
  const addedNames = [];
  const installed = await steam.listInstalledGames();
  const known = new Set(nh.config.games.filter((g) => g.type === 'steam').map((g) => g.appId));

  // Desinstalados: se ocultan solos (sin borrarlos) y vuelven, con su arte y sus horas, cuando los
  // reinstalas y terminan de descargarse. Los que se están descargando o actualizando no se tocan.
  let installChanged = false;
  const present = new Set((await steam.listInstalledGames({ all: true })).map((g) => g.appId));
  const ready = new Set(installed.map((g) => g.appId));
  if (present.size) {
    for (const g of nh.config.games) {
      if (g.type !== 'steam' || !g.appId) continue;
      if (!present.has(g.appId) && !g.uninstalled) {
        g.uninstalled = true;
        installChanged = true;
      } else if (ready.has(g.appId) && g.uninstalled) {
        delete g.uninstalled;
        installChanged = true;
        addedNames.push(g.name);
      }
    }
  }

  for (const s of installed) {
    if (known.has(s.appId)) continue;
    nh.config.games.push({
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
    const user = nh.steamUser() || (await steam.getSteamUser());
    const shortcuts = user ? await steam.listShortcuts(user.accountId) : [];
    for (const sc of shortcuts) {
      const id = `steam-shortcut-${sc.appId || sc.name}`;
      const game = nh.config.games.find((g) => g.id === id);
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
        nh.config.games.push({ id, hidden: false, custom: {}, mediaCheckedAt: 0, ...fields });
        addedNames.push(sc.name);
      } else if (JSON.stringify({ ...game, ...fields }) !== JSON.stringify(game)) {
        Object.assign(game, fields); // cambió algo en Steam (nombre, ruta o imágenes)
        changed = true;
      }
    }
  } catch (e) {
    anotar('steam', `no se pudieron leer los accesos directos: ${e.message}`);
  }

  if (addedNames.length || changed || installChanged) nh.config.save();
  nh.ensureCustomFolders();
  return addedNames;
}

// "--a b --c=\"d e\"" -> ['--a', 'b', '--c=d e']: un trozo entre comillas sigue siendo parte de su palabra
// (antes "--c=\"d e\"" quedaba cortado en dos)
function splitArgs(str) {
  return (String(str || '').match(/(?:[^\s"]+|"[^"]*")+/g) || []).map((t) => t.replace(/"/g, ''));
}

// Juegos que no son de Steam ni están en Steam: se eligen con una ventana de Windows
async function addGameFromFile() {
  const res = await dialog.showOpenDialog(nh.ventana() || undefined, {
    title: 'Elige el juego o programa',
    properties: ['openFile'],
    filters: [
      { name: 'Juegos y accesos directos', extensions: ['exe', 'lnk', 'url', 'bat', 'cmd'] },
      { name: 'Todos los archivos', extensions: ['*'] },
    ],
  });
  if (res.canceled || !res.filePaths.length) return;
  const file = res.filePaths[0];
  if (nh.config.games.some((g) => g.target && path.normalize(g.target) === path.normalize(file))) {
    nh.send('toast', 'Ese juego ya estaba en la lista');
    return;
  }
  const name = path.basename(file, path.extname(file));
  const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let id = `juego-${slug || Date.now()}`;
  while (nh.config.games.some((g) => g.id === id)) id += '-2';
  nh.config.games.push({ id, name, type: detectType(file), target: file, args: [], hidden: false, media: {}, custom: {}, mediaCheckedAt: 0 });
  nh.config.save();
  nh.ensureCustomFolders();
  nh.pushGamesSoon();
  nh.send('toast', `Se agregó ${name}`);
}

// Ajustes → Juegos → Agregar juegos de Riot: VALORANT, League of Legends y Teamfight Tactics que tengas instalados.
// Se abren por el Riot Client (src/riot.js). Los que ya estaban no se repiten; si el Riot Client se movió, se actualiza.
// riotDir: la carpeta de datos de Riot (para las pruebas; normalmente C:\ProgramData\Riot Games)
function addRiotGames(riotDir) {
  const client = riot.riotClient(riotDir);
  if (!client) return nh.send('toast', 'No se encontró el Riot Client');
  const found = riot.installedProducts(riotDir);
  if (!found.length) return nh.send('toast', 'No hay juegos de Riot instalados');
  let added = 0;
  for (const p of found) {
    const id = `riot-${p.id}`;
    const g = nh.config.games.find((x) => x.id === id);
    if (g) {
      Object.assign(g, { target: client, uninstalled: undefined });
      continue;
    }
    nh.config.games.push({ id, name: p.name, type: 'riot', product: p.id, patchline: 'live', target: client, args: [], hidden: false, media: {}, custom: {}, mediaCheckedAt: 0 });
    added++;
  }
  nh.config.save();
  nh.ensureCustomFolders();
  nh.pushGamesSoon();
  nh.send('toast', added ? `Se agregaron ${added} juego${added === 1 ? '' : 's'} de Riot` : 'Tus juegos de Riot ya estaban');
}

// Detecta solo los juegos que instalas (o agregas a Steam) mientras NostalHub está abierta
let steamWatchers = [];
let steamWatchTimer = null;
async function watchSteamLibrary() {
  steamWatchers.forEach((w) => w.close && w.close());
  steamWatchers = [];
  const user = nh.steamUser() || (await steam.getSteamUser());
  const { apps, shortcuts } = await steam.watchPaths(user && user.accountId);
  const later = () => {
    clearTimeout(steamWatchTimer);
    steamWatchTimer = setTimeout(async () => {
      const added = await importSteamGames();
      nh.pushGamesSoon();
      if (added.length) {
        nh.send('toast', added.length === 1 ? `Nuevo juego: ${added[0]}` : `Se agregaron ${added.length} juegos`);
        refreshMedia();
      }
    }, 4000);
  };
  for (const dir of apps) {
    try {
      steamWatchers.push(fs.watch(dir, (_ev, file) => file && /^appmanifest_\d+\.acf$/i.test(file) && later()));
    } catch (e) {
      anotar('steam', `no se puede vigilar ${dir} (los juegos nuevos no aparecerán solos): ${e.message}`);
    }
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
    for (const g of nh.config.games) {
      const emu = g.type === 'emulator' && emulators.EMULATORS[g.emulator];
      if ((g.type !== 'steam' && !emu) || g.uninstalled) continue;
      const before = JSON.stringify(g);
      const changed = emu ? await media.ensureEmulatorMedia(g, emu.artRepo, nh.mediaDir, { force }) : await media.ensureSteamMedia(g, nh.mediaDir, { force });
      if (JSON.stringify(g) !== before) nh.config.save(); // solo si cambió algo (antes se guardaba una vez por juego)
      if (changed) nh.pushGamesSoon();
    }
  } finally {
    mediaRunning = false;
    nh.pushGamesSoon();
  }
}

// nh: { config, steamUser(), mediaDir, ventana(), ensureCustomFolders, pushGamesSoon, send }
function registrar(contexto) {
  nh = contexto;
}

module.exports = { registrar, importSteamGames, splitArgs, addGameFromFile, addRiotGames, watchSteamLibrary, refreshMedia };
