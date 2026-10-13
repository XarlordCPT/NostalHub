/* Control (PS5, PS4, Xbox… con el "mapeo estándar" del navegador) para todas las consolas.
   Cada botón se convierte en la tecla que ya usa cada tema (flechas, Enter, Esc, O, Q/E…), así que los temas
   no necesitan saber nada del control. Solo funciona con NostalHub activa (en primer plano).

   ✕ aceptar (Enter) · ○ volver (Esc) · △ opciones (O) · □ cambiar imágenes (I)
   L1/R1 pestaña o página · L2/R2 rápido (RePág/AvPág) · Options menú de la consola
   Create ordenar (S); en la Wii y la PS2, Amigos (A)
   Cruceta y stick izquierdo: moverse (mantener = repetir) · Stick derecho: rueda

   Al usar el control, las pistas de la pantalla ("Enter Elegir") muestran sus botones (✕ ○ △ □).
   El DualSense también se lee directo por HID (ver más abajo), porque con Steam abierto el navegador no lo ve. */
(() => {
  // Botones del mapeo estándar (los mismos números para PS5, PS4 y Xbox)
  const B = { cross: 0, circle: 1, square: 2, triangle: 3, l1: 4, r1: 5, l2: 6, r2: 7, create: 8, options: 9, up: 12, down: 13, left: 14, right: 15 };

  // Tecla de cada botón. Algunos cambian según la consola (qué tecla usa ese tema para lo mismo).
  const BASE = {
    cross: 'Enter',
    circle: 'Escape',
    triangle: 'o',
    square: 'i',
    l1: 'PageUp',
    r1: 'PageDown',
    l2: 'PageUp',
    r2: 'PageDown',
    create: 's',
    options: null,
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
  };
  const BY_CONSOLE = {
    selector: { options: 'o' }, // ordenar las consolas
    x360: { l1: 'q', r1: 'e', options: 'g' }, // pestañas y la Guía
    vita: { l1: 'q', r1: 'e', options: 'p' }, // tarjetas y menú rápido
    ps4: { options: 'p' }, // menú rápido
    ps2: { options: 'c', create: 'a' }, // Configuración y Amigos (no tiene ordenar)
    wii: { create: 'a' }, // Amigos (no tiene ordenar)
  };
  // Los que se repiten al mantenerlos apretados (como una tecla)
  const REPEAT = new Set(['up', 'down', 'left', 'right', 'l2', 'r2']);
  const REPEAT_DELAY = 380;
  const REPEAT_EVERY = 110;

  // Lo que muestran las pistas cuando se usa el control
  const PAD_LABEL = { Enter: '✕', Esc: '○', Escape: '○', O: '△', o: '△', I: '□', 'Q / E': 'L1 / R1', G: 'Options', P: 'Options', C: 'Options', S: 'Create', A: 'Create', '+': '△' };
  const HINT_KEYS = '.ps-key, .xb-key, .p3-hints kbd, .sw-hint > b, .sw-fr-hint > b, #sel-sort kbd, .sel-move-hint kbd';

  const consoleId = () => document.body.dataset.console || 'selector';
  const keyFor = (name) => {
    const over = BY_CONSOLE[consoleId()];
    return over && name in over ? over[name] : BASE[name];
  };

  // ---------- Teclas simuladas ----------
  // Si Steam también convierte el control en teclas (su "configuración de escritorio"), llegarían dos veces:
  // las teclas de verdad que coinciden con lo que el control está apretando (o acaba de soltar) se ignoran.
  const padHeld = new Map(); // tecla -> veces apretada por el control
  const padAt = new Map(); // tecla -> último momento en que el control la mandó o la soltó
  const realAt = new Map(); // tecla -> último momento en que llegó una tecla de verdad
  const SAME_MS = 150;

  function send(key, repeat = false) {
    if (!key) return;
    const now = performance.now();
    if (!repeat && now - (realAt.get(key) || -1e9) < SAME_MS) return; // ya llegó por el teclado (Steam)
    padAt.set(key, now);
    const target = document.activeElement && document.activeElement !== document.body ? document.activeElement : document.body;
    const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, repeat });
    const notCanceled = target.dispatchEvent(ev);
    // Como el teclado: Enter sobre un botón enfocado lo aprieta (si nadie lo atendió antes)
    if (notCanceled && key === 'Enter' && !repeat && target.matches && target.matches('button, a[href], [role="button"]')) target.click();
  }

  window.addEventListener(
    'keydown',
    (e) => {
      if (!e.isTrusted) return;
      const now = performance.now();
      const fromPad = padHeld.get(e.key) > 0 || now - (padAt.get(e.key) || -1e9) < SAME_MS;
      if (fromPad) {
        e.stopImmediatePropagation();
        e.preventDefault();
        return;
      }
      realAt.set(e.key, now);
      setMode('keys'); // volviste al teclado: las pistas muestran las teclas
    },
    true
  );

  // ---------- Pistas con los botones del control ----------
  let mode = 'keys';
  let relabelQueued = false;
  function relabel() {
    relabelQueued = false;
    document.querySelectorAll(HINT_KEYS).forEach((el) => {
      if (el.dataset.key === undefined) el.dataset.key = el.textContent.trim();
      const k = el.dataset.key;
      const text = mode === 'pad' && PAD_LABEL[k] ? PAD_LABEL[k] : k;
      if (el.textContent !== text) el.textContent = text;
      el.classList.toggle('pad-glyph', mode === 'pad' && !!PAD_LABEL[k]);
    });
  }
  const queueRelabel = () => {
    if (relabelQueued) return;
    relabelQueued = true;
    requestAnimationFrame(relabel);
  };
  // Las pistas se redibujan seguido: mientras se usa el control, se vuelven a cambiar
  new MutationObserver(() => mode === 'pad' && queueRelabel()).observe(document.documentElement, { childList: true, subtree: true });
  function setMode(m) {
    if (mode === m) return;
    mode = m;
    document.body.dataset.input = m;
    queueRelabel();
  }

  // ---------- Rueda (stick derecho) ----------
  let mouse = null;
  window.addEventListener('mousemove', (e) => (mouse = { x: e.clientX, y: e.clientY }), { passive: true });
  function wheel(dy) {
    const p = mouse || { x: innerWidth / 2, y: innerHeight / 2 };
    const el = document.elementFromPoint(p.x, p.y) || document.body;
    el.dispatchEvent(new WheelEvent('wheel', { deltaY: dy * 120, deltaMode: 0, bubbles: true, cancelable: true, clientX: p.x, clientY: p.y }));
  }

  // ---------- Lectura del control ----------
  const prev = new Map(); // "índice del control:botón" -> apretado
  const timers = new Map(); // botón -> { next, key }
  let raf = 0;

  // ¿Se puede usar ahora? Con NostalHub activa, y mientras juegas solo ✕ y ○ (para "Volver al menú")
  function allowed(name) {
    if (document.hidden || !document.hasFocus()) return false;
    if (document.body.classList.contains('playing')) return name === 'cross' || name === 'circle';
    return true;
  }

  function press(name, now) {
    setMode('pad');
    if (name === 'rsUp' || name === 'rsDown') {
      wheel(name === 'rsUp' ? -1 : 1);
      timers.set(name, { next: now + REPEAT_DELAY, wheel: true });
      return;
    }
    const key = keyFor(name);
    if (!key) return;
    padHeld.set(key, (padHeld.get(key) || 0) + 1);
    send(key);
    timers.set(name, { next: REPEAT.has(name) ? now + REPEAT_DELAY : Infinity, key });
  }
  function release(name) {
    const t = timers.get(name);
    timers.delete(name);
    if (t && t.key) {
      padHeld.set(t.key, Math.max(0, (padHeld.get(t.key) || 0) - 1));
      padAt.set(t.key, performance.now());
    }
  }

  // Sticks: cuenta como apretado pasando la mitad, y se suelta bajo un tercio (para que no tiemble)
  function stick(x, y, was) {
    const dead = was ? 0.33 : 0.5;
    if (Math.abs(x) < dead && Math.abs(y) < dead) return null;
    return Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : y > 0 ? 'down' : 'up';
  }
  const lsDir = new Map(); // control -> dirección del stick izquierdo
  const rsDir = new Map(); // control -> dirección del stick derecho

  // ---------- DualSense leído directo (HID) ----------
  // Con Steam abierto, Steam pasa el control de PS5 a su "modo completo" (por Bluetooth manda el reporte 0x31) y el
  // navegador deja de verlo como control. Aquí se lee directo y se convierte al mismo formato que el resto.
  // (main.js da permiso solo a los controles de Sony.)
  const SONY = 0x054c;
  const DUALSENSE = [0x0ce6, 0x0df2]; // DualSense y DualSense Edge
  const hidPads = new Map(); // dispositivo -> { index, buttons, axes }
  function parseDualSense(reportId, data) {
    let o;
    if (reportId === 0x31 && data.byteLength >= 11) o = 1; // Bluetooth, modo completo (el que activa Steam)
    else if (reportId === 0x01 && data.byteLength >= 32) o = 0; // por cable (USB)
    else return null; // Bluetooth simple: ese sí lo ve el navegador como control
    const u = (i) => data.getUint8(o + i);
    const axis = (v) => Math.max(-1, Math.min(1, (v - 128) / 127));
    const b0 = u(7); // cruceta (0-7, 8 = suelta) + □ ✕ ○ △
    const b1 = u(8); // L1 R1 L2 R2 Create Options L3 R3
    const b2 = u(9); // PS, panel táctil
    const hat = b0 & 0x0f;
    const on = [b0 & 0x20, b0 & 0x40, b0 & 0x10, b0 & 0x80, b1 & 0x01, b1 & 0x02, b1 & 0x04, b1 & 0x08, b1 & 0x10, b1 & 0x20, b1 & 0x40, b1 & 0x80,
      hat === 7 || hat === 0 || hat === 1, hat >= 3 && hat <= 5, hat >= 5 && hat <= 7, hat >= 1 && hat <= 3, b2 & 0x01];
    return { buttons: on.map((x) => ({ pressed: !!x, value: x ? 1 : 0 })), axes: [axis(u(0)), axis(u(1)), axis(u(2)), axis(u(3))] };
  }
  async function openHid(d) {
    if (!d || d.vendorId !== SONY || !DUALSENSE.includes(d.productId) || hidPads.has(d)) return;
    const pad = { index: 100 + hidPads.size, buttons: [], axes: [0, 0, 0, 0] };
    hidPads.set(d, pad);
    try {
      if (!d.opened) await d.open();
    } catch {
      hidPads.delete(d);
      return;
    }
    d.addEventListener('inputreport', (e) => {
      const st = parseDualSense(e.reportId, e.data);
      if (!st) return;
      pad.buttons = st.buttons;
      pad.axes = st.axes;
      start();
    });
  }
  if (navigator.hid) {
    navigator.hid.getDevices().then((list) => list.forEach(openHid)).catch(() => {});
    navigator.hid.addEventListener('connect', (e) => openHid(e.device));
    navigator.hid.addEventListener('disconnect', (e) => hidPads.delete(e.device));
  }

  function poll() {
    raf = requestAnimationFrame(poll);
    // Sin NostalHub activa no se lee nada (vuelve a empezar al hacerle clic)
    if (document.hidden || !document.hasFocus()) {
      for (const name of [...timers.keys()]) release(name);
      cancelAnimationFrame(raf);
      raf = 0;
      return;
    }
    const pads = [...(navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : []), ...hidPads.values()];
    const now = performance.now();
    const down = new Set();
    for (const gp of pads) {
      for (const [name, i] of Object.entries(B)) {
        const b = gp.buttons[i];
        if (b && (b.pressed || b.value > 0.5)) down.add(name);
      }
      const ax = gp.axes || [];
      const ls = stick(ax[0] || 0, ax[1] || 0, lsDir.get(gp.index));
      lsDir.set(gp.index, ls);
      if (ls) down.add(ls);
      const rsY = ax[3] || 0;
      const rs = Math.abs(rsY) > (rsDir.get(gp.index) ? 0.33 : 0.5) ? (rsY > 0 ? 'rsDown' : 'rsUp') : null;
      rsDir.set(gp.index, rs);
      if (rs) down.add(rs);
    }
    // Recién apretados / soltados (lo de antes de tener NostalHub activa no cuenta)
    for (const name of down) {
      if (prev.get(name)) continue;
      prev.set(name, true);
      if (allowed(name)) press(name, now);
    }
    for (const [name, was] of prev) {
      if (was && !down.has(name)) {
        prev.set(name, false);
        release(name);
      }
    }
    // Mantener apretado = repetir (como una tecla)
    for (const [name, t] of timers) {
      if (now < t.next) continue;
      if (!allowed(name)) {
        release(name);
        continue;
      }
      t.next = now + REPEAT_EVERY;
      if (t.wheel) wheel(name === 'rsUp' ? -1 : 1);
      else send(t.key, true);
    }
    if (!pads.length) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }
  const start = () => !raf && (raf = requestAnimationFrame(poll));
  window.addEventListener('gamepadconnected', start);
  window.addEventListener('focus', start);
  start(); // por si ya estaba conectado
})();
