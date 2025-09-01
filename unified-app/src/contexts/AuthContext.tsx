import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  username: string
  role: 'admin' | 'author' | 'user'
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on app load
  useEffect(() => {
    const checkExistingSession = () => {
      const savedUser = localStorage.getItem('auth_user')
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser)
          setUser(userData)
        } catch (error) {
          localStorage.removeItem('auth_user')
        }
      }
      setIsLoading(false)
    }

    checkExistingSession()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    // Mock authentication logic
    if (username === 'admin' && password === 'admin123') {
      const userData: User = {
        id: '1',
        username: 'admin',
        role: 'admin'
      }
      setUser(userData)
      localStorage.setItem('auth_user', JSON.stringify(userData))
      return true
    } else if (username === 'author' && password === 'author123') {
      const userData: User = {
        id: '2',
        username: 'author',
        role: 'author'
      }
      setUser(userData)
      localStorage.setItem('auth_user', JSON.stringify(userData))
      return true
    } else if (username === 'user' && password === 'user123') {
      const userData: User = {
        id: '3',
        username: 'user',
        role: 'user'
      }
      setUser(userData)
      localStorage.setItem('auth_user', JSON.stringify(userData))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth_user')
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
