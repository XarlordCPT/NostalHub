// Datos de prueba: solo se usan si abres index.html en un navegador normal
// (fuera de Electron), para trabajar en el diseño sin abrir la app.
(() => {
  // Opciones de prueba (las de verdad vienen de main.js → menuSections)
  const mockOpts = { tileTitle: true, trailers: true, display: 'auto', fullscreen: true, autoStart: true, music: true, sounds: true, intros: true, musicVolume: 0.35, sfxVolume: 0.6 };
  function mockMenu() {
    const o = mockOpts;
    const t = (id, label, desc) => ({ id, type: 'toggle', label, desc, value: !!o[id] });
    const a = (id, label, desc, extra) => ({ id, type: 'action', label, desc, ...extra });
    return [
      { id: 'general', title: 'General', items: [a('consoles', 'Cambiar de consola', 'Vuelve al selector de consolas.', { closes: true }), a('reload', 'Recargar', 'Vuelve a cargar la pantalla, por si algo se ve raro.', { closes: true }), a('open-manual', 'Abrir manual', 'Dónde va cada archivo que pones a mano.'), a('quit', 'Salir de NostalHub', 'Cierra la app.', { confirm: true })] },
      { id: 'games', title: 'Juegos', items: [a('import', 'Buscar juegos nuevos de Steam', 'Agrega los juegos de Steam que instalaste desde la última vez.'), a('art', 'Volver a descargar el arte', 'Descarga otra vez las imágenes de Steam de todos los juegos.'), t('tileTitle', 'Título encima de cada canal', 'En la Wii, pone el logo del juego encima de su imagen de fondo.'), t('trailers', 'Mostrar tráileres de Steam', 'Usa el tráiler de Steam como animación del juego.')] },
      { id: 'screen', title: 'Pantalla', items: [{ id: 'display', type: 'choice', label: 'Pantalla', desc: 'En qué pantalla se muestra NostalHub.', options: [{ value: 'auto', label: 'Automática (la secundaria)', short: 'Automática' }, { value: '1', label: 'Pantalla 1 — 1920×1080 (principal)', short: 'Pantalla 1' }, { value: '2', label: 'Pantalla 2 — 1920×1080', short: 'Pantalla 2' }], value: String(o.display) }, t('fullscreen', 'Cubrir la barra de tareas', 'Desactívalo si la barra de Windows aparece encima del menú.'), t('autoStart', 'Iniciar con Windows', 'Abre NostalHub sola al prender el PC.')] },
      { id: 'sound', title: 'Sonido', items: [t('music', 'Música de fondo', 'La música de cada consola (musica.mp3).'), t('sounds', 'Sonidos del menú', 'Los sonidos al moverte, elegir y volver.'), t('intros', 'Videos de inicio de las consolas', 'El video (intro.mp4) al entrar a una consola.'), { id: 'musicVolume', type: 'choice', label: 'Volumen de la música', options: [['Bajo', 0.15], ['Medio', 0.35], ['Alto', 0.6], ['Máximo', 1]].map(([label, value]) => ({ label, value })), value: Number(o.musicVolume) }, { id: 'sfxVolume', type: 'choice', label: 'Volumen de los sonidos', options: [['Bajo', 0.3], ['Medio', 0.6], ['Alto', 1]].map(([label, value]) => ({ label, value })), value: Number(o.sfxVolume) }] },
      { id: 'accounts', title: 'Cuentas', items: [a('setup-steam', 'Conectar Steam (logros)', 'Pega tu clave de Steam aquí mismo para ver tus logros, tu nombre y tu foto.', { closes: true }), a('setup-discord', 'Conectar Discord (grupo)', 'Conecta tu Discord para ver tu canal de voz y quiénes están contigo.', { closes: true })] },
      { id: 'files', title: 'Archivos', items: [a('open-custom', 'Carpeta de personalización', 'Logos, fondos, videos y modelos de cada juego.'), a('open-consoles', 'Carpeta de consolas', 'Íconos, música, sonidos y videos de inicio de cada consola.'), a('open-config', 'Abrir config.json', 'Lista de juegos y opciones.'), a('devtools', 'Herramientas de desarrollo', 'Para ver errores.')] },
    ];
  }

  if (window.nostalhub) return;

  const palettes = [
    ['#ff7a59', '#7b2cbf'], ['#00b4d8', '#023e8a'], ['#80ed99', '#38a3a5'], ['#ffd166', '#ef476f'],
    ['#c77dff', '#3c096c'], ['#f4a261', '#264653'], ['#90e0ef', '#0077b6'], ['#ff99c8', '#a06cd5'],
    ['#b5e48c', '#1e6091'], ['#ffb703', '#fb8500'], ['#e63946', '#1d3557'], ['#06d6a0', '#118ab2'],
    ['#cdb4db', '#5a189a'], ['#f72585', '#4361ee'], ['#a7c957', '#386641'],
  ];
  const names = [
    'Horizonte Perdido', 'Neón Drift', 'Bosque de Faroles', 'Cocina Caótica', 'Astro Minero',
    'Reino de Papel', 'Rally Polar', 'Mazmorras del Sur', 'Pixel Pescador', 'Torre Infinita',
    'Fútbol Robot', 'Isla de Cristal', 'Las Crónicas del Viento Antiguo', 'Ritmo Urbano', 'Granja Lunar',
  ];

  function art(w, h, [a, b], label, big) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <circle cx="${w * 0.78}" cy="${h * 0.3}" r="${h * 0.42}" fill="rgba(255,255,255,0.14)"/>
      <circle cx="${w * 0.15}" cy="${h * 0.95}" r="${h * 0.5}" fill="rgba(0,0,0,0.12)"/>
      ${label ? `<text x="50%" y="58%" text-anchor="middle" font-family="Segoe UI, sans-serif" font-weight="800" font-size="${big}" fill="white" style="paint-order:stroke" stroke="rgba(0,0,0,.25)" stroke-width="6">${label}</text>` : ''}
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function logo(label) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="240" viewBox="0 0 900 240">
      <text x="50%" y="62%" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-weight="700" font-size="110" fill="#fff8e1" stroke="#3b2a12" stroke-width="10" style="paint-order:stroke">${label}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  const games = names.map((name, i) => {
    const p = palettes[i % palettes.length];
    return {
      id: `mock-${i}`,
      name,
      type: 'steam',
      tile: i === 4 ? null : art(460, 215, p, name.length < 16 ? name : '', 44),
      tileIsVideo: false,
      tileIsCustom: false,
      tileTitle: true,
      heroIsReal: i !== 4 && i !== 7,
      hero: i === 4 ? null : i === 7 ? art(460, 215, p, name, 44) : art(1920, 620, p, '', 0),
      logo: i % 3 === 0 ? logo(name) : null,
      video: null,
      videoIsGif: false,
      trailer: null,
      trailerMp4: null,
    };
  });

  // Datos extra para el tema Xbox 360
  const DAY = 86400000;
  games.forEach((g, i) => {
    if (i === 9 || i === 12) g.type = i === 9 ? 'shortcut' : 'exe';
    g.description = i % 2 ? 'Explora un mundo enorme lleno de secretos, con amigos o en solitario. Cada partida es distinta.' : '';
    g.appId = String(1000 + i);
    g.lastPlayed = i < 6 ? Date.now() - (i * 2 + 0.2) * DAY : 0;
    g.playtimeMin = i < 8 ? (15 - i) * 97 : 0;
    g.cover = i % 4 === 3 ? null : art(600, 900, palettes[i % palettes.length], '', 0);
    g.header = g.tile;
  });
  function achIcon(i, gray) {
    const c = gray ? ['#999', '#666'] : palettes[i % palettes.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="${c[1]}"/><circle cx="32" cy="32" r="20" fill="${c[0]}"/><text x="32" y="40" font-size="22" text-anchor="middle" fill="white" font-family="sans-serif">${i + 1}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  const fakeAch = Array.from({ length: 18 }, (_, i) => ({
    id: 'a' + i,
    name: ['Implacable', 'Primeros pasos', 'Coleccionista', 'Sin un rasguño', 'Velocista', 'Maestro'][i % 6] + (i > 5 ? ' ' + i : ''),
    description: 'Completa el desafío número ' + (i + 1) + ' sin cometer faltas.',
    hidden: i === 16,
    icon: achIcon(i, false),
    iconGray: achIcon(i, true),
    done: i < 13,
    unlockTime: i < 13 ? Date.now() - i * 5 * DAY : null,
    percent: 60 - i * 3.1,
  }));
  let spState = { supported: true, running: true, playing: true, artist: 'Banda de Prueba', title: 'Canción para el menú', cover: art(300, 300, ['#f72585', '#4361ee'], '♪', 120) };
  const spCbs = new Set();
  const dcState = {
    status: 'ok',
    channel: { id: '1', name: 'Juegos', guild: 'Los del curso' },
    members: [
      { id: '1', name: 'Cristóbal', avatar: art(128, 128, ['#5865f2', '#23272a'], 'C', 60), muted: false, deafened: false, speaking: true },
      { id: '2', name: 'Benja', avatar: art(128, 128, ['#ffb703', '#fb8500'], 'B', 60), muted: true, deafened: false, speaking: false },
      { id: '3', name: 'Feña', avatar: art(128, 128, ['#06d6a0', '#118ab2'], 'F', 60), muted: false, deafened: false, speaking: false },
    ],
  };
  const dcCbs = new Set();
  const mockCustom = {};

  const noop = () => () => {};
  let endedCb = null;
  window.mockNostalHub = {
    getState: async () => ({ games }),
    launch: async (id) => {
      console.log('[mock] lanzar', id);
      return { ok: true, tracking: true };
    },
    dismissPlaying: async () => {},
    openMenu: async () => console.log('[mock] menú'),
    getMenu: async () => mockMenu(),
    runMenu: async (id, value) => {
      const it = mockMenu().flatMap((s) => s.items).find((x) => x.id === id);
      console.log('[mock] opción', id, value);
      if (it && it.type === 'toggle') mockOpts[id] = value === undefined ? !it.value : !!value;
      if (it && it.type === 'choice') mockOpts[id] = value;
      if (id === 'setup-steam' || id === 'setup-discord') window.NostalHubSetup && window.NostalHubSetup.open(id.slice(6));
      return mockMenu();
    },
    onGamesUpdated: noop,
    onGameEnded: (cb) => ((endedCb = cb), () => {}),
    onToast: noop,
    getConsoleAssets: async (ids) => ({ assets: {}, last: 'wii' }),
    selectConsole: async () => {},
    onShowSelector: noop,
    onConsolesUpdated: noop,
    quitApp: async () => console.log('[mock] salir'),
    open: async (w) => {
      console.log('[mock] abrir', w);
      if (['apikey', 'setup-steam'].includes(w) && window.NostalHubSetup) window.NostalHubSetup.open('steam');
      if (['discord', 'setup-discord'].includes(w) && window.NostalHubSetup) window.NostalHubSetup.open('discord');
    },
    getSetup: async () => ({ steam: { hasKey: false, foundUser: true, name: null }, discord: { clientId: '', hasSecret: false, state: { status: 'no-config' } } }),
    saveSteamKey: async (k) => (/^[0-9a-f]{32}$/i.test(k.trim()) ? { ok: true, name: 'Cristóbal', warning: null } : { ok: false, message: 'La clave tiene 32 letras y números (de la A a la F y del 0 al 9). Revisa que la copiaste completa.' }),
    saveDiscord: async ({ id }) => (/^\d{15,22}$/.test(String(id).trim()) ? { ok: true, state: { status: 'authorizing' } } : { ok: false, message: 'El Client ID son solo números (unos 18 o 19). Está en OAuth2 → Client ID.' }),
    getGameCustom: async (id) => {
      const g = games.find((x) => x.id === id);
      if (!g) return null;
      const c = (mockCustom[id] = mockCustom[id] || {});
      const slot = (k, auto) => ({ custom: c[k] || null, customName: c[k] ? 'archivo.png' : null, auto: auto || null, isVideo: false });
      return {
        id, name: g.name, type: g.type,
        slots: { tile: slot('tile', g.tile), hero: slot('hero', g.heroIsReal ? g.hero : null), logo: slot('logo', g.logo), video: slot('video'), model: slot('model'), cover: slot('cover', g.cover), bubble: slot('bubble', g.cover), square: slot('square'), icon0: slot('icon0', g.tile), music: slot('music') },
        description: { custom: c.desc || '', steam: g.description || '' },
      };
    },
    pickGameFile: async (id, kind) => {
      (mockCustom[id] = mockCustom[id] || {})[kind] = art(600, 600, ['#ffd166', '#ef476f'], '★', 200);
      return { ok: true, info: await window.mockNostalHub.getGameCustom(id) };
    },
    pasteGameFile: async () => ({ ok: false, message: 'No hay una imagen copiada. En el navegador: clic derecho en la imagen → "Copiar imagen".' }),
    setGameFileFrom: async (id, kind) => window.mockNostalHub.pickGameFile(id, kind),
    clearGameFile: async (id, kind) => {
      if (mockCustom[id]) delete mockCustom[id][kind];
      return { ok: true, info: await window.mockNostalHub.getGameCustom(id) };
    },
    setGameDescription: async (id, text) => {
      (mockCustom[id] = mockCustom[id] || {}).desc = text;
      return { ok: true, info: await window.mockNostalHub.getGameCustom(id) };
    },
    openGameFolder: async (id) => console.log('[mock] carpeta', id),
    readClipboard: async () => '0123456789ABCDEF0123456789ABCDEF',
    writeClipboard: async () => {},
    onSetup: noop,
    getSteamProfile: async () => ({ name: 'Cristóbal', avatar: art(184, 184, ['#6ab04c', '#30336b'], 'CM', 70), hasKey: true }),
    getAchievements: async (appId) => (appId === '1003' ? { status: 'none', list: [] } : { status: 'ok', list: fakeAch, done: 13, total: 18 }),
    getAchievementSummary: async () => ({ done: 213, total: 488, hasKey: true, perGame: { 1000: { done: 13, total: 18 }, 1001: { done: 40, total: 52 }, 1002: { done: 3, total: 30 }, 1005: { done: 22, total: 22 }, 1007: { done: 9, total: 41 } } }),
    onSteamSummary: noop,
    onSteamChanged: noop,
    spotifyWatch: async () => spState,
    spotifyControl: async (c) => {
      if (c === 'toggle') spState = { ...spState, playing: !spState.playing };
      if (c === 'next') spState = { ...spState, title: 'Siguiente canción', playing: true };
      setTimeout(() => spCbs.forEach((cb) => cb(spState)), 200);
    },
    onSpotify: (cb) => (spCbs.add(cb), () => spCbs.delete(cb)),
    discordWatch: async () => dcState,
    discordAuthorize: async () => dcState,
    onDiscord: (cb) => (dcCbs.add(cb), () => dcCbs.delete(cb)),
    getSettings: async () => ({ music: true, sounds: true, intros: true, musicVolume: 0.35, sfxVolume: 0.6 }),
    onSettings: noop,
    getFreeSpace: async () => ({ bytes: 237004800000, drive: 'C:\\' }),
    _end: () => endedCb && endedCb({ reason: 'exited' }),
  };
})();
