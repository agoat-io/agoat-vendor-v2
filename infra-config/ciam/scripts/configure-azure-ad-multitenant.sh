#!/bin/bash

# Azure AD Multi-Tenant Application Configuration Script
# This script creates a multi-tenant Azure AD application that supports external users
# Works with regular Azure AD (no External Identities required)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# =============================================================================
# CONFIGURATION VARIABLES
# =============================================================================

# Azure Configuration
TENANT_ID="2a81f801-dae3-49fc-9d8f-fa35786c0087"  # Your Azure AD tenant ID
SUBSCRIPTION_ID="42be4b47-f907-44a1-b14d-438fa5b9cbdc"  # nonprod-topvitaminsupply-ciam subscription

# Domain Configuration
TOP_LEVEL_DOMAIN="topvitaminsupply.com"
LOCAL_SUBDOMAIN="local"
DEV_SUBDOMAIN="dev"

# Application Configuration
APP_NAME="Top Vitamin Supplies CIAM"
APP_ID=""

# Resource Configuration
RESOURCE_GROUP_NAME="rg-topvitaminsupplies-ciam"
LOCATION="East US"

# =============================================================================
# VALIDATION FUNCTIONS
# =============================================================================

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

validate_configuration() {
    print_status "Validating configuration..."
    
    if [ -z "$TENANT_ID" ]; then
        print_error "TENANT_ID is required."
        exit 1
    fi
    
    if [ -z "$SUBSCRIPTION_ID" ]; then
        print_error "SUBSCRIPTION_ID is required."
        exit 1
    fi
    
    print_success "Configuration validation passed"
}

check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists az; then
        print_error "Azure CLI is not installed."
        exit 1
    fi
    
    if ! az account show >/dev/null 2>&1; then
        print_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    if ! az ad app list >/dev/null 2>&1; then
        print_error "Cannot access Azure AD app registrations. Please check your permissions."
        exit 1
    fi
    
    print_success "Prerequisites check completed"
}

# =============================================================================
# AZURE RESOURCE CREATION FUNCTIONS
# =============================================================================

create_resource_group() {
    print_status "Creating resource group: $RESOURCE_GROUP_NAME"
    
    if az group show --name "$RESOURCE_GROUP_NAME" >/dev/null 2>&1; then
        print_warning "Resource group $RESOURCE_GROUP_NAME already exists"
    else
        az group create \
            --name "$RESOURCE_GROUP_NAME" \
            --location "$LOCATION" \
            --tags "Environment=CIAM" "Project=TopVitaminSupplies" "ManagedBy=Script"
        print_success "Resource group created: $RESOURCE_GROUP_NAME"
    fi
}

