// Barra de música encima del juego (solo mientras estás en "Jugando a…"): la canción que suena, el minuto, la que viene y,
// si quieres, la línea de la letra que se está cantando. Con el estilo de la última consola elegida, como el aviso de logros.
//
// Es una ventanita transparente, siempre encima y que deja pasar los clics (como src/overlay.js): sale encima de los juegos
// en "ventana sin bordes", no de la pantalla completa exclusiva. Aparece unos segundos cuando cambia la canción o aprietas
// un atajo y se esconde sola; con el atajo de mostrar queda fija. Los atajos se registran en Windows solo mientras juegas
// (así funcionan dentro del juego y no le quitan esas teclas a nadie el resto del tiempo).
// La página es renderer/barra/ (su puente: barra-preload.js). La letra la busca con el mismo canal de la ventana de la
// letra (music:lyrics, src/letras.js).

const path = require('path');
const { BrowserWindow, screen, globalShortcut, ipcMain } = require('electron');

const W = 900; // tamaño de la ventanita a 1080p (se escala con la pantalla): la barra + la letra + la sombra
const H = 330;
const MARGEN = 16;
const VISIBLE_MS = 6000; // cuánto se ve al cambiar de canción o al apretar un atajo
const ESTILOS = ['x360', 'ps3', 'ps4', 'vita', 'wii', 'ps2', 'switch', '3ds', 'xone']; // los mismos del aviso de logros

// Lugares fijos (y 'free': donde la dejaste con "Mover la barra")
const POSICIONES = [
  ['tl', 'Arriba a la izquierda'],
  ['tc', 'Arriba al centro'],
  ['tr', 'Arriba a la derecha'],
  ['bl', 'Abajo a la izquierda'],
  ['bc', 'Abajo al centro'],
  ['br', 'Abajo a la derecha'],
  ['free', 'Donde la dejaste al moverla'],
];
// Tamaños (se multiplica la escala de la pantalla)
const TAMANOS = [
  ['s', 'Chica', 0.8],
  ['m', 'Normal', 1],
  ['l', 'Grande', 1.25],
];
const escala = (t) => (TAMANOS.find(([id]) => id === t) || TAMANOS[1])[2];
// Atajos: qué hace cada uno y el de por defecto (formato de Electron: "Control+Alt+B"). Ctrl+Alt+M y Ctrl+Alt+Espacio
// no: en el PC de Cristóbal ya los usan otros programas (Ctrl+Alt+Espacio es de Claude)
const ACCIONES = [
  ['toggle', 'Mostrar u ocultar la barra (fija)', 'Control+Alt+B'],
  ['lyrics', 'Con letra / sin letra', 'Control+Alt+L'],
  ['play', 'Reproducir / pausar', 'Control+Alt+P'],
  ['next', 'Canción siguiente', 'Control+Alt+Right'],
  ['prev', 'Canción anterior', 'Control+Alt+Left'],
  ['like', 'Me gusta', 'Control+Alt+Up'],
];
const POR_DEFECTO = Object.fromEntries(ACCIONES.map(([id, , k]) => [id, k]));

// ---------- Partes sin Electron (se prueban en tests/logica/barra-musica.test.js) ----------

// Un atajo válido: Control y/o Alt (para no quitarle una tecla suelta al juego), quizás Shift, y una tecla
const TECLA = /^([A-Z0-9]|F([1-9]|1\d|2[0-4])|Up|Down|Left|Right|Space|PageUp|PageDown|Home|End|Insert|Delete)$/;
function atajoValido(acc) {
  const partes = String(acc || '').split('+');
  const tecla = partes.pop();
  if (!TECLA.test(tecla) || new Set(partes).size !== partes.length) return false;
  if (!partes.every((p) => ['Control', 'Alt', 'Shift'].includes(p))) return false;
  return partes.includes('Control') || partes.includes('Alt');
}

