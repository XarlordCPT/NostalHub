/* Tema PS3: el XMB (XrossMediaBar).
   - Fondo con la "ola" y destellos (WebGL). El color cambia con el mes y el brillo con la hora
     (Ajustes → Ajustes de tema → Color para dejar uno fijo).
   - Categorías en fila (Usuarios, Ajustes, Música, Juego, PlayStation Network, Amigos) y las opciones
     de cada una en columna. Al quedarse sobre un juego aparece su fondo (PIC1) y suena su música (SND0).
   - O = menú de opciones (el triángulo), Enter = elegir, Esc = volver.
   - Animación de encendido, "gameboot" al abrir un juego y sonidos hechos con código (si no pones los tuyos).
   Se registra en window.Themes.ps3. */
(() => {
  // ---------- Íconos blancos (relleno con degradado, como los del XMB) ----------
  const D = 'rgba(0,0,0,.28)'; // detalles oscuros
  const S = (d, w = 5) => `<path d="${d}" fill="none" stroke="url(#p3-g)" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const I = {
    user: '<circle cx="32" cy="19" r="12"/><path d="M9 58c0-14 10-22 23-22s23 8 23 22Z"/>',
    settings: `<path d="M23 12h18a5 5 0 0 1 5 5v6h-6v-4H24v4h-6v-6a5 5 0 0 1 5-5Z"/><rect x="5" y="23" width="54" height="32" rx="5"/><rect x="5" y="35" width="54" height="3" fill="${D}"/><rect x="26" y="31" width="12" height="11" rx="2" fill="${D}"/>`,
    music: `${S('M25 47V15l28-7v32', 5)}<ellipse cx="17" cy="48" rx="9.5" ry="7.5"/><ellipse cx="45" cy="41" rx="9.5" ry="7.5"/>`,
    game: `<path d="M16 19h32c7 0 11 5 12 12l2 13c1 7-6 11-11 6l-7-7H20l-7 7c-5 5-12 1-11-6l2-13c1-7 5-12 12-12Z"/><path d="M17 27v11M11.5 32.5h11" stroke="${D}" stroke-width="4" stroke-linecap="round"/><circle cx="45" cy="27" r="2.8" fill="${D}"/><circle cx="51" cy="33" r="2.8" fill="${D}"/><circle cx="39" cy="33" r="2.8" fill="${D}"/><circle cx="45" cy="39" r="2.8" fill="${D}"/>`,
    psn: `<circle cx="32" cy="32" r="25"/><path d="M7 32h50M32 7c-10 8-10 42 0 50M32 7c10 8 10 42 0 50M12 19h40M12 45h40" stroke="${D}" stroke-width="2.6" fill="none"/>`,
    friends: `<circle cx="22" cy="28" r="16"/><circle cx="45" cy="36" r="14"/><circle cx="16" cy="25" r="2.4" fill="${D}"/><circle cx="27" cy="25" r="2.4" fill="${D}"/><path d="M14 32c4 5 12 5 16 0" stroke="${D}" stroke-width="2.8" fill="none" stroke-linecap="round"/><circle cx="40" cy="33" r="2.2" fill="${D}"/><circle cx="50" cy="33" r="2.2" fill="${D}"/><path d="M38 40c4 4 10 4 14 0" stroke="${D}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
    power: `${S('M20 15a21 21 0 1 0 24 0', 6)}<rect x="29" y="5" width="6" height="27" rx="3"/>`,
    swap: `${S('M9 22h40l-9-9M55 42H15l9 9', 6)}`,
    trophy: `<path d="M19 7h26v15a13 13 0 0 1-26 0Z"/>${S('M19 12h-8v4a9 9 0 0 0 10 9M45 12h8v4a9 9 0 0 1-10 9', 4)}<rect x="29" y="34" width="6" height="10"/><rect x="19" y="44" width="26" height="11" rx="2"/>`,
    palette: '<path d="M32 6C17 6 6 17 6 31s11 27 26 27c4 0 6-3 5-6s0-7 4-7h7c6 0 10-4 10-10C58 19 47 6 32 6Z"/><circle cx="19" cy="27" r="4.5" fill="#e85a5a"/><circle cx="29" cy="17" r="4.5" fill="#f2c94c"/><circle cx="42" cy="18" r="4.5" fill="#5ab0e8"/><circle cx="18" cy="40" r="4.5" fill="#6fcf62"/>',
    gear: `${[0, 45, 90, 135].map((a) => `<rect x="28" y="5" width="8" height="54" rx="2" transform="rotate(${a} 32 32)"/>`).join('')}<circle cx="32" cy="32" r="19"/><circle cx="32" cy="32" r="7" fill="${D}"/>`,
    pad: `<path d="M16 19h32c7 0 11 5 12 12l2 13c1 7-6 11-11 6l-7-7H20l-7 7c-5 5-12 1-11-6l2-13c1-7 5-12 12-12Z"/><path d="M17 27v11M11.5 32.5h11" stroke="${D}" stroke-width="4" stroke-linecap="round"/><circle cx="46" cy="30" r="3" fill="${D}"/><circle cx="40" cy="36" r="3" fill="${D}"/>`,
    screen: `<rect x="4" y="9" width="56" height="37" rx="3"/><rect x="9" y="14" width="46" height="27" fill="${D}"/><rect x="25" y="46" width="14" height="5"/><rect x="16" y="51" width="32" height="5" rx="2"/>`,
    speaker: `<path d="M7 24h11l14-12v40L18 40H7Z"/>${S('M40 22a14 14 0 0 1 0 20M47 15a24 24 0 0 1 0 34', 4.5)}`,
    key: `<circle cx="19" cy="32" r="13"/><circle cx="19" cy="32" r="5" fill="${D}"/><rect x="29" y="28" width="30" height="8" rx="2"/><rect x="49" y="34" width="6" height="11"/><rect x="40" y="34" width="5" height="8"/>`,
    folder: '<path d="M5 13h20l5 6h29v35H5Z"/><rect x="5" y="25" width="54" height="29" fill="rgba(255,255,255,.4)"/>',
    store: `<path d="M11 22h42l-4 35H15Z"/>${S('M23 22v-4a9 9 0 0 1 18 0v4', 5)}`,
    news: `<rect x="8" y="7" width="48" height="50" rx="6"/><path d="M17 19h30M17 29h30M17 39h30M17 48h18" stroke="${D}" stroke-width="4" stroke-linecap="round"/>`,
    people: '<circle cx="23" cy="18" r="10"/><path d="M5 56c0-13 8-21 18-21s18 8 18 21Z"/><circle cx="44" cy="22" r="8.5" opacity=".8"/><path d="M38 37c10-2 21 4 21 19H44" opacity=".8"/>',
    headset: `${S('M11 37v-6a21 21 0 0 1 42 0v6', 5.5)}<rect x="6" y="34" width="13" height="19" rx="4"/><rect x="45" y="34" width="13" height="19" rx="4"/>`,
    note: `<circle cx="32" cy="32" r="27"/><path d="M27 42V20l16-4v19" stroke="${D}" stroke-width="3.5" fill="none" stroke-linecap="round"/><ellipse cx="23" cy="42" rx="5.5" ry="4.5" fill="${D}"/><ellipse cx="39" cy="36" rx="5.5" ry="4.5" fill="${D}"/>`,
    play: '<path d="M18 9l38 23-38 23Z"/>',
    pause: '<rect x="14" y="10" width="13" height="44" rx="2"/><rect x="37" y="10" width="13" height="44" rx="2"/>',
    prev: '<rect x="10" y="12" width="7" height="40" rx="2"/><path d="M56 12 20 32l36 20Z"/>',
    next: '<rect x="47" y="12" width="7" height="40" rx="2"/><path d="M8 12l36 20L8 52Z"/>',
    open: `<rect x="7" y="15" width="40" height="42" rx="5"/>${S('M33 9h22v22M55 9 30 34', 5)}`,
    info: `<circle cx="32" cy="32" r="26"/><circle cx="32" cy="19" r="4" fill="${D}"/><rect x="28" y="27" width="8" height="21" rx="3" fill="${D}"/>`,
    image: `<rect x="5" y="10" width="54" height="44" rx="5"/><circle cx="20" cy="24" r="6" fill="${D}"/><path d="M5 48l16-14 12 10 9-7 17 14v3H5Z" fill="${D}"/>`,
    sort: `<rect x="8" y="12" width="48" height="7" rx="3"/><rect x="8" y="28" width="36" height="7" rx="3"/><rect x="8" y="44" width="22" height="7" rx="3"/>`,
    sun: `<circle cx="32" cy="32" r="12"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="30" y="4" width="4" height="10" rx="2" transform="rotate(${a} 32 32)"/>`).join('')}`,
    mic: `<rect x="23" y="6" width="18" height="32" rx="9"/>${S('M14 30a18 18 0 0 0 36 0M32 48v9', 4.5)}`,
  };
  const ic = (n) => `<svg class="p3-svg" viewBox="0 0 64 64" aria-hidden="true" fill="url(#p3-g)">${I[n] || I.info}</svg>`;

  // ---------- Colores del fondo (uno por mes, como la PS3) ----------
  const COLORS = [
    { label: 'Plata', c: [0.6, 0.61, 0.64] },
    { label: 'Dorado', c: [0.76, 0.6, 0.12] },
    { label: 'Lima', c: [0.43, 0.66, 0.1] },
    { label: 'Rosado', c: [0.84, 0.42, 0.58] },
    { label: 'Verde', c: [0.14, 0.54, 0.2] },
    { label: 'Morado', c: [0.5, 0.33, 0.73] },
    { label: 'Turquesa', c: [0.07, 0.6, 0.6] },
    { label: 'Azul', c: [0.1, 0.4, 0.78] },
    { label: 'Violeta', c: [0.56, 0.2, 0.68] },
    { label: 'Naranjo', c: [0.82, 0.48, 0.07] },
    { label: 'Café', c: [0.5, 0.32, 0.15] },
    { label: 'Rojo', c: [0.74, 0.15, 0.13] },
    { label: 'Negro', c: [0.15, 0.15, 0.16] },
  ];
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  // ---------- Medidas del XMB (escenario de 1920×1080) ----------
  const CAT_X = 470; // centro de la categoría elegida
  const CAT_Y = 282; // centro de la fila de categorías
  const CAT_GAP = 196;
  const SEL_TOP = 396; // arriba del ícono elegido
  const SMALL = 0.66; // tamaño de los que no están elegidos
  const GAME = { w: 320, h: 176 }; // ICON0
  const NORMAL = { w: 112, h: 112 };
  const U = window.NostalHubUtil;
  const esc = U.escapeHtml;
  const { wait, pad2 } = U;
  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem('nostalhub.ps3.' + k);
        return v == null ? d : v;
      } catch {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem('nostalhub.ps3.' + k, String(v));
      } catch {}
    },
  };

  const MARKUP = `
<svg class="p3-defs" width="0" height="0" aria-hidden="true"><defs>
  <linearGradient id="p3-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.55" stop-color="#eef0f3"/><stop offset="1" stop-color="#bfc5ce"/></linearGradient>
</defs></svg>
<div class="p3-wall"></div>
<canvas class="p3-wave" width="960" height="540"></canvas>
<div class="p3-pic1"></div>
<div class="p3-ui">
  <div class="p3-clock"></div>
  <div class="p3-xmb">
    <div class="p3-cats"></div>
    <div class="p3-items"></div>
  </div>
  <div class="p3-sub" hidden><div class="p3-sub-head"></div><div class="p3-sub-view"><div class="p3-sub-band"></div><div class="p3-sub-list"></div></div></div>
  <div class="p3-hints"></div>
