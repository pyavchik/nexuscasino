#!/bin/bash

# Server Setup Script for Nexus Casino Deployment
# This script installs Docker and Docker Compose on the remote server
# Run this ONCE on the deployment server before first deployment

set -e

echo "========================================="
echo "Nexus Casino Server Setup"
echo "========================================="
echo ""
echo "This script will install:"
echo "  - Docker"
echo "  - Docker Compose"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 1
fi

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

echo ""
echo "Step 1: Updating package list..."
apt-get update

echo ""
echo "Step 2: Installing prerequisites..."
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

echo ""
echo "Step 3: Installing Docker..."
if command -v docker &> /dev/null; then
    echo "Docker is already installed: $(docker --version)"
else
    # Install Docker using official script
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    echo "Docker installed successfully: $(docker --version)"
fi

echo ""
echo "Step 4: Installing Docker Compose..."
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    if command -v docker-compose &> /dev/null; then
        echo "Docker Compose is already installed: $(docker-compose --version)"
    else
        echo "Docker Compose (plugin) is already installed: $(docker compose version)"
    fi
else
    # Install Docker Compose v2 (as plugin)
    DOCKER_COMPOSE_VERSION="v2.24.0"
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -SL "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" \
        -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
    
    # Verify installation
    docker compose version
    echo "Docker Compose installed successfully"
fi

echo ""
echo "Step 5: Creating deployment directory..."
mkdir -p /opt/nexus-casino
mkdir -p /opt/nexus-casino/docker-images

echo ""
echo "Step 6: Verifying installation..."
echo "Docker version:"
docker --version
echo ""
echo "Docker Compose version:"
docker compose version || docker-compose --version
echo ""
echo "Docker daemon status:"
systemctl is-active docker && echo "✓ Docker daemon is running" || echo "✗ Docker daemon is not running"

echo ""
echo "========================================="
echo "Server setup completed successfully!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Make sure Jenkins can SSH to this server"
echo "2. Run the Jenkins pipeline to deploy the application"
echo ""

