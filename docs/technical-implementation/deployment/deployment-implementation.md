# Deployment and Infrastructure Implementation

## Overview
This document describes the complete deployment and infrastructure setup for the AGoat Publisher system, including development environment, build processes, SSL configuration, and production deployment strategies.

## Development Environment

### Local Development Setup

#### Prerequisites
- **Go 1.21+**: Backend API development
- **Node.js 18+**: Frontend development
- **CockroachDB**: Database server
- **Git**: Version control
- **SSL Certificates**: Self-signed certificates for HTTPS development

#### Environment Setup Scripts

##### 1. SSL Certificate Generation
```bash
#!/bin/bash
# scripts/generate-ssl-cert.sh

CERT_DIR="certs"
DOMAIN="dev.np-topvitaminsupply.com"

# Create certs directory if it doesn't exist
mkdir -p $CERT_DIR

# Generate private key
openssl genrsa -out $CERT_DIR/$DOMAIN.key 2048

# Generate certificate signing request
openssl req -new -key $CERT_DIR/$DOMAIN.key -out $CERT_DIR/$DOMAIN.csr -subj "/C=US/ST=CA/L=San Francisco/O=AGoat Publisher/OU=Development/CN=$DOMAIN"

# Generate self-signed certificate
openssl x509 -req -days 365 -in $CERT_DIR/$DOMAIN.csr -signkey $CERT_DIR/$DOMAIN.key -out $CERT_DIR/$DOMAIN.crt

echo "SSL certificates generated for $DOMAIN"
echo "Certificate: $CERT_DIR/$DOMAIN.crt"
echo "Private Key: $CERT_DIR/$DOMAIN.key"
```

##### 2. Hosts File Configuration
```bash
#!/bin/bash
# scripts/setup-hosts.sh

DOMAIN="dev.np-topvitaminsupply.com"
HOSTS_ENTRY="127.0.0.1 $DOMAIN"

# Check if entry already exists
if ! grep -q "$DOMAIN" /etc/hosts; then
    echo "Adding $DOMAIN to /etc/hosts"
    echo "$HOSTS_ENTRY" | sudo tee -a /etc/hosts
else
    echo "$DOMAIN already exists in /etc/hosts"
fi

echo "Hosts file configured for local development"
```

### Startup Scripts

