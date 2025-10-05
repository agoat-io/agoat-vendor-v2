# Authentication Unique Identifiers Reference

**Date:** 2025-10-04  
**Purpose:** Document all unique identity provider services and unique pools in the database schema

## Overview

This document catalogs all fields marked with `auth_unique: <meaning>` in the migration scripts. These fields represent unique identifiers for identity provider services and unique pools that are critical for authentication and authorization.

## Users Table - Authentication Identifiers

### User Identifiers
- **`username`** -- `auth_unique: <user_identifier>` - Unique username for login
  - **Origin:** `user_input`, `JWT.preferred_username`, `Azure.preferred_username`
- **`email`** -- `auth_unique: <user_identifier>` - Unique email address
  - **Origin:** `user_input`, `JWT.email`, `Azure.email`, `Cognito.email`

### External System Identifiers
- **`external_id`** -- `auth_unique: <external_system_identifier>` - External system user ID
  - **Origin:** `external_system.user_id`, `JWT.sub`, `Azure.objectId`
- **`iam_provider`** -- `auth_unique: <identity_provider_service>` - Identity provider service (default, azure, cognito, etc.)
  - **Origin:** `config.identity_provider`, `provider.type`

### Azure Entra ID Identifiers
- **`azure_entra_id`** -- `auth_unique: <azure_user_identifier>` - Azure Entra ID
  - **Origin:** `Azure.oid`, `JWT.oid`, `Azure.id_token.oid`
- **`azure_tenant_id`** -- `auth_unique: <azure_tenant_pool>` - Azure tenant pool identifier
  - **Origin:** `Azure.tid`, `JWT.tid`, `Azure.id_token.tid`
- **`azure_object_id`** -- `auth_unique: <azure_object_identifier>` - Azure object ID
  - **Origin:** `Azure.objectId`, `JWT.objectId`, `Azure.id_token.objectId`
- **`azure_principal_name`** -- `auth_unique: <azure_principal_identifier>` - Azure principal name
  - **Origin:** `Azure.preferred_username`, `JWT.preferred_username`, `Azure.id_token.preferred_username`
- **`azure_preferred_username`** -- `auth_unique: <azure_username_identifier>` - Azure preferred username
  - **Origin:** `Azure.preferred_username`, `JWT.preferred_username`, `Azure.id_token.preferred_username`

### Authentication Method
- **`auth_method`** -- `auth_unique: <authentication_method>` - Authentication method (password, azure_entra, cognito, oidc)
  - **Origin:** `config.auth_method`, `JWT.auth_method`, `provider.type`

## CIAM Systems Table - Provider Identifiers

### System Identifiers
- **`system_name`** -- `auth_unique: <ciam_system_identifier>` - CIAM system identifier (cognito, azure_entra, etc.)
  - **Origin:** `config.system_name`, `provider.name`
- **`provider_type`** -- `auth_unique: <identity_provider_service>` - Provider type (oidc, oauth2, saml, custom)
  - **Origin:** `config.provider_type`, `provider.type`

### Provider Instance Identifiers
- **`provider_instance_id`** -- `auth_unique: <provider_instance_pool>` - Provider instance pool identifier
  - **Origin:** `config.instance_id`, `provider.instance_id`
- **`provider_environment`** -- `auth_unique: <provider_environment>` - Provider environment (production, staging, dev)
  - **Origin:** `config.environment`, `provider.environment`
- **`provider_region`** -- `auth_unique: <provider_region>` - Provider region
  - **Origin:** `config.region`, `provider.region`
- **`provider_domain`** -- `auth_unique: <provider_domain>` - Provider domain
  - **Origin:** `config.domain`, `provider.domain`

### OIDC/OAuth2 Identifiers
- **`issuer_url`** -- `auth_unique: <oidc_issuer_identifier>` - OIDC issuer URL
  - **Origin:** `config.issuer_url`, `OIDC.discovery.issuer`
- **`client_id`** -- `auth_unique: <oauth_client_identifier>` - OAuth2 Client ID
  - **Origin:** `config.client_id`, `JWT.aud`, `OAuth.client_id`

## User CIAM Mappings Table - Mapping Identifiers

### CIAM Identifiers
- **`ciam_identifier`** -- `auth_unique: <ciam_user_identifier>` - CIAM user identifier
  - **Origin:** `JWT.sub`, `Azure.oid`, `Cognito.sub`, `OIDC.id_token.sub`
- **`ciam_system`** -- `auth_unique: <ciam_system_identifier>` - CIAM system name
  - **Origin:** `config.system_name`, `provider.name`

### Provider Identifiers
- **`provider_identifier`** -- `auth_unique: <provider_user_identifier>` - Provider-specific user identifier
  - **Origin:** `JWT.sub`, `Azure.objectId`, `Cognito.username`, `provider.user_id`
- **`authentication_method`** -- `auth_unique: <authentication_method>` - Authentication method (oidc, oauth2, etc.)
  - **Origin:** `config.auth_method`, `JWT.auth_method`, `provider.type`

## Unique Identifier Categories

### 1. User Identifiers
- **`<user_identifier>`** - Unique identifiers for users (username, email)
- **`<external_system_identifier>`** - External system user IDs
- **`<azure_user_identifier>`** - Azure-specific user identifiers
- **`<azure_username_identifier>`** - Azure username identifiers
- **`<azure_principal_identifier>`** - Azure principal identifiers
- **`<azure_object_identifier>`** - Azure object identifiers

### 2. Provider Service Identifiers
- **`<identity_provider_service>`** - Identity provider services (azure, cognito, oidc, etc.)
- **`<authentication_method>`** - Authentication methods (password, azure_entra, cognito, oidc)

