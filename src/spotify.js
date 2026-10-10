// Música: Spotify (o Apple Music, YouTube Music, o la que esté sonando) a través de Windows (solo Windows).
// Si Spotify está conectado con su API (spotify-web.js), se suman la cola, el avance, aleatorio, etc.
//
// Modo principal ("smtc"): un PowerShell ayudante (spotify-smtc.ps1) usa los controles multimedia de
// Windows para saber qué suena, el estado y la PORTADA real, y para controlar Spotify directamente.
//
// Modo de respaldo ("basic"), si el ayudante no funciona en este PC:
// - Qué suena: el título de la ventana de Spotify ("Artista - Canción").
// - Controles: teclas multimedia de Windows.
// - Portada: se busca en el catálogo público de iTunes por artista + canción.

const path = require('path');
const { execFile, spawn } = require('child_process');
const { shell } = require('electron');

const VK = { prev: 177, next: 176, toggle: 179 };
// Apps de música que se pueden elegir en Ajustes → Sonido
const APPS = { spotify: 'Spotify', apple: 'Apple Music', ytmusic: 'YouTube Music', auto: 'Música' };
function appNameOf(id, source) {
  if (id !== 'auto') return APPS[id] || 'Spotify';
  const s = String(source || '');
  if (/spotify/i.test(s)) return 'Spotify';
  if (/apple|itunes/i.test(s)) return 'Apple Music';
  if (/youtube/i.test(s)) return 'YouTube Music';
  if (/chrome|msedge|firefox|brave|opera|vivaldi/i.test(s)) return 'Navegador';
  return 'Música';
}

class Spotify {
  constructor(onUpdate, logFile, opts = {}) {
    this.onUpdate = onUpdate;
    this.logFile = logFile || null;
    this.getApp = opts.getApp || (() => 'spotify'); // app elegida en Ajustes
    this.web = opts.web || null; // conexión con la API de Spotify (opcional)
    this.state = { supported: process.platform === 'win32', running: false, playing: false, artist: '', title: '', album: '', cover: null };
    this.lastSent = '';
    this.timer = null;
    this.watchers = 0;
    this.mode = null; // 'smtc' | 'basic'
    this.helper = null;
    this.helperQueue = [];
    this.helperBuf = '';
    this.keyProc = null;
    this.coverCache = new Map();
  }

  // ---------- Encendido / apagado según si la pantalla lo está mostrando ----------
  get appId() {
    const a = this.getApp();
    return APPS[a] ? a : 'spotify';
  }

