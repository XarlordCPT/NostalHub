// Prueba de pantallas: abre NostalHub con los datos de prueba (renderer/mock.js, nunca tus datos ni tus cuentas),
// entra a cada consola y recorre sus pantallas con el teclado, como el control. Falla si una pantalla no se abre o si
// aparece un error. De cada pantalla saca una captura y la compara con la de referencia, en cuadritos de 4×4 píxeles
// (así un borde de letra suavizado distinto no cuenta, pero algo movido, más grande o de otro color sí).
//
//   npx electron tests/pantallas.js               compara con las capturas de referencia
//   npx electron tests/pantallas.js --referencia  guarda las capturas actuales como referencia
//   npx electron tests/pantallas.js wii ps2       solo esas consolas
//
// Las capturas quedan en tests/capturas/ (no se suben a git). Las ventanas se abren fuera de la pantalla y sin
// quitarle el foco a lo que estés usando.
const { app, BrowserWindow, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CAPTURAS = path.join(__dirname, 'capturas');
const args = process.argv.slice(2).filter((a) => !a.startsWith('-') && !a.endsWith('.js') && a !== '.');
const REFERENCIA = process.argv.includes('--referencia');
const EN_PARALELO = 4;
const BLOQUE = 4; // se compara el promedio de cada cuadrito de 4×4 píxeles
const BLOQUES_PERMITIDOS = 12; // de 129 600 cuadritos
const ORDEN = ['wii', 'ps2', 'x360', 'ps4', 'vita', 'switch', 'ps3', '3ds']; // orden del selector

// Que el dibujo no dependa de este PC: letras suavizadas en gris (no con los colores de ClearType) y escala 1
app.commandLine.appendSwitch('disable-lcd-text');
app.commandLine.appendSwitch('force-device-scale-factor', '1');

// ---------- Pasos ----------
// ['tecla', 'Enter', veces] · ['clic', selector] · ['clicTexto', 'Logros'] · ['espera', ms] · ['js', código]
const k = (tecla, veces = 1) => ['tecla', tecla, veces];
const clic = (sel) => ['clic', sel];
const texto = (t) => ['clicTexto', t];
const espera = (ms) => ['espera', ms];

// Cada pantalla: cómo llegar desde el inicio de la consola y qué tiene que verse para darla por abierta
const PANTALLAS = {
  wii: {
    inicio: { pasos: [], ve: '.tile.game' },
    canal: { pasos: [clic('.tile.game[data-index="0"]')], ve: '#btn-start' },
    logros: { pasos: [clic('.tile.game[data-index="0"]'), espera(1300), clic('#btn-ach')], ve: '.wa-cell' },
    jugando: { pasos: [clic('.tile.game[data-index="0"]'), espera(1300), clic('#btn-start')], ve: '#btn-stop' },
    ajustes: { pasos: [clic('#btn-settings')], ve: '#ws-back' },
    amigos: { pasos: [k('a')], ve: '#wf-back' },
    buscar: { pasos: [clic('#btn-search'), ['js', `(() => { const i = document.querySelector('.wb-input'); i.value = 'ro'; i.dispatchEvent(new Event('input')); })()`]], ve: '.wb-row' },
    musica: { pasos: [clic('#btn-music')], ve: '.wm-btn' },
  },
  ps2: {
    inicio: { pasos: [], ve: '.ps-cell, [data-game-id]' },
    ficha: { pasos: [k('Enter')], ve: '[data-game-current]' },
    logros: { pasos: [k('Enter'), espera(1300), texto('Logros')], ve: '.pa-cell' },
    ajustes: { pasos: [k('c')], ve: '.ps-cfg, [class*="cfg"]' },
    amigos: { pasos: [k('a')], ve: '[class*="fr"]' },
    // Con el mouse: abrir un juego, iniciarlo, volver al menú, Amigos y Configuración
    jugando: { pasos: [clic('.ps-cell[data-index="1"]'), espera(1300), texto('Iniciar')], ve: '.is-playing .ps-btn' },
    'vuelta-con-mouse': {
      pasos: [clic('.ps-cell[data-index="1"]'), espera(1300), texto('Iniciar'), espera(600), texto('Volver al menú'), espera(1200), clic('.ps-fr-btn'), espera(600), k('Escape'), espera(700), clic('.ps-cfg-btn:not(.ps-fr-btn):not(.ps-sort-btn)')],
      ve: '.pc-row.sel',
    },
  },
  x360: {
    inicio: { pasos: [], ve: '[data-act="games"]' },
    juegos: { pasos: [clic('[data-act="games"]')], ve: '[data-game-id]' },
    ficha: { pasos: [clic('[data-act="games"]'), espera(900), k('Enter')], ve: '[data-dact="play"]' },
    logros: { pasos: [clic('[data-act="games"]'), espera(900), k('Enter'), espera(900), texto('Logros')], ve: '.xb-ach-cell' },
    guia: { pasos: [k('g')], ve: '[class*="guide"], [class*="xg-"]' },
    'guia-juegos': { pasos: [k('g'), espera(700), k('e'), espera(500), k('ArrowDown', 6)], ve: '.xg-item.sel' }, // la sección más larga: la lista no tapa la descripción
    social: { pasos: [k('e')], ve: '[data-act]' },
  },
  ps3: {
    inicio: { pasos: [], ve: '.p3-row, [class*="p3-"]' },
    trofeos: { pasos: [k('ArrowUp', 3), espera(400), k('Enter'), espera(1200), k('Enter')], ve: '.p3-sub-list .p3-row' },
    ajustes: { pasos: [k('ArrowLeft', 2)], ve: '[class*="p3-"]' },
    amigos: { pasos: [k('ArrowRight', 2)], ve: '[class*="p3-"]' },
  },
  ps4: {
    inicio: { pasos: [], ve: '[data-game-id]' },
    ficha: { pasos: [k('ArrowDown')], ve: '.p4g-actions' },
    trofeos: { pasos: [k('ArrowDown'), espera(1200), clic('.p4g-actions [data-g="troph"]')], ve: '.p4t-row.ach' },
    funciones: { pasos: [k('ArrowUp')], ve: '[class*="p4-"]' },
    'menu-rapido': { pasos: [k('p')], ve: '[class*="qm"], [class*="p4-q"]' },
    ajustes: { pasos: [k('ArrowUp'), espera(700), texto('Ajustes')], ve: '[class*="p4-set"], [class*="p4s"]' },
  },
  vita: {
    bloqueo: { pasos: [], ve: '[class*="v-"]' },
    inicio: { pasos: [k('Enter')], ve: '.v-bub' },
    trofeos: { pasos: [k('Enter'), espera(1800), texto('Trofeos'), espera(2200), k('Enter')], ve: '.v-tr-row.ach' },
    amigos: { pasos: [k('Enter'), espera(1800), texto('Amigos')], ve: '[class*="v-card"]' },
    ajustes: { pasos: [k('Enter'), espera(1800), texto('Ajustes')], ve: '[class*="v-card"]' },
    'menu-rapido': { pasos: [k('Enter'), espera(1800), k('p')], ve: '[class*="v-qm"], [class*="v-quick"]' },
  },
  switch: {
    inicio: { pasos: [], ve: '[data-game-id]' },
    botones: { pasos: [k('ArrowDown')], ve: '.sw-rb.sel, .sw-rb.on, .sw-btns' },
    logros: { pasos: [k('ArrowDown'), k('ArrowRight', 3), k('Enter'), espera(1400), k('ArrowRight')], ve: '.sw-ach-row' },
    amigos: { pasos: [k('ArrowDown'), k('ArrowRight', 5), k('Enter')], ve: '[class*="sw-"]' },
    ajustes: { pasos: [k('ArrowDown'), k('ArrowRight', 6), k('Enter')], ve: '[class*="sw-"]' },
    // Lo que faltaba: Todo el software, la ficha, jugar y volver, y los botones con el mouse
    software: { pasos: [k('ArrowRight', 5), k('Enter')], ve: '.sw-cell.sel' },
    ficha: { pasos: [k('ArrowRight', 5), k('Enter'), espera(600), clic('.sw-cell[data-i="1"]'), clic('.sw-cell[data-i="1"]'), espera(600), k('ArrowDown'), espera(900)], ve: '.sw-g-list .sw-li.sel' },
    opciones: { pasos: [k('o')], ve: '.sw-pop-it.sel' },
    jugando: { pasos: [k('Enter')], ve: '.is-playing [data-p="stop"]' },
    'vuelta-con-mouse': { pasos: [k('Enter'), espera(700), clic('[data-p="stop"]'), espera(900), clic('.sw-rb[data-i="1"]')], ve: '.sw-mu' },
    grupo: { pasos: [clic('.sw-rb[data-i="0"]')], ve: '.sw-party-body > *' },
    energia: { pasos: [clic('.sw-rb[data-i="7"]')], ve: '.sw-pop-it.sel' },
  },
  '3ds': {
    inicio: { pasos: [], ve: '.b-slot.full' },
    logros: { pasos: [clic('[data-s="notes"]'), espera(1300), k('Enter')], ve: '.b-app .ba-row' },
    amigos: { pasos: [clic('[data-s="friends"]')], ve: '.b-app' },
    ajustes: { pasos: [clic('.b-slot[data-i="0"]'), espera(300), clic('.b-slot[data-i="0"]')], ve: '.b-app .ba-row' },
  },
};
// Pantallas que no son de una consola
const GENERALES = {
  selector: { pasos: [], ve: '#selector' },
  resumen: { pasos: [k('r')], ve: '#stats:not([hidden])' },
};

// ---------- Ventana de prueba ----------
// Fecha fija (10:00 del 15-ene-2026) y azar fijo, para que cada captura salga igual siempre
const PRELOAD = `
  const FIJA = new Date(2026, 0, 15, 10, 0, 0).getTime();
  const D = Date;
  class Fija extends D { constructor(...a) { super(...(a.length ? a : [FIJA])); } static now() { return FIJA; } }
  window.Date = Fija;
  let semilla = 7;
  Math.random = () => ((semilla = (semilla * 16807) % 2147483647) - 1) / 2147483646;
  window.__errores = [];
  window.addEventListener('error', (e) => window.__errores.push(String(e.message)));
  window.addEventListener('unhandledrejection', (e) => window.__errores.push('Promesa: ' + String(e.reason && e.reason.message || e.reason)));
`;
// Antes de cada captura: termina las animaciones, deja quietas las que se repiten y esconde lo que se mueve solo
// (3D, videos)
const QUIETO = `(() => {
  for (const a of document.getAnimations()) {
    try {
      if (a.effect.getComputedTiming().iterations === Infinity) { a.currentTime = 0; a.pause(); } else a.finish();
    } catch {}
  }
  if (!document.getElementById('prueba-quieta')) {
    const s = document.createElement('style');
    s.id = 'prueba-quieta';
    s.textContent = 'canvas, video { visibility: hidden !important; } * { caret-color: transparent !important; }';
    document.head.appendChild(s);
  }
  return 1;
})()`;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function abrirVentana() {
  const preload = path.join(CAPTURAS, 'preload-prueba.js');
  fs.mkdirSync(CAPTURAS, { recursive: true });
  if (!fs.existsSync(preload)) fs.writeFileSync(preload, PRELOAD);
  const w = new BrowserWindow({
    width: 1920,
    height: 1080,
    useContentSize: true,
    show: false,
    x: -5000,
    y: 0,
    frame: false,
    skipTaskbar: true,
    focusable: false,
    webPreferences: { backgroundThrottling: false, preload, contextIsolation: false, sandbox: false, autoplayPolicy: 'no-user-gesture-required' },
  });
  w.showInactive(); // visible (las animaciones avanzan) pero sin quitarte el foco
  const errores = [];
  w.webContents.on('console-message', (e) => e.level === 'error' && errores.push(e.message));
  w.webContents.on('render-process-gone', (_e, d) => errores.push(`la página se cerró: ${d.reason}`));
  return { w, errores };
}

function acciones(w) {
  const js = (s) => w.webContents.executeJavaScript(s);
  const tecla = async (t, veces = 1) => {
    for (let i = 0; i < veces; i++) {
      await js(`window.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(t)}, bubbles: true })); 1`);
      await esperar(230);
    }
  };
  const visible = (sel) => js(`[...document.querySelectorAll(${JSON.stringify(sel)})].some((e) => e.offsetParent || e.getClientRects().length)`);
  const hasta = async (sel, ms = 8000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (await visible(sel)) return true;
      await esperar(150);
    }
    return false;
  };
  const paso = async ([tipo, a, b]) => {
    if (tipo === 'tecla') return tecla(a, b);
    if (tipo === 'espera') return esperar(a);
    if (tipo === 'clic') {
      if (!(await hasta(a, 5000))) throw new Error(`no apareció ${a}`);
      return js(`document.querySelector(${JSON.stringify(a)}).click(); 1`);
    }
    if (tipo === 'clicTexto') {
      const ok = await js(`(() => {
        const t = ${JSON.stringify(a)};
        const e = [...document.querySelectorAll('button, [data-f], [data-act], .v-bub, .sw-round, .sw-li')].find((b) => (b.offsetParent || b.getClientRects().length) && b.textContent.trim() === t)
          || [...document.querySelectorAll('*')].find((b) => b.offsetParent && !b.children.length && b.textContent.trim() === t);
        if (!e) return false;
        (e.closest('button, [data-f], [data-act], .v-bub') || e).click();
        return true;
      })()`);
      if (!ok) throw new Error(`no hay nada que diga "${a}"`);
      return;
    }
    if (tipo === 'js') return js(a);
  };
  return { js, tecla, hasta, paso };
}

