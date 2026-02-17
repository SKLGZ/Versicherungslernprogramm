@echo off
REM Versicherungslernprogramm - Startskript für Windows
REM Dieses Skript startet die Entwicklungsumgebung

echo ========================================
echo Versicherungs-Profi Lernprogramm
echo ========================================
echo.

REM Prüfe ob Node.js installiert ist
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo FEHLER: Node.js ist nicht installiert!
    echo Bitte installieren Sie Node.js von https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js gefunden: 
node --version
echo.

REM Prüfe ob node_modules existiert
if not exist "node_modules\" (
    echo Installiere Abhängigkeiten...
    echo Dies kann beim ersten Start einige Minuten dauern.
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo FEHLER: Installation fehlgeschlagen!
        pause
        exit /b 1
    )
    echo.
    echo Installation erfolgreich!
    echo.
)

echo Starte Entwicklungsserver...
echo Die Anwendung wird unter http://localhost:3000 geöffnet
echo.
echo Drücken Sie Strg+C um den Server zu beenden
echo.

call npm run dev
