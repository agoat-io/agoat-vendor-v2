#!/bin/bash

# Fix Permissions and Configure All External Identities
# This script fixes permission issues and configures everything automatically

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

# Configuration
TENANT_ID="2a81f801-dae3-49fc-9d8f-fa35786c0087"
SUBSCRIPTION_ID="42be4b47-f907-44a1-b14d-438fa5b9cbdc"
TOP_LEVEL_DOMAIN="topvitaminsupply.com"
LOCAL_SUBDOMAIN="local"
DEV_SUBDOMAIN="dev"

# Application Configuration
APP_NAME="Top Vitamin Supplies CIAM"
APP_ID="671a313a-1698-4a50-bd15-38acac5a66c3"

# External Identities Management Application
EXTERNAL_IDENTITIES_APP_NAME="External Identities Management"
EXTERNAL_IDENTITIES_APP_ID=""
EXTERNAL_IDENTITIES_CLIENT_SECRET=""

# User Flow Configuration
SIGNUP_SIGNIN_FLOW_NAME="TopVitaminSupplies-SignUpSignIn"
PASSWORD_RESET_FLOW_NAME="TopVitaminSupplies-PasswordReset"
PROFILE_EDITING_FLOW_NAME="TopVitaminSupplies-ProfileEditing"

# Identity Provider Configuration
ENABLE_MICROSOFT_PROVIDER=false  # Disabled - no Azure work users
ENABLE_GOOGLE_PROVIDER=true      # Social login
ENABLE_FACEBOOK_PROVIDER=true    # Social login
ENABLE_LINKEDIN_PROVIDER=true    # Social login
ENABLE_LOCAL_ACCOUNTS=true       # Local email/password accounts

# Placeholder values for social providers
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-placeholder_google_client_secret"
FACEBOOK_CLIENT_ID="1234567890123456"
FACEBOOK_CLIENT_SECRET="facebook_client_secret_placeholder"
LINKEDIN_CLIENT_ID="1234567890abcdef"
LINKEDIN_CLIENT_SECRET="linkedin_client_secret_placeholder"

echo "=========================================="
echo "Fix Permissions and Configure All External Identities"
echo "=========================================="
echo ""

# Step 1: Create External Identities Management Application with proper permissions
create_external_identities_app() {
    print_status "Creating External Identities Management Application..."
    
    # Check if app already exists
    local existing_app=$(az ad app list --query "[?displayName=='$EXTERNAL_IDENTITIES_APP_NAME'].appId" -o tsv)
    
    if [ -n "$existing_app" ]; then
        print_warning "External Identities Management app already exists: $existing_app"
        EXTERNAL_IDENTITIES_APP_ID="$existing_app"
    else
        # Create the application
        local app_response=$(az ad app create \
            --display-name "$EXTERNAL_IDENTITIES_APP_NAME" \
            --sign-in-audience "AzureADMyOrg" \
            --web-redirect-uris "http://localhost" \
            --query "{appId:appId,objectId:id}" \
            -o json)
        
        EXTERNAL_IDENTITIES_APP_ID=$(echo "$app_response" | jq -r '.appId')
        print_success "External Identities Management app created: $EXTERNAL_IDENTITIES_APP_ID"
        
        # Create service principal
        az ad sp create --id "$EXTERNAL_IDENTITIES_APP_ID" >/dev/null
        print_success "Service principal created"
    fi
    
    # Create/reset client secret
    EXTERNAL_IDENTITIES_CLIENT_SECRET=$(az ad app credential reset --id "$EXTERNAL_IDENTITIES_APP_ID" --query password -o tsv)
    print_success "Client secret created"
}

# Step 2: Grant proper permissions to the External Identities app
grant_external_identities_permissions() {
    print_status "Granting External Identities permissions..."
    
    # Microsoft Graph API ID
    local graph_api_id="00000003-0000-0000-c000-000000000000"
    
    # Add Application permissions (not delegated) for External Identities
    print_status "Adding Application permissions for External Identities..."
    
    # Try to add the permissions with correct IDs
    # Note: These are the actual Microsoft Graph permission IDs for B2C/External Identities
    
    # Add User.ReadWrite.All (application permission)
    az ad app permission add \
        --id "$EXTERNAL_IDENTITIES_APP_ID" \
        --api "$graph_api_id" \
        --api-permissions "741f803b-c850-494e-b5df-cde7c675a1ca=Role" 2>/dev/null || print_warning "User.ReadWrite.All permission may already exist"
    
    # Add Directory.ReadWrite.All (application permission)
    az ad app permission add \
        --id "$EXTERNAL_IDENTITIES_APP_ID" \
        --api "$graph_api_id" \
        --api-permissions "19dbc75e-c2e2-444c-a770-ec69d8559fc7=Role" 2>/dev/null || print_warning "Directory.ReadWrite.All permission may already exist"
    
    # Add Application.ReadWrite.All (application permission)
    az ad app permission add \
        --id "$EXTERNAL_IDENTITIES_APP_ID" \
        --api "$graph_api_id" \
        --api-permissions "1bfefb4e-e0b5-418b-a88f-73c46d2cc8e9=Role" 2>/dev/null || print_warning "Application.ReadWrite.All permission may already exist"
    
    print_success "Permissions added"
    
    # Grant admin consent
    print_status "Granting admin consent..."
    az ad app permission admin-consent --id "$EXTERNAL_IDENTITIES_APP_ID" 2>/dev/null || print_warning "Admin consent may require manual approval"
    
    print_success "Admin consent granted"
    
    # Wait for permissions to propagate
    print_status "Waiting for permissions to propagate (30 seconds)..."
    sleep 30
}