#### 1. Full Stack Unified Startup
```bash
#!/bin/bash
# local-scripts/start-full-stack-unified.sh

set -e

echo "🚀 Starting AGoat Publisher Unified Full Stack Development Environment..."

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
API_DIR="$PROJECT_ROOT/app-api"
FRONTEND_DIR="$PROJECT_ROOT/unified-app"

echo "📁 Project root: $PROJECT_ROOT"
echo "🔧 API directory: $API_DIR"
echo "🎨 Unified App directory: $FRONTEND_DIR"

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down services..."
    if [ ! -z "$API_PID" ]; then
        kill $API_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    echo "✅ Services stopped"
}

trap cleanup EXIT INT TERM

# Clear caches
echo "🧹 Clearing Go build cache and temporary files..."
cd $API_DIR
go clean -cache
go clean -modcache
rm -rf tmp/
echo "✅ API cache cleared"

echo "🧹 Clearing frontend cache..."
cd $FRONTEND_DIR
rm -rf node_modules/.vite
rm -rf dist/
echo "✅ Frontend cache cleared"

# Load environment variables from GCP
echo "☁️  Using GCP project: agoat-publisher-dev"
echo "🔐 Loading secrets from GCP..."

# Set environment variables (these would come from GCP Secret Manager in production)
export DB_HOST="localhost"
export DB_PORT="26257"
export DB_NAME="agoat_publisher"
export DB_USER="agoat_user"
export DB_PASSWORD="your_secure_password"
export DB_SSL_MODE="require"

export APP_BASE_URL="https://dev.np-topvitaminsupply.com"
export APP_PORT="8080"
export LOG_LEVEL="INFO"

export OIDC_CLIENT_ID="4lt0iqap612c9jug55f3a1s69k"
export OIDC_CLIENT_SECRET=""
export OIDC_PROVIDER_DOMAIN="auth.dev.np-topvitaminsupply.com"

echo "✅ Secrets loaded successfully"

# Start API server
echo "🌐 Starting API server on http://localhost:8080..."
cd $API_DIR
echo "🔥 Starting API with hot reload (air)"
air &
API_PID=$!
echo "✅ API server started (PID: $API_PID)"
echo "⚠️  Warning: API server may not be fully started yet"

# Wait a moment for API to start
sleep 3

# Show API logs
echo "📋 API log:"
tail -n 5 api.log 2>/dev/null || echo "No API log found yet"

# Start frontend
echo "🎨 Starting Unified App frontend on https://dev.np-topvitaminsupply.com (port 443)..."
cd $FRONTEND_DIR
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

# Wait for services to start
sleep 5

echo "🎉 AGoat Publisher Unified Full Stack Development Environment is running!"
echo ""
echo "📊 Service Status:"
echo "   🌐 API Server:     https://dev.np-topvitaminsupply.com:8080 (PID: $API_PID)"
echo "   🎨 Frontend:       https://dev.np-topvitaminsupply.com (PID: $FRONTEND_PID)"
echo "   📋 API Logs:       $API_DIR/api.log"
echo "   📋 Frontend Logs:  $FRONTEND_DIR/frontend.log"
echo ""
echo "🔗 Quick Links:"
echo "   📖 Blog Home:      https://dev.np-topvitaminsupply.com"
echo "   🔐 Login:          https://dev.np-topvitaminsupply.com/login"
echo "   📊 Dashboard:      https://dev.np-topvitaminsupply.com/dashboard"
echo "   ✏️  New Post:       https://dev.np-topvitaminsupply.com/new-post"
echo ""
echo "💡 Features:"
echo "   ✅ Single React.js application (no Module Federation)"
echo "   ✅ Modern Vite build system"
echo "   ✅ Radix UI components with Tailwind CSS"
echo "   ✅ Full blog functionality"
echo "   ✅ User authentication"
echo "   ✅ Markdown support with DOMPurify sanitization"
echo ""
echo "🛑 Press Ctrl+C to stop all services"

# Wait for user interrupt
wait
```

#### 2. API-Only Startup
```bash
#!/bin/bash
# local-scripts/start-api.sh

set -e

echo "🚀 Starting AGoat Publisher API Server..."

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
API_DIR="$PROJECT_ROOT/app-api"

cd $API_DIR

# Load environment variables
export DB_HOST="localhost"
export DB_PORT="26257"
export DB_NAME="agoat_publisher"
export DB_USER="agoat_user"
export DB_PASSWORD="your_secure_password"
export DB_SSL_MODE="require"

export APP_BASE_URL="https://dev.np-topvitaminsupply.com"
export APP_PORT="8080"
export LOG_LEVEL="INFO"

# Start API with hot reload
echo "🔥 Starting API with hot reload (air)"
air
```

#### 3. Frontend-Only Startup
```bash
#!/bin/bash
# local-scripts/start-unified-app.sh

set -e

echo "🚀 Starting AGoat Publisher Frontend..."

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/unified-app"

cd $FRONTEND_DIR

# Start frontend development server
echo "🎨 Starting frontend development server..."
npm run dev
```

## Build Processes

### Backend Build

#### Go Build Configuration
```go
// app-api/main.go build configuration
package main

import (
    "crypto/tls"
    "database/sql"
    "encoding/gob"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "strconv"
    "strings"
    "time"

    appconfig "agoat.io/agoat-publisher/config"
    "agoat.io/agoat-publisher/handlers"
    "agoat.io/agoat-publisher/services"
    "github.com/google/uuid"
    "github.com/gorilla/mux"
    "github.com/gorilla/sessions"
    _ "github.com/lib/pq"
)

// Build information
var (
    Version   = "1.0.0"
    BuildTime = "unknown"
    GitCommit = "unknown"
)

func main() {
    // Log build information
    log.Printf("Starting AGoat Publisher API v%s", Version)
    log.Printf("Build time: %s", BuildTime)
    log.Printf("Git commit: %s", GitCommit)
    
    // ... rest of main function
}
```

