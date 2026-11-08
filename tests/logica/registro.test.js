// Registro de errores (cache\nostalhub.log): formato, que no crezca sin fin y que nunca haga caer la app.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const registro = require('../../src/registro');
const { carpetaTemporal } = require('../ayuda/temporal');

test('anota la hora, dónde pasó y el mensaje del error', (t) => {
  const dir = carpetaTemporal(t);
  t.mock.method(console, 'warn', () => {});
  registro.iniciar(dir);
  registro.anotar('steam', new Error('no se puede vigilar la carpeta'));
  registro.anotar('retro', 'texto suelto');
  const lineas = fs.readFileSync(path.join(dir, 'cache', 'nostalhub.log'), 'utf8').trim().split(/\r?\n/);
  assert.equal(lineas.length, 2);
  assert.match(lineas[0], /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d {2}\[steam\] no se puede vigilar la carpeta$/);
  assert.match(lineas[1], /\[retro\] texto suelto$/);
});

test('cuando pasa de 500 KB empieza uno nuevo y guarda el anterior', (t) => {
  const dir = carpetaTemporal(t);
  t.mock.method(console, 'warn', () => {});
  registro.iniciar(dir);
  const archivo = path.join(dir, 'cache', 'nostalhub.log');
  fs.mkdirSync(path.dirname(archivo), { recursive: true });
  fs.writeFileSync(archivo, 'x'.repeat(registro.MAX_BYTES + 10));
  registro.anotar('prueba', 'nuevo');
  assert.ok(fs.statSync(archivo).size < 200, 'el nuevo empieza chico');
  assert.ok(fs.existsSync(path.join(dir, 'cache', 'nostalhub.anterior.log')));
});

test('si no se puede escribir, no lanza error (solo la consola)', (t) => {
  const avisos = t.mock.method(console, 'warn', () => {});
  const dir = carpetaTemporal(t);
  fs.writeFileSync(path.join(dir, 'cache'), ''); // un archivo donde debería ir la carpeta cache
  registro.iniciar(dir);
  assert.doesNotThrow(() => registro.anotar('prueba', 'algo'));
  assert.equal(avisos.mock.callCount(), 1);
  assert.ok(fs.statSync(path.join(dir, 'cache')).isFile(), 'no escribió nada');
});
