// Contador de horas propio: guarda cada sesión de juego en una base de datos (estadisticas.db) y arma el resumen.
// Cuenta desde que existe esta función: los juegos de Steam aunque se abran por fuera (mientras NostalHub esté
// abierta) y los demás cuando se abren desde NostalHub. Mide tiempo con el juego abierto.

const MAX_GAP_MS = 3 * 60 * 1000; // si pasó más que esto entre revisiones, el PC estuvo suspendido: corta la sesión
const MIN_SESSION_MS = 30 * 1000; // abrir y cerrar al tiro no cuenta

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTHS_LONG = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

class PlayLog {
  constructor(file, log = () => {}) {
    this.log = log;
    this.cur = null; // { id, gameId, startedAt }
    this.lastTick = 0;
    try {
      const { DatabaseSync } = require('node:sqlite');
      this.db = new DatabaseSync(file);
      this.db.exec(`CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY,
        game_id TEXT NOT NULL,
        game_name TEXT NOT NULL,
        app_id TEXT,
        started_at INTEGER NOT NULL,
        ended_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS sessions_ended ON sessions (ended_at);`);
    } catch (e) {
      this.db = null;
      this.log(`no se pudo abrir la base de datos de horas: ${e.message}`);
    }
  }

  // Se llama cada ciertos segundos con el juego abierto ahora (o null)
  tick(game, now = Date.now()) {
    if (!this.db) return;
    const slept = this.lastTick && now - this.lastTick > MAX_GAP_MS;
    if (this.cur && (slept || !game || game.id !== this.cur.gameId)) this.close(slept ? this.lastTick : now);
    if (game && !this.cur) {
      const r = this.db
        .prepare('INSERT INTO sessions (game_id, game_name, app_id, started_at, ended_at) VALUES (?, ?, ?, ?, ?)')
        .run(game.id, game.name, game.appId ? String(game.appId) : null, now, now);
      this.cur = { id: Number(r.lastInsertRowid), gameId: game.id, startedAt: now };
    } else if (this.cur) {
      this.db.prepare('UPDATE sessions SET ended_at = ? WHERE id = ?').run(now, this.cur.id); // si la app se cae, se pierden segundos, no la sesión
    }
    this.lastTick = now;
  }

  close(at = Date.now()) {
    if (!this.db || !this.cur) return;
    if (at - this.cur.startedAt < MIN_SESSION_MS) this.db.prepare('DELETE FROM sessions WHERE id = ?').run(this.cur.id);
    else this.db.prepare('UPDATE sessions SET ended_at = ? WHERE id = ?').run(at, this.cur.id);
    this.cur = null;
  }

  // Lo jugado de cada juego (contado por NostalHub): Map(id del juego → { ms, last }). Incluye la sesión que va en curso.
  totals() {
    const out = new Map();
    if (!this.db) return out;
    try {
      for (const r of this.db.prepare('SELECT game_id, SUM(ended_at - started_at) AS ms, MAX(ended_at) AS last FROM sessions GROUP BY game_id').all()) out.set(r.game_id, { ms: Number(r.ms) || 0, last: Number(r.last) || 0 });
    } catch (e) {
      this.log(`no se pudieron leer las horas por juego: ${e.message}`);
    }
    return out;
  }

  dispose() {
    this.close();
    if (this.db) this.db.close();
    this.db = null;
  }

