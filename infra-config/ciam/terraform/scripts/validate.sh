#!/bin/bash

# Azure Entra ID CIAM Terraform Validation Script
# This script validates the Terraform configuration and Azure resources

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Azure CLI
    if ! command_exists az; then
        print_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check Terraform
    if ! command_exists terraform; then
        print_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    # Check if logged in to Azure
    if ! az account show >/dev/null 2>&1; then
        print_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    print_success "All prerequisites met!"
}

# Function to validate Terraform configuration
validate_terraform_config() {
    print_status "Validating Terraform configuration..."
    
    # Check if terraform files exist
    if [ ! -f "main.tf" ]; then
        print_error "main.tf not found!"
        exit 1
    fi
    
    if [ ! -f "variables.tf" ]; then
        print_error "variables.tf not found!"
        exit 1
    fi
    
    # Validate Terraform syntax
    terraform validate
    print_success "Terraform configuration is valid"
}

# Function to check Terraform state
check_terraform_state() {
    print_status "Checking Terraform state..."
    
    if [ ! -f "terraform.tfstate" ]; then
        print_warning "No Terraform state found. Resources may not be deployed yet."
        return 0
    fi
    
    # Check if state is valid
    terraform show >/dev/null 2>&1
    print_success "Terraform state is valid"
}

# Function to validate Azure resources
validate_azure_resources() {
    print_status "Validating Azure resources..."
    
    if [ ! -f "terraform.tfstate" ]; then
        print_warning "No Terraform state found. Skipping Azure resource validation."
        return 0
    fi
    
    # Get application ID from Terraform state
    APP_ID=$(terraform output -raw application_id 2>/dev/null || echo "")
    if [ -z "$APP_ID" ]; then
        print_warning "Could not get application ID from Terraform state"
        return 0
    fi
    
    # Validate app registration
    if az ad app show --id "$APP_ID" >/dev/null 2>&1; then
        print_success "App registration exists: $APP_ID"
    else
        print_error "App registration not found: $APP_ID"
        exit 1
    fi
    
    # Validate service principal
    if az ad sp show --id "$APP_ID" >/dev/null 2>&1; then
        print_success "Service principal exists"
    else
        print_error "Service principal not found"
        exit 1
    fi
    
    # Check API permissions
    print_status "Checking API permissions..."
    PERMISSIONS=$(az ad app show --id "$APP_ID" --query "requiredResourceAccess[0].resourceAccess[].id" -o tsv)
    if [ -n "$PERMISSIONS" ]; then
        print_success "API permissions configured"
    else
        print_warning "No API permissions found"
    fi
    
    # Check redirect URIs
    print_status "Checking redirect URIs..."
    REDIRECT_URIS=$(az ad app show --id "$APP_ID" --query "web.redirectUris" -o tsv)
    if [ -n "$REDIRECT_URIS" ]; then
        print_success "Redirect URIs configured"
    else
        print_warning "No redirect URIs found"
    fi
}

# Function to check environment files
check_environment_files() {
    print_status "Checking environment files..."
    
    # Check frontend .env file
    if [ -f "../.env" ]; then
        print_success "Frontend .env file exists"
        
        # Check for required variables
        if grep -q "VITE_AZURE_CLIENT_ID" ../.env; then
            print_success "VITE_AZURE_CLIENT_ID found in frontend .env"
        else
            print_warning "VITE_AZURE_CLIENT_ID not found in frontend .env"
        fi
        
        if grep -q "VITE_AZURE_TENANT_ID" ../.env; then
            print_success "VITE_AZURE_TENANT_ID found in frontend .env"
        else
            print_warning "VITE_AZURE_TENANT_ID not found in frontend .env"
        fi
    else
        print_warning "Frontend .env file not found"
    fi
    
    # Check backend .env file
    if [ -f "../../app-api/.env" ]; then
        print_success "Backend .env file exists"
        
        # Check for required variables
        if grep -q "AZURE_CLIENT_ID" ../../app-api/.env; then
            print_success "AZURE_CLIENT_ID found in backend .env"
        else
            print_warning "AZURE_CLIENT_ID not found in backend .env"
        fi
        
        if grep -q "AZURE_CLIENT_SECRET" ../../app-api/.env; then
            print_success "AZURE_CLIENT_SECRET found in backend .env"
        else
            print_warning "AZURE_CLIENT_SECRET not found in backend .env"
        fi
    else
        print_warning "Backend .env file not found"
    fi
}

