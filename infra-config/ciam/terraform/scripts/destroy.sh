#!/bin/bash

# Azure Entra ID CIAM Terraform Destroy Script
# This script safely destroys the Terraform-managed resources

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
        print_error "No Terraform state found. Nothing to destroy."
        exit 1
    fi
    
    print_success "Prerequisites check completed"
}

# Function to show what will be destroyed
show_destroy_plan() {
    print_status "Showing what will be destroyed..."
    terraform plan -destroy
}

# Function to confirm destruction
confirm_destroy() {
    echo ""
    print_warning "This will destroy ALL Terraform-managed resources:"
    echo "  - Azure AD App Registration"
    echo "  - Service Principal"
    echo "  - Client Secret"
    echo "  - API Permission Grants"
    echo "  - User Flows (if created)"
    echo "  - Identity Provider Configurations"
    echo ""
    print_error "This action cannot be undone!"
    echo ""
    
    read -p "Are you absolutely sure you want to destroy these resources? (yes/NO): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_warning "Destroy cancelled by user"
        exit 0
    fi
}

# Function to destroy resources
destroy_resources() {
    print_status "Destroying Terraform resources..."
    terraform destroy -auto-approve
    print_success "Resources destroyed successfully"
}

# Function to cleanup local files
cleanup_local_files() {
    print_status "Cleaning up local files..."
    
    # Remove terraform plan file
    if [ -f "tfplan" ]; then
        rm tfplan
        print_success "Removed terraform plan file"
    fi
    
    # Remove backup files
    if [ -f "terraform.tfvars.bak" ]; then
        rm terraform.tfvars.bak
        print_success "Removed backup files"
    fi
    
    # Remove environment files (optional)
    if [ -f "../.env" ]; then
        print_warning "Found .env file. Remove it? (y/N): "
        read -p "" -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm ../.env
            print_success "Removed .env file"
        fi
    fi
    
    if [ -f "../../app-api/.env" ]; then
        print_warning "Found app-api/.env file. Remove it? (y/N): "
        read -p "" -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm ../../app-api/.env
            print_success "Removed app-api/.env file"
        fi
    fi
}

# Function to show post-destroy steps
show_post_destroy_steps() {
    print_status "Post-destroy steps:"
    echo ""
    echo "1. Remove any remaining Azure resources manually if needed:"
    echo "   - Check Azure Portal for any orphaned resources"
    echo "   - Remove any custom user flows"
    echo "   - Remove any custom identity providers"
    echo ""
    echo "2. Update your application configuration:"
    echo "   - Remove Azure authentication code"
    echo "   - Update environment variables"
    echo "   - Test application functionality"
    echo ""
    echo "3. Clean up DNS records if no longer needed:"
    echo "   - Remove CIAM domain DNS entries"
    echo "   - Update application URLs"
    echo ""
    echo "4. Archive this Terraform configuration:"
    echo "   - Keep for reference or future use"
    echo "   - Document any customizations made"
    echo ""
}

# Main execution
main() {
    echo "=========================================="
    echo "Azure Entra ID CIAM Terraform Destroy"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    show_destroy_plan
    confirm_destroy
    destroy_resources
    cleanup_local_files
    show_post_destroy_steps
    
    print_success "Destroy completed successfully!"
}

# Run main function
main "$@"
