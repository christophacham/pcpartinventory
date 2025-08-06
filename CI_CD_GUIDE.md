# CI/CD and Versioning Guide

This document outlines the Continuous Integration and Continuous Deployment (CI/CD) setup for the PC Parts Inventory application.

## Overview

The project uses GitHub Actions for CI/CD with the following workflows:

1. **docker-publish.yml** - Builds and publishes Docker images
2. **release.yml** - Creates versioned releases with changelog generation

## Workflow Triggers

### Docker Publish Workflow

Triggers on:
- **Push to main branch** - Builds and publishes `latest` tag
- **Pull requests** - Builds images for testing (doesn't publish)
- **Git tags** (v*) - Builds and publishes versioned images

### Release Workflow

- **Manual trigger only** - Run through GitHub Actions UI
- Requires version number input (e.g., v1.2.3)
- Option to mark as pre-release

## Image Tagging Strategy

### Automatic Tags

The Docker publish workflow creates multiple tags for each image:

- `latest` - Latest build from main branch
- `main` - Same as latest, explicit branch name
- `sha-<commit>` - Specific commit SHA for exact tracking
- `v1.2.3` - Semantic version tags (on release)
- `v1.2` - Major.minor version (on release)
- `v1` - Major version (on release)

### Example Tags
```
ghcr.io/raul/pcpartinventory/backend:latest
ghcr.io/raul/pcpartinventory/backend:v1.2.3
ghcr.io/raul/pcpartinventory/backend:sha-abc1234
ghcr.io/raul/pcpartinventory/backend:main
```

## Release Process

### Creating a New Release

1. **Manual Release Creation**:
   ```bash
   # Navigate to GitHub Actions tab
   # Select "Create Release" workflow
   # Click "Run workflow"
   # Enter version (e.g., v1.2.3)
   # Select if pre-release
   # Click "Run workflow"
   ```

2. **What Happens Automatically**:
   - Validates version format
   - Checks if tag already exists
   - Generates changelog from git commits
   - Updates version in `Cargo.toml` and `package.json`
   - Creates and pushes git tag
   - Creates GitHub release with changelog
   - Triggers Docker image build with version tags

### Version Format

Use semantic versioning (SemVer):
- `v1.2.3` - Standard release
- `v1.2.3-beta` - Pre-release with identifier
- `v1.2.3-rc.1` - Release candidate

## Build Features

### Multi-Architecture Support
Images are built for both:
- `linux/amd64` (x86_64)
- `linux/arm64` (Apple Silicon, ARM servers)

### Build Optimization
- **Layer caching** - GitHub Actions cache for faster builds
- **Multi-stage builds** - Smaller final images
- **Dependency caching** - Rust and Node.js dependencies cached

### Security Scanning
- **Trivy vulnerability scanner** runs on all images
- Results uploaded to GitHub Security tab
- Scans don't block deployment but provide visibility

### Build Attestation
- **SLSA provenance** - Cryptographic proof of build integrity
- Attestations stored with images in GHCR
- Verifiable supply chain security

## Development Workflow

### Branch Strategy
```
main (protected)
├── feature/user-management
├── bugfix/login-issue
└── release/v1.2.3
```

### Recommended Workflow

1. **Feature Development**:
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git push origin feature/new-feature
   # Create PR to main
   ```

2. **Testing**: PR triggers image build for testing

3. **Merge**: Merging to main publishes `latest` images

4. **Release**: Use release workflow for versioned deployment

## Environment Management

### Development
```bash
# Use local builds
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Staging
```bash
# Use latest published images
docker-compose pull
docker-compose up -d
```

### Production
```bash
# Pin to specific version
# Update docker-compose.yml with specific tags
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Monitoring CI/CD

### GitHub Actions Monitoring

1. **Workflow Status**: Check Actions tab for build status
2. **Build Logs**: Click on workflow runs for detailed logs
3. **Image Registry**: Check Packages tab for published images

### Useful GitHub CLI Commands
```bash
# List workflow runs
gh run list

# Watch a workflow run
gh run watch

# View workflow run details
gh run view <run-id>

# List published packages
gh api /user/packages
```

## Troubleshooting

### Common CI/CD Issues

1. **Build Failures**:
   ```bash
   # Check workflow logs in Actions tab
   # Common causes: dependency issues, test failures, Docker build errors
   ```

2. **Permission Issues**:
   ```bash
   # Ensure repository has correct permissions:
   # Settings → Actions → General → Workflow permissions
   # Select "Read and write permissions"
   ```

3. **Image Pull Issues**:
   ```bash
   # Login to GHCR if pulling private images
   echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
   ```

### Manual Image Building

If needed, build images manually:

```bash
# Build backend image
docker build -f Dockerfile.backend -t pc-inventory-backend .

# Build frontend image  
docker build -f Dockerfile.frontend -t pc-inventory-frontend .
```

## Best Practices

### Version Management
- Use semantic versioning consistently
- Tag releases regularly (at least weekly for active development)
- Keep changelog updated automatically through commits

### Security
- Never commit secrets or passwords
- Use GitHub repository secrets for sensitive CI/CD variables
- Regular security scanning with Trivy
- Pin base image versions in Dockerfiles

### Performance
- Utilize build caches effectively
- Multi-stage builds for smaller images
- Parallel builds where possible

### Monitoring
- Monitor build times and optimize as needed
- Set up notifications for build failures
- Regular dependency updates

This CI/CD setup provides a robust, secure, and scalable foundation for continuous delivery of the PC Parts Inventory application.