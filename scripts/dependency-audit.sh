#!/bin/bash

# Dependency Audit and Management Script for WorkWise SA
# Automates dependency updates, security audits, and version alignment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="workwise-sa"
AUDIT_LOG="audit-results-$(date +%Y%m%d-%H%M%S).json"
UPDATE_LOG="update-results-$(date +%Y%m%d-%H%M%S).log"

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  WorkWise SA Dependency Audit${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
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

# Check if npm is available
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install Node.js and npm."
        exit 1
    fi
    print_success "npm is available (version: $(npm --version))"
}

# Check Node.js version
check_node_version() {
    local node_version=$(node --version | cut -d'v' -f2)
    local major_version=$(echo $node_version | cut -d'.' -f1)
    
    if [ "$major_version" -ge 20 ]; then
        print_success "Node.js version is compatible (v$node_version)"
    else
        print_warning "Node.js version is $node_version. Consider upgrading to v20+"
    fi
}

# Audit dependencies for security vulnerabilities
audit_security() {
    print_info "Running security audit..."
    
    local audit_results=""
    local has_vulnerabilities=false
    
    # Audit root package
    print_info "Auditing root package..."
    if npm audit --audit-level=moderate --json > "root-audit.json" 2>/dev/null; then
        local root_vulns=$(jq -r '.metadata.vulnerabilities.total // 0' root-audit.json)
        if [ "$root_vulns" -gt 0 ]; then
            has_vulnerabilities=true
            print_warning "Root package has $root_vulns vulnerabilities"
        else
            print_success "Root package has no vulnerabilities"
        fi
    else
        print_warning "Could not audit root package"
    fi
    
    # Audit client package
    if [ -f "client/package.json" ]; then
        print_info "Auditing client package..."
        cd client
        if npm audit --audit-level=moderate --json > "../client-audit.json" 2>/dev/null; then
            local client_vulns=$(jq -r '.metadata.vulnerabilities.total // 0' ../client-audit.json)
            if [ "$client_vulns" -gt 0 ]; then
                has_vulnerabilities=true
                print_warning "Client package has $client_vulns vulnerabilities"
            else
                print_success "Client package has no vulnerabilities"
            fi
        else
            print_warning "Could not audit client package"
        fi
        cd ..
    fi
    
    # Audit server package
    if [ -f "server/package.json" ]; then
        print_info "Auditing server package..."
        cd server
        if npm audit --audit-level=moderate --json > "../server-audit.json" 2>/dev/null; then
            local server_vulns=$(jq -r '.metadata.vulnerabilities.total // 0' ../server-audit.json)
            if [ "$server_vulns" -gt 0 ]; then
                has_vulnerabilities=true
                print_warning "Server package has $server_vulns vulnerabilities"
            else
                print_success "Server package has no vulnerabilities"
            fi
        else
            print_warning "Could not audit server package"
        fi
        cd ..
    fi
    
    # Audit functions package
    if [ -f "functions/package.json" ]; then
        print_info "Auditing functions package..."
        cd functions
        if npm audit --audit-level=moderate --json > "../functions-audit.json" 2>/dev/null; then
            local functions_vulns=$(jq -r '.metadata.vulnerabilities.total // 0' ../functions-audit.json)
            if [ "$functions_vulns" -gt 0 ]; then
                has_vulnerabilities=true
                print_warning "Functions package has $functions_vulns vulnerabilities"
            else
                print_success "Functions package has no vulnerabilities"
            fi
        else
            print_warning "Could not audit functions package"
        fi
        cd ..
    fi
    
    if [ "$has_vulnerabilities" = true ]; then
        print_warning "Security vulnerabilities found. Run 'npm audit fix' to attempt automatic fixes."
        return 1
    else
        print_success "No security vulnerabilities found!"
        return 0
    fi
}

