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

- **Claves privadas**: `%APPDATA%\NostalHub\steam-api-key.txt`, `discord.txt` y `spotify.json` (tokens de
  Spotify). **No los abras, no los leas, no los muestres ni los copies**, y nunca los pidas por chat. Si hay que
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
src/launcher.js         Abre los juegos y avisa cuando terminan
src/media.js            Descarga el arte de Steam y busca el arte propio (CUSTOM_FILES)
src/spotify.js          Música por los controles multimedia de Windows (SMTC) + datos de la Web API
src/spotify-smtc.ps1    Ayudante de PowerShell para SMTC (Spotify / Apple Music / YouTube Music / auto)
src/spotify-web.js      Spotify Web API: OAuth PKCE (http://127.0.0.1:8957/callback), cola, me gusta, etc.
src/discord.js          Canal de voz de Discord por RPC local (Grupo)
renderer/index.html     Carga todo (un <script> y un <link> por tema)
renderer/shell.js/.css  Selector de consolas, escalado del escenario, sonidos, barra de ventana, F3
renderer/consoles.js    Lista de consolas (id, empresa, nombre, año, colores)
renderer/common.js      window.NostalHubUtil: helpers compartidos (ver abajo)
renderer/gamepad.js     Control (PS5/Xbox): convierte botones en las teclas de cada tema (BY_CONSOLE) y cambia
                        las pistas a ✕ ○ △ □ (HINT_KEYS). Solo con la ventana activa; filtra el doble de Steam Input.
                        El DualSense se lee además directo por WebHID (parseDualSense): con Steam abierto queda en
                        modo 0x31 y la Gamepad API no lo ve. Permiso HID solo para Sony en main.js
renderer/setup.js       Ventana "Conectar Steam / Discord / Spotify"
renderer/game-editor.js Editor de imágenes por juego (clic derecho o tecla I): BY_CONSOLE, SLOTS
renderer/console-model.js, models/   Modelos 3D (Three.js) del selector y de los íconos de la PS2
renderer/overlay/       Avisos de logro de cada consola (STYLES, SYNTH, copa del trofeo)
renderer/mock.js        Datos falsos para abrir index.html en un navegador normal (sin Electron)
renderer/themes/<id>/   theme.js + theme.css de cada consola
```

## Cómo funciona un tema

- `window.Themes['<id>'] = { mount(root, ctx), synth(kind, vol) }`. `mount` devuelve una función que **desmonta
  todo** (listeners, timers, `nowPlaying.dispose()`, `feed.dispose()`, WebGL…).
- `ctx = { api, stage, stageRect, toast, openSelector, sound, duckMusic, soundSettings, hasAsset }`.
  `api` es `window.nostalhub` (o el mock).
- Escenario fijo de **1920×1080** (lo escala `shell.js`). La 3DS dibuja sus pantallas nativas de 400×240 y
  320×240 escaladas con `K = 1.75`.
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
  - Logros: `achievementMessage`, `sortAchievements`, `achievementTexts`.
  - Otros: `partyView`, `hours`, `ago`, `playLine`, `escapeHtml`, `npIcon`, `fmtTime`.
- Datos en vivo: `api.onGamesUpdated`, `api.onGameEnded`, `api.onSteamSummary`, `api.onSteamChanged`,
  `api.onSpotify`, `api.onSpotifyWeb`, `api.onDiscord`. Las fichas de juego tienen que **repintarse** cuando llega
  un resumen nuevo (horas y logros al día después de jugar).
- Marca cada juego con `data-game-id` y el abierto con `data-game-current` (para el editor de imágenes).

## Datos del usuario (`%APPDATA%\NostalHub`)

`config.json`, `consolas\<id>\` (icono, logo, fondo, modelo, música, sonidos, intro, `logro.wav`),
`personalizar\<juego>\` (canal, fondo, logo, video, modelo, carátula, burbuja, cuadrado, icono, música,
descripción), `cache\` (arte descargado, `spotify.log`, `discord.log`) y las claves privadas de arriba.

## Cómo probar

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
- Spotify Web API (2026): la app del dueño necesita **Premium** y hay máximo 5 usuarios por app; "me gusta" usa
  `GET /me/library/contains` y `PUT/DELETE /me/library`. El aleatorio inteligente solo se puede leer.
- La portada de la canción solo se busca por internet si coincide la **misma canción**; si no, mejor ninguna.
- Discord solo funciona para la cuenta dueña de la aplicación (y sus testers).
- Battle.net no tiene API pública de amigos: no se puede.
- Elegir con `mouseenter` + mover la lista con el teclado = la selección salta al elemento que pasa bajo el mouse
  quieto. `common.js` ya ignora esos avisos después de una tecla (hasta que el mouse se mueva de verdad).
- Toda pantalla tiene que poder usarse solo con flechas + Enter + Esc (el control llega así). Filas de botones
  horizontales se mueven con ← → (ver `moveQmSub` en la PS4), no con ↑ ↓.
- Con Steam abierto, el DualSense queda en modo 0x31 y la Gamepad API no lo ve: por eso `gamepad.js` lo lee por HID.

## Decisiones de Cristóbal

- Spotify es la app de música por defecto; Apple Music, YouTube Music y Automático son opcionales.
- Amigos: sin aviso de "amigo conectado" (ninguna consola lo tenía). Siempre **Ver perfil** y **Enviar mensaje**,
  y fotos con **esquinas redondeadas**.
- Al elegir una canción de la cola se **salta hasta ella**.
- El aviso de logro usa el estilo de la **última consola elegida**.
- En pantalla completa la app también aparece en la barra de tareas de Windows (se puede apagar).
