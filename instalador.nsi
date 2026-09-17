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
SetCompressionLevel 9

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
InstallDir "$PROGRAMFILES\Sublimix"
ShowInstDetails show
ShowUnInstDetails show

; Seção de Instalação
Section "Sublimix POS 2.0" SEC01
    SetOutPath "$INSTDIR"
    SetOverwrite try
    
    ; Copiar todos os arquivos
    File /r "..\*.*"
    
    ; Remover node_modules e database.db se existirem
    RMDir /r "$INSTDIR\backend\node_modules"
    Delete "$INSTDIR\backend\database.db"
    Delete "$INSTDIR\backend\.env"
    
    ; Criar atalho no Desktop
    CreateDirectory "$SMPROGRAMS\Sublimix"
    CreateShortCut "$SMPROGRAMS\Sublimix\Sublimix POS.lnk" "$INSTDIR\INICIE_BACKEND.bat" "" "$INSTDIR\Sublimix.ico"
    CreateShortCut "$DESKTOP\Sublimix POS.lnk" "$INSTDIR\INICIE_BACKEND.bat"
    
    ; Instalar/verificar Node.js
    Call InstallNodeJS
    
SectionEnd

; Seção de Instalação de Dependências
Section "Instalar Dependências" SEC02
    SetOutPath "$INSTDIR\backend"
    
    ; Executar npm install
    ExecWait "cmd.exe /c npm install"
    
    ; Inicializar banco de dados
    ExecWait "cmd.exe /c node install.js"
    
SectionEnd

; Função para instalar Node.js se não estiver instalado
Function InstallNodeJS
    ReadRegStr $0 HKLM "Software\Node.js" "InstallPath"
    ${If} $0 == ""
        MessageBox MB_YESNO "Node.js não foi detectado.$\nVocê deseja ser levado ao site de download?" IDYES download IDNO skip
        
        download:
            ExecShell "open" "https://nodejs.org/"
            MessageBox MB_OK "Instale o Node.js LTS e reinicie este instalador."
            Quit
        skip:
    ${EndIf}
FunctionEnd

; Seção de Desinstalação
Section Uninstall
    RMDir /r "$INSTDIR"
    RMDir /r "$SMPROGRAMS\Sublimix"
    Delete "$DESKTOP\Sublimix POS.lnk"
    
    DeleteRegKey HKLM "${PRODUCT_UNINST_KEY}"
    DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
SectionEnd
