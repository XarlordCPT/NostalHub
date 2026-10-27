# Manual de NostalHub

NostalHub muestra tus juegos con los menús de 8 consolas: **Wii, PlayStation 2, Xbox 360, PlayStation 3,
PlayStation 4, PS Vita, Nintendo Switch y Nintendo 3DS**. Este manual explica cómo se usa cada una y dónde va cada
archivo que pones a mano.

Todo lo que agregas tú (imágenes, sonidos, modelos, claves) vive en **una sola carpeta de datos**, separada del código:

```
%APPDATA%\NostalHub
```

Para abrirla: pega esa ruta en la barra del Explorador de Windows, o usa **Ajustes → Archivos** en cualquier consola
(también el clic derecho en el ícono de NostalHub junto al reloj de Windows).

> Después de copiar o cambiar un archivo, **no hace falta reiniciar**: la app lo detecta sola en uno o dos segundos.
> La excepción es si cambias el **código** del proyecto: ahí sí hay que cerrar (menú → Salir) y volver a hacer `npm start`.

---

## Mapa rápido

```
%APPDATA%\NostalHub
├── steam-api-key.txt          ← tu clave de Steam (logros, amigos, nombre y foto)   ¡no la compartas!
├── discord.txt                ← tu aplicación de Discord (el Grupo)                  ¡no la compartas!
├── spotify.json               ← la conexión con Spotify (cola, me gusta…)            ¡no la compartas!
├── config.json                ← lista de juegos y opciones
├── cache\                     ← cosas que la app descarga sola (y los registros spotify.log y discord.log)
├── consolas\                  ← una carpeta por consola del selector
│   ├── wii\  ps2\  x360\  ps3\  ps4\  vita\  switch\  3ds\
│   │   ├── icono.png  /  modelo.glb   ← imagen o modelo 3D de la consola en el selector
│   │   ├── logo.png                   ← el nombre de la consola en letras
│   │   ├── fondo.jpg                  ← fondo del selector
│   │   ├── musica.mp3                 ← música de fondo del menú
│   │   ├── mover.wav, elegir.wav, volver.wav, pagina.wav, inicio.wav
│   │   ├── gameboot.wav, opciones.wav, error.wav, borde.wav, logro.wav
│   │   ├── intro.mp4                  ← video al entrar a la consola
│   │   └── fondos\                    ← (PS3, PS4 y 3DS) tus imágenes para elegir de fondo
└── personalizar\              ← una carpeta por juego
    └── Nombre del juego\
        ├── canal.png          (Wii; también PS4 y PS Vita)
        ├── fondo.jpg          (Wii, Xbox 360, PS3, PS4, PS Vita, Switch y 3DS)
        ├── logo.png           (Wii, PS2, Xbox 360, PS4, PS Vita, Switch y 3DS)
        ├── video.mp4          (Wii)
        ├── modelo.glb         (PS2)
        ├── caratula.jpg       (Xbox 360; también la PS Vita)
        ├── burbuja.png        (PS Vita)
        ├── cuadrado.png       (Switch y 3DS)
        ├── icono.png          (PS3)
        ├── musica.mp3         (PS3)
        └── descripcion.txt    (todas)
```

Todos los archivos son **opcionales**. Si no pones nada, se usa lo que se descarga solo de Steam, y los sonidos que
la app trae hechos con código.

---

## 1. Selector de consolas — `consolas\<consola>\`

Al abrir NostalHub aparece el selector: la consola a la izquierda (empresa, nombre y año) y su imagen a la derecha.
↑ ↓, la rueda o los botones de arriba y abajo para cambiar; Enter o clic para entrar.

- **O**: ordenar las consolas (personalizado, fecha de salida, nombre o empresa). Con *Mover…* cambias una de lugar
  con ↑ ↓.
- **Esc**: pregunta si quieres cerrar NostalHub (Esc otra vez = cerrar).

Las carpetas se llaman `wii`, `ps2`, `x360`, `ps3`, `ps4`, `vita`, `switch` y `3ds`.
Para abrirlas: Ajustes → Archivos → **Carpeta de consolas** (en la Xbox también el mosaico *Íconos de consolas*).

