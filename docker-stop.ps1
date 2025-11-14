# Docker Stop Script
Write-Host "🛑 Stopping 2FA Attacks Lab" -ForegroundColor Cyan
Write-Host "=" * 60

$projectRoot = "A:\Information Secuirty Semester Project\2FA attacks\2FA-Cyber-Attacks-Lab"
Set-Location $projectRoot

Write-Host "`nStopping Docker services..." -ForegroundColor Yellow
docker-compose down

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Services stopped successfully!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Failed to stop services" -ForegroundColor Red
}
