# NostalHub

**Tus juegos, con los menús de las consolas de siempre.**

NostalHub es un lanzador de juegos para Windows pensado para tu segunda pantalla. Reúne tus juegos de Steam, Epic, emuladores
y otros programas, y los muestra con el menú de la consola que elijas, con su diseño, sus animaciones y sus sonidos.

> ¿Dónde pongo mis imágenes, sonidos o claves? ¿Cómo se usa cada consola? Todo está en el **[Manual](MANUAL.md)**.

## Consolas

| Consola | Año | Cómo se ve |
|---|---|---|
| **Wii** | 2006 | Menú de canales, con su pantalla de canal y animación |
| **PlayStation 2** | 2000 | Memory Card con íconos 3D que giran |
| **Xbox 360** | 2005 | Pestañas *home*, *social* y *settings*, con la Guía y carátulas |
| **PlayStation 3** | 2006 | Barra de categorías con la ola de fondo y el color de cada mes |
| **PlayStation 4** | 2013 | Fila de juegos, Biblioteca y menú rápido |
| **PS Vita** | 2011 | Burbujas y tarjetas con la esquina que se despega |
| **Nintendo Switch** | 2017 | Fila de juegos con botones redondos, en tema claro u oscuro |
| **Nintendo 3DS** | 2011 | Las dos pantallas, con profundidad 3D y la consola abierta |

## Qué puedes hacer

- **Juegos:** los de Steam aparecen solos. También puedes agregar otros programas, accesos directos de Epic y Minecraft Java.
- **Emuladores:** PS2 con PCSX2 y GBA con RetroArch. NostalHub los abre directo en pantalla completa y vuelve al menú al cerrarlos.
- **Logros:** los de Steam, RetroAchievements y los progresos de Minecraft, con un aviso encima del juego al estilo de tu
  consola y un sello cuando completas un juego.
- **Personalizar cada juego:** imágenes, logo, video, modelo 3D, música y descripción, con clic derecho o la tecla **I**.
  Las imágenes se pueden recortar antes de guardarlas.
- **Personalizar cada consola:** ícono o modelo 3D en el selector, música, sonidos, video de inicio y fondos propios.
- **Resumen de horas:** cuánto has jugado y a qué, por semana, mes y año.
- **Música:** controla Spotify, Apple Music o YouTube Music. Con Spotify conectado también tienes cola, me gusta,
  dispositivos y más.
- **Amigos de Steam:** quién está en línea y a qué juega, con acceso a su perfil y su chat.
- **Discord:** tu canal de voz con quiénes están contigo y, si lo activas, lo que juegas en tu estado.
- **Control:** funciona con mando de PS5, PS4 o Xbox, además de teclado y mouse.
- **Pantalla:** pantalla completa o ventana, en el monitor que elijas.

## Instalar

Necesitas **Windows 10 u 11**. No hace falta tener una segunda pantalla.