| Archivo | Qué hace | Recomendación |
|---|---|---|
| `icono.png` | La imagen de la consola a la derecha del selector (en vez del control genérico) | PNG con **fondo transparente**, cuadrado, unos 600×600 |
| `logo.png` | El logo con las letras de la consola, en vez del nombre escrito | PNG transparente, ancho (por ejemplo 1200×300) |
| `fondo.jpg` | Fondo propio del selector cuando esa consola está marcada | 1920×1080 |
| `modelo.glb` | **Modelo 3D** de la consola: gira en el selector en vez de `icono.png`. Puedes arrastrarlo con el mouse para girarlo a mano | Un `.glb` (o `.gltf`) descargado, por ejemplo de [Sketchfab](https://sketchfab.com) (filtra por "Downloadable" y descarga en formato glTF/GLB). Da igual el tamaño: la app lo centra y lo ajusta |

> `icono.png` y `logo.png` no tienen que venir del mismo tamaño: la app les **recorta los bordes vacíos** (transparentes, o
> del mismo color del fondo en un `.jpg`) y los agranda o achica para que todos ocupen más o menos la misma superficie.
> Esto funciona con `.png` y `.jpg`; un `.gif`, `.webp` o `.svg` se usa tal cual.

> **¿El modelo viene acostado?** Haz **clic derecho sobre el modelo** en el selector y elige *Pararlo*, *Ponerlo de
> costado*, *Darlo vuelta* o *Como venía el modelo*. Se guarda y sigue girando sobre su propio eje. (La PS Vita viene
> parada por defecto, porque casi todos sus modelos vienen acostados.)
> Si el modelo no carga (archivo dañado o formato raro), se vuelve a mostrar `icono.png`.
> Los modelos de Sketchfab traen sus texturas dentro del `.glb`, y los que usan el material antiguo
> "specular-glossiness" también se ven bien. Si descargas un `.gltf` que viene en una carpeta con texturas, deja
> **toda la carpeta junta** dentro de `consolas\<consola>\`; lo más simple es elegir el formato **GLB** al descargar.

### Música, sonidos y video de inicio

| Archivo | Qué hace |
|---|---|
| `musica.mp3` | Música de fondo **mientras estás en el menú de esa consola**. Se repite, entra y sale con un fundido, y se pausa sola mientras juegas. También sirven `.ogg`, `.m4a`, `.wav`, `.flac` |
| `mover.wav` | Sonido al **pasar el mouse** por algo o **moverte con las flechas** |
| `elegir.wav` | Sonido al **elegir** (clic o Enter) |
| `volver.wav` | Sonido al **volver** (Esc) |
| `pagina.wav` | **Wii y PS Vita**: sonido al **pasar de página** (Wii: menú de canales y Configuración; Vita: páginas de burbujas y al cambiar de tarjeta) |
| `inicio.wav` | Sonido al **terminar de entrar** a la consola: justo después del video de inicio (o al entrar, si no hay video) |
| `gameboot.wav` | Sonido al **abrir un juego** (PS3, Switch y 3DS) |
| `opciones.wav` | **PS3**: al abrir el **menú de opciones** (tecla O) |
| `error.wav` | **PS3, Switch y 3DS**: cuando algo **no se pudo hacer** (por ejemplo, un juego que no abrió) |
| `borde.wav` | **Switch y 3DS**: al chocar con el final de una fila |
| `logro.wav` | El sonido del **aviso de logro** que aparece encima del juego (sección 8) |
| `boton-grupo.wav`, `boton-musica.wav`, `boton-tienda.wav`, `boton-logros.wav`, `boton-software.wav`, `boton-amigos.wav`, `boton-ajustes.wav`, `boton-energia.wav` | **Switch**: el sonido de cada botón redondo al abrirlo (si falta uno, suena `elegir.wav`) |
| `intro.mp4` | Video que se reproduce **cada vez que entras** a esa consola, por ejemplo el arranque de la Xbox 360 en `consolas\x360\intro.mp4`. Se salta con Enter, Esc, espacio o un clic. También sirven `.webm` y `.mov` |

Cada consola trae **sus propios sonidos hechos con código** (inspirados en los de la consola). Si pones un archivo con
uno de estos nombres, se usa el tuyo en vez de ese.

En **Ajustes → Sonido** puedes activar o desactivar la **Música de fondo**, los **Sonidos del menú** y los **Videos de
inicio de las consolas**, y elegir el **volumen** de la música y de los sonidos.

Consejos:
- Los efectos funcionan mejor cortos (menos de medio segundo) y en `.wav`. Para el sonido de mover, recórtalo para que
  empiece justo con el sonido, sin silencio al principio.
- Se aplican solos al copiar el archivo. Si cambias la música mientras estás en esa consola, se reinicia sola.
- Los sonidos originales de las consolas déjalos **solo aquí**, en AppData (no en la carpeta del proyecto).

---

## 2. Imágenes de cada juego — `personalizar\<Nombre del juego>\`

**Lo más fácil, desde la app:** haz **clic derecho sobre un juego** (en cualquier consola) → **Cambiar imágenes**, o
márcalo y presiona la tecla **I**. Se abre una ventana con el estilo de esa consola que muestra **solo las imágenes que
se ven en esa consola**. En cada una puedes **Elegir archivo**, **arrastrar** una imagen encima (también desde el
navegador), **Pegar** una imagen copiada ("Copiar imagen" en el navegador) o **volver a la automática**. Abajo está la
**descripción** para escribir la tuya (si la dejas igual o la borras, se usa la de Steam) y el botón **Ver todas las
consolas**. Los cambios se ven al tiro.

Por dentro, la app guarda esos archivos en una carpeta por juego (Ajustes → Archivos → **Carpeta de
personalización**). La carpeta de un juego aparece cuando le cambias algo desde la app (o con **Abrir carpeta** en
esa ventana); también puedes crearla tú con el nombre del juego. Las carpetas vacías se borran solas al abrir
NostalHub. También puedes poner los archivos a mano:

| Archivo | Dónde se ve | Qué hace |
|---|---|---|
| `canal.png` / `canal.jpg` / `canal.mp4` | Wii (también PS4 y PS Vita) | Reemplaza el **cuadrito completo** del menú, tal cual (16:9) |
| `fondo.jpg` / `fondo.png` | Wii, Xbox 360, PS3, PS4, PS Vita, Switch, 3DS | Imagen grande **sin letras** de fondo (ej. 1920×620 o 1920×1080) |
| `logo.png` | Wii, PS2, Xbox 360, PS4, PS Vita, Switch, 3DS | El título del juego. **Fondo transparente** |
| `video.mp4` / `video.webm` / `video.gif` | Wii | La animación al entrar al canal (10–20 s, sin audio) |
| `modelo.glb` / `modelo.gltf` | PS2 | Ícono 3D animado (sección 4) |
| `caratula.jpg` / `caratula.png` | Xbox 360 (y PS Vita) | Carátula vertical de la caja (2:3, ej. 600×900). En la Vita se usa para la burbuja si no hay `burbuja.png` |
| `burbuja.png` / `burbuja.jpg` | PS Vita | La imagen de la **burbuja redonda** (cuadrada, ej. 512×512; se recorta en círculo) |
| `cuadrado.png` / `cuadrado.jpg` | Switch y 3DS | El **cuadro del juego** en la Switch y su **icono** en la 3DS (cuadrado, ej. 1024×1024). Si no está, se arma con el fondo y el logo |
| `icono.png` / `icono.jpg` | PS3 | El **icono del juego** en el menú de la PS3 (rectangular, **320×176**). Si no está, se usa la cabecera de Steam |
| `musica.mp3` | PS3 | Música que **suena al quedarte sobre el juego** (como en la consola de verdad). También `.ogg`, `.m4a`, `.wav`. Ideal 30 a 60 segundos; se repite |
| `descripcion.txt` | Todas | La descripción del juego (reemplaza la de Steam) |

Para volver al arte automático, **borra tu archivo** (o usa *Volver a la automática* en la ventana).

**Dónde conseguir arte:** [SteamGridDB](https://www.steamgriddb.com). Busca el juego y usa estas pestañas:
- **Logos**: para `logo.png`.
- **Heroes**: para `fondo.jpg`.
- **Grids** verticales (600×900): para `caratula.jpg`. Los **cuadrados** sirven para `cuadrado.png`.
- **Icons**: para `burbuja.png`.
- **Grids** horizontales (460×215 o 920×430): sirven para `icono.png` de la PS3 (se recorta un poquito).

---

## 3. Conectar Steam — `steam-api-key.txt`

Con la clave de Steam se ven los **logros** de cada juego, el **total de logros**, tus **amigos** y tu nombre y foto.
Las **horas jugadas** y **"jugado hace…"** se ven siempre, aunque no tengas clave (sin clave, el nombre y la foto se
sacan de tu Steam instalado).

**Desde la app:** Ajustes → **Cuentas** → **Conectar Steam** (en la Xbox también el mosaico *Clave de Steam*). Se abre
una ventana con los pasos:

1. **Abrir página de Steam** (te lleva a <https://steamcommunity.com/dev/apikey>; inicia sesión si te lo pide).
2. En "Domain Name" escribe `localhost` (hay un botón para copiarlo), acepta y presiona *Register*.
3. Copia la clave (32 letras y números), presiona **Pegar** y **Guardar y probar**. La app la prueba con Steam y te
   dice si quedó bien y con qué nombre. Si tu perfil es privado, también te avisa.

> **No compartas la clave con nadie**, ni la pegues en un chat.
> Si los logros dicen que tu perfil es privado: en Steam → tu perfil → *Editar perfil* → *Privacidad*,
> pon **"Detalles de juegos"** en **Público**. Para los amigos, también la **Lista de amigos** en público.

**Logros y horas al día:** al cerrar un juego de Steam, sus logros y horas se actualizan solos a los pocos segundos
(también al ganar un logro y al abrir la lista de logros del juego). Las horas se toman de tu Steam y de los
servidores de Steam (la que esté más al día).

---

## 4. Modelos 3D para la PS2 — `modelo.glb` (Blockbench)

1. En Blockbench crea un **Generic Model**. Da igual el tamaño, porque la app lo centra y lo ajusta.
2. Si quieres animación, hazla en la pestaña **Animate** y ponle de nombre `idle`. Se repite en bucle.
3. **File → Export → Export glTF Model**: formato **binario (.glb)**, con *exportar animaciones* e
   *incrustar texturas* marcados.
4. Guárdalo como `modelo.glb` en `personalizar\<Nombre del juego>\` (o elígelo con clic derecho → Cambiar imágenes).

La app además lo hace girar lento como los íconos originales. Las texturas tipo pixel se ven nítidas.

Prioridad del ícono en la PS2: tu `modelo.glb` → modelo hecho en código (`renderer\models\`, ej. el bloque
neón de Geometry Dash) → `logo.png` / logo de Steam → iniciales. El logo y las iniciales se convierten solos en una
**pieza 3D sólida** (con su borde oscuro), así que se ven bien desde cualquier ángulo al girar.

---

## 5. Música (Spotify, Apple Music, YouTube Music)

La sección de música de cada consola y el panel de la izquierda al jugar muestran lo que suena, con su portada y
los botones anterior / pausa / siguiente.

- **Qué app**: Ajustes → Sonido → **App de música**: *Spotify* (la de siempre), *Apple Music*, *YouTube Music* (en
  el navegador) o *Automático* (la que esté sonando). Funciona con los controles multimedia de Windows (los mismos
  que aparecen al subir el volumen). Con YouTube Music en el navegador, si suena un video en otra pestaña, se puede
  mostrar ese.
- **Portada**: la da Windows (o Spotify, si está conectado). Si no llega, se busca por internet (iTunes y Deezer),
  pero solo si coincide **la misma canción** del mismo artista; si no, mejor no se muestra ninguna. El registro está
  en `cache\spotify.log`.

### Conectar Spotify (debes tener Premium)

Ajustes → Cuentas → **Conectar Spotify**. Spotify pide crear una "app" propia (es gratis, unos 2 minutos):

1. **Abrir Spotify for Developers**, inicia sesión y presiona **Create app**.
2. Ponle de nombre `NostalHub`. En **Redirect URIs** pega `http://127.0.0.1:8957/callback` (hay un botón para
   copiarla) y presiona **Add**. Marca **Web API**, acepta los términos y presiona **Save**.
