#!/bin/bash

# Check and Configure External Identities Script
# This script checks if External Identities is available and configures it if possible

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

echo "=========================================="
echo "External Identities Check and Configuration"
echo "=========================================="
echo ""

print_status "Checking if External Identities is available..."

# Check if External Identities commands are available
if az ad external-identities user-flow list >/dev/null 2>&1; then
    print_success "External Identities is available! 🎉"
    echo ""
    
    print_status "External Identities is enabled. You can now:"
    echo "  ✅ Create user flows for sign-up/sign-in"
    echo "  ✅ Configure Google, Facebook, LinkedIn identity providers"
    echo "  ✅ Get social login buttons and 'Create Account' options"
    echo "  ✅ Use hosted UI with custom branding"
    echo ""
    
    print_status "Running the External Identities configuration script..."
    
    # Run the original External Identities script
    if [ -f "./configure-external-identities.sh" ]; then
        ./configure-external-identities.sh
    else
        print_error "configure-external-identities.sh not found"
        print_status "Please run the original External Identities script manually"
    fi
    
else
    print_warning "External Identities is not available in this tenant"
    echo ""
    
    print_status "Current tenant details:"
    echo "  Tenant ID: $TENANT_ID"
    echo "  Subscription: $SUBSCRIPTION_ID"
    echo ""
    
    print_error "External Identities requires Azure AD Premium P1 or P2 license"
    echo ""
    
    print_status "To enable External Identities:"
    echo "1. Go to Azure Portal > Azure Active Directory > Overview"
    echo "2. Look for 'External Identities' section"
    echo "3. Click 'Get started' to enable (requires Premium license)"
    echo "4. Or purchase Azure AD Premium P1/P2 license"
    echo ""
    
    print_status "Alternative options:"
    echo "1. Use the multi-tenant app we already created (supports Microsoft accounts)"
    echo "2. Implement custom OAuth for Google/Facebook/LinkedIn in your app"
    echo "3. Switch to a tenant that has Premium licensing"
    echo ""
    
    print_status "Current multi-tenant app details:"
    echo "  App ID: 671a313a-1698-4a50-bd15-38acac5a66c3"
    echo "  Supports: Microsoft personal + work/school accounts"
    echo "  Login URL: https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
    echo ""
    
    print_warning "The multi-tenant app only shows Microsoft account login"
    print_warning "For social login buttons, you need External Identities"
fi

echo ""
print_status "Check complete!"
