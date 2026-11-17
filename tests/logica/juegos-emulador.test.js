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

// Un Dolphin de mentira (portable: sus datos en Dolphin\User) con un juego de Wii y uno de GameCube en la misma carpeta
function dolphinFalso(t) {
  const dir = carpetaTemporal(t);
  const roms = path.join(dir, 'roms');
  const wii = Buffer.alloc(0x60);
  wii.write('RVZ\x01', 0, 'latin1');
  wii.writeUInt32BE(2, 0x48);
  const gc = Buffer.from(wii);
  gc.writeUInt32BE(1, 0x48);
  escribir(dir, {
    'Dolphin/Dolphin.exe': '',
    'Dolphin/portable.txt': '',
    'Dolphin/User/Config/Dolphin.ini': `[General]\nISOPath0 = ${roms.replace(/\\/g, '/')}\nISOPaths = 1\n`,
    'Dolphin/User/Logs/dolphin.log': '',
  });
  fs.mkdirSync(roms);
  fs.writeFileSync(path.join(roms, 'Super Mario Galaxy (USA, Canada) (En,Fr,Es).rvz'), wii);
  fs.writeFileSync(path.join(roms, 'Un Juego de GameCube (USA).rvz'), gc);
  return { exe: path.join(dir, 'Dolphin', 'Dolphin.exe'), log: path.join(dir, 'Dolphin', 'User', 'Logs', 'dolphin.log') };
}

test('Dolphin: agrega solo los de Wii; el logro sale al instante desde su registro, que queda vacío como estaba', async (t) => {
  const dol = dolphinFalso(t);
  const config = { data: { emulators: { wii: { exe: dol.exe } } }, games: [] };
  const retro = {
    connected: true,
    key: (id) => `ra-${id}`,
    achievements: async () => ({ list: [] }),
    liveUnlock: (key, id, title) => (key === 'ra-189' && id === '7051' ? { name: title } : null),
    lastPlayed: async () => null,
    newUnlocks: async () => [],
    findGame: async () => null,
    refreshTotals: () => {},
    seen: null,
  };
  const pasó = contexto(t, config, retro);
  assert.equal(juegos.syncEmulatorGames('wii').added, 1);
  assert.deepEqual(config.games.map((g) => g.name), ['Super Mario Galaxy'], 'el de GameCube no se agrega');
  const smg = config.games[0];
  assert.deepEqual(smg.args.slice(0, 2), ['-b', '-e']);
  // Ya había algo de otra vez en el registro: eso no se vuelve a avisar
  fs.writeFileSync(dol.log, 'I[RetroAchievements]: Identified game: 189 (x)\r\nI[RetroAchievements]: Awarding achievement 7051: Viejo\r\n');
  fs.writeFileSync(dol.log, '');
  const extra = juegos.startRetroLog(smg);
  assert.equal(extra[0], '-C');
  fs.appendFileSync(dol.log, '1:2 Core\\AchievementManager.cpp:85 I[RetroAchievements]: Identified game: 189 (x)\r\n1:3 Core\\AchievementManager.cpp:85 I[RetroAchievements]: Awarding achievement 7051: Sling Star\r\n');
  for (let i = 0; i < 30 && !pasó.avisos.length; i++) await new Promise((r) => setTimeout(r, 100));
  assert.deepEqual(pasó.avisos, ['Sling Star']);
  await juegos.retroTick(smg);
  await juegos.retroTick(null); // se cerró el juego
  assert.ok(fs.existsSync(dol.log), 'el registro es de Dolphin: no se borra');
  assert.equal(fs.statSync(dol.log).size, 0, 'estaba vacío: queda vacío');
});

test('Dolphin: si su registro ya tenía algo, no se lee lo viejo ni se vacía al cerrar', async (t) => {
  const dol = dolphinFalso(t);
  const config = { data: { emulators: { wii: { exe: dol.exe } } }, games: [] };
  const retro = { connected: true, key: (id) => `ra-${id}`, achievements: async () => ({ list: [] }), liveUnlock: (k, id, title) => ({ name: title }), lastPlayed: async () => null, newUnlocks: async () => [], findGame: async () => null, refreshTotals: () => {}, seen: null };
  const pasó = contexto(t, config, retro);
  juegos.syncEmulatorGames('wii');
  const smg = config.games[0];
  smg.raId = 189;
  fs.writeFileSync(dol.log, 'I[RetroAchievements]: Awarding achievement 1: De otra vez\r\n');
  juegos.startRetroLog(smg);
  await new Promise((r) => setTimeout(r, 1200));
  assert.deepEqual(pasó.avisos, [], 'lo que ya estaba no se avisa');
  await juegos.retroTick(smg);
  await juegos.retroTick(null);
  assert.match(fs.readFileSync(dol.log, 'utf8'), /De otra vez/, 'no se toca lo que ya estaba');
});
