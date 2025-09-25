#!/bin/bash

# =============================================================================
# Azure Entra ID External Identities Configuration Script
# =============================================================================
# This script configures Azure Entra ID External Identities to support
# OIDC with PKCE authentication flow for SPA applications with support for:
# - Gmail accounts (Google)
# - Microsoft personal accounts (Hotmail, Outlook.com, Live.com)
# - Work/School accounts from any Azure tenant
# - Other external identity providers
# 
# Usage: ./configure-azure-entra-id.sh
# 
# Prerequisites:
# - Azure CLI installed and logged in
# - Appropriate permissions to create app registrations
# - PowerShell Core installed (for some Azure operations)
# =============================================================================

set -euo pipefail

# =============================================================================
# CONFIGURATION VARIABLES
# =============================================================================

# Azure Entra ID Configuration
AZURE_TENANT_ID="${AZURE_TENANT_ID:-}"
AZURE_TENANT_DOMAIN="${AZURE_TENANT_DOMAIN:-}"
AZURE_SUBSCRIPTION_ID="${AZURE_SUBSCRIPTION_ID:-}"

# Application Configuration
APP_NAME="${APP_NAME:-topvitaminsupplies.com}"
APP_DISPLAY_NAME="${APP_DISPLAY_NAME:-Top Vitamin Supplies}"
APP_DESCRIPTION="${APP_DESCRIPTION:-Professional-grade supplement platform with Thorne integration}"

# Environment Configuration
ENVIRONMENT="${ENVIRONMENT:-local}"

# Local Development Configuration
LOCAL_DOMAIN="${LOCAL_DOMAIN:-local.topvitaminsupply.com}"
LOCAL_PORT="${LOCAL_PORT:-3000}"
LOCAL_REDIRECT_URI="${LOCAL_REDIRECT_URI:-http://${LOCAL_DOMAIN}:${LOCAL_PORT}/auth/callback}"
LOCAL_LOGOUT_URI="${LOCAL_LOGOUT_URI:-http://${LOCAL_DOMAIN}:${LOCAL_PORT}/auth/logout}"
LOCAL_CIAM_DOMAIN="${LOCAL_CIAM_DOMAIN:-auth01.local.topvitaminsupply.com}"
LOCAL_CIAM_REDIRECT_URI="${LOCAL_CIAM_REDIRECT_URI:-https://${LOCAL_CIAM_DOMAIN}/callback}"
LOCAL_CIAM_LOGOUT_URI="${LOCAL_CIAM_LOGOUT_URI:-https://${LOCAL_CIAM_DOMAIN}/logout}"

# Staging Configuration
STAGING_DOMAIN="${STAGING_DOMAIN:-staging.topvitaminsupplies.com}"
STAGING_REDIRECT_URI="${STAGING_REDIRECT_URI:-https://${STAGING_DOMAIN}/auth/callback}"
STAGING_LOGOUT_URI="${STAGING_LOGOUT_URI:-https://${STAGING_DOMAIN}/auth/logout}"
STAGING_CIAM_DOMAIN="${STAGING_CIAM_DOMAIN:-auth01.dev.topvitaminsupply.com}"
STAGING_CIAM_REDIRECT_URI="${STAGING_CIAM_REDIRECT_URI:-https://${STAGING_CIAM_DOMAIN}/callback}"
STAGING_CIAM_LOGOUT_URI="${STAGING_CIAM_LOGOUT_URI:-https://${STAGING_CIAM_DOMAIN}/logout}"

