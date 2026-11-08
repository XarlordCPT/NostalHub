# CLAUDE.md — NostalHub

Contexto para Claude al trabajar en este proyecto. Léelo entero antes de tocar código.

## Qué es

**NostalHub** es un launcher de juegos de escritorio (Electron, Windows) hecho por **Cristóbal Medina** para su
**segunda pantalla**. Muestra sus juegos de Steam (y otros) con los menús de **8 consolas**: `wii`, `ps2`, `x360`,
`ps3`, `ps4`, `vita`, `switch` y `3ds`. Cada consola imita su menú real (diseño, sonidos, animaciones), y todas
comparten las mismas funciones: juegos, logros de Steam, amigos de Steam, música (Spotify / Apple Music / YouTube
Music), Grupo de Discord, ajustes y aviso de logros encima del juego.

- `MANUAL.md`: manual para el usuario (cómo se usa cada consola y dónde va cada archivo). **Mantenlo al día.**
- `CONSOLA-NUEVA.md`: checklist de todo lo que tiene que tener una consola nueva. Síguelo al agregar una.
- `README.md`: introducción y primera vez (`npm install`, `npm start`).

## Cómo trabajar con Cristóbal

- Escríbele **en español**, corto y claro. Él no necesita detalles técnicos salvo que los pida.
- **Mantén lo simple simple.** Si pide un cambio chico, haz ese cambio, no rediseñes de más (se ha quejado de eso).
- Si dice "**responde en el chat antes de empezar**" o "**no hagas nada, solo responde**": solo responde, no edites.
- Para tareas grandes o ambiguas, pregunta antes de empezar (1–3 preguntas concretas). Para lo claro, hazlo.
- Muéstrale **capturas** de cómo quedó lo visual.
- **Git: él hace commit y push.** Al terminar, dale los comandos listos para copiar:
  ```
  git add -A
  git commit -m "Consola: qué cambió, en español"
  git push
  ```
  Si pide una versión nueva, sube `version` en `package.json` y agrega `git tag vX.Y.Z` + `git push --tags`.
- No borres archivos suyos. Si algo sobra, muévelo a `_to_delete/` (está en `.gitignore`) y díselo.

## Reglas que no se rompen

- **Claves privadas**: `%APPDATA%\NostalHub\steam-api-key.txt`, `discord.txt`, `retroachievements.json` y
  `spotify.json` (tokens de Spotify). **No los abras, no los leas, no los muestres ni los copies**, y nunca los pidas por chat. Si hay que
  probar algo con ellos, que lo pruebe él o hazlo por la app sin imprimir su contenido.
- El `client_secret` de Discord y los tokens de Spotify **nunca** se mandan al renderer (`spotifyWeb.peek()` y
  `setup:get` devuelven solo el estado, sin tokens).
- **Nada de logos de marcas** (PlayStation, Xbox, Nintendo, Steam…) en el arte del proyecto: usa formas propias o
  íconos genéricos. El usuario puede poner los suyos en AppData.
- **Sonidos originales** de Sony/Nintendo/Microsoft: solo en `%APPDATA%\NostalHub\consolas\<id>\`, nunca en el
  repo ni en el instalador. En el código cada tema trae sonidos **hechos con código** (`synth(kind, vol)`).

## Comandos

```
npm install        # la primera vez y cuando cambien las dependencias
npm start          # abre la app
npm run dev        # abre la app con las herramientas de desarrollo
npm run dist       # instalador de Windows (electron-builder, sale en dist/)
```

El instalador (NSIS, en español) se personaliza en `build/installer.nsh` (textos de bienvenida, final y
desinstalar; UTF-8 **con BOM**) y en `build.nsis` de `package.json`. Instalar encima actualiza sin perder
`%APPDATA%\NostalHub`. No tiene firma digital: Windows muestra "Windows protegió su PC" (ver README).
Si después de `npm install` falta `node_modules/electron/dist`, corre `node node_modules/electron/install.js`.

Después de cambiar código de `main.js` / `src/` hay que cerrar la app (menú del ícono → Salir) y volver a abrirla.
Los cambios del renderer se ven con **Ajustes → General → Recargar**.

## Estructura

```
main.js                 Proceso principal: ventana, bandeja, juegos, IPC, menú de opciones (menuSections),
                        archivos de consolas (CONSOLE_FILES), arte por juego, logros encima del juego (ACH_STYLES)
