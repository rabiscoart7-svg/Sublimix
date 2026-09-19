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

REM Usar o Node.js empacotado no instalador; não depende do Node do Windows
echo [VERIFICAÇÃO] Buscando Node.js local...
set "NODE_EXE=%~dp0runtime\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=node"
"%NODE_EXE%" --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ❌ ERRO: Node.js não foi encontrado no pacote!
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
for /f "tokens=*" %%i in ('"%NODE_EXE%" --version') do set NODE_VERSION=%%i
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
    color 0C
    echo ❌ Dependências não foram incluídas no instalador!
    pause
    exit /b 1
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

REM Abrir a tela de login no navegador padrão após o servidor iniciar
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:3000/login.html'"

REM Executar o servidor Node.js
"%NODE_EXE%" server.js

REM Se chegou aqui, o servidor foi encerrado
color 0E
echo.
echo ⛔ Servidor encerrado
echo.
pause
