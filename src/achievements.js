// Logros al instante: vigila los archivos de logros que Steam guarda en tu PC
// (Steam\appcache\stats\UserGameStats_<cuenta>_<juego>.bin) y avisa cuando aparece uno nuevo.
// Los nombres e íconos salen de UserGameStatsSchema_<juego>.bin (también de Steam, en la misma carpeta).
// No necesita internet; solo el "qué tan raro es" (para los puntos G) se pide a Steam, sin clave.

const fs = require('fs');
const path = require('path');

// ---------- Formato binario de Steam (KeyValues) ----------
function parseKV(buf) {
  let i = 0;
  const str = () => {
    const end = buf.indexOf(0, i);
    const s = buf.toString('utf8', i, end < 0 ? buf.length : end);
    i = end < 0 ? buf.length : end + 1;
    return s;
  };
  const map = () => {
    const o = {};
    while (i < buf.length) {
      const t = buf[i++];
      if (t === 0x08 || t === 0x0b) return o;
      const k = str();
      if (t === 0x00) o[k] = map();
      else if (t === 0x01) o[k] = str();
      else if (t === 0x02 || t === 0x04 || t === 0x06) (o[k] = buf.readInt32LE(i)), (i += 4);
      else if (t === 0x03) (o[k] = buf.readFloatLE(i)), (i += 4);
      else if (t === 0x07) (o[k] = buf.readBigUInt64LE(i)), (i += 8);
      else if (t === 0x0a) (o[k] = buf.readBigInt64LE(i)), (i += 8);
      else throw new Error(`tipo ${t}`);
    }
    return o;
  };
  return map();
}
function readKV(file) {
  try {
    return parseKV(fs.readFileSync(file));
  } catch {
    return null;
  }
}

// Logros desbloqueados en el archivo del jugador: Map("statId/bit" → segundos)
function unlockedOf(file) {
  const kv = readKV(file);
  const root = kv && (kv.cache || Object.values(kv)[0]);
  const out = new Map();
  if (!root || typeof root !== 'object') return out;
  for (const [statId, st] of Object.entries(root)) {
    if (!st || typeof st !== 'object' || typeof st.data !== 'number') continue;
    const times = st.AchievementTimes || {};
    for (let bit = 0; bit < 32; bit++) {
      if ((st.data >>> bit) & 1) out.set(`${statId}/${bit}`, Number(times[bit] || 0));
    }
  }
  return out;
}

// Nombres, descripciones e íconos: Map("statId/bit" → { api, name, desc, icon })
const LANGS = ['latam', 'spanish', 'english'];
function pickLang(o) {
  if (!o) return '';
  if (typeof o === 'string') return o;
  for (const l of LANGS) if (o[l]) return o[l];
  const first = Object.entries(o).find(([k, v]) => k !== 'token' && typeof v === 'string');
  return first ? first[1] : '';
}
function schemaOf(file, appId) {
  const kv = readKV(file);
  const root = kv && (kv[appId] || Object.values(kv)[0]);
  const out = new Map();
  const stats = root && root.stats;
  if (!stats) return out;
  for (const [statId, st] of Object.entries(stats)) {
    if (!st || !st.bits || (st.type !== 'ACHIEVEMENTS' && st.type !== 4 && st.type !== 'GROUPACHIEVEMENTS')) continue;
    for (const [bit, b] of Object.entries(st.bits)) {
      const d = b.display || {};
      out.set(`${statId}/${bit}`, {
        api: b.name,
        name: pickLang(d.name) || b.name,
        desc: pickLang(d.desc),
        hidden: Number(d.hidden) === 1,
        icon: d.icon ? `https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/${appId}/${d.icon}` : null,
      });
    }
  }
  return out;
}

// Puntos G según qué tan raro es (porcentaje de jugadores que lo tienen)
function gamerscore(percent) {
  if (percent == null || !isFinite(percent)) return 20;
  if (percent >= 50) return 10;
  if (percent >= 20) return 20;
  if (percent >= 10) return 30;
  if (percent >= 5) return 50;
  if (percent >= 1) return 80;
  return 100;
}

// Trofeo de PlayStation según qué tan raro es: bronce, plata u oro (el platino es por completar el juego)
function trophyTier(percent) {
  if (percent == null || !isFinite(percent)) return 'bronze';
  if (percent < 5) return 'gold';
  if (percent < 20) return 'silver';
  return 'bronze';
}

