// src/spotify.js: qué canción se muestra cuando la API de Spotify está conectada (sin abrir PowerShell ni internet)
const test = require('node:test');
const assert = require('node:assert/strict');
require('../ayuda/electron-falso');
const { Spotify } = require('../../src/spotify');

// Una API falsa: conectada, con una canción y la hora de la última respuesta
function apiFalsa({ at, waiting = false }) {
  return {
    connected: true,
    state: { status: 'ok', at, queue: [], liked: false, playback: { isPlaying: true, progressMs: 175000, item: { title: 'Canción vieja', artist: 'A', durationMs: 175000 } } },
    waiting: () => waiting,
    watch() {},
  };
}
// Lo que dice Windows (los controles multimedia) que está sonando
function musica(web) {
  const m = new Spotify(() => {}, null, { web });
  Object.assign(m.state, { running: true, playing: true, title: 'Canción nueva', artist: 'B', progressMs: 13000, durationMs: 200000 });
  return m;
}

test('con la API al día se muestra lo que dice la API', () => {
  const v = musica(apiFalsa({ at: Date.now() })).view();
  assert.equal(v.title, 'Canción vieja');
  assert.equal(v.hasApi, true);
});

test('si la API no responde hace rato, la canción y el minuto salen de Windows (no se quedan congelados)', () => {
  const v = musica(apiFalsa({ at: Date.now() - 60000 })).view();
  assert.equal(v.title, 'Canción nueva');
  assert.equal(v.progressMs, 13000);
});

test('si Spotify pidió esperar (demasiadas consultas), se usa Windows y los botones básicos', () => {
  const m = musica(apiFalsa({ at: Date.now(), waiting: true }));
  const v = m.view();
  assert.equal(v.title, 'Canción nueva');
  assert.equal(v.hasApi, undefined);
  assert.equal(m.webOn(), false);
});

test('con Windows mostrando la canción, la API se consulta cada 5 s (no cada 2); al cambiar de canción, al tiro', () => {
  const { SpotifyWeb } = require('../../src/spotify-web');
  const web = new SpotifyWeb({ dataDir: require('os').tmpdir() });
  let consultas = 0;
  web.poll = () => consultas++;
  web.cfg = { clientId: 'x', refreshToken: 'y' }; // de mentira: solo para que cuente como conectada
  web.state = { ...web.state, status: 'ok', at: Date.now() };
  const m = new Spotify(() => {}, null, { web });
  // Sin canción en Windows: cada 2 s
  for (const t of [0, 2000, 4000, 6000]) web.tick(1e6 + t);
  assert.equal(consultas, 4);
  // Con la canción en Windows: cada 5 s
  m.mode = 'smtc';
  Object.assign(m.state, { running: true, title: 'Una' });
  consultas = 0;
  for (let t = 0; t <= 10000; t += 2000) web.tick(2e6 + t);
  assert.equal(consultas, 2, 'a los 0 y 6 s (el de los 10 s espera hasta los 11)');
  // Windows avisa otra canción: se pregunta en ese momento
  m.commit({ ...m.state, title: 'Otra' });
  assert.equal(consultas, 3);
});
