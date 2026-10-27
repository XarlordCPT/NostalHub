; Textos propios del instalador de NostalHub (electron-builder lo agrega con "nsis.include" en package.json).
; El archivo va en UTF-8 con BOM para que se vean bien los tildes.

!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Bienvenido a NostalHub ${VERSION}"
  !define MUI_WELCOMEPAGE_TEXT "Tus juegos con los menús de 8 consolas clásicas: Wii, PS2, Xbox 360, PS3, PS4, PS Vita, Switch y 3DS.$\r$\n$\r$\nSi ya tienes NostalHub, se actualiza a esta versión sin perder tus juegos, ajustes, fondos ni sonidos (viven en %APPDATA%\NostalHub).$\r$\n$\r$\nPresiona Siguiente para continuar."
  !insertmacro MUI_PAGE_WELCOME
!macroend

!ifndef BUILD_UNINSTALLER
  !define MUI_FINISHPAGE_TITLE "¡NostalHub está listo!"
  !define MUI_FINISHPAGE_TEXT "Se instaló NostalHub ${VERSION}.$\r$\n$\r$\nAl abrirlo vive junto al reloj de Windows. Para conectar Steam, Spotify o Discord: Ajustes → Cuentas."
  !define MUI_FINISHPAGE_RUN_TEXT "Abrir NostalHub"
!endif

!macro customUnWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Desinstalar NostalHub"
  !define MUI_WELCOMEPAGE_TEXT "Se quitará NostalHub de este PC.$\r$\n$\r$\nTus juegos, ajustes, fondos, sonidos y claves se quedan guardados en %APPDATA%\NostalHub, por si lo vuelves a instalar. Si quieres borrarlos, elimina esa carpeta a mano."
  !insertmacro MUI_UNPAGE_WELCOME
!macroend