class AchievementWatcher {
  constructor({ onUnlock, log = () => {} }) {
    this.onUnlock = onUnlock;
    this.log = log;
    this.snap = new Map(); // appId → Set("statId/bit")
    this.timers = new Map();
    this.pct = new Map(); // appId → { t, map }
    this.watcher = null;
  }

  // Empieza a vigilar (steamPath y la cuenta de Steam del PC)
  start(steamPath, accountId) {
    this.stop();
    if (!steamPath || !accountId) return false;
    this.dir = path.join(steamPath, 'appcache', 'stats');
    this.account = String(accountId);
    if (!fs.existsSync(this.dir)) return false;
    this.startedAt = Date.now();
    // Foto inicial de lo que ya tienes (para no avisar logros viejos)
    try {
      for (const f of fs.readdirSync(this.dir)) {
        const m = /^UserGameStats_(\d+)_(\d+)\.bin$/i.exec(f);
        if (m && m[1] === this.account) this.snap.set(m[2], new Set(unlockedOf(path.join(this.dir, f)).keys()));
      }
    } catch {}
    try {
      this.watcher = fs.watch(this.dir, (_ev, file) => {
        const m = file && /^UserGameStats_(\d+)_(\d+)\.bin$/i.exec(String(file));
        if (!m || m[1] !== this.account) return;
        const appId = m[2];
        clearTimeout(this.timers.get(appId));
        this.timers.set(appId, setTimeout(() => this.check(appId), 350)); // Steam escribe el archivo en partes
      });
    } catch (e) {
      this.log('logros: no se pudo vigilar la carpeta', e.message);
      return false;
    }
    return true;
  }

  stop() {
    if (this.watcher) this.watcher.close();
    this.watcher = null;
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
  }

  async check(appId) {
    const file = path.join(this.dir, `UserGameStats_${this.account}_${appId}.bin`);
    const now = unlockedOf(file);
    if (!now.size && !fs.existsSync(file)) return;
    const before = this.snap.get(appId);
    this.snap.set(appId, new Set(now.keys()));
    // Sin foto anterior (juego nuevo): solo los desbloqueados hace menos de 2 minutos
    const fresh = [...now.entries()].filter(([k, t]) => (before ? !before.has(k) : t * 1000 > Math.max(this.startedAt, Date.now() - 120000)));
    if (!fresh.length) return;
    const schema = schemaOf(path.join(this.dir, `UserGameStatsSchema_${appId}.bin`), appId);
    // Solo logros (en el mismo archivo también hay contadores del juego, que no son logros)
    const real = fresh.filter(([k, t]) => (schema.size ? schema.has(k) : t > 0));
    if (!real.length) return;
    const pct = await this.percents(appId);
    // ¿Con estos ya tienes todos los del juego? (para el trofeo de platino)
    const all = (set) => schema.size > 0 && [...schema.keys()].every((k) => set.has(k));
    const completed = all(now) && !(before && all(before));
    const list = real.sort((a, b) => a[1] - b[1]);
    list.forEach(([k, t], i) => {
      const s = schema.get(k) || { api: k, name: 'Logro desbloqueado', desc: '' };
      const p = pct.get(s.api);
      this.onUnlock({ appId, id: s.api, name: s.name, description: s.desc, icon: s.icon, percent: p != null ? p : null, gamerscore: gamerscore(p), tier: trophyTier(p), completed: completed && i === list.length - 1, time: t * 1000 });
    });
  }

  // Porcentaje global de cada logro (no necesita clave; se guarda 1 día)
  async percents(appId) {
    const hit = this.pct.get(appId);
    if (hit && Date.now() - hit.t < 24 * 3600 * 1000) return hit.map;
    const map = new Map();
    try {
      const r = await fetch(`https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${appId}`, { signal: AbortSignal.timeout(1500) });
      const j = await r.json();
      for (const a of (j && j.achievementpercentages && j.achievementpercentages.achievements) || []) map.set(a.name, Number(a.percent));
    } catch {}
    this.pct.set(appId, { t: Date.now(), map });
    return map;
  }
}

module.exports = { AchievementWatcher, gamerscore, trophyTier, parseKV };
