/* Tema Xbox One (menú de 2013): fondo oscuro, pestañas Pins / Inicio / Tienda, un mosaico grande con lo último que
   jugaste, tu perfil a la izquierda y mosaicos de color (se elige en Ajustes → Mi color). Se registra en
   window.Themes.xone. Sin logos de marcas: los íconos son dibujos propios. */
(() => {
  const P = (d) => `<path d="${d}"/>`;
  const I = {
    grid: '<rect x="7" y="7" width="15" height="15"/><rect x="26" y="7" width="15" height="15"/><rect x="7" y="26" width="15" height="15"/><rect x="26" y="26" width="15" height="15"/>',
    people: '<circle cx="18" cy="16" r="6"/>' + P('M6 39c0-8 5-12 12-12s12 4 12 12') + '<circle cx="33" cy="18" r="5"/>' + P('M31 27c7 0 11 4 11 11'),
    headset: P('M8 30v-6a16 16 0 0 1 32 0v6') + '<rect x="6" y="28" width="8" height="12" rx="3"/><rect x="34" y="28" width="8" height="12" rx="3"/>',
    trophy: P('M16 8h16v10a8 8 0 0 1-16 0Z') + P('M16 11H9v3a6 6 0 0 0 7 6M32 11h7v3a6 6 0 0 1-7 6') + P('M24 26v8M17 40h14'),
    disc: '<circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="5"/>',
    gear: '<circle cx="24" cy="24" r="6"/>' + P('M24 5v6M24 37v6M5 24h6M37 24h6M10.6 10.6l4.2 4.2M33.2 33.2l4.2 4.2M10.6 37.4l4.2-4.2M33.2 14.8l4.2-4.2'),
    power: P('M24 6v16') + P('M14 12a15 15 0 1 0 20 0'),
    swap: P('M8 17h30l-7-7M40 31H10l7 7'),
    bag: P('M9 16h30l-3 25H12Z') + P('M17 16v-3a7 7 0 0 1 14 0v3'),
    news: '<rect x="7" y="9" width="34" height="30"/>' + P('M13 17h22M13 24h22M13 31h12'),
    person: '<circle cx="24" cy="16" r="8"/>' + P('M8 42c0-10 7-15 16-15s16 5 16 15'),
    play: '<path d="M15 9l24 15-24 15Z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="12" y="9" width="8" height="30" fill="currentColor" stroke="none"/><rect x="28" y="9" width="8" height="30" fill="currentColor" stroke="none"/>',
    prev: '<path d="M38 9L18 24l20 15Z" fill="currentColor" stroke="none"/>' + P('M12 9v30'),
    next: '<path d="M10 9l20 15-20 15Z" fill="currentColor" stroke="none"/>' + P('M36 9v30'),
    chat: P('M7 10h34v22H22l-9 8v-8H7Z'),
    image: '<rect x="6" y="9" width="36" height="30"/>' + P('M6 33l11-11 8 8 6-6 11 11'),
    sort: P('M15 8v32M8 33l7 7 7-7M33 40V8M26 15l7-7 7 7'),
    check: P('M9 25l10 10 20-22'),
    palette: P('M24 6a18 18 0 1 0 0 36c4 0 3-5 6-7 3-2 12 1 12-9A18 18 0 0 0 24 6Z') + '<circle cx="15" cy="21" r="2.5"/><circle cx="24" cy="14" r="2.5"/><circle cx="33" cy="20" r="2.5"/>',
    info: '<circle cx="24" cy="24" r="17"/>' + P('M24 22v12M24 14v2'),
    screen: '<rect x="5" y="9" width="38" height="24"/>' + P('M17 41h14M24 33v8'),
    speaker: P('M8 19h8l10-8v26l-10-8H8Z') + P('M32 17a10 10 0 0 1 0 14'),
    folder: P('M5 12h14l4 5h20v22H5Z'),
    pad: '<rect x="6" y="15" width="36" height="20" rx="9"/>' + P('M15 22v8M11 26h8') + '<circle cx="32" cy="23" r="2"/><circle cx="36" cy="28" r="2"/>',
  };
  const icon = (n, cls = '') => `<svg class="xo-ic ${cls}" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter">${I[n] || I.info}</svg>`;

  const COLORS = [
    { value: 'green', label: 'Verde', c: '#107c10' },
    { value: 'blue', label: 'Azul', c: '#0f6cbd' },
    { value: 'teal', label: 'Turquesa', c: '#00838c' },
    { value: 'purple', label: 'Morado', c: '#744da9' },
    { value: 'pink', label: 'Rosa', c: '#bf0077' },
    { value: 'red', label: 'Rojo', c: '#c50f1f' },
    { value: 'orange', label: 'Naranja', c: '#ca5010' },
    { value: 'gray', label: 'Gris', c: '#4c5560' },
  ];
  const PAGES = [
    { id: 'pins', label: 'Pins' },
    { id: 'home', label: 'Inicio' },
    { id: 'store', label: 'Tienda' },
  ];
  const PAGE_X = { pins: 0, home: 1171, store: 2973 }; // dónde parte cada página dentro de la tira
  const U_ = 207; // lado de un mosaico
  const STEP = 221; // mosaico + separación
  const PIN_MAX = 15;
  const CAT_ICONS = { color: 'palette', general: 'gear', games: 'pad', emulators: 'pad', screen: 'screen', sound: 'speaker', accounts: 'person', files: 'folder' };
  const TYPES = { steam: 'Steam', exe: 'Programa', shortcut: 'Acceso directo', url: 'Otro launcher', minecraft: 'Launcher de Minecraft', emulator: 'Emulador', riot: 'Riot Games' };

  const MARKUP = `
<header class="xo-top">
  <div class="xo-strip"></div>
  <div class="xo-clock"></div>
</header>
<nav class="xo-tabs">${PAGES.map((p, i) => `<button class="xo-tab" data-page="${i}">${p.label}</button>`).join('')}</nav>
<section class="xo-home">
  <div class="xo-track">
    <div class="xo-page" data-page="pins"></div>
    <div class="xo-page" data-page="home"></div>
    <div class="xo-page" data-page="store"></div>
  </div>
</section>
<section class="xo-screen xo-lib" hidden><div class="xo-sh"><h2>Mis juegos y aplicaciones</h2><button class="xo-sortb" data-nav></button></div><div class="xo-lib-view"><div class="xo-lib-grid"></div></div></section>
<section class="xo-screen xo-game" hidden>
  <div class="xo-g-art"></div>
  <div class="xo-g-info"><h2 class="xo-g-name"></h2><div class="xo-g-meta"></div><div class="xo-g-prog" hidden><div class="xo-bar"><i></i></div><span></span></div><div class="xo-g-desc"></div>
    <div class="xo-g-btns"><button class="xo-btn acc" data-nav data-g="play">${icon('play')}<span>Iniciar</span></button><button class="xo-btn" data-nav data-g="ach">${icon('trophy')}<span>Logros</span></button><button class="xo-btn" data-nav data-g="img">${icon('image')}<span>Imágenes</span></button></div>
  </div>
</section>
<section class="xo-screen xo-ach" hidden><div class="xo-sh"><h2 class="xo-a-title"></h2><span class="xo-a-count"></span></div><div class="xo-bar xo-a-bar"><i></i></div><div class="xo-a-view"><div class="xo-a-list"></div></div><div class="xo-msg xo-a-msg" hidden></div></section>
<section class="xo-screen xo-fr" hidden><div class="xo-sh"><h2>Amigos</h2><span class="xo-f-count"></span></div><div class="xo-f-body"><div class="xo-f-view"><div class="xo-f-list"></div></div><div class="xo-f-card"></div></div><div class="xo-msg xo-f-msg" hidden></div></section>
<section class="xo-screen xo-party" hidden><div class="xo-sh"><h2>Grupo</h2><span class="xo-p-sub"></span></div><div class="xo-p-body"></div></section>
<section class="xo-screen xo-music" hidden><div class="xo-sh"><h2>Música</h2><span class="xo-m-app"></span></div><div class="xo-m-body"></div></section>
<section class="xo-screen xo-set" hidden><div class="xo-sh"><h2>Configuración</h2></div><div class="xo-s-body"><div class="xo-s-cats"></div><div class="xo-s-items"></div></div><div class="xo-s-desc"></div></section>
<div class="xo-hints"></div>
<div class="xo-pop" hidden><div class="xo-pop-box"><div class="xo-pop-title"></div><div class="xo-pop-list"></div></div></div>
<section class="xo-playing" hidden>
  <div class="xo-pl-art"></div>
  <div class="xo-pl-label">Jugando a</div>
  <div class="xo-pl-name"></div>
  <div class="xo-pl-time">0:00</div>
  ${window.NostalHubUtil.clockHtml('xo-pl-clock')}
  <button class="xo-btn acc" data-nav data-p="stop">Volver al menú</button>
</section>`;

  const U = window.NostalHubUtil;
  const esc = U.escapeHtml;
  const { wait, pad2 } = U;
  const store = {
    get: (k, d) => {
      try {
        return localStorage.getItem(`nostalhub.xone.${k}`) ?? d;
      } catch {
        return d;
      }
    },
    set: (k, v) => {
      try {
        localStorage.setItem(`nostalhub.xone.${k}`, v);
      } catch {}
    },
  };

  window.Themes = window.Themes || {};
  window.Themes.xone = { mount, synth };

  // ---------- Sonidos hechos con código (suenan si no hay archivos en AppData) ----------
  let ac = null;
  function synth(kind, vol = 0.6) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const t = ac.currentTime;
      const note = (f, at, d, type = 'sine', g = 0.25, f2) => {
        const o = ac.createOscillator();
        const a = ac.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f, t + at);
        if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + at + d);
        a.gain.setValueAtTime(0.0001, t + at);
        a.gain.exponentialRampToValueAtTime(g * vol, t + at + 0.012);
        a.gain.exponentialRampToValueAtTime(0.0001, t + at + d);
        o.connect(a).connect(ac.destination);
        o.start(t + at);
        o.stop(t + at + d + 0.02);
      };
      if (kind === 'move') note(880, 0, 0.06, 'triangle', 0.14);
      else if (kind === 'page') (note(520, 0, 0.1, 'sine', 0.18, 780), note(1040, 0.03, 0.09, 'sine', 0.08));
      else if (kind === 'select') (note(660, 0, 0.09, 'triangle', 0.2), note(990, 0.07, 0.14, 'triangle', 0.18));
      else if (kind === 'back') (note(700, 0, 0.08, 'triangle', 0.18), note(470, 0.06, 0.13, 'triangle', 0.16));
      else if (kind === 'start' || kind === 'gameboot') (note(392, 0, 0.5, 'sine', 0.2), note(587, 0.1, 0.5, 'sine', 0.18), note(784, 0.22, 0.7, 'sine', 0.16));
      else if (kind === 'error' || kind === 'border') note(180, 0, 0.12, 'square', 0.1);
      else if (kind === 'option') note(1200, 0, 0.05, 'sine', 0.14);
    } catch {}
  }

  // root: contenedor del tema. ctx: { api, stage, stageRect, toast, openSelector, sound, soundSettings, hasAsset }
  // El tema va separado por pantallas (una función cada una, más abajo). Todas reciben `xo`, que tiene lo que es de
  // todas (en qué pantalla se está y las anteriores, los juegos, el perfil, el resumen de logros, la música, Discord,
  // las opciones, qué está marcado) y las otras pantallas (xo.inicio, xo.ficha, xo.logros…).
  function mount(root, ctx) {
    root.innerHTML = MARKUP;
    const api = ctx.api;
    const $ = (sel, el = root) => el.querySelector(sel);
    const $$ = (sel, el = root) => [...el.querySelectorAll(sel)];
    const call = (fn, ...a) => (typeof api[fn] === 'function' ? api[fn](...a) : Promise.resolve(null));
    const xo = {
      root,
      ctx,
      api,
      $,
      $$,
      call,
      sound: (k) => ctx.sound && ctx.sound(k),
      feed: U.friendsFeed(api), // amigos de Steam
      order: U.gameOrder('xone', { def: 'recent' }), // orden de Pins y de Mis juegos
      view: 'home', // home | lib | game | ach | fr | party | music | set | playing
      stack: [], // pantallas anteriores, para volver
      games: [],
      profile: { name: 'Jugador', avatar: null },
      summary: { done: 0, total: 0, perGame: {}, hasKey: false },
      spotify: null,
      discord: { status: 'off', channel: null, members: [] },
      menuModel: [],
      focused: null, // lo que está marcado
    };
    const offs = [];

    // ---------- Color del menú (Ajustes → Mi color) ----------
    xo.color = store.get('color', 'green');
    xo.setColor = (v) => {
      xo.color = (COLORS.find((c) => c.value === v) || COLORS[0]).value;
      store.set('color', xo.color);
      root.style.setProperty('--xo-acc', COLORS.find((c) => c.value === xo.color).c);
    };
    xo.setColor(xo.color);

    // Cada vez que se dibuja algo, sus imágenes se ponen quietas
    const pics = new MutationObserver(() => stills(root));
    pics.observe(root, { childList: true, subtree: true });

    navegacion(xo);
    xo.jugando = pantallaJugando(xo);
    xo.inicio = pantallaInicio(xo);
    xo.biblioteca = pantallaBiblioteca(xo);
    xo.ficha = pantallaFicha(xo);
    xo.logros = pantallaLogros(xo);
    xo.amigos = pantallaAmigos(xo);
    xo.grupo = pantallaGrupo(xo);
    xo.musica = pantallaMusica(xo);
    xo.ajustes = pantallaAjustes(xo);
    xo.ventanita = ventanita(xo);

    // ---------- Reloj ----------
    function tick() {
      const d = new Date();
      $('.xo-clock').textContent = `${d.getHours()}:${pad2(d.getMinutes())}`;
    }
    tick();
    const clockTimer = setInterval(tick, 10000);

    // ---------- Teclado ----------
    function onKey(e) {
      const k = e.key;
      const dir = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[k];
      if (k === 'Enter' || k === ' ' || dir) e.preventDefault();
      if (xo.view === 'playing') return k === 'Enter' && $('[data-p="stop"]').click();
      if (xo.ventanita.isOpen()) return xo.ventanita.key(k, dir);
      if (k === 'Enter') return xo.focused && xo.focused.click();
      if ((k === 'o' || k === 'O' || k === '+') && (xo.view === 'home' || xo.view === 'lib')) return xo.inicio.options();
      if (xo.view === 'home') return xo.inicio.key(k, dir);
      if (k === 'Escape' || k === 'Backspace') return xo.sound('back'), xo.back();
      const scr = { set: xo.ajustes, fr: xo.amigos }[xo.view];
      if (scr && scr.key && scr.key(k, dir)) return;
      if (dir) xo.move(dir) ? xo.sound('move') : xo.sound('border');
    }
    window.addEventListener('keydown', onKey);

    // ---------- Datos ----------
    async function loadProfile() {
      xo.profile = (await call('getSteamProfile')) || xo.profile;
      xo.inicio.paintProfile();
    }
    let doneKey = ''; // juegos al 100 % (si cambia, se redibujan los mosaicos con su medalla)
    async function loadSummary(sum) {
      xo.summary = sum || (await call('getAchievementSummary')) || xo.summary;
      const k = U.completeKey(xo.summary);
      if (k !== doneKey || xo.order.mode === 'ach') {
        doneKey = k;
        setGames(xo.games);
      }
      xo.inicio.paintProfile();
      xo.ficha.refresh();
    }
    function setSpotify(data) {
      xo.spotify = data || xo.spotify;
      xo.inicio.paintMusic();
      if (xo.view === 'music') xo.musica.render();
    }
    xo.setDiscord = (data) => {
      xo.discord = data || xo.discord;
      xo.inicio.paintParty();
      if (xo.view === 'party') xo.grupo.render();
    };
    function setGames(list) {
      xo.games = list || [];
      xo.ficha.gamesChanged();
      xo.inicio.render();
      if (xo.view === 'lib') xo.biblioteca.render();
      xo.ficha.refresh();
    }
    offs.push(api.onGamesUpdated(setGames));
    offs.push(api.onGameEnded(({ reason }) => xo.jugando.end(reason)));
    if (api.onSpotify) offs.push(api.onSpotify(setSpotify));
    if (api.onDiscord) offs.push(api.onDiscord(xo.setDiscord));
    if (api.onSteamSummary) offs.push(api.onSteamSummary((sum) => loadSummary(sum)));
    if (api.onSteamChanged)
      offs.push(
        api.onSteamChanged(() => {
          loadProfile();
          loadSummary();
        })
      );
    xo.feed.onChange(() => {
      xo.inicio.paintFriends();
      if (xo.view === 'fr') xo.amigos.render();
    });
    xo.feed.load(); // para los amigos en línea de arriba y del perfil
    call('spotifyWatch', true).then((d) => d && setSpotify(d));
    call('discordWatch', true).then((d) => d && xo.setDiscord(d));
    call('getMenu').then((m) => (xo.menuModel = m || []));
    loadProfile();
    loadSummary();
    xo.inicio.render();
    xo.inicio.setPage(1, false);
    api.getState().then((st) => {
      setGames(st.games);
      root.classList.add('intro');
      setTimeout(() => root.classList.remove('intro'), 1100);
      xo.inicio.focusFirst();
    });

    return {
      unmount() {
        pics.disconnect();
        U.liveBackground(null, 'xone-mosaico');
        xo.jugando.dispose();
        xo.feed.dispose();
        clearInterval(clockTimer);
        window.removeEventListener('keydown', onKey);
        offs.forEach((off) => off && off());
        call('spotifyWatch', false);
        call('discordWatch', false);
        document.body.classList.remove('playing');
        root.classList.remove('in-screen', 'is-playing', 'intro');
        root.style.removeProperty('--xo-acc');
        root.innerHTML = '';
      },
    };
  }

  // Logros de un juego según el resumen ({ done, total }), o nada
  function trophiesOf(xo, g) {
    return (g && g.appId && xo.summary.perGame && xo.summary.perGame[g.appId]) || null;
  }
  // Las imágenes de los mosaicos van en data-pic: aquí se ponen quietas (si son animadas, su primer cuadro). Solo se
  // anima la del mosaico marcado (y el mosaico grande del inicio): varias animaciones a la vez daban tirones.
  function stills(root) {
    root.querySelectorAll('[data-pic]:not([data-pic-ok])').forEach((el) => {
      el.dataset.picOk = '1';
      U.stillBackground(el, el.dataset.pic);
    });
  }
  // Mosaico cuadrado de un juego: 1) tu imagen cuadrada  2) el fondo con el logo encima  3) la carátula  4) la portada
  function gameArt(xo, g, cls = '') {
    const url = (u) => `data-pic="${esc(u)}"`; // la pone stills(): si es animada, su primer cuadro
    const logo = g.logo ? `<img src="${esc(g.logo)}" alt="" draggable="false" />` : '';
    let inner;
    if (g.square) inner = `<span class="xo-art" ${url(g.square)}></span>`;
    else if (g.hero && g.heroIsReal && g.logo) inner = `<span class="xo-art" ${url(g.hero)}>${logo}</span>`;
    else if (g.cover) inner = `<span class="xo-art top" ${url(g.cover)}></span>`;
    else if (g.hero || (g.tile && !g.tileIsVideo)) inner = `<span class="xo-art" ${url(g.hero || g.tile)}>${logo || (g.heroIsReal ? `<b>${esc(g.name)}</b>` : '')}</span>`;
    else inner = `<span class="xo-art none"><b>${esc(g.name)}</b></span>`;
    return `<span class="xo-artbox ${cls}">${inner}${U.isComplete(trophiesOf(xo, g)) ? U.completeBadge('medal', 'on-icon') : ''}</span>`;
  }

  // ---------- Lo que usan todas: qué está marcado, moverse con las flechas, pistas, abrir una pantalla y volver ----------
  function navegacion(xo) {
    const { $, $$, root } = xo;
    const SCREEN = { lib: '.xo-lib', game: '.xo-game', ach: '.xo-ach', fr: '.xo-fr', party: '.xo-party', music: '.xo-music', set: '.xo-set' };
    function scope() {
      if (!$('.xo-pop').hidden) return $('.xo-pop');
      if (xo.view === 'playing') return $('.xo-playing');
      if (xo.view === 'home') return xo.inicio.pageEl();
      return $(SCREEN[xo.view]);
    }
    const visible = (el) => !el.hidden && el.getClientRects().length > 0;
    function setFocus(el, scroll = true) {
      if (xo.focused === el) return;
      if (xo.focused) xo.focused.classList.remove('focus');
      xo.focused = el || null;
      U.liveBackground(el ? el.querySelector('[data-pic]') : null, 'xone-mosaico'); // solo el marcado se anima (si te quedas)
      if (!el) return;
      el.classList.add('focus');
      if (scroll && el.closest('.xo-lib-view, .xo-a-view, .xo-f-view, .xo-s-cats, .xo-s-items, .xo-pop-list')) el.scrollIntoView({ block: 'nearest' });
      if (xo.onFocus) xo.onFocus(el);
      if (xo.view === 'home' && xo.inicio) xo.inicio.paintHints(); // la pista de la tecla O cambia según lo marcado
    }
    function firstIn(sc) {
      return (sc ? [...sc.querySelectorAll('[data-nav]')].filter(visible) : [])[0] || null;
    }
    // Va al elemento más cercano en esa dirección (dentro de la pantalla actual)
    function move(dir) {
      const sc = scope();
      if (!sc) return false;
      const els = [...sc.querySelectorAll('[data-nav]')].filter(visible);
      if (!xo.focused || !sc.contains(xo.focused)) return setFocus(els[0]), !!els[0];
      const a = xo.focused.getBoundingClientRect();
      const ax = a.left + a.width / 2;
      const ay = a.top + a.height / 2;
      let best = null;
      let bestScore = Infinity;
      for (const el of els) {
        if (el === xo.focused) continue;
        const b = el.getBoundingClientRect();
        // se mide desde el borde más cercano: así un mosaico grande no queda "más lejos" que uno chico
        const dx = Math.max(b.left - ax, 0, ax - b.right) * Math.sign(b.left + b.width / 2 - ax);
        const dy = Math.max(b.top - ay, 0, ay - b.bottom) * Math.sign(b.top + b.height / 2 - ay);
        const [main, cross] = dir === 'right' ? [dx, dy] : dir === 'left' ? [-dx, dy] : dir === 'down' ? [dy, dx] : [-dy, dx];
        if (main <= 4) continue;
        const score = main + Math.abs(cross) * 2.5;
        if (score < bestScore) (bestScore = score), (best = el);
      }
      if (best) setFocus(best);
      return !!best;
    }
    root.addEventListener('mouseover', (e) => {
      const el = e.target.closest('[data-nav]');
      const sc = scope();
      if (el && sc && sc.contains(el)) setFocus(el, false);
    });
    function hints(list) {
      $('.xo-hints').innerHTML = list.map(([k, t]) => `<span class="xo-hint"><span class="xo-key">${k}</span>${t}</span>`).join('');
    }
    function open(name) {
      if (xo.view !== name) xo.stack.push(xo.view);
      xo.view = name;
      xo.onFocus = null;
      root.classList.add('in-screen');
      $$('.xo-screen').forEach((x) => (x.hidden = true));
      const scr = $(SCREEN[name]);
      scr.hidden = false;
      scr.classList.remove('enter');
      scr.offsetWidth;
      scr.classList.add('enter');
      hints([['Enter', 'Elegir'], ['Esc', 'Atrás']]);
      setFocus(null);
    }
    function back() {
      const prev = xo.stack.pop() || 'home';
      xo.feed.watch(false);
      xo.onFocus = null;
      $$('.xo-screen').forEach((x) => (x.hidden = true));
      xo.view = prev;
      setFocus(null);
      if (prev === 'home') {
        root.classList.remove('in-screen');
        return xo.inicio.resume();
      }
      $(SCREEN[prev]).hidden = false;
      hints([['Enter', 'Elegir'], ['Esc', 'Atrás']]);
      if (prev === 'lib') xo.biblioteca.resume();
      else if (prev === 'game') xo.ficha.resume();
      else if (prev === 'ach') xo.logros.resume();
      else setFocus(firstIn(scope()));
    }
    Object.assign(xo, { scope, setFocus, firstIn, move, hints, open, back });
  }

  // ---------- Inicio: las pestañas Pins / Inicio / Tienda con sus mosaicos ----------
  function pantallaInicio(xo) {
    const { $, $$, ctx, root, call } = xo;
    let page = 1;
    const tile = (cls, x, y, w, h, inner, attrs = '') => `<button class="xo-tile ${cls}" data-nav ${attrs} style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${inner}</button>`;
    const label = (t, ic) => `${ic ? icon(ic) : ''}<span class="xo-tl">${esc(t)}</span>`;
    const recent = () => [...xo.games].sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0) || a.name.localeCompare(b.name, 'es'));
    const pins = () => xo.order.apply(xo.games, xo.summary).slice(0, PIN_MAX);
    const gameOf = (el) => el && el.dataset.gameId && xo.games.find((g) => g.id === el.dataset.gameId);

    function render() {
      const keep = xo.focused && xo.view === 'home' ? xo.focused.dataset.k : null;
      // Pins: tus juegos en el orden elegido
      const pg = pins();
      $('[data-page="pins"]').innerHTML =
        `<div class="xo-phead">${icon('sort')}<span>${esc(xo.order.label())}</span></div>` +
        (pg.length
          ? pg.map((g, i) => tile('game', (i % 5) * STEP, Math.floor(i / 5) * STEP, U_, U_, gameArt(xo, g), `data-game-id="${esc(g.id)}" data-k="p${i}" title="${esc(g.name)}"`)).join('')
          : '<div class="xo-empty">Todavía no hay juegos.</div>');
      // Inicio: perfil, lo último que jugaste, recientes y accesos
      const r = recent();
      const last = r[0];
      const hero = last && (last.hero || last.tile || last.cover);
      $('[data-page="home"]').innerHTML =
        tile('pic', 0, 0, U_, U_, '<span class="xo-pic"></span>', 'data-act="profile" data-k="pic"') +
        tile('acc me', 0, STEP, U_, U_ * 2 + 14, '<span class="xo-me"></span>', 'data-act="friends" data-k="me"') +
        (last
          ? tile('main game', STEP, 0, 870, U_ * 2 + 14, `<span class="xo-mainart"${hero ? ` style="background-image:url('${esc(hero)}')"` : ''}>${last.logo && last.heroIsReal ? `<img src="${esc(last.logo)}" alt="" draggable="false" />` : ''}</span><span class="xo-mainl">${esc(last.name)}</span>${U.isComplete(trophiesOf(xo, last)) ? U.completeBadge('medal', 'on-icon') : ''}`, `data-game-id="${esc(last.id)}" data-k="main"`)
          : tile('main acc', STEP, 0, 870, U_ * 2 + 14, label('Agrega tus juegos en Configuración', 'grid'), 'data-act="settings" data-k="main"')) +
        r.slice(1, 5).map((g, i) => tile('game', STEP * (i + 1), STEP * 2, U_, U_, gameArt(xo, g), `data-game-id="${esc(g.id)}" data-k="r${i}" title="${esc(g.name)}"`)).join('') +
        tile('acc', 1105, 0, U_, U_, label('Mis juegos', 'grid'), 'data-act="lib" data-k="lib"') +
        tile('acc music', 1105, STEP, U_, U_, '<span class="xo-mu"></span>', 'data-act="music" data-k="music"') +
        tile('acc party', 1105, STEP * 2, U_, U_, '<span class="xo-pa"></span>', 'data-act="party" data-k="party"') +
        `<div class="xo-colh" style="left:1348px">Más</div>` +
        tile('acc wide ach', 1348, 0, 374, U_, '<span class="xo-ac"></span>', 'data-act="ach" data-k="ach"') +
        tile('dark wide', 1348, STEP, 374, U_, label('Configuración', 'gear'), 'data-act="settings" data-k="set"') +
        tile('dark wide', 1348, STEP * 2, 374, U_, label('Energía', 'power'), 'data-act="power" data-k="power"');
      $('[data-page="store"]').innerHTML =
        tile('acc', 0, 0, 428, U_ * 2 + 14, label('Tienda', 'bag') + '<small>Se abre en Steam</small>', 'data-open="steam-store" data-k="s0"') +
        tile('dark wide', 0, STEP * 2, 428, U_, label('Novedades de tus amigos', 'news'), 'data-open="steam-activity" data-k="s1"') +
        tile('dark', 442, 0, U_, U_, label('Tu perfil', 'person'), 'data-open="steam-profile" data-k="s2"') +
        tile('dark', 442, STEP, U_, U_, label('Cambiar de consola', 'swap'), 'data-act="consoles" data-k="s3"');
      $$('.xo-page .xo-tile').forEach((b) => b.addEventListener('click', () => xo.view === 'home' && activate(b)));
      paintProfile();
      paintFriends();
      paintMusic();
      paintParty();
      if (xo.view === 'home') xo.setFocus((keep && $(`.xo-page [data-k="${keep}"]`)) || xo.firstIn(pageEl()));
    }
    function activate(b) {
      if (xo.focused !== b) return xo.setFocus(b);
      const g = gameOf(b);
      xo.sound('select');
      if (g) return xo.ficha.open(g);
      if (b.dataset.open) return call('open', b.dataset.open), ctx.toast('Se abrió en Steam');
      const a = b.dataset.act;
      if (a === 'lib') xo.biblioteca.open();
      else if (a === 'friends') xo.amigos.open();
      else if (a === 'party') xo.grupo.open();
      else if (a === 'music') xo.musica.open();
      else if (a === 'ach') xo.logros.openGames();
      else if (a === 'settings') xo.ajustes.open();
      else if (a === 'power') xo.ventanita.power();
      else if (a === 'consoles') ctx.openSelector();
      else if (a === 'profile') (call('open', xo.summary.hasKey ? 'steam-profile' : 'setup-steam'), xo.summary.hasKey && ctx.toast('Se abrió en Steam'));
    }
    function paintProfile() {
      const p = xo.profile;
      const pic = $('.xo-pic');
      if (!pic) return;
      pic.style.backgroundImage = p.avatar ? `url("${p.avatar}")` : '';
      pic.textContent = p.avatar ? '' : (p.name || '?').charAt(0).toUpperCase();
      paintFriends();
      $('.xo-ac').innerHTML = `${icon('trophy')}<span class="xo-tl">Logros</span><b>${xo.summary.hasKey ? `${xo.summary.done || 0} de ${xo.summary.total || 0}` : 'Conecta tu Steam'}</b>`;
    }
    function paintFriends() {
      const me = $('.xo-me');
      if (!me) return;
      const on = xo.feed.online || [];
      me.innerHTML = `<b>${esc(xo.profile.name || 'Jugador')}</b><span class="xo-me-l">${icon('trophy')}${xo.summary.hasKey ? xo.summary.done || 0 : '—'}</span><span class="xo-me-n">${xo.feed.data.status === 'ok' ? on.length : '—'}</span><span class="xo-tl">${on.length === 1 ? 'Amigo en línea' : 'Amigos en línea'}</span>`;
      // Arriba a la izquierda: las fotos de los amigos conectados
      $('.xo-strip').innerHTML = on
        .slice(0, 7)
        .map((f) => `<span class="xo-strip-p ${U.friendClass(f)}" title="${esc(f.name)}">${f.avatar ? `<img src="${esc(f.avatar)}" alt="" />` : esc((f.name || '?').trim().charAt(0).toUpperCase())}</span>`)
        .join('');
    }
    function paintMusic() {
      const el = $('.xo-mu');
      if (!el) return;
      const v = U.spotifyView(xo.spotify || {});
      el.innerHTML = `${v.on && v.cover ? `<span class="xo-mu-c" style="background-image:url('${esc(v.cover)}')"></span>` : icon('disc')}<span class="xo-tl">${esc(v.on && v.playing ? v.title : 'Música')}</span>`;
    }
    function paintParty() {
      const el = $('.xo-pa');
      if (!el) return;
      const n = xo.discord.status === 'ok' && xo.discord.channel ? xo.discord.members.length : 0;
      el.innerHTML = `${icon('headset')}${n ? `<b>${n}</b>` : ''}<span class="xo-tl">${n ? esc(xo.discord.channel.name) : 'Grupo'}</span>`;
    }
    const pageEl = () => $(`.xo-page[data-page="${PAGES[page].id}"]`);
    function setPage(p, animate = true) {
      const np = Math.max(0, Math.min(PAGES.length - 1, p));
      const changed = np !== page;
      page = np;
      const track = $('.xo-track');
      track.style.transition = animate ? '' : 'none';
      track.style.transform = `translateX(${121 - PAGE_X[PAGES[page].id]}px)`;
      $$('.xo-tab').forEach((b) => b.classList.toggle('on', Number(b.dataset.page) === page));
      $$('.xo-page').forEach((el) => el.classList.toggle('on', el === pageEl()));
      if (changed && animate) xo.sound('page');
      paintHints();
      return changed;
    }
    function paintHints() {
      const list = [['Enter', 'Elegir'], ['Q / E', 'Cambiar página'], ['O', gameOf(xo.focused) ? 'Opciones' : `Ordenar: ${xo.order.label()}`], ['Esc', 'Consolas']];
      xo.hints(list);
    }
    $$('.xo-tab').forEach((b) =>
      b.addEventListener('click', () => {
        if (xo.view !== 'home') return;
        setPage(Number(b.dataset.page));
        xo.setFocus(xo.firstIn(pageEl()));
      })
    );
    function turn(d, from) {
      if (!setPage(page + d)) return xo.sound('border');
      // entra por el lado desde el que vienes, a la misma altura
      const els = [...pageEl().querySelectorAll('[data-nav]')];
      const y = from ? from.getBoundingClientRect().top : 0;
      const edge = (el) => (d > 0 ? el.getBoundingClientRect().left : -el.getBoundingClientRect().right);
      els.sort((a, b) => edge(a) - edge(b) || Math.abs(a.getBoundingClientRect().top - y) - Math.abs(b.getBoundingClientRect().top - y));
      const minEdge = els[0] ? edge(els[0]) : 0;
      const col = els.filter((el) => Math.abs(edge(el) - minEdge) < 30);
      col.sort((a, b) => Math.abs(a.getBoundingClientRect().top - y) - Math.abs(b.getBoundingClientRect().top - y));
      xo.setFocus(col[0] || els[0] || null);
    }
    function key(k, dir) {
      if (k === 'q' || k === 'Q' || k === 'PageUp') return turn(-1);
      if (k === 'e' || k === 'E' || k === 'PageDown') return turn(1);
      if (k === 'Escape') return ctx.openSelector();
      if (!dir) return;
      const before = xo.focused;
      if (xo.move(dir)) xo.sound('move');
      else if (dir === 'left' || dir === 'right') turn(dir === 'right' ? 1 : -1, before);
      else xo.sound('border');
      paintHints();
    }
    // Tecla O: opciones del juego marcado, o cambiar el orden
    function sortMenu() {
      xo.ventanita.open('Ordenar', xo.order.sorts.map((s) => ({ label: s.label, on: s.id === xo.order.mode, run: () => (xo.order.set(s.id), render(), xo.view === 'lib' && xo.biblioteca.render(), paintHints()) })));
    }
    function options() {
      const g = gameOf(xo.focused);
      if (!g) return sortMenu();
      xo.sound('option');
      xo.ventanita.open(g.name, [
        { icon: 'play', label: 'Iniciar', run: () => xo.jugando.start(g) },
        { icon: 'info', label: 'Ver la ficha', run: () => xo.ficha.open(g) },
        ...(g.hasAch ? [{ icon: 'trophy', label: 'Logros', run: () => xo.logros.open(g) }] : []),
        { icon: 'image', label: 'Cambiar imágenes y descripción', run: () => window.NostalHubGameEditor && window.NostalHubGameEditor.open(g.id) },
        { icon: 'sort', label: `Ordenar: ${xo.order.label()}`, run: () => sortMenu() },
      ]);
    }
    // Rueda: pasar de página
    let wheelLock = 0;
    $('.xo-home').addEventListener('wheel', (e) => {
      if (xo.view !== 'home' || Date.now() < wheelLock) return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) < 10) return;
      turn(d > 0 ? 1 : -1);
      wheelLock = Date.now() + 350;
    });
    return {
      key,
      options,
      render,
      setPage,
      pageEl,
      paintHints,
      paintProfile,
      paintFriends,
      paintMusic,
      paintParty,
      focusFirst: () => xo.view === 'home' && xo.setFocus($('.xo-page [data-k="main"]') || xo.firstIn(pageEl())),
      resume() {
        paintHints();
        xo.setFocus(xo.firstIn(pageEl()));
      },
    };
  }

  // ---------- Mis juegos y aplicaciones: todos los juegos en una cuadrícula ----------
  function pantallaBiblioteca(xo) {
    const { $, $$ } = xo;
    let lastId = null;
    function render() {
      const list = xo.order.apply(xo.games, xo.summary);
      $('.xo-sortb').innerHTML = `${icon('sort')}<span>${esc(xo.order.label())}</span>`;
      $('.xo-lib-grid').innerHTML = list.length
        ? list.map((g) => `<button class="xo-cell" data-nav data-game-id="${esc(g.id)}">${gameArt(xo, g)}<span class="xo-cell-n">${esc(g.name)}</span></button>`).join('')
        : '<div class="xo-empty">Todavía no hay juegos.</div>';
      $$('.xo-cell').forEach((c) =>
        c.addEventListener('click', () => {
          if (xo.focused !== c) return xo.setFocus(c);
          lastId = c.dataset.gameId;
          xo.sound('select');
          xo.ficha.open(xo.games.find((g) => g.id === lastId));
        })
      );
      xo.setFocus((lastId && $(`.xo-cell[data-game-id="${CSS.escape(lastId)}"]`)) || $('.xo-cell') || $('.xo-sortb'));
    }
    $('.xo-sortb').addEventListener('click', () => (xo.order.next(), xo.inicio.render(), render(), xo.setFocus($('.xo-sortb'))));
    return {
      render,
      open() {
        lastId = null;
        xo.open('lib');
        xo.hints([['Enter', 'Ver'], ['O', 'Opciones'], ['Esc', 'Atrás']]);
        $('.xo-lib-view').scrollTop = 0;
        render();
      },
      resume: () => (xo.hints([['Enter', 'Ver'], ['O', 'Opciones'], ['Esc', 'Atrás']]), render()),
    };
  }

  // ---------- Ficha del juego ----------
  function pantallaFicha(xo) {
    const { $, $$ } = xo;
    let current = null;
    function paint() {
      const g = current;
      const tp = trophiesOf(xo, g);
      $('.xo-g-art').innerHTML = gameArt(xo, g, 'big');
      $('.xo-g-name').textContent = g.name;
      $('.xo-g-meta').textContent = [TYPES[g.type] || '', U.hours(g.playtimeMin), g.lastPlayed ? `Jugado ${U.ago(g.lastPlayed)}` : 'Todavía no lo juegas'].filter(Boolean).join('   ·   ');
      $('.xo-g-desc').textContent = g.description || '';
      const prog = $('.xo-g-prog');
      prog.hidden = !(tp && tp.total);
      if (tp && tp.total) {
        const done = U.isComplete(tp);
        prog.classList.toggle('done', done);
        $('.xo-g-prog i').style.width = `${(tp.done / tp.total) * 100}%`;
        $('.xo-g-prog span').innerHTML = done ? `<span class="nh-done-text">${U.completeBadge('medal')} Completado · ${tp.done} de ${tp.total} logros</span>` : `${tp.done} de ${tp.total} logros`;
      }
      $('[data-g="ach"]').hidden = !g.hasAch;
    }
    $$('.xo-g-btns .xo-btn').forEach((b) =>
      b.addEventListener('click', () => {
        if (xo.view !== 'game' || !current) return;
        xo.sound('select');
        if (b.dataset.g === 'play') xo.jugando.start(current);
        else if (b.dataset.g === 'ach') xo.logros.open(current);
        else if (window.NostalHubGameEditor) window.NostalHubGameEditor.open(current.id);
      })
    );
    return {
      open(g) {
        if (!g) return;
        current = g;
        xo.open('game');
        $('.xo-game').dataset.gameCurrent = g.id; // clic derecho / tecla I → imágenes de este juego
        paint();
        xo.setFocus($('[data-g="play"]'));
      },
      resume: () => xo.setFocus($('[data-g="play"]')),
      // Horas y logros al día (después de jugar o cuando llega un resumen nuevo)
      refresh() {
        if (current && (xo.view === 'game' || xo.stack.includes('game'))) paint();
      },
      gamesChanged() {
        if (current) current = xo.games.find((g) => g.id === current.id) || current;
      },
    };
  }

  // ---------- Logros: tus juegos con logros, o la lista de logros de un juego ----------
  function pantallaLogros(xo) {
    const { $, $$, call } = xo;
    let token = 0;
    let game = null;
    function head(title, done, total) {
      $('.xo-a-title').textContent = title;
      const all = total > 0 && done >= total;
      $('.xo-a-count').innerHTML = total ? (all ? `<span class="nh-done-text">${U.completeBadge('medal')} ${done} de ${total}</span>` : `${done} de ${total}`) : '';
      $('.xo-a-bar i').style.width = `${total ? (done / total) * 100 : 0}%`;
      $('.xo-a-bar').classList.toggle('done', all);
    }
    function message(html) {
      $('.xo-a-list').innerHTML = '';
      $('.xo-a-msg').hidden = !html;
      $('.xo-a-msg').innerHTML = html || '';
    }
    function paintGames() {
      game = null;
      head('Logros', xo.summary.done || 0, xo.summary.total || 0);
      if (!xo.summary.hasKey) return message(U.achievementMessage({ status: 'no-key' }));
      const rows = xo.games.filter((g) => trophiesOf(xo, g) && trophiesOf(xo, g).total).sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
      if (!rows.length) return message('Todavía no hay datos de logros. Se cargan solos en unos minutos.');
      message('');
      $('.xo-a-list').innerHTML = rows
        .map((g) => {
          const tp = trophiesOf(xo, g);
          const done = U.isComplete(tp);
          return `<button class="xo-row ag" data-nav data-game-id="${esc(g.id)}">${gameArt(xo, g, 'mini')}<span class="xo-row-t"><b>${esc(g.name)}</b><span class="xo-bar${done ? ' done' : ''}"><i style="width:${(tp.done / tp.total) * 100}%"></i></span></span><span class="xo-row-v${done ? ' nh-done-text' : ''}">${done ? `${U.completeBadge('medal')} ` : ''}${tp.done} de ${tp.total}</span></button>`;
        })
        .join('');
      $$('.xo-a-list .xo-row').forEach((r) =>
        r.addEventListener('click', () => {
          if (xo.focused !== r) return xo.setFocus(r);
          xo.sound('select');
          xo.stack.push('ach'); // para volver a la lista de juegos
          showGame(xo.games.find((g) => g.id === r.dataset.gameId));
        })
      );
      $('.xo-a-view').scrollTop = 0;
      xo.setFocus($('.xo-a-list .xo-row'));
    }
    async function showGame(g) {
      game = g;
      head(g.name, 0, 0);
      message('<div class="xo-spin"></div>Cargando logros…');
      const t = ++token;
      const res = (await call('getAchievements', g.appId)) || { status: 'error' };
      if (t !== token || xo.view !== 'ach' || game !== g) return;
      if (res.status !== 'ok') return message(U.achievementMessage(res));
      message('');
      head(g.name, res.done, res.total);
      $('.xo-a-list').innerHTML = U.withSetHeads(U.sortAchievements(res.list))
        .map((a) => {
          if (a.sep) return `<div class="xo-row sep"><span class="xo-row-t"><b>${esc(a.name)}</b></span><span class="xo-row-v">${a.done} / ${a.total}</span></div>`;
          const tx = U.achievementTexts(a);
          return `<button class="xo-row ach${a.done ? '' : ' locked'}" data-nav><span class="xo-row-ic" style="background-image:url('${esc(a.done ? a.icon : a.iconGray || a.icon)}')"></span><span class="xo-row-t"><b>${esc(tx.name)}</b><small>${esc(tx.description)}</small></span><span class="xo-row-v">${a.done ? esc(tx.date) : 'Bloqueado'}${tx.percent ? `<small>${esc(tx.percent)}</small>` : ''}</span></button>`;
        })
        .join('');
      $('.xo-a-view').scrollTop = 0;
      xo.setFocus($('.xo-a-list .xo-row.ach'));
    }
    return {
      open(g) {
        xo.open('ach');
        showGame(g);
      },
      openGames() {
        xo.open('ach');
        paintGames();
      },
      // al volver de la lista de un juego a la de juegos
      resume: () => paintGames(),
    };
  }

  // ---------- Amigos (de Steam): la lista a la izquierda y la tarjeta del marcado a la derecha ----------
  function pantallaAmigos(xo) {
    const { $, $$, call, ctx } = xo;
    let cur = null;
    const pic = (f, cls = '') => `<span class="xo-fpic ${cls} ${U.friendClass(f)}">${f.avatar ? `<img src="${esc(f.avatar)}" alt="" />` : `<b>${esc((f.name || '?').trim().charAt(0).toUpperCase())}</b>`}<i></i></span>`;
    function card(f) {
      cur = f;
      $('.xo-f-card').innerHTML = f
        ? `${pic(f, 'big')}<div class="xo-f-n">${esc(f.name)}</div><div class="xo-f-s ${U.friendClass(f)}">${esc(U.friendStatus(f))}</div>
          <button class="xo-btn acc" data-nav data-fb="profile">${icon('person')}<span>Ver perfil</span></button><button class="xo-btn" data-nav data-fb="chat">${icon('chat')}<span>Enviar mensaje</span></button>`
        : '';
      $$('.xo-f-card [data-fb]').forEach((b) =>
        b.addEventListener('click', () => {
          xo.sound('select');
          if (b.dataset.fb === 'chat') (xo.feed.chat(cur), ctx.toast(`Se abrió el chat con ${cur.name} en Steam`));
          else (xo.feed.profile(cur), ctx.toast(`Se abrió el perfil de ${cur.name} en Steam`));
        })
      );
    }
    function render() {
      const d = xo.feed.data;
      const rows = xo.feed.list;
      $('.xo-f-count').textContent = d.status === 'ok' ? `${xo.feed.online.length} en línea · ${rows.length} ${rows.length === 1 ? 'amigo' : 'amigos'}` : '';
      const msg = $('.xo-f-msg');
      if (d.status !== 'ok' || !rows.length) {
        const m = U.friendsMessage(d.status);
        $('.xo-f-list').innerHTML = '';
        card(null);
        msg.hidden = false;
        msg.innerHTML = `<b>${esc(m.t)}</b>${esc(m.d)}${m.btn ? `<button class="xo-btn acc" data-nav data-open="${m.btn[0]}">${m.btn[1]}</button>` : ''}`;
        const b = msg.querySelector('[data-open]');
        if (b) b.addEventListener('click', () => call('open', b.dataset.open));
        return xo.setFocus(b || null);
      }
      msg.hidden = true;
      const keepId = cur && cur.id;
      const onBtn = xo.focused && xo.focused.dataset.fb;
      $('.xo-f-list').innerHTML = U.friendsGrouped(rows)
        .map((g) => `<div class="xo-f-head">${g.title}</div>` + g.items.map(([f, i]) => `<button class="xo-row fr ${U.friendClass(f)}" data-nav data-i="${i}">${pic(f)}<span class="xo-row-t"><b>${esc(f.name)}</b><small>${esc(U.friendStatus(f))}</small></span></button>`).join(''))
        .join('');
      $$('.xo-f-list .xo-row').forEach((r) => r.addEventListener('click', () => (xo.setFocus(r), xo.move('right'))));
      const j = keepId ? rows.findIndex((f) => f.id === keepId) : -1;
      const row = $(`.xo-f-list .xo-row[data-i="${Math.max(0, j)}"]`);
      card(rows[Math.max(0, j)]);
      xo.setFocus(onBtn ? $(`.xo-f-card [data-fb="${onBtn}"]`) : row, j < 0);
    }
    return {
      render,
      // ← desde los botones de la tarjeta vuelve al amigo marcado (no al que quede a esa altura)
      key(k, dir) {
        if (dir !== 'left' || !xo.focused || !xo.focused.dataset.fb || !cur) return false;
        xo.setFocus($(`.xo-f-list .xo-row[data-i="${xo.feed.list.indexOf(cur)}"]`));
        return xo.sound('move'), true;
      },
      open() {
        cur = null;
        xo.open('fr');
        xo.hints([['↑ ↓', 'Amigo'], ['→', 'Perfil / Mensaje'], ['Esc', 'Atrás']]);
        xo.onFocus = (el) => el.classList.contains('fr') && card(xo.feed.list[Number(el.dataset.i)]);
        $('.xo-f-view').scrollTop = 0;
        render();
        xo.feed.watch(true);
      },
    };
  }

  // ---------- Grupo: tu canal de voz de Discord ----------
  function pantallaGrupo(xo) {
    const { $, $$, call } = xo;
    function render() {
      const d = xo.discord;
      const keep = xo.focused && xo.focused.dataset.pb;
      const st = {
        'no-config': ['Conecta tu Discord', 'Para ver tu canal de voz y quiénes están contigo. Se hace aquí mismo y toma unos 2 minutos.', [['setup-discord', 'Conectar Discord']]],
        'no-discord': ['Discord no está abierto', 'Abre la app de escritorio de Discord. NostalHub se conecta sola cuando la detecte.', [['discord-app', 'Abrir Discord']]],
        'need-auth': ['Falta un permiso', 'Discord te va a mostrar una ventana para que aceptes. Solo se pide una vez.', [['auth', 'Conectar con Discord']]],
        authorizing: ['Acepta en Discord', 'Revisa la ventana que apareció en Discord y presiona Autorizar.', []],
        error: ['No se pudo conectar', d.message || 'Revisa los datos de tu aplicación de Discord.', [['auth', 'Intentar de nuevo'], ['setup-discord', 'Conectar Discord']]],
        off: ['Conectando con Discord…', '', []],
        connecting: ['Conectando con Discord…', '', []],
      }[d.status];
      const body = $('.xo-p-body');
      $('.xo-p-sub').textContent = d.status === 'ok' && d.channel ? `${d.channel.guild || 'Mensaje directo'} · ${d.members.length} ${d.members.length === 1 ? 'persona' : 'personas'}` : '';
      if (st) body.innerHTML = `<div class="xo-msg in"><b>${esc(st[0])}</b>${esc(st[1])}<div class="xo-btnrow">${st[2].map(([id, l]) => `<button class="xo-btn acc" data-nav data-pb="${id}">${l}</button>`).join('')}</div></div>`;
      else if (!d.channel) body.innerHTML = '<div class="xo-msg in"><b>No estás en un canal de voz</b>Cuando entres a uno en Discord, aquí vas a ver quiénes están contigo.</div>';
      else
        body.innerHTML = `<div class="xo-p-chan">${icon('headset')}<b>${esc(d.channel.name)}</b></div><div class="xo-p-list">${d.members
          .map((m) => `<div class="xo-p-m${m.speaking ? ' talking' : ''}"><span class="xo-p-av" style="background-image:url('${esc(m.avatar)}')"></span><b>${esc(m.name)}</b><small>${m.deafened ? 'Sin audio' : m.muted ? 'Silenciado' : m.speaking ? 'Hablando' : ''}</small></div>`)
          .join('')}</div><div class="xo-btnrow"><button class="xo-btn" data-nav data-pb="discord-app">Abrir Discord</button></div>`;
      $$('[data-pb]', body).forEach((b) => b.addEventListener('click', () => (b.dataset.pb === 'auth' ? call('discordAuthorize').then((x) => x && xo.setDiscord(x)) : call('open', b.dataset.pb))));
      xo.setFocus((keep && $(`[data-pb="${keep}"]`, body)) || xo.firstIn(body));
    }
    return {
      render,
      open() {
        xo.open('party');
        render();
      },
    };
  }

  // ---------- Música: la canción que suena en Spotify o la app elegida ----------
  function pantallaMusica(xo) {
    const { $, $$, api, call, ctx } = xo;
    function render() {
      const v = U.spotifyView(xo.spotify || {});
      const keep = xo.focused && xo.focused.dataset.m;
      const acts = U.musicActions(v);
      $('.xo-m-app').textContent = v.app;
      $('.xo-m-body').innerHTML = `
        <div class="xo-m-cover"${v.cover ? ` style="background-image:url('${esc(v.cover)}')"` : ''}>${v.cover ? '' : icon('disc')}</div>
        <div class="xo-m-info">
          <div class="xo-m-st">${v.on ? `${v.playing ? 'Reproduciendo' : 'En pausa'}${v.device && v.deviceType !== 'Computer' ? ` · en ${esc(v.device)}` : ''}` : esc(v.app)}</div>
          <div class="xo-m-t">${esc(v.title)}</div>
          <div class="xo-m-a">${esc(v.artist)}</div>
          ${U.progressHtml(v, 'xo-m-prog')}
          <div class="xo-btnrow">${v.on ? `<button class="xo-rnd" data-nav data-m="prev">${icon('prev')}</button><button class="xo-rnd big" data-nav data-m="toggle">${icon(v.playing ? 'pause' : 'play')}</button><button class="xo-rnd" data-nav data-m="next">${icon('next')}</button>` : ''}${v.appId !== 'auto' ? `<button class="xo-btn" data-nav data-m="open">Abrir ${esc(v.app)}</button>` : ''}${v.appId === 'spotify' && !v.api ? '<button class="xo-btn" data-nav data-m="connect">Conectar Spotify</button>' : ''}</div>
          ${acts.length ? `<div class="xo-btnrow">${acts.map((a) => `<button class="xo-rnd sm${a.on ? ' on' : ''}" data-nav data-m="x:${a.id}" data-label="${esc(a.label)}${a.value && a.id !== 'like' ? `: ${esc(a.value)}` : ''}">${U.npIcon(a.icon)}</button>`).join('')}</div>` : ''}
          <div class="xo-m-hint"></div>
          ${v.next ? `<div class="xo-m-next"><small>Siguiente</small>${esc(U.nextText(v))}</div>` : ''}
        </div>`;
      $$('.xo-m-body [data-m]').forEach((b) =>
        b.addEventListener('click', () => {
          const m = b.dataset.m;
          if (m.startsWith('x:')) return U.musicRun(api, m.slice(2), v, ctx.toast);
          if (m === 'connect') return call('open', 'setup-spotify');
          call('spotifyControl', m);
          if (m === 'toggle' && xo.spotify && xo.spotify.running) (xo.spotify = { ...xo.spotify, playing: !xo.spotify.playing }), render();
        })
      );
      xo.setFocus((keep && $(`.xo-m-body [data-m="${keep}"]`)) || $('.xo-m-body [data-m="toggle"]') || xo.firstIn($('.xo-m-body')));
    }
    return {
      render,
      open() {
        xo.open('music');
        xo.onFocus = (el) => {
          const h = $('.xo-m-hint');
          if (h) h.textContent = el.dataset.label || '';
        };
        render();
      },
    };
  }

  // ---------- Configuración: categorías a la izquierda (con "Mi color", solo de esta consola) y sus opciones a la derecha ----------
  function pantallaAjustes(xo) {
    const { $, $$, call, ctx } = xo;
    let cat = 0;
    const cats = () => [
      { id: 'color', title: 'Mi color', items: [{ id: 'xo-color', type: 'choice', label: 'Mi color', desc: 'El color de los mosaicos y botones. Solo cambia esta consola.', options: COLORS, value: xo.color }] },
      ...xo.menuModel,
    ];
    function render(focusItem) {
      const list = cats();
      cat = Math.min(cat, list.length - 1);
      $('.xo-s-cats').innerHTML = list.map((c, i) => `<button class="xo-row cat${i === cat ? ' on' : ''}" data-nav data-c="${i}">${icon(CAT_ICONS[c.id] || 'gear')}<span class="xo-row-t"><b>${esc(c.short || c.title)}</b></span></button>`).join('');
      $('.xo-s-items').innerHTML = list[cat].items
        .map((it, i) => {
          const val = it.type === 'toggle' ? `<span class="xo-tg${it.value ? ' on' : ''}"><i></i></span>` : it.type === 'choice' ? `<span class="xo-row-v">${esc(it.id === 'xo-color' ? (COLORS.find((c) => c.value === xo.color) || COLORS[0]).label : U.optionValueText(it))}</span>` : '';
          return `<button class="xo-row it" data-nav data-i="${i}"><span class="xo-row-t"><b>${esc(it.label)}</b></span>${val}</button>`;
        })
        .join('');
      $$('.xo-s-cats .xo-row').forEach((b) => b.addEventListener('click', () => (xo.setFocus(b), xo.move('right'))));
      $$('.xo-s-items .xo-row').forEach((b) => b.addEventListener('click', () => (xo.setFocus(b), pick(list[cat].items[Number(b.dataset.i)], Number(b.dataset.i)))));
      xo.setFocus(focusItem != null ? $(`.xo-s-items [data-i="${focusItem}"]`) : $(`.xo-s-cats [data-c="${cat}"]`));
    }
    async function pick(it, i) {
      if (!it) return;
      xo.sound('select');
      if (it.id === 'xo-color') return xo.ventanita.open('Mi color', COLORS.map((c) => ({ label: c.label, color: c.c, on: c.value === xo.color, run: () => (xo.setColor(c.value), render(i)) })));
      if (it.id === 'consoles') return ctx.openSelector();
      if (it.confirm) return xo.ventanita.power();
      if (it.type === 'choice') return xo.ventanita.open(it.label, it.options.map((o) => ({ label: o.label, on: String(o.value) === String(it.value), run: () => run(it, o.value, i) })));
      if (/^open-|^devtools$/.test(it.id)) ctx.toast('Se abrió en Windows');
      await run(it, it.type === 'toggle' ? !it.value : undefined, i);
    }
    async function run(it, value, i) {
      const next = await call('runMenu', it.id, value);
      if (next) xo.menuModel = next;
      if (xo.view === 'set') render(i);
    }
    return {
      // ← desde una opción vuelve a su categoría (no a la que quede a esa altura)
      key(k, dir) {
        if (dir !== 'left' || !xo.focused || !xo.focused.classList.contains('it')) return false;
        xo.setFocus($(`.xo-s-cats [data-c="${cat}"]`));
        return xo.sound('move'), true;
      },
      async open() {
        xo.menuModel = (await call('getMenu')) || xo.menuModel;
        cat = 0;
        xo.open('set');
        xo.hints([['Enter', 'Elegir'], ['← →', 'Categorías / Opciones'], ['Esc', 'Atrás']]);
        xo.onFocus = (el) => {
          const list = cats();
          if (el.classList.contains('cat') && Number(el.dataset.c) !== cat) {
            cat = Number(el.dataset.c);
            render();
          }
          const it = el.classList.contains('it') ? list[cat].items[Number(el.dataset.i)] : null;
          $('.xo-s-desc').textContent = it ? it.desc || '' : '';
        };
        render();
      },
    };
  }

  // ---------- Ventanita: opciones del juego, energía y listas para elegir ----------
  function ventanita(xo) {
    const { $, $$, ctx, call } = xo;
    let pop = null;
    let before = null;
    function open(title, items) {
      before = pop ? before : xo.focused;
      pop = { items };
      $('.xo-pop-title').textContent = title;
      $('.xo-pop-list').innerHTML = items
        .map((it, i) => `<button class="xo-pop-it${it.on ? ' on' : ''}" data-nav data-i="${i}">${it.color ? `<i class="xo-sw" style="background:${it.color}"></i>` : it.icon ? icon(it.icon) : `<i class="xo-radio${it.on ? ' on' : ''}"></i>`}<span>${esc(it.label)}</span></button>`)
        .join('');
      $$('.xo-pop-it').forEach((b) => b.addEventListener('click', () => choose(Number(b.dataset.i))));
      $('.xo-pop').hidden = false;
      xo.setFocus($('.xo-pop-it.on') || $('.xo-pop-it'));
    }
    function close() {
      if (!pop) return;
      pop = null;
      $('.xo-pop').hidden = true;
      xo.setFocus(before && before.isConnected ? before : xo.firstIn(xo.scope()));
    }
    function choose(i) {
      const it = pop && pop.items[i];
      close();
      if (it && it.run) (xo.sound('select'), it.run());
    }
    $('.xo-pop').addEventListener('pointerdown', (e) => e.target === e.currentTarget && close());
    return {
      open,
      close,
      isOpen: () => !!pop,
      key(k, dir) {
        if (k === 'Enter') return xo.focused && xo.focused.click();
        if (k === 'Escape' || k === 'Backspace' || k === 'o' || k === 'O') return xo.sound('back'), close();
        if (dir === 'up' || dir === 'down') xo.move(dir) && xo.sound('move');
      },
      power() {
        open('Energía', [
          { icon: 'swap', label: 'Cambiar de consola', run: () => ctx.openSelector() },
          { icon: 'gear', label: 'Reiniciar NostalHub', run: () => call('runMenu', 'reload') },
          { icon: 'power', label: 'Apagar NostalHub', run: () => call('runMenu', 'quit') },
        ]);
      },
    };
  }

  // ---------- Iniciar y "Jugando a…" ----------
  function pantallaJugando(xo) {
    const { $, api, ctx, root, call } = xo;
    const nowPlaying = U.nowPlaying($('.xo-playing'), api, ctx.toast);
    let playTimer = null;
    let prev = 'home';
    async function start(g) {
      if (!g || xo.view === 'playing') return;
      const res = await api.launch(g.id);
      if (!res || !res.ok) {
        xo.sound('error');
        return ctx.toast(`No se pudo abrir: ${(res && res.error) || 'error desconocido'}`);
      }
      xo.sound('gameboot');
      xo.ventanita.close();
      prev = xo.view;
      xo.view = 'playing';
      $('.xo-pl-art').innerHTML = gameArt(xo, g, 'big');
      $('.xo-pl-name').textContent = g.name;
      const p = $('.xo-playing');
      p.hidden = false;
      p.classList.remove('leave');
      document.body.classList.add('playing');
      root.classList.add('is-playing');
      nowPlaying.start(); // Spotify y Grupo a los lados
      xo.setFocus($('[data-p="stop"]'));
      const started = Date.now();
      const upd = () => {
        const t = Math.floor((Date.now() - started) / 1000);
        const h = Math.floor(t / 3600);
        const m = Math.floor((t % 3600) / 60);
        $('.xo-pl-time').textContent = h ? `${h}:${pad2(m)}:${pad2(t % 60)}` : `${m}:${pad2(t % 60)}`;
      };
      upd();
      clearInterval(playTimer);
      playTimer = setInterval(upd, 1000);
    }
    async function end(reason) {
      if (xo.view !== 'playing') return;
      nowPlaying.stop();
      clearInterval(playTimer);
      document.body.classList.remove('playing');
      root.classList.remove('is-playing');
      const p = $('.xo-playing');
      p.classList.add('leave');
      await wait(350);
      p.hidden = true;
      xo.view = prev;
      xo.setFocus(null);
      if (prev === 'home') xo.inicio.resume();
      else if (prev === 'game') xo.ficha.resume();
      else xo.setFocus(xo.firstIn(xo.scope()));
      if (reason === 'not-started') ctx.toast('No se detectó que el juego abriera');
    }
    $('[data-p="stop"]').addEventListener('click', () => {
      call('dismissPlaying');
      end('manual');
    });
    return {
      start,
      end,
      dispose() {
        nowPlaying.dispose();
        clearInterval(playTimer);
      },
    };
  }
})();
