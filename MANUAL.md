# Manual de NostalHub — lo que pones tú a mano

Todo lo que agregas tú (imágenes, modelos, claves) vive en **una sola carpeta de datos**, separada del código:

```
%APPDATA%\NostalHub
```

Para abrirla: pega esa ruta en la barra del Explorador de Windows, o usa los atajos de los ajustes
(engranaje de la Wii, Guía de la Xbox, Configuración de la PS2, o clic derecho en el ícono de NostalHub junto al reloj de Windows).

> Después de copiar o cambiar un archivo, **no hace falta reiniciar**: la app lo detecta sola en uno o dos segundos.
> La excepción es si cambias el **código** del proyecto: ahí sí hay que cerrar (menú → Salir) y volver a hacer `npm start`.

---

## Mapa rápido

```
%APPDATA%\NostalHub
├── steam-api-key.txt          ← tu clave de Steam (logros, nombre y foto)
├── discord.txt                ← datos de tu aplicación de Discord (Grupo de la PS4, la Vita y la Xbox)
├── config.json                ← lista de juegos y opciones
├── consolas\                  ← una carpeta por consola del selector
│   ├── wii\
│   │   ├── icono.png
│   │   ├── modelo.glb         ← modelo 3D que gira en el selector (en vez de icono.png)
│   │   ├── logo.png
│   │   ├── fondo.jpg
│   │   ├── musica.mp3         ← música de fondo del menú
│   │   ├── mover.wav          ← sonido al moverte / pasar el mouse
│   │   ├── elegir.wav         ← sonido al elegir
│   │   ├── volver.wav         ← sonido al volver
│   │   ├── pagina.wav         ← (Wii y PS Vita) sonido al pasar de página
│   │   ├── inicio.wav         ← sonido al terminar de entrar (después del video)
│   │   └── intro.mp4          ← video al entrar a la consola
│   ├── ps2\   (igual)
│   ├── x360\  (igual)
│   ├── ps4\   (igual)
│   ├── vita\  (igual)
│   ├── switch\ (igual)
│   └── ps3\    (igual, y además gameboot.wav)
└── personalizar\              ← una carpeta por juego
    └── Nombre del juego\
        ├── canal.png          (Wii)
        ├── fondo.jpg          (Wii, PS2 y PS4)
        ├── logo.png           (Wii, PS2, Xbox y PS4)
        ├── video.mp4          (Wii)
        ├── modelo.glb         (PS2)
        ├── caratula.jpg       (Xbox 360 y burbuja de la Vita)
        ├── burbuja.png        (PS Vita)
        ├── cuadrado.png       (Switch y 3DS)
        ├── icono.png          (PS3)
        ├── musica.mp3         (PS3)
        └── descripcion.txt    (todas)
```

Todos los archivos son **opcionales**. Si no pones nada, se usa lo que se descarga solo de Steam.

---

## 1. Selector de consolas — `consolas\<consola>\`

Las carpetas se llaman `wii`, `ps2`, `x360`, `ps4`, `vita` y `switch`.
Para abrirlas: ajustes → Archivos → **Carpeta de consolas** (o en la Xbox: settings → **Íconos de consolas**).

