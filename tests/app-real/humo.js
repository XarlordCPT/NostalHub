// npm run test:app-real  (NostalHub tiene que estar CERRADA; abre la app real con tus datos en tu pantalla)
// Para cada paso que toque main.js o src/: la primera vez guarda la referencia (--base), después compara.
// Prueba rápida con la app real (tus datos), para cada paso de separar main.js:
// abre NostalHub, llama a las funciones de SOLO LECTURA del puente (window.nostalhub) y guarda la "forma" de lo que
// responden (claves, tipos y cantidades, nunca los valores ni las claves privadas). Compara con la vez anterior.
// No aprieta teclas dentro de las consolas: no puede abrir juegos ni cambiar nada. Cierra con "Salir".
//   node t-humo.js <proyecto> <archivo.json> [--base]   (--base guarda la referencia)
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = require('path').join(__dirname, '..', '..');
const ARCHIVO = require('path').join(ROOT, 'tests', 'capturas', 'app-real', 'humo-referencia.json');
require('fs').mkdirSync(require('path').dirname(ARCHIVO), { recursive: true });
const BASE = process.argv.includes('--base');
const PORT = 9352;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// La forma de un valor: tipos y claves (y largo de listas), sin los datos
function forma(v, d = 0) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return v.length ? [`lista`, forma(v[0], d + 1)] : 'lista vacía';
  if (typeof v === 'object') {
    if (d > 3) return 'objeto';
    const o = {};
    for (const k of Object.keys(v).sort()) o[k] = forma(v[k], d + 1);
    return o;
  }
  return typeof v;
}

const LLAMADAS = `(async () => {
  const api = window.nostalhub;
  const out = {};
  const probar = async (n, f) => { try { out[n] = { ok: true, v: await f() }; } catch (e) { out[n] = { ok: false, error: String(e.message || e) }; } };
  const st = await api.getState();
  const juego = st.games.find((g) => g.type === 'steam' && g.hasAch) || st.games[0];
  const emu = st.games.find((g) => g.type === 'emulator' && g.hasAch);
  await probar('getState', () => st);
  await probar('getMenu', () => api.getMenu());
  await probar('getConsoleAssets', () => api.getConsoleAssets(['wii', 'ps2', 'x360', 'ps3', 'ps4', 'vita', 'switch', '3ds']));
  await probar('getConsoleBackgrounds', () => api.getConsoleBackgrounds('ps3'));
  await probar('getFreeSpace', () => api.getFreeSpace());
  await probar('getSettings', () => api.getSettings());
  await probar('getStats', () => api.getStats('all', 0));
  await probar('getGameCustom', () => api.getGameCustom(juego.id));
  await probar('getSetup', () => api.getSetup());
  await probar('getSteamProfile', () => api.getSteamProfile());
  await probar('getAchievementSummary', () => api.getAchievementSummary());
  await probar('getAchievements', () => api.getAchievements(juego.appId));
  if (emu) await probar('getAchievements(emulador)', () => api.getAchievements(emu.appId));
  await probar('getFriends', () => api.getFriends());
  await probar('getWindowState', () => api.getWindowState());
  out.__datos = { juegos: st.games.length, menu: (out.getMenu.v || []).length, opciones: (out.getMenu.v || []).reduce((n, s) => n + s.items.length, 0) };
  return out;
})()`;

(async () => {
  const salida = [];
  const proc = spawn(path.join(ROOT, 'node_modules', 'electron', 'dist', 'electron.exe'), [ROOT, `--remote-debugging-port=${PORT}`], { cwd: ROOT });
  proc.stdout.on('data', (d) => salida.push(String(d)));
  proc.stderr.on('data', (d) => salida.push(String(d)));
  let page = null;
  for (let i = 0; i < 40 && !page; i++) {
    await wait(500);
    try {
      page = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((p) => p.type === 'page' && /renderer\/index\.html/.test(p.url));
    } catch {}
  }
  if (!page) throw new Error('la app no abrió su ventana');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pend = new Map();
  const errores = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) return pend.get(d.id)(d), pend.delete(d.id);
    if (d.method === 'Runtime.exceptionThrown') errores.push(String(d.params.exceptionDetails.exception ? d.params.exceptionDetails.exception.description : d.params.exceptionDetails.text).split('\n')[0]);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errores.push(d.params.args.map((a) => a.value || a.description || '').join(' ').slice(0, 200));
  };
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => {
    const d = await cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (d.result && d.result.exceptionDetails) throw new Error(d.result.exceptionDetails.exception ? d.result.exceptionDetails.exception.description : d.result.exceptionDetails.text);
    return d.result.result.value;
  };
  await cmd('Runtime.enable');
  for (let i = 0; i < 60 && !(await ev(`!!document.querySelector('#selector') && !document.querySelector('#selector').hidden`)); i++) await wait(300);
  await wait(4000); // que termine de leer Steam, los emuladores y el arte
  const r = await ev(LLAMADAS);
  const datos = r.__datos;
  delete r.__datos;
  const resumen = Object.fromEntries(Object.entries(r).map(([k, x]) => [k, x.ok ? forma(x.v) : `ERROR: ${x.error}`]));
  ev('window.nostalhub.quitApp()').catch(() => {});
  await Promise.race([new Promise((res) => proc.on('exit', res)), wait(8000)]);
  const avisos = salida.join('').split('\n').filter((l) => /\[[\w ]+\]|Error|error/.test(l) && !/DevTools|GPU|gpu_|Autofill/.test(l)).map((l) => l.trim().slice(0, 200));

  console.log('juegos:', datos.juegos, '· secciones del menú:', datos.menu, '· opciones:', datos.opciones);
  const fallas = Object.entries(resumen).filter(([, v]) => typeof v === 'string' && v.startsWith('ERROR'));
  console.log('funciones probadas:', Object.keys(resumen).length, '· con error:', fallas.length);
  fallas.forEach(([k, v]) => console.log('  ✖', k, v));
  console.log('errores en la página:', errores.length, errores.slice(0, 3).join(' | '));
  console.log('avisos del proceso principal:', avisos.length);
  avisos.slice(0, 8).forEach((l) => console.log('  ', l));
  console.log('cerró:', proc.exitCode !== null ? 'sí' : 'NO');

  const actual = { datos, resumen };
  if (BASE || !fs.existsSync(ARCHIVO)) {
    fs.writeFileSync(ARCHIVO, JSON.stringify(actual, null, 1));
    console.log('referencia guardada');
  } else {
    const ref = JSON.parse(fs.readFileSync(ARCHIVO, 'utf8'));
    const cambios = [];
    if (JSON.stringify(ref.datos) !== JSON.stringify(datos)) cambios.push(`datos: ${JSON.stringify(ref.datos)} → ${JSON.stringify(datos)}`);
    for (const k of new Set([...Object.keys(ref.resumen), ...Object.keys(resumen)])) {
      if (JSON.stringify(ref.resumen[k]) !== JSON.stringify(resumen[k])) cambios.push(`${k} cambió`);
    }
    console.log(cambios.length ? `DISTINTO a la referencia:\n  ${cambios.join('\n  ')}` : 'IGUAL a la referencia');
  }
  process.exit(fallas.length || errores.length ? 1 : 0);
})().catch((e) => {
  console.log('falló:', e.message);
  process.exit(1);
});
