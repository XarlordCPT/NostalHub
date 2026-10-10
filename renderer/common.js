/* Utilidades compartidas por los temas: textos de tiempo, horas jugadas y logros. */
(() => {
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

  function ago(ms) {
    if (!ms) return '';
    const diff = (ms - Date.now()) / 1000;
    const abs = Math.abs(diff);
    if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
    if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
    if (abs < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), 'month');
    return rtf.format(Math.round(diff / (86400 * 365)), 'year');
  }

  function hours(min) {
    if (!min) return '';
    if (min < 60) return `${min} min jugados`;
    return `${String(Math.round(min / 6) / 10).replace('.', ',')} h jugadas`;
  }

  // "42 h jugadas · Jugado hace 2 días"
  function playLine(g) {
    return [hours(g.playtimeMin), g.lastPlayed ? `Jugado ${ago(g.lastPlayed)}` : ''].filter(Boolean).join('  ·  ');
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  }

  // Mensaje para cuando no hay logros que mostrar
  function achievementMessage(res) {
    const texts = {
      'no-key': 'Para ver tus logros, conecta tu Steam.<br><small>Ajustes → Cuentas → Conectar Steam (se hace aquí mismo, en 1 minuto).</small>',
      private: 'Steam no deja ver tus logros.<br><small>En Steam → tu perfil → Editar perfil → Privacidad, pon "Detalles de juegos" en Público.</small>',
      none: 'Este juego no tiene logros.',
      error: `No se pudieron cargar los logros.<br><small>${escapeHtml((res && res.message) || 'Revisa tu conexión a internet.')}</small>`,
    };
    return texts[res && res.status] || texts.error;
  }

  // Ordena: desbloqueados primero (más recientes arriba), después los bloqueados
  function sortAchievements(list) {
    return [...(list || [])].sort((a, b) => Number(b.done) - Number(a.done) || (b.unlockTime || 0) - (a.unlockTime || 0));
  }

  function achievementTexts(a) {
    const secret = a.hidden && !a.done;
    return {
      name: secret ? 'Logro secreto' : a.name,
      description: secret ? 'Sigue jugando para descubrirlo.' : a.description || '—',
      date: a.done && a.unlockTime ? new Date(a.unlockTime).toLocaleDateString('es-CL') : 'Bloqueado',
      percent: a.percent != null ? `Lo tiene el ${Number(a.percent).toFixed(1).replace('.', ',')} % de los jugadores` : '',
    };
  }

  // ---------- Menú de opciones (el mismo en las tres consolas, cada una lo dibuja a su manera) ----------
  // Cada opción: { id, type: 'action' | 'toggle' | 'choice', label, desc, value, options, closes, confirm }
  function optionValueText(it) {
    if (!it) return '';
    if (it.type === 'toggle') return it.value ? 'Activado' : 'Desactivado';
    if (it.type === 'choice') {
      const o = (it.options || []).find((x) => String(x.value) === String(it.value));
      return o ? o.short || o.label : '—';
    }
    return '';
  }

  // Siguiente valor al apretar Enter o ← → sobre una opción
  function optionNextValue(it, dir = 1) {
    if (it.type === 'toggle') return !it.value;
    const opts = it.options || [];
    if (!opts.length) return undefined;
    const i = opts.findIndex((x) => String(x.value) === String(it.value));
    return opts[(i + dir + opts.length) % opts.length].value;
  }

  // ---------- Música (Spotify, Apple Music, YouTube Music…) ----------
  // Lo que muestran las consolas. Con Spotify conectado (api: true) trae además el avance, la cola, etc.
  const SHUFFLE_LABEL = { off: 'En orden', on: 'Aleatorio', smart: 'Aleatorio inteligente' };
  const REPEAT_LABEL = { off: 'No', context: 'La lista', track: 'La canción' };
  function spotifyView(st) {
    st = st || {};
    const app = st.appName || 'Spotify';
    const base = { app, appId: st.app || 'spotify', on: false, cover: null, playing: false, api: false, queue: [], next: null };
    if (st.supported === false) return { ...base, title: app, artist: 'Disponible en Windows' };
    if (!st.running) {
      if (st.app === 'auto') return { ...base, title: 'No suena nada', artist: 'Pon música en cualquier app' };
      return { ...base, title: `${app} está cerrado`, artist: st.app === 'ytmusic' ? 'Ábrelo en el navegador' : 'Ábrelo para ver tu música' };
    }
    const queue = st.queue || [];
    const dev = st.device || null;
    return {
      ...base,
      on: true,
      title: st.title || (st.playing ? 'Reproduciendo' : 'En pausa'),
      artist: st.artist || '',
      album: st.album || '',
      cover: st.cover || null,
      playing: !!st.playing,
      api: !!st.hasApi,
      progressMs: st.progressMs || 0,
      durationMs: st.durationMs || 0,
      at: st.at || Date.now(),
      shuffle: st.smartShuffle ? 'smart' : st.shuffle ? 'on' : 'off',
      repeat: st.repeat || 'off',
      liked: st.liked == null ? null : !!st.liked,
      volume: dev && dev.volume != null ? dev.volume : null,
      canVolume: !!(dev && dev.canVolume !== false && dev.volume != null),
      device: dev ? dev.name : '',
      deviceType: dev ? dev.type : '',
      queue,
      next: queue[0] || null,
    };
  }
  function fmtTime(ms) {
    const t = Math.max(0, Math.floor((ms || 0) / 1000));
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  }
  // Barra de avance de la canción. Se mueve sola (ver el reloj de abajo) con los datos que lleva.
  function progressHtml(v, cls = '') {
    if (!v || !v.api || !v.durationMs) return '';
    const pos = Math.min(v.durationMs, v.progressMs + (v.playing ? Date.now() - v.at : 0));
    return `<div class="mp-prog ${cls}" data-mp data-p="${v.progressMs}" data-d="${v.durationMs}" data-at="${v.at}" data-play="${v.playing ? 1 : 0}">
      <span class="mp-cur">${fmtTime(pos)}</span><span class="mp-bar"><i style="width:${(pos / v.durationMs) * 100}%"></i></span><span class="mp-dur">${fmtTime(v.durationMs)}</span></div>`;
  }
  setInterval(() => {
    document.querySelectorAll('[data-mp]').forEach((el) => {
      const p = Number(el.dataset.p) || 0;
      const d = Number(el.dataset.d) || 0;
      if (!d) return;
      const pos = Math.min(d, p + (el.dataset.play === '1' ? Date.now() - Number(el.dataset.at) : 0));
      const cur = el.querySelector('.mp-cur');
      const bar = el.querySelector('.mp-bar i');
      if (cur) cur.textContent = fmtTime(pos);
      if (bar) bar.style.width = `${(pos / d) * 100}%`;
    });
  }, 500);
  // "Siguiente: Canción — Artista"
  function nextText(v) {
    return v && v.next ? `${v.next.title}${v.next.artist ? ` — ${v.next.artist}` : ''}` : '';
  }
  // Botones extra (solo con Spotify conectado): { id, icon, label, value, on }
  function musicActions(v) {
    if (!v || !v.api) return [];
    const out = [
      { id: 'shuffle', icon: v.shuffle === 'smart' ? 'smart' : 'shuffle', label: 'Orden', value: SHUFFLE_LABEL[v.shuffle], on: v.shuffle !== 'off' },
      { id: 'repeat', icon: v.repeat === 'track' ? 'repeat1' : 'repeat', label: 'Repetir', value: REPEAT_LABEL[v.repeat], on: v.repeat !== 'off' },
      { id: 'like', icon: v.liked ? 'heartOn' : 'heart', label: v.liked ? 'En tus Me gusta' : 'Me gusta', value: v.liked ? 'Sí' : 'No', on: !!v.liked },
    ];
    if (v.canVolume) out.push({ id: 'voldown', icon: 'volDown', label: 'Bajar volumen', value: `${v.volume} %` }, { id: 'volup', icon: 'volUp', label: 'Subir volumen', value: `${v.volume} %` });
    out.push({ id: 'device', icon: 'device', label: 'Dispositivo', value: v.device || '—' }, { id: 'queue', icon: 'queue', label: 'Cola de reproducción', value: v.queue.length ? `${v.queue.length}` : '' });
    return out;
  }
  // Hace lo de un botón extra. toast: para avisar (por ejemplo, el aleatorio inteligente).
  async function musicRun(api, id, v, toast = () => {}) {
    const ctl = (cmd, arg) => (typeof api.spotifyControl === 'function' ? api.spotifyControl(cmd, arg) : Promise.resolve(null));
    let r = null;
    if (id === 'queue') return musicSheet('queue', api, { toast });
    if (id === 'device') return musicSheet('device', api, { toast });
    if (id === 'shuffle') {
      if (v && v.shuffle === 'smart') toast('El aleatorio inteligente se apaga desde Spotify; aquí se cambia entre Aleatorio y En orden.');
      r = await ctl('shuffle');
    } else if (id === 'repeat') r = await ctl('repeat');
    else if (id === 'like') r = await ctl('like');
    else if (id === 'volup') r = await ctl('volume', 10);
    else if (id === 'voldown') r = await ctl('volume', -10);
    if (r && r.ok === false && r.message) toast(r.message);
    return r;
  }

  // ---------- Ventanita de la cola y de los dispositivos (la misma para todas las consolas) ----------
  // Cada consola le da su color con variables CSS (--ms-bg, --ms-fg, --ms-acc…, en shell.css).
  let sheet = null;
  function musicSheet(kind, api, { toast = () => {} } = {}) {
    if (sheet) sheet.close();
    const host = document.getElementById('theme-root') || document.body;
    const el = document.createElement('div');
    el.className = `ms-overlay ms-${kind}`;
    el.innerHTML = `<div class="ms-box"><div class="ms-head">${npIcon(kind === 'queue' ? 'queue' : 'device')}<span>${kind === 'queue' ? 'Cola de reproducción' : 'Dispositivos'}</span><button class="ms-x">${npIcon('close')}</button></div><div class="ms-list"></div><div class="ms-foot">↑ ↓ elegir · Enter ${kind === 'queue' ? 'saltar a esa canción' : 'pasar la música ahí'} · Esc cerrar</div></div>`;
    host.appendChild(el);
    const list = el.querySelector('.ms-list');
    let rows = [];
    let sel = 0;
    let st = null;
    function paint() {
      if (kind === 'queue') {
        const v = spotifyView(st);
        rows = v.queue.map((t, i) => ({ cover: t.cover, title: t.title, sub: t.artist, tag: i === 0 ? 'Siguiente' : '', run: () => run('skipto', i, `Saltando a "${t.title}"…`) }));
        const now = v.on ? `<div class="ms-now">${v.cover ? `<span class="ms-cov" style="background-image:url('${v.cover}')"></span>` : `<span class="ms-cov">${npIcon('music')}</span>`}<span class="ms-tx"><small>Sonando ahora</small><b>${escapeHtml(v.title)}</b><em>${escapeHtml(v.artist)}</em></span></div>` : '';
        list.innerHTML = now + (rows.length ? rows.map((r, i) => rowHtml(r, i)).join('') : `<div class="ms-empty">${v.api ? 'No hay canciones en la cola.' : 'Conecta Spotify para ver la cola.'}</div>`);
      } else {
        list.innerHTML = rows.length ? rows.map((r, i) => rowHtml(r, i)).join('') : '<div class="ms-empty">Buscando dispositivos… Si no aparece, abre Spotify en él.</div>';
      }
      list.querySelectorAll('.ms-row').forEach((b) => {
        b.addEventListener('mouseenter', () => setSel(Number(b.dataset.i), false));
        b.addEventListener('click', () => rows[Number(b.dataset.i)] && rows[Number(b.dataset.i)].run());
      });
      setSel(Math.min(sel, Math.max(0, rows.length - 1)), false);
    }
    function rowHtml(r, i) {
      return `<button class="ms-row${r.on ? ' on' : ''}" data-i="${i}">${r.cover !== undefined ? `<span class="ms-cov"${r.cover ? ` style="background-image:url('${r.cover}')"` : ''}>${r.cover ? '' : npIcon(r.icon || 'music')}</span>` : `<span class="ms-cov ic">${npIcon(r.icon || 'device')}</span>`}<span class="ms-tx"><b>${escapeHtml(r.title)}</b><em>${escapeHtml(r.sub || '')}</em></span>${r.tag ? `<span class="ms-tag">${escapeHtml(r.tag)}</span>` : ''}</button>`;
    }
    function setSel(i, scroll = true) {
      if (!rows.length) return;
      sel = Math.max(0, Math.min(rows.length - 1, i));
      list.querySelectorAll('.ms-row').forEach((b) => b.classList.toggle('sel', Number(b.dataset.i) === sel));
      const b = list.querySelector(`.ms-row[data-i="${sel}"]`);
      if (b && scroll) b.scrollIntoView({ block: 'nearest' });
    }
    async function run(cmd, arg, msg) {
      if (msg) toast(msg);
      const r = typeof api.spotifyControl === 'function' ? await api.spotifyControl(cmd, arg) : null;
      if (r && r.ok === false && r.message) toast(r.message);
      close();
    }
    const DEV_ICON = { Computer: 'device', Smartphone: 'phone', Speaker: 'speaker', TV: 'tv' };
    async function loadDevices() {
      const devs = (typeof api.spotifyDevices === 'function' ? await api.spotifyDevices() : []) || [];
      rows = devs.map((d) => ({ icon: DEV_ICON[d.type] || 'speaker', title: d.name, sub: d.active ? 'Sonando aquí' : d.type === 'Smartphone' ? 'Teléfono' : d.type === 'Computer' ? 'Computador' : d.type || '', on: d.active, run: () => (d.active ? close() : run('device', d.id, `Pasando la música a ${d.name}…`)) }));
      sel = Math.max(0, rows.findIndex((r) => r.on));
      paint();
    }
    function key(e) {
      e.stopImmediatePropagation();
      const k = e.key;
      if (k === 'ArrowDown') setSel(sel + 1);
      else if (k === 'ArrowUp') setSel(sel - 1);
      else if (k === 'Enter' || k === ' ') {
        e.preventDefault();
        if (rows[sel]) rows[sel].run();
      } else if (k === 'Escape' || k === 'Backspace') {
        e.preventDefault();
        close();
      }
    }
    const off = typeof api.onSpotify === 'function' && kind === 'queue' ? api.onSpotify((s) => ((st = s), paint())) : null;
    let closed = false;
    function close() {
      if (closed) return;
      closed = true;
      window.removeEventListener('keydown', key, true);
      if (off) off();
      if (kind === 'queue' && typeof api.spotifyWatch === 'function') api.spotifyWatch(false);
      el.classList.add('leave');
      setTimeout(() => el.remove(), 180);
      if (sheet && sheet.el === el) sheet = null;
    }
    window.addEventListener('keydown', key, true);
    el.addEventListener('pointerdown', (e) => e.target === el && close());
    el.querySelector('.ms-x').addEventListener('click', close);
    sheet = { el, close };
    if (kind === 'queue') {
      paint();
      // mientras está abierta, la cola se mantiene al día
      if (typeof api.spotifyWatch === 'function') api.spotifyWatch(true).then((s) => s && ((st = s), paint()));
    } else {
      paint();
      loadDevices();
    }
    return sheet;
  }

  // { message } cuando no hay nada que mostrar, o { channel, guild, members }
  function partyView(d) {
    d = d || {};
    const msg = {
      'no-config': 'Configura Discord para ver tu grupo (pasos en el manual).',
      'no-discord': 'Discord no está abierto.',
      connecting: 'Conectando con Discord…',
      off: 'Conectando con Discord…',
      'need-auth': 'Falta aceptar el permiso de Discord (en la PS4 o la Xbox: Grupo).',
      authorizing: 'Acepta la ventana de Discord.',
      error: d.message || 'No se pudo conectar con Discord.',
    }[d.status];
    if (msg) return { message: msg };
    if (!d.channel) return { message: 'No estás en un canal de voz.' };
    return { channel: d.channel.name, guild: d.channel.guild || 'Mensaje directo', members: d.members || [] };
  }


  // Íconos simples (trazo del color del texto)
  const NP_ICONS = {
    music: '<path d="M19 35V11l20-4v23"/><circle cx="14" cy="35" r="5.5" fill="currentColor"/><circle cx="34" cy="30" r="5.5" fill="currentColor"/>',
    headset: '<path d="M8 30v-6a16 16 0 0 1 32 0v6"/><rect x="6" y="28" width="8" height="12" rx="3"/><rect x="34" y="28" width="8" height="12" rx="3"/><path d="M40 40c0 4-5 6-12 6"/>',
    prev: '<path d="M14 10v28M38 10 18 24l20 14Z" fill="currentColor"/>',
    next: '<path d="M34 10v28M10 10l20 14-20 14Z" fill="currentColor"/>',
    play: '<path d="M15 9l25 15-25 15Z" fill="currentColor"/>',
    pause: '<path d="M14 10h7v28h-7zM27 10h7v28h-7z" fill="currentColor"/>',
    micOff: '<rect x="18" y="6" width="12" height="22" rx="6"/><path d="M11 23a13 13 0 0 0 26 0M24 36v6M8 8l32 32"/>',
    shuffle: '<path d="M6 14h7c6 0 9 4 12 10s6 10 12 10h5M6 34h7c3 0 5-1 7-3M28 17c2-2 4-3 9-3h5"/><path d="M37 9l5 5-5 5M37 29l5 5-5 5"/>',
    smart: '<path d="M6 14h7c6 0 9 4 12 10s6 10 12 10h5M6 34h7c3 0 5-1 7-3"/><path d="M37 29l5 5-5 5"/><path d="M36 6l1.6 4.4L42 12l-4.4 1.6L36 18l-1.6-4.4L30 12l4.4-1.6Z" fill="currentColor"/>',
    repeat: '<path d="M8 22v-4a6 6 0 0 1 6-6h24M33 6l6 6-6 6M40 26v4a6 6 0 0 1-6 6H10M15 42l-6-6 6-6"/>',
    repeat1: '<path d="M8 22v-4a6 6 0 0 1 6-6h24M33 6l6 6-6 6M40 26v4a6 6 0 0 1-6 6H10M15 42l-6-6 6-6"/><path d="M22 21l3-2v11" stroke-width="2.8"/>',
    heart: '<path d="M24 40S7 30 7 18a9 9 0 0 1 17-4 9 9 0 0 1 17 4c0 12-17 22-17 22Z"/>',
    heartOn: '<path d="M24 40S7 30 7 18a9 9 0 0 1 17-4 9 9 0 0 1 17 4c0 12-17 22-17 22Z" fill="currentColor"/>',
    volUp: '<path d="M8 19h7l9-7v24l-9-7H8Z"/><path d="M31 18a8 8 0 0 1 0 12M36 13a15 15 0 0 1 0 22"/>',
    volDown: '<path d="M8 19h7l9-7v24l-9-7H8Z"/><path d="M31 18a8 8 0 0 1 0 12"/>',
    speaker: '<rect x="12" y="5" width="24" height="38" rx="5"/><circle cx="24" cy="29" r="7"/><circle cx="24" cy="14" r="2.5"/>',
    device: '<rect x="6" y="9" width="36" height="24" rx="3"/><path d="M17 41h14M24 33v8"/>',
    phone: '<rect x="14" y="4" width="20" height="40" rx="4"/><path d="M21 38h6"/>',
    tv: '<rect x="5" y="9" width="38" height="25" rx="3"/><path d="M16 41h16"/>',
    queue: '<path d="M7 12h24M7 22h24M7 32h14"/><path d="M30 30v-3l10 6-10 6Z" fill="currentColor"/>',
    close: '<path d="M12 12l24 24M36 12 12 36"/>',
    deaf: '<path d="M8 30v-6a16 16 0 0 1 32 0v6"/><rect x="6" y="28" width="8" height="12" rx="3"/><rect x="34" y="28" width="8" height="12" rx="3"/><path d="M6 6l36 36"/>',
  };
  function npIcon(name) {
    return `<svg class="np-ic" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${NP_ICONS[name] || ''}</svg>`;
  }

  // Paneles de la pantalla "Jugando a…": Spotify a la izquierda y el Grupo de Discord a la derecha.
  // Cada consola les da su propio estilo con CSS (.np-panel, .np-music, .np-party…).
  function nowPlaying(container, api, toast = () => {}) {
    const music = document.createElement('aside');
    music.className = 'np-panel np-music';
    const party = document.createElement('aside');
    party.className = 'np-panel np-party';
    container.append(music, party);
    let sp = null;
    let dc = { status: 'off', channel: null, members: [] };
    let active = false;
    const offs = [];
    const has = (fn) => typeof api[fn] === 'function';

    function renderMusic() {
      const v = spotifyView(sp);
      music.classList.toggle('off', !v.on);
      music.classList.toggle('is-playing', v.playing);
      music.classList.toggle('has-api', v.api);
      const extra = v.api
        ? `<div class="np-extra">${['shuffle', 'repeat', 'like', 'queue']
            .map((id) => {
              const a = musicActions(v).find((x) => x.id === id);
              return a ? `<button class="np-mini${a.on ? ' on' : ''}" data-mx="${id}" title="${escapeHtml(a.label)}${a.value && id !== 'queue' ? `: ${escapeHtml(a.value)}` : ''}">${npIcon(a.icon)}</button>` : '';
            })
            .join('')}</div>`
        : '';
      music.innerHTML = `
        <div class="np-head">${npIcon('music')}<span>${escapeHtml(v.app)}</span><em>${v.on ? (v.playing ? 'Sonando' : 'En pausa') : ''}</em></div>
        <div class="np-cover"${v.cover ? ` style="background-image:url('${v.cover}')"` : ''}>${v.cover ? '' : npIcon('music')}</div>
        <div class="np-title">${escapeHtml(v.title)}</div>
        <div class="np-artist">${escapeHtml(v.artist)}</div>
        ${progressHtml(v, 'np-prog')}
        ${v.device && v.deviceType && v.deviceType !== 'Computer' ? `<div class="np-dev">${npIcon('speaker')}<span>En ${escapeHtml(v.device)}</span></div>` : ''}
        ${
          v.on
            ? `<div class="np-ctrl">
                <button class="np-btn" data-sp="prev" title="Anterior">${npIcon('prev')}</button>
                <button class="np-btn big" data-sp="toggle" title="Reproducir / pausar">${npIcon(v.playing ? 'pause' : 'play')}</button>
                <button class="np-btn" data-sp="next" title="Siguiente">${npIcon('next')}</button>
              </div>${extra}`
            : v.appId === 'auto'
              ? ''
              : `<div class="np-ctrl"><button class="np-btn wide" data-sp="open">${npIcon('music')}<span>Abrir ${escapeHtml(v.app)}</span></button></div>`
        }
        ${v.next ? `<div class="np-next"><small>Siguiente</small><span>${escapeHtml(nextText(v))}</span></div>` : ''}`;
      music.querySelectorAll('[data-sp]').forEach((b) =>
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          const cmd = b.dataset.sp;
          if (has('spotifyControl')) api.spotifyControl(cmd);
          if (cmd === 'toggle' && sp && sp.running) {
            sp = { ...sp, playing: !sp.playing };
            renderMusic();
          }
        })
      );
      music.querySelectorAll('[data-mx]').forEach((b) =>
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          musicRun(api, b.dataset.mx, v, toast);
        })
      );
    }

    function renderParty() {
      const v = partyView(dc);
      const n = v.members ? v.members.length : 0;
      party.innerHTML = `
        <div class="np-head">${npIcon('headset')}<span>Grupo</span><em>${v.members ? `${n} ${n === 1 ? 'persona' : 'personas'}` : ''}</em></div>
        ${
          v.message
            ? `<div class="np-msg">${escapeHtml(v.message)}</div>`
            : `<div class="np-chan"><b>${escapeHtml(v.channel)}</b><small>${escapeHtml(v.guild)}</small></div>
               <div class="np-list">${v.members
                 .map(
                   (m) => `<div class="np-m${m.speaking ? ' talking' : ''}">
                     <span class="np-av" style="background-image:url('${m.avatar}')"></span>
                     <span class="np-n">${escapeHtml(m.name)}</span>
                     ${m.deafened ? npIcon('deaf') : m.muted ? npIcon('micOff') : ''}
                   </div>`
                 )
                 .join('')}</div>`
        }`;
    }

    if (has('onSpotify'))
      offs.push(
        api.onSpotify((s) => {
          sp = s;
          if (active) renderMusic();
        })
      );
    if (has('onDiscord'))
      offs.push(
        api.onDiscord((s) => {
          dc = s;
          if (active) renderParty();
        })
      );

    return {
      start() {
        if (active) return;
        active = true;
        renderMusic();
        renderParty();
        if (has('spotifyWatch')) api.spotifyWatch(true).then((s) => s && ((sp = s), active && renderMusic()));
        if (has('discordWatch')) api.discordWatch(true).then((s) => s && ((dc = s), active && renderParty()));
      },
      stop() {
        if (!active) return;
        active = false;
        if (has('spotifyWatch')) api.spotifyWatch(false);
        if (has('discordWatch')) api.discordWatch(false);
      },
      dispose() {
        this.stop();
        offs.forEach((off) => off && off());
        music.remove();
        party.remove();
      },
    };
  }

  // ---------- Amigos de Steam (lo comparten todas las consolas) ----------
  // Grupos en el orden de Steam. 'on' incluye a los "ocupados".
  const FRIEND_GROUPS = [
    ['game', 'Jugando'],
    ['on', 'En línea'],
    ['away', 'Ausentes'],
    ['off', 'Desconectados'],
  ];
  function friendGroup(f) {
    return f.state === 0 ? 'off' : f.game ? 'game' : f.state === 3 || f.state === 4 ? 'away' : 'on';
  }
  // Para el color del puntito: game | on | busy | away | off
  function friendClass(f) {
    const g = friendGroup(f);
    return g === 'on' && f.state === 2 ? 'busy' : g;
  }
  function friendStatus(f) {
    if (f.state === 0) return f.lastSeen ? `Desconectado · ${ago(f.lastSeen)}` : 'Desconectado';
    if (f.game) return `Jugando a ${f.game}`;
    return { 2: 'Ocupado', 3: 'Ausente', 4: 'Ausente' }[f.state] || 'En línea';
  }
  // Mensaje cuando no hay lista: { t, d, btn: [qué abrir, texto] }
  function friendsMessage(status) {
    switch (status) {
      case 'no-key':
        return { t: 'Conecta tu cuenta de Steam', d: 'Para ver a tus amigos, NostalHub necesita tu clave de API de Steam (la misma de los logros).', btn: ['setup-steam', 'Conectar Steam'] };
      case 'private':
        return { t: 'Tu lista de amigos es privada', d: 'En Steam → tu perfil → Editar perfil → Configuración de privacidad, pon "Lista de amigos" en Pública.', btn: ['steam-profile', 'Abrir mi perfil'] };
      case 'loading':
        return { t: 'Cargando amigos…', d: '' };
      case 'ok':
        return { t: 'Todavía no tienes amigos en Steam', d: '' };
      default:
        return { t: 'No se pudo conectar con Steam', d: 'Revisa tu internet. Se vuelve a intentar sola en unos segundos.' };
    }
  }

  // Lista agrupada para pintar: [{ id: 'game', title: 'Jugando', items: [[amigo, índice], ...] }, ...]
  function friendsGrouped(list) {
    return FRIEND_GROUPS.map(([id, title]) => ({ id, title, items: (list || []).map((f, i) => [f, i]).filter(([f]) => friendGroup(f) === id) })).filter((g) => g.items.length);
  }
  // Lista de amigos que se actualiza sola: feed.watch(true) mientras se ve (cada 30 s), feed.onChange(fn) para repintar.
  function friendsFeed(api) {
    let data = { status: 'loading', list: [] };
    let at = 0;
    let timer = null;
    let loading = null;
    const subs = new Set();
    function load() {
      if (loading) return loading;
      at = Date.now();
      loading = Promise.resolve(typeof api.getFriends === 'function' ? api.getFriends() : null)
        .then((res) => {
          res = res || { status: 'error', list: [] };
          // Si falla una actualización, se queda la última lista buena
          if (res.status === 'ok' || data.status !== 'ok' || res.status !== 'error') data = res;
          at = Date.now();
          subs.forEach((fn) => fn(data));
          return data;
        })
        .catch(() => data)
        .finally(() => (loading = null));
      return loading;
    }
    return {
      get data() {
        return data;
      },
      get list() {
        return data.list || [];
      },
      get online() {
        return (data.list || []).filter((f) => f.state !== 0);
      },
      load,
      refresh(maxAge = 20000) {
        if (Date.now() - at > maxAge) load();
      },
      onChange(fn) {
        subs.add(fn);
        return () => subs.delete(fn);
      },
      watch(on) {
        clearInterval(timer);
        timer = null;
        if (on) {
          this.refresh(5000);
          timer = setInterval(load, 30000);
        }
      },
      dispose() {
        clearInterval(timer);
        subs.clear();
      },
      profile(f) {
        if (f && f.id) api.open(`steam-user:${f.id}`);
      },
      chat(f) {
        if (f && f.id) api.open(`steam-chat:${f.id}`);
      },
    };
  }

  window.NostalHubUtil = {
    nowPlaying,
    fmtTime,
    progressHtml,
    nextText,
    musicActions,
    musicRun,
    musicSheet,
    SHUFFLE_LABEL,
    REPEAT_LABEL,
    FRIEND_GROUPS,
    friendGroup,
    friendClass,
    friendStatus,
    friendsMessage,
    friendsGrouped,
    friendsFeed,
    npIcon,
    spotifyView,
    partyView,
    ago,
    hours,
    playLine,
    escapeHtml,
    achievementMessage,
    sortAchievements,
    achievementTexts,
    optionValueText,
    optionNextValue,
  };
})();
