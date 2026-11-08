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

- [ ] Un ayudante común para moverse por listas y cuadrículas (hoy hay 4 formas distintas).
- [ ] Separar el `mount` de cada consola por pantallas (menú, ficha, logros, amigos, ajustes, música).
      Orden: PS2 → Switch → Xbox 360 → 3DS → PS3 → Wii → PS4 → Vita.

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
- Ojo para las pruebas con la app real: dentro de una consola, Enter abre un juego de verdad. El script solo aprieta teclas
  con el selector a la vista y sin ninguna consola abierta (una vez se abrió Pokémon Fire Red por apretar Enter a ciegas).