#### Air Configuration (Hot Reload)
```toml
# app-api/.air.toml
root = "."
testdata_dir = "testdata"
tmp_dir = "tmp"

[build]
  args_bin = []
  bin = "./tmp/main"
  cmd = "go build -o ./tmp/main ."
  delay = 1000
  exclude_dir = ["assets", "tmp", "vendor", "testdata"]
  exclude_file = []
  exclude_regex = ["_test.go"]
  exclude_unchanged = false
  follow_symlink = false
  full_bin = ""
  include_dir = []
  include_ext = ["go", "tpl", "tmpl", "html"]
  include_file = []
  kill_delay = "0s"
  log = "build-errors.log"
  poll = false
  poll_interval = 0
  rerun = false
  rerun_delay = 500
  send_interrupt = false
  stop_on_root = false

[color]
  app = ""
  build = "yellow"
  main = "magenta"
  runner = "green"
  watcher = "cyan"

[log]
  main_only = false
  time = false

[misc]
  clean_on_exit = false

[screen]
  clear_on_rebuild = false
  keep_scroll = true
```

### Frontend Build

#### Vite Build Configuration
```typescript
// unified-app/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 443,
    https: {
      key: '../certs/dev.np-topvitaminsupply.com.key',
      cert: '../certs/dev.np-topvitaminsupply.com.crt',
    },
    host: 'dev.np-topvitaminsupply.com',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/themes', '@radix-ui/react-icons'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})
```

#### Package.json Build Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:prod": "NODE_ENV=production tsc && vite build",
    "preview": "vite preview",
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit"
  }
}
```

## Database Setup

### CockroachDB Configuration

#### Database Initialization
```sql
-- Database setup script
CREATE DATABASE IF NOT EXISTS agoat_publisher;

-- Create user
CREATE USER IF NOT EXISTS agoat_user WITH PASSWORD 'your_secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE agoat_publisher TO agoat_user;

-- Connect to database
\c agoat_publisher;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

#### Migration Management
```bash
#!/bin/bash
# Database migration script

DB_HOST="localhost"
DB_PORT="26257"
DB_NAME="agoat_publisher"
DB_USER="agoat_user"
DB_PASSWORD="your_secure_password"

# Run migrations
echo "Running database migrations..."
cd app-api/migrations

for migration in *.sql; do
    echo "Applying migration: $migration"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $migration
done

echo "✅ Database migrations completed"
```

## SSL/TLS Configuration

### Development SSL Setup

#### Certificate Generation
```bash
#!/bin/bash
# Generate development SSL certificates

DOMAIN="dev.np-topvitaminsupply.com"
CERT_DIR="certs"

# Create certificate directory
mkdir -p $CERT_DIR

# Generate private key
openssl genrsa -out $CERT_DIR/$DOMAIN.key 2048

# Generate certificate signing request
openssl req -new -key $CERT_DIR/$DOMAIN.key -out $CERT_DIR/$DOMAIN.csr \
    -subj "/C=US/ST=CA/L=San Francisco/O=AGoat Publisher/OU=Development/CN=$DOMAIN"

# Generate self-signed certificate
openssl x509 -req -days 365 -in $CERT_DIR/$DOMAIN.csr \
    -signkey $CERT_DIR/$DOMAIN.key -out $CERT_DIR/$DOMAIN.crt

# Set proper permissions
chmod 600 $CERT_DIR/$DOMAIN.key
chmod 644 $CERT_DIR/$DOMAIN.crt

echo "SSL certificates generated for $DOMAIN"
```

#### Go TLS Configuration
```go
// TLS configuration in main.go
func setupTLS() *tls.Config {
    return &tls.Config{
        MinVersion:               tls.VersionTLS12,
        CurvePreferences:         []tls.CurveID{tls.CurveP521, tls.CurveP384, tls.CurveP256},
        PreferServerCipherSuites: true,
        CipherSuites: []uint16{
            tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
            tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,
            tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
        },
    }
}
```

