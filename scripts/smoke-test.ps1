<#
.SYNOPSIS
    Smoke test per Ticket Platform API.
.DESCRIPTION
    Esegue health check, login e (in base alla modalità) crea/cleanup di clienti, richieste e attività.
    Supporta reset DB SQLite e test mirati per sezione.
.PARAMETER BaseUrl
    Base URL del backend FastAPI (default: http://127.0.0.1:8000).
.PARAMETER Email
    Email per login/setup (default da SMOKE_EMAIL o admin@example.com).
.PARAMETER Password
    Password per login/setup (default da SMOKE_PASSWORD o Admin1234!).
.PARAMETER Nome
    Nome admin per setup (default da SMOKE_NOME o Admin).
.PARAMETER Cognome
    Cognome admin per setup (default da SMOKE_COGNOME o User).
.PARAMETER NomeAzienda
    Nome azienda per setup (default da SMOKE_AZIENDA o Demo Srl).
.PARAMETER SkipSetup
    Salta il setup iniziale anche se necessario.
.PARAMETER Mode
    Modalità test: full, auth, clienti, richieste, attivita.
.PARAMETER ResetDb
    Elimina il DB SQLite prima del test.
.PARAMETER SqliteDbPath
    Percorso del file SQLite da eliminare quando si usa -ResetDb.
.PARAMETER NoCleanup
    Non esegue cleanup dei record creati.
.EXAMPLE
    .\scripts\smoke-test.ps1
.EXAMPLE
    .\scripts\smoke-test.ps1 -Mode auth
.EXAMPLE
    .\scripts\smoke-test.ps1 -ResetDb
.EXAMPLE
    $env:SMOKE_EMAIL="admin@tuaazienda.com"; $env:SMOKE_PASSWORD="PasswordSicura123!"
    .\scripts\smoke-test.ps1 -SkipSetup -Mode richieste
#>
param(
    [string]$BaseUrl = "http://127.0.0.1:8000",
    [string]$Email = $env:SMOKE_EMAIL,
    [string]$Password = $env:SMOKE_PASSWORD,
    [string]$Nome = $env:SMOKE_NOME,
    [string]$Cognome = $env:SMOKE_COGNOME,
    [string]$NomeAzienda = $env:SMOKE_AZIENDA,
    [switch]$SkipSetup,
    [ValidateSet("full", "auth", "clienti", "richieste", "attivita")]
    [string]$Mode = "full",
    [switch]$ResetDb,
    [string]$SqliteDbPath = "$PSScriptRoot\\..\\backend\\ticket_platform.db",
    [switch]$NoCleanup
)

if (-not $Email) { $Email = "admin@example.com" }
if (-not $Password) { $Password = "Admin1234!" }
if (-not $Nome) { $Nome = "Admin" }
if (-not $Cognome) { $Cognome = "User" }
if (-not $NomeAzienda) { $NomeAzienda = "Demo Srl" }

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Path,
        [string]$Token,
        [string]$Body,
        [string]$ContentType = "application/json"
    )

    $headers = @{}
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }

    if ($Body) {
        return Invoke-RestMethod -Method $Method -Uri "$BaseUrl$Path" -Headers $headers -Body $Body -ContentType $ContentType
    }

    return Invoke-RestMethod -Method $Method -Uri "$BaseUrl$Path" -Headers $headers
}

