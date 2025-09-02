#!/bin/bash

# Docker Setup Script for WorkWise SA
# Handles development and production Docker environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="workwise-sa"
DEVELOPMENT_COMPOSE="docker-compose.development.yml"
PRODUCTION_COMPOSE="docker-compose.production.yml"
MONITORING_COMPOSE="monitoring/docker-compose.monitoring.yml"

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  WorkWise SA Docker Setup${NC}"
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

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Clean up old containers and images
cleanup() {
    print_info "Cleaning up old containers and images..."
    
    # Stop and remove containers
    docker-compose -f $DEVELOPMENT_COMPOSE down --remove-orphans 2>/dev/null || true
    docker-compose -f $PRODUCTION_COMPOSE down --remove-orphans 2>/dev/null || true
    
    # Remove old images
    docker image prune -f
    
    print_success "Cleanup completed"
}

# Build development environment
build_development() {
    print_info "Building development environment..."
    
    # Build the development image
    docker-compose -f $DEVELOPMENT_COMPOSE build --no-cache
    
    print_success "Development environment built"
}

# Start development environment
start_development() {
    print_info "Starting development environment..."
    
    # Start services
    docker-compose -f $DEVELOPMENT_COMPOSE up -d
    
    # Wait for services to be ready
    print_info "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are running
    if docker-compose -f $DEVELOPMENT_COMPOSE ps | grep -q "Up"; then
        print_success "Development environment started successfully"
        print_info "Services available at:"
        print_info "  - Application: http://localhost:3000"
        print_info "  - Server: http://localhost:3001"
        print_info "  - Vite Dev Server: http://localhost:5173"
        print_info "  - Database Admin: http://localhost:8081"
        print_info "  - Mailhog: http://localhost:8025"
        print_info "  - Grafana: http://localhost:3003 (admin/dev123)"
    else
        print_error "Failed to start development environment"
        exit 1
    fi
}

# Start production environment
start_production() {
    print_info "Starting production environment..."
    
    # Build production image
    docker-compose -f $PRODUCTION_COMPOSE build --no-cache
    
    # Start services
    docker-compose -f $PRODUCTION_COMPOSE up -d
    
    # Wait for services to be ready
    print_info "Waiting for services to be ready..."
    sleep 30
    
    # Check if services are running
    if docker-compose -f $PRODUCTION_COMPOSE ps | grep -q "Up"; then
        print_success "Production environment started successfully"
        print_info "Services available at:"
        print_info "  - Application: http://localhost:3001"
        print_info "  - Nginx: http://localhost:80"
        print_info "  - Prometheus: http://localhost:9090"
        print_info "  - Grafana: http://localhost:3002 (admin/workwise123)"
    else
        print_error "Failed to start production environment"
        exit 1
    fi
}

# Start monitoring stack
start_monitoring() {
    print_info "Starting monitoring stack..."
    
    # Start monitoring services
    docker-compose -f $MONITORING_COMPOSE up -d
    
    # Wait for services to be ready
    print_info "Waiting for monitoring services to be ready..."
    sleep 15
    
    # Check if services are running
    if docker-compose -f $MONITORING_COMPOSE ps | grep -q "Up"; then
        print_success "Monitoring stack started successfully"
        print_info "Services available at:"
        print_info "  - Prometheus: http://localhost:9090"
        print_info "  - Grafana: http://localhost:3000 (admin/workwise123)"
        print_info "  - Alertmanager: http://localhost:9093"
    else
        print_error "Failed to start monitoring stack"
        exit 1
    fi
}

# Install dependencies in development container
install_dependencies() {
    print_info "Installing dependencies in development container..."
    
    # Install root dependencies
    docker exec workwise-dev npm install
    
    # Install client dependencies
    docker exec workwise-dev bash -c "cd client && npm install"
    
    # Install server dependencies
    docker exec workwise-dev bash -c "cd server && npm install"
    
    print_success "Dependencies installed"
}

# Run development server
run_dev_server() {
    print_info "Starting development server..."
    
    # Start the development server
    docker exec -d workwise-dev bash -c "cd /workspace && npm run dev"
    
    print_success "Development server started"
    print_info "Check logs with: docker logs workwise-dev -f"
}

# Show logs
show_logs() {
    local service=${1:-app}
    print_info "Showing logs for $service..."
    docker-compose -f $DEVELOPMENT_COMPOSE logs -f $service
}

# Show status
show_status() {
    print_info "Container status:"
    docker-compose -f $DEVELOPMENT_COMPOSE ps
}

# Execute command in container
exec_command() {
    local command=${1:-bash}
    print_info "Executing command in development container: $command"
    docker exec -it workwise-dev $command
}

# Health check
health_check() {
    print_info "Performing health check..."
    
    # Check if container is running
    if ! docker ps | grep -q workwise-dev; then
        print_error "Development container is not running"
        return 1
    fi
    
    # Check application health
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Application is healthy"
    else
        print_warning "Application health check failed"
    fi
    
    # Check database connection
    if docker exec workwise-postgres-dev pg_isready -U workwise -d workwise_dev > /dev/null 2>&1; then
        print_success "Database is healthy"
    else
        print_warning "Database health check failed"
    fi
    
    # Check Redis connection
    if docker exec workwise-redis-dev redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is healthy"
    else
        print_warning "Redis health check failed"
    fi
}

# Main menu
show_menu() {
    echo -e "${BLUE}Available commands:${NC}"
    echo "  dev          - Start development environment"
    echo "  prod         - Start production environment"
    echo "  monitoring   - Start monitoring stack"
    echo "  cleanup      - Clean up containers and images"
    echo "  install      - Install dependencies"
    echo "  start        - Start development server"
    echo "  logs [service] - Show logs (default: app)"
    echo "  status       - Show container status"
    echo "  exec [cmd]   - Execute command in container (default: bash)"
    echo "  health       - Perform health check"
    echo "  stop         - Stop all services"
    echo "  help         - Show this menu"
}

# Stop all services
stop_all() {
    print_info "Stopping all services..."
    
    docker-compose -f $DEVELOPMENT_COMPOSE down 2>/dev/null || true
    docker-compose -f $PRODUCTION_COMPOSE down 2>/dev/null || true
    docker-compose -f $MONITORING_COMPOSE down 2>/dev/null || true
    
    print_success "All services stopped"
}

# Main script logic
main() {
    print_header
    
    # Check prerequisites
    check_docker
    check_docker_compose
    
    # Parse command line arguments
    case "${1:-help}" in
        "dev")
            cleanup
            build_development
            start_development
            install_dependencies
            run_dev_server
            health_check
            ;;
        "prod")
            cleanup
            start_production
            ;;
        "monitoring")
            start_monitoring
            ;;
        "cleanup")
            cleanup
            ;;
        "install")
            install_dependencies
            ;;
        "start")
            run_dev_server
            ;;
        "logs")
            show_logs $2
            ;;
        "status")
            show_status
            ;;
        "exec")
            exec_command $2
            ;;
        "health")
            health_check
            ;;
        "stop")
            stop_all
            ;;
        "help"|*)
            show_menu
            ;;
    esac
}

# Run main function
main "$@"