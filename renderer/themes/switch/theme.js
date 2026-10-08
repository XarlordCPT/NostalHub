/* Tema Nintendo Switch: los 5 juegos más recientes + "Todo el software", fila de botones redondos
   (Grupo, Música, Tienda, Logros, Biblioteca, Amigos, Ajustes, Energía), tema claro u oscuro
   (se elige en Ajustes → Tema) y "Jugando a…". Se registra en window.Themes.switch. */
(() => {
  const I = {
    headset: '<path d="M8 30v-6a16 16 0 0 1 32 0v6"/><rect x="6" y="28" width="8" height="12" rx="3"/><rect x="34" y="28" width="8" height="12" rx="3"/><path d="M40 40c0 4-5 6-12 6"/>',
    music: '<path d="M19 35V11l20-4v23"/><circle cx="14" cy="35" r="5.5" fill="currentColor"/><circle cx="34" cy="30" r="5.5" fill="currentColor"/>',
    bag: '<path d="M9 16h30l-3 25H12Z"/><path d="M17 16v-3a7 7 0 0 1 14 0v3"/>',
    trophy: '<path d="M16 8h16v10a8 8 0 0 1-16 0Z"/><path d="M16 11H9v3a6 6 0 0 0 7 6M32 11h7v3a6 6 0 0 1-7 6"/><path d="M24 26v8M17 40h14M19 34h10v6H19z"/>',
    grid: '<rect x="7" y="7" width="15" height="15" rx="1"/><rect x="26" y="7" width="15" height="15" rx="1"/><rect x="7" y="26" width="15" height="15" rx="1"/><rect x="26" y="26" width="15" height="15" rx="1"/>',
    people: '<circle cx="18" cy="16" r="6"/><path d="M6 39c0-8 5-12 12-12s12 4 12 12"/><circle cx="33" cy="18" r="5"/><path d="M31 27c7 0 11 4 11 11"/>',
    gear: '<circle cx="24" cy="24" r="6"/><path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.6 10.6l4.2 4.2M33.2 33.2l4.2 4.2M10.6 37.4l4.2-4.2M33.2 14.8l4.2-4.2"/><circle cx="24" cy="24" r="12"/>',
    power: '<path d="M16 12a15 15 0 1 0 16 0"/><path d="M24 6v17"/>',
    play: '<path d="M15 9l25 15-25 15Z" fill="currentColor"/>',
    pause: '<path d="M14 10h7v28h-7zM27 10h7v28h-7z" fill="currentColor"/>',
    prev: '<path d="M14 10v28M38 10 18 24l20 14Z" fill="currentColor"/>',
    next: '<path d="M34 10v28M10 10l20 14-20 14Z" fill="currentColor"/>',
    micOff: '<rect x="18" y="6" width="12" height="22" rx="6"/><path d="M11 23a13 13 0 0 0 26 0M24 36v6M8 8l32 32"/>',
    deaf: '<path d="M8 30v-6a16 16 0 0 1 32 0v6"/><rect x="6" y="28" width="8" height="12" rx="3"/><rect x="34" y="28" width="8" height="12" rx="3"/><path d="M6 6l36 36"/>',
    check: '<path d="M10 25l9 9 19-20"/>',
    swap: '<path d="M8 17h30l-7-7M40 31H10l7 7"/>',
    restart: '<path d="M38 24a14 14 0 1 1-4-10"/><path d="M36 6v9h-9"/>',
    pad: '<path d="M14 15h20c6 0 9 4 10 10l1 6c1 6-5 9-9 5l-5-5H17l-5 5c-4 4-10 1-9-5l1-6c1-6 4-10 10-10Z"/><path d="M15 22v7M11.5 25.5h7"/>',
    screen: '<rect x="5" y="8" width="38" height="25" rx="2"/><path d="M18 41h12M24 33v8"/>',
    speaker: '<path d="M8 19h8l10-8v26l-10-8H8Z"/><path d="M32 18a8 8 0 0 1 0 12M36 13a14 14 0 0 1 0 22"/>',
    folder: '<path d="M5 13h14l4 4h20v22H5Z"/><path d="M5 21h38"/>',
    person: '<circle cx="24" cy="15" r="7"/><path d="M10 41c0-9 6-14 14-14s14 5 14 14"/>',
    palette: '<path d="M24 6a18 18 0 1 0 0 36c3 0 4-2 3-4s0-5 3-5h5a7 7 0 0 0 7-7c0-11-8-20-18-20Z"/><circle cx="15" cy="20" r="2.5" fill="currentColor"/><circle cx="22" cy="13" r="2.5" fill="currentColor"/><circle cx="31" cy="14" r="2.5" fill="currentColor"/>',
    image: '<rect x="6" y="9" width="36" height="30" rx="3"/><circle cx="17" cy="19" r="4"/><path d="M6 34l11-10 9 8 6-5 10 9"/>',
  };
  const icon = (n, cls = '') =>
    `<svg class="sw-ic ${cls}" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">${I[n] || ''}</svg>`;

  // Fila de botones redondos (como Nintendo Switch Online, Noticias, eShop, Álbum…)
  const BTNS = [
    { id: 'party', label: 'Grupo', icon: 'headset', color: 'red' },
    { id: 'music', label: 'Música', icon: 'music', color: '#2bbf5a' },
    { id: 'store', label: 'Tienda', icon: 'bag', color: '#f2643a' },
    { id: 'trophies', label: 'Logros', icon: 'trophy', color: '#1d8bf0' },
    { id: 'library', label: 'Todo el software', icon: 'grid', color: '#16b6cf' },
    { id: 'friends', label: 'Amigos', icon: 'people', color: '#a0a0a0' },
    { id: 'settings', label: 'Ajustes', icon: 'gear', color: '#a0a0a0' },
    { id: 'power', label: 'Energía', icon: 'power', color: '#a0a0a0' },
  ];
  const STRIDE = 418; // ancho de cada cuadro + separación
  const LIB_COLS = 6;
  const LIB_ROW = 300;
  const pad2 = (n) => String(n).padStart(2, '0');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const MARKUP = `
<header class="sw-top">
  <div class="sw-users"></div>
  <div class="sw-status"><span class="sw-clock"></span>
    <svg class="sw-wifi" viewBox="0 0 48 36"><path d="M4 12a30 30 0 0 1 40 0M10 19a21 21 0 0 1 28 0M16 26a12 12 0 0 1 16 0" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/><circle cx="24" cy="31" r="3.5" fill="currentColor"/></svg>
    <span class="sw-batt"><i></i></span></div>
</header>

<section class="sw-home">
  <div class="sw-title"></div>
  <div class="sw-row"><div class="sw-track"></div></div>
  <div class="sw-blabel"></div>
  <div class="sw-btns">${BTNS.map((b, i) => `<button class="sw-rb" data-i="${i}" style="--c:${b.color}">${b.id === 'party' ? `<span class="sw-online">${icon('headset')}</span>` : icon(b.icon)}<em hidden></em></button>`).join('')}</div>
</section>

<section class="sw-screen sw-lib" hidden>
  <div class="sw-sh">${icon('grid')}<span>Todo el software</span><button class="sw-sort"></button></div>
  <div class="sw-lib-view"><div class="sw-lib-grid"></div></div>
</section>

<!-- Ficha del juego (como el menú de Opciones de la Switch) -->
<section class="sw-screen sw-game" hidden>
  <div class="sw-g-side">
    <div class="sw-g-head"><div class="sw-g-art"></div><div class="sw-g-name"></div><div class="sw-g-type"></div></div>
    <div class="sw-g-list"></div>
  </div>
  <div class="sw-g-main"></div>
</section>

<section class="sw-screen sw-ach" hidden>
  <div class="sw-sh">${icon('trophy')}<span>Logros</span><span class="sw-sh-r"></span></div>
  <div class="sw-two"><div class="sw-side"></div><div class="sw-main"><div class="sw-ach-list"></div></div></div>
</section>

<section class="sw-screen sw-party" hidden>
  <div class="sw-sh">${icon('headset')}<span>Grupo</span><span class="sw-sh-r">Discord</span></div>
  <div class="sw-party-body"></div>
</section>

<section class="sw-screen sw-music" hidden>
  <div class="sw-sh">${icon('music')}<span>Música</span><span class="sw-sh-r">Spotify</span></div>
  <div class="sw-music-body"></div>
</section>

<section class="sw-screen sw-set" hidden>
  <div class="sw-sh">${icon('gear')}<span>Configuración de la consola</span></div>
  <div class="sw-two"><div class="sw-side"></div><div class="sw-main"></div></div>
</section>

<footer class="sw-foot">
  <svg class="sw-joy" viewBox="0 0 60 60"><rect x="8" y="6" width="18" height="48" rx="8" fill="currentColor"/><rect x="34" y="6" width="18" height="48" rx="8" fill="currentColor"/><circle cx="17" cy="20" r="3" fill="var(--bg)"/><circle cx="43" cy="38" r="3" fill="var(--bg)"/></svg>
  <div class="sw-hints"></div>
</footer>

<div class="sw-pop" hidden><div class="sw-pop-box"><div class="sw-pop-title"></div><div class="sw-pop-sub"></div><div class="sw-pop-list"></div></div></div>

<section class="sw-playing" hidden>
  <div class="sw-play-card">
    <div class="sw-play-art"></div>
    <div class="sw-play-label">Jugando a</div>
    <div class="sw-play-name"></div>
    <div class="sw-play-time">0:00</div>
    <button class="sw-pill sel" data-p="stop">Volver al menú</button>
  </div>
</section>`;

  window.Themes = window.Themes || {};
  window.Themes.switch = { mount };

  function mount(root, ctx) {
    root.innerHTML = MARKUP;
    const api = ctx.api;
    const U = window.NostalHubUtil;
    const esc = U.escapeHtml;
    const $ = (s, el = root) => el.querySelector(s);
    const $$ = (s, el = root) => [...el.querySelectorAll(s)];
    const call = (fn, ...a) => (typeof api[fn] === 'function' ? api[fn](...a) : Promise.resolve(null));

    let games = [];
    let view = 'home'; // home | library | trophies | party | music | settings | playing
    let area = 'row'; // row | btns (en el inicio)
    let rowSel = 0;
    let btnSel = 0;
    let rowItems = [];
    let profile = { name: 'Jugador', avatar: null };
    let summary = { perGame: {}, hasKey: false };
    let spotify = null;
    let discord = { status: 'off', channel: null, members: [] };
    let menuModel = [];
    let playTimer = null;
    const offs = [];
    const nowPlaying = U.nowPlaying($('.sw-playing'), api);

    // ---------- Tema claro u oscuro (Ajustes → Tema) ----------
    let light = false;
    try {
      light = localStorage.getItem('nostalhub.switch.theme') === 'light';
    } catch {}
    function setLight(on) {
      light = !!on;
      root.classList.toggle('light', light);
      try {
        localStorage.setItem('nostalhub.switch.theme', light ? 'light' : 'dark');
      } catch {}
    }
    setLight(light);

    // ---------- Barra de arriba ----------
    function tickClock() {
      const d = new Date();
      $('.sw-clock').textContent = `${d.getHours()}:${pad2(d.getMinutes())}`;
    }
    tickClock();
    const clockTimer = setInterval(tickClock, 10000);
    function paintUsers() {
      // Tú (Steam) y, si estás en un canal de voz de Discord, quiénes están contigo
      const box = $('.sw-users');
      const others = discord.status === 'ok' && discord.channel ? discord.members.slice(0, 4) : [];
      box.innerHTML =
        `<span class="sw-av me"${profile.avatar ? ` style="background-image:url('${profile.avatar}')"` : ''}>${profile.avatar ? '' : esc((profile.name || '?').charAt(0))}</span>` +
        others.map((m) => `<span class="sw-av${m.speaking ? ' talking' : ''}" title="${esc(m.name)}" style="background-image:url('${m.avatar}')"></span>`).join('');
    }

    // ---------- Arte cuadrado de cada juego ----------
    function squareArt(g) {
      const el = document.createElement('div');
      el.className = 'sw-art';
      // 1) tu imagen cuadrada  2) el fondo con el logo encima, centrados  3) la carátula  4) la portada
      if (g.square) {
        el.style.backgroundImage = `url("${g.square}")`;
      } else if (g.hero && g.heroIsReal && g.logo) {
        el.style.backgroundImage = `url("${g.hero}")`;
        el.innerHTML = `<img src="${g.logo}" alt="" draggable="false" />`;
      } else if (g.cover) {
        el.style.backgroundImage = `url("${g.cover}")`;
      } else if (g.hero || g.tile) {
        el.style.backgroundImage = `url("${g.hero || g.tile}")`;
        if (g.logo) el.innerHTML = `<img src="${g.logo}" alt="" draggable="false" />`;
        else if (!g.heroIsReal) el.classList.add('fit');
        else el.innerHTML = `<div class="sw-art-name">${esc(g.name)}</div>`;
      } else el.innerHTML = `<div class="sw-art-name">${esc(g.name)}</div>`;
      return el;
    }

    // ---------- Inicio: 5 recientes + "Todo el software" ----------
    function recent() {
      const played = games.filter((g) => g.lastPlayed).sort((a, b) => b.lastPlayed - a.lastPlayed);
      const rest = games.filter((g) => !g.lastPlayed);
      return [...played, ...rest].slice(0, 5);
    }
    function renderRow() {
      const track = $('.sw-track');
      track.innerHTML = '';
      rowItems = [...recent().map((g) => ({ game: g })), { all: true }];
      rowItems.forEach((it, i) => {
        const b = document.createElement('button');
        b.className = it.all ? 'sw-all' : 'sw-tile';
        b.dataset.i = i;
        b.style.left = `${i * STRIDE}px`;
        if (it.all) b.innerHTML = `<span class="sw-all-c">${icon('grid')}</span>`;
        else {
          b.dataset.gameId = it.game.id; // clic derecho → cambiar imágenes
          b.appendChild(squareArt(it.game));
        }
        b.addEventListener('click', () => {
          if (view !== 'home') return;
          if (area !== 'row' || rowSel !== i) return setRow(i, 'row');
          activateRow();
        });
        track.appendChild(b);
      });
      setRow(Math.min(rowSel, rowItems.length - 1), area, false);
    }
    function setRow(i, ar = 'row', sound = true) {
      rowSel = Math.max(0, Math.min(rowItems.length - 1, i));
      area = ar;
      // la fila se corre solo cuando la selección pasa del 4.º cuadro
      const shift = Math.max(0, rowSel - 3) * STRIDE;
      $('.sw-track').style.transform = `translateX(${-shift}px)`;
      $$('.sw-track > button').forEach((b) => b.classList.toggle('sel', area === 'row' && Number(b.dataset.i) === rowSel));
      $$('.sw-rb').forEach((b) => b.classList.toggle('sel', area === 'btns' && Number(b.dataset.i) === btnSel));
      const it = rowItems[rowSel];
      const title = $('.sw-title');
      title.textContent = area === 'row' && it && it.game ? it.game.name : '';
      title.style.left = `${150 + rowSel * STRIDE - shift}px`;
      const allLabel = area === 'row' && it && it.all;
      root.classList.toggle('all-sel', !!allLabel);
      const bl = $('.sw-blabel');
      const btn = BTNS[btnSel];
      bl.textContent = area === 'btns' ? btn.label : allLabel ? 'Todo el software' : '';
      bl.classList.toggle('on', area === 'btns' || !!allLabel);
      if (area === 'btns') {
        const r = ctx.stageRect($$('.sw-rb')[btnSel]);
        bl.style.left = `${r.left + r.width / 2}px`;
        bl.style.top = '700px';
      } else if (allLabel) {
        bl.style.left = `${150 + rowSel * STRIDE - shift + 200}px`;
        bl.style.top = '232px';
      }
      paintHints();
    }
    function activateRow() {
      const it = rowItems[rowSel];
      if (!it) return;
      if (it.all) openLibrary();
      else startGame(it.game);
    }
    $$('.sw-rb').forEach((b) => {
      b.addEventListener('mouseenter', () => view === 'home' && ((btnSel = Number(b.dataset.i)), setRow(rowSel, 'btns')));
      b.addEventListener('click', () => {
        btnSel = Number(b.dataset.i);
        setRow(rowSel, 'btns');
        runBtn(BTNS[btnSel].id);
      });
    });
    function runBtn(id) {
      ctx.sound('b-' + id); // cada botón con su sonido (boton-ajustes.wav, boton-tienda.wav…), si lo pusiste
      if (id === 'store' || id === 'friends') {
        call('open', id === 'store' ? 'steam-store' : 'steam-friends');
        ctx.toast('Se abrió en Steam');
      } else if (id === 'party') openScreen('party');
      else if (id === 'music') openScreen('music');
      else if (id === 'trophies') openTrophies();
      else if (id === 'library') openLibrary();
      else if (id === 'settings') openSettings();
      else if (id === 'power') openPower();
    }

    // ---------- Pantallas ----------
    const SCREEN = { game: '.sw-game', library: '.sw-lib', trophies: '.sw-ach', party: '.sw-party', music: '.sw-music', settings: '.sw-set' };
    function openScreen(name) {
      view = name;
      root.classList.add('in-screen');
      $$('.sw-screen').forEach((s) => (s.hidden = true));
      const s = $(SCREEN[name]);
      s.hidden = false;
      s.classList.remove('enter');
      s.offsetWidth;
      s.classList.add('enter');
      if (name === 'party') renderParty();
      if (name === 'music') renderMusic();
      paintHints();
    }
    function back() {
      // de la ficha de un juego se vuelve a Todo el software (si se vino de ahí)
      if (view === 'game' && gameFrom === 'library') {
        gameFrom = null;
        openScreen('library');
        return setLib(libSel);
      }
      view = 'home';
      root.classList.remove('in-screen');
      $$('.sw-screen').forEach((s) => (s.hidden = true));
      setRow(rowSel, area);
    }

    // --- Todo el software ---
    const SORTS = [
      { label: 'Jugado recientemente', fn: (a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0) || a.name.localeCompare(b.name, 'es') },
      { label: 'Por tiempo de juego', fn: (a, b) => (b.playtimeMin || 0) - (a.playtimeMin || 0) },
      { label: 'Por nombre', fn: (a, b) => a.name.localeCompare(b.name, 'es') },
    ];
    let libSort = 0;
    let libSel = 0;
    let libFirst = 0;
    let libList = [];
    function openLibrary() {
      openScreen('library');
      libSel = 0;
      libFirst = 0;
      paintLib();
    }
    function paintLib() {
      libList = [...games].sort(SORTS[libSort].fn);
      $('.sw-sort').innerHTML = `<b>S</b>${esc(SORTS[libSort].label)}`;
      const grid = $('.sw-lib-grid');
      grid.innerHTML = '';
      libList.forEach((g, i) => {
        const c = document.createElement('button');
        c.className = 'sw-cell';
        c.dataset.i = i;
        c.dataset.gameId = g.id;
        c.appendChild(squareArt(g));
        c.insertAdjacentHTML('beforeend', `<span class="sw-cell-name">${esc(g.name)}</span>`);
        c.addEventListener('mouseenter', () => setLib(i, false));
        c.addEventListener('click', () => (i === libSel ? openGame(g, 'library') : setLib(i)));
        grid.appendChild(c);
      });
      if (!libList.length) grid.innerHTML = '<div class="sw-empty">Todavía no hay juegos.</div>';
      setLib(Math.min(libSel, libList.length - 1));
    }
    function setLib(i, scroll = true) {
      libSel = Math.max(0, Math.min(libList.length - 1, i));
      $$('.sw-cell').forEach((c) => c.classList.toggle('sel', Number(c.dataset.i) === libSel));
      if (scroll) {
        const row = Math.floor(libSel / LIB_COLS);
        if (row < libFirst) libFirst = row;
        else if (row > libFirst + 1) libFirst = row - 1;
        $('.sw-lib-grid').style.transform = `translateY(${-libFirst * LIB_ROW}px)`;
      }
    }
    $('.sw-sort').addEventListener('click', () => {
      libSort = (libSort + 1) % SORTS.length;
      paintLib();
    });
    $('.sw-lib-view').addEventListener('wheel', (e) => {
      if (view !== 'library' || Math.abs(e.deltaY) < 10) return;
      const rows = Math.ceil(libList.length / LIB_COLS);
      libFirst = Math.max(0, Math.min(Math.max(0, rows - 2), libFirst + (e.deltaY > 0 ? 1 : -1)));
      $('.sw-lib-grid').style.transform = `translateY(${-libFirst * LIB_ROW}px)`;
    });
    function libKey(k) {
      if (k === 'ArrowRight') setLib(libSel + 1);
      else if (k === 'ArrowLeft') setLib(libSel - 1);
      else if (k === 'ArrowDown') setLib(Math.min(libList.length - 1, libSel + LIB_COLS));
      else if (k === 'ArrowUp') libSel >= LIB_COLS && setLib(libSel - LIB_COLS);
      else if (k === 'Enter' && libList[libSel]) openGame(libList[libSel], 'library');
      else if (k === 's' || k === 'S') $('.sw-sort').click();
      else if (k === 'Escape' || k === 'Backspace') back();
    }

    // --- Ficha del juego: lista a la izquierda (Iniciar, Información, Logros, Imágenes), detalle a la derecha ---
    let gameCur = null;
    let gameFrom = null;
    let gTabs = [];
    let gSel = 0;
    let gFocus = 'side'; // side | list (logros)
    let gRow = 0;
    let gToken = 0;
    function typeLabel(g) {
      return { steam: 'Steam', exe: 'Programa', shortcut: 'Acceso directo', url: 'Otro launcher' }[g.type] || '';
    }
    function openGame(g, from = 'library', tab = 'info') {
      if (!g) return;
      gameCur = g;
      gameFrom = from;
      openScreen('game');
      $('.sw-game').dataset.gameCurrent = g.id; // clic derecho / tecla I → imágenes de este juego
      const art = $('.sw-g-art');
      art.innerHTML = '';
      art.appendChild(squareArt(g));
      $('.sw-g-name').textContent = g.name;
      $('.sw-g-type').textContent = typeLabel(g);
      gTabs = [
        { id: 'play', label: 'Iniciar', icon: 'play' },
        { id: 'info', label: 'Información del software', icon: 'grid' },
        ...(g.type === 'steam' ? [{ id: 'ach', label: 'Logros', icon: 'trophy' }] : []),
        { id: 'img', label: 'Cambiar imágenes', icon: 'image' },
      ];
      gSel = Math.max(1, gTabs.findIndex((t) => t.id === tab));
      gFocus = 'side';
      paintGameTabs();
    }
    function paintGameTabs() {
      const list = $('.sw-g-list');
      list.innerHTML = gTabs.map((t, i) => `<button class="sw-li${t.id === 'play' ? ' play' : ''}${i === gSel ? ' sel' : ''}${gFocus !== 'side' ? ' dim' : ''}" data-i="${i}">${icon(t.icon)}<span class="sw-li-t">${esc(t.label)}</span></button>`).join('');
      $$('.sw-li', list).forEach((b) => {
        b.addEventListener('mouseenter', () => {
          if (Number(b.dataset.i) !== gSel && gTabs[Number(b.dataset.i)].id !== 'play') pickTab(Number(b.dataset.i));
        });
        b.addEventListener('click', () => {
          const i = Number(b.dataset.i);
          if (gTabs[i].id === 'play') return startGame(gameCur);
          if (gTabs[i].id === 'img') return window.NostalHubGameEditor && window.NostalHubGameEditor.open(gameCur.id);
          pickTab(i);
        });
      });
      paintGameMain();
    }
    function pickTab(i) {
      gSel = i;
      gFocus = 'side';
      gRow = 0;
      paintGameTabs();
    }
    function infoLine(label, value) {
      return value ? `<div class="sw-g-line"><span>${esc(label)}</span><b>${esc(value)}</b></div>` : '';
    }
    async function paintGameMain() {
      const g = gameCur;
      const main = $('.sw-g-main');
      const tab = gTabs[gSel] ? gTabs[gSel].id : 'info';
      const tp = trophiesOf(g);
      if (tab === 'info' || tab === 'play') {
        main.innerHTML = `
          <div class="sw-g-h">Actividad de juego</div>
          ${infoLine('Tiempo de juego', U.hours(g.playtimeMin) || 'Todavía no lo juegas')}
          ${infoLine('Última vez', g.lastPlayed ? U.ago(g.lastPlayed) : 'Nunca')}
          ${g.type === 'steam' ? infoLine('Logros', tp && tp.total ? `${tp.done} de ${tp.total} (${Math.round((tp.done / tp.total) * 100)} %)` : summary.hasKey ? 'Sin datos todavía' : 'Conecta tu Steam para verlos') : ''}
          ${tp && tp.total ? `<div class="sw-bar"><i style="width:${(tp.done / tp.total) * 100}%"></i></div>` : ''}
          <div class="sw-g-h">Información del software</div>
          ${infoLine('Tipo', typeLabel(g))}
          ${g.appId && g.type === 'steam' ? infoLine('Número en Steam', g.appId) : ''}
          <div class="sw-g-desc">${esc(g.description || 'Sin descripción. Puedes escribir una con clic derecho → Cambiar imágenes y descripción.')}</div>`;
        return;
      }
      if (tab === 'img') {
        main.innerHTML = `<div class="sw-g-h">Cambiar imágenes</div><div class="sw-g-desc">Cambia la carátula, el fondo, el logo o la descripción de este juego. Presiona Enter para abrir.</div>`;
        return;
      }
      // Logros
      main.innerHTML = '<div class="sw-msg">Cargando…</div>';
      const token = ++gToken;
      const res = (await call('getAchievements', g.appId)) || { status: 'error' };
      if (token !== gToken || view !== 'game' || gameCur !== g || gTabs[gSel].id !== 'ach') return;
      if (res.status !== 'ok') return (main.innerHTML = `<div class="sw-msg">${U.achievementMessage(res)}</div>`);
      main.innerHTML = `<div class="sw-g-h">Logros · ${res.done} de ${res.total}</div><div class="sw-bar"><i style="width:${res.total ? (res.done / res.total) * 100 : 0}%"></i></div>
        <div class="sw-g-achview"><div class="sw-ach-list">${U.sortAchievements(res.list)
          .map((a, j) => {
            const t = U.achievementTexts(a);
            return `<div class="sw-ach-row${a.done ? '' : ' locked'}" data-i="${j}"><span class="sw-ach-ic" style="background-image:url('${a.done ? a.icon : a.iconGray || a.icon}')"></span>
              <span class="sw-ach-tx"><b>${esc(t.name)}</b><small>${esc(t.description)}</small></span><span class="sw-ach-when">${a.done ? esc(t.date) : 'Bloqueado'}</span></div>`;
          })
          .join('')}</div></div>`;
      paintGameRows();
    }
    function paintGameRows() {
      const rows = $$('.sw-g-main .sw-ach-row');
      rows.forEach((r) => r.classList.toggle('sel', gFocus === 'list' && Number(r.dataset.i) === gRow));
      const list = $('.sw-g-main .sw-ach-list');
      if (list) list.style.transform = `translateY(${-Math.max(0, gRow - 3) * 112}px)`;
      $$('.sw-g-list .sw-li').forEach((b) => b.classList.toggle('dim', gFocus !== 'side'));
    }
    function gameKey(k) {
      const tab = gTabs[gSel] && gTabs[gSel].id;
      if (gFocus === 'list') {
        const n = $$('.sw-g-main .sw-ach-row').length;
        if (k === 'ArrowDown') gRow = Math.min(n - 1, gRow + 1);
        else if (k === 'ArrowUp') gRow = Math.max(0, gRow - 1);
        else if (k === 'ArrowLeft' || k === 'Escape' || k === 'Backspace') gFocus = 'side';
        return paintGameRows();
      }
      if (k === 'ArrowDown') (gSel = Math.min(gTabs.length - 1, gSel + 1)), (gRow = 0), paintGameTabs();
      else if (k === 'ArrowUp') (gSel = Math.max(0, gSel - 1)), (gRow = 0), paintGameTabs();
      else if (k === 'Enter') {
        if (tab === 'play') startGame(gameCur);
        else if (tab === 'img') window.NostalHubGameEditor && window.NostalHubGameEditor.open(gameCur.id);
        else if (tab === 'ach' && $$('.sw-g-main .sw-ach-row').length) (gFocus = 'list'), paintGameRows();
      } else if (k === 'ArrowRight' && tab === 'ach' && $$('.sw-g-main .sw-ach-row').length) (gFocus = 'list'), paintGameRows();
      else if (k === 'Escape' || k === 'Backspace') back();
    }

    // --- Logros: juegos a la izquierda, sus logros a la derecha ---
    let achGames = [];
    let achSel = 0;
    let achFocus = 'side'; // side | list
    let achRowSel = 0;
    let achToken = 0;
    function trophiesOf(g) {
      return (g && g.appId && summary.perGame && summary.perGame[g.appId]) || null;
    }
    function openTrophies(game) {
      openScreen('trophies');
      achGames = games.filter((g) => trophiesOf(g) && trophiesOf(g).total).sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
      if (game && !achGames.includes(game)) achGames.unshift(game);
      achSel = game ? achGames.indexOf(game) : 0;
      achFocus = 'side';
      const side = $('.sw-ach .sw-side');
      $('.sw-ach .sw-sh-r').textContent = summary.hasKey ? `${summary.done || 0} de ${summary.total || 0}` : '';
      if (!summary.hasKey) {
        side.innerHTML = '';
        $('.sw-ach-list').innerHTML = `<div class="sw-msg">${U.achievementMessage({ status: 'no-key' })}</div>`;
        return;
      }
      side.innerHTML = achGames.length
        ? achGames
            .map((g, i) => {
              const tp = trophiesOf(g) || { done: 0, total: 0 };
              return `<button class="sw-li" data-i="${i}"><span class="sw-li-t">${esc(g.name)}</span><span class="sw-li-v">${tp.total ? `${tp.done}/${tp.total}` : ''}</span></button>`;
            })
            .join('')
        : '<div class="sw-msg small">Todavía no hay datos de logros. Se cargan solos en unos minutos.</div>';
      $$('.sw-li', side).forEach((b) => {
        b.addEventListener('click', () => {
          achFocus = 'side';
          setAchGame(Number(b.dataset.i));
        });
      });
      setAchGame(Math.max(0, achSel));
    }
    async function setAchGame(i) {
      if (!achGames.length) return;
      achSel = Math.max(0, Math.min(achGames.length - 1, i));
      achRowSel = 0;
      paintAchFocus();
      const g = achGames[achSel];
      const box = $('.sw-ach-list');
      box.innerHTML = '<div class="sw-msg">Cargando…</div>';
      box.style.transform = '';
      const token = ++achToken;
      const res = (await call('getAchievements', g.appId)) || { status: 'error' };
      if (token !== achToken || view !== 'trophies') return;
      if (res.status !== 'ok') return (box.innerHTML = `<div class="sw-msg">${U.achievementMessage(res)}</div>`);
      box.innerHTML = U.sortAchievements(res.list)
        .map((a, j) => {
          const t = U.achievementTexts(a);
          return `<div class="sw-ach-row${a.done ? '' : ' locked'}" data-i="${j}"><span class="sw-ach-ic" style="background-image:url('${a.done ? a.icon : a.iconGray || a.icon}')"></span>
            <span class="sw-ach-tx"><b>${esc(t.name)}</b><small>${esc(t.description)}</small></span><span class="sw-ach-when">${a.done ? esc(t.date) : 'Bloqueado'}</span></div>`;
        })
        .join('');
      paintAchFocus();
    }
    function paintAchFocus() {
      $$('.sw-ach .sw-li').forEach((b) => b.classList.toggle('sel', Number(b.dataset.i) === achSel));
      $$('.sw-ach .sw-li').forEach((b) => b.classList.toggle('dim', achFocus !== 'side'));
      const rows = $$('.sw-ach-row');
      rows.forEach((r) => r.classList.toggle('sel', achFocus === 'list' && Number(r.dataset.i) === achRowSel));
      const first = Math.max(0, achRowSel - 4);
      $('.sw-ach-list').style.transform = `translateY(${-first * 112}px)`;
    }
    function achKey(k) {
      const rows = $$('.sw-ach-row').length;
      if (k === 'Escape' || k === 'Backspace' || (k === 'ArrowLeft' && achFocus === 'side')) {
        if (achFocus === 'list' && k !== 'ArrowLeft') return (achFocus = 'side'), paintAchFocus();
        if (k !== 'ArrowLeft') back();
        return;
      }
      if (achFocus === 'side') {
        if (k === 'ArrowDown') setAchGame(achSel + 1);
        else if (k === 'ArrowUp') setAchGame(achSel - 1);
        else if ((k === 'ArrowRight' || k === 'Enter') && rows) (achFocus = 'list'), paintAchFocus();
      } else {
        if (k === 'ArrowDown') achRowSel = Math.min(rows - 1, achRowSel + 1);
        else if (k === 'ArrowUp') achRowSel = Math.max(0, achRowSel - 1);
        else if (k === 'ArrowLeft') achFocus = 'side';
        paintAchFocus();
      }
    }

    // --- Grupo (Discord) ---
    function partyStatusText() {
      switch (discord.status) {
        case 'no-config':
          return { t: 'Conecta tu Discord', d: 'Para ver tu canal de voz y quiénes están contigo, conecta tu Discord. Se hace aquí mismo y toma unos 2 minutos.', btns: [['discord', 'Conectar Discord']] };
        case 'no-discord':
          return { t: 'Discord no está abierto', d: 'Abre la app de escritorio de Discord. NostalHub se conecta sola cuando la detecte.', btns: [['discord-app', 'Abrir Discord']] };
        case 'need-auth':
          return { t: 'Falta un permiso', d: 'Discord te va a mostrar una ventana para que aceptes que NostalHub vea tu canal de voz. Solo se pide una vez.', btns: [['auth', 'Conectar con Discord']] };
        case 'authorizing':
          return { t: 'Acepta en Discord', d: 'Revisa la ventana que apareció en Discord y presiona Autorizar.', btns: [] };
        case 'error':
          return { t: 'No se pudo conectar', d: discord.message || 'Revisa los datos de tu aplicación de Discord.', btns: [['auth', 'Intentar de nuevo'], ['discord', 'Conectar Discord']] };
        case 'ok':
          return null;
        default:
          return { t: 'Conectando con Discord…', d: '', btns: [] };
      }
    }
    let partyBtn = 0;
    function renderParty() {
      const body = $('.sw-party-body');
      const st = partyStatusText();
      if (st) {
        body.innerHTML = `<div class="sw-center"><div class="sw-big-ic">${icon('headset')}</div><div class="sw-ct">${esc(st.t)}</div><div class="sw-cd">${esc(st.d)}</div>
          <div class="sw-btnrow">${st.btns.map(([id, l], i) => `<button class="sw-pill${i === partyBtn ? ' sel' : ''}" data-pb="${id}">${l}</button>`).join('')}</div></div>`;
      } else if (!discord.channel) {
        body.innerHTML = `<div class="sw-center"><div class="sw-big-ic">${icon('headset')}</div><div class="sw-ct">No estás en un canal de voz</div><div class="sw-cd">Cuando entres a un canal de voz en Discord, aquí vas a ver quiénes están contigo.</div></div>`;
      } else {
        const n = discord.members.length;
        body.innerHTML = `<div class="sw-party-head"><b>${esc(discord.channel.name)}</b><span>${esc(discord.channel.guild || 'Mensaje directo')} · ${n} ${n === 1 ? 'persona' : 'personas'}</span></div>
          <div class="sw-members">${discord.members
            .map(
              (m) => `<div class="sw-mem${m.speaking ? ' talking' : ''}"><span class="sw-av" style="background-image:url('${m.avatar}')"></span><span class="sw-mem-n">${esc(m.name)}</span>${m.deafened ? icon('deaf') : m.muted ? icon('micOff') : ''}</div>`
            )
            .join('')}</div>`;
      }
      $$('[data-pb]', body).forEach((b, i) => {
        b.addEventListener('mouseenter', () => setPartyBtn(i));
        b.addEventListener('click', () => partyAction(b.dataset.pb));
      });
    }
    function setPartyBtn(i) {
      const b = $$('[data-pb]');
      if (!b.length) return;
      partyBtn = (i + b.length) % b.length;
      b.forEach((x, j) => x.classList.toggle('sel', j === partyBtn));
    }
    function partyAction(id) {
      if (id === 'auth') call('discordAuthorize').then((s) => s && renderDiscord(s));
      else call('open', id);
    }

    // --- Música (Spotify) ---
    let musicBtn = 1;
    function renderMusic() {
      const v = U.spotifyView(spotify || {});
      const body = $('.sw-music-body');
      body.innerHTML = `<div class="sw-mu">
          <div class="sw-mu-cover"${v.cover ? ` style="background-image:url('${v.cover}')"` : ''}>${v.cover ? '' : icon('music')}</div>
          <div class="sw-mu-info"><div class="sw-mu-st">${v.on ? (v.playing ? 'Reproduciendo' : 'En pausa') : 'Spotify'}</div><div class="sw-mu-t">${esc(v.title)}</div><div class="sw-mu-a">${esc(v.artist)}</div>
            <div class="sw-btnrow">${
              v.on
                ? `<button class="sw-round" data-m="prev">${icon('prev')}</button><button class="sw-round big" data-m="toggle">${icon(v.playing ? 'pause' : 'play')}</button><button class="sw-round" data-m="next">${icon('next')}</button>`
                : ''
            }<button class="sw-pill" data-m="open">Abrir Spotify</button></div></div></div>`;
      const btns = $$('[data-m]', body);
      musicBtn = Math.min(musicBtn, btns.length - 1);
      btns.forEach((b, i) => {
        b.classList.toggle('sel', i === musicBtn);
        b.addEventListener('mouseenter', () => {
          musicBtn = i;
          btns.forEach((x, j) => x.classList.toggle('sel', j === i));
        });
        b.addEventListener('click', () => {
          call('spotifyControl', b.dataset.m);
          if (b.dataset.m === 'toggle' && spotify && spotify.running) {
            spotify = { ...spotify, playing: !spotify.playing };
            renderMusic();
          }
        });
      });
    }

    // --- Ajustes (con Tema claro/oscuro, solo de esta consola) ---
    const CAT_ICONS = { theme: 'palette', general: 'gear', games: 'pad', screen: 'screen', sound: 'speaker', accounts: 'person', files: 'folder' };
    let setCat = 0;
    let setSel = 0;
    let setFocus = 'side';
    function setCats() {
      return [
        { id: 'theme', title: 'Tema', items: [{ id: 'sw-theme', type: 'choice', label: 'Tema', desc: 'El color del menú de la Switch. Solo cambia esta consola.', options: [{ value: 'light', label: 'Básico blanco' }, { value: 'dark', label: 'Básico negro' }], value: light ? 'light' : 'dark' }] },
        ...menuModel,
      ];
    }
    async function openSettings() {
      menuModel = (await call('getMenu')) || menuModel;
      openScreen('settings');
      setFocus = 'side';
      setSel = 0;
      paintSettings();
    }
    function paintSettings() {
      const cats = setCats();
      setCat = Math.min(setCat, cats.length - 1);
      const side = $('.sw-set .sw-side');
      side.innerHTML = cats.map((c, i) => `<button class="sw-li${i === setCat ? ' sel' : ''}${setFocus !== 'side' ? ' dim' : ''}" data-i="${i}">${icon(CAT_ICONS[c.id] || 'gear')}<span class="sw-li-t">${esc(c.title)}</span></button>`).join('');
      $$('.sw-li', side).forEach((b) =>
        b.addEventListener('click', () => {
          setCat = Number(b.dataset.i);
          setFocus = 'side';
          setSel = 0;
          paintSettings();
        })
      );
      const cat = cats[setCat];
      const main = $('.sw-set .sw-main');
      main.innerHTML = `<div class="sw-set-h">${esc(cat.title)}</div>${cat.items
        .map((it, i) => {
          const val = it.type === 'toggle' ? `<span class="sw-tg${it.value ? ' on' : ''}"><i></i></span>` : it.type === 'choice' ? `<span class="sw-val">${esc(U.optionValueText(it))}</span>` : '';
          return `<button class="sw-row-it${setFocus === 'main' && i === setSel ? ' sel' : ''}" data-i="${i}"><span class="sw-ri-l">${esc(it.label)}</span>${val}</button>${it.desc ? `<div class="sw-ri-d">${esc(it.desc)}</div>` : ''}`;
        })
        .join('')}`;
      $$('.sw-row-it', main).forEach((b) => {
        b.addEventListener('mouseenter', () => {
          setFocus = 'main';
          setSel = Number(b.dataset.i);
          $$('.sw-row-it', main).forEach((x) => x.classList.toggle('sel', x === b));
          $$('.sw-li', side).forEach((x) => x.classList.add('dim'));
        });
        b.addEventListener('click', () => {
          setFocus = 'main';
          setSel = Number(b.dataset.i);
          pickSetting();
        });
      });
    }
    async function pickSetting() {
      const it = setCats()[setCat].items[setSel];
      if (!it) return;
      if (it.id === 'sw-theme') {
        setLight(!light);
        return paintSettings();
      }
      if (it.id === 'consoles') return ctx.openSelector();
      if (it.confirm) return openPower();
      if (it.type === 'choice') return openPop(it.label, '', it.options.map((o) => ({ label: o.label, on: String(o.value) === String(it.value), run: () => runOption(it, o.value) })));
      if (/^open-|^devtools$/.test(it.id)) ctx.toast('Se abrió en Windows');
      await runOption(it, it.type === 'toggle' ? !it.value : undefined);
    }
    async function runOption(it, value) {
      const next = await call('runMenu', it.id, value);
      if (next) menuModel = next;
      if (view === 'settings') paintSettings();
    }
    function settingsKey(k) {
      const cats = setCats();
      if (setFocus === 'side') {
        if (k === 'ArrowDown') (setCat = Math.min(cats.length - 1, setCat + 1)), (setSel = 0);
        else if (k === 'ArrowUp') (setCat = Math.max(0, setCat - 1)), (setSel = 0);
        else if (k === 'ArrowRight' || k === 'Enter') setFocus = 'main';
        else if (k === 'Escape' || k === 'Backspace' || k === 'ArrowLeft') return k === 'ArrowLeft' ? null : back();
      } else {
        const n = cats[setCat].items.length;
        if (k === 'ArrowDown') setSel = Math.min(n - 1, setSel + 1);
        else if (k === 'ArrowUp') setSel = Math.max(0, setSel - 1);
        else if (k === 'Enter') return pickSetting();
        else if (k === 'ArrowLeft' || k === 'Escape' || k === 'Backspace') setFocus = 'side';
      }
      paintSettings();
    }

    // ---------- Ventanita (opciones del juego, energía, elegir) ----------
    let pop = null;
    function openPop(title, sub, items) {
      pop = { items, sel: Math.max(0, items.findIndex((x) => x.on)) };
      $('.sw-pop-title').textContent = title;
      $('.sw-pop-sub').textContent = sub || '';
      $('.sw-pop-sub').hidden = !sub;
      const list = $('.sw-pop-list');
      list.innerHTML = items.map((it, i) => `<button class="sw-pop-it" data-i="${i}">${it.icon ? icon(it.icon) : it.on !== undefined ? `<span class="sw-radio${it.on ? ' on' : ''}"></span>` : ''}<span>${esc(it.label)}</span></button>`).join('');
      $$('.sw-pop-it', list).forEach((b) => {
        b.addEventListener('mouseenter', () => setPop(Number(b.dataset.i)));
        b.addEventListener('click', () => choosePop(Number(b.dataset.i)));
      });
      $('.sw-pop').hidden = false;
      setPop(pop.sel);
    }
    function setPop(i) {
      if (!pop) return;
      pop.sel = (i + pop.items.length) % pop.items.length;
      $$('.sw-pop-it').forEach((b) => b.classList.toggle('sel', Number(b.dataset.i) === pop.sel));
    }
    function closePop() {
      pop = null;
      $('.sw-pop').hidden = true;
    }
    function choosePop(i) {
      const it = pop && pop.items[i];
      closePop();
      if (it && it.run) it.run();
    }
    $('.sw-pop').addEventListener('pointerdown', (e) => e.target === e.currentTarget && closePop());
    function openPower() {
      openPop('Opciones de energía', '', [
        { icon: 'swap', label: 'Cambiar de consola', run: () => ctx.openSelector() },
        { icon: 'restart', label: 'Reiniciar NostalHub', run: () => call('runMenu', 'reload') },
        { icon: 'power', label: 'Apagar NostalHub', run: () => call('runMenu', 'quit') },
      ]);
    }
    // Opciones del juego marcado (tecla O, como el botón +)
    function openGameOptions(g) {
      if (!g) return;
      const sub = [U.hours(g.playtimeMin), g.lastPlayed ? `Jugado ${U.ago(g.lastPlayed)}` : ''].filter(Boolean).join(' · ') || g.description || '';
      openPop(g.name, sub, [
        { icon: 'play', label: 'Iniciar', run: () => startGame(g) },
        { icon: 'grid', label: 'Información del software', run: () => openGame(g, view === 'library' ? 'library' : 'home') },
        ...(g.type === 'steam' ? [{ icon: 'trophy', label: 'Logros', run: () => openGame(g, view === 'library' ? 'library' : 'home', 'ach') }] : []),
        { icon: 'image', label: 'Cambiar imágenes y descripción', run: () => window.NostalHubGameEditor && window.NostalHubGameEditor.open(g.id) },
      ]);
    }

    // ---------- Pistas de teclas (abajo a la derecha) ----------
    function paintHints() {
      const h = (k, t) => `<span class="sw-hint"><b>${k}</b>${t}</span>`;
      let html;
      if (view === 'home') html = area === 'row' && rowItems[rowSel] && rowItems[rowSel].game ? h('O', 'Opciones') + h('Enter', 'Iniciar') : h('Enter', 'Abrir');
      else if (view === 'library') html = h('O', 'Opciones') + h('Esc', 'Atrás') + h('Enter', 'Ver');
      else if (view === 'game') html = h('Esc', 'Atrás') + h('Enter', 'Aceptar');
      else html = h('Esc', 'Atrás') + h('Enter', 'Aceptar');
      $('.sw-hints').innerHTML = html;
    }

    // ---------- Iniciar y "Jugando a…" ----------
    async function startGame(g) {
      if (!g || view === 'playing') return;
      const res = await api.launch(g.id);
      if (!res || !res.ok) {
        ctx.sound('error');
        return ctx.toast(`No se pudo abrir: ${(res && res.error) || 'error desconocido'}`);
      }
      ctx.sound('gameboot');
      root.dataset.prevView = view;
      view = 'playing';
      closePop();
      const p = $('.sw-playing');
      const art = $('.sw-play-art');
      art.innerHTML = '';
      art.appendChild(squareArt(g));
      $('.sw-play-name').textContent = g.name;
      p.hidden = false;
      p.classList.remove('leave');
      document.body.classList.add('playing');
      root.classList.add('is-playing');
      nowPlaying.start();
      const started = Date.now();
      const upd = () => {
        const s = Math.floor((Date.now() - started) / 1000);
        const hh = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        $('.sw-play-time').textContent = hh ? `${hh}:${pad2(m)}:${pad2(s % 60)}` : `${m}:${pad2(s % 60)}`;
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
      const p = $('.sw-playing');
      p.classList.add('leave');
      await wait(350);
      p.hidden = true;
      view = root.dataset.prevView || 'home';
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
      if (view === 'playing') {
        if (k === 'Enter') $('[data-p="stop"]').click();
        return;
      }
      if (pop) {
        if (k === 'ArrowDown') setPop(pop.sel + 1);
        else if (k === 'ArrowUp') setPop(pop.sel - 1);
        else if (k === 'Enter') choosePop(pop.sel);
        else if (k === 'Escape' || k === 'Backspace' || k === 'o' || k === 'O') closePop();
        return;
      }
      if (k === 'o' || k === 'O' || k === '+') {
        if (view === 'home' && area === 'row' && rowItems[rowSel] && rowItems[rowSel].game) return openGameOptions(rowItems[rowSel].game);
        if (view === 'library' && libList[libSel]) return openGameOptions(libList[libSel]);
      }
      if (view === 'home') {
        if (area === 'row') {
          if (k === 'ArrowRight') rowSel >= rowItems.length - 1 ? ctx.sound('border') : setRow(rowSel + 1);
          else if (k === 'ArrowLeft') rowSel <= 0 ? ctx.sound('border') : setRow(rowSel - 1);
          else if (k === 'ArrowDown') setRow(rowSel, 'btns');
          else if (k === 'Enter') activateRow();
          else if (k === 'Escape') ctx.openSelector();
        } else {
          if (k === 'ArrowRight') btnSel >= BTNS.length - 1 ? ctx.sound('border') : ((btnSel += 1), setRow(rowSel, 'btns'));
          else if (k === 'ArrowLeft') btnSel <= 0 ? ctx.sound('border') : ((btnSel -= 1), setRow(rowSel, 'btns'));
          else if (k === 'ArrowUp') setRow(rowSel, 'row');
          else if (k === 'Enter') runBtn(BTNS[btnSel].id);
          else if (k === 'Escape') setRow(rowSel, 'row');
        }
      } else if (view === 'library') libKey(k);
      else if (view === 'trophies') achKey(k);
      else if (view === 'settings') settingsKey(k);
      else if (view === 'game') gameKey(k);
      else if (view === 'party') {
        if (k === 'ArrowRight' || k === 'ArrowDown') setPartyBtn(partyBtn + 1);
        else if (k === 'ArrowLeft' || k === 'ArrowUp') setPartyBtn(partyBtn - 1);
        else if (k === 'Enter') {
          const b = $$('[data-pb]')[partyBtn];
          if (b) b.click();
        } else if (k === 'Escape' || k === 'Backspace') back();
      } else if (view === 'music') {
        const b = $$('[data-m]');
        if (k === 'ArrowRight') musicBtn = Math.min(b.length - 1, musicBtn + 1);
        else if (k === 'ArrowLeft') musicBtn = Math.max(0, musicBtn - 1);
        else if (k === 'Enter' && b[musicBtn]) return b[musicBtn].click();
        else if (k === 'Escape' || k === 'Backspace') return back();
        b.forEach((x, j) => x.classList.toggle('sel', j === musicBtn));
      }
    }
    window.addEventListener('keydown', onKey);
    // Rueda en el inicio: moverse por la fila
    let wheelLock = 0;
    $('.sw-row').addEventListener('wheel', (e) => {
      if (view !== 'home' || Date.now() < wheelLock) return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) < 10) return;
      setRow(rowSel + (d > 0 ? 1 : -1));
      wheelLock = Date.now() + 160;
    });

    // ---------- Datos ----------
    async function loadProfile() {
      profile = (await call('getSteamProfile')) || profile;
      paintUsers();
    }
    async function loadSummary(s) {
      summary = s || (await call('getAchievementSummary')) || summary;
    }
    function renderSpotify(s) {
      spotify = s || spotify;
      if (view === 'music') renderMusic();
    }
    function renderDiscord(s) {
      discord = s || discord;
      paintUsers();
      if (view === 'party') renderParty();
    }
    function setGames(list) {
      games = list || [];
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
    call('getMenu').then((m) => (menuModel = m || []));
    loadProfile();
    loadSummary();
    api.getState().then((s) => {
      setGames(s.games);
      root.classList.add('intro');
      setTimeout(() => root.classList.remove('intro'), 1200);
    });

    return {
      unmount() {
        nowPlaying.dispose();
        clearInterval(clockTimer);
        clearInterval(playTimer);
        window.removeEventListener('keydown', onKey);
        offs.forEach((off) => off && off());
        call('spotifyWatch', false);
        call('discordWatch', false);
        document.body.classList.remove('playing');
        root.classList.remove('light', 'in-screen', 'is-playing', 'intro', 'all-sel');
        root.innerHTML = '';
      },
    };
  }
})();
