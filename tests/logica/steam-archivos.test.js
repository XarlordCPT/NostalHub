// Lectura de los archivos de Steam: texto (.vdf/.acf), binario (shortcuts.vdf) y logros (UserGameStats*.bin).
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { parseVdf } = require('../../src/vdf');
const { parseBinaryVdf } = require('../../src/steam');
const { parseKV, AchievementWatcher, gamerscore, trophyTier } = require('../../src/achievements');
const { kvBinario } = require('../ayuda/kv-binario');
const { carpetaTemporal, escribir } = require('../ayuda/temporal');

test('vdf de texto: bloques, comentarios y comillas escapadas', () => {
  const d = parseVdf(`
    // comentario
    "AppState"
    {
      "appid"   "1205450"
      "name"    "Turnip \\"Boy\\""
      "UserConfig" { "language" "spanish" }
    }`);
  assert.equal(d.AppState.appid, '1205450');
  assert.equal(d.AppState.name, 'Turnip "Boy"');
  assert.equal(d.AppState.UserConfig.language, 'spanish');
});

test('shortcuts.vdf binario: claves en minúscula y números', () => {
  const buf = kvBinario({ shortcuts: { 0: { AppName: 'Fortnite', Exe: '"C:\\Juegos\\f.exe"', appid: 123 } } });
  const d = parseBinaryVdf(buf);
  assert.equal(d.shortcuts['0'].appname, 'Fortnite');
  assert.equal(d.shortcuts['0'].exe, '"C:\\Juegos\\f.exe"');
  assert.equal(d.shortcuts['0'].appid, 123);
});

test('archivo de logros: se lee completo y uno cortado da error (no se lee a medias)', () => {
  const buf = kvBinario({ cache: { 1: { data: 5, AchievementTimes: { 0: 100, 2: 200 } } } });
  assert.equal(parseKV(buf).cache['1'].data, 5);
  assert.throws(() => parseKV(buf.subarray(0, buf.length - 6)));
});

test('sets de Steam: los logros con grupo llevan el nombre del set; los del juego base no', (t) => {
  const dir = carpetaTemporal(t);
  const schema = {
    1205450: {
      stats: {
        1: {
          type: 'ACHIEVEMENTS',
          bits: {
            0: { name: 'DOCUMENT_BILL', display: { name: { english: 'Tax evader' } } },
            1: { name: 'GAME_TRAIN', display: { name: { english: 'Conductor' } }, groupid: 1 },
          },
        },
      },
      groups: { 1: { name: { english: 'The Sunset Station', token: 'GROUP_1_NAME' } } },
    },
    999: { stats: { 1: { type: 'ACHIEVEMENTS', bits: { 0: { name: 'A' } } } } },
  };
  escribir(dir, {
    'UserGameStatsSchema_1205450.bin': kvBinario({ 1205450: schema[1205450] }),
    'UserGameStatsSchema_999.bin': kvBinario({ 999: schema[999] }),
  });
  const w = new AchievementWatcher({ onUnlock() {} });
  w.dir = dir;
  assert.deepEqual([...w.setsOf('1205450')], [['GAME_TRAIN', 'The Sunset Station']]);
  assert.equal(w.setsOf('999').size, 0, 'sin grupos: sin sets');
  assert.equal(w.setsOf('404').size, 0, 'sin archivo: sin sets y sin error');
  w.dir = null;
  assert.equal(w.setsOf('1205450').size, 0, 'sin carpeta de Steam: sin sets');
  void path;
});

test('puntos G y copa según qué tan raro es el logro', () => {
  assert.equal(gamerscore(60), 10);
  assert.equal(gamerscore(0.5), 100);
  assert.equal(gamerscore(null), 20);
  assert.equal(trophyTier(2), 'gold');
  assert.equal(trophyTier(10), 'silver');
  assert.equal(trophyTier(50), 'bronze');
  assert.equal(trophyTier(undefined), 'bronze');
});