// Los atajos guardados, completando con los de por defecto (y sin los que quedaron inválidos)
function atajos(guardados) {
  const out = { ...POR_DEFECTO };
  for (const [id, acc] of Object.entries(guardados || {})) if (id in out && atajoValido(acc)) out[id] = acc;
  return out;
}

// Dónde va la ventanita (en píxeles de Windows) en esa pantalla. k: escala según la resolución.
// free: { x, y } en fracciones de la pantalla (0 a 1), la esquina de arriba a la izquierda de la ventanita.
function lugar(pos, free, bounds, k) {
  const w = Math.round(W * k);
  const h = Math.round(H * k);
  const m = Math.round(MARGEN * k);
  let x;
  let y;
  if (pos === 'free' && free && Number.isFinite(free.x) && Number.isFinite(free.y)) {
    x = bounds.x + free.x * bounds.width;
    y = bounds.y + free.y * bounds.height;
  } else {
    const p = POSICIONES.some(([id]) => id === pos) && pos !== 'free' ? pos : 'tc';
    x = p[1] === 'l' ? bounds.x + m : p[1] === 'r' ? bounds.x + bounds.width - w - m : bounds.x + (bounds.width - w) / 2;
    y = p[0] === 't' ? bounds.y + m : bounds.y + bounds.height - h - m;
  }
  // Nunca fuera de la pantalla
  x = Math.min(Math.max(x, bounds.x), bounds.x + bounds.width - w);
  y = Math.min(Math.max(y, bounds.y), bounds.y + bounds.height - h);
  return { x: Math.round(x), y: Math.round(y), width: w, height: h };
}

// Al revés: dónde quedó la ventanita después de moverla, en fracciones de la pantalla
function fraccion(b, bounds) {
  const r = (v) => Math.round(v * 10000) / 10000;
  return { x: r((b.x - bounds.x) / bounds.width), y: r((b.y - bounds.y) / bounds.height) };
}

// La barra va arriba (la letra se abre hacia abajo) o abajo (la letra se abre hacia arriba), y a qué lado
function forma(pos, free) {
  if (pos === 'free' && free) return { v: free.y > 0.5 ? 'bottom' : 'top', h: free.x < 0.2 ? 'left' : free.x > 0.6 ? 'right' : 'center' };
  const p = POSICIONES.some(([id]) => id === pos) && pos !== 'free' ? pos : 'tc';
  return { v: p[0] === 't' ? 'top' : 'bottom', h: { l: 'left', c: 'center', r: 'right' }[p[1]] };
}

// ---------- La barra ----------
let nh = null; // lo que pasa main.js (registrar)
let win = null;
let ready = null;
let active = false; // estás en "Jugando a…"
let moving = null; // { before } mientras la mueves
let shown = false;
let hideTimer = null;
let chip = null; // aviso chico de un atajo: { icon, text, at }
let songKey = '';
let registered = [];

const cfg = () => {
  const c = nh.config.data;
  if (!c.musicBar || typeof c.musicBar !== 'object') c.musicBar = {};
  return c.musicBar;
};
const enabled = () => cfg().on !== false;
const estilo = () => (ESTILOS.includes(nh.config.data.lastConsole) ? nh.config.data.lastConsole : 'x360');