3. Copia el **Client ID** de tu app, pégalo y presiona **Conectar**. Se abre Spotify en el navegador: **Aceptar**.

Si sale un error de permiso, en tu app de Spotify entra a **User Management** y agrega tu correo de Spotify.
La conexión queda en `spotify.json` (no lo compartas). Con Spotify conectado se suman, en todas las consolas (aunque
la música esté en pausa):

- **Barra de la canción** con el tiempo, y la **canción siguiente**.
- **Cola de reproducción**: elige una canción para saltar hasta ella.
- **Orden**: En orden ↔ Aleatorio. El *Aleatorio inteligente* se ve, pero Spotify solo deja activarlo desde su app.
- **Repetir**: No → La lista → La canción.
- **Me gusta** (el corazón), **volumen** de Spotify y **dispositivo** (pasar la música al PC, al teléfono o a un
  parlante). Si suena en el teléfono, también se ve y se controla desde aquí.

Para usar solo los botones básicos sin desconectar Spotify: Ajustes → Sonido → **Spotify conectado directamente** →
*Desactivado* (la opción aparece cuando la App de música es Spotify). Si todavía no está conectado, activarla abre
la ventana para conectarlo.

| Consola | Dónde está la música |
| --- | --- |
| Wii y PS2 | En el panel de la izquierda mientras juegas |
| Xbox 360 | Pestaña *home*: el disco, la barra y "Siguiente"; los botones extra a la derecha |
| PS3 | Categoría **Música**: la canción, la siguiente y **Opciones de música** (una pantalla como la de Ajustes; el volumen se cambia con ← →) |
| PS4 | Menú rápido (**P**) → Música |
| PS Vita | Burbuja **Música** (los botones extra abajo; su nombre aparece al marcarlos) |
| Switch | Botón **Música** (↓ para la fila de aleatorio, repetir, me gusta…) |
| 3DS | App **Nintendo 3DS Sonido** |

