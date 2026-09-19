@echo off
setlocal
cd /d "%~dp0"

echo Preparando pacote offline do Sublimix...

if not exist "backend\node_modules" (
    echo ERRO: backend\node_modules nao existe.
    echo Execute npm install uma vez neste computador com internet.
    pause
    exit /b 1
)

set "MAKENSIS="
where makensis >nul 2>&1
if not errorlevel 1 set "MAKENSIS=makensis.exe"
if not defined MAKENSIS if exist "C:\Program Files (x86)\NSIS\makensis.exe" set "MAKENSIS=C:\Program Files (x86)\NSIS\makensis.exe"
if not defined MAKENSIS (
    echo ERRO: NSIS nao foi encontrado no PATH.
    pause
    exit /b 1
)

if not exist "runtime" mkdir "runtime"
for /f "delims=" %%N in ('where node') do (
    copy /Y "%%N" "runtime\node.exe" >nul
    goto :runtime_ok
)

echo ERRO: Node.js nao foi encontrado neste computador.
pause
exit /b 1

:runtime_ok
echo Node.js local incluido no pacote.
"%MAKENSIS%" /V3 "instalador.nsi"
if errorlevel 1 (
    echo ERRO: falha ao compilar o instalador.
    pause
    exit /b 1
)

echo Instalador offline criado: Sublimix-Instalador.exe
pause