# GitHub SSH Authentication Setup Guide

This guide provides comprehensive instructions for setting up SSH authentication with GitHub for the WorkWise SA project.

## Overview

SSH (Secure Shell) authentication provides a secure way to connect to GitHub without entering your username and password each time. This is especially important for:

- Automated deployments and CI/CD pipelines
- Enhanced security (no password storage)
- Better developer experience
- Repository access from servers and development containers

## Quick Setup

For a fast automated setup, run our setup script:

```bash
# Using the provided email
./scripts/setup-github-ssh.sh

# Or with a custom email
./scripts/setup-github-ssh.sh your-email@example.com
```

## Manual Setup

### Step 1: Generate SSH Key

Generate a new Ed25519 SSH key (recommended for better security):

```bash
ssh-keygen -t ed25519 -C "noxolokrwele64@gmail.com" -f ~/.ssh/github_ed25519
```

**Parameters explained:**
- `-t ed25519`: Uses the Ed25519 algorithm (more secure than RSA)
- `-C "email"`: Adds a comment/label to identify the key
- `-f ~/.ssh/github_ed25519`: Specifies the filename and location

### Step 2: Start SSH Agent and Add Key

```bash
# Start the SSH agent
eval "$(ssh-agent -s)"

# Add your SSH private key to the ssh-agent
ssh-add ~/.ssh/github_ed25519
```

### Step 3: Configure SSH for GitHub

Create or update your SSH config file (`~/.ssh/config`):

```bash
# GitHub Configuration for WorkWise SA
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_ed25519
    IdentitiesOnly yes
    AddKeysToAgent yes
```

### Step 4: Add Public Key to GitHub

1. **Copy your public key to clipboard:**
   ```bash
   cat ~/.ssh/github_ed25519.pub
   ```

