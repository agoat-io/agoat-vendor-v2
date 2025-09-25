import { Configuration, PopupRequest, RedirectRequest } from '@azure/msal-browser';

// Azure Entra ID External Identities Configuration
// This supports Gmail, Microsoft personal accounts, and other external providers
export const azureConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'your-client-id-here',
    authority: import.meta.env.VITE_AZURE_AUTHORITY_URL || 'https://login.microsoftonline.com/common/v2.0', // Multi-tenant for external identities
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || 'http://local.topvitaminsupply.com:3000/auth/callback',
    postLogoutRedirectUri: import.meta.env.VITE_AZURE_LOGOUT_URI || 'http://local.topvitaminsupply.com:3000/auth/logout',
  },
  cache: {
    cacheLocation: 'sessionStorage', // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0: // LogLevel.Error
            console.error(message);
            break;
          case 1: // LogLevel.Warning
            console.warn(message);
            break;
          case 2: // LogLevel.Info
            console.info(message);
            break;
          case 3: // LogLevel.Verbose
            console.debug(message);
            break;
        }
      },
    },
  },
};

// OIDC Scopes for External Identities
export const loginRequest: PopupRequest | RedirectRequest = {
  scopes: (import.meta.env.VITE_AZURE_SCOPE || 'openid profile email User.Read').split(' '),
  prompt: 'select_account', // Allow users to choose account type (Gmail, Microsoft personal, work/school)
  extraQueryParameters: {
    response_mode: import.meta.env.VITE_AZURE_RESPONSE_MODE || 'query',
    // Enable external identities - don't restrict to specific domain
    domain_hint: undefined,
  },
};

// Token request for API calls (External Identities)
export const tokenRequest = {
  scopes: (import.meta.env.VITE_AZURE_SCOPE || 'openid profile email User.Read').split(' '),
  forceRefresh: false,
};

// Graph API request (if needed for additional user info)
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  graphMailEndpoint: 'https://graph.microsoft.com/v1.0/me/messages',
};

// PKCE Configuration
export const pkceConfig = {
  codeChallengeMethod: import.meta.env.VITE_AZURE_CODE_CHALLENGE_METHOD || 'S256',
  responseType: import.meta.env.VITE_AZURE_RESPONSE_TYPE || 'code',
};

// Environment-specific configuration
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// Environment configurations
export const environments = {
  local: {
    domain: import.meta.env.VITE_LOCAL_DOMAIN || 'local.topvitaminsupply.com',
    port: import.meta.env.VITE_LOCAL_PORT || '3000',
    protocol: 'http',
    ciamDomain: 'auth01.local.topvitaminsupply.com',
    ciamPort: '443',
    ciamProtocol: 'https'
  },
  staging: {
    domain: import.meta.env.VITE_STAGING_DOMAIN || 'staging.topvitaminsupplies.com',
    protocol: 'https',
    ciamDomain: 'auth01.dev.topvitaminsupply.com',
    ciamPort: '443',
    ciamProtocol: 'https'
  },
  production: {
    domain: import.meta.env.VITE_PROD_DOMAIN || 'topvitaminsupplies.com',
    protocol: 'https',
    ciamDomain: 'auth01.topvitaminsupplies.com',
    ciamPort: '443',
    ciamProtocol: 'https'
  }
};

// Get current environment
export const getCurrentEnvironment = () => {
  const env = import.meta.env.VITE_ENVIRONMENT || 'local';
  return environments[env] || environments.local;
};

// Legacy support
export const localConfig = environments.local;
export const productionConfig = environments.production;

// Get current configuration based on environment
export const getCurrentConfig = () => {
  const currentEnv = getCurrentEnvironment();
  
  return {
    ...azureConfig,
    auth: {
      ...azureConfig.auth,
      redirectUri: `${currentEnv.protocol}://${currentEnv.domain}${currentEnv.port ? ':' + currentEnv.port : ''}/auth/callback`,
      postLogoutRedirectUri: `${currentEnv.protocol}://${currentEnv.domain}${currentEnv.port ? ':' + currentEnv.port : ''}/auth/logout`,
    },
  };
};

// Get CIAM configuration
export const getCiamConfig = () => {
  const currentEnv = getCurrentEnvironment();
  
  return {
    domain: currentEnv.ciamDomain,
    port: currentEnv.ciamPort,
    protocol: currentEnv.ciamProtocol,
    fullUrl: `${currentEnv.ciamProtocol}://${currentEnv.ciamDomain}`,
    loginUrl: `${currentEnv.ciamProtocol}://${currentEnv.ciamDomain}/login`,
    registerUrl: `${currentEnv.ciamProtocol}://${currentEnv.ciamDomain}/register`,
    callbackUrl: `${currentEnv.ciamProtocol}://${currentEnv.ciamDomain}/callback`,
    logoutUrl: `${currentEnv.ciamProtocol}://${currentEnv.ciamDomain}/logout`
  };
};

// Export the current configuration
export const currentAzureConfig = getCurrentConfig();
