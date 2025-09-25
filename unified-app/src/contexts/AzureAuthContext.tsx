import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  PublicClientApplication, 
  AccountInfo, 
  AuthenticationResult, 
  SilentRequest,
  EndSessionRequest,
  InteractionRequiredAuthError,
  BrowserAuthError
} from '@azure/msal-browser';
import { currentAzureConfig, loginRequest, tokenRequest } from '../config/azureAuth';
import apiClient from '../config/axios';

// Types
interface AzureUser {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  preferredUsername?: string;
  tenantId: string;
  objectId: string;
  emailVerified: boolean;
}

interface AzureAuthContextType {
  user: AzureUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  refreshToken: () => Promise<void>;
}

// Create context
const AzureAuthContext = createContext<AzureAuthContextType | undefined>(undefined);

// MSAL instance
const msalInstance = new PublicClientApplication(currentAzureConfig);

// Provider component
interface AzureAuthProviderProps {
  children: ReactNode;
}

export const AzureAuthProvider: React.FC<AzureAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AzureUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize MSAL
  useEffect(() => {
    const initializeMsal = async () => {
      try {
        await msalInstance.initialize();
        
        // Check for existing accounts
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          const account = accounts[0];
          await handleSuccessfulLogin(account);
        }
      } catch (err) {
        console.error('MSAL initialization error:', err);
        setError('Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMsal();
  }, []);

  // Handle successful login
  const handleSuccessfulLogin = async (account: AccountInfo) => {
    try {
      // Get user info from the account
      const azureUser: AzureUser = {
        id: account.homeAccountId,
        email: account.username,
        name: account.name || account.username,
        givenName: account.idTokenClaims?.given_name as string,
        familyName: account.idTokenClaims?.family_name as string,
        preferredUsername: account.idTokenClaims?.preferred_username as string,
        tenantId: account.tenantId,
        objectId: account.localAccountId,
        emailVerified: account.idTokenClaims?.email_verified as boolean || false,
      };

      setUser(azureUser);
      setIsAuthenticated(true);
      setError(null);

      // Store access token in browser storage
      const tokenRequest: SilentRequest = {
        scopes: loginRequest.scopes,
        account: account,
      };

      try {
        const response = await msalInstance.acquireTokenSilent(tokenRequest);
        if (response.accessToken) {
          localStorage.setItem('azure_access_token', response.accessToken);
          
          // Set up API client with the token
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.accessToken}`;
          
          // Create or update user in our database
          await createOrUpdateUser(azureUser, response.accessToken);
        }
      } catch (tokenError) {
        console.warn('Failed to acquire token silently:', tokenError);
        // Token might be expired, will be handled on next API call
      }
    } catch (err) {
      console.error('Error handling successful login:', err);
      setError('Failed to process login');
    }
  };

  // Create or update user in our database
  const createOrUpdateUser = async (azureUser: AzureUser, accessToken: string) => {
    try {
      const userData = {
        azure_entra_id: azureUser.id,
        azure_tenant_id: azureUser.tenantId,
        azure_object_id: azureUser.objectId,
        azure_principal_name: azureUser.preferredUsername || azureUser.email,
        azure_display_name: azureUser.name,
        azure_given_name: azureUser.givenName,
        azure_family_name: azureUser.familyName,
        azure_preferred_username: azureUser.preferredUsername,
        email: azureUser.email,
        username: azureUser.preferredUsername || azureUser.email,
        auth_method: 'azure_entra',
        email_verified: azureUser.emailVerified,
        account_enabled: true,
        last_login_at: new Date().toISOString(),
        created_by_azure: true,
        azure_created_at: new Date().toISOString(),
        azure_updated_at: new Date().toISOString(),
      };

      // Call our API to create or update the user
      await apiClient.post('/api/auth/azure-user', userData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    } catch (err) {
      console.error('Error creating/updating user in database:', err);
      // Don't throw error here as the user is still authenticated
    }
  };

  // Login function
  const login = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await msalInstance.loginPopup(loginRequest);
      
      if (response.account) {
        await handleSuccessfulLogin(response.account);
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof InteractionRequiredAuthError) {
        setError('Authentication required. Please try again.');
      } else if (err instanceof BrowserAuthError) {
        setError('Browser authentication error. Please check your browser settings.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const logoutRequest: EndSessionRequest = {
        account: msalInstance.getActiveAccount() || undefined,
        postLogoutRedirectUri: currentAzureConfig.auth.postLogoutRedirectUri,
      };

      await msalInstance.logoutPopup(logoutRequest);
      
      // Clear local state
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('azure_access_token');
      delete apiClient.defaults.headers.common['Authorization'];
    } catch (err) {
      console.error('Logout error:', err);
      setError('Logout failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get access token
  const getAccessToken = async (): Promise<string | null> => {
    try {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        return null;
      }

      const account = accounts[0];
      const tokenRequest: SilentRequest = {
        scopes: loginRequest.scopes,
        account: account,
      };

      const response = await msalInstance.acquireTokenSilent(tokenRequest);
      
      if (response.accessToken) {
        localStorage.setItem('azure_access_token', response.accessToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.accessToken}`;
        return response.accessToken;
      }
      
      return null;
    } catch (err) {
      console.error('Error getting access token:', err);
      return null;
    }
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        // Token refreshed successfully
        console.log('Token refreshed successfully');
      }
    } catch (err) {
      console.error('Error refreshing token:', err);
      setError('Failed to refresh token. Please login again.');
    }
  };

  // Set up token refresh interval
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        refreshToken();
      }, 30 * 60 * 1000); // Refresh every 30 minutes

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Set up API interceptor for token refresh
  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && isAuthenticated) {
          // Token expired, try to refresh
          try {
            await refreshToken();
            // Retry the original request
            return apiClient.request(error.config);
          } catch (refreshError) {
            // Refresh failed, logout user
            await logout();
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.interceptors.response.eject(interceptor);
    };
  }, [isAuthenticated]);

  const contextValue: AzureAuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    getAccessToken,
    refreshToken,
  };

  return (
    <AzureAuthContext.Provider value={contextValue}>
      {children}
    </AzureAuthContext.Provider>
  );
};

// Hook to use the context
export const useAzureAuth = (): AzureAuthContextType => {
  const context = useContext(AzureAuthContext);
  if (context === undefined) {
    throw new Error('useAzureAuth must be used within an AzureAuthProvider');
  }
  return context;
};
