#!/bin/bash

set -e

echo "========================================="
echo "Nexus Casino Deployment Script"
echo "========================================="

DEPLOY_PATH="/opt/nexus-casino"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"

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
docker-compose -f "$DOCKER_COMPOSE_FILE" down || true

echo "Step 3: Removing old images (optional cleanup)..."
# Uncomment if you want to remove old images
# docker image prune -f

echo "Step 4: Starting services..."
docker-compose -f "$DOCKER_COMPOSE_FILE" up -d

echo "Step 5: Waiting for services to be healthy..."
sleep 10

echo "Step 6: Checking service status..."
docker-compose -f "$DOCKER_COMPOSE_FILE" ps

echo "Step 7: Checking logs..."
echo "--- Backend logs (last 20 lines) ---"
docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=20 backend || true

echo "--- Frontend logs (last 20 lines) ---"
docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=20 frontend || true

echo "========================================="
echo "Deployment completed!"
echo "========================================="
echo "Services should be available at:"
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "  - Frontend: http://${SERVER_IP}:5173"
echo "  - Backend API: http://${SERVER_IP}:8080/api"
echo "========================================="

