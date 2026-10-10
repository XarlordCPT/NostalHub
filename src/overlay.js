// Ventanita transparente, siempre encima y que no se puede clickear, para mostrar los logros encima del juego.
// Funciona con juegos en "ventana sin bordes" (y con muchos DirectX 12 en pantalla completa).
// Se crea una vez y queda escondida; cada aviso la muestra el tiempo justo.

const path = require('path');
const { BrowserWindow, screen } = require('electron');

const W = 1000; // tamaño de la ventanita a 1080p (se escala con la pantalla)
const H = 180;
// Dónde sale el aviso en cada consola (como en la de verdad). Las demás: arriba al centro.
const POS = { ps3: 'right', vita: 'right', ps2: 'right', ps4: 'left', switch: 'left' };

class Overlay {
  constructor({ dir, pickDisplay }) {
    this.dir = dir; // carpeta del proyecto (para overlay-preload.js y renderer/overlay)
    this.pickDisplay = pickDisplay; // () => Display
    this.win = null;
    this.queue = [];
    this.busy = false;
    this.ready = null;
  }

  ensure() {
    if (this.win && !this.win.isDestroyed()) return this.ready;
    this.win = new BrowserWindow({
      width: W,
      height: H,
      show: false,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      focusable: false,
      skipTaskbar: true,
      hasShadow: false,
      alwaysOnTop: true,
      title: 'NostalHub logros',
      webPreferences: {
        preload: path.join(this.dir, 'overlay-preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        autoplayPolicy: 'no-user-gesture-required',
        backgroundThrottling: false,
      },
    });
    this.win.setAlwaysOnTop(true, 'screen-saver'); // por encima de los juegos sin bordes
    this.win.setIgnoreMouseEvents(true); // los clics pasan al juego
    this.win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    this.win.on('closed', () => (this.win = null));
    this.ready = this.win.loadFile(path.join(this.dir, 'renderer', 'overlay', 'index.html')).catch(() => {});
    return this.ready;
  }

  // payload: { style: 'x360' | 'ps3' | ..., name, gamerscore, tier, icon, sound, volume }
  show(payload) {
    this.queue.push(payload);
    if (!this.busy) this.next();
  }

  async next() {
    const p = this.queue.shift();
    if (!p) {
      this.busy = false;
      if (this.win && !this.win.isDestroyed()) this.win.hide();
      return;
    }
    this.busy = true;
    await this.ensure();
    const win = this.win;
    if (!win || win.isDestroyed()) return (this.busy = false);
    // Arriba en la pantalla elegida (al centro o en la esquina de esa consola), del tamaño según su resolución
    const d = this.pickDisplay() || screen.getPrimaryDisplay();
    const k = Math.max(0.6, Math.min(2, d.bounds.height / 1080));
    const w = Math.round(W * k);
    const h = Math.round(H * k);
    const pos = POS[p.style] || 'center';
    const x = pos === 'left' ? d.bounds.x : pos === 'right' ? d.bounds.x + d.bounds.width - w : d.bounds.x + (d.bounds.width - w) / 2;
    win.setBounds({ x: Math.round(x), y: Math.round(d.bounds.y + (pos === 'center' ? 10 * k : 0)), width: w, height: h });
    win.webContents.setZoomFactor(k);
    win.setAlwaysOnTop(true, 'screen-saver');
    win.showInactive();
    win.moveTop();
    const done = new Promise((res) => {
      const t = setTimeout(res, 9000); // por si la página no responde
      win.webContents.ipc.once('overlay:done', () => (clearTimeout(t), res()));
    });
    win.webContents.send('overlay:show', p);
    await done;
    this.next();
  }

  destroy() {
    if (this.win && !this.win.isDestroyed()) this.win.destroy();
    this.win = null;
  }
}

module.exports = { Overlay };
