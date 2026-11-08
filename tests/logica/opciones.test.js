// src/opciones.js: las opciones de Ajustes convertidas para la bandeja y para las consolas, y elegir una.
const test = require('node:test');
const assert = require('node:assert/strict');
const opciones = require('../../src/opciones');

function secciones(pasó) {
  return [
    {
      id: 'general',
      title: 'General',
      items: [
        { id: 'show', type: 'action', label: 'Mostrar', trayOnly: true, run: () => pasó.push('show') },
        { id: 'reload', type: 'action', label: 'Recargar', run: async () => pasó.push('reload') },
        { id: 'quit', type: 'action', label: 'Salir de NostalHub', run: () => pasó.push('quit') },
      ],
    },
    {
      id: 'sound',
      title: 'Sonido',
      short: 'Sonido',
      items: [
        { id: 'music', type: 'toggle', label: 'Música de fondo', value: true, set: (v) => pasó.push(`music=${v}`) },
        { id: 'app', type: 'choice', label: 'App de música', value: 'spotify', options: [{ value: 'spotify', label: 'Spotify' }, { value: 'apple', label: 'Apple Music' }], set: (v) => pasó.push(`app=${v}`) },
      ],
    },
  ];
}

test('para las consolas: solo datos, sin funciones ni opciones de la bandeja', () => {
  const m = opciones.modelo(secciones([]));
  assert.deepEqual(m.map((s) => s.id), ['general', 'sound']);
  assert.deepEqual(m[0].items.map((i) => i.id), ['reload', 'quit']);
  assert.ok(m.flatMap((s) => s.items).every((i) => !('run' in i) && !('set' in i) && !('trayOnly' in i)));
  assert.equal(JSON.stringify(m), JSON.stringify(JSON.parse(JSON.stringify(m))), 'se puede mandar a la interfaz tal cual');
});

test('para la bandeja: separadores entre secciones, casillas, opciones y "Salir" al final', () => {
  const pasó = [];
  const t = opciones.plantillaBandeja(secciones(pasó), () => pasó.push('salir'));
  assert.deepEqual(t.map((x) => x.label || x.type), ['Mostrar', 'Recargar', 'separator', 'Música de fondo', 'App de música', 'separator', 'Salir']);
  assert.equal(t[3].type, 'checkbox');
  assert.equal(t[3].checked, true);
  assert.deepEqual(t[4].submenu.map((o) => o.checked), [true, false]);
  t[3].click({ checked: false });
  t[4].submenu[1].click();
  t.at(-1).click();
  assert.deepEqual(pasó, ['music=false', 'app=apple', 'salir']);
});

test('elegir una opción en una consola', async () => {
  const pasó = [];
  const s = secciones(pasó);
  assert.equal(await opciones.ejecutar(s, 'reload'), true);
  await opciones.ejecutar(s, 'music'); // sin valor: al contrario de como está
  await opciones.ejecutar(s, 'music', true);
  await opciones.ejecutar(s, 'app', 'apple');
  await opciones.ejecutar(s, 'app', 'no-existe');
  assert.equal(await opciones.ejecutar(s, 'tampoco-existe'), false);
  assert.deepEqual(pasó, ['reload', 'music=false', 'music=true', 'app=apple']);
});

test('si una opción falla, el error llega a quien la eligió', async () => {
  const s = [{ id: 'x', items: [{ id: 'malo', type: 'action', run: async () => { throw new Error('sin permiso'); } }] }];
  await assert.rejects(opciones.ejecutar(s, 'malo'), /sin permiso/);
});
