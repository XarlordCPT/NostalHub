// Reemplaza el módulo "electron" en las pruebas de lógica (que corren con Node, sin abrir la app).
// Se usa así: require('../ayuda/electron-falso') antes de cargar un archivo de src/ que lo pida.
const Module = require('module');

const abiertos = [];
const shell = {
  abiertos, // lo que se intentó abrir, para revisarlo en la prueba
  openPath: async (p) => (abiertos.push(p), ''),
  openExternal: async (u) => abiertos.push(u),
  readShortcutLink: () => {
    throw new Error('sin accesos directos en las pruebas');
  },
};

const original = Module._load;
Module._load = function (pedido, ...resto) {
  if (pedido === 'electron') return { shell };
  return original.call(this, pedido, ...resto);
};

module.exports = { shell };
