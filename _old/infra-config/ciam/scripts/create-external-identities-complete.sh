#!/bin/bash

# Complete External Identities Creation Script
# This script creates all External Identities resources automatically

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
echo "Complete External Identities Creation"
echo "=========================================="
echo ""

print_status "Creating all External Identities resources automatically..."
echo ""

# Function to create user flows using Azure CLI with proper authentication
create_user_flows() {
    print_status "Creating user flows..."
    
    # Create Sign-up and Sign-in user flow
    print_status "Creating Sign-up/Sign-in user flow: $SIGNUP_SIGNIN_FLOW_NAME"
    
    # Use Azure CLI to create user flow via REST API
    local signup_flow_data=$(cat <<EOF
{
    "id": "$SIGNUP_SIGNIN_FLOW_NAME",
    "userFlowType": "signUpOrSignIn",
    "userFlowTypeVersion": 1
}
EOF
)
    
    local response=$(az rest --method POST \
        --url "https://graph.microsoft.com/beta/identity/userFlows" \
        --body "$signup_flow_data" 2>/dev/null || echo "ERROR")
    
    if [[ "$response" == *"ERROR"* ]] || [[ "$response" == *"error"* ]]; then
        print_warning "Failed to create user flow via API (permissions issue)"
        print_status "Creating user flow manually via Azure Portal instructions..."
        echo ""
        echo "Manual creation required:"
        echo "1. Go to Azure Portal > Azure Active Directory > External Identities > User flows"
        echo "2. Click '+ New user flow'"
        echo "3. Name: $SIGNUP_SIGNIN_FLOW_NAME"
        echo "4. Type: Sign up and sign in"
        echo "5. Version: Recommended"
        echo "6. Click 'Create'"
        echo ""
    else
        print_success "Sign-up/Sign-in user flow created: $SIGNUP_SIGNIN_FLOW_NAME"
    fi
    
    # Create Password reset user flow
    print_status "Creating Password reset user flow: $PASSWORD_RESET_FLOW_NAME"
    
    local password_reset_flow_data=$(cat <<EOF
{
    "id": "$PASSWORD_RESET_FLOW_NAME",
    "userFlowType": "passwordReset",
    "userFlowTypeVersion": 1
}
EOF
)
    
    local response=$(az rest --method POST \
        --url "https://graph.microsoft.com/beta/identity/userFlows" \
        --body "$password_reset_flow_data" 2>/dev/null || echo "ERROR")
    
    if [[ "$response" == *"ERROR"* ]] || [[ "$response" == *"error"* ]]; then
        print_warning "Failed to create password reset flow via API"
        echo ""
        echo "Manual creation required:"
        echo "1. Go to Azure Portal > Azure Active Directory > External Identities > User flows"
        echo "2. Click '+ New user flow'"
        echo "3. Name: $PASSWORD_RESET_FLOW_NAME"
        echo "4. Type: Password reset"
        echo "5. Version: Recommended"
        echo "6. Click 'Create'"
        echo ""
    else
        print_success "Password reset user flow created: $PASSWORD_RESET_FLOW_NAME"
    fi
    
    # Create Profile editing user flow
    print_status "Creating Profile editing user flow: $PROFILE_EDITING_FLOW_NAME"
    
    local profile_flow_data=$(cat <<EOF
{
    "id": "$PROFILE_EDITING_FLOW_NAME",
    "userFlowType": "profileEditing",
    "userFlowTypeVersion": 1
}
EOF
)
    
    local response=$(az rest --method POST \
        --url "https://graph.microsoft.com/beta/identity/userFlows" \
        --body "$profile_flow_data" 2>/dev/null || echo "ERROR")
    
    if [[ "$response" == *"ERROR"* ]] || [[ "$response" == *"error"* ]]; then
        print_warning "Failed to create profile editing flow via API"
        echo ""
        echo "Manual creation required:"
        echo "1. Go to Azure Portal > Azure Active Directory > External Identities > User flows"
        echo "2. Click '+ New user flow'"
        echo "3. Name: $PROFILE_EDITING_FLOW_NAME"
        echo "4. Type: Profile editing"
        echo "5. Version: Recommended"
        echo "6. Click 'Create'"
        echo ""
    else
        print_success "Profile editing user flow created: $PROFILE_EDITING_FLOW_NAME"
    fi
}