</div>
<div class="p3-opts" hidden><div class="p3-opts-list"></div></div>
<div class="p3-info" hidden></div>
<div class="p3-dlg" hidden><div class="p3-dlg-box"><div class="p3-dlg-msg"></div><div class="p3-dlg-btns"></div></div></div>
<div class="p3-gb"></div>
<section class="p3-playing" hidden>
  <div class="p3-play-card">
    <div class="p3-play-icon"></div>
    <div class="p3-play-label">Jugando a</div>
    <div class="p3-play-name"></div>
    <div class="p3-play-time">0:00</div>
    ${window.NostalHubUtil.clockHtml()}
    <button class="p3-play-btn" data-p="stop">Volver al menú</button>
  </div>
</section>`;

  window.Themes = window.Themes || {};
  window.Themes.ps3 = { mount, synth };

  // =====================================================================
  // Sonidos hechos con código (se usan solo si no pusiste mover.wav, inicio.wav, gameboot.wav…)
  // =====================================================================
  let ac = null;
  let reverb = null;
  function audio() {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        return null;
      }
      // Reverberación: ruido que se apaga de a poco
      const len = ac.sampleRate * 2.6;
      const buf = ac.createBuffer(2, len, ac.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
      }
      reverb = ac.createConvolver();
      reverb.buffer = buf;
      const wet = ac.createGain();
      wet.gain.value = 0.55;
      reverb.connect(wet).connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(a, out, { type = 'sine', f, f2, t = 0, a1 = 0.005, d = 0.1, g = 0.3, detune = 0 }) {
    const o = a.createOscillator();
    const v = a.createGain();
    const t0 = a.currentTime + t;
    o.type = type;
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + a1 + d);
    o.detune.value = detune;
    v.gain.setValueAtTime(0.0001, t0);
    v.gain.exponentialRampToValueAtTime(g, t0 + a1);
    v.gain.exponentialRampToValueAtTime(0.0001, t0 + a1 + d);
    o.connect(v).connect(out);
    o.start(t0);
    o.stop(t0 + a1 + d + 0.05);
  }
  function noise(a, out, { t = 0, a1 = 0.01, d = 0.2, g = 0.2, f = 2000, f2, q = 1, type = 'bandpass' }) {
    const len = Math.ceil(a.sampleRate * (a1 + d + 0.05));
    const buf = a.createBuffer(1, len, a.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource();
    src.buffer = buf;
    const fl = a.createBiquadFilter();
    fl.type = type;
    fl.Q.value = q;
    const t0 = a.currentTime + t;
    fl.frequency.setValueAtTime(f, t0);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + a1 + d);
    const v = a.createGain();
    v.gain.setValueAtTime(0.0001, t0);
    v.gain.exponentialRampToValueAtTime(g, t0 + a1);
    v.gain.exponentialRampToValueAtTime(0.0001, t0 + a1 + d);
    src.connect(fl).connect(v).connect(out);
    src.start(t0);
  }
  function synth(kind, vol = 0.6) {
    const a = audio();
    if (!a) return;
    const out = a.createGain();
    out.gain.value = vol;
    out.connect(a.destination);
    const wet = a.createGain();
    wet.gain.value = vol;
    wet.connect(reverb);
    if (kind === 'move' || kind === 'page') {
      // el "tic" del XMB: corto, agudo y suave
      tone(a, out, { f: 2350, d: 0.035, g: 0.09 });
      noise(a, out, { f: 5200, q: 2, d: 0.012, g: 0.05 });
    } else if (kind === 'select') {
      tone(a, out, { f: 1320, d: 0.07, g: 0.11 });
      tone(a, out, { f: 1980, t: 0.04, d: 0.12, g: 0.08 });
      tone(a, wet, { f: 1980, t: 0.04, d: 0.12, g: 0.04 });
    } else if (kind === 'option') {
      tone(a, out, { f: 1660, d: 0.05, g: 0.1 });
    } else if (kind === 'error') {
      tone(a, out, { type: 'square', f: 180, d: 0.22, g: 0.05 });
      tone(a, out, { type: 'square', f: 150, t: 0.12, d: 0.25, g: 0.05 });
    } else if (kind === 'back') {
      tone(a, out, { f: 1100, f2: 760, d: 0.09, g: 0.1 });
    } else if (kind === 'start') {
      // encendido: un acorde que crece con un barrido de filtro y brillitos arriba
      const pad = a.createBiquadFilter();
      pad.type = 'lowpass';
      pad.Q.value = 0.7;
      const t0 = a.currentTime;
      pad.frequency.setValueAtTime(260, t0);
      pad.frequency.exponentialRampToValueAtTime(2600, t0 + 2.4);
      pad.frequency.exponentialRampToValueAtTime(900, t0 + 5);
      const padOut = a.createGain();
      padOut.gain.value = 0.55;
      pad.connect(padOut);
      padOut.connect(out);
      padOut.connect(wet);
      [130.8, 196, 261.6, 329.6, 392, 493.9, 587.3].forEach((f, i) => {
        tone(a, pad, { type: 'sawtooth', f, a1: 1.6 + i * 0.05, d: 3.2, g: 0.035, detune: -7 });
        tone(a, pad, { type: 'sawtooth', f, a1: 1.6 + i * 0.05, d: 3.2, g: 0.035, detune: 7 });
      });
      [1046.5, 1318.5, 1568, 2093, 2637].forEach((f, i) => tone(a, wet, { f, t: 1.1 + i * 0.22, a1: 0.01, d: 1.6, g: 0.05 }));
      tone(a, out, { f: 65.4, a1: 1.2, d: 3, g: 0.12 });
    } else if (kind === 'gameboot') {
      // abrir juego: un "whoosh" que sube, un golpe grave y un brillo
      noise(a, out, { f: 180, f2: 5200, a1: 1.0, d: 0.45, g: 0.16, q: 0.9 });
      noise(a, wet, { f: 180, f2: 5200, a1: 1.0, d: 0.45, g: 0.1, q: 0.9 });
      tone(a, out, { f: 110, f2: 34, t: 0.95, a1: 0.01, d: 1.1, g: 0.35 });
      [523.3, 784, 1046.5, 1568, 2093].forEach((f, i) => tone(a, wet, { f, t: 0.98 + i * 0.03, a1: 0.01, d: 1.8, g: 0.06 }));
      [523.3, 784, 1046.5].forEach((f) => tone(a, out, { f, t: 0.98, a1: 0.01, d: 0.9, g: 0.04 }));
    }
  }

  // =====================================================================
  // La ola (WebGL)
  // =====================================================================
  const VERT = 'attribute vec2 p;varying vec2 v;void main(){v=p*0.5+0.5;gl_Position=vec4(p,0.0,1.0);}';
  const FRAG = `
