/* Lista de consolas del selector.
   Para agregar una consola nueva:
     1. Crea la carpeta renderer/themes/<id>/ con theme.js y theme.css
        (copia la de "wii" como punto de partida).
     2. Agrega aquí una entrada con el mismo "id".
   El ícono y un fondo opcional se ponen en %APPDATA%\NostalHub\consolas\<id>\
   (icono.png y fondo.jpg). */
window.CONSOLES = [
  {
    id: 'wii',
    company: 'Nintendo',
    name: 'Wii',
    year: 2006,
    // Cómo se ve el selector cuando esta consola está marcada
    look: {
      background:
        'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(255,255,255,0.95), rgba(255,255,255,0) 70%),' +
        'repeating-linear-gradient(to bottom, #ececec 0 3px, #e1e1e1 3px 4px)',
      base: '#ececec', // color de los bordes si la pantalla no es 16:9
      text: '#5b5b5b',
      subtext: '#9a9a9a',
      accent: '#34bfed',
      font: "'M PLUS Rounded 1c', 'Segoe UI', sans-serif",
      nameWeight: 800,
      nameShadow: '0 4px 0 rgba(255,255,255,0.7)',
      enterFlash: '#ffffff', // color del destello al entrar
    },
  },
  {
    id: 'ps2',
    company: 'Sony',
    name: 'PlayStation 2',
    year: 2000,
    look: {
      background:
        'radial-gradient(ellipse 60% 55% at 70% 50%, rgba(40,90,220,0.45), rgba(40,90,220,0) 70%),' +
        'radial-gradient(ellipse 90% 80% at 30% 30%, #0b1a44 0%, #050b1f 55%, #010208 100%)',
      base: '#020616',
      text: '#eef3ff',
      subtext: '#7f97d6',
      accent: '#3d7bff',
      font: "'Segoe UI', 'M PLUS Rounded 1c', sans-serif",
      nameWeight: 300,
      nameShadow: '0 0 40px rgba(70,130,255,0.55)',
      enterFlash: '#000000', // entra con un fundido a negro
    },
  },
  {
    id: 'x360',
    company: 'Microsoft',
    name: 'Xbox 360',
    year: 2005,
    look: {
      background:
        'radial-gradient(ellipse 55% 60% at 72% 50%, rgba(90,200,40,0.35), rgba(90,200,40,0) 70%),' +
        'linear-gradient(to bottom, #3c3c3c 0%, #5e5e5e 40%, #9a9a9a 100%)',
      base: '#4a4a4a',
      text: '#ffffff',
      subtext: '#c9e8b8',
      accent: '#45b52a',
      font: "'Segoe UI', 'Selawik', 'Helvetica Neue', Arial, sans-serif",
      nameWeight: 300,
      nameShadow: '0 3px 12px rgba(0,0,0,0.35)',
      enterFlash: '#e9e9e9',
    },
  },
  {
    id: 'ps4',
    company: 'Sony',
    name: 'PlayStation 4',
    year: 2013,
    look: {
      background:
        'radial-gradient(ellipse 60% 60% at 72% 48%, rgba(120,180,255,0.35), rgba(120,180,255,0) 70%),' +
        'linear-gradient(160deg, #1d5fd8 0%, #0b3aa3 45%, #04206b 100%)',
      base: '#0a2f8c',
      text: '#ffffff',
      subtext: '#a9c6ff',
      accent: '#ffffff',
      font: "'Segoe UI', 'Selawik', 'Helvetica Neue', Arial, sans-serif",
      nameWeight: 300,
      nameShadow: '0 4px 24px rgba(0,20,80,0.45)',
      enterFlash: '#000000',
    },
  },
];
