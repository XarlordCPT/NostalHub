// src/letras.js con un LRCLIB falso: letra sincronizada, otra versión de la canción, instrumental, sin internet
const test = require('node:test');
const assert = require('node:assert/strict');
const { Letras, parseLrc, limpiarTitulo, primerArtista, _cache } = require('../../src/letras');

// Responde según la ruta (get o search); anota qué se pidió
function lrclibFalso(respuestas) {
  const pedidos = [];
  const fetch = async (url) => {
    pedidos.push(url);
    const r = respuestas[new URL(url).pathname.split('/').pop()];
    if (r instanceof Error) throw r;
    if (r === undefined) return { status: 404, ok: false, json: async () => ({}) };
    return { status: 200, ok: true, json: async () => r };
  };
  return { fetch, pedidos };
}
test.beforeEach(() => _cache.clear());

test('LRC: la hora de cada línea (y una línea con varias horas)', () => {
  assert.deepEqual(parseLrc('[00:12.50] Hola\n[01:02.00][00:05.00] Coro\nsin hora\n[00:20.00]'), [
    { t: 5000, text: 'Coro' },
    { t: 12500, text: 'Hola' },
    { t: 20000, text: '' },
    { t: 62000, text: 'Coro' },
  ]);
});

test('nombre para buscar: sin "(feat. …)" ni "- Remastered", y el primer artista', () => {
  assert.equal(limpiarTitulo('Se Me Nota (feat. Omega)'), 'Se Me Nota');
  assert.equal(limpiarTitulo('Canción - Remastered 2011'), 'Canción');
  assert.equal(primerArtista('Tainy, Bad Bunny'), 'Tainy');
  assert.equal(primerArtista('Chimbala x Omega'), 'Chimbala');
});

test('la encuentra tal cual: letra sincronizada', async () => {
  const { fetch, pedidos } = lrclibFalso({ get: { duration: 232, syncedLyrics: '[00:01.00] Uno\n[00:03.00] Dos', plainLyrics: 'Uno\nDos' } });
  const r = await new Letras({ fetch }).buscar({ title: 'Mojabi Ghost', artist: 'Tainy, Bad Bunny', durationMs: 232000 });
  assert.equal(r.status, 'ok');
  assert.deepEqual(r.synced.map((l) => l.text), ['Uno', 'Dos']);
  assert.match(pedidos[0], /duration=232/);
});

test('buscando: solo acepta la que dura casi lo mismo (otra versión no) y prefiere la sincronizada', async () => {
  const { fetch } = lrclibFalso({
    search: [
      { duration: 300, syncedLyrics: '[00:01.00] En vivo' },
      { duration: 233, plainLyrics: 'Solo texto' },
      { duration: 231, syncedLyrics: '[00:01.00] Esta' },
    ],
  });
  const r = await new Letras({ fetch }).buscar({ title: 'X', artist: 'Y', durationMs: 232000 });
  assert.deepEqual(r.synced.map((l) => l.text), ['Esta']);
});

test('instrumental, no encontrada y sin internet', async () => {
  const inst = lrclibFalso({ get: { duration: 200, instrumental: true } });
  assert.equal((await new Letras({ fetch: inst.fetch }).buscar({ title: 'A', artist: 'B', durationMs: 200000 })).status, 'instrumental');
  const nada = lrclibFalso({ search: [] });
  assert.equal((await new Letras({ fetch: nada.fetch }).buscar({ title: 'C', artist: 'D', durationMs: 200000 })).status, 'none');
  const caido = lrclibFalso({ get: new Error('fetch failed') });
  const r = await new Letras({ fetch: caido.fetch }).buscar({ title: 'E', artist: 'F', durationMs: 200000 });
  assert.equal(r.status, 'error');
  assert.equal((await new Letras({ fetch: nada.fetch }).buscar({ title: '' })).status, 'none', 'sin canción no se pregunta');
});

test('la misma canción no se vuelve a pedir (sí si antes falló por internet)', async () => {
  const { fetch, pedidos } = lrclibFalso({ get: { duration: 100, plainLyrics: 'Hola' } });
  const l = new Letras({ fetch });
  await l.buscar({ title: 'G', artist: 'H', durationMs: 100000 });
  await l.buscar({ title: 'G', artist: 'H', durationMs: 100000 });
  assert.equal(pedidos.length, 1);
});
