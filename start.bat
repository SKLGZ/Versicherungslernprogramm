@echo off
REM ================================================
REM Versicherungs-Lernprogramm Starter
REM ================================================

echo.
echo ========================================
echo  Versicherungs-Lernprogramm starten
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [FEHLER] Node.js ist nicht installiert!
    echo Bitte installieren Sie Node.js von https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js gefunden
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Installiere Abhaengigkeiten...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [FEHLER] Installation fehlgeschlagen!
        pause
        exit /b 1
    )
    echo.
    echo [OK] Abhaengigkeiten installiert
) else (
    echo [OK] Abhaengigkeiten bereits installiert
)

echo.
echo ========================================
echo  Server wird gestartet...
echo ========================================
echo.
echo Der Server laeuft auf:
echo   http://localhost:3000
echo.
echo Druecken Sie STRG+C zum Beenden
echo ========================================
echo.

REM Start the development server
npm run dev

pause
