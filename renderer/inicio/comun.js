/* Lo que comparten los estilos del menú principal (renderer/inicio/<estilo>.js): íconos, el arte de un juego, el
   último jugado, las horas de la semana y los datos en vivo (juegos, semana y música), con su visible(on) para que no
   se pidan mientras estás dentro de una consola. window.HomeKit */
(() => {
  const U = window.NostalHubUtil;
  const REFRESH_MS = 30000;

  const ICON = {
    stats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 20V11M12 20V4M19 20v-6"/></svg>',
    sort: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"/></svg>',
    cfg: '<svg viewBox="0 0 48 48" fill="currentColor"><path fill-rule="evenodd" d="M39.07 20.38 L43.82 21.34 L43.82 26.66 L39.07 27.62 L37.22 32.10 L39.90 36.13 L36.13 39.90 L32.10 37.22 L27.62 39.07 L26.66 43.82 L21.34 43.82 L20.38 39.07 L15.90 37.22 L11.87 39.90 L8.10 36.13 L10.78 32.10 L8.93 27.62 L4.18 26.66 L4.18 21.34 L8.93 20.38 L10.78 15.90 L8.10 11.87 L11.87 8.10 L15.90 10.78 L20.38 8.93 L21.34 4.18 L26.66 4.18 L27.62 8.93 L32.10 10.78 L36.13 8.10 L39.90 11.87 L37.22 15.90 Z M30.5 24 A6.5 6.5 0 1 0 17.5 24 A6.5 6.5 0 1 0 30.5 24 Z"/></svg>',
    music: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 35V11l19-4v24"/><circle cx="14" cy="35" r="5"/><circle cx="33" cy="31" r="5"/></svg>',
  };

  // La imagen horizontal de un juego (para miniaturas)
  const art = (g) => (g && (g.header || (g.tileIsVideo ? null : g.tile) || g.hero)) || null;
  // Los juegos jugados, del más reciente al más antiguo
  const recent = (games) => (games || []).filter((g) => g.lastPlayed).sort((a, b) => b.lastPlayed - a.lastPlayed);
  // "hace 3 horas · 24,3 h jugadas"
  const playedLine = (g) => [U.ago(g.lastPlayed), U.hours(g.playtimeMin)].filter(Boolean).join(' · ');
  // "12,4 horas", "35 min" o "Sin jugar"
  function hoursText(sec) {
    if (sec >= 3600) return `${String(Math.round(sec / 360) / 10).replace('.', ',')} horas`;
    return sec ? `${Math.max(1, Math.round(sec / 60))} min` : 'Sin jugar';
  }
  // Las barras de la semana (<i> con su alto; la de hoy con la clase now)
  function weekBars(w) {
    const buckets = (w && w.ok && w.buckets) || [];
    const max = Math.max(1, ...buckets.map((b) => b.sec));
    return buckets.map((b) => `<i class="${b.now ? 'now' : ''}" style="height:${Math.max(8, Math.round((b.sec / max) * 100))}%"></i>`).join('');
  }

  // Datos en vivo. on: { data({ games, week }), games(lista), music(estado) } — cada estilo pinta lo suyo
  function live(api, on) {
    let alive = true;
    let shown = true;
    let last = 0;
    const offs = [];
    async function refresh(force) {
      if (!force && Date.now() - last < REFRESH_MS) return;
      last = Date.now();
      const [state, week] = await Promise.all([api.getState ? api.getState().catch(() => null) : null, api.getStats ? api.getStats('week', 0).catch(() => null) : null]);
      if (alive && on.data) on.data({ games: (state && state.games) || [], week });
    }
    const music = (s) => alive && s && on.music && on.music(s);
    if (api.onSpotify) offs.push(api.onSpotify(music));
    if (api.onGamesUpdated && on.games) offs.push(api.onGamesUpdated((g) => alive && on.games(g || [])));
    if (api.spotifyWatch) api.spotifyWatch(true).then(music);
    if (on.music) on.music(null);
    refresh(true);
    return {
      refresh,
      // Mientras estás dentro de una consola no se pide la música ni se recargan los datos
      visible(v) {
        if (v === shown) return;
        shown = v;
        if (api.spotifyWatch) api.spotifyWatch(v).then((s) => v && music(s));
        if (v) refresh(true);
      },
      shown: () => shown,
      dispose() {
        alive = false;
        offs.forEach((off) => off && off());
        if (shown && api.spotifyWatch) api.spotifyWatch(false);
      },
    };
  }

  // Tu foto y nombre de Steam: cb({ name, avatar }) si hay
  function profile(api, cb) {
    if (api.getSteamProfile) api.getSteamProfile().then((p) => p && p.name && cb(p)).catch(() => {});
  }

  window.HomeKit = { ICON, art, recent, playedLine, hoursText, weekBars, live, profile };
})();
