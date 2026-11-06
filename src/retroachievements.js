// RetroAchievements: lee tus logros de los juegos de emulador. El emulador es el que los entrega (con tu cuenta
// iniciada ahí); NostalHub solo los muestra. Usuario y clave en %APPDATA%\NostalHub\retroachievements.json:
// la clave nunca se manda a la interfaz ni se escribe en los registros.

const fs = require('fs');
const path = require('path');

const API = 'https://retroachievements.org/API';
const MEDIA = 'https://media.retroachievements.org';
const LIST_MAX_AGE_MS = 7 * 24 * 3600 * 1000; // la lista de juegos casi no cambia y es grande: se guarda
const TOTAL_MAX_AGE_MS = 6 * 3600 * 1000;
const STEP_MS = 400; // entre consultas seguidas, para no abusar

// "Dragon Ball Z: Budokai 2" y "Dragon Ball Z - Budokai 2" tienen que coincidir
function normalize(title) {
  return String(title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '');
}

// Copa según los puntos del logro (RetroAchievements no los separa en bronce, plata y oro)
function tierOf(points) {
  return points >= 25 ? 'gold' : points >= 10 ? 'silver' : 'bronze';
}

class RetroAchievements {
  constructor({ dataDir, log, fetchFn }) {
    this.file = path.join(dataDir, 'retroachievements.json');
    this.cacheDir = path.join(dataDir, 'cache', 'retroachievements');
    this.totalsFile = path.join(this.cacheDir, 'totales.json');
    this.log = log || (() => {});
    this.fetch = fetchFn || ((...a) => fetch(...a));
    this.cfg = this.read(this.file) || {};
    this.totals = this.read(this.totalsFile) || {};
    this.seen = null; // logros ya vistos, para avisar solo los nuevos
    this.live = new Set(); // logros ya avisados por el registro del emulador
  }