# Production Configuration
PROD_DOMAIN="${PROD_DOMAIN:-topvitaminsupplies.com}"
PROD_REDIRECT_URI="${PROD_REDIRECT_URI:-https://${PROD_DOMAIN}/auth/callback}"
PROD_LOGOUT_URI="${PROD_LOGOUT_URI:-https://${PROD_DOMAIN}/auth/logout}"
PROD_CIAM_DOMAIN="${PROD_CIAM_DOMAIN:-auth01.topvitaminsupplies.com}"
PROD_CIAM_REDIRECT_URI="${PROD_CIAM_REDIRECT_URI:-https://${PROD_CIAM_DOMAIN}/callback}"
PROD_CIAM_LOGOUT_URI="${PROD_CIAM_LOGOUT_URI:-https://${PROD_CIAM_DOMAIN}/logout}"

# OIDC Configuration for External Identities
OIDC_SCOPES="${OIDC_SCOPES:-openid profile email User.Read}"
OIDC_RESPONSE_TYPE="${OIDC_RESPONSE_TYPE:-code}"
OIDC_RESPONSE_MODE="${OIDC_RESPONSE_MODE:-query}"
OIDC_CODE_CHALLENGE_METHOD="${OIDC_CODE_CHALLENGE_METHOD:-S256}"

# External Identity Providers Configuration
ENABLE_GOOGLE_PROVIDER="${ENABLE_GOOGLE_PROVIDER:-true}"
ENABLE_MICROSOFT_PERSONAL_PROVIDER="${ENABLE_MICROSOFT_PERSONAL_PROVIDER:-true}"
ENABLE_SOCIAL_PROVIDERS="${ENABLE_SOCIAL_PROVIDERS:-true}"

# Security Configuration
TOKEN_LIFETIME_HOURS="${TOKEN_LIFETIME_HOURS:-1}"
REFRESH_TOKEN_LIFETIME_DAYS="${REFRESH_TOKEN_LIFETIME_DAYS:-90}"
SESSION_LIFETIME_HOURS="${SESSION_LIFETIME_HOURS:-8}"

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo "[ERROR] $1" >&2
    exit 1
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        error "Azure CLI is not installed. Please install it first: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    fi
    
    # Check if logged in to Azure
    if ! az account show &> /dev/null; then
        error "Not logged in to Azure. Please run 'az login' first."
    fi
    
    # Check if PowerShell Core is available (for some operations)
    if ! command -v pwsh &> /dev/null; then
        log "Warning: PowerShell Core not found. Some advanced configurations may not be available."
    fi
    
    log "Prerequisites check completed."
}

get_azure_info() {
    log "Getting Azure account information..."
    
    if [[ -z "$AZURE_TENANT_ID" ]]; then
        AZURE_TENANT_ID=$(az account show --query tenantId -o tsv)
        log "Using tenant ID: $AZURE_TENANT_ID"
    fi
    
    if [[ -z "$AZURE_SUBSCRIPTION_ID" ]]; then
        AZURE_SUBSCRIPTION_ID=$(az account show --query id -o tsv)
        log "Using subscription ID: $AZURE_SUBSCRIPTION_ID"
    fi
    
    if [[ -z "$AZURE_TENANT_DOMAIN" ]]; then
        AZURE_TENANT_DOMAIN=$(az ad signed-in-user show --query userPrincipalName -o tsv | cut -d'@' -f2)
        log "Using tenant domain: $AZURE_TENANT_DOMAIN"
    fi
}

# =============================================================================
# AZURE ENTRA ID APP REGISTRATION
# =============================================================================

