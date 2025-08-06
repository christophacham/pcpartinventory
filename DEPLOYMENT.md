# PC Parts Inventory - Deployment Guide

This guide covers the deployment setup for the PC Parts Inventory application using GitHub Container Registry (GHCR) and Docker Compose.

## Repository Settings Required

### 1. GitHub Repository Settings

Before the GitHub Actions workflow can publish to GHCR, ensure these settings are configured:

#### Package Permissions
1. Navigate to your repository on GitHub
2. Go to **Settings** → **Actions** → **General**
3. Under "Workflow permissions", select:
   - **Read and write permissions**
   - Check **Allow GitHub Actions to create and approve pull requests**

#### Package Visibility
1. Go to **Settings** → **Packages**
2. Set package visibility as needed:
   - **Public**: Anyone can pull the images (recommended for open source)
   - **Private**: Only repository collaborators can pull images

### 2. Environment Variables (Optional)

For production deployments, consider setting up environment variables:

1. Go to **Settings** → **Environments** → **New environment**
2. Create environments: `development`, `staging`, `production`
3. Add environment-specific secrets:
   - `POSTGRES_PASSWORD`
   - `DATABASE_URL`
   - Any API keys or sensitive configuration

## Image Naming Convention

The workflow publishes images with the following naming pattern:

```
ghcr.io/[owner]/[repository]/[service]:[tag]

Examples:
ghcr.io/raul/pcpartinventory/backend:latest
ghcr.io/raul/pcpartinventory/backend:v1.2.3
ghcr.io/raul/pcpartinventory/backend:sha-abc123
ghcr.io/raul/pcpartinventory/frontend:latest
```

## Deployment Options

### 1. Production Deployment

```bash
# Pull latest images and start services
docker-compose pull
docker-compose up -d

# Or use the production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 2. Development Deployment

```bash
# Use local builds for development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### 3. Specific Version Deployment

Update the image tags in `docker-compose.yml` to pin to specific versions:

```yaml
services:
  backend:
    image: ghcr.io/raul/pcpartinventory/backend:v1.2.3
  frontend:
    image: ghcr.io/raul/pcpartinventory/frontend:v1.2.3
```

## Database Migration

For production deployments, ensure database migrations run:

```bash
# If using the Rust backend with sqlx migrations
docker-compose exec backend ./pc-inventory-backend migrate
```

## Health Checks

The production configuration includes health checks for all services:

- **PostgreSQL**: `pg_isready` command
- **Redis**: `redis-cli ping`
- **Backend**: HTTP health endpoint at `/health`
- **Frontend**: HTTP health endpoint at `/api/health`

Monitor service health:

```bash
docker-compose ps
```

## Security Considerations

### 1. Image Scanning
- The workflow includes Trivy vulnerability scanning
- Security scan results appear in the GitHub Security tab
- Failed scans don't block deployment but provide visibility

### 2. Secrets Management
- Use Docker secrets for sensitive data in production
- Never commit passwords or API keys to the repository
- Use GitHub repository secrets for CI/CD

### 3. Network Security
- Services communicate through Docker internal networks
- Only necessary ports are exposed to the host
- Use reverse proxy (nginx/Traefik) for HTTPS termination

## Monitoring and Logging

### Log Access
```bash
# View logs for all services
docker-compose logs

# Follow logs for a specific service
docker-compose logs -f backend

# View logs with timestamps
docker-compose logs -t
```

### Resource Monitoring
```bash
# View resource usage
docker stats

# View detailed service information
docker-compose ps
docker inspect <container_name>
```

## Backup Strategy

### Database Backup
```bash
# Create database backup
docker-compose exec postgres pg_dump -U postgres pc_inventory > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker-compose exec -T postgres psql -U postgres pc_inventory < backup_file.sql
```

### Volume Backup
```bash
# Backup postgres data volume
docker run --rm -v pcpartinventory_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Restore postgres data volume
docker run --rm -v pcpartinventory_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /data
```

## Troubleshooting

### Common Issues

1. **Image Pull Failures**
   ```bash
   # Login to GHCR if pulling private images
   echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
   ```

2. **Database Connection Issues**
   ```bash
   # Check database logs
   docker-compose logs postgres
   
   # Verify database is ready
   docker-compose exec postgres pg_isready -U postgres
   ```

3. **Port Conflicts**
   ```bash
   # Change exposed ports in docker-compose.yml if needed
   # Default ports: 3001 (frontend), 8081 (backend), 5433 (postgres)
   ```

### Performance Optimization

1. **Resource Limits** - Add resource constraints in production:
   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             memory: 512M
             cpus: '0.5'
   ```

2. **Multi-stage Builds** - Images use multi-stage builds for smaller sizes
3. **Layer Caching** - GitHub Actions uses build cache for faster builds

## Updating Deployment

### Rolling Updates
```bash
# Pull new images
docker-compose pull

# Recreate services with new images
docker-compose up -d

# Remove old images
docker image prune -f
```

### Zero-Downtime Deployment
For production environments, consider:
- Using Docker Swarm or Kubernetes
- Implementing blue-green deployments
- Load balancers for traffic management

This deployment setup provides a robust foundation for both development and production environments while maintaining security and observability best practices.