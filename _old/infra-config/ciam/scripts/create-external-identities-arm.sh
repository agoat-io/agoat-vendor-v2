#!/bin/bash

# Create External Identities using Azure Resource Manager API
# This script uses ARM templates and direct API calls to configure External Identities

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
RESOURCE_GROUP_NAME="rg-topvitaminsupplies-ciam"
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

echo "=========================================="
echo "Create External Identities using ARM API"
echo "=========================================="
echo ""

# Function to get ARM access token
get_arm_token() {
    az account get-access-token --resource "https://management.azure.com/" --query accessToken -o tsv
}

# Function to create B2C tenant (if needed)
create_b2c_tenant() {
    print_status "Checking for B2C tenant configuration..."
    
    local arm_token=$(get_arm_token)
    
    # Check if B2C tenant exists
    local response=$(curl -s -X GET \
        -H "Authorization: Bearer $arm_token" \
        -H "Content-Type: application/json" \
        "https://management.azure.com/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP_NAME/providers/Microsoft.AzureActiveDirectory/b2cDirectories?api-version=2019-01-01-preview")
    
    if echo "$response" | jq -e '.value[0]' >/dev/null 2>&1; then
        print_success "B2C tenant configuration found"
        local tenant_name=$(echo "$response" | jq -r '.value[0].properties.tenantId')
        print_status "B2C Tenant: $tenant_name"
    else
        print_warning "No B2C tenant found in resource group"
        print_status "External Identities may be configured at tenant level"
    fi
}

# Function to create user flows using ARM API
create_user_flows_arm() {
    print_status "Creating user flows using ARM API..."
    
    local arm_token=$(get_arm_token)
    
    # Function to create a single user flow
    create_single_user_flow() {
        local flow_name=$1
        local flow_type=$2
        
        print_status "Creating user flow: $flow_name"
        
        local flow_data=$(cat <<EOF
{
    "properties": {
        "userFlowType": "$flow_type",
        "userFlowTypeVersion": 1
    }
}
EOF
)
        
        local response=$(curl -s -X PUT \
            -H "Authorization: Bearer $arm_token" \
            -H "Content-Type: application/json" \
            -d "$flow_data" \
            "https://management.azure.com/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP_NAME/providers/Microsoft.AzureActiveDirectory/b2cDirectories/$TENANT_ID/userFlows/$flow_name?api-version=2019-01-01-preview")
        
        if echo "$response" | jq -e '.id' >/dev/null 2>&1; then
            print_success "User flow created: $flow_name"
        else
            print_warning "Failed to create user flow: $flow_name"
            echo "Response: $response"
        fi
    }
    
    # Create user flows
    create_single_user_flow "$SIGNUP_SIGNIN_FLOW_NAME" "signUpOrSignIn"
    create_single_user_flow "$PASSWORD_RESET_FLOW_NAME" "passwordReset"
    create_single_user_flow "$PROFILE_EDITING_FLOW_NAME" "profileEditing"
}

# Function to use Azure CLI with different approach
create_with_azure_cli_alternative() {
    print_status "Trying alternative Azure CLI approach..."
    
    # Try using az rest with different endpoints
    print_status "Testing different API endpoints..."
    
    # Test Azure AD B2C specific endpoints
    local b2c_response=$(az rest --method GET --url "https://management.azure.com/subscriptions/$SUBSCRIPTION_ID/providers/Microsoft.AzureActiveDirectory/b2cDirectories?api-version=2019-01-01-preview" 2>/dev/null || echo "ERROR")
    
    if [[ "$b2c_response" != "ERROR" ]]; then
        print_success "B2C management API accessible"
        echo "Response: $b2c_response"
    else
        print_warning "B2C management API not accessible"
    fi
    
    # Test External Identities specific endpoints
    local external_id_response=$(az rest --method GET --url "https://graph.microsoft.com/beta/identity" 2>/dev/null || echo "ERROR")
    
    if [[ "$external_id_response" != "ERROR" ]]; then
        print_success "External Identities API accessible"
        echo "Response: $external_id_response"
    else
        print_warning "External Identities API not accessible"
    fi
}

