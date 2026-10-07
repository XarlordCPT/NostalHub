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
      'no-key': 'Para ver tus logros, agrega tu clave de API de Steam.<br><small>Menú → "Clave de API de Steam (logros)". Los pasos están en MANUAL.md.</small>',
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

  // ---------- Spotify y Grupo de Discord (para la pantalla "Jugando a…" de cada consola) ----------
  function spotifyView(st) {
    st = st || {};
    if (st.supported === false) return { on: false, title: 'Spotify', artist: 'Disponible en Windows', cover: null, playing: false };
    if (!st.running) return { on: false, title: 'Spotify está cerrado', artist: 'Ábrelo para ver tu música', cover: null, playing: false };
    return {
      on: true,
      title: st.title || (st.playing ? 'Reproduciendo' : 'En pausa'),
      artist: st.artist || '',
      cover: st.cover || null,
      playing: !!st.playing,
    };
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
    deaf: '<path d="M8 30v-6a16 16 0 0 1 32 0v6"/><rect x="6" y="28" width="8" height="12" rx="3"/><rect x="34" y="28" width="8" height="12" rx="3"/><path d="M6 6l36 36"/>',
  };
  function npIcon(name) {
    return `<svg class="np-ic" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${NP_ICONS[name] || ''}</svg>`;
  }

  // Paneles de la pantalla "Jugando a…": Spotify a la izquierda y el Grupo de Discord a la derecha.
  // Cada consola les da su propio estilo con CSS (.np-panel, .np-music, .np-party…).
  function nowPlaying(container, api) {
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
      music.innerHTML = `
        <div class="np-head">${npIcon('music')}<span>Spotify</span><em>${v.on ? (v.playing ? 'Sonando' : 'En pausa') : ''}</em></div>
        <div class="np-cover"${v.cover ? ` style="background-image:url('${v.cover}')"` : ''}>${v.cover ? '' : npIcon('music')}</div>
        <div class="np-title">${escapeHtml(v.title)}</div>
        <div class="np-artist">${escapeHtml(v.artist)}</div>
        ${
          v.on
            ? `<div class="np-ctrl">
                <button class="np-btn" data-sp="prev" title="Anterior">${npIcon('prev')}</button>
                <button class="np-btn big" data-sp="toggle" title="Reproducir / pausar">${npIcon(v.playing ? 'pause' : 'play')}</button>
                <button class="np-btn" data-sp="next" title="Siguiente">${npIcon('next')}</button>
              </div>`
            : `<div class="np-ctrl"><button class="np-btn wide" data-sp="open">${npIcon('music')}<span>Abrir Spotify</span></button></div>`
        }`;
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

  window.NostalHubUtil = {
    nowPlaying,
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