1. Descarga `NostalHub-Setup-<versión>.exe` desde [Releases](https://github.com/XarlordCPT/NostalHub/releases/latest).
2. Si aparece **"Windows protegió su PC"**, elige **Más información → Ejecutar de todas formas**. Sale porque el instalador no
   tiene firma digital.
3. Sigue los pasos del instalador.

La primera vez, NostalHub importa tus juegos de Steam y queda configurada para **iniciar con Windows**. Puedes apagarlo en
**Ajustes → Pantalla**.

**Para actualizar**, abre el instalador nuevo encima del anterior, sin desinstalar nada. Tus juegos, ajustes, imágenes y claves
se mantienen, y tampoco se borran si desinstalas.

**Para cerrar la app**, usa **Esc** en el selector de consolas, **Ajustes → General → Salir de NostalHub** o el ícono junto al
reloj de Windows. Alt+F4 no la cierra, a propósito.

## Conectar tus cuentas

Todo es opcional. Sin conectar nada ya puedes abrir tus juegos y ver sus horas y su arte. Las conexiones se hacen en
**Ajustes → Cuentas**, con los pasos en la misma ventana.

| Cuenta | Qué agrega | Qué necesitas |
|---|---|---|
| **Steam** | Logros, amigos, nombre y foto | Una clave de la Web API de Steam (gratis) |
| **Spotify** | Cola, avance de la canción, me gusta, volumen y dispositivos | Spotify Premium y una app propia en Spotify for Developers (gratis) |
| **Discord (Grupo)** | Tu canal de voz y quiénes están contigo | Discord de escritorio y una aplicación propia en Discord Developers (gratis) |
| **Discord (estado)** | Muestra lo que juegas en tu perfil. Viene apagado porque es público | Discord de escritorio |
| **RetroAchievements** | Logros de tus juegos de emulador | Tu usuario, tu Web API Key y la sesión iniciada en el emulador |

Tus claves y conexiones se guardan solo en tu PC, en `%APPDATA%\NostalHub`. **No las compartas con nadie.**

## Emuladores

NostalHub no trae emuladores, juegos ni BIOS: solo abre lo que ya tienes instalado.

| Sistema | Emulador | Archivos |
|---|---|---|
| PS2 | PCSX2 | `.iso`, `.chd`, `.cso`, `.zso`, `.gz`, `.cue`, `.mdf` |
| GBA | RetroArch con el núcleo mGBA | `.gba` |

Se agregan en **Ajustes → Implementación de Emuladores**. Los pasos, los logros y cómo usar el control están en la
[sección 7 del manual](MANUAL.md#7-agregar-juegos).

## Para programar

Necesitas [Node.js](https://nodejs.org). Desde la carpeta del proyecto:

```bash
npm install
```
```bash
npm start
```

| Comando | Para qué |
|---|---|
| `npm start` | Abre la app |
| `npm run dev` | Abre la app con las herramientas de desarrollo |
| `npm run dist` | Crea el instalador en `dist\` |
| `npm run dist:portable` | Crea la versión portable en `dist\` |

Si después de `npm install` falta `node_modules/electron/dist`, corre `node node_modules/electron/install.js`.

**Probar sin Electron:** abre `renderer/index.html` en un navegador. Usa los datos falsos de `renderer/mock.js`, así que sirve
para revisar el diseño sin tocar tus datos ni tus cuentas.

**Hecho con:** [Electron](https://www.electronjs.org), [Three.js](https://threejs.org) para los modelos 3D y
[hls.js](https://github.com/video-dev/hls.js) para los tráileres de Steam.

### Dónde está cada cosa

```
main.js              Proceso principal: ventana, bandeja, juegos, opciones de Ajustes y avisos de logros
preload.js           Puente seguro entre la interfaz y el proceso principal
src/                 Steam, Epic, emuladores, RetroAchievements, Minecraft, música, Discord, horas y arte
renderer/shell.*     Selector de consolas, escalado de la pantalla y sonidos
renderer/common.js   Funciones compartidas por todas las consolas
renderer/themes/     Un menú por consola (theme.js + theme.css)
renderer/stats.*     Pantalla del Resumen de horas
renderer/game-editor.js  Editor de imágenes de cada juego y su recorte
renderer/gamepad.js  Control de PS5, PS4 y Xbox
renderer/overlay/    Avisos de logro encima del juego
renderer/models/     Modelos 3D hechos con código para la PS2
build/               Textos del instalador
```

Tus datos se guardan fuera del proyecto, en `%APPDATA%\NostalHub`:

| Archivo o carpeta | Para qué |
|---|---|
| `config.json` | Lista de juegos y opciones |
| `estadisticas.db` | Horas de juego |
| `consolas\` | Lo que le pones a cada consola: ícono, modelo, música, sonidos y fondos |
| `personalizar\` | Lo que le pones a cada juego, una carpeta por juego |
| `media\`, `cache\` | Arte descargado y registros; no hace falta tocarlos |
| `steam-api-key.txt`, `discord.txt`, `spotify.json`, `retroachievements.json` | Tus claves: **nunca las subas ni las compartas** |

### Más documentación

- **[MANUAL.md](MANUAL.md):** cómo se usa todo y dónde va cada archivo.
- **[CONSOLA-NUEVA.md](CONSOLA-NUEVA.md):** lista de lo que necesita una consola nueva.
- **[CLAUDE.md](CLAUDE.md):** arquitectura, reglas del proyecto y errores que no hay que repetir.

## Aviso

NostalHub es un proyecto personal de Cristóbal Medina, sin relación con Nintendo, Sony, Microsoft, Valve, Epic Games, Spotify,
Discord ni RetroAchievements. Sus nombres y marcas pertenecen a sus dueños. El proyecto no incluye sus logos ni sus sonidos
originales: cada consola trae sonidos hechos con código, y quien quiera puede agregar los suyos en su propia carpeta de datos.