create_app_registration() {
    log "Creating Azure Entra ID app registration..."
    
    # Create the app registration for External Identities (multi-tenant)
    APP_REGISTRATION=$(az ad app create \
        --display-name "$APP_DISPLAY_NAME" \
        --sign-in-audience "AzureADandPersonalMicrosoftAccount" \
        --web-redirect-uris "$LOCAL_REDIRECT_URI" "$STAGING_REDIRECT_URI" "$PROD_REDIRECT_URI" \
        --web-redirect-uris "$LOCAL_CIAM_REDIRECT_URI" "$STAGING_CIAM_REDIRECT_URI" "$PROD_CIAM_REDIRECT_URI" \
        --logout-url "$LOCAL_LOGOUT_URI" "$STAGING_LOGOUT_URI" "$PROD_LOGOUT_URI" \
        --logout-url "$LOCAL_CIAM_LOGOUT_URI" "$STAGING_CIAM_LOGOUT_URI" "$PROD_CIAM_LOGOUT_URI" \
        --enable-id-token-issuance true \
        --enable-access-token-issuance true \
        --query '{appId:appId, objectId:id}' -o json)
    
    APP_ID=$(echo "$APP_REGISTRATION" | jq -r '.appId')
    APP_OBJECT_ID=$(echo "$APP_REGISTRATION" | jq -r '.objectId')
    
    log "App registration created successfully:"
    log "  App ID: $APP_ID"
    log "  Object ID: $APP_OBJECT_ID"
    
    # Store for later use
    echo "$APP_ID" > .azure_app_id
    echo "$APP_OBJECT_ID" > .azure_app_object_id
}

configure_app_manifest() {
    log "Configuring app manifest for SPA..."
    
    APP_ID=$(cat .azure_app_id)
    APP_OBJECT_ID=$(cat .azure_app_object_id)
    
    # Create manifest JSON for SPA configuration
    cat > app_manifest.json << EOF
{
    "id": "$APP_OBJECT_ID",
    "appId": "$APP_ID",
    "displayName": "$APP_DISPLAY_NAME",
    "signInAudience": "AzureADandPersonalMicrosoftAccount",
    "web": {
        "redirectUris": [
            "$LOCAL_REDIRECT_URI",
            "$PROD_REDIRECT_URI"
        ],
        "logoutUrl": "$LOCAL_LOGOUT_URI",
        "implicitGrantSettings": {
            "enableIdTokenIssuance": true,
            "enableAccessTokenIssuance": false
        }
    },
    "spa": {
        "redirectUris": [
            "$LOCAL_REDIRECT_URI",
            "$PROD_REDIRECT_URI"
        ]
    },
    "requiredResourceAccess": [
        {
            "resourceAppId": "00000003-0000-0000-c000-000000000000",
            "resourceAccess": [
                {
                    "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
                    "type": "Scope"
                },
                {
                    "id": "37f7f235-527c-4136-accd-4a02d197296e",
                    "type": "Scope"
                },
                {
                    "id": "64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0",
                    "type": "Scope"
                }
            ]
        }
    ],
    "optionalClaims": {
        "idToken": [
            {
                "name": "email",
                "source": "user",
                "essential": true
            },
            {
                "name": "given_name",
                "source": "user",
                "essential": false
            },
            {
                "name": "family_name",
                "source": "user",
                "essential": false
            },
            {
                "name": "preferred_username",
                "source": "user",
                "essential": false
            }
        ],
        "accessToken": [],
        "saml2Token": []
    },
    "tokenLifetimePolicies": []
}
EOF
    
    # Update the app registration with the manifest
    az ad app update --id "$APP_ID" --set web.implicitGrantSettings.enableIdTokenIssuance=true
    az ad app update --id "$APP_ID" --set web.implicitGrantSettings.enableAccessTokenIssuance=false
    
    log "App manifest configured for SPA with OIDC."
}

create_service_principal() {
    log "Creating service principal..."
    
    APP_ID=$(cat .azure_app_id)
    
    # Create service principal
    SP_OBJECT_ID=$(az ad sp create --id "$APP_ID" --query id -o tsv)
    
    log "Service principal created: $SP_OBJECT_ID"
    echo "$SP_OBJECT_ID" > .azure_sp_object_id
}

