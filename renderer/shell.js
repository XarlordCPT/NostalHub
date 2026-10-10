/* Shell: escala el escenario, muestra el selector de consolas y monta el tema elegido. */
(() => {
  const api = window.nostalhub || window.mockNostalHub;
  const CONSOLES = window.CONSOLES || [];
  const STAGE_W = 1920;
  const STAGE_H = 1080;

  const $ = (sel) => document.querySelector(sel);
  const stage = $('#stage');
  const selector = $('#selector');
  const track = $('#sel-track');
  const bgA = $('#sel-bg-a');
  const bgB = $('#sel-bg-b');
  const themeRoot = $('#theme-root');

  let index = 0;
  let mode = 'selector'; // selector | entering | theme | leaving
  let theme = null; // { id, instance }
  let assets = {}; // { wii: { icon, background } }
  let modelTilt = {}; // cómo se para cada modelo 3D (lo eliges con clic derecho sobre el modelo)

  // ---------- Escalado ----------
  let scale = 1;
  function fit() {
    scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }
  window.addEventListener('resize', fit);
  fit();

  function stageRect(el) {
    const s = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { left: (r.left - s.left) / scale, top: (r.top - s.top) / scale, width: r.width / scale, height: r.height / scale };
  }

  // ---------- Barra de la ventana (modo ventana) ----------
  // Escondida; baja al llevar el mouse al borde de arriba. Minimizar, maximizar y cerrar con el estilo de cada consola.
  const winbar = $('#winbar');
  let winState = { mode: 'fullscreen', maximized: false };
  let barTimer = null;
  function applyWin(s) {
    if (s) winState = s;
    const windowed = winState.mode === 'window';
    document.body.classList.toggle('windowed', windowed);
    winbar.classList.toggle('max', !!winState.maximized);
    winbar.querySelector('.wb-max').title = winState.maximized ? 'Restaurar' : 'Maximizar';
    if (!windowed) showBar(false);
  }
  function showBar(on) {
    clearTimeout(barTimer);
    winbar.classList.toggle('show', on);
  }
  if (api.getWindowState) api.getWindowState().then(applyWin);
  if (api.onWindowState) api.onWindowState(applyWin);
  window.addEventListener('mousemove', (e) => {
    if (winState.mode !== 'window' || drag) return;
    if (e.clientY <= 8) showBar(true);
    else if (e.clientY <= 60) clearTimeout(barTimer);
    else if (winbar.classList.contains('show')) {
      clearTimeout(barTimer);
      barTimer = setTimeout(() => showBar(false), 300);
    }
  });
  document.documentElement.addEventListener('mouseleave', () => {
    if (winState.mode !== 'window' || !winbar.classList.contains('show')) return;
    clearTimeout(barTimer);
    barTimer = setTimeout(() => showBar(false), 900);
  });
  // Arrastrar la barra mueve la ventana; doble clic la maximiza
  let drag = null;
  const dragArea = winbar.querySelector('.wb-drag');
  dragArea.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || winState.mode !== 'window' || !api.windowDragStart) return;
    e.preventDefault();
    dragArea.setPointerCapture(e.pointerId);
    const d = { sx: e.screenX, sy: e.screenY, b: null, started: false, p: null };
    drag = d;
    if (!winState.maximized) d.p = api.windowDragStart(e.screenX, e.screenY).then((b) => (d.b = b));
  });
  dragArea.addEventListener('pointermove', (e) => {
    const d = drag;
    if (!d) return;
    if (!d.started) {
      if (Math.abs(e.screenX - d.sx) + Math.abs(e.screenY - d.sy) < 4) return;
      d.started = true;
      // estaba maximizada: primero vuelve a su tamaño, debajo del mouse
      if (!d.p) {
        const x = e.screenX;
        const y = e.screenY;
        d.p = api.windowDragStart(x, y).then((b) => ((d.b = b), (d.sx = x), (d.sy = y)));
      }
    }
    if (!d.b) return;
    api.windowDragMove(d.b.x + e.screenX - d.sx, d.b.y + e.screenY - d.sy, d.b.width, d.b.height);
  });
  const endDrag = () => (drag = null);
  dragArea.addEventListener('pointerup', endDrag);
  dragArea.addEventListener('pointercancel', endDrag);
  dragArea.addEventListener('dblclick', () => api.windowControl && api.windowControl('maximize').then((s) => s && applyWin(s)));

  winbar.querySelectorAll('[data-w]').forEach((b) =>
    b.addEventListener('click', () => {
      showBar(false);
      if (api.windowControl) api.windowControl(b.dataset.w).then((s) => s && applyWin(s));
    })
  );

  // ---------- Avisos ----------
  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
  }
  api.onToast && api.onToast(toast);

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- Selector ----------
  const GAMEPAD_SVG = `<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M30 14h60c14 0 24 10 27 26l2 14c2 12-10 20-19 12l-11-10H31L20 66c-9 8-21 0-19-12l2-14C6 24 16 14 30 14Z" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><path d="M30 32v16M22 40h16" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><circle cx="84" cy="34" r="4.5" fill="currentColor"/><circle cx="94" cy="44" r="4.5" fill="currentColor"/></svg>`;

  // Ajusta el tamaño de una imagen para que cubra cierta superficie (área), sin pasarse del máximo.
  // Así un logo ancho y uno cuadrado se ven parecidos de grandes.
  function fitBox(box, img, area, maxW, maxH, center = false) {
    const r = img.naturalWidth / img.naturalHeight;
    if (!r || !isFinite(r)) return;
    let h = Math.sqrt(area / r);
    let w = h * r;
    if (w > maxW) (w = maxW), (h = w / r);
    if (h > maxH) (h = maxH), (w = h * r);
    box.style.width = `${Math.round(w)}px`;
    box.style.height = `${Math.round(h)}px`;
    if (center) {
      box.style.inset = 'auto';
      box.style.left = `${Math.round((maxW - w) / 2)}px`;
      box.style.top = `${Math.round((maxH - h) / 2)}px`;
    }
  }

  // Menú chico para girar el modelo 3D de una consola
  const TILTS = [
    ['x90', 'Pararlo (pantalla hacia adelante)'],
    ['x-90', 'Pararlo (hacia el otro lado)'],
    ['z90', 'Ponerlo de costado'],
    ['x180', 'Darlo vuelta'],
    ['0', 'Como venía el modelo'],
  ];
  let tiltMenu = null;
  function closeTiltMenu() {
    if (tiltMenu) tiltMenu.remove();
    tiltMenu = null;
  }
  function openTiltMenu(e, current, onPick) {
    closeTiltMenu();
    const r = stage.getBoundingClientRect();
    const x = ((e.clientX - r.left) * STAGE_W) / r.width;
    const y = ((e.clientY - r.top) * STAGE_H) / r.height;
    const m = document.createElement('div');
    m.className = 'sel-tilt';
    m.innerHTML = `<div class="sel-tilt-h">Girar el modelo 3D</div>${TILTS.map(([v, l]) => `<button data-t="${v}" class="${v === current ? 'on' : ''}">${l}</button>`).join('')}`;
    m.style.left = `${Math.min(x, STAGE_W - 560)}px`;
    m.style.top = `${Math.min(y, STAGE_H - 420)}px`;
    ['pointerdown', 'click', 'mousedown'].forEach((t) => m.addEventListener(t, (ev) => ev.stopPropagation()));
    m.querySelectorAll('button').forEach((b) =>
      b.addEventListener('click', () => {
        closeTiltMenu();
        onPick(b.dataset.t);
      })
    );
    selector.appendChild(m);
    tiltMenu = m;
  }
  document.addEventListener('pointerdown', (e) => tiltMenu && !tiltMenu.contains(e.target) && closeTiltMenu(), true);
  window.addEventListener('keydown', (e) => tiltMenu && e.key === 'Escape' && (e.stopImmediatePropagation(), closeTiltMenu()), true);

  function renderItems() {
    track.innerHTML = '';
    CONSOLES.forEach((c, i) => {
      const item = document.createElement('div');
      item.className = 'sel-item';
      item.dataset.index = i;
      const look = c.look || {};
      item.style.setProperty('--text', look.text || '#555');
      item.style.setProperty('--subtext', look.subtext || '#999');
      item.style.setProperty('--accent', look.accent || '#34bfed');
      item.style.setProperty('--font', look.font || 'inherit');
      item.style.setProperty('--weight', look.nameWeight || 800);
      if (look.nameShadow) item.style.setProperty('--name-shadow', look.nameShadow);

      const info = document.createElement('div');
      info.className = 'sel-info';
      const company = document.createElement('div');
      company.className = 'sel-company';
      company.textContent = c.year ? `${c.company} · ${c.year}` : c.company;
      const name = document.createElement('div');
      name.className = 'sel-name';
      name.textContent = c.name;
      name.style.fontSize = `${Math.max(110, Math.min(250, Math.floor(1650 / Math.max(c.name.length, 6.6))))}px`;
      const hint = document.createElement('div');
      hint.className = 'sel-enter';
      hint.innerHTML = '<span>Entrar</span>';
      const a0 = assets[c.id] || {};
      if (a0.logo) {
        // Logo propio (consolas/<id>/logo.png) en vez del nombre escrito
        name.textContent = '';
        name.classList.add('has-logo');
        const img = document.createElement('img');
        img.src = a0.logo;
        img.alt = c.name;
        // Todos los logos ocupan más o menos la misma superficie, sean anchos o cuadrados
        img.onload = () => fitBox(name, img, 115000, 900, 330);
        img.onerror = () => {
          name.classList.remove('has-logo');
          name.textContent = c.name;
        };
        name.appendChild(img);
      }
      info.append(company, name, hint);

      const icon = document.createElement('div');
      icon.className = 'sel-icon';
      const a = assets[c.id] || {};
      const showImage = () => {
        icon.classList.remove('has-model');
        icon.querySelectorAll('.sel-model').forEach((m) => m.remove());
        if (a.icon) {
          const img = document.createElement('img');
          img.src = a.icon;
          img.alt = c.name;
          img.onload = () => fitBox(img, img, 190000, 520, 520, true);
          icon.appendChild(img);
        } else {
          icon.classList.add('placeholder');
          icon.innerHTML = GAMEPAD_SVG;
        }
      };
      // Modelo 3D (consolas/<id>/modelo.glb): gira en vez de la imagen. Si no carga, vuelve la imagen.
      const tiltOf = () => modelTilt[c.id] || c.modelTilt || '0';
      if (a.model && window.ConsoleModel) window.ConsoleModel.attach(icon, a.model, showImage, tiltOf());
      else showImage();
      // Clic derecho sobre el modelo: pararlo o girarlo (para modelos que vienen acostados)
      icon.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (!icon.classList.contains('has-model')) return;
        if (tiltMenu === null) setTimeout(() => tiltMenu && tiltMenu.style.setProperty('--accent', (c.look || {}).accent || '#34bfed'));
        openTiltMenu(e, tiltOf(), async (tilt) => {
          if (api.setModelTilt) modelTilt = (await api.setModelTilt(c.id, tilt)) || modelTilt;
          else modelTilt = { ...modelTilt, [c.id]: tilt };
          icon.querySelectorAll('.sel-model').forEach((m) => m.remove());
          window.ConsoleModel.attach(icon, a.model, showImage, tilt);
        });
      });

      item.append(info, icon);
      item.addEventListener('click', () => {
        const n = Number(item.dataset.index); // (cambia al mover consolas)
        if (moving) return n === index && endMove(true);
        n === index ? enter() : select(n);
      });
      track.appendChild(item);
    });
    layout(false);
    paintBackground(false);
  }

  // Posiciona los elementos: el elegido al centro, los vecinos asomándose arriba y abajo
  function layout(animate = true) {
    track.querySelectorAll('.sel-item').forEach((el) => {
      const d = Number(el.dataset.index) - index;
      el.classList.toggle('active', d === 0);
      el.classList.toggle('near', Math.abs(d) === 1);
      el.style.transition = animate ? '' : 'none';
      el.style.transform = `translateY(${d * 620}px) scale(${d === 0 ? 1 : 0.8})`;
      el.style.opacity = d === 0 ? 1 : Math.abs(d) === 1 ? 0.28 : 0;
      el.style.pointerEvents = Math.abs(d) <= 1 ? '' : 'none';
    });
    $('#sel-up').classList.toggle('off', index === 0);
    $('#sel-down').classList.toggle('off', index >= CONSOLES.length - 1);
  }

  // Color de acento que se lea sobre blanco: si el de la consola es muy claro (PS3, PS4), usa su color de fondo
  function uiAccent(look) {
    const a = look.accent || '#34bfed';
    const m = /^#([0-9a-f]{6})$/i.exec(a);
    if (!m) return a;
    const n = parseInt(m[1], 16);
    const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
    return lum > 0.72 ? look.base || '#4b4b4b' : a;
  }

  let bgFront = bgA;
  function paintBackground(animate = true) {
    const c = CONSOLES[index];
    if (!c) return;
    const look = c.look || {};
    const custom = assets[c.id] && assets[c.id].background;
    const back = bgFront === bgA ? bgB : bgA;
    back.style.background = custom ? `center / cover no-repeat url("${custom}")` : look.background || look.base || '#222';
    back.style.transition = animate ? '' : 'none';
    back.style.opacity = 1;
    bgFront.style.transition = animate ? '' : 'none';
    bgFront.style.opacity = 0;
    back.style.zIndex = 1;
    bgFront.style.zIndex = 0;
    bgFront = back;
    document.body.style.backgroundColor = look.base || '#222';
    stage.style.setProperty('--sel-accent', look.accent || '#34bfed');
    stage.style.setProperty('--sel-ui', uiAccent(look)); // para el botón y menú de ordenar (sobre fondo blanco)
  }

  function select(i) {
    if (mode !== 'selector') return;
    const next = Math.max(0, Math.min(CONSOLES.length - 1, i));
    if (next === index) return;
    index = next;
    layout();
    paintBackground();
  }

  async function enter() {
    if (mode !== 'selector') return;
    const c = CONSOLES[index];
    const factory = window.Themes && window.Themes[c.id];
    if (!factory) {
      toast(`El menú de ${c.name} todavía no está hecho`);
      return;
    }
    mode = 'entering';
    if (api.selectConsole) api.selectConsole(c.id);

    const flash = $('#sel-flash');
    const introUrl = settings.intros && assets[c.id] && assets[c.id].intro;
    flash.style.background = introUrl ? '#000' : (c.look && c.look.enterFlash) || '#fff';
    selector.classList.add('entering'); // el elegido crece un poco
    await flash.animate([{ opacity: 0 }, { opacity: 1 }], { duration: introUrl ? 350 : 480, easing: 'ease-in', fill: 'forwards' }).finished;
    if (introUrl) await playIntro(introUrl);

    setThemeCss(c.id, true);
    themeRoot.className = `theme-${c.id}`;
    document.body.dataset.console = c.id; // la barra de la ventana toma el estilo de la consola
    $('#winbar .wb-sub').textContent = c.name;
    themeRoot.hidden = false;
    theme = { id: c.id, instance: factory.mount(themeRoot, { api, stage, stageRect, toast, openSelector: leave, sound: (kind) => Sound.play(kind), duckMusic: (on) => Sound.duck(on), soundSettings: () => ({ ...settings }), hasAsset: (kind) => !!(assets[c.id] && assets[c.id][kind]) }) };
    selector.hidden = true;
    selector.classList.remove('entering');
    await wait(120);
    Sound.play('start', c.id); // sonido de inicio (inicio.wav), después del video si hubo
    Sound.startMusic(c.id);
    await flash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, easing: 'ease-out', fill: 'forwards' }).finished;
    mode = 'theme';
  }

  async function leave() {
    if (mode !== 'theme') return;
    mode = 'leaving';
    Sound.stopMusic();
    await themeRoot.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease' }).finished;
    if (theme && theme.instance && theme.instance.unmount) theme.instance.unmount();
    if (theme) setThemeCss(theme.id, false);
    theme = null;
    themeRoot.hidden = true;
    themeRoot.className = '';
    delete document.body.dataset.console;
    $('#winbar .wb-sub').textContent = '';
    selector.hidden = false;
    paintBackground(false);
    layout(false);
    mode = 'selector'; // ya se puede usar mientras termina de aparecer
    selector.animate([{ opacity: 0, transform: 'scale(1.04)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'ease-out' });
  }

  // CSS de cada tema: se carga una vez y se activa/desactiva para que no choquen entre sí
  function setThemeCss(id, on) {
    let link = document.querySelector(`link[data-theme="${id}"]`);
    if (!link && on) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `themes/${id}/theme.css`;
      link.dataset.theme = id;
      document.head.appendChild(link);
    }
    if (link) link.disabled = !on;
  }

  // ---------- Sonido: música de fondo, efectos y video de inicio ----------
  // Los archivos los pones tú en %APPDATA%\\NostalHub\\consolas\\<consola>\\ (ver MANUAL.md)
  let settings = { music: true, sounds: true, intros: true, musicVolume: 0.35, sfxVolume: 0.6 };

  const Sound = {
    music: null,
    musicId: null,
    fadeTimer: null,
    pausedForGame: false,
    lastMove: 0,

    fadeTo(target, ms, done) {
      clearInterval(this.fadeTimer);
      const a = this.music;
      if (!a) return done && done();
      const start = a.volume;
      const t0 = performance.now();
      this.fadeTimer = setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / ms);
        a.volume = Math.max(0, Math.min(1, start + (target - start) * k));
        if (k >= 1) {
          clearInterval(this.fadeTimer);
          if (done) done();
        }
      }, 40);
    },

    startMusic(id) {
      this.stopMusic(true);
      this.ducked = false;
      const url = assets[id] && assets[id].music;
      this.musicId = id;
      if (!url || !settings.music) return;
      const a = new Audio(url);
      a.loop = true;
      a.volume = 0;
      this.music = a;
      a.play().catch(() => {});
      this.fadeTo(settings.musicVolume, 1200);
    },

    stopMusic(immediate = false) {
      const a = this.music;
      this.music = null;
      clearInterval(this.fadeTimer);
      if (!a) return;
      if (immediate) {
        a.pause();
        return;
      }
      const start = a.volume;
      const t0 = performance.now();
      const timer = setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / 500);
        a.volume = Math.max(0, start * (1 - k));
        if (k >= 1) {
          clearInterval(timer);
          a.pause();
        }
      }, 40);
    },

    // Baja la música de la consola mientras suena otra cosa (la música de un juego en la PS3)
    duck(on) {
      this.ducked = !!on;
      if (this.music && !this.pausedForGame) this.fadeTo(on ? settings.musicVolume * 0.12 : settings.musicVolume, on ? 500 : 900);
    },

    // Mientras juegas, la música se pausa; al volver, sigue donde quedó
    setGamePaused(paused) {
      if (!this.music || paused === this.pausedForGame) return;
      this.pausedForGame = paused;
      if (paused) this.fadeTo(0, 400, () => this.music && this.music.pause());
      else {
        this.music.play().catch(() => {});
        this.fadeTo(this.ducked ? settings.musicVolume * 0.12 : settings.musicVolume, 1000);
      }
    },

    // Los sonidos del teclado y del mouse esperan un instante antes de sonar: así, si el tema pide
    // un sonido más específico en la misma tecla (por ejemplo 'page' al cambiar de página), suena solo ese.
    pending: null,
    queue(kind) {
      clearTimeout(this.pending);
      this.pending = setTimeout(() => {
        this.pending = null;
        this.play(kind);
      }, 0);
    },

    // Efecto corto: 'move' (mover/pasar el mouse), 'select' (elegir), 'back' (volver),
    // 'page' (cambiar de página), 'start' (al entrar a la consola)
    play(kind, consoleId) {
      if (!settings.sounds) return;
      const id = consoleId || (theme && theme.id) || (CONSOLES[index] && CONSOLES[index].id);
      const url = assets[id] && assets[id][kind];
      if (!url) {
        // Sin archivo propio: algunos temas traen su sonido hecho con código (PS3)
        const f = window.Themes && window.Themes[id];
        if (f && f.synth && (kind !== 'move' || performance.now() - this.lastMove >= 45)) {
          if (kind === 'move') this.lastMove = performance.now();
          f.synth(kind, settings.sfxVolume);
        }
        return;
      }
      if (!['move', 'select', 'back'].includes(kind) && this.pending) {
        clearTimeout(this.pending); // un sonido más específico (página, botón, borde…) reemplaza al de mover / elegir de esa misma tecla o clic
        this.pending = null;
      }
      if (kind === 'move') {
        const now = performance.now();
        if (now - this.lastMove < 45) return; // evita una ráfaga de sonidos
        this.lastMove = now;
      }
      const a = new Audio(url);
      a.volume = settings.sfxVolume;
      a.play().catch(() => {});
    },

    apply(next) {
      settings = { ...settings, ...(next || {}) };
      if (!settings.music) this.stopMusic();
      else if (!this.music && theme && mode === 'theme') this.startMusic(theme.id);
      else if (this.music && !this.pausedForGame) this.fadeTo(this.ducked ? settings.musicVolume * 0.12 : settings.musicVolume, 300);
    },
  };

  // Pausa la música cuando un tema marca "jugando" (body.playing)
  new MutationObserver(() => Sound.setGamePaused(document.body.classList.contains('playing'))).observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
  });

  // Efectos con el teclado (en todos los menús)
  window.addEventListener(
    'keydown',
    (e) => {
      if (mode === 'intro' || mode === 'entering' || mode === 'leaving' || e.repeat) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(e.key)) Sound.queue('move');
      else if (e.key === 'Enter' || e.key === ' ') Sound.queue('select');
      else if (e.key === 'Escape' || e.key === 'Backspace') Sound.queue('back');
      else if (mode === 'theme' && /^[qeQE]$/.test(e.key)) Sound.queue('move');
    },
    true
  );

  // Efectos con el mouse: al pasar sobre algo que se puede elegir, y al hacer clic
  const HOVERABLE = 'button, [data-nav], .tile.game, .ps-cell, .sel-item, .xb-flow-item, .xb-ach-cell';
  let lastHover = null;
  stage.addEventListener('mouseover', (e) => {
    const el = e.target.closest(HOVERABLE);
    if (el && el !== lastHover && !el.disabled && mode !== 'intro') Sound.play('move');
    lastHover = el;
  });
  stage.addEventListener(
    'click',
    (e) => {
      // e.detail === 0 = clic hecho con Enter (ese ya sonó en el teclado)
      if (e.detail === 0 || mode === 'intro') return;
      if (e.target.closest(HOVERABLE)) Sound.queue('select');
    },
    true
  );

  // Video de inicio a pantalla completa. Enter, Esc, espacio o clic lo saltan.
  function playIntro(url) {
    return new Promise((resolve) => {
      const prevMode = mode;
      mode = 'intro';
      const box = document.createElement('div');
      box.className = 'intro-video';
      const v = document.createElement('video');
      v.src = url;
      v.autoplay = true;
      v.playsInline = true;
      v.volume = Math.max(settings.musicVolume, settings.sfxVolume, 0.5);
      const skip = document.createElement('div');
      skip.className = 'intro-skip';
      skip.textContent = 'Enter para saltar';
      box.append(v, skip);
      stage.appendChild(box);
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        window.removeEventListener('keydown', onKey, true);
        v.pause();
        box.remove();
        mode = prevMode;
        resolve();
      };
      const onKey = (e) => {
        if (['Enter', 'Escape', ' '].includes(e.key)) {
          e.stopPropagation();
          e.preventDefault();
          finish();
        }
      };
      window.addEventListener('keydown', onKey, true);
      box.addEventListener('click', finish);
      v.addEventListener('ended', finish);
      v.addEventListener('error', finish);
      v.play().catch(() => {
        // si no se puede reproducir con sonido, se intenta en silencio
        v.muted = true;
        v.play().catch(finish);
      });
      setTimeout(() => skip.classList.add('show'), 1500);
    });
  }

  if (api.getSettings) api.getSettings().then((s) => Sound.apply(s));
  if (api.onSettings) api.onSettings((s) => Sound.apply(s));

  // ---------- Controles del selector ----------
  $('#sel-up').addEventListener('click', () => (moving ? moveBy(-1) : select(index - 1)));
  $('#sel-down').addEventListener('click', () => (moving ? moveBy(1) : select(index + 1)));

  // ---------- Orden de las consolas: personalizado, por fecha, nombre o empresa (botón abajo o tecla O) ----------
  const BASE = [...CONSOLES];
  const SORTS = [
    ['custom', 'Personalizado'],
    ['year', 'Fecha de salida (más antiguas primero)'],
    ['year-desc', 'Fecha de salida (más nuevas primero)'],
    ['name', 'Nombre'],
    ['company', 'Empresa'],
  ];
  const SHORT = { custom: 'Personalizado', year: 'Más antiguas primero', 'year-desc': 'Más nuevas primero', name: 'Por nombre', company: 'Por empresa' };
  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem('nostalhub.' + k);
        return v == null ? d : v;
      } catch {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem('nostalhub.' + k, v);
      } catch {}
    },
  };
  let sortMode = store.get('consoleSort', 'custom');
  if (!SHORT[sortMode]) sortMode = 'custom';
  let customOrder = [];
  try {
    customOrder = JSON.parse(store.get('consoleOrder', '[]')) || [];
  } catch {}
  function orderedList(m) {
    const byName = (a, b) => a.name.localeCompare(b.name, 'es');
    const byYear = (a, b) => (a.year || 0) - (b.year || 0);
    if (m === 'year') return [...BASE].sort((a, b) => byYear(a, b) || byName(a, b));
    if (m === 'year-desc') return [...BASE].sort((a, b) => byYear(b, a) || byName(a, b));
    if (m === 'name') return [...BASE].sort(byName);
    if (m === 'company') return [...BASE].sort((a, b) => a.company.localeCompare(b.company, 'es') || byYear(a, b));
    // personalizado: las que no estén en tu orden (consolas nuevas) van al final
    const pos = (c) => (customOrder.includes(c.id) ? customOrder.indexOf(c.id) : 1000 + BASE.indexOf(c));
    return [...BASE].sort((a, b) => pos(a) - pos(b));
  }
  function applyOrder(rerender = true) {
    const keep = CONSOLES[index] && CONSOLES[index].id;
    CONSOLES.splice(0, CONSOLES.length, ...orderedList(sortMode));
    const i = CONSOLES.findIndex((c) => c.id === keep);
    index = i >= 0 ? i : 0;
    $('#sel-sort .sel-sort-l').textContent = SHORT[sortMode];
    if (rerender) renderItems();
  }
  function setSort(m) {
    sortMode = m;
    store.set('consoleSort', m);
    applyOrder();
  }

  // Menú para elegir el orden
  let sortMenu = null; // { el, items, sel }
  function openSortMenu() {
    if (mode !== 'selector' || moving) return;
    closeSortMenu();
    const c = CONSOLES[index];
    const items = [
      ...SORTS.map(([m, l]) => ({ label: l, on: m === sortMode, run: () => setSort(m) })),
      { label: `Mover ${c ? c.name : 'esta consola'}…`, move: true, run: startMove },
    ];
    const el = document.createElement('div');
    el.className = 'sel-tilt sel-sortmenu';
    el.innerHTML = `<div class="sel-tilt-h">Ordenar consolas</div>${items.map((it, i) => `<button data-i="${i}" class="${it.on ? 'on' : ''}${it.move ? ' mv' : ''}">${it.label}</button>`).join('')}`;
    ['pointerdown', 'click', 'mousedown', 'wheel'].forEach((t) => el.addEventListener(t, (ev) => ev.stopPropagation()));
    el.querySelectorAll('button').forEach((b) => {
      b.addEventListener('mouseenter', () => setSortSel(Number(b.dataset.i)));
      b.addEventListener('click', () => pickSort(Number(b.dataset.i)));
    });
    el.style.setProperty('--accent', uiAccent((c && c.look) || {}));
    selector.appendChild(el);
    sortMenu = { el, items, sel: Math.max(0, items.findIndex((x) => x.on)) };
    setSortSel(sortMenu.sel);
  }
  function setSortSel(i) {
    if (!sortMenu) return;
    sortMenu.sel = (i + sortMenu.items.length) % sortMenu.items.length;
    sortMenu.el.querySelectorAll('button').forEach((b) => b.classList.toggle('kf', Number(b.dataset.i) === sortMenu.sel));
  }
  function pickSort(i) {
    const it = sortMenu && sortMenu.items[i];
    closeSortMenu();
    if (it) it.run();
  }
  function closeSortMenu() {
    if (sortMenu) sortMenu.el.remove();
    sortMenu = null;
  }
  $('#sel-sort').addEventListener('click', (e) => {
    e.stopPropagation();
    sortMenu ? closeSortMenu() : openSortMenu();
  });
  document.addEventListener('pointerdown', (e) => sortMenu && !sortMenu.el.contains(e.target) && !e.target.closest('#sel-sort') && closeSortMenu(), true);

  // Mover una consola (orden personalizado): ↑ ↓ la cambia de lugar, Enter la deja, Esc cancela
  let moving = null; // { before: [ids] }
  function startMove() {
    if (sortMode !== 'custom') {
      customOrder = CONSOLES.map((c) => c.id); // parte desde el orden que estás viendo
      sortMode = 'custom';
      store.set('consoleSort', 'custom');
      $('#sel-sort .sel-sort-l').textContent = SHORT.custom;
    }
    moving = { before: CONSOLES.map((c) => c.id) };
    selector.classList.add('moving');
    const hint = $('.sel-move-hint');
    hint.innerHTML = `Moviendo <b>${CONSOLES[index].name}</b> · <kbd>↑</kbd><kbd>↓</kbd> para cambiarla de lugar · <kbd>Enter</kbd> dejarla · <kbd>Esc</kbd> cancelar`;
    hint.hidden = false;
    layout();
  }
  function moveBy(d) {
    const j = index + d;
    if (!moving || j < 0 || j >= CONSOLES.length) return;
    [CONSOLES[index], CONSOLES[j]] = [CONSOLES[j], CONSOLES[index]];
    const a = track.querySelector(`.sel-item[data-index="${index}"]`);
    const b = track.querySelector(`.sel-item[data-index="${j}"]`);
    if (a) a.dataset.index = j;
    if (b) b.dataset.index = index;
    index = j;
    layout();
  }
  function endMove(save) {
    if (!moving) return;
    const before = moving.before;
    moving = null;
    selector.classList.remove('moving');
    $('.sel-move-hint').hidden = true;
    if (save) {
      customOrder = CONSOLES.map((c) => c.id);
      store.set('consoleOrder', JSON.stringify(customOrder));
      layout();
    } else {
      const keep = CONSOLES[index].id;
      CONSOLES.sort((x, y) => before.indexOf(x.id) - before.indexOf(y.id));
      index = CONSOLES.findIndex((c) => c.id === keep);
      renderItems();
    }
  }

  // Teclas del orden (antes que las del selector)
  window.addEventListener(
    'keydown',
    (e) => {
      if (mode !== 'selector') return;
      const k = e.key;
      if (sortMenu) {
        e.stopImmediatePropagation();
        e.preventDefault();
        if (k === 'ArrowDown') setSortSel(sortMenu.sel + 1);
        else if (k === 'ArrowUp') setSortSel(sortMenu.sel - 1);
        else if (k === 'Enter' || k === ' ') pickSort(sortMenu.sel);
        else if (k === 'Escape' || k === 'o' || k === 'O' || k === 'Backspace') closeSortMenu();
        return;
      }
      if (moving) {
        e.stopImmediatePropagation();
        e.preventDefault();
        if (k === 'ArrowUp') moveBy(-1);
        else if (k === 'ArrowDown') moveBy(1);
        else if (k === 'Enter' || k === ' ') endMove(true);
        else if (k === 'Escape' || k === 'Backspace') endMove(false);
        return;
      }
      if ((k === 'o' || k === 'O') && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        openSortMenu();
      }
    },
    true
  );

  let wheelLock = 0;
  selector.addEventListener('wheel', (e) => {
    if (Date.now() < wheelLock || Math.abs(e.deltaY) < 10) return;
    if (moving) moveBy(e.deltaY > 0 ? 1 : -1);
    else select(index + (e.deltaY > 0 ? 1 : -1));
    wheelLock = Date.now() + 380;
  });

  // ---------- Confirmación para cerrar ----------
  const quitBox = $('#quit-confirm');
  let quitChoice = 0; // 0 = Cerrar, 1 = Cancelar
  function setQuitChoice(i) {
    quitChoice = (i + 2) % 2;
    $('#qc-yes').classList.toggle('on', quitChoice === 0);
    $('#qc-no').classList.toggle('on', quitChoice === 1);
  }
  function openQuit() {
    if (mode !== 'selector') return;
    mode = 'confirm';
    quitBox.hidden = false;
    quitBox.classList.remove('closing');
    setQuitChoice(0);
  }
  async function closeQuit() {
    if (mode !== 'confirm') return;
    quitBox.classList.add('closing');
    await wait(180);
    quitBox.hidden = true;
    mode = 'selector';
  }
  function doQuit() {
    quitBox.classList.add('bye');
    setTimeout(() => (api.quitApp ? api.quitApp() : window.close()), 250);
  }
  $('#qc-yes').addEventListener('click', doQuit);
  $('#qc-no').addEventListener('click', closeQuit);
  $('#qc-yes').addEventListener('mouseenter', () => setQuitChoice(0));
  $('#qc-no').addEventListener('mouseenter', () => setQuitChoice(1));
  quitBox.addEventListener('click', (e) => {
    if (e.target === quitBox) closeQuit(); // clic fuera del cuadro = cancelar
  });

  window.addEventListener('keydown', (e) => {
    if (mode === 'confirm') {
      if (e.key === 'Escape') doQuit();
      else if (e.key === 'Enter' || e.key === ' ') quitChoice === 0 ? doQuit() : closeQuit();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Tab') {
        e.preventDefault();
        setQuitChoice(quitChoice + 1);
      }
      return;
    }
    if (mode !== 'selector') return;
    if (e.key === 'Escape') openQuit();
    else if (e.key === 'ArrowUp') select(index - 1);
    else if (e.key === 'ArrowDown') select(index + 1);
    else if (e.key === 'Enter' || e.key === ' ') enter();
  });

  // El menú de la bandeja / engranaje puede pedir volver al selector
  api.onShowSelector && api.onShowSelector(() => leave());

  async function loadAssets() {
    if (!api.getConsoleAssets) return;
    const res = await api.getConsoleAssets(CONSOLES.map((c) => c.id));
    assets = (res && res.assets) || {};
    modelTilt = (res && res.modelTilt) || {};
    return res;
  }

  api.onConsolesUpdated &&
    api.onConsolesUpdated(async () => {
      const prevMusic = theme && assets[theme.id] && assets[theme.id].music;
      await loadAssets();
      renderItems();
      const nextMusic = theme && assets[theme.id] && assets[theme.id].music;
      if (theme && mode === 'theme' && prevMusic !== nextMusic) Sound.startMusic(theme.id);
    });

  // ---------- Contador de fotogramas (F3) ----------
  // Muestra cuántos cuadros por segundo dibuja la app y el cuadro más lento del último segundo.
  let fpsBox = null;
  let fpsRaf = 0;
  function toggleFps() {
    if (fpsBox) {
      cancelAnimationFrame(fpsRaf);
      fpsBox.remove();
      fpsBox = null;
      return;
    }
    fpsBox = document.createElement('div');
    fpsBox.id = 'fps';
    fpsBox.textContent = '… FPS';
    stage.appendChild(fpsBox);
    let frames = 0;
    let worst = 0;
    let last = performance.now();
    let t0 = last;
    const tick = (t) => {
      worst = Math.max(worst, t - last);
      last = t;
      frames++;
      if (t - t0 >= 1000) {
        fpsBox.textContent = `${Math.round((frames * 1000) / (t - t0))} FPS · más lento ${Math.round(worst)} ms`;
        frames = 0;
        worst = 0;
        t0 = t;
      }
      fpsRaf = requestAnimationFrame(tick);
    };
    fpsRaf = requestAnimationFrame(tick);
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F3') {
      e.preventDefault();
      toggleFps();
    }
  });

  // ---------- Inicio ----------
  (async () => {
    const res = await loadAssets();
    const last = res && res.last;
    CONSOLES.splice(0, CONSOLES.length, ...orderedList(sortMode)); // tu orden de consolas
    $('#sel-sort .sel-sort-l').textContent = SHORT[sortMode];
    const i = CONSOLES.findIndex((c) => c.id === last);
    index = i >= 0 ? i : 0;
    renderItems();
    selector.classList.add('intro');
  })();
})();
