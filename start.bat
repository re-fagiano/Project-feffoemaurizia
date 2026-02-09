@echo off
echo ========================================
echo Avvio Backend e Frontend
echo ========================================
echo.

REM Avvia Backend
echo [1/2] Avvio Backend su http://localhost:8000...
start "Backend Server" cmd /k "cd backend && .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

REM Attendi 3 secondi
timeout /t 3 /nobreak >nul

REM Avvia Frontend
echo [2/2] Avvio Frontend su http://localhost:3001...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Server avviati!
echo ========================================
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3001
echo API Docs: http://localhost:8000/docs
echo ========================================
echo.
echo Premi un tasto per chiudere questa finestra...
pause >nul
