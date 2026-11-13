/* Menú principal, estilo "Línea de tiempo" (como un museo): las consolas ordenadas por año en una línea abajo; la
   marcada sube y arriba se muestra su ficha (empresa y año, nombre o logo, una frase, años, generación y tu última
   visita) junto a su imagen o modelo 3D sobre un pedestal con un foco de luz. Arriba: Resumen y Ajustes.
   Las consolas van siempre por fecha de salida (fixedOrder): en este estilo no se ordenan ni se mueven.
   Consola nueva: agregar su frase en FICHA (y su generación); su year en consoles.js es su lugar en la línea.
   Teclas: ← → recorren los años, ↑ sube a los botones de arriba. Contrato de un estilo: ver estanteria.js. */
(() => {
  const U = window.NostalHubUtil;
  const K = window.HomeKit;
  const esc = U.escapeHtml;
  window.MenuStyles = window.MenuStyles || {};

  // Lo que dice la ficha de cada consola: su generación y una frase sobre su menú en NostalHub
  const FICHA = {
    ps2: { gen: 6, txt: 'Los íconos 3D de tus juegos flotando en la Memory Card, con su luz azul de fondo.' },
    x360: { gen: 7, txt: 'Pestañas que se deslizan, la Guía con el botón del centro y el sonido de cada logro.' },
    wii: { gen: 7, txt: 'Tus juegos como canales en una cuadrícula, el reloj grande abajo y la música de cada canal.' },
    ps3: { gen: 7, txt: 'La barra de categorías que cruza la pantalla, la ola de colores y la música de cada juego.' },
    vita: { gen: 8, txt: 'Burbujas repartidas en páginas y tarjetas que se abren como en la portátil.' },
    '3ds': { gen: 8, txt: 'Las dos pantallas: arriba el juego marcado y abajo la cuadrícula para elegir.' },
    ps4: { gen: 8, txt: 'La fila de juegos sobre su fondo grande, las funciones arriba y tus trofeos.' },
    xone: { gen: 8, txt: 'Mosaicos de colores con Pins, Inicio y Tienda, en el color que elijas.' },
    switch: { gen: 8, txt: 'Los cuadros de tus juegos en una fila, los botones redondos y su tema claro u oscuro.' },
  };
  const PILLS = [
    { a: 'stats', label: 'Resumen', key: 'R' },
    { a: 'cfg', label: 'Ajustes', key: 'A', pad: 'Options' },
  ];
  // La línea: de LEFT a RIGHT (centro de cada tarjeta)
  const LEFT = 190;
  const RIGHT = 1730;

  window.MenuStyles.linea = {
    name: 'Línea de tiempo',
    mount(root, ctx) {
      const { api } = ctx;
      root.innerHTML = `
        <div class="hl">
          <div class="hl-spot"></div>
          <header class="hl-top">
            <div class="hl-brand">NOSTALHUB</div>
            ${U.clockHtml('hl-clock')}
            ${PILLS.map((p) => `<button class="hl-pill" data-a="${p.a}">${K.ICON[p.a]}<span>${p.label}</span><kbd${p.pad ? ` data-pad="${p.pad}"` : ''}>${p.key}</kbd></button>`).join('')}
          </header>
          <section class="hl-plaque">
            <small class="hl-co"></small>
            <h1 class="hl-name"></h1>
            <p class="hl-txt"></p>
            <div class="hl-stats"></div>
            <button class="hl-go">Entrar</button>
          </section>
          <section class="hl-exhibit"><div class="hl-glow"></div><div class="hl-ic"></div><div class="hl-pedestal"></div></section>
          <div class="hl-line"></div>
          <div class="hl-cards"></div>
          <div class="hl-hint">← → recorrer los años · Enter entrar · ↑ botones de arriba · A ajustes · R resumen</div>
        </div>`;
      const $ = (s) => root.querySelector(s);
      const cards = $('.hl-cards');
      const kf = { area: 'line', pill: 0 };
      let ids = '';
      let shownId = null;

      // ---------- La línea ----------
      function render() {
        const list = ctx.consoles();
        const assets = ctx.assets();
        ids = list.map((c) => c.id).join();
        const step = list.length > 1 ? (RIGHT - LEFT) / (list.length - 1) : 0;
        const w = Math.min(170, Math.max(110, step - 16));
        cards.innerHTML = list
          .map((c, i) => {
            const a = assets[c.id] || {};
            const x = list.length > 1 ? LEFT + i * step : (LEFT + RIGHT) / 2;
            const pic = a.icon ? `<img src="${esc(a.icon)}" alt="" draggable="false" />` : ctx.GAMEPAD_SVG;
            return `<div class="hl-c" data-id="${esc(c.id)}" style="left:${x}px;--w:${w}px;--c:${esc((c.look && c.look.accent) || '#e8c79a')}"><div class="hl-c-ic">${pic}</div><span>${esc(c.name)}</span></div><b class="hl-y" data-id="${esc(c.id)}" style="left:${x}px">${c.year || ''}</b><i class="hl-dot" data-id="${esc(c.id)}" style="left:${x}px"></i>`;
          })
          .join('');
        cards.querySelectorAll('.hl-c').forEach((el) =>
          el.addEventListener('click', () => {
            const n = ctx.consoles().findIndex((x) => x.id === el.dataset.id);
            if (n === ctx.index()) ctx.enter();
            else ctx.select(n);
          })
        );
        shownId = null;
        update(false);
      }

      function update() {
        const list = ctx.consoles();
        if (list.map((c) => c.id).join() !== ids) return render();
        const c = list[ctx.index()];
        root.querySelectorAll('.hl-c, .hl-y, .hl-dot').forEach((el) => el.classList.toggle('sel', !!c && el.dataset.id === c.id));
        if (c && c.id !== shownId) paintPlaque(c);
        paintKf();
      }

      // ---------- La ficha y la consola sobre su pedestal ----------
      function paintPlaque(c) {
        shownId = c.id;
        const a = ctx.assets()[c.id] || {};
        const f = FICHA[c.id] || {};
        root.style.setProperty('--c', ctx.uiAccent(c.look || {}));
        $('.hl-co').textContent = `${c.company}${c.year ? ` · ${c.year}` : ''}`.toUpperCase();
        const name = $('.hl-name');
        name.classList.toggle('has-logo', !!a.logo);
        name.innerHTML = a.logo ? `<img src="${esc(a.logo)}" alt="${esc(c.name)}" draggable="false" />` : esc(c.name);
        name.style.fontSize = a.logo ? '' : `${Math.max(70, Math.min(124, Math.floor(1240 / Math.max(c.name.length, 8))))}px`;
        const img = name.querySelector('img');
        if (img) img.onerror = () => ((name.textContent = c.name), name.classList.remove('has-logo'));
        $('.hl-txt').textContent = f.txt || '';
        const age = c.year ? new Date().getFullYear() - c.year : null;
        const seen = K.visits()[c.id];
        $('.hl-stats').innerHTML = [
          age != null ? `<div><b>${age}</b>${age === 1 ? 'año' : 'años'}</div>` : '',
          f.gen ? `<div><b>${f.gen}ª</b>generación</div>` : '',
          seen ? `<div><b>${esc(U.ago(seen).replace(/^hace /, ''))}</b>desde tu última visita</div>` : '<div><b>—</b>sin visitas aún</div>',
        ].join('');
        // La consola sobre el pedestal: su modelo 3D, su icono o el control
        K.showConsole($('.hl-ic'), ctx, c);
        root.classList.remove('hl-in');
        void root.offsetWidth;
        root.classList.add('hl-in');
      }
      $('.hl-go').addEventListener('click', (e) => {
        e.stopPropagation();
        ctx.enter();
      });

      // ---------- Botones de arriba ----------
      function paintKf() {
        root.querySelectorAll('.hl-pill').forEach((b, i) => b.classList.toggle('kf', kf.area === 'top' && i === kf.pill));
      }
      function runPill(a) {
        if (a === 'stats') ctx.openStats();
        else if (a === 'cfg') ctx.openSettings();
      }
      root.querySelectorAll('.hl-pill').forEach((b) =>
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          runPill(b.dataset.a);
        })
      );
      function key(e) {
        const k = e.key;
        if (kf.area === 'top') {
          if (k === 'ArrowLeft') kf.pill = Math.max(0, kf.pill - 1);
          else if (k === 'ArrowRight') kf.pill = Math.min(PILLS.length - 1, kf.pill + 1);
          else if (k === 'ArrowDown' || k === 'Escape' || k === 'Backspace') kf.area = 'line';
          else if (k === 'Enter' || k === ' ') {
            e.preventDefault();
            kf.area = 'line';
            paintKf();
            runPill(PILLS[kf.pill].a);
            return true;
          } else return k === 'ArrowUp';
          paintKf();
          return true;
        }
        if (k === 'ArrowLeft' || k === 'ArrowRight') {
          ctx.select(ctx.index() + (k === 'ArrowRight' ? 1 : -1));
          return true;
        }
        if (k === 'ArrowUp') {
          kf.area = 'top';
          kf.pill = PILLS.length - 1;
          paintKf();
          return true;
        }
        return k === 'ArrowDown';
      }

      render();

      return {
        fixedOrder: 'year', // siempre por fecha de salida
        render,
        update,
        key,
        visible(on) {
          // Al volver de una consola, la ficha se repinta ("desde tu última visita" cambió)
          if (on && shownId) {
            const c = ctx.consoles().find((x) => x.id === shownId);
            if (c) paintPlaque(c);
          }
        },
        unmount() {
          root.innerHTML = '';
          root.style.removeProperty('--c');
          root.classList.remove('hl-in');
        },
      };
    },
  };
})();
