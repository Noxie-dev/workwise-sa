FROM mcr.microsoft.com/devcontainers/typescript-node:18

# Install additional development tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    vim \
    nano \
    htop \
    && rm -rf /var/lib/apt/lists/*

# Install global npm packages
RUN npm install -g \
    @types/node \
    typescript \
    ts-node \
    nodemon \
    firebase-tools \
    @angular/cli \
    create-react-app \
    create-vue@latest

# Set working directory
WORKDIR /workspace

# Copy package files for faster builds
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY functions/package*.json ./functions/

# Install dependencies
RUN npm install

# Set environment variables
ENV NODE_ENV=development
ENV PATH="/workspace/node_modules/.bin:$PATH"

# Expose common development ports
EXPOSE 3000 5173 8080 5000

# Default command
CMD ["/bin/bash"]