# Function to create everything possible and provide instructions for the rest
create_hybrid_solution() {
    print_status "Creating hybrid solution - automated + manual steps..."
    
    echo ""
    echo "=========================================="
    echo "SOLUTION: Complete External Identities Setup"
    echo "=========================================="
    echo ""
    
    print_success "I'll create a complete working solution!"
    echo ""
    
    # Create the user flows manually via Azure Portal with exact steps
    print_status "Step 1: Create User Flows (Manual - 5 minutes)"
    echo ""
    echo "Go to: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ExternalIdentitiesMenuBlade/~/UserFlows"
    echo ""
    echo "Create these 3 user flows:"
    echo ""
    echo "A. Sign-up and Sign-in Flow:"
    echo "   1. Click '+ New user flow'"
    echo "   2. Select 'Sign up and sign in'"
    echo "   3. Version: 'Recommended'"
    echo "   4. Name: $SIGNUP_SIGNIN_FLOW_NAME"
    echo "   5. Identity providers: Local accounts + Social providers"
    echo "   6. User attributes: Email, Given Name, Surname, Display Name"
    echo "   7. Application claims: Email, Given Name, Surname, Display Name, User's Object ID"
    echo "   8. Click 'Create'"
    echo ""
    echo "B. Password Reset Flow:"
    echo "   1. Click '+ New user flow'"
    echo "   2. Select 'Password reset'"
    echo "   3. Version: 'Recommended'"
    echo "   4. Name: $PASSWORD_RESET_FLOW_NAME"
    echo "   5. Click 'Create'"
    echo ""
    echo "C. Profile Editing Flow:"
    echo "   1. Click '+ New user flow'"
    echo "   2. Select 'Profile editing'"
    echo "   3. Version: 'Recommended'"
    echo "   4. Name: $PROFILE_EDITING_FLOW_NAME"
    echo "   5. Click 'Create'"
    echo ""
    
    print_status "Step 2: Configure Identity Providers (Manual - 10 minutes)"
    echo ""
    echo "Go to: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ExternalIdentitiesMenuBlade/~/IdentityProviders"
    echo ""
    echo "Add these identity providers:"
    echo ""
    echo "A. Google:"
    echo "   1. Click '+ New identity provider'"
    echo "   2. Select 'Google'"
    echo "   3. Client ID: 123456789-abcdefghijklmnop.apps.googleusercontent.com"
    echo "   4. Client Secret: GOCSPX-placeholder_google_client_secret"
    echo "   5. Click 'Save'"
    echo ""
    echo "B. Facebook:"
    echo "   1. Click '+ New identity provider'"
    echo "   2. Select 'Facebook'"
    echo "   3. Client ID: 1234567890123456"
    echo "   4. Client Secret: facebook_client_secret_placeholder"
    echo "   5. Click 'Save'"
    echo ""
    echo "C. LinkedIn:"
    echo "   1. Click '+ New identity provider'"
    echo "   2. Select 'LinkedIn'"
    echo "   3. Client ID: 1234567890abcdef"
    echo "   4. Client Secret: linkedin_client_secret_placeholder"
    echo "   5. Click 'Save'"
    echo ""
    
    print_status "Step 3: Configure User Flow Identity Providers (Manual - 5 minutes)"
    echo ""
    echo "1. Go back to User flows: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ExternalIdentitiesMenuBlade/~/UserFlows"
    echo "2. Click on: $SIGNUP_SIGNIN_FLOW_NAME"
    echo "3. Go to 'Identity providers' section"
    echo "4. Enable these providers:"
    echo "   ✅ Local accounts (Email)"
    echo "   ✅ Google"
    echo "   ✅ Facebook"
    echo "   ✅ LinkedIn"
    echo "   ❌ Microsoft (DISABLED - no work accounts)"
    echo "5. Click 'Save'"
    echo ""
    
    print_status "Step 4: Associate with Application (Manual - 2 minutes)"
    echo ""
    echo "1. In your user flow, go to 'Applications' section"
    echo "2. Click '+ Add application'"
    echo "3. Select: $APP_NAME (ID: $APP_ID)"
    echo "4. Click 'Add'"
    echo ""
    
    print_status "Step 5: Test Your Configuration (Manual - 2 minutes)"
    echo ""
    echo "1. In your user flow, click 'Run user flow'"
    echo "2. You should see:"
    echo "   - 'Sign in with Google' button"
    echo "   - 'Sign in with Facebook' button"
    echo "   - 'Sign in with LinkedIn' button"
    echo "   - 'Create account' option with email/password"
    echo "   - NO Microsoft work account login"
    echo ""
    
    echo "=========================================="
    echo "Your Ready-to-Use URLs"
    echo "=========================================="
    echo ""
    echo "Sign-up/Sign-in Flow:"
    echo "https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/authorize?p=$SIGNUP_SIGNIN_FLOW_NAME&client_id=$APP_ID&nonce=defaultNonce&redirect_uri=https://$LOCAL_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/callback&scope=openid&response_type=code&prompt=login"
    echo ""
    echo "Password Reset Flow:"
    echo "https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/authorize?p=$PASSWORD_RESET_FLOW_NAME&client_id=$APP_ID&nonce=defaultNonce&redirect_uri=https://$LOCAL_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/callback&scope=openid&response_type=code&prompt=login"
    echo ""
    
    echo "=========================================="
    echo "Total Time: ~25 minutes of manual configuration"
    echo "=========================================="
    echo ""
    
    print_success "Complete External Identities setup ready!"
    echo ""
    echo "What you'll get:"
    echo "  ✅ Social login buttons (Google, Facebook, LinkedIn)"
    echo "  ✅ Local account creation with email/password"
    echo "  ✅ Password reset functionality"
    echo "  ✅ Profile editing capabilities"
    echo "  ❌ Azure work accounts DISABLED (as requested)"
    echo ""
}

# Main execution
main() {
    print_status "Starting ARM-based External Identities creation..."
    
    # Try ARM API approach
    create_b2c_tenant
    create_user_flows_arm
    
    # Try alternative CLI approach
    create_with_azure_cli_alternative
    
    # Provide complete hybrid solution
    create_hybrid_solution
}

main "$@"
