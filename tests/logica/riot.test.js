// Juegos de Riot: encontrar el Riot Client y los juegos (carpeta de Riot falsa), agregarlos sin repetir y vigilar
// League of Legends con programas de mentira (copias de ping.exe): las horas cuentan solo en la partida, no en el lobby.
// No abre ningún juego de verdad.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
require('../ayuda/electron-falso');
const riot = require('../../src/riot');
const biblioteca = require('../../src/biblioteca');
const { Launcher } = require('../../src/launcher');
const { carpetaTemporal, escribir } = require('../ayuda/temporal');

// Una carpeta de Riot de mentira: el Riot Client, VALORANT y League of Legends instalados (TFT anotado pero borrado)
function riotFalso(t) {
  const dir = carpetaTemporal(t);
  const client = path.join(dir, 'Riot Client', 'RiotClientServices.exe');
  const lol = path.join(dir, 'League of Legends');
  escribir(dir, {
    'Riot Client/RiotClientServices.exe': '',
    'VALORANT/live/VALORANT.exe': '',
    'League of Legends/LeagueClient.exe': '',
    'RiotClientInstalls.json': JSON.stringify({ rc_default: client.replace(/\\/g, '/') }),
    'Metadata/valorant.live/valorant.live.product_settings.yaml': `product_install_full_path: "${path.join(dir, 'VALORANT', 'live').replace(/\\/g, '/')}"\n`,
    // Riot a veces escribe la ruta con \\ (así está en un PC real)
    'Metadata/league_of_legends.live/league_of_legends.live.product_settings.yaml': `product_install_full_path: "${lol.replace(/\\/g, '\\\\')}"\nshortcut_name: "League of Legends.lnk"\n`,
    'Metadata/teamfighttactics.live/teamfighttactics.live.product_settings.yaml': `product_install_full_path: "${path.join(dir, 'TFT-borrado')}"\n`,
  });
  return { dir, client };
}

test('encuentra el Riot Client y solo los juegos que están instalados', (t) => {
  const { dir, client } = riotFalso(t);
  assert.equal(riot.riotClient(dir), path.normalize(client));
  assert.deepEqual(riot.installedProducts(dir).map((p) => p.id).sort(), ['league_of_legends', 'valorant']);
  assert.equal(riot.riotClient(path.join(dir, 'no-existe')), null);
  assert.deepEqual(riot.installedProducts(path.join(dir, 'no-existe')), []);
});

test('agregar juegos de Riot: con el Riot Client, sin repetirlos', (t) => {
  const { dir, client } = riotFalso(t);
  const toasts = [];
  const config = { games: [], save() {} };
  biblioteca.registrar({ config, steamUser: () => null, mediaDir: '', ventana: () => null, ensureCustomFolders() {}, pushGamesSoon() {}, send: (c, x) => c === 'toast' && toasts.push(x) });
  biblioteca.addRiotGames(dir);
  assert.deepEqual(config.games.map((g) => [g.id, g.name, g.type, g.product]).sort(), [
    ['riot-league_of_legends', 'League of Legends', 'riot', 'league_of_legends'],
    ['riot-valorant', 'VALORANT', 'riot', 'valorant'],
  ]);
  assert.ok(config.games.every((g) => g.target === path.normalize(client) && g.patchline === 'live'));
  assert.equal(toasts.at(-1), 'Se agregaron 2 juegos de Riot');
  biblioteca.addRiotGames(dir);
  assert.equal(config.games.length, 2);
  assert.equal(toasts.at(-1), 'Tus juegos de Riot ya estaban');
  biblioteca.addRiotGames(path.join(dir, 'no-existe'));
  assert.equal(toasts.at(-1), 'No se encontró el Riot Client');
});

