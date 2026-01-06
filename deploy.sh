#!/bin/bash

set -e

echo "========================================="
echo "Nexus Casino Deployment Script"
echo "========================================="

DEPLOY_PATH="/opt/nexus-casino"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed on this server."
    echo ""
    echo "Please install Docker first by running:"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sh get-docker.sh"
    echo ""
    echo "Or run the setup script: setup-server.sh"
    exit 1
fi

# Check if Docker Compose is installed (v1 or v2)
DOCKER_COMPOSE_CMD=""
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "ERROR: Docker Compose is not installed on this server."
    echo ""
    echo "Please install Docker Compose first."
    echo "Or run the setup script: setup-server.sh"
    exit 1
fi

echo "Using Docker Compose: $DOCKER_COMPOSE_CMD"

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "ERROR: Docker daemon is not running."
    echo ""
    echo "Please start Docker:"
    echo "  sudo systemctl start docker"
    echo "  sudo systemctl enable docker"
    exit 1
fi

cd "$DEPLOY_PATH"

echo "Step 1: Loading Docker images..."
if [ -d "docker-images" ]; then
    for image in docker-images/*.tar; do
        if [ -f "$image" ]; then
            echo "Loading $(basename $image)..."
            docker load -i "$image"
        fi
    done
    echo "Docker images loaded successfully"
else
    echo "Warning: docker-images directory not found. Images may need to be pulled."
    echo "Pulling images from registry..."
    docker pull postgres:15-alpine || true
fi

echo "Step 1.5: Ensuring nginx.conf is in place..."
if [ ! -f "nginx.conf" ]; then
    echo "Warning: nginx.conf not found. Frontend may not work correctly."
fi

echo "Step 2: Stopping existing containers..."
$DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" down || true

echo "Step 3: Removing old images (optional cleanup)..."
# Uncomment if you want to remove old images
# docker image prune -f

echo "Step 4: Starting services..."
$DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" up -d

echo "Step 5: Waiting for services to be healthy..."
sleep 10

echo "Step 6: Checking service status..."
$DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" ps

echo "Step 7: Checking logs..."
echo "--- Backend logs (last 20 lines) ---"
$DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" logs --tail=20 backend || true

echo "--- Frontend logs (last 20 lines) ---"
$DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" logs --tail=20 frontend || true

echo "========================================="
echo "Deployment completed!"
echo "========================================="
echo "Services should be available at:"
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "  - Frontend: http://${SERVER_IP}:5173"
echo "  - Backend API: http://${SERVER_IP}:8080/api"
echo "========================================="

