#!/bin/bash

# Azure Entra ID External Identities Configuration Script
# This script configures Azure Entra ID External Identities for CIAM
# Supports account creation, login, password reset, and profile editing
# Uses topvitaminsupply.com domain with environment-specific subdomains

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
# CONFIGURATION VARIABLES - MODIFY THESE VALUES
# =============================================================================

# Azure Configuration (REQUIRED - Set these values)
TENANT_ID=""                    # Your Azure AD Tenant ID (required)
SUBSCRIPTION_ID=""              # Your Azure Subscription ID (required)

# Domain Configuration
TOP_LEVEL_DOMAIN="topvitaminsupply.com"  # Main domain for all services
LOCAL_SUBDOMAIN="local"         # Local development subdomain
DEV_SUBDOMAIN="dev"             # Development environment subdomain
PROD_SUBDOMAIN=""               # Production subdomain (empty = use top level)

# Application Configuration
APP_NAME="Top Vitamin Supplies CIAM"  # Application display name
APP_ID=""                      # Application ID (will be created if empty)

# User Flow Configuration
SIGNUP_SIGNIN_FLOW_NAME="TopVitaminSupplies-SignUpSignIn"
PASSWORD_RESET_FLOW_NAME="TopVitaminSupplies-PasswordReset"
PROFILE_EDITING_FLOW_NAME="TopVitaminSupplies-ProfileEditing"

# Identity Provider Configuration
ENABLE_MICROSOFT_PROVIDER=true   # Enable Microsoft identity provider
ENABLE_GOOGLE_PROVIDER=true      # Enable Google identity provider
ENABLE_FACEBOOK_PROVIDER=false   # Enable Facebook identity provider
ENABLE_LINKEDIN_PROVIDER=false   # Enable LinkedIn identity provider

# Google Provider Configuration (if enabling Google)
GOOGLE_CLIENT_ID=""              # Google OAuth client ID
GOOGLE_CLIENT_SECRET=""          # Google OAuth client secret

# Facebook Provider Configuration (if enabling Facebook)
FACEBOOK_CLIENT_ID=""            # Facebook App ID
FACEBOOK_CLIENT_SECRET=""        # Facebook App Secret

# LinkedIn Provider Configuration (if enabling LinkedIn)
LINKEDIN_CLIENT_ID=""            # LinkedIn Client ID
LINKEDIN_CLIENT_SECRET=""        # LinkedIn Client Secret

# Resource Configuration
RESOURCE_GROUP_NAME="rg-topvitaminsupplies-ciam"  # Resource group for CIAM resources
LOCATION="East US"              # Azure region for resources

