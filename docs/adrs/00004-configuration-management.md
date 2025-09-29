# ADR-00004: Configuration Management System

**Date:** 2025-09-29  
**Status:** Accepted  
**Context:** Configuration Management  

## Decision

We will implement a centralized configuration management system using JSON configuration files to replace hardcoded values throughout the application.

## Context

The application had several issues:
1. **Hardcoded hostnames and URLs** scattered throughout the codebase
2. **OIDC login URL returning "invalid request"** due to incorrect endpoint configuration
3. **No centralized configuration management** making environment changes difficult
4. **SSL certificate paths hardcoded** in main.go

## Decision Drivers

- **Maintainability**: Centralized configuration makes environment changes easier
- **Security**: Sensitive configuration can be managed separately from code
- **Flexibility**: Different environments can use different configurations
- **Debugging**: Configuration issues are easier to identify and fix

## Considered Options

### Option 1: Environment Variables Only
- **Pros**: Simple, standard approach
- **Cons**: Difficult to manage complex nested configurations, no validation

### Option 2: JSON Configuration Files (Chosen)
- **Pros**: Structured, readable, supports complex configurations, easy validation
- **Cons**: Additional file management required

### Option 3: YAML Configuration Files
- **Pros**: Human-readable, supports comments
- **Cons**: Additional dependency, less common in Go ecosystem

## Implementation

### Configuration Files Structure

```
app-api/config/
├── app-config.json          # Main application configuration
├── oidc-config.json         # OIDC provider configurations
└── app_config.go           # Configuration loader
```

### App Configuration (`app-config.json`)
```json
{
  "app": {
    "base_url": "https://dev.np-topvitaminsupply.com",
    "api_port": "8080",
    "frontend_port": "443"
  },
  "allowed_origins": [
    "https://dev.np-topvitaminsupply.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "https://localhost:443"
  ],
  "default_return_url": "https://dev.np-topvitaminsupply.com/dashboard",
  "ssl": {
    "cert_file": "../certs/dev.np-topvitaminsupply.com.crt",
    "key_file": "../certs/dev.np-topvitaminsupply.com.key"
  }
}
```

### Configuration Loader (`app_config.go`)
- Provides `LoadAppConfig()` function
- Supports fallback paths for different deployment scenarios
- Includes error handling with default values

### Updated Components
1. **OIDC Auth Handlers**: Use configuration for allowed origins and return URLs
2. **Main Application**: Use configuration for SSL certificate paths
3. **OIDC Configuration**: Fixed authorization endpoint and redirect URI

## Consequences

### Positive
- **Centralized Configuration**: All configuration in one place
- **Environment Flexibility**: Easy to change for different environments
- **Better Error Handling**: Graceful fallbacks when configuration fails
- **Fixed Login Issues**: OIDC login now works correctly
- **Maintainability**: Easier to update configuration without code changes

### Negative
- **Additional Complexity**: More files to manage
- **Runtime Configuration Loading**: Slight performance overhead
- **File Dependencies**: Application depends on configuration files

### Risks
- **Configuration File Missing**: Mitigated by fallback values
- **Invalid JSON**: Mitigated by error handling and validation
- **Security**: Configuration files should be properly secured in production

## Monitoring

- Log configuration loading errors
- Monitor for fallback configuration usage
- Validate configuration on application startup

## Related ADRs

- ADR-00001: OIDC Authentication System
- ADR-00002: Database Architecture and Multitenancy
- ADR-00003: CIAM System Design

## References

- [OIDC Configuration Fix](https://auth.dev.np-topvitaminsupply.com/login?client_id=4lt0iqap612c9jug55f3a1s69k&response_type=code&scope=email+openid+phone&redirect_uri=https%3A%2F%2Fdev.np-topvitaminsupply.com%2Fauth%2Fcallback)
- Configuration Management Best Practices
- Go Configuration Patterns
