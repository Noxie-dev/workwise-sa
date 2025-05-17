# Use the official Node.js 20 image as a base
FROM mcr.microsoft.com/devcontainers/javascript-node:20

# Set non-interactive mode for APT
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    gnupg \
    lsb-release \
    ca-certificates \
    jq \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Firebase CLI
RUN npm install -g firebase-tools

# Install Firebase Emulator dependencies (Java)
RUN apt-get update && apt-get install -y \
    openjdk-17-jdk \
    && rm -rf /var/lib/apt/lists/*

# Install common development tools
RUN npm install -g \
    typescript \
    eslint \
    prettier \
    nodemon

# Set workspace directory
WORKDIR /workspaces/workwise-sa

# Set up shell history and command prompt
RUN echo "export PS1='\[\033[01;32m\]\u@firebase-dev\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '" >> /home/node/.bashrc
RUN echo "alias ll='ls -alF'" >> /home/node/.bashrc
RUN echo "alias la='ls -A'" >> /home/node/.bashrc
RUN echo "alias l='ls -CF'" >> /home/node/.bashrc

# Switch to non-root user
USER node
