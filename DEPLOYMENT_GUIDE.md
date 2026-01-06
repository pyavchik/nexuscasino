# Deployment Guide - Best Practices

## 🎯 Overview

This project uses a **feature branch deployment strategy** with Jenkins CI/CD. All deployments go through Pull Requests and feature branches for safety and traceability.

## 📋 Deployment Workflow

### Standard Deployment Process

1. **Create Feature Branch**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   # or: fix/bug-description, hotfix/critical-fix, release/v1.0.0
   ```

2. **Make Changes and Commit**
   ```bash
   git add .
   git commit -m "feat: Add new feature"
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request**
   - Go to: https://github.com/pyavchik/nexuscasino/pulls
   - Click "New Pull Request"
   - Select your feature branch → `main`
   - Add description and reviewers (if applicable)
   - Create PR

4. **Jenkins Auto-Build (if webhooks configured)**
   - Jenkins automatically detects the PR
   - Builds Docker images with correct HTTPS URLs
   - Deploys to production server

5. **Manual Jenkins Build (if needed)**
   - Go to Jenkins dashboard
   - Select your pipeline job
   - Click "Build with Parameters"
   - Select branch: `feature/your-feature-name`
   - Click "Build"

6. **Verify Deployment**
   - Check Jenkins build logs
   - Verify services are running: `https://pyavchik.space`
   - Test the new feature
   - Check browser console for errors

7. **Merge PR (after verification)**
   - If deployment is successful
   - Merge PR to `main`
   - Delete feature branch

## 🔧 Branch Naming Conventions

Use these prefixes for automatic deployment:

- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Critical production fixes
- `release/*` - Release candidates

**Examples:**
- ✅ `feature/add-user-profile`
- ✅ `fix/password-reset-error`
- ✅ `hotfix/security-patch`
- ✅ `release/v1.2.0`

**Branches that DON'T deploy:**
- ❌ `main` / `master` - Build only, no deployment
- ❌ `develop` - Build only, no deployment
- ❌ Any branch not matching the patterns above

## 🚀 Jenkins Configuration

### Current Setup

- **Pipeline**: `Jenkinsfile.password`
- **Server**: `pyavchik.space` (70.34.253.164)
- **Deploy Path**: `/opt/nexus-casino`
- **Build Args**: 
  - `VITE_API_BASE_URL=https://pyavchik.space/api`
  - `VITE_WS_URL=wss://pyavchik.space/ws`

### Jenkins Job Setup

1. **Create Pipeline Job**
   - New Item → Pipeline
   - Name: `nexus-casino-deploy`
   - Pipeline → Definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: `https://github.com/pyavchik/nexuscasino.git`
   - Branch Specifier: `*/feature/*` (or `**` for all branches)
   - Script Path: `Jenkinsfile.password`

2. **Configure Credentials**
   - Add SSH credentials: `server-ssh-password`
   - Username: `root`
   - Password: (your server password)

3. **Enable GitHub Webhooks (Optional)**
   - GitHub → Settings → Webhooks
   - Add webhook: `http://your-jenkins-url/github-webhook/`
   - Events: Push, Pull Request

## 📦 What Gets Deployed

### Docker Images Built
- `nexus-casino-backend:latest` - Spring Boot API
- `nexus-casino-frontend:latest` - React frontend (Nginx)
- `postgres:15-alpine` - Database

### Files Transferred
- `docker-compose.prod.yml` - Production compose file
- `deploy.sh` - Deployment script
- `frontend/nginx.conf` - Nginx configuration
- Docker image tar files

### Services Started
- PostgreSQL (port 5432, localhost only)
- Backend API (internal, via Nginx)
- Frontend Nginx (ports 80, 443)

## ✅ Pre-Deployment Checklist

Before deploying, ensure:

- [ ] Code is tested locally
- [ ] All tests pass (if applicable)
- [ ] Environment variables are correct
- [ ] HTTPS URLs are used (not HTTP)
- [ ] Database migrations are ready (if any)
- [ ] No sensitive data in commits
- [ ] Branch follows naming convention

## 🔍 Post-Deployment Verification

After deployment:

1. **Check Jenkins Build Status**
   - ✅ Build successful
   - ✅ All stages passed
   - ✅ Deployment completed

2. **Verify Services**
   ```bash
   # On server
   docker compose -f docker-compose.prod.yml ps
   docker compose -f docker-compose.prod.yml logs --tail=50 frontend
   docker compose -f docker-compose.prod.yml logs --tail=50 backend
   ```

3. **Test Application**
   - Visit: `https://pyavchik.space`
   - Test login/registration
   - Test password recovery
   - Test game functionality
   - Check browser console (F12) for errors

4. **Monitor Logs**
   ```bash
   # Real-time logs
   docker compose -f docker-compose.prod.yml logs -f
   ```

## 🚨 Rollback Procedure

If deployment fails or issues occur:

### Quick Rollback

```bash
# SSH into server
ssh root@70.34.253.164

# Stop services
cd /opt/nexus-casino
docker compose -f docker-compose.prod.yml down

# Load previous images (if saved)
docker load -i docker-images/backend-backup.tar
docker load -i docker-images/frontend-backup.tar

# Start services
docker compose -f docker-compose.prod.yml up -d
```

### Full Rollback

1. Revert the PR on GitHub
2. Create new feature branch from previous working commit
3. Deploy the rollback branch

## 🔐 Security Best Practices

1. **Never commit secrets**
   - Use environment variables
   - Use Jenkins credentials
   - Use `.env` files (gitignored)

2. **HTTPS Only**
   - All API calls use HTTPS
   - WebSocket uses WSS
   - No HTTP endpoints exposed

3. **Branch Protection**
   - No direct pushes to `main`
   - All changes via PR
   - Code review recommended

4. **Regular Updates**
   - Update dependencies regularly
   - Security patches applied promptly
   - Monitor for vulnerabilities

## 📊 Monitoring

### Health Checks

- Frontend: `https://pyavchik.space/health`
- Backend: `https://pyavchik.space/api/auth/me` (requires auth)

### Log Monitoring

```bash
# On server
tail -f /var/lib/docker/containers/*/*-json.log
# Or use Docker logs
docker compose -f docker-compose.prod.yml logs -f
```

## 🐛 Troubleshooting

### Build Fails

1. Check Jenkins logs
2. Verify Docker is running
3. Check disk space
4. Verify credentials

### Deployment Fails

1. Check SSH connection
2. Verify server has Docker/Docker Compose
3. Check server disk space
4. Review server logs

### Application Errors

1. Check browser console (F12)
2. Check backend logs
3. Check database connectivity
4. Verify environment variables

## 📚 Additional Resources

- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Git Branching Strategy](https://www.atlassian.com/git/tutorials/comparing-workflows)

## 💡 Tips

1. **Always test locally first** - Use `docker-compose.yml` for local testing
2. **Use descriptive commit messages** - Follow conventional commits
3. **Keep branches small** - One feature per branch
4. **Monitor deployments** - Watch logs during deployment
5. **Document breaking changes** - Update README if needed

---

**Last Updated**: 2026-01-06
**Maintainer**: Development Team

