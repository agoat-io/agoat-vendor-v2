# Configuration Management Implementation

## Overview
This document describes the configuration management system for the AGoat Publisher application, including configuration files, environment variables, secret management, and configuration loading mechanisms.

## Configuration Architecture

### Configuration Hierarchy
1. **Environment Variables** (Highest Priority)
2. **Configuration Files** (JSON-based)
3. **Default Values** (Hardcoded fallbacks)

### Configuration Sources
- **Development**: Local JSON files + environment variables
- **Production**: GCP Secret Manager + environment variables
- **Testing**: Test-specific configuration files

## Backend Configuration

### Application Configuration

#### Configuration Structure
```go
// app-api/config/app_config.go
type AppConfig struct {
    App    AppSettings    `json:"app"`
    Server ServerSettings `json:"server"`
    Database DatabaseSettings `json:"database"`
    Logging LoggingSettings `json:"logging"`
}

type AppSettings struct {
    Name           string   `json:"name"`
    Version        string   `json:"version"`
    BaseURL        string   `json:"base_url"`
    AllowedOrigins []string `json:"allowed_origins"`
}

type ServerSettings struct {
    Port string `json:"port"`
    Host string `json:"host"`
    SSL  SSLSettings `json:"ssl"`
}

type SSLSettings struct {
    Enabled  bool   `json:"enabled"`
    CertFile string `json:"cert_file"`
    KeyFile  string `json:"key_file"`
}

type DatabaseSettings struct {
    Host     string `json:"host"`
    Port     int    `json:"port"`
    Name     string `json:"name"`
    SSLMode  string `json:"ssl_mode"`
}

type LoggingSettings struct {
    Level  string `json:"level"`
    Format string `json:"format"`
}
```

#### Configuration Loading
```go
// app-api/config/app_config.go
func LoadAppConfig() (*AppConfig, error) {
    config := &AppConfig{}
    
    // Load from JSON file first
    configFile := os.Getenv("APP_CONFIG_FILE")
    if configFile == "" {
        configFile = "config/app-config.json"
    }
    
    if _, err := os.Stat(configFile); err == nil {
        data, err := os.ReadFile(configFile)
        if err != nil {
            return nil, fmt.Errorf("failed to read config file: %w", err)
        }
        
        if err := json.Unmarshal(data, config); err != nil {
            return nil, fmt.Errorf("failed to parse config file: %w", err)
        }
    }
    
    // Override with environment variables
    if appName := os.Getenv("APP_NAME"); appName != "" {
        config.App.Name = appName
    }
    if baseURL := os.Getenv("APP_BASE_URL"); baseURL != "" {
        config.App.BaseURL = baseURL
    }
    if port := os.Getenv("APP_PORT"); port != "" {
        config.Server.Port = port
    }
    if host := os.Getenv("APP_HOST"); host != "" {
        config.Server.Host = host
    }
    
    // Database configuration from environment
    if dbHost := os.Getenv("DB_HOST"); dbHost != "" {
        config.Database.Host = dbHost
    }
    if dbPort := os.Getenv("DB_PORT"); dbPort != "" {
        if port, err := strconv.Atoi(dbPort); err == nil {
            config.Database.Port = port
        }
    }
    if dbName := os.Getenv("DB_NAME"); dbName != "" {
        config.Database.Name = dbName
    }
    if dbSSLMode := os.Getenv("DB_SSL_MODE"); dbSSLMode != "" {
        config.Database.SSLMode = dbSSLMode
    }
    
    // Logging configuration
    if logLevel := os.Getenv("LOG_LEVEL"); logLevel != "" {
        config.Logging.Level = logLevel
    }
    if logFormat := os.Getenv("LOG_FORMAT"); logFormat != "" {
        config.Logging.Format = logFormat
    }
    
    return config, nil
}
```

### OIDC Configuration