  read(file) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return null;
    }
  }
  write(file, data) {
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(data), 'utf8');
    } catch (e) {
      this.log(`no se pudo guardar ${path.basename(file)}: ${e.message}`);
    }
  }

  get connected() {
    return !!(this.cfg.user && this.cfg.key);
  }
  peek() {
    return { connected: this.connected, user: this.cfg.user || null };
  }

  // La clave va en la dirección (así lo pide su API): los errores nunca incluyen la dirección
  async api(name, params, creds = this.cfg) {
    const q = new URLSearchParams({ ...params, y: creds.key });
    const res = await this.fetch(`${API}/API_${name}.php?${q}`, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'NostalHub' } });
    if (!res.ok) {
      const err = new Error(`RetroAchievements respondió ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  // Guarda la cuenta solo si funciona
  async connect(userArg, keyArg) {
    const user = String(userArg || '').trim();
    const key = String(keyArg || '').trim();
    if (!user) return { ok: false, message: 'Falta tu nombre de usuario de RetroAchievements.' };
    if (!/^[A-Za-z0-9]{20,64}$/.test(key)) return { ok: false, message: 'Esa no parece la Web API Key. Cópiala de nuevo desde Settings en RetroAchievements.' };
    try {
      const p = await this.api('GetUserProfile', { u: user }, { key });
      if (!p || !p.User) return { ok: false, message: 'No se encontró ese usuario. Revisa cómo está escrito.' };
      this.cfg = { user: p.User, key };
      this.write(this.file, this.cfg);
      this.totals = {};
      return { ok: true, user: p.User };
    } catch (e) {
      if (e.status === 401 || e.status === 403) return { ok: false, message: 'RetroAchievements no aceptó la clave. Cópiala de nuevo.' };
      return { ok: false, message: 'No se pudo conectar con RetroAchievements. Revisa tu internet.' };
    }
  }
  disconnect() {
    this.cfg = {};
    this.totals = {};
    this.seen = null;
    try {
      fs.rmSync(this.file, { force: true });
      fs.rmSync(this.totalsFile, { force: true });
    } catch {}
  }

  // ---------- Reconocer los juegos ----------
  async gameList(consoleId) {
    const file = path.join(this.cacheDir, `consola-${consoleId}.json`);
    const saved = this.read(file);
    if (saved && Date.now() - saved.t < LIST_MAX_AGE_MS) return saved.games;
    try {
      const raw = await this.api('GetGameList', { i: consoleId, f: 1 });
      const games = (Array.isArray(raw) ? raw : []).map((g) => ({ id: g.ID, title: g.Title }));
      this.write(file, { t: Date.now(), games });
      return games;
    } catch (e) {
      this.log(`no se pudo bajar la lista de juegos: ${e.message}`);
      return saved ? saved.games : [];
    }
  }

  // El ID de RetroAchievements de un juego, por su nombre (null si no hay ninguno igual)
  async findGame(name, consoleId) {
    const want = normalize(name);
    const list = await this.gameList(consoleId);
    for (const g of list) {
      if (String(g.title).startsWith('~')) continue; // ~Hack~, ~Demo~…
      if (String(g.title).split('|').some((t) => normalize(t) === want)) return g.id;
    }
    return null;
  }

  // Lo último que jugaste según RetroAchievements: cuando cambia, es el juego que está abierto
  async lastPlayed() {
    const list = await this.api('GetUserRecentlyPlayedGames', { u: this.cfg.user, c: 1 });
    const g = Array.isArray(list) && list[0];
    return g ? { id: g.GameID, consoleId: g.ConsoleID, at: g.LastPlayed } : null;
  }

  // ---------- Logros ----------
  key(raId) {
    return `ra-${raId}`;
  }
  setTotal(key, done, total) {
    this.totals[key] = { done, total, t: Date.now() };
    this.write(this.totalsFile, this.totals);
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

  // La misma forma que los logros de Steam (src/steamweb.js), para que las pantallas sirvan igual
  async achievements(key) {
    if (!this.connected) return { status: 'no-key', list: [] };
    try {
      const d = await this.api('GetGameInfoAndUserProgress', { g: String(key).replace(/^ra-/, ''), u: this.cfg.user });
      const items = Object.values((d && d.Achievements) || {}).sort((a, b) => (a.DisplayOrder || 0) - (b.DisplayOrder || 0));
      if (!items.length) return { status: 'none', list: [] };
      const players = Number(d.NumDistinctPlayers) || 0;
      const list = items.map((a) => {
        const when = a.DateEarnedHardcore || a.DateEarned;
        return {
          id: String(a.ID),
          name: a.Title,
          description: a.Description || '',
          hidden: false,
          icon: `${MEDIA}/Badge/${a.BadgeName}.png`,
          iconGray: `${MEDIA}/Badge/${a.BadgeName}_lock.png`,
          points: Number(a.Points) || 0,
          done: !!when,
          unlockTime: when ? Date.parse(`${String(when).replace(' ', 'T')}Z`) : null,
          percent: players ? (Number(a.NumAwarded) / players) * 100 : null,
        };
      });
      const done = list.filter((a) => a.done).length;
      this.setTotal(key, done, list.length);
      return { status: 'ok', list, done, total: list.length };
    } catch (e) {
      return { status: 'error', message: e.message, list: [] };
    }
  }

  // Revisa los juegos en segundo plano (sin repetir los recientes)
  async refreshTotals(keys, onProgress) {
    if (!this.connected || this.refreshing) return;
    this.refreshing = true;
    try {
      for (const key of keys) {
        const prev = this.totals[key];
        if (prev && Date.now() - prev.t < TOTAL_MAX_AGE_MS) continue;
        await this.achievements(key);
        if (onProgress) onProgress();
        await new Promise((r) => setTimeout(r, STEP_MS));
      }
    } finally {
      this.refreshing = false;
    }
  }

  // Logros nuevos desde la última vez que se preguntó. La primera vez solo anota los que ya había.
  async newUnlocks() {
    const list = await this.api('GetUserRecentAchievements', { u: this.cfg.user, m: 1440 });
    const items = Array.isArray(list) ? list : [];
    const first = !this.seen;
    if (first) this.seen = new Set();
    const fresh = items.filter((a) => !this.seen.has(a.AchievementID));
    fresh.forEach((a) => this.seen.add(a.AchievementID));
    if (first) return [];
    return fresh
      .filter((a) => !this.live.has(Number(a.AchievementID)))
      .map((a) => this.notice(this.key(a.GameID), { name: a.Title, points: Number(a.Points) || 0, icon: `${MEDIA}/Badge/${a.BadgeName}.png`, gameName: a.GameTitle }));
  }

  // Un logro que el emulador acaba de escribir en su registro: se avisa al tiro y el repaso periódico ya no lo repite.
  // list: los logros del juego (para el ícono y los puntos); si todavía no llegan, sale solo con el nombre.
  liveUnlock(key, id, title, list, gameName) {
    const n = Number(id);
    if (this.live.has(n) || (this.seen && this.seen.has(n))) return null;
    this.live.add(n);
    const a = (list || []).find((x) => x.id === String(n));
    return this.notice(key, { name: a ? a.name : title, points: a ? a.points : 0, icon: a ? a.icon : null, gameName });
  }

  // Suma el logro al total del juego y arma el aviso
  notice(key, { name, points, icon, gameName }) {
    const t = this.totals[key];
    if (t && t.done < t.total) this.setTotal(key, t.done + 1, t.total);
    const now = this.totals[key];
    return { name, gamerscore: points, tier: tierOf(points), icon, completed: !!(now && now.total && now.done >= now.total), gameName };
  }
}

module.exports = { RetroAchievements, normalize, tierOf };
