// Nivelar el volumen de los logro.wav: uno bajito se amplifica (sin pasarse) y uno fuerte se deja tal cual.
const test = require('node:test');
const assert = require('node:assert/strict');
const { nivelarWav, TOPE } = require('../../src/sonido');

// Un .wav PCM de 16 bits, mono, con una onda de la amplitud pedida
function wav(amplitud, muestras = 4800) {
  const data = Buffer.alloc(muestras * 2);
  for (let i = 0; i < muestras; i++) data.writeInt16LE(Math.round(amplitud * Math.sin(i / 10)), i * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0, 'ascii');
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8, 'ascii');
  h.write('fmt ', 12, 'ascii');
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(48000, 24);
  h.writeUInt32LE(96000, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36, 'ascii');
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}
const pico = (buf) => {
  let p = 0;
  for (let i = 44; i < buf.length; i += 2) p = Math.max(p, Math.abs(buf.readInt16LE(i)));
  return p;
};

test('un logro.wav bajito (como el de la PS4, al 7 %) se amplifica cerca del máximo', () => {
  const r = nivelarWav(wav(2182));
  assert.ok(r);
  assert.ok(pico(r.buffer) > 0.75 * 32767, `pico ${pico(r.buffer)}`); // (al 80 %: lo limita el tope)
  assert.equal(r.buffer.length, wav(2182).length);
});

test('uno muy bajito no se amplifica más que el tope; uno fuerte o que no es WAV PCM se deja igual', () => {
  const r = nivelarWav(wav(300));
  assert.ok(Math.abs(r.ganancia - TOPE) < 1e-9);
  assert.equal(nivelarWav(wav(30000)), null);
  assert.equal(nivelarWav(Buffer.from('no es un wav, es otra cosa cualquiera de más de cuarenta y cuatro bytes')), null);
  assert.equal(nivelarWav(Buffer.alloc(0)), null);
});
