@echo off
chcp 65001 >nul
cls

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                  SUBLIMIX POS 2.0 - Menu Principal             ║
echo ║                                                                ║
echo ║  Bem-vindo! O que deseja fazer?                               ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo.
echo   [1] ✅ Instalar/Atualizar o sistema (npm install)
echo.
echo   [2] 🚀 Iniciar o servidor (INICIE_BACKEND.bat)
echo.
echo   [3] 🎯 Gerar instalador .exe profissional
echo.
echo   [4] 📖 Ver guias e documentação
echo.
echo   [5] ❓ Ver credenciais padrão
echo.
echo   [0] ❌ Sair
echo.
echo.
set /p opcao="Escolha uma opção [0-5]: "

if "%opcao%"=="1" (
    cls
    echo Abrindo setup de instalação...
    timeout /t 1 >nul
    call INSTALAR.bat
    goto menu
)

if "%opcao%"=="2" (
    cls
    call INICIE_BACKEND.bat
    goto menu
)

if "%opcao%"=="3" (
    cls
    echo Abrindo gerador de instalador...
    timeout /t 1 >nul
    call GERAR_INSTALADOR.bat
    goto menu
)

if "%opcao%"=="4" (
    echo.
    echo Arquivos de documentação:
    echo.
    echo  • INICIE_AQUI.md ............ Guia inicial
    echo  • GUIA_DISTRIBUICAO.md ...... Como distribuir para outros PCs
    echo  • COMO_CRIAR_EXE.md ........ Criar instalador .exe
    echo.
    pause
    goto menu
)

if "%opcao%"=="5" (
    cls
    echo.
    echo ╔════════════════════════════════════════════════════════════════╗
    echo ║                  CREDENCIAIS PADRÃO                            ║
    echo ╚════════════════════════════════════════════════════════════════╝
    echo.
    echo   URL de Acesso: http://localhost:8000/login.html
    echo.
    echo   Usuário: admin
    echo   Senha:   admin123
    echo.
    echo ╔════════════════════════════════════════════════════════════════╝
    echo.
    pause
    goto menu
)

if "%opcao%"=="0" (
    cls
    echo.
    echo Até logo! 👋
    echo.
    exit /b 0
)

echo.
echo ⚠️  Opção inválida!
timeout /t 2 >nul
:menu
goto start
:start
cls
call :main
exit /b 0