function ensure() {
  if (win && !win.isDestroyed()) return ready;
  win = new BrowserWindow({
    width: W,
    height: H,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    focusable: false,
    skipTaskbar: true,
    hasShadow: false,
    alwaysOnTop: true,
    title: 'NostalHub música',
    webPreferences: {
      preload: path.join(nh.dir, 'barra-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setIgnoreMouseEvents(true); // los clics pasan al juego
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.on('closed', () => ((win = null), (shown = false)));
  ready = win.loadFile(path.join(nh.dir, 'renderer', 'barra', 'index.html')).catch((e) => nh.anotar('barra de música', e));
  return ready;
}

function place() {
  if (!win || win.isDestroyed()) return;
  const d = nh.pickDisplay() || screen.getPrimaryDisplay();
  const c = cfg();
  const k = Math.max(0.6, Math.min(2, d.bounds.height / 1080)) * escala(c.size);
  win.setBounds(lugar(c.pos || 'tc', c.free, d.bounds, k));
  win.webContents.setZoomFactor(k);
}

// Lo que dibuja la página
function payload() {
  const c = cfg();
  return {
    style: estilo(),
    sp: nh.spotify.view(),
    show: shown,
    pinned: !!c.pinned,
    lyrics: !!c.lyrics,
    shape: forma(c.pos || 'tc', c.free),
    moving: !!moving,
    chip: chip && Date.now() - chip.at < 1800 ? chip : null,
  };
}
function push() {
  if (win && !win.isDestroyed() && (shown || moving)) win.webContents.send('barra:state', payload());
}

async function reveal(ms = VISIBLE_MS) {
  if (!active || !enabled()) return;
  try {
    await ensure();
  } catch (e) {
    return nh.anotar('barra de música', e);
  }
  if (!win || win.isDestroyed() || !active) return;
  clearTimeout(hideTimer);
  if (!shown) {
    place();
    shown = true;
    win.setAlwaysOnTop(true, 'screen-saver');
    win.showInactive();
    win.moveTop();
  }
  push();
  if (!cfg().pinned) hideTimer = setTimeout(() => conceal(), ms);
}
// Al cambiar el lugar o el tamaño en Ajustes: la barra aparece un momento donde va a quedar (aunque no estés jugando)
async function vistaPrevia() {
  if (moving) return;
  await ensure();
  if (!win || win.isDestroyed()) return;
  clearTimeout(hideTimer);
  place();
  shown = true;
  win.setAlwaysOnTop(true, 'screen-saver');
  win.showInactive();
  win.moveTop();
  push();
  if (!(active && cfg().pinned)) hideTimer = setTimeout(() => conceal(), 3500);
}
function conceal(now = false) {
  clearTimeout(hideTimer);
  if (!shown || moving) return;
  shown = false;
  if (!win || win.isDestroyed()) return;
  win.webContents.send('barra:state', payload()); // se va con su animación
  hideTimer = setTimeout(() => !shown && !moving && win && !win.isDestroyed() && win.hide(), now ? 0 : 450);
}

// ---------- Atajos ----------
const ICONOS = { play: 'pause', next: 'next', prev: 'prev', like: 'heart', lyrics: 'lyrics', toggle: 'pin' };
async function accion(id) {
  const c = cfg();
  if (id === 'toggle') {
    c.pinned = !(c.pinned && shown);
    nh.config.save();
    if (c.pinned) return reveal();
    return conceal();
  }
  if (id === 'lyrics') {
    c.lyrics = !c.lyrics;
    nh.config.save();
    chip = { icon: 'lyrics', text: c.lyrics ? 'Con letra' : 'Sin letra', at: Date.now() };
    return reveal();
  }
  const cmd = { play: 'toggle', next: 'next', prev: 'prev', like: 'like' }[id];
  if (!cmd) return;
  const v = nh.spotify.view();
  chip = {
    icon: id === 'play' ? (v.playing ? 'pause' : 'play') : ICONOS[id],
    text: { play: v.playing ? 'En pausa' : 'Reproduciendo', next: 'Siguiente', prev: 'Anterior', like: v.liked ? 'Quitado de Me gusta' : 'Agregado a Me gusta' }[id],
    at: Date.now(),
  };
  reveal();
  try {
    const r = await nh.spotify.control(cmd);
    if (r && r.ok === false && id === 'like') chip = { icon: 'heart', text: 'Me gusta necesita Spotify conectado', at: Date.now() };
  } catch (e) {
    nh.anotar('barra de música', e);
  }
  push();
}

function registrarAtajos() {
  soltarAtajos();
  const keys = atajos(cfg().keys);
  const malos = [];
  for (const [id, acc] of Object.entries(keys)) {
    try {
      if (globalShortcut.register(acc, () => accion(id))) registered.push(acc);
      else malos.push(acc);
    } catch (e) {
      malos.push(acc);
      nh.anotar('barra de música', e);
    }
  }
  if (malos.length) nh.send('toast', `No se pudo usar ${malos.map(texto).join(', ')}: ${malos.length === 1 ? 'lo usa' : 'los usa'} otro programa. Cámbialo en Ajustes → Sonido → Opciones de la barra de música → Atajos.`);
}
function soltarAtajos() {
  for (const acc of registered) {
    try {
      globalShortcut.unregister(acc);
    } catch {}
  }
  registered = [];
}
// ¿Se puede usar ese atajo? (si ya es nuestro, sí; si no, se prueba registrarlo y se suelta al tiro)
function libre(acc) {
  if (!globalShortcut || registered.includes(acc)) return true;
  try {
    const ok = globalShortcut.register(acc, () => {});
    if (ok) globalShortcut.unregister(acc);
    return ok;
  } catch {
    return false;
  }
}
// "Control+Alt+Right" → "Ctrl + Alt + →" (para los avisos)
function texto(acc) {
  const N = { Control: 'Ctrl', Space: 'Espacio', Up: '↑', Down: '↓', Left: '←', Right: '→', PageUp: 'RePág', PageDown: 'AvPág', Home: 'Inicio', End: 'Fin', Insert: 'Insert', Delete: 'Supr' };
  return String(acc).split('+').map((p) => N[p] || p).join(' + ');
}

// ---------- "Jugando a…": empieza y termina ----------
function activar() {
  if (active) return;
  active = true;
  songKey = '';
  nh.spotify.watch(true); // que la música se mantenga al día mientras juegas
  if (enabled()) registrarAtajos();
  // Se muestra apenas se sepa qué suena (musica(), abajo); si no suena nada, no aparece
}
function desactivar() {
  if (!active) return;
  active = false;
  nh.spotify.watch(false);
  soltarAtajos();
  conceal(true);
}

// Llega el estado de la música (lo llama main.js en cada cambio): otra canción → se muestra un rato
function musica(state) {
  if (!active || !state) return;
  const key = state.running && state.title ? `${state.title}\u0000${state.artist || ''}` : '';
  if (key && key !== songKey) {
    songKey = key; // al empezar a jugar y en cada canción nueva
    return reveal();
  }
  push();
}

// ---------- Mover la barra (Ajustes → Sonido → Mover la barra) ----------
async function mover() {
  await ensure();
  if (!win || win.isDestroyed()) return;
  clearTimeout(hideTimer);
  place();
  moving = { before: { ...cfg() } };
  win.setIgnoreMouseEvents(false);
  win.setFocusable(true);
  win.showInactive();
  win.moveTop();
  win.focus();
  push();
}
function terminarMover(guardar) {
  if (!moving || !win || win.isDestroyed()) return (moving = null);
  if (guardar) {
    const b = win.getBounds();
    const d = screen.getDisplayMatching(b);
    Object.assign(cfg(), { pos: 'free', free: fraccion(b, d.bounds) });
    nh.config.save();
    nh.send('toast', 'Barra de música: quedó donde la dejaste');
  }
  moving = null;
  win.setIgnoreMouseEvents(true);
  win.setFocusable(false);
  place();
  if (active && enabled()) {
    shown = false;
    reveal();
  } else {
    shown = false;
    win.webContents.send('barra:state', payload());
    win.hide();
  }
}

function registrar(o) {
  nh = o;
  ipcMain.on('barra:ready', () => push());
  ipcMain.on('barra:nudge', (_e, dx, dy) => {
    if (!moving || !win || win.isDestroyed()) return;
    const b = win.getBounds();
    win.setBounds({ ...b, x: b.x + Math.round(Number(dx) || 0), y: b.y + Math.round(Number(dy) || 0) });
  });
  ipcMain.on('barra:move-end', (_e, guardar) => terminarMover(!!guardar));
  // Atajos (la ventanita de Ajustes → Sonido → Atajos de la barra de música, en cualquier consola)
  ipcMain.handle('musicbar:keys', () => {
    const keys = atajos(cfg().keys);
    return { keys, defaults: POR_DEFECTO, actions: ACCIONES.map(([id, label]) => ({ id, label })), busy: Object.keys(keys).filter((id) => !libre(keys[id])) };
  });
  // La ventanita "Barra de música" de Ajustes: lugar y tamaño (con vista previa), moverla
  const estado = () => {
    const c = cfg();
    const positions = POSICIONES.filter(([id]) => id !== 'free' || c.free).map(([id, label]) => ({ id, label }));
    return { on: enabled(), pos: positions.some((x) => x.id === c.pos) ? c.pos : 'tc', positions, size: TAMANOS.some(([id]) => id === c.size) ? c.size : 'm', sizes: TAMANOS.map(([id, label]) => ({ id, label })) };
  };
  ipcMain.handle('musicbar:get', () => estado());
  ipcMain.handle('musicbar:set', (_e, key, value) => {
    const c = cfg();
    if (key === 'pos' && POSICIONES.some(([id]) => id === value) && (value !== 'free' || c.free)) c.pos = value;
    else if (key === 'size' && TAMANOS.some(([id]) => id === value)) c.size = value;
    else return estado();
    nh.config.save();
    vistaPrevia().catch((e) => nh.anotar('barra de música', e));
    return estado();
  });
  ipcMain.handle('musicbar:move', () => mover().catch((e) => nh.anotar('barra de música', e)));
  ipcMain.handle('musicbar:key-set', (_e, id, acc) => {
    if (!(id in POR_DEFECTO)) return { ok: false, message: 'Ese atajo no existe' };
    const c = cfg();
    const nuevo = acc == null ? POR_DEFECTO[id] : String(acc);
    if (!atajoValido(nuevo)) return { ok: false, message: 'Usa Ctrl o Alt junto con una letra, un número, una flecha o una tecla F' };
    const keys = atajos(c.keys);
    const otro = Object.keys(keys).find((k) => k !== id && keys[k] === nuevo);
    if (otro) return { ok: false, message: `Ese ya es el atajo de "${ACCIONES.find(([a]) => a === otro)[1]}"` };
    if (!libre(nuevo)) return { ok: false, message: `${texto(nuevo)} lo usa otro programa: elige otro` };
    c.keys = { ...keys, [id]: nuevo };
    nh.config.save();
    if (active && enabled()) registrarAtajos();
    return { ok: true, keys: atajos(c.keys) };
  });
  // Mientras eliges una combinación, los atajos se sueltan (si no, Windows se la come antes de llegar a la ventanita)
  ipcMain.handle('musicbar:capture', (_e, on) => {
    if (on) soltarAtajos();
    else if (active && enabled()) registrarAtajos();
    return true;
  });
}

// Opciones para Ajustes → Sonido (menuSections de main.js)
function opciones() {
  const c = () => cfg();
  return [
    {
      id: 'musicBar',
      type: 'toggle',
      label: 'Barra de música al jugar',
      desc: 'Sale encima del juego al cambiar de canción o al apretar un atajo (en juegos en ventana sin bordes).',
      value: enabled(),
      set: (v) => {
        c().on = !!v;
        nh.config.save();
        if (!active) return;
        if (v) (registrarAtajos(), reveal());
        else (soltarAtajos(), conceal(true));
      },
    },
    { id: 'musicbar', type: 'action', label: 'Opciones de la barra de música', desc: 'Lugar, tamaño, moverla a mano y sus atajos.', closes: true, run: () => (nh.mostrarVentana(), nh.send('shell:musicbar')) },
  ];
}

function destroy() {
  soltarAtajos();
  if (win && !win.isDestroyed()) win.destroy();
  win = null;
}

module.exports = { registrar, activar, desactivar, musica, opciones, destroy, atajoValido, atajos, lugar, fraccion, forma, texto, escala, POR_DEFECTO, ACCIONES, POSICIONES, TAMANOS };
