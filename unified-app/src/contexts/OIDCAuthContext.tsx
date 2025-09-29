import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Types
interface OIDCUser {
  id: string;
  email: string;
  username: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email_verified: boolean;
  phone_number?: string;
  phone_number_verified?: boolean;
  preferred_username?: string;
  locale?: string;
  timezone?: string;
  auth_method: string;
  last_login_at: string;
  created_by_oidc: boolean;
  oidc_created_at: string;
  oidc_updated_at: string;
  provider_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface OIDCAuthContextType {
  user: OIDCUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (returnUrl?: string) => Promise<void>;
  logout: (returnUrl?: string) => Promise<void>;
  refreshToken: () => Promise<void>;
}

// Create context
const OIDCAuthContext = createContext<OIDCAuthContextType | undefined>(undefined);

// Provider component
interface OIDCAuthProviderProps {
  children: ReactNode;
}

export const OIDCAuthProvider: React.FC<OIDCAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<OIDCUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in (from localStorage or session)
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if we have a user in localStorage (from previous session)
        const storedUser = localStorage.getItem('oidc_user');
        if (storedUser) {
          const userData: OIDCUser = JSON.parse(storedUser);
          setUser(userData);
        }
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('oidc_user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (returnUrl?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build the login URL with return URL
      const currentUrl = returnUrl || window.location.href;
      const loginUrl = `/api/auth/oidc/login?return_url=${encodeURIComponent(currentUrl)}`;
      
      // Redirect to OIDC login
      window.location.href = loginUrl;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setIsLoading(false);
    }
  };

  const logout = async (returnUrl?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Clear local user data
      setUser(null);
      localStorage.removeItem('oidc_user');
      
      // Build the logout URL with return URL
      const currentUrl = returnUrl || window.location.origin;
      const logoutUrl = `/api/auth/oidc/logout?return_url=${encodeURIComponent(currentUrl)}`;
      
      // Redirect to OIDC logout
      window.location.href = logoutUrl;
    } catch (err: any) {
      setError(err.message || 'Logout failed');
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      // Get refresh token from localStorage or session
      const refreshToken = localStorage.getItem('oidc_refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('/api/auth/oidc/refresh', {
        method: 'GET',
        headers: {
          'X-Refresh-Token': refreshToken,
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      // Store new tokens
      if (data.access_token) {
        localStorage.setItem('oidc_access_token', data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem('oidc_refresh_token', data.refresh_token);
      }
    } catch (err: any) {
      console.error('Token refresh failed:', err);
      // If refresh fails, redirect to login
      await login();
    }
  };

  // Handle OIDC callback (when user returns from OIDC provider)
  useEffect(() => {
    const handleOIDCCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        setError(`Authentication error: ${error}`);
        setIsLoading(false);
        return;
      }

      if (code && state) {
        // This is an OIDC callback - the backend should have processed it
        // Try to get user info from the backend
        try {
          const response = await fetch('/api/auth/oidc/user-info', {
            method: 'GET',
            credentials: 'include', // Include cookies for session
          });

          if (response.ok) {
            const userData = await response.json();
            if (userData.success && userData.user) {
              setUser(userData.user);
              localStorage.setItem('oidc_user', JSON.stringify(userData.user));
            }
          }
        } catch (err) {
          console.error('Failed to get user info after callback:', err);
        }
        
        setIsLoading(false);
      }
    };

    handleOIDCCallback();
  }, []);

  const value: OIDCAuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    refreshToken,
  };

  return (
    <OIDCAuthContext.Provider value={value}>
      {children}
    </OIDCAuthContext.Provider>
  );
};

// Hook to use the context
export const useOIDCAuth = (): OIDCAuthContextType => {
  const context = useContext(OIDCAuthContext);
  if (context === undefined) {
    throw new Error('useOIDCAuth must be used within an OIDCAuthProvider');
  }
  return context;
};
