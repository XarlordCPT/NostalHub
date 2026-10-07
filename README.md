# NostalHub — menú de juegos para la segunda pantalla

> **¿Dónde pongo mis imágenes, logos, modelos o la clave de Steam?** Todo eso está en **[MANUAL.md](MANUAL.md)**.

Un lanzador con estética de menú de consola: se abre con Windows, se queda en tu pantalla derecha
y cada juego es un "canal". Al hacer clic se abre la pantalla del canal con su animación, y
**Iniciar** lo abre desde Steam (o desde su acceso directo).

## Primera vez

Abre una terminal en esta carpeta (en el Explorador: clic derecho → "Abrir en Terminal") y escribe:

```
npm install
npm start
```

`npm install` se hace la primera vez y cada vez que el proyecto sume una librería nueva (descarga Electron, ~100 MB). Después basta con `npm start`.

Al abrirla por primera vez:
- Importa sola todos tus juegos de Steam instalados y les busca el arte.
- Se registra para **iniciar con Windows** (lo puedes desactivar en el menú).

## Selector de consola

**Esc en el selector** pregunta si quieres cerrar NostalHub: Esc otra vez (o *Cerrar*) la cierra, *Cancelar* o un clic
afuera vuelve.

Al prender aparece el selector: la consola a la izquierda (empresa, nombre) y su ícono a la derecha.
Se cambia con las flechas ↑ ↓, la rueda del mouse o los botones de arriba y abajo. Para entrar, haz clic
o presiona Enter. Queda marcada la última consola que usaste.

- **Volver al selector** desde el menú de la Wii: tecla Esc, o engranaje → *Cambiar de consola*.
- **Ícono de cada consola**: ajustes → Archivos → *Carpeta de consolas* → carpeta de la consola → deja
  `icono.png` (ideal cuadrado y con fondo transparente). Opcional: `fondo.jpg` para cambiar el fondo del selector
  y `logo.png` para mostrar el logo de la consola en vez de su nombre escrito.
- Todas las consolas muestran los mismos juegos; lo que cambia es el diseño del menú.

### PlayStation 2 (Memory Card)

- Tus juegos aparecen como íconos 3D flotando y girando, en una grilla de 5 columnas (con más de 20 se
  desplaza con la rueda o las flechas).
- El ícono es el **logo** del juego (el mismo `logo.png` de la carpeta de personalización). Si no tiene logo,
  se muestran sus **iniciales** en letras 3D, con un color propio para cada juego.
- **Modelos 3D**: si un juego tiene un modelo en `renderer/models/`, se usa ese en vez del logo
  (por ahora: un bloque neón original para Geometry Dash). Para agregar otro, copia `bloque-neon.js`,
  cambia `match` (ID de Steam o nombre del juego) y la figura, y súmalo en `index.html` junto a los otros.
- Arriba muestra el espacio libre real del disco donde están la mayoría de tus juegos.
- Clic (o Enter) en un juego → el ícono pasa a la izquierda y aparecen *Iniciar* y *Volver*.
- Teclado: flechas para moverte, Enter para elegir, Esc para volver (y Esc en la grilla vuelve al selector).

### Xbox 360

- Pestañas **home / social / settings**, que se cambian con Q / E, con las flechas al llegar al borde o con un
  clic en la pestaña o en los mosaicos que se asoman al lado.
- **home**:
  - El último juego que abriste (arriba a la izquierda) y un reproductor de **Spotify** que controla tu app de escritorio.
  - Abajo: Recientes, Mis juegos (tus juegos como cajas, en un carrusel), Perfil, Ajustes y Consolas.
- **Ficha del juego**: carátula, horas jugadas, última vez, descripción, *Jugar* y *Logros*.
- **Logros**: los saca de Steam con tu clave de API. Muestra los desbloqueados con su fecha, los bloqueados y qué %
  de jugadores tiene cada uno.
- **social**: tu foto y nombre de Steam, el total de logros, los juegos recientes y el mosaico **Grupo** (tu canal de voz de Discord).
- **settings**: ajustes, carpetas, clave de Steam, manual, cambiar consola y apagar.

### PlayStation 4

- **Menú principal**: tus 5 juegos más recientes y la Biblioteca. ↓ abre la ficha del juego y ↑ la fila de funciones
  (Tienda, Amigos, Grupo, Perfil, Trofeos, Ajustes, Energía).
- **Biblioteca** con filtros, búsqueda y orden; **Trofeos** con tus logros de Steam; **menú rápido** con la tecla P.
- **Grupo**: tu canal de voz de Discord y quiénes están contigo (pasos en MANUAL.md).

