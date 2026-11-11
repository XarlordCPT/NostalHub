# Plan de limpieza de NostalHub

Rama: `limpieza`. `main` no se toca hasta que Cristóbal la junte. Un commit por paso, para poder deshacer solo ese paso.

## Reglas de cada paso

1. Un cambio chico, de un solo tema.
2. `npm test` pasa entero: la lógica, las 8 consolas y las capturas.
3. Las capturas de antes y de después son iguales; si cambia algo, tiene que ser a propósito y quedar explicado.
4. Commit en `limpieza` con un mensaje en español que diga qué cambió.
5. Al terminar cada etapa: prueba con la app real (sin mostrar claves) y un resumen para Cristóbal.

## Etapa 1: red de seguridad (sin cambiar el código de la app)

- [x] `tests/` con `npm test` (usa `node --test` y el Electron que ya está; nada que instalar).
- [x] Pruebas de lógica (34): `vdf`, `achievements` (parseKV, setsOf), `playlog` (sesiones y resumen), `emulators` (nombres, `retroarchOption`, `tailFile`),
      `retroachievements` (subsets, avisos, totales), `launcher` (`.url` de Epic, Volver al menú), `config` y los ayudantes de `common.js`.
- [x] Prueba de pantallas (44, unos 100 s): entra a las 8 consolas con el mock y recorre el menú, la ficha, los logros (con sets), los ajustes, los amigos y la música,
      con teclado. Falla si sale un error en la consola o si una pantalla no se abre.
- [x] Capturas de referencia: cada pantalla con la hora, el azar y las animaciones congelados. Cada cambio se compara píxel a píxel.

## Etapa 2: limpieza de bajo riesgo

- [x] Registro de errores único (`cache\nostalhub.log`) en vez de los `catch {}` vacíos que esconden fallas reales.
- [x] Ayudantes repetidos a `common.js`: `esc` (9 copias), `wait` (12), `$$` (6), `pad` (4); la Xbox usa los de `common.js`
      (`escapeHtml`, `ago`, `hours`, `achievementMessage`).
- [x] Código muerto (ej. el `return null` que nunca se ejecuta en `retroarchOption`).
- [x] `mock.js`: las 7 funciones que le faltan del puente.
- [x] Animaciones con nombres genéricos (`fade-in`, `pulse`…) → con el prefijo de su consola.
- [x] Documentación al día (`CLAUDE.md`: `mount` devuelve `{ unmount }`; `CONSOLA-NUEVA.md`: sets, música del canal, recorte).

## Etapa 3: separar `main.js`

- [x] Sacar a `src/` lo que tiene su propio tema: editor de imágenes y recorte (`editor-juegos.js`), archivos de las consolas
      (`consolas-archivos.js`), emuladores y RetroAchievements (`juegos-emulador.js`), la biblioteca (`biblioteca.js`) y cómo se
      convierten las opciones de Ajustes (`opciones.js`). `main.js` queda como el que arma y conecta todo (2092 → 1329 líneas).
- [x] Cambio de plan: la lista de opciones (`menuSections`) se queda en `main.js`. Es justamente lo que conecta cada opción con su
      función de `main.js` (usa unas 30): sacarla obligaba a pasarle esas 30 funciones, más enredo y no menos. Horas y
      presencia (`trackTick`, unas 60 líneas que usan Steam, el launcher y la ventana) también se quedan, por lo mismo.

## Etapa 4: ordenar las consolas (una por commit, de la más chica a la más grande)

- [x] Un ayudante común para moverse por listas y cuadrículas (hoy hay 4 formas distintas): `U.rowWindow`.
- [ ] Separar el `mount` de cada consola por pantallas (menú, ficha, logros, amigos, ajustes, música).
      Orden: PS2 → Switch → Xbox 360 → 3DS → PS3 → Wii → PS4 → Vita. **Listas: PS2, Switch, Xbox 360 y 3DS.** Sigue: PS3.

### Cómo retomarla (notas para la próxima sesión)

- **Estado**: `limpieza` (etapas 1 a 3) ya se juntó con `main` y salió como **v1.2.0**. Para seguir: `git switch limpieza` y
  `git merge main` (main tiene arreglos posteriores). En `limpieza` Claude hace los commits y el push; `main` es de Cristóbal.
