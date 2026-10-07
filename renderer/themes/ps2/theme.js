/* Tema PS2: pantalla estilo "Memory Card" con los juegos como íconos 3D que giran.
   Se registra en window.Themes.ps2 y el selector de consolas lo monta/desmonta. */
(() => {
  const MARKUP = `
<div class="ps-light a"></div>
<div class="ps-light b"></div>

<header class="ps-header">
  <div class="ps-card" aria-hidden="true"><div class="ps-card-label"></div></div>
  <div class="ps-head-text">
    <div class="ps-title">Memory Card <small>(PS2)/1</small></div>
    <div class="ps-free">— MB Free</div>
  </div>
</header>

<section class="ps-grid-view">
  <div class="ps-grid-viewport"><div class="ps-grid"></div></div>
  <div class="ps-scroll up" hidden></div>
  <div class="ps-scroll down" hidden></div>
</section>

<section class="ps-detail" hidden>
  <div class="ps-big"></div>
  <div class="ps-info">
    <div class="ps-label"></div>
    <div class="ps-name"></div>
    <div class="ps-sub"></div>
    <div class="ps-achline" hidden><span class="ps-achlabel">Logros</span><div class="ps-achbar"><i></i></div><span class="ps-achnum"></span></div>
    <div class="ps-desc"></div>
    <div class="ps-actions"></div>
  </div>
</section>

<section class="ps-ach" hidden>
  <div class="pa-icon"><div class="pa-icon-face"></div></div>
  <div class="pa-info">
    <div class="pa-name"></div>
    <div class="pa-meta"></div>
    <div class="pa-desc"></div>
  </div>
  <div class="pa-grid"></div>
  <div class="pa-msg" hidden></div>
</section>

<footer class="ps-footer">
  <div class="ps-caption"></div>
  <div class="ps-foot-right">
    <div class="ps-hints"></div>
    <button class="ps-cfg-btn" title="Configuración del sistema (tecla C)">
      <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="7"/><path d="M24 4v8M24 36v8M4 24h8M36 24h8M9.9 9.9l5.7 5.7M32.4 32.4l5.7 5.7M9.9 38.1l5.7-5.7M32.4 15.6l5.7-5.7"/></svg>
      <span class="ps-key">C</span><span>Configuración</span>
    </button>
  </div>
</footer>

<!-- Configuración del sistema (las mismas opciones del menú de la bandeja) -->
<section class="ps-cfg" hidden>
  <div class="pc-glow a"></div>
  <div class="pc-glow b"></div>
  <div class="pc-title">Configuración del sistema</div>
  <div class="pc-viewport"><div class="pc-list"></div></div>
  <div class="pc-desc"></div>
  <div class="pc-hints">
    <span class="ps-key">↑ ↓</span><span class="pc-hint">Elegir</span>
    <span class="ps-key">← →</span><span class="pc-hint">Cambiar</span>
    <span class="ps-key">Enter</span><span class="pc-hint">Aceptar</span>
    <span class="ps-key">Esc</span><span class="pc-hint">Volver</span>
  </div>
  <div class="pc-confirm" hidden>
    <div class="pc-confirm-box">
      <div class="pc-confirm-text">¿Salir de NostalHub?</div>
      <div class="pc-confirm-actions">
        <button class="ps-btn" data-c="yes">Sí</button>
        <button class="ps-btn" data-c="no">No</button>
      </div>
    </div>
  </div>
</section>
`;

  const COLS = 5;
  const ROWS_VISIBLE = 4;
  const ROW_H = 195;
  const LAYERS = 6; // capas apiladas para darle grosor al ícono (por cada lado)
  const DEPTH = 3; // separación entre capas (px)

  window.Themes = window.Themes || {};
  window.Themes.ps2 = { mount };

  // ---------- Utilidades ----------
  const SMALL_WORDS = new Set(['a', 'an', 'the', 'of', 'to', 'and', 'de', 'la', 'el', 'los', 'las', 'del', 'y', 'en', 'in', 'on']);
  function initials(name) {
    const words = name.replace(/[:\-–—_]/g, ' ').split(/\s+/).filter(Boolean);
    const big = words.filter((w) => !SMALL_WORDS.has(w.toLowerCase()));
    const use = big.length ? big : words;
    let out = '';
    for (const w of use) {
      if (/^\d+$/.test(w) || /^[IVX]+$/.test(w)) out += w; // números y romanos completos
      else out += w[0];
      if (out.length >= 3) break;
    }
    return out.slice(0, 3).toUpperCase() || '?';
  }

  function hueOf(str) {
    let h = 0;
    for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
  }

  // ---------- Íconos 3D de verdad (Three.js) ----------
  // Un solo motor 3D dibuja todos los modelos y copia cada cuadro a su <canvas>.
  const Models = {
    renderer: null,
    failed: false,
    handles: new Set(),
    raf: 0,
    start: performance.now(),
    ensure() {
      if (this.renderer) return true;
      if (this.failed || !window.THREE) return false;
      try {
        const THREE = window.THREE;
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
        this.renderer.setPixelRatio(1);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.setClearColor(0x000000, 0);
      } catch (e) {
        console.warn('Sin 3D, se usan íconos planos:', e);
        this.failed = true;
      }
      return !!this.renderer;
    },
    attach(canvas, def, phase) {
      const THREE = window.THREE;
      const built = def.build(THREE);
      const scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xffffff, 0x445066, 1.3));
      const sun = new THREE.DirectionalLight(0xffffff, 2.2);
      sun.position.set(3, 5, 4);
      scene.add(sun);
      const pivot = new THREE.Group();
      pivot.add(built.object);
      scene.add(pivot);
      const camera = new THREE.PerspectiveCamera(30, canvas.width / canvas.height, 0.1, 50);
      camera.position.set(0, 0.7, 5.9);
      camera.lookAt(0, 0.05, 0);
      this.handles.add({ canvas, ctx: canvas.getContext('2d'), scene, camera, pivot, update: built.update, phase });
      if (!this.raf) this.raf = requestAnimationFrame(() => this.frame());
    },
    frame() {
      this.raf = 0;
      if (!this.handles.size || !this.renderer) return;
      const paused = document.body.classList.contains('playing');
      const t = (performance.now() - this.start) / 1000;
      for (const h of [...this.handles]) {
        if (!h.canvas.isConnected) {
          this.dispose(h);
          continue;
        }
        if (paused || h.canvas.closest('.away, [hidden]')) continue;
        const r = this.renderer;
        const size = r.getSize(new window.THREE.Vector2());
        if (size.x !== h.canvas.width || size.y !== h.canvas.height) r.setSize(h.canvas.width, h.canvas.height, false);
        const lt = t + h.phase;
        h.pivot.rotation.y = (lt / 12) * Math.PI * 2; // mismo giro lento que los demás íconos
        if (h.update) h.update(lt);
        r.render(h.scene, h.camera);
        h.ctx.clearRect(0, 0, h.canvas.width, h.canvas.height);
        h.ctx.drawImage(r.domElement, 0, 0);
      }
      this.raf = requestAnimationFrame(() => this.frame());
    },
    dispose(h) {
      h.scene.traverse((o) => {
        if (o.userData.shared) return; // piezas de un .glb: se comparten entre íconos, no se borran
        if (o.geometry) o.geometry.dispose();
        const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
        mats.forEach((m) => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      });
      this.handles.delete(h);
    },
    disposeAll() {
      [...this.handles].forEach((h) => this.dispose(h));
    },
  };

  // ---------- Modelos .glb / .gltf propios (por ejemplo exportados desde Blockbench) ----------
  const gltfCache = new Map();
  function loadGltf(url) {
    if (!gltfCache.has(url)) {
      const { GLTFLoader, makeLoader } = window.THREE_ADDONS;
      gltfCache.set(
        url,
        new Promise((resolve, reject) => (makeLoader ? makeLoader() : new GLTFLoader()).load(url, resolve, undefined, reject)).catch((e) => {
          gltfCache.delete(url);
          throw e;
        })
      );
    }
    return gltfCache.get(url);
  }

  // Elige la animación: una llamada "idle", "loop" o "icono" si existe; si no, la primera
  function pickClip(clips) {
    return clips.find((c) => /idle|loop|icono|icon/i.test(c.name)) || clips[0];
  }

  function gltfDef(url, onFail) {
    return {
      id: 'glb',
      build(THREE) {
        const group = new THREE.Group();
        let mixer = null;
        loadGltf(url)
          .then((gltf) => {
            const obj = window.THREE_ADDONS.SkeletonUtils.clone(gltf.scene);
            obj.traverse((o) => {
              o.userData.shared = true;
              const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
              mats.forEach((m) => {
                // Texturas pixeladas (Blockbench) se ven nítidas, sin difuminar
                if (m.map && m.map.image && m.map.image.width <= 256) {
                  m.map.magFilter = THREE.NearestFilter;
                  m.map.needsUpdate = true;
                }
              });
            });
            // Centrar y escalar para que quepa en el ícono, sea del tamaño que sea
            const box = new THREE.Box3().setFromObject(obj);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            obj.position.sub(center);
            const holder = new THREE.Group();
            holder.add(obj);
            holder.scale.setScalar(2.3 / Math.max(size.x, size.y, size.z, 0.001));
            group.add(holder);
            if (gltf.animations && gltf.animations.length) {
              mixer = new THREE.AnimationMixer(obj);
              mixer.clipAction(pickClip(gltf.animations)).play();
            }
          })
          .catch((e) => {
            console.warn('No se pudo cargar el modelo', url, e);
            if (onFail) onFail();
          });
        return {
          object: group,
          update(t) {
            if (mixer) mixer.setTime(t);
          },
        };
      },
    };
  }

  function buildModelIcon(g, def, big) {
    const icon = document.createElement('div');
    icon.className = 'ps-icon is-model';
    icon.style.setProperty('--bob', `${-Math.random() * 4}s`);
    const bob = document.createElement('div');
    bob.className = 'ps-bob';
    const canvas = document.createElement('canvas');
    canvas.className = 'ps-model';
    canvas.width = Math.round((big ? 600 : 230) * 1.5);
    canvas.height = Math.round((big ? 420 : 160) * 1.5);
    bob.appendChild(canvas);
    icon.appendChild(bob);
    Models.attach(canvas, def, Math.random() * 12);
    return icon;
  }

  // Ícono 3D: varias capas iguales una detrás de otra, girando juntas
  function buildIcon(g, big = false) {
    let def = null;
    let iconRef = null;
    if (g.model && window.THREE_ADDONS) {
      // Si el .glb falla, se cambia por el ícono normal
      def = gltfDef(g.model, () => iconRef && iconRef.isConnected && iconRef.replaceWith(buildIcon({ ...g, model: null }, big)));
    } else if (window.PS2Models && window.THREE) {
      def = window.PS2Models.find(g);
    }
    if (def && Models.ensure()) {
      try {
        iconRef = buildModelIcon(g, def, big);
        return iconRef;
      } catch (e) {
        console.warn('No se pudo armar el modelo 3D de', g.name, e);
      }
    }
    const icon = document.createElement('div');
    icon.className = 'ps-icon';
    icon.style.setProperty('--hue', hueOf(g.name));
    icon.style.setProperty('--phase', `${-Math.random() * 12}s`);
    icon.style.setProperty('--bob', `${-Math.random() * 4}s`);
    const bob = document.createElement('div');
    bob.className = 'ps-bob';
    const spin = document.createElement('div');
    spin.className = 'ps-spin';
    const useLogo = !!g.logo;
    const fill = (layer) => {
      if (useLogo) {
        const img = document.createElement('img');
        img.src = g.logo;
        img.alt = '';
        img.draggable = false;
        img.onerror = () => {
          // Si el logo falla, se reconstruye con iniciales
          if (icon.isConnected) icon.replaceWith(buildIcon({ ...g, logo: null }));
        };
        layer.appendChild(img);
      } else {
        const t = document.createElement('div');
        t.className = 'ps-initials';
        const txt = initials(g.name);
        t.textContent = txt;
        t.style.fontSize = `${txt.length >= 3 ? 92 : txt.length === 2 ? 120 : 150}px`;
        layer.appendChild(t);
      }
    };
    // El ícono tiene dos juegos de capas: uno para cuando se ve de frente y otro (dado vuelta)
    // para cuando se ve de espaldas. Cada juego = cara brillante + capas oscuras detrás (el "canto").
    // Las capas que no miran a la cámara se ocultan, así nunca se ve nada al revés.
    const half = ((LAYERS - 1) / 2) * DEPTH;
    for (const flipped of [false, true]) {
      for (let i = 0; i < LAYERS; i++) {
        const layer = document.createElement('div');
        const isFace = i === LAYERS - 1;
        layer.className = `ps-layer${isFace ? ' face' : ''}`;
        const z = i * DEPTH - half;
        layer.style.transform = flipped ? `translateZ(${-z}px) rotateY(180deg)` : `translateZ(${z}px)`;
        fill(layer);
        spin.appendChild(layer);
      }
    }
    bob.appendChild(spin);
    icon.appendChild(bob);
    return icon;
  }

  function formatFree(bytes) {
    if (bytes == null) return '— MB Free';
    const mb = Math.floor(bytes / (1024 * 1024));
    return `${mb.toLocaleString('en-US')} MB Free`;
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const pad = (n) => String(n).padStart(2, '0');

  // root: contenedor del tema. ctx: { api, stage, stageRect, toast, openSelector }
  function mount(root, ctx) {
    root.innerHTML = MARKUP;
    const api = ctx.api;
    const $ = (sel) => root.querySelector(sel);
    const gridView = $('.ps-grid-view');
    const grid = $('.ps-grid');
    const detail = $('.ps-detail');
    const nowPlaying = window.NostalHubUtil.nowPlaying(detail, api);
    const big = $('.ps-big');
    const caption = $('.ps-caption');
    const hints = $('.ps-hints');

    let games = [];
    let sel = 0;
    let scrollRow = 0;
    let view = 'grid'; // grid | detail | playing | busy | ach | config
    let current = -1;
    let action = 0; // botón marcado en el detalle
    let playTimer = null;

    // ---------- Encabezado ----------
    async function refreshFree() {
      try {
        const r = api.getFreeSpace ? await api.getFreeSpace() : null;
        $('.ps-free').textContent = formatFree(r && r.bytes);
      } catch {
        $('.ps-free').textContent = formatFree(null);
      }
    }
    refreshFree();
    const freeTimer = setInterval(refreshFree, 60000);

    function setHints(list) {
      hints.innerHTML = list.map(([k, label]) => `<span class="ps-key">${k}</span><span class="ps-hint">${label}</span>`).join('');
    }

    // ---------- Grilla ----------
    function rowCount() {
      return Math.max(1, Math.ceil(games.length / COLS));
    }

    function renderGrid() {
      grid.innerHTML = '';
      games.forEach((g, i) => {
        const cell = document.createElement('button');
        cell.className = 'ps-cell';
        cell.dataset.index = i;
        cell.dataset.gameId = g.id; // clic derecho → cambiar imágenes
        cell.style.setProperty('--d', `${(Math.floor(i / COLS) % ROWS_VISIBLE) * 90 + (i % COLS) * 45}ms`);
        cell.appendChild(buildIcon(g));
        cell.addEventListener('mouseenter', () => setSel(i, false));
        cell.addEventListener('click', () => openDetail(i));
        grid.appendChild(cell);
      });
      if (!games.length) {
        grid.innerHTML = '<div class="ps-empty">No hay juegos todavía</div>';
      }
      setSel(Math.min(sel, Math.max(0, games.length - 1)), false);
    }

    function setSel(i, scroll = true) {
      if (!games.length) return;
      sel = Math.max(0, Math.min(games.length - 1, i));
      grid.querySelectorAll('.ps-cell').forEach((c) => c.classList.toggle('sel', Number(c.dataset.index) === sel));
      caption.textContent = games[sel] ? games[sel].name : '';
      if (scroll) {
        const row = Math.floor(sel / COLS);
        if (row < scrollRow) setScroll(row);
        else if (row >= scrollRow + ROWS_VISIBLE) setScroll(row - ROWS_VISIBLE + 1);
      }
    }

    function setScroll(r) {
      scrollRow = Math.max(0, Math.min(r, rowCount() - ROWS_VISIBLE));
      grid.style.transform = `translateY(${-scrollRow * ROW_H}px)`;
      $('.ps-scroll.up').hidden = scrollRow === 0;
      $('.ps-scroll.down').hidden = scrollRow >= rowCount() - ROWS_VISIBLE;
    }

    let wheelLock = 0;
    gridView.addEventListener('wheel', (e) => {
      if (view !== 'grid' || Date.now() < wheelLock || Math.abs(e.deltaY) < 10) return;
      setScroll(scrollRow + (e.deltaY > 0 ? 1 : -1));
      wheelLock = Date.now() + 220;
    });

    // ---------- Detalle ----------
    function px(r) {
      return { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` };
    }

    function renderActions(list) {
      const box = $('.ps-actions');
      box.innerHTML = '';
      list.forEach(([label, fn], i) => {
        const b = document.createElement('button');
        b.className = 'ps-btn';
        b.textContent = label;
        b.addEventListener('mouseenter', () => setAction(i));
        b.addEventListener('click', fn);
        box.appendChild(b);
      });
      setAction(0);
    }

    function setAction(i) {
      const btns = [...root.querySelectorAll('.ps-btn')];
      if (!btns.length) return;
      action = (i + btns.length) % btns.length;
      btns.forEach((b, j) => b.classList.toggle('on', j === action));
    }

    function typeLabel(g) {
      return { steam: 'Steam', exe: 'Programa', shortcut: 'Acceso directo', url: 'Launcher' }[g.type] || '';
    }

    async function openDetail(i) {
      if (view !== 'grid' || !games[i]) return;
      view = 'busy';
      current = i;
      setSel(i);
      const g = games[i];
      detail.dataset.gameCurrent = g.id;
      const cell = grid.querySelector(`.ps-cell[data-index="${i}"]`);
      const from = cell ? ctx.stageRect(cell.querySelector('.ps-icon')) : null;

      big.innerHTML = '';
      big.appendChild(buildIcon(g, true));
      $('.ps-label').textContent = '';
      $('.ps-name').textContent = g.name;
      fillStats(g);
      $('.ps-desc').textContent = g.description || '';
      renderActions(detailActions(g));
      setHints([['Enter', 'Elegir'], ['Esc', 'Volver']]);

      gridView.classList.add('away');
      caption.classList.add('away');
      detail.hidden = false;
      detail.classList.remove('leave');
      detail.classList.add('enter');

      // El ícono viaja desde su casilla hasta la izquierda, creciendo
      if (from) {
        const to = ctx.stageRect(big);
        await big
          .animate(
            [
              { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width})`, transformOrigin: '0 0' },
              { transform: 'none', transformOrigin: '0 0' },
            ],
            { duration: 520, easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)' }
          )
          .finished.catch(() => {});
      }
      view = 'detail';
    }

    async function closeDetail() {
      if (view !== 'detail') return;
      view = 'busy';
      const cell = grid.querySelector(`.ps-cell[data-index="${current}"]`);
      detail.classList.remove('enter');
      detail.classList.add('leave');
      gridView.classList.remove('away');
      caption.classList.remove('away');
      if (cell) {
        const to = ctx.stageRect(cell.querySelector('.ps-icon'));
        const from = ctx.stageRect(big);
        await big
          .animate(
            [
              { transform: 'none', transformOrigin: '0 0', opacity: 1 },
              { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width})`, transformOrigin: '0 0', opacity: 0.4 },
            ],
            { duration: 420, easing: 'cubic-bezier(0.5, 0, 0.3, 1)' }
          )
          .finished.catch(() => {});
      }
      detail.hidden = true;
      detail.classList.remove('leave');
      big.innerHTML = '';
      setHints([['Enter', 'Entrar'], ['Esc', 'Consolas']]);
      view = 'grid';
    }

    // ---------- Iniciar y "Jugando a…" ----------
    async function startGame() {
      if (view !== 'detail') return;
      const g = games[current];
      view = 'busy';
      const res = await api.launch(g.id);
      if (!res || !res.ok) {
        view = 'detail';
        ctx.toast(`No se pudo abrir: ${(res && res.error) || 'error desconocido'}`);
        return;
      }
      root.classList.add('is-playing');
      $('.ps-label').textContent = 'Jugando a';
      $('.ps-sub').textContent = '0:00';
      renderActions([['Volver al menú', stopPlaying]]);
      setHints([['Enter', 'Volver al menú']]);
      document.body.classList.add('playing');
      view = 'playing';
      nowPlaying.start(); // Spotify y Grupo a los lados

      const started = Date.now();
      const upd = () => {
        const s = Math.floor((Date.now() - started) / 1000);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        $('.ps-sub').textContent = h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
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
      // vuelve al detalle y de ahí a la grilla
      view = 'detail';
      $('.ps-label').textContent = '';
      await closeDetail();
      if (reason === 'not-started') ctx.toast('No se detectó que el juego abriera');
      refreshFree();
    }

    function stopPlaying() {
      api.dismissPlaying();
      endPlaying('manual');
    }

    // ---------- Horas jugadas y logros ----------
    const U = window.NostalHubUtil;
    let summary = { perGame: {} };
    if (api.getAchievementSummary) api.getAchievementSummary().then((s) => s && (summary = s));
    const offSummary = api.onSteamSummary ? api.onSteamSummary((s) => (summary = s || summary)) : null;

    function fillStats(g) {
      $('.ps-sub').textContent = [typeLabel(g), U.playLine(g)].filter(Boolean).join('  ·  ');
      const per = summary.perGame && g.appId && summary.perGame[g.appId];
      const line = $('.ps-achline');
      line.hidden = !(per && per.total);
      if (per && per.total) {
        line.querySelector('i').style.width = `${(per.done / per.total) * 100}%`;
        line.querySelector('.ps-achnum').textContent = `${per.done} / ${per.total}`;
      }
    }
    function detailActions(g) {
      return g.type === 'steam'
        ? [
            ['Iniciar', startGame],
            ['Logros', openAch],
            ['Volver', closeDetail],
          ]
        : [
            ['Iniciar', startGame],
            ['Volver', closeDetail],
          ];
    }

    const ACH_COLS = 12;
    let achList = [];
    let achSel = 0;
    let achToken = 0;
    const pa = $('.ps-ach');

    async function openAch() {
      if (view !== 'detail') return;
      const g = games[current];
      view = 'ach';
      detail.classList.add('away');
      pa.hidden = false;
      pa.classList.remove('leave');
      $('.pa-grid').innerHTML = '';
      $('.pa-icon').style.visibility = 'hidden';
      $('.pa-info').style.visibility = 'hidden';
      caption.textContent = g.name;
      caption.classList.remove('away');
      setHints([['Flechas', 'Mover'], ['Esc', 'Volver']]);
      const msg = $('.pa-msg');
      msg.hidden = false;
      msg.innerHTML = 'Cargando logros…';
      const token = ++achToken;
      const res = (api.getAchievements ? await api.getAchievements(g.appId) : null) || { status: 'error', list: [] };
      if (token !== achToken || view !== 'ach') return;
      if (res.status !== 'ok') {
        msg.innerHTML = U.achievementMessage(res);
        return;
      }
      msg.hidden = true;
      caption.textContent = `${g.name}  ·  ${res.done} / ${res.total} logros`;
      achList = U.sortAchievements(res.list);
      const gridEl = $('.pa-grid');
      achList.forEach((a, i) => {
        const cell = document.createElement('button');
        cell.className = `pa-cell${a.done ? '' : ' locked'}`;
        cell.dataset.i = i;
        cell.style.setProperty('--bob', `${-Math.random() * 3}s`);
        cell.innerHTML = `<span style="background-image:url('${a.done ? a.icon : a.iconGray || a.icon}')"></span>`;
        cell.addEventListener('mouseenter', () => setAch(i, false));
        cell.addEventListener('click', () => setAch(i, false));
        gridEl.appendChild(cell);
      });
      $('.pa-icon').style.visibility = '';
      $('.pa-info').style.visibility = '';
      setAch(0);
    }
    function setAch(i, scroll = true) {
      if (!achList.length) return;
      achSel = Math.max(0, Math.min(achList.length - 1, i));
      pa.querySelectorAll('.pa-cell').forEach((c) => c.classList.toggle('sel', Number(c.dataset.i) === achSel));
      const a = achList[achSel];
      const t = U.achievementTexts(a);
      const face = $('.pa-icon-face');
      face.style.backgroundImage = `url("${a.done ? a.icon : a.iconGray || a.icon}")`;
      face.classList.toggle('locked', !a.done);
      $('.pa-name').textContent = t.name;
      $('.pa-meta').textContent = [a.done ? `Desbloqueado el ${t.date}` : 'Bloqueado', t.percent].filter(Boolean).join('  ·  ');
      $('.pa-desc').textContent = t.description;
      if (scroll) {
        const cell = pa.querySelector(`.pa-cell[data-i="${achSel}"]`);
        if (cell) cell.scrollIntoView({ block: 'nearest' });
      }
    }
    async function closeAch() {
      if (view !== 'ach') return;
      achToken++;
      pa.classList.add('leave');
      await wait(220);
      pa.hidden = true;
      pa.classList.remove('leave');
      detail.classList.remove('away');
      caption.classList.add('away');
      setHints([['Enter', 'Elegir'], ['Esc', 'Volver']]);
      view = 'detail';
    }


    // ---------- Configuración del sistema ----------
    // Las opciones vienen de main.js (las mismas del menú de la bandeja); aquí se dibujan al estilo PS2.
    const cfg = $('.ps-cfg');
    const cfgList = $('.pc-list');
    let cfgModel = [];
    let cfgRows = []; // [{ it, el }] solo las filas elegibles (sin los títulos de sección)
    let cfgSel = 0;
    let cfgConfirm = false;
    let cfgConfirmYes = false;
    const PC_ROW = 78;
    const PC_HEAD = 70;
    const PC_VIEW = 640;

    async function openConfig() {
      if (view !== 'grid') return;
      view = 'config';
      cfgModel = (api.getMenu ? await api.getMenu() : []) || [];
      cfgSel = 0;
      cfg.hidden = false;
      cfg.classList.remove('leave');
      renderConfig();
    }

    async function closeConfig() {
      if (view !== 'config') return;
      cfg.classList.add('leave');
      await wait(300);
      cfg.hidden = true;
      cfg.classList.remove('leave');
      view = 'grid';
    }

    function renderConfig() {
      cfgList.innerHTML = '';
      cfgRows = [];
      cfgModel.forEach((sec) => {
        const h = document.createElement('div');
        h.className = 'pc-head';
        h.textContent = sec.title;
        cfgList.appendChild(h);
        sec.items.forEach((it) => {
          const row = document.createElement('button');
          const i = cfgRows.length;
          row.className = 'pc-row';
          row.dataset.i = i;
          const val = U.optionValueText(it);
          row.innerHTML = `<span class="pc-label"></span><span class="pc-val"></span>`;
          row.querySelector('.pc-label').textContent = it.label;
          row.querySelector('.pc-val').textContent = val ? `${it.type === 'action' ? '' : '◂ '}${val}${it.type === 'action' ? '' : ' ▸'}` : '';
          row.addEventListener('mouseenter', () => setCfg(i, false));
          row.addEventListener('click', () => runCfg(i, 1));
          cfgList.appendChild(row);
          cfgRows.push({ it, el: row });
        });
      });
      setCfg(Math.min(cfgSel, cfgRows.length - 1));
    }

    function setCfg(i, scroll = true) {
      if (!cfgRows.length) return;
      cfgSel = (i + cfgRows.length) % cfgRows.length;
      cfgRows.forEach((r, j) => r.el.classList.toggle('sel', j === cfgSel));
      const r = cfgRows[cfgSel];
      $('.pc-desc').textContent = r.it.desc || '';
      if (scroll) {
        // mantiene la fila elegida a la vista
        const top = r.el.offsetTop;
        const cur = -parseFloat(cfgList.dataset.y || '0');
        let y = cur;
        const pad = 50; // margen para que la fila no quede bajo el difuminado de los bordes
        if (top - PC_HEAD < cur + pad) y = Math.max(0, top - PC_HEAD - pad);
        else if (top + PC_ROW > cur + PC_VIEW - pad) y = top + PC_ROW - PC_VIEW + pad;
        y = Math.max(0, Math.min(y, cfgList.scrollHeight - PC_VIEW));
        cfgList.dataset.y = String(-y);
        cfgList.style.transform = `translateY(${-y}px)`;
      }
    }

    async function runCfg(i, dir) {
      const r = cfgRows[i];
      if (!r) return;
      setCfg(i, false);
      const it = r.it;
      if (it.id === 'consoles') {
        cfg.hidden = true;
        view = 'grid';
        return ctx.openSelector();
      }
      if (it.confirm) return showConfirm(true);
      if (/^open-|^devtools$/.test(it.id)) ctx.toast('Se abrió en Windows');
      const value = it.type === 'action' ? undefined : U.optionNextValue(it, dir);
      const next = api.runMenu ? await api.runMenu(it.id, value) : null;
      if (next && view === 'config') {
        cfgModel = next;
        renderConfig();
      }
    }

    function showConfirm(on) {
      cfgConfirm = on;
      cfgConfirmYes = false;
      $('.pc-confirm').hidden = !on;
      paintConfirm();
    }
    function paintConfirm() {
      root.querySelectorAll('.pc-confirm .ps-btn').forEach((b) => b.classList.toggle('on', (b.dataset.c === 'yes') === cfgConfirmYes));
    }
    root.querySelectorAll('.pc-confirm .ps-btn').forEach((b) => {
      b.addEventListener('mouseenter', () => {
        cfgConfirmYes = b.dataset.c === 'yes';
        paintConfirm();
      });
      b.addEventListener('click', () => (b.dataset.c === 'yes' ? api.runMenu('quit') : showConfirm(false)));
    });

    function configKey(e) {
      if (cfgConfirm) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          cfgConfirmYes = !cfgConfirmYes;
          paintConfirm();
        } else if (e.key === 'Enter') {
          if (cfgConfirmYes) api.runMenu('quit');
          else showConfirm(false);
        } else if (e.key === 'Escape' || e.key === 'Backspace') showConfirm(false);
        return;
      }
      const r = cfgRows[cfgSel];
      if (e.key === 'ArrowDown') setCfg(cfgSel + 1);
      else if (e.key === 'ArrowUp') setCfg(cfgSel - 1);
      else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && r && r.it.type !== 'action') runCfg(cfgSel, e.key === 'ArrowRight' ? 1 : -1);
      else if (e.key === 'Enter') runCfg(cfgSel, 1);
      else if (e.key === 'Escape' || e.key === 'Backspace') closeConfig();
    }

    $('.ps-cfg-btn').addEventListener('click', () => openConfig());
    cfg.addEventListener('wheel', (e) => {
      if (view !== 'config' || cfgConfirm || Math.abs(e.deltaY) < 10) return;
      setCfg(cfgSel + (e.deltaY > 0 ? 1 : -1));
    });

    // ---------- Teclado ----------
    function onKey(e) {
      // Enter/espacio no deben "apretar" además el último botón clickeado con el mouse
      if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
      if (view === 'config') return configKey(e);
      if (view === 'ach') {
        if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'Enter') closeAch();
        else if (e.key === 'ArrowLeft') setAch(achSel - 1);
        else if (e.key === 'ArrowRight') setAch(achSel + 1);
        else if (e.key === 'ArrowUp') setAch(achSel - ACH_COLS);
        else if (e.key === 'ArrowDown') setAch(achSel + ACH_COLS);
        return;
      }
      if (view === 'grid') {
        if (e.key === 'ArrowRight') setSel(sel + 1);
        else if (e.key === 'ArrowLeft') setSel(sel - 1);
        else if (e.key === 'ArrowDown') setSel(sel + COLS);
        else if (e.key === 'ArrowUp') setSel(sel - COLS);
        else if (e.key === 'Enter') openDetail(sel);
        else if (e.key === 'c' || e.key === 'C') openConfig();
        else if (e.key === 'Escape') ctx.openSelector();
      } else if (view === 'detail' || view === 'playing') {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setAction(action + 1);
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') setAction(action - 1);
        else if (e.key === 'Enter') {
          const b = root.querySelectorAll('.ps-btn')[action];
          if (b) b.click();
        } else if (e.key === 'Escape' && view === 'detail') closeDetail();
      }
    }
    window.addEventListener('keydown', onKey);

    // ---------- Datos ----------
    function setGames(list) {
      const openId = current >= 0 && games[current] ? games[current].id : null;
      games = list || [];
      if (openId) {
        const idx = games.findIndex((g) => g.id === openId);
        if (idx >= 0) current = idx;
      }
      renderGrid();
      setScroll(scrollRow);
    }

    setHints([['Enter', 'Entrar'], ['Esc', 'Consolas']]);
    const offGames = api.onGamesUpdated(setGames);
    const offEnded = api.onGameEnded(({ reason }) => endPlaying(reason));
    api.getState().then((s) => {
      setGames(s.games);
      gridView.classList.add('intro');
      setTimeout(() => gridView.classList.remove('intro'), 1600);
    });

    return {
      unmount() {
        nowPlaying.dispose();
        clearInterval(freeTimer);
        clearInterval(playTimer);
        Models.disposeAll();
        window.removeEventListener('keydown', onKey);
        if (offGames) offGames();
        if (offEnded) offEnded();
        if (offSummary) offSummary();
        document.body.classList.remove('playing');
        root.classList.remove('is-playing');
        root.innerHTML = '';
      },
    };
  }
})();