---

## 6. Grupo: tu canal de voz de Discord — `discord.txt`

Muestra el canal de voz donde estás, el servidor y quiénes están contigo (con un brillo en quien está hablando y un
ícono si tiene el micrófono silenciado). Necesita la **app de escritorio de Discord abierta**.

| Consola | Dónde está el Grupo |
| --- | --- |
| Wii y PS2 | En el panel de la derecha mientras juegas |
| Xbox 360 | Mosaico **Grupo** de la pestaña *social* |
| PS3 | Categoría **Amigos** → **Grupo** (la primera fila; Enter muestra quiénes están) |
| PS4 | **Grupo** en la fila de funciones (↑) y en el menú rápido (**P**) |
| PS Vita | Burbuja naranja **Grupo** (con un número rojo: cuántas personas hay en tu canal) |
| Switch | Botón redondo **Grupo** |
| 3DS | Atajo **Grupo** (los audífonos, arriba en la pantalla de abajo; el número es cuántos hay en tu canal) |

En todas, mientras juegas, también aparece al lado del juego.

**Conectar Discord** (una sola vez):

1. Entra a <https://discord.com/developers/applications> con tu cuenta de Discord y presiona **New Application**.
   Ponle de nombre `NostalHub` y créala.
2. En el menú de la izquierda entra a **OAuth2**:
   - copia el **Client ID** (es el mismo número que el **ID de la aplicación** de la página principal);
   - en **Client Secret** presiona **Reset Secret** y copia el texto que aparece. **Ojo:** la **Clave pública** de la
     página principal *no* es el secret (si la pegas, NostalHub te avisa);
   - en **Redirects** presiona **Add Redirect**, escribe `http://localhost` y guarda con **Save Changes**. Si falta
     este paso, Discord da el error *Missing "redirect_uri"*.
3. En NostalHub: Ajustes → **Cuentas** → **Conectar Discord** (o el botón *Conectar Discord* de la pantalla de
   Grupo). Pega el Client ID y el Client Secret (botones **Pegar**) y presiona **Guardar y conectar**.
4. Discord te muestra una ventana para autorizar: acéptala. Solo se pide una vez.

> **No compartas el Client Secret con nadie.**
> Discord solo deja usar esta función a la cuenta dueña de la aplicación (y a quienes agregue como testers). Si
> Discord muestra un error de permisos, revisa que la aplicación la hayas creado con la misma cuenta que tienes
> abierta en Discord. Si algo falla, el detalle queda en `cache\discord.log`.

---

## 7. Agregar juegos

**Juegos de Steam:** no hay que hacer nada. Los que ya tenías se agregan al abrir NostalHub, y los que descargues
**mientras NostalHub está abierta aparecen solos** cuando terminan de instalarse (sale un aviso "Nuevo juego").
Si alguno no aparece: Ajustes → Juegos → **Buscar juegos nuevos de Steam**.
Los que **desinstalas** desaparecen de los menús solos, y vuelven (con su arte, sus horas y tus imágenes) cuando los
instalas de nuevo y terminan de descargarse.

**Juegos que no son de Steam**, de dos formas:

1. **Agregándolos a Steam** (en Steam: *Juegos* → *Añadir un juego que no es de Steam a mi biblioteca*).
   NostalHub los toma de ahí solos, con las imágenes que les hayas puesto en Steam (portada, fondo y logo). Se abren
   directo con su `.exe`, así que al cerrarlos vuelves solo al menú.
2. **Desde NostalHub:** Ajustes → Juegos → **Agregar juego o programa**, y elige su `.exe` o su acceso directo.

Para ponerle arte propio a cualquiera de ellos, usa clic derecho → Cambiar imágenes (sección 2).

**Minecraft (Java Edition)**, con sus progresos como logros:

1. Ten instalado el **launcher oficial** de Minecraft (el de la Microsoft Store / app de Xbox, o el instalador de
   minecraft.net) y juega con Minecraft **en inglés**.
2. En NostalHub: Ajustes → Juegos → **Agregar Minecraft (Java)**. Aparece "Minecraft" en tus juegos.
3. Ponle arte propio con clic derecho → Cambiar imágenes (NostalHub no trae imágenes de Minecraft).

Al abrirlo se abre el launcher; cuando apretas **Jugar** y después cierras el juego, vuelves solo al menú. Cada
progreso que consigas sale encima del juego con el estilo de tu consola: un progreso normal es **bronce**, una
meta es **plata** y un desafío es **oro**. Funciona en tus mundos y en servidores (si el servidor anuncia los
progresos en el chat); los de otros jugadores no salen. Si usas otro launcher (Prism, CurseForge…), no funciona.
Cada aviso trae el ícono del progreso (el mismo objeto que en el juego), sacado de tu Minecraft instalado; los
progresos que agregan los mods salen con la copa.

**Si juegas en pantalla completa:**
- La pantalla completa normal de Minecraft (F11) no deja que nada se vea encima: ahí los avisos no salen.
- Con un mod de pantalla completa sin bordes, en tarjetas NVIDIA: Panel de control de NVIDIA → Administrar la
  configuración 3D → pestaña de programas → `javaw.exe` → **Método de presentación de Vulkan/OpenGL** →
  **Preferir capas en la cadena de intercambio DXGI** (*Prefer layered on DXGI Swapchain*).
- Lo más seguro: en Ajustes → Pantalla → **Pantalla de los logros**, elige tu otra pantalla (la de NostalHub).

**A mano en `config.json`** (si prefieres): Ajustes → Archivos → **Abrir config.json**. Dentro de
`"games": [ ... ]` agrega una entrada:

```json
{ "name": "Mi juego", "target": "C:\\Users\\Xarlord\\Desktop\\Mi juego.lnk" }
```

