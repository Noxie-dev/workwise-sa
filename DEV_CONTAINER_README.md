# WorkWise Development Container

This project now includes a Docker-based development container setup that provides a consistent development environment across different machines.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- VS Code with the "Dev Containers" extension (recommended)

### Option 1: Using VS Code Dev Containers (Recommended)

1. **Open the project in VS Code**
2. **Reopen in Container**: 
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Dev Containers: Reopen in Container"
   - Select the option and wait for the container to build

### Option 2: Using Docker Compose directly

1. **Start the container:**
   ```bash
   ./scripts/dev-container.sh start
   ```

2. **Access the container shell:**
   ```bash
   ./scripts/dev-container.sh shell
   ```

3. **Stop the container:**
   ```bash
   ./scripts/dev-container.sh stop
   ```

## 🐳 Container Management

The project includes a convenient script for managing the development container:

```bash
# Available commands
./scripts/dev-container.sh start    # Start the container
./scripts/dev-container.sh stop     # Stop the container
./scripts/dev-container.sh restart  # Restart the container
./scripts/dev-container.sh logs     # Show container logs
./scripts/dev-container.sh shell    # Open shell in container
./scripts/dev-container.sh build    # Rebuild container
./scripts/dev-container.sh clean    # Clean up containers and images
```

## 🔧 Container Configuration

### Port Mappings
- **3000**: Client development server
- **5173**: Vite development server  
- **8080**: Backend server
- **5001**: Firebase Functions (mapped from container port 5000)

### Features
- **Node.js 18** with TypeScript support
- **Pre-installed tools**: Git, Vim, Nano, Htop
- **Global npm packages**: TypeScript, ts-node, nodemon, Firebase CLI
- **VS Code extensions**: TypeScript, Tailwind CSS, Prettier, ESLint
- **Docker-in-Docker** support for additional containerization

### File Structure
```
.devcontainer/
├── devcontainer.json    # VS Code Dev Container configuration
├── Dockerfile          # Custom container image
└── docker-compose.yml  # Container orchestration
```

## 🛠️ Development Workflow

### Inside the Container
1. **Install dependencies** (already done during build):
   ```bash
   npm install
   ```

2. **Start development servers**:
   ```bash
   # Client development
   cd client && npm run dev
   
   # Backend development  
   cd server && npm run dev
   
   # Firebase functions
   cd functions && npm run dev
   ```

3. **Run tests**:
   ```bash
   npm test
   ```

### Hot Reload
The container is configured with volume mounts that enable hot reloading:
- Source code changes are immediately reflected in the container
- Node modules are cached for faster builds
- File watching is optimized for Docker environments

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts**: If you get port binding errors, check what's using the ports:
   ```bash
   lsof -i :3000  # Check port 3000
   lsof -i :5173  # Check port 5173
   ```

2. **Container won't start**: Ensure Docker Desktop is running and has enough resources

3. **Permission issues**: The container runs as the `node` user, which should have appropriate permissions

4. **Build failures**: Clean and rebuild the container:
   ```bash
   ./scripts/dev-container.sh clean
   ./scripts/dev-container.sh build
   ```

### Container Logs
```bash
# View real-time logs
./scripts/dev-container.sh logs

# View specific container logs
docker logs workwise-dev
```

## 🚀 Production Considerations

This setup is designed for **development only**. For production:

- Use production-optimized Docker images
- Implement proper security measures
- Use environment-specific configurations
- Consider multi-stage builds for smaller images

## 📚 Additional Resources

- [VS Code Dev Containers Documentation](https://code.visualstudio.com/docs/devcontainers/containers-overview)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

## 🤝 Contributing

When contributing to this project:

1. Use the development container for consistency
2. Test your changes in the container environment
3. Update this README if you modify the container configuration
4. Ensure all team members can successfully use the container setup

---

**Happy coding in your containerized development environment! 🎉**

