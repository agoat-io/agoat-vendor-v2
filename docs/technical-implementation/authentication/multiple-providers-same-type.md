# Multiple Providers of Same Type Support

## Overview

This document describes the support for multiple providers of the same type (e.g., multiple Cognito User Pools, multiple Azure Tenants, multiple Auth0 applications) in the AGoat Publisher system. The system uses unique identifiers obtained from JWT tokens to distinguish between different instances/environments/pools of the same provider type.

## Business Requirements

### **Requirement 1: Multiple Provider Instances**
- **Description**: Support multiple instances of the same provider type (e.g., multiple Cognito User Pools for different environments)
- **Rationale**: Organizations often need separate identity providers for different environments (dev, staging, production) or different business units
- **Acceptance Criteria**: 
  - System can handle multiple Cognito User Pools
  - System can handle multiple Azure Tenants
  - System can handle multiple Auth0 applications
  - Each provider instance is uniquely identified

### **Requirement 2: Unique Instance Identification**
- **Description**: Each provider instance must have a unique identifier obtained from JWT tokens
- **Rationale**: JWT tokens contain issuer information that uniquely identifies the provider instance
- **Acceptance Criteria**:
  - Unique identifier is extracted from JWT token `iss` claim
  - Unique identifier is stored in database for provider instance identification
  - System can route authentication to correct provider instance based on JWT token

### **Requirement 3: Environment Context**
- **Description**: Provider instances must be associated with environment context (production, staging, development)
- **Rationale**: Different environments may use different provider instances
- **Acceptance Criteria**:
  - Each provider instance has environment context
  - System can filter providers by environment
  - Environment context is used for audit and debugging

## Technical Implementation

### **Database Schema Changes**

#### **1. CIAM Systems Table Updates**

**New Fields Added:**
```sql
-- Provider instance identifier - unique identifier for specific instance/environment/pool
provider_instance_id VARCHAR(255) NOT NULL DEFAULT 'default'
-- Source: JWT token 'iss' claim (issuer URL) or provider-specific identifier

-- Provider environment context
provider_environment VARCHAR(50) DEFAULT 'production'
-- Source: Environment context (production, staging, development, etc.)

-- Provider region information
provider_region VARCHAR(50)
-- Source: Provider region information

-- Provider domain from JWT token
provider_domain VARCHAR(255)
-- Source: Provider domain from 'iss' claim or configuration

-- Default provider flag
is_default_for_type BOOLEAN DEFAULT FALSE
-- Indicates if this is the default provider for this provider_type
```

**Updated Constraints:**
```sql
-- Unique constraint combining system_name and provider_instance_id
UNIQUE (system_name, provider_instance_id)

-- Unique constraint ensuring only one default per provider type
UNIQUE (provider_type, is_default_for_type) WHERE is_default_for_type = TRUE
```

#### **2. User CIAM Mappings Table Updates**

**New Fields Added:**
```sql
-- Direct reference to specific CIAM system instance
ciam_system_id UUID REFERENCES ciam_systems(id) ON DELETE CASCADE

-- Provider instance identifier for quick lookup
provider_instance_id VARCHAR(255)
-- Source: Same as ciam_systems.provider_instance_id

-- Provider environment for audit and debugging
provider_environment VARCHAR(50)
-- Source: Same as ciam_systems.provider_environment

-- JWT token issuer URL for validation
token_issuer VARCHAR(255)
-- Source: JWT token 'iss' claim
```

#### **3. OIDC Tokens Table Updates**

**New Fields Added:**
```sql
-- JWT token issuer URL for validation
token_issuer VARCHAR(255)
-- Source: JWT token 'iss' claim

-- Provider instance identifier for quick lookup
provider_instance_id VARCHAR(255)
-- Source: Same as ciam_systems.provider_instance_id

-- JWT token audience for validation
token_audience VARCHAR(255)
-- Source: JWT token 'aud' claim
```

#### **4. OIDC Sessions Table Updates**

**New Fields Added:**
```sql
-- Provider instance identifier for quick lookup
provider_instance_id VARCHAR(255)
-- Source: Same as ciam_systems.provider_instance_id

-- Provider environment for audit and debugging
provider_environment VARCHAR(50)
-- Source: Same as ciam_systems.provider_environment
```

