// Presencia en Discord: "Jugando a NostalHub", con el juego y los logros, en tu perfil.
// Usa la conexión local con la app de Discord, con la aplicación pública de NostalHub (su ID no es secreto).
// Es aparte del Grupo (src/discord.js), que usa la aplicación privada de cada uno.

const crypto = require('crypto');
const { OP, openPipe, frame } = require('./discord');

const RETRY_MS = 30000;

class DiscordPresence {
  constructor({ clientId, log, open }) {
    this.clientId = clientId;
    this.log = log || (() => {});
    this.open = open || openPipe; // para las pruebas
    this.sock = null;
    this.buf = Buffer.alloc(0);
    this.ready = false;
    this.want = null;
    this.sent = '';
    this.retryAt = 0;
  }

  // Lo que debe mostrar (null = nada: se cierra la conexión y Discord lo quita de tu perfil)
  set(activity) {
    this.want = activity || null;
    if (!this.want) return this.disconnect();
    if (this.sock) return this.flush();
    this.connect();
  }

  async connect() {
    if (this.connecting || !this.clientId || Date.now() < this.retryAt) return;
    this.connecting = true;
    const sock = await this.open();
    this.connecting = false;
    if (!sock) {
      this.retryAt = Date.now() + RETRY_MS; // Discord cerrado
      return;
    }
    if (!this.want) return sock.destroy(); // se apagó mientras conectaba
    this.sock = sock;
    this.buf = Buffer.alloc(0);
    this.ready = false;
    this.sent = '';
    sock.on('data', (d) => this.onData(d));
    sock.on('close', () => {
      if (this.sock === sock) this.sock = null;
      this.ready = false;
      this.retryAt = Date.now() + RETRY_MS;
    });
    sock.on('error', () => {});
    sock.write(frame(OP.HANDSHAKE, { v: 1, client_id: this.clientId }));
  }

  flush() {
    if (!this.sock || !this.ready || !this.want) return;
    const text = JSON.stringify(this.want);
    if (text === this.sent) return;
    this.sent = text;
    this.sock.write(frame(OP.FRAME, { cmd: 'SET_ACTIVITY', args: { pid: process.pid, activity: this.want }, nonce: crypto.randomUUID() }));
  }

  onData(chunk) {
    this.buf = Buffer.concat([this.buf, chunk]);
    while (this.buf.length >= 8) {
      const op = this.buf.readInt32LE(0);
      const len = this.buf.readInt32LE(4);
      if (this.buf.length < 8 + len) break;
      let msg = null;
      try {
        msg = JSON.parse(this.buf.subarray(8, 8 + len).toString('utf8'));
      } catch {}
      this.buf = this.buf.subarray(8 + len);
      if (op === OP.PING && this.sock) this.sock.write(frame(OP.PONG, msg));
      else if (op === OP.CLOSE) {
        this.log(`presencia: Discord cerró la conexión: ${msg && msg.message}`);
        this.disconnect();
        this.retryAt = Date.now() + RETRY_MS;
      } else if (msg && msg.cmd === 'DISPATCH' && msg.evt === 'READY') {
        this.ready = true;
        this.flush();
      } else if (msg && msg.evt === 'ERROR') {
        this.log(`presencia: ${(msg.data && msg.data.message) || 'error de Discord'}`);
      }
    }
  }

  disconnect() {
    const sock = this.sock;
    this.sock = null;
    this.ready = false;
    this.sent = '';
    if (sock) {
      try {
        sock.destroy();
      } catch {}
    }
  }

  dispose() {
    this.want = null;
    this.disconnect();
  }
}

module.exports = { DiscordPresence };
