# How to Push Project to GitHub

## Step 1: Stage All Files

```bash
cd /home/ubuntu/workspace/NexusCasino
git add .
```

## Step 2: Make Initial Commit

```bash
git commit -m "Initial commit: Nexus Casino iGaming platform

- React + TypeScript frontend with Vite
- Spring Boot backend with JWT authentication
- PostgreSQL database
- Docker Compose setup
- WebSocket live chat
- Multiple casino games (Slots, Roulette, Blackjack, Dice)
- Password recovery functionality
- Game history tracking"
```

## Step 3: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `NexusCasino` (or your preferred name)
3. Description: "Full-stack iGaming platform with React and Spring Boot"
4. Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 4: Add GitHub Remote

After creating the repository, GitHub will show you commands. Use these:

```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/NexusCasino.git

# Or if using SSH:
# git remote add origin git@github.com:YOUR_USERNAME/NexusCasino.git
```

## Step 5: Push to GitHub

```bash
# Push to main branch (GitHub's default)
git branch -M main
git push -u origin main

# Or if you prefer to keep 'master':
# git push -u origin master
```

## Alternative: Using GitHub CLI

If you have GitHub CLI installed:

```bash
# Login to GitHub
gh auth login

# Create repository and push in one command
gh repo create NexusCasino --public --source=. --remote=origin --push
```

## Verify Push

Check your GitHub repository:
- Go to: `https://github.com/YOUR_USERNAME/NexusCasino`
- Verify all files are there
- Check that `.gitignore` is working (node_modules, .env, etc. should NOT be visible)

## Important Notes

✅ **Files that WILL be pushed:**
- All source code (frontend/src, backend/src)
- Configuration files (package.json, pom.xml, docker-compose.yml)
- Documentation (README.md, .gitignore)
- Dockerfiles

❌ **Files that WON'T be pushed (thanks to .gitignore):**
- `node_modules/` - Dependencies
- `.env` - Environment variables (sensitive data)
- `target/` - Java build artifacts
- `dist/` - Frontend build output
- `.idea/`, `.vscode/` - IDE settings
- `*.log` - Log files
- `postgres_data/` - Database data
- `extracted_figma/` - Extracted design files
- `*.zip` - Archive files

## Troubleshooting

### If you get "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/NexusCasino.git
```

### If push is rejected
```bash
# Pull first (if repository was initialized with files)
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### If you need to update .gitignore after committing
```bash
# Remove files from git cache (but keep them locally)
git rm -r --cached node_modules/
git rm --cached .env

# Commit the changes
git add .gitignore
git commit -m "Update .gitignore"

# Push
git push
```