precision mediump float;
varying vec2 v;
uniform vec2 uRes; uniform float uT; uniform vec3 uC; uniform float uB; uniform float uBoot; uniform float uSpark; uniform float uBoom; uniform float uImg;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wave(float x, float t, float ph, float amp, float base){
  return base + amp * sin(x * 2.1 + t * 0.32 + ph) + amp * 0.55 * sin(x * 3.9 - t * 0.21 + ph * 1.7) + amp * 0.22 * sin(x * 7.1 + t * 0.47 + ph * 0.5);
}
void main(){
  vec2 uv = vec2(v.x, 1.0 - v.y);
  float asp = uRes.x / uRes.y;
  float x = uv.x * asp;
  float px = 1.0 / uRes.y;
  // fondo: más claro arriba, más oscuro abajo y en las esquinas
  vec3 c = uC;
  float g = mix(1.16, 0.5, smoothstep(0.0, 1.0, uv.y));
  float vig = 1.0 - 0.32 * length((uv - vec2(0.42, 0.32)) * vec2(0.85, 1.25));
  vec3 col = c * g * vig;
  col += c * 0.12 * (1.0 - smoothstep(0.0, 0.5, abs(uv.y - 0.3 - 0.06 * sin(uv.x * 3.0 + uT * 0.05))));
  float t = uT;
  float amp = 1.0 + uBoom * 0.8;
  // cintas transparentes (más brillantes en los bordes) con una línea fina en cada borde
  float fill = 0.0;
  float lines = 0.0;
  for (int i = 0; i < 2; i++) {
    float fi = float(i);
    float a = wave(x, t, fi * 2.3, (0.032 + fi * 0.014) * amp, 0.585 + fi * 0.02);
    float b = wave(x, t * 1.08, fi * 2.3 + 1.4, 0.05 * amp, 0.655 + fi * 0.015);
    float top = min(a, b);
    float bot = max(a, b);
    float th = max(bot - top, 0.002);
    float inside = step(top, uv.y) * step(uv.y, bot);
    float e = clamp(min(uv.y - top, bot - uv.y) / th, 0.0, 0.5);
    fill += inside * (0.05 + 0.24 * pow(1.0 - 2.0 * e, 4.0));
    lines += exp(-abs(uv.y - a) / (px * 1.1)) * 0.6 + exp(-abs(uv.y - b) / (px * 1.1)) * 0.45;
    lines += exp(-abs(uv.y - a) / (px * 9.0)) * 0.08;
  }
  for (int j = 0; j < 6; j++) {
    float fj = float(j);
    float yj = wave(x, t * 0.92, 4.0 + fj * 0.55, 0.042 * amp, 0.6 + fj * 0.011);
    lines += exp(-abs(uv.y - yj) / (px * 0.9)) * 0.1;
  }
  vec3 wc = mix(c, vec3(1.0), 0.8);
  vec3 add = wc * (fill * 0.6 + lines * 0.55) * uBoot; // la ola (con fondo propio se dibuja solo esto, encima de la imagen)
  // destellos que flotan cerca de la ola
  float sp = 0.0;
  for (int k = 0; k < 2; k++) {
    float fk = float(k);
    float sc = 26.0 + fk * 14.0;
    vec2 q = vec2(x + t * (0.012 + fk * 0.008), uv.y + fk * 0.37) * sc;
    vec2 cell = floor(q);
    vec2 f = fract(q) - 0.5;
    float r = h(cell + fk * 7.0);
    vec2 o = vec2(h(cell + 1.3), h(cell + 2.7)) - 0.5;
    float d = length(f - o * 0.7);
    float tw = pow(0.5 + 0.5 * sin(t * (0.8 + r * 2.2) + r * 6.28), 8.0);
    float on = step(0.72 - uSpark * 0.3, r);
    sp += on * tw * smoothstep(0.11, 0.0, d) * (0.6 + uSpark);
  }
  float band = exp(-pow((uv.y - 0.62) / (0.16 + uSpark * 0.25), 2.0));
  add += wc * sp * band * 0.9 * max(uBoot, uSpark);
  add += wc * uBoom * 0.35 * exp(-pow((uv.y - 0.62) / 0.12, 2.0));
  col = (col * (1.0 - uImg) + add) * uB;
  float a = mix(1.0, clamp(max(max(add.r, add.g), add.b), 0.0, 1.0), uImg);
  gl_FragColor = vec4(min(col, vec3(a)), a);
}`;
  function makeWave(canvas) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'low-power' });
    if (!gl) return null;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = {};
    ['uRes', 'uT', 'uC', 'uB', 'uBoot', 'uSpark', 'uBoom', 'uImg'].forEach((n) => (u[n] = gl.getUniformLocation(pr, n)));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u.uRes, canvas.width, canvas.height);
    return {
      draw(s) {
        gl.uniform1f(u.uT, s.t % 2000);
        gl.uniform3f(u.uC, s.c[0], s.c[1], s.c[2]);
        gl.uniform1f(u.uB, s.bright);
        gl.uniform1f(u.uBoot, s.boot);
        gl.uniform1f(u.uSpark, s.spark);
        gl.uniform1f(u.uBoom, s.boom);
        gl.uniform1f(u.uImg, s.img || 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
    };
  }

  // =====================================================================
  // El tema va separado por partes (una función cada una, más abajo). Todas reciben `ps` (la consola), que tiene lo
  // que es de todas (en qué modo se está, los juegos, el perfil, el resumen de logros, la música, Discord, las
  // opciones) y las otras partes (ps.fondo, ps.menu, ps.detalle, ps.sub, ps.opciones, ps.jugando…). Lo que es de una
  // sola parte queda dentro de su función.
  function mount(root, ctx) {
    root.innerHTML = MARKUP;
    const api = ctx.api;
    const $ = (sel, el = root) => el.querySelector(sel);
    const $$ = (sel, el = root) => [...el.querySelectorAll(sel)];
    const call = (fn, ...a) => (typeof api[fn] === 'function' ? api[fn](...a) : Promise.resolve(null));
    const ps = {
      root,
      ctx,
      api,
      $,
      $$,
      call,
      ss: () => (ctx.soundSettings ? ctx.soundSettings() : { music: true, musicVolume: 0.35, intros: true }),
      feed: U.friendsFeed(api), // amigos de Steam (categoría Amigos)
      wall: null, // fondo propio (lo pone fondo())
      mode: 'boot', // boot | xmb | sub | opts | info | dlg | gameboot | playing
      games: [],
      profile: { name: 'Jugador', avatar: null },
      summary: { perGame: {}, hasKey: false },
      spotify: null,
      discord: { status: 'off', channel: null, members: [] },
      menuModel: [],
    };
    const offs = [];
    ps.jugando = pantallaJugando(ps);
    ps.fondo = fondo(ps);
    ps.menu = menuXmb(ps);
    ps.detalle = fondoDelJuego(ps);
    ps.sub = listas(ps);
    ps.grupo = grupo(ps);
    ps.musica = musica(ps);
    ps.ajustes = ajustes(ps);
    ps.trofeos = trofeos(ps);
    ps.opciones = menuDeOpciones(ps);
    ps.info = infoDelJuego(ps);
    ps.pregunta = pregunta(ps);
    ps.encendido = encendido(ps);

    // ---------- Pistas de teclas (discretas, abajo a la derecha) ----------
    ps.paintHints = () => {
      const h = (k, t) => `<span><kbd>${k}</kbd>${t}</span>`;
      let html = '';
      if (ps.mode === 'xmb') {
        const it = ps.menu.curItem();
        html = it && it.game ? h('O', 'Opciones · Ordenar') + h('Enter', 'Iniciar') : it && it.friend ? h('O', 'Opciones') + h('Enter', 'Ver perfil') : it && it.run ? h('Enter', 'Elegir') : '';
      } else if (ps.mode === 'sub') html = h('Esc', 'Volver') + (ps.sub.cur() && ps.sub.cur().rows.some((r) => r.run) ? h('Enter', 'Elegir') : '');
      else if (ps.mode === 'opts') html = h('O', 'Cerrar') + h('Enter', 'Elegir');
      $('.p3-hints').innerHTML = html;
    };

    // =====================================================================
    // Teclado, mouse y rueda
    // =====================================================================
    function onKey(e) {
      const k = e.key;
      if (k === 'Enter' || k === ' ' || k.startsWith('Arrow')) e.preventDefault();
      if (ps.mode === 'boot') return ps.encendido.finish(true);
      if (ps.mode === 'gameboot') return;
      if (ps.mode === 'playing') return ps.jugando.key(k);
      if (ps.mode === 'dlg') return ps.pregunta.key(k);
      if (ps.mode === 'info') {
        if (k === 'Escape' || k === 'Backspace' || k === 'Enter') ps.info.close();
        return;
      }
      if (ps.mode === 'opts') return ps.opciones.key(k);
      if (ps.mode === 'sub') return ps.sub.key(k);
      if (ps.mode !== 'xmb') return;
      ps.menu.key(k);
    }
    window.addEventListener('keydown', onKey);

    let wheelLock = 0;
    function onWheel(e) {
      if (Date.now() < wheelLock || Math.abs(e.deltaY) + Math.abs(e.deltaX) < 8) return;
      if (ps.mode === 'boot') return;
      const horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
      const d = (horiz ? e.deltaX || e.deltaY : e.deltaY) > 0 ? 1 : -1;
      if (ps.mode === 'xmb') ps.menu.wheel(horiz, d);
      else if (ps.mode === 'sub' && !horiz) ps.sub.wheel(d);
      else if (ps.mode === 'opts' && !horiz) ps.opciones.wheel(d);
      else return;
      ctx.sound('move');
      wheelLock = Date.now() + 110;
    }
    root.addEventListener('wheel', onWheel, { passive: true });
    root.addEventListener('pointerdown', (e) => {
      if (ps.mode === 'boot') ps.encendido.finish(true);
      else if (ps.mode === 'sub' && e.button === 0 && !e.target.closest('.p3-sub-view, .ge-wrap, .ge-ctx')) {
        if (e.target.closest('.p3-xmb')) ps.sub.close(); // clic en el ícono de la izquierda = volver
      }
    });

    // =====================================================================
    // Datos
    // =====================================================================
    ps.feed.onChange(() => (ps.mode === 'xmb' || ps.mode === 'opts') && ps.menu.refreshCat('friends'));
    ps.setDiscord = setDiscord;
    function setDiscord(s) {
      ps.discord = s || ps.discord;
      if (ps.mode === 'xmb' || ps.mode === 'opts') ps.menu.refreshCat('friends');
      else if (ps.mode === 'sub' && ps.sub.cur() && ps.sub.cur().party) ps.sub.paint();
    }
    function setSpotify(s) {
      ps.spotify = s || ps.spotify;
      if (ps.mode === 'xmb') ps.menu.refreshCat('music');
      else if (ps.mode === 'sub' && ps.sub.cur() && ps.sub.cur().music) ps.sub.paint();
    }
    async function loadProfile() {
      ps.profile = (await call('getSteamProfile')) || ps.profile;
      if (ps.mode === 'xmb') ps.menu.refreshCat('users');
    }
    async function loadSummary(s) {
      ps.summary = s || (await call('getAchievementSummary')) || ps.summary;
      if (ps.mode === 'xmb') ps.menu.refreshCat('game');
    }
    function setGames(list) {
      ps.games = list || [];
      if (ps.wall.value.startsWith('game:')) ps.fondo.applyWall(); // el arte del juego elegido como fondo
      if (ps.mode === 'sub') {
        if (ps.sub.cur() && ps.sub.cur().build) ps.sub.paint();
        return;
      }
      if (ps.mode === 'playing' || ps.mode === 'gameboot') return;
      ps.menu.refreshCat('game');
    }
    offs.push(api.onGamesUpdated(setGames));
    offs.push(api.onGameEnded(({ reason }) => ps.jugando.end(reason)));
    if (api.onSpotify) offs.push(api.onSpotify(setSpotify));
    if (api.onDiscord) offs.push(api.onDiscord(setDiscord));
    if (api.onSteamSummary) offs.push(api.onSteamSummary((s) => loadSummary(s)));
    if (api.onSteamChanged)
      offs.push(
        api.onSteamChanged(() => {
          loadProfile();
          loadSummary();
        })
      );
    call('spotifyWatch', true).then((s) => s && setSpotify(s));
    call('discordWatch', true).then((s) => s && setDiscord(s));
    call('getMenu').then((m) => {
      ps.menuModel = m || [];
      if (ps.mode === 'xmb') ps.menu.refreshCat('settings');
    });
    loadProfile();
    loadSummary();

    ps.menu.paintCats(false);
    ps.menu.renderItems(0);
    ps.encendido.boot();
    api.getState().then((st) => {
      ps.games = st.games || [];
      ps.menu.firstEntry();
    });

    return {
      unmount() {
        ps.fondo.dispose();
        ps.feed.dispose();
        ps.jugando.dispose();
        ps.detalle.dispose();
        ps.encendido.dispose();
        window.removeEventListener('keydown', onKey);
        offs.forEach((off) => off && off());
        call('spotifyWatch', false);
        call('discordWatch', false);
        document.body.classList.remove('playing');
        root.classList.remove('deep', 'booting', 'gameboot', 'is-playing', 'no-gl');
        root.style.removeProperty('--p3-c');
        root.innerHTML = '';
      },
    };
  }

  // Logros de un juego según el resumen ({ done, total }), o nada
  function trophiesOf(ps, g) {
    return (g && g.appId && ps.summary.perGame && ps.summary.perGame[g.appId]) || null;
  }
  // Icono del juego: 1) tu icono PS3  2) la cabecera horizontal de Steam  3) (en la lista) el fondo con el logo encima
  // 4) la imagen del canal. Si una imagen resulta vertical, se muestra entera (sin estirarse ni salirse del cuadro).
  function icon0(g) {
    return g.icon0 || g.header || (g.tileIsVideo ? null : g.tile) || null;
  }
  // Imágenes que fallan se quitan (queda el ícono o el nombre); las verticales se muestran enteras
  function watchImages(box) {
    [...box.querySelectorAll('img')].forEach((im) => {
      im.addEventListener('error', () => im.remove());
      if (!im.classList.contains('p3-chk')) return;
      const check = () => im.naturalWidth && im.naturalWidth < im.naturalHeight * 1.4 && im.classList.add('fit');
      if (im.complete) check();
      else im.addEventListener('load', check);
    });
  }

  // ---------- Fondo: color, brillo según la hora, fondo propio, la ola, la hora y sus ajustes (Ajustes de tema) ----------
  function fondo(ps) {
    const { $, api, ctx, root } = ps;
    // ---------- Fondo: color (mes u elegido) y brillo según la hora ----------
    let colorPick = store.get('color', 'auto'); // 'auto' o el número del color
    let daylight = store.get('daylight', '1') !== '0';
    const W = { t: Math.random() * 100, c: [0.5, 0.5, 0.5], bright: 1, boot: 0, spark: 0, boom: 0 };
    function baseColor() {
      if (colorPick !== 'auto' && COLORS[Number(colorPick)]) return COLORS[Number(colorPick)].c;
      // como la PS3: cambia de a poco hacia el color del mes siguiente en los últimos días
      const d = new Date();
      const m = d.getMonth();
      const days = new Date(d.getFullYear(), m + 1, 0).getDate();
      const k = Math.max(0, (d.getDate() - (days - 4)) / 5);
      const a = COLORS[m].c;
      const b = COLORS[(m + 1) % 12].c;
      return a.map((x, i) => x + (b[i] - x) * k);
    }
    function brightness() {
      if (!daylight) return 1;
      const d = new Date();
      const h = d.getHours() + d.getMinutes() / 60;
      return 0.64 + 0.36 * Math.max(0, Math.cos(((h - 13.5) / 12) * Math.PI));
    }
    function refreshColor() {
      W.c = baseColor();
      W.bright = brightness();
      const [r, g, b] = W.c.map((x) => Math.round(Math.min(1, x * W.bright) * 255));
      root.style.setProperty('--p3-c', `rgb(${r},${g},${b})`);
    }
    refreshColor();
    const colorTimer = setInterval(refreshColor, 60000);

    // ---------- Fondo propio (Ajustes de tema → Fondo): una imagen o el arte de un juego, con o sin la ola ----------
    ps.wall = U.wallpaper(api, 'ps3');
    let waveOver = store.get('waveOver', '1') !== '0';
    function applyWall(v = ps.wall.value) {
      const url = ps.wall.url(ps.games, v);
      $('.p3-wall').style.backgroundImage = url ? `url("${url}")` : '';
      root.classList.toggle('has-wall', !!url);
      root.classList.toggle('no-wave', !!url && !waveOver);
      W.img = url ? 1 : 0;
    }
    ps.wall.load().then(() => applyWall());

    const canvas = $('.p3-wave');
    let wave = null;
    try {
      wave = makeWave(canvas);
    } catch (e) {
      console.warn('[ps3] ola sin WebGL:', e);
    }
    if (!wave) root.classList.add('no-gl');
    let raf = 0;
    let last = performance.now();
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (ps.mode === 'playing' || document.hidden) return; // jugando: la ola se queda quieta (no gasta la tarjeta de video)
      W.t += dt;
      if (wave) wave.draw(W);
    }
    raf = requestAnimationFrame(frame);
    function tweenW(key, to, ms, ease = (k) => 1 - Math.pow(1 - k, 3)) {
      const from = W[key];
      const t0 = performance.now();
      return new Promise((res) => {
        const step = () => {
          const k = Math.min(1, (performance.now() - t0) / ms);
          W[key] = from + (to - from) * ease(k);
          if (k < 1) requestAnimationFrame(step);
          else res();
        };
        step();
      });
    }

    // ---------- Hora (arriba a la derecha) ----------
    function tickClock() {
      const d = new Date();
      $('.p3-clock').textContent = `${d.getDate()}/${d.getMonth() + 1}  ${d.getHours()}:${pad2(d.getMinutes())}`;
    }
    tickClock();
    const clockTimer = setInterval(tickClock, 10000);
    function themeLevel() {
      return {
        title: 'Ajustes de tema',
        build: () => [
          {
            icon: 'palette',
            title: 'Color',
            desc: 'El color del fondo. "Original" cambia cada mes, como la PS3.',
            value: colorPick === 'auto' ? 'Original' : COLORS[Number(colorPick)].label,
            sub: true,
            run: () =>
              ps.sub.open(
                ps.sub.choiceLevel(
                  'Color',
                  [{ value: 'auto', label: `Original (este mes: ${COLORS[new Date().getMonth()].label})` }, ...COLORS.map((c, i) => ({ value: String(i), label: c.label + (i < 12 ? `  ·  ${MONTHS[i]}` : '') }))],
                  colorPick,
                  (v) => {
                    colorPick = v;
                    store.set('color', v);
                    refreshColor();
                  },
                  (v) => {
                    // vista previa al moverse por la lista
                    colorPick = v;
                    refreshColor();
                  }
                )
              ),
          },
          {
            icon: 'image',
            title: 'Fondo',
            desc: 'Una imagen tuya (de la carpeta de fondos) o el arte de uno de tus juegos, como los temas de la PS3.',
            value: ps.wall.label(ps.games),
            sub: true,
            run: async () => {
              await ps.wall.load();
              ps.sub.open(
                ps.sub.choiceLevel(
                  'Fondo',
                  ps.wall.choices(ps.games).map((c) => ({ value: c.value, label: c.group === 'games' ? `Juego: ${c.label}` : c.label })),
                  ps.wall.value,
                  (v) => (ps.wall.set(v), applyWall()),
                  (v) => applyWall(v) // vista previa al moverse por la lista
                )
              );
            },
          },
          ...(ps.wall.url(ps.games)
            ? [
                {
                  icon: 'screen',
                  title: 'Ola encima del fondo',
                  desc: 'La ola de la PS3 pasando por encima de tu fondo.',
                  value: waveOver ? 'Activado' : 'Desactivado',
                  run: () => {
                    waveOver = !waveOver;
                    store.set('waveOver', waveOver ? '1' : '0');
                    applyWall();
                    ps.sub.paint();
                  },
                },
              ]
            : []),
          {
            icon: 'folder',
            title: 'Carpeta de fondos',
            desc: 'Pon aquí tus imágenes (JPG o PNG, ideal 1920×1080) y después elígelas en Fondo.',
            run: () => (ps.wall.openFolder(), ctx.toast('Se abrió la carpeta de fondos')),
          },
          {
            icon: 'sun',
            title: 'Brillo según la hora',
            desc: 'Más oscuro de noche y más claro de día, como la PS3.',
            value: daylight ? 'Activado' : 'Desactivado',
            run: () => {
              daylight = !daylight;
              store.set('daylight', daylight ? '1' : '0');
              refreshColor();
              ps.sub.paint();
            },
          },
        ],
      };
    }
    return {
      W,
      applyWall,
      tweenW,
      themeLevel,
      // Al volver de jugar, la ola sigue desde ahora (no da un salto)
      resetClock: () => (last = performance.now()),
      dispose() {
        cancelAnimationFrame(raf);
        clearInterval(clockTimer);
        clearInterval(colorTimer);
      },
    };
  }

  // ---------- El menú: la fila de categorías, la columna de opciones de cada una y las opciones de un juego o amigo ----------
  function menuXmb(ps) {
    const { $, $$, ctx, call } = ps;
    // Orden de la columna Juego: Jugado recientemente, Nombre, Horas jugadas o % de logros (△ sobre un juego)
    const order = window.NostalHubUtil.gameOrder('ps3', { def: ['recent', 'name', 'hours'][Number(store.get('sort', 0))] || 'recent' });

    const CATS = [
      { id: 'users', label: 'Usuarios', icon: 'user' },
      { id: 'settings', label: 'Ajustes', icon: 'settings' },
      { id: 'music', label: 'Música', icon: 'music' },
      { id: 'game', label: 'Juego', icon: 'game', wide: true },
      { id: 'psn', label: 'PlayStation Network', icon: 'psn' },
      { id: 'friends', label: 'Amigos', icon: 'friends' },
    ];
    let catSel = 3;
    const itemSel = {}; // lo elegido en cada categoría (se recuerda, como en la PS3)
    let items = [];

    function gameSub(g) {
      const parts = [U.hours(g.playtimeMin), g.lastPlayed ? `Jugado ${U.ago(g.lastPlayed)}` : ''].filter(Boolean);
      return parts.join('  ·  ') || 'Todavía no lo juegas';
    }
    // Las imágenes van en data-pic: renderItems las pone con U.stillBackground (si son animadas, su primer cuadro; solo el
    // juego marcado se anima). Un ícono animado fuera de la vista seguía "avanzando" y al aparecer trababa segundos.
    function gameIconHtml(g) {
      const img = (u) => `<img class="p3-chk" data-pic="${esc(u)}" alt="" draggable="false" />`;
      if (g.icon0 || g.header) return img(g.icon0 || g.header);
      if (g.hero && g.heroIsReal && g.logo) return `<span class="p3-comp" data-pic="${esc(g.hero)}"><img src="${esc(g.logo)}" alt="" draggable="false" /></span>`;
      return g.tile && !g.tileIsVideo ? img(g.tile) : '';
    }
    const CAT_ICONS = { general: 'gear', games: 'pad', emulators: 'pad', screen: 'screen', sound: 'speaker', accounts: 'key', files: 'folder' };

    function buildItems(id) {
      if (id === 'users') {
        return [
          { icon: 'power', title: 'Apagar el sistema', run: () => ps.pregunta.confirmQuit() },
          { icon: 'swap', title: 'Cambiar de consola', sub: 'Volver al selector de consolas', run: () => ctx.openSelector() },
          {
            icon: 'user',
            img: ps.profile.avatar,
            round: true,
            title: ps.profile.name || 'Jugador',
            sub: ps.summary.hasKey ? 'Steam' : 'Conecta tu Steam para ver tu nombre y tu foto',
            run: () => (ps.summary.hasKey ? (call('open', 'steam-profile'), ctx.toast('Se abrió en Steam')) : call('open', 'setup-steam')),
            def: true,
          },
        ];
      }
      if (id === 'settings') {
        return [
          { icon: 'palette', title: 'Ajustes de tema', sub: 'Fondo, color y ola de la PS3', run: () => ps.sub.open(ps.fondo.themeLevel()) },
          ...ps.menuModel.map((c) => ({ icon: CAT_ICONS[c.id] || 'gear', title: c.title, sub: c.items.map((x) => x.label).slice(0, 3).join(', ') + (c.items.length > 3 ? '…' : ''), run: () => ps.sub.open(ps.ajustes.level(c.id)) })),
        ];
      }
      if (id === 'music') {
        // Música: la canción (con su barra), lo que viene y "Opciones de música" (pantalla como Ajustes, ver musicLevel)
        const v = U.spotifyView(ps.spotify || {});
        const list = [
          {
            icon: v.on ? (v.playing ? 'pause' : 'play') : 'note',
            img: v.cover,
            title: v.title,
            sub: v.on ? `${v.artist ? v.artist + '  ·  ' : ''}${v.playing ? 'Reproduciendo' : 'En pausa'}${v.device && v.deviceType !== 'Computer' ? `  ·  en ${v.device}` : ''}` : v.artist,
            extra: U.progressHtml(v, 'p3-prog'),
            run: () => ps.musica.cmd(v.on ? 'toggle' : 'open'),
            def: true,
          },
        ];
        if (v.next) list.push({ svg: U.npIcon('next'), title: `Siguiente: ${v.next.title}`, sub: v.next.artist, run: () => ps.musica.cmd('next') });
        if (v.on) list.push({ icon: 'gear', title: 'Opciones de música', sub: v.api ? 'Pista, orden, repetir, me gusta, volumen, dispositivo y cola' : `Pista anterior, siguiente y abrir ${v.app}`, run: () => ps.sub.open(ps.musica.level()) });
        else if (v.appId !== 'auto') list.push({ icon: 'open', title: `Abrir ${v.app}`, run: () => ps.musica.cmd('open') });
        if (v.appId === 'spotify' && !v.api) list.push({ svg: U.npIcon('queue'), title: 'Conectar Spotify (debes tener Premium)', sub: 'Para ver la cola, la barra de la canción, aleatorio, repetir y más', run: () => call('open', 'setup-spotify') });
        return list;
      }
      if (id === 'game') {
        const tp = ps.summary.hasKey ? `${ps.summary.done || 0} de ${ps.summary.total || 0} logros` : 'Conecta tu Steam para ver tus logros';
        return [
          { icon: 'trophy', title: 'Colección de trofeos', sub: tp, run: () => ps.sub.open(ps.trofeos.level()) },
          ...order.apply(ps.games, ps.summary).map((g) => ({ game: g, img: icon0(g), title: g.name, sub: gameSub(g), run: () => ps.jugando.start(g) })),
        ];
      }
      if (id === 'psn') {
        return [
          { icon: 'store', title: 'Tienda', sub: 'Se abre en Steam', run: () => (call('open', 'steam-store'), ctx.toast('Se abrió en Steam')) },
          { icon: 'news', title: 'Novedades', sub: 'Actividad de tus amigos en Steam', run: () => (call('open', 'steam-activity'), ctx.toast('Se abrió en Steam')) },
          { icon: 'key', title: 'Administración de cuentas', sub: 'Conectar Steam y Discord', run: () => call('open', 'setup-steam') },
        ];
      }
      if (id === 'friends') {
        const list = [];
        const st = {
          'no-config': ['Conecta tu Discord', 'Para ver tu canal de voz y quiénes están contigo', () => call('open', 'setup-discord')],
          'no-discord': ['Discord no está abierto', 'Ábrelo y NostalHub se conecta sola', () => call('open', 'discord-app')],
          'need-auth': ['Falta un permiso de Discord', 'Elige para aceptarlo en Discord', () => call('discordAuthorize').then((s) => s && ps.setDiscord(s))],
          authorizing: ['Acepta la ventana de Discord', 'Revisa Discord y presiona Autorizar', null],
          error: ['No se pudo conectar con Discord', ps.discord.message || 'Elige para intentarlo de nuevo', () => call('discordAuthorize').then((s) => s && ps.setDiscord(s))],
        }[ps.discord.status];
        // El Grupo (Discord) es una sola fila: al elegirla se ven quiénes están en el canal (no se mezcla con los amigos)
        if (ps.discord.status === 'ok' && ps.discord.channel) {
          const n = ps.discord.members.length;
          list.push({ icon: 'headset', title: 'Grupo', sub: `${ps.discord.channel.name}  ·  ${n} ${n === 1 ? 'persona' : 'personas'}`, run: () => ps.sub.open(ps.grupo.level()) });
        } else if (ps.discord.status === 'ok') list.push({ icon: 'headset', title: 'Grupo', sub: 'No estás en un canal de voz' });
        else if (st) list.push({ icon: 'headset', title: st[0], sub: st[1], run: st[2] });
        else list.push({ icon: 'headset', title: 'Grupo', sub: 'Conectando con Discord…' });
        // Amigos de Steam, uno por fila como en la PS3 (jugando, en línea, ausentes y desconectados al final)
        const fd = ps.feed.data;
        if (fd.status === 'ok' && ps.feed.list.length) {
          ps.feed.list.forEach((f) => list.push({ icon: 'user', img: f.avatar, rsq: true, friend: f, dot: U.friendClass(f), title: f.name, sub: U.friendStatus(f), run: () => friendOpen(f, 'profile') }));
        } else {
          const m = U.friendsMessage(fd.status);
          list.push({ icon: 'people', title: m.t, sub: m.d || '', run: m.btn ? () => call('open', m.btn[0]) : null });
        }
        return list;
      }
      return [];
    }

    // ---------- Dibujo de la fila de categorías ----------
    function paintCats(animate = true) {
      const box = $('.p3-cats');
      if (!box.children.length) {
        box.innerHTML = CATS.map((c, i) => `<div class="p3-cat" data-i="${i}"><div class="p3-cat-ic">${ic(c.icon)}</div><div class="p3-cat-l">${esc(c.label)}</div></div>`).join('');
        $$('.p3-cat', box).forEach((el) =>
          el.addEventListener('click', () => {
            if (ps.mode !== 'xmb') return;
            const i = Number(el.dataset.i);
            if (i !== catSel) ctx.sound('move'), setCat(i);
          })
        );
      }
      box.classList.toggle('still', !animate);
      $$('.p3-cat', box).forEach((el) => {
        const i = Number(el.dataset.i);
        const sel = i === catSel;
        const x = CAT_X + (i - catSel) * CAT_GAP;
        el.classList.toggle('sel', sel);
        el.style.transform = `translate(${x}px, ${CAT_Y}px) scale(${sel ? 1 : 0.8})`;
      });
    }

    // ---------- Dibujo de las opciones (columna) ----------
    function sizeOf(it) {
      return it.game ? GAME : NORMAL;
    }
    function renderItems(dir = 0) {
      const cat = CATS[catSel];
      const box = $('.p3-items');
      items = buildItems(cat.id);
      let sel = itemSel[cat.id];
      if (sel == null) sel = cat.id === 'game' ? Math.min(1, items.length - 1) : Math.max(0, items.findIndex((x) => x.def));
      itemSel[cat.id] = Math.max(0, Math.min(items.length - 1, sel));
      box.innerHTML = items
        .map((it, i) => {
          const z = sizeOf(it);
          // si la imagen falla, queda el ícono (o el nombre, en los juegos)
          const img = it.game ? gameIconHtml(it.game) : it.img ? `<img src="${esc(it.img)}" alt="" draggable="false" />` : '';
          const inner = img + (it.game ? `<span class="p3-noicon">${esc(it.title)}</span>` : it.svg || ic(it.icon));
          return `<div class="p3-it${it.game ? ' is-game' : ''}${it.on ? ' on' : ''}${it.svg ? ' np' : ''}${it.round ? ' round' : ''}${it.rsq ? ' rsq' : ''}${it.talking ? ' talking' : ''}${it.img ? ' has-img' : ''}" data-i="${i}"${it.game ? ` data-game-id="${esc(it.game.id)}"` : ''}>
            <div class="p3-ic" style="width:${z.w}px;height:${z.h}px">${inner}${it.dot ? `<i class="p3-fdot ${it.dot}"></i>` : ''}${it.game && U.isComplete(trophiesOf(ps, it.game)) ? U.completeBadge('platinum', 'on-icon') : ''}</div>
            <div class="p3-tx"><b>${esc(it.title)}</b>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}${it.extra || ''}</div></div>`;
        })
        .join('');
      $$('[data-pic]', box).forEach((el) => U.stillBackground(el, el.dataset.pic));
      watchImages(box);
      $$('.p3-it', box).forEach((el) => {
        const i = Number(el.dataset.i);
        el.addEventListener('click', () => {
          if (ps.mode !== 'xmb') return;
          if (i === itemSel[CATS[catSel].id]) activate();
          else ctx.sound('move'), setItem(i);
        });
      });
      layoutItems(false);
      if (dir) {
        box.classList.remove('in-l', 'in-r');
        box.offsetWidth;
        box.classList.add(dir > 0 ? 'in-r' : 'in-l');
      }
      ps.detalle.focusChanged();
    }
    function layoutItems(animate = true) {
      const cat = CATS[catSel];
      const sel = itemSel[cat.id] || 0;
      const box = $('.p3-items');
      box.classList.toggle('still', !animate);
      const els = $$('.p3-it', box);
      const textX = CAT_X + (cat.wide ? GAME.w : NORMAL.w) / 2 + 36;
      const gap = cat.wide ? 18 : 24;
      // posición de arriba de cada uno: el elegido bajo la categoría, los anteriores arriba de la fila
      const tops = [];
      tops[sel] = SEL_TOP;
      let y = SEL_TOP + sizeOf(items[sel]).h + gap + 6;
      for (let i = sel + 1; i < items.length; i++) {
        tops[i] = y;
        y += sizeOf(items[i]).h * SMALL + gap;
      }
      y = CAT_Y - 92;
      for (let i = sel - 1; i >= 0; i--) {
        y -= sizeOf(items[i]).h * SMALL;
        tops[i] = y;
        y -= gap;
      }
      els.forEach((el, i) => {
        const z = sizeOf(items[i]);
        const s = i === sel ? 1 : SMALL;
        const top = tops[i];
        const off = top > 1130 || top + z.h * s < -60;
        el.classList.toggle('sel', i === sel);
        el.classList.toggle('above', i < sel);
        el.classList.toggle('off', off);
        const icEl = el.firstElementChild;
        icEl.style.transform = `translate(${CAT_X - (z.w * s) / 2}px, ${top}px) scale(${s})`;
        el.lastElementChild.style.transform = `translate(${textX}px, ${top + (z.h * s) / 2}px) translateY(-50%)`;
      });
      U.liveBackground(box.querySelector('.p3-it.sel [data-pic]'), 'ps3-icono'); // solo el marcado se anima (si te quedas)
    }
    function setCat(i) {
      const next = Math.max(0, Math.min(CATS.length - 1, i));
      if (next === catSel) return;
      const dir = next > catSel ? 1 : -1;
      catSel = next;
      paintCats();
      renderItems(dir);
      ps.paintHints();
      ps.feed.watch(CATS[catSel].id === 'friends');
    }
    function setItem(i) {
      const id = CATS[catSel].id;
      const n = Math.max(0, Math.min(items.length - 1, i));
      if (n === itemSel[id]) return;
      itemSel[id] = n;
      layoutItems();
      ps.detalle.focusChanged();
      ps.paintHints();
    }
    function curItem() {
      return items[itemSel[CATS[catSel].id] || 0];
    }
    function activate() {
      const it = curItem();
      if (it && it.run) it.run();
    }
    // Vuelve a armar la categoría actual sin perder lo elegido (datos nuevos)
    function refreshCat(id) {
      if (CATS[catSel].id !== id && id !== '*') return;
      const it = curItem();
      const keep = it && it.game ? it.game.id : null;
      const keepFriend = it && it.friend ? it.friend.id : null; // el mismo amigo aunque la lista se reordene
      const cat = CATS[catSel].id;
      const prev = itemSel[cat];
      items = buildItems(cat);
      const j = keep ? items.findIndex((x) => x.game && x.game.id === keep) : keepFriend ? items.findIndex((x) => x.friend && x.friend.id === keepFriend) : -1;
      if (j >= 0) itemSel[cat] = j;
      else itemSel[cat] = Math.min(prev || 0, items.length - 1);
      renderItems(0); // si el juego elegido sigue igual, no se reinicia su fondo ni su música
    }
    function friendOpen(f, what) {
      if (what === 'chat') {
        ps.feed.chat(f);
        ctx.toast(`Se abrió el chat con ${f.name} en Steam`);
      } else {
        ps.feed.profile(f);
        ctx.toast(`Se abrió el perfil de ${f.name} en Steam`);
      }
    }
    function openOpts() {
      const it = curItem();
      if (it && it.friend) {
        return ps.opciones.show([
          { label: 'Ver perfil', run: () => friendOpen(it.friend, 'profile') },
          { label: 'Enviar mensaje', run: () => friendOpen(it.friend, 'chat') },
        ]);
      }
      const g = it && it.game;
      if (!g) return;
      const list = [
        { label: 'Iniciar', run: () => ps.jugando.start(g) },
        { label: 'Información', run: () => ps.info.open(g) },
        ...(g.hasAch ? [{ label: 'Logros', run: () => ps.trofeos.openOf(g) }] : []),
        { label: 'Cambiar imágenes y descripción', run: () => window.NostalHubGameEditor && window.NostalHubGameEditor.open(g.id) },
        { label: `Ordenar: ${order.label()}`, run: () => openSortOpts() },
      ];
      ps.opciones.show(list);
    }
    function openSortOpts() {
      ps.opciones.show(
        order.sorts.map((s) => ({
          label: s.label,
          on: s.id === order.mode,
          run: () => {
            order.set(s.id);
            const keep = curItem() && curItem().game;
            renderItems(0);
            if (keep) {
              const j = items.findIndex((x) => x.game && x.game.id === keep.id);
              if (j >= 0) (itemSel.game = j), layoutItems(false);
            }
          },
        })),
        Math.max(0, order.sorts.findIndex((s) => s.id === order.mode))
      );
    }
    function key(k) {
      const sel = itemSel[CATS[catSel].id] || 0;
      if (k === 'ArrowRight') setCat(catSel + 1);
      else if (k === 'ArrowLeft') setCat(catSel - 1);
      else if (k === 'ArrowDown') setItem(sel + 1);
      else if (k === 'ArrowUp') setItem(sel - 1);
      else if (k === 'PageDown') setItem(sel + 5);
      else if (k === 'PageUp') setItem(sel - 5);
      else if (k === 'Home') setItem(0);
      else if (k === 'End') setItem(items.length - 1);
      else if (k === 'Enter' || k === ' ') activate();
      else if (k === 'o' || k === 'O' || k === '+') openOpts();
      else if (k === 'Escape' || k === 'Backspace') ctx.openSelector();
    }
    function wheel(horiz, d) {
      if (horiz) setCat(catSel + d);
      else setItem((itemSel[CATS[catSel].id] || 0) + d);
    }
    return {
      key,
      wheel,
      curItem,
      refreshCat,
      paintCats,
      renderItems,
      // Al entrar queda elegido el primer juego (no los trofeos)
      firstEntry() {
        if (!itemSel.game) delete itemSel.game;
        if (ps.mode === 'xmb' || ps.mode === 'boot') renderItems(0);
      },
    };
  }

  // ---------- Al quedarse sobre un juego: su fondo (PIC1) y su música (SND0) ----------
  function fondoDelJuego(ps) {
    const { $, ctx } = ps;
    // ---------- PIC1 (fondo del juego) y SND0 (su música) al quedarse sobre él ----------
    let detailTimer = 0;
    let shownGame = null;
    let snd = null;
    const { fadeAudio } = window.NostalHubUtil;
    function focusChanged() {
      const it = ps.mode === 'xmb' || ps.mode === 'opts' ? ps.menu.curItem() : null;
      const g = it && it.game;
      if (g && shownGame && g.id === shownGame.id) return;
      clearTimeout(detailTimer);
      hideDetail();
      if (!g) return;
      detailTimer = setTimeout(() => showDetail(g), 900);
    }
    function showDetail(g) {
      if (closed) return;
      shownGame = g;
      const pic = $('.p3-pic1');
      if (g.hero && g.heroIsReal) {
        // decode(): la imagen (también una animada pesada) se prepara aparte antes de mostrarse; con onload se
        // decodificaba al dibujarla y la pantalla se trababa
        const img = new Image();
        img.src = g.hero;
        img
          .decode()
          .then(() => {
            if (shownGame !== g) return;
            pic.style.backgroundImage = `url("${g.hero}")`;
            pic.classList.add('on');
          })
          .catch(() => {});
      }
      if (g.music && ps.ss().music !== false && !closed) {
        stopSnd(true);
        const a = new Audio(g.music);
        a.loop = true;
        a.volume = 0;
        snd = a;
        allSnd.add(a);
        // si mientras cargaba ya te fuiste (o de la consola), se apaga apenas empieza a sonar
        a.play()
          .then(() => (closed || snd !== a) && a.pause())
          .catch(() => {});
        ctx.duckMusic && ctx.duckMusic(true);
        fadeAudio(a, Math.min(1, (ps.ss().musicVolume || 0.35) * 1.6), 1200);
      }
    }
    // Apaga la música del juego (de a poco, o al tiro). allSnd guarda también las que se están apagando: al salir de la
    // consola se cortan todas, así ninguna queda sonando en el selector
    const allSnd = new Set();
    let closed = false;
    function stopSnd(now) {
      const a = snd;
      snd = null;
      if (!a) return;
      const off = () => (a.pause(), allSnd.delete(a));
      if (now) off();
      else fadeAudio(a, 0, 450, off);
      ctx.duckMusic && ctx.duckMusic(false);
    }
    function hideDetail() {
      shownGame = null;
      const pic = $('.p3-pic1');
      if (pic) pic.classList.remove('on');
      stopSnd(false);
    }
    return {
      focusChanged,
      hide() {
        clearTimeout(detailTimer);
        hideDetail();
      },
      dispose() {
        clearTimeout(detailTimer);
        closed = true;
        snd = null;
        allSnd.forEach((a) => a.pause());
        allSnd.clear();
        ctx.duckMusic && ctx.duckMusic(false);
      },
    };
  }

  // ---------- Listas anidadas (Ajustes, Colección de trofeos, valores de una opción…) ----------
  function listas(ps) {
    const { $, $$, ctx, root } = ps;
    const stack = []; // niveles: { title, head, rows, sel, big, build, onPick, onBack }
    function openSub(level) {
      if (!level) return;
      level.sel = level.sel || 0;
      stack.push(level);
      ps.mode = 'sub';
      ps.detalle.hide();
      root.classList.add('deep');
      $('.p3-sub').hidden = false;
      paintSub(true);
      ps.paintHints();
      if (level.load) level.load(level);
    }
    function closeSub() {
      const lv = stack.pop();
      if (lv && lv.onBack) lv.onBack();
      if (stack.length) return paintSub(true), ps.paintHints();
      ps.mode = 'xmb';
      root.classList.remove('deep');
      $('.p3-sub').hidden = true;
      ps.menu.refreshCat('*');
      ps.paintHints();
    }
    function curLevel() {
      return stack[stack.length - 1];
    }
    const ROW_H = { normal: 92, big: 124 };
    function paintSub(fresh = false) {
      const lv = curLevel();
      if (!lv) return;
      if (lv.build) lv.rows = lv.build();
      const sub = $('.p3-sub');
      sub.classList.toggle('big', !!lv.big);
      $('.p3-sub-head').innerHTML = lv.head ? lv.head() : `<b>${esc(lv.title)}</b>`;
      const list = $('.p3-sub-list');
      lv.sel = Math.max(0, Math.min(lv.rows.length - 1, lv.sel));
      list.innerHTML = lv.rows.length
        ? lv.rows
            .map(
              (r, i) => `<div class="p3-row${r.sep ? ' sep' : ''}${r.dim ? ' dim' : ''}${r.on ? ' on' : ''}" data-i="${i}"${r.gameId ? ` data-game-id="${esc(r.gameId)}"` : ''}>
            ${r.img !== undefined || r.icon ? `<span class="p3-r-ic${r.wide ? ' wide' : ''}">${r.img ? `<img src="${esc(r.img)}" alt="" draggable="false" />` : r.icon ? ic(r.icon) : ''}</span>` : ''}
            <span class="p3-r-t"><b>${esc(r.title)}</b>${r.desc ? `<small>${esc(r.desc)}</small>` : ''}${r.bar != null ? `<i class="p3-bar"><i style="width:${Math.round(r.bar * 100)}%"></i></i>` : ''}</span>
            ${r.badge ? `<span class="p3-r-badge">${r.badge}</span>` : ''}
            ${r.adjust ? `<span class="p3-r-v p3-adj"><i data-d="-1">◀</i>${esc(r.value)}<i data-d="1">▶</i></span>` : r.value != null ? `<span class="p3-r-v">${esc(r.value)}</span>` : ''}</div>`
            )
            .join('')
        : `<div class="p3-empty">${lv.empty || 'No hay nada aquí.'}</div>`;
      watchImages(list);
      $$('.p3-row', list).forEach((el) => {
        const i = Number(el.dataset.i);
        el.addEventListener('click', (e) => {
          if (ps.mode !== 'sub' || (curLevel().rows[i] && curLevel().rows[i].sep)) return;
          const adj = e.target.closest('[data-d]');
          if (adj && curLevel().rows[i] && curLevel().rows[i].adjust) return setRow(i), curLevel().rows[i].adjust(Number(adj.dataset.d));
          if (i === curLevel().sel) pickRow();
          else ctx.sound('move'), setRow(i);
        });
      });
      if (fresh) {
        sub.classList.remove('in');
        sub.offsetWidth;
        sub.classList.add('in');
      }
      setRow(lv.sel, false);
    }
    function setRow(i, sound = false) {
      const lv = curLevel();
      if (!lv || !lv.rows.length) return;
      lv.sel = U.skipSetHead(lv.rows, i, i < lv.sel ? -1 : 1); // los títulos de los sets de logros se saltan
      const h = lv.big ? ROW_H.big : ROW_H.normal;
      const visible = Math.floor(660 / h);
      $('.p3-sub-view').style.height = `${visible * h}px`; // filas completas, sin una cortada abajo
      const first = Math.max(0, Math.min(lv.sel - Math.floor(visible / 2) + 1, lv.rows.length - visible));
      $('.p3-sub-list').style.transform = `translateY(${-first * h}px)`;
      $('.p3-sub-band').style.transform = `translateY(${(lv.sel - first) * h}px)`;
      $('.p3-sub-band').style.height = `${h}px`;
      $$('.p3-sub-list .p3-row').forEach((el) => el.classList.toggle('sel', Number(el.dataset.i) === lv.sel));
      if (sound) ctx.sound('move');
    }
    function pickRow() {
      const lv = curLevel();
      const r = lv && lv.rows[lv.sel];
      if (r && r.run) r.run(r);
    }
    function subKey(k) {
      const lv = curLevel();
      if (k === 'ArrowDown') setRow(lv.sel + 1);
      else if (k === 'ArrowUp') setRow(lv.sel - 1);
      else if (k === 'PageDown') setRow(lv.sel + 5);
      else if (k === 'PageUp') setRow(lv.sel - 5);
      else if ((k === 'ArrowLeft' || k === 'ArrowRight') && lv.rows[lv.sel] && lv.rows[lv.sel].adjust) lv.rows[lv.sel].adjust(k === 'ArrowRight' ? 1 : -1);
      else if (k === 'Enter' || k === 'ArrowRight') {
        const r = lv.rows[lv.sel];
        if (k === 'Enter' || (r && r.sub)) pickRow();
      } else if (k === 'Escape' || k === 'Backspace' || k === 'ArrowLeft') closeSub();
    }
    function choiceLevel(title, options, current, onPick, onPreview) {
      const before = current;
      let picked = false;
      const lv = {
        title,
        sel: Math.max(0, options.findIndex((o) => String(o.value) === String(current))),
        build: () => options.map((o) => ({ title: o.label, on: String(o.value) === String(current), value: String(o.value) === String(current) ? '●' : '', run: () => ((picked = true), onPick(o.value), closeSub()) })),
        onBack: () => {
          if (!picked && onPreview) onPreview(before);
        },
      };
      if (onPreview) lv.onMove = (i) => onPreview(options[i].value);
      return lv;
    }
    function key(k) {
      const lv = curLevel();
      const before = lv.sel;
      subKey(k);
      if (lv.onMove && curLevel() === lv && lv.sel !== before) lv.onMove(lv.sel);
    }
    function wheel(d) {
      const lv = curLevel();
      setRow(lv.sel + d);
      if (lv.onMove) lv.onMove(lv.sel);
    }
    return { key, wheel, setRow, choiceLevel, open: openSub, close: closeSub, cur: curLevel, paint: paintSub, isOpen: () => stack.length > 0 };
  }

  // --- Grupo: quiénes están en tu canal de voz de Discord ---
  function grupo(ps) {
    const { call } = ps;
    function partyLevel() {
      return {
        title: 'Grupo',
        party: true,
        empty: 'No estás en un canal de voz.',
        head: () => `<b>Grupo</b>${ps.discord.channel ? `<em>${esc(ps.discord.channel.name)}  ·  ${esc(ps.discord.channel.guild || 'Mensaje directo')}</em>` : ''}`,
        build: () =>
          ps.discord.status === 'ok' && ps.discord.channel
            ? [
                ...ps.discord.members.map((m) => ({ img: m.avatar || '', icon: 'user', title: m.name, desc: m.deafened ? 'Sin audio' : m.muted ? 'Micrófono apagado' : m.speaking ? 'Hablando' : 'En el canal', value: m.speaking ? '●' : null })),
                { icon: 'open', title: 'Abrir Discord', run: () => call('open', 'discord-app') },
              ]
            : [],
      };
    }
    return { level: partyLevel };
  }

  // --- Música: los controles y las Opciones de música (como los Ajustes) ---
  function musica(ps) {
    const { api, ctx, call } = ps;
    // El volumen se cambia con ← → y se muestra al tiro; a Spotify se manda un momento después de soltar, y
    // mientras tanto se muestra el valor elegido (Spotify tarda en avisar el nuevo y a veces manda el viejo).
    let volPick = null;
    let volUntil = 0;
    let volTimer = 0;
    const volShown = (v) => (volPick != null && Date.now() < volUntil ? volPick : v.volume);
    function changeVolume(d) {
      const v = U.spotifyView(ps.spotify || {});
      if (!v.canVolume) return;
      const cur = volShown(v);
      const next = Math.max(0, Math.min(100, d > 0 ? Math.floor(cur / 5) * 5 + 5 : Math.ceil(cur / 5) * 5 - 5));
      if (next === cur) return ctx.sound('error');
      volPick = next;
      volUntil = Date.now() + 4000;
      ctx.sound('move');
      ps.sub.paint();
      clearTimeout(volTimer);
      volTimer = setTimeout(async () => {
        volUntil = Date.now() + 2500;
        const r = await call('spotifyControl', 'volume', { value: volPick });
        if (r && r.ok === false && r.message) ctx.toast(r.message);
      }, 300);
    }
    // Orden, repetir y me gusta: se ven cambiados al tiro, sin esperar a Spotify
    async function musicAction(id) {
      const v = U.spotifyView(ps.spotify || {});
      if (ps.spotify) {
        if (id === 'shuffle') ps.spotify = { ...ps.spotify, shuffle: v.shuffle === 'off', smartShuffle: false };
        else if (id === 'repeat') ps.spotify = { ...ps.spotify, repeat: { off: 'context', context: 'track', track: 'off' }[v.repeat] || 'off' };
        else if (id === 'like') ps.spotify = { ...ps.spotify, liked: !v.liked };
        ps.sub.paint();
      }
      await U.musicRun(api, id, v, ctx.toast);
    }
    function musicLevel() {
      return {
        title: 'Música',
        music: true,
        head: () => {
          const v = U.spotifyView(ps.spotify || {});
          return `<b>Música</b>${v.on ? `<em>${esc(v.title)}${v.artist ? `  ·  ${esc(v.artist)}` : ''}</em>` : ''}`;
        },
        build: () => {
          const v = U.spotifyView(ps.spotify || {});
          const rows = [
            { title: v.playing ? 'Pausar' : 'Reanudar', desc: v.on ? `${v.title}${v.artist ? ` — ${v.artist}` : ''}` : '', run: () => spotifyCmd('toggle') },
            { title: 'Pista anterior', run: () => spotifyCmd('prev') },
            { title: 'Pista siguiente', desc: v.next ? `Siguiente: ${U.nextText(v)}` : '', run: () => spotifyCmd('next') },
          ];
          if (v.api) {
            rows.push(
              { title: 'Orden', desc: v.shuffle === 'smart' ? 'El aleatorio inteligente se apaga desde Spotify' : 'En orden o Aleatorio', value: U.SHUFFLE_LABEL[v.shuffle], run: () => musicAction('shuffle') },
              { title: 'Repetir', desc: 'No, la lista o la canción', value: U.REPEAT_LABEL[v.repeat], run: () => musicAction('repeat') },
              { title: 'Me gusta', desc: 'Guarda la canción en tus Me gusta de Spotify', value: v.liked ? 'Sí' : 'No', run: () => musicAction('like') }
            );
            if (v.canVolume) rows.push({ title: 'Volumen', desc: 'El volumen de Spotify. ← → para cambiarlo', value: `${volShown(v)} %`, adjust: changeVolume });
            rows.push(
              { title: 'Dispositivo', desc: 'Pasa la música a otro dispositivo', value: v.device || '—', sub: true, run: () => ps.sub.open(deviceLevel()) },
              { title: 'Cola de reproducción', desc: 'Elige una canción para saltar hasta ella', value: v.queue.length ? `${v.queue.length} canciones` : 'Vacía', sub: true, run: () => ps.sub.open(queueLevel()) }
            );
          }
          if (v.appId !== 'auto') rows.push({ title: `Abrir ${v.app}`, run: () => (spotifyCmd('open'), ctx.toast(`Se abrió ${v.app}`)) });
          if (v.appId === 'spotify' && !v.api) rows.push({ title: 'Conectar Spotify (debes tener Premium)', desc: 'Para ver la cola, la barra de la canción, aleatorio, repetir y más', run: () => call('open', 'setup-spotify') });
          return rows;
        },
      };
    }
    function deviceLevel() {
      const TYPES = { Computer: 'Computador', Smartphone: 'Teléfono', Speaker: 'Parlante', TV: 'Televisor' };
      return {
        title: 'Dispositivo',
        rows: [],
        empty: 'Buscando dispositivos… Si no aparece, abre Spotify en él.',
        async load(self) {
          const devs = (await call('spotifyDevices')) || [];
          if (ps.sub.cur() !== self) return;
          self.sel = Math.max(0, devs.findIndex((d) => d.active));
          self.rows = devs.map((d) => ({
            title: d.name,
            desc: d.active ? 'Sonando aquí' : TYPES[d.type] || d.type || '',
            on: d.active,
            value: d.active ? '●' : '',
            run: () => {
              if (!d.active) {
                ctx.toast(`Pasando la música a ${d.name}…`);
                call('spotifyControl', 'device', d.id).then((r) => r && r.ok === false && r.message && ctx.toast(r.message));
              }
              ps.sub.close();
            },
          }));
          self.empty = 'No hay dispositivos. Abre Spotify en el que quieras usar.';
          ps.sub.paint();
        },
      };
    }
    function queueLevel() {
      return {
        title: 'Cola de reproducción',
        music: true,
        big: true,
        empty: 'No hay canciones en la cola.',
        build: () =>
          U.spotifyView(ps.spotify || {}).queue.map((t, i) => ({
            img: t.cover || '',
            title: t.title,
            desc: t.artist,
            value: i === 0 ? 'Siguiente' : '',
            run: () => {
              ctx.toast(`Saltando a "${t.title}"…`);
              call('spotifyControl', 'skipto', i).then((r) => r && r.ok === false && r.message && ctx.toast(r.message));
              ps.sub.close();
            },
          })),
      };
    }
    function spotifyCmd(cmd) {
      call('spotifyControl', cmd);
      if (cmd === 'toggle' && ps.spotify && ps.spotify.running) {
        ps.spotify = { ...ps.spotify, playing: !ps.spotify.playing };
        ps.menu.refreshCat('music');
        if (ps.mode === 'sub' && ps.sub.cur() && ps.sub.cur().music) ps.sub.paint();
      }
    }
    return { level: musicLevel, cmd: spotifyCmd };
  }

  // --- Ajustes de NostalHub (los mismos de todas las consolas) ---
  function ajustes(ps) {
    const { ctx, call } = ps;
    function menuLevel(catId) {
      const cat = () => ps.menuModel.find((c) => c.id === catId) || { title: '', items: [] };
      return {
        title: cat().title,
        build: () =>
          cat().items.map((it) => ({
            title: it.label,
            desc: it.desc,
            value: it.type === 'toggle' || it.type === 'choice' ? U.optionValueText(it) : null,
            sub: it.type === 'choice',
            run: () => pickSetting(it),
          })),
      };
    }
    async function pickSetting(it) {
      if (it.id === 'consoles') return ctx.openSelector();
      if (it.confirm) return ps.pregunta.confirmQuit();
      if (it.type === 'choice')
        return ps.sub.open(
          ps.sub.choiceLevel(it.label, it.options.map((o) => ({ value: o.value, label: o.label })), it.value, (v) => runOption(it, v))
        );
      if (/^open-|^devtools$/.test(it.id)) ctx.toast('Se abrió en Windows');
      await runOption(it, it.type === 'toggle' ? !it.value : undefined);
    }
    async function runOption(it, value) {
      const next = await call('runMenu', it.id, value);
      if (next) ps.menuModel = next;
      if (ps.mode === 'sub') ps.sub.paint();
    }
    return { level: menuLevel };
  }

  // --- Colección de trofeos ---
  function trofeos(ps) {
    const { call } = ps;
    function trophyLevel() {
      return {
        title: 'Colección de trofeos',
        big: true,
        empty: ps.summary.hasKey ? 'Todavía no hay datos de logros. Se cargan solos en unos minutos.' : 'Para ver tus logros, conecta tu Steam: Ajustes → Cuentas → Conectar Steam.',
        head: () =>
          `<span class="p3-head-av"${ps.profile.avatar ? ` style="background-image:url('${esc(ps.profile.avatar)}')"` : ''}></span><b>${esc(ps.profile.name || 'Jugador')}</b>${
            ps.summary.hasKey ? `<em>Logros: ${ps.summary.done || 0} de ${ps.summary.total || 0}</em>` : ''
          }`,
        build: () =>
          ps.games
            .filter((g) => trophiesOf(ps, g) && trophiesOf(ps, g).total)
            .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
            .map((g) => {
              const tp = trophiesOf(ps, g);
              const plat = U.isComplete(tp); // 100 %: trofeo de platino
              return { img: icon0(g), wide: true, gameId: g.id, title: g.name, desc: plat ? `Platino  ·  100 %  ·  ${tp.done} de ${tp.total}` : `Progreso ${Math.round((tp.done / tp.total) * 100)} %  ·  ${tp.done} de ${tp.total}`, bar: tp.done / tp.total, badge: plat ? U.completeBadge('platinum') : '', sub: true, run: () => ps.sub.open(gameTrophies(g)) };
            }),
      };
    }
    function gameTrophies(g) {
      const lv = {
        title: g.name,
        big: true,
        rows: [],
        empty: 'Cargando…',
        head: () => {
          const tp = trophiesOf(ps, g);
          const plat = U.isComplete(tp);
          return `<span class="p3-head-ic" data-game-current="${esc(g.id)}"${icon0(g) ? ` style="background-image:url('${esc(icon0(g))}')"` : ''}></span><b>${esc(g.name)}</b>${tp && tp.total ? `<em${plat ? ' class="nh-done-text plat"' : ''}>${plat ? `${U.completeBadge('platinum')} Platino  ·  ` : ''}${tp.done} de ${tp.total}  ·  ${Math.round((tp.done / tp.total) * 100)} %</em>` : ''}`;
        },
        async load(self) {
          const res = (await call('getAchievements', g.appId)) || { status: 'error' };
          if (ps.sub.cur() !== self) return;
          if (res.status !== 'ok') {
            self.empty = U.achievementMessage(res);
            return ps.sub.paint();
          }
          self.rows = U.withSetHeads(U.sortAchievements(res.list)).map((a) => {
            if (a.sep) return { sep: true, title: a.name, value: `${a.done} / ${a.total}` };
            const t = U.achievementTexts(a);
            return { img: a.done ? a.icon : a.iconGray || a.icon, title: t.name, desc: t.description, value: a.done ? t.date : 'Bloqueado', dim: !a.done };
          });
          self.empty = 'Este juego no tiene logros.';
          ps.sub.paint();
        },
      };
      return lv;
    }
    function openTrophiesOf(g) {
      if (ps.mode === 'opts') ps.opciones.close();
      ps.sub.open(trophyLevel());
      if (!g) return;
      ps.sub.open(gameTrophies(g));
    }
    return { level: trophyLevel, openOf: openTrophiesOf };
  }

  // ---------- Menú de opciones (el triángulo → tecla O) ----------
  function menuDeOpciones(ps) {
    const { $, $$, ctx } = ps;
    let opts = null;
    function showOpts(list, sel = 0) {
      opts = { list, sel };
      ps.mode = 'opts';
      const el = $('.p3-opts');
      $('.p3-opts-list').innerHTML = list.map((o, i) => `<div class="p3-opt${o.on ? ' on' : ''}" data-i="${i}">${esc(o.label)}</div>`).join('');
      $$('.p3-opt', el).forEach((b) => {
        b.addEventListener('mouseenter', () => setOpt(Number(b.dataset.i)));
        b.addEventListener('click', () => chooseOpt(Number(b.dataset.i)));
      });
      if (el.hidden) ctx.sound('option');
      el.hidden = false;
      el.classList.remove('in');
      el.offsetWidth;
      el.classList.add('in');
      setOpt(sel);
      ps.paintHints();
    }
    function setOpt(i) {
      if (!opts) return;
      opts.sel = (i + opts.list.length) % opts.list.length;
      $$('.p3-opt').forEach((b) => b.classList.toggle('sel', Number(b.dataset.i) === opts.sel));
    }
    function closeOpts() {
      opts = null;
      $('.p3-opts').hidden = true;
      if (ps.mode === 'opts') ps.mode = 'xmb';
      ps.paintHints();
    }
    function chooseOpt(i) {
      const o = opts && opts.list[i];
      closeOpts();
      if (o && o.run) o.run();
    }
    $('.p3-opts').addEventListener('pointerdown', (e) => e.target === e.currentTarget && closeOpts());
    function key(k) {
      if (k === 'ArrowDown') setOpt(opts.sel + 1);
      else if (k === 'ArrowUp') setOpt(opts.sel - 1);
      else if (k === 'Enter' || k === ' ') chooseOpt(opts.sel);
      else if (k === 'Escape' || k === 'Backspace' || k === 'o' || k === 'O' || k === 'ArrowLeft') closeOpts();
    }
    return { key, show: showOpts, close: closeOpts, wheel: (d) => setOpt(opts.sel + d) };
  }

  // ---------- Información del juego ----------
  function infoDelJuego(ps) {
    const { $ } = ps;
    function openInfo(g) {
      const tp = trophiesOf(ps, g);
      const type = { steam: 'Steam', exe: 'Programa', shortcut: 'Acceso directo', url: 'Otro launcher', minecraft: 'Launcher de Minecraft', emulator: 'Emulador' }[g.type] || '—';
      const row = (l, v) => (v ? `<div class="p3-inf-r"><span>${esc(l)}</span><b>${esc(v)}</b></div>` : '');
      const el = $('.p3-info');
      el.dataset.gameCurrent = g.id;
      el.innerHTML = `<div class="p3-inf-box">
        <div class="p3-inf-head"><span class="p3-inf-ic"${icon0(g) ? ` style="background-image:url('${esc(icon0(g))}')"` : ''}></span><b>Información</b></div>
        <div class="p3-inf-rows">
          ${row('Título', g.name)}
          ${row('Tipo', type)}
          ${row('Tiempo de juego', U.hours(g.playtimeMin) || 'Todavía no lo juegas')}
          ${row('Última vez', g.lastPlayed ? U.ago(g.lastPlayed) : 'Nunca')}
          ${g.hasAch && U.isComplete(tp) ? `<div class="p3-inf-r"><span>Logros</span><b class="nh-done-text plat">${U.completeBadge('platinum')} Platino · ${tp.done} de ${tp.total} (100 %)</b></div>` : g.type === 'steam' ? row('Logros', tp && tp.total ? `${tp.done} de ${tp.total} (${Math.round((tp.done / tp.total) * 100)} %)` : ps.summary.hasKey ? 'Sin datos todavía' : 'Conecta tu Steam para verlos') : ''}
          ${g.appId && g.type === 'steam' ? row('Número en Steam', g.appId) : ''}
        </div>
        <div class="p3-inf-desc">${esc(g.description || 'Sin descripción. Puedes escribir una con clic derecho → Editar descripción.')}</div>
        <div class="p3-inf-foot"><span><kbd>Esc</kbd> Volver</span></div></div>`;
      el.hidden = false;
      ps.mode = 'info';
      ps.paintHints();
    }
    function closeInfo() {
      $('.p3-info').hidden = true;
      ps.mode = 'xmb';
      ps.paintHints();
    }
    $('.p3-info').addEventListener('click', () => ps.mode === 'info' && closeInfo());
    return { open: openInfo, close: closeInfo };
  }

  // ---------- Pregunta (Sí / No), como la de la PS3 ----------
  function pregunta(ps) {
    const { $, $$, call } = ps;
    let dlg = null;
    function ask(message, onYes) {
      const prev = ps.mode;
      dlg = { sel: 1, onYes, prev };
      ps.mode = 'dlg';
      $('.p3-dlg-msg').textContent = message;
      $('.p3-dlg-btns').innerHTML = '<button class="p3-dlg-b" data-y="1">Sí</button><button class="p3-dlg-b" data-y="0">No</button>';
      $$('.p3-dlg-b').forEach((b, i) => {
        b.addEventListener('mouseenter', () => setDlg(i));
        b.addEventListener('click', () => answer(b.dataset.y === '1'));
      });
      $('.p3-dlg').hidden = false;
      setDlg(1);
    }
    function setDlg(i) {
      dlg.sel = (i + 2) % 2;
      $$('.p3-dlg-b').forEach((b, j) => b.classList.toggle('sel', j === dlg.sel));
    }
    function answer(yes) {
      const d = dlg;
      dlg = null;
      $('.p3-dlg').hidden = true;
      ps.mode = d.prev;
      if (yes) d.onYes();
    }
    function confirmQuit() {
      ask('¿Desea apagar el sistema?', () => call('runMenu', 'quit'));
    }
    function key(k) {
      if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown') setDlg(dlg.sel + 1);
      else if (k === 'Enter' || k === ' ') answer(dlg.sel === 0);
      else if (k === 'Escape' || k === 'Backspace') answer(false);
    }
    return { key, ask, confirmQuit };
  }

  // ---------- Abrir un juego: "gameboot" y "Jugando a…" ----------
  function pantallaJugando(ps) {
    const { $, api, ctx, root, call } = ps;
    const nowPlaying = U.nowPlaying($('.p3-playing'), api, ctx.toast);
    let playTimer = null;
    async function startGame(g) {
      if (!g || ps.mode === 'gameboot' || ps.mode === 'playing') return;
      const prev = ps.mode;
      ps.mode = 'gameboot';
      ps.opciones.close();
      ps.detalle.hide();
      const res = await api.launch(g.id);
      if (!res || !res.ok) {
        ps.mode = prev === 'opts' ? 'xmb' : prev;
        ctx.sound('error');
        return ctx.toast(`No se pudo abrir: ${(res && res.error) || 'error desconocido'}`);
      }
      ctx.sound('gameboot');
      root.classList.add('gameboot');
      const gb = $('.p3-gb');
      gb.classList.remove('go');
      gb.offsetWidth;
      gb.classList.add('go');
      ps.fondo.tweenW('boom', 1, 1100, (k) => k * k);
      ps.fondo.tweenW('spark', 1, 900);
      await wait(1250);
      ps.fondo.tweenW('boom', 0, 900);
      ps.fondo.tweenW('spark', 0, 900);
      await wait(1050);
      showPlaying(g);
      root.classList.remove('gameboot');
      gb.classList.remove('go');
    }
    function showPlaying(g) {
      ps.mode = 'playing';
      const p = $('.p3-playing');
      const icn = $('.p3-play-icon');
      icn.style.backgroundImage = icon0(g) ? `url("${icon0(g)}")` : '';
      icn.textContent = icon0(g) ? '' : g.name;
      $('.p3-play-name').textContent = g.name;
      p.hidden = false;
      p.classList.remove('leave');
      document.body.classList.add('playing');
      root.classList.add('is-playing');
      nowPlaying.start();
      const started = Date.now();
      const upd = () => {
        const s = Math.floor((Date.now() - started) / 1000);
        const hh = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        $('.p3-play-time').textContent = hh ? `${hh}:${pad2(m)}:${pad2(s % 60)}` : `${m}:${pad2(s % 60)}`;
      };
      upd();
      clearInterval(playTimer);
      playTimer = setInterval(upd, 1000);
    }
    async function endPlaying(reason) {
      if (ps.mode !== 'playing') return;
      nowPlaying.stop();
      clearInterval(playTimer);
      document.body.classList.remove('playing');
      root.classList.remove('is-playing');
      ps.fondo.resetClock();
      const p = $('.p3-playing');
      p.classList.add('leave');
      await wait(400);
      p.hidden = true;
      ps.mode = ps.sub.isOpen() ? 'sub' : 'xmb';
      ps.detalle.focusChanged();
      ps.paintHints();
      if (reason === 'not-started') ctx.toast('No se detectó que el juego abriera');
    }
    $('[data-p="stop"]').addEventListener('click', () => {
      call('dismissPlaying');
      endPlaying('manual');
    });
    return {
      start: startGame,
      end: endPlaying,
      key(k) {
        if (k === 'Enter') $('[data-p="stop"]').click();
      },
      dispose() {
        clearInterval(playTimer);
        nowPlaying.dispose();
      },
    };
  }

  // ---------- Encendido ----------
  function encendido(ps) {
    const { ctx, root } = ps;
    let bootDone = false;
    let bootTimer = 0;
    function finishBoot(skipped) {
      if (bootDone) return;
      bootDone = true;
      clearTimeout(bootTimer);
      root.classList.remove('booting');
      if (skipped) {
        ps.fondo.W.boot = 1;
        ps.fondo.W.spark = 0;
      }
      ps.mode = 'xmb';
      ps.paintHints();
      ps.detalle.focusChanged();
    }
    function boot() {
      const s = ps.ss();
      const short = s.intros === false || (ctx.hasAsset && ctx.hasAsset('intro'));
      root.classList.add('booting');
      if (short) {
        ps.fondo.W.boot = 1;
        bootTimer = setTimeout(() => finishBoot(false), 250);
        return;
      }
      // la ola aparece con un brillo de destellos, después el menú
      ps.fondo.W.boot = 0;
      ps.fondo.W.spark = 1.2;
      ps.fondo.tweenW('boot', 1, 2600, (k) => k * k * (3 - 2 * k));
      setTimeout(() => !bootDone && ps.fondo.tweenW('spark', 0, 1800), 900);
      bootTimer = setTimeout(() => finishBoot(false), 2500);
    }
    return { boot, finish: finishBoot, dispose: () => clearTimeout(bootTimer) };
  }
})();