  watch(on) {
    if (this.web) this.web.watch(on);
    this.watchers = Math.max(0, this.watchers + (on ? 1 : -1));
    if (this.watchers && !this.timer && !this.starting) {
      this.starting = true;
      this.start().finally(() => (this.starting = false));
    } else if (!this.watchers && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    return this.view();
  }

  async start() {
    if (!this.state.supported) return;
    if (!this.mode) {
      this.mode = (await this.startHelper()) ? 'smtc' : 'basic';
      this.log(`modo: ${this.mode === 'smtc' ? 'controles multimedia de Windows' : 'respaldo (título de la ventana)'}`);
    }
    if (!this.watchers || this.timer) return; // se dejó de mirar mientras arrancaba
    this.poll();
    this.timer = setInterval(() => this.poll(), 2000);
  }

  // ---------- Ayudante PowerShell (controles multimedia de Windows) ----------
  startHelper() {
    return new Promise((resolve) => {
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        if (!ok) this.log('el ayudante de PowerShell no respondió; se usa el respaldo');
        if (!ok && this.helper) {
          try {
            this.helper.kill();
          } catch {}
          this.helper = null;
        }
        resolve(ok);
      };
      try {
        this.helper = spawn(
          'powershell.exe',
          ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'spotify-smtc.ps1').replace(`app.asar${path.sep}`, `app.asar.unpacked${path.sep}`)],
          { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] }
        );
      } catch {
        return finish(false);
      }
      this.helper.on('error', () => finish(false));
      this.helper.on('exit', () => {
        this.helper = null;
        this.helperQueue.splice(0).forEach((cb) => cb(null));
        finish(false);
        if (this.mode === 'smtc') this.mode = 'basic'; // si se cae, seguimos con el respaldo
      });
      this.helper.stdout.setEncoding('utf8');
      this.helper.stdout.on('data', (chunk) => {
        this.helperBuf += chunk;
        let i;
        while ((i = this.helperBuf.indexOf('\n')) >= 0) {
          const line = this.helperBuf.slice(0, i).trim();
          this.helperBuf = this.helperBuf.slice(i + 1);
          if (!line) continue;
          let msg = null;
          try {
            msg = JSON.parse(line);
          } catch {
            continue;
          }
          if ('ready' in msg) finish(!!msg.ready);
          else {
            const cb = this.helperQueue.shift();
            if (cb) cb(msg);
          }
        }
      });
      setTimeout(() => finish(false), 10000); // si en 10 s no responde, usamos el respaldo
    });
  }

  ask(cmd) {
    return new Promise((resolve) => {
      if (!this.helper) return resolve(null);
      this.helperQueue.push(resolve);
      try {
        this.helper.stdin.write(`${cmd}\n`);
      } catch {
        this.helperQueue.pop();
        resolve(null);
      }
      setTimeout(() => {
        const idx = this.helperQueue.indexOf(resolve);
        if (idx >= 0) {
          this.helperQueue.splice(idx, 1);
          resolve(null);
        }
      }, 5000);
    });
  }

  applySmtc(msg) {
    if (!msg || !msg.ok) return;
    const next = { ...this.state };
    const app = this.appId;
    if (next.app !== app) Object.assign(next, { app, title: '', artist: '', album: '', cover: null }); // se cambió de app
    next.appName = appNameOf(app, msg.app);
    if (!msg.found) {
      // Sin sesión de esa app: puede estar cerrada o recién abierta sin música
      next.running = false;
      next.playing = false;
      if (app === 'spotify') this.checkRunning(next);
      else this.commit(next);
      return;
    }
    next.running = true;
    next.playing = msg.status === 'Playing';
    if (msg.title) {
      const changed = msg.title !== next.title || msg.artist !== next.artist;
      next.title = msg.title;
      next.artist = msg.artist || '';
      next.album = msg.album || '';
      if (changed) next.cover = null;
    }
    if (msg.thumb) next.cover = `data:${msg.thumbType || 'image/jpeg'};base64,${msg.thumb}`;
    if (msg.thumbError) this.log(`miniatura de Windows: ${msg.thumbError}`);
    this.commit(next);
    // Si Windows no da la portada después de unas consultas (~10 s), se busca por internet
    // (con Spotify conectado no hace falta: la portada viene exacta de Spotify)
    if (!next.cover && next.title && !this.webPlaying()) {
      this.noThumb = msg.title !== this.lastThumbTitle ? 1 : (this.noThumb || 0) + 1;
      this.lastThumbTitle = msg.title;
      if (this.noThumb >= 5) this.lookupCover(next.artist, next.title);
    }
  }

  // Cuando no hay sesión multimedia, revisa si al menos el proceso existe
  checkRunning(next) {
    execFile('tasklist', ['/fo', 'csv', '/nh', '/fi', 'imagename eq Spotify.exe'], { windowsHide: true }, (err, out) => {
      next.running = !err && /spotify\.exe/i.test(String(out));
      this.commit(next);
    });
  }

  // ---------- Respaldo: título de la ventana ----------
  pollBasic() {
    execFile(
      'tasklist',
      ['/v', '/fo', 'csv', '/nh', '/fi', 'imagename eq Spotify.exe'],
      { windowsHide: true, maxBuffer: 1024 * 1024 },
      (err, out) => {
        if (err) return;
        const titles = [];
        let running = false;
        for (const line of String(out).split(/\r?\n/)) {
          const cols = line.match(/"([^"]*)"/g);
          if (!cols || cols.length < 2 || !/spotify\.exe/i.test(cols[0])) continue;
          running = true;
          titles.push(cols[cols.length - 1].slice(1, -1)); // la última columna es el título de la ventana
        }
        const song = titles.find((t) => t.includes(' - '));
        const next = { ...this.state, running };
        if (!running) {
          Object.assign(next, { playing: false, artist: '', title: '', album: '', cover: null });
        } else if (song) {
          const i = song.indexOf(' - ');
          const artist = song.slice(0, i).trim();
          const title = song.slice(i + 3).trim();
          if (artist !== next.artist || title !== next.title) next.cover = null;
          Object.assign(next, { playing: true, artist, title });
        } else {
          next.playing = false; // la ventana dice solo "Spotify ..." => en pausa
        }
        this.commit(next);
        if (next.title && !next.cover) this.lookupCover(next.artist, next.title);
      }
    );
  }

  // ---------- Portada por búsqueda (respaldo) ----------
  // Si Windows no entrega la portada, se busca por internet: primero en iTunes (tienda de Chile y
  // después la de EE. UU.) y luego en Deezer, que tiene mucha música latina e independiente.
  async lookupCover(artist, title) {
    const key = `${artist}|${title}`.toLowerCase();
    if (this.coverCache.has(key)) {
      const url = this.coverCache.get(key);
      if (url && this.state.title === title && !this.state.cover) this.commit({ ...this.state, cover: url });
      return;
    }
    this.coverCache.set(key, null); // evita buscar dos veces lo mismo
    const cleanTitle = title.replace(/\s*[-(\[].*(remaster|live|version|feat|en vivo|edit).*$/i, '').trim() || title;
    const mainArtist = artist.split(/,|&| feat\.? | ft\.? /i)[0].trim();
    let url = null;
    for (const find of [
      () => this.fromItunes(mainArtist, cleanTitle, 'CL'),
      () => this.fromItunes(mainArtist, cleanTitle, 'US'),
      () => this.fromDeezer(mainArtist, cleanTitle),
    ]) {
      try {
        url = await find();
      } catch (e) {
        this.log(`portada: ${e.message}`);
      }
      if (url) break;
    }
    this.log(`portada por internet para "${artist} - ${title}": ${url ? 'encontrada' : 'no encontrada'}`);
    if (!url) return;
    this.coverCache.set(key, url);
    if (this.state.title === title && !this.state.cover) this.commit({ ...this.state, cover: url });
  }

  // ¿El resultado es del mismo artista? (para no mostrar la portada de otra canción)
  sameArtist(a, b) {
    const x = this.norm(a);
    const y = this.norm(b);
    return !!x && !!y && (x.includes(y) || y.includes(x));
  }
  // ¿Y es la misma canción? Sin esto se tomaba cualquier canción del artista (portada equivocada)
  sameSong(a, b) {
    const strip = (t) => this.norm(String(t || '').replace(/\s*[([].*?[)\]]/g, '').replace(/\s+-\s+.*$/, ''));
    const x = strip(a);
    const y = strip(b);
    return !!x && !!y && (x === y || (Math.min(x.length, y.length) >= 4 && (x.includes(y) || y.includes(x))));
  }
  norm(x) {
    return String(x || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  async fromItunes(artist, title, country) {
    const term = encodeURIComponent(`${artist} ${title}`);
    const res = await fetch(`https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=5&country=${country}`, {
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    const hit = ((data && data.results) || []).find((r) => this.sameArtist(r.artistName, artist) && this.sameSong(r.trackName, title) && r.artworkUrl100);
    return hit ? hit.artworkUrl100.replace(/100x100bb/, '600x600bb') : null;
  }

  async fromDeezer(artist, title) {
    const tries = [`artist:"${artist}" track:"${title}"`, `${artist} ${title}`];
    for (const q of tries) {
      const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=5`, { signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      const hit = ((data && data.data) || []).find((r) => r.album && r.artist && this.sameArtist(r.artist.name, artist) && this.sameSong(r.title, title));
      if (hit) return hit.album.cover_xl || hit.album.cover_big || hit.album.cover_medium || null;
    }
    return null;
  }

  // Registro corto para revisar problemas: %APPDATA%\NostalHub\cache\spotify.log
  log(line) {
    if (!this.logFile) return;
    try {
      const fs = require('fs');
      const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
      fs.mkdirSync(path.dirname(this.logFile), { recursive: true });
      try {
        if (fs.statSync(this.logFile).size > 200000) fs.writeFileSync(this.logFile, '');
      } catch {}
      fs.appendFileSync(this.logFile, `${stamp}  ${line}\r\n`);
    } catch {}
  }

  commit(next) {
    this.state = next;
    this.emit();
  }

  // ¿La API de Spotify está dando la canción actual?
  webPlaying() {
    const w = this.web;
    return !!(w && this.appId === 'spotify' && w.state.status === 'ok' && w.state.playback && w.state.playback.item);
  }

  // Lo que ve la interfaz: lo de Windows + lo de la API de Spotify (si está conectada)
  view() {
    const app = this.appId;
    const v = { ...this.state, app, appName: this.state.app === app && this.state.appName ? this.state.appName : appNameOf(app) };
    const w = this.web;
    if (!w || app !== 'spotify') return v;
    v.web = { status: w.state.status, message: w.state.message, user: w.state.user };
    const pb = w.state.status === 'ok' ? w.state.playback : null;
    if (!pb) return v;
    Object.assign(v, { hasApi: true, device: pb.device, shuffle: pb.shuffle, smartShuffle: pb.smartShuffle, repeat: pb.repeat, liked: w.state.liked, queue: w.state.queue || [] });
    if (pb.item) {
      Object.assign(v, {
        running: true,
        playing: pb.isPlaying,
        title: pb.item.title,
        artist: pb.item.artist,
        album: pb.item.album,
        cover: pb.item.cover || (this.state.title === pb.item.title ? this.state.cover : null),
        progressMs: pb.progressMs,
        durationMs: pb.item.durationMs,
        at: w.state.at,
      });
    }
    return v;
  }
  emit() {
    const v = this.view();
    // El avance de la canción cambia en cada consulta: solo se manda si se salió de lo esperado
    // (la interfaz lo va moviendo sola), para no redibujar las pantallas cada 2 segundos.
    const { progressMs, at, ...rest } = v;
    const key = JSON.stringify(rest);
    const p = this.lastProg;
    const expected = p ? p.progressMs + (p.playing ? (at || 0) - p.at : 0) : null;
    const drift = progressMs == null || expected == null ? Infinity : Math.abs(progressMs - expected);
    if (key === this.lastSent && drift < 1500) return;
    this.lastSent = key;
    this.lastProg = progressMs == null ? null : { progressMs, at, playing: v.playing };
    this.onUpdate(v);
  }

  async poll() {
    if (!this.state.supported) return;
    if (this.mode === 'smtc') this.applySmtc(await this.ask(`poll ${this.appId}`));
    else if (this.mode === 'basic' && this.appId === 'spotify') this.pollBasic();
  }

  // ---------- Controles ----------
  ensureKeyProc() {
    if (this.keyProc && !this.keyProc.killed && this.keyProc.exitCode === null) return this.keyProc;
    const script = [
      "Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class NostalHubKeys{[DllImport(\"user32.dll\")]public static extern void keybd_event(byte b,byte s,uint f,UIntPtr e);}'",
      'while($true){$l=[Console]::In.ReadLine(); if($l -eq $null){break}; $k=[byte]$l; [NostalHubKeys]::keybd_event($k,0,1,[UIntPtr]::Zero); [NostalHubKeys]::keybd_event($k,0,3,[UIntPtr]::Zero)}',
    ].join('; ');
    this.keyProc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], {
      windowsHide: true,
      stdio: ['pipe', 'ignore', 'ignore'],
    });
    this.keyProc.on('error', () => (this.keyProc = null));
    return this.keyProc;
  }

  async control(cmd, arg) {
    const app = this.appId;
    if (cmd === 'open') {
      if (app === 'apple') spawn('explorer.exe', ['shell:AppsFolder\\AppleInc.AppleMusicWin_nzyj5cx40ttypa!App'], { windowsHide: true }).on('error', () => shell.openExternal('https://music.apple.com'));
      else if (app === 'ytmusic') shell.openExternal('https://music.youtube.com');
      else if (app === 'spotify') shell.openExternal('spotify:').catch(() => shell.openExternal('https://open.spotify.com'));
      return { ok: true };
    }
    // Lo que solo sabe hacer la API de Spotify (aleatorio, repetir, me gusta, volumen, dispositivo, saltar en la cola)
    if (!VK[cmd]) {
      if (this.web && app === 'spotify') return this.web.action(cmd, arg);
      return { ok: false };
    }
    // Con la API conectada, los botones también controlan Spotify en el teléfono u otro dispositivo
    if (this.webPlaying() && !(this.state.running && this.state.title)) return this.web.action(cmd);
    if (!this.state.supported) return { ok: false };
    if (this.mode === 'smtc' && this.helper) {
      this.applySmtc(await this.ask(`${cmd} ${app}`));
    } else {
      try {
        this.ensureKeyProc().stdin.write(`${VK[cmd]}\n`);
      } catch {}
    }
    // Refresca rápido para que la interfaz responda al tiro
    setTimeout(() => this.poll(), 400);
    setTimeout(() => this.poll(), 1300);
    if (this.webPlaying()) {
      setTimeout(() => this.web.poll(), 500);
      setTimeout(() => this.web.poll(), 1500);
    }
    return { ok: true };
  }

  dispose() {
    if (this.timer) clearInterval(this.timer);
    for (const p of [this.keyProc, this.helper]) {
      if (!p) continue;
      try {
        p.stdin.end();
        p.kill();
      } catch {}
    }
  }
}

module.exports = { Spotify, MUSIC_APPS: APPS };
