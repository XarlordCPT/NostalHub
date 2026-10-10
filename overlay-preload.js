// Puente de la ventanita de logros (solo recibe el aviso y dice cuándo terminó)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlay', {
  onShow: (cb) => ipcRenderer.on('overlay:show', (_e, p) => cb(p)),
  done: () => ipcRenderer.send('overlay:done'),
});
