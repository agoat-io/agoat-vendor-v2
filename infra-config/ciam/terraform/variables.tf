# Variables for Azure Entra ID CIAM Terraform Configuration

variable "tenant_id" {
  description = "Azure AD Tenant ID"
  type        = string
  validation {
    condition     = can(regex("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$", var.tenant_id))
    error_message = "Tenant ID must be a valid UUID format."
  }
}

variable "resource_group_name" {
  description = "Azure Resource Group name for B2C resources"
  type        = string
  default     = "rg-topvitaminsupplies-ciam"
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
  validation {
    condition = alltrue([
      for uri in var.redirect_uris : can(regex("^https?://", uri))
    ])
    error_message = "All redirect URIs must start with http:// or https://"
  }
}

variable "logout_uris" {
  description = "Logout URIs for the application"
  type        = list(string)
  default = [
    "https://auth01.local.topvitaminsupply.com/logout",
    "https://auth01.dev.topvitaminsupply.com/logout",
    "https://auth01.topvitaminsupplies.com/logout"
  ]
  validation {
    condition = alltrue([
      for uri in var.logout_uris : can(regex("^https://", uri))
    ])
    error_message = "All logout URIs must start with https://"
  }
}

variable "homepage_url" {
  description = "Homepage URL"
  type        = string
  default     = "https://topvitaminsupplies.com"
  validation {
    condition     = can(regex("^https://", var.homepage_url))
    error_message = "Homepage URL must start with https://"
  }
}

variable "user_flow_name" {
  description = "Name for the B2C user flow"
  type        = string
  default     = "TopVitaminSupplies-SignUpSignIn"
}

variable "identity_providers" {
  description = "List of identity providers to enable"
  type        = list(string)
  default     = ["Microsoft"]
  validation {
    condition = alltrue([
      for provider in var.identity_providers : contains(["Microsoft", "Google", "Facebook", "Twitter"], provider)
    ])
    error_message = "Identity providers must be one of: Microsoft, Google, Facebook, Twitter"
  }
}

variable "client_secret_display_name" {
  description = "Display name for the client secret"
  type        = string
  default     = "CIAM Client Secret"
}

variable "client_secret_expiry_months" {
  description = "Client secret expiry in months"
  type        = number
  default     = 24
  validation {
    condition     = var.client_secret_expiry_months >= 1 && var.client_secret_expiry_months <= 60
    error_message = "Client secret expiry must be between 1 and 60 months."
  }
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default = {
    Environment = "CIAM"
    Project     = "TopVitaminSupplies"
    ManagedBy   = "Terraform"
    Purpose     = "External-Identities"
  }
}

# Environment-specific variables
variable "environment" {
  description = "Environment name (local, staging, production)"
  type        = string
  default     = "local"
  validation {
    condition     = contains(["local", "staging", "production"], var.environment)
    error_message = "Environment must be one of: local, staging, production"
  }
}

variable "enable_google_provider" {
  description = "Enable Google identity provider"
  type        = bool
  default     = false
}

variable "google_client_id" {
  description = "Google OAuth client ID (required if enable_google_provider is true)"
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth client secret (required if enable_google_provider is true)"
  type        = string
  default     = ""
  sensitive   = true
}