## Environment Configuration

### Environment Variables

#### Development Environment
```bash
# .env.development
NODE_ENV=development
VITE_API_BASE_URL=https://dev.np-topvitaminsupply.com:8080
VITE_APP_NAME=AGoat Publisher
VITE_APP_VERSION=1.0.0

# Database
DB_HOST=localhost
DB_PORT=26257
DB_NAME=agoat_publisher
DB_USER=agoat_user
DB_PASSWORD=your_secure_password
DB_SSL_MODE=require

# Application
APP_BASE_URL=https://dev.np-topvitaminsupply.com
APP_PORT=8080
LOG_LEVEL=INFO

# OIDC Configuration
OIDC_CLIENT_ID=4lt0iqap612c9jug55f3a1s69k
OIDC_CLIENT_SECRET=
OIDC_PROVIDER_DOMAIN=auth.dev.np-topvitaminsupply.com
```

#### Production Environment
```bash
# .env.production
NODE_ENV=production
VITE_API_BASE_URL=https://api.agoat-publisher.com
VITE_APP_NAME=AGoat Publisher
VITE_APP_VERSION=1.0.0

# Database
DB_HOST=your-cockroachdb-host
DB_PORT=26257
DB_NAME=agoat_publisher
DB_USER=agoat_user
DB_PASSWORD=your_secure_production_password
DB_SSL_MODE=require

# Application
APP_BASE_URL=https://agoat-publisher.com
APP_PORT=8080
LOG_LEVEL=INFO

# OIDC Configuration
OIDC_CLIENT_ID=your_production_client_id
OIDC_CLIENT_SECRET=your_production_client_secret
OIDC_PROVIDER_DOMAIN=auth.agoat-publisher.com
```

## Docker Configuration

### Backend Dockerfile
```dockerfile
# app-api/Dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates
WORKDIR /root/

# Copy the binary
COPY --from=builder /app/main .

# Copy configuration files
COPY --from=builder /app/config ./config
COPY --from=builder /app/migrations ./migrations

# Expose port
EXPOSE 8080

# Run the application
CMD ["./main"]
```

### Frontend Dockerfile
```dockerfile
# unified-app/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: ./app-api
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=cockroachdb
      - DB_PORT=26257
      - DB_NAME=agoat_publisher
      - DB_USER=agoat_user
      - DB_PASSWORD=secure_password
      - DB_SSL_MODE=require
      - APP_BASE_URL=https://localhost
      - APP_PORT=8080
      - LOG_LEVEL=INFO
    depends_on:
      - cockroachdb
    volumes:
      - ./app-api/config:/app/config
      - ./app-api/migrations:/app/migrations

  frontend:
    build: ./unified-app
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=https://localhost:8080
    depends_on:
      - api

  cockroachdb:
    image: cockroachdb/cockroach:v23.1.0
    command: start-single-node --insecure --listen-addr=0.0.0.0
    ports:
      - "26257:26257"
      - "8080:8080"
    volumes:
      - cockroachdb-data:/cockroach/cockroach-data

volumes:
  cockroachdb-data:
```

## Production Deployment

### Cloud Infrastructure

#### Google Cloud Platform Setup
```bash
#!/bin/bash
# Production deployment script

# Set variables
PROJECT_ID="agoat-publisher-prod"
REGION="us-central1"
ZONE="us-central1-a"

# Create project
gcloud projects create $PROJECT_ID

# Set project
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Create VPC network
gcloud compute networks create agoat-vpc --subnet-mode=custom

# Create subnet
gcloud compute networks subnets create agoat-subnet \
    --network=agoat-vpc \
    --range=10.0.0.0/24 \
    --region=$REGION

# Create firewall rules
gcloud compute firewall-rules create allow-http \
    --network=agoat-vpc \
    --allow=tcp:80,tcp:443 \
    --source-ranges=0.0.0.0/0

# Create GKE cluster
gcloud container clusters create agoat-cluster \
    --zone=$ZONE \
    --network=agoat-vpc \
    --subnetwork=agoat-subnet \
    --num-nodes=3 \
    --enable-autoscaling \
    --min-nodes=1 \
    --max-nodes=10 \
    --enable-autorepair \
    --enable-autoupgrade

# Get cluster credentials
gcloud container clusters get-credentials agoat-cluster --zone=$ZONE
```

