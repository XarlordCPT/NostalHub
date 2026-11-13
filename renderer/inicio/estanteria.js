/* Menú principal, estilo "Estantería": las consolas en una fila de tarjetas (la marcada crece y tiñe el fondo con su
   color), arriba el reloj y los botones Resumen / Ordenar / Ajustes, y abajo lo último que jugaste, tus horas de la
   semana y la canción que suena.
   Consola nueva: no necesita nada propio. Revisar que su color (uiAccent) se lea sobre blanco y que su icono.png /
   modelo.glb quepan en la tarjeta.
   Lo que es de todos los estilos (qué consola está marcada, entrar, ordenar, mover, Ajustes, Resumen) lo maneja
   shell.js; este archivo solo dibuja. Contrato de un estilo (window.MenuStyles[id]):
     mount(root, ctx) → { render(), update(animate), key(e) → true si la usó, visible(on), unmount() } */
(() => {
  const U = window.NostalHubUtil;
  const esc = U.escapeHtml;
  window.MenuStyles = window.MenuStyles || {};

  const ICON = {
    stats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 20V11M12 20V4M19 20v-6"/></svg>',
    sort: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"/></svg>',
    cfg: '<svg viewBox="0 0 48 48" fill="currentColor"><path fill-rule="evenodd" d="M39.07 20.38 L43.82 21.34 L43.82 26.66 L39.07 27.62 L37.22 32.10 L39.90 36.13 L36.13 39.90 L32.10 37.22 L27.62 39.07 L26.66 43.82 L21.34 43.82 L20.38 39.07 L15.90 37.22 L11.87 39.90 L8.10 36.13 L10.78 32.10 L8.93 27.62 L4.18 26.66 L4.18 21.34 L8.93 20.38 L10.78 15.90 L8.10 11.87 L11.87 8.10 L15.90 10.78 L20.38 8.93 L21.34 4.18 L26.66 4.18 L27.62 8.93 L32.10 10.78 L36.13 8.10 L39.90 11.87 L37.22 15.90 Z M30.5 24 A6.5 6.5 0 1 0 17.5 24 A6.5 6.5 0 1 0 30.5 24 Z"/></svg>',
    music: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 35V11l19-4v24"/><circle cx="14" cy="35" r="5"/><circle cx="33" cy="31" r="5"/></svg>',
  };
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
  const REFRESH_MS = 30000;

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
      let order = ''; // las consolas dibujadas (para redibujar si cambian)
      let alive = true;
      let shown = true;
      let lastLoad = 0;
      let spotify = null;
      const offs = [];

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
        if (shown && Date.now() - lastLoad > REFRESH_MS) loadData();
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
      async function loadData() {
        lastLoad = Date.now();
        const [state, week] = await Promise.all([api.getState ? api.getState().catch(() => null) : null, api.getStats ? api.getStats('week', 0).catch(() => null) : null]);
        if (!alive) return;
        paintLast((state && state.games) || []);
        paintWeek(week);
      }
      function paintLast(games) {
        const g = games.filter((x) => x.lastPlayed).sort((a, b) => b.lastPlayed - a.lastPlayed)[0];
        const box = $('.he-last');
        if (!g) {
          box.innerHTML = `<div class="he-thumb"></div><div class="he-tx"><small>Lo último que jugaste</small><b>Todavía nada</b><span>Entra a una consola y elige un juego</span></div>`;
          return;
        }
        const art = g.header || (g.tileIsVideo ? null : g.tile) || g.hero;
        box.innerHTML = `<div class="he-thumb"></div><div class="he-tx"><small>Lo último que jugaste</small><b>${esc(g.name)}</b><span>${esc([U.ago(g.lastPlayed), U.hours(g.playtimeMin)].filter(Boolean).join(' · '))}</span></div>`;
        if (art) U.stillBackground(box.querySelector('.he-thumb'), art);
      }
      function paintWeek(w) {
        const box = $('.he-week');
        const buckets = (w && w.ok && w.buckets) || [];
        const max = Math.max(1, ...buckets.map((b) => b.sec));
        const bars = buckets.map((b) => `<i class="${b.now ? 'now' : ''}" style="height:${Math.max(8, Math.round((b.sec / max) * 100))}%"></i>`).join('');
        const total = w && w.ok ? w.totalSec : 0;
        const hrs = total >= 3600 ? `${String(Math.round(total / 360) / 10).replace('.', ',')} horas` : total ? `${Math.max(1, Math.round(total / 60))} min` : 'Sin jugar';
        const top = w && w.top && w.top[0];
        box.innerHTML = `<div class="he-bars">${bars}</div><div class="he-tx"><small>Esta semana</small><b>${hrs}</b><span>${top ? `Más jugado: ${esc(top.name)}` : 'Todavía sin horas esta semana'}</span></div>`;
      }
      function paintSong() {
        const v = U.spotifyView(spotify || {});
        const box = $('.he-song');
        box.classList.toggle('off', !v.on);
        box.innerHTML = `<div class="he-cover"${v.cover ? ` style="background-image:url('${esc(v.cover)}')"` : ''}>${v.cover ? '' : ICON.music}</div><div class="he-tx"><small>${v.on ? `${v.playing ? 'Suena' : 'En pausa'} en ${esc(v.app)}` : 'Música'}</small><b>${esc(v.title)}</b><span>${esc(v.artist)}</span></div>`;
      }
      if (api.onSpotify) offs.push(api.onSpotify((s) => ((spotify = s), paintSong())));
      if (api.onGamesUpdated) offs.push(api.onGamesUpdated((games) => paintLast(games || [])));
      paintSong();

      // Mientras estás dentro de una consola, no se pide la música ni se recargan los datos
      function visible(on) {
        if (on === shown) return;
        shown = on;
        if (api.spotifyWatch) api.spotifyWatch(on).then((s) => on && alive && s && ((spotify = s), paintSong()));
        if (on) loadData();
      }
      if (api.spotifyWatch) api.spotifyWatch(true).then((s) => alive && s && ((spotify = s), paintSong()));
      if (api.getSteamProfile)
        api.getSteamProfile().then((p) => {
          if (!alive || !p || !p.name) return;
          const me = $('.he-me');
          me.hidden = false;
          me.title = p.name;
          me.innerHTML = p.avatar ? `<img src="${esc(p.avatar)}" alt="" draggable="false" />` : `<b>${esc(p.name.trim().charAt(0).toUpperCase())}</b>`;
        });

      render();
      loadData();

      return {
        render,
        update,
        key,
        visible,
        unmount() {
          alive = false;
          offs.forEach((off) => off && off());
          if (shown && api.spotifyWatch) api.spotifyWatch(false);
          root.innerHTML = '';
          root.style.removeProperty('--c');
          root.classList.remove('he-at-top');
        },
      };
    },
  };
})();
