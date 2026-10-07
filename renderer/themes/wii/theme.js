/* Tema Wii: menú de canales, pantalla de canal y "Jugando a…".
   Se registra en window.Themes.wii y el selector de consolas lo monta/desmonta. */
(() => {
  const MARKUP = `
<!-- ===== Menú de canales ===== -->
<section id="menu">
  <div id="grid-viewport">
    <div id="grid"></div>
  </div>
  <button class="page-arrow left" id="page-prev" aria-label="Página anterior"></button>
  <button class="page-arrow right" id="page-next" aria-label="Página siguiente"></button>

  <div id="bar">
    <svg id="bar-shape" viewBox="0 0 1920 300" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f3f3f3" />
          <stop offset="1" stop-color="#d9d9d9" />
        </linearGradient>
        <pattern id="barLines" width="8" height="5" patternUnits="userSpaceOnUse">
          <rect width="8" height="2" fill="rgba(0,0,0,0.035)" />
        </pattern>
      </defs>
      <path class="bar-body" d="M0 34 H560 C640 34 640 118 720 118 H1200 C1280 118 1280 34 1360 34 H1920 V300 H0 Z" fill="url(#barFill)" />
      <path class="bar-body" d="M0 34 H560 C640 34 640 118 720 118 H1200 C1280 118 1280 34 1360 34 H1920 V300 H0 Z" fill="url(#barLines)" />
      <path class="bar-edge-glow" d="M0 34 H560 C640 34 640 118 720 118 H1200 C1280 118 1280 34 1360 34 H1920" />
      <path class="bar-edge" d="M0 34 H560 C640 34 640 118 720 118 H1200 C1280 118 1280 34 1360 34 H1920" />
    </svg>

    <div id="clock"><span id="clock-h">00</span><span id="clock-colon">:</span><span id="clock-m">00</span></div>
    <div id="date">—</div>

    <button class="round-btn left" id="btn-settings" aria-label="Ajustes" title="Ajustes">
      <svg viewBox="0 0 48 48" aria-hidden="true"><path fill-rule="evenodd" stroke="none" d="M39.07 20.38 L43.82 21.34 L43.82 26.66 L39.07 27.62 L37.22 32.10 L39.90 36.13 L36.13 39.90 L32.10 37.22 L27.62 39.07 L26.66 43.82 L21.34 43.82 L20.38 39.07 L15.90 37.22 L11.87 39.90 L8.10 36.13 L10.78 32.10 L8.93 27.62 L4.18 26.66 L4.18 21.34 L8.93 20.38 L10.78 15.90 L8.10 11.87 L11.87 8.10 L15.90 10.78 L20.38 8.93 L21.34 4.18 L26.66 4.18 L27.62 8.93 L32.10 10.78 L36.13 8.10 L39.90 11.87 L37.22 15.90 Z M30.5 24 A6.5 6.5 0 1 0 17.5 24 A6.5 6.5 0 1 0 30.5 24 Z"/></svg>
    </button>
    <button class="round-btn right" id="btn-random" aria-label="Juego al azar" title="Juego al azar">
      <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="8" width="32" height="32" rx="8" fill="none" stroke-width="3.2"/><circle cx="17" cy="17" r="3"/><circle cx="31" cy="17" r="3"/><circle cx="24" cy="24" r="3"/><circle cx="17" cy="31" r="3"/><circle cx="31" cy="31" r="3"/></svg>
    </button>
  </div>
</section>

<!-- ===== Pantalla de canal ===== -->
<section id="channel" hidden>
  <div class="ch-top">
    <div class="ch-media"></div>
    <div class="ch-title"></div>
    <div class="ch-desc"><div class="ch-stats"></div><div class="ch-desc-text"></div></div>
    <button class="ch-arrow left" id="ch-prev" aria-label="Juego anterior"></button>
    <button class="ch-arrow right" id="ch-next" aria-label="Juego siguiente"></button>
  </div>
  <div class="ch-bottom">
    <button class="pill" id="btn-back">Menú</button>
    <button class="pill" id="btn-start">Iniciar</button>
    <button class="ch-round" id="btn-ach" title="Logros"><svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8h16v10a8 8 0 0 1-16 0Z"/><path d="M16 11H9v3a6 6 0 0 0 7 6M32 11h7v3a6 6 0 0 1-7 6"/><path d="M24 26v8M17 40h14M19 34h10v6H19z"/></svg><span>Logros</span></button>
  </div>
</section>

<!-- ===== Logros (encima de la pantalla de canal) ===== -->
<section id="wii-ach" hidden>
  <div class="wa-box">
    <div class="wa-head">
      <span class="wa-title">Logros</span>
      <span class="wa-game"></span>
      <span class="wa-count"></span>
    </div>
    <div class="wa-bar"><i></i></div>
    <div class="wa-sel">
      <div class="wa-sel-icon"></div>
      <div class="wa-sel-text">
        <div class="wa-sel-name"></div>
        <div class="wa-sel-meta"></div>
        <div class="wa-sel-desc"></div>
      </div>
    </div>
    <div class="wa-grid"></div>
    <div class="wa-msg" hidden></div>
  </div>
  <div class="ch-bottom wa-bottom">
    <button class="pill" id="wa-back">Volver</button>
  </div>
</section>

<!-- ===== Jugando ===== -->
<section id="playing" hidden>
  <div class="pl-bg"></div>
  <div class="pl-center">
    <div class="pl-label">Jugando a</div>
    <div class="pl-name"></div>
    <div class="pl-time">0:00</div>
  </div>
  <div class="ch-bottom">
    <button class="pill wide" id="btn-stop">Volver al menú</button>
  </div>
</section>

<!-- ===== Configuración (engranaje), estilo "Configuración de la consola Wii" ===== -->
<section id="wii-set" hidden>
  <div class="ws-head">
    <svg class="ws-head-shape" viewBox="0 0 1920 190" preserveAspectRatio="none" aria-hidden="true">
      <path class="ws-head-body" d="M0 0 H1920 V120 H1400 C1320 120 1320 170 1240 170 H0 Z" />
      <path class="ws-head-glow" d="M1920 120 H1400 C1320 120 1320 170 1240 170 H0" />
      <path class="ws-head-edge" d="M1920 120 H1400 C1320 120 1320 170 1240 170 H0" />
    </svg>
    <div class="ws-title">Configuración de NostalHub</div>
    <div class="ws-page"><span class="ws-sec"></span><span class="ws-num"></span></div>
  </div>

  <div class="ws-main">
    <div class="ws-list"></div>
  </div>

  <div class="ws-sub" hidden>
    <div class="ws-sub-title"></div>
    <div class="ws-sub-desc"></div>
    <div class="ws-opts"></div>
  </div>

  <button class="page-arrow left" id="ws-prev" aria-label="Página anterior"></button>
  <button class="page-arrow right" id="ws-next" aria-label="Página siguiente"></button>

  <div class="ws-bottom">
    <button class="pill" id="ws-back">Atrás</button>
    <button class="pill" id="ws-ok" hidden>Confirmar</button>
  </div>
</section>
`;

  const COLS = 4;
  const ROWS = 3;
  const PER_PAGE = COLS * ROWS;
  const COL_W = 384 + 22; // ancho del canal + separación
  const STAGE_W = 1920;
  const TOP_H = 795; // alto de la parte de arriba en la pantalla de canal

  window.Themes = window.Themes || {};
  window.Themes.wii = { mount };

  // root: contenedor del tema. ctx: { api, stage, stageRect, toast, openSelector }
  function mount(root, ctx) {
    root.innerHTML = MARKUP;
    const api = ctx.api;
    const stageRect = ctx.stageRect;
    const $ = (sel) => root.querySelector(sel);
    const menu = $('#menu');
    const grid = $('#grid');
    const channel = $('#channel');
    const chTop = channel.querySelector('.ch-top');
    const chMedia = channel.querySelector('.ch-media');
    const chTitle = channel.querySelector('.ch-title');
    const playing = $('#playing');
    const nowPlaying = window.NostalHubUtil.nowPlaying(playing, ctx.api);

    let games = [];
    let page = 0;
    let view = 'menu'; // menu | channel | playing | busy
    let current = -1; // índice del juego abierto
    let hls = null;
    let playTimer = null;

    // ---------- Reloj ----------
    const pad = (n) => String(n).padStart(2, '0');
    function tick() {
      const now = new Date();
      $('#clock-h').textContent = pad(now.getHours());
      $('#clock-m').textContent = pad(now.getMinutes());
      $('#clock-colon').classList.toggle('off', now.getSeconds() % 2 === 1);
      const wd = now.toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', '');
      $('#date').textContent = `${wd.charAt(0).toUpperCase()}${wd.slice(1)} ${now.getDate()}/${now.getMonth() + 1}`;
    }
    tick();
    const tickTimer = setInterval(tick, 1000);

    // ---------- Menú ----------
    function pageCount() {
      return Math.max(1, Math.ceil(games.length / PER_PAGE));
    }

    function renderGrid() {
      grid.innerHTML = '';
      // Una columna extra al final para que se asome, como en el original
      const slots = pageCount() * PER_PAGE + ROWS;
      for (let i = 0; i < slots; i++) {
        // El grid llena por columnas: convertimos el índice de "lectura" (filas) al de columnas.
        const p = Math.floor(i / PER_PAGE);
        const within = i % PER_PAGE;
        const col = Math.floor(within / ROWS);
        const row = within % ROWS;
        const gameIndex = p * PER_PAGE + row * COLS + col; // orden de izquierda a derecha, fila por fila
        const g = i < pageCount() * PER_PAGE ? games[gameIndex] : null;
        const el = g ? gameTile(g, gameIndex) : emptyTile();
        el.style.setProperty('--d', `${(p * COLS + col) * 55 + row * 35}ms`);
        grid.appendChild(el);
      }
      setPage(Math.min(page, pageCount() - 1), false);
    }

    function gameTile(g, index) {
      const btn = document.createElement('button');
      btn.className = 'tile game';
      btn.dataset.index = index;
      btn.title = g.name;
      const inner = document.createElement('div');
      inner.className = 'tile-inner';
      const composed = g.tileTitle && !g.tileIsCustom && g.heroIsReal;
      if (composed) {
        // Estilo canal: fondo del juego + logo (o el nombre) encima
        inner.classList.add('composed');
        const bg = document.createElement('img');
        bg.className = 'tile-bg';
        bg.src = g.hero;
        bg.alt = '';
        inner.appendChild(bg);
        const title = document.createElement('div');
        title.className = 'tile-title';
        if (g.logo) {
          const logo = document.createElement('img');
          logo.src = g.logo;
          logo.alt = g.name;
          logo.onerror = () => logo.replaceWith(titleText(g.name, 'tile'));
          title.appendChild(logo);
        } else {
          title.appendChild(titleText(g.name, 'tile'));
        }
        inner.appendChild(title);
      } else if (g.tile && g.tileIsVideo) {
        const v = document.createElement('video');
        Object.assign(v, { src: g.tile, muted: true, loop: true, autoplay: true, playsInline: true });
        inner.appendChild(v);
      } else if (g.tile) {
        const img = document.createElement('img');
        img.src = g.tile;
        img.alt = '';
        img.onerror = () => img.replaceWith(nameLabel(g.name));
        inner.appendChild(img);
      } else {
        inner.appendChild(nameLabel(g.name));
      }
      btn.appendChild(inner);
      btn.addEventListener('click', () => openChannel(index));
      return btn;
    }

    function nameLabel(name) {
      const d = document.createElement('div');
      d.className = 'tile-name';
      d.textContent = name;
      return d;
    }

    function emptyTile() {
      const d = document.createElement('div');
      d.className = 'tile empty';
      d.innerHTML = '<div class="tile-inner"></div>';
      return d;
    }

    function tileFor(index) {
      return grid.querySelector(`.tile.game[data-index="${index}"]`);
    }

    function setPage(p, animate = true) {
      const prev = page;
      page = Math.max(0, Math.min(p, pageCount() - 1));
      if (animate && page !== prev && ctx.sound) ctx.sound('page'); // pagina.wav
      grid.style.transition = animate ? '' : 'none';
      grid.style.transform = `translateX(${-page * COLS * COL_W}px)`;
      if (!animate) {
        grid.offsetHeight; // aplica sin animación
        grid.style.transition = '';
      }
      $('#page-prev').hidden = page === 0;
      $('#page-next').hidden = page >= pageCount() - 1;
    }

    $('#page-prev').addEventListener('click', () => setPage(page - 1));
    $('#page-next').addEventListener('click', () => setPage(page + 1));

    let wheelLock = 0;
    menu.addEventListener('wheel', (e) => {
      if (view !== 'menu' || Date.now() < wheelLock) return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) < 10) return;
      setPage(page + (d > 0 ? 1 : -1));
      wheelLock = Date.now() + 450;
    });

    $('#btn-settings').addEventListener('click', () => openSettings());
    $('#btn-random').addEventListener('click', () => {
      if (!games.length) return;
      const i = Math.floor(Math.random() * games.length);
      setPage(Math.floor(i / PER_PAGE), false);
      openChannel(i);
    });

    // ---------- Pantalla de canal ----------
    function wait(ms) {
      return new Promise((r) => setTimeout(r, ms));
    }

    async function openChannel(index) {
      if (view !== 'menu') return;
      const g = games[index];
      const tile = tileFor(index);
      if (!g || !tile) return;
      view = 'busy';
      current = index;

      // El cuadrito crece hasta llenar la parte de arriba
      const from = stageRect(tile.querySelector('.tile-inner'));
      const zoomer = document.createElement('div');
      zoomer.className = 'zoomer';
      if (g.hero || g.tile) zoomer.style.backgroundImage = `url("${g.hero || g.tile}")`;
      Object.assign(zoomer.style, px(from));
      root.appendChild(zoomer);
      menu.classList.add('dimmed');

      const anim = zoomer.animate(
        [
          { ...px(from), borderRadius: '21px' },
          { left: '0px', top: '0px', width: `${STAGE_W}px`, height: `${TOP_H}px`, borderRadius: '0px' },
        ],
        { duration: 480, easing: 'cubic-bezier(0.5, 0, 0.2, 1)', fill: 'forwards' }
      );

      fillChannel(g);
      await anim.finished;
      channel.hidden = false;
      channel.classList.remove('leave');
      channel.classList.add('enter');
      await wait(30);
      zoomer.remove();
      view = 'channel';
    }

    async function closeChannel() {
      if (view !== 'channel') return;
      view = 'busy';
      const g = games[current];
      // Asegura que el canal esté en la página visible para volver a él
      if (current >= 0) setPage(Math.floor(current / PER_PAGE), false);
      const tile = tileFor(current);

      channel.classList.remove('enter');
      channel.classList.add('leave');
      stopVideo();

      const zoomer = document.createElement('div');
      zoomer.className = 'zoomer';
      if (g && (g.hero || g.tile)) zoomer.style.backgroundImage = `url("${g.hero || g.tile}")`;
      Object.assign(zoomer.style, { left: '0px', top: '0px', width: `${STAGE_W}px`, height: `${TOP_H}px`, borderRadius: '0px' });
      root.appendChild(zoomer);
      channel.hidden = true;
      menu.classList.remove('dimmed');

      if (tile) {
        const to = stageRect(tile.querySelector('.tile-inner'));
        await zoomer.animate(
          [
            { left: '0px', top: '0px', width: `${STAGE_W}px`, height: `${TOP_H}px`, borderRadius: '0px', opacity: 1 },
            { ...px(to), borderRadius: '21px', opacity: 1 },
          ],
          { duration: 420, easing: 'cubic-bezier(0.5, 0, 0.2, 1)', fill: 'forwards' }
        ).finished;
      }
      await zoomer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' }).finished;
      zoomer.remove();
      channel.classList.remove('leave');
      view = 'menu';
    }

    function px(r) {
      return { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` };
    }

    function fillChannel(g) {
      stopVideo();
      chMedia.innerHTML = '';
      chTitle.innerHTML = '';

      // Fondo: imagen con movimiento lento (siempre), y encima el video si hay
      const heroSrc = g.hero || g.tile;
      if (heroSrc) {
        const img = document.createElement('img');
        img.className = 'hero';
        img.src = heroSrc;
        img.alt = '';
        chMedia.appendChild(img);
      } else {
        const d = document.createElement('div');
        d.className = 'hero blank';
        chMedia.appendChild(d);
      }

      if (g.video && g.videoIsGif) {
        const gif = document.createElement('img');
        gif.className = 'gif';
        gif.onload = () => gif.classList.add('ready');
        gif.src = g.video;
        chMedia.appendChild(gif);
      } else if (g.video || g.trailer || g.trailerMp4) {
        startVideo(g);
      }

      const shade = document.createElement('div');
      shade.className = 'shade';
      chMedia.appendChild(shade);

      // Título: logo del juego o el nombre con estilo
      if (g.logo) {
        const img = document.createElement('img');
        img.src = g.logo;
        img.alt = g.name;
        img.onerror = () => {
          img.remove();
          chTitle.appendChild(titleText(g.name));
        };
        chTitle.appendChild(img);
      } else {
        chTitle.appendChild(titleText(g.name));
      }

      const desc = channel.querySelector('.ch-desc');
    const stats = statsLine(g);
    channel.querySelector('.ch-stats').textContent = stats;
    channel.querySelector('.ch-desc-text').textContent = g.description || '';
    desc.hidden = !g.description && !stats;
    $('#btn-ach').hidden = g.type !== 'steam';

    const many = games.length > 1;
      $('#ch-prev').style.visibility = many ? '' : 'hidden';
      $('#ch-next').style.visibility = many ? '' : 'hidden';
    }

    function titleText(name, variant) {
      const wrap = document.createElement('div');
      wrap.className = variant === 'tile' ? 'title-text small' : 'title-text';
      let size;
      if (variant === 'tile') {
        // Hasta 2 líneas dentro del cuadrito
        const longestWord = Math.max(...name.split(/\s+/).map((w) => w.length));
        const perLine = Math.max(longestWord, Math.ceil(name.length / 2));
        size = Math.max(24, Math.min(56, Math.floor(330 / (perLine * 0.62))));
      } else {
        size = Math.max(70, Math.min(170, Math.floor(1500 / (name.length * 0.6))));
      }
      wrap.style.fontSize = `${size}px`;
      wrap.innerHTML = `<span class="stroke"></span><span class="fill"></span>`;
      wrap.querySelectorAll('span').forEach((s) => (s.textContent = name));
      return wrap;
    }

    function startVideo(g) {
      const v = document.createElement('video');
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.autoplay = true;
      v.addEventListener('playing', () => v.classList.add('ready'), { once: true });
      v.addEventListener('error', () => v.remove());
      chMedia.appendChild(v);

      if (g.video) {
        v.src = g.video;
        return;
      }

      // Los tráileres suelen partir con logos de la distribuidora: saltamos un poco.
      v.addEventListener(
        'loadedmetadata',
        () => {
          if (isFinite(v.duration) && v.duration > 30) v.currentTime = Math.min(12, v.duration * 0.12);
        },
        { once: true }
      );

      if (g.trailer && window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ capLevelToPlayerSize: true, startLevel: -1, maxBufferLength: 20, enableWorker: true });
        hls.on(window.Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            stopVideo();
            if (g.trailerMp4) startVideo({ ...g, trailer: null, video: g.trailerMp4 });
          }
        });
        hls.loadSource(g.trailer);
        hls.attachMedia(v);
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => v.play().catch(() => {}));
      } else if (g.trailerMp4) {
        v.src = g.trailerMp4;
      } else {
        v.remove();
      }
    }

    function stopVideo() {
      if (hls) {
        hls.destroy();
        hls = null;
      }
      chMedia.querySelectorAll('video').forEach((v) => {
        v.pause();
        v.removeAttribute('src');
        v.load();
        v.remove();
      });
    }

    function switchChannel(dir) {
      if (view !== 'channel' || games.length < 2) return;
      current = (current + dir + games.length) % games.length;
      fillChannel(games[current]);
      chTop.classList.remove('swap-next', 'swap-prev');
      chTop.offsetWidth; // reinicia la animación
      chTop.classList.add(dir > 0 ? 'swap-next' : 'swap-prev');
    }

    $('#btn-back').addEventListener('click', closeChannel);
    $('#ch-prev').addEventListener('click', () => switchChannel(-1));
    $('#ch-next').addEventListener('click', () => switchChannel(1));
    $('#btn-start').addEventListener('click', startGame);

    // ---------- Iniciar y "Jugando a…" ----------
    async function startGame() {
      if (view !== 'channel') return;
      const g = games[current];
      view = 'busy';
      const res = await api.launch(g.id);
      if (!res || !res.ok) {
        view = 'channel';
        toast(`No se pudo abrir: ${(res && res.error) || 'error desconocido'}`);
        return;
      }

      const flash = document.getElementById('flash');
      flash.classList.remove('on');
      flash.offsetWidth;
      flash.classList.add('on');
      await wait(320);

      stopVideo();
      channel.hidden = true;
      channel.classList.remove('enter');
      playing.querySelector('.pl-bg').style.backgroundImage = g.hero || g.tile ? `url("${g.hero || g.tile}")` : '';
      playing.querySelector('.pl-name').textContent = g.name;
      playing.hidden = false;
      playing.classList.add('enter');
      document.body.classList.add('playing');
      view = 'playing';
      nowPlaying.start(); // Spotify y Grupo a los lados

      const started = Date.now();
      const timeEl = playing.querySelector('.pl-time');
      const upd = () => {
        const s = Math.floor((Date.now() - started) / 1000);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        timeEl.textContent = h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
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
      menu.classList.remove('dimmed');
      if (current >= 0) setPage(Math.floor(current / PER_PAGE), false);
      await playing.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, easing: 'ease' }).finished;
      playing.hidden = true;
      playing.classList.remove('enter');
      view = 'menu';
      if (reason === 'not-started') toast('No se detectó que el juego abriera');
    }

    $('#btn-stop').addEventListener('click', () => {
      api.dismissPlaying();
      endPlaying('manual');
    });

    // ---------- Horas jugadas y logros ----------
    const U = window.NostalHubUtil;
    let summary = { perGame: {} };
    function statsLine(g) {
      const per = summary.perGame && g.appId && summary.perGame[g.appId];
      return [U.hours(g.playtimeMin), g.lastPlayed ? `Jugado ${U.ago(g.lastPlayed)}` : '', per && per.total ? `${per.done} de ${per.total} logros` : '']
        .filter(Boolean)
        .join('   ·   ');
    }
    if (api.getAchievementSummary) api.getAchievementSummary().then((s) => s && (summary = s));
    const offSummary = api.onSteamSummary ? api.onSteamSummary((s) => (summary = s || summary)) : null;

    const ACH_COLS = 12;
    let achList = [];
    let achSel = 0;
    let achToken = 0;
    const wa = $('#wii-ach');

    async function openAch() {
      if (view !== 'channel' || current < 0) return;
      const g = games[current];
      view = 'ach';
      wa.hidden = false;
      wa.classList.remove('leave');
      $('.wa-game').textContent = g.name;
      $('.wa-count').textContent = '';
      $('.wa-bar i').style.width = '0%';
      $('.wa-grid').innerHTML = '';
      $('.wa-sel').style.visibility = 'hidden';
      const msg = $('.wa-msg');
      msg.hidden = false;
      msg.innerHTML = '<div class="wa-spinner"></div>Cargando logros…';
      const token = ++achToken;
      const res = (api.getAchievements ? await api.getAchievements(g.appId) : null) || { status: 'error', list: [] };
      if (token !== achToken || view !== 'ach') return;
      if (res.status !== 'ok') {
        msg.innerHTML = U.achievementMessage(res);
        return;
      }
      msg.hidden = true;
      achList = U.sortAchievements(res.list);
      $('.wa-count').textContent = `${res.done} / ${res.total}`;
      $('.wa-bar i').style.width = `${res.total ? (res.done / res.total) * 100 : 0}%`;
      const grid = $('.wa-grid');
      achList.forEach((a, i) => {
        const cell = document.createElement('button');
        cell.className = `wa-cell${a.done ? '' : ' locked'}`;
        cell.dataset.i = i;
        cell.style.backgroundImage = `url("${a.done ? a.icon : a.iconGray || a.icon}")`;
        cell.addEventListener('mouseenter', () => setAch(i, false));
        cell.addEventListener('click', () => setAch(i, false));
        grid.appendChild(cell);
      });
      $('.wa-sel').style.visibility = '';
      setAch(0);
    }
    function setAch(i, scroll = true) {
      if (!achList.length) return;
      achSel = Math.max(0, Math.min(achList.length - 1, i));
      wa.querySelectorAll('.wa-cell').forEach((c) => c.classList.toggle('sel', Number(c.dataset.i) === achSel));
      const a = achList[achSel];
      const t = U.achievementTexts(a);
      $('.wa-sel-icon').style.backgroundImage = `url("${a.done ? a.icon : a.iconGray || a.icon}")`;
      $('.wa-sel-icon').classList.toggle('locked', !a.done);
      $('.wa-sel-name').textContent = t.name;
      $('.wa-sel-meta').textContent = [a.done ? `Desbloqueado el ${t.date}` : 'Bloqueado', t.percent].filter(Boolean).join('   ·   ');
      $('.wa-sel-desc').textContent = t.description;
      if (scroll) {
        const cell = wa.querySelector(`.wa-cell[data-i="${achSel}"]`);
        if (cell) cell.scrollIntoView({ block: 'nearest' });
      }
    }
    async function closeAch() {
      if (view !== 'ach') return;
      achToken++;
      wa.classList.add('leave');
      await wait(220);
      wa.hidden = true;
      wa.classList.remove('leave');
      view = 'channel';
    }
    $('#btn-ach').addEventListener('click', openAch);
    $('#wa-back').addEventListener('click', closeAch);


    // ---------- Configuración (engranaje) ----------
    // Las opciones vienen de main.js (las mismas del menú de la bandeja); aquí solo se dibujan al estilo Wii.
    const ws = $('#wii-set');
    const wsList = ws.querySelector('.ws-list');
    const wsSub = ws.querySelector('.ws-sub');
    const wsOpts = ws.querySelector('.ws-opts');
    let wsModel = [];
    let wsPage = 0;
    let wsFocus = 0; // opción marcada con el teclado en la lista
    let wsItem = null; // opción abierta en la sub-pantalla
    let wsPick = null; // valor elegido (aún sin confirmar)
    let wsOptFocus = 0;

    async function openSettings() {
      if (view !== 'menu') return;
      view = 'settings';
      wsModel = api.getMenu ? await api.getMenu() : [];
      wsPage = 0;
      wsFocus = 0;
      wsItem = null;
      menu.classList.add('dimmed');
      ws.hidden = false;
      ws.classList.remove('leave');
      ws.classList.add('enter');
      renderSettings();
    }

    async function closeSettings() {
      if (view !== 'settings') return;
      ws.classList.remove('enter');
      ws.classList.add('leave');
      await wait(260);
      ws.hidden = true;
      ws.classList.remove('leave');
      menu.classList.remove('dimmed');
      view = 'menu';
    }

    function renderSettings(anim) {
      const sec = wsModel[wsPage];
      const n = wsModel.length;
      ws.querySelector('.ws-sec').textContent = sec ? sec.title : '';
      ws.querySelector('.ws-num').textContent = n ? `${wsPage + 1}/${n}` : '';
      const sub = !!wsItem;
      ws.classList.toggle('in-sub', sub);
      wsSub.hidden = !sub;
      ws.querySelector('.ws-main').hidden = sub;
      $('#ws-prev').hidden = sub || wsPage === 0;
      $('#ws-next').hidden = sub || wsPage >= n - 1;
      $('#ws-ok').hidden = !sub;
      if (sub) return renderSub();

      wsList.innerHTML = '';
      wsList.classList.remove('from-left', 'from-right');
      if (anim) {
        wsList.offsetWidth;
        wsList.classList.add(anim);
      }
      (sec ? sec.items : []).forEach((it, i) => {
        const b = document.createElement('button');
        b.className = 'ws-item';
        b.dataset.i = i;
        const val = U.optionValueText(it);
        b.innerHTML = `<span class="ws-label"></span>${val ? '<span class="ws-val"></span>' : ''}`;
        b.querySelector('.ws-label').textContent = it.label;
        if (val) b.querySelector('.ws-val').textContent = val;
        b.addEventListener('mouseenter', () => setWsFocus(i));
        b.addEventListener('click', () => pickItem(it));
        wsList.appendChild(b);
      });
      setWsFocus(Math.min(wsFocus, ((sec && sec.items.length) || 1) - 1));
    }

    function setWsFocus(i) {
      wsFocus = Math.max(0, i);
      wsList.querySelectorAll('.ws-item').forEach((b) => b.classList.toggle('kfocus', Number(b.dataset.i) === wsFocus));
    }

    function setWsPage(p) {
      const next = Math.max(0, Math.min(wsModel.length - 1, p));
      if (next === wsPage) return;
      const dir = next > wsPage ? 'from-right' : 'from-left';
      wsPage = next;
      wsFocus = 0;
      if (ctx.sound) ctx.sound('page');
      renderSettings(dir);
    }

    async function pickItem(it) {
      if (it.type === 'action' && !it.confirm) {
        if (it.id === 'consoles') {
          ws.hidden = true;
          menu.classList.remove('dimmed');
          view = 'menu';
          return ctx.openSelector();
        }
        if (/^open-|^devtools$/.test(it.id)) toast('Se abrió en Windows');
        wsModel = (await api.runMenu(it.id)) || wsModel;
        if (view === 'settings' && !wsItem) renderSettings();
        return;
      }
      // Activar/desactivar, elegir entre varias o confirmar: sub-pantalla con Atrás / Confirmar
      wsItem = it;
      wsPick = it.type === 'action' ? null : it.value;
      renderSettings();
    }

    function renderSub() {
      const it = wsItem;
      ws.querySelector('.ws-sub-title').textContent = it.label;
      ws.querySelector('.ws-sub-desc').textContent = it.confirm ? '¿Seguro que quieres cerrar NostalHub?' : it.desc || '';
      $('#ws-ok').textContent = it.confirm ? 'Salir' : 'Confirmar';
      wsOpts.innerHTML = '';
      wsOpts.className = `ws-opts ${it.type}`;
      const opts =
        it.type === 'toggle'
          ? [
              { value: true, label: 'Activado' },
              { value: false, label: 'Desactivado' },
            ]
          : it.options || [];
      opts.forEach((o, i) => {
        const b = document.createElement('button');
        b.className = 'ws-opt';
        b.dataset.i = i;
        b.textContent = o.label;
        b.classList.toggle('sel', String(o.value) === String(wsPick));
        b.addEventListener('mouseenter', () => setOptFocus(i));
        b.addEventListener('click', () => {
          wsPick = o.value;
          setOptFocus(i);
          wsOpts.querySelectorAll('.ws-opt').forEach((x) => x.classList.toggle('sel', x === b));
        });
        wsOpts.appendChild(b);
      });
      const sel = opts.findIndex((o) => String(o.value) === String(wsPick));
      setOptFocus(sel >= 0 ? sel : 0);
      wsSub.classList.remove('pop');
      wsSub.offsetWidth;
      wsSub.classList.add('pop');
    }

    function setOptFocus(i) {
      const all = wsOpts.querySelectorAll('.ws-opt');
      if (!all.length) return;
      wsOptFocus = Math.max(0, Math.min(all.length - 1, i));
      all.forEach((b) => b.classList.toggle('kfocus', Number(b.dataset.i) === wsOptFocus));
    }

    function moveOpt(dir) {
      const all = wsOpts.querySelectorAll('.ws-opt');
      if (!all.length) return;
      setOptFocus(wsOptFocus + dir);
      all[wsOptFocus].click();
    }

    async function confirmSub() {
      const it = wsItem;
      if (!it) return;
      if (it.confirm) return api.runMenu(it.id);
      wsItem = null;
      if (wsPick !== undefined && String(wsPick) !== String(it.value)) wsModel = (await api.runMenu(it.id, wsPick)) || wsModel;
      if (view === 'settings') renderSettings();
    }

    function backSettings() {
      if (wsItem) {
        wsItem = null;
        renderSettings();
      } else closeSettings();
    }

    $('#ws-back').addEventListener('click', backSettings);
    $('#ws-ok').addEventListener('click', confirmSub);
    $('#ws-prev').addEventListener('click', () => setWsPage(wsPage - 1));
    $('#ws-next').addEventListener('click', () => setWsPage(wsPage + 1));
    ws.addEventListener('wheel', (e) => {
      if (view !== 'settings' || wsItem || Date.now() < wheelLock) return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) < 10) return;
      setWsPage(wsPage + (d > 0 ? 1 : -1));
      wheelLock = Date.now() + 450;
    });

    function settingsKey(e) {
      if (wsItem) {
        if (e.key === 'Escape' || e.key === 'Backspace') backSettings();
        else if (e.key === 'Enter') confirmSub();
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') moveOpt(-1);
        else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') moveOpt(1);
        return;
      }
      const count = wsList.querySelectorAll('.ws-item').length;
      if (e.key === 'Escape' || e.key === 'Backspace') closeSettings();
      else if (e.key === 'ArrowUp') setWsFocus(Math.max(0, wsFocus - 1));
      else if (e.key === 'ArrowDown') setWsFocus(Math.min(count - 1, wsFocus + 1));
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') setWsPage(wsPage - 1);
      else if (e.key === 'ArrowRight' || e.key === 'PageDown') setWsPage(wsPage + 1);
      else if (e.key === 'Enter') {
        const sec = wsModel[wsPage];
        if (sec && sec.items[wsFocus]) pickItem(sec.items[wsFocus]);
      }
    }

    // ---------- Teclado ----------
    function onKey(e) {
      // Enter/espacio no deben "apretar" además el último botón clickeado con el mouse
      if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
      if (view === 'settings') return settingsKey(e);
      if (view === 'ach') {
        if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'Enter') closeAch();
        else if (e.key === 'ArrowLeft') setAch(achSel - 1);
        else if (e.key === 'ArrowRight') setAch(achSel + 1);
        else if (e.key === 'ArrowUp') setAch(achSel - ACH_COLS);
        else if (e.key === 'ArrowDown') setAch(achSel + ACH_COLS);
        return;
      }
      if (view === 'channel') {
        if (e.key === 'ArrowDown' && !$('#btn-ach').hidden) return openAch(); // ↓ abre los logros
        if (e.key === 'Escape' || e.key === 'Backspace') closeChannel();
        else if (e.key === 'Enter') startGame();
        else if (e.key === 'ArrowLeft') switchChannel(-1);
        else if (e.key === 'ArrowRight') switchChannel(1);
      } else if (view === 'menu') {
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') setPage(page - 1);
        else if (e.key === 'ArrowRight' || e.key === 'PageDown') setPage(page + 1);
        else if (e.key === 'Escape') ctx.openSelector();
      }
    }
    window.addEventListener('keydown', onKey);

    const toast = ctx.toast;

    // ---------- Datos ----------
    function setGames(list) {
      const openId = current >= 0 && games[current] ? games[current].id : null;
      games = list || [];
      if (openId) {
        const idx = games.findIndex((g) => g.id === openId);
        if (idx >= 0) current = idx;
        else if (view === 'channel') {
          current = -1;
          channel.hidden = true;
          stopVideo();
          menu.classList.remove('dimmed');
          view = 'menu';
        }
      }
      renderGrid();
      // Si la pantalla de canal está abierta, refresca el arte sin cortar el video
      if (view === 'channel' && current >= 0) {
        const g = games[current];
        const hero = chMedia.querySelector('img.hero');
        if (hero && (g.hero || g.tile) && hero.src !== (g.hero || g.tile)) hero.src = g.hero || g.tile;
      }
    }

    const offGames = api.onGamesUpdated(setGames);
    const offEnded = api.onGameEnded(({ reason }) => endPlaying(reason));
    api.getState().then((s) => {
      setGames(s.games);
      // Entrada: los canales aparecen uno tras otro
      menu.classList.add('intro');
      setTimeout(() => menu.classList.remove('intro'), 1400);
    });

    return {
      unmount() {
        nowPlaying.dispose();
        stopVideo();
        clearInterval(tickTimer);
        clearInterval(playTimer);
        window.removeEventListener('keydown', onKey);
        if (offGames) offGames();
        if (offSummary) offSummary();
        if (offEnded) offEnded();
        document.body.classList.remove('playing');
        root.innerHTML = '';
      },
    };
  }
})();
