// Abre un juego según su tipo y avisa cuando termina (si se puede saber).

const path = require('path');
const { spawn } = require('child_process');
const { shell } = require('electron');
const steam = require('./steam');

const STEAM_START_TIMEOUT_MS = 3 * 60 * 1000; // si en 3 min no arranca, se asume que se canceló
const POLL_MS = 3000;

class Launcher {
  constructor(onEnded) {
    this.onEnded = onEnded; // (gameId, reason) => void
    this.session = null;
  }

  async launch(game) {
    this.stopWatching();
    switch (game.type) {
      case 'steam':
        await shell.openExternal(`steam://rungameid/${game.appId}`);
        this.watchSteam(game);
        return { ok: true, tracking: true };

      case 'url':
        await shell.openExternal(game.target);
        return { ok: true, tracking: false };

      case 'exe': {
        const child = spawn(game.target, game.args || [], {
          cwd: game.startDir || path.dirname(game.target),
          detached: true,
          stdio: 'ignore',
          windowsHide: false,
        });
        child.on('error', () => this.end(game.id, 'error'));
        child.on('exit', () => this.end(game.id, 'exited'));
        child.unref();
        this.session = { gameId: game.id, child };
        return { ok: true, tracking: true };
      }

      case 'shortcut':
      default: {
        const err = await shell.openPath(game.target);
        if (err) return { ok: false, error: err };
        return { ok: true, tracking: false };
      }
    }
  }

  watchSteam(game) {
    const appId = Number(game.appId);
    const startedAt = Date.now();
    let seenRunning = false;
    const timer = setInterval(async () => {
      const running = await steam.getRunningAppId();
      if (running === appId) {
        seenRunning = true;
      } else if (seenRunning) {
        this.end(game.id, 'exited');
      } else if (Date.now() - startedAt > STEAM_START_TIMEOUT_MS) {
        this.end(game.id, 'not-started');
      }
    }, POLL_MS);
    this.session = { gameId: game.id, timer };
  }

  end(gameId, reason) {
    if (!this.session || this.session.gameId !== gameId) return;
    this.stopWatching();
    this.onEnded(gameId, reason);
  }

  stopWatching() {
    if (this.session && this.session.timer) clearInterval(this.session.timer);
    this.session = null;
  }
}

module.exports = { Launcher };