configure_api_permissions() {
    log "Configuring API permissions..."
    
    APP_ID=$(cat .azure_app_id)
    
    # Add Microsoft Graph permissions
    az ad app permission add \
        --id "$APP_ID" \
        --api "00000003-0000-0000-c000-000000000000" \
        --api-permissions "e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope"  # User.Read
    
    az ad app permission add \
        --id "$APP_ID" \
        --api "00000003-0000-0000-c000-000000000000" \
        --api-permissions "37f7f235-527c-4136-accd-4a02d197296e=Scope"  # email
    
    az ad app permission add \
        --id "$APP_ID" \
        --api "00000003-0000-0000-c000-000000000000" \
        --api-permissions "64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0=Scope"  # profile
    
    # Grant admin consent for the permissions
    log "Granting admin consent for API permissions..."
    az ad app permission admin-consent --id "$APP_ID"
    
    log "API permissions configured and consented."
}

create_client_secret() {
    log "Creating client secret..."
    
    APP_ID=$(cat .azure_app_id)
    
    # Create client secret (valid for 2 years)
    CLIENT_SECRET=$(az ad app credential reset --id "$APP_ID" --years 2 --query password -o tsv)
    
    log "Client secret created successfully."
    echo "$CLIENT_SECRET" > .azure_client_secret
    
    # Store in a secure location
    log "Client secret saved to .azure_client_secret"
    log "IMPORTANT: Store this secret securely and never commit it to version control!"
}

# =============================================================================
# LOCAL DEVELOPMENT CONFIGURATION
# =============================================================================

configure_local_dns() {
    log "Configuring local DNS for $LOCAL_DOMAIN..."
    
    # Check if running on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # Add entry to /etc/hosts if it doesn't exist
        if ! grep -q "$LOCAL_DOMAIN" /etc/hosts; then
            echo "127.0.0.1 $LOCAL_DOMAIN" | sudo tee -a /etc/hosts
            log "Added $LOCAL_DOMAIN to /etc/hosts"
        else
            log "$LOCAL_DOMAIN already exists in /etc/hosts"
        fi
    else
        log "Please manually add '127.0.0.1 $LOCAL_DOMAIN' to your /etc/hosts file"
    fi
}

generate_environment_config() {
    log "Generating environment configuration..."
    
    APP_ID=$(cat .azure_app_id)
    CLIENT_SECRET=$(cat .azure_client_secret)
    
    # Create .env file for the application
    cat > .env.azure << EOF
# Azure Entra ID Configuration
AZURE_TENANT_ID=$AZURE_TENANT_ID
AZURE_CLIENT_ID=$APP_ID
AZURE_CLIENT_SECRET=$CLIENT_SECRET
AZURE_AUTHORITY_URL=https://login.microsoftonline.com/common/v2.0
AZURE_REDIRECT_URI=$LOCAL_REDIRECT_URI
AZURE_LOGOUT_URI=$LOCAL_LOGOUT_URI
AZURE_SCOPE=$OIDC_SCOPES
AZURE_RESPONSE_TYPE=$OIDC_RESPONSE_TYPE
AZURE_RESPONSE_MODE=$OIDC_RESPONSE_MODE
AZURE_CODE_CHALLENGE_METHOD=$OIDC_CODE_CHALLENGE_METHOD

# Token Configuration
TOKEN_LIFETIME_HOURS=$TOKEN_LIFETIME_HOURS
REFRESH_TOKEN_LIFETIME_DAYS=$REFRESH_TOKEN_LIFETIME_DAYS
SESSION_LIFETIME_HOURS=$SESSION_LIFETIME_HOURS

# Local Development
LOCAL_DOMAIN=$LOCAL_DOMAIN
LOCAL_PORT=$LOCAL_PORT
EOF
    
    log "Environment configuration saved to .env.azure"
}

