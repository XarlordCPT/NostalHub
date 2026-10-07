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
      if (a.model && window.ConsoleModel) window.ConsoleModel.attach(icon, a.model, showImage);
      else showImage();

      item.append(info, icon);
      item.addEventListener('click', () => (i === index ? enter() : select(i)));
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
    themeRoot.hidden = false;
    theme = { id: c.id, instance: factory.mount(themeRoot, { api, stage, stageRect, toast, openSelector: leave, sound: (kind) => Sound.play(kind) }) };
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

    // Mientras juegas, la música se pausa; al volver, sigue donde quedó
    setGamePaused(paused) {
      if (!this.music || paused === this.pausedForGame) return;
      this.pausedForGame = paused;
      if (paused) this.fadeTo(0, 400, () => this.music && this.music.pause());
      else {
        this.music.play().catch(() => {});
        this.fadeTo(settings.musicVolume, 1000);
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
      if (!url) return;
      if (kind === 'page' && this.pending) {
        clearTimeout(this.pending); // reemplaza al sonido de mover / elegir de esa misma tecla o clic
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
      else if (this.music && !this.pausedForGame) this.fadeTo(settings.musicVolume, 300);
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
  $('#sel-up').addEventListener('click', () => select(index - 1));
  $('#sel-down').addEventListener('click', () => select(index + 1));

  let wheelLock = 0;
  selector.addEventListener('wheel', (e) => {
    if (Date.now() < wheelLock || Math.abs(e.deltaY) < 10) return;
    select(index + (e.deltaY > 0 ? 1 : -1));
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

  // ---------- Inicio ----------
  (async () => {
    const res = await loadAssets();
    const last = res && res.last;
    const i = CONSOLES.findIndex((c) => c.id === last);
    index = i >= 0 ? i : 0;
    renderItems();
    selector.classList.add('intro');
  })();
})();
