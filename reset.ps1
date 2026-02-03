# ============================================
# PROJECT RESET SCRIPT
# ============================================
# Riporta il progetto allo stato iniziale pulito

param(
    [switch]$SkipConfirm
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PROJECT RESET - Stato Iniziale" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Conferma
if (-not $SkipConfirm) {
    Write-Host "ATTENZIONE: Eliminera database e cache!" -ForegroundColor Yellow
    $response = Read-Host "Continuare? (s/N)"
    if ($response -ne "s") {
        Write-Host "Annullato." -ForegroundColor Red
        exit 0
    }
}

# STEP 1: Termina processi
Write-Host ""
Write-Host "STEP 1: Terminazione processi..." -ForegroundColor Cyan

# 1. Kill Python/Uvicorn con TaskKill
Write-Host "  Killing python.exe..." -ForegroundColor DarkGray
taskkill /F /IM python.exe /T 2>$null
Write-Host "  [OK] Python terminato" -ForegroundColor Green

# 2. Kill Node
$netstat = netstat -ano | Select-String ":3000"
foreach ($line in $netstat) {
    if ($line -match '\s+(\d+)$') {
        $pidStr = $matches[1]
        if ($pidStr -ne '0') {
            Write-Host "  Killing Node (PID: $pidStr)..." -ForegroundColor DarkGray
            taskkill /F /PID $pidStr /T 2>$null
        }
    }
}

Write-Host "  [OK] Processi terminati" -ForegroundColor Green
Start-Sleep -Seconds 2

# STEP 2: Elimina database
Write-Host ""
Write-Host "STEP 2: Pulizia database..." -ForegroundColor Cyan
$backendPath = Join-Path $PSScriptRoot "backend"
$dbFiles = @("ticket_platform.db", "ticket_platform.db-shm", "ticket_platform.db-wal", "app.db", "app.db-shm", "app.db-wal")

foreach ($file in $dbFiles) {
    $fullPath = Join-Path $backendPath $file
    if (Test-Path $fullPath) {
        $retries = 3
        while ($retries -gt 0) {
            try {
                Remove-Item $fullPath -Force -ErrorAction Stop
                Write-Host "  Eliminato: $file" -ForegroundColor Gray
                break
            }
            catch {
                $retries--
                if ($retries -eq 0) {
                    Write-Host "  ERRORE: Impossibile eliminare $file" -ForegroundColor Red
                }
                else {
                    Write-Host "  File in uso, riprovo..." -ForegroundColor Yellow
                    Start-Sleep -Seconds 2
                }
            }
        }
    }
}
Write-Host "  [OK] Database eliminato" -ForegroundColor Green

# STEP 3: Ricrea database
Write-Host ""
Write-Host "STEP 3: Ricreazione database..." -ForegroundColor Cyan
Set-Location $backendPath

# Cerca python
$pythonCmd = "python"
if (Test-Path ".\venv\Scripts\python.exe") {
    $pythonCmd = ".\venv\Scripts\python.exe"
}

Write-Host "  Esecuzione recreate_db.py con $pythonCmd..." -ForegroundColor DarkGray
$proc = Start-Process -FilePath $pythonCmd -ArgumentList "recreate_db.py" -Wait -NoNewWindow -PassThru

if ($proc.ExitCode -ne 0) {
    Write-Host "  ERRORE CRITICO: lo script recreate_db.py ha fallito." -ForegroundColor Red
    exit 1
}

# STEP 4: Pulisci cache
Write-Host ""
Write-Host "STEP 4: Pulizia cache..." -ForegroundColor Cyan
$frontendPath = Join-Path $PSScriptRoot "frontend"
Remove-Item (Join-Path $frontendPath ".next") -Recurse -Force -ErrorAction SilentlyContinue 2>$null
Get-ChildItem -Path $backendPath -Recurse -Directory -Filter "__pycache__" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue 2>$null
Write-Host "  [OK] Cache pulita" -ForegroundColor Green

# DONE
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  RESET COMPLETATO CON SUCCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ora puoi avviare il progetto:" -ForegroundColor White
Write-Host "  .\dev.ps1" -ForegroundColor Cyan
Write-Host ""
