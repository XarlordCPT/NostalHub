# Checklist: agregar una consola nueva a NostalHub

Lista para Claude (y para Cristóbal): todo lo que **cada consola** tiene que tener antes de darla por terminada.
`<id>` es el id corto de la consola (ej.: `ps3`, `3ds`). Revisa una consola ya hecha (la PS3 o la 3DS son las
más completas) cuando tengas dudas de cómo se hace algo.

## 0. Antes de empezar

- [ ] Investigar el menú real (videos, capturas, sonidos, fuentes, colores, animaciones, posición de cada cosa).
- [ ] Preguntarle a Cristóbal lo importante antes de empezar (qué secciones, qué imagen por juego, extras).
- [ ] Nada de logos de marcas en el arte (Xbox, PlayStation, Nintendo…): usar formas propias o íconos genéricos.
- [ ] Sonidos originales de Sony/Nintendo/Microsoft: **solo en AppData** (`consolas\<id>\`), nunca en git ni en el instalador.

## 1. Registrar la consola

- [ ] `renderer/consoles.js`: entrada con `id`, `company`, `name`, `year` y `look` (background, base, text,
      subtext, accent, font, nameWeight, nameShadow, enterFlash). Si `accent` es muy claro, el selector usa `base`
      para los menús (`uiAccent` en `shell.js`): comprobar que el menú de **Ordenar** se lee bien.
- [ ] `renderer/index.html`: `<script src="themes/<id>/theme.js">` y su `theme.css`.
- [ ] `renderer/themes/<id>/theme.js` → `window.Themes['<id>'] = { mount(root, ctx), synth(kind, vol) }`.
      `mount` devuelve una función para desmontar (quitar listeners, timers, `nowPlaying.dispose()`, WebGL…).
- [ ] Todo el CSS con prefijo `.theme-<id>`; si hay overlays con `display:grid/flex`, agregar
      `.theme-<id> [hidden] { display: none !important }`. Reset de botones con `:where(.theme-<id>) button`.
- [ ] Escenario fijo de 1920×1080 (lo escala `shell.js`): nada fuera de esa caja.

## 2. Funciones que TODAS las consolas tienen

- [ ] **Juegos**: lista/grilla con `api.getState()`, `api.onGamesUpdated`, iniciar con `api.launch(id)`,
      volver de un juego con `api.onGameEnded`.
- [ ] **Vista "jugando"** (mientras el juego está abierto) con el estilo de la consola.
- [ ] **Spotify + Grupo de Discord** a los lados al jugar: `window.NostalHubUtil.nowPlaying(contenedor, api)`
      (`start()` al jugar, `stop()` al salir, `dispose()` al desmontar). Si la consola tiene una sección de música
      o de amigos, usar también `api.onSpotify` / `api.onDiscord` (ver PS3, PS4, 3DS).
- [ ] **Pestaña / sección de Logros SIEMPRE** (lista de logros del juego): `api.getAchievements(appId)`,
      `api.getAchievementSummary`, `NostalHubUtil.achievementMessage / sortAchievements / achievementTexts`.
- [ ] **Amigos de Steam** y estado de Steam: `api.onSteamSummary`, `api.onSteamChanged`.
- [ ] **Ajustes** con el estilo de la consola, generados desde `api.getMenu()` / `api.runMenu()` (las opciones
      se escriben una sola vez en `menuSections()` de `main.js`). Usar `optionValueText` / `optionNextValue`.
- [ ] Botón o atajo para **volver al selector**: `ctx.openSelector()`.
- [ ] **Avisos** con `ctx.toast(texto)` (o uno propio con el estilo de la consola).
- [ ] Teclado **y** mouse: flechas, Enter, Esc/Retroceso, rueda; todo clickeable (cuidado con capas
      transparentes que tapan clics → `pointer-events`).

## 3. Editor de imágenes por juego (clic derecho)

- [ ] Marcar cada juego con `data-game-id="<id del juego>"` y el juego abierto con `data-game-current`.
- [ ] `renderer/game-editor.js`: agregar la consola en `CONSOLE_NAMES` y en `BY_CONSOLE` (qué imágenes usa:
      `hero`, `logo`, `square`, `icon0`, `music`…). Si necesita una imagen nueva: `SLOTS` + `EDITABLE` y
      `customInfo` en `main.js` + `CUSTOM_FILES` en `src/media.js` + vista previa `.shape-*` en `shell.css`.
- [ ] Probar que la imagen elegida se ve bien (proporción correcta, sin cortes raros).

## 4. Sonidos

- [ ] `synth(kind, vol)` en el tema: sonidos hechos con código para `move`, `select`, `back`, `page`, `start`
      (y los que use: `gameboot`, `option`, `error`, `border`, `b-*`) — suenan cuando no hay archivo en AppData.
- [ ] Usar `ctx.sound(kind)` en el tema para cada acción.
- [ ] Música del menú (`musica` en `consolas\<id>\`) y `ctx.duckMusic` si suena música por juego.
- [ ] Si Cristóbal pasa los sonidos originales: copiarlos a `consolas\<id>\` con los nombres de
      `CONSOLE_FILES` (`mover`, `elegir`, `volver`, `inicio`, `gameboot`, `logro`…).

## 5. Logros encima del juego (overlay)

- [ ] `renderer/overlay/overlay.js`: función con el aviso de la consola + agregarla a `STYLES` y a `SYNTH`.
      Si la consola tenía logros/trofeos de verdad, copiar el original (posición, textos, animación, sonido).
      Si no tenía, inventar uno con su estilo (colores, fuente, forma de sus avisos).
- [ ] `renderer/overlay/overlay.css`: estilos del aviso (dentro de la ventanita de 1000×180).
- [ ] `src/overlay.js` → `POS`: `left`, `right` o (sin poner nada) arriba al centro.
- [ ] `main.js` → `ACH_STYLES` (y `PLAYSTATION` si es de Sony, para el trofeo de platino).
- [ ] Sonido propio opcional: `consolas\<id>\logro.wav`.
- [ ] Probar con **Ctrl + Alt + Shift + L** estando en esa consola.

## 6. Ventana y selector

- [ ] Estilo de la **barra de arriba** (minimizar / maximizar / cerrar) en `shell.css`:
      `body[data-console='<id>'] #winbar …`.
- [ ] Selector de consolas: imagen `consolas\<id>\icono.png` (o `modelo.glb`) y que se vea bien su fondo,
      nombre y año (el orden por fecha usa `year`).

## 7. Documentación y entrega

- [ ] `MANUAL.md`: sección "Cómo se usa la <consola>" (teclas, secciones, imágenes que usa, sonidos).
- [ ] Probar en el navegador con el mock (`renderer/mock.js`; agregar lo que falte) y en Electron real.
- [ ] Capturas de cada pantalla antes de entregar.
- [ ] Sincronizar al PC y comprobar md5; sugerir los comandos de git (Cristóbal hace el commit él mismo).
