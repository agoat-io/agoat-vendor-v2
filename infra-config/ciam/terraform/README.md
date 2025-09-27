# Azure Entra ID CIAM Terraform Configuration

This Terraform configuration automates the setup of Azure Entra ID External Identities (CIAM) as described in the manual configuration guide.

## What This Terraform Configuration Does

### ✅ **Automated Steps**
1. **App Registration Creation**
   - Creates Azure AD application with External Identities support
   - Configures redirect URIs and logout URLs
   - Sets up both Web and SPA configurations

2. **API Permissions**
   - Adds Microsoft Graph permissions (User.Read, email, profile)
   - Grants admin consent automatically
   - Configures delegated permissions

3. **Client Secret Generation**
   - Creates secure client secret
   - Sets 24-month expiry (configurable)
   - Outputs secret value for application use

4. **Service Principal**
   - Creates service principal for the application
   - Enables proper authentication flow

5. **Optional Claims**
   - Configures ID token claims (email, family_name, given_name)
   - Sets essential claims for user information

### ⚠️ **Manual Steps Required**
Some Azure B2C features are not yet fully supported in Terraform providers:

1. **User Flow Creation**
   - Currently requires Azure CLI commands
   - Included as local-exec provisioner

2. **Identity Provider Configuration**
   - Microsoft provider configuration via Azure CLI
   - Google provider setup (if enabled)

## Prerequisites

### 1. **Azure CLI Installation**
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Set subscription (if multiple)
az account set --subscription "your-subscription-id"
```

### 2. **Terraform Installation**
```bash
# Install Terraform
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

### 3. **Required Permissions**
- **Global Administrator** or **Application Administrator** role
- **Contributor** role on the resource group
- **Azure AD Premium P1 or P2** license (for External Identities)

## Quick Start

### 1. **Clone and Setup**
```bash
cd infra-config/ciam/terraform
cp terraform.tfvars.example terraform.tfvars
```

### 2. **Configure Variables**
Edit `terraform.tfvars` with your values:
```hcl
tenant_id = "your-tenant-id-here"
app_name  = "Your App Name"
# ... other variables
```

### 3. **Initialize Terraform**
```bash
terraform init
```

### 4. **Plan Deployment**
```bash
terraform plan
```

### 5. **Apply Configuration**
```bash
terraform apply
```

### 6. **Get Outputs**
```bash
terraform output
```

## Configuration Options

### **Environment-Specific Configurations**

#### **Local Development**
```hcl
environment = "local"
redirect_uris = [
  "http://local.topvitaminsupply.com:3000/auth/callback"
]
```

#### **Staging**
```hcl
environment = "staging"
redirect_uris = [
  "https://auth01.dev.topvitaminsupply.com/callback"
]
```

#### **Production**
```hcl
environment = "production"
redirect_uris = [
  "https://auth01.topvitaminsupplies.com/callback"
]
```

### **Identity Providers**

#### **Microsoft Only (Default)**
```hcl
identity_providers = ["Microsoft"]
```

#### **Microsoft + Google**
```hcl
identity_providers = ["Microsoft", "Google"]
enable_google_provider = true
google_client_id     = "your-google-client-id"
google_client_secret = "your-google-client-secret"
```

## Outputs

After successful deployment, you'll get:

```bash
application_id = "12345678-1234-1234-1234-123456789012"
client_secret  = "your-secret-value"
tenant_id      = "your-tenant-id"
redirect_uris  = ["https://auth01.local.topvitaminsupply.com/callback", ...]
```

## Environment Variables for Applications

Use these outputs to configure your applications:

### **Frontend (Vite/React)**
```bash
VITE_AZURE_CLIENT_ID=your-application-id
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_AZURE_REDIRECT_URI=https://auth01.local.topvitaminsupply.com/callback
VITE_AZURE_LOGOUT_URI=https://auth01.local.topvitaminsupply.com/logout
```

### **Backend (Go)**
```bash
AZURE_CLIENT_ID=your-application-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=your-tenant-id
```

## Troubleshooting

### **Common Issues**

#### **1. "External Identities not available"**
- Ensure you have Azure AD Premium P1 or P2 license
- Check if External Identities is enabled in your tenant

#### **2. "Insufficient permissions"**
- Verify you have Global Administrator or Application Administrator role
- Check if you can create app registrations manually

#### **3. "User flow creation failed"**
- Ensure Azure CLI is installed and logged in
- Verify you have B2C permissions

#### **4. "Redirect URI validation failed"**
- Check that all URIs use HTTPS (except localhost)
- Ensure domains are properly configured

### **Debug Commands**

```bash
# Check Azure CLI login status
az account show

# List app registrations
az ad app list --display-name "Top Vitamin Supplies"

# Check user flows
az ad b2c user-flow list --resource-group "rg-topvitaminsupplies-ciam"

# Verify identity providers
az ad b2c identity-provider list --resource-group "rg-topvitaminsupplies-ciam"
```

## Security Considerations

### **1. Client Secret Management**
- Store client secrets in Azure Key Vault
- Use managed identities when possible
- Rotate secrets regularly

### **2. Redirect URI Security**
- Only use HTTPS in production
- Regularly audit and remove unused URIs
- Use specific domains, avoid wildcards

### **3. Permission Management**
- Use least privilege principle
- Regularly review API permissions
- Monitor consent grants

## Advanced Configuration

### **Custom User Attributes**
To add custom user attributes, you'll need to:
1. Create the attribute in Azure AD B2C
2. Update the user flow to collect the attribute
3. Configure application claims

### **Custom Branding**
Custom branding requires:
1. Upload custom CSS and images
2. Configure user flow branding settings
3. Test across different devices

### **Multi-Tenant Support**
For multi-tenant applications:
1. Set `sign_in_audience = "AzureADandPersonalMicrosoftAccount"`
2. Configure tenant-specific redirect URIs
3. Handle tenant discovery in your application

## Cleanup

To destroy all resources:
```bash
terraform destroy
```

**Warning**: This will delete the app registration and all associated resources. Make sure to backup any important configuration first.

## Support

For issues with this Terraform configuration:
1. Check the troubleshooting section above
2. Review Azure AD B2C documentation
3. Check Terraform provider documentation
4. Create an issue in the project repository

## Related Documentation

- [Manual Configuration Guide](../manual-config-route.txt)
- [Azure AD B2C Documentation](https://docs.microsoft.com/en-us/azure/active-directory-b2c/)
- [Terraform AzureAD Provider](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs)
- [Azure CLI B2C Commands](https://docs.microsoft.com/en-us/cli/azure/ad/b2c)
