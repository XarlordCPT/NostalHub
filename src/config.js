// Lectura y escritura de config.json (en %APPDATA%\NostalHub).

const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  version: 1,
  // "auto" = la pantalla secundaria (prefiere la de la derecha).
  // También puede ser el número que aparece en el menú "Pantalla" de la bandeja.
  display: 'auto',
  fullscreen: true,
  autoStart: true,
  // Al abrir, agrega solo los juegos de Steam instalados que todavía no estén en la lista.
  importSteamAutomatically: true,
  // Reproduce el tráiler de Steam en la pantalla de canal (necesita internet).
  trailers: true,
  // En el menú, cada canal = fondo del juego + su logo (o el nombre) encima.
  // false = usa la portada de Steam tal cual.
  tileTitle: true,
  // Última consola elegida en el selector (queda marcada al prender)
  lastConsole: 'wii',
  games: [],
};

class Config {
  constructor(dir) {
    this.dir = dir;
    this.file = path.join(dir, 'config.json');
    this.data = null;
  }

  load() {
    fs.mkdirSync(this.dir, { recursive: true });
    let raw = {};
    if (fs.existsSync(this.file)) {
      try {
        raw = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      } catch (e) {
        // Si el JSON quedó mal editado, lo respaldamos en vez de perderlo.
        const backup = this.file.replace(/\.json$/, `.roto-${Date.now()}.json`);
        fs.copyFileSync(this.file, backup);
        console.error(`config.json inválido, respaldado en ${backup}:`, e.message);
      }
    }
    this.data = { ...DEFAULTS, ...raw };
    this.data.games = (this.data.games || []).map(normalizeGame);
    return this.data;
  }

  save() {
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), 'utf8');
    fs.renameSync(tmp, this.file);
    this.lastWriteMs = fs.statSync(this.file).mtimeMs;
  }

  get games() {
    return this.data.games;
  }

  findGame(id) {
    return this.data.games.find((g) => g.id === id);
  }
}

// Adivina el tipo según la ruta (para juegos agregados a mano sin "type").
function detectType(target = '') {
  if (/^steam:\/\/rungameid\/\d+/i.test(target)) return 'steam';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(target)) return 'url';
  if (/\.exe$/i.test(target)) return 'exe';
  return 'shortcut';
}

function normalizeGame(g, i) {
  const name = g.name || 'Sin nombre';
  let type = g.type || detectType(g.target);
  let appId = g.appId;
  if (!appId && type === 'steam' && g.target) appId = (g.target.match(/rungameid\/(\d+)/i) || [])[1];
  const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    id: g.id || (appId ? `steam-${appId}` : `juego-${slug || i}`),
    name,
    type, // steam | shortcut | exe | url
    appId: appId ? String(appId) : undefined,
    target: g.target || undefined, // ruta del .lnk/.exe o URL
    args: g.args || [],
    hidden: !!g.hidden,
    media: g.media || {},   // lo que se descarga solo
    custom: g.custom || {}, // lo que eliges tú (tiene prioridad)
    mediaCheckedAt: g.mediaCheckedAt || 0,
    // Juegos que no son de Steam pero que agregaste a Steam: su número en Steam y la carpeta donde se abre
    steamShortcut: g.steamShortcut || undefined,
    startDir: g.startDir || undefined,
  };
}

module.exports = { Config, normalizeGame, detectType, DEFAULTS };