### **Unique Identifier Sources**

#### **1. Cognito User Pools**

**Unique Identifier**: User Pool ID
**Source**: JWT token `iss` claim
**Format**: `https://cognito-idp.{region}.amazonaws.com/{user_pool_id}`
**Example**: `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07`

**Extraction Logic**:
```javascript
// From JWT token 'iss' claim
const issuer = jwt.iss; // "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07"
const userPoolId = issuer.split('/').pop(); // "us-east-1_FJUcN8W07"
const region = issuer.split('.')[1]; // "us-east-1"
```

**Database Storage**:
```sql
INSERT INTO ciam_systems (
    system_name, provider_type, provider_instance_id, 
    provider_environment, provider_region, provider_domain,
    issuer_url, jwks_url
) VALUES (
    'cognito', 'oidc', 'us-east-1_FJUcN8W07',
    'development', 'us-east-1', 'auth.dev.np-topvitaminsupply.com',
    'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07',
    'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07/.well-known/jwks.json'
);
```

#### **2. Azure Entra ID (Azure AD)**

**Unique Identifier**: Tenant ID
**Source**: JWT token `iss` claim or `tid` claim
**Format**: `https://login.microsoftonline.com/{tenant_id}/v2.0`
**Example**: `https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012/v2.0`

**Extraction Logic**:
```javascript
// From JWT token 'iss' claim
const issuer = jwt.iss; // "https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012/v2.0"
const tenantId = issuer.split('/')[3]; // "12345678-1234-1234-1234-123456789012"

// Alternative: From JWT token 'tid' claim
const tenantId = jwt.tid; // "12345678-1234-1234-1234-123456789012"
```

**Database Storage**:
```sql
INSERT INTO ciam_systems (
    system_name, provider_type, provider_instance_id,
    provider_environment, provider_region, provider_domain,
    issuer_url, jwks_url
) VALUES (
    'azure_entra', 'oidc', '12345678-1234-1234-1234-123456789012',
    'production', 'global', 'login.microsoftonline.com',
    'https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012/v2.0',
    'https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012/discovery/v2.0/keys'
);
```

#### **3. Auth0**

**Unique Identifier**: Domain
**Source**: JWT token `iss` claim
**Format**: `https://{domain}/`
**Example**: `https://your-domain.auth0.com/`

**Extraction Logic**:
```javascript
// From JWT token 'iss' claim
const issuer = jwt.iss; // "https://your-domain.auth0.com/"
const domain = issuer.replace('https://', '').replace('/', ''); // "your-domain.auth0.com"
```

**Database Storage**:
```sql
INSERT INTO ciam_systems (
    system_name, provider_type, provider_instance_id,
    provider_environment, provider_region, provider_domain,
    issuer_url, jwks_url
) VALUES (
    'auth0', 'oidc', 'your-domain.auth0.com',
    'production', 'global', 'your-domain.auth0.com',
    'https://your-domain.auth0.com/',
    'https://your-domain.auth0.com/.well-known/jwks.json'
);
```

#### **4. Google Identity Platform**

**Unique Identifier**: Project ID
**Source**: JWT token `iss` claim
**Format**: `https://accounts.google.com`
**Example**: `https://accounts.google.com`

**Extraction Logic**:
```javascript
// From JWT token 'iss' claim
const issuer = jwt.iss; // "https://accounts.google.com"
const projectId = jwt.aud; // Google uses 'aud' claim for project ID
```

**Database Storage**:
```sql
INSERT INTO ciam_systems (
    system_name, provider_type, provider_instance_id,
    provider_environment, provider_region, provider_domain,
    issuer_url, jwks_url
) VALUES (
    'google', 'oidc', 'your-project-id',
    'production', 'global', 'accounts.google.com',
    'https://accounts.google.com',
    'https://www.googleapis.com/oauth2/v3/certs'
);
```

### **JWT Token Analysis**

#### **Standard JWT Claims Used for Provider Identification**

| Claim | Description | Source | Example |
|-------|-------------|---------|---------|
| `iss` | Issuer | JWT token | `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07` |
| `aud` | Audience | JWT token | `4lt0iqap612c9jug55f3a1s69k` |
| `sub` | Subject | JWT token | `12345678-1234-1234-1234-123456789012` |
| `tid` | Tenant ID (Azure) | JWT token | `12345678-1234-1234-1234-123456789012` |