// Abre la app de prueba y entra a la consola (o se queda en el selector)
async function entrar(w, ac, consola) {
  await w.loadFile(path.join(ROOT, 'renderer', 'index.html'));
  if (!(await ac.hasta('#selector', 8000))) throw new Error('no apareció el selector');
  await esperar(500);
  if (!consola) return;
  await ac.tecla('ArrowDown', ORDEN.indexOf(consola));
  await ac.tecla('Enter');
  const t0 = Date.now();
  while (Date.now() - t0 < 12000 && !(await ac.js(`!!document.querySelector('#theme-root.theme-${consola}')`))) await esperar(150);
  await esperar(consola === 'ps3' ? 8500 : 3500); // la entrada de la consola (la PS3 tiene su encendido)
}

// Congela las animaciones y saca capturas hasta que dos seguidas salen idénticas (hay animaciones hechas con código
// que no se pueden congelar, como el deslizar de las tarjetas de la Vita): así la captura no depende del momento
async function quieta(w, ac) {
  let antes = null;
  for (let i = 0; i < 12; i++) {
    await ac.js(QUIETO);
    await esperar(250);
    const img = await w.webContents.capturePage();
    const bmp = img.toBitmap();
    if (antes && (bmp.equals(antes) || distintos(antes, bmp) < 2000)) return { img }; // < 0,1 %: una línea que parpadea al dibujar
    if (i === 11 && antes) return { donde: await queSeMueve(ac, antes, bmp, img.getSize().width) };
    antes = bmp;
  }
  return {};
}
function distintos(a, b) {
  let n = 0;
  for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++;
  return n;
}
// Para el mensaje de error: la zona que cambia entre dos capturas y qué elemento hay ahí
async function queSeMueve(ac, a, b, ancho) {
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let i = 0; i < a.length; i += 4) {
    if (a[i] === b[i] && a[i + 1] === b[i + 1] && a[i + 2] === b[i + 2]) continue;
    const x = (i / 4) % ancho;
    const y = Math.floor(i / 4 / ancho);
    x0 = Math.min(x0, x), y0 = Math.min(y0, y), x1 = Math.max(x1, x), y1 = Math.max(y1, y);
  }
  const el = await ac.js(`(() => { const e = document.elementFromPoint(${(x0 + x1) >> 1}, ${(y0 + y1) >> 1}); return e ? (e.className || e.tagName) + ' en ' + (e.parentElement && e.parentElement.className) : '?'; })()`);
  return `x ${x0}-${x1}, y ${y0}-${y1}: ${el}`;
}