### 3. Pool Identifiers
- **`<azure_tenant_pool>`** - Azure tenant pools
- **`<provider_instance_pool>`** - Provider instance pools
- **`<provider_environment>`** - Provider environments
- **`<provider_region>`** - Provider regions
- **`<provider_domain>`** - Provider domains

### 4. System Identifiers
- **`<ciam_system_identifier>`** - CIAM system identifiers
- **`<ciam_user_identifier>`** - CIAM user identifiers
- **`<provider_user_identifier>`** - Provider-specific user identifiers

### 5. OIDC/OAuth2 Identifiers
- **`<oidc_issuer_identifier>`** - OIDC issuer identifiers
- **`<oauth_client_identifier>`** - OAuth2 client identifiers

## Origin Reference Guide

### JWT Token Properties
- **`JWT.sub`** - Subject identifier (unique user ID in the token)
- **`JWT.iss`** - Issuer (who issued the token) - **NOTE:** This identifies the token issuer, not user/system identifiers
- **`JWT.aud`** - Audience (intended recipient of the token)
- **`JWT.preferred_username`** - Preferred username from token
- **`JWT.email`** - Email address from token
- **`JWT.oid`** - Object ID (Azure-specific)
- **`JWT.tid`** - Tenant ID (Azure-specific)
- **`JWT.objectId`** - Object ID (Azure-specific)
- **`JWT.auth_method`** - Authentication method used

**Important Note about JWT.iss:** The `JWT.iss` (issuer) field identifies who issued the token, not user identifiers or system configurations. It should only be used for:
- Verifying token authenticity
- Identifying the token issuer
- Matching against configured issuer URLs
- NOT for storing user IDs, system names, or provider configurations

### Azure Entra ID Properties
- **`Azure.oid`** - Azure Object ID
- **`Azure.tid`** - Azure Tenant ID
- **`Azure.objectId`** - Azure Object ID
- **`Azure.preferred_username`** - Azure preferred username
- **`Azure.email`** - Azure email address
- **`Azure.id_token.oid`** - Object ID from Azure ID token
- **`Azure.id_token.tid`** - Tenant ID from Azure ID token
- **`Azure.id_token.objectId`** - Object ID from Azure ID token
- **`Azure.id_token.preferred_username`** - Preferred username from Azure ID token

### Cognito Properties
- **`Cognito.sub`** - Cognito subject identifier
- **`Cognito.email`** - Cognito email address
- **`Cognito.username`** - Cognito username

### OIDC Properties
- **`OIDC.id_token.sub`** - Subject from OIDC ID token
- **`OIDC.discovery.issuer`** - Issuer from OIDC discovery

### Configuration Sources
- **`config.system_name`** - System name from configuration
- **`config.provider_type`** - Provider type from configuration
- **`config.instance_id`** - Instance ID from configuration
- **`config.environment`** - Environment from configuration
- **`config.region`** - Region from configuration
- **`config.domain`** - Domain from configuration
- **`config.issuer_url`** - Issuer URL from configuration
- **`config.client_id`** - Client ID from configuration
- **`config.auth_method`** - Authentication method from configuration
- **`config.identity_provider`** - Identity provider from configuration

### Provider Sources
- **`provider.name`** - Provider name
- **`provider.type`** - Provider type
- **`provider.instance_id`** - Provider instance ID
- **`provider.environment`** - Provider environment
- **`provider.region`** - Provider region
- **`provider.domain`** - Provider domain
- **`provider.user_id`** - Provider user ID

### External System Sources
- **`external_system.user_id`** - External system user ID
- **`user_input`** - Direct user input

### OAuth Properties
- **`OAuth.client_id`** - OAuth client ID

## Usage Guidelines

### For Multi-Vendor CIAM Support
- Use `provider_type` + `provider_instance_id` to identify unique provider instances
- Use `system_name` to identify unique CIAM systems
- Use `provider_environment` + `provider_region` for environment-specific pools

### For Multi-Pool Support
- Use `azure_tenant_id` for Azure tenant pools
- Use `provider_instance_id` for provider instance pools
- Use `provider_environment` for environment-specific pools

### For User Mapping
- Use `ciam_identifier` + `ciam_system` for unique user-to-system mappings
- Use `provider_identifier` for provider-specific user identifiers
- Use `app_user_id` + `ciam_identifier` + `ciam_system` for unique mappings

## Database Constraints

### Unique Constraints
- `users.email` - Unique email addresses
- `users.username` - Unique usernames
- `ciam_systems.system_name` - Unique CIAM system names
- `user_ciam_mappings(app_user_id, ciam_identifier, ciam_system)` - Unique user-to-CIAM mappings

### Indexes
- All auth_unique fields have corresponding database indexes for performance
- Composite indexes support multi-field unique identifier lookups

## Migration Notes

- All auth_unique fields are marked in the migration scripts with `-- auth_unique: <meaning>`
- These identifiers are critical for authentication and authorization
- Changes to these fields require careful consideration of existing data
- New auth_unique fields should be added to this documentation

## Security Considerations

- **`client_secret_encrypted`** - Encrypted client secrets (not marked as auth_unique but critical for security)
- **`access_token_hash`** - Hashed access tokens
- **`refresh_token_hash`** - Hashed refresh tokens
- All authentication-related fields should be properly secured and encrypted

## Future Enhancements

- Consider adding more granular pool identifiers for complex multi-tenant scenarios
- Add support for additional identity providers
- Enhance OIDC/OAuth2 identifier tracking
- Add audit logging for auth_unique field changes
