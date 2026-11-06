/* Resumen de horas: una pantalla que no es de ninguna consola. Se abre desde el selector (botón Resumen o tecla R)
   o desde Ajustes → General. Los datos vienen de src/playlog.js (api.getStats). */
(() => {
  const api = window.nostalhub || window.mockNostalHub;
  const stage = document.getElementById('stage');
  if (!api || !stage) return;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const RANGES = [
    ['week', 'Semana'],
    ['month', 'Mes'],
    ['year', 'Año'],
    ['all', 'Todo'],
  ];
  const REFRESH_MS = 30000;
  const PLOT_H = 450;

  const box = document.createElement('section');
  box.id = 'stats';
  box.hidden = true;
  box.innerHTML = `
    <header class="st-head">
      <h1>Resumen</h1>
      <div class="st-tabs">${RANGES.map(([id, label]) => `<button class="st-tab" data-r="${id}">${label}</button>`).join('')}</div>
      <div class="st-period">
        <button class="st-nav" data-d="-1" aria-label="Período anterior">‹</button>
        <span class="st-period-t"></span>
        <button class="st-nav" data-d="1" aria-label="Período siguiente">›</button>
      </div>
      <button class="st-x" aria-label="Cerrar"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M12 12l24 24M36 12 12 36"/></svg></button>
    </header>
    <div class="st-body"></div>
    <footer class="st-foot">
      <span class="st-key">← →</span><span>Semana, mes, año</span>
      <span class="st-key">Q / E</span><span>Período anterior o siguiente</span>
      <span class="st-key">Esc</span><span>Cerrar</span>
    </footer>`;
  stage.appendChild(box);
  const body = box.querySelector('.st-body');

  let open = false;
  let range = 'week';
  let offset = 0;
  let data = null;
  let token = 0;
  let timer = null;

  function dur(sec) {
    if (sec > 0 && sec < 60) return 'Menos de 1 min';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (!h) return `${m} min`;
    return h >= 100 || !m ? `${h.toLocaleString('es-CL')} h` : `${h} h ${m} min`;
  }

  // Marcas del eje: hasta 4 líneas con números redondos
  function axis(maxSec) {
    const min = Math.max(1, maxSec / 60);
    const step = [5, 10, 15, 30, 60, 120, 180, 300, 600, 1200, 3000, 6000, 12000, 30000].find((s) => min / s <= 4) || 60000;
    const top = Math.ceil(min / step) * step;
    const ticks = [];
    for (let v = 0; v <= top; v += step) ticks.push(v);
    return { top: top * 60, ticks };
  }
  const tickText = (min) => (min === 0 ? '0' : min < 60 ? `${min} min` : `${(min / 60).toLocaleString('es-CL')} h`);

  function chartHtml(d) {
    const max = Math.max(...d.buckets.map((b) => b.sec), 0);
    const { top, ticks } = axis(max);
    const peak = max ? d.buckets.findIndex((b) => b.sec === max) : -1;
    const many = d.buckets.length > 12;
    const slot = 960 / d.buckets.length;
    const barW = Math.min(24, Math.max(6, slot - 8));
    return `
      <div class="st-plot" style="height:${PLOT_H}px">
        ${ticks.map((t) => `<div class="st-grid" style="bottom:${(t * 60 * PLOT_H) / top}px"><span>${tickText(t)}</span></div>`).join('')}
        <div class="st-cols">
          ${d.buckets
            .map((b, i) => {
              const h = (b.sec / top) * PLOT_H;
              const label = !many || i === 0 || (i + 1) % 5 === 0;
              return `<div class="st-col${b.now ? ' now' : ''}" data-i="${i}" aria-label="${esc(b.title)}: ${esc(dur(b.sec))}">
                ${b.sec ? `<i class="st-bar" style="height:${Math.max(3, h)}px;width:${barW}px"></i>` : ''}
                ${i === peak ? `<b class="st-peak" style="bottom:${Math.max(3, h) + 8}px">${esc(dur(b.sec))}</b>` : ''}
                ${label ? `<span class="st-xl">${esc(b.label)}</span>` : ''}
              </div>`;
            })
            .join('')}
        </div>
        <div class="st-tip" hidden></div>
      </div>`;
  }

  function rankHtml(d) {
    if (!d.top.length) return '<div class="st-none">No jugaste nada en este período.</div>';
    const best = d.top[0].sec || 1;
    return d.top
      .map(
        (g, i) => `<div class="st-row" data-game-id="${esc(g.id)}">
          <span class="st-n">${i + 1}</span>
          <span class="st-art">${g.art ? `<img src="${esc(g.art)}" alt="" draggable="false" />` : `<b>${esc((g.name || '?').charAt(0).toUpperCase())}</b>`}</span>
          <span class="st-g">
            <span class="st-g-top"><b>${esc(g.name)}</b><em>${esc(dur(g.sec))}</em></span>
            <i class="st-g-bar" style="width:${Math.max(1, (g.sec / best) * 100)}%"></i>
          </span>
        </div>`
      )
      .join('');
  }

  function paint(animate) {
    box.querySelectorAll('.st-tab').forEach((b) => b.classList.toggle('on', b.dataset.r === range));
    const d = data;
    const ok = d && d.ok;
    box.querySelector('.st-period-t').textContent = ok ? d.title : '';
    box.querySelector('.st-nav[data-d="-1"]').disabled = !(ok && d.canPrev);
    box.querySelector('.st-nav[data-d="1"]').disabled = !(ok && d.canNext);
    box.querySelector('.st-period').classList.toggle('off', range === 'all');
    if (!d) return;
    if (!d.ok) {
      body.innerHTML = '<div class="st-empty"><h2>No se pudo abrir el registro de horas</h2><p>Cierra NostalHub y vuelve a abrirla.</p></div>';
      return;
    }
    if (!d.hasAny) {
      body.innerHTML = '<div class="st-empty"><h2>Todavía no hay horas</h2><p>NostalHub cuenta desde ahora. Juega un rato y aquí vas a ver a qué le has dedicado más tiempo.</p></div>';
      return;
    }
    body.innerHTML = `
      <div class="st-left">
        <div class="st-hero"><strong>${esc(dur(d.totalSec))}</strong><span>jugadas ${esc(d.words)}</span></div>
        <div class="st-tiles">
          <div><b>${d.games}</b><span>${d.games === 1 ? 'juego' : 'juegos'}</span></div>
          <div><b>${d.sessions}</b><span>${d.sessions === 1 ? 'sesión' : 'sesiones'}</span></div>
          <div><b>${d.days}</b><span>${d.days === 1 ? 'día jugado' : 'días jugados'}</span></div>
          <div class="wide"><b>${d.longest ? esc(dur(d.longest.sec)) : '—'}</b><span>${d.longest ? `sesión más larga: ${esc(d.longest.name)}` : 'sesión más larga'}</span></div>
        </div>
        <div class="st-chart${animate ? ' grow' : ''}">${chartHtml(d)}</div>
      </div>
      <div class="st-right">
        <h2>Más jugados</h2>
        <div class="st-rank">${rankHtml(d)}</div>
      </div>`;
    body.querySelectorAll('.st-art img').forEach((img) => img.addEventListener('error', () => (img.hidden = true)));
    const tip = body.querySelector('.st-tip');
    body.querySelectorAll('.st-col').forEach((col) => {
      const b = d.buckets[Number(col.dataset.i)];
      col.addEventListener('mouseenter', () => {
        tip.innerHTML = `<b>${esc(dur(b.sec))}</b><span>${esc(b.title)}</span>`;
        tip.hidden = false;
        col.classList.add('hover');
        tip.style.left = `${Math.max(90, Math.min(col.parentElement.offsetLeft + col.offsetLeft + col.offsetWidth / 2, 960))}px`;
      });
      col.addEventListener('mouseleave', () => {
        tip.hidden = true;
        col.classList.remove('hover');
      });
    });
  }

  async function load(animate = true) {
    const t = ++token;
    const res = typeof api.getStats === 'function' ? await api.getStats(range, offset) : { ok: false };
    if (t !== token || !open) return;
    data = res;
    paint(animate);
  }

  function setRange(r) {
    if (r === range) return;
    range = r;
    offset = 0;
    load();
  }
  function step(d) {
    if (!data || !data.ok || !(d < 0 ? data.canPrev : data.canNext)) return;
    offset += d;
    load();
  }

  function show() {
    if (open) return;
    open = true;
    box.hidden = false;
    box.classList.remove('leave');
    offset = 0;
    load();
    timer = setInterval(() => load(false), REFRESH_MS); // las horas suben mientras juegas
  }
  function hide() {
    if (!open) return;
    open = false;
    clearInterval(timer);
    box.classList.add('leave');
    setTimeout(() => {
      if (!open) box.hidden = true;
    }, 200);
  }

  box.querySelector('.st-x').addEventListener('click', hide);
  box.querySelectorAll('.st-tab').forEach((b) => b.addEventListener('click', () => setRange(b.dataset.r)));
  box.querySelectorAll('.st-nav').forEach((b) => b.addEventListener('click', () => step(Number(b.dataset.d))));

  window.addEventListener(
    'keydown',
    (e) => {
      if (!open) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      const k = e.key;
      const at = RANGES.findIndex(([id]) => id === range);
      if (k === 'Escape' || k === 'Backspace') hide();
      else if (k === 'ArrowLeft') setRange(RANGES[(at + RANGES.length - 1) % RANGES.length][0]);
      else if (k === 'ArrowRight') setRange(RANGES[(at + 1) % RANGES.length][0]);
      else if (k === 'q' || k === 'Q' || k === 'PageUp') step(-1);
      else if (k === 'e' || k === 'E' || k === 'PageDown') step(1);
    },
    true
  );

  if (api.onStats) api.onStats(show);
  window.NostalHubStats = { open: show, close: hide };
})();
