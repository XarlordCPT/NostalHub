// Puente seguro entre la interfaz (renderer) y el proceso principal.
const { contextBridge, ipcRenderer, webUtils } = require('electron');

function on(channel) {
  return (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  };
}

contextBridge.exposeInMainWorld('nostalhub', {
  getState: () => ipcRenderer.invoke('state:get'),
  launch: (id) => ipcRenderer.invoke('game:launch', id),
  dismissPlaying: () => ipcRenderer.invoke('game:dismiss'),
  openMenu: () => ipcRenderer.invoke('menu:popup'),
  getMenu: () => ipcRenderer.invoke('menu:model'),
  runMenu: (id, value) => ipcRenderer.invoke('menu:run', id, value),
  onGamesUpdated: on('games:updated'),
  onGameEnded: on('game:ended'),
  onToast: on('toast'),
  // Selector de consolas
  getConsoleAssets: (ids) => ipcRenderer.invoke('consoles:get', ids),
  selectConsole: (id) => ipcRenderer.invoke('console:select', id),
  setModelTilt: (id, tilt) => ipcRenderer.invoke('consoles:model-tilt', id, tilt),
  onShowSelector: on('shell:selector'),
  onConsolesUpdated: on('consoles:updated'),
  getFreeSpace: () => ipcRenderer.invoke('system:free-space'),
  quitApp: () => ipcRenderer.invoke('app:quit'),
  open: (what) => ipcRenderer.invoke('app:open', what),
  // Steam (perfil y logros)
  getSteamProfile: () => ipcRenderer.invoke('steam:profile'),
  getAchievements: (appId) => ipcRenderer.invoke('steam:achievements', appId),
  getAchievementSummary: () => ipcRenderer.invoke('steam:summary'),
  onSteamSummary: on('steam:summary'),
  onSteamChanged: on('steam:changed'),
  // Spotify
  spotifyWatch: (on) => ipcRenderer.invoke('spotify:watch', on),
  spotifyControl: (cmd) => ipcRenderer.invoke('spotify:control', cmd),
  onSpotify: on('spotify:update'),
  // Discord (grupo de la PS4)
  discordWatch: (on) => ipcRenderer.invoke('discord:watch', on),
  discordAuthorize: () => ipcRenderer.invoke('discord:authorize'),
  onDiscord: on('discord:update'),
  // Imágenes y descripción de cada juego (clic derecho → Cambiar imágenes)
  getGameCustom: (id) => ipcRenderer.invoke('game:custom-get', id),
  pickGameFile: (id, kind) => ipcRenderer.invoke('game:custom-pick', id, kind),
  setGameFileFrom: (id, kind, from) => ipcRenderer.invoke('game:custom-from', id, kind, from),
  pasteGameFile: (id, kind) => ipcRenderer.invoke('game:custom-paste', id, kind),
  clearGameFile: (id, kind) => ipcRenderer.invoke('game:custom-clear', id, kind),
  setGameDescription: (id, text) => ipcRenderer.invoke('game:description-set', id, text),
  openGameFolder: (id) => ipcRenderer.invoke('game:open-folder', id),
  pathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return '';
    }
  },
  // Conectar Steam y Discord desde la app
  getSetup: () => ipcRenderer.invoke('setup:get'),
  saveSteamKey: (key) => ipcRenderer.invoke('setup:steam', key),
  saveDiscord: (data) => ipcRenderer.invoke('setup:discord', data),
  readClipboard: () => ipcRenderer.invoke('clipboard:read'),
  writeClipboard: (text) => ipcRenderer.invoke('clipboard:write', text),
  onSetup: on('shell:setup'),
  // Ventana (modo ventana: minimizar, maximizar, cerrar)
  getWindowState: () => ipcRenderer.invoke('win:state'),
  windowControl: (action) => ipcRenderer.invoke('win:control', action),
  onWindowState: on('win:state'),
  windowDragStart: (sx, sy) => ipcRenderer.invoke('win:drag-start', sx, sy),
  windowDragMove: (x, y, w, h) => ipcRenderer.send('win:drag-move', x, y, w, h),
  // Sonido
  getSettings: () => ipcRenderer.invoke('settings:get'),
  onSettings: on('settings:changed'),
});
