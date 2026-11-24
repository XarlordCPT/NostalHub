// Letras de canciones desde LRCLIB (https://lrclib.net): gratis, sin cuenta ni clave. Spotify no deja leer sus letras.
// Se manda solo el nombre de la canción, el artista, el álbum y la duración. Muchas vienen sincronizadas (LRC: la hora
// de cada línea), y así la ventana de la letra marca la línea que se está cantando.
//
// buscar({ title, artist, album, durationMs }) →
//   { status: 'ok', synced: [{ t, text }] | null, plain: 'texto' }   (synced: t en ms; null si la letra no trae tiempos)
//   { status: 'instrumental' } | { status: 'none' } | { status: 'error', message }

const API = 'https://lrclib.net/api';
const MARGEN_S = 3; // otra versión (en vivo, remix) dura distinto: solo se acepta la que dura casi lo mismo
const GUARDA_MS = 6 * 60 * 60 * 1000; // lo encontrado (o no) se guarda unas horas: no se pregunta de nuevo
const cache = new Map(); // clave → { at, value }

// "[01:23.45] Texto" → [{ t: 83450, text: 'Texto' }]. Una línea puede traer varias horas ("[00:10.00][01:10.00] Coro").
function parseLrc(lrc) {
  const out = [];
  for (const raw of String(lrc || '').split(/\r?\n/)) {
    const times = [...raw.matchAll(/\[(\d+):(\d+(?:[.:]\d+)?)\]/g)];
    if (!times.length) continue;
    const text = raw.replace(/\[[^\]]*\]/g, '').trim();
    for (const m of times) out.push({ t: Math.round((Number(m[1]) * 60 + Number(m[2].replace(':', '.'))) * 1000), text });
  }
  return out.sort((a, b) => a.t - b.t);
}

// Para buscar de nuevo si no aparece tal cual: sin "(feat. …)", " - Remastered 2011"… y con el primer artista
const limpiarTitulo = (t) => String(t || '').replace(/\s*[([](feat\.?|ft\.?|with|con)\s[^)\]]*[)\]]/gi, '').replace(/\s+-\s+.*(remaster|version|versión|live|en vivo|edit|mix).*$/i, '').trim();
const primerArtista = (a) => String(a || '').split(/\s*(?:,|&|\bfeat\.?|\bft\.?|\by\b|\bx\b)\s*/i)[0].trim();

function resultado(r) {
  if (r.instrumental) return { status: 'instrumental' };
  const synced = r.syncedLyrics ? parseLrc(r.syncedLyrics) : [];
  const plain = String(r.plainLyrics || '').trim() || synced.map((l) => l.text).join('\n');
  if (!synced.length && !plain) return null;
  return { status: 'ok', synced: synced.length ? synced : null, plain };
}

class Letras {
  // fetch: el de Node (en las pruebas, uno falso). agente: cómo se presenta NostalHub ante LRCLIB (lo piden).
  constructor({ fetch: f = globalThis.fetch, agente = 'NostalHub', log = () => {} } = {}) {
    this.fetch = f;
    this.agente = agente;
    this.log = log;
  }

  async pedir(ruta, q) {
    const url = `${API}/${ruta}?${new URLSearchParams(q)}`;
    const res = await this.fetch(url, { headers: { 'User-Agent': this.agente, 'Lrclib-Client': this.agente }, signal: AbortSignal.timeout(10000) });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`LRCLIB respondió ${res.status}`);
    return res.json();
  }

  async buscar({ title, artist, album, durationMs } = {}) {
    title = String(title || '').trim();
    artist = String(artist || '').trim();
    if (!title) return { status: 'none' };
    const dur = durationMs > 0 ? Math.round(durationMs / 1000) : null;
    const key = `${title}\u0000${artist}\u0000${dur || ''}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < GUARDA_MS) return hit.value;
    let value;
    try {
      value = await this.buscarSinGuardar(title, artist, album, dur);
    } catch (e) {
      this.log(`letra: ${e.message}`);
      return { status: 'error', message: 'No se pudo cargar la letra (¿sin internet?)' }; // esto no se guarda: se reintenta
    }
    cache.set(key, { at: Date.now(), value });
    return value;
  }

  async buscarSinGuardar(title, artist, album, dur) {
    // 1) Tal cual (lo más exacto: LRCLIB elige la versión por la duración)
    if (artist && dur) {
      const r = await this.pedir('get', { track_name: title, artist_name: artist, album_name: album || '', duration: dur });
      const v = r && resultado(r);
      if (v) return v;
    }
    // 2) Búsqueda: con el título limpio y el primer artista, y solo de la misma duración (± 3 s)
    const lista = (await this.pedir('search', { track_name: limpiarTitulo(title) || title, artist_name: primerArtista(artist) || artist })) || [];
    const parecidas = lista.filter((r) => !dur || Math.abs(Number(r.duration) - dur) <= MARGEN_S);
    const mejor = parecidas.find((r) => r.syncedLyrics) || parecidas.find((r) => r.plainLyrics || r.instrumental);
    return (mejor && resultado(mejor)) || { status: 'none' };
  }
}

module.exports = { Letras, parseLrc, limpiarTitulo, primerArtista, _cache: cache };