#### OIDC Configuration Structure
```go
// app-api/config/oidc_config.go
type OIDCConfig struct {
    Providers []OIDCProvider `json:"providers"`
}

type OIDCProvider struct {
    SystemName           string                 `json:"system_name"`
    DisplayName          string                 `json:"display_name"`
    ProviderType         string                 `json:"provider_type"`
    IsActive             bool                   `json:"is_active"`
    IsDefaultForType     bool                   `json:"is_default_for_type"`
    ProviderInstanceID   string                 `json:"provider_instance_id"`
    ProviderEnvironment  string                 `json:"provider_environment"`
    ProviderRegion       string                 `json:"provider_region"`
    ProviderDomain       string                 `json:"provider_domain"`
    JWKSURL              string                 `json:"jwks_url"`
    IssuerURL            string                 `json:"issuer_url"`
    OIDCDiscoveryURL     string                 `json:"oidc_discovery_url"`
    AuthorizationEndpoint string                `json:"authorization_endpoint"`
    TokenEndpoint        string                 `json:"token_endpoint"`
    UserInfoEndpoint     string                 `json:"userinfo_endpoint"`
    EndSessionEndpoint   string                 `json:"end_session_endpoint"`
    ClientID             string                 `json:"client_id"`
    ClientSecret         string                 `json:"client_secret"`
    Scopes               string                 `json:"scopes"`
    ResponseType         string                 `json:"response_type"`
    ResponseMode         string                 `json:"response_mode"`
    CodeChallengeMethod  string                 `json:"code_challenge_method"`
    SupportedClaims      map[string]string      `json:"supported_claims"`
    ProviderMetadata     map[string]interface{} `json:"provider_metadata"`
    RedirectURI          string                 `json:"redirect_uri"`
}
```

#### OIDC Configuration Loading
```go
// app-api/config/oidc_config.go
func LoadOIDCConfig() (*OIDCConfig, error) {
    config := &OIDCConfig{}
    
    // Load from JSON file
    configFile := os.Getenv("OIDC_CONFIG_FILE")
    if configFile == "" {
        configFile = "config/oidc-config.json"
    }
    
    data, err := os.ReadFile(configFile)
    if err != nil {
        return nil, fmt.Errorf("failed to read OIDC config file: %w", err)
    }
    
    if err := json.Unmarshal(data, config); err != nil {
        return nil, fmt.Errorf("failed to parse OIDC config file: %w", err)
    }
    
    // Override with environment variables for active provider
    for i, provider := range config.Providers {
        if provider.IsActive {
            if clientID := os.Getenv("OIDC_CLIENT_ID"); clientID != "" {
                config.Providers[i].ClientID = clientID
            }
            if clientSecret := os.Getenv("OIDC_CLIENT_SECRET"); clientSecret != "" {
                config.Providers[i].ClientSecret = clientSecret
            }
            if providerDomain := os.Getenv("OIDC_PROVIDER_DOMAIN"); providerDomain != "" {
                config.Providers[i].ProviderDomain = providerDomain
            }
            if jwksURL := os.Getenv("OIDC_JWKS_URL"); jwksURL != "" {
                config.Providers[i].JWKSURL = jwksURL
            }
            if issuerURL := os.Getenv("OIDC_ISSUER_URL"); issuerURL != "" {
                config.Providers[i].IssuerURL = issuerURL
            }
        }
    }
    
    return config, nil
}

func (c *OIDCConfig) GetActiveProvider() (*OIDCProvider, error) {
    for _, provider := range c.Providers {
        if provider.IsActive {
            return &provider, nil
        }
    }
    return nil, fmt.Errorf("no active OIDC provider found")
}
```

## Configuration Files

### Application Configuration (app-config.json)
```json
{
  "app": {
    "name": "AGoat Publisher",
    "version": "1.0.0",
    "base_url": "https://dev.np-topvitaminsupply.com",
    "allowed_origins": [
      "https://dev.np-topvitaminsupply.com",
      "https://localhost:3000"
    ]
  },
  "server": {
    "port": "8080",
    "host": "0.0.0.0",
    "ssl": {
      "enabled": true,
      "cert_file": "certs/dev.np-topvitaminsupply.com.crt",
      "key_file": "certs/dev.np-topvitaminsupply.com.key"
    }
  },
  "database": {
    "host": "localhost",
    "port": 26257,
    "name": "agoat_publisher",
    "ssl_mode": "require"
  },
  "logging": {
    "level": "INFO",
    "format": "json"
  }
}
```