# Function to check DNS configuration
check_dns_configuration() {
    print_status "Checking DNS configuration..."
    
    # Check if CIAM domains resolve
    DOMAINS=(
        "auth01.local.topvitaminsupply.com"
        "auth01.dev.topvitaminsupply.com"
        "auth01.topvitaminsupplies.com"
    )
    
    for domain in "${DOMAINS[@]}"; do
        if nslookup "$domain" >/dev/null 2>&1; then
            print_success "DNS resolution successful for $domain"
        else
            print_warning "DNS resolution failed for $domain"
        fi
    done
}

# Function to check Azure AD B2C features
check_b2c_features() {
    print_status "Checking Azure AD B2C features..."
    
    # Check if External Identities is available
    if az ad b2c user-flow list >/dev/null 2>&1; then
        print_success "External Identities is available"
    else
        print_warning "External Identities may not be available or configured"
    fi
    
    # Check user flows
    USER_FLOWS=$(az ad b2c user-flow list --query "[].name" -o tsv 2>/dev/null || echo "")
    if [ -n "$USER_FLOWS" ]; then
        print_success "User flows found: $USER_FLOWS"
    else
        print_warning "No user flows found"
    fi
    
    # Check identity providers
    IDENTITY_PROVIDERS=$(az ad b2c identity-provider list --query "[].name" -o tsv 2>/dev/null || echo "")
    if [ -n "$IDENTITY_PROVIDERS" ]; then
        print_success "Identity providers found: $IDENTITY_PROVIDERS"
    else
        print_warning "No identity providers found"
    fi
}

# Function to generate validation report
generate_validation_report() {
    print_status "Generating validation report..."
    
    REPORT_FILE="validation-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "$REPORT_FILE" << EOF
Azure Entra ID CIAM Validation Report
Generated: $(date)
=====================================

Terraform Configuration:
- main.tf: $(test -f "main.tf" && echo "✓ Found" || echo "✗ Missing")
- variables.tf: $(test -f "variables.tf" && echo "✓ Found" || echo "✗ Missing")
- terraform.tfvars: $(test -f "terraform.tfvars" && echo "✓ Found" || echo "✗ Missing")
- terraform.tfstate: $(test -f "terraform.tfstate" && echo "✓ Found" || echo "✗ Missing")

Azure Resources:
- App Registration: $(az ad app show --id "$APP_ID" >/dev/null 2>&1 && echo "✓ Exists" || echo "✗ Missing")
- Service Principal: $(az ad sp show --id "$APP_ID" >/dev/null 2>&1 && echo "✓ Exists" || echo "✗ Missing")

Environment Files:
- Frontend .env: $(test -f "../.env" && echo "✓ Found" || echo "✗ Missing")
- Backend .env: $(test -f "../../app-api/.env" && echo "✓ Found" || echo "✗ Missing")

DNS Configuration:
- auth01.local.topvitaminsupply.com: $(nslookup "auth01.local.topvitaminsupply.com" >/dev/null 2>&1 && echo "✓ Resolves" || echo "✗ Failed")
- auth01.dev.topvitaminsupply.com: $(nslookup "auth01.dev.topvitaminsupply.com" >/dev/null 2>&1 && echo "✓ Resolves" || echo "✗ Failed")
- auth01.topvitaminsupplies.com: $(nslookup "auth01.topvitaminsupplies.com" >/dev/null 2>&1 && echo "✓ Resolves" || echo "✗ Failed")

Azure AD B2C Features:
- External Identities: $(az ad b2c user-flow list >/dev/null 2>&1 && echo "✓ Available" || echo "✗ Not Available")
- User Flows: $(az ad b2c user-flow list --query "[].name" -o tsv 2>/dev/null | wc -l | tr -d ' ') found
- Identity Providers: $(az ad b2c identity-provider list --query "[].name" -o tsv 2>/dev/null | wc -l | tr -d ' ') found

EOF
    
    print_success "Validation report generated: $REPORT_FILE"
}

# Main execution
main() {
    echo "=========================================="
    echo "Azure Entra ID CIAM Terraform Validation"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    validate_terraform_config
    check_terraform_state
    validate_azure_resources
    check_environment_files
    check_dns_configuration
    check_b2c_features
    generate_validation_report
    
    print_success "Validation completed successfully!"
    echo ""
    print_status "Review the validation report for any issues that need attention."
}

# Run main function
main "$@"