  // Desde y hasta del período, sus barras y su título. offset: 0 = el actual, -1 = el anterior…
  period(range, offset, first, now = new Date()) {
    const y = now.getFullYear();
    const m = now.getMonth();
    const day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const sameDay = (a, b) => day(a).getTime() === day(b).getTime();
    if (range === 'year') {
      const yr = y + offset;
      const buckets = MONTHS.map((label, i) => ({ label, title: `${MONTHS_LONG[i]} ${yr}`, from: new Date(yr, i, 1), to: new Date(yr, i + 1, 1), now: yr === y && i === m }));
      return { from: new Date(yr, 0, 1), to: new Date(yr + 1, 0, 1), title: String(yr), words: offset === 0 ? 'este año' : `en ${yr}`, buckets };
    }
    if (range === 'month') {
      const from = new Date(y, m + offset, 1);
      const to = new Date(y, m + offset + 1, 1);
      const count = new Date(to.getFullYear(), to.getMonth(), 0).getDate();
      const name = `${MONTHS_LONG[from.getMonth()]} ${from.getFullYear()}`;
      const buckets = Array.from({ length: count }, (_, i) => {
        const a = new Date(from.getFullYear(), from.getMonth(), i + 1);
        return { label: String(i + 1), title: `${DAYS[a.getDay()]} ${i + 1} de ${MONTHS_LONG[a.getMonth()].toLowerCase()}`, from: a, to: new Date(from.getFullYear(), from.getMonth(), i + 2), now: sameDay(a, now) };
      });
      return { from, to, title: name, words: offset === 0 ? 'este mes' : `en ${name.toLowerCase()}`, buckets };
    }
    if (range === 'all') {
      const start = first ? new Date(first) : now;
      const months = (y - start.getFullYear()) * 12 + m - start.getMonth() + 1;
      // Con más de 2 años de datos, una barra por año
      if (months > 24) {
        const buckets = [];
        for (let yr = start.getFullYear(); yr <= y; yr++) buckets.push({ label: String(yr), title: String(yr), from: new Date(yr, 0, 1), to: new Date(yr + 1, 0, 1), now: yr === y });
        return { from: buckets[0].from, to: new Date(y + 1, 0, 1), title: 'Todo', words: 'en total', buckets };
      }
      const buckets = Array.from({ length: months }, (_, i) => {
        const a = new Date(start.getFullYear(), start.getMonth() + i, 1);
        return { label: MONTHS[a.getMonth()], title: `${MONTHS_LONG[a.getMonth()]} ${a.getFullYear()}`, from: a, to: new Date(a.getFullYear(), a.getMonth() + 1, 1), now: a.getFullYear() === y && a.getMonth() === m };
      });
      return { from: buckets[0].from, to: new Date(y, m + 1, 1), title: 'Todo', words: 'en total', buckets };
    }
    // Semana de lunes a domingo
    const dow = (now.getDay() + 6) % 7;
    const from = new Date(y, m, now.getDate() - dow + 7 * offset);
    const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7);
    const last = new Date(to.getFullYear(), to.getMonth(), to.getDate() - 1);
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const a = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
      return { label: DAYS[a.getDay()], title: `${DAYS[a.getDay()]} ${a.getDate()} de ${MONTHS_LONG[a.getMonth()].toLowerCase()}`, from: a, to: new Date(a.getFullYear(), a.getMonth(), a.getDate() + 1), now: sameDay(a, now) };
    });
    const dates = `${from.getDate()} ${MONTHS[from.getMonth()]} – ${last.getDate()} ${MONTHS[last.getMonth()]} ${last.getFullYear()}`;
    return {
      from,
      to,
      title: offset === 0 ? 'Esta semana' : offset === -1 ? 'La semana pasada' : dates,
      words: offset === 0 ? 'esta semana' : offset === -1 ? 'la semana pasada' : `del ${dates}`,
      buckets,
    };
  }

  // Resumen de un período. Las sesiones que cruzan el borde (medianoche, fin de mes…) se reparten.
  stats(rangeArg, offsetArg) {
    if (!this.db) return { ok: false };
    const range = ['week', 'month', 'year', 'all'].includes(rangeArg) ? rangeArg : 'week';
    const offset = range === 'all' ? 0 : Math.min(0, Math.trunc(Number(offsetArg)) || 0);
    const first = this.db.prepare('SELECT MIN(started_at) AS t FROM sessions').get().t;
    const p = this.period(range, offset, first);
    const from = p.from.getTime();
    const to = p.to.getTime();
    const rows = this.db.prepare('SELECT * FROM sessions WHERE ended_at > ? AND started_at < ?').all(from, to);
    const overlap = (r, a, b) => Math.max(0, Math.min(r.ended_at, b) - Math.max(r.started_at, a));
    const byGame = new Map();
    const days = new Set();
    let total = 0;
    let longest = null;
    for (const r of rows) {
      const ms = overlap(r, from, to);
      if (!ms) continue;
      total += ms;
      const g = byGame.get(r.game_id) || { id: r.game_id, name: r.game_name, ms: 0, sessions: 0 };
      g.ms += ms;
      g.sessions += 1;
      g.name = r.game_name; // el nombre más reciente
      byGame.set(r.game_id, g);
      if (!longest || ms > longest.ms) longest = { name: r.game_name, ms };
      const end = Math.min(r.ended_at, to);
      for (let d = new Date(Math.max(r.started_at, from)); d.getTime() < end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
    const sec = (ms) => Math.round(ms / 1000);
    const top = [...byGame.values()].sort((a, b) => b.ms - a.ms);
    return {
      ok: true,
      range,
      offset,
      title: p.title,
      words: p.words,
      canPrev: range !== 'all' && first != null && from > first,
      canNext: range !== 'all' && offset < 0,
      hasAny: first != null,
      totalSec: sec(total),
      sessions: rows.length,
      games: top.length,
      days: days.size,
      longest: longest && { name: longest.name, sec: sec(longest.ms) },
      top: top.slice(0, 8).map((g) => ({ id: g.id, name: g.name, sec: sec(g.ms), sessions: g.sessions })),
      buckets: p.buckets.map((b) => ({
        label: b.label,
        title: b.title,
        now: !!b.now,
        sec: sec(rows.reduce((n, r) => n + overlap(r, b.from.getTime(), b.to.getTime()), 0)),
      })),
    };
  }
}

module.exports = { PlayLog };