### OIDC Configuration (oidc-config.json)
```json
{
  "providers": [
    {
      "system_name": "cognito",
      "display_name": "AWS Cognito Dev",
      "provider_type": "oidc",
      "is_active": true,
      "is_default_for_type": true,
      "provider_instance_id": "us-east-1_FJUcN8W07",
      "provider_environment": "development",
      "provider_region": "us-east-1",
      "provider_domain": "auth.dev.np-topvitaminsupply.com",
      "jwks_url": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07/.well-known/jwks.json",
      "issuer_url": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07",
      "oidc_discovery_url": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07/.well-known/openid_configuration",
      "authorization_endpoint": "https://auth.dev.np-topvitaminsupply.com/login",
      "token_endpoint": "https://auth.dev.np-topvitaminsupply.com/oauth2/token",
      "userinfo_endpoint": "https://auth.dev.np-topvitaminsupply.com/oauth2/userInfo",
      "end_session_endpoint": "https://auth.dev.np-topvitaminsupply.com/logout",
      "client_id": "4lt0iqap612c9jug55f3a1s69k",
      "client_secret": "",
      "scopes": "email openid phone",
      "response_type": "code",
      "response_mode": "query",
      "code_challenge_method": "S256",
      "supported_claims": {
        "sub": "string",
        "email": "string",
        "email_verified": "boolean",
        "phone_number": "string",
        "phone_number_verified": "boolean",
        "given_name": "string",
        "family_name": "string",
        "name": "string",
        "preferred_username": "string",
        "cognito:username": "string"
      },
      "provider_metadata": {
        "user_pool_id": "us-east-1_FJUcN8W07",
        "region": "us-east-1",
        "domain": "auth.dev.np-topvitaminsupply.com"
      },
      "redirect_uri": "https://dev.np-topvitaminsupply.com/auth/callback"
    }
  ]
}
```

### Thorne Integration Configuration
```json
{
  "thorne": {
    "api_base_url": "https://api.thorne.com",
    "client_id": "your_thorne_client_id",
    "client_secret": "your_thorne_client_secret",
    "webhook_secret": "your_webhook_secret",
    "categories": [
      {
        "id": "1",
        "name": "Vitamins",
        "description": "Essential vitamins and minerals"
      },
      {
        "id": "2",
        "name": "Minerals",
        "description": "Essential minerals and trace elements"
      }
    ],
    "settings": {
      "auto_sync": true,
      "sync_interval": "1h",
      "max_retries": 3,
      "timeout": "30s"
    }
  }
}
```

## Environment Variables

### Development Environment
```bash
# Application Configuration
APP_NAME="AGoat Publisher"
APP_VERSION="1.0.0"
APP_BASE_URL="https://dev.np-topvitaminsupply.com"
APP_PORT="8080"
APP_HOST="0.0.0.0"

# Database Configuration
DB_HOST="localhost"
DB_PORT="26257"
DB_NAME="agoat_publisher"
DB_USER="agoat_user"
DB_PASSWORD="your_secure_password"
DB_SSL_MODE="require"

# OIDC Configuration
OIDC_CLIENT_ID="4lt0iqap612c9jug55f3a1s69k"
OIDC_CLIENT_SECRET=""
OIDC_PROVIDER_DOMAIN="auth.dev.np-topvitaminsupply.com"
OIDC_JWKS_URL="https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07/.well-known/jwks.json"
OIDC_ISSUER_URL="https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07"

# Logging Configuration
LOG_LEVEL="INFO"
LOG_FORMAT="json"

# SSL Configuration
SSL_ENABLED="true"
SSL_CERT_FILE="certs/dev.np-topvitaminsupply.com.crt"
SSL_KEY_FILE="certs/dev.np-topvitaminsupply.com.key"

# Configuration Files
APP_CONFIG_FILE="config/app-config.json"
OIDC_CONFIG_FILE="config/oidc-config.json"
```

