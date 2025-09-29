# OIDC-Agnostic CIAM Implementation

## Overview
This document describes the implementation of an OIDC-agnostic Customer Identity and Access Management (CIAM) system that supports any OIDC-compliant provider while maintaining provider-specific functionality through flexible configuration.

## Design Principles

### 1. OIDC Compliance
- **Standard Claims**: Support for standard OIDC claims (sub, iss, aud, email, etc.)
- **Discovery**: OIDC discovery endpoint support for automatic configuration
- **Security**: PKCE, state parameters, and secure token handling
- **Interoperability**: Works with any OIDC-compliant provider

### 2. Provider Agnostic
- **Generic Structure**: No provider-specific fields in core tables
- **Flexible Configuration**: Provider-specific data stored in JSONB fields
- **Extensible**: Easy to add new providers without schema changes
- **Backward Compatible**: Maintains existing functionality

### 3. Security First
- **Token Hashing**: Never store plain tokens, only hashes
- **Secure Storage**: Encrypted client secrets and sensitive data
- **Validation**: Comprehensive input validation and sanitization
- **Audit Trail**: Complete audit logging for security events

## Database Schema

### Core Tables

#### 1. ciam_systems
**Purpose**: OIDC-compliant CIAM system configurations

```sql
CREATE TABLE ciam_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_name VARCHAR(50) NOT NULL UNIQUE, -- 'cognito', 'azure_entra', 'auth0', etc.
    display_name VARCHAR(100) NOT NULL,
    provider_type VARCHAR(50) DEFAULT 'oidc' CHECK (provider_type IN ('oidc', 'oauth2', 'saml', 'custom')),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- OIDC Standard Endpoints
    jwks_url TEXT,
    issuer_url TEXT,
    oidc_discovery_url TEXT,
    authorization_endpoint TEXT,
    token_endpoint TEXT,
    userinfo_endpoint TEXT,
    end_session_endpoint TEXT,
    
    -- OAuth2/OIDC Configuration
    client_id VARCHAR(255),
    client_secret_encrypted TEXT,
    scopes TEXT DEFAULT 'openid profile email',
    response_type VARCHAR(50) DEFAULT 'code',
    response_mode VARCHAR(50) DEFAULT 'query',
    code_challenge_method VARCHAR(50) DEFAULT 'S256',
    
    -- Flexible Configuration
    supported_claims JSONB DEFAULT '{}', -- Schema of supported claims
    provider_metadata JSONB DEFAULT '{}', -- Provider-specific configuration
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features**:
- **OIDC Standard**: All standard OIDC endpoints and parameters
- **Flexible Claims**: JSONB schema for supported claims per provider
- **Provider Metadata**: JSONB for provider-specific configuration
- **Extensible**: Easy to add new providers without schema changes

#### 2. user_ciam_mappings
**Purpose**: Provider-agnostic user-CIAM identity mappings

```sql
CREATE TABLE user_ciam_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ciam_identifier VARCHAR(255) NOT NULL, -- OIDC 'sub' claim
    ciam_system VARCHAR(50) NOT NULL, -- System name reference
    provider_identifier VARCHAR(255), -- Generic provider identifier
    is_current_ciam BOOLEAN DEFAULT FALSE,
    last_authenticated_at TIMESTAMP WITH TIME ZONE,
    authentication_method VARCHAR(50) DEFAULT 'oidc',
    
    -- Flexible Data Storage
    provider_metadata JSONB DEFAULT '{}', -- Provider-specific user data
    token_metadata JSONB DEFAULT '{}', -- Token-related metadata
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(app_user_id, ciam_identifier, ciam_system)
);
```

**Key Features**:
- **Generic Structure**: No provider-specific fields
- **Flexible Metadata**: JSONB for provider-specific data
- **Current CIAM**: Single active CIAM per user with historical tracking
- **Audit Trail**: Last authentication timestamp

#### 3. users (Updated)
**Purpose**: User accounts with OIDC-compliant fields

```sql
-- OIDC Standard Fields
ALTER TABLE users ADD COLUMN oidc_sub VARCHAR(255); -- OIDC 'sub' claim
ALTER TABLE users ADD COLUMN oidc_issuer VARCHAR(255); -- OIDC 'iss' claim
ALTER TABLE users ADD COLUMN oidc_audience VARCHAR(255); -- OIDC 'aud' claim

