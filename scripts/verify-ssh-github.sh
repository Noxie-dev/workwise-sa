#!/bin/bash

# GitHub SSH Connection Verification Script for WorkWise SA
# This script verifies that SSH authentication to GitHub is working correctly

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SSH_DIR="$HOME/.ssh"
DEFAULT_KEY="$SSH_DIR/github_ed25519"
CONFIG_PATH="$SSH_DIR/config"

echo -e "${BLUE}🔍 GitHub SSH Connection Verification${NC}"
echo -e "${BLUE}====================================${NC}\n"

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

# Track overall status
OVERALL_STATUS=0

# Check 1: SSH directory exists
print_info "1. Checking SSH directory..."
if [ -d "$SSH_DIR" ]; then
    print_status "SSH directory exists: $SSH_DIR"
else
    print_error "SSH directory not found: $SSH_DIR"
    OVERALL_STATUS=1
fi

# Check 2: SSH keys exist
print_info "2. Checking for SSH keys..."
SSH_KEYS_FOUND=0

# Check for common SSH key types
for key_type in "github_ed25519" "id_ed25519" "id_rsa" "id_ecdsa"; do
    key_path="$SSH_DIR/$key_type"
    if [ -f "$key_path" ]; then
        print_status "Found SSH key: $key_path"
        SSH_KEYS_FOUND=1
        
        # Check permissions
        permissions=$(stat -f "%A" "$key_path" 2>/dev/null || stat -c "%a" "$key_path" 2>/dev/null)
        if [ "$permissions" = "600" ]; then
            print_status "Key permissions are secure (600)"
        else
            print_warning "Key permissions should be 600, found: $permissions"
            print_info "Fix with: chmod 600 $key_path"
        fi
        
        # Show public key fingerprint
        if [ -f "${key_path}.pub" ]; then
            print_info "Public key fingerprint:"
            ssh-keygen -lf "${key_path}.pub" | sed 's/^/    /'
        fi
        break
    fi
done

if [ $SSH_KEYS_FOUND -eq 0 ]; then
    print_error "No SSH keys found in $SSH_DIR"
    print_info "Generate a key with: ssh-keygen -t ed25519 -C 'your-email@example.com'"
    OVERALL_STATUS=1
fi

# Check 3: SSH agent
print_info "3. Checking SSH agent..."
if [ -n "$SSH_AUTH_SOCK" ] && [ -S "$SSH_AUTH_SOCK" ]; then
    print_status "SSH agent is running"
    
    # Check loaded keys
    loaded_keys=$(ssh-add -l 2>/dev/null | wc -l)
    if [ "$loaded_keys" -gt 0 ]; then
        print_status "SSH agent has $loaded_keys key(s) loaded"
        print_info "Loaded keys:"
        ssh-add -l | sed 's/^/    /'
    else
        print_warning "SSH agent is running but no keys are loaded"
        print_info "Load keys with: ssh-add ~/.ssh/your_key"
    fi
else
    print_warning "SSH agent is not running"
    print_info "Start with: eval \"\$(ssh-agent -s)\" && ssh-add ~/.ssh/your_key"
fi

# Check 4: SSH config
print_info "4. Checking SSH configuration..."
if [ -f "$CONFIG_PATH" ]; then
    print_status "SSH config file exists"
    
    if grep -q "Host github.com" "$CONFIG_PATH"; then
        print_status "GitHub configuration found in SSH config"
        print_info "GitHub SSH config:"
        grep -A 5 "Host github.com" "$CONFIG_PATH" | sed 's/^/    /'
    else
        print_warning "No GitHub configuration found in SSH config"
        print_info "Consider adding GitHub host configuration"
    fi
else
    print_warning "SSH config file not found: $CONFIG_PATH"
    print_info "This is optional but recommended for custom configurations"
fi

# Check 5: GitHub known hosts
print_info "5. Checking GitHub in known hosts..."
known_hosts_path="$SSH_DIR/known_hosts"
if [ -f "$known_hosts_path" ]; then
    if grep -q "github.com" "$known_hosts_path"; then
        print_status "GitHub found in known hosts"
    else
        print_warning "GitHub not found in known hosts"
        print_info "This will be added automatically on first connection"
    fi