- **Tamaño de cada `mount`** (líneas): PS2 726, Switch 995, Xbox 1031, 3DS 1046, PS3 1287, Wii 1305, PS4 1515, Vita 1651. Todo
  vive en una sola función con variables compartidas: separar por pantallas = objetos o funciones por sección dentro del
  mismo archivo (o archivos por sección), sin cambiar lo que se ve. Una consola por commit.
- **Cómo quedó la PS2 (el molde para las demás)**: `mount` arma un objeto `s` con lo que es de todas las pantallas (`view`,
  `games`, `current`, `summary`, `caption`, `$`, `api`, `ctx`, `setHints`, `refreshFree`) y crea cada pantalla con una función
  aparte del mismo archivo (`encabezado`, `pantallaJuegos`, `pantallaDetalle`, `pantallaLogros`, `pantallaConfig`,
  `pantallaAmigos`). Cada una guarda lo suyo adentro y devuelve solo lo que usan las otras (`open`, `key`, `dispose`…);
  entre ellas se llaman por `s.juegos`, `s.detalle`… `onKey` queda en `mount` y reparte la tecla según `s.view`. Se
  mantuvo el orden en que se piden los datos al abrir.
- **Switch, Xbox 360 y 3DS** siguen el mismo molde. Diferencias: en la Xbox lo de todas (qué está marcado, moverse con
  flechas, pistas, cambiar de vista) lo pone `navegacion(s)` directo en `s`; en la 3DS el objeto se llama `ds` (ahí `s` se
  usa mucho como nombre corto dentro de las funciones) y cada app del sistema es su propia función (`appAjustes`,
  `appActividad`, `appMusica`, `appLogros`, `appAmigos`, `appGrupo`, `appNotas`) dentro del marco `marcoDeApps`.
- **Cómo se hicieron (más rápido y con menos riesgo que reescribir a mano)**: un script de Python copia cada tramo de líneas
  tal cual a su función nueva y cambia solo los nombres (`view` → `s.view`, `openGame(` → `s.ficha.open(`), sin tocar
  `.nombre`, `'nombre'`, `-nombre` ni claves `nombre: '…'`; ojo con `...nombre` y con variables locales que se llaman igual
  que una compartida. Después: `node --check`, y un revisor de variables sin definir
  (`npx eslint@8 --no-eslintrc --env browser,es2022 --rule "no-undef: error" <tema>`, corrido fuera del proyecto; no se
  instala nada en el repo). Recién ahí las capturas.
- **Antes de separar una consola, agregar a `PANTALLAS` lo que su prueba no cubre** (mouse, iniciar un juego y volver), guardar
  esa referencia con el código de antes (`git stash push <tema>` → `npm run test:referencia -- <consola>` → `git stash pop`)
  y recién ahí comparar.
- **Ojo con lo que la prueba deja guardado**: las ventanas de prueba comparten `localStorage` entre corridas (perfil
  `%APPDATA%\Electron`, no los datos reales). Un paso que cambie el orden de los juegos cambia las capturas de las corridas
  siguientes: no poner clics en Ordenar. No limpiar ese `localStorage` (se probó: cambia Wii y Xbox, y hubo que rehacer las
  referencias con el código de antes).
- **`U.rowWindow(first, row, per, total)`**: lo usan PS2 (grilla), PS4 (Biblioteca y trofeos), Vita (trofeos y Biblioteca) y
  Switch (Biblioteca). Se dejaron como estaban, porque se mueven distinto a propósito: PS3 (la fila marcada va al medio),
  Switch logros y Vita ajustes (la marcada queda fija en la 4ª / 7ª fila) y PS2 configuración (por píxeles, filas de alto distinto).
- **Las 4 formas de moverse por listas** (como estaban antes del ayudante):
  1. Cuadrículas con títulos de sets (Wii `.wa-grid`, PS2 `.pa-grid`, Xbox `.xb-ach-grid`): `U.gridMove(celdas, i, dir)`.
  2. Filas del mismo alto movidas con `translateY(-primera * alto)`: PS3 `setRow` (`ROW_H`), PS4 `setTrophy` (`T_ROW_H`),
     Switch `paintGameRows` / `paintAchFocus` (112 px), Vita `card.onFocus` (`T_ROW`, usa el índice en la lista).
  3. Listas con `scrollIntoView({ block: 'nearest' })`: 3DS `paintAppSel`.
  4. Títulos que no se pueden marcar: `U.withSetHeads` + `U.skipSetHead`.