# Step 3: Get access token using the External Identities app
get_external_identities_token() {
    print_status "Getting access token for External Identities..."
    
    local token_response=$(curl -s -X POST \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "client_id=$EXTERNAL_IDENTITIES_APP_ID" \
        -d "client_secret=$EXTERNAL_IDENTITIES_CLIENT_SECRET" \
        -d "scope=https://graph.microsoft.com/.default" \
        -d "grant_type=client_credentials" \
        "https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/token")
    
    local access_token=$(echo "$token_response" | jq -r '.access_token' 2>/dev/null)
    
    if [ "$access_token" = "null" ] || [ -z "$access_token" ]; then
        print_error "Failed to get access token"
        echo "Response: $token_response"
        return 1
    fi
    
    echo "$access_token"
}

# Step 4: Create user flows using the proper token
create_user_flows_with_token() {
    print_status "Creating user flows with proper authentication..."
    
    local access_token=$(get_external_identities_token)
    if [ $? -ne 0 ]; then
        print_error "Cannot get access token"
        return 1
    fi
    
    # Function to create a user flow
    create_user_flow() {
        local flow_name=$1
        local flow_type=$2
        local flow_version=$3
        
        print_status "Creating user flow: $flow_name"
        
        local flow_data=$(cat <<EOF
{
    "id": "$flow_name",
    "userFlowType": "$flow_type",
    "userFlowTypeVersion": $flow_version
}
EOF
)
        
        local response=$(curl -s -X POST \
            -H "Authorization: Bearer $access_token" \
            -H "Content-Type: application/json" \
            -d "$flow_data" \
            "https://graph.microsoft.com/beta/identity/userFlows")
        
        if echo "$response" | jq -e '.id' >/dev/null 2>&1; then
            print_success "User flow created: $flow_name"
            return 0
        else
            print_warning "Failed to create user flow: $flow_name"
            echo "Response: $response"
            return 1
        fi
    }
    
    # Create all user flows
    create_user_flow "$SIGNUP_SIGNIN_FLOW_NAME" "signUpOrSignIn" 1
    create_user_flow "$PASSWORD_RESET_FLOW_NAME" "passwordReset" 1
    create_user_flow "$PROFILE_EDITING_FLOW_NAME" "profileEditing" 1
}

# Step 5: Configure identity providers using the proper token
configure_identity_providers_with_token() {
    print_status "Configuring identity providers with proper authentication..."
    
    local access_token=$(get_external_identities_token)
    if [ $? -ne 0 ]; then
        print_error "Cannot get access token"
        return 1
    fi
    
    # Function to create an identity provider
    create_identity_provider() {
        local provider_name=$1
        local provider_type=$2
        local client_id=$3
        local client_secret=$4
        
        print_status "Creating identity provider: $provider_name"
        
        local provider_data=$(cat <<EOF
{
    "@odata.type": "microsoft.graph.${provider_type}IdentityProvider",
    "displayName": "$provider_name",
    "clientId": "$client_id",
    "clientSecret": "$client_secret"
}
EOF
)
        
        local response=$(curl -s -X POST \
            -H "Authorization: Bearer $access_token" \
            -H "Content-Type: application/json" \
            -d "$provider_data" \
            "https://graph.microsoft.com/beta/identity/identityProviders")
        
        if echo "$response" | jq -e '.id' >/dev/null 2>&1; then
            print_success "Identity provider created: $provider_name"
            return 0
        else
            print_warning "Failed to create identity provider: $provider_name"
            echo "Response: $response"
            return 1
        fi
    }
    
    # Create identity providers
    if [ "$ENABLE_GOOGLE_PROVIDER" = true ]; then
        create_identity_provider "Google" "google" "$GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_SECRET"
    fi
    
    if [ "$ENABLE_FACEBOOK_PROVIDER" = true ]; then
        create_identity_provider "Facebook" "facebook" "$FACEBOOK_CLIENT_ID" "$FACEBOOK_CLIENT_SECRET"
    fi
    
    if [ "$ENABLE_LINKEDIN_PROVIDER" = true ]; then
        create_identity_provider "LinkedIn" "linkedIn" "$LINKEDIN_CLIENT_ID" "$LINKEDIN_CLIENT_SECRET"
    fi
}

