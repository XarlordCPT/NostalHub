/* Tema Xbox 360: pestañas home / social / settings con mosaicos, carátulas, logros de Steam y Spotify.
   Se registra en window.Themes.x360 y el selector de consolas lo monta/desmonta. */
(() => {
  // ---------- Íconos (dibujos propios, trazo blanco) ----------
  const I = {
    clock: '<circle cx="24" cy="24" r="17"/><path d="M24 13v12l8 5"/>',
    pad: '<path d="M14 15h20c6 0 9 4 10 10l1 6c1 6-5 9-9 5l-5-5H17l-5 5c-4 4-10 1-9-5l1-6c1-6 4-10 10-10Z"/><path d="M15 22v7M11.5 25.5h7"/><circle cx="32" cy="23" r="1.6" fill="currentColor"/><circle cx="36" cy="27" r="1.6" fill="currentColor"/>',
    trophy: '<path d="M16 8h16v10a8 8 0 0 1-16 0Z"/><path d="M16 11H9v3a6 6 0 0 0 7 6M32 11h7v3a6 6 0 0 1-7 6"/><path d="M24 26v8M17 40h14M19 34h10v6H19z"/>',
    person: '<circle cx="24" cy="15" r="7"/><path d="M10 41c0-9 6-14 14-14s14 5 14 14"/>',
    people: '<circle cx="18" cy="16" r="6"/><path d="M6 39c0-8 5-12 12-12s12 4 12 12"/><circle cx="33" cy="18" r="5"/><path d="M31 27c7 0 11 4 11 11"/>',
    gear: '<circle cx="24" cy="24" r="6"/><path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.6 10.6l4.2 4.2M33.2 33.2l4.2 4.2M10.6 37.4l4.2-4.2M33.2 14.8l4.2-4.2"/><circle cx="24" cy="24" r="12"/>',
    folder: '<path d="M5 13h14l4 4h20v22H5Z"/><path d="M5 21h38"/>',
    image: '<rect x="6" y="9" width="36" height="30" rx="3"/><circle cx="17" cy="19" r="4"/><path d="M6 35l11-10 8 7 6-5 11 9"/>',
    key: '<circle cx="15" cy="24" r="8"/><path d="M23 24h20M37 24v7M31 24v5"/>',
    book: '<path d="M8 9h13c2 0 3 1 3 3v29c0-2-1-3-3-3H8Z"/><path d="M40 9H27c-2 0-3 1-3 3v29c0-2 1-3 3-3h13Z"/>',
    swap: '<path d="M8 17h30l-7-7M40 31H10l7 7"/>',
    power: '<path d="M16 12a15 15 0 1 0 16 0"/><path d="M24 6v17"/>',
    dice: '<rect x="8" y="8" width="32" height="32" rx="7"/><circle cx="17" cy="17" r="2.4" fill="currentColor"/><circle cx="31" cy="17" r="2.4" fill="currentColor"/><circle cx="24" cy="24" r="2.4" fill="currentColor"/><circle cx="17" cy="31" r="2.4" fill="currentColor"/><circle cx="31" cy="31" r="2.4" fill="currentColor"/>',
    bag: '<path d="M9 16h30l-3 25H12Z"/><path d="M17 16v-3a7 7 0 0 1 14 0v3"/>',
    feed: '<rect x="7" y="8" width="34" height="32" rx="3"/><path d="M13 17h22M13 24h22M13 31h14"/>',
    card: '<rect x="9" y="6" width="30" height="36" rx="3"/><circle cx="24" cy="19" r="5"/><path d="M15 34c0-5 4-8 9-8s9 3 9 8"/>',
    lock: '<rect x="11" y="21" width="26" height="20" rx="3"/><path d="M16 21v-5a8 8 0 0 1 16 0v5"/>',
    prev: '<path d="M14 10v28M38 10 18 24l20 14Z" fill="currentColor"/>',
    next: '<path d="M34 10v28M10 10l20 14-20 14Z" fill="currentColor"/>',
    play: '<path d="M15 9l25 15-25 15Z" fill="currentColor"/>',
    pause: '<path d="M14 10h7v28h-7zM27 10h7v28h-7z" fill="currentColor"/>',
    screen: '<rect x="5" y="8" width="38" height="25" rx="2"/><path d="M18 41h12M24 33v8"/>',
    speaker: '<path d="M8 19h8l10-8v26l-10-8H8Z"/><path d="M32 18a8 8 0 0 1 0 12M36 13a14 14 0 0 1 0 22"/>',
    headset: '<path d="M8 30v-6a16 16 0 0 1 32 0v6"/><rect x="6" y="28" width="8" height="12" rx="3"/><rect x="34" y="28" width="8" height="12" rx="3"/><path d="M40 40c0 4-5 6-12 6"/>',
    micOff: '<rect x="18" y="6" width="12" height="22" rx="6"/><path d="M11 23a13 13 0 0 0 26 0M24 36v6M8 8l32 32"/>',
    deaf: '<path d="M8 30v-6a16 16 0 0 1 32 0v6"/><rect x="6" y="28" width="8" height="12" rx="3"/><rect x="34" y="28" width="8" height="12" rx="3"/><path d="M6 6l36 36"/>',
    music: '<path d="M19 35V11l20-4v23"/><circle cx="14" cy="35" r="5.5" fill="currentColor"/><circle cx="34" cy="30" r="5.5" fill="currentColor"/>',
  };
  const icon = (name) => `<svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${I[name] || ''}</svg>`;

  const MARKUP = `
<div class="xb-bg"></div>
<div class="xb-sheen"></div>

<button class="xb-profile" data-nav-global>
  <span class="xb-pname">—</span>
  <span class="xb-avatar"><img alt="" hidden /></span>
</button>

<nav class="xb-tabs">
  <button class="xb-tab" data-tab="0">home</button>
  <button class="xb-tab" data-tab="1">social</button>
  <button class="xb-tab" data-tab="2">settings</button>
</nav>
<div class="xb-viewtitle"></div>

<section class="xb-panels">
  <div class="xb-panel" data-panel="0">
    <button class="xb-tile xb-last" data-nav data-act="last">
      <div class="xb-last-art"></div>
      <span class="xb-label">Jugar</span>
    </button>
    <button class="xb-tile t-random" data-nav data-act="random">${icon('dice')}<span class="xb-label">Al azar</span></button>

    <div class="xb-spotify">
      <div class="sp-disc"><div class="sp-disc-center">${icon('music')}</div></div>
      <div class="sp-eq"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="sp-info">
        <div class="sp-label">Spotify</div>
        <div class="sp-title">—</div>
        <div class="sp-artist"></div>
        <div class="sp-controls">
          <button class="sp-btn" data-nav data-sp="prev" title="Anterior">${icon('prev')}</button>
          <button class="sp-btn big" data-nav data-sp="toggle" title="Reproducir / pausar">${icon('play')}</button>
          <button class="sp-btn" data-nav data-sp="next" title="Siguiente">${icon('next')}</button>
          <button class="sp-open" data-nav data-sp="open">Abrir Spotify</button>
        </div>
      </div>
    </div>

    <button class="xb-tile row r0" data-nav data-act="recent">${icon('clock')}<span class="xb-label">Recientes</span></button>
    <button class="xb-tile row r1" data-nav data-act="games">${icon('pad')}<span class="xb-label">Mis juegos</span></button>
    <button class="xb-tile row r2" data-nav data-act="profile">${icon('card')}<span class="xb-label">Perfil</span></button>
    <button class="xb-tile row r3" data-nav data-act="menu">${icon('gear')}<span class="xb-label">Ajustes</span></button>
    <button class="xb-tile row r4" data-nav data-act="consoles">${icon('swap')}<span class="xb-label">Consolas</span></button>
  </div>

  <div class="xb-panel" data-panel="1">
    <button class="xb-tile col c0" data-nav data-open="steam-friends">${icon('people')}<span class="xb-label">Amigos</span></button>
    <button class="xb-tile col c1 xb-party-tile" data-nav data-act="party">${icon('headset')}<span class="xb-party-sub"></span><span class="xb-label">Grupo</span></button>
    <button class="xb-tile col c2" data-nav data-open="steam-store">${icon('bag')}<span class="xb-label">Tienda</span></button>
    <button class="xb-tile col c3" data-nav data-open="steam-profile">${icon('person')}<span class="xb-label">Mi perfil</span></button>

    <div class="xb-me">
      <div class="xb-me-name">—</div>
      <div class="xb-me-score"></div>
      <div class="xb-me-photo"><img alt="" hidden /><div class="xb-me-ph">${icon('person')}</div></div>
    </div>
    <div class="xb-recent">
      <div class="xb-recent-title">Jugados recientemente</div>
      <div class="xb-recent-list"></div>
    </div>
  </div>

  <div class="xb-panel" data-panel="2">
    <button class="xb-tile sq s0" data-nav data-act="menu">${icon('gear')}<span class="xb-label">Ajustes</span></button>
    <button class="xb-tile sq s1" data-nav data-open="steam-profile">${icon('card')}<span class="xb-label">Perfil de Steam</span></button>
    <button class="xb-tile sq s2" data-nav data-open="custom">${icon('folder')}<span class="xb-label">Personalización</span></button>
    <button class="xb-tile sq s3" data-nav data-open="consoles">${icon('image')}<span class="xb-label">Íconos de consolas</span></button>
    <button class="xb-tile sq s4" data-nav data-open="apikey">${icon('key')}<span class="xb-label">Clave de Steam</span></button>
    <button class="xb-tile sq s5" data-nav data-open="manual">${icon('book')}<span class="xb-label">Manual</span></button>
    <button class="xb-tile sq s6" data-nav data-act="consoles">${icon('swap')}<span class="xb-label">Cambiar consola</span></button>
    <button class="xb-tile sq s7" data-nav data-act="quit">${icon('power')}<span class="xb-label">Apagar</span></button>
  </div>
</section>

<!-- Estante de carátulas (Mis juegos / Recientes) -->
<section class="xb-view xb-shelf" hidden>
  <div class="xb-flow"></div>
  <div class="xb-flow-info">
    <div class="xb-flow-name"></div>
    <div class="xb-flow-meta"></div>
  </div>
  <div class="xb-flow-count"></div>
</section>

<!-- Ficha del juego -->
<section class="xb-view xb-detail" hidden>
  <div class="xb-detail-case"></div>
  <div class="xb-detail-info">
    <div class="xb-detail-name"></div>
    <div class="xb-detail-meta"></div>
    <div class="xb-detail-progress" hidden><div class="xb-bar"><i></i></div><span></span></div>
    <div class="xb-detail-desc"></div>
    <div class="xb-detail-actions">
      <button class="xb-tile act green" data-nav data-dact="play">${icon('play')}<span class="xb-label">Jugar</span></button>
      <button class="xb-tile act green" data-nav data-dact="ach">${icon('trophy')}<span class="xb-label">Logros</span></button>
      <button class="xb-tile act grey" data-nav data-dact="back">${icon('swap')}<span class="xb-label">Volver</span></button>
    </div>
  </div>
</section>

<!-- Logros -->
<section class="xb-view xb-ach" hidden>
  <div class="xb-ach-box">
    <div class="xb-ach-head">
      <span class="xb-ach-htitle">Logros</span>
      <span class="xb-ach-hgame"></span>
      <span class="xb-ach-hclock"></span>
    </div>
    <div class="xb-ach-body">
      <div class="xb-ach-sel">
        <div class="xb-ach-top"><span class="xb-ach-name"></span><span class="xb-ach-date"></span></div>
        <div class="xb-ach-sub"></div>
        <div class="xb-ach-desc"></div>
      </div>
      <div class="xb-ach-grid"></div>
      <div class="xb-ach-msg" hidden></div>
      <div class="xb-ach-foot"></div>
    </div>
  </div>
</section>

<!-- Grupo (canal de voz de Discord) -->
<section class="xb-view xb-party" hidden>
  <div class="xb-ach-box xb-party-box">
    <div class="xb-ach-head">
      <span class="xb-ach-htitle">Grupo</span>
      <span class="xb-ach-hgame xb-party-hname"></span>
      <span class="xb-ach-hclock"></span>
    </div>
    <div class="xb-ach-body xb-party-body"></div>
  </div>
</section>

<!-- Jugando -->
<section class="xb-view xb-playing" hidden>
  <div class="xb-play-box">
    <div class="xb-play-case"></div>
    <div class="xb-play-info">
      <div class="xb-play-label">Jugando a</div>
      <div class="xb-play-name"></div>
      <div class="xb-play-time">0:00</div>
      <button class="xb-tile act green" data-nav data-pact="stop">${icon('swap')}<span class="xb-label">Volver al menú</span></button>
    </div>
  </div>
</section>

<!-- Confirmación de apagado -->
<div class="xb-confirm" hidden>
  <div class="xb-confirm-box">
    <div class="xb-confirm-title">¿Cerrar NostalHub?</div>
    <div class="xb-confirm-actions">
      <button class="xb-tile act green" data-nav data-cact="yes"><span class="xb-label">Cerrar</span></button>
      <button class="xb-tile act grey" data-nav data-cact="no"><span class="xb-label">Cancelar</span></button>
    </div>
  </div>
</div>

<!-- La Guía (ajustes): se desliza encima, como al apretar el botón central del control -->
<div class="xb-guide" hidden>
  <div class="xg-panel">
    <div class="xg-top">
      <div class="xg-orb"><i></i></div>
      <div class="xg-user">
        <span class="xg-avatar"><img alt="" hidden /></span>
        <span class="xg-name">—</span>
      </div>
      <div class="xg-clock"></div>
    </div>
    <div class="xg-tabs"></div>
    <div class="xg-tabname"></div>
    <div class="xg-list"></div>
    <div class="xg-desc"></div>
    <div class="xg-foot">
      <span class="xb-key">Enter</span><span class="xg-hint">Seleccionar</span>
      <span class="xb-key">Q / E</span><span class="xg-hint">Pestañas</span>
      <span class="xb-key">Esc</span><span class="xg-hint">Cerrar</span>
    </div>
  </div>
</div>

<footer class="xb-hints"></footer>
`;

  const PANEL_SHIFT = 1474;
  const ACH_COLS = 10;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const pad2 = (n) => String(n).padStart(2, '0');
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

  function ago(ms) {
    if (!ms) return '';
    const diff = (ms - Date.now()) / 1000;
    const abs = Math.abs(diff);
    if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
    if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
    if (abs < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), 'month');
    return rtf.format(Math.round(diff / (86400 * 365)), 'year');
  }
  function hours(min) {
    if (!min) return '';
    return min < 60 ? `${min} min jugados` : `${Math.round(min / 6) / 10} h jugadas`.replace('.', ',');
  }
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  }

  // Caja del juego: carátula vertical, o una armada con el fondo y el logo si no hay
  function buildCase(g, size = '') {
    const el = document.createElement('div');
    el.className = `xb-case ${size}`;
    el.dataset.gameId = g.id; // clic derecho → cambiar imágenes
    const art = document.createElement('div');
    art.className = 'xb-case-art';
    if (g.cover) {
      art.style.backgroundImage = `url("${g.cover}")`;
    } else {
      art.classList.add('made');
      if (g.hero || g.tile) art.style.backgroundImage = `url("${g.hero || g.tile}")`;
      const top = document.createElement('div');
      top.className = 'xb-case-made-title';
      if (g.logo) {
        const img = document.createElement('img');
        img.src = g.logo;
        img.alt = '';
        top.appendChild(img);
      } else {
        top.textContent = g.name;
      }
      art.appendChild(top);
    }
    el.innerHTML = '<div class="xb-case-spine"></div><div class="xb-case-gloss"></div>';
    el.prepend(art);
    return el;
  }

  window.Themes = window.Themes || {};
  window.Themes.x360 = { mount };

  // root: contenedor del tema. ctx: { api, stage, stageRect, toast, openSelector }
  function mount(root, ctx) {
    root.innerHTML = MARKUP;
    const api = ctx.api;
    const $ = (s) => root.querySelector(s);
    const $$ = (s) => [...root.querySelectorAll(s)];
    const call = (fn, ...a) => (typeof api[fn] === 'function' ? api[fn](...a) : Promise.resolve(null));

    let games = [];
    let tab = 0;
    let view = 'home'; // home | shelf | detail | ach | playing | confirm | guide
    const stack = []; // vistas anteriores, para volver con Esc
    let shelfList = [];
    let shelfSel = 0;
    let shelfMode = 'games';
    let current = null; // juego en la ficha
    let achList = [];
    let achSel = 0;
    let achToken = 0;
    let summary = { done: 0, total: 0, perGame: {}, hasKey: false };
    let spotify = null;
    let playTimer = null;
    let clockTimer = null;
    let focused = null;
    const offs = [];
    const nowPlaying = window.NostalHubUtil.nowPlaying($('.xb-playing'), api);

    // ---------- Foco y navegación con flechas ----------
    function scope() {
      if (view === 'confirm') return $('.xb-confirm');
      if (view === 'home') return $(`.xb-panel[data-panel="${tab}"]`);
      if (view === 'detail') return $('.xb-detail');
      if (view === 'playing') return $('.xb-playing');
      if (view === 'party') return $('.xb-party');
      return null;
    }
    function visible(el) {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }
    function setFocus(el) {
      if (focused) focused.classList.remove('focus');
      focused = el || null;
      if (focused) focused.classList.add('focus');
    }
    function firstIn(sc) {
      const els = sc ? [...sc.querySelectorAll('[data-nav]')].filter(visible) : [];
      return els[0] || null;
    }
    function move(dir) {
      const sc = scope();
      if (!sc) return false;
      const els = [...sc.querySelectorAll('[data-nav]')].filter(visible);
      if (!focused || !sc.contains(focused)) {
        setFocus(els[0]);
        return true;
      }
      const a = focused.getBoundingClientRect();
      const ax = a.left + a.width / 2;
      const ay = a.top + a.height / 2;
      let best = null;
      let bestScore = Infinity;
      for (const el of els) {
        if (el === focused) continue;
        const b = el.getBoundingClientRect();
        const dx = b.left + b.width / 2 - ax;
        const dy = b.top + b.height / 2 - ay;
        let main, cross;
        if (dir === 'right') [main, cross] = [dx, dy];
        else if (dir === 'left') [main, cross] = [-dx, dy];
        else if (dir === 'down') [main, cross] = [dy, dx];
        else [main, cross] = [-dy, dx];
        if (main <= 4) continue;
        const score = main + Math.abs(cross) * 2;
        if (score < bestScore) {
          bestScore = score;
          best = el;
        }
      }
      if (best) setFocus(best);
      return !!best;
    }
    root.addEventListener('mouseover', (e) => {
      const el = e.target.closest('[data-nav]');
      if (el && root.contains(el)) setFocus(el);
    });

    // ---------- Pistas de teclas abajo a la izquierda ----------
    function hints(list) {
      $('.xb-hints').innerHTML = list.map(([k, t]) => `<span class="xb-key">${k}</span><span class="xb-hint">${t}</span>`).join('');
    }
    function homeHints() {
      hints([['Enter', 'Seleccionar'], ['Q / E', 'Cambiar pestaña'], ['G', 'Guía'], ['Esc', 'Consolas']]);
    }

    // ---------- Pestañas (panorama) ----------
    function setTab(t, animate = true) {
      tab = (t + 3) % 3;
      $$('.xb-tab').forEach((b) => b.classList.toggle('on', Number(b.dataset.tab) === tab));
      $$('.xb-panel').forEach((p) => {
        const i = Number(p.dataset.panel);
        let d = i - tab;
        if (d > 1) d -= 3;
        if (d < -1) d += 3;
        p.style.transition = animate ? '' : 'none';
        p.style.transform = `translateX(${296 + d * PANEL_SHIFT}px)`;
        p.classList.toggle('on', d === 0);
        p.classList.toggle('far', Math.abs(d) > 1);
      });
      if (view === 'home') setFocus(firstIn(scope()));
    }
    $$('.xb-tab').forEach((b) => b.addEventListener('click', () => view === 'home' && setTab(Number(b.dataset.tab))));
    // Clic en un panel vecino (el que se asoma) = ir a esa pestaña
    $$('.xb-panel').forEach((p) =>
      p.addEventListener(
        'click',
        (e) => {
          if (view !== 'home' || p.classList.contains('on')) return;
          e.stopPropagation();
          e.preventDefault();
          setTab(Number(p.dataset.panel));
        },
        true
      )
    );
    $('.xb-profile').addEventListener('click', () => view === 'home' && setTab(1));

    // ---------- Vistas (estante, ficha, logros, jugando) ----------
    function showView(name, title = '') {
      if (view !== name) stack.push(view);
      view = name;
      root.classList.toggle('in-view', name !== 'home');
      $$('.xb-view').forEach((v) => (v.hidden = !v.classList.contains(`xb-${name}`)));
      $('.xb-viewtitle').textContent = title;
    }
    function back() {
      const prev = stack.pop() || 'home';
      $$('.xb-view').forEach((v) => (v.hidden = true));
      view = prev;
      root.classList.toggle('in-view', prev !== 'home');
      if (prev === 'home') {
        $('.xb-viewtitle').textContent = '';
        homeHints();
        setFocus(firstIn(scope()));
      } else if (prev === 'shelf') {
        showShelfAgain();
      } else if (prev === 'detail') {
        $('.xb-detail').hidden = false;
        $('.xb-viewtitle').textContent = '';
        detailHints();
        setFocus(root.querySelector('[data-dact="ach"]'));
      }
    }

    // ---------- Home ----------
    function lastGame() {
      return [...games].filter((g) => g.lastPlayed).sort((a, b) => b.lastPlayed - a.lastPlayed)[0] || games[0] || null;
    }
    function renderHome() {
      const g = lastGame();
      const art = $('.xb-last-art');
      const label = $('.xb-last .xb-label');
      if (g) {
        art.style.backgroundImage = g.hero || g.tile ? `url("${g.hero || g.tile}")` : '';
        art.innerHTML = g.logo ? `<img src="${g.logo}" alt="" />` : '';
        label.textContent = `Jugar ${g.name}`;
        $('.xb-last').dataset.gameId = g.id; // clic derecho / tecla I → imágenes de este juego
      } else {
        delete $('.xb-last').dataset.gameId;
        art.style.backgroundImage = '';
        art.innerHTML = '';
        label.textContent = 'Sin juegos';
      }
    }

    function act(name) {
      if (name === 'last') {
        const g = lastGame();
        if (g) openDetail(g);
      } else if (name === 'random') {
        if (games.length) openDetail(games[Math.floor(Math.random() * games.length)]);
      } else if (name === 'recent') openShelf('recent');
      else if (name === 'games') openShelf('games');
      else if (name === 'profile') setTab(1);
      else if (name === 'party') openParty();
      else if (name === 'menu') openGuide();
      else if (name === 'consoles') ctx.openSelector();
      else if (name === 'quit') openConfirm();
    }
    $$('[data-act]').forEach((b) => b.addEventListener('click', () => view === 'home' && act(b.dataset.act)));
    $$('[data-open]').forEach((b) => b.addEventListener('click', () => view === 'home' && call('open', b.dataset.open)));

    // ---------- Spotify ----------
    function renderSpotify(s) {
      spotify = s || spotify;
      const box = $('.xb-spotify');
      const st = spotify || {};
      box.classList.toggle('playing', !!st.playing);
      box.classList.toggle('off', !st.running);
      let title = st.title;
      let artist = st.artist;
      if (st.supported === false) {
        title = 'Spotify';
        artist = 'Disponible en Windows con la app de escritorio';
      } else if (!st.running) {
        title = 'Spotify está cerrado';
        artist = 'Ábrelo para ver y controlar tu música';
      } else if (!title) {
        title = st.playing ? 'Reproduciendo' : 'En pausa';
        artist = 'Dale play en Spotify';
      }
      $('.sp-title').textContent = title;
      $('.sp-artist').textContent = artist || '';
      $('.sp-label').textContent = st.running ? (st.playing ? 'Spotify · Sonando' : 'Spotify · En pausa') : 'Spotify';
      $('[data-sp="toggle"]').innerHTML = icon(st.playing ? 'pause' : 'play');
      // Portada del álbum en la etiqueta del disco
      const label = $('.sp-disc-center');
      const cover = st.running && st.cover ? st.cover : null;
      label.classList.toggle('has-cover', !!cover);
      label.style.backgroundImage = cover ? `url("${cover}")` : '';
    }
    $$('[data-sp]').forEach((b) =>
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        if (view !== 'home') return;
        const cmd = b.dataset.sp;
        call('spotifyControl', cmd);
        // respuesta inmediata en pantalla mientras llega el estado real
        if (cmd === 'toggle' && spotify && spotify.running) renderSpotify({ ...spotify, playing: !spotify.playing });
      })
    );

    // ---------- Perfil ----------
    async function loadProfile() {
      const p = (await call('getSteamProfile')) || { name: 'Jugador' };
      $('.xb-pname').textContent = p.name || 'Jugador';
      $('.xb-me-name').textContent = p.name || 'Jugador';
      for (const img of [$('.xb-avatar img'), $('.xb-me-photo img')]) {
        if (p.avatar) {
          img.src = p.avatar;
          img.hidden = false;
        } else img.hidden = true;
      }
      $('.xb-me-ph').hidden = !!p.avatar;
    }
    async function loadSummary(s) {
      summary = s || (await call('getAchievementSummary')) || summary;
      const el = $('.xb-me-score');
      if (!summary.hasKey) {
        el.innerHTML = `<button class="xb-link" data-nav data-open="apikey">${icon('key')} Agrega tu clave de Steam para ver tus logros</button>`;
        el.querySelector('button').addEventListener('click', () => call('open', 'apikey'));
      } else {
        el.innerHTML = `${icon('trophy')}<b>${summary.done}</b><span>de ${summary.total} logros</span>`;
      }
    }
    function renderRecent() {
      const list = $('.xb-recent-list');
      list.innerHTML = '';
      [...games]
        .filter((g) => g.lastPlayed)
        .sort((a, b) => b.lastPlayed - a.lastPlayed)
        .slice(0, 4)
        .forEach((g) => {
          const row = document.createElement('button');
          row.className = 'xb-recent-row';
          row.dataset.nav = '';
          row.appendChild(buildCase(g, 'mini'));
          const t = document.createElement('div');
          const per = summary.perGame && g.appId && summary.perGame[g.appId];
          t.innerHTML = `<div class="xb-recent-name">${escapeHtml(g.name)}</div><div class="xb-recent-meta">${escapeHtml(
            [ago(g.lastPlayed), per && per.total ? `${per.done}/${per.total} logros` : ''].filter(Boolean).join(' · ')
          )}</div>`;
          row.appendChild(t);
          row.addEventListener('click', () => view === 'home' && openDetail(g));
          list.appendChild(row);
        });
      if (!list.children.length) list.innerHTML = '<div class="xb-recent-empty">Todavía no hay juegos recientes</div>';
    }

    // ---------- Estante de carátulas ----------
    function openShelf(mode) {
      shelfMode = mode;
      shelfList =
        mode === 'recent'
          ? [...games].filter((g) => g.lastPlayed).sort((a, b) => b.lastPlayed - a.lastPlayed)
          : [...games].sort((a, b) => a.name.localeCompare(b.name, 'es'));
      if (!shelfList.length) {
        ctx.toast(mode === 'recent' ? 'Todavía no hay juegos recientes' : 'No hay juegos');
        return;
      }
      shelfSel = 0;
      showView('shelf', mode === 'recent' ? 'recientes' : 'mis juegos');
      renderShelf(false);
      shelfHints();
      setFocus(null);
    }
    function showShelfAgain() {
      $('.xb-shelf').hidden = false;
      $('.xb-viewtitle').textContent = shelfMode === 'recent' ? 'recientes' : 'mis juegos';
      layoutShelf();
      shelfHints();
    }
    function shelfHints() {
      hints([['← →', 'Elegir'], ['Enter', 'Abrir'], ['Esc', 'Atrás']]);
    }
    function renderShelf() {
      const flow = $('.xb-flow');
      flow.innerHTML = '';
      shelfList.forEach((g, i) => {
        const item = document.createElement('div');
        item.className = 'xb-flow-item';
        item.dataset.i = i;
        item.appendChild(buildCase(g));
        item.addEventListener('click', () => {
          if (view !== 'shelf') return;
          if (i === shelfSel) openDetail(g);
          else setShelf(i);
        });
        flow.appendChild(item);
      });
      layoutShelf(false);
    }
    function setShelf(i) {
      shelfSel = Math.max(0, Math.min(shelfList.length - 1, i));
      layoutShelf();
    }
    function layoutShelf(animate = true) {
      $$('.xb-flow-item').forEach((el) => {
        const d = Number(el.dataset.i) - shelfSel;
        const ad = Math.abs(d);
        const sign = Math.sign(d);
        el.style.transition = animate ? '' : 'none';
        if (ad > 7) {
          el.style.opacity = 0;
          el.style.pointerEvents = 'none';
          el.style.transform = `translateX(${sign * 1100}px) scale(0.6)`;
          return;
        }
        const x = d === 0 ? 0 : sign * (290 + (ad - 1) * 118);
        el.style.transform = d === 0 ? 'translateX(0) translateZ(120px) scale(1.06)' : `translateX(${x}px) rotateY(${-sign * 58}deg) scale(0.84)`;
        el.style.zIndex = 100 - ad;
        el.style.opacity = ad > 5 ? 0.35 : 1;
        el.style.pointerEvents = '';
        el.classList.toggle('sel', d === 0);
      });
      const g = shelfList[shelfSel];
      if (!g) return;
      $('.xb-flow-name').textContent = g.name;
      const per = summary.perGame && g.appId && summary.perGame[g.appId];
      $('.xb-flow-meta').textContent = [
        g.lastPlayed ? `Jugado ${ago(g.lastPlayed)}` : 'Sin jugar todavía',
        hours(g.playtimeMin),
        per && per.total ? `${per.done} de ${per.total} logros` : '',
      ]
        .filter(Boolean)
        .join('   ·   ');
      $('.xb-flow-count').textContent = `${shelfSel + 1} de ${shelfList.length}`;
    }
    let wheelLock = 0;
    $('.xb-shelf').addEventListener('wheel', (e) => {
      if (view !== 'shelf' || Date.now() < wheelLock) return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) < 8) return;
      setShelf(shelfSel + (d > 0 ? 1 : -1));
      wheelLock = Date.now() + 120;
    });

    // ---------- Ficha del juego ----------
    function detailHints() {
      hints([['Enter', 'Seleccionar'], ['Esc', 'Atrás']]);
    }
    function openDetail(g) {
      current = g;
      showView('detail');
      $('.xb-detail').dataset.gameCurrent = g.id; // clic derecho / tecla I → imágenes de este juego
      const box = $('.xb-detail-case');
      box.innerHTML = '';
      box.appendChild(buildCase(g, 'big'));
      $('.xb-detail-name').textContent = g.name;
      $('.xb-detail-meta').textContent = [
        { steam: 'Steam', exe: 'Programa', shortcut: 'Acceso directo', url: 'Launcher' }[g.type] || '',
        hours(g.playtimeMin),
        g.lastPlayed ? `Jugado ${ago(g.lastPlayed)}` : '',
      ]
        .filter(Boolean)
        .join('   ·   ');
      $('.xb-detail-desc').textContent = g.description || '';
      const per = summary.perGame && g.appId && summary.perGame[g.appId];
      const prog = $('.xb-detail-progress');
      prog.hidden = !(per && per.total);
      if (per && per.total) {
        prog.querySelector('i').style.width = `${(per.done / per.total) * 100}%`;
        prog.querySelector('span').textContent = `${per.done} de ${per.total} logros`;
      }
      const achBtn = root.querySelector('[data-dact="ach"]');
      achBtn.classList.toggle('disabled', g.type !== 'steam');
      $('.xb-detail').classList.remove('enter');
      void $('.xb-detail').offsetWidth;
      $('.xb-detail').classList.add('enter');
      detailHints();
      setFocus(root.querySelector('[data-dact="play"]'));
    }
    $$('[data-dact]').forEach((b) =>
      b.addEventListener('click', () => {
        if (view !== 'detail' || !current) return;
        const a = b.dataset.dact;
        if (a === 'play') startGame(current);
        else if (a === 'ach') {
          if (current.type !== 'steam') ctx.toast('Los logros solo están disponibles para juegos de Steam');
          else openAchievements(current);
        } else back();
      })
    );

    // ---------- Logros ----------
    function tickClock() {
      const d = new Date();
      $$('.xb-ach-hclock').forEach((el) => (el.textContent = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`));
    }
    async function openAchievements(g) {
      showView('ach');
      hints([['Flechas', 'Mover'], ['Esc', 'Atrás']]);
      setFocus(null);
      tickClock();
      $('.xb-ach-hgame').textContent = g.name;
      const grid = $('.xb-ach-grid');
      const msg = $('.xb-ach-msg');
      grid.innerHTML = '';
      $('.xb-ach-sel').style.visibility = 'hidden';
      $('.xb-ach-foot').textContent = '';
      msg.hidden = false;
      msg.innerHTML = '<div class="xb-spinner"></div>Cargando logros…';
      const token = ++achToken;
      const res = (await call('getAchievements', g.appId)) || { status: 'error', list: [] };
      if (token !== achToken || view !== 'ach') return;

      if (res.status !== 'ok') {
        const texts = {
          'no-key': 'Para ver tus logros, conecta tu Steam.<br><small>settings → "Clave de Steam" (se hace aquí mismo, en 1 minuto).</small>',
          private: 'Steam no deja ver tus logros.<br><small>En Steam → tu perfil → Editar perfil → Privacidad, pon "Detalles de juegos" en Público.</small>',
          none: 'Este juego no tiene logros.',
          error: `No se pudieron cargar los logros.<br><small>${escapeHtml(res.message || 'Revisa tu conexión a internet.')}</small>`,
        };
        msg.innerHTML = texts[res.status] || texts.error;
        return;
      }
      msg.hidden = true;
      // Desbloqueados primero (más recientes arriba), después los bloqueados
      achList = [...res.list].sort((a, b) => Number(b.done) - Number(a.done) || (b.unlockTime || 0) - (a.unlockTime || 0));
      achList.forEach((a, i) => {
        const cell = document.createElement('button');
        cell.className = `xb-ach-cell${a.done ? '' : ' locked'}`;
        cell.dataset.i = i;
        cell.innerHTML = `<img src="${a.done ? a.icon : a.iconGray || a.icon}" alt="" />${a.done ? '' : `<span class="xb-ach-lock">${icon('lock')}</span>`}`;
        cell.addEventListener('mouseenter', () => setAch(i, false));
        cell.addEventListener('click', () => setAch(i, false));
        grid.appendChild(cell);
      });
      $('.xb-ach-foot').textContent = `${res.done} de ${res.total} desbloqueados`;
      $('.xb-ach-sel').style.visibility = '';
      setAch(0);
    }
    function setAch(i, scroll = true) {
      if (!achList.length) return;
      achSel = Math.max(0, Math.min(achList.length - 1, i));
      $$('.xb-ach-cell').forEach((c) => c.classList.toggle('sel', Number(c.dataset.i) === achSel));
      const a = achList[achSel];
      const secret = a.hidden && !a.done;
      $('.xb-ach-name').textContent = secret ? 'Logro secreto' : a.name;
      $('.xb-ach-date').textContent = a.done && a.unlockTime ? new Date(a.unlockTime).toLocaleDateString('es-CL') : 'Bloqueado';
      $('.xb-ach-sub').textContent = a.percent != null ? `Lo tiene el ${a.percent.toFixed(1).replace('.', ',')} % de los jugadores` : '';
      $('.xb-ach-desc').textContent = secret ? 'Sigue jugando para descubrirlo.' : a.description || '—';
      if (scroll) {
        const cell = root.querySelector(`.xb-ach-cell[data-i="${achSel}"]`);
        if (cell) cell.scrollIntoView({ block: 'nearest' });
      }
    }

    // ---------- Iniciar y "Jugando a…" ----------
    async function startGame(g) {
      const res = await api.launch(g.id);
      if (!res || !res.ok) {
        ctx.toast(`No se pudo abrir: ${(res && res.error) || 'error desconocido'}`);
        return;
      }
      showView('playing');
      const box = $('.xb-play-case');
      box.innerHTML = '';
      box.appendChild(buildCase(g, 'mid'));
      $('.xb-play-name').textContent = g.name;
      nowPlaying.start(); // Spotify y Grupo a los lados
      hints([['Enter', 'Volver al menú']]);
      setFocus(root.querySelector('[data-pact="stop"]'));
      document.body.classList.add('playing');
      const started = Date.now();
      const upd = () => {
        const s = Math.floor((Date.now() - started) / 1000);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        $('.xb-play-time').textContent = h ? `${h}:${pad2(m)}:${pad2(s % 60)}` : `${m}:${pad2(s % 60)}`;
      };
      upd();
      clearInterval(playTimer);
      playTimer = setInterval(upd, 1000);
    }
    function endPlaying(reason) {
      if (view === 'playing') nowPlaying.stop();
      if (view !== 'playing') return;
      clearInterval(playTimer);
      document.body.classList.remove('playing');
      back(); // vuelve a la ficha
      if (reason === 'not-started') ctx.toast('No se detectó que el juego abriera');
    }
    root.querySelector('[data-pact="stop"]').addEventListener('click', () => {
      call('dismissPlaying');
      endPlaying('manual');
    });

    // ---------- Confirmación de apagado ----------
    function openConfirm() {
      stack.push(view);
      view = 'confirm';
      $('.xb-confirm').hidden = false;
      setFocus(root.querySelector('[data-cact="no"]'));
    }
    function closeConfirm() {
      $('.xb-confirm').hidden = true;
      view = stack.pop() || 'home';
      setFocus(firstIn(scope()));
    }
    $$('[data-cact]').forEach((b) =>
      b.addEventListener('click', () => (b.dataset.cact === 'yes' ? call('quitApp') : closeConfirm()))
    );


    // ---------- La Guía (ajustes) ----------
    // Las opciones vienen de main.js (las mismas del menú de la bandeja); aquí se dibujan como la Guía.
    const U = window.NostalHubUtil;
    const TAB_ICONS = { general: 'gear', games: 'pad', screen: 'screen', sound: 'speaker', accounts: 'person', files: 'folder' };
    let gModel = [];
    let gTab = 0;
    let gSel = 0;

    async function openGuide() {
      if (view === 'guide' || view === 'confirm' || view === 'playing') return;
      gModel = (await call('getMenu')) || [];
      if (!gModel.length) return;
      stack.push(view);
      view = 'guide';
      gSel = 0;
      const p = (await call('getSteamProfile')) || {};
      $('.xg-name').textContent = p.name || 'Jugador';
      const img = $('.xg-avatar img');
      img.hidden = !p.avatar;
      if (p.avatar) img.src = p.avatar;
      $('.xg-clock').textContent = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
      const g = $('.xb-guide');
      g.hidden = false;
      g.classList.remove('leave');
      renderGuide();
    }

    async function closeGuide(then) {
      if (view !== 'guide') return;
      const g = $('.xb-guide');
      g.classList.add('leave');
      view = stack.pop() || 'home';
      await wait(200);
      g.hidden = true;
      g.classList.remove('leave');
      if (then) then();
      else setFocus(firstIn(scope()));
    }

    function renderGuide() {
      const tabs = $('.xg-tabs');
      tabs.innerHTML = '';
      gModel.forEach((sec, i) => {
        const b = document.createElement('button');
        b.className = `xg-tab${i === gTab ? ' on' : ''}`;
        b.title = sec.title;
        b.innerHTML = icon(TAB_ICONS[sec.id] || 'gear');
        b.addEventListener('click', () => setGuideTab(i));
        tabs.appendChild(b);
      });
      const sec = gModel[gTab];
      $('.xg-tabname').textContent = sec ? sec.title : '';
      const list = $('.xg-list');
      list.innerHTML = '';
      (sec ? sec.items : []).forEach((it, i) => {
        const row = document.createElement('button');
        row.className = 'xg-item';
        row.dataset.i = i;
        const val = U.optionValueText(it);
        row.innerHTML = `<span class="xg-label"></span>${it.type === 'choice' ? '<span class="xg-arrows">‹ ›</span>' : ''}<span class="xg-val"></span>`;
        row.querySelector('.xg-label').textContent = it.label;
        row.querySelector('.xg-val').textContent = val;
        if (it.type === 'toggle') row.classList.add(it.value ? 'is-on' : 'is-off');
        row.addEventListener('mouseenter', () => setGuideSel(i));
        row.addEventListener('click', () => guideRun(i));
        list.appendChild(row);
      });
      setGuideSel(Math.min(gSel, ((sec && sec.items.length) || 1) - 1));
    }

    function setGuideSel(i) {
      gSel = Math.max(0, i);
      $$('.xg-item').forEach((r) => r.classList.toggle('sel', Number(r.dataset.i) === gSel));
      const it = gModel[gTab] && gModel[gTab].items[gSel];
      $('.xg-desc').textContent = (it && it.desc) || '';
    }

    function setGuideTab(t) {
      const n = gModel.length;
      const next = (t + n) % n;
      if (next === gTab) return;
      const dir = next > gTab ? 'from-right' : 'from-left';
      gTab = next;
      gSel = 0;
      renderGuide();
      const list = $('.xg-list');
      list.classList.remove('from-left', 'from-right');
      list.offsetWidth;
      list.classList.add(dir);
    }

    async function guideRun(i) {
      const it = gModel[gTab] && gModel[gTab].items[i];
      if (!it) return;
      setGuideSel(i);
      if (it.id === 'consoles') return closeGuide(() => ctx.openSelector());
      if (it.confirm) return closeGuide(() => openConfirm());
      if (it.closes) await closeGuide(() => {});
      if (/^open-|^devtools$/.test(it.id)) ctx.toast('Se abrió en Windows');
      const value = it.type === 'action' ? undefined : U.optionNextValue(it, 1);
      const next = await call('runMenu', it.id, value);
      if (next && view === 'guide') {
        gModel = next;
        renderGuide();
      }
    }

    function guideKey(e) {
      const k = e.key;
      const n = (gModel[gTab] && gModel[gTab].items.length) || 0;
      if (k === 'Escape' || k === 'Backspace' || k === 'g' || k === 'G') closeGuide();
      else if (k === 'ArrowUp') setGuideSel((gSel - 1 + n) % n);
      else if (k === 'ArrowDown') setGuideSel((gSel + 1) % n);
      else if (k === 'ArrowLeft' || k === 'q' || k === 'Q' || k === 'PageUp') setGuideTab(gTab - 1);
      else if (k === 'ArrowRight' || k === 'e' || k === 'E' || k === 'PageDown') setGuideTab(gTab + 1);
      else if (k === 'Enter') guideRun(gSel);
    }
    // Clic afuera del panel = cerrar. Se mira dónde EMPEZÓ el clic (y no e.target), porque al cambiar
    // de pestaña los botones se vuelven a dibujar y el botón clickeado ya no está dentro del panel.
    let downOnBackdrop = false;
    $('.xb-guide').addEventListener('pointerdown', (e) => (downOnBackdrop = e.target === e.currentTarget));
    $('.xb-guide').addEventListener('click', (e) => {
      if (downOnBackdrop && e.target === e.currentTarget) closeGuide();
      downOnBackdrop = false;
    });


    // ---------- Grupo (canal de voz de Discord) ----------
    let discord = { status: 'off', channel: null, members: [] };
    const escHtml = escapeHtml;
    function partyStatus() {
      switch (discord.status) {
        case 'no-config':
          return { t: 'Conecta tu Discord', d: 'Para ver tu canal de voz y quiénes están contigo, conecta tu Discord. Se hace aquí mismo y toma unos 2 minutos.', btns: [['discord', 'Conectar Discord']] };
        case 'no-discord':
          return { t: 'Discord no está abierto', d: 'Abre la app de escritorio de Discord. NostalHub se conecta sola cuando la detecte.', btns: [['discord-app', 'Abrir Discord']] };
        case 'connecting':
        case 'off':
          return { t: 'Conectando con Discord…', d: '', btns: [] };
        case 'need-auth':
          return { t: 'Falta un permiso', d: 'Discord te va a mostrar una ventana para que aceptes. Solo se pide una vez.', btns: [['auth', 'Conectar con Discord']] };
        case 'authorizing':
          return { t: 'Acepta en Discord', d: 'Revisa la ventana que apareció en Discord y presiona Autorizar.', btns: [] };
        case 'error':
          return { t: 'No se pudo conectar', d: discord.message || 'Revisa los datos de tu aplicación de Discord.', btns: [['auth', 'Intentar de nuevo'], ['discord', 'Conectar Discord']] };
        default:
          return null;
      }
    }
    function renderPartyTile() {
      const sub = $('.xb-party-sub');
      if (discord.status === 'ok' && discord.channel) {
        const n = discord.members.length;
        sub.textContent = `${discord.channel.name} · ${n} ${n === 1 ? 'persona' : 'personas'}`;
        $('.xb-party-tile').classList.toggle('talking', discord.members.some((m) => m.speaking));
      } else {
        sub.textContent = '';
        $('.xb-party-tile').classList.remove('talking');
      }
    }
    function renderDiscord(s) {
      discord = s || discord;
      renderPartyTile();
      if (view === 'party') renderParty();
    }
    function openParty() {
      showView('party', '');
      hints([['Flechas', 'Mover'], ['Enter', 'Seleccionar'], ['Esc', 'Volver']]);
      tickClock();
      renderParty(true);
    }
    function renderParty(first) {
      const body = $('.xb-party-body');
      const keep = focused && focused.dataset.pb;
      const st = partyStatus();
      $('.xb-party-hname').textContent = discord.status === 'ok' && discord.channel ? discord.channel.guild || 'Mensaje directo' : 'Discord';
      if (st) {
        body.innerHTML = `<div class="xb-party-empty">${icon('headset')}<div class="xb-party-t">${escHtml(st.t)}</div><div class="xb-party-d">${escHtml(st.d)}</div>
          <div class="xb-party-btns">${st.btns.map(([id, label]) => `<button class="xb-tile act green" data-nav data-pb="${id}"><span class="xb-label">${label}</span></button>`).join('')}</div></div>`;
      } else if (!discord.channel) {
        body.innerHTML = `<div class="xb-party-empty">${icon('headset')}<div class="xb-party-t">No estás en un canal de voz</div><div class="xb-party-d">Cuando entres a un canal de voz en Discord, aquí vas a ver quiénes están contigo.</div></div>`;
      } else {
        const n = discord.members.length;
        body.innerHTML = `<div class="xb-ach-sel xb-party-chan">${icon('headset')}<div><div class="xb-ach-name">${escHtml(discord.channel.name)}</div><div class="xb-ach-sub">${escHtml(discord.channel.guild || 'Mensaje directo')} · ${n} ${n === 1 ? 'persona' : 'personas'} en el grupo</div></div></div>
          <div class="xb-party-list">${discord.members
            .map(
              (m) => `<div class="xb-party-m${m.speaking ? ' talking' : ''}">
                <span class="xb-party-av" style="background-image:url('${m.avatar}')"></span>
                <span class="xb-party-n">${escHtml(m.name)}</span>
                <span class="xb-party-state">${m.deafened ? `${icon('deaf')}Sin audio` : m.muted ? `${icon('micOff')}Silenciado` : m.speaking ? `${icon('headset')}Hablando` : ''}</span>
              </div>`
            )
            .join('')}</div>`;
      }
      body.querySelectorAll('[data-pb]').forEach((b) =>
        b.addEventListener('click', () => {
          const id = b.dataset.pb;
          if (id === 'auth') call('discordAuthorize').then((s) => s && renderDiscord(s));
          else call('open', id);
        })
      );
      const again = keep && body.querySelector(`[data-pb="${keep}"]`);
      if (again) setFocus(again);
      else if (first || !focused || !body.contains(focused)) setFocus(firstIn(scope()));
    }

    // ---------- Teclado ----------
    function onKey(e) {
      const k = e.key;
      const dir = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[k];
      // Enter/espacio no deben "apretar" además el último botón clickeado con el mouse
      if (k === 'Enter' || k === ' ') e.preventDefault();
      if (view === 'guide') return guideKey(e);
      if ((k === 'g' || k === 'G') && (view === 'home' || view === 'shelf' || view === 'detail')) return openGuide();
      if (view === 'home') {
        if (k === 'q' || k === 'Q' || k === 'PageUp') setTab(tab - 1);
        else if (k === 'e' || k === 'E' || k === 'PageDown') setTab(tab + 1);
        else if (dir) {
          if (!move(dir) && (dir === 'left' || dir === 'right')) setTab(tab + (dir === 'right' ? 1 : -1));
        } else if (k === 'Enter' && focused) focused.click();
        else if (k === 'Escape') ctx.openSelector();
      } else if (view === 'shelf') {
        if (dir === 'left') setShelf(shelfSel - 1);
        else if (dir === 'right') setShelf(shelfSel + 1);
        else if (k === 'Enter') openDetail(shelfList[shelfSel]);
        else if (k === 'Escape' || k === 'Backspace') back();
      } else if (view === 'detail' || view === 'confirm' || view === 'playing' || view === 'party') {
        if (dir) move(dir);
        else if (k === 'Enter' && focused) focused.click();
        else if (k === 'Escape' || k === 'Backspace') {
          if (view === 'detail' || view === 'party') back();
          else if (view === 'confirm') closeConfirm();
        }
      } else if (view === 'ach') {
        if (dir === 'left') setAch(achSel - 1);
        else if (dir === 'right') setAch(achSel + 1);
        else if (dir === 'up') setAch(achSel - ACH_COLS);
        else if (dir === 'down') setAch(achSel + ACH_COLS);
        else if (k === 'Escape' || k === 'Backspace') back();
      }
    }
    window.addEventListener('keydown', onKey);

    // ---------- Datos ----------
    function setGames(list) {
      games = list || [];
      if (current) current = games.find((g) => g.id === current.id) || current;
      renderHome();
      renderRecent();
      if (view === 'shelf') {
        const keepId = shelfList[shelfSel] && shelfList[shelfSel].id;
        shelfList = shelfList.map((g) => games.find((x) => x.id === g.id) || g);
        const idx = shelfList.findIndex((g) => g.id === keepId);
        if (idx >= 0) shelfSel = idx;
        layoutShelf(false);
      }
    }

    offs.push(api.onGamesUpdated(setGames));
    offs.push(api.onGameEnded(({ reason }) => endPlaying(reason)));
    if (api.onSpotify) offs.push(api.onSpotify(renderSpotify));
    if (api.onSteamSummary)
      offs.push(
        api.onSteamSummary((s) => {
          loadSummary(s);
          renderRecent();
        })
      );
    if (api.onSteamChanged)
      offs.push(
        api.onSteamChanged(() => {
          loadProfile();
          loadSummary();
        })
      );

    setTab(0, false);
    homeHints();
    renderSpotify({ supported: true, running: false });
    call('spotifyWatch', true).then((s) => s && renderSpotify(s));
    call('discordWatch', true).then((s) => s && renderDiscord(s));
    if (api.onDiscord) offs.push(api.onDiscord(renderDiscord));
    loadProfile();
    loadSummary().then(renderRecent);
    clockTimer = setInterval(tickClock, 15000);
    api.getState().then((s) => {
      setGames(s.games);
      root.classList.add('intro');
      setTimeout(() => root.classList.remove('intro'), 1500);
      setFocus(firstIn(scope()));
    });

    return {
      unmount() {
        nowPlaying.dispose();
        clearInterval(playTimer);
        clearInterval(clockTimer);
        window.removeEventListener('keydown', onKey);
        offs.forEach((off) => off && off());
        call('spotifyWatch', false);
        call('discordWatch', false);
        document.body.classList.remove('playing');
        root.classList.remove('in-view', 'intro');
        root.innerHTML = '';
      },
    };
  }
})();