| Archivo | Qué hace | Recomendación |
|---|---|---|
| `icono.png` | La imagen de la consola a la derecha del selector (en vez del control genérico) | PNG con **fondo transparente**, cuadrado, unos 600×600 |
| `logo.png` | El logo con las letras de la consola, en vez del nombre escrito | PNG transparente, ancho (por ejemplo 1200×300) |
| `fondo.jpg` | Fondo propio del selector cuando esa consola está marcada | 1920×1080 |
| `modelo.glb` | **Modelo 3D** de la consola: gira en el selector en vez de `icono.png`. Puedes arrastrarlo con el mouse para girarlo a mano | Un `.glb` (o `.gltf`) descargado, por ejemplo de [Sketchfab](https://sketchfab.com) (filtra por "Downloadable" y descarga en formato glTF/GLB). Da igual el tamaño: la app lo centra y lo ajusta |

> `icono.png` y `logo.png` no tienen que venir del mismo tamaño: la app les **recorta los bordes vacíos** (transparentes, o
> del mismo color del fondo en un `.jpg`) y los agranda o achica para que todos ocupen más o menos la misma superficie.
> Un logo ancho y uno casi cuadrado se ven parejos. Esto funciona con `.png` y `.jpg`; un `.gif`, `.webp` o `.svg` se usa tal cual.

> **¿El modelo viene acostado?** Haz **clic derecho sobre el modelo** en el selector y elige *Pararlo*, *Ponerlo de
> costado*, *Darlo vuelta* o *Como venía el modelo*. Se guarda y sigue girando sobre su propio eje. (La PS Vita viene
> parada por defecto, porque casi todos sus modelos vienen acostados.)
> Si el modelo no carga (archivo dañado o formato raro), se vuelve a mostrar `icono.png`.
> Los modelos de Sketchfab traen sus texturas dentro del `.glb`. Muchos usan un tipo de material antiguo
> ("specular-glossiness") que antes se veía blanco; NostalHub ya lo traduce solo.
> Si descargas un `.gltf` que viene en una carpeta con texturas, deja **toda la carpeta junta** dentro de `consolas\<consola>\`; lo más simple es elegir el formato **GLB** al descargar, que es un solo archivo.

### Música, sonidos y video de inicio

| Archivo | Qué hace |
|---|---|
| `musica.mp3` | Música de fondo **mientras estás en el menú de esa consola**. Se repite, entra y sale con un fundido, y se pausa sola mientras juegas. También sirven `.ogg`, `.m4a`, `.wav`, `.flac` |
| `mover.wav` | Sonido al **pasar el mouse** por algo o **moverte con las flechas** |
| `elegir.wav` | Sonido al **elegir** (clic o Enter) |
| `volver.wav` | Sonido al **volver** (Esc) |
| `pagina.wav` | **Wii y PS Vita**: sonido al **pasar de página** (Wii: menú de canales y Configuración; Vita: páginas de burbujas y al cambiar de tarjeta). Reemplaza al de mover en ese momento |
| `inicio.wav` | Sonido al **terminar de entrar** a la consola: suena justo después del video de inicio (o al entrar, si no hay video). Pensado para la Wii, pero funciona en cualquier consola donde lo pongas |
| `gameboot.wav` | **PS3 y Switch**: sonido al **abrir un juego** |
| `opciones.wav` | **PS3**: sonido al abrir el **menú de opciones** (tecla O) |
| `error.wav` | **PS3 y Switch**: sonido cuando algo **no se pudo hacer** (por ejemplo, un juego que no abrió) |
| `borde.wav` | **Switch**: al chocar con el final de la fila |
| `boton-grupo.wav`, `boton-musica.wav`, `boton-tienda.wav`, `boton-logros.wav`, `boton-software.wav`, `boton-amigos.wav`, `boton-ajustes.wav`, `boton-energia.wav` | **Switch**: el sonido de cada botón redondo al abrirlo (si falta uno, suena `elegir.wav`) |
| `intro.mp4` | Video que se reproduce **cada vez que entras** a esa consola, por ejemplo el arranque de la Xbox 360 en `consolas\x360\intro.mp4`. Se salta con Enter, Esc, espacio o un clic. También sirven `.webm` y `.mov` |

En los ajustes de cada consola (o en el menú del ícono junto al reloj de Windows) puedes:
- activar o desactivar la **Música de fondo**, los **Sonidos del menú** y los **Videos de inicio de las consolas**;
- elegir el **Volumen de la música** y el **Volumen de los sonidos**.

Consejos:
- Los efectos funcionan mejor cortos (menos de medio segundo) y en `.wav`.
- Si sacas el audio de un video de YouTube, cualquier conversor a mp3 sirve. Para el sonido de mover, recórtalo
  para que empiece justo con el sonido, sin silencio al principio.
- Se aplican solos al copiar el archivo. Si cambias la música mientras estás en esa consola, se reinicia sola.
- La **PS3** trae sus propios sonidos hechos con código (el tic al moverse, el encendido y el gameboot). Si pones
  `mover.wav`, `inicio.wav`, `gameboot.wav`, etc. en `consolas\ps3\`, se usan los tuyos en vez de esos.

Ejemplos de lo que va aquí: el logo de letras de PlayStation 2 → `consolas\ps2\logo.png`;
una foto de la Wii con fondo transparente → `consolas\wii\icono.png`.
También sirven `.webp` y `.svg` para el ícono y el logo.

---

## 2. Cada juego — `personalizar\<Nombre del juego>\`

**Lo más fácil, desde la app:** haz **clic derecho sobre un juego** (en cualquier consola) → **Cambiar imágenes**, o
márcalo y presiona la tecla **I**. Se abre una ventana con el estilo de esa consola que muestra **solo las imágenes que
se ven en esa consola** (por ejemplo, en la Wii: canal, fondo, logo y video; en la PS Vita: burbuja, fondo y logo).
En cada una puedes **Elegir archivo**, **arrastrar** una imagen encima (también desde el navegador), **Pegar** una imagen
copiada ("Copiar imagen" en el navegador) o **volver a la automática**. Abajo está la **descripción** para escribir la
tuya (si la dejas igual o la borras, se usa la de Steam) y el botón **Ver todas las consolas**. Los cambios se ven al tiro.

Por dentro, la app guarda esos archivos en una carpeta por juego, con el nombre del juego (ajustes → Archivos →
**Carpeta de personalización**). También puedes ponerlos a mano:

| Archivo | Dónde se ve | Qué hace |
|---|---|---|
| `logo.png` | Wii, PS2, Xbox | El título del juego. **Fondo transparente** para que se vea bien |
| `fondo.jpg` / `fondo.png` | Wii, PS2 | Imagen de fondo (canal de la Wii y ficha del juego) |
| `canal.png` / `canal.jpg` / `canal.mp4` | Wii | Reemplaza el **cuadrito completo** del menú, tal cual |
| `video.mp4` / `video.webm` / `video.gif` | Wii | La animación al entrar al canal (10–20 s, sin audio) |
| `modelo.glb` / `modelo.gltf` | PS2 | Ícono 3D animado (ver sección 4) |
| `caratula.jpg` / `caratula.png` | Xbox 360, PS Vita | Carátula vertical de la caja (proporción 2:3, ej. 600×900). En la Vita se usa recortada en círculo para la burbuja |
| `burbuja.png` / `burbuja.jpg` | PS Vita | La imagen de la **burbuja redonda** (cuadrada, ej. 512×512; se recorta en círculo). Si no está, se usa la carátula |
| `cuadrado.png` / `cuadrado.jpg` | Nintendo Switch | El **cuadro del juego** en la Switch (cuadrado, ej. 1024×1024). Si no está, se arma con el fondo y el logo del juego |
| `icono.png` / `icono.jpg` | PS3 | El **icono del juego** en el menú de la PS3 (rectangular, **320×176**). Si no está, se usa la cabecera de Steam |
| `musica.mp3` | PS3 | Música que **suena al quedarte sobre el juego** en la PS3 (como en la consola de verdad). También `.ogg`, `.m4a`, `.wav`. Ideal 30 a 60 segundos; se repite |
| `descripcion.txt` | Todas | La descripción del juego (reemplaza la de Steam) |

Para volver al arte automático, **borra tu archivo**.

**Dónde conseguir arte:** [SteamGridDB](https://www.steamgriddb.com). Busca el juego y usa estas pestañas:
- **Logos**: para `logo.png`.
- **Heroes**: para `fondo.jpg`.
- **Grids** en formato vertical (600×900): para `caratula.jpg`.
- **Icons** (cuadrados): para `burbuja.png`.
- **Grids** en formato horizontal (460×215 o 920×430): sirven para `icono.png` de la PS3 (se recorta un poquito).

---

## 3. Clave de API de Steam — `steam-api-key.txt`

Sirve para ver los **logros** en todas las consolas (Wii: botón redondo *Logros* o ↓ en la pantalla del canal;
PS2: botón *Logros* en la ficha; Xbox: *Logros* en la ficha; PS4: *Trofeos*), el **total de logros** de la pestaña *social* y el
nombre y foto de tu perfil. Las **horas jugadas** y **"jugado hace…"** se ven siempre, aunque no tengas clave.
Sin clave, el nombre y la foto igual se sacan de tu Steam instalado. Lo que no aparece sin clave son los logros.

**Lo más fácil, desde la app:** ajustes → **Cuentas** → **Conectar Steam** (en la Xbox también el mosaico *Clave de
Steam*). Se abre una ventana con los pasos:

1. **Abrir página de Steam** (te lleva a <https://steamcommunity.com/dev/apikey>; inicia sesión si te lo pide).
2. En "Domain Name" escribe `localhost` (hay un botón para copiarlo), acepta y presiona *Register*.
3. Copia la clave (32 letras y números), presiona **Pegar** y **Guardar y probar**. La app la prueba con Steam y te
   dice si quedó bien y con qué nombre. Si tu perfil es privado, también te avisa.

(Si prefieres, la clave también se puede pegar a mano en `steam-api-key.txt`; hay un enlace al archivo en esa ventana.)

> **No compartas la clave con nadie**, ni la pegues en el chat.
> Si los logros dicen que tu perfil es privado: en Steam → tu perfil → *Editar perfil* → *Privacidad*,
> pon **"Detalles de juegos"** en **Público**.

---

## 4. Modelos 3D para la PS2 — `modelo.glb` (Blockbench)

1. En Blockbench crea un **Generic Model**. Da igual el tamaño, porque la app lo centra y lo ajusta.
2. Si quieres animación, hazla en la pestaña **Animate** y ponle de nombre `idle`. Se repite en bucle.
3. **File → Export → Export glTF Model**: formato **binario (.glb)**, con *exportar animaciones* e
   *incrustar texturas* marcados.
4. Guárdalo como `modelo.glb` en `personalizar\<Nombre del juego>\`.

La app además lo hace girar lento como los íconos originales. Las texturas tipo pixel se ven nítidas.

Prioridad del ícono en la PS2: tu `modelo.glb` → modelo hecho en código (`renderer\models\`, ej. el bloque
neón de Geometry Dash) → `logo.png` / logo de Steam → iniciales.

---

## 5. Spotify (pestaña home de la Xbox 360)

No hay nada que configurar: usa la **app de escritorio de Spotify** de tu PC.
- Muestra la canción que está sonando con la **portada del álbum** en el centro del disco, y tiene botones de
  anterior, reproducir/pausar y siguiente, más "Abrir Spotify".
- Funciona con los controles multimedia de Windows (los mismos que aparecen al subir el volumen), así que los
  botones le hablan **directo a Spotify**.
- Si Windows no entrega la portada de alguna canción, la app la busca por internet (en iTunes y en Deezer).
  Si aun así alguna no aparece, revisa `%APPDATA%\NostalHub\cache\spotify.log`: dice qué método se usó y qué falló.
- Si en tu PC eso no funcionara, la app usa un método de respaldo:
  - el nombre se lee de la ventana de Spotify y la portada se busca por internet;
  - los botones pasan a usar las teclas multimedia, así que, si hay otra cosa sonando (por ejemplo un video
    en el navegador), pueden controlar eso en vez de Spotify.

---

## 6. PlayStation 4, PS Vita y el Grupo (Discord)

**Cómo se usa la PS4:**
- **Menú principal**: tus 5 juegos más recientes y al final la **Biblioteca**. ← → para moverte, Enter para jugar.
  - **↓** abre la ficha del juego: horas, trofeos (tus logros de Steam), descripción, *Iniciar* y *Trofeos*.
  - **↑** muestra la fila de funciones: Tienda, Amigos y Perfil (abren Steam), Grupo, Trofeos, Ajustes y Energía.
- **Biblioteca**: todos tus juegos, con filtros a la izquierda (Todos, Juegos de Steam, Aplicaciones, Jugados
  recientemente, Con trofeos), **Buscar** (escribe el nombre) y el orden arriba a la derecha (o la tecla **S**).
- **Menú rápido**: tecla **P** o el botón de abajo a la derecha. Tiene Sonido, Música (Spotify), Grupo, Juego al azar,
  Biblioteca, Cambiar de consola, Ajustes y Energía. → entra a las opciones de la derecha.
- **Con el mouse**: un clic elige un cuadro; con el cuadro ya elegido, clic en *Iniciar* para jugar o en la imagen
  para ver la ficha.

**Grupo: tu canal de voz de Discord** (en la PS4, y en la Xbox 360 en el mosaico *Grupo* de la pestaña social). Muestra el canal donde estás, el servidor y quiénes están contigo (con un
brillo azul en quien está hablando y un ícono si tiene el micrófono silenciado). Necesita la **app de escritorio de
Discord abierta** y estos pasos, una sola vez:

1. Entra a <https://discord.com/developers/applications> con tu cuenta de Discord y presiona **New Application**.
   Ponle de nombre `NostalHub` y créala.
2. En el menú de la izquierda entra a **OAuth2** (si tu Discord está en español, puede decir *OAuth2* igual):
   - copia el **Client ID**. Es el mismo número que aparece como **ID de la aplicación** en la página principal;
   - en **Client Secret** presiona **Reset Secret** y copia el texto que aparece. **Ojo:** la **Clave pública** de la
     página principal *no* es el secret (si la pegas, NostalHub te avisa);
   - en **Redirects** presiona **Add Redirect**, escribe `http://localhost` y guarda con **Save Changes**. Si falta
     este paso, Discord da el error *Missing "redirect_uri"*.
3. En NostalHub: ajustes → **Cuentas** → **Conectar Discord** (o el botón *Conectar Discord* de la pantalla de
   Grupo). Pega el Client ID y el Client Secret (botones **Pegar**) y presiona **Guardar y conectar**.
4. Discord te muestra una ventana para autorizar: acéptala. Solo se pide una vez. La ventana de NostalHub te va
   diciendo el estado (conectando, falta autorizar, listo).

La misma ventana tiene botones para abrir el portal de Discord y para copiar `http://localhost`.

> **No compartas el Client Secret con nadie.**
> Discord solo deja usar esta función a la cuenta dueña de la aplicación (y a quienes agregue como testers). Como la
> aplicación es tuya, debería funcionar directo. Si Discord muestra un error de permisos, revisa que la aplicación
> la hayas creado con la misma cuenta que tienes abierta en Discord.
> Si algo falla, el detalle queda en `%APPDATA%\NostalHub\cache\discord.log`.

**PS Vita:** el Grupo es la burbuja naranja de la primera página (con un número rojo: cuántas personas hay en tu
canal). Usa la misma conexión de Discord.

### Cómo se usa la PS Vita

- **Pantalla de bloqueo**: al entrar, despega la esquina de arriba a la derecha arrastrándola con el mouse, o
  presiona Enter / haz clic.
- **Inicio**: páginas de burbujas que se recorren **de arriba a abajo** (puntitos a la izquierda). La primera página
  tiene las apps: Grupo (Discord), Música (Spotify), Tienda, Amigos y Perfil (abren Steam), Biblioteca, Juego al azar,
  Trofeos, Ajustes y Consolas. Desde la segunda están tus juegos, los más recientes primero.
- **Abrir**: la burbuja va al centro, gira y se abre como **tarjeta** (LiveArea). La de un juego tiene la puerta con
  **Iniciar**, tu actividad, sus trofeos y la descripción.
- **Tarjetas**: cada app que abres queda a la derecha del inicio (hasta 5; al abrir la sexta se cierra la más
  antigua). Arriba, en la barra negra, salen sus burbujitas: clic para ir a una. Con el teclado, **Q / E** o ← → en
  los bordes. Para **cerrar** una tarjeta, **despega su esquina** de arriba a la derecha (arrastrando o con un clic) o
  presiona **Retroceso**.
- **Menú rápido** (**P**): sube desde abajo con la música, el volumen (← →), música de fondo y sonidos, Cambiar de
  consola, Ajustes y Energía.
- **Avisos** (el círculo azul de la esquina, o **N**): juegos nuevos, cuando entras a un canal de voz y cuánto jugaste.

---

## 7. Agregar juegos

**Juegos de Steam:** no hay que hacer nada. Los que ya tenías se agregan al abrir NostalHub, y los que descargues
**mientras NostalHub está abierta aparecen solos** cuando terminan de instalarse (sale un aviso "Nuevo juego").
Si alguno no aparece: ajustes → Juegos → **Buscar juegos nuevos de Steam**.

**Juegos que no son de Steam**, de dos formas:

1. **Agregándolos a Steam** (en Steam: *Juegos* → *Añadir un juego que no es de Steam a mi biblioteca*).
   NostalHub los toma de ahí solos, igual que los juegos de Steam, con las imágenes que les hayas puesto en Steam
   (portada, fondo y logo). Se abren directo con su `.exe`, así que al cerrarlos vuelves solo al menú.
2. **Desde NostalHub:** ajustes → Juegos → **Agregar juego o programa**, y elige su `.exe` o su acceso directo.

Para ponerle arte propio a cualquiera de ellos, usa su carpeta en `personalizar\` (sección 2).

**A mano en `config.json`** (si prefieres): ajustes → Archivos → **Abrir config.json**. Dentro de
`"games": [ ... ]` agrega una entrada:

```json
{ "name": "Minecraft", "target": "C:\\Users\\Xarlord\\Desktop\\Minecraft.lnk" }
```

- `target` puede ser un acceso directo `.lnk`, un `.exe` o una URL de otro launcher.
- En las rutas, cada `\` va doble: `\\`. Si el archivo queda mal escrito, NostalHub guarda una copia
  (`config.roto-….json`) y sigue funcionando sin tus cambios.
- **Ocultar un juego:** agrégale `"hidden": true`. No lo borres, porque los de Steam se vuelven a importar.
- **Cambiar el orden:** el orden de la lista es el orden en los menús.

---

## 8. Ajustes dentro de cada consola

Las mismas opciones del menú del ícono junto al reloj, con el estilo de cada consola:

| Consola | Cómo se abre | Cómo se usa |
|---|---|---|
| Wii | Botón del **engranaje** (abajo a la izquierda) | Pantalla "Configuración de NostalHub" con páginas (General, Juegos, Pantalla, Sonido, Archivos). Al elegir una opción se abre su pantalla con **Atrás / Confirmar** |
| Xbox 360 | Mosaico **Ajustes** (home o settings) o la tecla **G** | **La Guía**: pestañas con íconos (Q / E o ← →), Enter cambia la opción |
| PS2 | Botón **Configuración** (abajo a la derecha) o la tecla **C** | "Configuración del sistema": ↑ ↓ elegir, ← → cambiar, Enter aceptar |
| PS4 | **Ajustes** en la fila de funciones (↑) o en el menú rápido (**P**) | Lista de categorías con íconos; las opciones con casilla se marcan con Enter y las de elegir abren una lista |
| PS Vita | Burbuja **Ajustes** (primera página) o el menú rápido (**P**) | Se abre como tarjeta: lista clara de categorías → opciones; Esc vuelve a las categorías |

"Salir de NostalHub" siempre pregunta antes de cerrar. El menú del ícono junto al reloj sigue estando, con las mismas opciones.

### Pantalla completa o ventana

En **Ajustes → Pantalla → Modo**:
- **Pantalla completa** (como siempre). Ahí mismo eliges si **cubre la barra de tareas** de Windows o no.
  También aparece como **app abierta en la barra de Windows**: si algo la tapa, un clic ahí y vuelve adelante
  (se apaga con *Mostrar en la barra de Windows*).
- **Ventana**: se puede mover, cambiar de tamaño y minimizar, y recuerda dónde la dejaste. Arriba hay una barra
  **escondida**: lleva el mouse al borde de arriba y baja con **minimizar, maximizar y cerrar**. La barra cambia de
  estilo según dónde estés (selector o cada consola). Arrástrala para mover la ventana; doble clic la maximiza.
  **Cerrar** sale de NostalHub.

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
- **Ajustes → Pantalla**: activar o desactivar **Logros sobre el juego** y elegir **en qué pantalla** aparecen.
- **Prueba**: **Ctrl + Alt + Shift + L** muestra un logro falso con el estilo de la consola en la que estás.
- Sonido: el tuyo en `consolas\<consola>\logro.wav` (por ejemplo `consolas\ps3\logro.wav`); si no, uno hecho con código.

### Cómo se usa la PS3

- **Categorías** en fila: Usuarios, Ajustes, Música (Spotify), Juego, PlayStation Network (tienda y novedades de
  Steam) y Amigos (Amigos de Steam y tu canal de voz de Discord). ← → para cambiar, ↑ ↓ para recorrer sus opciones.
- **Juego**: arriba está la **Colección de trofeos** y después tus juegos (los más recientes primero). Si te quedas
  un segundo sobre un juego, aparece su **fondo** a pantalla completa y suena su **música** (`musica.mp3`, si le pusiste).
- **O** (el triángulo): **opciones** del juego: Iniciar, Información, Logros, Cambiar imágenes y **Ordenar**.
- **Fondo**: el color cambia **cada mes** como en la PS3, y es más oscuro de noche. Para dejar un color fijo:
  **Ajustes → Ajustes de tema → Color**. Ahí también puedes apagar el **Brillo según la hora**.
- **Encendido**: al entrar aparece la ola con destellos (Enter o un clic lo salta). Si tienes `intro.mp4` en
  `consolas\ps3\`, o apagaste los videos de inicio, entra directo.

### Cómo se usa la Nintendo 3DS

- Se ve la consola abierta con sus **dos pantallas**: arriba el banner del icono marcado (con profundidad 3D que
  sigue al mouse; el **deslizador 3D** a la derecha de la pantalla la sube o la apaga) y abajo la cuadrícula de iconos.
- Primero van las apps: **Configuración de la consola** (tema de las pantallas, color de la carcasa y las opciones de
  NostalHub), **Nintendo eShop** (Steam), **Registro de actividad** (tus horas por juego), **Nintendo 3DS Sonido**
  (Spotify), **Logros** y **Cambiar de consola**. Después tus juegos, los más recientes primero.
- Arriba de la pantalla táctil: Notas (logros), **Lista de amigos** (tu canal de Discord), Notificaciones, Navegador
  (actividad de Steam) y Perfil.
- Abajo: los botones **− / +** cambian cuántas filas se ven (de 1 a 6) y el pincel abre el **Tema**.
- Los botones de la carcasa funcionan con clic: cruceta, **A** (abrir), **B** (volver), **X** (opciones del juego),
  **Y** (más filas), **HOME** (vuelve al menú) y el botón de **encendido** (cambiar de consola o apagar).
- El icono de cada juego es la misma imagen cuadrada de la Switch (`cuadrado.png`).

---

## 9. Teclas

| Dónde | Teclas |
|---|---|
| Selector de consolas | ↑ ↓ elegir · Enter entrar · **O** ordenar las consolas (personalizado, fecha de salida, nombre o empresa; "Mover…" para cambiar una de lugar con ↑ ↓) · **Esc** pregunta si cerrar la app (Esc otra vez = cerrar) |
| Wii | ← → páginas / juegos · Enter iniciar · Esc volver (en el menú: volver al selector) |
| PS2 | Flechas moverse · Enter elegir · **C** configuración · Esc volver |
| Xbox 360 | Flechas moverse · **Q / E** cambiar de pestaña · **G** la Guía · Enter seleccionar · Esc volver |
| PS4 | ← → juegos · **↑** funciones · **↓** ficha del juego · Enter jugar · **P** menú rápido · Esc volver (en el menú principal: selector) |
| Cualquier consola | **Clic derecho** sobre un juego, o la tecla **I** con el juego marcado: cambiar imágenes y descripción |
| Nintendo Switch | ← → juegos · **↓** botones redondos · Enter iniciar · **O** opciones del juego · **S** ordenar (Todo el software) · Esc volver (en el inicio: selector). Tema claro u oscuro: **Ajustes → Tema** |
| PS3 | ← → categorías · ↑ ↓ opciones · Enter elegir / iniciar · **O** opciones (el triángulo) · Esc volver (en la barra: selector). Color del fondo: **Ajustes → Ajustes de tema** |
| Nintendo 3DS | Flechas por la cuadrícula · Enter abrir · **O** (o X) opciones del juego · **+ / −** filas · Esc volver (en el menú: selector) |
| PS Vita | Flechas entre burbujas (↑ ↓ en los bordes, o la rueda / RePág / AvPág, cambian de página) · Enter abrir · **Q / E** cambiar de tarjeta · **Retroceso** cerrar la tarjeta · **P** menú rápido · **N** avisos · Esc inicio (en el inicio: selector) |

---

## 10. Si algo no se ve bien

- **Arte raro o faltante:** ajustes → Juegos → *Volver a descargar el arte*.
- **Juegos nuevos de Steam:** ajustes → Juegos → *Buscar juegos nuevos de Steam*.
- **La barra de tareas tapa el menú:** ajustes → Pantalla → desactiva *Cubrir la barra de tareas*.
- **Ver errores:** ajustes → Archivos → *Herramientas de desarrollo*, o `npm run dev`.
- **¿Va fluido?** Presiona **F3** en cualquier pantalla: abajo a la izquierda aparecen los **FPS** (cuadros por
  segundo; lo normal es lo mismo que tu monitor, por ejemplo 60) y el cuadro más lento del último segundo. F3 otra vez
  lo esconde.