#### Kubernetes Manifests

##### API Deployment
```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agoat-api
  labels:
    app: agoat-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agoat-api
  template:
    metadata:
      labels:
        app: agoat-api
    spec:
      containers:
      - name: api
        image: gcr.io/agoat-publisher-prod/api:latest
        ports:
        - containerPort: 8080
        env:
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: password
        - name: OIDC_CLIENT_SECRET
          valueFrom:
            secretKeyRef:
              name: oidc-secrets
              key: client-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: agoat-api-service
spec:
  selector:
    app: agoat-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: ClusterIP
```

##### Frontend Deployment
```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agoat-frontend
  labels:
    app: agoat-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agoat-frontend
  template:
    metadata:
      labels:
        app: agoat-frontend
    spec:
      containers:
      - name: frontend
        image: gcr.io/agoat-publisher-prod/frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: agoat-frontend-service
spec:
  selector:
    app: agoat-frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP
```

##### Ingress Configuration
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: agoat-ingress
  annotations:
    kubernetes.io/ingress.class: "gce"
    kubernetes.io/ingress.global-static-ip-name: "agoat-ip"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - agoat-publisher.com
    - api.agoat-publisher.com
    secretName: agoat-tls
  rules:
  - host: agoat-publisher.com
    http:
      paths:
      - path: /api/*
        pathType: Prefix
        backend:
          service:
            name: agoat-api-service
            port:
              number: 80
      - path: /*
        pathType: Prefix
        backend:
          service:
            name: agoat-frontend-service
            port:
              number: 80
  - host: api.agoat-publisher.com
    http:
      paths:
      - path: /*
        pathType: Prefix
        backend:
          service:
            name: agoat-api-service
            port:
              number: 80
```

### CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

env:
  PROJECT_ID: agoat-publisher-prod
  GKE_CLUSTER: agoat-cluster
  GKE_ZONE: us-central1-a
  DEPLOYMENT_NAME: agoat-api

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Go
      uses: actions/setup-go@v3
      with:
        go-version: 1.21
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd app-api && go mod download
        cd ../unified-app && npm ci
    
    - name: Run tests
      run: |
        cd app-api && go test ./...
        cd ../unified-app && npm run test
    
    - name: Build
      run: |
        cd app-api && go build -o main .
        cd ../unified-app && npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Cloud SDK
      uses: google-github-actions/setup-gcloud@v0
      with:
        project_id: ${{ env.PROJECT_ID }}
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        export_default_credentials: true
    
    - name: Configure Docker
      run: gcloud auth configure-docker
    
    - name: Build and push API image
      run: |
        cd app-api
        docker build -t gcr.io/${{ env.PROJECT_ID }}/api:${{ github.sha }} .
        docker push gcr.io/${{ env.PROJECT_ID }}/api:${{ github.sha }}
    
    - name: Build and push Frontend image
      run: |
        cd unified-app
        docker build -t gcr.io/${{ env.PROJECT_ID }}/frontend:${{ github.sha }} .
        docker push gcr.io/${{ env.PROJECT_ID }}/frontend:${{ github.sha }}
    
    - name: Deploy to GKE
      run: |
        gcloud container clusters get-credentials ${{ env.GKE_CLUSTER }} --zone ${{ env.GKE_ZONE }}
        kubectl set image deployment/${{ env.DEPLOYMENT_NAME }} api=gcr.io/${{ env.PROJECT_ID }}/api:${{ github.sha }}
        kubectl set image deployment/agoat-frontend frontend=gcr.io/${{ env.PROJECT_ID }}/frontend:${{ github.sha }}
        kubectl rollout status deployment/${{ env.DEPLOYMENT_NAME }}
        kubectl rollout status deployment/agoat-frontend
```

## Monitoring and Logging

### Application Monitoring
```yaml
# k8s/monitoring.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
    - job_name: 'agoat-api'
      static_configs:
      - targets: ['agoat-api-service:80']
      metrics_path: /metrics
    - job_name: 'agoat-frontend'
      static_configs:
      - targets: ['agoat-frontend-service:80']
      metrics_path: /metrics
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
      volumes:
      - name: config
        configMap:
          name: prometheus-config
```

### Logging Configuration
```yaml
# k8s/logging.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/*agoat*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
      format json
      time_key time
      time_format %Y-%m-%dT%H:%M:%S.%NZ
    </source>
    <match kubernetes.**>
      @type elasticsearch
      host elasticsearch.logging.svc.cluster.local
      port 9200
      index_name agoat-logs
      type_name _doc
    </match>
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
  namespace: logging
spec:
  selector:
    matchLabels:
      app: fluentd
  template:
    metadata:
      labels:
        app: fluentd
    spec:
      containers:
      - name: fluentd
        image: fluent/fluentd-kubernetes-daemonset:v1-debian-elasticsearch
        volumeMounts:
        - name: config
          mountPath: /fluentd/etc
        - name: varlog
          mountPath: /var/log
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
      volumes:
      - name: config
        configMap:
          name: fluentd-config
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
```

## Backup and Recovery

### Database Backup
```bash
#!/bin/bash
# Database backup script

DB_HOST="your-cockroachdb-host"
DB_PORT="26257"
DB_NAME="agoat_publisher"
DB_USER="agoat_user"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
cockroach dump $DB_NAME \
    --host=$DB_HOST:$DB_PORT \
    --user=$DB_USER \
    --insecure \
    --dump-mode=full \
    > $BACKUP_DIR/agoat_publisher_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/agoat_publisher_$DATE.sql

# Upload to cloud storage
gsutil cp $BACKUP_DIR/agoat_publisher_$DATE.sql.gz gs://agoat-backups/

# Clean up old backups (keep last 30 days)
find $BACKUP_DIR -name "agoat_publisher_*.sql.gz" -mtime +30 -delete

echo "Backup completed: agoat_publisher_$DATE.sql.gz"
```

### Application Backup
```bash
#!/bin/bash
# Application backup script

BACKUP_DIR="/backups/app"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup configuration files
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
    app-api/config/ \
    unified-app/public/

# Backup SSL certificates
tar -czf $BACKUP_DIR/certs_$DATE.tar.gz \
    certs/

# Upload to cloud storage
gsutil cp $BACKUP_DIR/config_$DATE.tar.gz gs://agoat-backups/
gsutil cp $BACKUP_DIR/certs_$DATE.tar.gz gs://agoat-backups/

# Clean up old backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Application backup completed"
```

## Security Considerations

### Network Security
- VPC with private subnets for database
- Firewall rules restricting access
- SSL/TLS encryption for all communications
- Regular security updates and patches

### Secret Management
- Google Secret Manager for production secrets
- Environment variables for development
- No secrets in code or configuration files
- Regular secret rotation

### Access Control
- IAM roles and permissions
- Service account authentication
- Network policies in Kubernetes
- Regular access reviews

## Performance Optimization

### Caching Strategy
- Redis for session storage
- CDN for static assets
- Database query optimization
- Application-level caching

### Scaling
- Horizontal pod autoscaling
- Database read replicas
- Load balancing
- Resource monitoring and alerting

## Disaster Recovery

### Recovery Procedures
1. **Database Recovery**: Restore from latest backup
2. **Application Recovery**: Redeploy from container images
3. **Configuration Recovery**: Restore from backup
4. **SSL Certificate Recovery**: Reissue certificates

### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 1 hour
- **Backup Frequency**: Every 6 hours
- **Retention Period**: 30 days

## Maintenance Procedures

### Regular Maintenance
- Weekly security updates
- Monthly dependency updates
- Quarterly security audits
- Annual disaster recovery testing

### Monitoring and Alerting
- Application health checks
- Database performance monitoring
- Error rate monitoring
- Resource utilization alerts