// ---------- Comparar capturas ----------
function comparar(nombre, img) {
  const archivo = `${nombre}.png`;
  const ref = path.join(CAPTURAS, 'referencia', archivo);
  for (const d of ['referencia', 'ultima', 'diferencias']) fs.mkdirSync(path.join(CAPTURAS, d), { recursive: true });
  fs.writeFileSync(path.join(CAPTURAS, 'ultima', archivo), img.toPNG());
  fs.rmSync(path.join(CAPTURAS, 'diferencias', archivo), { force: true });
  if (REFERENCIA || !fs.existsSync(ref)) {
    fs.writeFileSync(ref, img.toPNG());
    return { nueva: true, distintos: 0 };
  }
  const a = nativeImage.createFromPath(ref).toBitmap();
  const b = img.toBitmap();
  if (a.length !== b.length) return { distintos: Infinity };
  const { width: ancho, height: alto } = img.getSize();
  const marca = Buffer.from(b);
  let distintos = 0;
  for (let by = 0; by < alto; by += BLOQUE) {
    for (let bx = 0; bx < ancho; bx += BLOQUE) {
      // Promedio de cada color (BGRA) del cuadrito en las dos capturas
      const sa = [0, 0, 0];
      const sb = [0, 0, 0];
      for (let y = by; y < by + BLOQUE; y++) {
        for (let x = bx; x < bx + BLOQUE; x++) {
          const i = (y * ancho + x) * 4;
          for (let c = 0; c < 3; c++) (sa[c] += a[i + c]), (sb[c] += b[i + c]);
        }
      }
      const n = BLOQUE * BLOQUE;
      if (![0, 1, 2].some((c) => Math.abs(sa[c] - sb[c]) / n > 16)) continue;
      distintos++;
      for (let y = by; y < by + BLOQUE; y++) {
        for (let x = bx; x < bx + BLOQUE; x++) {
          const i = (y * ancho + x) * 4;
          (marca[i] = 0), (marca[i + 1] = 0), (marca[i + 2] = 255), (marca[i + 3] = 255); // BGRA: en rojo
        }
      }
    }
  }
  if (distintos) fs.writeFileSync(path.join(CAPTURAS, 'diferencias', archivo), nativeImage.createFromBitmap(marca, img.getSize()).toPNG());
  return { distintos };
}