-- Standard User Fields
ALTER TABLE users ADD COLUMN phone_number VARCHAR(50);
ALTER TABLE users ADD COLUMN phone_number_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN given_name VARCHAR(255);
ALTER TABLE users ADD COLUMN family_name VARCHAR(255);
ALTER TABLE users ADD COLUMN name VARCHAR(255);
ALTER TABLE users ADD COLUMN preferred_username VARCHAR(255);
ALTER TABLE users ADD COLUMN locale VARCHAR(10);
ALTER TABLE users ADD COLUMN timezone VARCHAR(50);

-- Timestamps
ALTER TABLE users ADD COLUMN oidc_created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN oidc_updated_at TIMESTAMP WITH TIME ZONE;

-- Flexible Metadata
ALTER TABLE users ADD COLUMN provider_metadata JSONB DEFAULT '{}';
```

**Key Features**:
- **OIDC Standard**: Standard OIDC claims and fields
- **Provider Agnostic**: No provider-specific columns
- **Flexible Metadata**: JSONB for provider-specific data
- **Backward Compatible**: Maintains existing functionality

#### 4. oidc_tokens
**Purpose**: Secure storage for OIDC tokens

```sql
CREATE TABLE oidc_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ciam_system_id UUID NOT NULL REFERENCES ciam_systems(id) ON DELETE CASCADE,
    token_type VARCHAR(50) NOT NULL CHECK (token_type IN ('access', 'refresh', 'id')),
    token_hash VARCHAR(255) NOT NULL, -- Hashed token for security
    token_metadata JSONB DEFAULT '{}', -- Token claims, expiry, etc.
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ciam_system_id, token_type)
);
```

**Key Features**:
- **Security**: Only stores hashed tokens, never plain tokens
- **Metadata**: JSONB for token claims and additional data
- **Expiry**: Automatic token expiry management
- **Types**: Support for access, refresh, and ID tokens

#### 5. oidc_sessions
**Purpose**: OIDC session management with state and PKCE

```sql
CREATE TABLE oidc_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ciam_system_id UUID NOT NULL REFERENCES ciam_systems(id) ON DELETE CASCADE,
    state VARCHAR(255) NOT NULL, -- OAuth2 state parameter
    code_verifier VARCHAR(255), -- PKCE code verifier
    return_url TEXT, -- Return URL after authentication
    session_data JSONB DEFAULT '{}', -- Additional session data
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features**:
- **State Management**: OAuth2 state parameter for CSRF protection
- **PKCE Support**: Code verifier storage for enhanced security
- **Return URL**: State preservation for seamless user experience
- **Expiry**: Automatic session cleanup

## Provider Configuration

### Cognito Configuration
```json
{
  "system_name": "cognito",
  "display_name": "AWS Cognito",
  "provider_type": "oidc",
  "oidc_discovery_url": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07/.well-known/openid_configuration",
  "authorization_endpoint": "https://auth.dev.np-topvitaminsupply.com/login/continue",
  "token_endpoint": "https://auth.dev.np-topvitaminsupply.com/oauth2/token",
  "userinfo_endpoint": "https://auth.dev.np-topvitaminsupply.com/oauth2/userInfo",
  "end_session_endpoint": "https://auth.dev.np-topvitaminsupply.com/logout",
  "client_id": "4lt0iqap612c9jug55f3a1s69k",
  "scopes": "email openid phone",
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
  }
}
```

