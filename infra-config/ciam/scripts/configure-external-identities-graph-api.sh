#!/bin/bash

# Configure External Identities using Microsoft Graph API
# This script works when External Identities is enabled but Azure CLI commands are not available

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

# User Flow Configuration
SIGNUP_SIGNIN_FLOW_NAME="TopVitaminSupplies-SignUpSignIn"
PASSWORD_RESET_FLOW_NAME="TopVitaminSupplies-PasswordReset"
PROFILE_EDITING_FLOW_NAME="TopVitaminSupplies-ProfileEditing"

# Identity Provider Configuration
ENABLE_MICROSOFT_PROVIDER=true
ENABLE_GOOGLE_PROVIDER=true
ENABLE_FACEBOOK_PROVIDER=true
ENABLE_LINKEDIN_PROVIDER=true

# Placeholder values for social providers (replace with real values)
GOOGLE_CLIENT_ID="google-client-id-placeholder"
GOOGLE_CLIENT_SECRET="google-client-secret-placeholder"
FACEBOOK_CLIENT_ID="facebook-client-id-placeholder"
FACEBOOK_CLIENT_SECRET="facebook-client-secret-placeholder"
LINKEDIN_CLIENT_ID="linkedin-client-id-placeholder"
LINKEDIN_CLIENT_SECRET="linkedin-client-secret-placeholder"

echo "=========================================="
echo "External Identities Configuration via Graph API"
echo "=========================================="
echo ""

print_status "External Identities is enabled in your tenant! 🎉"
print_status "Using Microsoft Graph API to configure user flows and identity providers"
echo ""

# Function to get access token
get_access_token() {
    az account get-access-token --resource "https://graph.microsoft.com" --query accessToken -o tsv
}

# Function to make Graph API calls
graph_api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$(get_access_token)
    
    if [ -n "$data" ]; then
        curl -s -X "$method" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "https://graph.microsoft.com/beta$endpoint"
    else
        curl -s -X "$method" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            "https://graph.microsoft.com/beta$endpoint"
    fi
}

# Function to check if user flow exists
check_user_flow_exists() {
    local flow_name=$1
    local response=$(graph_api_call "GET" "/identity/userFlows")
    echo "$response" | jq -r ".value[] | select(.id == \"$flow_name\") | .id" 2>/dev/null || echo ""
}

# Function to create user flow
create_user_flow() {
    local flow_name=$1
    local flow_type=$2
    local flow_version=$3
    
    print_status "Creating user flow: $flow_name"
    
    if [ -n "$(check_user_flow_exists "$flow_name")" ]; then
        print_warning "User flow $flow_name already exists"
        return
    fi
    
    local flow_data=$(cat <<EOF
{
    "id": "$flow_name",
    "userFlowType": "$flow_type",
    "userFlowTypeVersion": $flow_version
}
EOF
)
    
    local response=$(graph_api_call "POST" "/identity/userFlows" "$flow_data")
    
    if echo "$response" | jq -e '.id' >/dev/null 2>&1; then
        print_success "User flow created: $flow_name"
    else
        print_error "Failed to create user flow: $flow_name"
        echo "Response: $response"
    fi
}

# Function to configure identity providers
configure_identity_providers() {
    print_status "Configuring identity providers..."
    
    # Note: Identity provider configuration via Graph API is complex
    # For now, we'll provide instructions for manual configuration
    
    print_warning "Identity provider configuration via Graph API requires additional setup"
    print_status "Please configure identity providers manually in Azure Portal:"
    echo ""
    echo "1. Go to Azure Portal > Azure Active Directory > External Identities > Identity providers"
    echo "2. Add Google identity provider:"
    echo "   - Client ID: $GOOGLE_CLIENT_ID"
    echo "   - Client Secret: $GOOGLE_CLIENT_SECRET"
    echo ""
    echo "3. Add Facebook identity provider:"
    echo "   - Client ID: $FACEBOOK_CLIENT_ID"
    echo "   - Client Secret: $FACEBOOK_CLIENT_SECRET"
    echo ""
    echo "4. Add LinkedIn identity provider:"
    echo "   - Client ID: $LINKEDIN_CLIENT_ID"
    echo "   - Client Secret: $LINKEDIN_CLIENT_SECRET"
    echo ""
}

# Function to get user flow URLs
get_user_flow_urls() {
    print_status "Getting user flow URLs..."
    
    local base_url="https://login.microsoftonline.com/$TENANT_ID"
    
    echo ""
    echo "=========================================="
    echo "External Identities User Flow URLs"
    echo "=========================================="
    echo ""
    echo "Sign-up and Sign-in Flow:"
    echo "  $base_url/oauth2/v2.0/authorize?p=$SIGNUP_SIGNIN_FLOW_NAME&client_id=$APP_ID&nonce=defaultNonce&redirect_uri=https://$LOCAL_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/callback&scope=openid&response_type=code&prompt=login"
    echo ""
    echo "Password Reset Flow:"
    echo "  $base_url/oauth2/v2.0/authorize?p=$PASSWORD_RESET_FLOW_NAME&client_id=$APP_ID&nonce=defaultNonce&redirect_uri=https://$LOCAL_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/callback&scope=openid&response_type=code&prompt=login"
    echo ""
    echo "Profile Editing Flow:"
    echo "  $base_url/oauth2/v2.0/authorize?p=$PROFILE_EDITING_FLOW_NAME&client_id=$APP_ID&nonce=defaultNonce&redirect_uri=https://$LOCAL_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/callback&scope=openid&response_type=code&prompt=login"
    echo ""
}

# Main execution
main() {
    print_status "Checking External Identities access..."
    
    # Test if we can access External Identities APIs
    local test_response=$(graph_api_call "GET" "/identity/userFlows")
    
    if echo "$test_response" | jq -e '.value' >/dev/null 2>&1; then
        print_success "External Identities API access confirmed!"
    else
        print_error "Cannot access External Identities APIs"
        print_status "You may need to grant additional permissions to your Azure CLI application"
        echo "Response: $test_response"
        exit 1
    fi
    
    echo ""
    print_status "Creating user flows..."
    
    # Create user flows
    create_user_flow "$SIGNUP_SIGNIN_FLOW_NAME" "signUpOrSignIn" 1
    create_user_flow "$PASSWORD_RESET_FLOW_NAME" "passwordReset" 1
    create_user_flow "$PROFILE_EDITING_FLOW_NAME" "profileEditing" 1
    
    echo ""
    configure_identity_providers
    
    echo ""
    get_user_flow_urls
    
    echo ""
    print_success "External Identities configuration completed!"
    echo ""
    print_status "Next steps:"
    echo "1. Configure identity providers in Azure Portal"
    echo "2. Update your application to use the user flow URLs"
    echo "3. Test the social login buttons and 'Create Account' functionality"
    echo ""
    print_warning "Note: You'll need to replace placeholder values with real client IDs and secrets"
    echo "for Google, Facebook, and LinkedIn identity providers"
}

main "$@"
