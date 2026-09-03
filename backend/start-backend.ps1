# ============================================================
# start-backend.ps1 - Script de demarrage Retenza
# Lance automatiquement adb reverse + le serveur backend
# UTILISATION : Clic droit -> "Executer avec PowerShell"
#               OU depuis terminal : .\start-backend.ps1
# ============================================================

Write-Host ""
Write-Host "  RETENZA CONNECT - Demarrage Backend" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Etape 1 : Tunnel USB via adb reverse
Write-Host "[1/2] Configuration tunnel USB (adb reverse)..." -ForegroundColor Yellow
try {
    $adbResult = & adb reverse tcp:3000 tcp:3000 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      OK - Tunnel USB actif (127.0.0.1:3000)" -ForegroundColor Green
    } else {
        Write-Host "      ATTENTION: Telephone non detecte - verifie le cable USB" -ForegroundColor Red
        Write-Host "      (Le backend demarre quand meme - reconnecte le telephone avant flutter run)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "      ATTENTION: adb non trouve dans le PATH" -ForegroundColor Red
}

Write-Host ""

# Etape 2 : Demarrage du backend Node.js
Write-Host "[2/2] Demarrage du serveur backend..." -ForegroundColor Yellow
Write-Host "      URL locale: http://localhost:3000" -ForegroundColor Green
Write-Host "      Pour stopper le serveur : CTRL+C" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "$PSScriptRoot"
npm run dev
