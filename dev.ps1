param(
    [string]$BackendDir = "$PSScriptRoot\\backend",
    [string]$FrontendDir = "$PSScriptRoot\\frontend",
    [switch]$NoNewWindow
)

# ============================================
# KILL EXISTING PROCESSES
# ============================================
Write-Host "Stopping existing processes..." -ForegroundColor Yellow

# Kill uvicorn (backend) processes
Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*uvicorn*" -or $_.Path -like "*Project-Jtea*"
} | ForEach-Object {
    Write-Host "  Killing Python/Uvicorn process (PID: $($_.Id))..." -ForegroundColor Red
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# Kill node (frontend) processes on port 3000
$nodePorts = netstat -ano | Select-String ":3000" | ForEach-Object {
    $line = $_ -replace '\s+', ' '
    $parts = $line -split ' '
    $parts[-1]
} | Select-Object -Unique

foreach ($processId in $nodePorts) {
    if ($processId -and $processId -ne "0") {
        try {
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "  Killing Node process on port 3000 (PID: $processId)..." -ForegroundColor Red
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }
        catch {
            # Process already terminated
        }
    }
}

# Wait for processes to terminate
Start-Sleep -Seconds 2

Write-Host "All existing processes stopped." -ForegroundColor Green
Write-Host ""

# ============================================
# START NEW PROCESSES
# ============================================

$backendCmd = @"
cd `"$BackendDir`"
if (Test-Path .\\venv\\Scripts\\python.exe) {
    .\\venv\\Scripts\\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
} else {
    if (Test-Path .\\.venv\\Scripts\\python.exe) {
        .\\.venv\\Scripts\\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
    } else {
        Write-Error "Virtual environment not found in venv or .venv"
        exit 1
    }
}
"@

$frontendCmd = @"
cd `"$FrontendDir`"
npm run dev
"@


if ($NoNewWindow) {
    Write-Host "Starting backend in background job..." -ForegroundColor Cyan
    Start-Job -ScriptBlock { 
        param($backendPath)
        $env:PYTHONIOENCODING = "utf-8"
        Set-Location $backendPath
        if (Test-Path .\\venv\\Scripts\\python.exe) {
            .\\venv\\Scripts\\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
        }
        elseif (Test-Path .\\.venv\\Scripts\\python.exe) {
            .\\.venv\\Scripts\\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
        }
        else {
            Write-Error "Virtual environment not found in venv or .venv"
            exit 1
        }
    } -ArgumentList $BackendDir | Out-Null
    Write-Host "Starting frontend in current window..." -ForegroundColor Cyan
    Invoke-Expression $frontendCmd
}
else {
    Write-Host "Starting backend..." -ForegroundColor Cyan
    Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", $backendCmd
    
    Write-Host "Starting frontend..." -ForegroundColor Cyan
    Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", $frontendCmd
    
    Write-Host ""
    Write-Host "Development servers started!" -ForegroundColor Green
    Write-Host "  Backend:  http://127.0.0.1:8000" -ForegroundColor Cyan
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
}
