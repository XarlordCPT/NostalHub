// Puente de la barra de música encima del juego (src/barra-musica.js): recibe lo que suena, pide la letra y, mientras la
// mueves (Ajustes → Sonido → Mover la barra de música), avisa las flechas y si se guarda.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('barra', {
  onState: (cb) => ipcRenderer.on('barra:state', (_e, p) => cb(p)),
  ready: () => ipcRenderer.send('barra:ready'),
  getLyrics: (song) => ipcRenderer.invoke('music:lyrics', song),
  nudge: (dx, dy) => ipcRenderer.send('barra:nudge', dx, dy),
  moveEnd: (guardar) => ipcRenderer.send('barra:move-end', !!guardar),
});
