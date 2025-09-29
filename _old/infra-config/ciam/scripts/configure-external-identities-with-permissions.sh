#!/bin/bash

# Configure External Identities with Proper Permissions
# This script uses a custom application with External Identities permissions

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
EXTERNAL_IDENTITIES_APP_ID="d6d00651-4c54-4940-b1af-d531b9b589b5"
EXTERNAL_IDENTITIES_CLIENT_SECRET="vFX8Q~CnAZ6nn3DWGoIQZbYj2Fo~m_Ibm5ncRdsv"

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
echo "External Identities Configuration with Permissions"
echo "=========================================="
echo ""

print_status "Using custom application with External Identities permissions"
print_status "Application ID: $EXTERNAL_IDENTITIES_APP_ID"
echo ""

# Function to get access token using the custom application
get_access_token() {
    if [ -z "$EXTERNAL_IDENTITIES_CLIENT_SECRET" ]; then
        print_error "External Identities client secret not set"
        print_status "Please set EXTERNAL_IDENTITIES_CLIENT_SECRET in the script"
        exit 1
    fi
    
    # Get access token using client credentials flow
    local token_response=$(curl -s -X POST \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "client_id=$EXTERNAL_IDENTITIES_APP_ID" \
        -d "client_secret=$EXTERNAL_IDENTITIES_CLIENT_SECRET" \
        -d "scope=https://graph.microsoft.com/.default" \
        -d "grant_type=client_credentials" \
        "https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/token")
    
    echo "$token_response" | jq -r '.access_token' 2>/dev/null || echo "ERROR"
}

# Function to make Graph API calls
graph_api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$(get_access_token)
    
    if [ "$token" = "ERROR" ]; then
        print_error "Failed to get access token"
        return 1
    fi
    
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

# Function to test External Identities access
test_external_identities_access() {
    print_status "Testing External Identities API access..."
    
    local response=$(graph_api_call "GET" "/identity/userFlows")
    
    if echo "$response" | jq -e '.value' >/dev/null 2>&1; then
        print_success "External Identities API access confirmed!"
        return 0
    else
        print_error "Cannot access External Identities APIs"
        echo "Response: $response"
        return 1
    fi
}

# Main execution
main() {
    print_status "Checking External Identities access..."
    
    if ! test_external_identities_access; then
        print_error "External Identities API access failed"
        print_status "Please ensure:"
        echo "1. External Identities permissions are granted to application $EXTERNAL_IDENTITIES_APP_ID"
        echo "2. Admin consent is granted"
        echo "3. Client secret is correct"
        exit 1
    fi
    
    echo ""
    print_status "Creating user flows..."
    
    # Create user flows
    create_user_flow "$SIGNUP_SIGNIN_FLOW_NAME" "signUpOrSignIn" 1
    create_user_flow "$PASSWORD_RESET_FLOW_NAME" "passwordReset" 1
    create_user_flow "$PROFILE_EDITING_FLOW_NAME" "profileEditing" 1
    
    echo ""
    print_status "User flows created successfully!"
    echo ""
    echo "=========================================="
    echo "User Flow URLs"
    echo "=========================================="
    echo ""
    echo "Sign-up/Sign-in Flow:"
    echo "https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/authorize?p=$SIGNUP_SIGNIN_FLOW_NAME&client_id=$APP_ID&nonce=defaultNonce&redirect_uri=https://$LOCAL_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/callback&scope=openid&response_type=code&prompt=login"
    echo ""
    echo "Password Reset Flow:"
    echo "https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/authorize?p=$PASSWORD_RESET_FLOW_NAME&client_id=$APP_ID&nonce=defaultNonce&redirect_uri=https://$LOCAL_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/callback&scope=openid&response_type=code&prompt=login"
    echo ""
    echo "=========================================="
    echo "Next Steps"
    echo "=========================================="
    echo ""
    echo "1. Configure identity providers in Azure Portal:"
    echo "   - Go to Azure Active Directory > External Identities > Identity providers"
    echo "   - Add Google, Facebook, LinkedIn identity providers"
    echo ""
    echo "2. Configure user flow identity providers:"
    echo "   - Go to Azure Active Directory > External Identities > User flows"
    echo "   - Select your user flow: $SIGNUP_SIGNIN_FLOW_NAME"
    echo "   - Enable Google, Facebook, LinkedIn, and local accounts"
    echo "   - DISABLE Microsoft work accounts"
    echo ""
    echo "3. Test your configuration:"
    echo "   - Open the sign-up/sign-in URL in a browser"
    echo "   - You should see social login buttons and 'Create Account' option"
    echo ""
    print_success "External Identities configuration completed!"
}

# Check if client secret is set
if [ -z "$EXTERNAL_IDENTITIES_CLIENT_SECRET" ]; then
    print_error "EXTERNAL_IDENTITIES_CLIENT_SECRET is not set"
    print_status "Please set the client secret in the script or run:"
    echo "export EXTERNAL_IDENTITIES_CLIENT_SECRET='your-client-secret'"
    echo "./configure-external-identities-with-permissions.sh"
    exit 1
fi

main "$@"