### Production Environment
```bash
# Application Configuration
APP_NAME="AGoat Publisher"
APP_VERSION="1.0.0"
APP_BASE_URL="https://agoat-publisher.com"
APP_PORT="8080"
APP_HOST="0.0.0.0"

# Database Configuration (from GCP Secret Manager)
DB_HOST="your-cockroachdb-host"
DB_PORT="26257"
DB_NAME="agoat_publisher"
DB_USER="agoat_user"
DB_PASSWORD="your_secure_production_password"
DB_SSL_MODE="require"

# OIDC Configuration (from GCP Secret Manager)
OIDC_CLIENT_ID="your_production_client_id"
OIDC_CLIENT_SECRET="your_production_client_secret"
OIDC_PROVIDER_DOMAIN="auth.agoat-publisher.com"
OIDC_JWKS_URL="https://cognito-idp.us-east-1.amazonaws.com/your-pool-id/.well-known/jwks.json"
OIDC_ISSUER_URL="https://cognito-idp.us-east-1.amazonaws.com/your-pool-id"

# Logging Configuration
LOG_LEVEL="INFO"
LOG_FORMAT="json"

# SSL Configuration (from GCP Secret Manager)
SSL_ENABLED="true"
SSL_CERT_FILE="/etc/ssl/certs/agoat-publisher.crt"
SSL_KEY_FILE="/etc/ssl/private/agoat-publisher.key"

# Configuration Files
APP_CONFIG_FILE="/app/config/app-config.json"
OIDC_CONFIG_FILE="/app/config/oidc-config.json"
```

## Frontend Configuration

### Environment Variables
```bash
# .env.development
NODE_ENV=development
VITE_API_BASE_URL=https://dev.np-topvitaminsupply.com:8080
VITE_APP_NAME=AGoat Publisher
VITE_APP_VERSION=1.0.0
VITE_APP_BASE_URL=https://dev.np-topvitaminsupply.com
```

```bash
# .env.production
NODE_ENV=production
VITE_API_BASE_URL=https://api.agoat-publisher.com
VITE_APP_NAME=AGoat Publisher
VITE_APP_VERSION=1.0.0
VITE_APP_BASE_URL=https://agoat-publisher.com
```

### Vite Configuration
```typescript
// unified-app/vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
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
    },
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION),
      __APP_NAME__: JSON.stringify(env.VITE_APP_NAME),
    },
  }
})
```

## Secret Management

### GCP Secret Manager Integration
```go
// app-api/config/secrets.go
import (
    "context"
    "fmt"
    "os"
    
    secretmanager "cloud.google.com/go/secretmanager/apiv1"
    "cloud.google.com/go/secretmanager/apiv1/secretmanagerpb"
)

type SecretManager struct {
    client *secretmanager.Client
    projectID string
}

func NewSecretManager(projectID string) (*SecretManager, error) {
    ctx := context.Background()
    client, err := secretmanager.NewClient(ctx)
    if err != nil {
        return nil, fmt.Errorf("failed to create secret manager client: %w", err)
    }
    
    return &SecretManager{
        client: client,
        projectID: projectID,
    }, nil
}

func (sm *SecretManager) GetSecret(secretName string) (string, error) {
    ctx := context.Background()
    
    req := &secretmanagerpb.AccessSecretVersionRequest{
        Name: fmt.Sprintf("projects/%s/secrets/%s/versions/latest", sm.projectID, secretName),
    }
    
    result, err := sm.client.AccessSecretVersion(ctx, req)
    if err != nil {
        return "", fmt.Errorf("failed to access secret: %w", err)
    }
    
    return string(result.Payload.Data), nil
}

func LoadSecretsFromGCP() error {
    projectID := os.Getenv("GCP_PROJECT_ID")
    if projectID == "" {
        return fmt.Errorf("GCP_PROJECT_ID environment variable not set")
    }
    
    sm, err := NewSecretManager(projectID)
    if err != nil {
        return err
    }
    
    // Load database password
    if dbPassword, err := sm.GetSecret("db-password"); err == nil {
        os.Setenv("DB_PASSWORD", dbPassword)
    }
    
    // Load OIDC client secret
    if oidcSecret, err := sm.GetSecret("oidc-client-secret"); err == nil {
        os.Setenv("OIDC_CLIENT_SECRET", oidcSecret)
    }
    
    // Load SSL certificate
    if sslCert, err := sm.GetSecret("ssl-certificate"); err == nil {
        os.Setenv("SSL_CERT_CONTENT", sslCert)
    }
    
    // Load SSL private key
    if sslKey, err := sm.GetSecret("ssl-private-key"); err == nil {
        os.Setenv("SSL_KEY_CONTENT", sslKey)
    }
    
    return nil
}
```