else
    print_warning "known_hosts file not found"
    print_info "This will be created automatically on first connection"
fi

# Check 6: Test GitHub SSH connection
print_info "6. Testing GitHub SSH connection..."
echo -n "   Testing connection... "

# Capture both stdout and stderr
ssh_output=$(ssh -o BatchMode=yes -o ConnectTimeout=10 -T git@github.com 2>&1)
ssh_exit_code=$?

if echo "$ssh_output" | grep -q "successfully authenticated"; then
    print_status "GitHub SSH authentication successful!"
    
    # Extract username from output
    username=$(echo "$ssh_output" | grep -o "Hi [^!]*" | cut -d' ' -f2)
    if [ -n "$username" ]; then
        print_info "Authenticated as GitHub user: $username"
    fi
elif echo "$ssh_output" | grep -q "Permission denied"; then
    print_error "Permission denied - SSH key not authorized"
    print_info "Make sure your public key is added to GitHub:"
    print_info "1. Copy your public key: cat ~/.ssh/your_key.pub"
    print_info "2. Go to: https://github.com/settings/keys"
    print_info "3. Click 'New SSH key' and paste your public key"
    OVERALL_STATUS=1
elif echo "$ssh_output" | grep -q "Could not resolve hostname"; then
    print_error "Network connectivity issue - cannot reach GitHub"
    OVERALL_STATUS=1
elif echo "$ssh_output" | grep -q "Connection timed out"; then
    print_error "Connection timeout - check your network/firewall"
    OVERALL_STATUS=1
else
    print_error "Unexpected SSH connection result"
    print_info "SSH output: $ssh_output"
    OVERALL_STATUS=1
fi

# Check 7: Test git operations (if in a git repository)
if [ -d ".git" ]; then
    print_info "7. Testing git operations..."
    
    # Check if we have GitHub remotes
    if git remote -v 2>/dev/null | grep -q "github.com"; then
        print_status "GitHub remotes found"
        
        # Show current remotes
        print_info "Current git remotes:"
        git remote -v | sed 's/^/    /'
        
        # Check if using SSH URLs
        if git remote -v | grep -q "git@github.com"; then
            print_status "Using SSH URLs for GitHub remotes"
        else
            print_warning "Using HTTPS URLs - consider switching to SSH"
            print_info "Switch with: git remote set-url origin git@github.com:user/repo.git"
        fi
        
        # Test fetch (if user agrees)
        echo
        read -p "Test git fetch from GitHub? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if git fetch --dry-run origin 2>/dev/null; then
                print_status "Git fetch test successful"
            else
                print_error "Git fetch test failed"
                OVERALL_STATUS=1
            fi
        fi
    else
        print_info "No GitHub remotes found in current repository"
    fi
else
    print_info "7. Not in a git repository - skipping git tests"
fi

# Summary
echo
echo -e "${BLUE}📋 Summary${NC}"
echo -e "${BLUE}=========${NC}"

if [ $OVERALL_STATUS -eq 0 ]; then
    print_status "All checks passed! GitHub SSH authentication is working correctly."
    echo
    print_info "You can now:"
    echo "   • Clone repositories: git clone git@github.com:user/repo.git"
    echo "   • Push/pull code securely without passwords"
    echo "   • Use SSH for automated deployments"
else
    print_error "Some issues were found. Please review the warnings and errors above."
    echo
    print_info "Common solutions:"
    echo "   • Generate SSH key: ./scripts/setup-github-ssh.sh"
    echo "   • Add key to GitHub: https://github.com/settings/keys"
    echo "   • Start SSH agent: eval \"\$(ssh-agent -s)\" && ssh-add ~/.ssh/your_key"
fi

# Additional information
echo
print_info "Useful commands:"
echo "   • Test connection: ssh -T git@github.com"
echo "   • List loaded keys: ssh-add -l"
echo "   • Add key to agent: ssh-add ~/.ssh/your_key"
echo "   • View public key: cat ~/.ssh/your_key.pub"

echo
exit $OVERALL_STATUS
