pipeline {
    agent any
    
    environment {
        // Server configuration - use Jenkins credentials
        SERVER_HOST = '70.34.253.164'
        SERVER_USER = 'root'
        // Password should be stored in Jenkins credentials as 'server-ssh-password'
        DEPLOY_PATH = '/opt/nexus-casino'
        DOCKER_COMPOSE_FILE = 'docker-compose.prod.yml'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo 'Code checked out successfully'
            }
        }
        
        stage('Build Docker Images') {
            steps {
                script {
                    echo 'Building Docker images...'
                    sh '''
                        # Build backend
                        cd backend
                        docker build -t nexus-casino-backend:latest .
                        cd ..
                        
                        # Build frontend with production Dockerfile
                        cd frontend
                        docker build -f Dockerfile.prod \
                            --build-arg VITE_API_BASE_URL=http://${SERVER_HOST}:8080/api \
                            --build-arg VITE_WS_URL=ws://${SERVER_HOST}:8080/ws \
                            -t nexus-casino-frontend:latest .
                        cd ..
                    '''
                }
            }
        }
        
        stage('Save Docker Images') {
            steps {
                script {
                    echo 'Saving Docker images to tar files...'
                    sh '''
                        mkdir -p docker-images
                        docker save nexus-casino-backend:latest -o docker-images/backend.tar || true
                        docker save nexus-casino-frontend:latest -o docker-images/frontend.tar || true
                        docker save postgres:15-alpine -o docker-images/postgres.tar || true
                    '''
                }
            }
        }
        
        stage('Transfer Files to Server') {
            steps {
                script {
                    echo 'Transferring files to deployment server...'
                    withCredentials([sshUserPrivateKey(
                        credentialsId: 'server-ssh-key',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )]) {
                        sh '''
                            # Create deployment directory on server
                            ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER_HOST} \
                                "mkdir -p ${DEPLOY_PATH} && mkdir -p ${DEPLOY_PATH}/docker-images"
                            
                            # Transfer docker-compose file
                            scp -i $SSH_KEY -o StrictHostKeyChecking=no \
                                docker-compose.prod.yml \
                                ${SSH_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
                            
                            # Transfer .env file if exists
                            if [ -f .env.production ]; then
                                scp -i $SSH_KEY -o StrictHostKeyChecking=no \
                                    .env.production \
                                    ${SSH_USER}@${SERVER_HOST}:${DEPLOY_PATH}/.env
                            fi
                            
                            # Transfer deployment script
                            scp -i $SSH_KEY -o StrictHostKeyChecking=no \
                                deploy.sh \
                                ${SSH_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
                            
                            # Transfer nginx config for frontend
                            scp -i $SSH_KEY -o StrictHostKeyChecking=no \
                                frontend/nginx.conf \
                                ${SSH_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
                            
                            # Transfer Docker images
                            echo "Transferring Docker images (this may take a while)..."
                            scp -i $SSH_KEY -o StrictHostKeyChecking=no \
                                docker-images/*.tar \
                                ${SSH_USER}@${SERVER_HOST}:${DEPLOY_PATH}/docker-images/
                        '''
                    }
                }
            }
        }
        
        stage('Deploy on Server') {
            steps {
                script {
                    echo 'Deploying application on server...'
                    withCredentials([sshUserPrivateKey(
                        credentialsId: 'server-ssh-key',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )]) {
                        sh '''
                            ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER_HOST} \
                                "cd ${DEPLOY_PATH} && chmod +x deploy.sh && ./deploy.sh"
                        '''
                    }
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    echo 'Performing health check...'
                    sleep(time: 30, unit: 'SECONDS')
                    sh '''
                        # Check if services are running
                        curl -f http://${SERVER_HOST}:8080/api/auth/me || echo "Backend health check failed"
                        curl -f http://${SERVER_HOST}:5173 || echo "Frontend health check failed"
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo 'Deployment completed successfully!'
            // You can add notifications here (email, Slack, etc.)
        }
        failure {
            echo 'Deployment failed!'
            // You can add failure notifications here
        }
        always {
            // Cleanup
            sh '''
                rm -rf docker-images
            '''
        }
    }
}

