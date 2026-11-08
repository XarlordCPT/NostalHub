// RetroAchievements con una API falsa (nunca usa tu cuenta): subsets, totales y avisos sin repetir.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { RetroAchievements, normalize, tierOf } = require('../../src/retroachievements');
const { carpetaTemporal, escribir } = require('../ayuda/temporal');

const LISTA_GBA = [
  { id: 515, title: 'Pokémon FireRed Version' },
  { id: 788, title: 'Pokémon LeafGreen Version' },
  { id: 23905, title: 'Pokémon FireRed Version [Subset - Professor Oak Challenge]' },
  { id: 33006, title: 'Pokémon LeafGreen Version [Subset - Professor Oak Challenge]' },
  { id: 24875, title: 'Pokémon FireRed Version | Pokémon LeafGreen Version [Subset - Shiny Pokémon+]' },
  { id: 15623, title: '~Hack~ Pokémon FireRed Backwards' },
];
function juego(id, title, n, hechos) {
  const Achievements = {};
  for (let i = 0; i < n; i++) Achievements[i] = { ID: id * 100 + i, Title: `${title} #${i}`, BadgeName: 'b', Points: 5, NumAwarded: 10, DisplayOrder: i, DateEarned: i < hechos ? '2026-11-08 03:00:00' : null };
  return { Title: title, ConsoleID: 5, NumDistinctPlayers: 100, Achievements };
}
const JUEGOS = { 515: juego(515, LISTA_GBA[0].title, 61, 3), 23905: juego(23905, LISTA_GBA[2].title, 40, 2), 24875: juego(24875, LISTA_GBA[4].title, 10, 0) };

function nuevo(t, recientes = () => []) {
  const dataDir = carpetaTemporal(t);
  escribir(dataDir, { 'cache/retroachievements/consola-5.json': JSON.stringify({ t: Date.now(), games: LISTA_GBA }) });
  const pedidos = [];
  const fetchFn = async (url) => {
    const u = new URL(url);
    const nombre = /API_(\w+)\.php/.exec(u.pathname)[1];
    pedidos.push(`${nombre}:${u.searchParams.get('g') || ''}`);
    const body = nombre === 'GetGameInfoAndUserProgress' ? JUEGOS[u.searchParams.get('g')] : nombre === 'GetUserRecentAchievements' ? recientes() : [];
    return { ok: true, json: async () => body };
  };
  const r = new RetroAchievements({ dataDir, fetchFn });
  r.cfg = { user: 'prueba', key: 'clave-de-prueba' };
  return { r, pedidos };
}

test('nombres parecidos coinciden y la copa sale de los puntos', () => {
  assert.equal(normalize('Dragon Ball Z: Budokai 2'), normalize('Dragon Ball Z - Budokai 2'));
  assert.equal(normalize('Pokémon'), 'pokemon');
  assert.equal(tierOf(25), 'gold');
  assert.equal(tierOf(10), 'silver');
  assert.equal(tierOf(1), 'bronze');
});

test('subsets: los suyos y los compartidos ("A | B"), nunca los hacks', async (t) => {
  const { r } = nuevo(t);
  assert.deepEqual((await r.subsets('Pokémon FireRed Version', 5)).map((s) => s.id).sort(), [23905, 24875]);
  assert.deepEqual((await r.subsets('Pokémon LeafGreen Version', 5)).map((s) => s.id).sort(), [24875, 33006]);
  assert.deepEqual(await r.subsets('Juego que no existe', 5), []);
});

test('lista de logros: juego base + cada subset con su nombre; el total es de todo el juego', async (t) => {
  const { r, pedidos } = nuevo(t);
  const res = await r.achievements('ra-515');
  assert.equal(res.status, 'ok');
  assert.deepEqual([...new Set(res.list.map((a) => a.set || 'base'))], ['base', 'Professor Oak Challenge', 'Shiny Pokémon+']);
  assert.equal(res.total, 111);
  assert.equal(res.done, 5);
  assert.deepEqual(r.totals['ra-515'], { ...r.totals['ra-515'], done: 5, total: 111 });
  assert.ok(!pedidos.some((p) => p.endsWith(':15623')), 'no pide los hacks');
});

test('sin cuenta conectada no pide nada', async (t) => {
  const { r, pedidos } = nuevo(t);
  r.cfg = {};
  assert.equal((await r.achievements('ra-515')).status, 'no-key');
  assert.equal(pedidos.length, 0);
});

test('avisos: el del registro (al instante) y el de la API no se repiten, y ambos suman al juego', async (t) => {
  let recientes = [];
  const { r } = nuevo(t, () => recientes);
  const { list } = await r.achievements('ra-515');
  await r.newUnlocks(); // primera vez: solo anota los que ya había
  const delSubset = list.find((a) => a.set === 'Professor Oak Challenge' && !a.done);
  const aviso = r.liveUnlock('ra-515', delSubset.id, delSubset.name, list, 'Pokémon FireRed');
  assert.equal(aviso.name, delSubset.name);
  assert.equal(r.totals['ra-515'].done, 6, 'uno del subset suma al juego');
  assert.equal(r.liveUnlock('ra-515', delSubset.id, delSubset.name, list, 'x'), null, 'la misma línea no avisa dos veces');
  recientes = [
    { AchievementID: Number(delSubset.id), Title: delSubset.name, Points: 5, BadgeName: 'b', GameID: 23905, GameTitle: LISTA_GBA[2].title },
    { AchievementID: 999, Title: 'Shiny', Points: 10, BadgeName: 'c', GameID: 24875, GameTitle: LISTA_GBA[4].title },
  ];
  const nuevos = await r.newUnlocks();
  assert.deepEqual(nuevos.map((a) => a.name), ['Shiny'], 'el que ya salió por el registro no se repite');
  assert.equal(nuevos[0].gameName, 'Pokémon FireRed Version | Pokémon LeafGreen Version', 'el nombre del juego, no el del subset');
  assert.equal(r.totals['ra-515'].done, 7);
});
void path;