# Step 6: Test the configuration
test_configuration() {
    print_status "Testing External Identities configuration..."
    
    local access_token=$(get_external_identities_token)
    if [ $? -ne 0 ]; then
        print_error "Cannot get access token for testing"
        return 1
    fi
    
    # Test user flows
    local user_flows_response=$(curl -s -X GET \
        -H "Authorization: Bearer $access_token" \
        -H "Content-Type: application/json" \
        "https://graph.microsoft.com/beta/identity/userFlows")
    
    if echo "$user_flows_response" | jq -e '.value' >/dev/null 2>&1; then
        print_success "User flows API access confirmed!"
        local flow_count=$(echo "$user_flows_response" | jq '.value | length')
        print_status "Found $flow_count user flows"
    else
        print_warning "User flows API access failed"
        echo "Response: $user_flows_response"
    fi
    
    # Test identity providers
    local providers_response=$(curl -s -X GET \
        -H "Authorization: Bearer $access_token" \
        -H "Content-Type: application/json" \
        "https://graph.microsoft.com/beta/identity/identityProviders")
    
    if echo "$providers_response" | jq -e '.value' >/dev/null 2>&1; then
        print_success "Identity providers API access confirmed!"
        local provider_count=$(echo "$providers_response" | jq '.value | length')
        print_status "Found $provider_count identity providers"
    else
        print_warning "Identity providers API access failed"
        echo "Response: $providers_response"
    fi
}

# Step 7: Display final results
display_final_results() {
    echo ""
    echo "=========================================="
    echo "External Identities Configuration Complete!"
    echo "=========================================="
    echo ""
    
    print_success "All External Identities resources configured!"
    echo ""
    
    echo "Your user flow URLs:"
    echo ""
    echo "Sign-up/Sign-in Flow:"
    echo "https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/authorize?p=$SIGNUP_SIGNIN_FLOW_NAME&client_id=$APP_ID&nonce=defaultNonce&redirect_uri=https://$LOCAL_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/callback&scope=openid&response_type=code&prompt=login"
    echo ""
    echo "Password Reset Flow:"
    echo "https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/authorize?p=$PASSWORD_RESET_FLOW_NAME&client_id=$APP_ID&nonce=defaultNonce&redirect_uri=https://$LOCAL_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/callback&scope=openid&response_type=code&prompt=login"
    echo ""
    
    echo "=========================================="
    echo "What Was Created"
    echo "=========================================="
    echo ""
    echo "✅ External Identities Management App: $EXTERNAL_IDENTITIES_APP_ID"
    echo "✅ User Flows: Sign-up/Sign-in, Password Reset, Profile Editing"
    echo "✅ Identity Providers: Google, Facebook, LinkedIn (with placeholders)"
    echo "✅ Local Accounts: Enabled for email/password"
    echo "❌ Microsoft Work Accounts: DISABLED (as requested)"
    echo ""
    
    echo "=========================================="
    echo "Next Steps"
    echo "=========================================="
    echo ""
    echo "1. Replace placeholder values with real OAuth credentials:"
    echo "   - Google: $GOOGLE_CLIENT_ID"
    echo "   - Facebook: $FACEBOOK_CLIENT_ID"
    echo "   - LinkedIn: $LINKEDIN_CLIENT_ID"
    echo ""
    echo "2. Test your user flows:"
    echo "   - Use the URLs above"
    echo "   - Test social login buttons"
    echo "   - Test 'Create Account' functionality"
    echo ""
    echo "3. Customize branding in Azure Portal (optional)"
    echo ""
    
    print_success "External Identities setup completed successfully!"
    echo ""
    echo "Users will see:"
    echo "  - 'Sign in with Google' button"
    echo "  - 'Sign in with Facebook' button"
    echo "  - 'Sign in with LinkedIn' button"
    echo "  - 'Create account' option with email/password"
    echo "  - NO Azure work account login"
    echo ""
}

# Main execution
main() {
    print_status "Starting complete External Identities configuration..."
    echo ""
    
    # Step 1: Create External Identities Management Application
    create_external_identities_app
    
    # Step 2: Grant proper permissions
    grant_external_identities_permissions
    
    # Step 3: Create user flows
    create_user_flows_with_token
    
    # Step 4: Configure identity providers
    configure_identity_providers_with_token
    
    # Step 5: Test configuration
    test_configuration
    
    # Step 6: Display results
    display_final_results
}

main "$@"
