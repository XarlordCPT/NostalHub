// Emuladores: nombres de los juegos, buscar archivos, opciones de RetroArch y leer su registro.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { EMULATORS, scanFolders, gameName, gameId, tailFile } = require('../../src/emulators');
const { carpetaTemporal, escribir } = require('../ayuda/temporal');

test('nombre e id de un juego por su archivo', () => {
  assert.equal(gameName('C:\\PS2\\Guitar Hero (USA).iso'), 'Guitar Hero');
  assert.equal(gameName('Pokemon - FireRed Version (USA, Europe) [b].gba'), 'Pokemon - FireRed Version');
  assert.equal(gameId('gba', 'C:\\x\\Pokémon Rojo (Esp).gba'), 'gba-pokemon-rojo-esp');
});

test('buscar juegos: solo sus extensiones, con subcarpetas si se pide', (t) => {
  const dir = carpetaTemporal(t);
  escribir(dir, { 'a.gba': '', 'b.GBA': '', 'leeme.txt': '', 'sub/c.gba': '', 'sub/d.iso': '' });
  const nombres = (l) => l.map((f) => path.basename(f)).sort();
  assert.deepEqual(nombres(scanFolders([{ dir, recursive: false }], ['.gba'])), ['a.gba', 'b.GBA']);
  assert.deepEqual(nombres(scanFolders([{ dir, recursive: true }], ['.gba'])), ['a.gba', 'b.GBA', 'c.gba']);
  assert.deepEqual(scanFolders([{ dir: path.join(dir, 'no-existe'), recursive: true }], ['.gba']), []);
});

test('RetroArch: carpeta de juegos con "~" (tu carpeta personal) y con ":" (la de RetroArch)', (t) => {
  const dir = carpetaTemporal(t);
  const exe = path.join(dir, 'retroarch.exe');
  escribir(dir, { 'retroarch.exe': '', 'retroarch.cfg': 'rgui_browser_directory = "~\\Juegos GBA"\nlibretro_directory = ":\\cores"\n' });
  assert.deepEqual(EMULATORS.gba.folders(exe), [{ dir: path.join(os.homedir(), 'Juegos GBA'), recursive: true }]);
  assert.match(EMULATORS.gba.args('C:\\j.gba', exe)[1], /cores[\\/]mgba_libretro\.dll$/);
  escribir(dir, { 'retroarch.cfg': 'rgui_browser_directory = "default"\n' });
  assert.deepEqual(EMULATORS.gba.folders(exe), [], '"default" = sin carpeta');
});

test('RetroArch: el aviso de logro y el juego se reconocen en su registro', () => {
  const live = EMULATORS.gba.liveLog;
  assert.deepEqual(live.unlock.exec('[INFO] [RCHEEVOS] Awarding achievement 1234: A Rocky Battle').slice(1), ['1234', 'A Rocky Battle']);
  assert.equal(live.game.exec('[INFO] [RCHEEVOS] Identified game: 515 "Pokémon FireRed Version" (abc)')[1], '515');
  assert.deepEqual(live.args('C:\\log.txt'), ['--verbose', '--log-file=C:\\log.txt']);
});

test('leer el registro mientras se escribe: líneas completas, \\r\\n y tildes cortadas a la mitad', async (t) => {
  const file = path.join(carpetaTemporal(t), 'gba.log');
  const lineas = [];
  const parar = tailFile(file, (l) => lineas.push(l), 50);
  t.after(parar);
  const espera = () => new Promise((r) => setTimeout(r, 150));
  await espera(); // todavía no existe: no pasa nada
  fs.appendFileSync(file, 'uno\r\ndos');
  await espera();
  assert.deepEqual(lineas, ['uno'], 'la línea sin terminar espera');
  const b = Buffer.from('\r\nMédico\r\n', 'utf8');
  const corte = b.indexOf(0xc3) + 1;
  fs.appendFileSync(file, b.subarray(0, corte));
  await espera();
  fs.appendFileSync(file, b.subarray(corte));
  await espera();
  assert.deepEqual(lineas, ['uno', 'dos', 'Médico']);
});