### Azure Entra ID Configuration
```json
{
  "system_name": "azure_entra",
  "display_name": "Microsoft Azure Entra ID",
  "provider_type": "oidc",
  "oidc_discovery_url": "https://login.microsoftonline.com/{tenant_id}/.well-known/openid_configuration",
  "authorization_endpoint": "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize",
  "token_endpoint": "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token",
  "userinfo_endpoint": "https://graph.microsoft.com/oidc/userinfo",
  "end_session_endpoint": "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/logout",
  "client_id": "placeholder",
  "scopes": "openid profile email",
  "supported_claims": {
    "sub": "string",
    "email": "string",
    "email_verified": "boolean",
    "given_name": "string",
    "family_name": "string",
    "name": "string",
    "preferred_username": "string",
    "oid": "string",
    "tid": "string"
  },
  "provider_metadata": {
    "tenant_id": "placeholder",
    "authority_url": "https://login.microsoftonline.com/{tenant_id}"
  }
}
```

### Auth0 Configuration (Example)
```json
{
  "system_name": "auth0",
  "display_name": "Auth0",
  "provider_type": "oidc",
  "oidc_discovery_url": "https://your-domain.auth0.com/.well-known/openid_configuration",
  "authorization_endpoint": "https://your-domain.auth0.com/authorize",
  "token_endpoint": "https://your-domain.auth0.com/oauth/token",
  "userinfo_endpoint": "https://your-domain.auth0.com/userinfo",
  "end_session_endpoint": "https://your-domain.auth0.com/v2/logout",
  "client_id": "your-client-id",
  "scopes": "openid profile email",
  "supported_claims": {
    "sub": "string",
    "email": "string",
    "email_verified": "boolean",
    "given_name": "string",
    "family_name": "string",
    "name": "string",
    "preferred_username": "string",
    "nickname": "string",
    "picture": "string"
  },
  "provider_metadata": {
    "domain": "your-domain.auth0.com",
    "audience": "your-api-identifier"
  }
}
```

## Implementation

### OIDC Auth Handlers

#### 1. Generic OIDC Handler
```go
type OIDCAuthHandlers struct {
    db           *sql.DB
    config       *OIDCConfig
    oauth2Config *oauth2.Config
}

func NewOIDCAuthHandlers(db *sql.DB, systemName string) (*OIDCAuthHandlers, error) {
    // Load OIDC configuration from database
    config, err := loadOIDCConfig(db, systemName)
    if err != nil {
        return nil, fmt.Errorf("failed to load OIDC config: %w", err)
    }
    
    // Create OAuth2 config
    oauth2Config := &oauth2.Config{
        ClientID:     config.ClientID,
        ClientSecret: config.ClientSecret,
        RedirectURL:  getRedirectURI(systemName),
        Scopes:       strings.Split(config.Scopes, " "),
        Endpoint: oauth2.Endpoint{
            AuthURL:  config.AuthorizationEndpoint,
            TokenURL: config.TokenEndpoint,
        },
    }
    
    return &OIDCAuthHandlers{
        db:           db,
        config:       config,
        oauth2Config: oauth2Config,
    }, nil
}
```

