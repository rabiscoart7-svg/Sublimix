@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════╗
echo ║    INSTALADOR DO SUBLIMIX POS 2.0      ║
echo ╚════════════════════════════════════════╝
echo.

REM Verificar se Node.js está instalado
echo [1/4] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js NÃO está instalado!
    echo.
    echo Baixe em: https://nodejs.org/ (versão LTS)
    echo Reinicie o instalador após instalar.
    pause
    exit /b 1
)
echo ✅ Node.js encontrado: 
node --version
echo.

REM Instalar dependências do backend
echo [2/4] Instalando dependências do backend...
cd backend
call npm install
if errorlevel 1 (
    echo ❌ Erro ao instalar dependências!
    pause
    exit /b 1
)
echo ✅ Dependências instaladas com sucesso!
echo.

REM Inicializar banco de dados
echo [3/4] Preparando banco de dados...
if not exist "database.db" (
    node install.js
    echo ✅ Banco de dados criado!
) else (
    echo ✅ Banco de dados já existe!
)
echo.

REM Finalizar
echo [4/4] Instalação concluída!
echo.
echo ╔════════════════════════════════════════╗
echo ║   ✅ PRONTO PARA USAR!                 ║
echo ╚════════════════════════════════════════╝
echo.
echo Para iniciar o sistema:
echo.
echo 1. Abra "INICIE_BACKEND.bat" para rodar o servidor
echo 2. Abra "login.html" no navegador
echo.
pause
