# AGoat Publisher Local Scripts

This directory contains startup scripts for the AGoat Publisher development environment.

## 🆕 New Unified App Scripts

### `start-unified-app.sh`
Starts only the unified React.js frontend application.
- **Port**: 3000
- **Features**: Single React.js app without Module Federation
- **Build System**: Vite
- **UI**: Radix UI + Tailwind CSS

### `start-full-stack-unified.sh` ⭐ **RECOMMENDED**
Starts both the Go API server and the unified React.js frontend.
- **API Port**: 8080 (with GCP secrets)
- **Frontend Port**: 3000
- **Features**: Complete full-stack development environment
- **Hot Reload**: Both API (air) and frontend (Vite)

## Legacy Scripts (Module Federation)

### `start-react-ui.sh`
Starts the old React.js UI with Module Federation.
- **Port**: 3000
- **Features**: Module Federation host application

### `start-react-viewer.sh`
Starts the old React.js viewer with Module Federation.
- **Port**: 3001
- **Features**: Module Federation remote application

### `start-full-stack-react.sh`
Starts the old full-stack with Module Federation.
- **API Port**: 8080
- **Host Port**: 3000
- **Remote Port**: 3001

## API Scripts

### `start-api.sh`
Starts only the Go API server with GCP secrets.
- **Port**: 8080
- **Features**: Hot reload with air, GCP secrets loading

## Quick Start

For the new unified app (recommended):

```bash
# Start full stack (API + Frontend)
./local-scripts/start-full-stack-unified.sh

# Start only frontend
./local-scripts/start-unified-app.sh

# Start only API
./local-scripts/start-api.sh
```

## Features Comparison

| Feature | Unified App | Module Federation |
|---------|-------------|-------------------|
| Architecture | Single React.js app | Multiple federated apps |
| Build System | Vite | Webpack |
| Complexity | Low | High |
| Performance | Better | Good |
| Development | Easier | More complex |
| Maintenance | Simpler | More complex |

## Migration

The unified app replaces the Module Federation setup with:
- ✅ Single codebase
- ✅ Better performance
- ✅ Easier development
- ✅ Simplified deployment
- ✅ All original features preserved
