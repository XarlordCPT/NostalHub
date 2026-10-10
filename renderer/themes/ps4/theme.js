/* Tema PS4: menú principal (últimos juegos + Biblioteca), fila de funciones, menú rápido,
   biblioteca, ficha del juego, trofeos (logros de Steam), grupo (canal de voz de Discord) y ajustes.
   Se registra en window.Themes.ps4 y el selector de consolas lo monta/desmonta. */
(() => {
  // ---------- Íconos (dibujos propios, trazo blanco) ----------
  const I = {
    bag: '<path d="M9 16h30l-3 25H12Z"/><path d="M17 16v-3a7 7 0 0 1 14 0v3"/>',
    chat: '<path d="M8 10h32v20H22l-9 8v-8H8Z"/><path d="M15 18h18M15 23h12"/>',
    people: '<circle cx="18" cy="16" r="6"/><path d="M6 39c0-8 5-12 12-12s12 4 12 12"/><circle cx="33" cy="18" r="5"/><path d="M31 27c7 0 11 4 11 11"/>',
    headset: '<path d="M8 30v-6a16 16 0 0 1 32 0v6"/><rect x="6" y="28" width="8" height="12" rx="3"/><rect x="34" y="28" width="8" height="12" rx="3"/><path d="M40 40c0 4-5 6-12 6"/>',
    person: '<circle cx="24" cy="15" r="7"/><path d="M10 41c0-9 6-14 14-14s14 5 14 14"/>',
    trophy: '<path d="M16 8h16v10a8 8 0 0 1-16 0Z"/><path d="M16 11H9v3a6 6 0 0 0 7 6M32 11h7v3a6 6 0 0 1-7 6"/><path d="M24 26v8M17 40h14M19 34h10v6H19z"/>',
    toolbox: '<rect x="6" y="18" width="36" height="22" rx="2"/><path d="M18 18v-5h12v5M6 27h36M21 25v5h6v-5"/>',
    power: '<path d="M16 12a15 15 0 1 0 16 0"/><path d="M24 6v17"/>',
    speaker: '<path d="M8 19h8l10-8v26l-10-8H8Z"/><path d="M32 18a8 8 0 0 1 0 12M36 13a14 14 0 0 1 0 22"/>',
    music: '<path d="M19 35V11l20-4v23"/><circle cx="14" cy="35" r="5.5" fill="currentColor"/><circle cx="34" cy="30" r="5.5" fill="currentColor"/>',
    dice: '<rect x="8" y="8" width="32" height="32" rx="7"/><circle cx="17" cy="17" r="2.4" fill="currentColor"/><circle cx="31" cy="17" r="2.4" fill="currentColor"/><circle cx="24" cy="24" r="2.4" fill="currentColor"/><circle cx="17" cy="31" r="2.4" fill="currentColor"/><circle cx="31" cy="31" r="2.4" fill="currentColor"/>',
    swap: '<path d="M8 17h30l-7-7M40 31H10l7 7"/>',
    grid: '<rect x="7" y="7" width="15" height="15"/><rect x="26" y="7" width="15" height="15"/><rect x="7" y="26" width="15" height="15"/><rect x="26" y="26" width="15" height="15"/>',
    search: '<circle cx="20" cy="20" r="12"/><path d="M29 29l12 12"/>',
    pad: '<path d="M14 15h20c6 0 9 4 10 10l1 6c1 6-5 9-9 5l-5-5H17l-5 5c-4 4-10 1-9-5l1-6c1-6 4-10 10-10Z"/><path d="M15 22v7M11.5 25.5h7"/><circle cx="32" cy="23" r="1.6" fill="currentColor"/><circle cx="36" cy="27" r="1.6" fill="currentColor"/>',
    apps: '<rect x="6" y="6" width="16" height="16" rx="3"/><rect x="26" y="6" width="16" height="16" rx="3"/><rect x="6" y="26" width="16" height="16" rx="3"/><path d="M34 26v16M26 34h16"/>',
    clock: '<circle cx="24" cy="24" r="17"/><path d="M24 13v12l8 5"/>',
    gear: '<circle cx="24" cy="24" r="6"/><path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.6 10.6l4.2 4.2M33.2 33.2l4.2 4.2M10.6 37.4l4.2-4.2M33.2 14.8l4.2-4.2"/><circle cx="24" cy="24" r="12"/>',
    screen: '<rect x="5" y="8" width="38" height="25" rx="2"/><path d="M18 41h12M24 33v8"/>',
    folder: '<path d="M5 13h14l4 4h20v22H5Z"/><path d="M5 21h38"/>',
    play: '<path d="M15 9l25 15-25 15Z" fill="currentColor"/>',
    pause: '<path d="M14 10h7v28h-7zM27 10h7v28h-7z" fill="currentColor"/>',
    prev: '<path d="M14 10v28M38 10 18 24l20 14Z" fill="currentColor"/>',
    next: '<path d="M34 10v28M10 10l20 14-20 14Z" fill="currentColor"/>',
    micOff: '<rect x="18" y="6" width="12" height="22" rx="6"/><path d="M11 23a13 13 0 0 0 26 0M24 36v6M8 8l32 32"/>',
    deaf: '<path d="M8 30v-6a16 16 0 0 1 32 0v6"/><rect x="6" y="28" width="8" height="12" rx="3"/><rect x="34" y="28" width="8" height="12" rx="3"/><path d="M6 6l36 36"/>',
    down: '<path d="M24 8v28M13 26l11 11 11-11"/>',
    check: '<path d="M10 25l9 9 19-20"/>',
    rest: '<path d="M30 8a16 16 0 1 0 10 26A13 13 0 0 1 30 8Z"/>',
    restart: '<path d="M38 24a14 14 0 1 1-4-10"/><path d="M36 6v9h-9"/>',
  };
  const icon = (name, cls = '') =>
    `<svg class="p4-ic ${cls}" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${I[name] || ''}</svg>`;

  // Ondas del fondo (dos vueltas para que el movimiento sea continuo)
  function wave(y, amp, len, n = 8) {
    let d = `M0 ${y}`;
    for (let i = 0; i < n; i++) {
      const x = i * len;
      d += ` C${x + len / 3} ${y - amp} ${x + (2 * len) / 3} ${y + amp} ${x + len} ${y}`;
    }
    return d;
  }
  const WAVES = `
<svg class="p4-waves" viewBox="0 0 3840 1080" preserveAspectRatio="none" aria-hidden="true">
  <path class="band" d="${wave(640, 120, 960, 4)} V1080 H0 Z" />
  <path class="band b2" d="${wave(760, 90, 640, 6)} V1080 H0 Z" />
  <path class="line l1" d="${wave(600, 140, 960, 4)}" />
  <path class="line l2" d="${wave(690, 80, 768, 5)}" />
  <path class="line l3" d="${wave(820, 110, 1280, 3)}" />
</svg>`;

  const FUNCS = [
    { id: 'store', label: 'Tienda', icon: 'bag' },
    { id: 'friends', label: 'Amigos', icon: 'people' },
    { id: 'party', label: 'Grupo', icon: 'headset' },
    { id: 'profile', label: 'Perfil', icon: 'person' },
    { id: 'trophies', label: 'Trofeos', icon: 'trophy' },
    { id: 'settings', label: 'Ajustes', icon: 'toolbox' },
    { id: 'power', label: 'Energía', icon: 'power' },
  ];

  const MARKUP = `
<div class="p4-bg">${WAVES}</div>
<div class="p4-art"><div class="p4-art-img"></div><div class="p4-art-img"></div><div class="p4-art-shade"></div></div>

<header class="p4-status">
  <div class="p4-st-left">
    <span class="p4-st-music" hidden>${icon('music')}<span class="t"></span></span>
  </div>
  <div class="p4-st-mid">
    <span class="p4-st-party" hidden>${icon('headset')}<b></b></span>
    <span class="p4-st-user"><span class="p4-av"><img alt="" hidden /></span><span class="n">—</span></span>
    <span class="p4-st-troph">${icon('trophy')}<b>—</b></span>
  </div>
  <div class="p4-st-clock"></div>
</header>

<section class="p4-home">
  <div class="p4-func">
    <div class="p4-func-row">${FUNCS.map((f, i) => `<button class="p4-fn" data-i="${i}">${icon(f.icon)}<span>${f.label}</span></button>`).join('')}</div>
  </div>
  <div class="p4-row"></div>
  <div class="p4-row-label"></div>
  <div class="p4-teaser"></div>
</section>

<!-- Ficha del juego (la "información" que aparece al bajar) -->
<section class="p4-screen p4-game" hidden>
  <div class="p4g-title"></div>
  <div class="p4g-meta"></div>
  <div class="p4g-actions">
    <button class="p4-btn" data-g="start">${icon('play')}<span>Iniciar</span></button>
    <button class="p4-btn" data-g="troph">${icon('trophy')}<span>Trofeos</span></button>
  </div>
  <div class="p4g-panels">
    <div class="p4-panel p4g-about"><div class="p4-panel-h">Información</div><div class="p4g-desc"></div></div>
    <div class="p4-panel p4g-tp"><div class="p4-panel-h">Trofeos</div><div class="p4g-tp-body"></div></div>
  </div>
</section>

<!-- Biblioteca -->
<section class="p4-screen p4-lib" hidden>
  <div class="p4-title">Biblioteca</div>
  <div class="p4l-side"></div>
  <div class="p4l-main">
    <div class="p4l-top">
      <div class="p4l-search" hidden>${icon('search')}<input type="text" placeholder="Escribe para buscar" spellcheck="false" /></div>
      <button class="p4l-sort"></button>
    </div>
    <div class="p4l-section"></div>
    <div class="p4l-viewport"><div class="p4l-grid"></div></div>
  </div>
</section>

<!-- Trofeos -->
<section class="p4-screen p4-troph" hidden>
  <div class="p4-title">Trofeos</div>
  <div class="p4t-card">
    <span class="p4-av big"><img alt="" hidden /></span>
    <div class="p4t-who"><div class="p4t-name"></div><div class="p4t-sum"></div><div class="p4-bar"><i></i></div></div>
  </div>
  <div class="p4t-head"></div>
  <div class="p4t-viewport"><div class="p4t-list"></div></div>
  <div class="p4t-msg" hidden></div>
</section>

<!-- Grupo (canal de voz de Discord) -->
<section class="p4-screen p4-party" hidden>
  <div class="p4-title">Grupo</div>
  <div class="p4p-body"></div>
</section>

<!-- Amigos (de Steam) -->
<section class="p4-screen p4-friends" hidden>
  <div class="p4-title">Amigos</div>
  <div class="p4f-count"></div>
  <div class="p4f-viewport"><div class="p4f-list"></div></div>
  <div class="p4f-detail"></div>
  <div class="p4f-msg" hidden></div>
</section>

<!-- Ajustes -->
<section class="p4-screen p4-set" hidden>
  <div class="p4-title">Ajustes</div>
  <div class="p4s-list"></div>
  <div class="p4s-desc"></div>
</section>

<!-- Jugando -->
<section class="p4-playing" hidden>
  <div class="p4-play-card">
    <div class="p4-play-art"></div>
    <div class="p4-play-info">
      <div class="p4-play-label">Jugando a</div>
      <div class="p4-play-name"></div>
      <div class="p4-play-time">0:00</div>
      <button class="p4-btn sel" data-p="stop">${icon('swap')}<span>Volver al menú</span></button>
    </div>
  </div>
</section>

<!-- Menú rápido -->
<div class="p4-qm" hidden>
  <div class="p4-qm-panel">
    <div class="p4-qm-title">Menú rápido</div>
    <div class="p4-qm-cols">
      <div class="p4-qm-list"></div>
      <div class="p4-qm-sub"></div>
    </div>
    <div class="p4-qm-foot"><span class="p4-av"><img alt="" hidden /></span><span class="n"></span></div>
  </div>
</div>

<!-- Ventanitas (energía, elegir una opción) -->
<div class="p4-pop" hidden>
  <div class="p4-pop-box"><div class="p4-pop-title"></div><div class="p4-pop-list"></div></div>
</div>

<footer class="p4-foot">
  <button class="p4-qm-btn"><span class="p4-key">P</span><span>Menú rápido</span></button>
</footer>
`;

  const S = 205; // tamaño de los cuadros
  const L = 340; // cuadro elegido
  const GAP = 10;
  const ROW_Y = 215;
  const LIB_COLS = 4;
  const LIB_ROW_H = 158;
  const LIB_VIEW_H = 760;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const pad2 = (n) => String(n).padStart(2, '0');

  window.Themes = window.Themes || {};
  window.Themes.ps4 = { mount };

  // root: contenedor del tema. ctx: { api, stage, stageRect, toast, openSelector, sound }
  function mount(root, ctx) {
    root.innerHTML = MARKUP;
    const api = ctx.api;
    const U = window.NostalHubUtil;
    const esc = U.escapeHtml;
    const $ = (s) => root.querySelector(s);
    const $$ = (s) => [...root.querySelectorAll(s)];
    const call = (fn, ...a) => (typeof api[fn] === 'function' ? api[fn](...a) : Promise.resolve(null));

    let games = [];
    let view = 'home'; // home | func | game | library | trophies | party | settings | playing
    const stack = [];
    let rowSel = 0;
    let funcSel = 4;
    let current = null; // juego de la ficha
    let profile = { name: 'Jugador', avatar: null };
    let summary = { done: 0, total: 0, perGame: {}, hasKey: false };
    let spotify = null;
    let discord = { status: 'off', channel: null, members: [] };
    let menuModel = [];
    let playTimer = null;
    const offs = [];
    const nowPlaying = window.NostalHubUtil.nowPlaying($('.p4-playing'), api, ctx.toast);

    // ---------- Arte del juego de fondo (se cruza suavemente) ----------
    const artImgs = $$('.p4-art-img');
    let artFront = 0;
    let artUrl = null;
    function setArt(url, strong = false) {
      root.classList.toggle('art-strong', !!url && strong);
      if (url === artUrl) return;
      artUrl = url;
      const next = artImgs[1 - artFront];
      next.style.backgroundImage = url ? `url("${url}")` : '';
      next.classList.toggle('on', !!url);
      artImgs[artFront].classList.remove('on');
      artFront = 1 - artFront;
    }

    // ---------- Barra superior ----------
    function tickClock() {
      const d = new Date();
      $('.p4-st-clock').textContent = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    }
    tickClock();
    const clockTimer = setInterval(tickClock, 10000);

    function paintAvatar(el) {
      const img = el.querySelector('img');
      img.hidden = !profile.avatar;
      if (profile.avatar) img.src = profile.avatar;
      el.classList.toggle('empty', !profile.avatar);
      el.dataset.letter = (profile.name || '?').charAt(0).toUpperCase();
    }
    async function loadProfile() {
      profile = (await call('getSteamProfile')) || profile;
      $$('.p4-av').forEach(paintAvatar);
      $('.p4-st-user .n').textContent = profile.name || 'Jugador';
      $('.p4-qm-foot .n').textContent = profile.name || 'Jugador';
      $('.p4t-name').textContent = profile.name || 'Jugador';
    }
    async function loadSummary(s) {
      summary = s || (await call('getAchievementSummary')) || summary;
      $('.p4-st-troph b').textContent = summary.hasKey ? String(summary.done || 0) : '—';
      if (view === 'home') renderTeaser();
    }

    // ---------- Datos de cada juego ----------
    function recentGames() {
      const played = games.filter((g) => g.lastPlayed).sort((a, b) => b.lastPlayed - a.lastPlayed);
      const rest = games.filter((g) => !g.lastPlayed);
      return [...played, ...rest].slice(0, 5);
    }
    function trophiesOf(g) {
      return (g && g.appId && summary.perGame && summary.perGame[g.appId]) || null;
    }
    function tileArt(g, big = false) {
      // Cuadro del juego: su fondo + el logo encima (o su imagen tal cual si es personalizada)
      const el = document.createElement('div');
      el.className = 'p4-tart';
      const bg = g.tileIsCustom ? g.tile : g.hero || g.tile || g.cover;
      if (bg) el.style.backgroundImage = `url("${bg}")`;
      if (!g.tileIsCustom) {
        if (g.logo) {
          const img = document.createElement('img');
          img.src = g.logo;
          img.alt = '';
          el.appendChild(img);
        } else if (!g.heroIsReal || !bg) {
          const t = document.createElement('div');
          t.className = 'p4-tart-name';
          t.textContent = g.name;
          t.style.fontSize = `${big ? 44 : 30}px`;
          el.appendChild(t);
        }
      }
      return el;
    }

    // ---------- Menú principal: fila de juegos ----------
    let rowItems = []; // { type: 'game' | 'library', game }
    function renderRow() {
      const row = $('.p4-row');
      row.innerHTML = '';
      rowItems = [...recentGames().map((g) => ({ type: 'game', game: g })), { type: 'library' }];
      rowItems.forEach((it, i) => {
        const t = document.createElement('button');
        t.className = `p4-tile ${it.type}`;
        t.dataset.i = i;
        if (it.type === 'game') t.dataset.gameId = it.game.id; // clic derecho → cambiar imágenes
        const face = document.createElement('div');
        face.className = 'p4-tface';
        if (it.type === 'game') face.appendChild(tileArt(it.game));
        else face.innerHTML = `<div class="p4-lib-ic">${icon('grid')}<span>Biblioteca</span></div>`;
        const strip = document.createElement('div');
        strip.className = 'p4-tstrip';
        strip.innerHTML = it.type === 'game' ? `${icon('play')}<span>Iniciar</span>` : `${icon('down')}<span>Abrir</span>`;
        t.append(face, strip);
        // Con el mouse no se elige al pasar por encima: la fila se corre y elegiría otro cuadro sin querer
        // Con el mouse: un clic lo elige; con el cuadro ya elegido, clic en "Iniciar" = jugar y clic en la imagen = ver la ficha
        t.addEventListener('click', (e) => {
          if (view !== 'home') return;
          if (i !== rowSel) return setRow(i);
          if (it.type === 'library') return openLibrary();
          if (e.target.closest('.p4-tstrip')) startGame(it.game);
          else openGame(it.game);
        });
        row.appendChild(t);
      });
      setRow(Math.min(rowSel, rowItems.length - 1), false);
    }

    function setRow(i, animate = true) {
      rowSel = Math.max(0, Math.min(rowItems.length - 1, i));
      const selX = rowSel === 0 ? 80 : 290;
      $$('.p4-tile').forEach((t) => {
        const j = Number(t.dataset.i);
        let x;
        if (j < rowSel) x = selX - (rowSel - j) * (S + GAP);
        else if (j === rowSel) x = selX;
        else x = selX + L + GAP + (j - rowSel - 1) * (S + GAP);
        const sel = j === rowSel;
        t.style.transition = animate ? '' : 'none';
        t.style.left = `${x}px`;
        t.style.top = `${ROW_Y}px`;
        t.style.width = `${sel ? L : S}px`;
        t.style.setProperty('--h', `${sel ? L : S}px`);
        t.classList.toggle('sel', sel);
        t.classList.toggle('gone', x < -S);
      });
      const it = rowItems[rowSel];
      const label = $('.p4-row-label');
      label.style.left = `${selX + L + 34}px`;
      label.textContent = it ? (it.type === 'game' ? it.game.name : 'Biblioteca') : '';
      label.classList.remove('pop');
      label.offsetWidth;
      label.classList.add('pop');
      if (view === 'home') setArt(it && it.type === 'game' ? it.game.hero || it.game.tile : null);
      renderTeaser();
    }

    // Lo que se asoma abajo del juego elegido (al bajar se abre la ficha completa)
    function renderTeaser() {
      const box = $('.p4-teaser');
      const it = rowItems[rowSel];
      if (!it || it.type !== 'game') {
        box.innerHTML = `<div class="p4-panel wide"><div class="p4-panel-h">${icon('grid')} Biblioteca</div><div class="p4-panel-t">${games.length} juegos y aplicaciones. Presiona Enter para verlos todos.</div></div>`;
        return;
      }
      const g = it.game;
      const tp = trophiesOf(g);
      const act = [U.hours(g.playtimeMin), g.lastPlayed ? `Jugado ${U.ago(g.lastPlayed)}` : ''].filter(Boolean).join(' · ') || 'Todavía no lo juegas';
      box.innerHTML = `
        <div class="p4-panel"><div class="p4-panel-h">${icon('clock')} Tu actividad</div><div class="p4-panel-t">${esc(act)}</div></div>
        <div class="p4-panel"><div class="p4-panel-h">${icon('trophy')} Trofeos</div>${
          tp && tp.total
            ? `<div class="p4-panel-t">${tp.done} de ${tp.total} · ${Math.round((tp.done / tp.total) * 100)} %</div><div class="p4-bar"><i style="width:${(tp.done / tp.total) * 100}%"></i></div>`
            : `<div class="p4-panel-t dim">${g.type === 'steam' ? (summary.hasKey ? 'Sin datos todavía' : 'Agrega tu clave de Steam') : 'No es de Steam'}</div>`
        }</div>
        <div class="p4-panel wide"><div class="p4-panel-h">${icon('down')} Información</div><div class="p4-panel-t clamp">${esc(g.description || 'Baja para ver la ficha del juego.')}</div></div>`;
    }

    function activateRow() {
      const it = rowItems[rowSel];
      if (!it) return;
      if (it.type === 'library') openLibrary();
      else startGame(it.game);
    }

    // ---------- Fila de funciones (al subir) ----------
    function setFunc(i) {
      funcSel = (i + FUNCS.length) % FUNCS.length;
      $$('.p4-fn').forEach((b) => b.classList.toggle('sel', Number(b.dataset.i) === funcSel));
    }
    function openFunc() {
      view = 'func';
      root.classList.add('in-func');
      setArt(null);
      setFunc(funcSel);
    }
    function closeFunc() {
      root.classList.remove('in-func');
      view = 'home';
      setRow(rowSel);
    }
    function runFunc(id) {
      if (id === 'store') call('open', 'steam-store');
      else if (id === 'friends') openFriends();
      else if (id === 'profile') call('open', 'steam-profile');
      else if (id === 'party') openParty();
      else if (id === 'trophies') openTrophies();
      else if (id === 'settings') openSettings();
      else if (id === 'power') openPower();
    }
    $$('.p4-fn').forEach((b) => {
      b.addEventListener('mouseenter', () => view === 'func' && setFunc(Number(b.dataset.i)));
      b.addEventListener('click', () => {
        if (view === 'home') openFunc();
        setFunc(Number(b.dataset.i));
        runFunc(FUNCS[funcSel].id);
      });
    });

    // ---------- Pantallas (biblioteca, ficha, trofeos, grupo, ajustes) ----------
    function showScreen(name) {
      if (view !== name) stack.push(view);
      view = name;
      root.classList.toggle('in-screen', true);
      root.classList.remove('in-func');
      $$('.p4-screen').forEach((s) => {
        const on = s.classList.contains(`p4-${name === 'library' ? 'lib' : name === 'trophies' ? 'troph' : name === 'settings' ? 'set' : name}`);
        s.hidden = !on;
        if (on) {
          s.classList.remove('enter');
          s.offsetWidth;
          s.classList.add('enter');
        }
      });
    }
    function back() {
      const prev = stack.pop() || 'home';
      $$('.p4-screen').forEach((s) => (s.hidden = true));
      view = prev;
      if (prev === 'home' || prev === 'func') {
        root.classList.remove('in-screen');
        if (prev === 'func') openFunc();
        else setRow(rowSel);
      } else {
        showScreenAgain(prev);
      }
    }
    function showScreenAgain(name) {
      view = name;
      const cls = { library: 'lib', trophies: 'troph', settings: 'set' }[name] || name;
      const s = $(`.p4-${cls}`);
      if (s) s.hidden = false;
      if (name === 'game' && current) setArt(current.hero || current.tile, true);
      if (name === 'library') {
        setArt(null);
        paintLib();
      }
    }

    // ---------- Ficha del juego ----------
    let gameBtn = 0;
    let gameToken = 0;
    function openGame(g) {
      if (!g) return;
      current = g;
      showScreen('game');
      $('.p4-game').dataset.gameCurrent = g.id; // clic derecho / tecla I → imágenes de este juego
      setArt(g.hero || g.tile, true);
      const title = $('.p4g-title');
      title.innerHTML = '';
      if (g.logo) {
        const img = document.createElement('img');
        img.src = g.logo;
        img.alt = g.name;
        img.onerror = () => (title.textContent = g.name);
        title.appendChild(img);
      } else title.textContent = g.name;
      $('.p4g-meta').textContent = [typeLabel(g), U.hours(g.playtimeMin), g.lastPlayed ? `Jugado ${U.ago(g.lastPlayed)}` : ''].filter(Boolean).join('   ·   ');
      $('.p4g-desc').textContent = g.description || 'Sin descripción. Puedes escribir una en descripcion.txt, en la carpeta de personalización del juego.';
      $('[data-g="troph"]').hidden = g.type !== 'steam';
      setGameBtn(0);
      paintGameTrophies(g);
    }
    function typeLabel(g) {
      return { steam: 'Steam', exe: 'Programa', shortcut: 'Acceso directo', url: 'Otro launcher' }[g.type] || '';
    }
    async function paintGameTrophies(g) {
      const body = $('.p4g-tp-body');
      const tp = trophiesOf(g);
      if (g.type !== 'steam') {
        body.innerHTML = '<div class="p4-panel-t dim">Este juego no es de Steam, así que no tiene trofeos.</div>';
        return;
      }
      body.innerHTML = tp && tp.total
        ? `<div class="p4-panel-t">${tp.done} de ${tp.total} · ${Math.round((tp.done / tp.total) * 100)} %</div><div class="p4-bar"><i style="width:${(tp.done / tp.total) * 100}%"></i></div><div class="p4g-icons"></div>`
        : '<div class="p4-panel-t dim">Cargando…</div><div class="p4g-icons"></div>';
      const token = ++gameToken;
      const res = await call('getAchievements', g.appId);
      if (token !== gameToken || view !== 'game') return;
      if (!res || res.status !== 'ok') {
        body.innerHTML = `<div class="p4-panel-t dim small">${U.achievementMessage(res || { status: 'error' })}</div>`;
        return;
      }
      if (!(tp && tp.total))
        body.innerHTML = `<div class="p4-panel-t">${res.done} de ${res.total}</div><div class="p4-bar"><i style="width:${res.total ? (res.done / res.total) * 100 : 0}%"></i></div><div class="p4g-icons"></div>`;
      const box = body.querySelector('.p4g-icons');
      U.sortAchievements(res.list)
        .filter((a) => a.done)
        .slice(0, 8)
        .forEach((a) => {
          const d = document.createElement('div');
          d.className = 'p4g-ic';
          d.style.backgroundImage = `url("${a.icon}")`;
          d.title = a.name;
          box.appendChild(d);
        });
    }
    function setGameBtn(i) {
      const btns = $$('.p4g-actions .p4-btn').filter((b) => !b.hidden);
      gameBtn = (i + btns.length) % btns.length;
      btns.forEach((b, j) => b.classList.toggle('sel', j === gameBtn));
    }
    $$('.p4g-actions .p4-btn').forEach((b) => {
      b.addEventListener('mouseenter', () => setGameBtn($$('.p4g-actions .p4-btn').filter((x) => !x.hidden).indexOf(b)));
      b.addEventListener('click', () => (b.dataset.g === 'start' ? startGame(current) : openTrophyList(current)));
    });

    // ---------- Biblioteca ----------
    const LIB_CATS = [
      { id: 'all', label: 'Todos', icon: 'grid', filter: () => true },
      { id: 'steam', label: 'Juegos', icon: 'pad', filter: (g) => g.type === 'steam' },
      { id: 'apps', label: 'Aplicaciones', icon: 'apps', filter: (g) => g.type !== 'steam' },
      { id: 'recent', label: 'Jugados recientemente', icon: 'clock', filter: (g) => !!g.lastPlayed, mine: true },
      { id: 'troph', label: 'Con trofeos', icon: 'trophy', filter: (g) => !!trophiesOf(g), mine: true },
    ];
    const SORTS = [
      { label: 'Jugado recientemente', fn: (a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0) || a.name.localeCompare(b.name) },
      { label: 'Nombre', fn: (a, b) => a.name.localeCompare(b.name, 'es') },
      { label: 'Horas jugadas', fn: (a, b) => (b.playtimeMin || 0) - (a.playtimeMin || 0) },
    ];
    let libCat = 0;
    let libSort = 0;
    let libFocus = 'side'; // side | grid
    let libSideSel = 1; // 0 = Buscar, 1.. = categorías
    let libSel = 0;
    let libScroll = 0;
    let libList = [];
    let libQuery = '';
    const searchInput = $('.p4l-search input');

    function openLibrary() {
      showScreen('library');
      setArt(null);
      libFocus = 'grid';
      libSel = 0;
      libScroll = 0;
      paintLib();
    }
    function paintLib() {
      // Lado izquierdo
      const side = $('.p4l-side');
      const count = (c) => games.filter(c.filter).length;
      side.innerHTML = `
        <button class="p4l-it" data-s="0">${icon('search')}<span>Buscar</span></button>
        <div class="p4l-h">Este PC</div>
        ${LIB_CATS.filter((c) => !c.mine)
          .map((c) => `<button class="p4l-it" data-s="${LIB_CATS.indexOf(c) + 1}">${icon(c.icon)}<span>${c.label}</span><b>${count(c)}</b></button>`)
          .join('')}
        <div class="p4l-h user"><span class="p4-av small"><img alt="" hidden /></span>${esc(profile.name || 'Jugador')}</div>
        ${LIB_CATS.filter((c) => c.mine)
          .map((c) => `<button class="p4l-it" data-s="${LIB_CATS.indexOf(c) + 1}">${icon(c.icon)}<span>${c.label}</span><b>${count(c)}</b></button>`)
          .join('')}`;
      side.querySelectorAll('.p4-av').forEach(paintAvatar);
      side.querySelectorAll('.p4l-it').forEach((b) => {
        const s = Number(b.dataset.s);
        b.classList.toggle('on', s - 1 === libCat);
        b.classList.toggle('sel', libFocus === 'side' && s === libSideSel);
        b.addEventListener('click', () => {
          libFocus = 'side';
          libSideSel = s;
          pickSide();
        });
      });
      // Lista
      const cat = LIB_CATS[libCat];
      const q = libQuery.trim().toLowerCase();
      libList = games.filter(cat.filter).filter((g) => !q || g.name.toLowerCase().includes(q));
      libList.sort(SORTS[libSort].fn);
      $('.p4l-sort').innerHTML = `<span>${SORTS[libSort].label}</span>${icon('down')}`;
      $('.p4l-section').textContent = q ? `Resultados para "${libQuery}"` : `${cat.label} · ${libList.length}`;
      const grid = $('.p4l-grid');
      grid.innerHTML = '';
      libList.forEach((g, i) => {
        const c = document.createElement('button');
        c.className = 'p4l-cell';
        c.dataset.i = i;
        c.dataset.gameId = g.id;
        const art = tileArt(g);
        const name = document.createElement('div');
        name.className = 'p4l-name';
        name.textContent = g.name;
        const sub = document.createElement('div');
        sub.className = 'p4l-sub';
        sub.textContent = U.hours(g.playtimeMin) || typeLabel(g);
        const txt = document.createElement('div');
        txt.className = 'p4l-txt';
        txt.append(name, sub);
        c.append(art, txt);
        c.addEventListener('mouseenter', () => {
          libFocus = 'grid';
          setLib(i, false);
        });
        c.addEventListener('click', () => openGame(g));
        grid.appendChild(c);
      });
      if (!libList.length) grid.innerHTML = '<div class="p4l-empty">No hay nada aquí.</div>';
      setLib(Math.min(libSel, Math.max(0, libList.length - 1)));
    }
    function setLib(i, scroll = true) {
      libSel = Math.max(0, Math.min(libList.length - 1, i));
      $$('.p4l-cell').forEach((c) => c.classList.toggle('sel', libFocus === 'grid' && Number(c.dataset.i) === libSel));
      $$('.p4l-it').forEach((b) => b.classList.toggle('sel', libFocus === 'side' && Number(b.dataset.s) === libSideSel));
      if (scroll) {
        const row = Math.floor(libSel / LIB_COLS);
        const per = Math.floor(LIB_VIEW_H / LIB_ROW_H);
        if (row < libScroll) libScroll = row;
        else if (row >= libScroll + per) libScroll = row - per + 1;
        $('.p4l-grid').style.transform = `translateY(${-libScroll * LIB_ROW_H}px)`;
      }
    }
    function pickSide() {
      if (libSideSel === 0) {
        $('.p4l-search').hidden = false;
        searchInput.focus();
        searchInput.select();
      } else {
        libCat = libSideSel - 1;
        libSel = 0;
        libScroll = 0;
      }
      paintLib();
    }
    function sideButtons() {
      return $$('.p4l-it').map((b) => Number(b.dataset.s));
    }
    searchInput.addEventListener('input', () => {
      libQuery = searchInput.value;
      libSel = 0;
      libScroll = 0;
      paintLib();
      searchInput.focus();
    });
    searchInput.addEventListener('keydown', (e) => {
      e.stopPropagation(); // al escribir no se mueve el menú
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        searchInput.blur();
        libFocus = 'grid';
        setLib(0);
      } else if (e.key === 'Escape') {
        searchInput.blur();
        if (!libQuery) $('.p4l-search').hidden = true;
      }
    });
    $('.p4l-sort').addEventListener('click', () => {
      libSort = (libSort + 1) % SORTS.length;
      paintLib();
    });
    $('.p4l-viewport').addEventListener('wheel', (e) => {
      if (view !== 'library' || Math.abs(e.deltaY) < 10) return;
      const maxRow = Math.max(0, Math.ceil(libList.length / LIB_COLS) - Math.floor(LIB_VIEW_H / LIB_ROW_H));
      libScroll = Math.max(0, Math.min(maxRow, libScroll + (e.deltaY > 0 ? 1 : -1)));
      $('.p4l-grid').style.transform = `translateY(${-libScroll * LIB_ROW_H}px)`;
    });
    function libKey(k) {
      if (libFocus === 'side') {
        const order = sideButtons();
        const at = order.indexOf(libSideSel);
        if (k === 'ArrowDown') libSideSel = order[Math.min(order.length - 1, at + 1)];
        else if (k === 'ArrowUp') libSideSel = order[Math.max(0, at - 1)];
        else if (k === 'ArrowRight' && libList.length) libFocus = 'grid';
        else if (k === 'Enter') return pickSide();
        else if (k === 'Escape' || k === 'Backspace') return back();
        setLib(libSel, false);
        return;
      }
      if (k === 'ArrowRight') setLib(libSel + 1);
      else if (k === 'ArrowLeft') {
        if (libSel % LIB_COLS === 0) {
          libFocus = 'side';
          libSideSel = libCat + 1;
          setLib(libSel, false);
        } else setLib(libSel - 1);
      } else if (k === 'ArrowDown') setLib(libSel + LIB_COLS);
      else if (k === 'ArrowUp') {
        if (libSel >= LIB_COLS) setLib(libSel - LIB_COLS);
      } else if (k === 'Enter' && libList[libSel]) openGame(libList[libSel]);
      else if (k === 's' || k === 'S') {
        libSort = (libSort + 1) % SORTS.length;
        paintLib();
      } else if (k === 'Escape' || k === 'Backspace') back();
    }

    // ---------- Trofeos ----------
    let tMode = 'games'; // games | list
    let tSel = 0;
    let tRows = [];
    let tToken = 0;
    const T_ROW_H = 128;
    const T_VIEW_H = 590;
    function openTrophies() {
      showScreen('trophies');
      setArt(null);
      tMode = 'games';
      tSel = 0;
      paintTrophyGames();
    }
    function paintTrophyCard() {
      const pct = summary.total ? Math.round((summary.done / summary.total) * 100) : 0;
      $('.p4t-sum').textContent = summary.hasKey ? `${summary.done || 0} trofeos de ${summary.total || 0} · ${pct} %` : 'Sin clave de Steam';
      $('.p4t-card .p4-bar i').style.width = `${pct}%`;
    }
    function paintTrophyGames() {
      paintTrophyCard();
      const msg = $('.p4t-msg');
      const list = $('.p4t-list');
      list.innerHTML = '';
      list.dataset.first = '0';
      list.style.transform = '';
      $('.p4t-head').textContent = 'Tus juegos';
      if (!summary.hasKey) {
        msg.hidden = false;
        msg.innerHTML = U.achievementMessage({ status: 'no-key' });
        tRows = [];
        return;
      }
      msg.hidden = true;
      tRows = games
        .filter((g) => trophiesOf(g) && trophiesOf(g).total)
        .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
      if (!tRows.length) {
        msg.hidden = false;
        msg.innerHTML = 'Todavía no hay datos de trofeos. Se cargan solos en unos minutos.';
      }
      tRows.forEach((g, i) => {
        const tp = trophiesOf(g);
        const r = document.createElement('button');
        r.className = 'p4t-row';
        r.dataset.i = i;
        r.dataset.gameId = g.id;
        const art = tileArt(g);
        const pct = Math.round((tp.done / tp.total) * 100);
        const info = document.createElement('div');
        info.className = 'p4t-info';
        info.innerHTML = `<div class="p4t-gname"></div><div class="p4t-prog"><div class="p4-bar"><i style="width:${pct}%"></i></div><span>${pct} %</span></div>`;
        info.querySelector('.p4t-gname').textContent = g.name;
        const cnt = document.createElement('div');
        cnt.className = 'p4t-count';
        cnt.innerHTML = `${icon('trophy')}<span>${tp.done} / ${tp.total}</span>`;
        r.append(art, info, cnt);
        r.addEventListener('mouseenter', () => setTrophy(i, false));
        r.addEventListener('click', () => openTrophyList(g));
        list.appendChild(r);
      });
      setTrophy(Math.min(tSel, tRows.length - 1));
    }
    async function openTrophyList(g) {
      if (!g) return;
      if (view !== 'trophies') {
        showScreen('trophies');
        setArt(null);
      }
      paintTrophyCard();
      tMode = 'list';
      current = g;
      tSel = 0;
      const msg = $('.p4t-msg');
      const list = $('.p4t-list');
      list.innerHTML = '';
      list.dataset.first = '0';
      list.style.transform = '';
      $('.p4t-head').textContent = g.name;
      msg.hidden = false;
      msg.innerHTML = '<div class="p4-spin"></div>Cargando trofeos…';
      const token = ++tToken;
      const res = (await call('getAchievements', g.appId)) || { status: 'error' };
      if (token !== tToken || view !== 'trophies') return;
      if (res.status !== 'ok') {
        msg.innerHTML = U.achievementMessage(res);
        tRows = [];
        return;
      }
      msg.hidden = true;
      tRows = U.sortAchievements(res.list);
      $('.p4t-head').textContent = `${g.name} · ${res.done} / ${res.total}`;
      tRows.forEach((a, i) => {
        const t = U.achievementTexts(a);
        const r = document.createElement('div');
        r.className = `p4t-row ach${a.done ? '' : ' locked'}`;
        r.dataset.i = i;
        r.innerHTML = `<div class="p4t-aic" style="background-image:url('${a.done ? a.icon : a.iconGray || a.icon}')"></div>
          <div class="p4t-info"><div class="p4t-gname"></div><div class="p4t-adesc"></div></div>
          <div class="p4t-when"><div></div><small></small></div>`;
        r.querySelector('.p4t-gname').textContent = t.name;
        r.querySelector('.p4t-adesc').textContent = t.description;
        r.querySelector('.p4t-when div').textContent = a.done ? t.date : 'Bloqueado';
        r.querySelector('.p4t-when small').textContent = a.percent != null ? `${Number(a.percent).toFixed(1).replace('.', ',')} %` : '';
        r.addEventListener('mouseenter', () => setTrophy(i, false));
        list.appendChild(r);
      });
      setTrophy(0);
    }
    function setTrophy(i, scroll = true) {
      if (!tRows.length) return;
      tSel = Math.max(0, Math.min(tRows.length - 1, i));
      $$('.p4t-row').forEach((r) => r.classList.toggle('sel', Number(r.dataset.i) === tSel));
      if (scroll) {
        const per = Math.floor(T_VIEW_H / T_ROW_H);
        let f = Number($('.p4t-list').dataset.first || 0);
        if (tSel < f) f = tSel;
        else if (tSel >= f + per) f = tSel - per + 1;
        f = Math.max(0, Math.min(f, Math.max(0, tRows.length - per)));
        $('.p4t-list').dataset.first = String(f);
        $('.p4t-list').style.transform = `translateY(${-f * T_ROW_H}px)`;
      }
    }
    $('.p4t-viewport').addEventListener('wheel', (e) => {
      if (view === 'trophies' && Math.abs(e.deltaY) > 10) setTrophy(tSel + (e.deltaY > 0 ? 1 : -1));
    });
    function trophyKey(k) {
      if (k === 'ArrowDown') setTrophy(tSel + 1);
      else if (k === 'ArrowUp') setTrophy(tSel - 1);
      else if (k === 'Enter' && tMode === 'games' && tRows[tSel]) openTrophyList(tRows[tSel]);
      else if (k === 'Escape' || k === 'Backspace') {
        // Si vinimos de la ficha del juego, volvemos a ella; si no, a la lista de juegos
        if (tMode === 'list' && stack[stack.length - 1] !== 'game') {
          tMode = 'games';
          tSel = 0;
          $('.p4t-list').dataset.first = '0';
          paintTrophyGames();
        } else back();
      }
    }

    // ---------- Amigos (de Steam) ----------
    // La lista se pide a Steam al abrir y cada 30 segundos mientras está a la vista.
    let friends = { status: 'loading', list: [] };
    let friendsAt = 0;
    let fSel = 0;
    let fTimer = null;
    const friendClass = U.friendClass;
    const friendStatus = U.friendStatus;
    function friendAvatar(f, size = '') {
      return `<span class="p4f-av ${size} ${friendClass(f)}">${f.avatar ? `<img src="${esc(f.avatar)}" alt="" />` : `<b>${esc((f.name || '?').trim().charAt(0).toUpperCase())}</b>`}<i></i></span>`;
    }
    const friendsMessage = () => U.friendsMessage(friends.status);
    async function loadFriends() {
      friendsAt = Date.now();
      const res = (await call('getFriends')) || { status: 'error', list: [] };
      friendsAt = Date.now();
      // Si falla una actualización, se queda la última lista buena
      if (res.status === 'ok' || friends.status !== 'ok' || res.status !== 'error') friends = res;
      if (view === 'friends') paintFriends();
      if (qmOpen && QM[qmSel] && QM[qmSel].id === 'friends') renderQmSub();
    }
    function openFriends() {
      showScreen('friends');
      setArt(null);
      fSel = 0;
      fBtn = 0;
      $('.p4f-viewport').scrollTop = 0;
      paintFriends();
      if (Date.now() - friendsAt > 5000) loadFriends();
      clearInterval(fTimer);
      fTimer = setInterval(() => (view === 'friends' ? loadFriends() : clearInterval(fTimer)), 30000);
    }
    function paintFriends() {
      const list = $('.p4f-list');
      const msg = $('.p4f-msg');
      const rows = friends.list || [];
      const online = rows.filter((f) => f.state !== 0).length;
      $('.p4f-count').innerHTML = friends.status === 'ok' ? `<b>${online}</b> en línea · ${rows.length} ${rows.length === 1 ? 'amigo' : 'amigos'}` : '';
      if (friends.status !== 'ok' || !rows.length) {
        const m = friendsMessage();
        list.innerHTML = '';
        $('.p4f-detail').innerHTML = '';
        msg.hidden = false;
        msg.innerHTML = `${friends.status === 'loading' ? '<div class="p4-spin"></div>' : icon('people', 'p4p-big')}<div class="p4p-t">${esc(m.t)}</div><div class="p4p-d">${esc(m.d)}</div>${m.btn ? `<div class="p4p-btns"><button class="p4-btn sel" data-fb="${m.btn[0]}"><span>${m.btn[1]}</span></button></div>` : ''}`;
        const b = msg.querySelector('[data-fb]');
        if (b) b.addEventListener('click', () => call('open', b.dataset.fb));
        return;
      }
      msg.hidden = true;
      const selId = list.querySelector('.p4f-row.sel') && list.querySelector('.p4f-row.sel').dataset.id;
      let html = '';
      for (const [g, title] of U.FRIEND_GROUPS) {
        const items = rows.map((f, i) => [f, i]).filter(([f]) => U.friendGroup(f) === g);
        if (!items.length) continue;
        html += `<div class="p4f-head">${title} <span>${items.length}</span></div>`;
        html += items.map(([f, i]) => `<button class="p4f-row ${friendClass(f)}" data-i="${i}" data-id="${esc(f.id)}">${friendAvatar(f)}<span class="p4f-tx"><span class="p4f-n">${esc(f.name)}</span><span class="p4f-s">${esc(friendStatus(f))}</span></span></button>`).join('');
      }
      list.innerHTML = html;
      list.querySelectorAll('.p4f-row').forEach((r) => {
        r.addEventListener('mouseenter', () => setFriend(Number(r.dataset.i), false));
        r.addEventListener('click', () => openFriendProfile(rows[Number(r.dataset.i)]));
      });
      // Mantiene marcado al mismo amigo aunque la lista se reordene
      const keep = selId ? rows.findIndex((f) => f.id === selId) : -1;
      setFriend(keep >= 0 ? keep : Math.min(fSel, rows.length - 1), keep < 0);
    }
    function setFriend(i, scroll = true) {
      const rows = friends.list || [];
      if (!rows.length) return;
      fSel = Math.max(0, Math.min(rows.length - 1, i));
      let selEl = null;
      $$('.p4f-row').forEach((r) => {
        const on = Number(r.dataset.i) === fSel;
        r.classList.toggle('sel', on);
        if (on) selEl = r;
      });
      if (scroll && selEl) selEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      const f = rows[fSel];
      $('.p4f-detail').innerHTML = `${friendAvatar(f, 'big')}<div class="p4f-dn">${esc(f.name)}</div><div class="p4f-ds ${friendClass(f)}">${esc(friendStatus(f))}</div>
        <div class="p4f-btns"><button class="p4-btn${fBtn === 0 ? ' sel' : ''}" data-fp="0">${icon('person')}<span>Ver perfil</span></button>
        <button class="p4-btn${fBtn === 1 ? ' sel' : ''}" data-fp="1">${icon('chat')}<span>Enviar mensaje</span></button></div>`;
      $$('.p4f-detail [data-fp]').forEach((b) => {
        b.addEventListener('mouseenter', () => setFBtn(Number(b.dataset.fp)));
        b.addEventListener('click', () => (b.dataset.fp === '1' ? openFriendChat(f) : openFriendProfile(f)));
      });
    }
    // El orden de la pantalla (los grupos) es el mismo de la lista, así que ↑ ↓ siguen el índice
    function openFriendProfile(f) {
      if (!f || !f.id) return;
      call('open', `steam-user:${f.id}`);
      ctx.toast(`Se abrió el perfil de ${f.name} en Steam`);
    }
    function openFriendChat(f) {
      if (!f || !f.id) return;
      call('open', `steam-chat:${f.id}`);
      ctx.toast(`Se abrió el chat con ${f.name} en Steam`);
    }
    // Botón marcado a la derecha: 0 = Ver perfil, 1 = Enviar mensaje (← → para cambiar)
    let fBtn = 0;
    function setFBtn(i) {
      fBtn = i ? 1 : 0;
      $$('.p4f-detail [data-fp]').forEach((b) => b.classList.toggle('sel', Number(b.dataset.fp) === fBtn));
    }
    function friendsKey(k) {
      const rows = friends.list || [];
      if (k === 'ArrowDown') setFriend(fSel + 1);
      else if (k === 'ArrowUp') setFriend(fSel - 1);
      else if (k === 'PageDown') setFriend(fSel + 6);
      else if (k === 'PageUp') setFriend(fSel - 6);
      else if (k === 'ArrowRight') setFBtn(1);
      else if (k === 'ArrowLeft') setFBtn(0);
      else if (k === 'Enter') {
        if (rows.length && friends.status === 'ok') (fBtn ? openFriendChat : openFriendProfile)(rows[fSel]);
        else {
          const b = $('.p4f-msg [data-fb]');
          if (b) b.click();
        }
      } else if (k === 'Escape' || k === 'Backspace') {
        clearInterval(fTimer);
        back();
      }
    }

    // ---------- Grupo (Discord) ----------
    function openParty() {
      showScreen('party');
      setArt(null);
      partyBtn = 0;
      renderParty();
    }
    function renderDiscord(s) {
      discord = s || discord;
      const n = discord.status === 'ok' && discord.channel ? discord.members.length : 0;
      $('.p4-st-party').hidden = !n;
      $('.p4-st-party b').textContent = String(n);
      if (view === 'party') renderParty();
      if (qmOpen && QM[qmSel] && QM[qmSel].id === 'party') renderQmSub();
    }
    function partyMembersHtml(big) {
      return discord.members
        .map(
          (m) => `<div class="p4p-m${m.speaking ? ' talking' : ''}${big ? '' : ' small'}">
            <span class="p4p-av" style="background-image:url('${m.avatar}')"></span>
            <span class="p4p-n">${esc(m.name)}</span>
            ${m.deafened ? icon('deaf', 'p4p-flag') : m.muted ? icon('micOff', 'p4p-flag') : ''}
          </div>`
        )
        .join('');
    }
    function partyStatusText() {
      switch (discord.status) {
        case 'no-config':
          return { t: 'Conecta tu Discord', d: 'Para ver tu canal de voz y quiénes están contigo, conecta tu Discord. Se hace aquí mismo y toma unos 2 minutos.', btns: [['discord', 'Conectar Discord']] };
        case 'no-discord':
          return { t: 'Discord no está abierto', d: 'Abre la app de escritorio de Discord en tu PC. NostalHub se conecta sola cuando la detecte.', btns: [['discord-app', 'Abrir Discord']] };
        case 'connecting':
          return { t: 'Conectando con Discord…', d: '', btns: [] };
        case 'need-auth':
          return { t: 'Falta un permiso', d: 'Discord te va a mostrar una ventana para que aceptes que NostalHub vea tu canal de voz. Solo se pide una vez.', btns: [['auth', 'Conectar con Discord']] };
        case 'authorizing':
          return { t: 'Acepta en Discord', d: 'Revisa la ventana que apareció en Discord y presiona Autorizar.', btns: [] };
        case 'error':
          return { t: 'No se pudo conectar', d: discord.message || 'Revisa los datos de tu aplicación de Discord.', btns: [['auth', 'Intentar de nuevo'], ['discord', 'Conectar Discord']] };
        default:
          return null;
      }
    }
    let partyBtn = 0;
    function renderParty() {
      const body = $('.p4p-body');
      const st = partyStatusText();
      if (st) {
        body.innerHTML = `<div class="p4p-empty">${icon('headset', 'p4p-big')}<div class="p4p-t">${st.t}</div><div class="p4p-d">${esc(st.d)}</div>
          <div class="p4p-btns">${st.btns.map(([id, label], i) => `<button class="p4-btn${i === partyBtn ? ' sel' : ''}" data-pb="${id}"><span>${label}</span></button>`).join('')}</div></div>`;
      } else if (!discord.channel) {
        body.innerHTML = `<div class="p4p-empty">${icon('headset', 'p4p-big')}<div class="p4p-t">No estás en un canal de voz</div><div class="p4p-d">Cuando entres a un canal de voz en Discord, aquí vas a ver quiénes están contigo.</div></div>`;
      } else {
        body.innerHTML = `<div class="p4p-card">
            <div class="p4p-chan">${icon('headset')}<div><div class="p4p-cname">${esc(discord.channel.name)}</div><div class="p4p-guild">${esc(discord.channel.guild || 'Mensaje directo')} · ${discord.members.length} ${discord.members.length === 1 ? 'persona' : 'personas'}</div></div></div>
            <div class="p4p-members">${partyMembersHtml(true)}</div>
          </div>`;
      }
      body.querySelectorAll('[data-pb]').forEach((b, i) => {
        b.addEventListener('mouseenter', () => setPartyBtn(i));
        b.addEventListener('click', () => partyAction(b.dataset.pb));
      });
    }
    function setPartyBtn(i) {
      const btns = $$('[data-pb]');
      if (!btns.length) return;
      partyBtn = (i + btns.length) % btns.length;
      btns.forEach((b, j) => b.classList.toggle('sel', j === partyBtn));
    }
    function partyAction(id) {
      if (id === 'auth') call('discordAuthorize').then((s) => s && renderDiscord(s));
      else call('open', id);
    }
    function partyKey(k) {
      if (k === 'ArrowRight' || k === 'ArrowDown') setPartyBtn(partyBtn + 1);
      else if (k === 'ArrowLeft' || k === 'ArrowUp') setPartyBtn(partyBtn - 1);
      else if (k === 'Enter') {
        const b = $$('[data-pb]')[partyBtn];
        if (b) partyAction(b.dataset.pb);
      } else if (k === 'Escape' || k === 'Backspace') back();
    }

    // ---------- Ajustes ----------
    let setLevel = 'cats'; // cats | items
    let setCat = 0;
    let setSel = 0;
    const CAT_ICONS = { general: 'gear', games: 'pad', screen: 'screen', sound: 'speaker', accounts: 'person', files: 'folder' };
    async function openSettings() {
      showScreen('settings');
      setArt(null);
      menuModel = (await call('getMenu')) || [];
      setLevel = 'cats';
      setSel = 0;
      paintSettings();
    }
    function paintSettings() {
      const list = $('.p4s-list');
      list.innerHTML = '';
      list.classList.remove('slide');
      list.offsetWidth;
      list.classList.add('slide');
      $('.p4-set .p4-title').textContent = setLevel === 'cats' ? 'Ajustes' : menuModel[setCat].title;
      const rows = setLevel === 'cats' ? menuModel : menuModel[setCat].items;
      rows.forEach((r, i) => {
        const b = document.createElement('button');
        b.className = 'p4s-row';
        b.dataset.i = i;
        if (setLevel === 'cats') {
          b.innerHTML = `${icon(CAT_ICONS[r.id] || 'gear')}<span class="p4s-l"></span>`;
          b.querySelector('.p4s-l').textContent = r.title;
        } else {
          const val =
            r.type === 'toggle'
              ? `<span class="p4s-check${r.value ? ' on' : ''}">${r.value ? icon('check') : ''}</span>`
              : r.type === 'choice'
                ? `<span class="p4s-v">${esc(U.optionValueText(r))}</span>`
                : '';
          b.innerHTML = `<span class="p4s-l"></span>${val}`;
          b.querySelector('.p4s-l').textContent = r.label;
        }
        b.addEventListener('mouseenter', () => setSetting(i));
        b.addEventListener('click', () => {
          setSetting(i);
          pickSetting();
        });
        list.appendChild(b);
      });
      setSetting(Math.min(setSel, rows.length - 1));
    }
    function setSetting(i) {
      const rows = $$('.p4s-row');
      if (!rows.length) return;
      setSel = (i + rows.length) % rows.length;
      rows.forEach((r) => r.classList.toggle('sel', Number(r.dataset.i) === setSel));
      const it = setLevel === 'items' ? menuModel[setCat].items[setSel] : null;
      $('.p4s-desc').textContent = it ? it.desc || '' : '';
    }
    async function pickSetting() {
      if (setLevel === 'cats') {
        setCat = setSel;
        setLevel = 'items';
        setSel = 0;
        return paintSettings();
      }
      const it = menuModel[setCat].items[setSel];
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
      if (view === 'settings') paintSettings();
      if (qmOpen) renderQmSub();
    }
    function settingsKey(k) {
      if (k === 'ArrowDown') setSetting(setSel + 1);
      else if (k === 'ArrowUp') setSetting(setSel - 1);
      else if (k === 'Enter' || (k === 'ArrowRight' && setLevel === 'cats')) pickSetting();
      else if (k === 'Escape' || k === 'Backspace' || (k === 'ArrowLeft' && setLevel === 'items')) {
        if (setLevel === 'items') {
          setLevel = 'cats';
          setSel = setCat;
          paintSettings();
        } else if (k !== 'ArrowLeft') back();
      }
    }

    // ---------- Ventanitas (Energía y listas para elegir) ----------
    let pop = null; // { items, sel }
    function openPop(title, items) {
      pop = { items, sel: Math.max(0, items.findIndex((x) => x.on)) };
      $('.p4-pop-title').textContent = title;
      const list = $('.p4-pop-list');
      list.innerHTML = '';
      items.forEach((it, i) => {
        const b = document.createElement('button');
        b.className = 'p4-pop-it';
        b.dataset.i = i;
        b.innerHTML = `${it.icon ? icon(it.icon) : `<span class="p4-radio${it.on ? ' on' : ''}"></span>`}<span></span>`;
        b.querySelector('span:last-child').textContent = it.label;
        b.addEventListener('mouseenter', () => setPop(i));
        b.addEventListener('click', () => choosePop(i));
        list.appendChild(b);
      });
      $('.p4-pop').hidden = false;
      setPop(pop.sel);
    }
    function setPop(i) {
      if (!pop) return;
      pop.sel = (i + pop.items.length) % pop.items.length;
      $$('.p4-pop-it').forEach((b) => b.classList.toggle('sel', Number(b.dataset.i) === pop.sel));
    }
    function closePop() {
      pop = null;
      $('.p4-pop').hidden = true;
    }
    function choosePop(i) {
      const it = pop && pop.items[i];
      closePop();
      if (it && it.run) it.run();
    }
    $('.p4-pop').addEventListener('pointerdown', (e) => {
      if (e.target === e.currentTarget) closePop();
    });
    function openPower() {
      openPop('Opciones de energía', [
        { icon: 'swap', label: 'Cambiar de consola', run: () => ctx.openSelector() },
        { icon: 'restart', label: 'Reiniciar NostalHub', run: () => call('runMenu', 'reload') },
        { icon: 'power', label: 'Apagar NostalHub', run: () => call('runMenu', 'quit') },
      ]);
    }

    // ---------- Menú rápido ----------
    const QM = [
      { id: 'sound', label: 'Sonido', icon: 'speaker' },
      { id: 'music', label: 'Música', icon: 'music' },
      { id: 'party', label: 'Grupo', icon: 'headset' },
      { id: 'friends', label: 'Amigos', icon: 'people' },
      { sep: true },
      { id: 'random', label: 'Juego al azar', icon: 'dice' },
      { id: 'library', label: 'Biblioteca', icon: 'grid' },
      { id: 'consoles', label: 'Cambiar de consola', icon: 'swap' },
      { sep: true },
      { id: 'settings', label: 'Ajustes', icon: 'toolbox' },
      { id: 'power', label: 'Energía', icon: 'power' },
    ];
    let qmOpen = false;
    let qmSel = 0;
    let qmCol = 'list'; // list | sub
    let qmSubSel = 0;
    async function openQm() {
      if (qmOpen || view === 'playing') return;
      qmOpen = true;
      menuModel = (await call('getMenu')) || menuModel;
      const qm = $('.p4-qm');
      qm.hidden = false;
      qm.classList.remove('leave');
      qmCol = 'list';
      renderQm();
      if (Date.now() - friendsAt > 20000) loadFriends();
    }
    async function closeQm() {
      if (!qmOpen) return;
      qmOpen = false;
      const qm = $('.p4-qm');
      qm.classList.add('leave');
      await wait(220);
      if (!qmOpen) qm.hidden = true;
      qm.classList.remove('leave');
    }
    function renderQm() {
      const list = $('.p4-qm-list');
      list.innerHTML = '';
      QM.forEach((q, i) => {
        if (q.sep) {
          list.insertAdjacentHTML('beforeend', '<div class="p4-qm-sep"></div>');
          return;
        }
        const b = document.createElement('button');
        b.className = 'p4-qm-it';
        b.dataset.i = i;
        b.innerHTML = `${icon(q.icon)}<span>${q.label}</span>`;
        if (q.id === 'party' && discord.channel && discord.status === 'ok') b.insertAdjacentHTML('beforeend', `<b>${discord.members.length}</b>`);
        b.addEventListener('mouseenter', () => {
          qmCol = 'list';
          setQm(i);
        });
        b.addEventListener('click', () => qmActivate(i));
        list.appendChild(b);
      });
      setQm(qmSel);
    }
    function setQm(i) {
      const ids = QM.map((q, j) => (q.sep ? -1 : j)).filter((j) => j >= 0);
      if (!ids.includes(i)) i = ids[0];
      qmSel = i;
      $$('.p4-qm-it').forEach((b) => b.classList.toggle('sel', qmCol === 'list' && Number(b.dataset.i) === qmSel));
      qmSubSel = 0;
      renderQmSub();
    }
    function moveQm(dir) {
      const ids = QM.map((q, j) => (q.sep ? -1 : j)).filter((j) => j >= 0);
      const at = ids.indexOf(qmSel);
      setQm(ids[(at + dir + ids.length) % ids.length]);
    }
    function soundItems() {
      const sec = menuModel.find((s) => s.id === 'sound');
      return sec ? sec.items : [];
    }
    // Columna de la derecha: opciones de lo que está marcado
    let qmSubItems = [];
    function renderQmSub() {
      const box = $('.p4-qm-sub');
      const q = QM[qmSel];
      qmSubItems = [];
      box.innerHTML = '';
      if (!q) return;
      const addBtn = (html, run, cls = '') => {
        const b = document.createElement('button');
        b.className = `p4-qm-sb ${cls}`;
        b.innerHTML = html;
        const idx = qmSubItems.length;
        b.dataset.i = idx;
        b.addEventListener('mouseenter', () => {
          qmCol = 'sub';
          setQmSub(idx);
        });
        b.addEventListener('click', () => run());
        box.appendChild(b);
        qmSubItems.push({ el: b, run });
      };
      if (q.id === 'sound') {
        soundItems().forEach((it) => {
          const val = it.type === 'toggle' ? `<span class="p4s-check${it.value ? ' on' : ''}">${it.value ? icon('check') : ''}</span>` : `<span class="p4s-v">${esc(U.optionValueText(it))}</span>`;
          addBtn(`<span class="p4s-l">${esc(it.label)}</span>${val}`, () => runOption(it, U.optionNextValue(it, 1)));
        });
      } else if (q.id === 'music') {
        // Música: la canción con su barra, lo que viene y (con Spotify conectado) aleatorio, repetir, me gusta…
        const v = U.spotifyView(spotify);
        const info = document.createElement('div');
        info.className = 'p4-qm-song';
        info.innerHTML = `<div class="p4-qm-cover"${v.cover ? ` style="background-image:url('${v.cover}')"` : ''}>${v.cover ? '' : icon('music')}</div><div class="p4-qm-stx"><div class="p4-qm-app">${esc(v.app)}</div><div class="p4-qm-st">${esc(v.title)}</div><div class="p4-qm-sa">${esc(v.artist)}</div>${U.progressHtml(v, 'p4-qm-prog')}</div>`;
        box.appendChild(info);
        if (v.next) {
          const nx = document.createElement('div');
          nx.className = 'p4-qm-next';
          nx.innerHTML = `<small>Siguiente</small><span>${esc(U.nextText(v))}</span>`;
          box.appendChild(nx);
        }
        const row = (n) => {
          const r = document.createElement('div');
          r.className = 'p4-qm-btnrow';
          [...box.children].slice(-n).forEach((b) => r.appendChild(b));
          box.appendChild(r);
          return r;
        };
        if (v.on) {
          addBtn(`${icon('prev')}`, () => call('spotifyControl', 'prev'), 'round');
          addBtn(`${icon(v.playing ? 'pause' : 'play')}`, () => {
            call('spotifyControl', 'toggle');
            if (spotify) renderSpotify({ ...spotify, playing: !spotify.playing });
          }, 'round big');
          addBtn(`${icon('next')}`, () => call('spotifyControl', 'next'), 'round');
          row(3);
        }
        const acts = U.musicActions(v);
        acts.forEach((a) => {
          if (a.id === 'voldown' || a.id === 'volup') return;
          addBtn(`${U.npIcon(a.icon)}<span class="p4s-l">${esc(a.label)}</span>${a.value && a.id !== 'like' ? `<span class="p4s-v">${esc(a.value)}</span>` : ''}`, () => U.musicRun(api, a.id, v, ctx.toast), a.on ? 'on' : '');
          if (a.id === 'like' && acts.some((x) => x.id === 'volup')) {
            addBtn(`${U.npIcon('volDown')}`, () => U.musicRun(api, 'voldown', v, ctx.toast), 'round');
            addBtn(`${U.npIcon('volUp')}`, () => U.musicRun(api, 'volup', v, ctx.toast), 'round');
            const r = row(2);
            const lbl = document.createElement('span');
            lbl.className = 'p4-qm-vol';
            lbl.textContent = `Volumen ${v.volume} %`;
            r.insertBefore(lbl, r.lastChild);
          }
        });
        if (v.appId !== 'auto') addBtn(`${icon('music')}<span>Abrir ${esc(v.app)}</span>`, () => call('spotifyControl', 'open'));
        if (!v.api && v.appId === 'spotify') addBtn(`${U.npIcon('queue')}<span>Conectar Spotify para ver la cola</span>`, () => (closeQm(), call('open', 'setup-spotify')));
      } else if (q.id === 'party') {
        const head = document.createElement('div');
        head.className = 'p4-qm-party';
        if (discord.status === 'ok' && discord.channel) {
          head.innerHTML = `<div class="p4-qm-st">${esc(discord.channel.name)}</div><div class="p4-qm-sa">${esc(discord.channel.guild || 'Mensaje directo')}</div><div class="p4p-members small">${partyMembersHtml(false)}</div>`;
        } else {
          const st = partyStatusText();
          head.innerHTML = `<div class="p4-qm-st">${st ? st.t : 'No estás en un canal de voz'}</div>`;
        }
        box.appendChild(head);
        addBtn(`${icon('headset')}<span>Ver grupo</span>`, () => {
          closeQm();
          openParty();
        });
      } else if (q.id === 'friends') {
        // Solo los conectados (los que juegan primero), como en el menú rápido de la PS4
        const online = (friends.list || []).filter((f) => f.state !== 0);
        if (friends.status !== 'ok' || !online.length) {
          const info = document.createElement('div');
          info.className = 'p4-qm-party';
          info.innerHTML = `<div class="p4-qm-st">${friends.status === 'loading' ? 'Cargando amigos…' : friends.status === 'ok' ? 'No hay amigos en línea' : esc(friendsMessage().t)}</div>`;
          box.appendChild(info);
        }
        online.slice(0, 8).forEach((f) => addBtn(`${friendAvatar(f, 'small')}<span class="p4f-qtx"><span class="p4f-qn">${esc(f.name)}</span><span class="p4f-qs ${friendClass(f)}">${esc(friendStatus(f))}</span></span>`, () => openFriendProfile(f), 'p4f-qrow'));
        addBtn(`${icon('people')}<span>${online.length > 8 ? `Ver todos (${online.length} en línea)` : 'Ver todos los amigos'}</span>`, () => {
          closeQm();
          goFromQm(openFriends);
        });
        if (friends.status !== 'loading' && Date.now() - friendsAt > 20000) loadFriends();
      } else if (q.id === 'power') {
        addBtn(`${icon('swap')}<span>Cambiar de consola</span>`, () => ctx.openSelector());
        addBtn(`${icon('restart')}<span>Reiniciar NostalHub</span>`, () => call('runMenu', 'reload'));
        addBtn(`${icon('power')}<span>Apagar NostalHub</span>`, () => call('runMenu', 'quit'));
      }
      setQmSub(qmSubSel);
    }
    function setQmSub(i) {
      if (!qmSubItems.length) return;
      qmSubSel = (i + qmSubItems.length) % qmSubItems.length;
      qmSubItems.forEach((s, j) => s.el.classList.toggle('sel', qmCol === 'sub' && j === qmSubSel));
      if (qmCol === 'sub' && qmSubItems[qmSubSel]) qmSubItems[qmSubSel].el.scrollIntoView({ block: 'nearest' });
      $$('.p4-qm-it').forEach((b) => b.classList.toggle('sel', qmCol === 'list' && Number(b.dataset.i) === qmSel));
    }
    function qmActivate(i) {
      const q = QM[i];
      if (!q) return;
      qmSel = i;
      if (['sound', 'music', 'party', 'friends', 'power'].includes(q.id)) {
        qmCol = 'sub';
        setQmSub(0);
        return;
      }
      closeQm();
      if (q.id === 'random') {
        if (games.length) goFromQm(() => openGame(games[Math.floor(Math.random() * games.length)]));
      } else if (q.id === 'library') goFromQm(openLibrary);
      else if (q.id === 'consoles') ctx.openSelector();
      else if (q.id === 'settings') goFromQm(openSettings);
    }
    // Desde el menú rápido se puede abrir una pantalla estando en cualquier otra
    function goFromQm(fn) {
      if (view === 'func') closeFunc();
      fn();
    }
    function qmKey(k) {
      if (k === 'Escape' || k === 'Backspace' || k === 'p' || k === 'P') {
        if (qmCol === 'sub' && k !== 'p' && k !== 'P') {
          qmCol = 'list';
          setQmSub(qmSubSel);
        } else closeQm();
        return;
      }
      if (qmCol === 'list') {
        if (k === 'ArrowDown') moveQm(1);
        else if (k === 'ArrowUp') moveQm(-1);
        else if (k === 'ArrowRight' && qmSubItems.length) {
          qmCol = 'sub';
          setQmSub(0);
        } else if (k === 'Enter') qmActivate(qmSel);
      } else {
        if (k === 'ArrowDown') setQmSub(qmSubSel + 1);
        else if (k === 'ArrowUp') setQmSub(qmSubSel - 1);
        else if (k === 'ArrowLeft') {
          qmCol = 'list';
          setQmSub(qmSubSel);
        } else if (k === 'Enter' && qmSubItems[qmSubSel]) qmSubItems[qmSubSel].run();
      }
    }
    $('.p4-qm-btn').addEventListener('click', () => (qmOpen ? closeQm() : openQm()));
    $('.p4-qm').addEventListener('pointerdown', (e) => {
      if (e.target === e.currentTarget) closeQm();
    });

    // ---------- Spotify (barra superior y menú rápido) ----------
    function renderSpotify(s) {
      spotify = s || spotify;
      const st = spotify || {};
      const on = st.running && st.playing && st.title;
      $('.p4-st-music').hidden = !on;
      if (on) $('.p4-st-music .t').textContent = `${st.title}${st.artist ? ` · ${st.artist}` : ''}`;
      if (qmOpen && QM[qmSel] && QM[qmSel].id === 'music') renderQmSub();
    }

    // ---------- Iniciar y "Jugando a…" ----------
    async function startGame(g) {
      if (!g || view === 'playing') return;
      const res = await api.launch(g.id);
      if (!res || !res.ok) {
        ctx.toast(`No se pudo abrir: ${(res && res.error) || 'error desconocido'}`);
        return;
      }
      stack.push(view);
      view = 'playing';
      closeQm();
      const p = $('.p4-playing');
      $('.p4-play-art').innerHTML = '';
      $('.p4-play-art').appendChild(tileArt(g, true));
      $('.p4-play-name').textContent = g.name;
      p.hidden = false;
      p.classList.remove('leave');
      document.body.classList.add('playing');
      root.classList.add('is-playing');
      nowPlaying.start(); // Spotify y Grupo a los lados
      const started = Date.now();
      const upd = () => {
        const s = Math.floor((Date.now() - started) / 1000);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        $('.p4-play-time').textContent = h ? `${h}:${pad2(m)}:${pad2(s % 60)}` : `${m}:${pad2(s % 60)}`;
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
      const p = $('.p4-playing');
      p.classList.add('leave');
      await wait(400);
      p.hidden = true;
      view = stack.pop() || 'home';
      if (reason === 'not-started') ctx.toast('No se detectó que el juego abriera');
    }
    $('[data-p="stop"]').addEventListener('click', () => {
      call('dismissPlaying');
      endPlaying('manual');
    });

    // ---------- Teclado ----------
    function onKey(e) {
      const k = e.key;
      if (k === 'Enter' || k === ' ') e.preventDefault();
      if (document.activeElement === searchInput) return;
      if (pop) {
        if (k === 'ArrowDown') setPop(pop.sel + 1);
        else if (k === 'ArrowUp') setPop(pop.sel - 1);
        else if (k === 'Enter') choosePop(pop.sel);
        else if (k === 'Escape' || k === 'Backspace') closePop();
        return;
      }
      if (qmOpen) return qmKey(k);
      if ((k === 'p' || k === 'P') && view !== 'playing') return openQm();
      switch (view) {
        case 'home':
          if (k === 'ArrowRight') setRow(rowSel + 1);
          else if (k === 'ArrowLeft') setRow(rowSel - 1);
          else if (k === 'ArrowUp') openFunc();
          else if (k === 'ArrowDown') {
            const it = rowItems[rowSel];
            if (it && it.type === 'game') openGame(it.game);
            else if (it) openLibrary();
          } else if (k === 'Enter') activateRow();
          else if (k === 'Escape') ctx.openSelector();
          break;
        case 'func':
          if (k === 'ArrowRight') setFunc(funcSel + 1);
          else if (k === 'ArrowLeft') setFunc(funcSel - 1);
          else if (k === 'ArrowDown' || k === 'Escape' || k === 'Backspace') closeFunc();
          else if (k === 'Enter') runFunc(FUNCS[funcSel].id);
          break;
        case 'game':
          if (k === 'ArrowRight') setGameBtn(gameBtn + 1);
          else if (k === 'ArrowLeft') setGameBtn(gameBtn - 1);
          else if (k === 'Enter') $$('.p4g-actions .p4-btn').filter((b) => !b.hidden)[gameBtn].click();
          else if (k === 'Escape' || k === 'Backspace' || k === 'ArrowUp') back();
          break;
        case 'library':
          libKey(k);
          break;
        case 'trophies':
          trophyKey(k);
          break;
        case 'party':
          partyKey(k);
          break;
        case 'friends':
          friendsKey(k);
          break;
        case 'settings':
          settingsKey(k);
          break;
        case 'playing':
          if (k === 'Enter') $('[data-p="stop"]').click();
          break;
        default:
          break;
      }
    }
    window.addEventListener('keydown', onKey);

    // Rueda del mouse en el menú principal: mover entre juegos
    let wheelLock = 0;
    $('.p4-home').addEventListener('wheel', (e) => {
      if (view !== 'home' || Date.now() < wheelLock) return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) < 10) return;
      setRow(rowSel + (d > 0 ? 1 : -1));
      wheelLock = Date.now() + 160;
    });

    // ---------- Datos ----------
    function setGames(list) {
      games = list || [];
      if (current) current = games.find((g) => g.id === current.id) || current;
      renderRow();
      if (view === 'library') paintLib();
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

    call('spotifyWatch', true).then((s) => s && renderSpotify(s));
    call('discordWatch', true).then((s) => s && renderDiscord(s));
    loadProfile();
    loadSummary();
    setFunc(funcSel);
    api.getState().then((s) => {
      setGames(s.games);
      root.classList.add('intro');
      setTimeout(() => root.classList.remove('intro'), 1400);
    });

    return {
      unmount() {
        nowPlaying.dispose();
        clearInterval(clockTimer);
        clearInterval(playTimer);
        window.removeEventListener('keydown', onKey);
        clearInterval(fTimer);
        offs.forEach((off) => off && off());
        call('spotifyWatch', false);
        call('discordWatch', false);
        document.body.classList.remove('playing');
        root.classList.remove('in-func', 'in-screen', 'is-playing', 'intro', 'art-strong');
        root.innerHTML = '';
      },
    };
  }
})();
