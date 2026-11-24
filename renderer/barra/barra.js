// Barra de música encima del juego (la manda src/barra-musica.js por barra-preload.js). Solo dibuja: qué suena, el minuto,
// la canción siguiente, el ecualizador y, con letra, la línea que se canta (la letra la busca con window.barra.getLyrics,
// la misma de la ventana de la letra). Cada consola tiene su aspecto en barra.css (.b-<consola>, como el boceto de
// mockups/barra-musica/). Mientras la mueves: flechas para correrla, Enter la deja ahí, Esc deshace.
(() => {
  const U = window.NostalHubUtil;
  const { escapeHtml: esc, fmtTime, npIcon } = U;
  const wrap = document.getElementById('wrap');
  const bridge = window.barra || { onState() {}, ready() {}, getLyrics: async () => null, nudge() {}, moveEnd() {} };
  let st = null; // lo último que llegó
  let lyr = { key: '', lines: null, msg: '' }; // letra de la canción actual
  let pending = '';

  function view() {
    return U.spotifyView(st && st.sp);
  }
  function pos(v) {
    return Math.min(v.durationMs, v.progressMs + (v.playing ? Date.now() - v.at : 0));
  }

  // ---------- Letra ----------
  async function loadLyrics(v) {
    const key = v.on ? `${v.title}\u0000${v.artist}` : '';
    if (key === lyr.key || key === pending) return;
    lyr = { key: '', lines: null, msg: 'Buscando la letra…' };
    if (!key) return (lyr = { key, lines: null, msg: 'No hay nada sonando' });
    pending = key;
    const r = await bridge.getLyrics({ title: v.title, artist: v.artist, album: v.album, durationMs: v.durationMs }).catch(() => null);
    if (pending !== key) return;
    pending = '';
    const msg = !r || r.status === 'error' ? 'No se pudo cargar la letra' : r.status === 'instrumental' ? 'Canción instrumental' : r.status !== 'ok' ? 'No hay letra para esta canción' : !r.synced ? 'Esta letra no viene sincronizada' : '';
    lyr = { key, lines: r && r.synced ? r.synced : null, msg };
    paintLyrics();
  }
  function lyricsHtml(v) {
    if (!lyr.lines) return `<div class="now msg">${esc(lyr.msg || 'Buscando la letra…')}</div>`;
    if (!v.api || !v.durationMs) return '<div class="now msg">Para seguir la letra hace falta Spotify conectado</div>';
    const i = U.lyricsLine(lyr.lines, pos(v) + 300);
    const now = i >= 0 ? lyr.lines[i].text || '♪' : '♪';
    const next = lyr.lines[i + 1] ? lyr.lines[i + 1].text || '♪' : '';
    return `<div class="now">${esc(now)}</div><div class="sig">${esc(next)}</div>`;
  }
  function paintLyrics() {
    const el = wrap.querySelector('.ly');
    if (!el || !st) return;
    const html = lyricsHtml(view());
    if (el.__html !== html) (el.__html = html), (el.innerHTML = html);
  }

  // ---------- Barra ----------
  function render() {
    if (!st) return;
    const v = view();
    const style = st.style === '3ds' ? 'n3ds' : st.style;
    const cover = v.cover ? `<span class="cov" style="background-image:url('${esc(v.cover)}')"></span>` : `<span class="cov none">${npIcon('music')}</span>`;
    const next = v.next
      ? `<div class="next"><small>Siguiente</small>${v.next.cover ? `<span class="ncov" style="background-image:url('${esc(v.next.cover)}')"></span>` : `<span class="ncov none">${npIcon('music')}</span>`}<b>${esc(v.next.title)}</b><em>${esc(v.next.artist || '')}</em></div>`
      : '';
    const time = v.api && v.durationMs ? `<div class="time"><span class="cur"></span><span class="pg"><i></i></span><span>${fmtTime(v.durationMs)}</span></div>` : ''; // el avance lo pone tick()
    const label = v.on ? (v.playing ? `Sonando en ${v.app}` : 'En pausa') : v.app;
    const chip = st.chip ? `<div class="chip">${npIcon(st.chip.icon)}<span>${esc(st.chip.text)}</span></div>` : '';
    wrap.className = `v-${st.shape.v} h-${st.shape.h}${st.show || st.moving ? ' in' : ''}${st.moving ? ' moving' : ''}`;
    const html = `
      ${st.moving ? '<div class="hint">Arrastra la barra o muévela con las flechas · Enter la deja ahí · Esc cancela</div>' : ''}
      <div class="bar b-${style}${v.playing ? ' playing' : ''}">
        <div class="row">${style === 'n3ds' ? '<span class="led"></span>' : ''}${style === 'x360' ? `<span class="orb">${cover}</span>` : cover}
          <div class="tx">
            <div class="top"><span class="eq"><i></i><i></i><i></i><i></i></span><small>${esc(label)}</small></div>
            <b>${esc(v.title)}</b><em>${esc(v.artist)}</em>
            ${time}
          </div>
          ${next}
        </div>
        ${st.lyrics ? '<div class="ly"></div>' : ''}
      </div>
      ${chip}`;
    // Solo si cambió algo (así no se cortan el ecualizador ni la entrada)
    if (html !== lastHtml) {
      lastHtml = html;
      wrap.innerHTML = html;
    }
    if (st.lyrics) loadLyrics(v);
    tick();
  }
  let lastHtml = '';

  // El minuto, la barrita y la línea de la letra avanzan solos
  function tick() {
    if (!st || !(st.show || st.moving)) return;
    const v = view();
    if (v.api && v.durationMs) {
      const cur = wrap.querySelector('.time .cur');
      const bar = wrap.querySelector('.time .pg i');
      if (cur) cur.textContent = fmtTime(pos(v));
      if (bar) bar.style.width = `${(pos(v) / v.durationMs) * 100}%`;
    }
    if (st.lyrics) paintLyrics();
  }
  setInterval(tick, 250);

  // Mientras la mueves (la ventana tiene el foco solo en ese momento)
  window.addEventListener('keydown', (e) => {
    if (!st || !st.moving) return;
    const d = e.shiftKey ? 4 : 24;
    const k = e.key;
    if (k === 'ArrowLeft') bridge.nudge(-d, 0);
    else if (k === 'ArrowRight') bridge.nudge(d, 0);
    else if (k === 'ArrowUp') bridge.nudge(0, -d);
    else if (k === 'ArrowDown') bridge.nudge(0, d);
    else if (k === 'Enter') bridge.moveEnd(true);
    else if (k === 'Escape') bridge.moveEnd(false);
    else return;
    e.preventDefault();
  });

  bridge.onState((p) => {
    st = p;
    render();
  });
  bridge.ready();
  window.NostalHubBarra = { render: (p) => ((st = p), render()) }; // (para las capturas de prueba)
})();