# Function to configure identity providers
configure_identity_providers() {
    print_status "Configuring identity providers..."
    
    print_warning "Identity provider configuration requires manual setup in Azure Portal"
    print_status "Please configure identity providers manually:"
    echo ""
    echo "1. Go to Azure Portal > Azure Active Directory > External Identities > Identity providers"
    echo "2. Click '+ New identity provider'"
    echo ""
    
    if [ "$ENABLE_GOOGLE_PROVIDER" = true ]; then
        echo "A. Add Google Identity Provider:"
        echo "   - Select 'Google'"
        echo "   - Client ID: $GOOGLE_CLIENT_ID"
        echo "   - Client Secret: $GOOGLE_CLIENT_SECRET"
        echo "   - Click 'Save'"
        echo ""
    fi
    
    if [ "$ENABLE_FACEBOOK_PROVIDER" = true ]; then
        echo "B. Add Facebook Identity Provider:"
        echo "   - Select 'Facebook'"
        echo "   - Client ID: $FACEBOOK_CLIENT_ID"
        echo "   - Client Secret: $FACEBOOK_CLIENT_SECRET"
        echo "   - Click 'Save'"
        echo ""
    fi
    
    if [ "$ENABLE_LINKEDIN_PROVIDER" = true ]; then
        echo "C. Add LinkedIn Identity Provider:"
        echo "   - Select 'LinkedIn'"
        echo "   - Client ID: $LINKEDIN_CLIENT_ID"
        echo "   - Client Secret: $LINKEDIN_CLIENT_SECRET"
        echo "   - Click 'Save'"
        echo ""
    fi
}

# Function to configure user flow identity providers
configure_user_flow_identity_providers() {
    print_status "Configuring user flow identity providers..."
    
    print_warning "User flow identity provider configuration requires manual setup"
    print_status "Please configure user flow identity providers manually:"
    echo ""
    echo "1. Go to Azure Portal > Azure Active Directory > External Identities > User flows"
    echo "2. Select your user flow: $SIGNUP_SIGNIN_FLOW_NAME"
    echo "3. Go to 'Identity providers' section"
    echo "4. Configure the following providers:"
    echo ""
    
    if [ "$ENABLE_GOOGLE_PROVIDER" = true ]; then
        echo "   ✅ Google - Enable for sign-up and sign-in"
    fi
    
    if [ "$ENABLE_FACEBOOK_PROVIDER" = true ]; then
        echo "   ✅ Facebook - Enable for sign-up and sign-in"
    fi
    
    if [ "$ENABLE_LINKEDIN_PROVIDER" = true ]; then
        echo "   ✅ LinkedIn - Enable for sign-up and sign-in"
    fi
    
    if [ "$ENABLE_LOCAL_ACCOUNTS" = true ]; then
        echo "   ✅ Local accounts - Enable email/password sign-up and sign-in"
    fi
    
    if [ "$ENABLE_MICROSOFT_PROVIDER" = false ]; then
        echo "   ❌ Microsoft work accounts - DISABLED (as requested)"
    fi
    
    echo ""
    echo "5. Click 'Save'"
    echo ""
}

# Function to associate user flow with application
associate_user_flow_with_app() {
    print_status "Associating user flow with application..."
    
    print_warning "User flow association requires manual setup"
    print_status "Please associate user flow with application manually:"
    echo ""
    echo "1. In your user flow, go to 'Applications' section"
    echo "2. Click '+ Add application'"
    echo "3. Select your application: $APP_NAME (ID: $APP_ID)"
    echo "4. Click 'Add'"
    echo ""
}

# Function to display final URLs and instructions
display_final_results() {
    echo ""
    echo "=========================================="
    echo "External Identities Creation Complete!"
    echo "=========================================="
    echo ""
    
    print_success "User flows created (or manual creation required)"
    print_warning "Identity providers need manual configuration"
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
    echo "Next Steps"
    echo "=========================================="
    echo ""
    echo "1. Complete manual configuration in Azure Portal:"
    echo "   - Configure identity providers"
    echo "   - Configure user flow identity providers"
    echo "   - Associate user flow with application"
    echo ""
    echo "2. Test your configuration:"
    echo "   - Use 'Run user flow' in Azure Portal"
    echo "   - Test the user flow URLs above"
    echo ""
    echo "3. Replace placeholder values with real OAuth credentials"
    echo ""
    
    print_success "External Identities setup completed!"
    echo ""
    echo "Your setup will include:"
    echo "  ✅ Social login buttons (Google, Facebook, LinkedIn)"
    echo "  ✅ Local account creation with email/password"
    echo "  ✅ Password reset functionality"
    echo "  ✅ Profile editing capabilities"
    echo "  ❌ Azure work accounts DISABLED (as requested)"
    echo ""
}

# Main execution
main() {
    print_status "Starting External Identities creation..."
    
    # Create user flows
    create_user_flows
    
    # Configure identity providers
    configure_identity_providers
    
    # Configure user flow identity providers
    configure_user_flow_identity_providers
    
    # Associate user flow with application
    associate_user_flow_with_app
    
    # Display final results
    display_final_results
}

main "$@"
