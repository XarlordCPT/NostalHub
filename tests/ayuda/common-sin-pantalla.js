// Carga renderer/common.js sin navegador (con un window y un document mínimos) y devuelve window.NostalHubUtil,
// para probar sus ayudantes (orden de logros, sets, horas…) con Node.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function cargarCommon() {
  const guardado = new Map();
  const nada = () => {};
  const elemento = () => ({ style: {}, classList: { add: nada, remove: nada, toggle: nada }, appendChild: nada, addEventListener: nada, querySelector: () => null, querySelectorAll: () => [] });
  const window = { addEventListener: nada, removeEventListener: nada };
  const contexto = {
    window,
    document: { querySelectorAll: () => [], querySelector: () => null, getElementById: () => null, createElement: elemento, body: elemento() },
    localStorage: { getItem: (k) => (guardado.has(k) ? guardado.get(k) : null), setItem: (k, v) => guardado.set(k, String(v)), removeItem: (k) => guardado.delete(k) },
    performance,
    Intl,
    setInterval: () => 0,
    clearInterval: nada,
    setTimeout,
    clearTimeout,
    console,
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', '..', 'renderer', 'common.js'), 'utf8'), contexto, { filename: 'common.js' });
  return window.NostalHubUtil;
}

module.exports = { cargarCommon };