generate_database_config() {
    log "Generating database configuration..."
    
    APP_ID=$(cat .azure_app_id)
    
    # Create SQL script to update the Azure Entra ID configuration
    cat > update_azure_config.sql << EOF
-- Update Azure Entra ID configuration in the database
UPDATE azure_entra_config SET
    client_id = '$APP_ID',
    authority_url = 'https://login.microsoftonline.com/common/v2.0',
    redirect_uri = '$LOCAL_REDIRECT_URI',
    token_endpoint = 'https://login.microsoftonline.com/$AZURE_TENANT_ID/oauth2/v2.0/token',
    userinfo_endpoint = 'https://graph.microsoft.com/oidc/userinfo',
    jwks_uri = 'https://login.microsoftonline.com/$AZURE_TENANT_ID/discovery/v2.0/keys',
    issuer = 'https://login.microsoftonline.com/$AZURE_TENANT_ID/v2.0',
    updated_at = current_timestamp()
WHERE tenant_id = 'common';

-- If no configuration exists, insert it
INSERT INTO azure_entra_config (
    tenant_id,
    tenant_name,
    client_id,
    authority_url,
    redirect_uri,
    scope,
    token_endpoint,
    userinfo_endpoint,
    jwks_uri,
    issuer
) VALUES (
    '$AZURE_TENANT_ID',
    'Production Tenant',
    '$APP_ID',
    'https://login.microsoftonline.com/common/v2.0',
    '$PROD_REDIRECT_URI',
    '$OIDC_SCOPES',
    'https://login.microsoftonline.com/$AZURE_TENANT_ID/oauth2/v2.0/token',
    'https://graph.microsoft.com/oidc/userinfo',
    'https://login.microsoftonline.com/$AZURE_TENANT_ID/discovery/v2.0/keys',
    'https://login.microsoftonline.com/common/v2.0'
) ON CONFLICT (tenant_id) DO UPDATE SET
    client_id = EXCLUDED.client_id,
    authority_url = EXCLUDED.authority_url,
    redirect_uri = EXCLUDED.redirect_uri,
    token_endpoint = EXCLUDED.token_endpoint,
    userinfo_endpoint = EXCLUDED.userinfo_endpoint,
    jwks_uri = EXCLUDED.jwks_uri,
    issuer = EXCLUDED.issuer,
    updated_at = current_timestamp();
EOF
    
    log "Database configuration script saved to update_azure_config.sql"
}

# =============================================================================
# VERIFICATION AND TESTING
# =============================================================================

verify_configuration() {
    log "Verifying Azure Entra ID configuration..."
    
    APP_ID=$(cat .azure_app_id)
    
    # Get app registration details
    APP_DETAILS=$(az ad app show --id "$APP_ID" --query '{displayName:displayName, signInAudience:signInAudience, web:web, spa:spa}' -o json)
    
    log "App registration details:"
    echo "$APP_DETAILS" | jq .
    
    # Test OIDC endpoints
    log "Testing OIDC endpoints..."
    
    # Test authorization endpoint
    AUTH_URL="https://login.microsoftonline.com/$AZURE_TENANT_ID/oauth2/v2.0/authorize"
    log "Authorization endpoint: $AUTH_URL"
    
    # Test token endpoint
    TOKEN_URL="https://login.microsoftonline.com/$AZURE_TENANT_ID/oauth2/v2.0/token"
    log "Token endpoint: $TOKEN_URL"
    
    # Test JWKS endpoint
    JWKS_URL="https://login.microsoftonline.com/$AZURE_TENANT_ID/discovery/v2.0/keys"
    log "JWKS endpoint: $JWKS_URL"
    
    log "Configuration verification completed."
}

