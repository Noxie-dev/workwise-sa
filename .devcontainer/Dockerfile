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

# Set up npm global directory for node user
RUN mkdir -p /home/node/.npm-global && \
    chown -R node:node /home/node/.npm-global

# Switch to node user before installing global packages
USER node

# Configure npm to use the user's global directory
RUN npm config set prefix '/home/node/.npm-global'
ENV PATH=/home/node/.npm-global/bin:$PATH

# Install Firebase CLI as node user
RUN npm install -g firebase-tools@latest

# Switch back to root for remaining system setup
USER root

# Install Firebase Emulator dependencies (Java)
RUN apt-get update && apt-get install -y \
    openjdk-17-jdk \
    && rm -rf /var/lib/apt/lists/*

# Switch to node user to install development tools
USER node

# Install common development tools as node user
RUN npm install -g \
    typescript \
    eslint \
    prettier \
    nodemon

# Switch back to root for final setup
USER root

# Set workspace directory
WORKDIR /workspaces/workwise-sa

# Set up shell history and command prompt for node user
RUN echo "export PS1='\[\033[01;32m\]\u@firebase-dev\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '" >> /home/node/.bashrc
RUN echo "alias ll='ls -alF'" >> /home/node/.bashrc
RUN echo "alias la='ls -A'" >> /home/node/.bashrc
RUN echo "alias l='ls -CF'" >> /home/node/.bashrc
RUN echo "export PATH=/home/node/.npm-global/bin:$PATH" >> /home/node/.bashrc

# Switch to non-root user
USER node
