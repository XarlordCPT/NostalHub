// Datos de Steam por internet (necesita tu clave de API): perfil, logros y amigos.
// La clave va en %APPDATA%\NostalHub\steam-api-key.txt (ver MANUAL.md).

const fs = require('fs');
const path = require('path');

const API = 'https://api.steampowered.com';
const KEY_TEMPLATE = [
  '# Pega tu clave de API de Steam en la línea de abajo (32 letras y números) y guarda.',
  '# Se consigue gratis en https://steamcommunity.com/dev/apikey  (en "Domain Name" puedes poner: localhost)',
  '# No la compartas con nadie.',
  '',
  '',
].join('\r\n');

class SteamWeb {
  constructor(dataDir) {
    this.keyFile = path.join(dataDir, 'steam-api-key.txt');
    this.cacheFile = path.join(dataDir, 'cache', 'logros.json');
    this.memo = new Map(); // respuestas recientes { url -> { t, data } }
    this.totals = this.loadTotals();
  }

  // ---------- Clave ----------
  ensureKeyFile() {
    if (!fs.existsSync(this.keyFile)) fs.writeFileSync(this.keyFile, KEY_TEMPLATE, 'utf8');
    return this.keyFile;
  }

  get key() {
    try {
      const txt = fs.readFileSync(this.keyFile, 'utf8');
      const m = txt.match(/^\s*([0-9A-F]{32})\s*$/im);
      return m ? m[1] : null;
    } catch {
      return null;
    }
  }

  // Guarda la clave pegada en la app, después de probarla con Steam.
  // Devuelve { ok, name, warning } o { ok: false, message }
  async saveKey(raw, steamId) {
    const key = String(raw || '')
      .trim()
      .replace(/^(clave|key)\s*[:=]\s*/i, '');
    if (!/^[0-9A-F]{32}$/i.test(key)) {
      return { ok: false, message: 'La clave tiene 32 letras y números (de la A a la F y del 0 al 9). Revisa que la copiaste completa.' };
    }
    const id = steamId || '76561197960435530'; // si no se encontró tu usuario, se prueba con un perfil público
    let data = null;
    try {
      const res = await fetch(`${API}/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${id}`, { signal: AbortSignal.timeout(15000) });
      if (res.status === 401 || res.status === 403) return { ok: false, message: 'Steam dice que esa clave no es válida. Vuelve a copiarla desde la página de Steam.' };
      if (!res.ok) return { ok: false, message: `Steam respondió con un error (${res.status}). Intenta de nuevo en un rato.` };
      data = await res.json().catch(() => null);
    } catch {
      return { ok: false, message: 'No se pudo conectar con Steam. Revisa tu internet e intenta de nuevo.' };
    }
    fs.mkdirSync(path.dirname(this.keyFile), { recursive: true });
    fs.writeFileSync(this.keyFile, KEY_TEMPLATE + key + '\r\n', 'utf8');
    this.memo.clear();
    const p = steamId && data && data.response && data.response.players && data.response.players[0];
    return {
      ok: true,
      name: p ? p.personaname : null,
      // 3 = perfil público. Si es privado, Steam no entrega los logros
      warning: p && p.communityvisibilitystate !== 3 ? 'Tu perfil de Steam es privado, así que Steam no va a mostrar tus logros. En Steam → tu perfil → Editar perfil → Privacidad, pon "Detalles de juegos" en Público.' : null,
    };
  }