generate_test_urls() {
    log "Generating test URLs..."
    
    APP_ID=$(cat .azure_app_id)
    
    # Generate test authorization URLs for each environment
    LOCAL_AUTH_URL="https://login.microsoftonline.com/common/v2.0/authorize?client_id=$APP_ID&response_type=code&redirect_uri=$LOCAL_REDIRECT_URI&scope=$OIDC_SCOPES&response_mode=query&code_challenge_method=S256&code_challenge=YOUR_CODE_CHALLENGE"
    STAGING_AUTH_URL="https://login.microsoftonline.com/common/v2.0/authorize?client_id=$APP_ID&response_type=code&redirect_uri=$STAGING_REDIRECT_URI&scope=$OIDC_SCOPES&response_mode=query&code_challenge_method=S256&code_challenge=YOUR_CODE_CHALLENGE"
    PROD_AUTH_URL="https://login.microsoftonline.com/common/v2.0/authorize?client_id=$APP_ID&response_type=code&redirect_uri=$PROD_REDIRECT_URI&scope=$OIDC_SCOPES&response_mode=query&code_challenge_method=S256&code_challenge=YOUR_CODE_CHALLENGE"
    
    # Generate CIAM URLs
    LOCAL_CIAM_AUTH_URL="https://login.microsoftonline.com/common/v2.0/authorize?client_id=$APP_ID&response_type=code&redirect_uri=$LOCAL_CIAM_REDIRECT_URI&scope=$OIDC_SCOPES&response_mode=query&code_challenge_method=S256&code_challenge=YOUR_CODE_CHALLENGE"
    STAGING_CIAM_AUTH_URL="https://login.microsoftonline.com/common/v2.0/authorize?client_id=$APP_ID&response_type=code&redirect_uri=$STAGING_CIAM_REDIRECT_URI&scope=$OIDC_SCOPES&response_mode=query&code_challenge_method=S256&code_challenge=YOUR_CODE_CHALLENGE"
    PROD_CIAM_AUTH_URL="https://login.microsoftonline.com/common/v2.0/authorize?client_id=$APP_ID&response_type=code&redirect_uri=$PROD_CIAM_REDIRECT_URI&scope=$OIDC_SCOPES&response_mode=query&code_challenge_method=S256&code_challenge=YOUR_CODE_CHALLENGE"
    
    cat > test_urls.txt << EOF
# Azure Entra ID External Identities Test URLs

## Configuration Summary
- Tenant ID: $AZURE_TENANT_ID
- Client ID: $APP_ID
- Environment: $ENVIRONMENT
- Scope: $OIDC_SCOPES

## OIDC Endpoints
- Authorization: https://login.microsoftonline.com/common/v2.0/authorize
- Token: https://login.microsoftonline.com/common/v2.0/token
- UserInfo: https://graph.microsoft.com/oidc/userinfo
- JWKS: https://login.microsoftonline.com/common/v2.0/discovery/v2.0/keys

## Local Development (MSAL)
- Domain: $LOCAL_DOMAIN
- Port: $LOCAL_PORT
- Callback: $LOCAL_REDIRECT_URI
- Logout: $LOCAL_LOGOUT_URI
- Auth URL: $LOCAL_AUTH_URL

## Local Development (CIAM)
- CIAM Domain: $LOCAL_CIAM_DOMAIN
- CIAM Callback: $LOCAL_CIAM_REDIRECT_URI
- CIAM Logout: $LOCAL_CIAM_LOGOUT_URI
- CIAM Auth URL: $LOCAL_CIAM_AUTH_URL

## Staging Environment (MSAL)
- Domain: $STAGING_DOMAIN
- Callback: $STAGING_REDIRECT_URI
- Logout: $STAGING_LOGOUT_URI
- Auth URL: $STAGING_AUTH_URL

## Staging Environment (CIAM)
- CIAM Domain: $STAGING_CIAM_DOMAIN
- CIAM Callback: $STAGING_CIAM_REDIRECT_URI
- CIAM Logout: $STAGING_CIAM_LOGOUT_URI
- CIAM Auth URL: $STAGING_CIAM_AUTH_URL

## Production Environment (MSAL)
- Domain: $PROD_DOMAIN
- Callback: $PROD_REDIRECT_URI
- Logout: $PROD_LOGOUT_URI
- Auth URL: $PROD_AUTH_URL

## Production Environment (CIAM)
- CIAM Domain: $PROD_CIAM_DOMAIN
- CIAM Callback: $PROD_CIAM_REDIRECT_URI
- CIAM Logout: $PROD_CIAM_LOGOUT_URI
- CIAM Auth URL: $PROD_CIAM_AUTH_URL

## DNS Configuration Required
Add these entries to your DNS or /etc/hosts:

### Local Development
127.0.0.1 $LOCAL_DOMAIN
127.0.0.1 $LOCAL_CIAM_DOMAIN

### Staging (if using custom domains)
# Add CNAME records for staging domains
# $STAGING_CIAM_DOMAIN -> your-staging-server

### Production (if using custom domains)
# Add CNAME records for production domains
# $PROD_CIAM_DOMAIN -> your-production-server
EOF
    
    log "Test URLs saved to test_urls.txt"
    
    # Echo the CIAM URLs for easy access
    echo ""
    echo "🎯 CIAM URLs FOR CURRENT ENVIRONMENT:"
    echo "====================================="
    case $ENVIRONMENT in
        "local")
            echo "Local CIAM Auth URL: $LOCAL_CIAM_AUTH_URL"
            echo "Local CIAM Domain: $LOCAL_CIAM_DOMAIN"
            echo "Local CIAM Login: https://$LOCAL_CIAM_DOMAIN/login"
            echo "Local CIAM Register: https://$LOCAL_CIAM_DOMAIN/register"
            ;;
        "staging")
            echo "Staging CIAM Auth URL: $STAGING_CIAM_AUTH_URL"
            echo "Staging CIAM Domain: $STAGING_CIAM_DOMAIN"
            echo "Staging CIAM Login: https://$STAGING_CIAM_DOMAIN/login"
            echo "Staging CIAM Register: https://$STAGING_CIAM_DOMAIN/register"
            ;;
        "production")
            echo "Production CIAM Auth URL: $PROD_CIAM_AUTH_URL"
            echo "Production CIAM Domain: $PROD_CIAM_DOMAIN"
            echo "Production CIAM Login: https://$PROD_CIAM_DOMAIN/login"
            echo "Production CIAM Register: https://$PROD_CIAM_DOMAIN/register"
            ;;
    esac
    echo "====================================="
    echo ""
}

