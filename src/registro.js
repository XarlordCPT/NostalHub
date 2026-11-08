// Registro de NostalHub (%APPDATA%\NostalHub\cache\nostalhub.log): lo que falla sin verse en pantalla queda anotado,
// con la hora y dónde pasó. Nunca anotes claves ni direcciones que las lleven (la de RetroAchievements lleva su clave).
// Cuando pasa de 500 KB, el registro viejo queda como nostalhub.anterior.log y se empieza uno nuevo.

const fs = require('fs');
const path = require('path');

const MAX_BYTES = 500 * 1024;
let archivo = null;

function iniciar(dataDir) {
  archivo = path.join(dataDir, 'cache', 'nostalhub.log');
}

// anotar('steam', error) o anotar('retro', 'texto'). También sale por la consola (npm run dev).
function anotar(donde, e) {
  const texto = e && e.message ? e.message : String(e);
  console.warn(`[${donde}]`, texto);
  if (!archivo) return;
  try {
    fs.mkdirSync(path.dirname(archivo), { recursive: true });
    if (fs.existsSync(archivo) && fs.statSync(archivo).size > MAX_BYTES) fs.renameSync(archivo, archivo.replace(/\.log$/, '.anterior.log'));
    fs.appendFileSync(archivo, `${new Date().toISOString().slice(0, 19)}  [${donde}] ${texto}\r\n`);
  } catch {
    // Si ni el registro se puede escribir, ya se mostró en la consola
  }
}

module.exports = { iniciar, anotar, MAX_BYTES };
