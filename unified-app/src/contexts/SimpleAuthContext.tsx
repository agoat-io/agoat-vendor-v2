import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
interface SimpleUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface SimpleAuthContextType {
  user: SimpleUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

// Create context
const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

// Provider component
interface SimpleAuthProviderProps {
  children: ReactNode;
}

export const SimpleAuthProvider: React.FC<SimpleAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in (from localStorage)
  React.useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (err) {
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const login = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // For now, just set a default user since we have hardcoded auth in axios
      const defaultUser: SimpleUser = {
        id: '1096773348868587521',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      };
      
      setUser(defaultUser);
      localStorage.setItem('auth_user', JSON.stringify(defaultUser));
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  const value: SimpleAuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout
  };

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  );
};

// Hook to use the context
export const useSimpleAuth = (): SimpleAuthContextType => {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
};
