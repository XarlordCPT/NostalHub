/* Tema Nintendo 3DS: la consola abierta con sus dos pantallas.
   - Arriba (400×240, "3D"): barra de estado y el banner del icono elegido, con profundidad que sigue al mouse
     (el deslizador 3D a la derecha de la pantalla la regula).
   - Abajo (320×240, táctil): accesos directos, la cuadrícula de iconos (zoom de 1 a 6 filas) y la barra de desplazamiento.
   - Apps: Configuración (tema y color de la carcasa), Nintendo eShop (Steam), Registro de actividad, Sonido (Spotify),
     Logros y Cambiar de consola; arriba: Notas (logros), Lista de amigos (Discord), Notificaciones, Navegador y Perfil.
   - Los botones de la carcasa funcionan: cruceta, A / B, HOME y el botón de encendido.
   Las pantallas se diseñan en su tamaño real y se agrandan (K). Se registra en window.Themes['3ds']. */
(() => {
  const K = 1.75; // 400×240 → 700×420 y 320×240 → 560×420
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const pad2 = (n) => String(n).padStart(2, '0');
  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem('nostalhub.3ds.' + k);
        return v == null ? d : v;
      } catch {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem('nostalhub.3ds.' + k, String(v));
      } catch {}
    },
  };

  // ---------- Íconos (trazo) ----------
  const I = {
    gear: '<circle cx="24" cy="24" r="6"/><path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.6 10.6l4.2 4.2M33.2 33.2l4.2 4.2M10.6 37.4l4.2-4.2M33.2 14.8l4.2-4.2"/><circle cx="24" cy="24" r="12"/>',
    bag: '<path d="M9 16h30l-3 25H12Z"/><path d="M17 16v-3a7 7 0 0 1 14 0v3"/>',
    chart: '<path d="M8 40h32"/><path d="M13 40V26M21 40V14M29 40V22M37 40V30"/>',
    music: '<path d="M19 35V11l20-4v23"/><circle cx="14" cy="35" r="5.5" fill="currentColor"/><circle cx="34" cy="30" r="5.5" fill="currentColor"/>',
    trophy: '<path d="M16 8h16v10a8 8 0 0 1-16 0Z"/><path d="M16 11H9v3a6 6 0 0 0 7 6M32 11h7v3a6 6 0 0 1-7 6"/><path d="M24 26v8M17 40h14M19 34h10v6H19z"/>',
    swap: '<path d="M8 17h30l-7-7M40 31H10l7 7"/>',
    note: '<path d="M12 6h18l8 8v28H12Z"/><path d="M30 6v8h8M18 22h14M18 29h14M18 36h9"/>',
    smile: '<circle cx="24" cy="24" r="17"/><circle cx="18" cy="20" r="2" fill="currentColor"/><circle cx="30" cy="20" r="2" fill="currentColor"/><path d="M16 29c4 5 12 5 16 0"/>',
    bell: '<path d="M14 33V22a10 10 0 0 1 20 0v11l4 4H10Z"/><path d="M20 41a4 4 0 0 0 8 0"/>',
    globe: '<circle cx="24" cy="24" r="17"/><path d="M7 24h34M24 7c-8 7-8 27 0 34M24 7c8 7 8 27 0 34"/>',
    person: '<circle cx="24" cy="16" r="7"/><path d="M10 41c0-9 6-14 14-14s14 5 14 14"/>',
    headset: '<path d="M8 30v-6a16 16 0 0 1 32 0v6"/><rect x="6" y="28" width="8" height="12" rx="3"/><rect x="34" y="28" width="8" height="12" rx="3"/>',
    play: '<path d="M15 9l25 15-25 15Z" fill="currentColor"/>',
    pause: '<path d="M14 10h7v28h-7zM27 10h7v28h-7z" fill="currentColor"/>',
    prev: '<path d="M14 10v28M38 10 18 24l20 14Z" fill="currentColor"/>',
    next: '<path d="M34 10v28M10 10l20 14-20 14Z" fill="currentColor"/>',
    zoomOut: '<rect x="7" y="7" width="14" height="14" rx="2"/><rect x="27" y="7" width="14" height="14" rx="2"/><rect x="7" y="27" width="14" height="14" rx="2"/><rect x="27" y="27" width="14" height="14" rx="2"/>',
    zoomIn: '<rect x="10" y="10" width="28" height="28" rx="3"/>',
    brush: '<path d="M30 8l10 10-16 16-10-10Z"/><path d="M14 24c-6 0-8 6-8 14 8 0 14-2 14-8"/>',
    power: '<path d="M16 12a15 15 0 1 0 16 0"/><path d="M24 6v17"/>',
    micOff: '<rect x="18" y="6" width="12" height="22" rx="6"/><path d="M11 23a13 13 0 0 0 26 0M24 36v6M8 8l32 32"/>',
    check: '<path d="M10 25l9 9 19-20"/>',
    image: '<rect x="6" y="9" width="36" height="30" rx="3"/><circle cx="17" cy="19" r="4"/><path d="M6 34l11-10 9 8 6-5 10 9"/>',
    info: '<circle cx="24" cy="24" r="17"/><path d="M24 22v11"/><circle cx="24" cy="15.5" r="1.8" fill="currentColor"/>',
    house: '<path d="M7 25 24 10l17 15"/><path d="M12 21v18h24V21"/>',
  };
  const ic = (n) => `<svg class="d-ic" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">${I[n] || ''}</svg>`;

  // Temas (fondo de las pantallas) y colores de la carcasa
  const THEMES = [
    { id: 'white', label: 'Básico blanco' },
    { id: 'black', label: 'Básico negro' },
    { id: 'blue', label: 'Azul' },
    { id: 'pink', label: 'Rosa' },
    { id: 'green', label: 'Verde' },
    { id: 'yellow', label: 'Amarillo' },
  ];
  const SHELLS = [
    { id: 'black', label: 'Negro cosmos' },
    { id: 'aqua', label: 'Azul aqua' },
    { id: 'red', label: 'Rojo flama' },
    { id: 'white', label: 'Blanco hielo' },
    { id: 'pink', label: 'Rosa coral' },
  ];
  // Íconos de la cuadrícula: tamaño de cada casilla (px de la pantalla real) según cuántas filas
  const SLOT = { 1: 84, 2: 74, 3: 56, 4: 42, 5: 34, 6: 28 };
  const GRID_TOP = 4; // dentro de la zona de la cuadrícula (debajo de los accesos directos)
  const GRID_H = 174;

  const MARKUP = `
<div class="d-desk"></div>
<div class="d-shell">
  <div class="d-lid">
    <div class="d-spk l"></div><div class="d-spk r"></div>
    <div class="d-cam"></div>
    <div class="d-led3d" title="3D"></div>
    <div class="d-screen d-topwrap"><div class="d-top">
      <div class="t-bg"></div>
      <div class="t-home">
        <div class="t-banner"><div class="t-ban-bg"></div><div class="t-ban-fg"></div></div>
        <div class="t-label"><b></b><small></small></div>
      </div>
      <div class="t-app" hidden></div>
      <div class="t-status"><span class="t-wifi">${'<i></i>'.repeat(3)}</span><span class="t-sp"></span><span class="t-date"></span><span class="t-time"></span><span class="t-batt"><i></i></span></div>
      <div class="t-flash"></div>
    </div></div>
    <div class="d-slider" title="Deslizador 3D"><div class="d-slider-track"></div><div class="d-slider-knob"></div><span>3D</span></div>
  </div>
  <div class="d-hinge"></div>
  <div class="d-base">
    <div class="d-cpad"><i></i></div>
    <div class="d-dpad"><button data-k="ArrowUp" class="u"></button><button data-k="ArrowLeft" class="l"></button><button data-k="ArrowRight" class="r"></button><button data-k="ArrowDown" class="d"></button><i></i></div>
    <div class="d-abxy"><button class="x" data-k="x">X</button><button class="y" data-k="y">Y</button><button class="a" data-k="Enter">A</button><button class="b" data-k="Escape">B</button></div>
    <div class="d-screen d-botwrap"><div class="d-bot">
      <div class="b-bg"></div>
      <div class="b-home">
        <div class="b-short"></div>
        <div class="b-gridview"><div class="b-grid"></div></div>
        <div class="b-bar">
          <button class="b-zoom" data-z="-1" title="Más filas">${ic('zoomOut')}</button>
          <button class="b-zoom" data-z="1" title="Menos filas">${ic('zoomIn')}</button>
          <div class="b-scroll"><i></i></div>
          <button class="b-theme" title="Tema">${ic('brush')}</button>
        </div>
      </div>
      <div class="b-app" hidden></div>
      <div class="b-dlg" hidden><div class="b-dlg-box"><div class="b-dlg-t"></div><div class="b-dlg-btns"></div></div></div>
      <div class="t-flash"></div>
    </div></div>
    <div class="d-sss"><button class="sel" data-k="Select">SELECT</button><button class="home" data-k="Home" title="HOME">${ic('house')}</button><button class="sta" data-k="o">START</button></div>
    <button class="d-power" data-k="Power" title="Encendido">${ic('power')}</button>
    <div class="d-leds"><i class="pw"></i><i class="ch"></i></div>
  </div>
</div>
<div class="d-side l"></div><div class="d-side r"></div>
<section class="d-playing" hidden></section>`;

  window.Themes = window.Themes || {};
  window.Themes['3ds'] = { mount, synth };

  // ---------- Sonidos hechos con código (si no pusiste los tuyos en consolas\\3ds\\) ----------
  let ac = null;
  function synth(kind, vol = 0.6) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return;
    }
    if (ac.state === 'suspended') ac.resume();
    const out = ac.createGain();
    out.gain.value = vol;
    out.connect(ac.destination);
    const tone = (f, f2, t, d, g, type = 'sine') => {
      const o = ac.createOscillator();
      const v = ac.createGain();
      const t0 = ac.currentTime + t;
      o.type = type;
      o.frequency.setValueAtTime(f, t0);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
      v.gain.setValueAtTime(0.0001, t0);
      v.gain.exponentialRampToValueAtTime(g, t0 + 0.006);
      v.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      o.connect(v).connect(out);
      o.start(t0);
      o.stop(t0 + d + 0.05);
    };
    if (kind === 'move' || kind === 'page') tone(1500, 1900, 0, 0.045, 0.08);
    else if (kind === 'select') (tone(988, 0, 0, 0.09, 0.09), tone(1480, 0, 0.06, 0.14, 0.08));
    else if (kind === 'back') tone(1100, 700, 0, 0.1, 0.08);
    else if (kind === 'start') [523, 659, 784, 1047].forEach((f, i) => tone(f, 0, i * 0.08, 0.35, 0.07, 'triangle'));
    else if (kind === 'gameboot') [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0, i * 0.06, 0.5, 0.07, 'triangle'));
    else if (kind === 'error') (tone(330, 0, 0, 0.15, 0.08, 'square'), tone(262, 0, 0.13, 0.2, 0.08, 'square'));
    else if (kind === 'border') tone(220, 0, 0, 0.06, 0.08);
  }

  // =====================================================================
  function mount(root, ctx) {
    root.innerHTML = MARKUP;
    const api = ctx.api;
    const U = window.NostalHubUtil;
    const feed = U.friendsFeed(api); // amigos de Steam (Lista de amigos)
    const esc = U.escapeHtml;
    const $ = (s, el = root) => el.querySelector(s);
    const $$ = (s, el = root) => [...el.querySelectorAll(s)];
    const call = (fn, ...a) => (typeof api[fn] === 'function' ? api[fn](...a) : Promise.resolve(null));

    let games = [];
    let profile = { name: 'Jugador', avatar: null };
    let summary = { perGame: {}, hasKey: false };
    let spotify = null;
    let discord = { status: 'off', channel: null, members: [] };
    let menuModel = [];
    let view = 'home'; // home | settings | activity | music | trophies | friends | notes | playing
    const offs = [];

    // ---------- Tema, carcasa, filas y 3D (se recuerdan) ----------
    let theme = store.get('theme', 'white');
    let shell = store.get('shell', 'black');
    let rows = Math.max(1, Math.min(6, Number(store.get('rows', 2)) || 2));
    let depth = Math.max(0, Math.min(1, Number(store.get('depth', 0.6))));
    function applyLook() {
      root.dataset.t = theme;
      root.dataset.s = shell;
      root.classList.toggle('d3', depth > 0.02);
      const k = $('.d-slider-knob');
      k.style.top = `${(1 - depth) * 200}px`;
    }
    applyLook();

    // ---------- Reloj ----------
    const DAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    function tick() {
      const d = new Date();
      $('.t-date').textContent = `${d.getDate()}/${d.getMonth() + 1} (${DAYS[d.getDay()]})`;
      $('.t-time').textContent = `${d.getHours()}:${pad2(d.getMinutes())}`;
    }
    tick();
    const clockTimer = setInterval(tick, 10000);

    // =====================================================================
    // Íconos: apps del sistema y después tus juegos
    // =====================================================================
    function trophiesOf(g) {
      return (g && g.appId && summary.perGame && summary.perGame[g.appId]) || null;
    }
    function apps() {
      return [
        { app: 'settings', icon: 'gear', color: '#8c8c8c', title: 'Configuración de la consola', sub: 'Tema, carcasa, pantalla, sonido y cuentas' },
        { app: 'eshop', icon: 'bag', color: '#f07b1d', title: 'Nintendo eShop', sub: 'Se abre la tienda de Steam' },
        { app: 'activity', icon: 'chart', color: '#3fa63f', title: 'Registro de actividad', sub: 'Cuánto has jugado a cada juego' },
        { app: 'music', icon: 'music', color: '#e8443a', title: 'Nintendo 3DS Sonido', sub: spotify && spotify.running ? `${spotify.appName || 'Spotify'}: ${spotify.title || 'abierto'}` : `Tu música de ${(spotify && spotify.appName) || 'Spotify'}` },
        { app: 'trophies', icon: 'trophy', color: '#e2a300', title: 'Logros', sub: summary.hasKey ? `${summary.done || 0} de ${summary.total || 0} logros` : 'Conecta tu Steam para verlos' },
        { app: 'consoles', icon: 'swap', color: '#29a8e0', title: 'Cambiar de consola', sub: 'Volver al selector de consolas' },
      ];
    }
    function recentGames() {
      return [...games].sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0) || a.name.localeCompare(b.name, 'es'));
    }
    let items = [];
    let sel = 0;
    let firstCol = 0;

    // Imagen cuadrada del juego: tu cuadrado.png → fondo con logo → carátula → portada
    function squareHtml(g) {
      if (g.square) return `<span class="sq" style="background-image:url('${esc(g.square)}')"></span>`;
      if (g.hero && g.heroIsReal && g.logo) return `<span class="sq" style="background-image:url('${esc(g.hero)}')"><img src="${esc(g.logo)}" alt="" draggable="false" /></span>`;
      if (g.cover) return `<span class="sq top" style="background-image:url('${esc(g.cover)}')"></span>`;
      const u = g.hero || (g.tileIsVideo ? null : g.tile);
      if (u) return `<span class="sq" style="background-image:url('${esc(u)}')">${g.logo ? `<img src="${esc(g.logo)}" alt="" draggable="false" />` : ''}</span>`;
      return `<span class="sq none">${esc(g.name)}</span>`;
    }
    function itemIconHtml(it) {
      if (it.game) return squareHtml(it.game);
      return `<span class="sq app" style="--c:${it.color}">${ic(it.icon)}</span>`;
    }

    function buildItems() {
      const keep = items[sel];
      items = [...apps(), ...recentGames().map((g) => ({ game: g, title: g.name }))];
      if (keep) {
        const j = items.findIndex((x) => (keep.game ? x.game && x.game.id === keep.game.id : x.app === keep.app));
        if (j >= 0) sel = j;
      }
      sel = Math.max(0, Math.min(items.length - 1, sel));
    }

    function renderGrid() {
      const grid = $('.b-grid');
      const S = SLOT[rows];
      const cols = Math.max(Math.ceil(items.length / rows) + 1, Math.ceil(320 / S));
      grid.innerHTML = '';
      grid.style.setProperty('--s', `${S}px`);
      root.dataset.rows = rows;
      const y0 = GRID_TOP + (GRID_H - rows * S) / 2;
      for (let i = 0; i < cols * rows; i++) {
        const col = Math.floor(i / rows);
        const row = i % rows;
        const el = document.createElement('div');
        el.className = 'b-slot';
        el.style.left = `${8 + col * S}px`;
        el.style.top = `${y0 + row * S}px`;
        const it = items[i];
        if (it) {
          el.classList.add('full');
          el.dataset.i = i;
          if (it.game) el.dataset.gameId = it.game.id; // clic derecho → cambiar imágenes
          el.innerHTML = `<div class="b-icon">${itemIconHtml(it)}</div>`;
          el.addEventListener('click', () => {
            if (view !== 'home' || dlg) return;
            if (sel === i) return openItem();
            ctx.sound('move');
            setSel(i);
          });
        }
        grid.appendChild(el);
      }
      $('.b-scroll').style.setProperty('--n', cols);
      setSel(sel, false);
    }
    function visibleCols() {
      return Math.floor((320 - 16) / SLOT[rows]);
    }
    function setSel(i, animate = true) {
      sel = Math.max(0, Math.min(items.length - 1, i));
      const col = Math.floor(sel / rows);
      const vis = visibleCols();
      if (col < firstCol) firstCol = col;
      else if (col > firstCol + vis - 1) firstCol = col - vis + 1;
      const totalCols = Math.ceil(items.length / rows) + 1;
      firstCol = Math.max(0, Math.min(firstCol, Math.max(0, totalCols - vis)));
      const grid = $('.b-grid');
      grid.classList.toggle('still', !animate);
      grid.style.transform = `translateX(${-firstCol * SLOT[rows]}px)`;
      $$('.b-slot', grid).forEach((s) => s.classList.toggle('sel', Number(s.dataset.i) === sel && s.classList.contains('full')));
      // barra de desplazamiento
      const thumb = $('.b-scroll i');
      const frac = Math.min(1, vis / totalCols);
      thumb.style.width = `${frac * 100}%`;
      thumb.style.left = `${totalCols > vis ? (firstCol / (totalCols - vis)) * (1 - frac) * 100 : 0}%`;
      paintBanner();
      paintHint();
    }
    function moveSel(k) {
      const r = sel % rows;
      let n = sel;
      if (k === 'ArrowUp') n = r > 0 ? sel - 1 : sel;
      else if (k === 'ArrowDown') n = r < rows - 1 && sel + 1 < items.length ? sel + 1 : sel;
      else if (k === 'ArrowLeft') n = sel - rows;
      else if (k === 'ArrowRight') n = Math.min(items.length - 1, sel + rows);
      if (n < 0 || n === sel) return ctx.sound('border');
      setSel(n);
    }
    function zoom(d) {
      const next = Math.max(1, Math.min(6, rows + d));
      if (next === rows) return ctx.sound('border');
      rows = next;
      store.set('rows', rows);
      firstCol = 0;
      renderGrid();
      ctx.sound('page');
    }
    $$('.b-zoom').forEach((b) => b.addEventListener('click', () => view === 'home' && zoom(Number(b.dataset.z))));
    $('.b-theme').addEventListener('click', () => view === 'home' && openApp('settings', 'theme'));
    $('.b-scroll').addEventListener('click', (e) => {
      if (view !== 'home') return;
      const r = e.currentTarget.getBoundingClientRect();
      const frac = (e.clientX - r.left) / r.width;
      const totalCols = Math.ceil(items.length / rows);
      setSel(Math.min(items.length - 1, Math.floor(frac * totalCols) * rows));
    });
    $('.b-gridview').addEventListener('wheel', (e) => {
      if (view !== 'home' || dlg || Math.abs(e.deltaY) + Math.abs(e.deltaX) < 8) return;
      if (Date.now() < wheelLock) return;
      wheelLock = Date.now() + 120;
      moveSel((e.deltaY || e.deltaX) > 0 ? 'ArrowRight' : 'ArrowLeft');
      ctx.sound('move');
    });
    let wheelLock = 0;

    // ---------- Accesos directos (arriba de la pantalla táctil) ----------
    const SHORTS = [
      { id: 'notes', icon: 'note', label: 'Notas de juego' },
      { id: 'friends', icon: 'smile', label: 'Lista de amigos' },
      { id: 'notif', icon: 'bell', label: 'Notificaciones' },
      { id: 'browser', icon: 'globe', label: 'Navegador de Internet' },
      { id: 'profile', icon: 'person', label: 'Perfil' },
    ];
    $('.b-short').innerHTML = SHORTS.map((s) => `<button data-s="${s.id}" title="${s.label}">${ic(s.icon)}${s.id === 'friends' ? '<em hidden></em>' : ''}</button>`).join('');
    $$('.b-short button').forEach((b) =>
      b.addEventListener('click', () => {
        if (view === 'playing') return;
        closeDlg();
        const id = b.dataset.s;
        if (id === 'notes') openApp('trophies');
        else if (id === 'friends') openApp('friends');
        else if (id === 'notif') openApp('notes');
        else if (id === 'browser') (call('open', 'steam-activity'), ctx.toast('Se abrió en Steam'));
        else if (id === 'profile') (call('open', summary.hasKey ? 'steam-profile' : 'setup-steam'), summary.hasKey && ctx.toast('Se abrió en Steam'));
      })
    );
    function paintFriendsBadge() {
      const em = $('.b-short [data-s="friends"] em');
      const n = discord.status === 'ok' && discord.channel ? discord.members.length : 0;
      em.hidden = !n;
      em.textContent = n;
    }

    // =====================================================================
    // Pantalla de arriba: banner del icono elegido (con profundidad 3D)
    // =====================================================================
    function paintBanner() {
      const it = items[sel];
      const bg = $('.t-ban-bg');
      const fg = $('.t-ban-fg');
      const label = $('.t-label');
      if (!it) return;
      $('.t-home').dataset.gameCurrent = it.game ? it.game.id : '';
      if (it.game) {
        const g = it.game;
        const u = (g.heroIsReal && g.hero) || g.cover || g.hero || g.tile || '';
        bg.style.backgroundImage = u ? `url("${u}")` : '';
        bg.classList.toggle('cover', !g.heroIsReal && !!g.cover);
        fg.innerHTML = g.logo ? `<img src="${esc(g.logo)}" alt="" draggable="false" />` : `<div class="t-ban-name">${esc(g.name)}</div>`;
        label.querySelector('b').textContent = g.name;
        label.querySelector('small').textContent = [U.hours(g.playtimeMin), g.lastPlayed ? `Jugado ${U.ago(g.lastPlayed)}` : ''].filter(Boolean).join(' · ') || { steam: 'Steam', exe: 'Programa', shortcut: 'Acceso directo', url: 'Otro launcher' }[g.type] || '';
      } else {
        bg.style.backgroundImage = '';
        bg.classList.remove('cover');
        fg.innerHTML = `<div class="t-ban-app" style="--c:${it.color}">${ic(it.icon)}</div>`;
        label.querySelector('b').textContent = it.title;
        label.querySelector('small').textContent = it.sub || '';
      }
      const ban = $('.t-banner');
      ban.classList.remove('pop');
      ban.offsetWidth;
      ban.classList.add('pop');
    }

    // Profundidad: las capas del banner se mueven un poco con el mouse (más con el deslizador arriba)
    let mx = 0;
    let my = 0;
    function onMouse(e) {
      const r = $('.d-top').getBoundingClientRect();
      mx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      my = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
      paintDepth();
    }
    function paintDepth() {
      const d = depth;
      root.style.setProperty('--px', (mx * d).toFixed(3));
      root.style.setProperty('--py', (my * d).toFixed(3));
    }
    window.addEventListener('mousemove', onMouse);
    // Deslizador 3D (a la derecha de la pantalla de arriba)
    const slider = $('.d-slider');
    function slide(e) {
      const r = $('.d-slider-track').getBoundingClientRect();
      depth = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height));
      store.set('depth', depth.toFixed(2));
      applyLook();
      paintDepth();
    }
    slider.addEventListener('pointerdown', (e) => {
      slider.setPointerCapture(e.pointerId);
      slide(e);
      const mv = (ev) => slide(ev);
      const up = () => (slider.removeEventListener('pointermove', mv), slider.removeEventListener('pointerup', up));
      slider.addEventListener('pointermove', mv);
      slider.addEventListener('pointerup', up);
    });

    // =====================================================================
    // Abrir: apps y juegos
    // =====================================================================
    function openItem() {
      const it = items[sel];
      if (!it) return;
      if (it.game) return startGame(it.game);
      if (it.app === 'eshop') return call('open', 'steam-store'), ctx.toast('Se abrió en Steam');
      if (it.app === 'consoles') return ctx.openSelector();
      openApp(it.app);
    }

    // ---------- Apps: arriba un panel, abajo una lista táctil ----------
    let app = null; // { name, list: [{label, value, desc, run, icon, img, dim}], sel, top() }
    async function openApp(name, sub) {
      closeDlg();
      view = name;
      root.classList.add('in-app');
      $('.t-home').hidden = true;
      $('.b-home').hidden = true;
      $('.t-app').hidden = false;
      $('.b-app').hidden = false;
      for (const s of ['.t-app', '.b-app']) {
        const el = $(s);
        el.classList.remove('in');
        el.offsetWidth;
        el.classList.add('in');
      }
      if (name === 'settings') {
        menuModel = (await call('getMenu')) || menuModel;
        app = settingsApp(sub);
      } else if (name === 'activity') app = activityApp();
      else if (name === 'music') app = musicApp();
      else if (name === 'trophies') app = trophiesApp();
      else if (name === 'friends') app = friendsApp();
      else if (name === 'notes') app = notesApp();
      feed.watch(name === 'friends');
      paintApp();
      paintHint();
    }
    function closeApp() {
      if (app && app.back && app.back()) return paintApp();
      app = null;
      view = 'home';
      feed.watch(false);
      root.classList.remove('in-app');
      $('.t-app').hidden = true;
      $('.b-app').hidden = true;
      $('.t-home').hidden = false;
      $('.b-home').hidden = false;
      buildItems();
      renderGrid();
    }
    function paintApp() {
      if (!app) return;
      const list = app.list();
      app.sel = Math.max(0, Math.min(list.length - 1, app.sel || 0));
      $('.t-app').innerHTML = `<div class="ta-head">${ic(app.icon)}<span>${esc(app.title())}</span></div><div class="ta-body">${app.top(list[app.sel])}</div>`;
      const b = $('.b-app');
      b.innerHTML = `<div class="ba-list${app.big ? ' big' : ''}">${
        list.length
          ? list
              .map(
                (r, i) =>
                  `<button class="ba-row${r.dim ? ' dim' : ''}${r.on ? ' on' : ''}" data-i="${i}">${r.svg ? `<span class="ba-ic np">${r.svg}</span>` : r.img !== undefined ? `<span class="ba-img${r.dot ? ` fr ${r.dot}` : ''}"${r.img ? ` style="background-image:url('${esc(r.img)}')"` : ''}>${r.dot ? '<i></i>' : ''}${r.ini && !r.img ? `<b>${esc(r.ini)}</b>` : ''}</span>` : r.icon ? `<span class="ba-ic">${ic(r.icon)}</span>` : ''}<span class="ba-l">${esc(r.label)}</span>${r.value != null ? `<span class="ba-v">${esc(r.value)}</span>` : ''}</button>`
              )
              .join('')
          : `<div class="ba-empty">${app.empty || 'No hay nada aquí.'}</div>`
      }</div>${app.extra ? app.extra() : ''}<div class="ba-foot"><button class="ba-back">${ic('prev')}<span>${app.back && app.depth ? 'Atrás' : 'Menú HOME'}</span></button></div>`;
      $$('.ba-row', b).forEach((r) => {
        const i = Number(r.dataset.i);
        r.addEventListener('click', () => {
          if (i === app.sel) pickRow();
          else (app.sel = i), ctx.sound('move'), paintAppSel();
        });
      });
      $$('[data-x]', b).forEach((x) => x.addEventListener('click', () => app.action && app.action(x.dataset.x)));
      $('.ba-back', b).addEventListener('click', () => (ctx.sound('back'), closeApp()));
      paintAppSel();
    }
    function paintAppSel() {
      const list = app.list();
      $$('.b-app .ba-row').forEach((r) => r.classList.toggle('sel', Number(r.dataset.i) === app.sel));
      const row = $(`.b-app .ba-row[data-i="${app.sel}"]`);
      if (row) row.scrollIntoView({ block: 'nearest' });
      const body = $('.t-app .ta-body');
      if (body) body.innerHTML = app.top(list[app.sel]);
    }
    function pickRow() {
      const r = app.list()[app.sel];
      if (r && r.run) r.run();
    }
    function appKey(k) {
      const n = app.list().length;
      if (k === 'ArrowDown') (app.sel = Math.min(n - 1, app.sel + 1)), paintAppSel();
      else if (k === 'ArrowUp') (app.sel = Math.max(0, app.sel - 1)), paintAppSel();
      else if (k === 'ArrowRight' && app.action) app.action('next');
      else if (k === 'ArrowLeft' && app.action) app.action('prev');
      else if (k === 'Enter' || k === ' ') pickRow();
      else if (k === 'Escape' || k === 'Backspace') closeApp();
    }

    // --- Configuración de la consola ---
    function settingsApp(sub) {
      const st = { cat: null, choice: null };
      const cats = () => [
        { id: 'theme', title: 'Tema', icon: 'brush', desc: 'El fondo de las dos pantallas. Solo cambia esta consola.' },
        { id: 'shell', title: 'Color de la consola', icon: 'image', desc: 'El color de la carcasa de la 3DS.' },
        ...menuModel.map((c) => ({ id: c.id, title: c.title, icon: { general: 'gear', games: 'note', screen: 'image', sound: 'music', accounts: 'person', files: 'note' }[c.id] || 'gear', desc: c.items.map((x) => x.label).slice(0, 3).join(', ') })),
      ];
      const self = {
        icon: 'gear',
        sel: 0,
        depth: 0,
        title: () => (st.choice ? st.choice.it.label : st.cat ? st.cat.title : 'Configuración de la consola'),
        list() {
          if (st.choice) return st.choice.it.options.map((o) => ({ label: o.label, on: String(o.value) === String(st.choice.it.value), value: String(o.value) === String(st.choice.it.value) ? '●' : '', run: () => runOption(st.choice.it, o.value).then(() => ((st.choice = null), (self.depth = 1), paintApp())) }));
          if (st.cat && st.cat.id === 'theme') return THEMES.map((t) => ({ label: t.label, on: t.id === theme, value: t.id === theme ? '●' : '', run: () => ((theme = t.id), store.set('theme', theme), applyLook(), paintApp()) }));
          if (st.cat && st.cat.id === 'shell') return SHELLS.map((t) => ({ label: t.label, on: t.id === shell, value: t.id === shell ? '●' : '', run: () => ((shell = t.id), store.set('shell', shell), applyLook(), paintApp()) }));
          if (st.cat) {
            const c = menuModel.find((x) => x.id === st.cat.id);
            return (c ? c.items : []).map((it) => ({ label: it.label, desc: it.desc, value: it.type === 'toggle' || it.type === 'choice' ? U.optionValueText(it) : null, run: () => pickSetting(it) }));
          }
          return cats().map((c) => ({ label: c.title, icon: c.icon, desc: c.desc, run: () => ((st.cat = c), (self.depth = 1), (self.sel = 0), paintApp()) }));
        },
        top: (r) => `<div class="ta-desc">${r ? `<b>${esc(r.label)}</b>${esc(r.desc || (st.cat && st.cat.id === 'theme' ? 'Toca para ponerlo.' : ''))}` : ''}</div>`,
        back() {
          if (st.choice) return (st.choice = null), true;
          if (st.cat) return (self.sel = cats().findIndex((c) => c.id === st.cat.id)), (st.cat = null), (self.depth = 0), true;
          return false;
        },
      };
      async function pickSetting(it) {
        if (it.id === 'consoles') return ctx.openSelector();
        if (it.confirm) return powerDlg();
        if (it.type === 'choice') return (st.choice = { it }), (self.depth = 2), (self.sel = Math.max(0, it.options.findIndex((o) => String(o.value) === String(it.value)))), paintApp();
        if (/^open-|^devtools$/.test(it.id)) ctx.toast('Se abrió en Windows');
        await runOption(it, it.type === 'toggle' ? !it.value : undefined);
        if (view === 'settings') paintApp();
      }
      if (sub) {
        const c = cats().find((x) => x.id === sub);
        if (c) (st.cat = c), (self.depth = 1);
      }
      return self;
    }
    async function runOption(it, value) {
      const next = await call('runMenu', it.id, value);
      if (next) menuModel = next;
    }

    // --- Registro de actividad ---
    function activityApp() {
      const list = () => [...games].filter((g) => g.playtimeMin || g.lastPlayed).sort((a, b) => (b.playtimeMin || 0) - (a.playtimeMin || 0));
      const total = () => games.reduce((s, g) => s + (g.playtimeMin || 0), 0);
      return {
        icon: 'chart',
        sel: 0,
        big: true,
        title: () => 'Registro de actividad',
        empty: 'Todavía no hay tiempo de juego registrado.',
        list: () => list().map((g) => ({ img: (g.square || g.cover || g.hero || g.tile || ''), label: g.name, value: U.hours(g.playtimeMin).replace(' jugadas', '').replace(' jugados', '') || '—' })),
        top(r) {
          const l = list().slice(0, 6);
          const max = Math.max(1, ...l.map((g) => g.playtimeMin || 0));
          const cur = r && list().find((g) => g.name === r.label);
          return `<div class="ta-chart">${l
            .map((g) => `<div class="ta-bar${cur && cur.id === g.id ? ' on' : ''}"><span class="ta-bn">${esc(g.name)}</span><span class="ta-track"><i style="width:${((g.playtimeMin || 0) / max) * 100}%"></i></span><em>${esc(U.hours(g.playtimeMin).replace(' jugadas', '').replace(' jugados', ''))}</em></div>`)
            .join('')}</div><div class="ta-total">En total: <b>${esc(U.hours(total()).replace(' jugadas', '').replace(' jugados', '') || '0 h')}</b>${cur && cur.lastPlayed ? ` · ${esc(cur.name)}: jugado ${esc(U.ago(cur.lastPlayed))}` : ''}</div>`;
        },
      };
    }

    // --- Nintendo 3DS Sonido (Spotify) ---
    function musicApp() {
      return {
        icon: 'music',
        sel: 1,
        title: () => 'Nintendo 3DS Sonido',
        list() {
          const v = U.spotifyView(spotify || {});
          const rows = v.on
            ? [
                { icon: 'prev', label: 'Anterior', run: () => spotifyCmd('prev') },
                { icon: v.playing ? 'pause' : 'play', label: v.playing ? 'Pausa' : 'Reproducir', run: () => spotifyCmd('toggle') },
                { icon: 'next', label: 'Siguiente', run: () => spotifyCmd('next') },
              ]
            : [];
          // Con Spotify conectado: orden, repetir, me gusta, volumen, dispositivo y la cola
          U.musicActions(v).forEach((a) => rows.push({ svg: U.npIcon(a.icon), on: a.on, label: a.label, value: a.id === 'like' ? '' : a.value, run: () => U.musicRun(api, a.id, v, ctx.toast) }));
          if (v.appId !== 'auto') rows.push({ icon: 'music', label: `Abrir ${v.app}`, run: () => spotifyCmd('open') });
          if (v.appId === 'spotify' && !v.api) rows.push({ icon: 'note', label: 'Conectar Spotify (Premium)', run: () => call('open', 'setup-spotify') });
          return rows;
        },
        top() {
          const v = U.spotifyView(spotify || {});
          return `<div class="ta-music"><span class="ta-cover"${v.cover ? ` style="background-image:url('${esc(v.cover)}')"` : ''}>${v.cover ? '' : ic('music')}</span><div><small>${v.on ? `${v.playing ? 'Reproduciendo' : 'En pausa'}${v.device && v.deviceType !== 'Computer' ? ` · en ${esc(v.device)}` : ''}` : esc(v.app)}</small><b>${esc(v.title)}</b><span>${esc(v.artist)}</span></div></div>
            ${U.progressHtml(v, 'ta-mprog')}${v.next ? `<div class="ta-next"><small>Siguiente</small>${esc(U.nextText(v))}</div>` : ''}`;
        },
      };
    }
    function spotifyCmd(cmd) {
      call('spotifyControl', cmd);
      if (cmd === 'toggle' && spotify && spotify.running) spotify = { ...spotify, playing: !spotify.playing };
      if (view === 'music') paintApp();
    }

    // --- Logros ---
    function trophiesApp() {
      const st = { game: null, list: null, msg: '' };
      const gamesWith = () => games.filter((g) => trophiesOf(g) && trophiesOf(g).total).sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
      const self = {
        icon: 'trophy',
        sel: 0,
        depth: 0,
        big: true,
        title: () => (st.game ? st.game.name : 'Logros'),
        get empty() {
          return st.game ? st.msg || 'Cargando…' : summary.hasKey ? 'Todavía no hay datos de logros. Se cargan solos en unos minutos.' : U.achievementMessage({ status: 'no-key' });
        },
        list() {
          if (st.game)
            return (st.list || []).map((a) => {
              const t = U.achievementTexts(a);
              return { img: a.done ? a.icon : a.iconGray || a.icon, label: t.name, desc: t.description, value: a.done ? t.date : 'Bloqueado', dim: !a.done };
            });
          return gamesWith().map((g) => {
            const tp = trophiesOf(g);
            return { img: g.square || g.cover || g.hero || '', label: g.name, value: `${tp.done}/${tp.total}`, g, run: () => openGameTrophies(g) };
          });
        },
        top(r) {
          if (st.game) return `<div class="ta-desc">${r ? `<b>${esc(r.label)}</b>${esc(r.desc || '')}` : ''}</div>`;
          const g = r && r.g;
          if (!g) return `<div class="ta-desc"><b>${esc(profile.name || 'Jugador')}</b>${summary.hasKey ? `${summary.done || 0} de ${summary.total || 0} logros` : ''}</div>`;
          const tp = trophiesOf(g);
          return `<div class="ta-desc"><b>${esc(g.name)}</b>${tp.done} de ${tp.total} logros (${Math.round((tp.done / tp.total) * 100)} %)<i class="ta-prog"><i style="width:${(tp.done / tp.total) * 100}%"></i></i></div>`;
        },
        back() {
          if (st.game) return (self.sel = Math.max(0, gamesWith().indexOf(st.game))), (st.game = null), (st.list = null), (self.depth = 0), true;
          return false;
        },
      };
      async function openGameTrophies(g) {
        st.game = g;
        st.list = null;
        st.msg = '';
        self.depth = 1;
        self.sel = 0;
        paintApp();
        const res = (await call('getAchievements', g.appId)) || { status: 'error' };
        if (st.game !== g || view !== 'trophies') return;
        if (res.status !== 'ok') st.msg = U.achievementMessage(res);
        else st.list = U.sortAchievements(res.list);
        paintApp();
      }
      self.open = openGameTrophies;
      return self;
    }

    // --- Lista de amigos (Steam + grupo de Discord) ---
    // Arriba se ve la "tarjeta de amigo" del marcado; abajo la lista. Enter: ver perfil o enviar mensaje.
    feed.onChange(() => view === 'friends' && app && paintApp());
    function friendShort(f) {
      if (f.state === 0) return f.lastSeen ? U.ago(f.lastSeen) : 'Desconectado';
      if (f.game) return 'Jugando';
      return { 2: 'Ocupado', 3: 'Ausente', 4: 'Ausente' }[f.state] || 'En línea';
    }
    function friendDlg(f) {
      openDlg(`<b>${esc(f.name)}</b><small>${esc(U.friendStatus(f))}</small>`, [
        { label: 'Ver perfil', run: () => (feed.profile(f), ctx.toast(`Se abrió el perfil de ${f.name} en Steam`)) },
        { label: 'Enviar mensaje', run: () => (feed.chat(f), ctx.toast(`Se abrió el chat con ${f.name} en Steam`)) },
        { label: 'Cancelar' },
      ]);
    }
    function friendsApp() {
      return {
        icon: 'smile',
        sel: 0,
        big: true,
        title: () => 'Lista de amigos',
        list() {
          const rows = [];
          const d = feed.data;
          if (d.status === 'ok') feed.list.forEach((f) => rows.push({ img: f.avatar || '', ini: (f.name || '?').trim().charAt(0).toUpperCase(), dot: U.friendClass(f), dim: f.state === 0, label: f.name, value: friendShort(f), f, run: () => friendDlg(f) }));
          else {
            const m = U.friendsMessage(d.status);
            rows.push({ icon: 'person', label: m.t, desc: m.d, run: m.btn ? () => call('open', m.btn[0]) : null });
          }
          // Grupo de voz (Discord), al final
          const msg = {
            'no-config': ['Conectar Discord', () => call('open', 'setup-discord')],
            'no-discord': ['Abrir Discord', () => call('open', 'discord-app')],
            'need-auth': ['Dar permiso en Discord', () => call('discordAuthorize').then((s) => s && setDiscord(s))],
            error: ['Intentar de nuevo', () => call('discordAuthorize').then((s) => s && setDiscord(s))],
          }[discord.status];
          if (msg) rows.push({ icon: 'headset', label: msg[0], party: true, run: msg[1] });
          if (discord.status === 'ok' && discord.channel) {
            rows.push({ icon: 'headset', label: discord.channel.name, value: 'Grupo', party: true });
            discord.members.forEach((m) => rows.push({ img: m.avatar || '', label: m.name, party: true, value: m.deafened ? 'Sin audio' : m.muted ? 'Silenciado' : m.speaking ? 'Hablando' : '' }));
          }
          return rows;
        },
        top(r) {
          if (r && r.f) {
            const f = r.f;
            return `<div class="ta-fcard ${U.friendClass(f)}"><span class="ta-fav"${f.avatar ? ` style="background-image:url('${esc(f.avatar)}')"` : ''}>${f.avatar ? '' : esc((f.name || '?').trim().charAt(0).toUpperCase())}<i></i></span>
              <div class="ta-finfo"><b>${esc(f.name)}</b><span class="ta-fst">${esc(U.friendStatus(f))}</span><small>A: ver perfil o enviar mensaje</small></div></div>
              <div class="ta-fcount">${feed.online.length} en línea · ${feed.list.length} ${feed.list.length === 1 ? 'amigo' : 'amigos'}</div>`;
          }
          if (r && !r.party && feed.data.status !== 'ok') return `<div class="ta-desc"><b>${esc(r.label)}</b>${esc(r.desc || '')}</div>`;
          const v = U.partyView(discord);
          if (v.message) return `<div class="ta-desc"><b>Grupo de voz</b>${esc(v.message)}</div>`;
          return `<div class="ta-desc"><b>${esc(v.channel)}</b>${esc(v.guild)} · ${v.members.length} ${v.members.length === 1 ? 'persona' : 'personas'}</div>`;
        },
      };
    }

    // --- Notificaciones ---
    function notesApp() {
      const list = () => {
        const out = [];
        recentGames()
          .filter((g) => g.lastPlayed)
          .slice(0, 8)
          .forEach((g) => out.push({ img: g.square || g.cover || g.hero || '', label: `Jugaste ${g.name}`, value: U.ago(g.lastPlayed), g }));
        if (discord.status === 'ok' && discord.channel) out.unshift({ icon: 'headset', label: `Estás en ${discord.channel.name}`, value: 'ahora' });
        return out;
      };
      return {
        icon: 'bell',
        sel: 0,
        big: true,
        title: () => 'Notificaciones',
        empty: 'No hay notificaciones nuevas.',
        list,
        top(r) {
          const g = r && r.g;
          if (!g) return `<div class="ta-desc">${r ? `<b>${esc(r.label)}</b>` : ''}</div>`;
          const tp = trophiesOf(g);
          return `<div class="ta-desc"><b>${esc(g.name)}</b>${esc([U.hours(g.playtimeMin), tp && tp.total ? `${tp.done} de ${tp.total} logros` : ''].filter(Boolean).join(' · '))}</div>`;
        },
      };
    }

    // =====================================================================
    // Ventanas (abajo): opciones del juego y energía
    // =====================================================================
    let dlg = null;
    function openDlg(title, btns) {
      dlg = { btns, sel: 0 };
      $('.b-dlg-t').innerHTML = title;
      $('.b-dlg-btns').innerHTML = btns.map((b, i) => `<button data-i="${i}">${esc(b.label)}</button>`).join('');
      $$('.b-dlg-btns button').forEach((b) => {
        b.addEventListener('mouseenter', () => setDlg(Number(b.dataset.i)));
        b.addEventListener('click', () => chooseDlg(Number(b.dataset.i)));
      });
      $('.b-dlg').hidden = false;
      setDlg(0);
      paintHint();
    }
    function setDlg(i) {
      if (!dlg) return;
      dlg.sel = (i + dlg.btns.length) % dlg.btns.length;
      $$('.b-dlg-btns button').forEach((b) => b.classList.toggle('sel', Number(b.dataset.i) === dlg.sel));
    }
    function chooseDlg(i) {
      const b = dlg && dlg.btns[i];
      closeDlg();
      if (b && b.run) b.run();
    }
    function closeDlg() {
      dlg = null;
      $('.b-dlg').hidden = true;
      paintHint();
    }
    function gameDlg(g) {
      const tp = trophiesOf(g);
      openDlg(
        `<b>${esc(g.name)}</b><small>${esc([U.hours(g.playtimeMin), g.lastPlayed ? `Jugado ${U.ago(g.lastPlayed)}` : '', tp && tp.total ? `${tp.done}/${tp.total} logros` : ''].filter(Boolean).join(' · ') || g.description || '')}</small>`,
        [
          { label: 'Abrir', run: () => startGame(g) },
          ...(g.type === 'steam' ? [{ label: 'Logros', run: async () => (await openApp('trophies'), app.open(g)) }] : []),
          { label: 'Cambiar imágenes', run: () => window.NostalHubGameEditor && window.NostalHubGameEditor.open(g.id) },
          { label: 'Cancelar' },
        ]
      );
    }
    function powerDlg() {
      openDlg('<b>¿Qué quieres hacer?</b>', [
        { label: 'Cambiar de consola', run: () => ctx.openSelector() },
        { label: 'Apagar NostalHub', run: () => call('runMenu', 'quit') },
        { label: 'Cancelar' },
      ]);
    }

    // ---------- Pistas (dentro de la pantalla táctil, abajo) ----------
    function paintHint() {
      // la 3DS no muestra pistas: se ven en la carcasa (los botones se iluminan)
      const it = items[sel];
      root.classList.toggle('can-opt', view === 'home' && !dlg && !!(it && it.game));
    }

    // =====================================================================
    // Abrir un juego: el icono crece, las pantallas se ponen blancas y "Jugando a…"
    // =====================================================================
    let playTimer = null;
    async function startGame(g) {
      if (!g || view === 'playing' || view === 'launching') return;
      const prev = view;
      view = 'launching';
      closeDlg();
      const res = await api.launch(g.id);
      if (!res || !res.ok) {
        view = prev;
        ctx.sound('error');
        return ctx.toast(`No se pudo abrir: ${(res && res.error) || 'error desconocido'}`);
      }
      ctx.sound('gameboot');
      root.classList.add('launching');
      await wait(900);
      showPlaying(g);
      root.classList.remove('launching');
    }
    function showPlaying(g) {
      view = 'playing';
      const p = $('.d-playing');
      p.hidden = false;
      root.classList.add('is-playing');
      document.body.classList.add('playing');
      // Arriba el banner del juego; abajo "Volver al menú"; Spotify y Discord a los lados de la consola
      const u = (g.heroIsReal && g.hero) || g.cover || g.hero || '';
      $('.t-app').hidden = false;
      $('.t-home').hidden = true;
      $('.t-app').innerHTML = `<div class="tp-ban"${u ? ` style="background-image:url('${esc(u)}')"` : ''}>${g.logo ? `<img src="${esc(g.logo)}" alt="" />` : ''}</div><div class="t-label tp-label"><b>${esc(g.name)}</b><small class="tp-time">0:00</small></div>`;
      $('.b-app').hidden = false;
      $('.b-home').hidden = true;
      $('.b-app').innerHTML = `<div class="bp"><div class="bp-ic">${squareHtml(g)}</div><div class="bp-t">Jugando a</div><div class="bp-n">${esc(g.name)}</div><button class="bp-btn">Volver al menú HOME</button></div>`;
      $('.b-app .bp-btn').addEventListener('click', () => {
        call('dismissPlaying');
        endPlaying('manual');
      });
      nowPlaying.start();
      const started = Date.now();
      const upd = () => {
        const s = Math.floor((Date.now() - started) / 1000);
        const hh = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const el = $('.tp-time');
        if (el) el.textContent = hh ? `${hh}:${pad2(m)}:${pad2(s % 60)}` : `${m}:${pad2(s % 60)}`;
      };
      upd();
      clearInterval(playTimer);
      playTimer = setInterval(upd, 1000);
    }
    async function endPlaying(reason) {
      if (view !== 'playing') return;
      nowPlaying.stop();
      clearInterval(playTimer);
      document.body.classList.remove('playing');
      root.classList.remove('is-playing');
      $('.d-playing').hidden = true;
      view = 'home';
      app = null;
      root.classList.remove('in-app');
      $('.t-app').hidden = true;
      $('.b-app').hidden = true;
      $('.t-home').hidden = false;
      $('.b-home').hidden = false;
      buildItems();
      renderGrid();
      if (reason === 'not-started') ctx.toast('No se detectó que el juego abriera');
    }
    // Spotify y Grupo a los costados de la consola mientras juegas
    const nowPlaying = U.nowPlaying($('.d-playing'), api, ctx.toast);

    // =====================================================================
    // Teclado y botones de la carcasa
    // =====================================================================
    function onKey(e) {
      const k = e.key;
      if (k === 'Enter' || k === ' ' || k.startsWith('Arrow')) e.preventDefault();
      handleKey(k);
    }
    function handleKey(k) {
      if (view === 'launching') return;
      if (view === 'playing') {
        if (k === 'Enter') $('.b-app .bp-btn') && $('.b-app .bp-btn').click();
        return;
      }
      if (k === 'Home') {
        if (dlg) closeDlg();
        if (view !== 'home') {
          app = null;
          closeApp();
        }
        return;
      }
      if (k === 'Power') return powerDlg();
      if (dlg) {
        if (k === 'ArrowDown' || k === 'ArrowRight') setDlg(dlg.sel + 1);
        else if (k === 'ArrowUp' || k === 'ArrowLeft') setDlg(dlg.sel - 1);
        else if (k === 'Enter' || k === ' ') chooseDlg(dlg.sel);
        else if (k === 'Escape' || k === 'Backspace') closeDlg();
        return;
      }
      if (view !== 'home') return app && appKey(k);
      if (k.startsWith('Arrow')) moveSel(k);
      else if (k === 'Enter' || k === ' ') openItem();
      else if (k === 'o' || k === 'O' || k === 'x' || k === 'X') {
        const it = items[sel];
        if (it && it.game) gameDlg(it.game);
      } else if (k === '+' || k === 'y' || k === 'Y') zoom(-1);
      else if (k === '-') zoom(1);
      else if (k === 'Escape' || k === 'Backspace') ctx.openSelector();
    }
    window.addEventListener('keydown', onKey);
    // Los botones dibujados de la consola hacen lo mismo que las teclas
    $$('.d-base [data-k]').forEach((b) =>
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const k = b.dataset.k;
        if (k.startsWith('Arrow') || k === 'Home') ctx.sound(k === 'Home' ? 'back' : 'move');
        if (k === 'Enter') ctx.sound('select');
        if (k === 'Escape') ctx.sound('back');
        if (k === 'y') return view === 'home' && zoom(-1);
        if (k === 'Select') return view === 'home' && zoom(1);
        handleKey(k);
      })
    );

    // =====================================================================
    // Datos
    // =====================================================================
    function setDiscord(s) {
      discord = s || discord;
      paintFriendsBadge();
      if (view === 'friends' || view === 'notes') paintApp();
    }
    function setSpotify(s) {
      spotify = s || spotify;
      if (view === 'music') paintApp();
      else if (view === 'home' && items[sel] && items[sel].app === 'music') (buildItems(), paintBanner());
    }
    function setGames(list) {
      games = list || [];
      if (view === 'home') {
        buildItems();
        renderGrid();
      } else if (view === 'activity' || view === 'trophies' || view === 'notes') paintApp();
    }
    offs.push(api.onGamesUpdated(setGames));
    offs.push(api.onGameEnded(({ reason }) => endPlaying(reason)));
    if (api.onSpotify) offs.push(api.onSpotify(setSpotify));
    if (api.onDiscord) offs.push(api.onDiscord(setDiscord));
    if (api.onSteamSummary) offs.push(api.onSteamSummary((s) => ((summary = s || summary), view === 'home' && paintBanner())));
    if (api.onSteamChanged)
      offs.push(
        api.onSteamChanged(async () => {
          profile = (await call('getSteamProfile')) || profile;
          summary = (await call('getAchievementSummary')) || summary;
        })
      );
    call('spotifyWatch', true).then((s) => s && setSpotify(s));
    call('discordWatch', true).then((s) => s && setDiscord(s));
    call('getMenu').then((m) => (menuModel = m || []));
    call('getSteamProfile').then((p) => p && (profile = p));
    call('getAchievementSummary').then((s) => s && ((summary = s), view === 'home' && (buildItems(), paintBanner())));
    buildItems();
    renderGrid();
    api.getState().then((s) => {
      games = s.games || [];
      buildItems();
      if (sel === 0 && games.length) sel = apps().length; // al entrar queda marcado el último juego que jugaste
      renderGrid();
    });
    // Encendido: las pantallas se prenden desde blanco
    root.classList.add('boot');
    setTimeout(() => root.classList.remove('boot'), 900);

    return {
      unmount() {
        feed.dispose();
        clearInterval(clockTimer);
        clearInterval(playTimer);
        nowPlaying.dispose();
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('mousemove', onMouse);
        offs.forEach((off) => off && off());
        call('spotifyWatch', false);
        call('discordWatch', false);
        document.body.classList.remove('playing');
        root.removeAttribute('data-t');
        root.removeAttribute('data-s');
        root.removeAttribute('data-rows');
        root.style.removeProperty('--px');
        root.style.removeProperty('--py');
        root.className = root.className.replace(/\b(in-app|is-playing|launching|boot|d3|can-opt)\b/g, '').trim();
        root.innerHTML = '';
      },
    };
  }
})();
