// config.json, el arte propio de cada juego y cómo se vigila un juego abierto (accesos de Epic, Volver al menú).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
require('../ayuda/electron-falso');
const { Config, normalizeGame, detectType } = require('../../src/config');
const media = require('../../src/media');
const { Launcher } = require('../../src/launcher');
const { carpetaTemporal, escribir } = require('../ayuda/temporal');

test('tipo de juego según su ruta', () => {
  assert.equal(detectType('steam://rungameid/570'), 'steam');
  assert.equal(detectType('com.epicgames.launcher://apps/x'), 'url');
  assert.equal(detectType('C:\\Juegos\\a.exe'), 'exe');
  assert.equal(detectType('C:\\Users\\x\\Desktop\\Fortnite.url'), 'shortcut');
});

test('normalizeGame: id, número de Steam y datos de emulador', () => {
  assert.equal(normalizeGame({ name: 'Dota', target: 'steam://rungameid/570' }).id, 'steam-570');
  assert.equal(normalizeGame({ name: 'Pokémon Rojo!' }, 0).id, 'juego-pokemon-rojo');
  const emu = normalizeGame({ id: 'gba-x', name: 'X', type: 'emulator', emulator: 'gba', rom: 'C:\\x.gba', raId: 515 });
  assert.deepEqual([emu.emulator, emu.rom, emu.raId], ['gba', 'C:\\x.gba', 515]);
});

test('config.json roto: se respalda y no se guarda encima', (t) => {
  const dir = carpetaTemporal(t);
  escribir(dir, { 'config.json': '{ "games": [ roto' });
  const c = new Config(dir);
  const errores = t.mock.method(console, 'error', () => {});
  c.load();
  assert.ok(c.broken);
  assert.equal(errores.mock.callCount(), 1);
  c.save();
  assert.equal(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'), '{ "games": [ roto', 'no lo pisó');
  assert.ok(fs.readdirSync(dir).some((f) => /^config\.roto-\d+\.json$/.test(f)), 'quedó la copia');
});

test('config.json bien: guarda y vuelve a leer lo mismo', (t) => {
  const dir = carpetaTemporal(t);
  const c = new Config(dir);
  c.load();
  c.data.games.push(normalizeGame({ name: 'Juego', target: 'C:\\j.exe' }, 0));
  c.save();
  const d = new Config(dir);
  d.load();
  assert.equal(d.findGame('juego-juego').name, 'Juego');
  assert.ok(!fs.existsSync(path.join(dir, 'config.json.tmp')));
});

test('arte propio: reconoce cada archivo por su nombre y extensión', (t) => {
  const dir = carpetaTemporal(t);
  escribir(dir, { 'canal.webp': '', 'Logo.PNG': '', 'musica.mp3': '', 'fondo.txt': '', 'otro.png': '' });
  const f = media.findCustomFiles(dir);
  assert.deepEqual(Object.keys(f).sort(), ['logo', 'music', 'tile']);
  assert.deepEqual(media.findCustomFiles(path.join(dir, 'no-existe')), {});
  assert.equal(media.safeId('steam-1/2:3'), 'steam-1_2_3');
  assert.equal(media.emulatorArtUrl('C:\\Guitar Hero: Rocks (USA).iso', 'Sony_-_PlayStation_2', 'Named_Boxarts'), 'https://raw.githubusercontent.com/libretro-thumbnails/Sony_-_PlayStation_2/master/Named_Boxarts/Guitar%20Hero_%20Rocks%20(USA).png');
});

test('acceso .url de Epic: vigila los programas de la carpeta del juego', (t) => {
  const dir = carpetaTemporal(t);
  escribir(dir, {
    'Juego/Win64/JuegoBootstrapper.exe': '',
    'Juego/Win64/JuegoClient-Win64-Shipping.exe': '',
    'Juego/Win64/CrashReportClient.exe': '',
    'Tienda/EpicGamesLauncher.exe': '',
    'Juego.url': `[InternetShortcut]\r\nURL=com.epicgames.launcher://apps/x\r\nIconFile=${path.join(dir, 'Juego', 'Win64', 'JuegoBootstrapper.exe')}\r\n`,
    'Tienda.url': `[InternetShortcut]\r\nIconFile=${path.join(dir, 'Tienda', 'EpicGamesLauncher.exe')}\r\n`,
    'Icono.url': '[InternetShortcut]\r\nIconFile=C:\\algo.ico\r\n',
  });
  const l = new Launcher(() => {});
  if (process.platform !== 'win32') return t.skip('solo en Windows');
  assert.deepEqual(l.urlShortcutPrograms(path.join(dir, 'Juego.url')).sort(), ['JuegoBootstrapper.exe', 'JuegoClient-Win64-Shipping.exe']);
  assert.equal(l.urlShortcutPrograms(path.join(dir, 'Tienda.url')), null, 'el programa de la tienda no se vigila');
  assert.equal(l.urlShortcutPrograms(path.join(dir, 'Icono.url')), null);
  assert.equal(l.urlShortcutPrograms(path.join(dir, 'no-es.lnk')), null);
});

test('Volver al menú: deja de esperar pero sigue contando; al cerrar no avisa de nuevo', async () => {
  const avisos = [];
  const l = new Launcher((id, reason) => avisos.push([id, reason]));
  l.startedAt = Date.now() - 60 * 1000;
  l.session = { gameId: 'juego', seen: true };
  l.dismiss();
  assert.equal(l.playingId(), 'juego', 'las horas siguen');
  l.end('juego', 'exited');
  await new Promise((r) => setTimeout(r, 20));
  assert.deepEqual(avisos, []);
  assert.equal(l.playingId(), null);
  l.session = { gameId: 'otro', seen: true };
  l.end('otro', 'exited');
  await new Promise((r) => setTimeout(r, 20));
  assert.deepEqual(avisos, [['otro', 'exited']], 'sin Volver al menú sí avisa');
});