- `target` puede ser un acceso directo `.lnk`, un `.exe` o una URL de otro launcher.
- En las rutas, cada `\` va doble: `\\`. Si el archivo queda mal escrito, NostalHub te avisa, guarda una
  copia (`config.roto-….json`) y **no guarda nada encima** hasta que lo arregles; al guardarlo bien, se recarga solo.
- **Ocultar un juego:** agrégale `"hidden": true`. No lo borres, porque los de Steam se vuelven a importar.
- **Cambiar el orden:** cada consola tiene su opción para ordenar (sección 8, *Ordenar los juegos*).

---

## 8. Ajustes y funciones de todas las consolas

### Dónde están los ajustes

Son las mismas opciones del menú del ícono junto al reloj, con el estilo de cada consola:

| Consola | Cómo se abre | Cómo se usa |
|---|---|---|
| Wii | Botón del **engranaje** (abajo a la izquierda) | "Configuración de NostalHub" con una página por sección. Al elegir una opción se abre su pantalla con **Atrás / Confirmar** |
| PS2 | Botón **Configuración** (abajo a la derecha) o la tecla **C** | "Configuración del sistema": ↑ ↓ elegir, ← → cambiar, Enter aceptar |
| Xbox 360 | Mosaico **Ajustes** (home o settings) o la tecla **G** | **La Guía**: pestañas con íconos (Q / E o ← →), Enter cambia la opción |
| PS3 | Categoría **Ajustes** | Cada opción es un elemento del XMB. Ahí también están los **Ajustes de tema** (fondo, color y ola) |
| PS4 | **Ajustes** en la fila de funciones (↑) o en el menú rápido (**P**) | Lista de categorías con íconos; las casillas se marcan con Enter y las de elegir abren una lista. La primera, **Temas**, es para el fondo |
| PS Vita | Burbuja **Ajustes** o el menú rápido (**P**) | Se abre como tarjeta: categorías → opciones; Esc vuelve a las categorías |
| Switch | Botón redondo **Ajustes** | Categorías a la izquierda y opciones a la derecha. Ahí está el **Tema** (claro u oscuro) |
| 3DS | App **Configuración de la consola** (o la casita con el pincel, para el tema) | Tema de las pantallas, fondo personalizado, color de la carcasa y las opciones de NostalHub |

Las secciones son: **General** (cambiar de consola, recargar, abrir este manual, salir), **Juegos** (buscar juegos
nuevos, agregar un juego, volver a descargar el arte, título encima de cada canal de la Wii, tráileres de Steam),
**Pantalla**, **Sonido**, **Cuentas** (Steam, Spotify y Discord) y **Archivos** (las carpetas, `config.json` y las
herramientas de desarrollo). "Salir de NostalHub" siempre pregunta antes de cerrar.

### Ordenar los juegos

Cada consola guarda su propio orden: **Jugado recientemente**, **Nombre**, **Horas jugadas** o **% de logros** (los
que no tienen logros van al final). En la Wii, la PS Vita y la 3DS también se puede ordenar **A mano**, como en las
consolas reales: eliges *Mover* y llevas el juego a otro lugar.

| Consola | Cómo se ordena |
| --- | --- |
| Wii | Botón de las **flechas** (abajo, al lado del engranaje) o tecla **O**. *Mover* toma el canal marcado: flechas o clic en otro lugar para llevarlo, **Enter** lo deja, **Esc** cancela |
| PS2 | Botón **Ordenar** (arriba a la derecha) o tecla **O**: cada vez cambia al orden siguiente |
| Xbox 360 | En **Mis juegos**, tecla **O** (o clic en *Ordenar* abajo): cambia al orden siguiente |
| PS3 | **O** (el triángulo) sobre un juego → **Ordenar** |
| PS4 | Inicio: **O** o *Ordenar* abajo a la derecha (elige qué 5 juegos se ven). Biblioteca: el botón de arriba a la derecha, **S** u **O** |
| PS Vita | **O** en el inicio, o **mantén apretada** una burbuja con el mouse. *Mover* lleva la burbuja con las flechas o un clic; **Enter** la deja |
| Switch | **Todo el software**: tecla **S** |
| 3DS | **O** o **X** sobre un juego → **Ordenar** o **Mover** (flechas para llevarlo, **A** lo deja, **B** cancela) |

### Fondo propio (PS3, PS4 y 3DS)

Como los temas de esas consolas: pon tus imágenes (JPG o PNG, ideal 1920×1080) en `consolas\<consola>\fondos\` y
elígelas en la consola. También puedes usar el **arte de uno de tus juegos** de fondo.

| Consola | Dónde |
| --- | --- |
| PS3 | Ajustes → **Ajustes de tema** → **Fondo**. Con un fondo propio aparece **Ola encima del fondo** (activar o apagar la ola). *Carpeta de fondos* la abre |
| PS4 | Ajustes → **Temas** → **Fondo** (y *Abrir carpeta de fondos*) |
| 3DS | Configuración de la consola → **Fondo personalizado**: la imagen va en las dos pantallas (abajo, más suave para que se vean los íconos) |

### Pantalla completa o ventana

En **Ajustes → Pantalla**:
- **Modo → Pantalla completa** (como siempre). Ahí mismo eliges si **cubre la barra de tareas** de Windows o no, y si
  aparece como **app abierta en la barra de Windows** (si algo la tapa, un clic ahí y vuelve adelante).
- **Modo → Ventana**: se puede mover, cambiar de tamaño y minimizar, y recuerda dónde la dejaste. Arriba hay una barra
  **escondida**: lleva el mouse al borde de arriba y baja con **minimizar, maximizar y cerrar** (con el estilo de cada
  consola). Arrástrala para mover la ventana; doble clic la maximiza. **Cerrar** sale de NostalHub.
- **Pantalla**: en cuál monitor se muestra (*Automática* = la secundaria). Si apagas o desconectas la segunda
  pantalla, NostalHub queda como **ventana** en la principal (se puede mover y minimizar) y vuelve sola a pantalla
  completa cuando la conectas de nuevo.
- **Iniciar con Windows**.

### Logros sobre el juego

- Cuando ganas un logro de Steam, aparece **encima del juego** el aviso de la **última consola que elegiste**:
  - **Xbox 360**: arriba al centro, "Logro desbloqueado" con los puntos G según qué tan raro es.
  - **PS3** (arriba a la derecha), **PS4** (arriba a la izquierda) y **PS Vita** (arriba a la derecha): "Has obtenido
    un trofeo" con la copa de **bronce, plata u oro** según qué tan raro es. Si con ese logro completas el juego,
    sale además el trofeo de **platino**.
  - Las que no tenían logros tienen uno hecho a su estilo: **Wii** (cartel blanco con borde celeste, arriba al
    centro), **PS2** (panel azul que brilla, arriba a la derecha), **Switch** (notificación oscura, arriba a la
    izquierda) y **3DS** (aviso blanco con la luz azul parpadeando, arriba al centro).
- Se detecta **al instante** leyendo los archivos de logros que Steam guarda en tu PC (no necesita internet).
- El juego tiene que estar en **ventana sin bordes** ("Borderless" / "Ventana completa"). En pantalla completa
  "exclusiva" no se ve encima (muchos juegos con DirectX 12 sí funcionan).
- **Ajustes → Pantalla**: activar o desactivar **Logros sobre el juego** y elegir la **Pantalla de los logros**.
- **Prueba**: **Ctrl + Alt + Shift + L** muestra un logro falso con el estilo de la consola en la que estás.
- Sonido: el tuyo en `consolas\<consola>\logro.wav`; si no, uno hecho con código.

### Lista de logros de cada juego

Cuando consigues **todos** los logros de un juego, aparece un sello especial en su ícono, en su ficha y en la lista
de logros: **trofeo de platino** (PS3, PS4 y PS Vita), **medalla dorada** (Xbox 360), **estrella dorada**
(PS2 y 3DS), **sello dorado** (Wii) y **corona dorada** (Switch).

| Consola | Dónde |
| --- | --- |
| Wii | Botón redondo **Logros** en la pantalla del canal (o ↓) |
| PS2 | **Logros** en la ficha del juego |
| Xbox 360 | **Logros** en la ficha del juego |
| PS3 | **Colección de trofeos** (arriba en *Juego*), o **O** → Logros sobre un juego |
| PS4 | **Trofeos** en la fila de funciones, o en la ficha del juego (↓) |
| PS Vita | Burbuja **Trofeos**, y en la tarjeta de cada juego |
| Switch | Botón redondo **Logros**, o la pestaña *Logros* de cada juego |
| 3DS | App **Logros**, o el atajo **Notas de juego** |

### Amigos de Steam

Tus amigos de Steam con el estilo de cada consola, ordenados como en Steam: jugando (y a qué), en línea, ausentes y
al final los desconectados (con hace cuánto). Puedes abrir su **perfil** o su **chat** de Steam. La lista se
actualiza cada 30 segundos.

| Consola | Dónde está | Perfil / mensaje |
| --- | --- | --- |
| Wii | Botón del **sobre** (abajo a la derecha) o tecla **A** | ← → para elegir el botón, Enter |
| PS2 | Botón **Amigos** abajo o tecla **A** | Enter abre la ventanita con los dos botones |
| Xbox 360 | Mosaico **Amigos** de la pestaña *social* | ← → para elegir el botón, Enter |
| PS3 | Categoría **Amigos** (el Grupo va aparte, en la primera fila) | Enter: perfil · **O**: opciones (perfil o mensaje) |
| PS4 | *Amigos* en la fila de funciones, y en el **menú rápido** (P) | ← → para elegir el botón, Enter |
| PS Vita | Burbuja **Amigos** (se abre como tarjeta) | ← → para elegir el botón, Enter |
| Switch | Botón redondo **Amigos** | Enter abre las opciones |
| 3DS | Atajo **Lista de amigos** (arriba en la pantalla de abajo) | Enter abre la ventanita |

- Necesita tu clave de Steam y que tu **lista de amigos** sea pública (Steam → Editar perfil → Configuración de
  privacidad).
- Si un amigo tiene sus juegos en privado, sale "En línea" aunque esté jugando (Steam no dice a qué).

### Mientras juegas

Al abrir un juego, cada consola muestra su pantalla de "jugando" con el tiempo que llevas y, debajo, la hora y la fecha
(por ejemplo `04:35 PM  Domingo 18-Oct-2026`). A los lados aparecen la
**música** (izquierda) y tu **Grupo de Discord** (derecha). Al cerrar el juego vuelves solo al menú (también con
los accesos directos `.lnk` a un `.exe`). Con los que se abren por un enlace de otro launcher (Epic, etc.) no se
puede saber cuándo terminan: usa **Volver al menú**.

---

## 9. Cómo se usa cada consola

### Wii

- **Menú de canales**: 12 canales por página (4 × 3). Las flechas eligen un canal (↓ desde la última fila baja a los
  botones de abajo); **RePág / AvPág** (L1 / R1 en el control) o la rueda pasan de página. Abajo, el reloj y los
  botones redondos: **engranaje** (ajustes), **flechas** (ordenar los canales), **sobre** (amigos de Steam) y
  **dado** (juego al azar).
- **Pantalla del canal**: al elegir un juego se abre su canal con el fondo, el logo y la animación (`video.mp4` o el
  tráiler de Steam, si los activaste). Botones **Menú**, **Iniciar** y **Logros** (↓). ← → cambian de canal.

### PlayStation 2

- **Memory Card**: tus juegos en una grilla de 5 columnas, cada uno con su ícono 3D (sección 4) o su logo.
- **Ficha del juego** (Enter): el ícono grande, horas, barra de logros y descripción, con **Iniciar**, **Logros** y
  **Volver**.
- Abajo a la derecha: **Amigos** (tecla **A**) y **Configuración** (tecla **C**). Arriba a la derecha: **Ordenar**
  (tecla **O**).

### Xbox 360

- Tres pestañas que se cambian con **Q / E** (o RePág / AvPág):
  - **home**: *Jugar* (el último juego), *Al azar*, la **música**, *Recientes*, *Mis juegos*, *Perfil*, *Ajustes* y
    *Consolas*.
  - **social**: **Amigos**, **Grupo**, *Tienda*, *Mi perfil*, tu tarjeta con el total de logros y los jugados
    recientemente.
  - **settings**: Ajustes, Perfil de Steam, Personalización, Íconos de consolas, Clave de Steam, Manual, Cambiar
    consola y Apagar.
- **Mis juegos / Recientes**: estante de carátulas (← →). Enter abre la **ficha**: *Jugar*, *Logros* y *Volver*. En
  *Mis juegos*, **O** cambia el orden.
- **G** abre la **Guía** (ajustes) desde cualquier parte.

### PlayStation 3

- **Categorías** en fila: Usuarios, Ajustes, Música, Juego, PlayStation Network (tienda y novedades de Steam) y
  Amigos (primero tu **Grupo** de Discord, que se abre aparte, y después tus amigos de Steam). ← → para cambiar, ↑ ↓
  para recorrer sus opciones.
- **Juego**: arriba está la **Colección de trofeos** y después tus juegos (en el orden que elegiste). Si te quedas
  un segundo sobre un juego, aparece su **fondo** a pantalla completa y suena su **música** (`musica.mp3`, si le pusiste).
- **O** (el triángulo): **opciones** del juego: Iniciar, Información, Logros, Cambiar imágenes y **Ordenar**.
- **Fondo**: el color cambia **cada mes** como en la PS3, y es más oscuro de noche. Para dejar un color fijo:
  **Ajustes → Ajustes de tema → Color**. Ahí también puedes apagar el **Brillo según la hora**, o poner un **fondo
  propio** (una imagen o el arte de un juego) con o sin la ola.
- **Encendido**: al entrar aparece la ola con destellos (Enter o un clic lo salta). Si tienes `intro.mp4` en
  `consolas\ps3\`, o apagaste los videos de inicio, entra directo.

### PlayStation 4

- **Menú principal**: 5 de tus juegos (los más recientes, o según el orden que elijas con **O**) y al final la
  **Biblioteca**. ← → para moverte, Enter para jugar.
  - **↓** abre la ficha del juego: horas, trofeos (tus logros de Steam), descripción, *Iniciar* y *Trofeos*.
  - **↑** muestra la fila de funciones: Tienda, Amigos, Grupo, Perfil, Trofeos, Ajustes y Energía.
- **Biblioteca**: todos tus juegos, con filtros a la izquierda (Todos, Juegos, Aplicaciones, Jugados
  recientemente, Con trofeos: solo los que de verdad tienen logros), **Buscar** (escribe el nombre) y el orden arriba
  a la derecha (o la tecla **S**).
- **Fondo propio**: Ajustes → **Temas** → **Fondo**.
- **Menú rápido**: tecla **P** o el botón de abajo a la derecha. Tiene Sonido, Música, Grupo, Amigos, Juego al azar,
  Biblioteca, Cambiar de consola, Ajustes y Energía. → entra a las opciones de la derecha.
- **Con el mouse**: un clic elige un cuadro; con el cuadro ya elegido, clic en *Iniciar* para jugar o en la imagen
  para ver la ficha.

### PS Vita

- **Pantalla de bloqueo**: al entrar, despega la esquina de arriba a la derecha arrastrándola con el mouse, o
  presiona Enter / haz clic.
- **Inicio**: páginas de burbujas que se recorren **de arriba a abajo** (puntitos a la izquierda). La primera página
  tiene las apps: Grupo, Música, Tienda, Amigos, Biblioteca, Juego al azar, Trofeos, Perfil, Ajustes y Consolas.
  Desde la segunda están tus juegos, los más recientes primero (o en el orden que elijas con **O**, también a mano).
- **Abrir**: la burbuja va al centro, gira y se abre como **tarjeta** (LiveArea). La de un juego tiene la puerta con
  **Iniciar**, tu actividad, sus trofeos y la descripción.
- **Tarjetas**: cada app que abres queda a la derecha del inicio (hasta 5; al abrir la sexta se cierra la más
  antigua). Arriba, en la barra negra, salen sus burbujitas: clic para ir a una. Con el teclado, **Q / E** o ← → en
  los bordes. Para **cerrar** una tarjeta, **despega su esquina** de arriba a la derecha (arrastrando o con un clic) o
  presiona **Retroceso**.
- **Menú rápido** (**P**): sube desde abajo con la música, el volumen (← →), música de fondo y sonidos, Cambiar de
  consola, Ajustes y Energía.
- **Avisos** (el círculo azul de la esquina, o **N**): juegos nuevos, cuando entras a un canal de voz y cuánto jugaste.

### Nintendo Switch

- **Inicio**: fila con tus 5 juegos más recientes y al final **Todo el software**. ← → para moverte, Enter para jugar.
- **↓** baja a los **botones redondos**: Grupo, Música, Tienda, Logros, Todo el software, Amigos, Ajustes y Energía.
- **O** (o +) sobre un juego: sus opciones (Iniciar, Información del software, Logros…). La **ficha** del juego tiene
  pestañas: *Iniciar*, *Información del software*, *Logros* y *Cambiar imágenes*.
- **Todo el software**: grilla con todos tus juegos (Enter abre la ficha); **S** cambia el orden.
- **Tema** claro u oscuro: Ajustes → Tema.

### Nintendo 3DS

- Se ve la consola abierta con sus **dos pantallas**: arriba el banner del icono marcado (con profundidad 3D que
  sigue al mouse; el **deslizador 3D** a la derecha de la pantalla la sube o la apaga) y abajo la cuadrícula de iconos.
- Primero van las apps: **Configuración de la consola** (tema de las pantallas, color de la carcasa y las opciones de
  NostalHub), **Nintendo eShop** (Steam), **Registro de actividad** (tus horas por juego), **Nintendo 3DS Sonido**
  (la música), **Logros** y **Cambiar de consola**. Después tus juegos, los más recientes primero (o en el orden que
  elijas, también a mano: **O** o **X** sobre un juego → *Ordenar* o *Mover*).
- **Barra de arriba** de la pantalla de abajo, como en la 3DS:
  - a la izquierda la **casita con el pincel** (tema);
  - los accesos chiquitos: **Notas de juego** (logros), **Lista de amigos** (amigos de Steam), **Grupo** (tu canal
    de voz de Discord), **Notificaciones**, **Navegador** (actividad de Steam) y **Perfil**;
  - a la derecha, dos botones para el **tamaño de los íconos**: los cuatro cuadritos los achican y el cuadrado
    grande los agranda (de 1 a 6 filas). El que ya no sirve se ve apagado.
- **Abajo** está solo la **barra de páginas**: arrástrala con el mouse, o haz clic donde quieras ir.
- Los botones de la carcasa funcionan con clic: cruceta, **A** (abrir), **B** (volver), **X** o **START** (opciones
  del juego), **Y** (íconos más grandes), **SELECT** (íconos más chicos), **HOME** (vuelve al menú) y el botón de
  **encendido** (cambiar de consola o apagar).
- El icono de cada juego es la misma imagen cuadrada de la Switch (`cuadrado.png`).

---

## 10. Control (PS5, PS4, Xbox…)

Conecta tu control (por cable o Bluetooth) y úsalo en el selector y en todas las consolas. Funciona cuando
NostalHub está **activa**: haz clic en ella una vez (o ábrela desde el ícono junto al reloj). Así nunca se mueve sola
mientras usas el control en otra cosa o en un juego.

| Botón | Qué hace |
|---|---|
| Cruceta o stick izquierdo | Moverse (mantenerlo apretado = repetir) |
| ✕ | Aceptar (Enter) |
| ○ | Volver (Esc). En "¿Cerrar NostalHub?", ○ **cancela** |
| △ | Opciones del juego (tecla O) |
| □ | Cambiar imágenes del juego (tecla I) |
| L1 / R1 | Pestaña, página o tarjeta anterior / siguiente (Xbox 360 y PS Vita: Q / E) |
| L2 / R2 | Subir / bajar rápido (RePág / AvPág) |
| Options | Menú de la consola: Guía (Xbox 360), menú rápido (PS4 y PS Vita), Configuración (PS2), ordenar (selector) |
| Create | Ordenar (tecla S); en la Wii y la PS2, Amigos |

En la Wii, la PS2, la PS Vita, la 3DS, la Xbox 360 (Mis juegos) y el inicio de la PS4, **△** abre el orden de los
juegos.
| Stick derecho | Como la rueda del mouse |

- Cuando usas el control, las pistas de la pantalla muestran sus botones (✕ ○ △ □); si vuelves al teclado,
  vuelven las teclas.
- Mientras juegas, solo ✕ y ○ funcionan (para **Volver al menú**), y solo si NostalHub está activa.
- Si Steam también convierte tu control en teclas (su "configuración de escritorio"), NostalHub lo nota y no
  cuenta cada botón dos veces.
- **Con Steam abierto** el control de PS5 igual funciona: Steam lo cambia a un modo que Windows no muestra como
  control, así que NostalHub lo lee directo (solo lo lee, no cambia nada del control).

---

## 11. Teclas

| Dónde | Teclas |
|---|---|
| Selector de consolas | ↑ ↓ elegir · Enter entrar · **O** ordenar las consolas · **Esc** pregunta si cerrar la app (Esc otra vez = cerrar) |
| Cualquier consola | **Clic derecho** sobre un juego, o **I** con el juego marcado: cambiar imágenes y descripción · **F3** FPS · **Ctrl + Alt + Shift + L** logro de prueba |
| Wii | Flechas elegir canal (↓ a los botones de abajo) · RePág / AvPág páginas · ← → cambiar de canal (dentro de un canal) · Enter abrir / iniciar · ↓ logros (en el canal) · **A** amigos · **O** ordenar · Esc volver (en el menú: selector) |
| PS2 | Flechas moverse · Enter elegir · **A** amigos · **C** configuración · **O** ordenar · Esc volver (en la Memory Card: selector) |
| Xbox 360 | Flechas moverse · **Q / E** cambiar de pestaña · **G** la Guía · Enter seleccionar · **O** ordenar (Mis juegos) · Esc volver |
| PS3 | ← → categorías · ↑ ↓ opciones · Enter elegir / iniciar · **O** opciones (el triángulo) · Esc volver (en la barra: selector) |
| PS4 | ← → juegos · **↑** funciones · **↓** ficha del juego · Enter jugar · **P** menú rápido · **O** ordenar el inicio · **S** orden (Biblioteca) · Esc volver (en el menú principal: selector) |
| PS Vita | Flechas entre burbujas (↑ ↓ en los bordes, la rueda o RePág / AvPág cambian de página) · Enter abrir · **O** ordenar (inicio) · **Q / E** cambiar de tarjeta · **Retroceso** cerrar la tarjeta · **P** menú rápido · **N** avisos · Esc inicio (en el inicio: selector) |
| Switch | ← → juegos · **↓** botones redondos · Enter iniciar · **O** opciones del juego · **S** ordenar (Todo el software) · Esc volver (en el inicio: selector) |
| 3DS | Flechas por la cuadrícula · Enter abrir · **O** o **X** opciones del juego · **+** o **Y** íconos más grandes · **−** íconos más chicos · Esc volver (en el menú: selector) |

---

## 12. Si algo no se ve bien

- **Arte raro o faltante:** Ajustes → Juegos → *Volver a descargar el arte*.
- **Juegos nuevos de Steam:** Ajustes → Juegos → *Buscar juegos nuevos de Steam*.
- **La barra de tareas tapa el menú:** Ajustes → Pantalla → desactiva *Cubrir la barra de tareas*.
- **Algo se ve raro:** Ajustes → General → *Recargar*.
- **La portada de la canción no es la del álbum:** revisa `cache\spotify.log`; con Spotify conectado la portada sale
  directo de Spotify.
- **Ver errores:** Ajustes → Archivos → *Herramientas de desarrollo*, o `npm run dev`.
- **¿Va fluido?** Presiona **F3** en cualquier pantalla: abajo a la izquierda aparecen los **FPS** (cuadros por
  segundo; lo normal es lo mismo que tu monitor, por ejemplo 60) y el cuadro más lento del último segundo. F3 otra vez
  lo esconde.
