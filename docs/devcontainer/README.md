# DevContainer Configuration

This directory contains the VS Code Dev Containers setup for the WorkWise SA project.

## How It Is Wired

- VS Code Dev Containers builds `.devcontainer/Dockerfile` using the repository root as the build context (`..`).
- `docker-compose.yml` is kept as an optional manual/local Docker workflow and mirrors the same app and Firebase emulator ports.

## Files

- `devcontainer.json` - VS Code Dev Containers configuration (build, ports, extensions, post-create setup)
- `Dockerfile` - Development image definition based on `mcr.microsoft.com/devcontainers/typescript-node:22`
- `../docker-compose.yml` - Optional compose service for running the workspace container manually

## Forwarded Ports (VS Code) / Mapped Ports (Compose)

- `3001` - Backend API server
- `5173` - Vite dev server
- `8080` - Firebase Firestore emulator
- `5001` - Firebase Functions emulator
- `5050` - Firebase Hosting emulator
- `9099` - Firebase Auth emulator
- `9199` - Firebase Storage emulator
- `9000` - Firebase Realtime Database emulator

## Post-Create Setup

After the container is created, VS Code runs:

```bash
npm install && npm --prefix client install && npm --prefix server install && npm --prefix functions install
```

This installs dependencies for the root project and the `client`, `server`, and `functions` packages.

## Troubleshooting

### If the devcontainer build fails

1. Verify Docker is running: `docker --version`
2. Rebuild from VS Code Command Palette: `Dev Containers: Rebuild Container`
3. If needed, clean unused Docker state: `docker system prune -a`

### If forwarded ports do not appear

1. Confirm the process is listening inside the container
2. Check `devcontainer.json` `forwardPorts` and `portsAttributes`
3. For manual Docker usage, verify `docker-compose.yml` `ports` mappings

### If dependency installs fail in post-create

- Check network access from inside the container
- Re-run the post-create command manually in the container terminal
- Remove stale `node_modules` directories and reinstall if dependencies changed significantly

## Manual Docker Usage (Optional)

### Build the dev image directly

```bash
docker build -f .devcontainer/Dockerfile -t workwise-sa-dev .
```

### Start the workspace container with Docker Compose

```bash
docker compose up -d app
```

This starts the `app` container and exposes the same ports listed above.
