# 🐳 Docker Setup for 2FA Attacks Lab

## Prerequisites
- Docker Desktop installed and running
- Docker Compose included with Docker Desktop

## Quick Start

### 1. Production Build (Recommended for Presentation)
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### 2. Development Build (Hot Reload)
```bash
# Build and start dev services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

## Docker Commands Reference

### Build Services
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Build without cache (fresh build)
docker-compose build --no-cache
```

### Start/Stop Services
```bash
# Start services in background
docker-compose up -d

# Start services with logs visible
docker-compose up

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 -f
```

### Execute Commands in Containers
```bash
# Backend container shell
docker-compose exec backend sh

# Run evidence script
docker-compose exec backend node show-evidence.js

# Run single attack
docker-compose exec backend node single-attack.js 1

# Clean database
docker-compose exec backend node clean-database.js
```

### Check Status
```bash
# View running containers
docker-compose ps

# View container stats (CPU, memory)
docker stats

# Check health status
docker-compose ps
```

### Rebuild Services
```bash
# Rebuild and restart
docker-compose up -d --build

# Force recreate containers
docker-compose up -d --force-recreate
```

## Service Architecture

```
┌─────────────────────────────────────────┐
│          Docker Network                 │
│      (2fa-attacks-network)              │
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │    │   Backend    │  │
│  │   (Nginx)    │───▶│   (Node.js)  │  │
│  │   Port 3000  │    │   Port 5000  │  │
│  └──────────────┘    └──────────────┘  │
│                             │           │
│                             ▼           │
│                      ┌──────────────┐  │
│                      │   SQLite DB  │  │
│                      │  (Volume)    │  │
│                      └──────────────┘  │
└─────────────────────────────────────────┘
```

## Features

### Backend Container
- Node.js 20 Alpine (lightweight)
- Express API on port 5000
- SQLite database with persistent volume
- Health checks every 30 seconds
- Auto-restart on failure
- Production-optimized dependencies

### Frontend Container
- Multi-stage build (smaller image)
- Nginx serving React build
- API proxy to backend
- Gzip compression
- Security headers
- Health checks
- React Router support

### Networking
- Isolated bridge network
- Services communicate by name
- Backend not exposed except through frontend proxy

## Volume Management

### Persistent Data
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect 2fa-backend-logs

# Backup database
docker-compose exec backend cp /app/data/attacks.db /app/data/attacks.db.backup

# Remove all volumes (CAUTION: deletes data)
docker-compose down -v
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Port Already in Use
```bash
# Change ports in docker-compose.yml
# Backend: "5001:5000" instead of "5000:5000"
# Frontend: "3001:3000" instead of "3000:3000"
```

### Database Issues
```bash
# Reset database
docker-compose exec backend node clean-database.js

# Check database exists
docker-compose exec backend ls -la /app/data/
```

### Health Check Failing
```bash
# Check service health
docker-compose ps

# Manual health check
docker-compose exec backend wget -O- http://localhost:5000/api/health
```

### Remove Everything
```bash
# Stop and remove all containers, networks, volumes
docker-compose down -v

# Remove unused Docker resources
docker system prune -a
```

## Environment Variables

Edit `docker-compose.yml` to customize:

```yaml
environment:
  - NODE_ENV=production
  - PORT=5000
  - JWT_SECRET=your-secret-here  # Change this!
  - DATABASE_PATH=/app/data/attacks.db
```

## Performance Optimization

### Image Sizes
```bash
# Check image sizes
docker images | grep 2fa-attacks

# Typical sizes:
# Backend: ~200MB (Alpine-based)
# Frontend: ~50MB (Nginx + build)
```

### Build Time
```bash
# Use BuildKit for faster builds
DOCKER_BUILDKIT=1 docker-compose build
```

## Security Notes

⚠️ **Important for Production:**
1. Change `JWT_SECRET` in docker-compose.yml
2. Use environment files (.env) instead of hardcoded values
3. Enable HTTPS with reverse proxy (Traefik/Nginx)
4. Restrict network access
5. Regular security updates: `docker-compose pull`

## Presentation Setup

### Before Class:
```bash
# 1. Build images (5-10 minutes)
docker-compose build

# 2. Start services
docker-compose up -d

# 3. Verify both running
docker-compose ps

# 4. Check frontend accessible
# Open: http://localhost:3000

# 5. Add test data
docker-compose exec backend node single-attack.js 1
docker-compose exec backend node single-attack.js 2
docker-compose exec backend node single-attack.js 3

# 6. Verify evidence
docker-compose exec backend node show-evidence.js
```

### During Presentation:
```bash
# Show running containers
docker-compose ps

# Show logs live
docker-compose logs -f

# Execute attacks from browser
# http://localhost:3000

# Show evidence
docker-compose exec backend node show-evidence.js
```

### After Presentation:
```bash
# Stop services
docker-compose down

# Keep data for next time, or remove:
docker-compose down -v
```

## CI/CD Integration

### Build for Registry
```bash
# Tag images
docker tag 2fa-attacks-backend:latest your-registry/2fa-backend:latest
docker tag 2fa-attacks-frontend:latest your-registry/2fa-frontend:latest

# Push to registry
docker push your-registry/2fa-backend:latest
docker push your-registry/2fa-frontend:latest
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

## Support

Issues with Docker setup?
1. Check logs: `docker-compose logs -f`
2. Verify Docker running: `docker ps`
3. Check ports available: `netstat -ano | findstr ":3000"`
4. Rebuild: `docker-compose up -d --build`
