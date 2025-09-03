# Docker Troubleshooting Guide for WorkWise SA

This guide helps you diagnose and fix common Docker issues with the WorkWise SA application.

## 🚨 **Critical Issues Found & Fixed**

### **1. Node.js Version Mismatch**
**Problem**: Container was using Node.js 18, but the application requires Node.js 20+
**Solution**: Updated Dockerfiles to use Node.js 20

### **2. Container Exit Issues**
**Problem**: Container was exiting with code 255
**Solution**: Added proper health checks, restart policies, and error handling

### **3. Missing Production Configuration**
**Problem**: Only development setup available
**Solution**: Created separate production and development Docker configurations

## 🔧 **Quick Fixes**

### **Start Fresh Development Environment**
```bash
# Stop and clean everything
./scripts/docker-setup.sh stop
./scripts/docker-setup.sh cleanup

# Start development environment
./scripts/docker-setup.sh dev
```

### **Check Container Status**
```bash
# View running containers
docker ps

# Check container logs
docker logs workwise-dev -f

# Health check
./scripts/docker-setup.sh health
```

## 📋 **Common Issues & Solutions**

### **Issue 1: "Cannot connect to Docker daemon"**
**Symptoms**: 
- `Cannot connect to the Docker daemon at unix:///Users/.../docker.sock`
- Docker commands fail

**Solutions**:
1. **Start Docker Desktop**:
   ```bash
   open -a Docker
   ```
   Wait for Docker to fully start (whale icon in menu bar should be steady)

2. **Check Docker status**:
   ```bash
   docker info
   ```

3. **Restart Docker Desktop** if needed

### **Issue 2: "Node.js version incompatible"**
**Symptoms**:
- `npm error engine Unsupported engine`
- `Not compatible with your version of node/npm`

**Solutions**:
1. **Use the new development setup**:
   ```bash
   ./scripts/docker-setup.sh dev
   ```

2. **Check Node.js version in container**:
   ```bash
   docker exec workwise-dev node --version
   # Should show v20.x.x
   ```

### **Issue 3: "Container keeps exiting"**
**Symptoms**:
- Container status shows "Exited"
- Exit code 255 or other non-zero codes

**Solutions**:
1. **Check container logs**:
   ```bash
   docker logs workwise-dev
   ```

2. **Restart with proper configuration**:
   ```bash
   ./scripts/docker-setup.sh stop
   ./scripts/docker-setup.sh dev
   ```

3. **Check health status**:
   ```bash
   ./scripts/docker-setup.sh health
   ```

### **Issue 4: "Port already in use"**
**Symptoms**:
- `bind: address already in use`
- Port conflicts

**Solutions**:
1. **Find what's using the port**:
   ```bash
   lsof -i :3000
   lsof -i :3001
   lsof -i :5173
   ```

2. **Kill conflicting processes**:
   ```bash
   kill -9 <PID>
   ```

3. **Use different ports** (modify docker-compose files)

### **Issue 5: "Dependencies won't install"**
**Symptoms**:
- npm install fails
- Package version conflicts

**Solutions**:
1. **Clean install in container**:
   ```bash
   docker exec workwise-dev bash -c "cd /workspace && rm -rf node_modules package-lock.json"
   ./scripts/docker-setup.sh install
   ```

2. **Check Node.js version**:
   ```bash
   docker exec workwise-dev node --version
   ```

### **Issue 6: "Application won't start"**
**Symptoms**:
- Development server doesn't start
- 404 errors when accessing URLs

**Solutions**:
1. **Check if server is running**:
   ```bash
   docker exec workwise-dev ps aux
   ```

2. **Start development server manually**:
   ```bash
   docker exec -it workwise-dev bash
   cd /workspace
   npm run dev
   ```

3. **Check environment variables**:
   ```bash
   docker exec workwise-dev env | grep NODE
   ```

## 🏥 **Health Checks**

### **Application Health**
```bash
# Basic health check
curl http://localhost:3001/health

# Detailed health check
curl http://localhost:3001/health/detailed

# Readiness check
curl http://localhost:3001/ready
```

### **Service Health**
```bash
# Database
docker exec workwise-postgres-dev pg_isready -U workwise -d workwise_dev

# Redis
docker exec workwise-redis-dev redis-cli ping

# Application container
docker exec workwise-dev curl -f http://localhost:3001/health
```

## 🔍 **Debugging Commands**

