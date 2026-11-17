// Nivela el volumen de un sonido .wav (PCM de 16 bits, el formato normal): si su punto más fuerte quedó bajo, devuelve una
// copia con todo amplificado para que llegue cerca del máximo. Se usa con los logro.wav de cada consola: uno bajito (la
// PS4 traía uno al 7 %) casi no se oía encima del juego. Los archivos del usuario nunca se tocan: la copia va al cache.

const FLOJO = 0.5; // si el pico llega a la mitad del máximo, se deja tal cual
const META = 0.9; // a cuánto del máximo se lleva el pico
const TOPE = 12; // nunca se amplifica más que esto (para no levantar demasiado el ruido de fondo)

// buf: el archivo completo. Devuelve { buffer, ganancia, pico } con la copia amplificada, o null si no hace falta o no se
// puede (no es un .wav PCM de 16 bits).
function nivelarWav(buf, opts = {}) {
  const meta = opts.meta || META;
  const tope = opts.tope || TOPE;
  if (!Buffer.isBuffer(buf) || buf.length < 44 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') return null;
  let fmt = null;
  let data = null;
  for (let i = 12; i + 8 <= buf.length; ) {
    const id = buf.toString('ascii', i, i + 4);
    const size = buf.readUInt32LE(i + 4);
    if (id === 'fmt ') fmt = { formato: buf.readUInt16LE(i + 8), bits: buf.readUInt16LE(i + 22) };
    if (id === 'data') {
      data = { inicio: i + 8, largo: Math.min(size, buf.length - i - 8) };
      break;
    }
    i += 8 + size + (size % 2);
  }
  if (!fmt || !data || fmt.formato !== 1 || fmt.bits !== 16) return null;
  const n = Math.floor(data.largo / 2);
  let pico = 0;
  for (let k = 0; k < n; k++) pico = Math.max(pico, Math.abs(buf.readInt16LE(data.inicio + k * 2)));
  if (!pico || pico >= FLOJO * 32767) return null;
  const ganancia = Math.min(tope, (meta * 32767) / pico);
  const out = Buffer.from(buf);
  for (let k = 0; k < n; k++) {
    const v = Math.round(buf.readInt16LE(data.inicio + k * 2) * ganancia);
    out.writeInt16LE(Math.max(-32768, Math.min(32767, v)), data.inicio + k * 2);
  }
  return { buffer: out, ganancia, pico };
}

module.exports = { nivelarWav, FLOJO, META, TOPE };
