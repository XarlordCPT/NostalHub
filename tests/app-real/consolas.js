// npm run test:app-real:consolas  (NostalHub tiene que estar CERRADA; abre la app real con tus datos en tu pantalla)
// Al terminar una etapa: entra a las 9 consolas, abre los Ajustes del menú principal y el Resumen y elige una opción del menú. OJO: dentro de una
// consola, Enter abre un juego de verdad. Por eso solo aprieta teclas con el selector a la vista y sin ninguna consola
// abierta (una vez se abrió Pokémon Fire Red por apretar Enter a ciegas). Las capturas quedan en tests/capturas/app-real.
// Prueba con la app real (tus datos): arranca NostalHub de la rama, abre el Resumen, entra a las 8 consolas,
// junta los errores de la página y del proceso principal, saca una captura de cada una y cierra con "Salir".
// Al final vuelve a entrar a la consola que tenías marcada (para no cambiarla). No imprime claves.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'tests', 'capturas', 'app-real');
const ULTIMA = JSON.parse(fs.readFileSync(path.join(process.env.APPDATA, 'NostalHub', 'config.json'), 'utf8')).lastConsole || 'wii'; // la consola que tenías marcada
const PORT = 9351;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const IDS = ['wii', 'ps2', 'x360', 'ps3', 'ps4', 'vita', 'switch', '3ds', 'xone'];
const orden = [...IDS.filter((i) => i !== ULTIMA), ULTIMA];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
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
    if (d.method === 'Runtime.exceptionThrown') errores.push(`excepción: ${d.params.exceptionDetails.exception ? d.params.exceptionDetails.exception.description : d.params.exceptionDetails.text}`.split('\n')[0]);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errores.push(`consola: ${d.params.args.map((a) => a.value || a.description || '').join(' ')}`.slice(0, 200));
  };
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => {
    const d = await cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    return d.result && d.result.exceptionDetails ? `ERROR ${d.result.exceptionDetails.text}` : d.result && d.result.result.value;
  };
  const key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await ev(`window.dispatchEvent(new KeyboardEvent('keydown',{key:${JSON.stringify(k)},bubbles:true})),1`); await wait(220); } };
  const shot = async (n) => { const d = await cmd('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, `${n}.png`), Buffer.from(d.result.data, 'base64')); };
  await cmd('Runtime.enable');
  await cmd('Page.enable');
  const hasta = async (expr, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr)) return true; await wait(250); } return false; };

  const r = {};
  r.selector = await hasta(`!!document.querySelector('#selector') && !document.querySelector('#selector').hidden`, 20000);
  await wait(2500);
  await shot('real-selector'); // el menú principal con tus íconos y modelos
  await key('a'); // Ajustes del menú principal (sin entrar a una consola)
  r.ajustes = await hasta(`!!document.querySelector('.home-cfg .hc-sec')`, 5000);
  await wait(600);
  await shot('real-ajustes');
  await key('Escape');
  await wait(600);
  await key('r');
  r.resumen = await hasta(`!!document.querySelector('#stats') && !document.querySelector('#stats').hidden`, 6000);
  await wait(1200);
  await shot('real-resumen');
  await key('Escape');
  await wait(800);
  for (const c of orden) {
    const antes = errores.length;
    // Seguro: solo se aprietan teclas en el selector, nunca dentro de una consola (ahí Enter abre un juego)
    const enSelector = await ev(`!!document.querySelector('#selector') && !document.querySelector('#selector').hidden && !document.querySelector('#theme-root').className`);
    if (!enSelector) throw new Error(`no estoy en el selector antes de ${c}: me detengo sin apretar nada`);
    await key('ArrowLeft', 10); // ← → sirven en todos los estilos del menú principal
    const pos = await ev(`window.CONSOLES.findIndex((x) => x.id === ${JSON.stringify(c)})`);
    await key('ArrowRight', pos);
    await wait(500);
    const marcada = await ev(`window.NostalHubSelector ? window.NostalHubSelector.current() : null`);
    if (marcada !== c) throw new Error(`en el selector está marcada ${marcada} y no ${c}: me detengo sin apretar Enter`);
    await key('Enter');
    // Nunca un Enter a ciegas: dentro de una consola, Enter abre un juego de verdad
    const dentro = await hasta(`!!document.querySelector('#theme-root.theme-${c}')`, 25000);
    if (!dentro) throw new Error(`no entró a ${c}: me detengo para no apretar nada más`);
    await wait(c === 'ps3' ? 9000 : 5000);
    const juegos = await ev(`document.querySelectorAll('#theme-root [data-game-id]').length`);
    await shot(`real-${c}`);
    r[c] = { dentro, juegos, errores: errores.slice(antes) };
    console.log(c, JSON.stringify(r[c]));
    if (c !== ULTIMA) {
      await cmd('Page.reload');
      await hasta(`!!document.querySelector('#selector') && !document.querySelector('#selector').hidden`, 20000);
      await wait(1500);
    }
  }
  // Elegir una opción del menú desde la interfaz (Ajustes → General → Recargar), como lo hace cada consola
  const antesMenu = errores.length;
  ev(`window.nostalhub.runMenu('reload').then(() => 1)`).catch(() => {});
  await wait(1500);
  r.menu = await hasta(`!!document.querySelector('#selector') && !document.querySelector('#selector').hidden`, 20000);
  console.log('opción del menú (Recargar):', r.menu ? 'volvió al selector' : 'NO', '· errores:', errores.length - antesMenu);
  console.log('selector', r.selector, '· ajustes', r.ajustes, '· resumen', r.resumen, '· errores en total', errores.length);
  ev('window.nostalhub.quitApp()').catch(() => {});
  await Promise.race([new Promise((res) => proc.on('exit', res)), wait(8000)]);
  console.log('cerró:', proc.exitCode !== null ? `sí (${proc.exitCode})` : 'NO');
  const avisos = salida.join('').split('\n').filter((l) => /\[[\w ]+\]|error|Error/.test(l) && !/DevTools|GPU|gpu_|Autofill|ERROR:CONSOLE/.test(l));
  console.log('avisos del proceso principal:', avisos.length);
  avisos.slice(0, 15).forEach((l) => console.log('  ' + l.trim().slice(0, 200)));
  process.exit(0);
})().catch((e) => { console.log('falló:', e.message); process.exit(1); });