# Check for outdated dependencies
check_outdated() {
    print_info "Checking for outdated dependencies..."
    
    local has_outdated=false
    
    # Check root package
    print_info "Checking root package dependencies..."
    if npm outdated --json > "root-outdated.json" 2>/dev/null; then
        local root_outdated=$(jq -r 'keys | length' root-outdated.json)
        if [ "$root_outdated" -gt 0 ]; then
            has_outdated=true
            print_warning "Root package has $root_outdated outdated dependencies"
            jq -r 'to_entries[] | "  \(.key): \(.value.current) -> \(.value.latest)"' root-outdated.json
        else
            print_success "Root package dependencies are up to date"
        fi
    fi
    
    # Check client package
    if [ -f "client/package.json" ]; then
        print_info "Checking client package dependencies..."
        cd client
        if npm outdated --json > "../client-outdated.json" 2>/dev/null; then
            local client_outdated=$(jq -r 'keys | length' ../client-outdated.json)
            if [ "$client_outdated" -gt 0 ]; then
                has_outdated=true
                print_warning "Client package has $client_outdated outdated dependencies"
                jq -r 'to_entries[] | "  \(.key): \(.value.current) -> \(.value.latest)"' ../client-outdated.json
            else
                print_success "Client package dependencies are up to date"
            fi
        fi
        cd ..
    fi
    
    # Check server package
    if [ -f "server/package.json" ]; then
        print_info "Checking server package dependencies..."
        cd server
        if npm outdated --json > "../server-outdated.json" 2>/dev/null; then
            local server_outdated=$(jq -r 'keys | length' ../server-outdated.json)
            if [ "$server_outdated" -gt 0 ]; then
                has_outdated=true
                print_warning "Server package has $server_outdated outdated dependencies"
                jq -r 'to_entries[] | "  \(.key): \(.value.current) -> \(.value.latest)"' ../server-outdated.json
            else
                print_success "Server package dependencies are up to date"
            fi
        fi
        cd ..
    fi
    
    if [ "$has_outdated" = true ]; then
        print_warning "Outdated dependencies found. Consider updating with 'npm update'."
        return 1
    else
        print_success "All dependencies are up to date!"
        return 0
    fi
}

