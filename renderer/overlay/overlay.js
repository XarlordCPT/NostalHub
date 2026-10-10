/* Avisos de logros encima del juego, con el estilo de cada consola.
   Recibe { style, name, gamerscore, tier, icon, sound, volume } y dice cuándo terminó. */
(() => {
  const stage = document.getElementById('stage');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const TROPHY = '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8h16v10a8 8 0 0 1-16 0Z"/><path d="M16 11H9v3a6 6 0 0 0 7 6M32 11h7v3a6 6 0 0 1-7 6"/><path d="M24 26v8M17 40h14M19 34h10v6H19z"/></svg>';

  // Sonido: el tuyo (consolas\<consola>\logro.wav) o uno hecho con código, distinto para cada consola
  function play(p) {
    const vol = p.volume == null ? 0.7 : p.volume;
    if (p.muted) return;
    if (p.sound) {
      const a = new Audio(p.sound);
      a.volume = Math.min(1, vol);
      a.play().catch(() => synth(p.style, vol));
      return;
    }
    synth(p.style, vol);
  }
  // [frecuencia, hasta, cuándo, duración, volumen, forma]
  const SYNTH = {
    x360: [[660, 1320, 0, 0.16, 0.35], [1320, 0, 0.11, 0.55, 0.22, 'triangle'], [1980, 0, 0.11, 0.6, 0.1]],
    ps3: [[1318, 0, 0, 0.7, 0.26], [1760, 0, 0.09, 0.9, 0.24], [3520, 0, 0.09, 0.5, 0.05]],
    ps4: [[880, 1175, 0, 0.09, 0.25], [1760, 0, 0.07, 0.8, 0.22], [2637, 0, 0.07, 0.45, 0.06]],
    vita: [[1046, 0, 0, 0.18, 0.22], [1568, 0, 0.08, 0.5, 0.22], [2093, 0, 0.16, 0.6, 0.12]],
    wii: [[784, 0, 0, 0.3, 0.24, 'triangle'], [1046, 0, 0.1, 0.3, 0.24, 'triangle'], [1318, 0, 0.2, 0.6, 0.24, 'triangle']],
    ps2: [[523, 1046, 0, 0.5, 0.18], [1568, 0, 0.25, 1.1, 0.12], [2093, 0, 0.35, 1.2, 0.06]],
    switch: [[1200, 0, 0, 0.05, 0.12, 'square'], [1600, 0, 0.04, 0.35, 0.22]],
    '3ds': [[1568, 0, 0, 0.25, 0.22, 'triangle'], [2093, 0, 0.1, 0.5, 0.2, 'triangle']],
  };
  function synth(style, vol) {
    let ac;
    try {
      ac = new AudioContext();
    } catch {
      return;
    }
    const out = ac.createGain();
    out.gain.value = vol * 0.6;
    out.connect(ac.destination);
    const tone = (f, f2, t, d, g, type = 'sine') => {
      const o = ac.createOscillator();
      const v = ac.createGain();
      const t0 = ac.currentTime + t;
      o.type = type;
      o.frequency.setValueAtTime(f, t0);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d * 0.6);
      v.gain.setValueAtTime(0.0001, t0);
      v.gain.exponentialRampToValueAtTime(g, t0 + 0.01);
      v.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      o.connect(v).connect(out);
      o.start(t0);
      o.stop(t0 + d + 0.05);
    };
    for (const n of SYNTH[style] || SYNTH.x360) tone(...n);
    setTimeout(() => ac.close(), 2000);
  }

  // Copa de trofeo de PlayStation, del color que toca
  const TIERS = { bronze: ['#e9a46c', '#9a5a2c'], silver: ['#f1f4f7', '#9aa3ad'], gold: ['#ffe27a', '#c08a14'], platinum: ['#f2f8ff', '#8fb3d6'] };
  let cupN = 0;
  function cup(tier) {
    const [a, b] = TIERS[tier] || TIERS.bronze;
    const id = `cup${++cupN}`;
    return `<svg class="cup" viewBox="0 0 24 24"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><path fill="url(#${id})" d="M7 3h10v2h3v2.5A4.5 4.5 0 0 1 16.3 12a5 5 0 0 1-3.3 2.4V17h3v2.2H8V17h3v-2.6A5 5 0 0 1 7.7 12 4.5 4.5 0 0 1 4 7.5V5h3Zm-1 4v.5a2.5 2.5 0 0 0 1.4 2.2A6 6 0 0 1 7 8V7Zm12 0h-1v1a6 6 0 0 1-.4 1.7A2.5 2.5 0 0 0 18 7.5Z"/><rect x="7" y="20" width="10" height="1.6" rx=".4" fill="url(#${id})"/></svg>`;
  }

  // Imagen del logro (o una copa si no hay)
  function iconHtml(p) {
    return p.icon ? `<img src="${esc(p.icon)}" alt="" />` : `<span class="noicon">${/^(ps3|ps4|vita)$/.test(p.style) ? cup(p.tier) : TROPHY}</span>`;
  }
  function fixIcons(el) {
    for (const img of el.querySelectorAll('img')) img.onerror = () => (img.outerHTML = `<span class="noicon">${TROPHY}</span>`);
  }
  // Entra, se queda y se va (las animaciones están en overlay.css)
  async function run(el, hold = 4800, outMs = 450) {
    stage.appendChild(el);
    fixIcons(el);
    await wait(30);
    el.classList.add('in');
    await wait(hold);
    el.classList.remove('in');
    el.classList.add('out');
    await wait(outMs);
    el.remove();
  }
  // Aviso de "tarjeta" (imagen + 2 líneas): sirve para casi todas
  function card(p, cls, t1, t2, extra = '') {
    const el = document.createElement('div');
    el.className = `card ${cls}`;
    el.innerHTML = `${extra}<div class="ic">${iconHtml(p)}</div><div class="tx"><div class="t1">${t1}</div><div class="t2">${t2}</div></div>`;
    return el;
  }
  const trophyLine = (p) => `${cup(p.tier)}<span>${esc(p.name)}</span>`;

  // PS3: cuadro negro translúcido arriba a la derecha, aparece y se desvanece
  const ps3 = (p) => (play(p), run(card(p, 'p3n', 'Has obtenido un trofeo.', trophyLine(p))));
  // PS4: barra gris que entra desde la izquierda, arriba a la izquierda
  const ps4 = (p) => (play(p), run(card(p, 'p4n', 'Has conseguido un trofeo.', trophyLine(p))));
  // PS Vita: burbuja brillante arriba a la derecha que "salta"
  const vita = (p) => (play(p), run(card(p, 'vtn', 'Has obtenido un trofeo.', trophyLine(p))));
  // Switch: notificación oscura arriba a la izquierda (como "amigo conectado" o "captura")
  const sw = (p) => (play(p), run(card(p, 'swn', esc(p.name), 'Logro desbloqueado')));
  // Wii: cartel blanco con borde celeste, como un mensaje del Tablón
  const wii = (p) => (play(p), run(card(p, 'wiin', '¡Nuevo logro!', esc(p.name)), 4800, 500));
  // PS2: panel azul oscuro que brilla, con el ícono girando como en la tarjeta de memoria
  const ps2 = (p) => (play(p), run(card(p, 'ps2n', 'Logro obtenido', esc(p.name)), 5000, 600));
  // 3DS: aviso blanco con la luz de notificación parpadeando
  const n3ds = (p) => (play(p), run(card(p, 'n3n', '¡Logro conseguido!', esc(p.name), '<i class="led"></i>')));

  async function xbox360(p) {
    const el = document.createElement('div');
    el.className = 'x3';
    const g = p.gamerscore ? `${esc(p.gamerscore)}G - ` : '';
    el.innerHTML = `<div class="x3-pill"></div><div class="x3-orb"><div class="x3-ring"></div><div class="x3-ball">${p.icon ? `<img src="${esc(p.icon)}" alt="" />` : TROPHY}</div></div>
      <div class="x3-text"><span class="x3-t1">${esc(p.title || 'Logro desbloqueado')}</span><span class="x3-t2">${g}${esc(p.name)}</span></div>`;
    stage.appendChild(el);
    const img = el.querySelector('img');
    if (img) img.onerror = () => (img.outerHTML = TROPHY);
    // ancho de la píldora según el texto
    const txt = el.querySelector('.x3-text');
    const w = Math.min(940, Math.max(380, 140 + txt.scrollWidth + 6));
    el.style.width = `${w}px`;
    el.style.setProperty('--w', `${w}px`);
    await wait(30);
    el.classList.add('in');
    play(p);
    await wait(480);
    el.classList.add('open');
    await wait(4600);
    el.classList.remove('open');
    await wait(480);
    el.classList.remove('in');
    el.classList.add('out');
    await wait(400);
    el.remove();
  }

  const STYLES = { x360: xbox360, ps3, ps4, vita, switch: sw, wii, ps2, '3ds': n3ds };
  window.overlay.onShow(async (p) => {
    try {
      await (STYLES[p.style] || xbox360)(p);
    } catch {}
    window.overlay.done();
  });
})();