// ---------- Recorrer ----------
async function probarPantalla(consola, nombre, receta) {
  const etiqueta = consola ? `${consola}/${nombre}` : nombre;
  const { w, errores } = await abrirVentana();
  const ac = acciones(w);
  const r = { etiqueta, ok: true, nota: '' };
  try {
    await entrar(w, ac, consola);
    for (const p of receta.pasos) await ac.paso(p);
    if (!(await ac.hasta(receta.ve))) throw new Error(`no se abrió (no se ve ${receta.ve})`);
    await esperar(1200);
    await ac.js('document.fonts.ready.then(() => 1)'); // que no saque la captura con una letra de reemplazo
    const { img, donde } = await quieta(w, ac);
    if (!img) throw new Error(`la pantalla nunca se quedó quieta (se mueve ${donde})`);
    const c = comparar(`${consola || 'general'}-${nombre}`, img);
    if (c.nueva) r.nota = 'captura de referencia guardada';
    else if (c.distintos > BLOQUES_PERMITIDOS) (r.ok = false), (r.nota = c.distintos === Infinity ? 'la captura cambió de tamaño' : `cambiaron ${c.distintos} cuadritos de 4×4 (ver tests/capturas/diferencias)`);
    else if (c.distintos) r.nota = `${c.distintos} cuadritos distintos (dentro de lo permitido)`;
    const enPagina = await ac.js('window.__errores || []');
    errores.push(...enPagina);
  } catch (e) {
    r.ok = false;
    r.nota = e.message;
  }
  if (errores.length) (r.ok = false), (r.nota = `${r.nota ? r.nota + ' · ' : ''}errores: ${[...new Set(errores)].slice(0, 3).join(' | ')}`);
  w.destroy();
  return r;
}

app.on('window-all-closed', () => {});
app.whenReady().then(async () => {
  const consolas = args.length ? args.filter((a) => PANTALLAS[a]) : ORDEN;
  const trabajos = [];
  if (!args.length || args.includes('general')) for (const [n, rec] of Object.entries(GENERALES)) trabajos.push([null, n, rec]);
  for (const c of consolas) for (const [n, rec] of Object.entries(PANTALLAS[c])) trabajos.push([c, n, rec]);
  const t0 = Date.now();
  const resultados = [];
  let siguiente = 0;
  await Promise.all(
    Array.from({ length: EN_PARALELO }, async () => {
      while (siguiente < trabajos.length) {
        const [c, n, rec] = trabajos[siguiente++];
        const r = await probarPantalla(c, n, rec);
        resultados.push(r);
        console.log(`${r.ok ? 'OK   ' : 'FALLA'} ${r.etiqueta}${r.nota ? '  ·  ' + r.nota : ''}`);
      }
    })
  );
  const fallas = resultados.filter((r) => !r.ok);
  console.log(`\n${resultados.length} pantallas · ${fallas.length} con problemas · ${Math.round((Date.now() - t0) / 1000)} s`);
  app.exit(fallas.length ? 1 : 0);
});
