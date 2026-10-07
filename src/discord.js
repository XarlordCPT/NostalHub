// Canal de voz de Discord (para la pestaña "Grupo" de la PS4).
//
// Se conecta a la app de escritorio de Discord por su conexión local (la misma que usan los juegos
// para el "Jugando a…"), y le pregunta en qué canal de voz estás y quién está contigo.
// Necesita una aplicación tuya de Discord: su client_id y client_secret van en
// %APPDATA%\NostalHub\discord.txt (los pasos están en MANUAL.md).

const fs = require('fs');
const net = require('net');
const path = require('path');
const crypto = require('crypto');

const OP = { HANDSHAKE: 0, FRAME: 1, CLOSE: 2, PING: 3, PONG: 4 };

class DiscordVoice {
  constructor({ dataDir, onUpdate, log }) {
    this.keyFile = path.join(dataDir, 'discord.txt');
    this.tokenFile = path.join(dataDir, 'cache', 'discord-token.json');
    this.onUpdate = onUpdate;
    this.log = log || (() => {});
    this.sock = null;
    this.buf = Buffer.alloc(0);
    this.pending = new Map();
    this.watchers = 0;
    this.retryTimer = null;
    this.channelId = null;
    this.speaking = new Set();
    this.state = { status: 'off', message: '', channel: null, members: [] };
  }

  // ---------- Archivo con los datos de tu aplicación ----------
  ensureKeyFile() {
    if (!fs.existsSync(this.keyFile)) {
      fs.mkdirSync(path.dirname(this.keyFile), { recursive: true });
      fs.writeFileSync(
        this.keyFile,
        [
          '# NostalHub: datos de tu aplicación de Discord (para ver tu canal de voz en la PS4).',
          '# Los pasos están en MANUAL.md, sección "Discord". No compartas este archivo con nadie.',
          '',
          'client_id=',
          'client_secret=',
          'redirect_uri=http://localhost',
          '',
        ].join('\r\n'),
        'utf8'
      );
    }
    return this.keyFile;
  }

  keys() {
    let text = '';
    try {
      text = fs.readFileSync(this.keyFile, 'utf8');
    } catch {
      return null;
    }
    const get = (k) => {
      const m = text.match(new RegExp(`^\\s*${k}\\s*=\\s*(\\S+)\\s*$`, 'mi'));
      return m ? m[1] : '';
    };
    const id = get('client_id');
    const secret = get('client_secret');
    if (!/^\d{15,22}$/.test(id) || secret.length < 20) return null;
    return {
      id,
      secret,
      redirect: get('redirect_uri') || 'http://localhost',
      scopes: (get('scopes') || 'rpc').split(',').filter(Boolean),
    };
  }

  // ---------- Encendido según si la pantalla lo está mostrando ----------
  watch(on) {
    this.watchers = Math.max(0, this.watchers + (on ? 1 : -1));
    if (this.watchers && !this.sock && !this.connecting) this.connect();
    if (!this.watchers) {
      clearTimeout(this.retryTimer);
      this.disconnect();
      this.set({ status: 'off', channel: null, members: [] });
    }
    return this.state;
  }

  set(patch) {
    this.state = { ...this.state, ...patch };
    this.onUpdate(this.state);
  }

  retryLater(ms) {
    clearTimeout(this.retryTimer);
    if (this.watchers) this.retryTimer = setTimeout(() => this.connect(), ms);
  }

  // ---------- Conexión local con la app de Discord ----------
  pipePath(i) {
    if (process.platform === 'win32') return `\\\\?\\pipe\\discord-ipc-${i}`;
    const dir = process.env.XDG_RUNTIME_DIR || process.env.TMPDIR || process.env.TMP || process.env.TEMP || '/tmp';
    return path.join(dir, `discord-ipc-${i}`);
  }

  async openPipe() {
    for (let i = 0; i < 10; i++) {
      const sock = await new Promise((resolve) => {
        const s = net.createConnection(this.pipePath(i));
        s.once('connect', () => resolve(s));
        s.once('error', () => resolve(null));
      });
      if (sock) return sock;
    }
    return null;
  }

