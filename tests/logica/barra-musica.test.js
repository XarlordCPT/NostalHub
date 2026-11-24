// src/barra-musica.js sin abrir ventanas: atajos válidos, dónde va la barra en la pantalla y cambiar un atajo desde Ajustes
const test = require('node:test');
const assert = require('node:assert/strict');
const { handlers } = require('../ayuda/electron-falso');
const barra = require('../../src/barra-musica');

test('atajo válido: con Ctrl o Alt y una tecla que sirva', () => {
  for (const ok of ['Control+Alt+M', 'Control+Alt+Space', 'Alt+Shift+F5', 'Control+Right', 'Control+Alt+7']) assert.equal(barra.atajoValido(ok), true, ok);
  for (const malo of ['M', 'Shift+M', 'F5', 'Control+Alt', 'Control+Control+M', 'Control+Alt+Ñ', 'Super+M', '']) assert.equal(barra.atajoValido(malo), false, malo);
});

test('atajos guardados: se completan con los de por defecto y se ignoran los que no sirven', () => {
  const k = barra.atajos({ next: 'Control+Alt+N', prev: 'X', otro: 'Control+Alt+O' });
  assert.equal(k.next, 'Control+Alt+N');
  assert.equal(k.prev, barra.POR_DEFECTO.prev);
  assert.equal(k.otro, undefined);
  assert.equal(barra.texto('Control+Alt+Right'), 'Ctrl + Alt + →');
});

test('dónde va: los 6 lugares fijos, el que dejaste al moverla y nunca fuera de la pantalla', () => {
  const pantalla = { x: 1920, y: 0, width: 1920, height: 1080 }; // la segunda pantalla, a la derecha
  const arriba = barra.lugar('tc', null, pantalla, 1);
  assert.deepEqual(arriba, { x: 1920 + (1920 - 900) / 2, y: 16, width: 900, height: 330 });
  assert.equal(barra.lugar('tl', null, pantalla, 1).x, 1920 + 16);
  assert.equal(barra.lugar('br', null, pantalla, 1).x, 1920 + 1920 - 900 - 16);
  assert.equal(barra.lugar('bc', null, pantalla, 1).y, 1080 - 330 - 16);
  assert.deepEqual(barra.lugar('cualquiera', null, pantalla, 1), arriba, 'si no se entiende: arriba al centro');
  // Movida a mano: se guarda como fracción de la pantalla y vuelve al mismo lugar (también con otra resolución)
  const f = barra.fraccion({ x: 1920 + 480, y: 540 }, pantalla);
  assert.deepEqual(f, { x: 0.25, y: 0.5 });
  assert.deepEqual(barra.lugar('free', f, pantalla, 1), { x: 2400, y: 540, width: 900, height: 330 });
  const k4 = barra.lugar('free', f, { x: 0, y: 0, width: 3840, height: 2160 }, 2);
  assert.deepEqual([k4.x, k4.y, k4.width], [960, 1080, 1800]);
  assert.equal(barra.lugar('free', { x: 0.99, y: 0.99 }, pantalla, 1).x, 1920 + 1920 - 900, 'no se sale');
});

test('forma: arriba la letra se abre hacia abajo; abajo, hacia arriba', () => {
  assert.deepEqual(barra.forma('tc'), { v: 'top', h: 'center' });
  assert.deepEqual(barra.forma('bl'), { v: 'bottom', h: 'left' });
  assert.deepEqual(barra.forma('free', { x: 0.7, y: 0.8 }), { v: 'bottom', h: 'right' });
});

test('cambiar un atajo desde Ajustes: no deja repetir otro ni uno sin Ctrl/Alt; Supr vuelve al de por defecto', async () => {
  const config = { data: {}, save() {} };
  barra.registrar({ config, dir: __dirname, spotify: { view: () => ({}), watch() {} }, pickDisplay: () => null, send() {}, anotar() {}, mostrarVentana() {} });
  const set = handlers.get('musicbar:key-set');
  assert.equal((await set(null, 'next', 'Control+Alt+B')).ok, false, 'Ctrl+Alt+B ya es mostrar la barra');
  assert.equal((await set(null, 'next', 'N')).ok, false);
  const r = await set(null, 'next', 'Control+Alt+N');
  assert.equal(r.ok, true);
  assert.equal(config.data.musicBar.keys.next, 'Control+Alt+N');
  assert.equal((await set(null, 'next', null)).keys.next, 'Control+Alt+Right');
  const keys = await handlers.get('musicbar:keys')();
  assert.equal(keys.actions.length, 6);
  assert.deepEqual(keys.busy, []);
});

test('lugar y tamaño desde la ventanita de opciones: solo valores que existen', async () => {
  const config = { data: {}, save() {} };
  barra.registrar({ config, dir: __dirname, spotify: { view: () => ({}), watch() {} }, pickDisplay: () => null, send() {}, anotar() {}, mostrarVentana() {} });
  const get = handlers.get('musicbar:get');
  assert.deepEqual([get().pos, get().size], ['tc', 'm']);
  assert.equal(get().positions.some((p) => p.id === 'free'), false, '"donde la dejaste" recién aparece después de moverla');
  const set = handlers.get('musicbar:set');
  set(null, 'size', 'l');
  set(null, 'pos', 'br');
  set(null, 'pos', 'free'); // todavía no la movió: no cambia
  set(null, 'size', 'gigante');
  assert.deepEqual([config.data.musicBar.pos, config.data.musicBar.size], ['br', 'l']);
  assert.equal(barra.escala('l'), 1.25);
  assert.equal(barra.escala('raro'), 1);
});
