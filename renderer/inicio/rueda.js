/* Menú principal, estilo "Rueda y vista previa": una barra de íconos a la izquierda (Consolas, Resumen, Ordenar, Ajustes),
   las consolas en una rueda vertical y, a la derecha, cómo se ve el menú de la consola marcada: una foto real que
   NostalHub toma unos segundos después de entrar a ella (shell.js → api.captureConsoleMenu, cache\vistas\<id>.jpg).
   Fondo oscuro con el color de la consola marcada.
   Consola nueva: no necesita nada propio (su foto aparece sola después de entrar una vez). Revisar que su nombre o logo
   quepa en la rueda.
   Teclas: ↑ ↓ giran la rueda; ← va a la barra de la izquierda (↑ ↓ y Enter; → o Esc vuelve). Contrato: ver estanteria.js. */
(() => {
  const U = window.NostalHubUtil;
  const K = window.HomeKit;
  const esc = U.escapeHtml;
  window.MenuStyles = window.MenuStyles || {};

  const HOME = '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16h20a9 9 0 0 1 8.6 11.4l-2 7a4.5 4.5 0 0 1-7.6 1.8L29 32H19l-4 4.2a4.5 4.5 0 0 1-7.6-1.8l-2-7A9 9 0 0 1 14 16Z"/><path d="M15 22v6M12 25h6"/></svg>';
  const RAIL = [
    { a: 'home', label: 'Consolas', icon: HOME },
    { a: 'stats', label: 'Resumen de horas (R)', icon: K.ICON.stats },
    { a: 'sort', label: 'Ordenar consolas (O)', icon: K.ICON.sort },
    { a: 'cfg', label: 'Ajustes (A)', icon: K.ICON.cfg },
  ];
  // Lugar de cada consola en la rueda según qué tan lejos está de la marcada (centro en y = 0)
  const Y = { 0: 0, 1: 250, 2: 380 };

  window.MenuStyles.rueda = {
    name: 'Rueda y vista previa',
    mount(root, ctx) {
      const { api } = ctx;
      root.innerHTML = `
        <div class="hr">
          <nav class="hr-rail">
            <div class="hr-me"></div>
            ${RAIL.map((r) => `<button class="hr-r${r.a === 'cfg' ? ' end' : ''}" data-a="${r.a}" title="${esc(r.label)}">${r.icon}</button>`).join('')}
          </nav>
          <section class="hr-wheel"></section>
          <section class="hr-prev"><div class="hr-shot"></div></section>
          <div class="hr-prev-l"><span>Así se ve su menú</span><span class="hr-seen"></span></div>
          <footer class="hr-foot">
            <span class="hr-hint">↑ ↓ girar la rueda · Enter entrar · ← barra de la izquierda · A ajustes</span>
            <div class="hr-song"></div>
          </footer>
        </div>`;
      const $ = (s) => root.querySelector(s);
      const wheel = $('.hr-wheel');
      const kf = { area: 'wheel', rail: 0 };
      let ids = '';
      let shownId = null;
      let previews = {};
      let data = null;

      // ---------- La rueda ----------
      function render() {
        const list = ctx.consoles();
        const assets = ctx.assets();
        ids = list.map((c) => c.id).join();
        wheel.innerHTML = list
          .map((c) => {
            const a = assets[c.id] || {};
            return `<div class="hr-w${a.logo ? ' has-logo' : ''}" data-id="${esc(c.id)}">
              <small>${esc(`${c.company}${c.year ? ` · ${c.year}` : ''}`.toUpperCase())}</small>
              <b class="hr-n">${esc(c.name)}</b>${a.logo ? `<img class="hr-logo" src="${esc(a.logo)}" alt="" draggable="false" />` : ''}
              <button class="hr-go" tabindex="-1">Entrar ›</button>
            </div>`;
          })
          .join('');
        wheel.querySelectorAll('.hr-w').forEach((el) => {
          const img = el.querySelector('.hr-logo');
          if (img) img.onerror = () => el.classList.remove('has-logo');
          el.addEventListener('click', () => {
            const n = ctx.consoles().findIndex((x) => x.id === el.dataset.id);
            if (n === ctx.index()) ctx.enter();
            else ctx.select(n);
          });
        });
        shownId = null;
        update(false);
      }

      function update(animate = true) {
        const list = ctx.consoles();
        if (list.map((c) => c.id).join() !== ids) return render();
        const index = ctx.index();
        wheel.querySelectorAll('.hr-w').forEach((el) => {
          const d = list.findIndex((c) => c.id === el.dataset.id) - index;
          const n = Math.abs(d);
          el.className = el.className.replace(/ ?(n0|n1|n2|far)\b/g, '') + ` ${n === 0 ? 'n0' : n === 1 ? 'n1' : n === 2 ? 'n2' : 'far'}`;
          el.style.transition = animate ? '' : 'none';
          el.style.transform = `translateY(calc(-50% + ${Math.sign(d) * (Y[n] != null ? Y[n] : 470)}px))`;
          if (!animate) void el.offsetWidth;
        });
        const c = list[index];
        if (c && c.id !== shownId) paintPreview(c);
        paintKf();
        if (data && data.shown()) data.refresh();
      }

      // ---------- Vista previa: la foto de su menú ----------
      function paintPreview(c) {
        shownId = c.id;
        const look = c.look || {};
        root.style.setProperty('--c', look.accent || '#4cc2ff');
        root.style.setProperty('--cu', ctx.uiAccent(look));
        const shot = $('.hr-shot');
        const url = previews[c.id];
        shot.classList.toggle('empty', !url);
        if (url) {
          shot.style.background = '';
          shot.innerHTML = `<img src="${esc(url)}" alt="" draggable="false" />`;
          shot.querySelector('img').onerror = () => (delete previews[c.id], paintPreview(c));
        } else {
          // Todavía no hay foto: su fondo, su imagen y cómo conseguirla
          const a = ctx.assets()[c.id] || {};
          shot.style.background = a.background ? `center / cover no-repeat url("${a.background}")` : look.background || look.base || '#222';
          shot.innerHTML = `<div class="hr-shot-pic"></div><div class="hr-shot-tx" style="color:${esc(look.text || '#fff')}">Entra una vez a la ${esc(c.name)} y aquí verás su menú</div>`;
          K.showConsole(shot.querySelector('.hr-shot-pic'), ctx, c);
        }
        const seen = K.visits()[c.id];
        $('.hr-seen').innerHTML = seen ? `Tu última visita: <b>${esc(U.ago(seen))}</b>` : '';
        root.classList.remove('hr-in');
        void root.offsetWidth;
        root.classList.add('hr-in');
      }
      if (api.getConsolePreviews)
        api.getConsolePreviews().then((p) => {
          previews = p || {};
          const c = ctx.consoles()[ctx.index()];
          if (c) paintPreview(c);
        });

      // ---------- Barra de la izquierda ----------
      function paintKf() {
        root.querySelectorAll('.hr-r').forEach((b, i) => {
          b.classList.toggle('kf', kf.area === 'rail' && i === kf.rail);
          b.classList.toggle('on', b.dataset.a === 'home' && kf.area === 'wheel');
        });
      }
      function runRail(a) {
        kf.area = 'wheel';
        paintKf();
        if (a === 'stats') ctx.openStats();
        else if (a === 'sort') ctx.openSort();
        else if (a === 'cfg') ctx.openSettings();
      }
      root.querySelectorAll('.hr-r').forEach((b) =>
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          runRail(b.dataset.a);
        })
      );
      K.profile(api, (p) => {
        $('.hr-me').title = p.name;
        $('.hr-me').innerHTML = p.avatar ? `<img src="${esc(p.avatar)}" alt="" draggable="false" />` : `<b>${esc(p.name.trim().charAt(0).toUpperCase())}</b>`;
      });

      function key(e) {
        const k = e.key;
        if (kf.area === 'rail') {
          if (k === 'ArrowDown') kf.rail = Math.min(RAIL.length - 1, kf.rail + 1);
          else if (k === 'ArrowUp') kf.rail = Math.max(0, kf.rail - 1);
          else if (k === 'ArrowRight' || k === 'Escape' || k === 'Backspace') kf.area = 'wheel';
          else if (k === 'Enter' || k === ' ') {
            e.preventDefault();
            runRail(RAIL[kf.rail].a);
            return true;
          } else return k === 'ArrowLeft';
          paintKf();
          return true;
        }
        if (k === 'ArrowUp' || k === 'ArrowDown') {
          ctx.select(ctx.index() + (k === 'ArrowDown' ? 1 : -1));
          return true;
        }
        if (k === 'ArrowLeft') {
          kf.area = 'rail';
          kf.rail = 0;
          paintKf();
          return true;
        }
        return k === 'ArrowRight';
      }

      // ---------- Abajo: la canción ----------
      function paintSong(st) {
        const v = U.spotifyView(st || {});
        const box = $('.hr-song');
        box.classList.toggle('off', !v.on);
        box.innerHTML = `<i${v.cover ? ` style="background-image:url('${esc(v.cover)}')"` : ''}>${v.cover ? '' : K.ICON.music}</i><b>${esc(v.title)}</b><span>${esc(v.artist)}</span>`;
      }

      render();
      data = K.live(api, { music: paintSong });

      return {
        vertical: true, // la rueda gira de arriba abajo (Mover usa ↑ ↓)
        render,
        update,
        key,
        // Llegó la foto nueva del menú de una consola (shell.js la toma al entrar)
        preview(id, url) {
          previews[id] = url;
          if (id === shownId) {
            const c = ctx.consoles().find((x) => x.id === id);
            if (c) paintPreview(c);
          }
        },
        visible(on) {
          data.visible(on);
          if (on && shownId) {
            const c = ctx.consoles().find((x) => x.id === shownId);
            if (c) paintPreview(c);
          }
        },
        unmount() {
          data.dispose();
          root.innerHTML = '';
          root.style.removeProperty('--c');
          root.style.removeProperty('--cu');
          root.classList.remove('hr-in');
        },
      };
    },
  };
})();