#### **Provider-Specific Claims**

**Cognito Claims**:
```json
{
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07",
  "aud": "4lt0iqap612c9jug55f3a1s69k",
  "sub": "12345678-1234-1234-1234-123456789012",
  "cognito:username": "john.doe",
  "cognito:groups": ["admin", "user"]
}
```

**Azure Entra ID Claims**:
```json
{
  "iss": "https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012/v2.0",
  "aud": "12345678-1234-1234-1234-123456789012",
  "sub": "12345678-1234-1234-1234-123456789012",
  "tid": "12345678-1234-1234-1234-123456789012",
  "oid": "12345678-1234-1234-1234-123456789012"
}
```

**Auth0 Claims**:
```json
{
  "iss": "https://your-domain.auth0.com/",
  "aud": "your-client-id",
  "sub": "auth0|12345678-1234-1234-1234-123456789012",
  "azp": "your-client-id"
}
```

### **Database Functions**

#### **1. Get OIDC Configuration by Instance**

```sql
-- Function to get OIDC configuration for a specific provider instance
CREATE OR REPLACE FUNCTION get_oidc_config_by_instance(
    system_name_param VARCHAR(50),
    provider_instance_id_param VARCHAR(255) DEFAULT NULL
)
RETURNS TABLE (
    system_id UUID,
    provider_type VARCHAR(50),
    provider_instance_id VARCHAR(255),
    provider_environment VARCHAR(50),
    provider_region VARCHAR(50),
    provider_domain VARCHAR(255),
    jwks_url TEXT,
    issuer_url TEXT,
    -- ... other fields
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.id, cs.provider_type, cs.provider_instance_id,
        cs.provider_environment, cs.provider_region, cs.provider_domain,
        cs.jwks_url, cs.issuer_url
        -- ... other fields
    FROM ciam_systems cs
    WHERE cs.system_name = system_name_param 
    AND cs.is_active = TRUE
    AND (provider_instance_id_param IS NULL OR cs.provider_instance_id = provider_instance_id_param)
    ORDER BY cs.is_default_for_type DESC, cs.created_at ASC;
END;
$$ LANGUAGE plpgsql;
```

#### **2. Get Provider Instance by JWT Token Issuer**

```sql
-- Function to get provider instance from JWT token issuer
CREATE OR REPLACE FUNCTION get_provider_instance_by_issuer(token_issuer_param VARCHAR(255))
RETURNS TABLE (
    system_id UUID,
    system_name VARCHAR(50),
    provider_type VARCHAR(50),
    provider_instance_id VARCHAR(255),
    provider_environment VARCHAR(50),
    provider_region VARCHAR(50),
    provider_domain VARCHAR(255),
    is_default_for_type BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.id, cs.system_name, cs.provider_type,
        cs.provider_instance_id, cs.provider_environment,
        cs.provider_region, cs.provider_domain,
        cs.is_default_for_type
    FROM ciam_systems cs
    WHERE cs.issuer_url = token_issuer_param 
    AND cs.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;
```

#### **3. Create/Update OIDC User Mapping with Provider Instance**

```sql
-- Function to create or update OIDC user mapping with provider instance
CREATE OR REPLACE FUNCTION upsert_oidc_user_mapping_with_instance(
    user_id_param UUID,
    ciam_system_name_param VARCHAR(50),
    provider_instance_id_param VARCHAR(255),
    oidc_sub_param VARCHAR(255),
    token_issuer_param VARCHAR(255),
    provider_identifier_param VARCHAR(255),
    provider_metadata_param JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    mapping_id UUID;
    ciam_system_id_val UUID;
BEGIN
    -- Get CIAM system ID from system name and provider instance
    SELECT id INTO ciam_system_id_val 
    FROM ciam_systems 
    WHERE system_name = ciam_system_name_param 
    AND provider_instance_id = provider_instance_id_param
    AND is_active = TRUE;
    
    IF ciam_system_id_val IS NULL THEN
        RAISE EXCEPTION 'CIAM system not found: % with instance: %', ciam_system_name_param, provider_instance_id_param;
    END IF;
    
    -- Create or update mapping
    -- ... implementation details
END;
$$ LANGUAGE plpgsql;
```

