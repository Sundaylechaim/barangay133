# Git Push Guide

## Step 1: Create a GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Copy the repository URL (HTTPS or SSH)

## Step 2: Add Remote Repository
```bash
# Replace with your actual repository URL
git remote add origin https://github.com/yourusername/barangay133-api.git
```

## Step 3: Push to Remote
```bash
# Push to remote and set upstream
git push -u origin revised
```

## Step 4: Future Pushes
```bash
# After the first push, you can simply use:
git push
```

## Alternative: If Repository Already Exists
If the remote repository already has commits:
```bash
# Pull first to avoid conflicts
git pull origin revised --allow-unrelated-histories

# Then push
git push -u origin revised
```

## Check Status
```bash
# Check remote repositories
git remote -v

# Check current branch
git branch

# Check status
git status
```

## Note
- Make sure you have the necessary permissions for the remote repository
- If using SSH, ensure your SSH keys are configured
- If using HTTPS, you may need to enter your GitHub credentials