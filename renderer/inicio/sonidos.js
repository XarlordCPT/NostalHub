/* Sonidos del menú principal: son del menú, no de la consola marcada (esos suenan recién al entrar a ella).
   Hechos con código, como los de cada consola, y con un tono distinto por estilo (VOCES). Los usa Sound.play de
   shell.js cuando no hay ninguna consola abierta. Tipos: move, select, back, page, error, border, option. */
(() => {
  let ac = null;

  // Cada estilo: forma de onda y dos alturas (grave y aguda). Si un estilo no está, usa 'estanteria'.
  const VOCES = {
    estanteria: { wave: 'sine', low: 620, high: 930, gain: 1 }, // suave y redondo, como burbujas
    clasico: { wave: 'triangle', low: 520, high: 780, gain: 0.85 },
  };

  function play(style, kind, vol = 0.6) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const v = VOCES[style] || VOCES.estanteria;
      const t = ac.currentTime;
      const note = (f, at, d, g = 0.2, f2) => {
        const o = ac.createOscillator();
        const a = ac.createGain();
        o.type = v.wave;
        o.frequency.setValueAtTime(f, t + at);
        if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + at + d);
        a.gain.setValueAtTime(0.0001, t + at);
        a.gain.exponentialRampToValueAtTime(g * vol * v.gain, t + at + 0.01);
        a.gain.exponentialRampToValueAtTime(0.0001, t + at + d);
        o.connect(a).connect(ac.destination);
        o.start(t + at);
        o.stop(t + at + d + 0.02);
      };
      const { low, high } = v;
      if (kind === 'move') note(high, 0, 0.07, 0.12, high * 1.12);
      else if (kind === 'select') (note(low, 0, 0.1, 0.18), note(high * 1.34, 0.07, 0.18, 0.16));
      else if (kind === 'back') (note(high, 0, 0.08, 0.15), note(low * 0.8, 0.06, 0.14, 0.14));
      else if (kind === 'page') note(low, 0, 0.12, 0.15, high);
      else if (kind === 'option') note(high * 1.5, 0, 0.05, 0.1);
      else if (kind === 'error' || kind === 'border') note(low * 0.35, 0, 0.12, 0.09);
    } catch {}
  }

  window.MenuSounds = { play };
})();
