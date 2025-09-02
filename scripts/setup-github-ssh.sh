#!/bin/bash

# GitHub SSH Key Setup Script for WorkWise SA
# This script sets up SSH authentication for GitHub

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EMAIL="${1:-noxolokrwele64@gmail.com}"
KEY_NAME="github_ed25519"
SSH_DIR="$HOME/.ssh"
KEY_PATH="$SSH_DIR/$KEY_NAME"
CONFIG_PATH="$SSH_DIR/config"

echo -e "${BLUE}🔑 GitHub SSH Key Setup for WorkWise SA${NC}"
echo -e "${BLUE}=======================================${NC}\n"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if SSH directory exists
if [ ! -d "$SSH_DIR" ]; then
    print_info "Creating SSH directory..."
    mkdir -p "$SSH_DIR"
    chmod 700 "$SSH_DIR"
    print_status "SSH directory created"
fi

# Check if key already exists
if [ -f "$KEY_PATH" ]; then
    print_warning "SSH key already exists at $KEY_PATH"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Skipping key generation. Using existing key."
    else
        print_info "Backing up existing key..."
        mv "$KEY_PATH" "${KEY_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
        mv "${KEY_PATH}.pub" "${KEY_PATH}.pub.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
        print_status "Existing key backed up"
    fi
fi

# Generate SSH key if it doesn't exist or was backed up
if [ ! -f "$KEY_PATH" ]; then
    print_info "Generating new Ed25519 SSH key..."
    ssh-keygen -t ed25519 -C "$EMAIL" -f "$KEY_PATH" -N ""
    chmod 600 "$KEY_PATH"
    chmod 644 "${KEY_PATH}.pub"
    print_status "SSH key generated successfully"
else
    print_info "Using existing SSH key"
fi

# Add key to SSH agent
print_info "Starting SSH agent and adding key..."

# Start SSH agent if not running
if [ -z "$SSH_AGENT_PID" ]; then
    eval "$(ssh-agent -s)"
fi

# Add the key to SSH agent
ssh-add "$KEY_PATH"
print_status "Key added to SSH agent"

# Create/update SSH config
print_info "Configuring SSH for GitHub..."

# Backup existing config if it exists
if [ -f "$CONFIG_PATH" ]; then
    cp "$CONFIG_PATH" "${CONFIG_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Check if GitHub entry already exists in config
if [ -f "$CONFIG_PATH" ] && grep -q "Host github.com" "$CONFIG_PATH"; then
    print_warning "GitHub configuration already exists in SSH config"
    print_info "Manual verification may be needed"
else
    # Add GitHub configuration
    cat >> "$CONFIG_PATH" << EOF

# GitHub Configuration for WorkWise SA
Host github.com
    HostName github.com
    User git
    IdentityFile $KEY_PATH
    IdentitiesOnly yes
    AddKeysToAgent yes
EOF
    chmod 600 "$CONFIG_PATH"
    print_status "SSH config updated for GitHub"
fi

# Display the public key
echo
print_info "Your public SSH key (copy this to GitHub):"
echo -e "${YELLOW}$(cat "${KEY_PATH}.pub")${NC}"

# Test SSH connection to GitHub
echo
print_info "Testing SSH connection to GitHub..."
if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    print_status "SSH connection to GitHub successful!"
else
    print_warning "SSH connection test failed or key not yet added to GitHub"
    print_info "This is normal if you haven't added the key to GitHub yet"
fi

# Instructions for adding key to GitHub
echo
print_info "Next steps:"
echo "1. Copy the public key shown above"
echo "2. Go to GitHub.com → Settings → SSH and GPG keys"
echo "3. Click 'New SSH key'"
echo "4. Paste your key and give it a title (e.g., 'WorkWise SA Development')"
echo "5. Click 'Add SSH key'"
echo
print_info "After adding the key to GitHub, test the connection:"
echo "   ssh -T git@github.com"
echo
print_info "To use SSH with git commands:"
echo "   git clone git@github.com:username/repository.git"
echo "   git remote set-url origin git@github.com:username/repository.git"

# Verify key fingerprint
echo
print_info "Your key fingerprint:"
ssh-keygen -lf "$KEY_PATH"

echo
print_status "SSH setup completed! 🎉"

# Optional: Check if we're in a git repository and offer to update remote
if [ -d ".git" ]; then
    echo
    print_info "Git repository detected. Current remotes:"
    git remote -v
    echo
    read -p "Would you like to update the origin remote to use SSH? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        current_url=$(git remote get-url origin 2>/dev/null || echo "")
        if [[ $current_url =~ https://github.com/([^/]+)/([^/]+)\.git ]]; then
            ssh_url="git@github.com:${BASH_REMATCH[1]}/${BASH_REMATCH[2]}.git"
            git remote set-url origin "$ssh_url"
            print_status "Remote origin updated to use SSH"
            print_info "New remote URL: $ssh_url"
        else
            print_warning "Could not automatically detect GitHub repository from current remote"
            print_info "You may need to manually update the remote URL"
        fi
    fi
fi
