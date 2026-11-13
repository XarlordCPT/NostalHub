// Contador de horas (estadisticas.db): sesiones, PC suspendido y el resumen.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { PlayLog } = require('../../src/playlog');
const { carpetaTemporal } = require('../ayuda/temporal');

const MIN = 60 * 1000;
const juego = { id: 'steam-1', name: 'Juego', appId: '1' };

function nuevo(t) {
  let log = null;
  const dir = carpetaTemporal(t, () => log.dispose());
  log = new PlayLog(path.join(dir, 'estadisticas.db'));
  return log;
}
// Como la app: una revisión cada 15 s mientras el juego está abierto
function jugar(log, g, desde, minutos) {
  for (let ms = 0; ms <= minutos * MIN; ms += 15 * 1000) log.tick(g, desde + ms);
}
const sesiones = (log) => log.db.prepare('SELECT * FROM sessions ORDER BY started_at').all();

test('una sesión dura desde que se ve el juego hasta que se cierra', (t) => {
  const log = nuevo(t);
  const t0 = Date.now() - 30 * MIN;
  log.tick(juego, t0);
  log.tick(juego, t0 + MIN);
  log.tick(null, t0 + 2 * MIN);
  const s = sesiones(log);
  assert.equal(s.length, 1);
  assert.equal(s[0].ended_at - s[0].started_at, 2 * MIN);
});

test('abrir y cerrar al tiro (menos de 30 s) no cuenta', (t) => {
  const log = nuevo(t);
  const t0 = Date.now() - 10 * MIN;
  log.tick(juego, t0);
  log.tick(null, t0 + 20 * 1000);
  assert.equal(sesiones(log).length, 0);
});

test('PC suspendido (más de 3 min entre revisiones): corta la sesión donde quedó', (t) => {
  const log = nuevo(t);
  const t0 = Date.now() - 60 * MIN;
  log.tick(juego, t0);
  log.tick(juego, t0 + MIN);
  log.tick(juego, t0 + 30 * MIN); // volvió de suspender
  log.tick(null, t0 + 31 * MIN);
  const s = sesiones(log);
  assert.equal(s.length, 2);
  assert.equal(s[0].ended_at, t0 + MIN, 'la primera termina en la última revisión antes de suspender');
});

test('cambiar de juego cierra la sesión anterior', (t) => {
  const log = nuevo(t);
  const t0 = Date.now() - 20 * MIN;
  log.tick(juego, t0);
  log.tick({ id: 'otro', name: 'Otro' }, t0 + 2 * MIN);
  log.tick(null, t0 + 4 * MIN);
  assert.deepEqual(sesiones(log).map((s) => s.game_id), ['steam-1', 'otro']);
});

test('resumen "Todo": total, juegos y el más jugado', (t) => {
  const log = nuevo(t);
  const t0 = Date.now() - 90 * MIN;
  jugar(log, juego, t0, 40);
  log.tick(null, t0 + 40 * MIN + 1000);
  jugar(log, { id: 'otro', name: 'Otro' }, t0 + 41 * MIN, 10);
  log.tick(null, t0 + 51 * MIN + 1000);
  const r = log.stats('all', 0);
  assert.equal(r.ok, true);
  assert.equal(r.totalSec, 50 * 60 + 2);
  assert.equal(r.games, 2);
  assert.equal(r.top[0].name, 'Juego');
  assert.equal(r.longest.sec, 40 * 60 + 1); // termina en la revisión que ya no lo ve
});

test('períodos: semana de lunes a domingo, mes con sus días y año con 12 meses', (t) => {
  const log = nuevo(t);
  const jueves = new Date(2026, 10, 5, 12); // jueves 5 de noviembre de 2026
  const sem = log.period('week', 0, null, jueves);
  assert.equal(sem.from.getDay(), 1);
  assert.equal(sem.buckets.length, 7);
  assert.equal(log.period('month', 0, null, jueves).buckets.length, 30);
  assert.equal(log.period('year', 0, null, jueves).buckets.length, 12);
  assert.equal(log.period('week', -1, null, jueves).title, 'La semana pasada');
});

test('horas por juego (los que no son de Steam las muestran así): suma sus sesiones y la última vez', (t) => {
  const log = nuevo(t);
  const fortnite = { id: 'epic-fortnite', name: 'Fortnite' };
  const t0 = Date.now() - 5 * 60 * MIN;
  jugar(log, fortnite, t0, 60);
  log.tick(null, t0 + 61 * MIN);
  jugar(log, fortnite, t0 + 120 * MIN, 30); // otra sesión, todavía abierta: también cuenta
  const tot = log.totals();
  assert.equal(Math.round(tot.get('epic-fortnite').ms / MIN), 91); // 61 + 30 minutos
  assert.equal(tot.get('epic-fortnite').last, t0 + 150 * MIN);
  assert.equal(tot.get('steam-1'), undefined);
});