  async connect() {
    if (this.connecting || this.sock) return;
    const keys = this.keys();
    if (!keys) {
      this.ensureKeyFile();
      this.set({ status: 'no-config', message: '', channel: null, members: [] });
      return this.retryLater(5000); // revisa de nuevo por si pegaste los datos
    }
    if (/^[0-9a-f]{64}$/i.test(keys.secret)) {
      // Error típico: la "Clave pública" de la página principal no es el secret
      this.set({
        status: 'error',
        message: 'En client_secret pegaste la "Clave pública". El secret está en OAuth2 → Client Secret → Reset Secret.',
        channel: null,
        members: [],
      });
      return this.retryLater(5000);
    }
    this.connecting = true;
    this.set({ status: 'connecting', message: '' });
    const sock = await this.openPipe();
    this.connecting = false;
    if (!sock) {
      this.set({ status: 'no-discord', channel: null, members: [] });
      return this.retryLater(15000);
    }
    this.sock = sock;
    this.keysInUse = keys;
    this.buf = Buffer.alloc(0);
    sock.on('data', (d) => this.onData(d));
    sock.on('close', () => {
      this.sock = null;
      this.pending.forEach((p) => p.reject(new Error('Discord se cerró')));
      this.pending.clear();
      if (this.closedOnPurpose) {
        this.closedOnPurpose = false;
        return this.retryLater(30000);
      }
      if (this.watchers) {
        this.set({ status: 'no-discord', channel: null, members: [] });
        this.retryLater(15000);
      }
    });
    sock.on('error', () => {});
    this.write(OP.HANDSHAKE, { v: 1, client_id: keys.id });
  }

  disconnect() {
    if (this.sock) {
      try {
        this.sock.destroy();
      } catch {}
    }
    this.sock = null;
    this.channelId = null;
  }

  write(op, obj) {
    if (!this.sock) return;
    const json = Buffer.from(JSON.stringify(obj), 'utf8');
    const head = Buffer.alloc(8);
    head.writeInt32LE(op, 0);
    head.writeInt32LE(json.length, 4);
    this.sock.write(Buffer.concat([head, json]));
  }

  send(cmd, args = {}, evt) {
    return new Promise((resolve, reject) => {
      const nonce = crypto.randomUUID();
      this.pending.set(nonce, { resolve, reject });
      this.write(OP.FRAME, { cmd, args, evt, nonce });
      setTimeout(() => {
        if (this.pending.has(nonce)) {
          this.pending.delete(nonce);
          reject(new Error(`Discord no respondió (${cmd})`));
        }
      }, cmd === 'AUTHORIZE' ? 120000 : 10000);
    });
  }

  onData(chunk) {
    this.buf = Buffer.concat([this.buf, chunk]);
    while (this.buf.length >= 8) {
      const op = this.buf.readInt32LE(0);
      const len = this.buf.readInt32LE(4);
      if (this.buf.length < 8 + len) break;
      let msg = null;
      try {
        msg = JSON.parse(this.buf.slice(8, 8 + len).toString('utf8'));
      } catch {}
      this.buf = this.buf.slice(8 + len);
      if (op === OP.PING) this.write(OP.PONG, msg);
      else if (op === OP.CLOSE) {
        this.log(`Discord cerró la conexión: ${msg && msg.message}`);
        this.set({ status: 'error', message: (msg && msg.message) || 'Discord rechazó la conexión' });
        this.closedOnPurpose = true; // no se pisa el mensaje de error; se reintenta en 30 s
        this.disconnect();
      } else if (msg) this.onMessage(msg);
    }
  }

