# Checklist: agregar una consola nueva a NostalHub

Lista para Claude (y para Cristóbal): todo lo que **cada consola** tiene que tener antes de darla por terminada.
`<id>` es el id corto de la consola (ej.: `ps3`, `3ds`). Revisa una consola ya hecha cuando tengas dudas de cómo se
hace algo: la **Xbox One** es la más nueva y la más corta de leer (todo se mueve con un solo `move(dir)`); la PS3 y la
3DS son las más completas.

## 0. Antes de empezar

- [ ] Investigar el menú real (videos, capturas, sonidos, fuentes, colores, animaciones, posición de cada cosa).
- [ ] Preguntarle a Cristóbal lo importante antes de empezar (qué secciones, qué imagen por juego, extras).
- [ ] Nada de logos de marcas en el arte (Xbox, PlayStation, Nintendo…): usar formas propias o íconos genéricos.
- [ ] Sonidos originales de Sony/Nintendo/Microsoft: **solo en AppData** (`consolas\<id>\`), nunca en git ni en el instalador.

## 1. Registrar la consola

- [ ] `renderer/consoles.js`: entrada con `id`, `company`, `name`, `year` y `look` (background, base, text,
      subtext, accent, font, nameWeight, nameShadow, enterFlash). Si `accent` es muy claro, el selector usa `base`
      para los menús (`uiAccent` en `shell.js`): comprobar que el menú de **Ordenar** se lee bien.
- [ ] `renderer/index.html`: `<script src="themes/<id>/theme.js">` (el `theme.css` lo carga solo `shell.js`). Agrégala **al
      final** de `consoles.js`: las pruebas llegan a cada consola contando posiciones en el selector.
- [ ] **Separada por pantallas** desde el principio (ver "Cómo funciona un tema" en `CLAUDE.md`): `mount` arma el objeto
      compartido y cada pantalla es una función aparte que devuelve solo lo que usan las otras.
- [ ] `renderer/themes/<id>/theme.js` → `window.Themes['<id>'] = { mount(root, ctx), synth(kind, vol) }`.
      `mount` devuelve `{ unmount() }` para desmontar (quitar listeners, timers, `nowPlaying.dispose()`, WebGL…).
- [ ] Las `@keyframes` con el prefijo de la consola (`<id>-…`): todo el CSS se carga junto.
- [ ] Todo el CSS con prefijo `.theme-<id>`; si hay overlays con `display:grid/flex`, agregar
      `.theme-<id> [hidden] { display: none !important }`. Reset de botones con `:where(.theme-<id>) button` (así no
      hace falta ningún otro `!important`). Antes de inventar una clase, revisa que no choque con las que ponen los
      ayudantes (`U.friendClass`: `game`, `on`, `off`, `busy`).
- [ ] Escenario fijo de 1920×1080 (lo escala `shell.js`): nada fuera de esa caja.

## 2. Funciones que TODAS las consolas tienen

- [ ] Todo texto o dirección de imagen que vaya dentro de HTML pasa por `esc` (también `url('…')` y `src="…"`).
- [ ] Listas que suben y bajan con `translateY`: `U.rowWindow(first, row, per, total)`; o un contenedor con
      `overflow-y: auto` y `scrollIntoView({ block: 'nearest' })`.
- [ ] **Juegos**: lista/grilla con `api.getState()`, `api.onGamesUpdated`, iniciar con `api.launch(id)`,
      volver de un juego con `api.onGameEnded`.
- [ ] **Ordenar los juegos** con `U.gameOrder('<id>', { manual, def })` (Jugado recientemente, Nombre, Horas, % de
      logros; `manual: true` si la consola real dejaba mover los íconos) y una pista visible de cómo se abre.
- [ ] **Grupo** de Discord en su propia opción, nunca mezclado con la lista de amigos.
- [ ] **Vista "jugando"** (mientras el juego está abierto) con el estilo de la consola.
- [ ] **Spotify + Grupo de Discord** a los lados al jugar: `window.NostalHubUtil.nowPlaying(contenedor, api)`
      (`start()` al jugar, `stop()` al salir, `dispose()` al desmontar). Si la consola tiene una sección de música
      o de amigos, usar también `api.onSpotify` / `api.onDiscord` (ver PS3, PS4, 3DS).
- [ ] **Pestaña / sección de Logros SIEMPRE** (lista de logros del juego): `api.getAchievements(appId)`,
      `api.getAchievementSummary`, `NostalHubUtil.achievementMessage / sortAchievements / achievementTexts`.
      Con **sets** (juego base, DLC, subsets) cada uno lleva su título y contador: en cuadrículas
      `U.achievementSetHead` + `U.setHeadHtml` y ↑ ↓ con `U.gridMove`; en listas de filas del mismo alto
      `U.withSetHeads` + `U.skipSetHead` (el título no se puede marcar). Juegos de emulador: usar `g.hasAch`.
- [ ] **Juego al 100 %**: sello propio de la consola (`U.completeBadge(tipo)`, agregar un dibujo en `BADGES` de
      `common.js` si ninguno calza) en el ícono del juego (`'on-icon'`), en su ficha y en la lista de logros; texto en
      dorado con `.nh-done-text`. Redibujar los íconos cuando cambia `U.completeKey(summary)`.
- [ ] **Amigos de Steam** con el estilo de la consola, usando `const feed = U.friendsFeed(api)`:
      `feed.watch(true/false)` mientras se ve (se actualiza cada 30 s), `feed.onChange(repintar)`, `feed.data.status`,
      `feed.list`, `feed.online`, `feed.profile(f)` y `feed.chat(f)` (abren el perfil o el chat en Steam) y
      `feed.dispose()` al desmontar. Para pintar: `friendsGrouped`, `friendClass` (color del puntito), `friendStatus`,
      `friendsMessage(status)` (con botón para `no-key` / `private`). Imágenes con **esquinas redondeadas**.
      Siempre las dos acciones: **Ver perfil** y **Enviar mensaje**.
- [ ] **Música** (la app elegida en Ajustes, no solo Spotify): `const v = U.spotifyView(estado)` → usar `v.app` en
      los textos ("Abrir ${v.app}"), `U.progressHtml(v, clase)` (la barra se mueve sola), `U.nextText(v)` ("Siguiente"),
      `U.musicActions(v)` (orden, repetir, me gusta, volumen, dispositivo, cola) con `U.musicRun(api, id, v, ctx.toast)`,
      y si `v.appId === 'spotify' && !v.api`, un botón para `call('open', 'setup-spotify')`. La cola y los
      dispositivos se abren solos (`U.musicSheet`): darle colores con `.theme-<id> .ms-overlay { --ms-bg, --ms-fg,
      --ms-acc… }` en `shell.css`. El panel al jugar: `U.nowPlaying(contenedor, api, ctx.toast)`.
- [ ] Estado de Steam: `api.onSteamSummary`, `api.onSteamChanged`.
- [ ] **Ajustes** con el estilo de la consola, generados desde `api.getMenu()` / `api.runMenu()` (las opciones
      se escriben una sola vez en `menuSections()` de `main.js`). Usar `optionValueText` / `optionNextValue`.
- [ ] Botón o atajo para **volver al selector**: `ctx.openSelector()`.
- [ ] **Avisos** con `ctx.toast(texto)` (o uno propio con el estilo de la consola).
- [ ] Teclado **y** mouse: flechas, Enter, Esc/Retroceso, rueda; todo clickeable (cuidado con capas
      transparentes que tapan clics → `pointer-events`).
- [ ] **Control** (`renderer/gamepad.js`): si la consola usa teclas propias para pestañas, menú u ordenar, agregarla
      en `BY_CONSOLE` (L1/R1, Options, Create). Si dibuja pistas de teclas, agregar su selector en `HINT_KEYS`
      para que muestren ✕ ○ △ □ al usar el control.

## 3. Editor de imágenes por juego (clic derecho)

- [ ] Marcar cada juego con `data-game-id="<id del juego>"` y el juego abierto con `data-game-current`.
- [ ] `renderer/game-editor.js`: agregar la consola en `CONSOLE_NAMES` y en `BY_CONSOLE` (qué imágenes usa:
      `hero`, `logo`, `square`, `icon0`, `music`…). Si necesita una imagen nueva: `SLOTS` + `EDITABLE` y
      `customInfo` en `main.js` + `CUSTOM_FILES` en `src/media.js` + vista previa `.shape-*` en `shell.css`.
- [ ] Si la imagen nueva se puede recortar: su forma en `CROP_RATIOS` (game-editor) y el tipo en `CROPPABLE` (main.js).
- [ ] **Estilos del editor** en el `theme.css` de la consola: `.theme-<id> .ge-wrap`, `.ge-panel`, `.ge-head`, `.ge-slot`,
      `.ge-b`, `.ge-text`, `.ge-ctx`, `.ge-ci`… (copiar el bloque de otra consola y darle su aspecto). Sin eso el editor y
      el menú del clic derecho salen sin fondo, encima del menú (pasó con la Xbox One). **Abrirlo y mirarlo.**
- [ ] Imágenes animadas: las de los juegos van quietas (`U.stillBackground`) y solo se anima la del marcado
      (`U.liveBackground`); varias animaciones a la vez dan tirones.
- [ ] Probar que la imagen elegida se ve bien (proporción correcta, sin cortes raros).

## 4. Sonidos

- [ ] `synth(kind, vol)` en el tema: sonidos hechos con código para `move`, `select`, `back`, `page`, `start`
      (y los que use: `gameboot`, `option`, `error`, `border`, `b-*`) — suenan cuando no hay archivo en AppData.
- [ ] Usar `ctx.sound(kind)` en el tema para cada acción.
- [ ] Música del menú (`musica` en `consolas\<id>\`) y `ctx.duckMusic` si suena música por juego (`g.music`, con
      `U.fadeAudio`; ver la PS3 o el canal de la Wii).
- [ ] Si Cristóbal pasa los sonidos originales: copiarlos a `consolas\<id>\` con los nombres de
      `CONSOLE_FILES` (`mover`, `elegir`, `volver`, `inicio`, `gameboot`, `logro`…).

## 5. Logros encima del juego (overlay)

- [ ] `renderer/overlay/overlay.js`: función con el aviso de la consola + agregarla a `STYLES` y a `SYNTH`.
      Si la consola tenía logros/trofeos de verdad, copiar el original (posición, textos, animación, sonido).
      Si no tenía, inventar uno con su estilo (colores, fuente, forma de sus avisos).
- [ ] `renderer/overlay/overlay.css`: estilos del aviso (dentro de la ventanita de 1000×180).
- [ ] `src/overlay.js` → `POS`: `left`, `right` o (sin poner nada) arriba al centro.
- [ ] `main.js` → `ACH_STYLES` y `CONSOLE_NAMES` (y `PLAYSTATION` si es de Sony, para el trofeo de platino).
- [ ] Sonido propio opcional: `consolas\<id>\logro.wav`.
- [ ] Probar con **Ctrl + Alt + Shift + L** estando en esa consola.

## 6. Ventana y menú principal (todos sus estilos)

- [ ] Estilo de la **barra de arriba** (minimizar / maximizar / cerrar) en `shell.css`:
      `body[data-console='<id>'] #winbar …`.
- [ ] **Compatible con cada estilo del menú principal** (Ajustes → Pantalla → Estilo del menú principal; hoy: Clásico y
      Estantería, y vienen Línea de tiempo y Rueda y vista previa). Cada `renderer/inicio/<estilo>.js` dice al principio, en
      "Consola nueva:", lo que necesita de cada consola (por ejemplo su `year`, su color o una vista previa). Agregarlo y
      **mirar la consola en cada estilo**: que se lean su nombre, empresa, año y color (`uiAccent` sobre fondos claros),
      y que su `icono.png` / `modelo.glb` quepan en la tarjeta o el cuadro de ese estilo.
- [ ] Una consola nueva va **al final** de `consoles.js`: las pruebas llegan a cada una contando ← → en el selector.

## 7. Documentación y entrega

- [ ] `MANUAL.md`: sección "Cómo se usa la <consola>" (teclas, secciones, imágenes que usa, sonidos).
- [ ] Probar en el navegador con el mock (`renderer/mock.js`; agregar lo que falte) y en Electron real.
- [ ] Agregar la consola a `ORDEN` y sus pantallas a `PANTALLAS` en `tests/pantallas.js` (cómo llegar con el teclado y qué
      tiene que verse): todas las secciones, la ficha, logros, jugando y volver, y las ventanitas. **Nunca elegir un
      orden de juegos ni un tema en una prueba**: queda guardado y cambia las capturas de las corridas siguientes.
      Guardar sus capturas con `npm run test:referencia -- <id>`. `npm test` tiene que pasar entero.
- [ ] Agregarla también a las listas de `tests/app-real/consolas.js` y `tests/app-real/humo.js`.
- [ ] Revisar variables sueltas: `npx eslint@8 --no-eslintrc --env browser,es2022 --rule "no-undef: error" <tema>`
      (corrido fuera del proyecto; no se instala nada).
- [ ] Capturas de cada pantalla antes de entregar.
- [ ] Darle a Cristóbal los comandos de git (él hace el commit y el push).
