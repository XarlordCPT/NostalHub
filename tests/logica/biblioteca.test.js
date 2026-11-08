// src/biblioteca.js: separar las opciones de inicio de un juego y "Agregar juego o programa" (con la ventana de
// Windows falsa). No toca tu Steam ni tu config.json.
const test = require('node:test');
const assert = require('node:assert/strict');
const { dialog } = require('../ayuda/electron-falso');
const biblioteca = require('../../src/biblioteca');

test('opciones de inicio de Steam: comillas y espacios', () => {
  assert.deepEqual(biblioteca.splitArgs('--a b --c="d e" "f g"'), ['--a', 'b', '--c=d e', 'f g']);
  assert.deepEqual(biblioteca.splitArgs('-config="Mi Config" -fullscreen'), ['-config=Mi Config', '-fullscreen']);
  assert.deepEqual(biblioteca.splitArgs(''), []);
  assert.deepEqual(biblioteca.splitArgs(null), []);
});

function contexto() {
  const pasó = { toasts: [], guardado: 0 };
  const config = { games: [], save: () => pasó.guardado++ };
  biblioteca.registrar({ config, steamUser: () => null, mediaDir: '', ventana: () => null, ensureCustomFolders: () => {}, pushGamesSoon: () => {}, send: (c, t) => c === 'toast' && pasó.toasts.push(t) });
  return { config, pasó };
}

test('agregar juego o programa: con su tipo, sin repetirlo, y nada si cancelas', async (t) => {
  const { config, pasó } = contexto();
  t.mock.method(dialog, 'showOpenDialog', async () => ({ canceled: false, filePaths: ['C:\\Users\\x\\Desktop\\Fortnite.url'] }));
  await biblioteca.addGameFromFile();
  assert.equal(config.games.length, 1);
  assert.deepEqual([config.games[0].id, config.games[0].name, config.games[0].type], ['juego-fortnite', 'Fortnite', 'shortcut']);
  assert.equal(pasó.toasts.at(-1), 'Se agregó Fortnite');
  await biblioteca.addGameFromFile();
  assert.equal(config.games.length, 1, 'el mismo archivo no se agrega dos veces');
  assert.equal(pasó.toasts.at(-1), 'Ese juego ya estaba en la lista');
  dialog.showOpenDialog.mock.mockImplementation(async () => ({ canceled: false, filePaths: ['D:\\Otro\\Fortnite.exe'] }));
  await biblioteca.addGameFromFile();
  assert.equal(config.games[1].id, 'juego-fortnite-2', 'otro archivo con el mismo nombre: id distinto');
  assert.equal(config.games[1].type, 'exe');
  dialog.showOpenDialog.mock.mockImplementation(async () => ({ canceled: true, filePaths: [] }));
  await biblioteca.addGameFromFile();
  assert.equal(config.games.length, 2, 'cancelar no agrega nada');
});
