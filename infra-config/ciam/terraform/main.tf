# Azure Entra ID CIAM Configuration with Terraform
# This configuration automates all the manual steps in manual-config-route.txt

terraform {
  required_providers {
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.47"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85"
    }
  }
}

# Configure the Azure AD Provider
provider "azuread" {
  tenant_id = var.tenant_id
}

# Configure the Azure Resource Manager Provider
provider "azurerm" {
  features {}
}

# Variables
variable "tenant_id" {
  description = "Azure AD Tenant ID"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "Top Vitamin Supplies"
}

variable "app_display_name" {
  description = "Application display name"
  type        = string
  default     = "Top Vitamin Supplies CIAM"
}

variable "redirect_uris" {
  description = "Redirect URIs for the application"
  type        = list(string)
  default = [
    "https://auth01.local.topvitaminsupply.com/callback",
    "https://auth01.dev.topvitaminsupply.com/callback",
    "https://auth01.topvitaminsupplies.com/callback",
    "http://local.topvitaminsupply.com:3000/auth/callback"
  ]
}

variable "logout_uris" {
  description = "Logout URIs for the application"
  type        = list(string)
  default = [
    "https://auth01.local.topvitaminsupply.com/logout",
    "https://auth01.dev.topvitaminsupply.com/logout",
    "https://auth01.topvitaminsupplies.com/logout"
  ]
}

variable "homepage_url" {
  description = "Homepage URL"
  type        = string
  default     = "https://topvitaminsupplies.com"
}

# Step 1: Create App Registration
resource "azuread_application" "ciam_app" {
  display_name     = var.app_display_name
  sign_in_audience = "AzureADandPersonalMicrosoftAccount"
  homepage_url     = var.homepage_url

  # Web configuration for redirect URIs
  web {
    redirect_uris = var.redirect_uris
    logout_url    = var.logout_uris[0] # Primary logout URL
  }

  # SPA configuration (if needed for MSAL)
  single_page_application {
    redirect_uris = var.redirect_uris
  }

  # Required resource access for Microsoft Graph
  required_resource_access {
    resource_app_id = "00000003-0000-0000-c000-000000000000" # Microsoft Graph

    resource_access {
      id   = "e1fe6dd8-ba31-4d61-89e7-88639da4683d" # User.Read
      type = "Scope"
    }

    resource_access {
      id   = "64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0" # email
      type = "Scope"
    }

    resource_access {
      id   = "14dad69e-099b-42c9-810b-d002981feec1" # profile
      type = "Scope"
    }
  }

  # Optional claims for ID token
  optional_claims {
    id_token {
      name                  = "email"
      essential             = true
      additional_properties = ["email_verified"]
    }
    id_token {
      name                  = "family_name"
      essential             = true
    }
    id_token {
      name                  = "given_name"
      essential             = true
    }
  }

  tags = ["CIAM", "External-Identities", "Terraform"]
}

# Step 2: Create Service Principal
resource "azuread_service_principal" "ciam_app" {
  application_id = azuread_application.ciam_app.application_id
  tags           = ["CIAM", "External-Identities", "Terraform"]
}

# Step 3: Create Client Secret
resource "azuread_application_password" "ciam_secret" {
  application_id = azuread_application.ciam_app.id
  display_name   = "CIAM Client Secret"
  end_date       = timeadd(timestamp(), "17520h") # 24 months
}

# Step 4: Grant Admin Consent for API Permissions
resource "azuread_app_role_assignment" "graph_user_read" {
  app_role_id         = "e1fe6dd8-ba31-4d61-89e7-88639da4683d" # User.Read
  principal_object_id = azuread_service_principal.ciam_app.object_id
  resource_object_id  = data.azuread_service_principal.microsoft_graph.object_id
}

# Data source for Microsoft Graph service principal
data "azuread_service_principal" "microsoft_graph" {
  display_name = "Microsoft Graph"
}

# Step 5: Create User Flow for External Identities
# Note: User flows are not directly supported in the azuread provider
# This would need to be created via Azure CLI or REST API calls
# For now, we'll create a local-exec provisioner to handle this

resource "null_resource" "create_user_flow" {
  provisioner "local-exec" {
    command = <<-EOT
      az ad b2c user-flow create \
        --name "TopVitaminSupplies-SignUpSignIn" \
        --type "signUpOrSignIn" \
        --resource-group "${var.resource_group_name}" \
        --tenant-id "${var.tenant_id}"
    EOT
  }

  depends_on = [azuread_application.ciam_app]
}

# Step 6: Configure Identity Providers
# Note: Identity provider configuration is also not directly supported
# This would need Azure CLI or REST API calls

resource "null_resource" "configure_identity_providers" {
  provisioner "local-exec" {
    command = <<-EOT
      # Configure Microsoft identity provider
      az ad b2c identity-provider microsoft create \
        --name "Microsoft" \
        --resource-group "${var.resource_group_name}" \
        --tenant-id "${var.tenant_id}" \
        --client-id "${azuread_application.ciam_app.application_id}" \
        --client-secret "${azuread_application_password.ciam_secret.value}"
    EOT
  }

  depends_on = [null_resource.create_user_flow]
}

# Outputs
output "application_id" {
  description = "Application (Client) ID"
  value       = azuread_application.ciam_app.application_id
}

output "application_object_id" {
  description = "Application Object ID"
  value       = azuread_application.ciam_app.object_id
}

output "client_secret" {
  description = "Client Secret Value"
  value       = azuread_application_password.ciam_secret.value
  sensitive   = true
}

output "tenant_id" {
  description = "Azure AD Tenant ID"
  value       = var.tenant_id
}

output "redirect_uris" {
  description = "Configured Redirect URIs"
  value       = var.redirect_uris
}

output "logout_uris" {
  description = "Configured Logout URIs"
  value       = var.logout_uris
}

# Environment-specific configurations
output "environment_configs" {
  description = "Environment-specific configuration values"
  value = {
    local = {
      client_id     = azuread_application.ciam_app.application_id
      tenant_id     = var.tenant_id
      authority     = "https://login.microsoftonline.com/common/v2.0"
      redirect_uri  = "https://auth01.local.topvitaminsupply.com/callback"
      logout_uri    = "https://auth01.local.topvitaminsupply.com/logout"
      ciam_domain   = "auth01.local.topvitaminsupply.com"
      ciam_port     = "443"
      ciam_protocol = "https"
    }
    staging = {
      client_id     = azuread_application.ciam_app.application_id
      tenant_id     = var.tenant_id
      authority     = "https://login.microsoftonline.com/common/v2.0"
      redirect_uri  = "https://auth01.dev.topvitaminsupply.com/callback"
      logout_uri    = "https://auth01.dev.topvitaminsupply.com/logout"
      ciam_domain   = "auth01.dev.topvitaminsupply.com"
      ciam_port     = "443"
      ciam_protocol = "https"
    }
    production = {
      client_id     = azuread_application.ciam_app.application_id
      tenant_id     = var.tenant_id
      authority     = "https://login.microsoftonline.com/common/v2.0"
      redirect_uri  = "https://auth01.topvitaminsupplies.com/callback"
      logout_uri    = "https://auth01.topvitaminsupplies.com/logout"
      ciam_domain   = "auth01.topvitaminsupplies.com"
      ciam_port     = "443"
      ciam_protocol = "https"
    }
  }
}
