/* Tema PS Vita: pantalla de bloqueo que se despega, páginas de burbujas (de arriba a abajo),
   tarjetas "LiveArea" que se abren con la burbuja girando y se cierran despegando la esquina,
   apps del sistema (Grupo de Discord, Música de Spotify, Trofeos, Biblioteca, Ajustes),
   menú rápido y avisos. Se registra en window.Themes.vita. */
(() => {
  const W = 1920;
  const H = 1080;
  const BAR = 64; // barra superior
  const D = 236; // tamaño de las burbujas
  const PER_PAGE = 10;
  // Lugar de cada burbuja en la página: filas de 3, 4 y 3, como la Vita
  const ROWS_Y = [250, 556, 862];
  const SLOTS = [
    ...[490, 960, 1430].map((x) => ({ x, y: ROWS_Y[0], row: 0 })),
    ...[255, 725, 1195, 1665].map((x) => ({ x, y: ROWS_Y[1], row: 1 })),
    ...[490, 960, 1430].map((x) => ({ x, y: ROWS_Y[2], row: 2 })),
  ];
  // Tarjetas (LiveArea): una al lado de la otra, a la derecha del inicio
  const CARD_X = 110;
  const CARD_W = W - CARD_X * 2;
  const CARD_GAP = 40;
  const CARD_TOP = 128;
  const CARD_H = H - CARD_TOP + 40; // sigue un poco bajo el borde de la pantalla
  const MAX_CARDS = 5;
  const TAG = 124; // burbuja colgando arriba de la tarjeta
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const pad2 = (n) => String(n).padStart(2, '0');
  const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  // ---------- Íconos de trazo (botones y listas) ----------
  const I = {
    home: '<path d="M7 24 24 9l17 15"/><path d="M12 21v18h9V29h6v10h9V21"/>',
    music: '<path d="M19 35V11l20-4v23"/><circle cx="14" cy="35" r="5.5" fill="currentColor"/><circle cx="34" cy="30" r="5.5" fill="currentColor"/>',
    headset: '<path d="M8 30v-6a16 16 0 0 1 32 0v6"/><rect x="6" y="28" width="8" height="12" rx="3"/><rect x="34" y="28" width="8" height="12" rx="3"/><path d="M40 40c0 4-5 6-12 6"/>',
    trophy: '<path d="M16 8h16v10a8 8 0 0 1-16 0Z"/><path d="M16 11H9v3a6 6 0 0 0 7 6M32 11h7v3a6 6 0 0 1-7 6"/><path d="M24 26v8M17 40h14M19 34h10v6H19z"/>',
    play: '<path d="M15 9l25 15-25 15Z" fill="currentColor"/>',
    pause: '<path d="M14 10h7v28h-7zM27 10h7v28h-7z" fill="currentColor"/>',
    prev: '<path d="M14 10v28M38 10 18 24l20 14Z" fill="currentColor"/>',
    next: '<path d="M34 10v28M10 10l20 14-20 14Z" fill="currentColor"/>',
    micOff: '<rect x="18" y="6" width="12" height="22" rx="6"/><path d="M11 23a13 13 0 0 0 26 0M24 36v6M8 8l32 32"/>',
    deaf: '<path d="M8 30v-6a16 16 0 0 1 32 0v6"/><rect x="6" y="28" width="8" height="12" rx="3"/><rect x="34" y="28" width="8" height="12" rx="3"/><path d="M6 6l36 36"/>',
    check: '<path d="M10 25l9 9 19-20"/>',
    chevron: '<path d="M18 10l14 14-14 14"/>',
    left: '<path d="M30 8 14 24l16 16"/>',
    right: '<path d="M18 8l16 16-16 16"/>',
    swap: '<path d="M8 17h30l-7-7M40 31H10l7 7"/>',
    power: '<path d="M16 12a15 15 0 1 0 16 0"/><path d="M24 6v17"/>',
    restart: '<path d="M38 24a14 14 0 1 1-4-10"/><path d="M36 6v9h-9"/>',
    gear: '<circle cx="24" cy="24" r="6"/><path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.6 10.6l4.2 4.2M33.2 33.2l4.2 4.2M10.6 37.4l4.2-4.2M33.2 14.8l4.2-4.2"/><circle cx="24" cy="24" r="12"/>',
    pad: '<path d="M14 15h20c6 0 9 4 10 10l1 6c1 6-5 9-9 5l-5-5H17l-5 5c-4 4-10 1-9-5l1-6c1-6 4-10 10-10Z"/><path d="M15 22v7M11.5 25.5h7"/><circle cx="32" cy="23" r="1.6" fill="currentColor"/><circle cx="36" cy="27" r="1.6" fill="currentColor"/>',
    screen: '<rect x="5" y="8" width="38" height="25" rx="2"/><path d="M18 41h12M24 33v8"/>',
    speaker: '<path d="M8 19h8l10-8v26l-10-8H8Z"/><path d="M32 18a8 8 0 0 1 0 12M36 13a14 14 0 0 1 0 22"/>',
    folder: '<path d="M5 13h14l4 4h20v22H5Z"/><path d="M5 21h38"/>',
    clock: '<circle cx="24" cy="24" r="17"/><path d="M24 13v12l8 5"/>',
    info: '<circle cx="24" cy="24" r="17"/><path d="M24 22v12M24 15v1"/>',
    bell: '<path d="M12 34V22a12 12 0 0 1 24 0v12l4 4H8Z"/><path d="M20 42a4 4 0 0 0 8 0"/>',
    plus: '<path d="M24 10v28M10 24h28"/>',
    sort: '<path d="M14 10v28M8 32l6 6 6-6M34 38V10M28 16l6-6 6 6"/>',
  };
  const icon = (name, cls = '') =>
    `<svg class="v-ic ${cls}" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">${I[name] || ''}</svg>`;

  // ---------- Dibujos de las burbujas del sistema (propios) ----------
  const ART = {
    party: `<svg viewBox="0 0 100 100"><defs><radialGradient id="vpa" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#f29a12"/></radialGradient></defs>
      <rect width="100" height="100" fill="url(#vpa)"/>
      <circle cx="50" cy="54" r="22" fill="#fff" stroke="#2b2f3a" stroke-width="2.5"/>
      <circle cx="42" cy="52" r="3.2" fill="#2b2f3a"/><circle cx="58" cy="52" r="3.2" fill="#2b2f3a"/>
      <path d="M43 62q7 6 14 0" fill="none" stroke="#2b2f3a" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M24 56v-8a26 26 0 0 1 52 0v8" fill="none" stroke="#2b2f3a" stroke-width="5"/>
      <rect x="19" y="50" width="11" height="17" rx="4" fill="#3c6fd8" stroke="#2b2f3a" stroke-width="2"/>
      <rect x="70" y="50" width="11" height="17" rx="4" fill="#3c6fd8" stroke="#2b2f3a" stroke-width="2"/>
      <path d="M75 67q0 10-16 11" fill="none" stroke="#2b2f3a" stroke-width="2.5"/><circle cx="57" cy="78" r="3.5" fill="#2b2f3a"/></svg>`,
    music: `<svg viewBox="0 0 100 100"><defs><linearGradient id="vmu" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b05cff"/><stop offset="1" stop-color="#3a2fd6"/></linearGradient></defs>
      <rect width="100" height="100" fill="url(#vmu)"/>
      <circle cx="74" cy="22" r="26" fill="rgba(255,255,255,.12)"/>
      <path d="M40 70V30l32-7v40" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>
      <ellipse cx="32" cy="71" rx="10" ry="8" fill="#fff"/><ellipse cx="64" cy="64" rx="10" ry="8" fill="#fff"/></svg>`,
    store: `<svg viewBox="0 0 100 100"><defs><linearGradient id="vst" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe9f7"/></linearGradient></defs>
      <rect width="100" height="100" fill="url(#vst)"/>
      <path d="M38 38v-6a12 12 0 0 1 24 0v6" fill="none" stroke="#1f6fe0" stroke-width="5" stroke-linecap="round"/>
      <path d="M26 38h48l-4 38H30Z" fill="#1f6fe0"/>
      <path d="M50 48l3.6 7.4 8 1.1-5.8 5.6 1.4 8L50 66.3l-7.2 3.8 1.4-8-5.8-5.6 8-1.1Z" fill="#fff"/></svg>`,
    friends: `<svg viewBox="0 0 100 100"><defs><linearGradient id="vfr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#29d3c2"/><stop offset="1" stop-color="#0d8b9c"/></linearGradient></defs>
      <rect width="100" height="100" fill="url(#vfr)"/>
      <circle cx="62" cy="40" r="11" fill="rgba(255,255,255,.65)"/><path d="M44 74c0-13 8-20 18-20s18 7 18 20Z" fill="rgba(255,255,255,.65)"/>
      <circle cx="40" cy="44" r="12" fill="#fff"/><path d="M20 80c0-14 9-22 20-22s20 8 20 22Z" fill="#fff"/></svg>`,
    library: `<svg viewBox="0 0 100 100"><defs><linearGradient id="vli" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef6ff"/><stop offset="1" stop-color="#c9dcf3"/></linearGradient></defs>
      <rect width="100" height="100" fill="url(#vli)"/>
      <rect x="24" y="24" width="23" height="23" rx="6" fill="#ff6a5c"/><rect x="53" y="24" width="23" height="23" rx="6" fill="#ffc23d"/>
      <rect x="24" y="53" width="23" height="23" rx="6" fill="#3fb6ff"/><rect x="53" y="53" width="23" height="23" rx="6" fill="#53d36c"/></svg>`,
    random: `<svg viewBox="0 0 100 100"><defs><linearGradient id="vra" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8be35a"/><stop offset="1" stop-color="#1f9d47"/></linearGradient></defs>
      <rect width="100" height="100" fill="url(#vra)"/>
      <g transform="rotate(-14 50 50)"><rect x="27" y="27" width="46" height="46" rx="10" fill="#fff"/>
      <circle cx="38" cy="38" r="4.4" fill="#1f7d3c"/><circle cx="62" cy="38" r="4.4" fill="#1f7d3c"/><circle cx="50" cy="50" r="4.4" fill="#1f7d3c"/>
      <circle cx="38" cy="62" r="4.4" fill="#1f7d3c"/><circle cx="62" cy="62" r="4.4" fill="#1f7d3c"/></g></svg>`,
    trophies: `<svg viewBox="0 0 100 100"><defs><radialGradient id="vtr" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#3a3a3a"/><stop offset="1" stop-color="#0a0a0a"/></radialGradient>
      <linearGradient id="vtg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1a8"/><stop offset=".5" stop-color="#f2c230"/><stop offset="1" stop-color="#b47a0c"/></linearGradient></defs>
      <rect width="100" height="100" fill="url(#vtr)"/>
      <path d="M32 24h36v16a18 18 0 0 1-36 0Z" fill="url(#vtg)"/>
      <path d="M32 29H22v5a11 11 0 0 0 11 11M68 29h10v5a11 11 0 0 1-11 11" fill="none" stroke="url(#vtg)" stroke-width="5"/>
      <rect x="46" y="57" width="8" height="10" fill="url(#vtg)"/><rect x="36" y="67" width="28" height="9" rx="2" fill="url(#vtg)"/></svg>`,
    profile: `<svg viewBox="0 0 100 100"><defs><linearGradient id="vpr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#58a8ff"/><stop offset="1" stop-color="#1b4fc4"/></linearGradient></defs>
      <rect width="100" height="100" fill="url(#vpr)"/>
      <circle cx="50" cy="40" r="15" fill="#fff"/><path d="M24 82c0-17 12-26 26-26s26 9 26 26Z" fill="#fff"/></svg>`,
    settings: `<svg viewBox="0 0 100 100"><defs><linearGradient id="vse" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f6fa"/><stop offset="1" stop-color="#b9c1cf"/></linearGradient></defs>
      <rect width="100" height="100" fill="url(#vse)"/>
      <g fill="#4d5668"><circle cx="50" cy="50" r="19"/>
      ${Array.from({ length: 8 }, (_, i) => `<rect x="45" y="22" width="10" height="12" rx="2" transform="rotate(${i * 45} 50 50)"/>`).join('')}</g>
      <circle cx="50" cy="50" r="8" fill="#e8ecf2"/></svg>`,
    consoles: `<svg viewBox="0 0 100 100"><defs><linearGradient id="vco" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a4256"/><stop offset="1" stop-color="#121722"/></linearGradient></defs>
      <rect width="100" height="100" fill="url(#vco)"/>
      <path d="M30 40h40c8 0 12 5 13 13l1 8c1 8-7 12-12 7l-7-7H35l-7 7c-5 5-13 1-12-7l1-8c1-8 5-13 13-13Z" fill="#fff"/>
      <path d="M31 47v12M25 53h12" stroke="#121722" stroke-width="4" stroke-linecap="round"/>
      <circle cx="64" cy="50" r="3.2" fill="#e8484f"/><circle cx="71" cy="56" r="3.2" fill="#3fb6ff"/></svg>`,
  };

  // Apps del sistema (primera página)
  const SYSTEM = [
    { id: 'party', label: 'Grupo' },
    { id: 'music', label: 'Música' },
    { id: 'store', label: 'Tienda' },
    { id: 'friends', label: 'Amigos' },
    { id: 'library', label: 'Biblioteca' },
    { id: 'random', label: 'Juego al azar' },
    { id: 'trophies', label: 'Trofeos' },
    { id: 'profile', label: 'Perfil' },
    { id: 'settings', label: 'Ajustes' },
    { id: 'consoles', label: 'Consolas' },
  ];
  const CARD_TITLES = { party: 'Grupo', music: 'Música', trophies: 'Trofeos', library: 'Biblioteca', settings: 'Ajustes' };

  const MARKUP = `
<div class="v-wall"><div class="v-light l1"></div><div class="v-light l2"></div><div class="v-light l3"></div></div>
<div class="v-track">
  <section class="v-home"><div class="v-pages"></div></section>
  <div class="v-cards"></div>
</div>
<div class="v-dots"></div>
<button class="v-edge left" aria-label="Anterior">${icon('left')}</button>
<button class="v-edge right" aria-label="Siguiente">${icon('right')}</button>
<div class="v-fly"></div>

<!-- Pantalla de bloqueo -->
<div class="v-lock">
  <div class="v-lock-body">
    <div class="v-wall"><div class="v-light l1"></div><div class="v-light l2"></div></div>
    <div class="v-lock-time"></div>
    <div class="v-lock-date"></div>
    <div class="v-lock-hint">Despega la esquina para empezar</div>
  </div>
  <svg class="v-flap" aria-hidden="true"><defs><linearGradient class="v-flap-g" id="v-flap-lock" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b9c4d6"/></linearGradient></defs><polygon fill="url(#v-flap-lock)"/></svg>
  <div class="v-corner"></div>
</div>

<!-- Barra superior -->
<header class="v-bar">
  <div class="v-bar-left"><svg class="v-signal" viewBox="0 0 40 28"><rect x="1" y="20" width="6" height="7"/><rect x="11" y="14" width="6" height="13"/><rect x="21" y="8" width="6" height="19"/><rect x="31" y="2" width="6" height="25"/></svg><span class="v-hint"></span></div>
  <div class="v-tasks"></div>
  <div class="v-bar-right"><span class="v-clock"></span><span class="v-batt"><i></i></span></div>
</header>
<button class="v-notif" aria-label="Avisos"><span>0</span></button>
<div class="v-notif-panel" hidden><div class="v-np-head">${icon('bell')}<span>Avisos</span></div><div class="v-np-list"></div></div>

<!-- Menú rápido -->
<div class="v-qm" hidden><div class="v-qm-panel"></div></div>

<!-- Ventanita para elegir una opción -->
<div class="v-pop" hidden><div class="v-pop-box"><div class="v-pop-title"></div><div class="v-pop-list"></div></div></div>

<!-- Jugando -->
<section class="v-playing" hidden>
  <div class="v-wall"><div class="v-light l1"></div><div class="v-light l2"></div></div>
  <div class="v-play-center">
    <div class="v-play-bub"></div>
    <div class="v-play-label">Jugando a</div>
    <div class="v-play-name"></div>
    <div class="v-play-time">0:00</div>
    <button class="v-pill sel" data-p="stop"><span>Volver al menú</span></button>
  </div>
</section>
`;

  // ---------- Despegar la esquina (bloqueo y tarjetas) ----------
  // Recorta el rectángulo por una línea a 45° y dibuja la parte doblada (su reflejo).
  function clipRect(w, h, keep) {
    const pts = [
      [0, 0],
      [w, 0],
      [w, h],
      [0, h],
    ];
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const ia = keep(a);
      const ib = keep(b);
      if (ia) out.push(a);
      if (ia !== ib) {
        // punto donde el borde cruza la línea x - y = c
        const fa = a[0] - a[1];
        const fb = b[0] - b[1];
        const c = keep.c;
        const t = (c - fa) / (fb - fa);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  }
  function makePeel({ el, body, flap, w, h, rest, onDone, onStart, canPeel }) {
    const poly = flap.querySelector('polygon');
    const grad = flap.querySelector('linearGradient');
    let d = rest;
    let anim = 0;
    function draw(v) {
      d = v;
      const c = w - d;
      const keep = (p) => p[0] - p[1] <= c;
      keep.c = c;
      const cut = (p) => p[0] - p[1] >= c;
      cut.c = c;
      const kept = clipRect(w, h, keep);
      body.style.clipPath = kept.length ? `polygon(${kept.map((p) => `${p[0]}px ${p[1]}px`).join(',')})` : 'polygon(0 0,0 0,0 0)';
      // lo que se dobla, reflejado sobre la línea
      const flapPts = clipRect(w, h, cut).map(([x, y]) => [y + c, x - c]);
      poly.setAttribute('points', flapPts.map((p) => p.join(',')).join(' '));
      grad.setAttribute('x1', w - d / 2);
      grad.setAttribute('y1', d / 2);
      grad.setAttribute('x2', w - d);
      grad.setAttribute('y2', d);
    }
    function animateTo(target, ms, done, inOut = false) {
      cancelAnimationFrame(anim);
      const from = d;
      const t0 = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0) / ms);
        const e = inOut ? (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) : 1 - Math.pow(1 - t, 3);
        draw(from + (target - from) * e);
        if (t < 1) anim = requestAnimationFrame(step);
        else if (done) done();
      };
      anim = requestAnimationFrame(step);
    }
    let peeling = false;
    function peel() {
      if (peeling) return;
      peeling = true;
      if (onStart) onStart();
      animateTo(w + h, 900, () => onDone && onDone(), true);
    }
    // Arrastrar la esquina con el mouse
    const corner = el.querySelector('.v-corner');
    let drag = null;
    const toLocal = (e) => {
      const r = body.getBoundingClientRect();
      const k = w / r.width;
      return [(e.clientX - r.left) * k, (e.clientY - r.top) * k];
    };
    corner.addEventListener('pointerdown', (e) => {
      if (peeling || (canPeel && !canPeel())) return;
      e.stopPropagation();
      corner.setPointerCapture(e.pointerId);
      cancelAnimationFrame(anim);
      drag = { moved: false };
    });
    corner.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const [x, y] = toLocal(e);
      const v = Math.max(rest, (w - x + y) / 2);
      if (v > rest + 12) drag.moved = true;
      draw(v);
    });
    const release = () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      if (!moved || d > Math.min(w, h) * 0.32) peel();
      else animateTo(rest, 300);
    };
    corner.addEventListener('pointerup', release);
    corner.addEventListener('pointercancel', release);
    corner.addEventListener('click', (e) => e.stopPropagation());
    draw(rest);
    return {
      peel,
      reset() {
        peeling = false;
        cancelAnimationFrame(anim);
        draw(rest);
      },
      // un tironcito para mostrar que la esquina se despega
      tease() {
        if (peeling || drag) return;
        animateTo(rest + 60, 260, () => animateTo(rest, 380));
      },
    };
  }

  window.Themes = window.Themes || {};
  window.Themes.vita = { mount };

  // root: contenedor del tema. ctx: { api, stage, stageRect, toast, openSelector, sound }
  function mount(root, ctx) {
    root.innerHTML = MARKUP;
    const api = ctx.api;
    const U = window.NostalHubUtil;
    const esc = U.escapeHtml;
    const $ = (s, el = root) => el.querySelector(s);
    const $$ = (s, el = root) => [...el.querySelectorAll(s)];
    const call = (fn, ...a) => (typeof api[fn] === 'function' ? api[fn](...a) : Promise.resolve(null));
    const sound = (k) => ctx.sound && ctx.sound(k);

    let games = [];
    let view = 'lock'; // lock | home | card | playing
    let busy = false; // durante animaciones
    let page = 0;
    let sel = 0;
    let pages = [];
    const cards = []; // { key, kind, game, el, peel, focus, ... }
    let at = -1; // -1 = inicio; si no, índice de la tarjeta
    let profile = { name: 'Jugador', avatar: null };
    let summary = { done: 0, total: 0, perGame: {}, hasKey: false };
    let spotify = null;
    let discord = { status: 'off', channel: null, members: [] };
    let menuModel = [];
    let playTimer = null;
    let playingGame = null;
    const offs = [];
    const nowPlaying = U.nowPlaying($('.v-playing'), api);

    // ---------- Reloj ----------
    function tickClock() {
      const d = new Date();
      const hm = `${d.getHours()}:${pad2(d.getMinutes())}`;
      $('.v-clock').textContent = hm;
      $('.v-lock-time').textContent = hm;
      $('.v-lock-date').textContent = `${DAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
    }
    tickClock();
    const clockTimer = setInterval(tickClock, 10000);

    // ---------- Arte y colores de cada juego ----------
    function hue(name) {
      let h = 0;
      for (const ch of name || '') h = (h * 31 + ch.charCodeAt(0)) % 360;
      return h;
    }
    function gameColors(g) {
      const h = hue(g.name);
      return [`hsl(${h} 70% 58%)`, `hsl(${(h + 40) % 360} 65% 32%)`];
    }
    function bubbleImage(g) {
      if (g.bubble) return { url: g.bubble, pos: 'center' };
      if (g.cover) return { url: g.cover, pos: 'center 32%' };
      // el fondo (sin letras) se ve mejor recortado en círculo que la portada con el nombre
      if (g.hero && g.heroIsReal) return { url: g.hero, pos: 'center' };
      if (g.tile && !g.tileIsVideo) return { url: g.tile, pos: 'center' };
      if (g.hero) return { url: g.hero, pos: 'center' };
      return null;
    }
    function initials(name) {
      return (name || '?')
        .split(/\s+/)
        .filter((w) => w.length > 2 || /^[A-Z0-9]/.test(w))
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join('');
    }
    // Cara de una burbuja: imagen dentro de una cúpula de vidrio
    function bubbleFace(entry) {
      const face = document.createElement('div');
      face.className = 'v-face';
      const img = document.createElement('div');
      img.className = 'v-face-img';
      if (entry.sys) {
        img.innerHTML = ART[entry.sys] || '';
        img.classList.add('art');
      } else {
        const g = entry.game;
        const im = bubbleImage(g);
        if (im) {
          img.style.backgroundImage = `url("${im.url}")`;
          img.style.backgroundPosition = im.pos;
        } else {
          const [a, b] = gameColors(g);
          img.style.background = `radial-gradient(circle at 35% 30%, ${a}, ${b})`;
          img.innerHTML = `<span class="v-face-ini">${esc(initials(g.name))}</span>`;
        }
      }
      const gloss = document.createElement('div');
      gloss.className = 'v-gloss';
      face.append(img, gloss);
      return face;
    }

    // ---------- Páginas de burbujas ----------
    function sortedGames() {
      const played = games.filter((g) => g.lastPlayed).sort((a, b) => b.lastPlayed - a.lastPlayed);
      const rest = games.filter((g) => !g.lastPlayed).sort((a, b) => a.name.localeCompare(b.name, 'es'));
      return [...played, ...rest];
    }
    function buildPages() {
      const list = sortedGames().map((g) => ({ key: `g:${g.id}`, game: g, label: g.name }));
      pages = [SYSTEM.map((s) => ({ key: `s:${s.id}`, sys: s.id, label: s.label }))];
      for (let i = 0; i < list.length; i += PER_PAGE) pages.push(list.slice(i, i + PER_PAGE));
      const box = $('.v-pages');
      box.innerHTML = '';
      pages.forEach((items, p) => {
        const pg = document.createElement('div');
        pg.className = 'v-page';
        pg.style.top = `${p * H}px`;
        items.forEach((entry, i) => {
          const s = SLOTS[i];
          const b = document.createElement('button');
          b.className = 'v-bub';
          b.dataset.p = p;
          b.dataset.i = i;
          b.style.left = `${s.x - D / 2}px`;
          b.style.top = `${s.y - D / 2}px`;
          b.style.setProperty('--d', `${(i % 4) * 0.05 + s.row * 0.06}s`);
          b.appendChild(bubbleFace(entry));
          const label = document.createElement('div');
          label.className = 'v-label';
          label.textContent = entry.label;
          b.appendChild(label);
          if (entry.sys === 'party') b.insertAdjacentHTML('beforeend', '<span class="v-badge" hidden></span>');
          b.addEventListener('mouseenter', () => {
            if (view === 'home' && !busy && p === page) setSel(i);
          });
          b.addEventListener('click', () => {
            if (view !== 'home' || busy || p !== page) return;
            setSel(i);
            activate(entry, b);
          });
          pg.appendChild(b);
        });
        box.appendChild(pg);
      });
      // puntitos de las páginas (a la izquierda)
      const dots = $('.v-dots');
      dots.innerHTML = pages.map((_, p) => `<button class="v-dot" data-p="${p}"></button>`).join('');
      $$('.v-dot').forEach((d) => d.addEventListener('click', () => view === 'home' && setPage(Number(d.dataset.p))));
      page = Math.min(page, pages.length - 1);
      setPage(page, false);
      paintPartyBadge();
    }
    function setPage(p, animate = true) {
      const np = Math.max(0, Math.min(pages.length - 1, p));
      const changed = np !== page;
      page = np;
      const box = $('.v-pages');
      box.style.transition = animate ? '' : 'none';
      box.style.transform = `translateY(${-page * H}px)`;
      $$('.v-dot').forEach((d) => d.classList.toggle('on', Number(d.dataset.p) === page));
      if (changed && animate) sound('page');
      setSel(Math.min(sel, pages[page].length - 1));
    }
    function setSel(i) {
      sel = Math.max(0, Math.min(pages[page].length - 1, i));
      $$('.v-bub').forEach((b) => b.classList.toggle('sel', Number(b.dataset.p) === page && Number(b.dataset.i) === sel));
    }
    function bubbleEl(p, i) {
      return $(`.v-bub[data-p="${p}"][data-i="${i}"]`);
    }
    // Moverse con las flechas por las filas de 3-4-3
    function nearestInRow(row, x, count) {
      let best = -1;
      let bd = Infinity;
      SLOTS.forEach((s, i) => {
        if (s.row !== row || i >= count) return;
        const dd = Math.abs(s.x - x);
        if (dd < bd) {
          bd = dd;
          best = i;
        }
      });
      return best;
    }
    function homeKey(k) {
      const items = pages[page];
      const s = SLOTS[sel];
      if (k === 'ArrowRight') {
        if (sel + 1 < items.length && SLOTS[sel + 1].row === s.row) setSel(sel + 1);
        else if (cards.length) goTo(0);
      } else if (k === 'ArrowLeft') {
        if (sel > 0 && SLOTS[sel - 1].row === s.row) setSel(sel - 1);
      } else if (k === 'ArrowDown') {
        let j = s.row < 2 ? nearestInRow(s.row + 1, s.x, items.length) : -1;
        if (j >= 0) setSel(j);
        else if (page < pages.length - 1) {
          setPage(page + 1);
          setSel(Math.max(0, nearestInRow(0, s.x, pages[page].length)));
        }
      } else if (k === 'ArrowUp') {
        if (s.row > 0) setSel(nearestInRow(s.row - 1, s.x, items.length));
        else if (page > 0) {
          setPage(page - 1);
          const cnt = pages[page].length;
          let j = nearestInRow(2, s.x, cnt);
          if (j < 0) j = nearestInRow(1, s.x, cnt);
          if (j < 0) j = cnt - 1;
          setSel(j);
        }
      } else if (k === 'PageDown') setPage(page + 1);
      else if (k === 'PageUp') setPage(page - 1);
      else if (k === 'Enter') activate(items[sel], bubbleEl(page, sel));
      else if (k === 'Escape') ctx.openSelector();
    }

    // ---------- Abrir una burbuja ----------
    function activate(entry, el) {
      if (!entry || busy) return;
      if (entry.sys) {
        const id = entry.sys;
        if (id === 'store' || id === 'friends' || id === 'profile') {
          bounce(el);
          call('open', id === 'store' ? 'steam-store' : id === 'friends' ? 'steam-friends' : 'steam-profile');
          ctx.toast('Se abrió en Steam');
          return;
        }
        if (id === 'consoles') return ctx.openSelector();
        if (id === 'random') return randomGame(el);
        return openCard({ key: `s:${id}`, kind: id }, el);
      }
      openCard({ key: `g:${entry.game.id}`, kind: 'game', game: entry.game }, el);
    }
    function bounce(el) {
      if (!el) return;
      const f = el.querySelector('.v-face');
      f.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.86)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
    }
    async function randomGame(el) {
      if (!games.length) return ctx.toast('Todavía no hay juegos');
      busy = true;
      const face = el.querySelector('.v-face');
      await face.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-540deg) scale(0.9)' }, { transform: 'rotate(-720deg)' }], { duration: 700, easing: 'ease-in-out' }).finished;
      busy = false;
      const g = games[Math.floor(Math.random() * games.length)];
      openCard({ key: `g:${g.id}`, kind: 'game', game: g }, el);
    }

    // La burbuja va al centro, gira dos vueltas y se abre la tarjeta
    async function openCard(spec, fromEl) {
      const existing = cards.findIndex((c) => c.key === spec.key);
      if (existing >= 0) {
        if (spec.kind === 'trophies' && spec.game) Object.assign(cards[existing], { trophyGame: spec.game, fromList: false, focus: 0 });
        if (spec.kind === 'trophies') refreshCard(cards[existing]);
        return goTo(existing);
      }
      if (busy) return;
      busy = true;
      closeNotif();
      const fly = $('.v-fly');
      fly.innerHTML = '';
      let from = { x: W / 2, y: H / 2, s: 0.6 };
      if (fromEl) {
        const r = ctx.stageRect(fromEl.querySelector('.v-face'));
        from = { x: r.left + r.width / 2, y: r.top + r.height / 2, s: r.width / D };
      }
      const entry = spec.kind === 'game' ? { game: spec.game } : { sys: spec.kind };
      const face = bubbleFace(entry);
      fly.appendChild(face);
      fly.hidden = false;
      if (fromEl) fromEl.classList.add('flying');
      const T = (x, y, s, r = 0) => `perspective(1600px) translate(${x - D / 2}px, ${y - D / 2}px) scale(${s}) rotateY(${r}deg)`;
      // 1) al centro
      await fly.animate([{ transform: T(from.x, from.y, from.s) }, { transform: T(W / 2, H / 2 - 20, 1.3) }], { duration: 320, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'forwards' }).finished;
      root.classList.add('dim-home');
      // 2) dos vueltas
      await fly.animate([{ transform: T(W / 2, H / 2 - 20, 1.3, 0) }, { transform: T(W / 2, H / 2 - 20, 1.3, 720) }], { duration: 900, easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'forwards' }).finished;
      if (fromEl) fromEl.classList.remove('flying');
      // 3) se abre la tarjeta y la burbuja sube a colgar arriba
      if (cards.length >= MAX_CARDS) removeCard(0, false);
      const card = createCard(spec);
      cards.push(card);
      goTo(cards.length - 1, false);
      card.el.classList.add('opening');
      const tagY = CARD_TOP + 14;
      const flyUp = fly.animate([{ transform: T(W / 2, H / 2 - 20, 1.3, 720) }, { transform: T(W / 2, tagY, TAG / D, 720) }], { duration: 420, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'forwards' });
      await card.el.animate(
        [
          { transform: 'scale(0.14)', opacity: 0, borderRadius: '50%' },
          { transform: 'scale(1)', opacity: 1, borderRadius: '10px' },
        ],
        { duration: 420, easing: 'cubic-bezier(.25,.8,.25,1)' }
      ).finished;
      await flyUp.finished;
      card.el.classList.remove('opening');
      fly.hidden = true;
      fly.innerHTML = '';
      root.classList.remove('dim-home');
      busy = false;
    }

    // ---------- Tarjetas ----------
    function createCard(spec) {
      const el = document.createElement('div');
      el.className = `v-card k-${spec.kind}`;
      el.innerHTML = `
        <div class="v-card-body"><div class="v-card-bg"></div><div class="v-card-title"></div><div class="v-card-main"></div></div>
        <svg class="v-flap" aria-hidden="true"><defs><linearGradient class="v-flap-g" id="vf-${Math.random().toString(36).slice(2)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c3cad6"/></linearGradient></defs><polygon/></svg>
        <div class="v-corner" title="Despega la esquina para cerrar"></div>
        <div class="v-card-tag"></div>`;
      const gid = el.querySelector('linearGradient').id;
      el.querySelector('polygon').setAttribute('fill', `url(#${gid})`);
      el.style.width = `${CARD_W}px`;
      el.style.height = `${CARD_H}px`;
      el.style.top = `${CARD_TOP}px`;
      const card = { ...spec, el, focus: 0 };
      // Trofeos abiertos desde la tarjeta de un juego: parte directo en los de ese juego
      if (spec.kind === 'trophies' && spec.game) card.trophyGame = spec.game;
      card.el.querySelector('.v-card-tag').appendChild(bubbleFace(spec.kind === 'game' ? { game: spec.game } : { sys: spec.kind }));
      card.peel = makePeel({
        el,
        body: el.querySelector('.v-card-body'),
        flap: el.querySelector('.v-flap'),
        w: CARD_W,
        h: CARD_H,
        rest: 92,
        canPeel: () => !busy && view === 'card' && cards[at] === card,
        onStart: () => {
          el.classList.add('peeling');
          sound('back');
        },
        onDone: () => {
          const i = cards.indexOf(card);
          if (i >= 0) removeCard(i, true);
        },
      });
      // clic en una tarjeta que se asoma: ir a ella
      el.addEventListener('pointerdown', (e) => {
        const i = cards.indexOf(card);
        if (i !== at && !busy && view === 'card' && !e.target.closest('.v-corner')) {
          e.preventDefault();
          goTo(i);
        }
      });
      $('.v-cards').appendChild(el);
      refreshCard(card);
      return card;
    }
    function layoutCards() {
      cards.forEach((c, i) => {
        c.el.style.left = `${W + CARD_X + i * (CARD_W + CARD_GAP)}px`;
        c.el.classList.toggle('cur', i === at);
      });
    }
    function goTo(i, animate = true) {
      if (i >= cards.length) i = cards.length - 1;
      const prev = at;
      at = i;
      view = at < 0 ? 'home' : 'card';
      layoutCards();
      const track = $('.v-track');
      track.style.transition = animate ? '' : 'none';
      track.style.transform = at < 0 ? 'none' : `translateX(${-(W + at * (CARD_W + CARD_GAP))}px)`;
      if (!animate) track.offsetWidth;
      root.classList.toggle('in-card', at >= 0);
      if (animate && prev !== at) sound('page');
      paintTasks();
      paintEdges();
      paintHint();
      if (at >= 0) setFocus(cards[at], cards[at].focus || 0);
    }
    function removeCard(i, animate) {
      const card = cards[i];
      if (!card) return;
      cards.splice(i, 1);
      const out = card.el;
      if (animate) {
        out.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).finished.then(() => out.remove());
      } else out.remove();
      // la que estaba abierta pasa a la anterior (o al inicio)
      if (at >= i) at -= 1;
      if (animate) goTo(at);
      else layoutCards();
      paintTasks();
    }
    function paintTasks() {
      const box = $('.v-tasks');
      box.innerHTML = `<button class="v-task home${at < 0 ? ' on' : ''}" data-t="-1">${icon('home')}</button>`;
      cards.forEach((c, i) => {
        const b = document.createElement('button');
        b.className = `v-task${i === at ? ' on' : ''}`;
        b.dataset.t = i;
        b.appendChild(bubbleFace(c.kind === 'game' ? { game: c.game } : { sys: c.kind }));
        box.appendChild(b);
      });
      $$('.v-task', box).forEach((b) =>
        b.addEventListener('click', () => {
          if (busy || view === 'lock' || view === 'playing') return;
          closeNotif();
          goTo(Number(b.dataset.t));
        })
      );
    }
    function paintEdges() {
      const l = $('.v-edge.left');
      const r = $('.v-edge.right');
      l.hidden = at < 0;
      r.hidden = at >= cards.length - 1;
      r.classList.toggle('from-home', at < 0);
    }
    $('.v-edge.left').addEventListener('click', () => !busy && view === 'card' && goTo(at - 1));
    $('.v-edge.right').addEventListener('click', () => !busy && (view === 'card' || view === 'home') && goTo(at + 1));
    function closeCurrent() {
      const c = cards[at];
      if (c && !busy) c.peel.peel();
    }

    // Contenido de cada tarjeta
    function refreshCard(card) {
      const body = card.el.querySelector('.v-card-body');
      const title = card.el.querySelector('.v-card-title');
      const main = card.el.querySelector('.v-card-main');
      const bg = card.el.querySelector('.v-card-bg');
      if (card.kind === 'game') {
        const g = card.game;
        title.textContent = g.name;
        const art = (g.heroIsReal && g.hero) || g.cover || g.tile || g.hero;
        if (art) bg.style.backgroundImage = `url("${art}")`;
        else {
          const [a, b] = gameColors(g);
          bg.style.background = `linear-gradient(135deg, ${a}, ${b})`;
        }
        paintGameCard(card, main);
      } else {
        title.textContent = CARD_TITLES[card.kind] || '';
        if (card.kind === 'music') paintMusicCard(card, main);
        else if (card.kind === 'party') paintPartyCard(card, main);
        else if (card.kind === 'trophies') paintTrophyCard(card, main);
        else if (card.kind === 'library') paintLibraryCard(card, main);
        else if (card.kind === 'settings') paintSettingsCard(card, main);
      }
      body.classList.toggle('dark-title', card.kind === 'settings' || card.kind === 'library');
      if (cards[at] === card) setFocus(card, card.focus || 0);
    }
    // Elementos que se pueden elegir con las flechas dentro de la tarjeta
    function focusables(card) {
      return $$('[data-f]', card.el.querySelector('.v-card-main')).filter((b) => !b.hidden);
    }
    function setFocus(card, i) {
      const list = focusables(card);
      if (!list.length) {
        card.focus = 0;
        return;
      }
      card.focus = Math.max(0, Math.min(list.length - 1, i));
      list.forEach((b, j) => b.classList.toggle('sel', j === card.focus));
      if (card.onFocus) card.onFocus(list[card.focus], card.focus);
    }
    function bindFocus(card) {
      focusables(card).forEach((b, j) => {
        b.addEventListener('mouseenter', () => cards[at] === card && setFocus(card, j));
      });
    }

    // --- Juego (LiveArea) ---
    function trophiesOf(g) {
      return (g && g.appId && summary.perGame && summary.perGame[g.appId]) || null;
    }
    function typeLabel(g) {
      return { steam: 'Steam', exe: 'Programa', shortcut: 'Acceso directo', url: 'Otro launcher' }[g.type] || '';
    }
    function paintGameCard(card, main) {
      const g = card.game;
      const tp = trophiesOf(g);
      // Puerta: tu imagen propia, o el fondo del juego con su logo encima, o la portada de Steam (que ya trae el nombre)
      let gateArt = null;
      let logo = false;
      if (g.tileIsCustom && !g.tileIsVideo) gateArt = g.tile;
      else if (g.hero && g.heroIsReal) {
        gateArt = g.hero;
        logo = !!g.logo;
      } else gateArt = (!g.tileIsVideo && g.tile) || g.cover || g.hero;
      const showName = !gateArt || (gateArt === g.hero && g.heroIsReal && !logo);
      const act = [U.hours(g.playtimeMin), g.lastPlayed ? `Jugado ${U.ago(g.lastPlayed)}` : ''].filter(Boolean).join(' · ') || 'Todavía no lo juegas';
      main.innerHTML = `
        <div class="v-gate">
          <button class="v-gate-frame" data-f="start">
            <div class="v-gate-art"${gateArt ? ` style="background-image:url('${gateArt}')"` : ''}></div>
            ${logo ? `<img class="v-gate-logo" src="${g.logo}" alt="" />` : showName ? `<div class="v-gate-name">${esc(g.name)}</div>` : ''}
            <span class="v-gate-btn">Iniciar</span>
          </button>
        </div>
        <div class="v-live">
          <div class="v-li"><div class="v-li-h">${icon('clock')}<span>Tu actividad</span></div><div class="v-li-t">${esc(act)}</div><div class="v-li-s">${esc(typeLabel(g))}</div></div>
          <button class="v-li" data-f="troph"${g.type === 'steam' ? '' : ' hidden'}>
            <div class="v-li-h">${icon('trophy')}<span>Trofeos</span>${icon('chevron', 'v-li-go')}</div>
            ${
              tp && tp.total
                ? `<div class="v-li-t">${tp.done} de ${tp.total} · ${Math.round((tp.done / tp.total) * 100)} %</div><div class="v-prog"><i style="width:${(tp.done / tp.total) * 100}%"></i></div>`
                : `<div class="v-li-t dim">${summary.hasKey ? 'Ver sus trofeos' : 'Agrega tu clave de Steam'}</div>`
            }
          </button>
          <div class="v-li wide"><div class="v-li-h">${icon('info')}<span>Información</span></div><div class="v-li-t clamp">${esc(g.description || 'Sin descripción. Puedes escribir una en descripcion.txt, en la carpeta de personalización del juego.')}</div></div>
        </div>`;
      const lg = main.querySelector('.v-gate-logo');
      if (lg) lg.addEventListener('error', () => lg.replaceWith(Object.assign(document.createElement('div'), { className: 'v-gate-name', textContent: g.name })));
      main.querySelector('[data-f="start"]').addEventListener('click', () => cards[at] === card && pressStart(card));
      main.querySelector('[data-f="troph"]').addEventListener('click', () => cards[at] === card && openCard({ key: 's:trophies', kind: 'trophies', game: g }, null));
      bindFocus(card);
    }
    async function pressStart(card) {
      const btn = card.el.querySelector('.v-gate-frame');
      btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.95)' }, { transform: 'scale(1)' }], { duration: 260 });
      await wait(160);
      startGame(card.game);
    }
    function gameKey(card, k) {
      const list = focusables(card);
      if (k === 'ArrowDown' && card.focus === 0 && list.length > 1) setFocus(card, 1);
      else if (k === 'ArrowUp' && card.focus > 0) setFocus(card, 0);
      else if (k === 'ArrowLeft') goTo(at - 1);
      else if (k === 'ArrowRight') at < cards.length - 1 && goTo(at + 1);
      else if (k === 'Enter' && list[card.focus]) list[card.focus].click();
      else return false;
      return true;
    }

    // --- Música (Spotify) ---
    function paintMusicCard(card, main) {
      const st = spotify || {};
      const v = U.spotifyView(st);
      main.innerHTML = `
        <div class="v-mu">
          <div class="v-mu-disc${v.playing ? ' spin' : ''}"><div class="v-mu-cover"${v.cover ? ` style="background-image:url('${v.cover}')"` : ''}>${v.cover ? '' : icon('music')}</div></div>
          <div class="v-mu-info">
            <div class="v-mu-state">${v.on ? (v.playing ? 'Reproduciendo' : 'En pausa') : 'Spotify'}</div>
            <div class="v-mu-title">${esc(v.title)}</div>
            <div class="v-mu-artist">${esc(v.artist)}</div>
            <div class="v-mu-ctrl">
              ${
                v.on
                  ? `<button class="v-round" data-f="prev" title="Anterior">${icon('prev')}</button>
                     <button class="v-round big" data-f="toggle" title="Reproducir / pausar">${icon(v.playing ? 'pause' : 'play')}</button>
                     <button class="v-round" data-f="next" title="Siguiente">${icon('next')}</button>`
                  : ''
              }
              <button class="v-pill" data-f="open"><span>${v.on ? 'Abrir Spotify' : 'Abrir Spotify'}</span></button>
            </div>
          </div>
        </div>`;
      $$('[data-f]', main).forEach((b) =>
        b.addEventListener('click', () => {
          if (cards[at] !== card) return;
          const cmd = b.dataset.f;
          call('spotifyControl', cmd);
          if (cmd === 'toggle' && spotify && spotify.running) {
            spotify = { ...spotify, playing: !spotify.playing };
            refreshCard(card);
          }
        })
      );
      bindFocus(card);
    }
    function rowKey(card, k) {
      // botones en fila: ← → entre ellos; en los bordes, cambia de tarjeta
      const list = focusables(card);
      if (k === 'ArrowRight' || k === 'ArrowDown') {
        if (card.focus < list.length - 1) setFocus(card, card.focus + 1);
        else if (k === 'ArrowRight' && at < cards.length - 1) goTo(at + 1);
      } else if (k === 'ArrowLeft' || k === 'ArrowUp') {
        if (card.focus > 0) setFocus(card, card.focus - 1);
        else if (k === 'ArrowLeft') goTo(at - 1);
      } else if (k === 'Enter' && list[card.focus]) list[card.focus].click();
      else return false;
      return true;
    }

    // --- Grupo (Discord) ---
    function partyStatusText() {
      switch (discord.status) {
        case 'no-config':
          return { t: 'Conecta tu Discord', d: 'Para ver tu canal de voz, crea una aplicación en el portal de desarrolladores de Discord y pega sus datos en discord.txt. Los pasos están en el manual.', btns: [['discord', 'Abrir discord.txt'], ['discord-portal', 'Portal de Discord']] };
        case 'no-discord':
          return { t: 'Discord no está abierto', d: 'Abre la app de escritorio de Discord. NostalHub se conecta sola cuando la detecte.', btns: [['discord-app', 'Abrir Discord']] };
        case 'connecting':
          return { t: 'Conectando con Discord…', d: '', btns: [] };
        case 'need-auth':
          return { t: 'Falta un permiso', d: 'Discord te va a mostrar una ventana para que aceptes que NostalHub vea tu canal de voz. Solo se pide una vez.', btns: [['auth', 'Conectar con Discord']] };
        case 'authorizing':
          return { t: 'Acepta en Discord', d: 'Revisa la ventana que apareció en Discord y presiona Autorizar.', btns: [] };
        case 'error':
          return { t: 'No se pudo conectar', d: discord.message || 'Revisa los datos de discord.txt.', btns: [['auth', 'Intentar de nuevo'], ['discord', 'Abrir discord.txt']] };
        case 'off':
          return { t: 'Conectando con Discord…', d: '', btns: [] };
        default:
          return null;
      }
    }
    function paintPartyCard(card, main) {
      const st = partyStatusText();
      if (st) {
        main.innerHTML = `<div class="v-pa-empty"><div class="v-pa-big">${ART.party}</div><div class="v-pa-t">${esc(st.t)}</div><div class="v-pa-d">${esc(st.d)}</div>
          <div class="v-pa-btns">${st.btns.map(([id, label]) => `<button class="v-pill" data-f="${id}"><span>${label}</span></button>`).join('')}</div></div>`;
      } else if (!discord.channel) {
        main.innerHTML = `<div class="v-pa-empty"><div class="v-pa-big">${ART.party}</div><div class="v-pa-t">No estás en un canal de voz</div><div class="v-pa-d">Cuando entres a un canal de voz en Discord, aquí vas a ver quiénes están contigo.</div></div>`;
      } else {
        const n = discord.members.length;
        main.innerHTML = `
          <div class="v-pa">
            <div class="v-pa-room">
              <div class="v-pa-rbub">${ART.party}</div>
              <div><div class="v-pa-name">${esc(discord.channel.name)}</div><div class="v-pa-guild">${esc(discord.channel.guild || 'Mensaje directo')}</div><div class="v-pa-count">${icon('headset')}<span>${n} ${n === 1 ? 'persona' : 'personas'}</span></div></div>
            </div>
            <div class="v-pa-list">${discord.members
              .map(
                (m) => `<div class="v-pa-m${m.speaking ? ' talking' : ''}">
                  <span class="v-pa-av" style="background-image:url('${m.avatar}')"></span>
                  <span class="v-pa-n">${esc(m.name)}</span>
                  <span class="v-pa-st">${m.deafened ? icon('deaf') : m.muted ? icon('micOff') : `<i class="v-pa-wave"></i>`}</span>
                </div>`
              )
              .join('')}</div>
          </div>`;
      }
      $$('[data-f]', main).forEach((b) =>
        b.addEventListener('click', () => {
          if (cards[at] !== card) return;
          if (b.dataset.f === 'auth') call('discordAuthorize').then((s) => s && renderDiscord(s));
          else call('open', b.dataset.f);
        })
      );
      bindFocus(card);
    }
    function paintPartyBadge() {
      const n = discord.status === 'ok' && discord.channel ? discord.members.length : 0;
      $$('.v-badge').forEach((b) => {
        b.hidden = !n;
        b.textContent = String(n);
      });
    }

    // --- Trofeos ---
    const T_ROW = 132;
    const T_VIEW = 640;
    async function paintTrophyCard(card, main) {
      const pct = summary.total ? Math.round((summary.done / summary.total) * 100) : 0;
      main.innerHTML = `
        <div class="v-tr">
          <div class="v-tr-side">
            <div class="v-tr-av"${profile.avatar ? ` style="background-image:url('${profile.avatar}')"` : ''}>${profile.avatar ? '' : esc((profile.name || '?').charAt(0))}</div>
            <div class="v-tr-name">${esc(profile.name || 'Jugador')}</div>
            <div class="v-tr-cup">${ART.trophies}</div>
            <div class="v-tr-total">${summary.hasKey ? `${summary.done || 0}` : '—'}<small>${summary.hasKey ? `de ${summary.total || 0} · ${pct} %` : 'Sin clave de Steam'}</small></div>
            <div class="v-prog gold"><i style="width:${pct}%"></i></div>
          </div>
          <div class="v-tr-main"><div class="v-tr-head"></div><div class="v-tr-view"><div class="v-tr-list"></div></div><div class="v-tr-msg" hidden></div></div>
        </div>`;
      const list = $('.v-tr-list', main);
      const msg = $('.v-tr-msg', main);
      const head = $('.v-tr-head', main);
      card.onFocus = (el, i) => {
        const per = Math.floor(T_VIEW / T_ROW);
        let f = card.tFirst || 0;
        if (i < f) f = i;
        else if (i >= f + per) f = i - per + 1;
        card.tFirst = f;
        list.style.transform = `translateY(${-f * T_ROW}px)`;
        // con la lista bajada, la fila de más arriba se esconde (si no, tapa el título)
        list.parentElement.classList.toggle('scrolled', f > 0);
      };
      card.tFirst = 0;
      if (card.trophyGame) {
        const g = card.trophyGame;
        head.textContent = g.name;
        msg.hidden = false;
        msg.innerHTML = '<div class="v-spin"></div>Cargando trofeos…';
        const token = (card.tToken = (card.tToken || 0) + 1);
        const res = (await call('getAchievements', g.appId)) || { status: 'error' };
        if (token !== card.tToken || !card.el.isConnected) return;
        if (res.status !== 'ok') {
          msg.innerHTML = U.achievementMessage(res);
          return;
        }
        msg.hidden = true;
        head.textContent = `${g.name} · ${res.done} / ${res.total}`;
        U.sortAchievements(res.list).forEach((a) => {
          const t = U.achievementTexts(a);
          const r = document.createElement('div');
          r.className = `v-tr-row ach${a.done ? '' : ' locked'}`;
          r.dataset.f = 'ach';
          r.innerHTML = `<div class="v-tr-aic" style="background-image:url('${a.done ? a.icon : a.iconGray || a.icon}')"></div>
            <div class="v-tr-info"><div class="v-tr-gn"></div><div class="v-tr-ad"></div></div>
            <div class="v-tr-when"><div></div><small></small></div>`;
          r.querySelector('.v-tr-gn').textContent = t.name;
          r.querySelector('.v-tr-ad').textContent = t.description;
          r.querySelector('.v-tr-when div').textContent = a.done ? t.date : 'Bloqueado';
          r.querySelector('.v-tr-when small').textContent = a.percent != null ? `${Number(a.percent).toFixed(1).replace('.', ',')} %` : '';
          list.appendChild(r);
        });
        bindFocus(card);
        if (cards[at] === card) setFocus(card, 0);
        return;
      }
      head.textContent = 'Tus juegos';
      if (!summary.hasKey) {
        msg.hidden = false;
        msg.innerHTML = U.achievementMessage({ status: 'no-key' });
        return;
      }
      const rows = games.filter((g) => trophiesOf(g) && trophiesOf(g).total).sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
      if (!rows.length) {
        msg.hidden = false;
        msg.textContent = 'Todavía no hay datos de trofeos. Se cargan solos en unos minutos.';
      }
      rows.forEach((g) => {
        const tp = trophiesOf(g);
        const p = Math.round((tp.done / tp.total) * 100);
        const r = document.createElement('button');
        r.className = 'v-tr-row';
        r.dataset.f = 'game';
        const b = document.createElement('div');
        b.className = 'v-tr-bub';
        b.appendChild(bubbleFace({ game: g }));
        const info = document.createElement('div');
        info.className = 'v-tr-info';
        info.innerHTML = `<div class="v-tr-gn"></div><div class="v-tr-prog"><div class="v-prog gold"><i style="width:${p}%"></i></div><span>${p} %</span></div>`;
        info.querySelector('.v-tr-gn').textContent = g.name;
        const cnt = document.createElement('div');
        cnt.className = 'v-tr-count';
        cnt.innerHTML = `${icon('trophy')}<span>${tp.done} / ${tp.total}</span>`;
        r.append(b, info, cnt);
        r.addEventListener('click', () => {
          if (cards[at] !== card) return;
          card.trophyGame = g;
          card.fromList = true;
          card.focus = 0;
          refreshCard(card);
        });
        list.appendChild(r);
      });
      bindFocus(card);
    }
    function trophyKey(card, k) {
      const list = focusables(card);
      if (k === 'ArrowDown') setFocus(card, card.focus + 1);
      else if (k === 'ArrowUp') setFocus(card, card.focus - 1);
      else if (k === 'ArrowLeft') goTo(at - 1);
      else if (k === 'ArrowRight') at < cards.length - 1 && goTo(at + 1);
      else if (k === 'Enter' && list[card.focus]) list[card.focus].click();
      else if ((k === 'Escape' || k === 'Backspace') && card.trophyGame && card.fromList) {
        card.trophyGame = null;
        card.fromList = false;
        card.focus = 0;
        refreshCard(card);
      } else return false;
      return true;
    }

    // --- Biblioteca: todos los juegos en burbujas ---
    const LIB_COLS = 6;
    const LIB_ROW = 300;
    const LIB_VIEW = 760;
    const SORTS = [
      { label: 'Jugado recientemente', fn: (a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0) || a.name.localeCompare(b.name, 'es') },
      { label: 'Nombre', fn: (a, b) => a.name.localeCompare(b.name, 'es') },
      { label: 'Horas jugadas', fn: (a, b) => (b.playtimeMin || 0) - (a.playtimeMin || 0) },
    ];
    function paintLibraryCard(card, main) {
      card.sort = card.sort || 0;
      const list = [...games].sort(SORTS[card.sort].fn);
      card.libList = list;
      main.innerHTML = `
        <div class="v-lib">
          <div class="v-lib-top"><span>${list.length} ${list.length === 1 ? 'juego' : 'juegos y aplicaciones'}</span><button class="v-lib-sort">${icon('sort')}<span>${SORTS[card.sort].label}</span></button></div>
          <div class="v-lib-view"><div class="v-lib-grid"></div></div>
        </div>`;
      const grid = $('.v-lib-grid', main);
      list.forEach((g) => {
        const c = document.createElement('button');
        c.className = 'v-lib-cell';
        c.dataset.f = 'g';
        c.appendChild(bubbleFace({ game: g }));
        const n = document.createElement('div');
        n.className = 'v-lib-name';
        n.textContent = g.name;
        c.appendChild(n);
        c.addEventListener('click', () => cards[at] === card && openCard({ key: `g:${g.id}`, kind: 'game', game: g }, c));
        grid.appendChild(c);
      });
      if (!list.length) grid.innerHTML = '<div class="v-lib-empty">Todavía no hay juegos.</div>';
      $('.v-lib-sort', main).addEventListener('click', () => {
        card.sort = (card.sort + 1) % SORTS.length;
        card.focus = 0;
        refreshCard(card);
      });
      card.lFirst = 0;
      card.onFocus = (el, i) => {
        const row = Math.floor(i / LIB_COLS);
        const per = Math.floor(LIB_VIEW / LIB_ROW);
        let f = card.lFirst || 0;
        if (row < f) f = row;
        else if (row >= f + per) f = row - per + 1;
        card.lFirst = f;
        grid.style.transform = `translateY(${-f * LIB_ROW}px)`;
      };
      $('.v-lib-view', main).addEventListener('wheel', (e) => {
        if (cards[at] !== card || Math.abs(e.deltaY) < 10) return;
        const rows = Math.ceil(list.length / LIB_COLS);
        const per = Math.floor(LIB_VIEW / LIB_ROW);
        card.lFirst = Math.max(0, Math.min(Math.max(0, rows - per), (card.lFirst || 0) + (e.deltaY > 0 ? 1 : -1)));
        grid.style.transform = `translateY(${-card.lFirst * LIB_ROW}px)`;
      });
      bindFocus(card);
    }
    function libraryKey(card, k) {
      const list = focusables(card);
      const i = card.focus;
      if (k === 'ArrowRight') {
        if (i % LIB_COLS < LIB_COLS - 1 && i + 1 < list.length) setFocus(card, i + 1);
        else if (at < cards.length - 1) goTo(at + 1);
      } else if (k === 'ArrowLeft') {
        if (i % LIB_COLS > 0) setFocus(card, i - 1);
        else goTo(at - 1);
      } else if (k === 'ArrowDown') {
        if (i + LIB_COLS < list.length) setFocus(card, i + LIB_COLS);
      } else if (k === 'ArrowUp') {
        if (i >= LIB_COLS) setFocus(card, i - LIB_COLS);
      } else if (k === 'Enter' && list[i]) list[i].click();
      else if (k === 's' || k === 'S') $('.v-lib-sort', card.el).click();
      else return false;
      return true;
    }

    // --- Ajustes ---
    const CAT_ICONS = { general: 'gear', games: 'pad', screen: 'screen', sound: 'speaker', files: 'folder' };
    async function paintSettingsCard(card, main) {
      if (!menuModel.length) menuModel = (await call('getMenu')) || [];
      card.level = card.level || 'cats';
      const cat = menuModel[card.cat || 0];
      const rows = card.level === 'cats' ? menuModel : cat ? cat.items : [];
      main.innerHTML = `
        <div class="v-set">
          <div class="v-set-head">${card.level === 'cats' ? 'Ajustes' : `<span class="v-set-crumb">Ajustes</span>${icon('chevron')}<span>${esc(cat.title)}</span>`}</div>
          <div class="v-set-list"></div>
          <div class="v-set-desc"></div>
        </div>`;
      const list = $('.v-set-list', main);
      rows.forEach((r, i) => {
        const b = document.createElement('button');
        b.className = 'v-set-row';
        b.dataset.f = i;
        if (card.level === 'cats') {
          b.innerHTML = `<span class="v-set-ic">${icon(CAT_ICONS[r.id] || 'gear')}</span><span class="v-set-l"></span>${icon('chevron', 'v-set-go')}`;
          b.querySelector('.v-set-l').textContent = r.title;
        } else {
          const val =
            r.type === 'toggle'
              ? `<span class="v-check${r.value ? ' on' : ''}">${r.value ? icon('check') : ''}</span>`
              : r.type === 'choice'
                ? `<span class="v-set-v">${esc(U.optionValueText(r))}</span>`
                : icon('chevron', 'v-set-go');
          b.innerHTML = `<span class="v-set-l"></span>${val}`;
          b.querySelector('.v-set-l').textContent = r.label;
        }
        b.addEventListener('click', () => {
          if (cards[at] !== card) return;
          setFocus(card, i);
          pickSetting(card);
        });
        list.appendChild(b);
      });
      card.onFocus = (el, i) => {
        const it = card.level === 'items' && cat ? cat.items[i] : null;
        $('.v-set-desc', main).textContent = it ? it.desc || '' : 'Elige una categoría.';
        const top = Math.max(0, i - 7) * 92;
        list.style.transform = `translateY(${-top}px)`;
      };
      bindFocus(card);
      if (cards[at] === card) setFocus(card, card.focus || 0);
    }
    async function pickSetting(card) {
      if (card.level === 'cats') {
        card.cat = card.focus;
        card.level = 'items';
        card.focus = 0;
        return refreshCard(card);
      }
      const it = menuModel[card.cat].items[card.focus];
      if (!it) return;
      if (it.id === 'consoles') return ctx.openSelector();
      if (it.confirm) return openPower();
      if (it.type === 'choice') {
        return openPop(
          it.label,
          it.options.map((o) => ({ label: o.label, on: String(o.value) === String(it.value), run: () => runOption(it, o.value) }))
        );
      }
      if (/^open-|^devtools$/.test(it.id)) ctx.toast('Se abrió en Windows');
      await runOption(it, it.type === 'toggle' ? !it.value : undefined);
    }
    async function runOption(it, value) {
      const next = await call('runMenu', it.id, value);
      if (next) menuModel = next;
      cards.filter((c) => c.kind === 'settings').forEach(refreshCard);
      if (qmOpen) renderQm();
    }
    function settingsKey(card, k) {
      if (k === 'ArrowDown') setFocus(card, card.focus + 1);
      else if (k === 'ArrowUp') setFocus(card, card.focus - 1);
      else if (k === 'Enter' || (k === 'ArrowRight' && card.level === 'cats')) pickSetting(card);
      else if (k === 'ArrowRight') at < cards.length - 1 && goTo(at + 1);
      else if (k === 'ArrowLeft' || k === 'Escape' || k === 'Backspace') {
        if (card.level === 'items') {
          card.level = 'cats';
          card.focus = card.cat || 0;
          refreshCard(card);
        } else if (k === 'ArrowLeft') goTo(at - 1);
        else return false;
      } else return false;
      return true;
    }

    // Teclas dentro de una tarjeta
    function cardKey(k) {
      const card = cards[at];
      if (!card) return;
      let used = false;
      if (card.kind === 'game') used = gameKey(card, k);
      else if (card.kind === 'music' || card.kind === 'party') used = rowKey(card, k);
      else if (card.kind === 'trophies') used = trophyKey(card, k);
      else if (card.kind === 'library') used = libraryKey(card, k);
      else if (card.kind === 'settings') used = settingsKey(card, k);
      if (used) return;
      if (k === 'Escape') goTo(-1);
      else if (k === 'Backspace' || k === 'Delete') closeCurrent();
    }

    // ---------- Ventanita para elegir ----------
    let pop = null;
    function openPop(title, items) {
      pop = { items, sel: Math.max(0, items.findIndex((x) => x.on)) };
      $('.v-pop-title').textContent = title;
      const list = $('.v-pop-list');
      list.innerHTML = '';
      items.forEach((it, i) => {
        const b = document.createElement('button');
        b.className = 'v-pop-it';
        b.dataset.i = i;
        b.innerHTML = `${it.icon ? icon(it.icon) : `<span class="v-radio${it.on ? ' on' : ''}"></span>`}<span></span>`;
        b.querySelector('span:last-child').textContent = it.label;
        b.addEventListener('mouseenter', () => setPop(i));
        b.addEventListener('click', () => choosePop(i));
        list.appendChild(b);
      });
      $('.v-pop').hidden = false;
      setPop(pop.sel);
    }
    function setPop(i) {
      if (!pop) return;
      pop.sel = (i + pop.items.length) % pop.items.length;
      $$('.v-pop-it').forEach((b) => b.classList.toggle('sel', Number(b.dataset.i) === pop.sel));
    }
    function closePop() {
      pop = null;
      $('.v-pop').hidden = true;
    }
    function choosePop(i) {
      const it = pop && pop.items[i];
      closePop();
      if (it && it.run) it.run();
    }
    $('.v-pop').addEventListener('pointerdown', (e) => {
      if (e.target === e.currentTarget) closePop();
    });
    function openPower() {
      openPop('Energía', [
        { icon: 'swap', label: 'Cambiar de consola', run: () => ctx.openSelector() },
        { icon: 'restart', label: 'Reiniciar NostalHub', run: () => call('runMenu', 'reload') },
        { icon: 'power', label: 'Apagar NostalHub', run: () => call('runMenu', 'quit') },
      ]);
    }

    // ---------- Menú rápido (como mantener el botón PS) ----------
    let qmOpen = false;
    let qmSel = 0;
    let qmItems = [];
    async function openQm() {
      if (qmOpen || view === 'playing' || view === 'lock') return;
      closeNotif();
      qmOpen = true;
      menuModel = (await call('getMenu')) || menuModel;
      const qm = $('.v-qm');
      qm.hidden = false;
      qm.classList.remove('leave');
      qmSel = 0;
      renderQm();
    }
    async function closeQm() {
      if (!qmOpen) return;
      qmOpen = false;
      const qm = $('.v-qm');
      qm.classList.add('leave');
      await wait(240);
      if (!qmOpen) qm.hidden = true;
      qm.classList.remove('leave');
    }
    function soundItem(id) {
      const sec = menuModel.find((s) => s.id === 'sound');
      return sec ? sec.items.find((x) => x.id === id) : null;
    }
    function renderQm() {
      const panel = $('.v-qm-panel');
      const v = U.spotifyView(spotify || {});
      const slider = (it) => {
        if (!it || it.type !== 'choice') return '';
        const opts = it.options || [];
        const i = Math.max(0, opts.findIndex((o) => String(o.value) === String(it.value)));
        const pct = opts.length > 1 ? (i / (opts.length - 1)) * 100 : 0;
        return `<div class="v-slider"><i style="width:${pct}%"></i><b style="left:${pct}%"></b></div><span class="v-qm-val">${esc(U.optionValueText(it))}</span>`;
      };
      const mv = soundItem('musicVolume');
      const sv = soundItem('sfxVolume');
      const mus = soundItem('music');
      const snd = soundItem('sounds');
      panel.innerHTML = `
        <div class="v-qm-song">
          <div class="v-qm-cover"${v.cover ? ` style="background-image:url('${v.cover}')"` : ''}>${v.cover ? '' : icon('music')}</div>
          <div class="v-qm-st"><div class="v-qm-t">${esc(v.title)}</div><div class="v-qm-a">${esc(v.artist)}</div></div>
          <div class="v-qm-ctrl">
            ${v.on ? `<button class="v-round" data-q="prev">${icon('prev')}</button><button class="v-round big" data-q="toggle">${icon(v.playing ? 'pause' : 'play')}</button><button class="v-round" data-q="next">${icon('next')}</button>` : `<button class="v-pill" data-q="open"><span>Abrir Spotify</span></button>`}
          </div>
        </div>
        <div class="v-qm-rows">
          ${mv ? `<div class="v-qm-row" data-q="mv">${icon('music')}<span class="v-qm-l">${esc(mv.label)}</span>${slider(mv)}</div>` : ''}
          ${sv ? `<div class="v-qm-row" data-q="sv">${icon('speaker')}<span class="v-qm-l">${esc(sv.label)}</span>${slider(sv)}</div>` : ''}
          <div class="v-qm-btns">
            ${mus ? `<button class="v-qm-tg${mus.value ? ' on' : ''}" data-q="mus">${icon('music')}<span>${esc(mus.label)}</span></button>` : ''}
            ${snd ? `<button class="v-qm-tg${snd.value ? ' on' : ''}" data-q="snd">${icon('speaker')}<span>${esc(snd.label)}</span></button>` : ''}
            <button class="v-qm-tg" data-q="consoles">${icon('swap')}<span>Cambiar de consola</span></button>
            <button class="v-qm-tg" data-q="settings">${icon('gear')}<span>Ajustes</span></button>
            <button class="v-qm-tg" data-q="power">${icon('power')}<span>Energía</span></button>
          </div>
        </div>`;
      qmItems = $$('[data-q]', panel);
      qmItems.forEach((b, i) => {
        b.addEventListener('mouseenter', () => setQm(i));
        b.addEventListener('click', (e) => {
          setQm(i);
          // clic en la barra: ir a ese punto
          if ((b.dataset.q === 'mv' || b.dataset.q === 'sv') && e.target.closest('.v-slider')) {
            const it = b.dataset.q === 'mv' ? mv : sv;
            const r = e.target.closest('.v-slider').getBoundingClientRect();
            const t = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
            const o = it.options[Math.round(t * (it.options.length - 1))];
            return runOption(it, o.value);
          }
          qmRun(b.dataset.q, 1);
        });
      });
      setQm(Math.min(qmSel, qmItems.length - 1));
    }
    function setQm(i) {
      qmSel = Math.max(0, Math.min(qmItems.length - 1, i));
      qmItems.forEach((b, j) => b.classList.toggle('sel', j === qmSel));
    }
    function qmRun(id, dir) {
      if (['prev', 'toggle', 'next', 'open'].includes(id)) {
        call('spotifyControl', id);
        if (id === 'toggle' && spotify && spotify.running) {
          spotify = { ...spotify, playing: !spotify.playing };
          renderQm();
        }
      } else if (id === 'mv' || id === 'sv') {
        const it = soundItem(id === 'mv' ? 'musicVolume' : 'sfxVolume');
        const opts = it.options || [];
        const i = opts.findIndex((o) => String(o.value) === String(it.value));
        const j = Math.max(0, Math.min(opts.length - 1, i + dir));
        if (j !== i) runOption(it, opts[j].value);
      } else if (id === 'mus' || id === 'snd') {
        const it = soundItem(id === 'mus' ? 'music' : 'sounds');
        runOption(it, !it.value);
      } else if (id === 'consoles') ctx.openSelector();
      else if (id === 'settings') {
        closeQm();
        openCard({ key: 's:settings', kind: 'settings' }, null);
      } else if (id === 'power') {
        closeQm();
        openPower();
      }
    }
    function qmKey(k) {
      const cur = qmItems[qmSel];
      const id = cur && cur.dataset.q;
      if (k === 'Escape' || k === 'Backspace' || k === 'p' || k === 'P') return closeQm();
      if (k === 'ArrowDown') {
        // del reproductor baja a las barras; en los botones de abajo, de a uno
        const firstRow = qmItems.findIndex((b) => b.classList.contains('v-qm-row') || b.classList.contains('v-qm-tg'));
        if (cur && cur.closest('.v-qm-song')) setQm(firstRow);
        else setQm(qmSel + 1);
      } else if (k === 'ArrowUp') {
        if (cur && cur.closest('.v-qm-song')) return;
        const prev = qmItems[qmSel - 1];
        if (prev && prev.closest('.v-qm-song')) setQm(qmItems.findIndex((b) => b.closest('.v-qm-song')));
        else setQm(qmSel - 1);
      } else if (k === 'ArrowLeft' || k === 'ArrowRight') {
        const dir = k === 'ArrowRight' ? 1 : -1;
        if (id === 'mv' || id === 'sv') qmRun(id, dir);
        else setQm(qmSel + dir);
      } else if (k === 'Enter' && id) qmRun(id, 1);
    }
    $('.v-qm').addEventListener('pointerdown', (e) => {
      if (e.target === e.currentTarget) closeQm();
    });

    // ---------- Avisos (esquina de arriba a la derecha) ----------
    const notes = [];
    let unseen = 0;
    let notifOpen = false;
    function notify(text, sub = '', art = null) {
      notes.unshift({ text, sub, art, at: Date.now() });
      if (notes.length > 20) notes.pop();
      unseen++;
      paintNotif();
      const n = $('.v-notif');
      n.classList.remove('ping');
      n.offsetWidth;
      n.classList.add('ping');
    }
    function paintNotif() {
      const n = $('.v-notif');
      n.querySelector('span').textContent = String(unseen);
      n.classList.toggle('zero', !unseen);
      const list = $('.v-np-list');
      list.innerHTML = notes.length
        ? notes
            .map(
              (x) => `<div class="v-np-it"><div class="v-np-art"${x.art ? ` style="background-image:url('${x.art}')"` : ''}>${x.art ? '' : icon('bell')}</div>
                <div><div class="v-np-t">${esc(x.text)}</div><div class="v-np-s">${esc(x.sub)}${x.sub ? ' · ' : ''}${esc(U.ago(x.at))}</div></div></div>`
            )
            .join('')
        : '<div class="v-np-empty">No hay avisos nuevos.</div>';
    }
    function toggleNotif() {
      if (view === 'lock' || view === 'playing') return;
      if (notifOpen) return closeNotif();
      notifOpen = true;
      unseen = 0;
      paintNotif();
      $('.v-notif-panel').hidden = false;
    }
    function closeNotif() {
      if (!notifOpen) return;
      notifOpen = false;
      $('.v-notif-panel').hidden = true;
    }
    $('.v-notif').addEventListener('click', toggleNotif);
    paintNotif();

    // ---------- Pantalla de bloqueo ----------
    const lock = $('.v-lock');
    const lockPeel = makePeel({
      el: lock,
      body: $('.v-lock-body'),
      flap: $('.v-lock .v-flap'),
      w: W,
      h: H - BAR,
      rest: 150,
      onStart: () => sound('select'),
      onDone: unlocked,
    });
    function unlocked() {
      lock.hidden = true;
      view = at >= 0 ? 'card' : 'home';
      root.classList.remove('locked');
      root.classList.add('intro');
      setTimeout(() => root.classList.remove('intro'), 1300);
      paintHint();
    }
    lock.addEventListener('click', () => view === 'lock' && lockPeel.peel());
    const teaseTimer = setInterval(() => view === 'lock' && lockPeel.tease(), 4200);
    setTimeout(() => view === 'lock' && lockPeel.tease(), 900);

    // ---------- Iniciar y "Jugando a…" ----------
    async function startGame(g) {
      if (!g || view === 'playing') return;
      const res = await api.launch(g.id);
      if (!res || !res.ok) {
        ctx.toast(`No se pudo abrir: ${(res && res.error) || 'error desconocido'}`);
        return;
      }
      playingGame = g;
      view = 'playing';
      closeQm();
      closeNotif();
      const p = $('.v-playing');
      const bub = $('.v-play-bub');
      bub.innerHTML = '';
      bub.appendChild(bubbleFace({ game: g }));
      $('.v-play-name').textContent = g.name;
      p.hidden = false;
      p.classList.remove('leave');
      document.body.classList.add('playing');
      root.classList.add('is-playing');
      nowPlaying.start();
      const started = Date.now();
      const upd = () => {
        const s = Math.floor((Date.now() - started) / 1000);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        $('.v-play-time').textContent = h ? `${h}:${pad2(m)}:${pad2(s % 60)}` : `${m}:${pad2(s % 60)}`;
      };
      upd();
      clearInterval(playTimer);
      playTimer = setInterval(upd, 1000);
      p.dataset.started = String(started);
    }
    async function endPlaying(reason) {
      if (view !== 'playing') return;
      nowPlaying.stop();
      clearInterval(playTimer);
      document.body.classList.remove('playing');
      root.classList.remove('is-playing');
      const p = $('.v-playing');
      const mins = Math.round((Date.now() - Number(p.dataset.started || Date.now())) / 60000);
      p.classList.add('leave');
      await wait(400);
      p.hidden = true;
      view = at >= 0 ? 'card' : 'home';
      if (reason === 'not-started') ctx.toast('No se detectó que el juego abriera');
      else if (playingGame && mins >= 1) {
        const im = bubbleImage(playingGame);
        notify(`Jugaste ${playingGame.name}`, `${mins} min`, im && im.url);
      }
      playingGame = null;
    }
    $('[data-p="stop"]').addEventListener('click', () => {
      call('dismissPlaying');
      endPlaying('manual');
    });

    // ---------- Pista de teclas (barra superior) ----------
    function paintHint() {
      const h = $('.v-hint');
      if (view === 'lock') h.textContent = 'Enter o clic: desbloquear';
      else if (view === 'card') h.textContent = 'Esc: inicio  ·  Retroceso: cerrar tarjeta  ·  Q / E: cambiar  ·  P: menú rápido';
      else h.textContent = 'Enter: abrir  ·  Q / E: tarjetas  ·  P: menú rápido  ·  Esc: consolas';
    }

    // ---------- Teclado ----------
    function onKey(e) {
      const k = e.key;
      if (k === 'Enter' || k === ' ') e.preventDefault();
      if (view === 'playing') {
        if (k === 'Enter') $('[data-p="stop"]').click();
        return;
      }
      if (view === 'lock') {
        if (k === 'Enter' || k === ' ') lockPeel.peel();
        else if (k === 'Escape') ctx.openSelector();
        return;
      }
      if (busy) return;
      if (pop) {
        if (k === 'ArrowDown') setPop(pop.sel + 1);
        else if (k === 'ArrowUp') setPop(pop.sel - 1);
        else if (k === 'Enter') choosePop(pop.sel);
        else if (k === 'Escape' || k === 'Backspace') closePop();
        return;
      }
      if (qmOpen) return qmKey(k);
      if (notifOpen) {
        if (k === 'Escape' || k === 'Backspace' || k === 'Enter') closeNotif();
        return;
      }
      if (k === 'p' || k === 'P') return openQm();
      if (k === 'n' || k === 'N') return toggleNotif();
      if (k === 'q' || k === 'Q') return at >= 0 && goTo(at - 1);
      if (k === 'e' || k === 'E') return at < cards.length - 1 && goTo(at + 1);
      if (view === 'home') homeKey(k);
      else if (view === 'card') cardKey(k);
    }
    window.addEventListener('keydown', onKey);

    // Rueda del mouse en el inicio: cambiar de página
    let wheelLock = 0;
    $('.v-home').addEventListener('wheel', (e) => {
      if (view !== 'home' || busy || Date.now() < wheelLock || Math.abs(e.deltaY) < 10) return;
      setPage(page + (e.deltaY > 0 ? 1 : -1));
      wheelLock = Date.now() + 450;
    });
    // Clic afuera cierra los avisos
    root.addEventListener('pointerdown', (e) => {
      if (notifOpen && !e.target.closest('.v-notif-panel, .v-notif')) closeNotif();
    });

    // ---------- Datos ----------
    async function loadProfile() {
      profile = (await call('getSteamProfile')) || profile;
      cards.filter((c) => c.kind === 'trophies').forEach(refreshCard);
    }
    async function loadSummary(s) {
      summary = s || (await call('getAchievementSummary')) || summary;
      cards.filter((c) => c.kind === 'trophies' || c.kind === 'game').forEach(refreshCard);
    }
    function renderSpotify(s) {
      spotify = s || spotify;
      cards.filter((c) => c.kind === 'music').forEach(refreshCard);
      if (qmOpen) renderQm();
    }
    let lastChannel = null;
    function renderDiscord(s) {
      discord = s || discord;
      const ch = discord.status === 'ok' && discord.channel ? discord.channel.id : null;
      if (ch && ch !== lastChannel && lastChannel !== undefined) notify(`Estás en ${discord.channel.name}`, discord.channel.guild || 'Discord');
      lastChannel = ch;
      paintPartyBadge();
      cards.filter((c) => c.kind === 'party').forEach(refreshCard);
    }
    let knownIds = null;
    function setGames(list) {
      const next = list || [];
      if (knownIds) {
        next.filter((g) => !knownIds.has(g.id)).forEach((g) => {
          const im = bubbleImage(g);
          notify(`Nuevo: ${g.name}`, 'Se agregó a tus juegos', im && im.url);
        });
      }
      knownIds = new Set(next.map((g) => g.id));
      games = next;
      // las tarjetas abiertas usan los datos nuevos del juego
      cards.forEach((c) => {
        if (c.game) c.game = games.find((g) => g.id === c.game.id) || c.game;
      });
      buildPages();
      cards.filter((c) => c.kind === 'game' || c.kind === 'library' || c.kind === 'trophies').forEach(refreshCard);
    }
    offs.push(api.onGamesUpdated(setGames));
    offs.push(api.onGameEnded(({ reason }) => endPlaying(reason)));
    if (api.onSpotify) offs.push(api.onSpotify(renderSpotify));
    if (api.onDiscord) offs.push(api.onDiscord(renderDiscord));
    if (api.onSteamSummary) offs.push(api.onSteamSummary((s) => loadSummary(s)));
    if (api.onSteamChanged)
      offs.push(
        api.onSteamChanged(() => {
          loadProfile();
          loadSummary();
        })
      );

    root.classList.add('locked');
    lastChannel = undefined; // el primer estado de Discord no avisa
    call('spotifyWatch', true).then((s) => s && renderSpotify(s));
    call('discordWatch', true).then((s) => renderDiscord(s || discord));
    call('getMenu').then((m) => (menuModel = m || []));
    loadProfile();
    loadSummary();
    paintTasks();
    paintEdges();
    paintHint();
    api.getState().then((s) => setGames(s.games));

    return {
      unmount() {
        nowPlaying.dispose();
        clearInterval(clockTimer);
        clearInterval(playTimer);
        clearInterval(teaseTimer);
        window.removeEventListener('keydown', onKey);
        offs.forEach((off) => off && off());
        call('spotifyWatch', false);
        call('discordWatch', false);
        document.body.classList.remove('playing');
        root.classList.remove('in-card', 'is-playing', 'intro', 'locked', 'dim-home');
        root.innerHTML = '';
      },
    };
  }
})();
