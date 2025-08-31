import React, { createContext, useContext, useState, ReactNode } from 'react'


interface ThemeContextType {
  appearance: 'light' | 'dark'
  setAppearance: (appearance: 'light' | 'dark') => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [appearance, setAppearance] = useState<'light' | 'dark'>('light')

  const value = {
    appearance,
    setAppearance
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// ThemeToggle and ThemeSelector components would be implemented here
export const ThemeToggle = () => <div>Theme Toggle</div>
export const ThemeSelector = () => <div>Theme Selector</div>
