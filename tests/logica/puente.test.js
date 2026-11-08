// Cada función del puente (preload.js) tiene que existir también en los datos de prueba (renderer/mock.js), y cada
// canal que pide el puente tiene que estar en main.js. Si no, las pruebas de pantallas o la app real se rompen.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const leer = (f) => fs.readFileSync(path.join(__dirname, '..', '..', f), 'utf8');
const preload = leer('preload.js');
const mock = leer('renderer/mock.js');
const main = leer('main.js');

test('mock.js tiene todas las funciones de preload.js', () => {
  const funciones = [...new Set([...preload.matchAll(/^\s{2,4}([a-zA-Z]\w+)\s*:/gm)].map((m) => m[1]))];
  assert.ok(funciones.length > 40, 'se leyeron las funciones del puente');
  const faltan = funciones.filter((f) => !new RegExp(`\\b${f}\\s*[:(]`).test(mock));
  assert.deepEqual(faltan, [], 'agrégalas a renderer/mock.js');
});

test('cada canal que usa preload.js existe en main.js', () => {
  const canales = [...new Set([...preload.matchAll(/ipcRenderer\.(?:invoke|send)\('([^']+)'/g)].map((m) => m[1]))];
  const faltan = canales.filter((c) => !main.includes(`'${c}'`));
  assert.deepEqual(faltan, []);
});