### Secret Manager Setup Script
```bash
#!/bin/bash
# scripts/setup-secrets.sh

PROJECT_ID="agoat-publisher-dev"

# Create secrets in GCP Secret Manager
echo "Creating secrets in GCP Secret Manager..."

# Database password
echo -n "your_secure_password" | gcloud secrets create db-password --data-file=- --project=$PROJECT_ID

# OIDC client secret
echo -n "your_oidc_client_secret" | gcloud secrets create oidc-client-secret --data-file=- --project=$PROJECT_ID

# SSL certificate
gcloud secrets create ssl-certificate --data-file=certs/dev.np-topvitaminsupply.com.crt --project=$PROJECT_ID

# SSL private key
gcloud secrets create ssl-private-key --data-file=certs/dev.np-topvitaminsupply.com.key --project=$PROJECT_ID

echo "Secrets created successfully"
```

## Configuration Validation

### Configuration Validation
```go
// app-api/config/validation.go
import (
    "fmt"
    "net/url"
    "strings"
)

func ValidateAppConfig(config *AppConfig) error {
    // Validate app settings
    if config.App.Name == "" {
        return fmt.Errorf("app name is required")
    }
    if config.App.Version == "" {
        return fmt.Errorf("app version is required")
    }
    if config.App.BaseURL == "" {
        return fmt.Errorf("app base URL is required")
    }
    
    // Validate base URL format
    if _, err := url.Parse(config.App.BaseURL); err != nil {
        return fmt.Errorf("invalid base URL format: %w", err)
    }
    
    // Validate allowed origins
    for _, origin := range config.App.AllowedOrigins {
        if _, err := url.Parse(origin); err != nil {
            return fmt.Errorf("invalid allowed origin format: %w", err)
        }
    }
    
    // Validate server settings
    if config.Server.Port == "" {
        return fmt.Errorf("server port is required")
    }
    
    // Validate database settings
    if config.Database.Host == "" {
        return fmt.Errorf("database host is required")
    }
    if config.Database.Name == "" {
        return fmt.Errorf("database name is required")
    }
    
    // Validate SSL settings
    if config.Server.SSL.Enabled {
        if config.Server.SSL.CertFile == "" {
            return fmt.Errorf("SSL cert file is required when SSL is enabled")
        }
        if config.Server.SSL.KeyFile == "" {
            return fmt.Errorf("SSL key file is required when SSL is enabled")
        }
    }
    
    return nil
}

func ValidateOIDCConfig(config *OIDCConfig) error {
    if len(config.Providers) == 0 {
        return fmt.Errorf("at least one OIDC provider is required")
    }
    
    activeProviders := 0
    for i, provider := range config.Providers {
        if provider.IsActive {
            activeProviders++
            
            // Validate required fields
            if provider.SystemName == "" {
                return fmt.Errorf("provider %d: system name is required", i)
            }
            if provider.ClientID == "" {
                return fmt.Errorf("provider %d: client ID is required", i)
            }
            if provider.AuthorizationEndpoint == "" {
                return fmt.Errorf("provider %d: authorization endpoint is required", i)
            }
            if provider.TokenEndpoint == "" {
                return fmt.Errorf("provider %d: token endpoint is required", i)
            }
            if provider.JWKSURL == "" {
                return fmt.Errorf("provider %d: JWKS URL is required", i)
            }
            
            // Validate URL formats
            if _, err := url.Parse(provider.AuthorizationEndpoint); err != nil {
                return fmt.Errorf("provider %d: invalid authorization endpoint: %w", i, err)
            }
            if _, err := url.Parse(provider.TokenEndpoint); err != nil {
                return fmt.Errorf("provider %d: invalid token endpoint: %w", i, err)
            }
            if _, err := url.Parse(provider.JWKSURL); err != nil {
                return fmt.Errorf("provider %d: invalid JWKS URL: %w", i, err)
            }
        }
    }
    
    if activeProviders == 0 {
        return fmt.Errorf("at least one active OIDC provider is required")
    }
    
    return nil
}
```