preload.js              Puente seguro: expone window.nostalhub al renderer
overlay-preload.js      Puente de la ventanita de logros
src/config.js           config.json (lista de juegos y opciones)
src/steam.js, vdf.js    Encuentra Steam, lee la biblioteca (.acf/.vdf), horas locales y qué juego corre
src/steamweb.js         Web API de Steam (con clave): logros, totales, perfil, amigos, horas (GetOwnedGames)
src/achievements.js     Detecta logros nuevos al instante leyendo los archivos de Steam (trophyTier, platino)
src/overlay.js          Ventana transparente encima del juego para el aviso de logro (POS por consola)
src/minecraft.js        Minecraft Java (launcher oficial): findLauncher y progresos al instante leyendo
                        .minecraft\logs\latest.log ("[CHAT] <nombre> has made the advancement [X]", solo inglés)
src/minecraft-icons.js  Ícono de cada progreso desde el .jar del juego (advancement JSON + en_us.json + textura
                        16×16 agrandada sin suavizar), guardado en cache\minecraft\<versión>\
src/emulators.js        Emuladores (EMULATORS: PCSX2 y RetroArch con mGBA): dónde está, carpetas, cómo abrir un juego
src/retroachievements.js Logros de los juegos de emulador: reconoce por nombre, lista con la forma de Steam, avisos
src/launcher.js         Abre los juegos y avisa cuando terminan (Minecraft: vigila javaw.exe; .url de Epic: los .exe de su
                        carpeta, sacada de IconFile). `dismiss()` (Volver al menú) no corta las horas
