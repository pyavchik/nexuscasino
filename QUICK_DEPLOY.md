# Quick Deployment Guide

## Quick Setup for Jenkins

### 1. Add Credentials in Jenkins

**Using Password Authentication:**

1. Go to Jenkins Dashboard → Manage Jenkins → Credentials
2. Click "Add Credentials"
3. Select "Username with password"
4. Fill in:
   - **ID**: `server-ssh-password`
   - **Username**: `root`
   - **Password**: `c#G6XF6fE[#FL]?E`
5. Click "Save"

### 2. Install sshpass on Jenkins Server

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y sshpass

# CentOS/RHEL
sudo yum install -y sshpass
```

### 3. Create Jenkins Pipeline Job

1. **New Item** → Name: `nexus-casino-deploy` → **Pipeline** → OK
2. **Pipeline** section:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: Your GitHub repo URL
   - Branch: `*/main` (or your branch)
   - Script Path: `Jenkinsfile.password` (use this for password auth)
3. Click **Save**

### 4. Prepare Production Server

**Option A: Use the automated setup script (Recommended)**

SSH into `70.34.253.164` and run:

```bash
# Transfer the setup script to the server
# (From your local machine or Jenkins workspace)
scp setup-server.sh root@70.34.253.164:/tmp/

# SSH into the server
ssh root@70.34.253.164

# Run the setup script
chmod +x /tmp/setup-server.sh
/tmp/setup-server.sh
```

**Option B: Manual installation**

SSH into `70.34.253.164` and run:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose (v2 as plugin)
DOCKER_COMPOSE_VERSION="v2.24.0"
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Create deployment directory
mkdir -p /opt/nexus-casino
chmod 755 /opt/nexus-casino

# Start Docker
systemctl start docker
systemctl enable docker

# Verify installation
docker --version
docker compose version
```

### 5. Create Production Environment File

On your local machine, create `.env.production`:

```env
DB_NAME=nexus_casino
DB_USER=casino_user
DB_PASSWORD=your_secure_password_here
JWT_SECRET=your-256-bit-secret-key-change-this-in-production-minimum-32-characters
JWT_EXPIRATION=86400000
CORS_ORIGINS=http://70.34.253.164:5173,http://70.34.253.164:80
VITE_API_BASE_URL=http://70.34.253.164:8080/api
VITE_WS_URL=ws://70.34.253.164:8080/ws
```

**Important**: Don't commit this file! Add it to `.gitignore`.

### 6. Run the Pipeline

1. Go to `nexus-casino-deploy` job
2. Click **Build Now**
3. Monitor the console output

### 7. Verify Deployment

After deployment, test:

```bash
# Frontend
curl http://70.34.253.164:5173

# Backend API
curl http://70.34.253.164:8080/api/auth/me
```

## Manual Deployment (Alternative)

If Jenkins is not set up yet:

```bash
# 1. Build images locally
cd backend && docker build -t nexus-casino-backend:latest .
cd ../frontend && docker build -f Dockerfile.prod \
  --build-arg VITE_API_BASE_URL=http://70.34.253.164:8080/api \
  --build-arg VITE_WS_URL=ws://70.34.253.164:8080/ws \
  -t nexus-casino-frontend:latest .

# 2. Save images
mkdir -p docker-images
docker save nexus-casino-backend:latest -o docker-images/backend.tar
docker save nexus-casino-frontend:latest -o docker-images/frontend.tar
docker pull postgres:15-alpine
docker save postgres:15-alpine -o docker-images/postgres.tar

# 3. Transfer to server
scp docker-compose.prod.yml root@70.34.253.164:/opt/nexus-casino/
scp deploy.sh root@70.34.253.164:/opt/nexus-casino/
scp frontend/nginx.conf root@70.34.253.164:/opt/nexus-casino/
scp docker-images/*.tar root@70.34.253.164:/opt/nexus-casino/docker-images/
scp .env.production root@70.34.253.164:/opt/nexus-casino/.env

# 4. Deploy on server
ssh root@70.34.253.164
cd /opt/nexus-casino
chmod +x deploy.sh
./deploy.sh
```

## Troubleshooting

**Connection Issues:**
- Test SSH: `ssh root@70.34.253.164`
- Check firewall: `ufw status` or `iptables -L`

**Docker Issues:**
- Check Docker: `systemctl status docker`
- Check if Docker is installed: `docker --version`
- Check if Docker Compose is installed: `docker compose version` or `docker-compose --version`
- If Docker is not found, run `setup-server.sh` on the server
- Check logs: `docker compose -f docker-compose.prod.yml logs` or `docker-compose -f docker-compose.prod.yml logs`

**Port Conflicts:**
- Check ports: `netstat -tulpn | grep -E '5173|8080|5432'`
- Stop conflicting services if needed