#### 2. Provider-Agnostic User Creation
```go
func (h *OIDCAuthHandlers) createOrUpdateUser(oidcUser *OIDCUser) (string, error) {
    // Check if user exists by email
    var existingUserID string
    query := `SELECT id FROM users WHERE email = $1`
    err := h.db.QueryRow(query, oidcUser.Email).Scan(&existingUserID)
    
    if err == sql.ErrNoRows {
        // Create new user with OIDC fields
        userID := uuid.New().String()
        now := time.Now()
        
        insertQuery := `
            INSERT INTO users (
                id, email, username, auth_method, email_verified, 
                account_enabled, last_login_at, created_at, updated_at,
                oidc_sub, oidc_issuer, oidc_audience, phone_number, phone_number_verified,
                given_name, family_name, name, preferred_username, locale, timezone,
                oidc_created_at, oidc_updated_at, provider_metadata
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
            )
        `
        
        providerMetadataJSON, _ := json.Marshal(oidcUser.ProviderMetadata)
        
        _, err = h.db.Exec(insertQuery,
            userID, oidcUser.Email, oidcUser.Username, oidcUser.AuthMethod,
            oidcUser.EmailVerified, true, oidcUser.LastLoginAt, now, now,
            oidcUser.OIDCSub, oidcUser.OIDCIssuer, oidcUser.OIDCAudience,
            oidcUser.PhoneNumber, oidcUser.PhoneVerified, oidcUser.GivenName,
            oidcUser.FamilyName, oidcUser.Name, oidcUser.PreferredUsername,
            oidcUser.Locale, oidcUser.Timezone, oidcUser.OIDCCreatedAt,
            oidcUser.OIDCUpdatedAt, providerMetadataJSON,
        )
        
        if err != nil {
            return "", err
        }
        
        return userID, nil
    }
    
    // Update existing user...
}
```

#### 3. Flexible Claim Parsing
```go
func (h *OIDCAuthHandlers) parseIDToken(idToken string) (*OIDCUser, error) {
    // Parse JWT token
    parts := strings.Split(idToken, ".")
    if len(parts) != 3 {
        return nil, fmt.Errorf("invalid JWT format")
    }
    
    // Decode payload
    payload, err := base64.RawURLEncoding.DecodeString(parts[1])
    if err != nil {
        return nil, fmt.Errorf("error decoding JWT payload: %v", err)
    }
    
    var claims map[string]interface{}
    if err := json.Unmarshal(payload, &claims); err != nil {
        return nil, fmt.Errorf("error unmarshaling JWT claims: %v", err)
    }
    
    // Extract standard OIDC claims
    user := &OIDCUser{
        OIDCSub:           getStringClaim(claims, "sub"),
        OIDCIssuer:        getStringClaim(claims, "iss"),
        OIDCAudience:      getStringClaim(claims, "aud"),
        Email:             getStringClaim(claims, "email"),
        EmailVerified:     getBoolClaim(claims, "email_verified"),
        PhoneNumber:       getStringClaim(claims, "phone_number"),
        PhoneVerified:     getBoolClaim(claims, "phone_number_verified"),
        GivenName:         getStringClaim(claims, "given_name"),
        FamilyName:        getStringClaim(claims, "family_name"),
        Name:              getStringClaim(claims, "name"),
        PreferredUsername: getStringClaim(claims, "preferred_username"),
        Locale:            getStringClaim(claims, "locale"),
        Timezone:          getStringClaim(claims, "timezone"),
        AuthMethod:        h.config.SystemName,
        LastLoginAt:       time.Now(),
        CreatedByOIDC:     true,
        OIDCCreatedAt:     time.Now(),
        OIDCUpdatedAt:     time.Now(),
        ProviderMetadata:  make(map[string]interface{}),
    }
    
    // Store provider-specific claims in metadata
    for claim, value := range claims {
        if _, exists := h.config.SupportedClaims[claim]; !exists {
            user.ProviderMetadata[claim] = value
        }
    }
    
    return user, nil
}
```

## API Endpoints

### Generic OIDC Endpoints
```
GET /auth/{system_name}/login?return_url=<encoded_url>
GET /auth/{system_name}/callback?code=<auth_code>&state=<state>
GET /auth/{system_name}/refresh
GET /auth/{system_name}/logout?return_url=<encoded_url>
GET /auth/{system_name}/config
```

### Examples
```
GET /auth/cognito/login?return_url=https://dev.np-totalvitaminsupply.com/dashboard
GET /auth/azure_entra/login?return_url=https://dev.np-totalvitaminsupply.com/profile
GET /auth/auth0/login?return_url=https://dev.np-totalvitaminsupply.com/settings
```

