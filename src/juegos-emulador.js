// Juegos de emulador y sus logros de RetroAchievements, del lado de main.js:
// - syncEmulatorGames / addEmulatorGames: los juegos de las carpetas de cada emulador (src/emulators.js).
// - startRetroLog: abre el registro del emulador (RetroArch) para avisar los logros al instante.
// - retroTick: mientras juegas, pregunta a RetroAchievements cada 45 s y reconoce el juego si el nombre no coincidió.
// - linkRetroGames / refreshRetroTotals: el número de cada juego en RetroAchievements y sus totales.
// main.js lo conecta con registrar(nh).

const fs = require('fs');
const path = require('path');
const { app, dialog } = require('electron');
const emulators = require('./emulators');
const { anotar } = require('./registro');

let nh = null;

// ---------- RetroAchievements: reconocer los juegos y avisar los logros nuevos ----------
const RETRO_POLL_MS = 45000; // la API no avisa al instante: hay que preguntarle cada cierto rato
const RETRO_LINK_AFTER_MS = 90000;
let retroSession = null;
let retroBusy = false;
let retroLog = null; // { gameId, file, stop }: el registro del emulador abierto, para avisar al instante

// Si el emulador lo permite, lee su registro mientras juegas. Devuelve lo que hay que agregarle al abrirlo.
function startRetroLog(game) {
  stopRetroLog();
  const emu = game.type === 'emulator' && emulators.EMULATORS[game.emulator];
  if (!emu || !emu.liveLog || !nh.retro.connected) return [];
  const file = path.join(nh.dataDir, 'cache', `${game.emulator}.log`);
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.rmSync(file, { force: true });
  } catch (e) {
    anotar('retro', e);
    return [];
  }
  let raGame = game.raId;
  let list = [];
  const load = () => nh.retro.achievements(nh.retro.key(raGame)).then((r) => (list = r.list)); // con los subsets
  if (raGame) load();
  const stop = emulators.tailFile(file, (line) => {
    const known = line.match(emu.liveLog.game);
    if (known && Number(known[1]) !== Number(raGame)) {
      raGame = Number(known[1]);
      load();
    }
    const won = line.match(emu.liveLog.unlock);
    const a = won && raGame && nh.retro.liveUnlock(nh.retro.key(raGame), won[1], won[2], list, game.name);
    if (a) {
      nh.showAchievement(a);
      nh.sendSummary();
    }
  });
  retroLog = { gameId: game.id, file, stop };
  return emu.liveLog.args(file);
}
function stopRetroLog() {
  if (!retroLog) return;
  retroLog.stop();
  try {
    fs.rmSync(retroLog.file, { force: true });
  } catch {}
  retroLog = null;
}
function retroKeys() {
  return nh.config.games.filter((g) => g.raId && !g.uninstalled).map((g) => nh.retro.key(g.raId));
}
function refreshRetroTotals() {
  nh.retro.refreshTotals(retroKeys(), nh.sendSummary);
}
// Busca por nombre los juegos de emulador que todavía no tienen su número
async function linkRetroGames() {
  if (!nh.retro.connected) return;
  let changed = false;
  for (const g of nh.config.games) {
    const emu = g.type === 'emulator' && !g.raId && !g.uninstalled && emulators.EMULATORS[g.emulator];
    if (!emu || !emu.raConsole) continue;
    const id = await nh.retro.findGame(g.name, emu.raConsole);
    if (id) {
      g.raId = id;
      changed = true;
    }
  }
  if (changed) {
    nh.config.save();
    nh.pushGamesSoon();
  }
  refreshRetroTotals();
}
async function retroPoll() {
  for (const a of await nh.retro.newUnlocks()) nh.showAchievement(a);
  nh.sendSummary();
}
// Si lo último jugado en RetroAchievements cambió desde que abriste el juego, es este juego: arregla el nombre que no
// coincidió, o el que coincidió mal. Si no cambió (el juego no tiene logros ahí), no toca nada.
async function retroCheckLink(game, emu, before) {
  const last = await nh.retro.lastPlayed();
  if (!last || last.consoleId !== emu.raConsole || last.id === game.raId) return;
  if (before && before.id === last.id && before.at === last.at) return;
  game.raId = last.id;
  nh.config.save();
  nh.pushGamesSoon();
  await nh.retro.achievements(nh.retro.key(last.id));
  nh.sendSummary();
}
async function retroTick(game) {
  if (!nh.retro.connected || retroBusy) return;
  retroBusy = true;
  try {
    const now = Date.now();
    const emu = game && game.type === 'emulator' && emulators.EMULATORS[game.emulator];
    if (retroSession && (!emu || game.id !== retroSession.gameId)) {
      // Se cerró el juego: una última revisión, y otra después porque el logro puede tardar en llegar
      const raId = (nh.config.findGame(retroSession.gameId) || {}).raId;
      if (retroLog && retroLog.gameId === retroSession.gameId) stopRetroLog();
      retroSession = null;
      await retroPoll();
      setTimeout(async () => {
        try {
          if (!retroSession) await retroPoll();
          if (raId) await nh.retro.achievements(nh.retro.key(raId));
          nh.sendSummary();
        } catch (e) {
          anotar('retro', e);
        }
      }, 20000);
    }
    if (emu && emu.raConsole && !retroSession) {
      retroSession = { gameId: game.id, startedAt: now, lastPoll: now, checked: false, before: await nh.retro.lastPlayed().catch(() => null) };
      nh.retro.seen = null;
      await nh.retro.newUnlocks(); // solo anota los que ya tenías
    } else if (retroSession && now - retroSession.lastPoll >= RETRO_POLL_MS) {
      retroSession.lastPoll = now;
      await retroPoll();
    }
    if (retroSession && !retroSession.checked && now - retroSession.startedAt >= RETRO_LINK_AFTER_MS) {
      retroSession.checked = true;
      await retroCheckLink(game, emu, retroSession.before);
    }
  } catch (e) {
    anotar('retro', e);
  }
  retroBusy = false;
}

