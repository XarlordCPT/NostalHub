// Arma archivos binarios de Steam (KeyValues): los de logros (UserGameStats*.bin) y shortcuts.vdf.
// objeto → bloque; texto → 0x01; número entero → 0x02. Así las pruebas no necesitan tu Steam.
function kvBinario(obj) {
  const partes = [];
  const texto = (s) => Buffer.concat([Buffer.from(String(s), 'utf8'), Buffer.from([0])]);
  const bloque = (o) => {
    for (const [k, v] of Object.entries(o)) {
      if (v && typeof v === 'object') {
        partes.push(Buffer.from([0x00]), texto(k));
        bloque(v);
        partes.push(Buffer.from([0x08]));
      } else if (typeof v === 'number') {
        const n = Buffer.alloc(4);
        n.writeInt32LE(v);
        partes.push(Buffer.from([0x02]), texto(k), n);
      } else partes.push(Buffer.from([0x01]), texto(k), texto(v));
    }
  };
  bloque(obj);
  partes.push(Buffer.from([0x08]));
  return Buffer.concat(partes);
}

module.exports = { kvBinario };