  onMessage(msg) {
    if (msg.nonce && this.pending.has(msg.nonce)) {
      const p = this.pending.get(msg.nonce);
      this.pending.delete(msg.nonce);
      if (msg.evt === 'ERROR') p.reject(new Error((msg.data && msg.data.message) || 'Error de Discord'));
      else p.resolve(msg.data);
      return;
    }
    if (msg.cmd !== 'DISPATCH') return;
    const d = msg.data || {};
    switch (msg.evt) {
      case 'READY':
        this.afterReady().catch((e) => this.fail(e));
        break;
      case 'VOICE_CHANNEL_SELECT':
        this.loadChannel().catch((e) => this.fail(e));
        break;
      case 'VOICE_STATE_CREATE':
      case 'VOICE_STATE_UPDATE':
        this.upsertMember(d);
        break;
      case 'VOICE_STATE_DELETE':
        this.removeMember(d.user && d.user.id);
        break;
      case 'SPEAKING_START':
      case 'SPEAKING_STOP':
        if (d.user_id) {
          if (msg.evt === 'SPEAKING_START') this.speaking.add(d.user_id);
          else this.speaking.delete(d.user_id);
          this.set({ members: this.state.members.map((m) => ({ ...m, speaking: this.speaking.has(m.id) })) });
        }
        break;
      default:
        break;
    }
  }

  fail(e) {
    this.log(`Discord: ${e.message}`);
    this.set({ status: 'error', message: this.friendly(e.message) });
  }

  // Explica en simple los errores más comunes al configurar la aplicación de Discord
  friendly(msg) {
    const m = String(msg || '');
    if (/redirect_uri/i.test(m))
      return 'Falta la dirección de redirección. En el portal de Discord, en tu aplicación → OAuth2 → Redirects, agrega http://localhost, guarda con Save Changes y presiona "Intentar de nuevo".';
    if (/invalid_client|client_secret|unauthorized_client/i.test(m))
      return 'El client_secret no es correcto. Cópialo desde OAuth2 → Client Secret → Reset Secret (no es la "Clave pública") y pégalo en discord.txt.';
    if (/invalid_grant/i.test(m)) return 'El permiso venció antes de terminar. Presiona "Intentar de nuevo".';
    if (/client id|4000|invalid client/i.test(m)) return 'El client_id no es correcto. Es el "ID de la aplicación" (Application ID) del portal de Discord.';
    if (/cancel|denied|5000/i.test(m)) return 'Se canceló la autorización en Discord. Presiona "Intentar de nuevo" y acepta la ventana.';
    return m;
  }

  // ---------- Permiso (la primera vez Discord muestra una ventana para aceptar) ----------
  readToken() {
    try {
      return JSON.parse(fs.readFileSync(this.tokenFile, 'utf8'));
    } catch {
      return null;
    }
  }

  saveToken(t) {
    fs.mkdirSync(path.dirname(this.tokenFile), { recursive: true });
    fs.writeFileSync(this.tokenFile, JSON.stringify(t), 'utf8');
  }

  async tokenRequest(params) {
    const k = this.keysInUse;
    const body = new URLSearchParams({ client_id: k.id, client_secret: k.secret, ...params });
    const res = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    if (!res.ok || !data.access_token) throw new Error(data.error_description || data.error || `Discord respondió ${res.status}`);
    const t = { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: Date.now() + (data.expires_in || 604800) * 1000 };
    this.saveToken(t);
    return t;
  }

  async afterReady() {
    let t = this.readToken();
    if (t && t.expires_at < Date.now() + 3600000 && t.refresh_token) {
      try {
        t = await this.tokenRequest({ grant_type: 'refresh_token', refresh_token: t.refresh_token });
      } catch (e) {
        this.log(`no se pudo renovar el permiso: ${e.message}`);
        t = null;
      }
    }
    if (!t) return this.set({ status: 'need-auth', message: '' });
    try {
      await this.send('AUTHENTICATE', { access_token: t.access_token });
    } catch (e) {
      this.log(`permiso rechazado: ${e.message}`);
      try {
        fs.unlinkSync(this.tokenFile);
      } catch {}
      return this.set({ status: 'need-auth', message: '' });
    }
    await this.send('SUBSCRIBE', {}, 'VOICE_CHANNEL_SELECT');
    this.set({ status: 'ok', message: '' });
    await this.loadChannel();
  }

