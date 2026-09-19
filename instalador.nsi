; NSIS Installer Script para Sublimix POS 2.0
; Baixe NSIS em: https://nsis.sourceforge.io/

!include "MUI2.nsh"
!include "x64.nsh"

; Definições
!define PRODUCT_NAME "Sublimix POS"
!define PRODUCT_VERSION "2.0.0"
!define PRODUCT_PUBLISHER "Sublimix"
!define PRODUCT_WEB_SITE "https://sublimix.com"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\Sublimix.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"

SetCompressor lzma

; MUI Settings
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Portuguese"

; Configurações do Instalador
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "Sublimix-Instalador.exe"
Icon "Sublimix.ico"
InstallDir "$PROGRAMFILES\Sublimix"
ShowInstDetails show
ShowUnInstDetails show

; Seção de Instalação
Section "Sublimix POS 2.0" SEC01
    SetOutPath "$INSTDIR"
    SetOverwrite try
    
    ; Copiar apenas os arquivos da aplicação e as dependências já instaladas.
    ; O instalador não acessa a internet nem executa npm install.
    File "index.html"
    File "login.html"
    File "script.js"
    File "react-dashboard.js"
    File "style.css"
    File "INICIE_AQUI.md"
    File "INICIE_BACKEND.bat"
    File "Sublimix.ico"

    SetOutPath "$INSTDIR\backend"
    ; O banco e o .env sao criados no computador de destino.
    File /r /x "database.db" /x ".env" "backend\*"

    SetOutPath "$INSTDIR\runtime"
    File /r "runtime\*"

    ; O banco e as configurações são criados no computador de destino.
    Delete "$INSTDIR\backend\database.db"
    Delete "$INSTDIR\backend\.env"
    
    ; Criar atalho no Desktop
    CreateDirectory "$SMPROGRAMS\Sublimix"
    CreateShortCut "$SMPROGRAMS\Sublimix\Sublimix POS.lnk" "$INSTDIR\INICIE_BACKEND.bat" "" "$INSTDIR\Sublimix.ico"
    CreateShortCut "$DESKTOP\Sublimix POS.lnk" "$INSTDIR\INICIE_BACKEND.bat"
    
    ; Inicializar o banco SQLite usando o Node empacotado.
    ExecWait '"$INSTDIR\runtime\node.exe" "$INSTDIR\backend\install-offline.js"'

SectionEnd

; Seção de Desinstalação
Section Uninstall
    RMDir /r "$INSTDIR"
    RMDir /r "$SMPROGRAMS\Sublimix"
    Delete "$DESKTOP\Sublimix POS.lnk"
    
    DeleteRegKey HKLM "${PRODUCT_UNINST_KEY}"
    DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
SectionEnd