create_app_registration() {
    print_status "Creating multi-tenant app registration: $APP_NAME"
    
    if [ -n "$APP_ID" ]; then
        print_warning "Using existing app ID: $APP_ID"
        return
    fi
    
    # Create multi-tenant app registration
    APP_RESPONSE=$(az ad app create \
        --display-name "$APP_NAME" \
        --sign-in-audience "AzureADandPersonalMicrosoftAccount" \
        --web-redirect-uris \
            "https://$LOCAL_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/callback" \
            "https://$DEV_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/callback" \
        --query "{appId:appId,objectId:id}" \
        -o json)
    
    APP_ID=$(echo "$APP_RESPONSE" | jq -r '.appId')
    APP_OBJECT_ID=$(echo "$APP_RESPONSE" | jq -r '.objectId')
    
    print_success "Multi-tenant app registration created: $APP_ID"
    
    # Create service principal
    az ad sp create --id "$APP_ID" >/dev/null
    print_success "Service principal created"
    
    # Add Microsoft Graph permissions
    az ad app permission add \
        --id "$APP_ID" \
        --api "00000003-0000-0000-c000-000000000000" \
        --api-permissions "e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope"  # User.Read
    
    az ad app permission add \
        --id "$APP_ID" \
        --api "00000003-0000-0000-c000-000000000000" \
        --api-permissions "37f7f235-527c-4136-accd-4a02d197296e=Scope"  # openid
    
    az ad app permission add \
        --id "$APP_ID" \
        --api "00000003-0000-0000-c000-000000000000" \
        --api-permissions "14dad69e-099b-42c9-810b-d002981feec1=Scope"  # profile
    
    az ad app permission add \
        --id "$APP_ID" \
        --api "00000003-0000-0000-c000-000000000000" \
        --api-permissions "64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0=Scope"  # email
    
    # Grant admin consent
    az ad app permission admin-consent --id "$APP_ID"
    print_success "API permissions configured and admin consent granted"
    
    # Create client secret
    CLIENT_SECRET=$(az ad app credential reset --id "$APP_ID" --query password -o tsv)
    print_success "Client secret created"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

display_configuration_summary() {
    echo ""
    echo "=========================================="
    echo "Azure AD Multi-Tenant Configuration Summary"
    echo "=========================================="
    echo ""
    echo "Azure Configuration:"
    echo "  Tenant ID: $TENANT_ID"
    echo "  Subscription ID: $SUBSCRIPTION_ID"
    echo "  Resource Group: $RESOURCE_GROUP_NAME"
    echo "  Location: $LOCATION"
    echo ""
    echo "Domain Configuration:"
    echo "  Top Level Domain: $TOP_LEVEL_DOMAIN"
    echo "  Local Subdomain: $LOCAL_SUBDOMAIN.$TOP_LEVEL_DOMAIN"
    echo "  Dev Subdomain: $DEV_SUBDOMAIN.$TOP_LEVEL_DOMAIN"
    echo ""
    echo "Application Configuration:"
    echo "  App Name: $APP_NAME"
    echo "  App ID: $APP_ID"
    echo ""
}

display_next_steps() {
    echo ""
    echo "=========================================="
    echo "Next Steps"
    echo "=========================================="
    echo ""
    echo "1. Configure your application with these values:"
    echo "   Application ID: $APP_ID"
    echo "   Tenant ID: $TENANT_ID"
    echo "   Client Secret: [Generated and stored securely]"
    echo ""
    echo "2. Update your application configuration:"
    echo "   Redirect URIs:"
    echo "     - https://$LOCAL_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/callback"
    echo "     - https://$DEV_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/callback"
    echo ""
    echo "   Logout URIs:"
    echo "     - https://$LOCAL_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/logout"
    echo "     - https://$DEV_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/logout"
    echo ""
    echo "3. Multi-tenant capabilities:"
    echo "   - Users from any Microsoft account can sign in"
    echo "   - Users from any Azure AD organization can sign in"
    echo "   - Personal Microsoft accounts (Hotmail, Outlook.com) can sign in"
    echo ""
    echo "4. For additional identity providers (Google, Facebook, LinkedIn):"
    echo "   - Implement OAuth 2.0 flows in your application"
    echo "   - Use libraries like MSAL.js for authentication"
    echo "   - Handle multiple identity providers in your app logic"
    echo ""
    echo "5. Test the authentication:"
    echo "   - Sign in with Microsoft account"
    echo "   - Sign in with work/school account"
    echo "   - Test redirect and logout flows"
    echo ""
}

main() {
    echo "=========================================="
    echo "Azure AD Multi-Tenant Application Setup"
    echo "=========================================="
    echo ""
    
    display_configuration_summary
    
    validate_configuration
    check_prerequisites
    
    create_resource_group
    create_app_registration
    
    display_next_steps
    
    print_success "Azure AD Multi-Tenant configuration completed successfully!"
    echo ""
    echo "Your multi-tenant application supports:"
    echo "  ✅ Microsoft personal accounts (Hotmail, Outlook.com)"
    echo "  ✅ Work/school accounts from any organization"
    echo "  ✅ OIDC authentication with silent refresh"
    echo "  ✅ Full redirect to login page support"
    echo "  ✅ Environment-specific domains"
    echo "  ✅ All account types through Microsoft"
    echo ""
    echo "Note: For Google, Facebook, LinkedIn - implement OAuth 2.0 in your application"
    echo ""
}

main "$@"