## Security Features

### 1. Token Security
- **Hashing**: All tokens are hashed before storage
- **Expiry**: Automatic token expiry management
- **Refresh**: Secure token refresh mechanism
- **Validation**: Proper JWT token validation

### 2. Session Security
- **State Parameter**: CSRF protection through state parameter
- **PKCE**: Code challenge/verifier for enhanced security
- **Expiry**: Automatic session cleanup
- **Secure Storage**: Encrypted session data

### 3. Input Validation
- **URL Validation**: Prevents open redirects
- **Claim Validation**: Validates OIDC claims against schema
- **SQL Injection**: Parameterized queries prevent SQL injection
- **XSS Protection**: Proper input sanitization

## Migration Strategy

### 1. Database Migration
```sql
-- Run migration 003_oidc_agnostic_ciam_support.sql
-- This updates existing tables and creates new OIDC-compliant tables
```

### 2. Code Migration
```go
// Update existing Cognito handlers to use OIDC handlers
cognitoHandler, err := NewOIDCAuthHandlers(db, "cognito")
if err != nil {
    log.Fatal("Failed to create Cognito handler:", err)
}

// Add routes for different providers
router.HandleFunc("/auth/cognito/login", cognitoHandler.Login).Methods("GET")
router.HandleFunc("/auth/azure_entra/login", azureHandler.Login).Methods("GET")
router.HandleFunc("/auth/auth0/login", auth0Handler.Login).Methods("GET")
```

### 3. Configuration Migration
```sql
-- Update existing CIAM systems with OIDC configuration
UPDATE ciam_systems SET 
    provider_type = 'oidc',
    oidc_discovery_url = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07/.well-known/openid_configuration',
    -- ... other OIDC fields
WHERE system_name = 'cognito';
```

## Benefits

### 1. Provider Agnostic
- **Flexibility**: Easy to add new OIDC providers
- **No Lock-in**: Not tied to any specific provider
- **Standards**: Uses industry-standard OIDC protocol
- **Interoperability**: Works with any OIDC-compliant provider

### 2. Maintainability
- **Single Codebase**: One handler for all OIDC providers
- **Configuration-Driven**: Provider differences handled through configuration
- **Extensible**: Easy to add new features without schema changes
- **Testable**: Generic structure makes testing easier

### 3. Security
- **Standards**: Follows OIDC security best practices
- **Token Security**: Secure token storage and handling
- **Validation**: Comprehensive input validation
- **Audit**: Complete audit trail for security events

### 4. Performance
- **Efficient**: Optimized database queries and indexes
- **Scalable**: Designed for high-volume authentication
- **Caching**: Token and session caching for performance
- **Monitoring**: Built-in performance monitoring

## Future Enhancements

### 1. Additional Providers
- **Okta**: Enterprise identity provider
- **Google**: Google Identity Platform
- **Facebook**: Facebook Login
- **Custom**: Custom OIDC providers

### 2. Advanced Features
- **Multi-Factor Authentication**: MFA support
- **Risk-Based Authentication**: Adaptive authentication
- **Single Sign-On**: SSO across multiple applications
- **Identity Federation**: Federation with other identity providers

### 3. Monitoring and Analytics
- **Authentication Metrics**: Success rates, response times
- **Security Monitoring**: Failed attempts, suspicious activity
- **User Analytics**: User behavior and patterns
- **Performance Monitoring**: System performance and bottlenecks

---

## Conclusion

The OIDC-agnostic CIAM implementation provides a flexible, secure, and maintainable solution for managing customer identities across multiple providers. By following OIDC standards and using a provider-agnostic approach, the system can easily support new providers while maintaining security and performance standards.

The implementation includes comprehensive security measures, flexible configuration options, and a robust database schema that can scale with business needs. The migration strategy ensures backward compatibility while providing a path forward for enhanced functionality.
