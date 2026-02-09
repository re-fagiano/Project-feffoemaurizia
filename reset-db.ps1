<#
.SYNOPSIS
    Reset del database SQLite per Ticket Platform.
.DESCRIPTION
    Elimina il database SQLite per permettere un nuovo setup iniziale.
    Richiede conferma prima di procedere (usa -Confirm per saltare).
.PARAMETER Confirm
    Salta la richiesta di conferma.
.EXAMPLE
    .\reset-db.ps1
.EXAMPLE
    .\reset-db.ps1 -Confirm
#>
param([switch]$Confirm)

$dbPath = "$PSScriptRoot\backend\ticket_platform.db"

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Reset Database - Ticket Platform" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

if (-not $Confirm) {
    Write-Host "ATTENZIONE: Questa operazione eliminera' TUTTI i dati!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verranno eliminati:" -ForegroundColor Yellow
    Write-Host "  - Tutti gli utenti" -ForegroundColor Yellow
    Write-Host "  - Tutti i clienti" -ForegroundColor Yellow
    Write-Host "  - Tutte le richieste" -ForegroundColor Yellow
    Write-Host "  - Tutte le attivita'" -ForegroundColor Yellow
    Write-Host "  - Tutti i contratti" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Sei sicuro di voler continuare? Digita 'yes' per confermare"
    
    if ($response -ne "yes") {
        Write-Host ""
        Write-Host "Operazione annullata." -ForegroundColor Yellow
        Write-Host ""
        exit 0
    }
}

Write-Host ""
Write-Host "Eliminazione database in corso..." -ForegroundColor Cyan

if (Test-Path $dbPath) {
    try {
        Remove-Item -Path $dbPath -Force
        Write-Host "[OK] Database eliminato con successo!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Percorso: $dbPath" -ForegroundColor Gray
        Write-Host ""
        Write-Host "=======================================================" -ForegroundColor Cyan
        Write-Host "  Prossimi Passi" -ForegroundColor Cyan
        Write-Host "=======================================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Avvia il progetto:" -ForegroundColor White
        Write-Host "   .\dev.ps1" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Naviga su:" -ForegroundColor White
        Write-Host "   http://localhost:3000" -ForegroundColor Gray
        Write-Host ""
        Write-Host "3. Compila il form di setup iniziale" -ForegroundColor White
        Write-Host ""
        Write-Host "Il sistema richiedera' la creazione del primo utente amministratore." -ForegroundColor Cyan
        Write-Host ""
    }
    catch {
        Write-Host "[ERRORE] Errore durante l'eliminazione del database:" -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Suggerimento: Assicurati che il backend non sia in esecuzione." -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
}
else {
    Write-Host "[OK] Database non trovato (gia' eliminato o mai creato)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Percorso cercato: $dbPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Al prossimo avvio, il sistema richiedera' il setup iniziale." -ForegroundColor Cyan
    Write-Host ""
}
