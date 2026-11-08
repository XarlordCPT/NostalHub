// npm test: primero las pruebas de lógica (rápidas, con Node) y después las de pantallas (con Electron).
// Termina con error si falla cualquiera de las dos. Lo que pongas después (ej. npm test -- wii) va a las pantallas.
const { spawnSync } = require('child_process');
const path = require('path');

const raiz = path.join(__dirname, '..');
const extra = process.argv.slice(2);

console.log('\n=== Lógica ===\n');
const logica = spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', '--test', '--test-reporter=spec', 'tests/logica/*.test.js'], { cwd: raiz, stdio: 'inherit' });

console.log('\n=== Pantallas (las 8 consolas con datos de prueba) ===\n');
const electron = require('electron'); // desde Node, esto es la ruta de electron.exe
const pantallas = spawnSync(electron, ['tests/pantallas.js', ...extra], { cwd: raiz, stdio: 'inherit' });

const ok = logica.status === 0 && pantallas.status === 0;
console.log(ok ? '\nTodo bien.' : `\nHay problemas: ${[logica.status !== 0 && 'lógica', pantallas.status !== 0 && 'pantallas'].filter(Boolean).join(' y ')}.`);
process.exit(ok ? 0 : 1);
