# Deployment Fix: Docker Not Found Error

## Problem

The Jenkins pipeline was failing with:
```
./deploy.sh: line 19: docker: command not found
```

This indicates that Docker is not installed on the remote deployment server (`70.34.253.164`).

## Solution

### Step 1: Install Docker on the Remote Server

You need to install Docker and Docker Compose on the remote server **before** running the Jenkins pipeline.

**Option A: Use the automated setup script (Recommended)**

1. Transfer the setup script to the server:
```bash
scp setup-server.sh root@70.34.253.164:/tmp/
```

2. SSH into the server:
```bash
ssh root@70.34.253.164
```

3. Run the setup script:
```bash
chmod +x /tmp/setup-server.sh
/tmp/setup-server.sh
```

**Option B: Manual installation**

SSH into the server and run:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose v2
DOCKER_COMPOSE_VERSION="v2.24.0"
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Verify installation
docker --version
docker compose version
```

### Step 2: Verify Installation

After installation, verify Docker is working:
```bash
docker --version
docker compose version
docker info
```

### Step 3: Run Jenkins Pipeline Again

Once Docker is installed on the server, run the Jenkins pipeline again. The deployment should now succeed.

## What Was Fixed

1. **Updated `deploy.sh`**:
   - Added checks for Docker installation
   - Added checks for Docker Compose installation
   - Added check for Docker daemon status
   - Provides helpful error messages if Docker is missing
   - Supports both Docker Compose v1 (`docker-compose`) and v2 (`docker compose`)

2. **Created `setup-server.sh`**:
   - Automated script to install Docker and Docker Compose
   - Can be run once on the server before first deployment
   - Includes verification steps

3. **Updated `QUICK_DEPLOY.md`**:
   - Added instructions for using the setup script
   - Updated troubleshooting section

## Important Notes

- The setup script (`setup-server.sh`) should be run **once** on the server before the first deployment
- The setup script requires root/sudo access
- After running the setup script, you can run the Jenkins pipeline normally
- The `deploy.sh` script will now provide clear error messages if Docker is missing

## Next Steps

1. ✅ Install Docker on the remote server using one of the methods above
2. ✅ Verify Docker is working
3. ✅ Run the Jenkins pipeline again
4. ✅ Monitor the deployment logs

## Troubleshooting

If you still get errors:

1. **Check Docker is installed**: `docker --version`
2. **Check Docker daemon is running**: `systemctl status docker`
3. **Check Docker Compose**: `docker compose version` or `docker-compose --version`
4. **Check permissions**: Make sure the user running the script can access Docker (may need to add user to `docker` group)

