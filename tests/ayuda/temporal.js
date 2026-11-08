// Carpetas temporales para las pruebas: cada prueba usa la suya y se borra al terminar.
const fs = require('fs');
const os = require('os');
const path = require('path');

// antes: lo que hay que cerrar primero (por ejemplo, la base de datos) para poder borrar la carpeta en Windows
function carpetaTemporal(t, antes) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nostalhub-prueba-'));
  t.after(() => {
    if (antes) antes();
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

// Crea archivos de una vez: { 'a/b.txt': 'texto', 'c.bin': Buffer }
function escribir(dir, archivos) {
  for (const [nombre, contenido] of Object.entries(archivos)) {
    const file = path.join(dir, nombre);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contenido);
  }
}

module.exports = { carpetaTemporal, escribir };
