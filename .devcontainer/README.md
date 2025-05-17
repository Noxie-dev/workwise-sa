# WorkWise SA Firebase Development Container

This directory contains configuration for a development container optimized for Firebase development for the WorkWise SA project.

## Features

- Node.js 20 environment
- Firebase CLI pre-installed
- Firebase Emulators support
- Git integration
- Docker-in-Docker capability
- VS Code extensions for Firebase, TypeScript, ESLint, and more

## Requirements

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Visual Studio Code with Dev Containers extension

## Ports

The following ports are forwarded from the container to the host:

- 5000: Firebase Hosting
- 5001: Firebase Functions
- 8080: Firebase Firestore
- 9099: Firebase Auth
- 9199: Firebase Storage

## Usage

1. Open the project in VS Code
2. Press F1 and select "Dev Containers: Reopen in Container"
3. VS Code will build the container and open the project inside it
4. The container will automatically install Firebase CLI and dependencies
5. You'll be prompted to log in to Firebase on first start

## Firebase Commands

- `firebase emulators:start` - Start all Firebase emulators
- `firebase deploy` - Deploy to Firebase
- `firebase serve` - Run Firebase locally
- `firebase functions:shell` - Test Firebase functions locally

## Customization

- Modify `Dockerfile` to add system dependencies
- Adjust `devcontainer.json` for VS Code settings and extensions