### **Container Inspection**
```bash
# Inspect container details
docker inspect workwise-dev

# Check container processes
docker exec workwise-dev ps aux

# Check container environment
docker exec workwise-dev env

# Check container filesystem
docker exec workwise-dev ls -la /workspace
```

### **Log Analysis**
```bash
# Application logs
docker logs workwise-dev -f

# Database logs
docker logs workwise-postgres-dev -f

# Redis logs
docker logs workwise-redis-dev -f

# All services logs
docker-compose -f docker-compose.development.yml logs -f
```

### **Network Debugging**
```bash
# Check network connectivity
docker exec workwise-dev ping postgres
docker exec workwise-dev ping redis

# Check port bindings
docker port workwise-dev

# Test HTTP connectivity
docker exec workwise-dev curl -f http://localhost:3001/health
```

## 🚀 **Performance Optimization**

### **Container Resource Limits**
```yaml
# In docker-compose files
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
```

### **Volume Optimization**
```bash
# Use named volumes for better performance
volumes:
  node_modules:
    driver: local
  postgres_data:
    driver: local
```

## 📊 **Monitoring & Metrics**

### **Container Metrics**
```bash
# Container stats
docker stats workwise-dev

# Container resource usage
docker exec workwise-dev top

# Memory usage
docker exec workwise-dev free -h

# Disk usage
docker exec workwise-dev df -h
```

### **Application Metrics**
```bash
# Prometheus metrics
curl http://localhost:3001/api/metrics

# Performance summary
curl http://localhost:3001/api/auth-monitoring/health
```

## 🛠️ **Development Workflow**

### **Daily Development Setup**
```bash
# Start development environment
./scripts/docker-setup.sh dev

# Check status
./scripts/docker-setup.sh status

# View logs
./scripts/docker-setup.sh logs app

# Execute commands
./scripts/docker-setup.sh exec bash
```

### **Troubleshooting Workflow**
1. **Check container status**: `docker ps`
2. **Check logs**: `docker logs workwise-dev`
3. **Health check**: `./scripts/docker-setup.sh health`
4. **Restart if needed**: `./scripts/docker-setup.sh stop && ./scripts/docker-setup.sh dev`

## 🔧 **Advanced Troubleshooting**

### **Container Recovery**
```bash
# If container is in bad state
docker stop workwise-dev
docker rm workwise-dev
./scripts/docker-setup.sh dev
```

### **Database Recovery**
```bash
# Reset database
docker-compose -f docker-compose.development.yml down
docker volume rm workwise-sa_postgres_dev_data
./scripts/docker-setup.sh dev
```

### **Cache Recovery**
```bash
# Clear Redis cache
docker exec workwise-redis-dev redis-cli FLUSHALL

# Clear application cache
docker exec workwise-dev bash -c "cd /workspace && rm -rf .cache"
```

## 📞 **Getting Help**

### **Log Collection for Support**
```bash
# Collect all relevant logs
mkdir -p debug-logs
docker logs workwise-dev > debug-logs/app.log 2>&1
docker logs workwise-postgres-dev > debug-logs/db.log 2>&1
docker logs workwise-redis-dev > debug-logs/redis.log 2>&1
docker-compose -f docker-compose.development.yml ps > debug-logs/status.txt
docker system df > debug-logs/disk-usage.txt
```

### **System Information**
```bash
# Docker version
docker --version
docker-compose --version

# System info
uname -a
sw_vers  # macOS only

# Docker info
docker info
```

## ✅ **Verification Checklist**

After fixing issues, verify:

- [ ] Docker Desktop is running
- [ ] Container is running: `docker ps | grep workwise-dev`
- [ ] Node.js version is 20+: `docker exec workwise-dev node --version`
- [ ] Dependencies installed: `docker exec workwise-dev npm list --depth=0`
- [ ] Application starts: `docker exec workwise-dev npm run dev`
- [ ] Health check passes: `curl http://localhost:3001/health`
- [ ] Database accessible: `docker exec workwise-postgres-dev pg_isready`
- [ ] Redis accessible: `docker exec workwise-redis-dev redis-cli ping`

## 🎯 **Next Steps**

1. **Use the new setup**: `./scripts/docker-setup.sh dev`
2. **Monitor health**: `./scripts/docker-setup.sh health`
3. **Check logs regularly**: `./scripts/docker-setup.sh logs`
4. **Keep Docker Desktop updated**
5. **Use production setup for deployment**: `./scripts/docker-setup.sh prod`

This guide should help you resolve most Docker-related issues with the WorkWise SA application. If you encounter issues not covered here, collect the debug logs and system information as described above.