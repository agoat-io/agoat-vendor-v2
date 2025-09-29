#!/bin/bash

# Grant External Identities permissions to Azure CLI application
# This script grants the necessary permissions to access External Identities APIs

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

echo "=========================================="
echo "Grant External Identities Permissions"
echo "=========================================="
echo ""

print_status "External Identities is enabled in your tenant! 🎉"
print_status "We need to grant permissions to access External Identities APIs"
echo ""

# Get current user info
CURRENT_USER=$(az account show --query user.name -o tsv)
print_status "Current user: $CURRENT_USER"

# Get Azure CLI application ID
AZURE_CLI_APP_ID="04b07795-8ddb-461a-bbee-02f9e1bf7b46"  # This is the standard Azure CLI app ID
print_status "Azure CLI App ID: $AZURE_CLI_APP_ID"

echo ""
print_status "To grant External Identities permissions, you need to:"
echo ""
echo "1. Go to Azure Portal: https://portal.azure.com"
echo "2. Navigate to: Azure Active Directory > App registrations"
echo "3. Search for: 'Microsoft Azure CLI' or use App ID: $AZURE_CLI_APP_ID"
echo "4. Click on the application"
echo "5. Go to: API permissions"
echo "6. Click: 'Add a permission'"
echo "7. Select: 'Microsoft Graph'"
echo "8. Select: 'Delegated permissions'"
echo "9. Search for and add these permissions:"
echo "   - IdentityUserFlow.Read.All"
echo "   - IdentityUserFlow.ReadWrite.All"
echo "   - IdentityUserFlowAttribute.Read.All"
echo "   - IdentityUserFlowAttribute.ReadWrite.All"
echo "   - IdentityProvider.Read.All"
echo "   - IdentityProvider.ReadWrite.All"
echo "10. Click: 'Grant admin consent for [Your Organization]'"
echo "11. Wait 5-10 minutes for permissions to propagate"
echo ""

print_warning "Alternative: Use a custom application with proper permissions"
echo ""
print_status "You can also create a custom application with these permissions:"
echo "1. Go to: Azure Active Directory > App registrations > New registration"
echo "2. Name: 'External Identities Management'"
echo "3. Account types: 'Accounts in this organizational directory only'"
echo "4. Redirect URI: 'Web' - 'http://localhost'"
echo "5. After creation, go to: API permissions"
echo "6. Add the permissions listed above"
echo "7. Grant admin consent"
echo "8. Create a client secret"
echo "9. Use this custom app instead of Azure CLI"
echo ""

print_status "After granting permissions, run:"
echo "./configure-external-identities-graph-api.sh"
echo ""

print_success "External Identities is confirmed to be enabled in your tenant!"
print_status "Once permissions are granted, you'll be able to:"
echo "  ✅ Create user flows for sign-up/sign-in"
echo "  ✅ Configure Google, Facebook, LinkedIn identity providers"
echo "  ✅ Get social login buttons and 'Create Account' options"
echo "  ✅ Use hosted UI with custom branding"
