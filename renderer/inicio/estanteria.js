/* Menú principal, estilo "Estantería": las consolas en una fila de tarjetas (la marcada crece y tiñe el fondo con su
   color), arriba el reloj y los botones Resumen / Ordenar / Ajustes, y abajo lo último que jugaste, tus horas de la
   semana y la canción que suena.
   Consola nueva: no necesita nada propio. Revisar que su color (uiAccent) se lea sobre blanco y que su icono.png /
   modelo.glb quepan en la tarjeta.
   Lo que es de todos los estilos (qué consola está marcada, entrar, ordenar, mover, Ajustes, Resumen) lo maneja
   shell.js; este archivo solo dibuja. Contrato de un estilo (window.MenuStyles[id]):
     mount(root, ctx) → { render(), update(animate), key(e) → true si la usó, visible(on), unmount() }
   y opcionales: vertical (Mover con ↑ ↓), fixedOrder ('year': orden fijo) y preview(id, url) (foto nueva de un menú). */
(() => {
  const U = window.NostalHubUtil;
  const esc = U.escapeHtml;
  window.MenuStyles = window.MenuStyles || {};

  const K = window.HomeKit;
  const ICON = K.ICON;
  const PILLS = [
    { a: 'stats', label: 'Resumen', key: 'R' },
    { a: 'sort', label: 'Ordenar', key: 'O' },
    { a: 'cfg', label: 'Ajustes', key: 'A', pad: 'Options' },
  ];
  // Tamaño y lugar de cada tarjeta según qué tan lejos está de la marcada
  const SEL = { w: 440, h: 540 };
  const CARD = { w: 250, h: 330 };
  const GAP = 34;
  const SHELF_Y = 500; // centro vertical de la fila

  function xOf(d) {
    if (!d) return 0;
    const n = Math.abs(d);
    return Math.sign(d) * (SEL.w / 2 + GAP + CARD.w / 2 + (n - 1) * (CARD.w + GAP));
  }

  window.MenuStyles.estanteria = {
    name: 'Estantería',
    mount(root, ctx) {
      const { api } = ctx;
      root.innerHTML = `
        <div class="he">
          <div class="he-bg"><div class="he-bg-img"></div><div class="he-tint"></div></div>
          <header class="he-top">
            <div class="he-brand">Nostal<b>Hub</b></div>
            ${U.clockHtml('he-clock')}
            <div class="he-pills">${PILLS.map((p) => `<button class="he-pill" data-a="${p.a}">${ICON[p.a]}<span>${p.label}</span><kbd${p.pad ? ` data-pad="${p.pad}"` : ''}>${p.key}</kbd></button>`).join('')}</div>
            <div class="he-me" hidden></div>
          </header>
          <main class="he-shelf"></main>
          <section class="he-strip">
            <div class="he-box he-last"></div>
            <div class="he-box he-week"></div>
            <div class="he-box he-song"></div>
          </section>
          <div class="he-hint">← → elegir consola · Enter entrar · ↑ botones de arriba · A ajustes · R resumen · O ordenar</div>
        </div>`;
      const $ = (s) => root.querySelector(s);
      const shelf = $('.he-shelf');
      const kf = { area: 'shelf', pill: 0 }; // ↑ lleva a los botones de arriba
      let data = null; // datos en vivo (HomeKit.live), después del primer dibujo
      let order = ''; // las consolas dibujadas (para redibujar si cambian)

      // ---------- Tarjetas ----------
      function render() {
        const list = ctx.consoles();
        const assets = ctx.assets();
        order = list.map((c) => c.id).sort().join();
        shelf.innerHTML = '';
        list.forEach((c, i) => {
          const a = assets[c.id] || {};
          const look = c.look || {};
          const card = document.createElement('div');
          card.className = 'he-card home-model';
          card.dataset.id = c.id;
          card.style.setProperty('--c', ctx.uiAccent(look));
          card.innerHTML = `<div class="he-ic"></div>
            <div class="he-n">${esc(c.name)}</div>${a.logo ? `<img class="he-logo" src="${esc(a.logo)}" alt="" draggable="false" />` : ''}
            <div class="he-y">${esc(c.company)}${c.year ? ` · ${c.year}` : ''}</div>
            <button class="he-go" tabindex="-1">Entrar</button>`;
          if (a.logo) {
            card.classList.add('has-logo');
            card.querySelector('.he-logo').onerror = () => card.classList.remove('has-logo');
          }
          const ic = card.querySelector('.he-ic');
          const showImage = () => {
            ic.classList.remove('has-model');
            ic.querySelectorAll('.sel-model').forEach((m) => m.remove());
            if (a.icon) {
              const img = document.createElement('img');
              img.src = a.icon;
              img.alt = '';
              img.draggable = false;
              img.onerror = () => ((ic.innerHTML = ctx.GAMEPAD_SVG), ic.classList.add('pad'));
              ic.appendChild(img);
            } else {
              ic.innerHTML = ctx.GAMEPAD_SVG;
              ic.classList.add('pad');
            }
          };
          // Modelo 3D (consolas/<id>/modelo.glb): gira la marcada y sus vecinas
          if (a.model && window.ConsoleModel) window.ConsoleModel.attach(ic, a.model, showImage, ctx.modelTilt(c.id));
          else showImage();
          card.addEventListener('click', () => {
            const n = ctx.consoles().findIndex((x) => x.id === c.id);
            if (n === ctx.index()) ctx.enter();
            else ctx.select(n);
          });
          card.dataset.i = i;
          shelf.appendChild(card);
        });
        update(false);
      }

      function update(animate = true) {
        const list = ctx.consoles();
        if (list.map((c) => c.id).sort().join() !== order) {
          // cambiaron las consolas: se redibuja (si solo cambió el orden, las tarjetas se mueven a su lugar nuevo)
          render();
          return;
        }
        const index = ctx.index();
        shelf.querySelectorAll('.he-card').forEach((card) => {
          const i = list.findIndex((c) => c.id === card.dataset.id);
          const d = i - index;
          const sel = d === 0;
          const n = Math.abs(d);
          const w = sel ? SEL.w : CARD.w;
          const h = sel ? SEL.h : CARD.h;
          card.classList.toggle('sel', sel);
          card.classList.toggle('active', sel); // (el modelo 3D se dibuja en la marcada y las vecinas)
          card.classList.toggle('near', n === 1 || n === 2); // (las que se ven: su modelo 3D también gira)
          card.classList.toggle('far', n >= 2);
          card.style.transition = animate ? '' : 'none';
          card.style.width = `${w}px`;
          card.style.height = `${h}px`;
          card.style.left = `${960 + xOf(d) - w / 2}px`;
          card.style.top = `${SHELF_Y - h / 2}px`;
          card.style.opacity = n <= 1 ? 1 : n === 2 ? 0.55 : 0;
          card.style.pointerEvents = n <= 2 ? '' : 'none';
          if (!animate) void card.offsetWidth;
        });
        const c = list[index];
        if (c) {
          const look = c.look || {};
          const a = ctx.assets()[c.id] || {};
          root.style.setProperty('--c', ctx.uiAccent(look));
          const img = $('.he-bg-img');
          img.style.backgroundImage = a.background ? `url("${a.background}")` : '';
          img.classList.toggle('on', !!a.background);
        }
        paintKf();
        if (data && data.shown()) data.refresh();
      }

      // ---------- Botones de arriba ----------
      function paintKf() {
        root.querySelectorAll('.he-pill').forEach((b, i) => b.classList.toggle('kf', kf.area === 'top' && i === kf.pill));
        root.classList.toggle('he-at-top', kf.area === 'top');
      }
      function runPill(a) {
        if (a === 'stats') ctx.openStats();
        else if (a === 'sort') ctx.openSort();
        else if (a === 'cfg') ctx.openSettings();
      }
      root.querySelectorAll('.he-pill').forEach((b) =>
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
          else if (k === 'ArrowDown' || k === 'Escape' || k === 'Backspace') kf.area = 'shelf';
          else if (k === 'Enter' || k === ' ') {
            e.preventDefault();
            kf.area = 'shelf';
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
          paintKf();
          return true;
        }
        return k === 'ArrowDown';
      }

      // ---------- Abajo: lo último que jugaste, la semana y la música ----------
      function paintLast(games) {
        const g = K.recent(games)[0];
        const box = $('.he-last');
        if (!g) {
          delete box.dataset.gameId;
          box.innerHTML = `<div class="he-thumb"></div><div class="he-tx"><small>Lo último que jugaste</small><b>Todavía nada</b><span>Entra a una consola y elige un juego</span></div>`;
          return;
        }
        box.dataset.gameId = g.id; // clic derecho → cambiar su imagen
        box.innerHTML = `<div class="he-thumb"></div><div class="he-tx"><small>Lo último que jugaste</small><b>${esc(g.name)}</b><span>${esc(K.playedLine(g))}</span></div>`;
        K.paintThumb(box.querySelector('.he-thumb'), g);
      }
      function paintWeek(w) {
        const top = w && w.top && w.top[0];
        $('.he-week').innerHTML = `<div class="he-bars">${K.weekBars(w)}</div><div class="he-tx"><small>Esta semana</small><b>${K.hoursText(w && w.ok ? w.totalSec : 0)}</b><span>${top ? `Más jugado: ${esc(top.name)}` : 'Todavía sin horas esta semana'}</span></div>`;
      }
      function paintSong(st) {
        const v = U.spotifyView(st || {});
        const box = $('.he-song');
        box.classList.toggle('off', !v.on);
        box.innerHTML = `<div class="he-cover"${v.cover ? ` style="background-image:url('${esc(v.cover)}')"` : ''}>${v.cover ? '' : ICON.music}</div><div class="he-tx"><small>${v.on ? `${v.playing ? 'Suena' : 'En pausa'} en ${esc(v.app)}` : 'Música'}</small><b>${esc(v.title)}</b><span>${esc(v.artist)}</span></div>`;
      }
      K.profile(api, (p) => {
        const me = $('.he-me');
        if (!me) return;
        me.hidden = false;
        me.title = p.name;
        me.innerHTML = p.avatar ? `<img src="${esc(p.avatar)}" alt="" draggable="false" />` : `<b>${esc(p.name.trim().charAt(0).toUpperCase())}</b>`;
      });

      render();
      data = K.live(api, { data: ({ games, week }) => (paintLast(games), paintWeek(week)), games: paintLast, music: paintSong });

      return {
        render,
        update,
        key,
        visible: (on) => data.visible(on),
        unmount() {
          data.dispose();
          root.innerHTML = '';
          root.style.removeProperty('--c');
          root.classList.remove('he-at-top');
        },
      };
    },
  };
})();
