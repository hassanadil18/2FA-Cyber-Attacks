# Docker Start Script - Quick start without rebuild
Write-Host "🚀 Starting 2FA Attacks Lab" -ForegroundColor Cyan
Write-Host "=" * 60

$projectRoot = "A:\Information Secuirty Semester Project\2FA attacks\2FA-Cyber-Attacks-Lab"
Set-Location $projectRoot

Write-Host "`nStarting Docker services..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Services started successfully!" -ForegroundColor Green
    Write-Host "`n📊 Service Status:" -ForegroundColor Cyan
    docker-compose ps
    
    Write-Host "`n🌐 Access URLs:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "   Backend: http://localhost:5000" -ForegroundColor White
} else {
    Write-Host "`n❌ Failed to start services" -ForegroundColor Red
}
