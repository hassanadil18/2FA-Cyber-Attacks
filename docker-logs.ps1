# Docker Logs Viewer
Write-Host "📋 2FA Attacks Lab - Live Logs" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host "Press Ctrl+C to exit`n" -ForegroundColor Yellow

$projectRoot = "A:\Information Secuirty Semester Project\2FA attacks\2FA-Cyber-Attacks-Lab"
Set-Location $projectRoot

docker-compose logs -f
