/* Clic derecho sobre un juego (en cualquier consola) → menú con "Cambiar imágenes" y "Editar descripción".
   La ventana muestra solo las imágenes que se ven en la consola actual (con un botón para ver todas),
   y cada consola le da su propio estilo con CSS (.theme-<id> .ge-…).
   Los temas marcan sus juegos con data-game-id (y el juego abierto con data-game-current). */
(() => {
  const api = window.nostalhub || window.mockNostalHub;
  const stage = document.getElementById('stage');
  const themeRoot = document.getElementById('theme-root');
  if (!api || !stage || !themeRoot) return;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const call = (fn, ...a) => (typeof api[fn] === 'function' ? api[fn](...a) : Promise.resolve(null));

  const CONSOLE_NAMES = { wii: 'Wii', ps2: 'PS2', x360: 'Xbox 360', ps4: 'PS4', vita: 'PS Vita', switch: 'Switch' };
  // Qué imágenes se ven en cada consola (en orden)
  const BY_CONSOLE = {
    wii: ['tile', 'hero', 'logo', 'video'],
    ps2: ['model', 'logo'],
    x360: ['cover', 'hero', 'logo'],
    ps4: ['hero', 'logo'],
    vita: ['bubble', 'hero', 'logo'],
    switch: ['square', 'hero', 'logo'],
  };
  const ALL = ['tile', 'square', 'bubble', 'cover', 'hero', 'logo', 'video', 'model'];
  // Algunas también se usan en otras consolas aunque no sean "suyas"
  const ALSO = { tile: ['ps4', 'vita'], cover: ['vita'] };
  const SLOTS = {
    tile: { label: 'Canal', hint: 'El cuadrito del menú, tal cual (imagen o video, 16:9). Si lo cambias, también se usa en la PS4 y la PS Vita.', shape: 'wide' },
    hero: { label: 'Fondo', hint: 'Imagen grande sin letras, de fondo (ej. 1920×620 o 1920×1080).', shape: 'wide' },
    logo: { label: 'Logo', hint: 'El título del juego. PNG con fondo transparente.', shape: 'logo' },
    video: { label: 'Video del canal', hint: 'La animación al entrar al canal (mp4, webm o gif; 10 a 20 segundos, sin audio).', shape: 'wide' },
    model: { label: 'Modelo 3D', hint: 'Ícono 3D animado (.glb o .gltf, por ejemplo de Blockbench).', shape: 'square' },
    cover: { label: 'Carátula', hint: 'La caja del juego, vertical (600×900).', shape: 'tall' },
    square: { label: 'Imagen cuadrada', hint: 'El cuadro del juego en la Switch (ej. 1024×1024). Si no hay, se arma con el fondo y el logo.', shape: 'square' },
    bubble: { label: 'Burbuja', hint: 'Imagen cuadrada; se recorta en círculo (ej. 512×512). Si no hay, se usa la carátula.', shape: 'circle' },
  };

  const themeId = () => (themeRoot.className.match(/theme-(\w+)/) || [])[1] || '';
  const usedIn = (kind) =>
    Object.keys(BY_CONSOLE)
      .filter((c) => BY_CONSOLE[c].includes(kind) || (ALSO[kind] || []).includes(c))
      .map((c) => CONSOLE_NAMES[c]);
  const toStage = (x, y) => {
    const r = stage.getBoundingClientRect();
    return { x: ((x - r.left) * 1920) / r.width, y: ((y - r.top) * 1080) / r.height };
  };

  // ---------- Qué juego es (clic derecho o tecla I) ----------
  function visibleArea(el) {
    const r = el.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const w = Math.max(0, Math.min(r.right, s.right) - Math.max(r.left, s.left));
    const h = Math.max(0, Math.min(r.bottom, s.bottom) - Math.max(r.top, s.top));
    return w * h;
  }
  function best(list) {
    let pick = null;
    let area = 0;
    list.forEach((el) => {
      const a = visibleArea(el);
      if (a > area) (area = a), (pick = el);
    });
    return pick;
  }
  function selectedGameId() {
    // 1) el juego que está abierto (pantalla de canal, ficha, tarjeta…)
    const cur = best([...themeRoot.querySelectorAll('[data-game-current]')].filter((e) => e.dataset.gameCurrent && !e.closest('[hidden]')));
    if (cur) return cur.dataset.gameCurrent;
    // 2) el juego marcado
    const sel = best([...themeRoot.querySelectorAll('[data-game-id].sel, [data-game-id].focus, [data-game-id].kfocus, .sel [data-game-id], .focus [data-game-id]')].filter((e) => !e.closest('[hidden]')));
    return sel ? sel.dataset.gameId : null;
  }

  // Los clics y la rueda dentro del menú o la ventana no llegan al menú de la consola de atrás
  function shield(el) {
    ['pointerdown', 'mousedown', 'wheel', 'dblclick'].forEach((t) => el.addEventListener(t, (e) => e.stopPropagation()));
  }

  // ---------- Menú del clic derecho ----------
  let menu = null; // { el, items, sel, id }
  function openMenu(id, x, y) {
    closeMenu();
    const el = document.createElement('div');
    el.className = 'ge-ctx';
    const items = [
      { label: 'Cambiar imágenes', run: () => openEditor(id) },
      { label: 'Editar descripción', run: () => openEditor(id, { focus: 'desc' }) },
      { label: 'Abrir su carpeta', run: () => call('openGameFolder', id) },
    ];
    shield(el);
    el.innerHTML = `<div class="ge-ctx-title"></div>${items.map((it, i) => `<button class="ge-ci" data-i="${i}"><span>${esc(it.label)}</span></button>`).join('')}`;
    themeRoot.appendChild(el);
    call('getGameCustom', id).then((info) => info && el.isConnected && (el.querySelector('.ge-ctx-title').textContent = info.name));
    const p = toStage(x, y);
    const w = 460;
    const h = 330;
    el.style.left = `${Math.min(p.x, 1920 - w - 20)}px`;
    el.style.top = `${Math.min(p.y, 1080 - h - 20)}px`;
    menu = { el, items, sel: 0, id };
    el.querySelectorAll('.ge-ci').forEach((b) => {
      b.addEventListener('mouseenter', () => setMenu(Number(b.dataset.i)));
      b.addEventListener('click', () => pickMenu(Number(b.dataset.i)));
    });
    setMenu(0);
  }
  function setMenu(i) {
    if (!menu) return;
    menu.sel = (i + menu.items.length) % menu.items.length;
    menu.el.querySelectorAll('.ge-ci').forEach((b) => b.classList.toggle('kf', Number(b.dataset.i) === menu.sel));
  }
  function pickMenu(i) {
    const it = menu && menu.items[i];
    closeMenu();
    if (it) it.run();
  }
  function closeMenu() {
    if (menu) menu.el.remove();
    menu = null;
  }

  // ---------- Ventana para cambiar las imágenes ----------
  let ed = null; // { el, id, info, all, rows, r, c }
  async function openEditor(id, opts = {}) {
    closeEditor();
    const info = await call('getGameCustom', id);
    if (!info) return;
    const el = document.createElement('div');
    el.className = 'ge-wrap';
    el.innerHTML = `<div class="ge-panel"><div class="ge-head"><div class="ge-title"></div><div class="ge-sub"></div></div><div class="ge-body"></div><div class="ge-msg"></div><div class="ge-foot"></div></div>`;
    themeRoot.appendChild(el);
    el.addEventListener('pointerdown', (e) => {
      if (e.target === el) closeEditor();
    });
    shield(el);
    ed = { el, id, info, all: false, r: 0, c: 0, rows: [] };
    render();
    if (opts.focus === 'desc') {
      const t = el.querySelector('.ge-text');
      const ri = ed.rows.findIndex((row) => row.includes(t));
      if (ri >= 0) setKf(ri, 0);
      setTimeout(() => t && t.focus(), 50);
    }
  }
  function closeEditor() {
    if (!ed) return;
    ed.el.classList.add('leave');
    const el = ed.el;
    ed = null;
    setTimeout(() => el.remove(), 200);
  }

  function slotHtml(kind) {
    const s = SLOTS[kind];
    const st = ed.info.slots[kind] || {};
    const url = st.custom || st.auto;
    let prev;
    if (kind === 'model') prev = st.custom ? `<div class="ge-file">${esc(st.customName)}</div>` : '<div class="ge-empty">Sin modelo</div>';
    else if (url && st.isVideo) prev = `<video src="${url}" muted loop autoplay playsinline></video>`;
    else if (url) prev = `<img src="${url}" alt="" draggable="false" />`;
    else prev = `<div class="ge-empty">${kind === 'video' ? 'Sin video' : 'Sin imagen'}</div>`;
    const none = { video: 'Sin video', model: 'Sin modelo', bubble: 'Automática', square: 'Automática' }[kind] || 'Sin imagen';
    const state = st.custom ? (kind === 'model' ? 'Tu modelo' : kind === 'video' ? 'Tu video' : 'Tu imagen') : url ? (kind === 'bubble' ? 'La carátula' : 'La de Steam') : none;
    const clear = st.custom ? `<button class="ge-b" data-a="clear">${st.auto || kind === 'bubble' ? 'Volver a la automática' : 'Quitar'}</button>` : '';
    const used = ed.all ? `<div class="ge-used">Se ve en: ${esc(usedIn(kind).join(', '))}</div>` : '';
    return `<div class="ge-slot${st.custom ? ' is-custom' : ''}" data-kind="${kind}">
      <div class="ge-prev shape-${s.shape}">${prev}<div class="ge-drop">Suelta aquí</div></div>
      <div class="ge-info">
        <div class="ge-name">${esc(s.label)}<span class="ge-state">${state}</span></div>
        <div class="ge-hint">${esc(s.hint)}</div>${used}
        <div class="ge-btns"><button class="ge-b" data-a="pick">Elegir archivo</button>${kind === 'model' ? '' : '<button class="ge-b" data-a="paste">Pegar</button>'}${clear}</div>
      </div>
    </div>`;
  }

  function render(keepFocus = false) {
    if (!ed) return;
    const tid = themeId();
    const kinds = ed.all ? ALL : BY_CONSOLE[tid] || ALL;
    const d = ed.info.description;
    ed.el.querySelector('.ge-title').textContent = ed.info.name;
    ed.el.querySelector('.ge-sub').textContent = ed.all ? 'Todas las imágenes, de todas las consolas' : `Lo que se ve en ${CONSOLE_NAMES[tid] || 'esta consola'}`;
    const typed = ed.el.querySelector('.ge-text');
    const draft = typed && typed.dataset.dirty ? typed.value : null;
    ed.el.querySelector('.ge-body').innerHTML = `
      <div class="ge-grid">${kinds.map(slotHtml).join('')}</div>
      <div class="ge-desc">
        <div class="ge-name">Descripción<span class="ge-state">${d.custom ? 'La tuya' : d.steam ? 'La de Steam' : 'Sin descripción'}</span></div>
        <textarea class="ge-text" maxlength="800" spellcheck="true" placeholder="${esc(d.steam ? 'Escribe la tuya, o deja la de Steam' : 'Escribe una descripción para este juego')}"></textarea>
        <div class="ge-btns"><button class="ge-b" data-a="desc-save">Guardar descripción</button>${d.custom ? `<button class="ge-b" data-a="desc-clear">${d.steam ? 'Usar la de Steam' : 'Borrar'}</button>` : ''}</div>
      </div>`;
    const ta = ed.el.querySelector('.ge-text');
    ta.value = draft != null ? draft : d.custom || d.steam || '';
    if (draft != null) ta.dataset.dirty = '1';
    ta.addEventListener('input', () => (ta.dataset.dirty = '1'));
    ed.el.querySelector('.ge-foot').innerHTML = `
      <button class="ge-b" data-a="all">${ed.all ? `Solo ${esc(CONSOLE_NAMES[tid] || 'esta consola')}` : 'Ver todas las consolas'}</button>
      <button class="ge-b" data-a="folder">Abrir carpeta</button>
      <span class="ge-gap"></span>
      <button class="ge-b main" data-a="close">Listo</button>`;
    bind();
    buildRows();
    if (keepFocus) setKf(Math.min(ed.r, ed.rows.length - 1), ed.c);
    else setKf(0, 0);
  }

  function msg(text, ok = true) {
    if (!ed) return;
    const m = ed.el.querySelector('.ge-msg');
    m.textContent = text || '';
    m.classList.toggle('bad', !ok);
    m.classList.remove('pop');
    m.offsetWidth;
    m.classList.add('pop');
  }
  async function apply(promise, okText) {
    const res = await promise;
    if (!ed || !res) return;
    if (res.canceled) return;
    if (!res.ok) return msg(res.message || 'No se pudo cambiar.', false);
    if (res.info) ed.info = res.info;
    render(true);
    msg(okText);
  }

  function bind() {
    const el = ed.el;
    el.querySelectorAll('.ge-slot').forEach((slot) => {
      const kind = slot.dataset.kind;
      slot.querySelectorAll('[data-a]').forEach((b) =>
        b.addEventListener('click', () => {
          if (b.dataset.a === 'pick') apply(call('pickGameFile', ed.id, kind), 'Listo, ya se ve en el menú.');
          else if (b.dataset.a === 'paste') apply(call('pasteGameFile', ed.id, kind), 'Listo, se usó la imagen copiada.');
          else if (b.dataset.a === 'clear') apply(call('clearGameFile', ed.id, kind), 'Listo, volvió la imagen automática.');
        })
      );
      // Arrastrar un archivo (o una imagen desde el navegador) al cuadro
      const prev = slot.querySelector('.ge-prev');
      prev.addEventListener('dragover', (e) => {
        e.preventDefault();
        slot.classList.add('drag');
      });
      prev.addEventListener('dragleave', () => slot.classList.remove('drag'));
      prev.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('drag');
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        const p = file && api.pathForFile ? api.pathForFile(file) : '';
        const url = (e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain') || '').split('\n')[0].trim();
        if (p) apply(call('setGameFileFrom', ed.id, kind, { path: p }), 'Listo, ya se ve en el menú.');
        else if (url) apply(call('setGameFileFrom', ed.id, kind, { url }), 'Listo, ya se ve en el menú.');
      });
    });
    const ta = el.querySelector('.ge-text');
    el.querySelectorAll('.ge-desc [data-a]').forEach((b) =>
      b.addEventListener('click', () => {
        if (b.dataset.a === 'desc-save') {
          const d = ed.info.description;
          const text = ta.value.trim();
          // si quedó igual a la de Steam, no se guarda una copia
          const same = !d.custom && text === (d.steam || '').trim();
          ta.dataset.dirty = '';
          if (same) return msg('Es la misma descripción de Steam, no hay nada que guardar.');
          apply(call('setGameDescription', ed.id, text), text ? 'Descripción guardada.' : 'Descripción borrada.');
        } else {
          ta.dataset.dirty = '';
          apply(call('setGameDescription', ed.id, ''), ed.info.description.steam ? 'Listo, se usa la descripción de Steam.' : 'Descripción borrada.');
        }
      })
    );
    el.querySelectorAll('.ge-foot [data-a]').forEach((b) =>
      b.addEventListener('click', () => {
        if (b.dataset.a === 'all') {
          ed.all = !ed.all;
          render();
          setKf(ed.rows.length - 1, 0);
        } else if (b.dataset.a === 'folder') call('openGameFolder', ed.id);
        else closeEditor();
      })
    );
  }

  // Filas para moverse con las flechas: cada cuadro, la descripción y los botones de abajo
  function buildRows() {
    const el = ed.el;
    ed.rows = [
      ...[...el.querySelectorAll('.ge-slot')].map((s) => [...s.querySelectorAll('.ge-b')]),
      [el.querySelector('.ge-text')],
      [...el.querySelectorAll('.ge-desc .ge-b')],
      [...el.querySelectorAll('.ge-foot .ge-b')],
    ].filter((r) => r.length);
    ed.rows.forEach((row, ri) =>
      row.forEach((b, ci) =>
        b.addEventListener('mouseenter', () => {
          if (ed) setKf(ri, ci, false);
        })
      )
    );
  }
  function setKf(r, c, scroll = true) {
    if (!ed || !ed.rows.length) return;
    ed.r = Math.max(0, Math.min(ed.rows.length - 1, r));
    ed.c = Math.max(0, Math.min(ed.rows[ed.r].length - 1, c));
    ed.el.querySelectorAll('.kf').forEach((x) => x.classList.remove('kf'));
    const t = ed.rows[ed.r][ed.c];
    t.classList.add('kf');
    const slot = t.closest('.ge-slot, .ge-desc');
    ed.el.querySelectorAll('.ge-slot.on, .ge-desc.on').forEach((x) => x.classList.remove('on'));
    if (slot) slot.classList.add('on');
    if (scroll) (slot || t).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // ---------- Teclado (mientras el menú o la ventana están abiertos, el tema no recibe las teclas) ----------
  window.addEventListener(
    'keydown',
    (e) => {
      if (ed && !ed.el.isConnected) ed = null;
      if (menu && !menu.el.isConnected) menu = null;
      const setupOpen = document.getElementById('setup') && !document.getElementById('setup').hidden;
      if (setupOpen) return;
      const k = e.key;
      if (menu) {
        e.stopImmediatePropagation();
        e.preventDefault();
        if (k === 'ArrowDown') setMenu(menu.sel + 1);
        else if (k === 'ArrowUp') setMenu(menu.sel - 1);
        else if (k === 'Enter' || k === ' ') pickMenu(menu.sel);
        else if (k === 'Escape' || k === 'Backspace') closeMenu();
        return;
      }
      if (ed) {
        e.stopImmediatePropagation();
        const ta = ed.el.querySelector('.ge-text');
        if (document.activeElement === ta) {
          if (k === 'Escape') {
            e.preventDefault();
            ta.blur();
          } else if (k === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            ed.el.querySelector('[data-a="desc-save"]').click();
          }
          return; // se escribe normal
        }
        e.preventDefault();
        if (k === 'Escape' || k === 'Backspace') closeEditor();
        else if (k === 'ArrowDown') setKf(ed.r + 1, ed.c);
        else if (k === 'ArrowUp') setKf(ed.r - 1, ed.c);
        else if (k === 'ArrowRight') setKf(ed.r, ed.c + 1);
        else if (k === 'ArrowLeft') setKf(ed.r, ed.c - 1);
        else if (k === 'Enter' || k === ' ') {
          const t = ed.rows[ed.r][ed.c];
          if (t.tagName === 'TEXTAREA') t.focus();
          else t.click();
        }
        return;
      }
      // Tecla I: imágenes del juego marcado
      if ((k === 'i' || k === 'I') && !e.ctrlKey && !e.altKey && !themeRoot.hidden && !document.body.classList.contains('playing')) {
        const tag = e.target && e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        const id = selectedGameId();
        if (id) {
          e.stopImmediatePropagation();
          e.preventDefault();
          openEditor(id);
        }
      }
    },
    true
  );

  // Clic derecho sobre un juego
  themeRoot.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (ed || document.body.classList.contains('playing')) return;
    const el = e.target.closest('[data-game-id], [data-game-current]');
    const id = el && (el.dataset.gameId || el.dataset.gameCurrent);
    if (id) openMenu(id, e.clientX, e.clientY);
    else closeMenu();
  });
  // Clic afuera cierra el menú
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (menu && !menu.el.contains(e.target)) closeMenu();
    },
    true
  );

  window.NostalHubGameEditor = { open: openEditor, menu: openMenu };
})();