  // ---------- Peticiones ----------
  async get(url, maxAgeMs = 10 * 60 * 1000) {
    const hit = this.memo.get(url);
    if (hit && Date.now() - hit.t < maxAgeMs) return hit.data;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok && !(data && data.playerstats)) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    this.memo.set(url, { t: Date.now(), data });
    return data;
  }

  // ---------- Perfil ----------
  async profile(steamId) {
    const key = this.key;
    if (!key || !steamId) return null;
    try {
      const d = await this.get(`${API}/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${steamId}`, 30 * 60 * 1000);
      const p = d && d.response && d.response.players && d.response.players[0];
      return p ? { name: p.personaname, avatar: p.avatarfull || p.avatarmedium || p.avatar, profileUrl: p.profileurl } : null;
    } catch {
      return null;
    }
  }

  // ---------- Amigos ----------
  // Devuelve { status: 'ok'|'no-key'|'private'|'error', list: [{ id, name, avatar, state, game, lastSeen, url }] }
  // ordenados como en Steam: jugando, en línea, ausentes y al final los desconectados.
  // state: 0 desconectado, 1 en línea, 2 ocupado, 3 ausente, 4 dormido, 5 y 6 en línea
  async friends(steamId) {
    const key = this.key;
    if (!key) return { status: 'no-key', list: [] };
    if (!steamId) return { status: 'error', message: 'No se encontró tu usuario de Steam', list: [] };
    let ids = [];
    try {
      const d = await this.get(`${API}/ISteamUser/GetFriendList/v1/?key=${key}&steamid=${steamId}&relationship=friend`, 10 * 60 * 1000);
      ids = ((d && d.friendslist && d.friendslist.friends) || []).map((f) => f.steamid);
    } catch (e) {
      // Steam responde 401 cuando tu lista de amigos es privada
      return { status: e.status === 401 || e.status === 403 ? 'private' : 'error', list: [] };
    }
    const list = [];
    try {
      for (let i = 0; i < ids.length; i += 100) {
        const d = await this.get(`${API}/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${ids.slice(i, i + 100).join(',')}`, 20 * 1000);
        for (const p of (d && d.response && d.response.players) || []) {
          list.push({
            id: p.steamid,
            name: p.personaname || '?',
            avatar: p.avatarfull || p.avatarmedium || p.avatar || null,
            state: Number(p.personastate) || 0,
            game: p.gameextrainfo || (p.gameid ? 'Un juego' : null),
            lastSeen: p.lastlogoff ? p.lastlogoff * 1000 : null,
            url: p.profileurl || null,
          });
        }
      }
    } catch {
      if (!list.length) return { status: 'error', list: [] };
    }
    const rank = (f) => (f.state === 0 ? 3 : f.game ? 0 : f.state === 3 || f.state === 4 ? 2 : 1);
    list.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    return { status: 'ok', list };
  }

  // ---------- Logros de un juego ----------
  // Devuelve { status: 'ok'|'no-key'|'private'|'none'|'error', list: [...], done, total }
  async achievements(appId, steamId) {
    const key = this.key;
    if (!key) return { status: 'no-key', list: [] };
    if (!steamId) return { status: 'error', message: 'No se encontró tu usuario de Steam', list: [] };
    try {
      const [schema, player, global] = await Promise.all([
        this.get(`${API}/ISteamUserStats/GetSchemaForGame/v2/?key=${key}&appid=${appId}&l=spanish`, 24 * 3600 * 1000),
        this.get(`${API}/ISteamUserStats/GetPlayerAchievements/v1/?key=${key}&steamid=${steamId}&appid=${appId}&l=spanish`, 60 * 1000).catch((e) => ({ error: e })),
        this.get(`${API}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${appId}`, 24 * 3600 * 1000).catch(() => null),
      ]);
      const defs = (schema && schema.game && schema.game.availableGameStats && schema.game.availableGameStats.achievements) || [];
      if (!defs.length) return { status: 'none', list: [] };

      const ps = player && player.playerstats;
      if (!ps || ps.success === false || player.error) {
        const msg = (ps && ps.error) || '';
        return { status: /not public|private/i.test(msg) || (player.error && player.error.status === 403) ? 'private' : 'error', message: msg, list: [] };
      }
      const mine = new Map((ps.achievements || []).map((a) => [a.apiname, a]));
      const pct = new Map(
        ((global && global.achievementpercentages && global.achievementpercentages.achievements) || []).map((a) => [a.name, Number(a.percent)])
      );
      const list = defs.map((d) => {
        const m = mine.get(d.name) || {};
        const done = Number(m.achieved) === 1;
        return {
          id: d.name,
          name: m.name || d.displayName || d.name,
          description: m.description || d.description || '',
          hidden: Number(d.hidden) === 1,
          icon: d.icon,
          iconGray: d.icongray,
          done,
          unlockTime: done && m.unlocktime ? Number(m.unlocktime) * 1000 : null,
          percent: pct.has(d.name) ? pct.get(d.name) : null,
        };
      });
      const done = list.filter((a) => a.done).length;
      this.setTotal(appId, done, list.length);
      return { status: 'ok', list, done, total: list.length };
    } catch (e) {
      return { status: 'error', message: e.message, list: [] };
    }
  }

  // ---------- Totales (para la pestaña social) ----------
  loadTotals() {
    try {
      return JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
    } catch {
      return {};
    }
  }

  setTotal(appId, done, total) {
    this.totals[appId] = { done, total, t: Date.now() };
    try {
      fs.mkdirSync(path.dirname(this.cacheFile), { recursive: true });
      fs.writeFileSync(this.cacheFile, JSON.stringify(this.totals), 'utf8');
    } catch {}
  }

  summary() {
    let done = 0;
    let total = 0;
    for (const v of Object.values(this.totals)) {
      done += v.done;
      total += v.total;
    }
    return { done, total, perGame: this.totals };
  }

  // Recorre tus juegos en segundo plano para sumar los logros (sin repetir los recientes)
  async refreshTotals(appIds, steamId, onProgress) {
    if (!this.key || !steamId || this.refreshing) return;
    this.refreshing = true;
    try {
      for (const appId of appIds) {
        const prev = this.totals[appId];
        if (prev && Date.now() - prev.t < 6 * 3600 * 1000) continue;
        const r = await this.achievements(appId, steamId);
        if (r.status === 'none') this.setTotal(appId, 0, 0);
        if (onProgress) onProgress(this.summary());
        await new Promise((res) => setTimeout(res, 300));
      }
    } finally {
      this.refreshing = false;
    }
  }
}

module.exports = { SteamWeb };