test('"Jugar" por la conexión local del Riot Client: ruta, método y contraseña del lockfile', async (t) => {
  const dir = carpetaTemporal(t);
  const lockfile = path.join(dir, 'lockfile');
  fs.writeFileSync(lockfile, 'Riot Client:1234:51234:clave-temporal:https');
  const pedidos = [];
  const pedir = async (o) => (pedidos.push(o), 200);
  assert.equal(await riot.launchProduct('teamfighttactics', 'live', { lockfile, pedir }), true);
  assert.equal(pedidos[0].method, 'POST');
  assert.equal(pedidos[0].host, '127.0.0.1');
  assert.equal(pedidos[0].port, 51234);
  assert.equal(pedidos[0].path, '/product-launcher/v1/products/teamfighttactics/patchlines/live');
  assert.equal(pedidos[0].headers.Authorization, 'Basic ' + Buffer.from('riot:clave-temporal').toString('base64'));
  assert.equal(await riot.launchProduct('valorant', 'live', { lockfile, pedir: async () => 404 }), false, 'si no acepta: false');
  assert.equal(await riot.launchProduct('valorant', 'live', { lockfile, pedir: async () => null }), false, 'si no responde: false');
  assert.equal(await riot.launchProduct('valorant', 'live', { lockfile: path.join(dir, 'no-existe'), pedir }), false, 'Riot Client cerrado: false');
  // Reintenta hasta que acepta, y para si el juego ya se abrió
  let veces = 0;
  assert.equal(await riot.launchWhenReady('valorant', 'live', () => true, { lockfile, pedir: async () => (++veces < 3 ? null : 200), cadaMs: 5 }), true);
  assert.equal(veces, 3);
  assert.equal(await riot.launchWhenReady('valorant', 'live', () => false, { lockfile, pedir }), false, 'ya abierto: no pide nada');
});

test('League of Legends: con el lobby abierto no cuenta horas; en la partida sí', { skip: process.platform !== 'win32' }, async (t) => {
  const procesos = [];
  const dir = carpetaTemporal(t, () => procesos.forEach((p) => p.kill())); // cerrarlos antes de borrar la carpeta
  const ping = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'PING.EXE');
  const copia = (nombre) => (fs.copyFileSync(ping, path.join(dir, nombre)), path.join(dir, nombre));
  const lobby = copia('LeagueClient.exe');
  const partida = copia('League of Legends.exe');
  const clienteRiot = copia('RiotClientServices.exe'); // el "Riot Client": ping con argumentos raros termina al tiro
  const abrir = (exe, s) => spawn(exe, ['-n', String(s), '127.0.0.1'], { stdio: 'ignore', windowsHide: true });
  // ¡Nunca el Riot Client de verdad! (con él abierto, "Jugar" abriría el LoL real en medio de las pruebas)
  const ordenes = [];
  t.mock.method(riot, 'launchProduct', async (prod) => (ordenes.push(prod), false));
  t.mock.method(riot, 'launchWhenReady', async (prod) => (ordenes.push(`${prod} (reintentar)`), false));
  const l = new Launcher(() => {});
  t.after(() => l.stopWatching());
  const res = await l.launch({ id: 'riot-league_of_legends', type: 'riot', product: 'league_of_legends', patchline: 'live', target: clienteRiot });
  assert.equal(res.tracking, true);
  assert.deepEqual(ordenes, ['league_of_legends', 'league_of_legends (reintentar)'], 'pidió "Jugar"; como no se pudo, abre el Riot Client y reintenta');
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  procesos.push(abrir(lobby, 20));
  await espera(4000);
  assert.equal(l.playingId(), null, 'en el lobby no cuentan las horas');
  assert.ok(l.session, 'pero el juego sigue abierto (no vuelve al menú)');
  procesos.push(abrir(partida, 20));
  await espera(4000);
  assert.equal(l.playingId(), 'riot-league_of_legends', 'en la partida sí');
  procesos.at(-1).kill();
  await espera(4000);
  assert.equal(l.playingId(), null, 'terminó la partida: deja de contar');
  assert.ok(l.session, 'con el lobby abierto sigue "jugando"');
});
