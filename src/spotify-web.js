// Conexión con la API de Spotify (necesita Spotify Premium).
// Da lo que Windows no sabe: la portada exacta, el avance de la canción, la cola, aleatorio / repetir,
// "Me gusta", el volumen y en qué dispositivo suena. También permite cambiar todo eso.
//
// Cómo se conecta: cada persona crea su propia "app" gratis en developer.spotify.com (como con Discord),
// pega el Client ID en NostalHub y acepta el permiso en el navegador una vez (OAuth con PKCE: no hay
// contraseña ni "secret"). Se guarda en %APPDATA%\NostalHub\spotify.json y nunca sale de este PC.

const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { shell } = require('electron');

const PORT = 8957;
const REDIRECT = `http://127.0.0.1:${PORT}/callback`;
const SCOPES = ['user-read-playback-state', 'user-modify-playback-state', 'user-read-currently-playing', 'user-library-read', 'user-library-modify'].join(' ');
const API = 'https://api.spotify.com/v1';
const ACCOUNTS = 'https://accounts.spotify.com';
const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

class SpotifyWeb {
  constructor({ dataDir, onUpdate, log }) {
    this.file = path.join(dataDir, 'spotify.json');
    this.onUpdate = onUpdate || (() => {});
    this.log = log || (() => {});
    this.cfg = this.load();
    this.access = null; // { token, exp }
    this.watchers = 0;
    this.timer = null;
    this.ticks = 0;
    this.backoffUntil = 0;
    // status: no-config | need-auth | authorizing | ok | error
    this.state = { status: this.cfg.clientId ? (this.cfg.refreshToken ? 'ok' : 'need-auth') : 'no-config', message: '', user: this.cfg.user || null, playback: null, queue: [], liked: null };
  }

