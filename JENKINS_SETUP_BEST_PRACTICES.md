# Jenkins Setup - Best Practices

## 🎯 Recommended Jenkins Configuration

### 1. Multi-Branch Pipeline (Recommended)

Instead of a single pipeline, use **Multi-Branch Pipeline** for automatic branch detection:

1. **Create Multi-Branch Pipeline**
   - New Item → Multibranch Pipeline
   - Name: `nexus-casino`
   - Branch Sources → Add source → GitHub
   - Repository: `https://github.com/pyavchik/nexuscasino.git`
   - Credentials: (GitHub credentials if private repo)
   - Behaviors:
     - Discover branches: All branches
     - Discover PRs: Merging the pull request with the current target branch
   - Build Configuration:
     - Mode: By Jenkinsfile
     - Script Path: `Jenkinsfile.password`

2. **Benefits**
   - ✅ Automatically builds all feature branches
   - ✅ Builds PRs automatically
   - ✅ No manual branch selection needed
   - ✅ Better organization

### 2. GitHub Webhooks Setup

Enable automatic builds on push/PR:

1. **GitHub Repository Settings**
   - Go to: Settings → Webhooks
   - Add webhook
   - Payload URL: `http://your-jenkins-url/github-webhook/`
   - Content type: `application/json`
   - Events: 
     - ✅ Push
     - ✅ Pull request
   - Active: ✅

2. **Jenkins Configuration**
   - Manage Jenkins → Configure System
   - GitHub → Add GitHub Server
   - API URL: `https://api.github.com`
   - Credentials: GitHub personal access token

### 3. Build Notifications

Add Slack/Email notifications:

```groovy
// Add to Jenkinsfile.password post section
post {
    success {
        emailext (
            subject: "✅ Deployment Successful: ${env.BRANCH_NAME}",
            body: "Deployment completed successfully!\n\nBranch: ${env.BRANCH_NAME}\nBuild: ${env.BUILD_URL}",
            to: "your-email@example.com"
        )
    }
    failure {
        emailext (
            subject: "❌ Deployment Failed: ${env.BRANCH_NAME}",
            body: "Deployment failed!\n\nBranch: ${env.BRANCH_NAME}\nBuild: ${env.BUILD_URL}\n\nCheck logs for details.",
            to: "your-email@example.com"
        )
    }
}
```

### 4. Build Parameters

Add parameters for flexibility:

```groovy
parameters {
    choice(
        name: 'DEPLOY_ENV',
        choices: ['production', 'staging'],
        description: 'Deployment environment'
    )
    booleanParam(
        name: 'SKIP_TESTS',
        defaultValue: false,
        description: 'Skip running tests'
    )
}
```

### 5. Artifact Archiving

Save build artifacts for rollback:

```groovy
stage('Archive Artifacts') {
    steps {
        archiveArtifacts artifacts: 'docker-images/*.tar', fingerprint: true
    }
}
```

## 🔧 Current Setup Improvements

### Enhanced Jenkinsfile Features

1. **Better Error Handling**
2. **Build Caching**
3. **Parallel Builds**
4. **Health Checks**
5. **Rollback Capability**

## 📝 Quick Reference

### Manual Build Commands

```bash
# Build specific branch
curl -X POST http://jenkins-url/job/nexus-casino/build \
  --user username:token \
  --data-urlencode json='{"parameter": [{"name":"BRANCH", "value":"feature/my-feature"}]}'
```

### Check Build Status

```bash
curl http://jenkins-url/job/nexus-casino/lastBuild/api/json
```

## 🚀 Next Steps

1. Set up Multi-Branch Pipeline
2. Configure GitHub Webhooks
3. Add notifications
4. Set up artifact archiving
5. Configure build parameters

---

For detailed setup instructions, see `DEPLOYMENT_GUIDE.md`

