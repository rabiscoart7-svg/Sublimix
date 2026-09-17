@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM ==========================================
REM INICIAR SUBLIMIX - Versão 2.0
REM ==========================================

title Sublimix POS - Backend
color 0A

cls
echo.
echo ╔════════════════════════════════════════════╗
echo ║      SUBLIMIX POS - BACKEND v2.0           ║
echo ║                                            ║
echo ║  Iniciando servidor...                    ║
echo ╚════════════════════════════════════════════╝
echo.

REM Verificar se Node.js está instalado
echo [VERIFICAÇÃO] Buscando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ❌ ERRO: Node.js não foi encontrado!
    echo.
    echo Para instalar Node.js:
    echo 1. Baixe em: https://nodejs.org/
    echo 2. Execute o instalador
    echo 3. Reinicie o Windows
    echo 4. Tente novamente
    echo.
    pause
    exit /b 1
)

REM Obter versão do Node.js
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% encontrado

REM Ir para a pasta backend
cd /d "%~dp0backend"
if errorlevel 1 (
    color 0C
    echo ❌ Erro: Não consegui entrar na pasta backend!
    pause
    exit /b 1
)

REM Verificar se node_modules existe
echo.
echo [VERIFICAÇÃO] Buscando dependências...
if not exist "node_modules" (
    echo ❌ Dependências não instaladas!
    echo.
    echo Instalando npm packages...
    call npm install
    if errorlevel 1 (
        color 0C
        echo ❌ Erro ao instalar dependências!
        pause
        exit /b 1
    )
    echo ✅ Dependências instaladas
)
echo ✅ Dependências encontradas

REM Iniciar o servidor
echo.
echo ╔════════════════════════════════════════════╗
echo ║         🚀 INICIANDO BACKEND...            ║
echo ║                                            ║
echo ║  URL: http://localhost:3000               ║
echo ║  Banco: SQLite (database.db)              ║
echo ║                                            ║
echo ║  Para parar: Pressione CTRL + C            ║
echo ║  Depois feche esta janela                 ║
echo ║                                            ║
echo ║  Esqueceu a senha?                        ║
echo ║  Veja INICIE_AQUI.md                      ║
echo ╚════════════════════════════════════════════╝
echo.

REM Executar o servidor Node.js
npm start

REM Se chegou aqui, o servidor foi encerrado
color 0E
echo.
echo ⛔ Servidor encerrado
echo.
pause
