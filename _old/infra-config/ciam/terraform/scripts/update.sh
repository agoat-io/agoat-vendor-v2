#!/bin/bash

# Azure Entra ID CIAM Terraform Update Script
# This script updates existing Terraform-managed resources

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
    
    # Check Terraform
    if ! command_exists terraform; then
        print_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    # Check if terraform.tfstate exists
    if [ ! -f "terraform.tfstate" ]; then
        print_error "No Terraform state found. Please run setup.sh first."
        exit 1
    fi
    
    print_success "Prerequisites check completed"
}

# Function to show current configuration
show_current_config() {
    print_status "Current Terraform configuration:"
    echo ""
    terraform show
    echo ""
}

# Function to plan updates
plan_updates() {
    print_status "Planning updates..."
    terraform plan -out=tfplan
    print_success "Update plan created successfully"
}

# Function to apply updates
apply_updates() {
    print_status "Applying updates..."
    terraform apply tfplan
    print_success "Updates applied successfully"
}

# Function to update environment files
update_env_files() {
    print_status "Updating environment files..."
    
    # Update .env file for frontend
    if [ -f "../.env" ]; then
        cat > ../.env << EOF
# Azure Entra ID CIAM Configuration
VITE_AZURE_CLIENT_ID=$(terraform output -raw application_id)
VITE_AZURE_TENANT_ID=$(terraform output -raw tenant_id)
VITE_AZURE_REDIRECT_URI=https://auth01.local.topvitaminsupply.com/callback
VITE_AZURE_LOGOUT_URI=https://auth01.local.topvitaminsupply.com/logout
VITE_ENVIRONMENT=local
VITE_LOCAL_DOMAIN=local.topvitaminsupply.com
VITE_LOCAL_PORT=3000
VITE_STAGING_DOMAIN=dev.topvitaminsupply.com
VITE_PROD_DOMAIN=topvitaminsupplies.com
EOF
        print_success "Updated frontend .env file"
    fi
    
    # Update .env file for backend
    if [ -f "../../app-api/.env" ]; then
        cat > ../../app-api/.env << EOF
# Azure Entra ID CIAM Configuration
AZURE_CLIENT_ID=$(terraform output -raw application_id)
AZURE_CLIENT_SECRET=$(terraform output -raw client_secret)
AZURE_TENANT_ID=$(terraform output -raw tenant_id)
AZURE_AUTHORITY=https://login.microsoftonline.com/common/v2.0
EOF
        print_success "Updated backend .env file"
    fi
}

# Function to verify updates
verify_updates() {
    print_status "Verifying updates..."
    
    # Check if app registration exists
    APP_ID=$(terraform output -raw application_id)
    if az ad app show --id "$APP_ID" >/dev/null 2>&1; then
        print_success "App registration verified: $APP_ID"
    else
        print_error "App registration verification failed"
        exit 1
    fi
    
    # Check if service principal exists
    if az ad sp show --id "$APP_ID" >/dev/null 2>&1; then
        print_success "Service principal verified"
    else
        print_error "Service principal verification failed"
        exit 1
    fi
    
    print_success "Update verification completed"
}

# Function to show update summary
show_update_summary() {
    print_status "Update summary:"
    echo ""
    terraform output
    echo ""
    
    print_status "Updated environment variables:"
    echo ""
    echo "# Frontend (Vite/React)"
    echo "VITE_AZURE_CLIENT_ID=$(terraform output -raw application_id)"
    echo "VITE_AZURE_TENANT_ID=$(terraform output -raw tenant_id)"
    echo "VITE_AZURE_REDIRECT_URI=https://auth01.local.topvitaminsupply.com/callback"
    echo "VITE_AZURE_LOGOUT_URI=https://auth01.local.topvitaminsupply.com/logout"
    echo ""
    echo "# Backend (Go)"
    echo "AZURE_CLIENT_ID=$(terraform output -raw application_id)"
    echo "AZURE_CLIENT_SECRET=$(terraform output -raw client_secret)"
    echo "AZURE_TENANT_ID=$(terraform output -raw tenant_id)"
    echo ""
}

# Function to show next steps
show_next_steps() {
    print_status "Next steps:"
    echo ""
    echo "1. Restart your application to pick up new environment variables"
    echo ""
    echo "2. Test the authentication flow:"
    echo "   - Navigate to the login page"
    echo "   - Click 'Sign in with Microsoft (CIAM)'"
    echo "   - Verify the authentication works"
    echo ""
    echo "3. Monitor the authentication logs in Azure Portal"
    echo ""
    echo "4. Update any documentation with new configuration values"
    echo ""
}

# Main execution
main() {
    echo "=========================================="
    echo "Azure Entra ID CIAM Terraform Update"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    show_current_config
    plan_updates
    
    echo ""
    print_warning "About to apply Terraform updates. This will modify Azure resources."
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        apply_updates
        update_env_files
        verify_updates
        show_update_summary
        show_next_steps
        print_success "Update completed successfully!"
    else
        print_warning "Update cancelled by user"
        exit 0
    fi
}

# Run main function
main "$@"
