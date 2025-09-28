#!/bin/bash

# Show Manual Instructions for External Identities Setup
# Quick reference for completing the configuration

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
echo "External Identities Manual Setup Guide"
echo "=========================================="
echo ""

print_success "Complete step-by-step instructions available in:"
echo "📄 MANUAL_SETUP_INSTRUCTIONS.md"
echo ""

print_status "Quick Reference - 5 Steps (25 minutes total):"
echo ""

echo "🔹 Step 1: Create User Flows (5 min)"
echo "   Go to: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ExternalIdentitiesMenuBlade/~/UserFlows"
echo "   Create: TopVitaminSupplies-SignUpSignIn"
echo "   Create: TopVitaminSupplies-PasswordReset"
echo "   Create: TopVitaminSupplies-ProfileEditing"
echo ""

echo "🔹 Step 2: Configure Identity Providers (10 min)"
echo "   Go to: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ExternalIdentitiesMenuBlade/~/IdentityProviders"
echo "   Add: Google (with placeholder credentials)"
echo "   Add: Facebook (with placeholder credentials)"
echo "   Add: LinkedIn (with placeholder credentials)"
echo ""

echo "🔹 Step 3: Configure User Flow Identity Providers (5 min)"
echo "   Enable: Local accounts (Email)"
echo "   Enable: Google, Facebook, LinkedIn"
echo "   Disable: Microsoft work accounts"
echo ""

echo "🔹 Step 4: Associate with Application (2 min)"
echo "   Link user flow to: Top Vitamin Supplies CIAM"
echo "   App ID: 671a313a-1698-4a50-bd15-38acac5a66c3"
echo ""

echo "🔹 Step 5: Test Configuration (2 min)"
echo "   Use 'Run user flow' to verify social login buttons appear"
echo ""

echo "=========================================="
echo "Your Ready-to-Use URLs"
echo "=========================================="
echo ""

echo "Sign-up/Sign-in Flow:"
echo "https://login.microsoftonline.com/2a81f801-dae3-49fc-9d8f-fa35786c0087/oauth2/v2.0/authorize?p=TopVitaminSupplies-SignUpSignIn&client_id=671a313a-1698-4a50-bd15-38acac5a66c3&nonce=defaultNonce&redirect_uri=https://local.topvitaminsupply.com/auth/callback&scope=openid&response_type=code&prompt=login"
echo ""

echo "Password Reset Flow:"
echo "https://login.microsoftonline.com/2a81f801-dae3-49fc-9d8f-fa35786c0087/oauth2/v2.0/authorize?p=TopVitaminSupplies-PasswordReset&client_id=671a313a-1698-4a50-bd15-38acac5a66c3&nonce=defaultNonce&redirect_uri=https://local.topvitaminsupply.com/auth/callback&scope=openid&response_type=code&prompt=login"
echo ""

echo "=========================================="
echo "What You'll Get After Setup"
echo "=========================================="
echo ""

print_success "Users will see:"
echo "  ✅ 'Sign in with Google' button"
echo "  ✅ 'Sign in with Facebook' button"
echo "  ✅ 'Sign in with LinkedIn' button"
echo "  ✅ 'Create account' option with email/password"
echo "  ❌ NO Azure work account login (disabled as requested)"
echo ""

echo "=========================================="
echo "Quick Start Links"
echo "=========================================="
echo ""

echo "🔗 Azure Portal: https://portal.azure.com"
echo "🔗 User Flows: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ExternalIdentitiesMenuBlade/~/UserFlows"
echo "🔗 Identity Providers: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ExternalIdentitiesMenuBlade/~/IdentityProviders"
echo "🔗 Custom Branding: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ExternalIdentitiesMenuBlade/~/CustomBranding"
echo ""

print_warning "📖 For detailed step-by-step instructions, see: MANUAL_SETUP_INSTRUCTIONS.md"
echo ""

print_success "🎯 Total setup time: ~25 minutes"
print_success "🎉 Result: Complete External Identities with social logins!"
