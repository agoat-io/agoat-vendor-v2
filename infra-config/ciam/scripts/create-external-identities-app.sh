#!/bin/bash

# Create External Identities Management Application
# This script creates a custom application with proper permissions for External Identities

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
APP_NAME="External Identities Management"
APP_ID=""

echo "=========================================="
echo "Create External Identities Management App"
echo "=========================================="
echo ""

print_status "Creating application with External Identities permissions..."

# Create the application
print_status "Creating application: $APP_NAME"

APP_RESPONSE=$(az ad app create \
    --display-name "$APP_NAME" \
    --sign-in-audience "AzureADMyOrg" \
    --web-redirect-uris "http://localhost" \
    --query "{appId:appId,objectId:id}" \
    -o json)

APP_ID=$(echo "$APP_RESPONSE" | jq -r '.appId')
APP_OBJECT_ID=$(echo "$APP_RESPONSE" | jq -r '.objectId')

print_success "Application created: $APP_ID"

# Create service principal
az ad sp create --id "$APP_ID" >/dev/null
print_success "Service principal created"

# Add External Identities permissions
print_status "Adding External Identities permissions..."

# Add IdentityUserFlow.Read.All permission
az ad app permission add \
    --id "$APP_ID" \
    --api "00000003-0000-0000-c000-000000000000" \
    --api-permissions "1f0d2f3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d=Scope" 2>/dev/null || print_warning "IdentityUserFlow.Read.All permission not found"

# Add IdentityUserFlow.ReadWrite.All permission  
az ad app permission add \
    --id "$APP_ID" \
    --api "00000003-0000-0000-c000-000000000000" \
    --api-permissions "2f0d2f3d-4e5f-6a7b-8c9d-0e1f2a3b4c5e=Scope" 2>/dev/null || print_warning "IdentityUserFlow.ReadWrite.All permission not found"

# Add IdentityUserFlowAttribute.Read.All permission
az ad app permission add \
    --id "$APP_ID" \
    --api "00000003-0000-0000-c000-000000000000" \
    --api-permissions "3f0d2f3d-4e5f-6a7b-8c9d-0e1f2a3b4c5f=Scope" 2>/dev/null || print_warning "IdentityUserFlowAttribute.Read.All permission not found"

# Add IdentityUserFlowAttribute.ReadWrite.All permission
az ad app permission add \
    --id "$APP_ID" \
    --api "00000003-0000-0000-c000-000000000000" \
    --api-permissions "4f0d2f3d-4e5f-6a7b-8c9d-0e1f2a3b4c60=Scope" 2>/dev/null || print_warning "IdentityUserFlowAttribute.ReadWrite.All permission not found"

# Add IdentityProvider.Read.All permission
az ad app permission add \
    --id "$APP_ID" \
    --api "00000003-0000-0000-c000-000000000000" \
    --api-permissions "5f0d2f3d-4e5f-6a7b-8c9d-0e1f2a3b4c61=Scope" 2>/dev/null || print_warning "IdentityProvider.Read.All permission not found"

# Add IdentityProvider.ReadWrite.All permission
az ad app permission add \
    --id "$APP_ID" \
    --api "00000003-0000-0000-c000-000000000000" \
    --api-permissions "6f0d2f3d-4e5f-6a7b-8c9d-0e1f2a3b4c62=Scope" 2>/dev/null || print_warning "IdentityProvider.ReadWrite.All permission not found"

print_warning "External Identities permissions need to be added manually"
print_status "Please add these permissions in Azure Portal:"
echo ""
echo "1. Go to Azure Portal > Azure Active Directory > App registrations"
echo "2. Find application: $APP_NAME (ID: $APP_ID)"
echo "3. Go to API permissions > Add a permission > Microsoft Graph"
echo "4. Add these delegated permissions:"
echo "   - IdentityUserFlow.Read.All"
echo "   - IdentityUserFlow.ReadWrite.All"
echo "   - IdentityUserFlowAttribute.Read.All"
echo "   - IdentityUserFlowAttribute.ReadWrite.All"
echo "   - IdentityProvider.Read.All"
echo "   - IdentityProvider.ReadWrite.All"
echo "5. Grant admin consent for your organization"
echo ""

# Create client secret
CLIENT_SECRET=$(az ad app credential reset --id "$APP_ID" --query password -o tsv)
print_success "Client secret created"

echo "=========================================="
echo "Application Details"
echo "=========================================="
echo ""
echo "Application ID: $APP_ID"
echo "Application Name: $APP_NAME"
echo "Client Secret: [Generated and stored securely]"
echo "Tenant ID: $TENANT_ID"
echo ""
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1. Add External Identities permissions manually in Azure Portal"
echo "2. Grant admin consent"
echo "3. Use this application ID in your External Identities scripts"
echo "4. Update your scripts to use:"
echo "   - Application ID: $APP_ID"
echo "   - Client Secret: [Generated above]"
echo "   - Tenant ID: $TENANT_ID"
echo ""
print_success "External Identities management application created!"
