/* Menú principal, estilo "Panel" (oscuro): a la izquierda la lista de consolas y abajo Resumen / Ordenar / Ajustes; al
   centro la consola marcada en grande, con su propio fondo, colores y letra (como en el Clásico) y los juegos que jugaste
   hace poco; a la derecha la hora, la canción que suena (con sus botones), los amigos en línea y tus horas de la semana.
   Consola nueva: no necesita nada propio. Revisar que se lea su nombre sobre su fondo (look.background / look.text) y que
   su color de la lista (look.accent) se vea sobre fondo oscuro.
   Teclas: ↑ ↓ y ← → cambian de consola; ↓ desde la última baja a los botones de abajo. Contrato: ver estanteria.js. */
(() => {
  const U = window.NostalHubUtil;
  const K = window.HomeKit;
  const esc = U.escapeHtml;
  window.MenuStyles = window.MenuStyles || {};

  const FOOT = [
    { a: 'stats', label: 'Resumen de horas', key: 'R' },
    { a: 'sort', label: 'Ordenar consolas', key: 'O' },
    { a: 'cfg', label: 'Ajustes', key: 'A', pad: 'Options' },
  ];
  const RECENT = 4; // juegos en "Jugados hace poco"
  const FRIENDS = 4; // amigos en línea a la derecha

  window.MenuStyles.panel = {
    name: 'Panel',
    mount(root, ctx) {
      const { api } = ctx;
      root.innerHTML = `
        <div class="hp">
          <aside class="hp-side">
            <div class="hp-brand">Nostal<b>Hub</b></div>
            <h4>CONSOLAS</h4>
            <div class="hp-list"></div>
            <div class="hp-foot">${FOOT.map((f) => `<button class="hp-f" data-a="${f.a}">${K.ICON[f.a]}<span>${f.label}</span><kbd${f.pad ? ` data-pad="${f.pad}"` : ''}>${f.key}</kbd></button>`).join('')}</div>
          </aside>
          <main class="hp-main">
            <section class="hp-hero">
              <div class="hp-hero-bg"></div>
              <div class="hp-hero-ic"></div>
              <div class="hp-hero-tx">
                <small class="hp-co"></small>
                <h1 class="hp-name"></h1>
                <button class="hp-go">Entrar</button>
              </div>
            </section>
            <h3 class="hp-h">JUGADOS HACE POCO</h3>
            <div class="hp-games"></div>
          </main>
          <aside class="hp-now">
            ${U.clockHtml('hp-clock')}
            <section class="hp-w hp-song"></section>
            <section class="hp-w hp-fr"></section>
            <section class="hp-w hp-week"></section>
          </aside>
        </div>`;
      const $ = (s) => root.querySelector(s);
      const list = $('.hp-list');
      const kf = { area: 'list', foot: 0 }; // ↓ desde la última consola baja a los botones de abajo
      let ids = ''; // las consolas dibujadas
      let heroId = null;
      let data = null;
      let song = null;

      // ---------- Lista de consolas ----------
      function render() {
        const consoles = ctx.consoles();
        ids = consoles.map((c) => c.id).join();
        list.innerHTML = consoles
          .map((c) => `<button class="hp-c" data-id="${esc(c.id)}" style="--c:${esc((c.look && c.look.accent) || '#4cc2ff')}"><i></i><span>${esc(c.name)}</span><small>${c.year || ''}</small></button>`)
          .join('');
        list.querySelectorAll('.hp-c').forEach((b) =>
          b.addEventListener('click', () => {
            const n = ctx.consoles().findIndex((x) => x.id === b.dataset.id);
            if (n === ctx.index()) ctx.enter();
            else ctx.select(n);
          })
        );
        heroId = null;
        update(false);
      }

      function update() {
        const consoles = ctx.consoles();
        if (consoles.map((c) => c.id).join() !== ids) return render(); // cambió el orden (Ordenar o Mover)
        const c = consoles[ctx.index()];
        list.querySelectorAll('.hp-c').forEach((b) => {
          const on = c && b.dataset.id === c.id;
          b.classList.toggle('sel', on);
          if (on) b.scrollIntoView({ block: 'nearest' });
        });
        if (c && c.id !== heroId) paintHero(c);
        paintKf();
        if (data && data.shown()) data.refresh();
      }

      // ---------- La consola marcada, en grande ----------
      function paintHero(c) {
        heroId = c.id;
        const look = c.look || {};
        const a = ctx.assets()[c.id] || {};
        const hero = $('.hp-hero');
        hero.style.setProperty('--c', ctx.uiAccent(look));
        hero.style.setProperty('--text', look.text || '#fff');
        hero.style.setProperty('--sub', look.subtext || 'rgba(255,255,255,0.7)');
        hero.style.setProperty('--font', look.font || 'inherit');
        hero.style.setProperty('--weight', look.nameWeight || 700);
        hero.style.setProperty('--shadow', look.nameShadow || 'none');
        $('.hp-hero-bg').style.background = a.background ? `center / cover no-repeat url("${a.background}")` : look.background || look.base || '#1d2635';
        $('.hp-co').textContent = c.year ? `${c.company} · ${c.year}` : c.company;
        const name = $('.hp-name');
        name.classList.toggle('has-logo', !!a.logo);
        name.innerHTML = a.logo ? `<img src="${esc(a.logo)}" alt="${esc(c.name)}" draggable="false" />` : esc(c.name);
        name.style.fontSize = a.logo ? '' : `${Math.max(64, Math.min(120, Math.floor(1100 / Math.max(c.name.length, 7))))}px`;
        const img = name.querySelector('img');
        if (img) img.onerror = () => ((name.textContent = c.name), name.classList.remove('has-logo'));
        // Imagen o modelo 3D de la consola (arriba a la derecha)
        const ic = $('.hp-hero-ic');
        ic.innerHTML = '';
        ic.className = 'hp-hero-ic home-model active';
        const showImage = () => {
          ic.querySelectorAll('.sel-model').forEach((m) => m.remove());
          if (a.icon) {
            const i = document.createElement('img');
            i.src = a.icon;
            i.alt = '';
            i.draggable = false;
            ic.appendChild(i);
          } else ic.innerHTML = ctx.GAMEPAD_SVG;
        };
        if (a.model && window.ConsoleModel) window.ConsoleModel.attach(ic, a.model, showImage, ctx.modelTilt(c.id));
        else showImage();
        hero.classList.remove('hp-in');
        void hero.offsetWidth;
        hero.classList.add('hp-in');
      }
      $('.hp-go').addEventListener('click', (e) => {
        e.stopPropagation();
        ctx.enter();
      });

      // ---------- Botones de abajo (Resumen, Ordenar, Ajustes) ----------
      function paintKf() {
        root.querySelectorAll('.hp-f').forEach((b, i) => b.classList.toggle('kf', kf.area === 'foot' && i === kf.foot));
        root.classList.toggle('hp-at-foot', kf.area === 'foot');
      }
      function runFoot(a) {
        if (a === 'stats') ctx.openStats();
        else if (a === 'sort') ctx.openSort();
        else if (a === 'cfg') ctx.openSettings();
      }
      root.querySelectorAll('.hp-f').forEach((b) =>
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          runFoot(b.dataset.a);
        })
      );

      function key(e) {
        const k = e.key;
        const n = ctx.consoles().length;
        if (kf.area === 'foot') {
          if (k === 'ArrowDown') kf.foot = Math.min(FOOT.length - 1, kf.foot + 1);
          else if (k === 'ArrowUp') {
            if (kf.foot > 0) kf.foot--;
            else kf.area = 'list';
          } else if (k === 'Escape' || k === 'Backspace') kf.area = 'list';
          else if (k === 'Enter' || k === ' ') {
            e.preventDefault();
            kf.area = 'list';
            paintKf();
            runFoot(FOOT[kf.foot].a);
            return true;
          } else if (k === 'ArrowLeft' || k === 'ArrowRight') {
            kf.area = 'list';
            ctx.select(ctx.index() + (k === 'ArrowRight' ? 1 : -1));
          } else return false;
          paintKf();
          return true;
        }
        if (k === 'ArrowDown' && ctx.index() >= n - 1) {
          kf.area = 'foot';
          kf.foot = 0;
          paintKf();
          return true;
        }
        if (k === 'ArrowDown' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowLeft') {
          ctx.select(ctx.index() + (k === 'ArrowDown' || k === 'ArrowRight' ? 1 : -1));
          return true;
        }
        return false;
      }

      // ---------- Jugados hace poco ----------
      function paintGames(games) {
        const rec = K.recent(games).slice(0, RECENT);
        const box = $('.hp-games');
        if (!rec.length) {
          box.innerHTML = '<div class="hp-empty">Todavía no juegas nada: entra a una consola y elige un juego.</div>';
          return;
        }
        box.innerHTML = rec
          .map((g) => `<div class="hp-g" data-game-id="${esc(g.id)}" title="${esc(g.name)}"><div class="hp-g-art"></div>${g.playtimeMin ? `<em>${esc(U.hours(g.playtimeMin).replace(' jugadas', '').replace(' jugados', ''))}</em>` : ''}<span>${esc(g.name)}</span></div>`)
          .join('');
        box.querySelectorAll('.hp-g').forEach((el, i) => {
          const a = K.art(rec[i]);
          if (a) U.stillBackground(el.querySelector('.hp-g-art'), a);
        });
      }

      // ---------- Derecha: música, amigos y la semana ----------
      function paintSong(st) {
        if (st) song = st;
        const v = U.spotifyView(song || {});
        const box = $('.hp-song');
        box.innerHTML = `<h5>${v.on ? `SUENA AHORA · ${esc(v.app.toUpperCase())}` : 'MÚSICA'}</h5>
          <div class="hp-s"><div class="hp-cov"${v.cover ? ` style="background-image:url('${esc(v.cover)}')"` : ''}>${v.cover ? '' : K.ICON.music}</div><div class="hp-s-tx"><b>${esc(v.title)}</b><span>${esc(v.artist)}</span></div></div>
          ${U.progressHtml(v, 'hp-prog')}
          ${v.on ? `<div class="hp-ctl"><button data-m="prev">${U.npIcon('prev')}</button><button class="big" data-m="toggle">${U.npIcon(v.playing ? 'pause' : 'play')}</button><button data-m="next">${U.npIcon('next')}</button></div>` : ''}`;
        box.querySelectorAll('[data-m]').forEach((b) =>
          b.addEventListener('click', (e) => {
            e.stopPropagation();
            if (api.spotifyControl) api.spotifyControl(b.dataset.m);
            if (b.dataset.m === 'toggle' && song && song.running) paintSong({ ...song, playing: !song.playing }); // se ve al tiro
          })
        );
      }
      const feed = U.friendsFeed(api);
      function paintFriends() {
        const box = $('.hp-fr');
        const d = feed.data;
        const on = feed.online || [];
        if (d.status !== 'ok') {
          const m = U.friendsMessage(d.status);
          box.innerHTML = `<h5>AMIGOS</h5><div class="hp-msg">${esc(m.t)}</div>`;
          return;
        }
        box.innerHTML = `<h5>AMIGOS EN LÍNEA · ${on.length}</h5>${
          on.length
            ? on
                .slice(0, FRIENDS)
                .map((f) => `<div class="hp-f1"><span class="hp-av ${U.friendClass(f)}">${f.avatar ? `<img src="${esc(f.avatar)}" alt="" />` : `<b>${esc((f.name || '?').trim().charAt(0).toUpperCase())}</b>`}<i></i></span><div><b>${esc(f.name)}</b><span class="${U.friendClass(f)}">${esc(U.friendStatus(f))}</span></div></div>`)
                .join('') + (on.length > FRIENDS ? `<div class="hp-more">y ${on.length - FRIENDS} más</div>` : '')
            : '<div class="hp-msg">Nadie conectado ahora</div>'
        }`;
      }
      feed.onChange(paintFriends);
      feed.load();
      function paintWeek(w) {
        const top = w && w.top && w.top[0];
        const days = ((w && w.ok && w.buckets) || []).map((b) => `<span>${esc(String(b.label || '').charAt(0))}</span>`).join('');
        $('.hp-week').innerHTML = `<h5>ESTA SEMANA</h5><div class="hp-big">${K.hoursText(w && w.ok ? w.totalSec : 0)}${top ? `<span>· Más jugado: ${esc(top.name)}</span>` : ''}</div><div class="hp-bars">${K.weekBars(w)}</div><div class="hp-days">${days}</div>`;
      }

      render();
      data = K.live(api, { data: ({ games, week }) => (paintGames(games), paintWeek(week)), games: paintGames, music: paintSong });

      return {
        vertical: true, // la lista va de arriba abajo (Mover usa ↑ ↓)
        render,
        update,
        key,
        visible(on) {
          data.visible(on);
          if (on) feed.load();
        },
        unmount() {
          data.dispose();
          feed.dispose();
          root.innerHTML = '';
          root.classList.remove('hp-at-foot');
        },
      };
    },
  };
})();