try {
    if ($ResetDb) {
        Write-Host "Reset DB requested..." -ForegroundColor Yellow
        if (Test-Path $SqliteDbPath) {
            Remove-Item -Path $SqliteDbPath -Force
            Write-Host "Deleted SQLite DB at $SqliteDbPath"
        } else {
            Write-Host "SQLite DB not found at $SqliteDbPath"
        }
    }

    Write-Host "Health check..." -ForegroundColor Cyan
    $health = Invoke-RestMethod -Method Get -Uri "$BaseUrl/health"
    Write-Host "OK: $($health.status) ($($health.app))"

    if (-not $SkipSetup) {
        Write-Host "Setup status..." -ForegroundColor Cyan
        $setup = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/auth/setup-status"

        if ($setup.needs_setup -eq $true) {
            Write-Host "Running initial setup..." -ForegroundColor Yellow
            $payload = @{
                email = $Email
                password = $Password
                nome = $Nome
                cognome = $Cognome
                nome_azienda = $NomeAzienda
            } | ConvertTo-Json

            $null = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/setup" -Body $payload -ContentType "application/json"
            Write-Host "Setup completed."
        } else {
            Write-Host "Setup already completed."
        }
    }

    Write-Host "Login..." -ForegroundColor Cyan
    $token = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/login" `
        -Body @{ username = $Email; password = $Password } `
        -ContentType "application/x-www-form-urlencoded"

    if (-not $token.access_token) {
        throw "Login failed: no token returned"
    }

    Write-Host "Fetching /me..." -ForegroundColor Cyan
    $me = Invoke-Api -Method Get -Path "/api/auth/me" -Token $token.access_token

    if ($Mode -eq "auth") {
        Write-Host "Smoke test OK (auth). User: $($me.email) ($($me.ruolo))" -ForegroundColor Green
        exit 0
    }

    Write-Host "Creating cliente..." -ForegroundColor Cyan
    $suffix = [Guid]::NewGuid().ToString("N").Substring(0, 8)
    $clientePayload = @{
        ragione_sociale = "Cliente Test $suffix"
        email_principale = "cliente+$suffix@example.com"
        gestione_interna = $false
    } | ConvertTo-Json

    $cliente = Invoke-Api -Method Post -Path "/api/clienti" -Token $token.access_token -Body $clientePayload

    if ($Mode -eq "clienti") {
        if (-not $NoCleanup) {
            Write-Host "Cleaning up cliente..." -ForegroundColor DarkYellow
            Invoke-Api -Method Delete -Path "/api/clienti/$($cliente.id)" -Token $token.access_token | Out-Null
        }
        Write-Host "Smoke test OK (clienti). Cliente: $($cliente.id)" -ForegroundColor Green
        exit 0
    }

    Write-Host "Creating richiesta..." -ForegroundColor Cyan
    $richiestaPayload = @{
        cliente_id = $cliente.id
        descrizione = "Richiesta smoke test $suffix"
        priorita = "normale"
        origine = "cliente"
    } | ConvertTo-Json

    $richiesta = Invoke-Api -Method Post -Path "/api/richieste" -Token $token.access_token -Body $richiestaPayload

    if ($Mode -eq "richieste") {
        if (-not $NoCleanup) {
            Write-Host "Cleaning up richiesta..." -ForegroundColor DarkYellow
            Invoke-Api -Method Delete -Path "/api/richieste/$($richiesta.id)" -Token $token.access_token | Out-Null
            Write-Host "Cleaning up cliente..." -ForegroundColor DarkYellow
            Invoke-Api -Method Delete -Path "/api/clienti/$($cliente.id)" -Token $token.access_token | Out-Null
        }
        Write-Host "Smoke test OK (richieste). Richiesta: $($richiesta.id)" -ForegroundColor Green
        exit 0
    }

    Write-Host "Creating attivita..." -ForegroundColor Cyan
    $attivitaPayload = @{
        richiesta_id = $richiesta.id
        descrizione = "Attivita smoke test $suffix"
        priorita = "normale"
    } | ConvertTo-Json

    $attivita = Invoke-Api -Method Post -Path "/api/attivita" -Token $token.access_token -Body $attivitaPayload

    if (-not $NoCleanup) {
        Write-Host "Cleaning up attivita..." -ForegroundColor DarkYellow
        Invoke-Api -Method Delete -Path "/api/attivita/$($attivita.id)" -Token $token.access_token | Out-Null
        Write-Host "Cleaning up richiesta..." -ForegroundColor DarkYellow
        Invoke-Api -Method Delete -Path "/api/richieste/$($richiesta.id)" -Token $token.access_token | Out-Null
        Write-Host "Cleaning up cliente..." -ForegroundColor DarkYellow
        Invoke-Api -Method Delete -Path "/api/clienti/$($cliente.id)" -Token $token.access_token | Out-Null
    }

    if ($Mode -eq "attivita") {
        Write-Host "Smoke test OK (attivita). Attivita: $($attivita.id)" -ForegroundColor Green
        exit 0
    }

    Write-Host "Smoke test OK. User: $($me.email) ($($me.ruolo)); Cliente: $($cliente.id); Richiesta: $($richiesta.id); Attivita: $($attivita.id)" -ForegroundColor Green
    exit 0
}
catch {
    Write-Host "Smoke test FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Tip: se il setup è già fatto con credenziali diverse, setta SMOKE_EMAIL/SMOKE_PASSWORD o usa -SkipSetup." -ForegroundColor Yellow
    exit 1
}
