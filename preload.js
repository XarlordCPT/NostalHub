// Puente seguro entre la interfaz (renderer) y el proceso principal.
const { contextBridge, ipcRenderer } = require('electron');

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
  // Sonido
  getSettings: () => ipcRenderer.invoke('settings:get'),
  onSettings: on('settings:changed'),
});