  // ---------- Archivo ----------
  load() {
    try {
      return JSON.parse(fs.readFileSync(this.file, 'utf8')) || {};
    } catch {
      return {};
    }
  }
  save() {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file, JSON.stringify(this.cfg, null, 2), 'utf8');
    } catch (e) {
      this.log(`no se pudo guardar spotify.json: ${e.message}`);
    }
  }
  get connected() {
    return !!(this.cfg.clientId && this.cfg.refreshToken);
  }
  // Lo que se le puede mostrar a la pantalla de conexión (sin tokens)
  peek() {
    return { clientId: this.cfg.clientId || '', connected: this.connected, user: this.cfg.user || null, status: this.state.status, message: this.state.message, redirect: REDIRECT };
  }
  set(patch) {
    Object.assign(this.state, patch);
    this.onUpdate(this.state);
  }

  // ---------- Conectar (OAuth con PKCE y un servidor de un solo uso en 127.0.0.1) ----------
  authorize(clientId) {
    clientId = String(clientId || this.cfg.clientId || '').trim();
    if (!/^[0-9a-f]{32}$/i.test(clientId)) return Promise.resolve({ ok: false, message: 'El Client ID tiene 32 letras y números. Cópialo de nuevo desde la página de tu app en Spotify.' });
    if (this.authServer) this.authServer.close();
    const verifier = b64url(crypto.randomBytes(48));
    const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
    const stateTag = b64url(crypto.randomBytes(12));
    this.set({ status: 'authorizing', message: '' });
    return new Promise((resolve) => {
      let finished = false;
      const finish = (res) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        try {
          server.close();
        } catch {}
        this.authServer = null;
        if (!res.ok) this.set({ status: this.connected ? 'ok' : this.cfg.clientId ? 'need-auth' : 'no-config', message: res.message });
        resolve(res);
      };
      const page = (title, text) =>
        `<!doctype html><meta charset="utf-8"><title>NostalHub</title><body style="font-family:Segoe UI,sans-serif;background:#121212;color:#fff;display:grid;place-items:center;height:100vh;margin:0"><div style="text-align:center"><h1 style="color:#1ed760">${title}</h1><p>${text}</p></div></body>`;
      const server = http.createServer(async (req, res) => {
        const url = new URL(req.url, REDIRECT);
        if (url.pathname !== '/callback') {
          res.writeHead(404).end();
          return;
        }
        const code = url.searchParams.get('code');
        const err = url.searchParams.get('error');
        if (url.searchParams.get('state') !== stateTag || err || !code) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(page('No se conectó', 'Vuelve a NostalHub e inténtalo de nuevo.'));
          return finish({ ok: false, message: err === 'access_denied' ? 'Cancelaste el permiso en Spotify.' : 'Spotify no devolvió el permiso. Intenta de nuevo.' });
        }
        try {
          const tok = await this.tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT, client_id: clientId, code_verifier: verifier });
          this.cfg = { clientId, refreshToken: tok.refresh_token };
          this.access = { token: tok.access_token, exp: Date.now() + (tok.expires_in || 3600) * 1000 };
          const me = await this.api('GET', '/me').catch(() => null);
          this.cfg.user = me ? me.display_name || me.id : null;
          this.save();
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(page('¡Listo!', 'Spotify quedó conectado. Ya puedes cerrar esta pestaña y volver a NostalHub.'));
          this.set({ status: 'ok', message: '', user: this.cfg.user });
          if (this.watchers) this.poll();
          finish({ ok: true, user: this.cfg.user });
        } catch (e) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(page('No se conectó', 'Vuelve a NostalHub e inténtalo de nuevo.'));
          finish({ ok: false, message: `Spotify no aceptó la conexión (${e.message}). Revisa que la dirección de redirección sea exactamente ${REDIRECT}` });
        }
      });
      server.on('error', (e) => finish({ ok: false, message: e.code === 'EADDRINUSE' ? `El puerto ${PORT} está ocupado por otro programa. Ciérralo e intenta de nuevo.` : e.message }));
      server.listen(PORT, '127.0.0.1', () => {
        const q = new URLSearchParams({ client_id: clientId, response_type: 'code', redirect_uri: REDIRECT, code_challenge_method: 'S256', code_challenge: challenge, scope: SCOPES, state: stateTag });
        shell.openExternal(`${ACCOUNTS}/authorize?${q}`);
      });
      this.authServer = server;
      const timeout = setTimeout(() => finish({ ok: false, message: 'Se acabó el tiempo para aceptar en Spotify. Intenta de nuevo.' }), 5 * 60 * 1000);
    });
  }

  disconnect() {
    this.cfg = { clientId: this.cfg.clientId };
    this.access = null;
    this.save();
    this.set({ status: this.cfg.clientId ? 'need-auth' : 'no-config', message: '', user: null, playback: null, queue: [], liked: null });
  }

  async tokenRequest(params) {
    const res = await fetch(`${ACCOUNTS}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error_description || data.error || `HTTP ${res.status}`);
      err.code = data.error;
      throw err;
    }
    return data;
  }

  async token() {
    if (this.access && this.access.exp > Date.now() + 30000) return this.access.token;
    if (!this.connected) throw new Error('sin conectar');
    try {
      const tok = await this.tokenRequest({ grant_type: 'refresh_token', refresh_token: this.cfg.refreshToken, client_id: this.cfg.clientId });
      this.access = { token: tok.access_token, exp: Date.now() + (tok.expires_in || 3600) * 1000 };
      if (tok.refresh_token && tok.refresh_token !== this.cfg.refreshToken) {
        this.cfg.refreshToken = tok.refresh_token; // Spotify a veces lo renueva
        this.save();
      }
      return this.access.token;
    } catch (e) {
      if (e.code === 'invalid_grant' || e.code === 'invalid_client') {
        // El permiso se revocó o la app se borró: hay que volver a conectar
        this.cfg = { clientId: this.cfg.clientId };
        this.save();
        this.set({ status: 'need-auth', message: 'Spotify pide volver a conectar.' });
      }
      throw e;
    }
  }

  // Petición a la API. Devuelve el JSON, null si no hay contenido, o lanza un error.
  async api(method, p, { query, body } = {}, retry = true) {
    if (Date.now() < this.backoffUntil) throw new Error('esperando (demasiadas consultas)');
    const tok = await this.token();
    const url = `${API}${p}${query ? `?${new URLSearchParams(query)}` : ''}`;
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${tok}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 401 && retry) {
      this.access = null;
      return this.api(method, p, { query, body }, false);
    }
    if (res.status === 429) {
      const s = Number(res.headers.get('retry-after')) || 5;
      this.backoffUntil = Date.now() + s * 1000;
      throw new Error(`Spotify pidió esperar ${s} s`);
    }
    if (res.status === 204) return null;
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {}
    if (!res.ok) {
      const msg = (data && data.error && (data.error.message || data.error)) || `HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.reason = data && data.error && data.error.reason;
      throw err;
    }
    return data;
  }

  // ---------- Lectura periódica (solo mientras alguna pantalla la muestra) ----------
  watch(on) {
    this.watchers = Math.max(0, this.watchers + (on ? 1 : -1));
    if (this.watchers && !this.timer && this.connected) {
      this.poll();
      this.timer = setInterval(() => this.poll(), 2000);
    } else if (!this.watchers && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async poll() {
    if (!this.connected || this.polling) return;
    this.polling = true;
    try {
      const pb = await this.api('GET', '/me/player', { query: { additional_types: 'track,episode' } });
      const prevId = this.state.playback && this.state.playback.item && this.state.playback.item.id;
      const playback = pb && pb.item ? this.simplify(pb) : pb ? { ...this.simplify(pb), item: null } : null;
      const curId = playback && playback.item && playback.item.id;
      const changed = curId !== prevId;
      this.ticks++;
      const patch = { status: 'ok', message: '', playback, at: Date.now() };
      if (changed) patch.liked = null;
      this.set(patch);
      // La cola: al cambiar de canción y cada ~10 s; "Me gusta": al cambiar de canción
      if (playback && playback.item && (changed || this.ticks % 5 === 0)) this.loadQueue();
      if (playback && playback.item && changed && playback.item.type === 'track') this.loadLiked(playback.item.uri);
      if (!playback) this.set({ queue: [] });
    } catch (e) {
      if (this.state.status !== 'need-auth') this.set({ status: e.status === 403 ? 'error' : this.state.status === 'ok' ? 'ok' : 'error', message: e.status === 403 ? 'Spotify no da permiso. Revisa que tu cuenta sea Premium y que tu correo esté en "User Management" de tu app.' : e.message });
      this.log(`api: ${e.message}`);
    } finally {
      this.polling = false;
    }
  }

  simplify(pb) {
    const it = pb.item;
    const img = (imgs, small) => {
      const list = (imgs || []).slice().sort((a, b) => (b.width || 0) - (a.width || 0));
      if (!list.length) return null;
      return small ? (list[list.length - 1] || list[0]).url : list[0].url;
    };
    const item = it
      ? {
          id: it.id,
          uri: it.uri,
          type: it.type,
          title: it.name,
          artist: it.type === 'episode' ? (it.show && it.show.name) || '' : (it.artists || []).map((a) => a.name).join(', '),
          album: it.type === 'episode' ? '' : (it.album && it.album.name) || '',
          cover: img(it.type === 'episode' ? it.images || (it.show && it.show.images) : it.album && it.album.images),
          durationMs: it.duration_ms || 0,
        }
      : null;
    return {
      item,
      isPlaying: !!pb.is_playing,
      progressMs: pb.progress_ms || 0,
      shuffle: !!pb.shuffle_state,
      smartShuffle: !!pb.smart_shuffle, // Spotify lo informa aunque no está en la documentación
      repeat: pb.repeat_state || 'off',
      device: pb.device ? { id: pb.device.id, name: pb.device.name, type: pb.device.type, volume: pb.device.volume_percent, canVolume: pb.device.supports_volume !== false } : null,
      context: pb.context ? { type: pb.context.type, uri: pb.context.uri } : null,
    };
  }

  async loadQueue() {
    try {
      const q = await this.api('GET', '/me/player/queue');
      const small = (imgs) => {
        const l = (imgs || []).slice().sort((a, b) => (a.width || 0) - (b.width || 0));
        return (l.find((x) => (x.width || 0) >= 64) || l[l.length - 1] || {}).url || null;
      };
      const queue = ((q && q.queue) || []).slice(0, 30).map((t) => ({
        uri: t.uri,
        title: t.name,
        artist: t.type === 'episode' ? (t.show && t.show.name) || '' : (t.artists || []).map((a) => a.name).join(', '),
        cover: small(t.type === 'episode' ? t.images : t.album && t.album.images),
        durationMs: t.duration_ms || 0,
      }));
      this.set({ queue });
    } catch (e) {
      this.log(`cola: ${e.message}`);
    }
  }

  async loadLiked(uri) {
    try {
      const r = await this.api('GET', '/me/library/contains', { query: { uris: uri } });
      if (this.state.playback && this.state.playback.item && this.state.playback.item.uri === uri) this.set({ liked: Array.isArray(r) ? !!r[0] : null });
    } catch (e) {
      this.log(`me gusta: ${e.message}`);
    }
  }

  // ---------- Acciones ----------
  async action(cmd, arg) {
    if (!this.connected) return { ok: false, message: 'Spotify no está conectado' };
    const pb = this.state.playback;
    try {
      switch (cmd) {
        case 'toggle':
          await this.api('PUT', pb && pb.isPlaying ? '/me/player/pause' : '/me/player/play');
          break;
        case 'next':
          await this.api('POST', '/me/player/next');
          break;
        case 'prev':
          await this.api('POST', '/me/player/previous');
          break;
        case 'shuffle': {
          // Orden → Aleatorio → Orden. El aleatorio inteligente solo se activa desde Spotify.
          const on = !(pb && (pb.shuffle || pb.smartShuffle));
          await this.api('PUT', '/me/player/shuffle', { query: { state: String(on) } });
          break;
        }
        case 'repeat': {
          const order = ['off', 'context', 'track'];
          const next = order[(order.indexOf((pb && pb.repeat) || 'off') + 1) % order.length];
          await this.api('PUT', '/me/player/repeat', { query: { state: next } });
          break;
        }
        case 'like': {
          const uri = pb && pb.item && pb.item.uri;
          if (!uri) break;
          const liked = !this.state.liked;
          await this.api(liked ? 'PUT' : 'DELETE', '/me/library', { query: { uris: uri } });
          this.set({ liked });
          return { ok: true, liked };
        }
        case 'volume': {
          const cur = (pb && pb.device && pb.device.volume) || 0;
          // arg: un número suma o resta (+10 / -10); { value } lo deja en ese valor
          const v = Math.max(0, Math.min(100, arg && typeof arg === 'object' ? Number(arg.value) || 0 : cur + (Number(arg) || 0)));
          await this.api('PUT', '/me/player/volume', { query: { volume_percent: String(Math.round(v)) } });
          if (pb && pb.device) this.set({ playback: { ...pb, device: { ...pb.device, volume: Math.round(v) } } });
          break;
        }
        case 'device':
          await this.api('PUT', '/me/player', { body: { device_ids: [String(arg)], play: true } });
          break;
        case 'skipto': {
          // Saltar hasta una canción de la cola: Spotify no deja elegirla, así que se avanza una por una
          const n = Math.max(0, Math.min(30, Number(arg) || 0));
          for (let i = 0; i <= n; i++) {
            await this.api('POST', '/me/player/next');
            if (i < n) await wait(250);
          }
          break;
        }
        default:
          return { ok: false };
      }
      setTimeout(() => this.poll(), 350);
      setTimeout(() => this.poll(), 1200);
      return { ok: true };
    } catch (e) {
      this.log(`acción ${cmd}: ${e.message}`);
      const msg =
        e.status === 403
          ? e.reason === 'PREMIUM_REQUIRED'
            ? 'Esto necesita Spotify Premium.'
            : 'Spotify no permitió hacer eso ahora.'
          : e.status === 404
            ? 'No hay ningún dispositivo con Spotify activo. Dale play en algún lado primero.'
            : e.message;
      return { ok: false, message: msg };
    }
  }

  async devices() {
    try {
      const d = await this.api('GET', '/me/player/devices');
      return ((d && d.devices) || []).map((x) => ({ id: x.id, name: x.name, type: x.type, active: !!x.is_active, volume: x.volume_percent }));
    } catch (e) {
      this.log(`dispositivos: ${e.message}`);
      return [];
    }
  }

  dispose() {
    if (this.timer) clearInterval(this.timer);
    if (this.authServer) this.authServer.close();
  }
}

module.exports = { SpotifyWeb, SPOTIFY_REDIRECT: REDIRECT };
