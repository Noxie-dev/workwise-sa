#!/bin/bash

# WorkWise Development Container Management Script

set -e

case "$1" in
  "start")
    echo "Starting WorkWise development container..."
    docker-compose up -d
    echo "Container started! You can now:"
    echo "1. Open VS Code and use 'Reopen in Container'"
    echo "2. Or run: docker exec -it workwise-dev bash"
    ;;
  
  "stop")
    echo "Stopping WorkWise development container..."
    docker-compose down
    ;;
  
  "restart")
    echo "Restarting WorkWise development container..."
    docker-compose restart
    ;;
  
  "logs")
    docker-compose logs -f
    ;;
  
  "shell")
    echo "Opening shell in WorkWise development container..."
    docker exec -it workwise-dev bash
    ;;
  
  "build")
    echo "Building WorkWise development container..."
    docker-compose build --no-cache
    ;;
  
  "clean")
    echo "Cleaning up containers and images..."
    docker-compose down --rmi all --volumes --remove-orphans
    docker system prune -f
    ;;
  
  *)
    echo "Usage: $0 {start|stop|restart|logs|shell|build|clean}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the development container"
    echo "  stop    - Stop the development container"
    echo "  restart - Restart the development container"
    echo "  logs    - Show container logs"
    echo "  shell   - Open shell in container"
    echo "  build   - Rebuild container"
    echo "  clean   - Clean up containers and images"
    exit 1
    ;;
esac

