@echo off
echo Iniciando servidor WebSocket con Soketi...
echo Ubicacion actual: %CD%
echo Archivo de configuracion: %CD%\soketi-config.json

:: Matar cualquier instancia anterior de Soketi
taskkill /F /IM node.exe /T >nul 2>&1

:: Comprobar si Soketi está instalado
where soketi >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Soketi no esta instalado. Instalando...
    npm install -g @soketi/soketi
    if %ERRORLEVEL% NEQ 0 (
        echo Error al instalar Soketi. Por favor, instalalo manualmente.
        exit /b 1
    )
)

:: Iniciar Soketi con la configuración
soketi start --config=soketi-config.json
