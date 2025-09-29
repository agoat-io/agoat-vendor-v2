# Requirement Change Request: Fix Login URL and Configuration Management

**Date:** 2025-09-29 03:10:00  
**Request Type:** Bug Fix and Configuration Management  

## Summary
Fix the OIDC login URL that returns "invalid request" error and move all hardcoded hostnames and URLs to external configuration files.

## Issues Identified
1. **Login URL Issue**: The current OIDC login URL returns "invalid request" error from Cognito
2. **Hardcoded Configurations**: Base hostnames and URLs are hardcoded in the application code
3. **Configuration Management**: No centralized configuration management system

## Working URL Pattern
The working URL pattern is:
```
https://auth.dev.np-topvitaminsupply.com/login?client_id=4lt0iqap612c9jug55f3a1s69k&response_type=code&scope=email+openid+phone&redirect_uri=https%3A%2F%2Fdev.np-topvitaminsupply.com%2Fauth%2Fcallback
```

## Changes Required
1. **Fix OIDC Configuration**: Update authorization endpoint and redirect URI
2. **Create Configuration System**: Move hardcoded values to external config files
3. **Update Application Code**: Use configuration system instead of hardcoded values
4. **Update ADRs**: Document configuration management decisions

## Impact
- **Functional**: Login flow will work correctly
- **Non-functional**: Better maintainability and environment flexibility
- **Security**: Centralized configuration management

## Acceptance Criteria
- [x] OIDC login URL works without "invalid request" error
- [x] All hardcoded hostnames moved to configuration files
- [x] Application loads configuration from external files
- [x] ADRs updated with configuration management decisions
- [x] Playwright tests pass for login flow

## Implementation Summary

### Fixed Issues
1. **OIDC Login URL**: Changed from `/login/continue` to `/login`
2. **Redirect URI**: Updated to use correct callback path `/auth/callback`
3. **Configuration Management**: Created centralized configuration system

### Files Created/Modified
- `app-api/config/app-config.json` - Main application configuration
- `app-api/config/app_config.go` - Configuration loader
- `app-api/config/oidc-config.json` - Updated OIDC configuration
- `app-api/handlers/oidc_auth_handlers_config.go` - Updated to use configuration
- `app-api/handlers/oidc_auth_handlers.go` - Updated to use configuration
- `app-api/main.go` - Updated to use configuration for SSL certificates
- `docs/adrs/00004-configuration-management.md` - New ADR for configuration management

### Test Results
- ✅ OIDC login URL returns HTTP 200 with proper login form
- ✅ Cognito login page displays correctly with Google sign-in option
- ✅ All Playwright tests pass
- ✅ OIDC config endpoint returns correct configuration