2. **Add to GitHub:**
   - Go to [GitHub Settings → SSH and GPG keys](https://github.com/settings/keys)
   - Click "New SSH key"
   - Give it a descriptive title (e.g., "WorkWise SA Development")
   - Paste your public key
   - Click "Add SSH key"

### Step 5: Test the Connection

```bash
ssh -T git@github.com
```

You should see a message like:
```
Hi username! You've successfully authenticated, but GitHub does not provide shell access.
```

## Using SSH with Git

### Clone a Repository

```bash
# SSH clone (recommended)
git clone git@github.com:username/workwise-sa.git

# Instead of HTTPS
git clone https://github.com/username/workwise-sa.git
```

### Update Existing Repository

If you already have a repository cloned with HTTPS, switch to SSH:

```bash
# Check current remote
git remote -v

# Update to SSH
git remote set-url origin git@github.com:username/workwise-sa.git

# Verify the change
git remote -v
```

## Development Environment Setup

### For VS Code Dev Containers

If using the development container (`.devcontainer`), your SSH keys need to be forwarded:

1. **Enable SSH Agent forwarding in VS Code:**
   - Open VS Code settings
   - Search for "dev containers ssh"
   - Enable "Dev > Containers: Copy Git Config"

2. **Or mount SSH directory in devcontainer.json:**
   ```json
   {
     "mounts": [
       "source=${localEnv:HOME}/.ssh,target=/home/node/.ssh,type=bind,consistency=cached"
     ]
   }
   ```

### For CI/CD Pipelines

For GitHub Actions and other CI/CD systems:

1. **Add SSH private key as a secret**
2. **Use in workflows:**
   ```yaml
   - name: Setup SSH
     run: |
       mkdir -p ~/.ssh
       echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_ed25519
       chmod 600 ~/.ssh/id_ed25519
       ssh-keyscan github.com >> ~/.ssh/known_hosts
   ```

## Security Best Practices

### 1. Key Management

- **Use Ed25519 keys** for better security and performance
- **Set passphrases** for additional security (optional but recommended)
- **Rotate keys regularly** (annually or when team members leave)
- **Use different keys** for different environments (dev, staging, prod)

### 2. Access Control

- **Limit key scope** to specific repositories when possible
- **Use deploy keys** for production deployments
- **Monitor key usage** in GitHub settings
- **Remove unused keys** promptly

### 3. Backup and Recovery

- **Backup private keys** securely (encrypted storage)
- **Document key locations** for team members
- **Have recovery procedures** for lost keys

## Troubleshooting

### Common Issues

#### 1. Permission Denied

```bash
git@github.com: Permission denied (publickey)
```

**Solutions:**
- Verify SSH agent is running: `ssh-add -l`
- Check if key is added: `ssh-add ~/.ssh/github_ed25519`
- Test connection: `ssh -T git@github.com`
- Verify public key is added to GitHub

#### 2. Host Key Verification Failed

```bash
Host key verification failed
```

**Solution:**
```bash
ssh-keyscan github.com >> ~/.ssh/known_hosts
```

#### 3. SSH Agent Not Running

**Solution:**
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/github_ed25519
```

#### 4. Wrong Remote URL

**Check and fix:**
```bash
git remote -v
git remote set-url origin git@github.com:username/repo.git
```

### Debug Commands

```bash
# Test SSH connection with verbose output
ssh -vT git@github.com

# List SSH keys in agent
ssh-add -l

# Check SSH config
cat ~/.ssh/config

# Verify key fingerprint
ssh-keygen -lf ~/.ssh/github_ed25519.pub
```

## Team Setup

### For New Team Members

1. **Generate their own SSH key** (never share private keys)
2. **Add public key to GitHub** account
3. **Grant repository access** through GitHub
4. **Test connection** before starting work

### For Multiple Repositories

Create a comprehensive SSH config:

```bash
# WorkWise SA Main Repository
Host github.com-workwise
    HostName github.com
    User git
    IdentityFile ~/.ssh/workwise_ed25519

# Personal Projects
Host github.com-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/personal_ed25519
```

Then clone with specific host:
```bash
git clone git@github.com-workwise:username/workwise-sa.git
```

## Integration with WorkWise SA

### Current Authentication Methods

The WorkWise SA project currently uses:
- **Firebase Authentication** for user authentication
- **GitHub Actions** for CI/CD (uses `GITHUB_TOKEN`)
- **Netlify** for deployment

### Adding SSH to Deployment Pipeline

Update deployment scripts to use SSH:

```bash
# In deployment scripts
git clone git@github.com:username/workwise-sa.git
# Instead of
git clone https://github.com/username/workwise-sa.git
```

### Environment Variables

No additional environment variables needed for SSH authentication, but you may want to document the SSH setup in your deployment guides.

## Scripts and Automation

### Available Scripts

- `./scripts/setup-github-ssh.sh` - Automated SSH setup
- `./scripts/verify-ssh-github.sh` - Test SSH connection (to be created)

### Adding to Package.json

```json
{
  "scripts": {
    "setup:ssh": "./scripts/setup-github-ssh.sh",
    "verify:ssh": "./scripts/verify-ssh-github.sh"
  }
}
```

## References

- [GitHub SSH Documentation](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [Git SSH vs HTTPS](https://docs.github.com/en/get-started/getting-started-with-git/about-remote-repositories)
- [SSH Key Management Best Practices](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/reviewing-your-ssh-keys)

## FAQ

### Q: Should I use SSH or HTTPS?

**A:** SSH is recommended for:
- Development environments
- Automated scripts and CI/CD
- Frequent git operations
- Better security (no password storage)

HTTPS is better for:
- One-time clones
- Environments where SSH is blocked
- Shared/public computers

### Q: Can I use the same SSH key for multiple services?

**A:** While technically possible, it's better to use separate keys for:
- Different services (GitHub, GitLab, etc.)
- Different environments (dev, prod)
- Different purposes (personal, work)

### Q: What if I lose my SSH key?

**A:** 
1. Generate a new key pair
2. Add the new public key to GitHub
3. Remove the old key from GitHub
4. Update any scripts or configs using the old key

### Q: Is Ed25519 better than RSA?

**A:** Yes, Ed25519 is:
- More secure with shorter keys
- Faster to generate and verify
- Resistant to side-channel attacks
- Recommended by security experts

---

*This guide is part of the WorkWise SA project documentation. For questions or updates, please contact the development team.*