# Check version alignment across packages
check_version_alignment() {
    print_info "Checking version alignment across packages..."
    
    local misaligned=false
    
    # Common dependencies to check
    local common_deps=("react" "react-dom" "typescript" "@types/node" "eslint")
    
    for dep in "${common_deps[@]}"; do
        local versions=()
        
        # Check root package
        if [ -f "package.json" ] && jq -e ".dependencies[\"$dep\"] or .devDependencies[\"$dep\"]" package.json > /dev/null 2>&1; then
            local version=$(jq -r ".dependencies[\"$dep\"] // .devDependencies[\"$dep\"]" package.json)
            versions+=("root:$version")
        fi
        
        # Check client package
        if [ -f "client/package.json" ] && jq -e ".dependencies[\"$dep\"] or .devDependencies[\"$dep\"]" client/package.json > /dev/null 2>&1; then
            local version=$(jq -r ".dependencies[\"$dep\"] // .devDependencies[\"$dep\"]" client/package.json)
            versions+=("client:$version")
        fi
        
        # Check server package
        if [ -f "server/package.json" ] && jq -e ".dependencies[\"$dep\"] or .devDependencies[\"$dep\"]" server/package.json > /dev/null 2>&1; then
            local version=$(jq -r ".dependencies[\"$dep\"] // .devDependencies[\"$dep\"]" server/package.json)
            versions+=("server:$version")
        fi
        
        # Check if versions are aligned
        if [ ${#versions[@]} -gt 1 ]; then
            local unique_versions=$(printf '%s\n' "${versions[@]}" | cut -d':' -f2 | sort -u | wc -l)
            if [ "$unique_versions" -gt 1 ]; then
                misaligned=true
                print_warning "$dep has misaligned versions:"
                printf '%s\n' "${versions[@]}" | sed 's/^/  /'
            fi
        fi
    done
    
    if [ "$misaligned" = true ]; then
        print_warning "Version misalignment found. Consider aligning versions across packages."
        return 1
    else
        print_success "All common dependencies are version-aligned!"
        return 0
    fi
}

# Update dependencies safely
update_dependencies() {
    print_info "Updating dependencies safely..."
    
    local update_log="$UPDATE_LOG"
    echo "Dependency update log - $(date)" > "$update_log"
    
    # Update root package
    print_info "Updating root package dependencies..."
    if npm update >> "$update_log" 2>&1; then
        print_success "Root package updated successfully"
    else
        print_warning "Some root package updates failed"
    fi
    
    # Update client package
    if [ -f "client/package.json" ]; then
        print_info "Updating client package dependencies..."
        cd client
        if npm update >> "../$update_log" 2>&1; then
            print_success "Client package updated successfully"
        else
            print_warning "Some client package updates failed"
        fi
        cd ..
    fi
    
    # Update server package
    if [ -f "server/package.json" ]; then
        print_info "Updating server package dependencies..."
        cd server
        if npm update >> "../$update_log" 2>&1; then
            print_success "Server package updated successfully"
        else
            print_warning "Some server package updates failed"
        fi
        cd ..
    fi
    
    print_info "Update log saved to: $update_log"
}

# Fix security vulnerabilities
fix_vulnerabilities() {
    print_info "Attempting to fix security vulnerabilities..."
    
    local fix_log="security-fix-$(date +%Y%m%d-%H%M%S).log"
    echo "Security fix log - $(date)" > "$fix_log"
    
    # Fix root package
    print_info "Fixing root package vulnerabilities..."
    if npm audit fix >> "$fix_log" 2>&1; then
        print_success "Root package vulnerabilities fixed"
    else
        print_warning "Some root package vulnerabilities could not be automatically fixed"
    fi
    
    # Fix client package
    if [ -f "client/package.json" ]; then
        print_info "Fixing client package vulnerabilities..."
        cd client
        if npm audit fix >> "../$fix_log" 2>&1; then
            print_success "Client package vulnerabilities fixed"
        else
            print_warning "Some client package vulnerabilities could not be automatically fixed"
        fi
        cd ..
    fi
    
    # Fix server package
    if [ -f "server/package.json" ]; then
        print_info "Fixing server package vulnerabilities..."
        cd server
        if npm audit fix >> "../$fix_log" 2>&1; then
            print_success "Server package vulnerabilities fixed"
        else
            print_warning "Some server package vulnerabilities could not be automatically fixed"
        fi
        cd ..
    fi
    
    print_info "Security fix log saved to: $fix_log"
}

# Generate dependency report
generate_report() {
    print_info "Generating dependency report..."
    
    local report_file="dependency-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# WorkWise SA Dependency Report

Generated on: $(date)

## Summary

- **Node.js Version**: $(node --version)
- **npm Version**: $(npm --version)
- **Total Packages**: $(find . -name "package.json" | wc -l)

## Package Analysis

### Root Package
- **Dependencies**: $(jq -r '.dependencies | keys | length' package.json 2>/dev/null || echo "0")
- **Dev Dependencies**: $(jq -r '.devDependencies | keys | length' package.json 2>/dev/null || echo "0")

### Client Package
- **Dependencies**: $(jq -r '.dependencies | keys | length' client/package.json 2>/dev/null || echo "0")
- **Dev Dependencies**: $(jq -r '.devDependencies | keys | length' client/package.json 2>/dev/null || echo "0")

### Server Package
- **Dependencies**: $(jq -r '.dependencies | keys | length' server/package.json 2>/dev/null || echo "0")
- **Dev Dependencies**: $(jq -r '.devDependencies | keys | length' server/package.json 2>/dev/null || echo "0")

## Recommendations

1. **Regular Updates**: Run this audit monthly
2. **Security**: Monitor for vulnerabilities weekly
3. **Version Alignment**: Keep common dependencies aligned
4. **Testing**: Run tests after any dependency updates

EOF

    print_success "Dependency report generated: $report_file"
}

# Clean up temporary files
cleanup() {
    print_info "Cleaning up temporary files..."
    rm -f *-audit.json *-outdated.json
    print_success "Cleanup completed"
}

# Main menu
show_menu() {
    echo -e "${BLUE}Available commands:${NC}"
    echo "  audit       - Run security audit"
    echo "  outdated    - Check for outdated dependencies"
    echo "  align       - Check version alignment"
    echo "  update      - Update dependencies safely"
    echo "  fix         - Fix security vulnerabilities"
    echo "  report      - Generate dependency report"
    echo "  full        - Run all checks"
    echo "  cleanup     - Clean up temporary files"
    echo "  help        - Show this menu"
}

# Main script logic
main() {
    print_header
    
    # Check prerequisites
    check_npm
    check_node_version
    
    # Parse command line arguments
    case "${1:-help}" in
        "audit")
            audit_security
            ;;
        "outdated")
            check_outdated
            ;;
        "align")
            check_version_alignment
            ;;
        "update")
            update_dependencies
            ;;
        "fix")
            fix_vulnerabilities
            ;;
        "report")
            generate_report
            ;;
        "full")
            audit_security
            check_outdated
            check_version_alignment
            generate_report
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|*)
            show_menu
            ;;
    esac
}

# Run main function
main "$@"