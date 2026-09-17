@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ╔══════════════════════════════════════════════════════────════╗
echo ║           GERADOR DE INSTALADOR .EXE - SUBLIMIX POS 2.0      ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo [PASSO 1] Verificando NSIS...
where makensis >nul 2>&1
if errorlevel 1 (
    echo ❌ NSIS não está instalado!
    echo.
    echo Para criar um instalador .exe profissional:
    echo.
    echo 1. Baixe em: https://nsis.sourceforge.io/
    echo 2. Execute o instalador
    echo 3. Selecione "Add NSIS to PATH"
    echo 4. Reinicie o PowerShell
    echo 5. Execute este arquivo novamente
    echo.
    pause
    exit /b 1
)
echo ✅ NSIS encontrado!
echo.

echo [PASSO 2] Compilando arquivo instalador...
echo Aguarde alguns segundos...
echo.

cd /d "%~dp0"
makensis.exe /V3 "instalador.nsi"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ╔══════════════════════════════════════════════════════════════╗
    echo ║                    ✅ SUCESSO!                               ║
    echo ╚══════════════════════════════════════════════════════════════╝
    echo.
    echo Arquivo criado: Sublimix-Instalador.exe
    echo.
    echo Você agora pode:
    echo   • Enviar este arquivo para outros computadores
    echo   • Fazer upload para seu servidor/site
    echo   • Distribuir via email, USB, etc.
    echo.
    echo O instalador irá:
    echo   ✓ Verificar/instalar Node.js
    echo   ✓ Copiar todos os arquivos
    echo   ✓ Instalar dependências npm
    echo   ✓ Criar banco de dados
    echo   ✓ Criar atalhos no Desktop e Menu Iniciar
    echo.
) else (
    echo ❌ Erro ao compilar! Verifique se o NSIS está instalado corretamente.
)
echo.
pause