  // Lo llama el botón "Conectar con Discord": Discord abre una ventana para aceptar
  async authorize() {
    if (!this.sock) {
      await this.connect();
      return this.state;
    }
    if (this.state.status !== 'need-auth' && this.state.status !== 'error') return this.state;
    // Relee discord.txt por si lo corregiste mientras NostalHub estaba abierta
    const fresh = this.keys();
    if (fresh && this.keysInUse && fresh.id !== this.keysInUse.id) {
      this.disconnect();
      await this.connect();
      return this.state;
    }
    if (fresh) this.keysInUse = fresh;
    try {
      this.set({ status: 'authorizing', message: '' });
      const k = this.keysInUse;
      let res;
      try {
        res = await this.send('AUTHORIZE', { client_id: k.id, scopes: k.scopes });
      } catch (e) {
        if (!/redirect_uri/i.test(e.message)) throw e;
        // Algunas aplicaciones piden la dirección de redirección también aquí
        this.log(`AUTHORIZE pidió redirect_uri; se reintenta con ${k.redirect}`);
        res = await this.send('AUTHORIZE', { client_id: k.id, scopes: k.scopes, redirect_uri: k.redirect });
      }
      await this.tokenRequest({ grant_type: 'authorization_code', code: res.code, redirect_uri: k.redirect });
      await this.afterReady();
    } catch (e) {
      this.fail(e);
    }
    return this.state;
  }

  // ---------- Canal de voz y quiénes están ----------
  async loadChannel() {
    const ch = await this.send('GET_SELECTED_VOICE_CHANNEL', {});
    const oldId = this.channelId;
    if (oldId && (!ch || ch.id !== oldId)) {
      for (const evt of ['VOICE_STATE_CREATE', 'VOICE_STATE_UPDATE', 'VOICE_STATE_DELETE', 'SPEAKING_START', 'SPEAKING_STOP']) {
        this.send('UNSUBSCRIBE', { channel_id: oldId }, evt).catch(() => {});
      }
    }
    this.speaking.clear();
    if (!ch) {
      this.channelId = null;
      return this.set({ channel: null, members: [] });
    }
    this.channelId = ch.id;
    let guild = '';
    if (ch.guild_id) {
      try {
        const g = await this.send('GET_GUILD', { guild_id: ch.guild_id });
        guild = (g && g.name) || '';
      } catch {}
    }
    const members = (ch.voice_states || []).map((v) => this.member(v));
    this.set({ channel: { id: ch.id, name: ch.name || 'Llamada', guild }, members });
    if (ch.id !== oldId) {
      for (const evt of ['VOICE_STATE_CREATE', 'VOICE_STATE_UPDATE', 'VOICE_STATE_DELETE', 'SPEAKING_START', 'SPEAKING_STOP']) {
        this.send('SUBSCRIBE', { channel_id: ch.id }, evt).catch((e) => this.log(`no se pudo seguir ${evt}: ${e.message}`));
      }
    }
  }

  member(v) {
    const u = v.user || {};
    const vs = v.voice_state || {};
    let avatar;
    if (u.avatar) avatar = `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128`;
    else {
      let n = 0;
      try {
        n = Number((BigInt(u.id) >> 22n) % 6n);
      } catch {}
      avatar = `https://cdn.discordapp.com/embed/avatars/${n}.png`;
    }
    return {
      id: u.id,
      name: v.nick || u.global_name || u.username || 'Usuario',
      avatar,
      muted: !!(vs.self_mute || vs.mute || v.mute),
      deafened: !!(vs.self_deaf || vs.deaf),
      speaking: this.speaking.has(u.id),
    };
  }

  upsertMember(v) {
    if (!v || !v.user) return;
    const m = this.member(v);
    const list = [...this.state.members];
    const i = list.findIndex((x) => x.id === m.id);
    if (i >= 0) list[i] = m;
    else list.push(m);
    this.set({ members: list });
  }

  removeMember(id) {
    if (!id) return;
    this.speaking.delete(id);
    this.set({ members: this.state.members.filter((m) => m.id !== id) });
  }

  dispose() {
    clearTimeout(this.retryTimer);
    this.disconnect();
  }
}

module.exports = { DiscordVoice };