- **Cómo probar cada paso**: `npm test -- <consola>` mientras se trabaja, `npm test` entero antes del commit, y al terminar la
  consola `npm run test:app-real:consolas` (NostalHub cerrada; nunca Enter dentro de una consola). Si una pantalla cambia a
  propósito: revisar `tests/capturas/diferencias/` y `npm run test:referencia -- <consola>`.
- **Imágenes animadas** (`.webp`/`.gif` pesadas): `U.stillBackground(el, url)` (primer cuadro; sirve para fondos e `<img>`) y
  `U.liveBackground(el, grupo, espera)` (solo el marcado se anima, después de `espera` ms y con `decode()`). Ya lo usan PS4
  (fila, Biblioteca y fondo) y PS3 (íconos; el fondo grande usa `decode()`); la Wii tiene su propia versión (`tileImage`,
  `setLiveTile`). Si otra consola se traba con fondos animados (Vita, Switch, 3DS, Xbox, PS2), aplicar lo mismo.
- **Pendiente sin reproducir**: PS3 al bajar muy rápido, los íconos "se desarmaban" (montados unos sobre otros). Con datos de
  prueba y con la app real (hasta 200 movimientos por segundo) siempre quedaron en su lugar; Cristóbal dice que ahora lo que
  pasaba era el tirón del ícono animado de Minecraft (arreglado). Si vuelve: preguntar si se queda así y con qué (teclado,
  control o rueda).

## Etapa 5: CSS y HTML

- [ ] Menos `!important` (Vita 56, Switch 20, PS3 13): selectores más precisos.
- [ ] HTML larguísimo en una línea → partido en piezas que se lean, y siempre con `esc` en los textos de los juegos.

## Etapa 6: cierre

- [ ] Prueba completa con la app real y una lista de 5 minutos para Cristóbal (Steam, Spotify, Discord, control y sonidos).
- [ ] Cómo juntar `limpieza` con `main`.
- [ ] Preguntar antes de borrar `dist/` (778 MB) y `_to_delete/` (272 MB).

## Avance

(Se va anotando aquí qué se hizo en cada commit.)

- **Etapa 1 lista.** `npm test`: 34 pruebas de lógica + 44 pantallas. Dos corridas seguidas sin cambios dan 0 diferencias, y un
  error puesto a propósito en la Wii se detectó (pantalla que no abre + error en la consola + 88 535 píxeles distintos).
- **Etapa 2 lista** (6 commits): código muerto, ayudantes a `common.js`, mock completo (+ prueba), animaciones con prefijo
  (+ prueba de CSS), registro de errores (+ pruebas) y documentación. `npm test`: 41 de lógica + 44 pantallas, todo bien.
  Probada con la app real: las 8 consolas entran, 0 errores, el registro ni se creó.
- **Etapa 3 lista** (5 commits + 1 de pruebas más estables). Cada paso se comparó con una prueba rápida de la app real (15
  funciones de solo lectura del puente: igual a la referencia) y con `npm test` (51 de lógica + 44 pantallas). Al final, la
  prueba completa con la app real: 8 consolas, menú desde la interfaz, 0 errores. Arreglos encontrados de paso: el LEEME de
  consolas perdía la barra de `fondos\`, y `splitArgs` cortaba `--c="d e"` en dos.
- **Etapa 4, en marcha** (2 commits). `U.rowWindow` con prueba (la misma cuenta estaba escrita 6 veces) y la PS2 separada por
  pantallas. `npm test`: 56 de lógica + 49 pantallas (2 nuevas de la PS2 con mouse), 0 diferencias; app real: 8 consolas, 0
  errores. Las capturas de referencia se rehicieron con el código de antes del cambio (ver las notas de la etapa 4).
- **Etapa 4, mitad lista** (4 consolas de 8, un commit cada una): PS2, Switch, Xbox 360 y 3DS. `npm test`: 56 de lógica + 73
  pantallas (26 nuevas: mouse, jugar y volver, Grupo, música, ventanas, mover íconos), 0 diferencias contra el código de
  antes; app real: 8 consolas, 0 errores. Faltan PS3, Wii, PS4 y Vita.
- Ojo para las pruebas con la app real: dentro de una consola, Enter abre un juego de verdad. El script solo aprieta teclas
  con el selector a la vista y sin ninguna consola abierta (una vez se abrió Pokémon Fire Red por apretar Enter a ciegas).
