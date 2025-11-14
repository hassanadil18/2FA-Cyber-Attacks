# Docker Build Script for 2FA Attacks Lab
Write-Host "🐳 Building 2FA Attacks Lab with Docker" -ForegroundColor Cyan
Write-Host "=" * 60

# Check if Docker is running
Write-Host "`n📋 Step 1: Checking Docker status..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Navigate to project root
$projectRoot = "A:\Information Secuirty Semester Project\2FA attacks\2FA-Cyber-Attacks-Lab"
Set-Location $projectRoot

Write-Host "`n📋 Step 2: Building Docker images..." -ForegroundColor Yellow
Write-Host "This may take 5-10 minutes on first build..." -ForegroundColor Gray

docker-compose build --no-cache

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker images built successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to build Docker images" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Step 3: Starting services..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Services started successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Step 4: Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

docker-compose ps

Write-Host "`n" + ("=" * 60)
Write-Host "🎉 DOCKER SETUP COMPLETE!" -ForegroundColor Green
Write-Host ("=" * 60)
Write-Host "`n📊 Access Your Application:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "`n📝 Useful Commands:" -ForegroundColor Cyan
Write-Host "   View logs: docker-compose logs -f" -ForegroundColor White
Write-Host "   Stop services: docker-compose down" -ForegroundColor White
Write-Host "   View evidence: docker-compose exec backend node show-evidence.js" -ForegroundColor White
Write-Host "`n💡 Read DOCKER-GUIDE.md for detailed instructions`n" -ForegroundColor Yellow
