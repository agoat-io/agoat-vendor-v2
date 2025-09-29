#!/bin/bash

# Azure Entra ID CIAM Terraform Setup Script
# This script automates the Terraform deployment process

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
        echo "Installation instructions: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
    
    # Check Terraform
    if ! command_exists terraform; then
        print_error "Terraform is not installed. Please install it first."
        echo "Installation instructions: https://learn.hashicorp.com/tutorials/terraform/install-cli"
        exit 1
    fi
    
    # Check if logged in to Azure
    if ! az account show >/dev/null 2>&1; then
        print_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    print_success "All prerequisites met!"
}

# Function to get Azure tenant ID
get_tenant_id() {
    print_status "Getting Azure tenant ID..."
    TENANT_ID=$(az account show --query tenantId -o tsv)
    if [ -z "$TENANT_ID" ]; then
        print_error "Could not retrieve tenant ID. Please check your Azure login."
        exit 1
    fi
    print_success "Tenant ID: $TENANT_ID"
}

# Function to setup Terraform variables
setup_terraform_vars() {
    print_status "Setting up Terraform variables..."
    
    if [ ! -f "terraform.tfvars" ]; then
        if [ -f "terraform.tfvars.example" ]; then
            cp terraform.tfvars.example terraform.tfvars
            print_success "Created terraform.tfvars from example"
        else
            print_error "terraform.tfvars.example not found!"
            exit 1
        fi
    fi
    
    # Update tenant_id in terraform.tfvars
    if [ -n "$TENANT_ID" ]; then
        sed -i.bak "s/tenant_id = \".*\"/tenant_id = \"$TENANT_ID\"/" terraform.tfvars
        print_success "Updated tenant_id in terraform.tfvars"
    fi
}

# Function to initialize Terraform
init_terraform() {
    print_status "Initializing Terraform..."
    terraform init
    print_success "Terraform initialized successfully"
}

# Function to plan Terraform deployment
plan_terraform() {
    print_status "Planning Terraform deployment..."
    terraform plan -out=tfplan
    print_success "Terraform plan created successfully"
}

# Function to apply Terraform configuration
apply_terraform() {
    print_status "Applying Terraform configuration..."
    terraform apply tfplan
    print_success "Terraform configuration applied successfully"
}

# Function to display outputs
show_outputs() {
    print_status "Terraform outputs:"
    echo ""
    terraform output
    echo ""
    
    print_status "Environment variables for your application:"
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

# Function to create environment files
create_env_files() {
    print_status "Creating environment files..."
    
    # Create .env file for frontend
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
    
    # Create .env file for backend
    cat > ../../app-api/.env << EOF
# Azure Entra ID CIAM Configuration
AZURE_CLIENT_ID=$(terraform output -raw application_id)
AZURE_CLIENT_SECRET=$(terraform output -raw client_secret)
AZURE_TENANT_ID=$(terraform output -raw tenant_id)
AZURE_AUTHORITY=https://login.microsoftonline.com/common/v2.0
EOF
    
    print_success "Environment files created successfully"
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
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
    
    print_success "Deployment verification completed"
}

# Function to show next steps
show_next_steps() {
    print_status "Next steps:"
    echo ""
    echo "1. Configure your DNS to point to your CIAM domains:"
    echo "   - auth01.local.topvitaminsupply.com"
    echo "   - auth01.dev.topvitaminsupply.com"
    echo "   - auth01.topvitaminsupplies.com"
    echo ""
    echo "2. Set up your CIAM hosted UI (if using full redirect flow)"
    echo ""
    echo "3. Test the authentication flow:"
    echo "   - Start your application"
    echo "   - Navigate to the login page"
    echo "   - Click 'Sign in with Microsoft (CIAM)'"
    echo ""
    echo "4. Monitor the authentication logs in Azure Portal"
    echo ""
    echo "5. Configure additional identity providers (Google, etc.) if needed"
    echo ""
}

# Main execution
main() {
    echo "=========================================="
    echo "Azure Entra ID CIAM Terraform Setup"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    get_tenant_id
    setup_terraform_vars
    init_terraform
    plan_terraform
    
    echo ""
    print_warning "About to apply Terraform configuration. This will create Azure resources."
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        apply_terraform
        show_outputs
        create_env_files
        verify_deployment
        show_next_steps
        print_success "Setup completed successfully!"
    else
        print_warning "Setup cancelled by user"
        exit 0
    fi
}

# Run main function
main "$@"