### **Application Integration**

#### **1. JWT Token Validation**

```go
// Go code example for JWT token validation with provider instance identification
func ValidateJWTToken(tokenString string) (*TokenClaims, error) {
    // Parse JWT token
    token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
        // Get issuer from token
        claims := token.Claims.(jwt.MapClaims)
        issuer := claims["iss"].(string)
        
        // Get provider instance by issuer
        var providerInstance ProviderInstance
        err := db.QueryRow(`
            SELECT system_id, system_name, provider_type, provider_instance_id,
                   provider_environment, jwks_url, issuer_url
            FROM get_provider_instance_by_issuer($1)
        `, issuer).Scan(
            &providerInstance.SystemID, &providerInstance.SystemName,
            &providerInstance.ProviderType, &providerInstance.ProviderInstanceID,
            &providerInstance.ProviderEnvironment, &providerInstance.JWKSURL,
            &providerInstance.IssuerURL,
        )
        if err != nil {
            return nil, err
        }
        
        // Get JWKS for token validation
        jwks, err := getJWKS(providerInstance.JWKSURL)
        if err != nil {
            return nil, err
        }
        
        return jwks, nil
    })
    
    if err != nil {
        return nil, err
    }
    
    // Extract claims
    claims := token.Claims.(jwt.MapClaims)
    
    return &TokenClaims{
        Issuer:    claims["iss"].(string),
        Audience:  claims["aud"].(string),
        Subject:   claims["sub"].(string),
        // ... other claims
    }, nil
}
```

#### **2. Provider Instance Selection**

```go
// Go code example for provider instance selection
func SelectProviderInstance(providerType string, environment string) (*ProviderInstance, error) {
    var providerInstance ProviderInstance
    
    // Get default provider for type and environment
    err := db.QueryRow(`
        SELECT system_id, system_name, provider_type, provider_instance_id,
               provider_environment, provider_region, provider_domain,
               jwks_url, issuer_url, client_id
        FROM ciam_systems
        WHERE provider_type = $1 
        AND provider_environment = $2
        AND is_default_for_type = TRUE
        AND is_active = TRUE
        ORDER BY created_at ASC
        LIMIT 1
    `, providerType, environment).Scan(
        &providerInstance.SystemID, &providerInstance.SystemName,
        &providerInstance.ProviderType, &providerInstance.ProviderInstanceID,
        &providerInstance.ProviderEnvironment, &providerInstance.ProviderRegion,
        &providerInstance.ProviderDomain, &providerInstance.JWKSURL,
        &providerInstance.IssuerURL, &providerInstance.ClientID,
    )
    
    if err != nil {
        return nil, err
    }
    
    return &providerInstance, nil
}
```

### **Configuration Examples**

#### **1. Multiple Cognito User Pools**

```sql
-- Development Cognito User Pool
INSERT INTO ciam_systems (
    system_name, display_name, provider_type, provider_instance_id,
    provider_environment, provider_region, provider_domain,
    issuer_url, jwks_url, client_id, scopes
) VALUES (
    'cognito', 'AWS Cognito Dev', 'oidc', 'us-east-1_FJUcN8W07',
    'development', 'us-east-1', 'auth.dev.np-topvitaminsupply.com',
    'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07',
    'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07/.well-known/jwks.json',
    '4lt0iqap612c9jug55f3a1s69k', 'email openid phone'
);

-- Production Cognito User Pool
INSERT INTO ciam_systems (
    system_name, display_name, provider_type, provider_instance_id,
    provider_environment, provider_region, provider_domain,
    issuer_url, jwks_url, client_id, scopes, is_default_for_type
) VALUES (
    'cognito', 'AWS Cognito Prod', 'oidc', 'us-east-1_ABC123DEF',
    'production', 'us-east-1', 'auth.np-topvitaminsupply.com',
    'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_ABC123DEF',
    'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_ABC123DEF/.well-known/jwks.json',
    '7xyz890abc123def456ghi789', 'email openid phone', TRUE
);
```

#### **2. Multiple Azure Tenants**

