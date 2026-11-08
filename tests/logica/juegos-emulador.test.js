// src/juegos-emulador.js con un RetroArch falso (carpetas temporales) y un RetroAchievements falso: agregar y esconder
// juegos, el aviso al instante por el registro del emulador y la revisión mientras juegas. No abre ningún programa.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
require('../ayuda/electron-falso');
const juegos = require('../../src/juegos-emulador');
const { carpetaTemporal, escribir } = require('../ayuda/temporal');

// Un RetroArch de mentira: retroarch.exe vacío, su núcleo mGBA y una carpeta de juegos
function retroarchFalso(t) {
  const dir = carpetaTemporal(t);
  const roms = path.join(dir, 'roms');
  escribir(dir, {
    'RetroArch/retroarch.exe': '',
    'RetroArch/cores/mgba_libretro.dll': '',
    'RetroArch/retroarch.cfg': `rgui_browser_directory = "${roms.replace(/\\/g, '\\\\')}"\n`,
    'roms/Pokemon - FireRed Version (USA).gba': '',
    'roms/Otro Juego (Europe).gba': '',
  });
  return { dir, exe: path.join(dir, 'RetroArch', 'retroarch.exe'), roms };
}

// Lo que main.js le pasa, con anotadores para revisar qué hizo
function contexto(t, config, retro = { connected: false }) {
  const pasó = { avisos: [], toasts: [], resumen: 0, juegos: 0, guardado: 0 };
  juegos.registrar({
    config: { data: config.data, games: config.games, save: () => pasó.guardado++, findGame: (id) => config.games.find((g) => g.id === id) },
    retro,
    dataDir: carpetaTemporal(t),
    ventana: () => null,
    showAchievement: (a) => pasó.avisos.push(a.name),
    sendSummary: () => pasó.resumen++,
    pushGamesSoon: () => pasó.juegos++,
    ensureCustomFolders: () => {},
    refreshMedia: () => {},
    send: (canal, texto) => canal === 'toast' && pasó.toasts.push(texto),
  });
  return pasó;
}

test('agrega los juegos de la carpeta de RetroArch y esconde los que ya no están', (t) => {
  const ra = retroarchFalso(t);
  const config = { data: { emulators: { gba: { exe: ra.exe } } }, games: [] };
  const pasó = contexto(t, config);
  const r = juegos.syncEmulatorGames('gba');
  assert.deepEqual([r.added, r.total], [2, 2]);
  const fire = config.games.find((g) => g.name === 'Pokemon - FireRed Version');
  assert.equal(fire.type, 'emulator');
  assert.equal(fire.emulator, 'gba');
  assert.deepEqual(fire.args.slice(0, 1), ['-L']);
  assert.ok(pasó.guardado > 0 && pasó.juegos > 0);
  fs.rmSync(path.join(ra.roms, 'Otro Juego (Europe).gba'));
  assert.equal(juegos.syncEmulatorGames('gba').added, 0);
  assert.equal(config.games.find((g) => g.name === 'Otro Juego').uninstalled, true, 'el borrado se esconde');
  assert.equal(fire.uninstalled, undefined);
});

test('sin el núcleo mGBA avisa cuál falta; sin juegos lo dice', async (t) => {
  const ra = retroarchFalso(t);
  fs.rmSync(path.join(path.dirname(ra.exe), 'cores', 'mgba_libretro.dll'));
  const config = { data: { emulators: { gba: { exe: ra.exe } } }, games: [] };
  const pasó = contexto(t, config);
  assert.match(juegos.syncEmulatorGames('gba').problem, /mGBA/);
  await juegos.addEmulatorGames('gba');
  assert.match(pasó.toasts[0], /mGBA/);
});

test('mientras juegas en RetroArch: un logro en su registro sale al instante (y el registro se borra al cerrar)', async (t) => {
  const ra = retroarchFalso(t);
  const config = { data: { emulators: { gba: { exe: ra.exe } } }, games: [] };
  const lista = [{ id: '1', name: 'A Rocky Battle', icon: 'x', points: 10 }];
  const retro = {
    connected: true,
    key: (id) => `ra-${id}`,
    achievements: async () => ({ list: lista }),
    liveUnlock: (key, id, title) => (id === '1' ? { name: title } : null),
    lastPlayed: async () => null,
    newUnlocks: async () => [],
    findGame: async () => null, // al agregar juegos busca su número por el nombre
    refreshTotals: () => {},
    seen: null,
  };
  const pasó = contexto(t, config, retro);
  juegos.syncEmulatorGames('gba');
  const fire = config.games.find((g) => g.name === 'Pokemon - FireRed Version');
  fire.raId = 515;
  const extra = juegos.startRetroLog(fire);
  assert.equal(extra[0], '--verbose');
  const log = extra[1].replace('--log-file=', '');
  fs.writeFileSync(log, '[INFO] [RCHEEVOS] Identified game: 515 "Pokémon FireRed Version" (x)\r\n[INFO] [RCHEEVOS] Awarding achievement 1: A Rocky Battle\r\n');
  for (let i = 0; i < 30 && !pasó.avisos.length; i++) await new Promise((r) => setTimeout(r, 100));
  assert.deepEqual(pasó.avisos, ['A Rocky Battle']);
  // Se cierra el juego: retroTick deja de leer el registro y lo borra
  await juegos.retroTick(fire); // empieza la sesión
  await juegos.retroTick(null); // ya no hay juego abierto
  assert.equal(fs.existsSync(log), false);
});

test('sin RetroAchievements conectado no agrega nada al abrir el emulador', (t) => {
  const ra = retroarchFalso(t);
  const config = { data: { emulators: { gba: { exe: ra.exe } } }, games: [] };
  contexto(t, config, { connected: false });
  juegos.syncEmulatorGames('gba');
  assert.deepEqual(juegos.startRetroLog(config.games[0]), []);
});
