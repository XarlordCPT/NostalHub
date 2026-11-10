// Juegos de Riot (VALORANT, League of Legends, Teamfight Tactics). Riot obliga a abrirlos por el Riot Client: NostalHub
// hace lo mismo que sus accesos directos (RiotClientServices.exe --launch-product=<juego> --launch-patchline=live) y
// después vigila el programa del juego (src/launcher.js), porque el Riot Client se queda abierto en segundo plano.
// Dónde está todo lo anota Riot en C:\ProgramData\Riot Games (solo rutas: nada privado).

const fs = require('fs');
const path = require('path');

// open: mientras alguno esté abierto, sigues "jugando" (la pantalla de NostalHub espera).
// playing: mientras alguno esté abierto, cuentan las horas. En League of Legends solo la partida, no el cliente (lobby).
const PRODUCTS = {
  valorant: { name: 'VALORANT', open: ['VALORANT.exe', 'VALORANT-Win64-Shipping.exe'], playing: ['VALORANT-Win64-Shipping.exe'] },
  league_of_legends: { name: 'League of Legends', open: ['LeagueClient.exe', 'LeagueClientUx.exe', 'League of Legends.exe'], playing: ['League of Legends.exe'] },
  teamfighttactics: { name: 'Teamfight Tactics', open: ['TFTClient.exe', 'TFTClient-Win64-Shipping.exe'], playing: ['TFTClient-Win64-Shipping.exe'] },
};

const RIOT_DIR = path.join(process.env.ProgramData || 'C:\\ProgramData', 'Riot Games');

// El RiotClientServices.exe instalado, o null
function riotClient(dir = RIOT_DIR) {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(dir, 'RiotClientInstalls.json'), 'utf8'));
    const exe = j.rc_default || j.rc_live;
    return exe && fs.existsSync(exe) ? path.normalize(exe) : null;
  } catch {
    return null;
  }
}

// Los juegos de Riot que tienes instalados (versión "live"): [{ id, name, path }]
function installedProducts(dir = RIOT_DIR) {
  const out = [];
  for (const [id, p] of Object.entries(PRODUCTS)) {
    let text = '';
    try {
      text = fs.readFileSync(path.join(dir, 'Metadata', `${id}.live`, `${id}.live.product_settings.yaml`), 'utf8');
    } catch {
      continue;
    }
    const m = text.match(/^product_install_full_path:\s*"?(.+?)"?\s*$/m);
    const folder = m && path.normalize(m[1].replace(/\\\\/g, '\\'));
    if (folder && fs.existsSync(folder)) out.push({ id, name: p.name, path: folder });
  }
  return out;
}

// ---------- Apretar "Jugar" en el Riot Client ----------
// El Riot Client tiene una conexión local (solo en este PC): su lockfile dice el puerto y una contraseña que cambia cada
// vez que se abre. POST /product-launcher/v1/products/<juego>/patchlines/<versión> es lo mismo que su botón "Jugar"
// (no está en su lista pública, pero responde; probado en el PC de Cristóbal con TFT). La contraseña nunca se anota.
const LOCKFILE = path.join(process.env.LOCALAPPDATA || '', 'Riot Games', 'Riot Client', 'Config', 'lockfile');

function httpsPedir(opciones) {
  return new Promise((resolve) => {
    const req = require('https').request({ ...opciones, rejectUnauthorized: false, timeout: 5000 }, (res) => {
      res.resume();
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve(null));
    req.end();
  });
}

// true si el Riot Client aceptó abrir el juego. opts (para las pruebas): { lockfile, pedir }
async function launchProduct(product, patchline = 'live', opts = {}) {
  let partes;
  try {
    partes = fs.readFileSync(opts.lockfile || LOCKFILE, 'utf8').trim().split(':'); // nombre:pid:puerto:contraseña:protocolo
  } catch {
    return false; // el Riot Client no está abierto
  }
  const [, , port, password] = partes;
  if (!port || !password) return false;
  const status = await (opts.pedir || httpsPedir)({
    host: '127.0.0.1',
    port: Number(port),
    method: 'POST',
    path: `/product-launcher/v1/products/${encodeURIComponent(product)}/patchlines/${encodeURIComponent(patchline)}`,
    headers: { Authorization: 'Basic ' + Buffer.from(`riot:${password}`).toString('base64'), 'Content-Length': 0 },
  });
  return status >= 200 && status < 300;
}

// Reintenta cada 2 s (por ejemplo, mientras el Riot Client termina de abrir) hasta que acepte o hasta que seguir() diga
// que no (el juego ya se abrió, o lo cancelaste). Máximo 90 s.
async function launchWhenReady(product, patchline, seguir, opts = {}) {
  const hasta = Date.now() + (opts.maxMs || 90000);
  while (Date.now() < hasta && seguir()) {
    if (await launchProduct(product, patchline, opts)) return true;
    await new Promise((r) => setTimeout(r, opts.cadaMs || 2000));
  }
  return false;
}

module.exports = { PRODUCTS, RIOT_DIR, LOCKFILE, riotClient, installedProducts, launchProduct, launchWhenReady };