// ---------- Juegos de emulador ----------
// Agrega los juegos nuevos y esconde los que ya no están. Devuelve cuántos agregó (null si falta el emulador).
function syncEmulatorGames(id) {
  const emu = emulators.EMULATORS[id];
  const saved = (nh.config.data.emulators || {})[id] || {};
  const exe = saved.exe && fs.existsSync(saved.exe) ? saved.exe : emu.exe();
  if (!exe) return null;
  const problem = emu.problem && emu.problem(exe);
  if (problem) return { problem };
  const folders = [...emu.folders(exe, app.getPath('documents')), ...(saved.folders || []).map((dir) => ({ dir, recursive: true }))];
  const files = emulators.scanFolders(folders, emu.exts);
  const ids = new Set();
  let added = 0;
  let changed = false;
  for (const file of files) {
    const gameId = emulators.gameId(emu.idPrefix, file);
    if (ids.has(gameId)) continue; // el mismo juego en dos formatos
    ids.add(gameId);
    const fields = { type: 'emulator', emulator: id, rom: file, target: exe, args: emu.args(file, exe) };
    const g = nh.config.games.find((x) => x.id === gameId);
    if (!g) {
      nh.config.games.push({ id: gameId, name: emulators.gameName(file), hidden: false, media: {}, custom: {}, mediaCheckedAt: 0, ...fields });
      added++;
      changed = true;
    } else if (g.uninstalled || g.rom !== file || g.target !== exe || JSON.stringify(g.args) !== JSON.stringify(fields.args)) {
      Object.assign(g, fields, { uninstalled: undefined });
      changed = true;
    }
  }
  for (const g of nh.config.games) {
    if (g.type === 'emulator' && g.emulator === id && !ids.has(g.id) && !g.uninstalled) {
      g.uninstalled = true;
      changed = true;
    }
  }
  if (changed) {
    nh.config.save();
    nh.ensureCustomFolders();
    nh.pushGamesSoon();
    nh.refreshMedia();
    linkRetroGames();
  }
  return { added, total: ids.size, folders: folders.length };
}
// Botón de Ajustes: la primera vez recuerda el emulador; si no lo encuentra o no tiene carpetas, pregunta
async function addEmulatorGames(id) {
  const emu = emulators.EMULATORS[id];
  const saved = { ...((nh.config.data.emulators || {})[id] || {}) };
  if (!(saved.exe && fs.existsSync(saved.exe)) && !emu.exe()) {
    const res = await dialog.showOpenDialog(nh.ventana() || undefined, { title: `¿Dónde está ${emu.name}?`, properties: ['openFile'], filters: [{ name: emu.name, extensions: ['exe'] }] });
    if (res.canceled || !res.filePaths.length) return;
    saved.exe = res.filePaths[0];
  }
  const exe = saved.exe && fs.existsSync(saved.exe) ? saved.exe : emu.exe();
  if (!saved.folders && !emu.folders(exe, app.getPath('documents')).length) {
    const res = await dialog.showOpenDialog(nh.ventana() || undefined, { title: `Carpeta con tus juegos de ${emu.system}`, properties: ['openDirectory'] });
    if (res.canceled || !res.filePaths.length) return;
    saved.folders = [res.filePaths[0]];
  }
  nh.config.data.emulators = { ...(nh.config.data.emulators || {}), [id]: saved };
  nh.config.save();
  const r = syncEmulatorGames(id);
  if (!r) return nh.send('toast', `No se encontró ${emu.name}`);
  if (r.problem) return nh.send('toast', r.problem);
  if (!r.total) return nh.send('toast', `No hay juegos de ${emu.system} en esas carpetas`);
  nh.send('toast', r.added ? `Se agregaron ${r.added} juego${r.added === 1 ? '' : 's'} de ${emu.system}` : `No hay juegos nuevos de ${emu.system}`);
}

// nh: { config, retro, dataDir, ventana(), showAchievement, sendSummary, pushGamesSoon, ensureCustomFolders, refreshMedia, send }
function registrar(contexto) {
  nh = contexto;
}

module.exports = { registrar, startRetroLog, retroTick, linkRetroGames, refreshRetroTotals, syncEmulatorGames, addEmulatorGames };