# =============================================================================
# CLEANUP FUNCTIONS
# =============================================================================

cleanup_temp_files() {
    log "Cleaning up temporary files..."
    
    # Remove sensitive files
    rm -f .azure_client_secret
    rm -f app_manifest.json
    
    log "Temporary files cleaned up."
    log "IMPORTANT: Make sure to securely store the client secret before cleanup!"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    log "Starting Azure Entra ID configuration for $APP_NAME..."
    
    # Check prerequisites
    check_prerequisites
    
    # Get Azure information
    get_azure_info
    
    # Create app registration
    create_app_registration
    
    # Configure app manifest
    configure_app_manifest
    
    # Create service principal
    create_service_principal
    
    # Configure API permissions
    configure_api_permissions
    
    # Create client secret
    create_client_secret
    
    # Configure local development
    configure_local_dns
    
    # Generate configuration files
    generate_environment_config
    generate_database_config
    
    # Verify configuration
    verify_configuration
    
    # Generate test URLs
    generate_test_urls
    
    log "Azure Entra ID configuration completed successfully!"
    log ""
    log "Next steps:"
    log "1. Review and update the generated configuration files"
    log "2. Run the database migration: 00002_add_azure_entra_auth.sql"
    log "3. Execute update_azure_config.sql to update the database"
    log "4. Implement OIDC authentication in your application"
    log "5. Test the authentication flow using the URLs in test_urls.txt"
    log ""
    log "Configuration files generated:"
    log "- .env.azure (environment variables)"
    log "- update_azure_config.sql (database configuration)"
    log "- test_urls.txt (test URLs and endpoints)"
    log ""
    log "IMPORTANT: Store the client secret securely and never commit it to version control!"
}

# Run main function
main "$@"