### Modelos 3D en el selector

Si dejas `modelo.glb` en la carpeta de una consola (`%APPDATA%\NostalHub\consolas\<consola>\`), gira en el selector
en vez de su imagen. Se puede arrastrar con el mouse.

### Agregar una consola nueva

1. Copia la carpeta `renderer/themes/wii` con otro nombre, por ejemplo `renderer/themes/ps3`, y cambia
   en su `theme.js` la línea `window.Themes.wii` por `window.Themes.ps3` y en su `theme.css` `.theme-wii` por `.theme-ps3`.
2. En `renderer/consoles.js` agrega una entrada con `id: 'ps3'`, la empresa, el nombre, el año y los colores
   del selector (`look`).
3. En `renderer/index.html` agrega `<script src="themes/ps3/theme.js"></script>` junto al de la Wii.

Si una consola está en la lista pero todavía no tiene tema, el selector la muestra y avisa que su menú no está hecho.

## Dónde está cada cosa

- **Ícono en la bandeja del sistema** (junto al reloj de Windows): clic derecho para el menú.
- **Ajustes dentro de cada consola**, con las mismas opciones: engranaje de la Wii (pantalla "Configuración de NostalHub"),
  mosaico Ajustes o tecla G en la Xbox (la Guía) y botón Configuración o tecla C en la PS2. Las opciones se definen una
  sola vez en `menuSections()` de `main.js`; la bandeja y las tres consolas salen de ahí.
- **Botón del dado** (abajo a la derecha): abre un juego al azar.
- **Para cerrar la app**: menú → *Salir*. Alt+F4 no la cierra a propósito.
- **Teclado**: ← → cambian de página o de juego, Enter = Iniciar, Esc = volver al menú.

Los datos se guardan en `%APPDATA%\NostalHub`:

| Archivo / carpeta | Para qué |
|---|---|
| `config.json` | Lista de juegos y opciones |
| `media\` | Arte descargado automáticamente (no hace falta tocarlo) |
| `personalizar\` | Tu arte propio, una carpeta por juego |
| `consolas\` | Ícono (y fondo opcional) de cada consola del selector |

## Cómo se arma cada canal del menú

Igual que en la consola: **una imagen de fondo del juego + su título encima**.
- El fondo es el arte "hero" de Steam (o una captura del juego si no tiene).
- El título es el logo oficial del juego (PNG transparente). Si no hay logo, se escribe el nombre
  con letras redondeadas y contorno.

Si prefieres la portada de Steam tal cual, desmarca en el menú *Título encima de cada canal*.

## Cambiar el arte o la animación a mano

1. Ajustes → Archivos → **Carpeta de personalización**.
2. Entra a la carpeta del juego (tiene el nombre del juego).
3. Deja ahí el archivo con uno de estos nombres:

| Nombre | Qué cambia |
|---|---|
| `fondo.jpg` / `fondo.png` | El fondo del canal en el menú **y** de la pantalla de canal |
| `logo.png` | El título, en el menú y en la pantalla de canal (ideal con fondo transparente) |
| `canal.jpg` / `canal.png` / `canal.mp4` | Reemplaza el cuadrito completo, tal cual, sin título encima (sí, puede ser un video) |
| `video.mp4`, `video.webm` o `video.gif` | La animación de la pantalla de canal |
| `modelo.glb` (o `.gltf`) | El ícono 3D del juego en la PS2 (ver "Modelos 3D con Blockbench") |
| `descripcion.txt` | La descripción del juego (reemplaza la de Steam) |

Se aplica solo al guardar el archivo. Para volver al arte automático, borra tu archivo.

Consejos:
- **Para cambiar solo el texto del título** (cuando no hay logo), edita `"name"` del juego en `config.json`.
- **Logos y fondos buenos**: en [SteamGridDB](https://www.steamgriddb.com) busca el juego. En la pestaña
  *Logos* están los títulos con fondo transparente (`logo.png`) y en *Heroes* los fondos anchos (`fondo.jpg`).
- **Para los videos**: lo ideal son 10–20 segundos, en 1920×800 o similar. El audio no importa, porque se
  reproduce en silencio.

## Descripción de cada juego

Al elegir un juego (pantalla de canal en la Wii, pantalla de detalle en la PS2) aparece su descripción corta.
Sale de la tienda de Steam, en español cuando existe, y se descarga sola la primera vez que la app abre con
internet. Para escribir la tuya, crea `descripcion.txt` en la carpeta de personalización del juego.

## Modelos 3D con Blockbench

1. En Blockbench crea un modelo **Generic Model** (cualquier tamaño: la app lo centra y lo ajusta sola).
2. Si quieres animación, hazla en la pestaña *Animate*. Ponle de nombre `idle` (o `loop`); si no, se usa la
   primera. Se repite en bucle automáticamente, y además la app lo hace girar lento como los íconos de la PS2.
3. **File → Export → Export glTF Model**: elige el formato **binario (.glb)** y deja marcadas las opciones de
   exportar animaciones y de incrustar texturas.
4. Guarda el archivo como `modelo.glb` en la carpeta del juego (ajustes → Archivos → *Carpeta de personalización*).
   Se aplica solo al guardar.

Las texturas pequeñas (estilo pixel) se muestran nítidas, sin difuminar. Si el modelo no carga, el juego vuelve
a su logo o iniciales. Prioridad en la PS2: `modelo.glb` tuyo → modelo hecho en código (`renderer/models/`) →
logo → iniciales.

## De dónde sale la animación automática

1. Las imágenes que Steam ya tiene guardadas en tu PC (portada, fondo y logo).
2. Lo que falte se baja de la tienda de Steam.
3. La animación es el **tráiler de Steam**, transmitido mientras miras el canal (necesita internet; se
   desactiva en menú → *Mostrar tráileres de Steam*). Mientras carga, o si no hay tráiler, el fondo se
   mueve lentamente.

Si algo salió mal: menú → **Volver a descargar el arte**.

## Agregar juegos

- **Steam:** se agregan solos, también los que descargues con NostalHub abierta.
- **Juegos que no son de Steam:** agrégalos a Steam como "juego que no es de Steam" (NostalHub los toma de ahí) o
  usa ajustes → Juegos → *Agregar juego o programa*.
- Los detalles (y cómo hacerlo a mano en `config.json`) están en MANUAL.md, sección 7.

## "Jugando a…"

Al iniciar un juego, el menú muestra "Jugando a X" con el tiempo de juego y pausa las animaciones.
- **Juegos de Steam y .exe**: cuando cierras el juego, vuelve solo al menú.
- **Accesos directos y URLs**: Windows no avisa cuándo terminan, así que vuelves con el botón
  *Volver al menú*.

## Opciones del menú

- **Pantalla**: automática (la que está a la derecha de la principal) o una fija.
- **Cubrir la barra de tareas**: si la barra de Windows aparece encima del menú en la segunda pantalla,
  desactiva esto. Otra opción: en Windows, Configuración → Personalización → Barra de tareas →
  Comportamientos de la barra de tareas → desmarcar "Mostrar mi barra de tareas en todas las pantallas".
- **Iniciar con Windows**.

## Estructura del código

```
main.js            Proceso principal: ventana, bandeja, arranque, juegos
preload.js         Puente seguro entre la interfaz y main.js
src/steam.js       Encuentra Steam, lee tu biblioteca y detecta qué juego está corriendo
src/vdf.js         Lector de los archivos .vdf/.acf de Steam
src/media.js       Busca y descarga el arte de cada juego
src/launcher.js    Abre los juegos y avisa cuando terminan
src/config.js      Lee y guarda config.json
renderer/index.html        Estructura base
renderer/shell.js/.css     Selector de consolas y escalado de la pantalla
renderer/consoles.js       Lista de consolas del selector
renderer/themes/wii/       El menú estilo Wii (theme.js + theme.css)
renderer/themes/ps2/       El menú estilo Memory Card de PS2
renderer/themes/x360/      El menú estilo Xbox 360
src/steamweb.js            Logros y perfil de Steam (con clave de API)
src/spotify.js             Lee y controla la app de escritorio de Spotify
src/spotify-smtc.ps1       Ayudante de Windows para Spotify (canción, portada y controles)
src/discord.js             Canal de voz de Discord (conexión local con la app de Discord)
renderer/console-model.js  Modelos 3D de las consolas en el selector
renderer/themes/ps4/       El menú estilo PS4
renderer/themes/vita/      El menú estilo PS Vita (burbujas, tarjetas LiveArea y esquina que se despega)
renderer/common.js         Textos compartidos (horas jugadas, logros, valores de las opciones)
renderer/models/           Modelos 3D para los íconos de la PS2 (Three.js)
renderer/mock.js           Datos de prueba para abrir index.html en el navegador sin Electron
```

Para depurar: `npm run dev` abre las herramientas de desarrollo.
