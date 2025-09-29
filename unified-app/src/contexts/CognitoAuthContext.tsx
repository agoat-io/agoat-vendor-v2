import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cognitoAuth, CognitoUser, CognitoTokens, PageState } from '../services/cognitoAuth';

interface CognitoAuthContextType {
  user: CognitoUser | null;
  tokens: CognitoTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (returnUrl?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<CognitoTokens | null>;
  restorePageState: () => PageState | null;
  clearPageState: () => void;
}

const CognitoAuthContext = createContext<CognitoAuthContextType | undefined>(undefined);

interface CognitoAuthProviderProps {
  children: ReactNode;
}

export const CognitoAuthProvider: React.FC<CognitoAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [tokens, setTokens] = useState<CognitoTokens | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize authentication on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        await cognitoAuth.initialize();
        
        const currentTokens = cognitoAuth.getTokens();
        const currentUser = cognitoAuth.getUserInfo();
        
        setTokens(currentTokens);
        setUser(currentUser);
        setIsAuthenticated(cognitoAuth.isAuthenticated());

        // Check if we just returned from authentication and need to restore page state
        if (cognitoAuth.isAuthenticated()) {
          const pageState = cognitoAuth.restorePageState();
          if (pageState && pageState.url !== window.location.href) {
            console.log('Restoring user to original page:', pageState.url);
            // Navigate to the original page
            window.location.href = pageState.url;
            return;
          }
        }
      } catch (error) {
        console.error('Error initializing Cognito authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Setup token refresh when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      cognitoAuth.setupTokenRefresh();
    } else {
      cognitoAuth.stopTokenRefresh();
    }

    // Cleanup on unmount
    return () => {
      cognitoAuth.stopTokenRefresh();
    };
  }, [isAuthenticated]);

  // Handle authentication state changes
  useEffect(() => {
    const handleAuthStateChange = () => {
      const currentTokens = cognitoAuth.getTokens();
      const currentUser = cognitoAuth.getUserInfo();
      
      setTokens(currentTokens);
      setUser(currentUser);
      setIsAuthenticated(cognitoAuth.isAuthenticated());
    };

    // Listen for storage changes (in case of multiple tabs)
    window.addEventListener('storage', handleAuthStateChange);
    
    return () => {
      window.removeEventListener('storage', handleAuthStateChange);
    };
  }, []);

  const login = async (returnUrl?: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // If no return URL provided, use current location
      const finalReturnUrl = returnUrl || window.location.href;
      
      console.log('Initiating login with return URL:', finalReturnUrl);
      await cognitoAuth.login(finalReturnUrl);
      
      // Note: login() redirects the page, so we won't reach here
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Clear page state before logout
      cognitoAuth.clearPageState();
      
      console.log('Initiating logout');
      await cognitoAuth.logout();
      
      // Note: logout() redirects the page, so we won't reach here
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const refreshTokens = async (): Promise<CognitoTokens | null> => {
    try {
      const newTokens = await cognitoAuth.refreshTokens();
      setTokens(newTokens);
      
      if (newTokens) {
        const newUser = cognitoAuth.getUserInfo();
        setUser(newUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      
      return newTokens;
    } catch (error) {
      console.error('Token refresh error:', error);
      setUser(null);
      setTokens(null);
      setIsAuthenticated(false);
      return null;
    }
  };

  const restorePageState = (): PageState | null => {
    return cognitoAuth.restorePageState();
  };

  const clearPageState = (): void => {
    cognitoAuth.clearPageState();
  };

  const contextValue: CognitoAuthContextType = {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshTokens,
    restorePageState,
    clearPageState,
  };

  return (
    <CognitoAuthContext.Provider value={contextValue}>
      {children}
    </CognitoAuthContext.Provider>
  );
};

export const useCognitoAuth = (): CognitoAuthContextType => {
  const context = useContext(CognitoAuthContext);
  if (context === undefined) {
    throw new Error('useCognitoAuth must be used within a CognitoAuthProvider');
  }
  return context;
};

// Hook for checking authentication status
export const useAuth = () => {
  const { isAuthenticated, isLoading, user, login } = useCognitoAuth();
  
  return {
    isAuthenticated,
    isLoading,
    user,
    isAdmin: user?.email?.includes('admin') || false, // Simple admin check
    isAuthor: user?.email?.includes('author') || false, // Simple author check
    login, // Expose login function for components
  };
};

// Hook for handling login with return URL
export const useLoginWithReturnUrl = () => {
  const { login } = useCognitoAuth();
  const location = useLocation();
  
  const loginWithCurrentPage = () => {
    return login(window.location.href);
  };
  
  const loginWithReturnUrl = (returnUrl: string) => {
    return login(returnUrl);
  };
  
  return {
    loginWithCurrentPage,
    loginWithReturnUrl,
  };
};