src/media.js            Descarga el arte de Steam y busca el arte propio (CUSTOM_FILES)
src/spotify.js          Música por los controles multimedia de Windows (SMTC) + datos de la Web API
src/spotify-smtc.ps1    Ayudante de PowerShell para SMTC (Spotify / Apple Music / YouTube Music / auto)
src/spotify-web.js      Spotify Web API: OAuth PKCE (http://127.0.0.1:8957/callback), cola, me gusta, etc.
src/discord.js          Canal de voz de Discord por RPC local (Grupo)
src/discord-presence.js Presencia en Discord (SET_ACTIVITY) con la app pública DISCORD_PRESENCE_ID de main.js
src/playlog.js          Contador de horas: sesiones en estadisticas.db (node:sqlite) y resumen por período
src/registro.js         Registro de errores (cache
ostalhub.log): `anotar('dónde', error)` en vez de un catch vacío
renderer/index.html     Carga todo (un <script> y un <link> por tema)
renderer/shell.js/.css  Selector de consolas, escalado del escenario, sonidos, barra de ventana, F3
renderer/consoles.js    Lista de consolas (id, empresa, nombre, año, colores)
renderer/common.js      window.NostalHubUtil: helpers compartidos (ver abajo)
renderer/gamepad.js     Control (PS5/Xbox): convierte botones en las teclas de cada tema (BY_CONSOLE) y cambia
                        las pistas a ✕ ○ △ □ (HINT_KEYS). Solo con la ventana activa; filtra el doble de Steam Input.
                        El DualSense se lee además directo por WebHID (parseDualSense): con Steam abierto queda en
                        modo 0x31 y la Gamepad API no lo ve. Permiso HID solo para Sony en main.js
renderer/setup.js       Ventana "Conectar Steam / Discord / Spotify"
renderer/stats.js/.css  Resumen de horas: pantalla sin consola (botón del selector, tecla R o Ajustes → General)
renderer/game-editor.js Editor de imágenes por juego (clic derecho o tecla I): BY_CONSOLE, SLOTS. Recorte: CROP_RATIOS;
                        `offerOrSave` de main.js decide qué se recorta (las animaciones se guardan completas)
renderer/console-model.js, models/   Modelos 3D (Three.js) del selector y de los íconos de la PS2
renderer/overlay/       Avisos de logro de cada consola (STYLES, SYNTH, copa del trofeo)
renderer/mock.js        Datos falsos para abrir index.html en un navegador normal (sin Electron)
renderer/themes/<id>/   theme.js + theme.css de cada consola
tests/                  `npm test`: logica/*.test.js (node --test) y pantallas.js (las 8 consolas, capturas comparadas)
```

## Cómo funciona un tema

- `window.Themes['<id>'] = { mount(root, ctx), synth(kind, vol) }`. `mount` devuelve `{ unmount() }`, que **desmonta
  todo** (listeners, timers, `nowPlaying.dispose()`, `feed.dispose()`, WebGL…).
- `ctx = { api, stage, stageRect, toast, openSelector, sound, duckMusic, soundSettings, hasAsset }`.
  `api` es `window.nostalhub` (o el mock).
- Escenario fijo de **1920×1080** (lo escala `shell.js`). La 3DS dibuja sus pantallas nativas de 400×240 y
  320×240 escaladas 1,75 veces (700×420 y 560×420) en su CSS.
- Todo el CSS con prefijo `.theme-<id>`. Si un overlay usa `display:grid/flex`, agrega
  `.theme-<id> [hidden] { display:none !important }`. Reset de botones con `:where(.theme-<id>) button`.
- Las opciones de Ajustes se escriben **una sola vez** en `menuSections()` de `main.js`; cada tema las pinta con
  `api.getMenu()` / `api.runMenu()` y `NostalHubUtil.optionValueText / optionNextValue`.
- **Helpers de `NostalHubUtil`** (úsalos, no los dupliques):
  - Música: `spotifyView(estado)`, `progressHtml(v, clase)` (se mueve sola), `nextText`, `musicActions`,
    `musicRun`, `musicSheet('queue'|'device', …)`, `nowPlaying(contenedor, api, toast)` (panel al jugar:
    música a la izquierda, Grupo a la derecha), `SHUFFLE_LABEL`, `REPEAT_LABEL`.
  - Amigos: `friendsFeed(api)` → `{ data, list, online, watch(on), onChange, profile(f), chat(f), dispose }`,
    `friendsGrouped`, `friendClass`, `friendStatus`, `friendsMessage`.
  - Logros: `achievementMessage`, `sortAchievements` (agrupa por `a.set`), `achievementTexts`. Sets (juego base, DLC,
    subsets): `achievementSetHead(lista, i)` + `setHeadHtml` (títulos dentro de una cuadrícula; ↑ ↓ con `gridMove`), o
    `withSetHeads` + `skipSetHead` (títulos como filas del mismo alto que se saltan al moverse). Juego al 100 %: `isComplete(per)`,
    `completeBadge(tipo, 'on-icon')` (platinum, medal, ps2star, seal, crown, star) y `completeKey(summary)` para
    redibujar los íconos solo cuando cambia qué juegos están completos.
  - Hora y fecha en "Jugando a…": `clockHtml(clase)` (`04:35 PM` + `Domingo 18-Oct-2026`); un solo reloj en
    `common.js` actualiza todos los `.np-clock`. Cada tema le da tamaño y márgenes en su CSS.
  - Orden de juegos: `gameOrder(id, { manual, def })` → `{ sorts, mode, label(), set(m), next(), apply(games,
    summary), save(lista) }` (Jugado recientemente, Nombre, Horas jugadas, % de logros y, con `manual`, A mano).
    Uno por consola, guardado en `localStorage` (`nostalhub.<id>.gameSort` / `gameOrder`).
  - Fondo propio (PS3, PS4, 3DS): `wallpaper(api, id)` → `{ value, set, load(), choices(games), url(games), label,
    openFolder() }`. Lee `consolas\<id>ondos\` (`api.getConsoleBackgrounds`) o usa el `hero` de un juego.
  - Otros: `partyView`, `hours`, `ago`, `playLine`, `escapeHtml` (también `'`; el 0 se muestra), `npIcon`, `fmtTime`,
    `wait(ms)`, `pad2(n)`, `fadeAudio(audio, volumen, ms, alTerminar)`.
- Datos en vivo: `api.onGamesUpdated`, `api.onGameEnded`, `api.onSteamSummary`, `api.onSteamChanged`,
  `api.onSpotify`, `api.onSpotifyWeb`, `api.onDiscord`. Las fichas de juego tienen que **repintarse** cuando llega
  un resumen nuevo (horas y logros al día después de jugar).
- Marca cada juego con `data-game-id` y el abierto con `data-game-current` (para el editor de imágenes).

## Datos del usuario (`%APPDATA%\NostalHub`)

`config.json`, `estadisticas.db` (horas), `consolas\<id>\` (icono, logo, fondo, modelo, música, sonidos, intro, `logro.wav`, `fondos\`),
`personalizar\<juego>\` (canal, fondo, logo, video, modelo, carátula, burbuja, cuadrado, icono, música,
descripción), `cache\` (arte descargado, `spotify.log`, `discord.log`) y las claves privadas de arriba.

## Cómo probar

0. **`npm test` antes de cada commit** (unos 2 minutos, no abre nada en pantalla ni usa los datos reales):
   - `tests/logica/*.test.js`: pruebas de `src/` y de `common.js` con `node --test` (archivos temporales, API falsas).
   - `tests/pantallas.js`: entra a las 8 consolas con el mock, recorre sus pantallas con el teclado y compara cada captura
     píxel a píxel con `tests/capturas/referencia/` (fecha y azar fijos, animaciones congeladas, 3D y videos escondidos).
     Si un cambio de diseño es a propósito: revisa `tests/capturas/diferencias/` y guarda las nuevas con `npm run test:referencia`.
   - Solo algunas consolas: `npm test -- wii ps2` o `npm run test:pantallas -- wii`. Pantalla nueva → agrégala a `PANTALLAS`.
1. **Diseño rápido sin Electron**: abre `renderer/index.html` en un navegador (necesita `node_modules`); usa
   `renderer/mock.js` con juegos, amigos, Spotify y Discord falsos. Si agregas una función nueva, agrégala al mock.
   Sirve para capturas con Playwright a 1920×1080.
2. **De verdad**: `npm run dev`. Ahí funcionan Steam, la música por PowerShell, Discord y los sonidos de AppData.
3. **Logro de prueba**: Ctrl + Alt + Shift + L (con el estilo de la consola actual). **F3** muestra los FPS.
4. Prueba con **teclado, mouse y control** (flechas, Enter, Esc/Retroceso, rueda, clic) y revisa que ninguna capa
   transparente tape clics (`pointer-events`). El control llega como teclas simuladas (`isTrusted` = false): los
   temas no deben depender de `isTrusted` ni de la acción por defecto del navegador.

## Cosas aprendidas (para no repetir errores)

- **Choques de clases CSS**: antes de inventar una clase, busca que no exista ya en ese tema
  (pasó con `.ta-prog` en la 3DS y con `.ps-cfg` en la PS2). Cuando reutilices estilos, acota los selectores.
- Los resets de botón de un tema (`.theme-vita button`) pueden pisar fondos: usa selectores más específicos.
- Steam no escribe `localconfig.vdf` hasta cerrarse: por eso las horas también se piden a la Web API
  (`playtimes`) y se usa la mayor. Al terminar un juego se refrescan logros y horas a los 4 s y a los 30 s.
- Spotify: `hasApi` depende de que la API esté **conectada** (`spotify.webOn()`), no de que haya algo sonando: con
  Spotify en pausa la API no da `playback` y antes salían los botones básicos. Se apaga con `config.spotifyApi`.
- Las `@keyframes` de todos los temas comparten nombre global (todo el CSS se carga junto): usa nombres con prefijo
  (`wii-`, `ps2-`, `x360-`…). `tests/logica/css.test.js` avisa si una se repite o si se usa una que no existe.
- Errores que no se ven en pantalla: `anotar('dónde', e)` de `src/registro.js` (queda en `cache
ostalhub.log`). Un
  `catch {}` vacío solo cuando fallar es normal (borrar algo que ya no está, cerrar una conexión).
- Capturas con una ventana de Electron **oculta** (`show: false`): las animaciones CSS no avanzan y lo que entra con
  animación queda invisible. Usa una ventana visible fuera de la pantalla (`x: -5000`).
- Spotify Web API (2026): la app del dueño necesita **Premium** y hay máximo 5 usuarios por app; "me gusta" usa
  `GET /me/library/contains` y `PUT/DELETE /me/library`. El aleatorio inteligente solo se puede leer.
- La portada de la canción solo se busca por internet si coincide la **misma canción**; si no, mejor ninguna.
- El Grupo de Discord solo funciona para la cuenta dueña de la aplicación (y sus testers). La presencia va en otra
  conexión, con una aplicación pública cuyo ID va en el código (el ID no es secreto; el Client Secret sí).
- RetroAchievements: en los juegos de emulador `appId` del renderer es `ra-<número>` (`achievementKey`) y `hasAch` dice
  si tiene logros: las pantallas usan `g.hasAch`, no `g.type === 'steam'`. La clave va en la dirección de la API: nunca
  escribas esa dirección en un registro. La API pregunta cada 45 s. RetroArch además avisa al instante: `startRetroLog` de `main.js` lo abre con
  `--verbose --log-file` y lee `Awarding achievement <id>: <nombre>` (`liveLog` en `emulators.js`). El registro no guarda el
  token ni deja esas opciones en `retroarch.cfg` (probado). PCSX2 sigue solo con la API.
- Imágenes animadas pesadas (`fondo.webp` de cientos de cuadros): mientras están ocultas siguen "avanzando" y al mostrarlas
  hay que decodificar todos los cuadros hasta alcanzar ese punto (más de 1 s). En la Wii: el menú muestra el primer cuadro y
  solo se anima el canal marcado, solo se dibuja la página visible y la transición usa una foto (`setZoomerImage`).
- RetroArch reescribe `retroarch.cfg` al cerrarse y guarda las rutas con `~` (carpeta personal) o `:` (su carpeta): hay
  que expandirlas (`retroarchOption`). Si no, no encuentra ningún juego.
- Horas: `trackTick` de `main.js` revisa cada 15 s qué juego está abierto (`RunningAppID` de Steam o
  `launcher.playingId()`), le avisa a `PlayLog` y actualiza la presencia. Un salto de más de 3 min entre revisiones es
  PC suspendido: corta la sesión.
- Los juegos de Epic pasan por varios programas (Fortnite: Bootstrapper → Launcher → Client): por eso se vigilan todos los de
  la carpeta, con 15 s de margen (`HANDOFF_MS`) antes de dar el juego por cerrado.
- Sets de logros: Steam los guarda en `UserGameStatsSchema_<juego>.bin` (`groups` + `groupid` en cada logro; los del juego base
  no traen grupo) → `achWatcher.setsOf`. En RetroAchievements los subsets son otros juegos ("<juego> [Subset - Nombre]", a veces
  "A | B [Subset - …]") y se buscan por nombre en la lista de la consola (`retro.subsets`; `parentOf` lleva un subset a su
  juego). Decisión de Cristóbal: el 100 % / platino es de **todo** el juego (todos los sets); los sets solo ordenan la lista.
- Battle.net no tiene API pública de amigos: no se puede. YouTube Music tampoco tiene API oficial: se queda con SMTC.
- Para probar la app con otra carpeta de datos **no sirve** cambiar `APPDATA`: Electron pide la carpeta a Windows
  directo y usa el `config.json` real de Cristóbal (solo `src/minecraft.js` sí lee `APPDATA`).
- Elegir con `mouseenter` + mover la lista con el teclado = la selección salta al elemento que pasa bajo el mouse
  quieto. `common.js` ya ignora esos avisos después de una tecla (hasta que el mouse se mueva de verdad).
- Toda pantalla tiene que poder usarse solo con flechas + Enter + Esc (el control llega así). Filas de botones
  horizontales se mueven con ← → (ver `moveQmSub` en la PS4), no con ↑ ↓.
- Con Steam abierto, el DualSense queda en modo 0x31 y la Gamepad API no lo ve: por eso `gamepad.js` lo lee por HID.
- PS2: el logo es una pieza 3D sólida (`logoDef` / `logoParts`: cara + una pared por cada píxel del contorno). No
  pongas una "cara de atrás" con el logo al derecho: desde atrás el canto se ve en espejo y no calza (salían líneas
  fantasma). Se usa siempre el frente y la pieza da media vuelta cuando está de canto.
- **El instalador quita las carpetas `examples` de `node_modules`** (regla de electron-builder), y ahí están los
  addons de Three.js (GLTFLoader…). Por eso van con un bloque `{ from, to, filter }` en `build.files` de
  `package.json`. Si usas otro addon de `three/addons/`, agrégalo a ese `filter` y revisa la app empaquetada
  (`npx electron-builder --win --dir`): en `npm start` siempre funciona aunque al instalador le falte.

## Decisiones de Cristóbal

- Spotify es la app de música por defecto; Apple Music, YouTube Music y Automático son opcionales.
- El **Grupo** de Discord nunca va mezclado con la lista de amigos: siempre su propia opción (PS3: fila "Grupo";
  3DS: atajo con audífonos).
- Orden de juegos por consola; **A mano** solo en Wii, PS Vita y 3DS (como las reales). PS3: △ → Ordenar.
- La presencia en Discord viene **apagada**: es pública y cada uno decide. Las horas cuentan desde su implementación.
- Emuladores: los juegos salen en todas las consolas, como los de Steam. NostalHub nunca trae emuladores, juegos ni
  BIOS.
- RetroAchievements: solo el aviso de NostalHub (el del emulador se apaga allá) y sus logros se suman al total de Steam.
- Amigos: sin aviso de "amigo conectado" (ninguna consola lo tenía). Siempre **Ver perfil** y **Enviar mensaje**,
  y fotos con **esquinas redondeadas**.
- Al elegir una canción de la cola se **salta hasta ella**.
- El aviso de logro usa el estilo de la **última consola elegida**.
- En pantalla completa la app también aparece en la barra de tareas de Windows (se puede apagar).
