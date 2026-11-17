// Emuladores: nombres de los juegos, buscar archivos, opciones de RetroArch y leer su registro.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { EMULATORS, scanFolders, gameName, gameId, tailFile, discSystem } = require('../../src/emulators');
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

// ---------- Dolphin (Wii) ----------
// Cabeceras de mentira: lo justo para saber si es de Wii o de GameCube
function cabecera(tipo) {
  const b = Buffer.alloc(0x60);
  if (tipo === 'rvz-wii' || tipo === 'rvz-gc') (b.write('RVZ\x01', 0, 'latin1'), b.writeUInt32BE(tipo === 'rvz-wii' ? 2 : 1, 0x48));
  if (tipo === 'iso-wii') b.writeUInt32BE(0x5d1c9ea3, 0x18);
  if (tipo === 'iso-gc') b.writeUInt32BE(0xc2339f3d, 0x1c);
  if (tipo === 'wbfs') b.write('WBFS', 0, 'latin1');
  return b;
}

test('Dolphin: sus carpetas (Dolphin.ini) y distinguir Wii de GameCube por la cabecera', (t) => {
  const dir = carpetaTemporal(t);
  const exe = path.join(dir, 'Dolphin', 'Dolphin.exe');
  escribir(dir, {
    'Dolphin/Dolphin.exe': '',
    'Dolphin/portable.txt': '', // portable: sus datos en Dolphin\User
    'Dolphin/User/Config/Dolphin.ini': '[General]\nISOPath0 = C:/Juegos/Wii\nISOPaths = 2\nISOPath1 = D:/Otros\nRecursiveISOPaths = True\n[Interface]\nX = 1\n',
  });
  assert.deepEqual(EMULATORS.wii.folders(exe, dir), [
    { dir: path.normalize('C:/Juegos/Wii'), recursive: true },
    { dir: path.normalize('D:/Otros'), recursive: true },
  ]);
  assert.equal(EMULATORS.wii.liveLog.file(exe, dir), path.join(dir, 'Dolphin', 'User', 'Logs', 'dolphin.log'));
  for (const [tipo, quees] of [['rvz-wii', 'wii'], ['rvz-gc', 'gc'], ['iso-wii', 'wii'], ['iso-gc', 'gc'], ['wbfs', 'wii'], ['nada', null]]) {
    const f = path.join(dir, `${tipo}.bin`);
    fs.writeFileSync(f, cabecera(tipo));
    assert.equal(discSystem(f), quees, tipo);
    assert.equal(EMULATORS.wii.only(f), quees !== 'gc', `${tipo}: los de GameCube no se agregan`);
  }
  assert.deepEqual(EMULATORS.wii.args('C:\\j.rvz'), ['-b', '-e', 'C:\\j.rvz']);
});

test('Dolphin: el logro y el juego se reconocen en su registro; se enciende solo con -C', () => {
  const live = EMULATORS.wii.liveLog;
  assert.deepEqual(live.unlock.exec('32:43:094 Core\\AchievementManager.cpp:85 I[RetroAchievements]: Awarding achievement 7051: Sling Star').slice(1), ['7051', 'Sling Star']);
  assert.equal(live.game.exec('32:43:094 Core\\AchievementManager.cpp:85 I[RetroAchievements]: Identified game: 189 "Super Mario Galaxy" (4e0d0d2f)')[1], '189');
  assert.equal(live.game.exec('I[RetroAchievements]: Identified game: 189 (4e0d0d2f)')[1], '189');
  assert.ok(live.args().every((a, i) => (i % 2 ? /^Logger\./.test(a) : a === '-C')), 'solo opciones de este momento (no cambia tu configuración)');
});

test('arte de emulador: si no está con el nombre del archivo, se busca con su primera región', () => {
  const { artNames, emulatorArtUrl } = require('../../src/media');
  assert.deepEqual(artNames('C:\\x\\Super Mario Galaxy (USA, Canada) (En,Fr,Es).rvz'), ['Super Mario Galaxy (USA, Canada) (En,Fr,Es)', 'Super Mario Galaxy (USA) (En,Fr,Es)', 'Super Mario Galaxy (USA)']);
  assert.deepEqual(artNames('Pokemon - FireRed Version (USA).gba'), ['Pokemon - FireRed Version (USA)']);
  assert.match(emulatorArtUrl('C:\\x.rvz', 'Nintendo_-_Wii', 'Named_Boxarts', 'Super Mario Galaxy (USA)'), /Nintendo_-_Wii\/master\/Named_Boxarts\/Super%20Mario%20Galaxy%20\(USA\)\.png$/);
});