```sql
-- Development Azure Tenant
INSERT INTO ciam_systems (
    system_name, display_name, provider_type, provider_instance_id,
    provider_environment, provider_region, provider_domain,
    issuer_url, jwks_url, client_id, scopes
) VALUES (
    'azure_entra', 'Azure Entra Dev', 'oidc', 'dev-tenant-id-1234',
    'development', 'global', 'login.microsoftonline.com',
    'https://login.microsoftonline.com/dev-tenant-id-1234/v2.0',
    'https://login.microsoftonline.com/dev-tenant-id-1234/discovery/v2.0/keys',
    'dev-client-id-1234', 'openid profile email'
);

-- Production Azure Tenant
INSERT INTO ciam_systems (
    system_name, display_name, provider_type, provider_instance_id,
    provider_environment, provider_region, provider_domain,
    issuer_url, jwks_url, client_id, scopes, is_default_for_type
) VALUES (
    'azure_entra', 'Azure Entra Prod', 'oidc', 'prod-tenant-id-5678',
    'production', 'global', 'login.microsoftonline.com',
    'https://login.microsoftonline.com/prod-tenant-id-5678/v2.0',
    'https://login.microsoftonline.com/prod-tenant-id-5678/discovery/v2.0/keys',
    'prod-client-id-5678', 'openid profile email', TRUE
);
```

### **Benefits**

#### **1. Multi-Environment Support**
- **Development Environment**: Separate Cognito User Pool for development
- **Staging Environment**: Separate Cognito User Pool for staging
- **Production Environment**: Separate Cognito User Pool for production
- **Environment Isolation**: Users and data are isolated between environments

#### **2. Multi-Tenant Support**
- **Multiple Azure Tenants**: Support for different Azure AD tenants
- **Multiple Auth0 Applications**: Support for different Auth0 applications
- **Tenant Isolation**: Users and data are isolated between tenants

#### **3. Provider Redundancy**
- **Failover Support**: Multiple provider instances for redundancy
- **Load Distribution**: Distribute authentication load across multiple instances
- **Geographic Distribution**: Provider instances in different regions

#### **4. Audit and Compliance**
- **Environment Tracking**: Track which environment a user authenticated in
- **Provider Instance Tracking**: Track which specific provider instance was used
- **Compliance Reporting**: Generate reports by environment and provider instance

### **Security Considerations**

#### **1. Token Validation**
- **Issuer Validation**: Validate JWT token issuer against known provider instances
- **JWKS Validation**: Use correct JWKS endpoint for each provider instance
- **Audience Validation**: Validate JWT token audience against expected client ID

#### **2. Provider Instance Security**
- **Instance Isolation**: Ensure provider instances are properly isolated
- **Credential Management**: Manage credentials for each provider instance separately
- **Access Control**: Control access to different provider instances

#### **3. Data Protection**
- **Environment Isolation**: Ensure data is isolated between environments
- **Tenant Isolation**: Ensure data is isolated between tenants
- **Audit Logging**: Log all authentication events with provider instance information

### **Monitoring and Observability**

#### **1. Metrics**
- **Authentication Success Rate**: By provider instance and environment
- **Token Validation Performance**: By provider instance
- **Provider Instance Health**: Monitor health of each provider instance

#### **2. Logging**
- **Authentication Events**: Log with provider instance information
- **Token Validation Events**: Log with provider instance information
- **Provider Instance Events**: Log provider instance status changes

#### **3. Alerting**
- **Provider Instance Down**: Alert when provider instance is unavailable
- **Authentication Failures**: Alert on authentication failures by provider instance
- **Token Validation Failures**: Alert on token validation failures

## Conclusion

The multiple providers of the same type support enables the AGoat Publisher system to handle complex identity provider scenarios with proper isolation, security, and audit capabilities. The unique identifiers obtained from JWT tokens provide a reliable way to identify and route authentication to the correct provider instance.

### Key Benefits

✅ **Multi-Environment Support**: Separate provider instances for different environments  
✅ **Multi-Tenant Support**: Support for multiple tenants of the same provider type  
✅ **Provider Redundancy**: Multiple provider instances for failover and load distribution  
✅ **Audit and Compliance**: Complete tracking of provider instance usage  
✅ **Security**: Proper isolation and validation of provider instances  
✅ **Scalability**: Support for growing number of provider instances  
✅ **Flexibility**: Easy addition of new provider instances without schema changes  

The implementation provides a robust foundation for enterprise identity management with proper separation of concerns and comprehensive audit capabilities.
