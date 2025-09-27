# Terraform Scripts for Azure Entra ID CIAM

This directory contains automation scripts for managing Azure Entra ID CIAM resources with Terraform.

## Scripts Overview

### 1. **setup.sh** - Initial Deployment
**Purpose**: Deploys the complete Azure Entra ID CIAM infrastructure for the first time.

**What it does**:
- Checks prerequisites (Azure CLI, Terraform)
- Gets Azure tenant ID automatically
- Sets up Terraform variables
- Initializes Terraform
- Plans and applies the configuration
- Creates environment files
- Verifies the deployment

**Usage**:
```bash
cd infra-config/ciam/terraform
./scripts/setup.sh
```

### 2. **update.sh** - Update Existing Resources
**Purpose**: Updates existing Terraform-managed resources when configuration changes.

**What it does**:
- Checks prerequisites and existing state
- Shows current configuration
- Plans updates
- Applies changes
- Updates environment files
- Verifies the updates

**Usage**:
```bash
cd infra-config/ciam/terraform
./scripts/update.sh
```

### 3. **destroy.sh** - Remove All Resources
**Purpose**: Safely removes all Terraform-managed resources.

**What it does**:
- Shows what will be destroyed
- Requires explicit confirmation
- Destroys all resources
- Cleans up local files
- Provides post-destroy guidance

**Usage**:
```bash
cd infra-config/ciam/terraform
./scripts/destroy.sh
```

### 4. **validate.sh** - Validate Configuration
**Purpose**: Validates the Terraform configuration and Azure resources.

**What it does**:
- Checks prerequisites
- Validates Terraform syntax
- Verifies Azure resources
- Checks environment files
- Tests DNS configuration
- Generates validation report

**Usage**:
```bash
cd infra-config/ciam/terraform
./scripts/validate.sh
```

## Prerequisites

### Required Tools
- **Azure CLI**: For Azure resource management
- **Terraform**: For infrastructure as code
- **Bash**: For script execution

### Required Permissions
- **Global Administrator** or **Application Administrator** role
- **Contributor** role on the resource group
- **Azure AD Premium P1 or P2** license

### Required Setup
1. **Azure CLI Login**:
   ```bash
   az login
   az account set --subscription "your-subscription-id"
   ```

2. **Terraform Installation**:
   ```bash
   # Install Terraform (example for Linux)
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

## Quick Start Guide

### 1. **First Time Setup**
```bash
# Navigate to terraform directory
cd infra-config/ciam/terraform

# Run the setup script
./scripts/setup.sh
```

### 2. **Make Configuration Changes**
```bash
# Edit terraform.tfvars or main.tf
vim terraform.tfvars

# Apply updates
./scripts/update.sh
```

### 3. **Validate Configuration**
```bash
# Check everything is working
./scripts/validate.sh
```

### 4. **Clean Up (if needed)**
```bash
# Remove all resources
./scripts/destroy.sh
```

## Script Features

### **Error Handling**
- All scripts use `set -e` for immediate exit on errors
- Comprehensive error messages with colored output
- Prerequisites checking before execution

### **User Confirmation**
- Interactive prompts for destructive operations
- Clear warnings about what will happen
- Option to cancel at any time

### **Environment Management**
- Automatic creation of `.env` files
- Support for multiple environments (local, staging, production)
- Secure handling of sensitive values

### **Validation and Verification**
- Comprehensive validation of Azure resources
- DNS resolution testing
- Environment file verification
- Detailed reporting

## Configuration Files

### **terraform.tfvars**
Main configuration file with your specific values:
```hcl
tenant_id = "your-tenant-id"
app_name  = "Your App Name"
# ... other variables
```

### **Environment Files**
Automatically created by scripts:
- `../.env` - Frontend environment variables
- `../../app-api/.env` - Backend environment variables

## Troubleshooting

### **Common Issues**

#### **1. "Azure CLI not found"**
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

#### **2. "Not logged in to Azure"**
```bash
# Login to Azure
az login
```

#### **3. "Terraform not found"**
```bash
# Install Terraform
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

#### **4. "Insufficient permissions"**
- Verify you have Global Administrator or Application Administrator role
- Check if you can create app registrations manually in Azure Portal

#### **5. "External Identities not available"**
- Ensure you have Azure AD Premium P1 or P2 license
- Check if External Identities is enabled in your tenant

### **Debug Mode**
Run scripts with debug output:
```bash
bash -x ./scripts/setup.sh
```

### **Manual Verification**
Check resources manually:
```bash
# List app registrations
az ad app list --display-name "Top Vitamin Supplies"

# Check user flows
az ad b2c user-flow list

# Verify identity providers
az ad b2c identity-provider list
```

## Security Considerations

### **Client Secret Management**
- Client secrets are automatically generated and stored securely
- Environment files are created with proper permissions
- Secrets are marked as sensitive in Terraform outputs

### **Access Control**
- Scripts require appropriate Azure permissions
- Interactive confirmation for destructive operations
- Clear logging of all actions taken

### **Environment Isolation**
- Support for multiple environments
- Environment-specific configuration
- Separate resource groups per environment

## Best Practices

### **1. Version Control**
- Commit Terraform files to version control
- Never commit `terraform.tfvars` with sensitive values
- Use `.gitignore` to exclude state files and secrets

### **2. State Management**
- Use remote state storage for production
- Regularly backup Terraform state
- Lock state files during operations

### **3. Resource Naming**
- Use consistent naming conventions
- Include environment in resource names
- Tag resources appropriately

### **4. Monitoring**
- Monitor resource usage and costs
- Set up alerts for resource changes
- Regularly review access permissions

## Support

For issues with these scripts:
1. Check the troubleshooting section above
2. Review the main Terraform README
3. Check Azure AD B2C documentation
4. Create an issue in the project repository

## Related Documentation

- [Main Terraform README](../README.md)
- [Manual Configuration Guide](../../manual-config-route.txt)
- [Azure AD B2C Documentation](https://docs.microsoft.com/en-us/azure/active-directory-b2c/)
- [Terraform AzureAD Provider](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs)
