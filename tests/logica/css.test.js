// Todo el CSS se carga junto: cada animación usada tiene que existir, y dos archivos no pueden definir una animación con
// el mismo nombre (la segunda pisaría a la primera en la otra consola). Las capturas no ven esto: una animación que no
// existe deja el elemento quieto en su estado final.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const RENDERER = path.join(__dirname, '..', '..', 'renderer');
const archivos = [];
(function buscar(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) buscar(p);
    else if (f.name.endsWith('.css')) archivos.push(p);
  }
})(RENDERER);
const css = Object.fromEntries(archivos.map((f) => [path.relative(RENDERER, f).replace(/\\/g, '/'), fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')]));

const PALABRAS = new Set('none infinite normal reverse alternate alternate-reverse forwards backwards both running paused ease ease-in ease-out ease-in-out linear step-start step-end initial inherit unset'.split(' '));

// Las de overlay/ son de otra ventana (los avisos de logro): se revisan aparte
const grupos = { app: Object.keys(css).filter((f) => !f.startsWith('overlay/')), overlay: Object.keys(css).filter((f) => f.startsWith('overlay/')) };

for (const [grupo, lista] of Object.entries(grupos)) {
  test(`animaciones (${grupo}): las que se usan existen y ninguna se define dos veces`, () => {
    const definidas = new Map();
    const repetidas = [];
    for (const f of lista) {
      for (const m of css[f].matchAll(/@keyframes\s+([\w-]+)/g)) {
        if (definidas.has(m[1])) repetidas.push(`${m[1]} (${definidas.get(m[1])} y ${f})`);
        definidas.set(m[1], f);
      }
    }
    const faltan = [];
    for (const f of lista) {
      for (const m of css[f].matchAll(/animation(?:-name)?\s*:([^;}]*)/g)) {
        const valor = m[1].replace(/[\w-]+\([^)]*\)/g, ' '); // cubic-bezier(…), steps(…), var(…)
        for (const parte of valor.split(',')) {
          for (const t of parte.trim().split(/\s+/)) {
            if (!t || PALABRAS.has(t) || /^[\d.-]/.test(t) || /^!important$/.test(t)) continue;
            if (!definidas.has(t)) faltan.push(`${t} (en ${f})`);
          }
        }
      }
    }
    assert.deepEqual(repetidas, [], 'animaciones con el mismo nombre en dos archivos');
    assert.deepEqual([...new Set(faltan)], [], 'animaciones que se usan pero no existen');
  });
}