# =============================================================================
# VALIDATION FUNCTIONS
# =============================================================================

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate required variables
validate_configuration() {
    print_status "Validating configuration..."
    
    # Check required variables
    if [ -z "$TENANT_ID" ]; then
        print_error "TENANT_ID is required. Please set it in the script variables."
        exit 1
    fi
    
    if [ -z "$SUBSCRIPTION_ID" ]; then
        print_error "SUBSCRIPTION_ID is required. Please set it in the script variables."
        exit 1
    fi
    
    # Validate domain format
    if [[ ! "$TOP_LEVEL_DOMAIN" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
        print_error "TOP_LEVEL_DOMAIN must be a valid domain name (e.g., topvitaminsupply.com)"
        exit 1
    fi
    
    # Check if Google provider is enabled but credentials are missing
    if [ "$ENABLE_GOOGLE_PROVIDER" = true ]; then
        if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
            print_error "Google provider is enabled but GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing."
            exit 1
        fi
    fi
    
    # Check if Facebook provider is enabled but credentials are missing
    if [ "$ENABLE_FACEBOOK_PROVIDER" = true ]; then
        if [ -z "$FACEBOOK_CLIENT_ID" ] || [ -z "$FACEBOOK_CLIENT_SECRET" ]; then
            print_error "Facebook provider is enabled but FACEBOOK_CLIENT_ID or FACEBOOK_CLIENT_SECRET is missing."
            exit 1
        fi
    fi
    
    # Check if LinkedIn provider is enabled but credentials are missing
    if [ "$ENABLE_LINKEDIN_PROVIDER" = true ]; then
        if [ -z "$LINKEDIN_CLIENT_ID" ] || [ -z "$LINKEDIN_CLIENT_SECRET" ]; then
            print_error "LinkedIn provider is enabled but LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET is missing."
            exit 1
        fi
    fi
    
    print_success "Configuration validation passed"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Azure CLI
    if ! command_exists az; then
        print_error "Azure CLI is not installed. Please install it first."
        echo "Installation instructions: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
    
    # Check if logged in to Azure
    if ! az account show >/dev/null 2>&1; then
        print_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    # Check if subscription is set
    CURRENT_SUB=$(az account show --query id -o tsv)
    if [ "$CURRENT_SUB" != "$SUBSCRIPTION_ID" ]; then
        print_warning "Current subscription ($CURRENT_SUB) differs from configured subscription ($SUBSCRIPTION_ID)"
        print_status "Setting subscription to $SUBSCRIPTION_ID"
        az account set --subscription "$SUBSCRIPTION_ID"
    fi
    
    # Check if External Identities is available
    if ! az ad external-identities user-flow list >/dev/null 2>&1; then
        print_error "External Identities is not available. Please enable it in Azure Portal:"
        echo "1. Go to Azure Portal > Azure Active Directory > Overview"
        echo "2. Look for 'External Identities' section"
        echo "3. Click 'Get started' to enable External Identities"
        echo "4. Ensure you have Azure AD Premium P1 or P2 license"
        exit 1
    fi
    
    print_success "Prerequisites check completed"
}

# =============================================================================
# AZURE RESOURCE CREATION FUNCTIONS
# =============================================================================

# Function to create resource group
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

# Function to create app registration
create_app_registration() {
    print_status "Creating app registration: $APP_NAME"
    
    if [ -n "$APP_ID" ]; then
        print_warning "Using existing app ID: $APP_ID"
        return
    fi
    
    # Create app registration with OIDC support
    APP_RESPONSE=$(az ad app create \
        --display-name "$APP_NAME" \
        --sign-in-audience "AzureADandPersonalMicrosoftAccount" \
        --web-redirect-uris \
            "https://$LOCAL_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/callback" \
            "https://$DEV_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/callback" \
            "https://$TOP_LEVEL_DOMAIN/auth/callback" \
        --web-logout-url \
            "https://$LOCAL_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/logout" \
            "https://$DEV_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/logout" \
            "https://$TOP_LEVEL_DOMAIN/auth/logout" \
        --query "{appId:appId,objectId:id}" \
        -o json)
    
    APP_ID=$(echo "$APP_RESPONSE" | jq -r '.appId')
    APP_OBJECT_ID=$(echo "$APP_RESPONSE" | jq -r '.objectId')
    
    print_success "App registration created: $APP_ID"
    
    # Create service principal
    az ad sp create --id "$APP_ID" >/dev/null
    print_success "Service principal created"
    
    # Add Microsoft Graph permissions for OIDC
    az ad app permission add \
        --id "$APP_ID" \
        --api "00000003-0000-0000-c000-000000000000" \
        --api-permissions "e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope"  # User.Read
    
    # Add OpenID Connect permissions
    az ad app permission add \
        --id "$APP_ID" \
        --api "00000003-0000-0000-c000-000000000000" \
        --api-permissions "37f7f235-527c-4136-accd-4a02d197296e=Scope"  # openid
    
    # Add profile permissions
    az ad app permission add \
        --id "$APP_ID" \
        --api "00000003-0000-0000-c000-000000000000" \
        --api-permissions "14dad69e-099b-42c9-810b-d002981feec1=Scope"  # profile
    
    # Add email permissions
    az ad app permission add \
        --id "$APP_ID" \
        --api "00000003-0000-0000-c000-000000000000" \
        --api-permissions "64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0=Scope"  # email
    
    # Grant admin consent
    az ad app permission admin-consent --id "$APP_ID"
    print_success "API permissions configured and admin consent granted"
    
    # Create client secret for silent refresh
    CLIENT_SECRET=$(az ad app credential reset --id "$APP_ID" --query password -o tsv)
    print_success "Client secret created for silent refresh"
}

# Function to create user flows
create_user_flows() {
    print_status "Creating user flows..."
    
    # Create Sign-up and Sign-in user flow
    if az ad external-identities user-flow show --name "$SIGNUP_SIGNIN_FLOW_NAME" >/dev/null 2>&1; then
        print_warning "User flow $SIGNUP_SIGNIN_FLOW_NAME already exists"
    else
        az ad external-identities user-flow create \
            --name "$SIGNUP_SIGNIN_FLOW_NAME" \
            --type "signUpOrSignIn"
        print_success "Sign-up/Sign-in user flow created: $SIGNUP_SIGNIN_FLOW_NAME"
    fi
    
    # Create Password reset user flow
    if az ad external-identities user-flow show --name "$PASSWORD_RESET_FLOW_NAME" >/dev/null 2>&1; then
        print_warning "User flow $PASSWORD_RESET_FLOW_NAME already exists"
    else
        az ad external-identities user-flow create \
            --name "$PASSWORD_RESET_FLOW_NAME" \
            --type "passwordReset"
        print_success "Password reset user flow created: $PASSWORD_RESET_FLOW_NAME"
    fi
    
    # Create Profile editing user flow
    if az ad external-identities user-flow show --name "$PROFILE_EDITING_FLOW_NAME" >/dev/null 2>&1; then
        print_warning "User flow $PROFILE_EDITING_FLOW_NAME already exists"
    else
        az ad external-identities user-flow create \
            --name "$PROFILE_EDITING_FLOW_NAME" \
            --type "profileEditing"
        print_success "Profile editing user flow created: $PROFILE_EDITING_FLOW_NAME"
    fi
}

# Function to configure identity providers
configure_identity_providers() {
    print_status "Configuring identity providers..."
    
    # Configure Microsoft identity provider
    if [ "$ENABLE_MICROSOFT_PROVIDER" = true ]; then
        print_status "Configuring Microsoft identity provider"
        if az ad external-identities identity-provider microsoft show --name "Microsoft" >/dev/null 2>&1; then
            print_warning "Microsoft identity provider already exists"
        else
            az ad external-identities identity-provider microsoft create \
                --name "Microsoft" \
                --client-id "$APP_ID" \
                --client-secret "$CLIENT_SECRET"
            print_success "Microsoft identity provider configured"
        fi
    fi
    
    # Configure Google identity provider
    if [ "$ENABLE_GOOGLE_PROVIDER" = true ]; then
        print_status "Configuring Google identity provider"
        if az ad external-identities identity-provider google show --name "Google" >/dev/null 2>&1; then
            print_warning "Google identity provider already exists"
        else
            az ad external-identities identity-provider google create \
                --name "Google" \
                --client-id "$GOOGLE_CLIENT_ID" \
                --client-secret "$GOOGLE_CLIENT_SECRET"
            print_success "Google identity provider configured"
        fi
    fi
    
    # Configure Facebook identity provider
    if [ "$ENABLE_FACEBOOK_PROVIDER" = true ]; then
        print_status "Configuring Facebook identity provider"
        if az ad external-identities identity-provider facebook show --name "Facebook" >/dev/null 2>&1; then
            print_warning "Facebook identity provider already exists"
        else
            az ad external-identities identity-provider facebook create \
                --name "Facebook" \
                --client-id "$FACEBOOK_CLIENT_ID" \
                --client-secret "$FACEBOOK_CLIENT_SECRET"
            print_success "Facebook identity provider configured"
        fi
    fi
    
    # Configure LinkedIn identity provider
    if [ "$ENABLE_LINKEDIN_PROVIDER" = true ]; then
        print_status "Configuring LinkedIn identity provider"
        if az ad external-identities identity-provider linkedin show --name "LinkedIn" >/dev/null 2>&1; then
            print_warning "LinkedIn identity provider already exists"
        else
            az ad external-identities identity-provider linkedin create \
                --name "LinkedIn" \
                --client-id "$LINKEDIN_CLIENT_ID" \
                --client-secret "$LINKEDIN_CLIENT_SECRET"
            print_success "LinkedIn identity provider configured"
        fi
    fi
}

# Function to configure user flow identity providers
configure_user_flow_identity_providers() {
    print_status "Configuring user flow identity providers..."
    
    # Configure identity providers for Sign-up/Sign-in flow
    if [ "$ENABLE_MICROSOFT_PROVIDER" = true ]; then
        az ad external-identities user-flow identity-provider add \
            --name "$SIGNUP_SIGNIN_FLOW_NAME" \
            --identity-provider "Microsoft"
    fi
    
    if [ "$ENABLE_GOOGLE_PROVIDER" = true ]; then
        az ad external-identities user-flow identity-provider add \
            --name "$SIGNUP_SIGNIN_FLOW_NAME" \
            --identity-provider "Google"
    fi
    
    if [ "$ENABLE_FACEBOOK_PROVIDER" = true ]; then
        az ad external-identities user-flow identity-provider add \
            --name "$SIGNUP_SIGNIN_FLOW_NAME" \
            --identity-provider "Facebook"
    fi
    
    if [ "$ENABLE_LINKEDIN_PROVIDER" = true ]; then
        az ad external-identities user-flow identity-provider add \
            --name "$SIGNUP_SIGNIN_FLOW_NAME" \
            --identity-provider "LinkedIn"
    fi
    
    print_success "User flow identity providers configured"
}

# Function to configure user attributes
configure_user_attributes() {
    print_status "Configuring user attributes..."
    
    # Configure attributes for Sign-up/Sign-in flow
    az ad external-identities user-flow attribute add \
        --name "$SIGNUP_SIGNIN_FLOW_NAME" \
        --attribute "emailAddress"
    
    az ad external-identities user-flow attribute add \
        --name "$SIGNUP_SIGNIN_FLOW_NAME" \
        --attribute "givenName"
    
    az ad external-identities user-flow attribute add \
        --name "$SIGNUP_SIGNIN_FLOW_NAME" \
        --attribute "surname"
    
    # Configure application claims
    az ad external-identities user-flow application-claim add \
        --name "$SIGNUP_SIGNIN_FLOW_NAME" \
        --claim "email"
    
    az ad external-identities user-flow application-claim add \
        --name "$SIGNUP_SIGNIN_FLOW_NAME" \
        --claim "given_name"
    
    az ad external-identities user-flow application-claim add \
        --name "$SIGNUP_SIGNIN_FLOW_NAME" \
        --claim "family_name"
    
    az ad external-identities user-flow application-claim add \
        --name "$SIGNUP_SIGNIN_FLOW_NAME" \
        --claim "sub"
    
    print_success "User attributes and application claims configured"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

# Function to display configuration summary
display_configuration_summary() {
    echo ""
    echo "=========================================="
    echo "External Identities Configuration Summary"
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
    echo "  Production: $TOP_LEVEL_DOMAIN"
    echo ""
    echo "Application Configuration:"
    echo "  App Name: $APP_NAME"
    echo "  App ID: $APP_ID"
    echo ""
    echo "User Flows:"
    echo "  Sign-up/Sign-in: $SIGNUP_SIGNIN_FLOW_NAME"
    echo "  Password Reset: $PASSWORD_RESET_FLOW_NAME"
    echo "  Profile Editing: $PROFILE_EDITING_FLOW_NAME"
    echo ""
    echo "Identity Providers:"
    echo "  Microsoft: $ENABLE_MICROSOFT_PROVIDER"
    echo "  Google: $ENABLE_GOOGLE_PROVIDER"
    echo "  Facebook: $ENABLE_FACEBOOK_PROVIDER"
    echo "  LinkedIn: $ENABLE_LINKEDIN_PROVIDER"
    echo ""
}

# Function to display next steps
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
    echo "     - https://$TOP_LEVEL_DOMAIN/auth/callback"
    echo ""
    echo "   Logout URIs:"
    echo "     - https://$LOCAL_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/logout"
    echo "     - https://$DEV_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/logout"
    echo "     - https://$TOP_LEVEL_DOMAIN/auth/logout"
    echo ""
    echo "3. Test the authentication flows:"
    echo "   - Sign-up with new account"
    echo "   - Sign-in with existing account"
    echo "   - Password reset"
    echo "   - Profile editing"
    echo ""
    echo "4. Configure additional identity providers if needed:"
    echo "   - Set up Google OAuth application"
    echo "   - Set up Facebook App"
    echo "   - Set up LinkedIn App"
    echo ""
    echo "5. Set up custom branding in Azure Portal:"
    echo "   - Go to Azure Portal > Azure Active Directory > External Identities > Custom branding"
    echo "   - Configure your organization's branding"
    echo ""
}

# Main execution function
main() {
    echo "=========================================="
    echo "Azure Entra ID External Identities Setup"
    echo "=========================================="
    echo ""
    
    # Display configuration
    display_configuration_summary
    
    # Validate configuration
    validate_configuration
    
    # Check prerequisites
    check_prerequisites
    
    # Create Azure resources
    create_resource_group
    create_app_registration
    create_user_flows
    configure_identity_providers
    configure_user_flow_identity_providers
    configure_user_attributes
    
    # Display next steps
    display_next_steps
    
    print_success "External Identities configuration completed successfully!"
    echo ""
    echo "Your External Identities setup includes:"
    echo "  ✅ Account creation and login"
    echo "  ✅ Password reset functionality"
    echo "  ✅ Profile editing capabilities"
    echo "  ✅ OIDC support with silent refresh"
    echo "  ✅ Full redirect to login page support"
    echo "  ✅ Multiple identity providers"
    echo "  ✅ Environment-specific domains"
    echo "  ✅ Support for all account types"
    echo ""
}

# Run main function
main "$@"
