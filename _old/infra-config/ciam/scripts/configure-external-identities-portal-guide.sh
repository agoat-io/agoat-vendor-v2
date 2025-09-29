#!/bin/bash

# External Identities Portal Configuration Guide
# This script provides step-by-step instructions for configuring External Identities
# with social logins and local accounts, excluding Azure work users

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
echo "External Identities Portal Configuration"
echo "=========================================="
echo ""

print_success "External Identities is enabled in your tenant! 🎉"
print_status "Follow these steps to configure social logins and local accounts"
echo ""

echo "=========================================="
echo "Step 1: Create User Flows"
echo "=========================================="
echo ""
echo "1. Go to Azure Portal: https://portal.azure.com"
echo "2. Navigate to: Azure Active Directory > External Identities > User flows"
echo "3. Click '+ New user flow'"
echo ""
echo "Create these user flows:"
echo ""
echo "A. Sign-up and Sign-in Flow:"
echo "   - Name: $SIGNUP_SIGNIN_FLOW_NAME"
echo "   - Type: Sign up and sign in"
echo "   - Version: Recommended"
echo "   - Click 'Create'"
echo ""
echo "B. Password Reset Flow:"
echo "   - Name: $PASSWORD_RESET_FLOW_NAME"
echo "   - Type: Password reset"
echo "   - Version: Recommended"
echo "   - Click 'Create'"
echo ""
echo "C. Profile Editing Flow:"
echo "   - Name: $PROFILE_EDITING_FLOW_NAME"
echo "   - Type: Profile editing"
echo "   - Version: Recommended"
echo "   - Click 'Create'"
echo ""

echo "=========================================="
echo "Step 2: Configure Identity Providers"
echo "=========================================="
echo ""
echo "1. Go to: Azure Active Directory > External Identities > Identity providers"
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

echo "=========================================="
echo "Step 3: Configure User Flow Identity Providers"
echo "=========================================="
echo ""
echo "1. Go to: Azure Active Directory > External Identities > User flows"
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

echo "=========================================="
echo "Step 4: Configure User Attributes"
echo "=========================================="
echo ""
echo "1. In your user flow, go to 'User attributes' section"
echo "2. Select the attributes you want to collect:"
echo "   - Email Address (required)"
echo "   - Given Name"
echo "   - Surname"
echo "   - Display Name"
echo "   - Job Title (optional)"
echo "   - Company Name (optional)"
echo ""
echo "3. Go to 'Application claims' section"
echo "4. Select the claims you want to return to your application:"
echo "   - Email Address"
echo "   - Given Name"
echo "   - Surname"
echo "   - Display Name"
echo "   - User's Object ID"
echo ""
echo "5. Click 'Save'"
echo ""

echo "=========================================="
echo "Step 5: Associate User Flow with Application"
echo "=========================================="
echo ""
echo "1. In your user flow, go to 'Applications' section"
echo "2. Click '+ Add application'"
echo "3. Select your application: $APP_NAME (ID: $APP_ID)"
echo "4. Click 'Add'"
echo ""

echo "=========================================="
echo "Step 6: Test Your Configuration"
echo "=========================================="
echo ""
echo "1. In your user flow, go to 'Overview' section"
echo "2. Click 'Run user flow'"
echo "3. You should see:"
echo "   - 'Sign in with Google' button"
echo "   - 'Sign in with Facebook' button"
echo "   - 'Sign in with LinkedIn' button"
echo "   - 'Create account' option with email/password"
echo "   - NO Azure work account login"
echo ""
echo "4. Test each authentication method"
echo "5. Verify redirect to your application works"
echo ""

echo "=========================================="
echo "Step 7: Get User Flow URLs"
echo "=========================================="
echo ""
echo "After configuration, your user flow URLs will be:"
echo ""
echo "Sign-up/Sign-in Flow:"
echo "https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/authorize?p=$SIGNUP_SIGNIN_FLOW_NAME&client_id=$APP_ID&nonce=defaultNonce&redirect_uri=https://$LOCAL_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/callback&scope=openid&response_type=code&prompt=login"
echo ""
echo "Password Reset Flow:"
echo "https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/authorize?p=$PASSWORD_RESET_FLOW_NAME&client_id=$APP_ID&nonce=defaultNonce&redirect_uri=https://$LOCAL_SUBDOMAIN.$TOP_LEVEL_DOMAIN/auth/callback&scope=openid&response_type=code&prompt=login"
echo ""

echo "=========================================="
echo "Step 8: Replace Placeholder Values"
echo "=========================================="
echo ""
echo "Replace these placeholder values with real credentials:"
echo ""
echo "Google OAuth:"
echo "  - Go to Google Cloud Console: https://console.cloud.google.com"
echo "  - Create OAuth 2.0 credentials"
echo "  - Update: $GOOGLE_CLIENT_ID and $GOOGLE_CLIENT_SECRET"
echo ""
echo "Facebook App:"
echo "  - Go to Facebook Developers: https://developers.facebook.com"
echo "  - Create a Facebook App"
echo "  - Update: $FACEBOOK_CLIENT_ID and $FACEBOOK_CLIENT_SECRET"
echo ""
echo "LinkedIn App:"
echo "  - Go to LinkedIn Developers: https://www.linkedin.com/developers"
echo "  - Create a LinkedIn App"
echo "  - Update: $LINKEDIN_CLIENT_ID and $LINKEDIN_CLIENT_SECRET"
echo ""

echo "=========================================="
echo "Step 9: Custom Branding (Optional)"
echo "=========================================="
echo ""
echo "1. Go to: Azure Active Directory > External Identities > Custom branding"
echo "2. Configure your organization's branding:"
echo "   - Logo"
echo "   - Background image"
echo "   - Colors"
echo "   - Text"
echo ""

print_success "Configuration instructions completed!"
echo ""
echo "Your External Identities setup will include:"
echo "  ✅ Social login buttons (Google, Facebook, LinkedIn)"
echo "  ✅ Local account creation with email/password"
echo "  ✅ Password reset functionality"
echo "  ✅ Profile editing capabilities"
echo "  ✅ OIDC support with silent refresh"
echo "  ✅ Full redirect to login page support"
echo "  ✅ Environment-specific domains"
echo "  ❌ Azure work accounts DISABLED (as requested)"
echo ""
echo "Users will see:"
echo "  - 'Sign in with Google' button"
echo "  - 'Sign in with Facebook' button"
echo "  - 'Sign in with LinkedIn' button"
echo "  - 'Create account' option with email/password"
echo "  - NO Azure work account login"
echo ""
echo "=========================================="
echo "Quick Start URLs"
echo "=========================================="
echo ""
echo "Azure Portal: https://portal.azure.com"
echo "External Identities: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ExternalIdentitiesMenuBlade/~/UserFlows"
echo "Identity Providers: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ExternalIdentitiesMenuBlade/~/IdentityProviders"
echo "Custom Branding: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ExternalIdentitiesMenuBlade/~/CustomBranding"
echo ""