## Configuration Loading in Main Application

### Main Application Configuration Loading
```go
// app-api/main.go
func main() {
    // Load application configuration
    appConfig, err := config.LoadAppConfig()
    if err != nil {
        log.Fatalf("Failed to load app config: %v", err)
    }
    
    // Validate application configuration
    if err := config.ValidateAppConfig(appConfig); err != nil {
        log.Fatalf("Invalid app config: %v", err)
    }
    
    // Load OIDC configuration
    oidcConfig, err := config.LoadOIDCConfig()
    if err != nil {
        log.Fatalf("Failed to load OIDC config: %v", err)
    }
    
    // Validate OIDC configuration
    if err := config.ValidateOIDCConfig(oidcConfig); err != nil {
        log.Fatalf("Invalid OIDC config: %v", err)
    }
    
    // Load secrets from GCP in production
    if os.Getenv("ENVIRONMENT") == "production" {
        if err := config.LoadSecretsFromGCP(); err != nil {
            log.Fatalf("Failed to load secrets from GCP: %v", err)
        }
    }
    
    // Create application instance
    app := &App{
        config: appConfig,
        oidcConfig: oidcConfig,
    }
    
    // Initialize and start server
    if err := app.Initialize(); err != nil {
        log.Fatalf("Failed to initialize app: %v", err)
    }
    
    if err := app.Start(); err != nil {
        log.Fatalf("Failed to start app: %v", err)
    }
}
```

## Configuration Management Best Practices

### Security
- Never commit secrets to version control
- Use environment variables for sensitive data
- Implement proper secret rotation
- Use least privilege access for secrets

### Environment Separation
- Maintain separate configurations for each environment
- Use environment-specific secret stores
- Validate configuration on startup
- Implement configuration drift detection

### Monitoring
- Log configuration loading events
- Monitor configuration changes
- Alert on configuration validation failures
- Track configuration usage metrics

### Documentation
- Document all configuration options
- Provide configuration examples
- Maintain configuration change logs
- Include troubleshooting guides

## Configuration Deployment

### Configuration Deployment Script
```bash
#!/bin/bash
# scripts/deploy-config.sh

ENVIRONMENT=$1
if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: $0 <environment>"
    echo "Environments: development, staging, production"
    exit 1
fi

echo "Deploying configuration for environment: $ENVIRONMENT"

# Copy environment-specific configuration files
cp "config/app-config.$ENVIRONMENT.json" "config/app-config.json"
cp "config/oidc-config.$ENVIRONMENT.json" "config/oidc-config.json"

# Set environment variables
export ENVIRONMENT=$ENVIRONMENT

# Validate configuration
go run scripts/validate-config.go

if [ $? -eq 0 ]; then
    echo "Configuration validation passed"
else
    echo "Configuration validation failed"
    exit 1
fi

echo "Configuration deployed successfully"
```

### Configuration Validation Script
```go
// scripts/validate-config.go
package main

import (
    "fmt"
    "log"
    "os"
    
    "agoat.io/agoat-publisher/config"
)

func main() {
    // Load and validate app config
    appConfig, err := config.LoadAppConfig()
    if err != nil {
        log.Fatalf("Failed to load app config: %v", err)
    }
    
    if err := config.ValidateAppConfig(appConfig); err != nil {
        log.Fatalf("Invalid app config: %v", err)
    }
    
    // Load and validate OIDC config
    oidcConfig, err := config.LoadOIDCConfig()
    if err != nil {
        log.Fatalf("Failed to load OIDC config: %v", err)
    }
    
    if err := config.ValidateOIDCConfig(oidcConfig); err != nil {
        log.Fatalf("Invalid OIDC config: %v", err)
    }
    
    fmt.Println("✅ All configuration files are valid")
}
```

This comprehensive configuration management system provides a robust foundation for managing application settings across different environments while maintaining security and flexibility.
