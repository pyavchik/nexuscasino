# Quick Deployment Reference

## 🚀 One-Line Commands

### Create and Deploy Feature Branch

```bash
# Create feature branch
git checkout -b feature/my-feature && \
git add . && \
git commit -m "feat: Add new feature" && \
git push origin feature/my-feature

# Then create PR on GitHub or trigger Jenkins build
```

### Check Deployment Status

```bash
# On server
ssh root@70.34.253.164 "cd /opt/nexus-casino && docker compose -f docker-compose.prod.yml ps"
```

### View Logs

```bash
# Frontend logs
ssh root@70.34.253.164 "cd /opt/nexus-casino && docker compose -f docker-compose.prod.yml logs --tail=50 frontend"

# Backend logs
ssh root@70.34.253.164 "cd /opt/nexus-casino && docker compose -f docker-compose.prod.yml logs --tail=50 backend"
```

## 📋 Deployment Checklist

- [ ] Code tested locally
- [ ] Feature branch created (`feature/*`, `fix/*`, etc.)
- [ ] Changes committed and pushed
- [ ] PR created (optional)
- [ ] Jenkins build triggered
- [ ] Build successful
- [ ] Services running
- [ ] Application tested
- [ ] No console errors
- [ ] PR merged (after verification)

## 🔍 Quick Troubleshooting

### Build Fails
```bash
# Check Jenkins logs
# Verify Docker is running
docker info
```

### Deployment Fails
```bash
# Check server connectivity
ssh root@70.34.253.164 "docker info"

# Check disk space
ssh root@70.34.253.164 "df -h"
```

### Application Not Working
```bash
# Restart services
ssh root@70.34.253.164 "cd /opt/nexus-casino && docker compose -f docker-compose.prod.yml restart"

# Check container status
ssh root@70.34.253.164 "cd /opt/nexus-casino && docker compose -f docker-compose.prod.yml ps"
```

## 🎯 Branch Strategy

| Branch Type | Deploys? | Use Case |
|------------|----------|----------|
| `feature/*` | ✅ Yes | New features |
| `fix/*` | ✅ Yes | Bug fixes |
| `hotfix/*` | ✅ Yes | Critical fixes |
| `release/*` | ✅ Yes | Releases |
| `main` | ❌ No | Build only |
| `develop` | ❌ No | Build only |

## 📞 Support

- **Deployment Issues**: Check `DEPLOYMENT_GUIDE.md`
- **Jenkins Setup**: Check `JENKINS_SETUP_BEST_PRACTICES.md`
- **General Help**: Check `README.md`

