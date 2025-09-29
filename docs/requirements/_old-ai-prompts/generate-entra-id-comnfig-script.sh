#!/bin/bash

# AI Prompt: Generate Comprehensive Entra ID Configuration Script
# Purpose: Create a script that configures Microsoft Entra ID for multi-authentication scenarios
# Target: Architecture Repository TOGAF Structure
# Author: Architecture Team
# Version: 1.0.0

# PROMPT FOR AI ASSISTANT:


Create a comprehensive Microsoft Entra ID configuration script in the appropriate TOGAF folder within the architecture repository at:

/Users/andrewsmith/Library/CloudStorage/Dropbox/projects/agoat-publish-architecture-repository

The script should utilize the existing configuration template located at:
/Users/andrewsmith/Library/CloudStorage/Dropbox/projects/agoat-architecture-repository/05-reference-library/05e-templates-and-patterns/configure-entra-id.sh

REQUIREMENTS:

1. MULTI-AUTHENTICATION SUPPORT:
   - Google OAuth2 login integration
   - Microsoft Personal Account authentication (Hotmail, Outlook.com)
   - Microsoft Work Account authentication (Azure AD organizational accounts)
   - Local application-specific user registration and login
   - External Azure AD tenant federation (B2B scenarios)

2. CALLBACK URL CONFIGURATION:
   - Support for development environments with port numbers (localhost:3000, localhost:5173)
   - Production environment configuration without port numbers
   - Staging environment configuration with custom ports
   - Role-specific callback URLs (reader/author selection)
   - Provider-specific callback URLs (google, microsoft, external)

3. ROLE-BASED ACCESS CONTROL:
   - Pre-authentication role selection (reader vs author)
   - Session-based role elevation capabilities
   - User capability validation
   - Role assignment and permission management
   - Audit logging for role changes

4. CROSS-DOMAIN FUNCTIONALITY:
   - Shared session management across subdomains
   - Single sign-on (SSO) across multiple applications
   - Secure cookie domain configuration
   - CORS policy management

5. SECURITY FEATURES:
   - PKCE (Proof Key for Code Exchange) implementation
   - Token refresh mechanisms
   - Rate limiting configuration
   - Session security (HTTP-only, Secure, SameSite)
   - Account linking capabilities

6. ENVIRONMENT CONFIGURATION:
   - Development environment setup
   - Staging environment configuration
   - Production environment deployment
   - Environment-specific parameter management

SCRIPT STRUCTURE:

The generated script should:

1. Assume the user is already authenticated with Azure CLI (`az login` completed)
2. Determine the appropriate TOGAF folder location based on the functionality
3. Call the existing configure-entra-id.sh template with appropriate parameters
4. Configure all required authentication methods
5. Set up proper callback URL handling for all environments
6. Enable all optional capabilities (RBAC, role selection, multi-auth)
7. Generate comprehensive configuration files
8. Provide validation and testing capabilities
9. Include deployment guidance and best practices

OUTPUT REQUIREMENTS:

1. Main configuration script with proper error handling
2. Environment-specific parameter files
3. Validation and testing scripts
4. Deployment documentation
5. Security checklist
6. Troubleshooting guide

The script should be production-ready, well-documented, and follow security best practices for enterprise-grade authentication systems.
