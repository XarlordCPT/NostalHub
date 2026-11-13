// Datos de prueba: solo se usan si abres index.html en un navegador normal
// (fuera de Electron), para trabajar en el diseño sin abrir la app.
(() => {
  // Opciones de prueba (las de verdad vienen de main.js → menuSections)
  const mockOpts = { tileTitle: true, trailers: true, display: 'auto', fullscreen: true, autoStart: true, music: true, sounds: true, intros: true, musicVolume: 0.35, sfxVolume: 0.6, musicApp: 'spotify', spotifyApi: true, menuStyle: new URLSearchParams(location.search).get('estilo') || 'estanteria' }; // (index.html?estilo=clasico: abrir con otro estilo guardado)
  function mockMenu() {
    const o = mockOpts;
    const t = (id, label, desc) => ({ id, type: 'toggle', label, desc, value: !!o[id] });
    const a = (id, label, desc, extra) => ({ id, type: 'action', label, desc, ...extra });
    return [
      { id: 'general', title: 'General', items: [a('consoles', 'Cambiar de consola', 'Vuelve al selector de consolas.', { closes: true }), a('open-stats', 'Resumen de horas', 'Cuánto has jugado y a qué, por semana, mes y año.', { closes: true }), a('reload', 'Recargar', 'Vuelve a cargar la pantalla, por si algo se ve raro.', { closes: true }), a('open-manual', 'Abrir manual', 'Dónde va cada archivo que pones a mano.'), a('quit', 'Salir de NostalHub', 'Cierra la app.', { confirm: true })] },
      { id: 'games', title: 'Juegos', items: [a('import', 'Buscar juegos nuevos de Steam', 'Agrega los juegos de Steam que instalaste desde la última vez.'), a('add-game', 'Agregar juego o programa', 'Elige el .exe o el acceso directo de un juego que no es de Steam.'), a('add-riot', 'Agregar juegos de Riot', 'VALORANT, League of Legends y Teamfight Tactics. Se abren por el Riot Client y vuelven solos al menú.'), a('add-minecraft', 'Agregar Minecraft (Java)', 'Con el launcher oficial. Sus progresos salen como logros encima del juego (Minecraft en inglés).'), a('art', 'Volver a descargar el arte', 'Descarga otra vez las imágenes de Steam de todos los juegos.'), t('tileTitle', 'Título encima de cada canal', 'En la Wii, pone el logo del juego encima de su imagen de fondo.'), t('trailers', 'Mostrar tráileres de Steam', 'Usa el tráiler de Steam como animación del juego.')] },
      { id: 'screen', title: 'Pantalla', items: [{ id: 'menuStyle', type: 'choice', label: 'Estilo del menú principal', desc: 'Cómo se ve el menú donde eliges la consola.', confirmChange: true, options: [{ value: 'estanteria', label: 'Estantería' }, { value: 'panel', label: 'Panel' }, { value: 'clasico', label: 'Clásico' }], value: o.menuStyle }, { id: 'windowMode', type: 'choice', label: 'Modo', desc: 'Pantalla completa, o una ventana que puedes mover, achicar y minimizar.', options: [{ value: 'fullscreen', label: 'Pantalla completa' }, { value: 'window', label: 'Ventana' }], value: 'fullscreen' }, { id: 'display', type: 'choice', label: 'Pantalla', desc: 'En qué pantalla se muestra NostalHub.', options: [{ value: 'auto', label: 'Automática (la secundaria)', short: 'Automática' }, { value: '1', label: 'Pantalla 1 — 1920×1080 (principal)', short: 'Pantalla 1' }, { value: '2', label: 'Pantalla 2 — 1920×1080', short: 'Pantalla 2' }], value: String(o.display) }, t('fullscreen', 'Cubrir la barra de tareas', 'Desactívalo si la barra de Windows aparece encima del menú.'), t('autoStart', 'Iniciar con Windows', 'Abre NostalHub sola al prender el PC.')] },
      { id: 'sound', title: 'Sonido', items: [t('music', 'Música de fondo', 'La música de cada consola (musica.mp3).'), t('sounds', 'Sonidos del menú', 'Los sonidos al moverte, elegir y volver.'), t('intros', 'Videos de inicio de las consolas', 'El video (intro.mp4) al entrar a una consola.'), { id: 'musicVolume', type: 'choice', label: 'Volumen de la música', options: [['Bajo', 0.15], ['Medio', 0.35], ['Alto', 0.6], ['Máximo', 1]].map(([label, value]) => ({ label, value })), value: Number(o.musicVolume) }, { id: 'sfxVolume', type: 'choice', label: 'Volumen de los sonidos', options: [['Bajo', 0.3], ['Medio', 0.6], ['Alto', 1]].map(([label, value]) => ({ label, value })), value: Number(o.sfxVolume) }, { id: 'musicApp', type: 'choice', label: 'App de música', desc: 'De qué app se muestra la canción en la sección Música y al jugar.', options: [{ value: 'spotify', label: 'Spotify' }, { value: 'apple', label: 'Apple Music' }, { value: 'ytmusic', label: 'YouTube Music (en el navegador)', short: 'YouTube Music' }, { value: 'auto', label: 'Automático (la que esté sonando)', short: 'Automático' }], value: o.musicApp }, ...(o.musicApp === 'spotify' ? [t('spotifyApi', 'Spotify conectado directamente', 'Muestra la cola, el avance, aleatorio, repetir, me gusta, volumen y dispositivos. Apagado: solo los botones básicos.')] : [])] },
      { id: 'emulators', title: 'Implementación de Emuladores', short: 'Emuladores', items: [a('add-pcsx2', 'Buscar juegos de PS2 (PCSX2)', 'Agrega los juegos nuevos de tus carpetas de PCSX2. Al elegir uno, se abre directo en el emulador.'), a('add-gba', 'Buscar juegos de GBA (RetroArch)', 'Agrega los juegos de la carpeta de RetroArch, con su núcleo mGBA. Al elegir uno, se abre directo en el emulador.')] },
      { id: 'accounts', title: 'Cuentas', items: [a('setup-steam', 'Conectar Steam (logros)', 'Pega tu clave de Steam aquí mismo para ver tus logros, tu nombre y tu foto.', { closes: true }), a('setup-retro', 'Conectar RetroAchievements', 'Para ver y recibir los logros de tus juegos de emulador. Tu cuenta también tiene que estar iniciada en el emulador.', { closes: true }), a('setup-discord', 'Conectar Discord (grupo)', 'Conecta tu Discord para ver tu canal de voz y quiénes están contigo.', { closes: true }), t('discordPresence', 'Mostrar en Discord lo que juegas', 'Tu estado dice que usas NostalHub, con el juego y tus logros. Lo ve cualquiera que abra tu perfil. Necesita Discord abierto.')] },
      { id: 'files', title: 'Archivos', items: [a('open-custom', 'Carpeta de personalización', 'Logos, fondos, videos y modelos de cada juego.'), a('open-consoles', 'Carpeta de consolas', 'Íconos, música, sonidos y videos de inicio de cada consola.'), a('open-config', 'Abrir config.json', 'Lista de juegos y opciones.'), a('devtools', 'Herramientas de desarrollo', 'Para ver errores.')] },
    ];
  }

  if (window.nostalhub) return;

  let mockRetro = { connected: false, user: null };
  const settingsCbs = [];
  const mockSettings = () => ({ music: mockOpts.music, sounds: mockOpts.sounds, intros: mockOpts.intros, musicVolume: Number(mockOpts.musicVolume), sfxVolume: Number(mockOpts.sfxVolume), menuStyle: mockOpts.menuStyle });
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
      hasAch: true,
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
  // Logros con sets: el juego base y dos más (como el DLC de Steam o los subsets de RetroAchievements)
  const fakeAchSets = [
    ...fakeAch,
    ...Array.from({ length: 13 }, (_, i) => ({
      id: 's' + i,
      name: i < 6 ? ['El andén', 'Último tren', 'Boleto dorado', 'Pasajero frecuente', 'Maquinista', 'Fin de la línea'][i] : `Desafío ${i - 5}`,
      description: i < 6 ? 'Logro de la expansión.' : 'Termina el desafío con 2 compañeros o menos.',
      hidden: false,
      icon: achIcon(i + 3, false),
      iconGray: achIcon(i + 3, true),
      done: i < 6 || i === 7,
      unlockTime: i < 6 || i === 7 ? Date.now() - (i + 1) * DAY : null,
      percent: 12 + i,
      set: i < 6 ? 'La estación del atardecer' : 'Desafío del Profesor',
    })),
  ];
  // Spotify de prueba, como si estuviera conectado con su API (cola, avance, aleatorio…)
  const mockQueue = [
    ['Luces de Neón', 'Los Pixeles', ['#06d6a0', '#118ab2']],
    ['Domingo en la Plaza', 'Ana Soler', ['#ffd166', '#ef476f']],
    ['Cassette', 'Banda de Prueba', ['#8338ec', '#3a86ff']],
    ['Ruta 68', 'Los Kilómetros', ['#fb5607', '#ffbe0b']],
    ['Noche de Arcade', 'Chiptune Club', ['#3a0ca3', '#4cc9f0']],
    ['Lluvia en Ñuñoa', 'Valentina Ríos', ['#2a9d8f', '#264653']],
  ].map(([title, artist, c]) => ({ uri: `spotify:track:${title}`, title, artist, cover: art(64, 64, c, '♪', 30), durationMs: 200000 }));
  let spState = {
    supported: true, running: true, playing: true, app: 'spotify', appName: 'Spotify', artist: 'Banda de Prueba', title: 'Canción para el menú', cover: art(300, 300, ['#f72585', '#4361ee'], '♪', 120),
    hasApi: true, progressMs: 71000, durationMs: 214000, at: Date.now(), shuffle: true, smartShuffle: false, repeat: 'context', liked: true,
    device: { id: 'pc', name: 'MI-PC', type: 'Computer', volume: 70, canVolume: true }, queue: mockQueue,
  };
  const spCbs = new Set();
  const winState = { mode: 'fullscreen', maximized: false };
  const winCbs = new Set();
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
      if (it && it.type !== 'action') settingsCbs.forEach((cb) => cb(mockSettings()));
      if (id === 'open-stats' && window.NostalHubStats) window.NostalHubStats.open();
      if (/^setup-/.test(id)) window.NostalHubSetup && window.NostalHubSetup.open(id.slice(6));
      return mockMenu();
    },
    onGamesUpdated: noop,
    onGameEnded: (cb) => ((endedCb = cb), () => {}),
    onToast: noop,
    getConsoleAssets: async (ids) => ({ assets: {}, last: 'wii' }),
    // Resumen de horas de prueba
    getStats: async (range, offset = 0) => {
      const labels = {
        week: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        month: Array.from({ length: 30 }, (_, i) => String(i + 1)),
        year: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        all: ['Oct', 'Nov'],
      }[range];
      const scale = { week: 5400, month: 4200, year: 90000, all: 180000 }[range];
      const buckets = labels.map((label, i) => ({ label, title: label, now: offset === 0 && i === 3, sec: (i * 7 + 3) % 5 === 0 ? 0 : Math.round(scale * (1 + ((i * 13) % 7))) }));
      const totalSec = buckets.reduce((n, b) => n + b.sec, 0);
      const share = [0.34, 0.22, 0.15, 0.11, 0.08, 0.05, 0.03, 0.02];
      return {
        ok: true,
        range,
        offset,
        title: { week: offset ? 'La semana pasada' : 'Esta semana', month: 'Noviembre 2026', year: '2026', all: 'Todo' }[range],
        words: { week: 'esta semana', month: 'este mes', year: 'este año', all: 'en total' }[range],
        canPrev: range !== 'all',
        canNext: offset < 0,
        hasAny: !window.mockStatsEmpty,
        totalSec,
        sessions: 41,
        games: 8,
        days: buckets.filter((b) => b.sec).length,
        longest: { name: games[0].name, sec: Math.round(totalSec * 0.09) },
        top: share.map((k, i) => ({ id: games[i].id, name: games[i].name, sec: Math.round(totalSec * k), sessions: 8 - i, art: games[i].hero })),
        buckets,
      };
    },
    onStats: noop,
    getConsoleBackgrounds: async () => [
      { file: 'Atardecer.jpg', name: 'Atardecer', url: art(1920, 1080, ['#ff9a62', '#5b247a'], '', 0) },
      { file: 'Bosque.png', name: 'Bosque', url: art(1920, 1080, ['#0f9b8e', '#0b3d2e'], '', 0) },
    ],
    selectConsole: async () => {},
    setModelTilt: async () => {}, // girar el modelo 3D del selector (clic derecho)
    onShowSelector: noop,
    onConsolesUpdated: noop,
    quitApp: async () => console.log('[mock] salir'),
    open: async (w) => {
      console.log('[mock] abrir', w);
      if (['apikey', 'setup-steam'].includes(w) && window.NostalHubSetup) window.NostalHubSetup.open('steam');
      if (['discord', 'setup-discord'].includes(w) && window.NostalHubSetup) window.NostalHubSetup.open('discord');
    },
    getSetup: async () => ({ steam: { hasKey: false, foundUser: true, name: null }, discord: { clientId: '', hasSecret: false, state: { status: 'no-config' } } }),
    saveRetro: async (user, key) => (user && key.trim().length >= 20 ? ((mockRetro = { connected: true, user }), { ok: true, user }) : { ok: false, message: 'Esa no parece la Web API Key.' }),
    disconnectRetro: async () => (mockRetro = { connected: false, user: null }),
    connectSpotify: async (clientId) => (clientId && clientId.trim().length >= 20 ? { ok: true } : { ok: false, message: 'Ese no parece el Client ID de tu app de Spotify.' }),
    disconnectSpotify: async () => ({ ok: true }),
    pathForFile: (file) => (file && file.name) || '', // en el navegador no hay rutas: solo el nombre
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
    pickGameFile: async () => ({ ok: true, crop: { preview: art(1600, 900, ['#ffd166', '#ef476f'], '★', 300), source: 'prueba.png', ext: '.png' } }),
    cropGameFile: async (id, kind, bytes) => {
      window.mockLastCrop = { kind, bytes: bytes.length };
      (mockCustom[id] = mockCustom[id] || {})[kind] = art(600, 600, ['#ffd166', '#ef476f'], '★', 200);
      return { ok: true, info: await window.mockNostalHub.getGameCustom(id) };
    },
    pasteGameFile: async () => ({ ok: false, message: 'No hay una imagen copiada. En el navegador: clic derecho en la imagen → "Copiar imagen".' }),
    setGameFileFrom: async (id, kind, from) => {
      if (!(from && from.whole)) return window.mockNostalHub.pickGameFile(id, kind);
      (mockCustom[id] = mockCustom[id] || {})[kind] = art(600, 600, ['#ffd166', '#ef476f'], '★', 200);
      return { ok: true, info: await window.mockNostalHub.getGameCustom(id) };
    },
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
    getFriends: async () => {
      const h = 3600 * 1000;
      const list = [
        { name: 'Borealis', state: 1, game: "Baldur's Gate 3" },
        { name: 'Agnt-P', state: 1 },
        { name: 'DonShelo', state: 1 },
        { name: 'eldiablo', state: 1 },
        { name: 'Javitoire!', state: 2 },
        { name: 'Xetumori', state: 1 },
        { name: 'Schoom', state: 3 },
        { name: 'Tito Calderon', state: 4 },
        { name: 'LuSu', state: 0, lastSeen: Date.now() - 2 * h },
        { name: 'Nati', state: 0, lastSeen: Date.now() - 26 * h },
        { name: 'Saonida', state: 0, lastSeen: Date.now() - 9 * 24 * h },
        { name: 'SPUB20', state: 0, lastSeen: Date.now() - 40 * 24 * h },
      ].map((f, i) => ({ id: String(76561198000000000 + i), avatar: null, game: null, lastSeen: null, url: null, ...f }));
      return { status: 'ok', list };
    },
    // Con sets (juego base + DLC + desafío), menos el juego 1001 (un solo set, como la mayoría)
    getAchievements: async (appId) => {
      if (appId === '1003') return { status: 'none', list: [] };
      const list = appId === '1001' ? fakeAch : fakeAchSets; // el total es de todos los sets
      return { status: 'ok', list, done: list.filter((a) => a.done).length, total: list.length };
    },
    getAchievementSummary: async () => ({ done: 213, total: 488, hasKey: true, perGame: { 1000: { done: 13, total: 18 }, 1001: { done: 40, total: 52 }, 1002: { done: 3, total: 30 }, 1005: { done: 22, total: 22 }, 1007: { done: 9, total: 41 } } }),
    onSteamSummary: noop,
    onSteamChanged: noop,
    spotifyWatch: async () => spState,
    spotifyControl: async (c, arg) => {
      const now = Date.now();
      const pos = spState.progressMs + (spState.playing ? now - spState.at : 0);
      if (c === 'toggle') spState = { ...spState, playing: !spState.playing, progressMs: pos, at: now };
      if (c === 'next' || c === 'skipto') {
        const n = c === 'skipto' ? Number(arg) || 0 : 0;
        const t = spState.queue[n] || { title: 'Siguiente canción', artist: 'Banda de Prueba' };
        spState = { ...spState, title: t.title, artist: t.artist, cover: t.cover || spState.cover, playing: true, progressMs: 0, at: now, queue: spState.queue.slice(n + 1), liked: false };
      }
      if (c === 'shuffle') spState = { ...spState, shuffle: !spState.shuffle, smartShuffle: false };
      if (c === 'repeat') spState = { ...spState, repeat: { off: 'context', context: 'track', track: 'off' }[spState.repeat] };
      if (c === 'like') spState = { ...spState, liked: !spState.liked };
      if (c === 'volume') spState = { ...spState, device: { ...spState.device, volume: Math.max(0, Math.min(100, arg && typeof arg === 'object' ? Number(arg.value) : spState.device.volume + Number(arg))) } };
      if (c === 'device') spState = { ...spState, device: { ...spState.device, id: arg, name: arg === 'phone' ? 'iPhone de Cristóbal' : 'MI-PC', type: arg === 'phone' ? 'Smartphone' : 'Computer' } };
      setTimeout(() => spCbs.forEach((cb) => cb(spState)), 200);
      return { ok: true };
    },
    spotifyDevices: async () => [
      { id: 'pc', name: 'MI-PC', type: 'Computer', active: spState.device.id === 'pc', volume: 70 },
      { id: 'phone', name: 'iPhone de Cristóbal', type: 'Smartphone', active: spState.device.id === 'phone', volume: 50 },
      { id: 'tv', name: 'Living', type: 'Speaker', active: false, volume: 40 },
    ],
    onSpotify: (cb) => (spCbs.add(cb), () => spCbs.delete(cb)),
    onSpotifyWeb: () => () => {}, // la conexión directa con Spotify no cambia en el mock
    discordWatch: async () => dcState,
    discordAuthorize: async () => dcState,
    onDiscord: (cb) => (dcCbs.add(cb), () => dcCbs.delete(cb)),
    getSettings: async () => mockSettings(),
    onSettings: (cb) => (settingsCbs.push(cb), () => settingsCbs.splice(settingsCbs.indexOf(cb), 1)),
    // Ventana: en el navegador se puede probar la barra con mockNostalHub.__win('window')
    getWindowState: async () => ({ ...winState }),
    windowControl: async (a) => (a === 'maximize' && (winState.maximized = !winState.maximized), { ...winState }),
    onWindowState: (cb) => (winCbs.add(cb), () => winCbs.delete(cb)),
    windowDragStart: async () => {}, // mover la ventana arrastrando la barra (en el navegador no se mueve)
    windowDragMove: () => {},
    __win: (mode) => ((winState.mode = mode), winCbs.forEach((cb) => cb({ ...winState }))),
    getFreeSpace: async () => ({ bytes: 237004800000, drive: 'C:\\' }),
    _end: () => endedCb && endedCb({ reason: 'exited' }),
  };
})();
