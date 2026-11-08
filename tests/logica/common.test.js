// Ayudantes de renderer/common.js que usan todas las consolas (sin abrir la app).
const test = require('node:test');
const assert = require('node:assert/strict');
const { cargarCommon } = require('../ayuda/common-sin-pantalla');

const U = cargarCommon();
// Lo que devuelve common.js viene de otro "mundo" de JavaScript: se copia para compararlo
const plano = (x) => JSON.parse(JSON.stringify(x));
const logro = (id, extra) => ({ id, name: id, done: false, ...extra });

test('textos: horas jugadas, escapar HTML y logros secretos', () => {
  assert.equal(U.hours(0), '');
  assert.equal(U.hours(45), '45 min jugados');
  assert.equal(U.hours(150), '2,5 h jugadas');
  assert.equal(U.escapeHtml('<b>"A & B"</b>'), '&lt;b&gt;&quot;A &amp; B&quot;&lt;/b&gt;');
  assert.equal(U.escapeHtml("Baldur's Gate"), 'Baldur&#39;s Gate', 'también la comilla simple');
  assert.equal(U.escapeHtml(0), '0', 'el 0 se muestra');
  assert.equal(U.escapeHtml(null), '');
  assert.equal(U.pad2(7), '07');
  const t = U.achievementTexts({ name: 'Real', description: 'x', hidden: true, done: false });
  assert.equal(t.name, 'Logro secreto');
  assert.equal(U.achievementTexts({ name: 'Real', hidden: true, done: true, unlockTime: Date.UTC(2026, 10, 8, 12) }).name, 'Real');
});

test('juego completo: solo con todos sus logros', () => {
  assert.equal(U.isComplete({ done: 5, total: 5 }), true);
  assert.equal(U.isComplete({ done: 4, total: 5 }), false);
  assert.equal(U.isComplete({ done: 0, total: 0 }), false);
  assert.equal(U.completeKey({ perGame: { a: { done: 1, total: 1 }, b: { done: 0, total: 2 }, c: { done: 3, total: 3 } } }), 'a,c');
});

test('orden de logros: por set (juego base primero) y dentro, desbloqueados recientes arriba', () => {
  const lista = [
    logro('dlc-1', { set: 'DLC' }),
    logro('base-viejo', { done: true, unlockTime: 1 }),
    logro('base-bloq'),
    logro('dlc-2', { set: 'DLC', done: true, unlockTime: 5 }),
    logro('base-nuevo', { done: true, unlockTime: 9 }),
  ];
  assert.deepEqual(plano(U.sortAchievements(lista).map((a) => a.id)), ['base-nuevo', 'base-viejo', 'base-bloq', 'dlc-2', 'dlc-1']);
  assert.deepEqual(plano(U.sortAchievements(null)), []);
});

test('títulos de sets: uno antes de cada set, y ninguno si el juego tiene un solo set', () => {
  const orden = U.sortAchievements([logro('a', { done: true }), logro('b'), logro('c', { set: 'DLC', done: true })]);
  assert.deepEqual(plano(U.achievementSetHead(orden, 0)), { name: 'Juego base', done: 1, total: 2 });
  assert.equal(U.achievementSetHead(orden, 1), null);
  assert.deepEqual(plano(U.achievementSetHead(orden, 2)), { name: 'DLC', done: 1, total: 1 });
  assert.equal(U.achievementSetHead([logro('a'), logro('b')], 0), null);
  const conTitulos = U.withSetHeads(orden);
  assert.deepEqual(plano(conTitulos.map((x) => (x.sep ? `#${x.name}` : x.id))), ['#Juego base', 'a', 'b', '#DLC', 'c']);
  assert.match(U.setHeadHtml('x', { name: '<DLC>', done: 1, total: 2 }), /&lt;DLC&gt;.*1 \/ 2/);
});

test('moverse por una lista con títulos: nunca queda marcado un título', () => {
  const filas = [{ sep: true }, { id: 'a' }, { id: 'b' }, { sep: true }, { id: 'c' }];
  assert.equal(U.skipSetHead(filas, 0, 1), 1);
  assert.equal(U.skipSetHead(filas, 3, 1), 4);
  assert.equal(U.skipSetHead(filas, 3, -1), 2);
  assert.equal(U.skipSetHead(filas, 0, -1), 1, 'arriba del todo: vuelve al primero que se puede marcar');
  assert.equal(U.skipSetHead(filas, 99, 1), 4);
  const conClase = (sep) => ({ classList: { contains: (c) => sep && c === 'sep' } });
  assert.equal(U.skipSetHead([conClase(true), conClase(false)], 0, 1), 1, 'también con elementos de la página');
  assert.equal(U.skipSetHead([], 3, 1), 3);
});

test('orden de juegos por consola: modos y guardado', () => {
  const o = U.gameOrder('prueba', { manual: true, def: 'recent' });
  assert.equal(o.mode, 'recent');
  const juegos = [
    { id: 'b', name: 'Beta', lastPlayed: 1, playtimeMin: 50 },
    { id: 'a', name: 'alfa', lastPlayed: 3, playtimeMin: 10 },
  ];
  assert.deepEqual(plano(o.apply(juegos, {}).map((g) => g.id)), ['a', 'b']);
  o.set('name');
  assert.deepEqual(plano(o.apply(juegos, {}).map((g) => g.id)), ['a', 'b']);
  o.set('hours');
  assert.deepEqual(plano(o.apply(juegos, {}).map((g) => g.id)), ['b', 'a']);
  assert.equal(U.gameOrder('prueba', { manual: true, def: 'recent' }).mode, 'hours', 'se guarda por consola');
});
