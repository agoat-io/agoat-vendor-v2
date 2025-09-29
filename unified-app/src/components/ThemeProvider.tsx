import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  Box, 
  Button, 
  Card, 
  Flex, 
  Grid, 
  Heading, 
  Text, 
  Dialog,
  IconButton,
  Separator
} from '@radix-ui/themes'
import { 
  PaletteIcon, 
  SunIcon, 
  MoonIcon, 
  CheckIcon,
  Cross2Icon
} from '@radix-ui/react-icons'

// Define theme types
export type ThemeStyle = 
  | 'dark-simple'
  | 'light-simple' 
  | 'dark-fancy1'
  | 'dark-fancy2'
  | 'dark-fancy-glassmorph'
  | 'light-fancy-glassmorph'
  | 'simple-light-glassmorph'
  | 'simple-dark-glassmorph'

export interface ThemeConfig {
  id: ThemeStyle
  name: string
  description: string
  appearance: 'light' | 'dark'
  style: 'simple' | 'fancy' | 'glassmorph'
  backgroundImage?: string
  previewColors: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
}

export const THEME_CONFIGS: Record<ThemeStyle, ThemeConfig> = {
  'dark-simple': {
    id: 'dark-simple',
    name: 'Dark Simple',
    description: 'Clean dark theme with minimal styling',
    appearance: 'dark',
    style: 'simple',
    previewColors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      accent: '#10b981',
      background: '#1f2937'
    }
  },
  'light-simple': {
    id: 'light-simple',
    name: 'Light Simple',
    description: 'Clean light theme with minimal styling',
    appearance: 'light',
    style: 'simple',
    previewColors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      accent: '#10b981',
      background: '#ffffff'
    }
  },
  'dark-fancy1': {
    id: 'dark-fancy1',
    name: 'Dark Fancy 1',
    description: 'Rich dark theme with gradients and effects',
    appearance: 'dark',
    style: 'fancy',
    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    previewColors: {
      primary: '#8b5cf6',
      secondary: '#a78bfa',
      accent: '#f59e0b',
      background: '#1e1b4b'
    }
  },
  'dark-fancy2': {
    id: 'dark-fancy2',
    name: 'Dark Fancy 2',
    description: 'Alternative dark theme with vibrant colors',
    appearance: 'dark',
    style: 'fancy',
    backgroundImage: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    previewColors: {
      primary: '#ec4899',
      secondary: '#f472b6',
      accent: '#06b6d4',
      background: '#581c87'
    }
  },
  'dark-fancy-glassmorph': {
    id: 'dark-fancy-glassmorph',
    name: 'Dark Glassmorphism',
    description: 'Dark theme with glassmorphism effects',
    appearance: 'dark',
    style: 'glassmorph',
    backgroundImage: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    previewColors: {
      primary: '#60a5fa',
      secondary: '#93c5fd',
      accent: '#34d399',
      background: 'rgba(30, 41, 59, 0.8)'
    }
  },
  'light-fancy-glassmorph': {
    id: 'light-fancy-glassmorph',
    name: 'Light Glassmorphism',
    description: 'Light theme with glassmorphism effects',
    appearance: 'light',
    style: 'glassmorph',
    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    previewColors: {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      accent: '#10b981',
      background: 'rgba(255, 255, 255, 0.8)'
    }
  },
  'simple-light-glassmorph': {
    id: 'simple-light-glassmorph',
    name: 'Simple Light Glass',
    description: 'Minimal light theme with subtle glassmorphism',
    appearance: 'light',
    style: 'glassmorph',
    backgroundImage: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    previewColors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#059669',
      background: 'rgba(248, 250, 252, 0.9)'
    }
  },
  'simple-dark-glassmorph': {
    id: 'simple-dark-glassmorph',
    name: 'Simple Dark Glass',
    description: 'Minimal dark theme with subtle glassmorphism',
    appearance: 'dark',
    style: 'glassmorph',
    backgroundImage: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    previewColors: {
      primary: '#60a5fa',
      secondary: '#94a3b8',
      accent: '#34d399',
      background: 'rgba(30, 41, 59, 0.9)'
    }
  }
}

interface ThemeContextType {
  currentTheme: ThemeStyle
  setTheme: (theme: ThemeStyle) => void
  themeConfig: ThemeConfig
  isThemeSelectorOpen: boolean
  setIsThemeSelectorOpen: (open: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeStyle>('light-simple')
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false)

  const themeConfig = THEME_CONFIGS[currentTheme]

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeStyle
    if (savedTheme && THEME_CONFIGS[savedTheme]) {
      setCurrentTheme(savedTheme)
    }
  }, [])

  // Save theme to localStorage and apply to document
  useEffect(() => {
    localStorage.setItem('theme', currentTheme)
    
    // Apply theme to document
    const config = THEME_CONFIGS[currentTheme]
    document.documentElement.setAttribute('data-theme', currentTheme)
    document.documentElement.setAttribute('data-appearance', config.appearance)
    document.documentElement.setAttribute('data-style', config.style)
    
    // Apply background image if specified
    if (config.backgroundImage) {
      document.body.style.backgroundImage = config.backgroundImage
      document.body.style.backgroundAttachment = 'fixed'
      document.body.style.backgroundSize = 'cover'
      document.body.style.backgroundPosition = 'center'
    } else {
      document.body.style.backgroundImage = ''
    }
  }, [currentTheme])

  const setTheme = (theme: ThemeStyle) => {
    setCurrentTheme(theme)
  }

  const value = {
    currentTheme,
    setTheme,
    themeConfig,
    isThemeSelectorOpen,
    setIsThemeSelectorOpen
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

// Theme Selector Component
export const ThemeSelector: React.FC = () => {
  const { 
    currentTheme, 
    setTheme, 
    isThemeSelectorOpen, 
    setIsThemeSelectorOpen 
  } = useTheme()

  const handleThemeSelect = (theme: ThemeStyle) => {
    setTheme(theme)
    setIsThemeSelectorOpen(false)
  }

  return (
    <Dialog.Root open={isThemeSelectorOpen} onOpenChange={setIsThemeSelectorOpen}>
      <Dialog.Content style={{ maxWidth: '800px', maxHeight: '80vh' }}>
        <Dialog.Title>
          <Flex align="center" gap="2">
            <PaletteIcon />
            Choose Theme Style
          </Flex>
        </Dialog.Title>
        
        <Dialog.Description>
          Select a visual style that affects colors, backgrounds, and effects throughout the application.
        </Dialog.Description>

        <Box style={{ marginTop: 'var(--space-4)' }}>
          <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
            {Object.values(THEME_CONFIGS).map((config) => (
              <Card 
                key={config.id}
                style={{ 
                  cursor: 'pointer',
                  border: currentTheme === config.id ? '2px solid var(--accent-9)' : '1px solid var(--gray-6)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => handleThemeSelect(config.id)}
              >
                <Box style={{ 
                  height: '80px',
                  background: config.backgroundImage || config.previewColors.background,
                  position: 'relative'
                }}>
                  {/* Preview color dots */}
                  <Flex 
                    gap="2" 
                    style={{ 
                      position: 'absolute',
                      top: 'var(--space-2)',
                      right: 'var(--space-2)'
                    }}
                  >
                    <Box 
                      style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%',
                        backgroundColor: config.previewColors.primary
                      }} 
                    />
                    <Box 
                      style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%',
                        backgroundColor: config.previewColors.secondary
                      }} 
                    />
                    <Box 
                      style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%',
                        backgroundColor: config.previewColors.accent
                      }} 
                    />
                  </Flex>
                  
                  {currentTheme === config.id && (
                    <Box 
                      style={{ 
                        position: 'absolute',
                        top: 'var(--space-2)',
                        left: 'var(--space-2)',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--green-9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <CheckIcon width="12" height="12" color="white" />
                    </Box>
                  )}
                </Box>
                
                <Box style={{ padding: 'var(--space-3)' }}>
                  <Heading size="3" style={{ marginBottom: 'var(--space-1)' }}>
                    {config.name}
                  </Heading>
                  <Text size="2" color="gray">
                    {config.description}
                  </Text>
                  <Flex gap="2" style={{ marginTop: 'var(--space-2)' }}>
                    <Text size="1" style={{ 
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-1)',
                      backgroundColor: config.appearance === 'dark' ? 'var(--gray-9)' : 'var(--gray-3)',
                      color: config.appearance === 'dark' ? 'white' : 'var(--gray-11)'
                    }}>
                      {config.appearance}
                    </Text>
                    <Text size="1" style={{ 
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-1)',
                      backgroundColor: 'var(--blue-3)',
                      color: 'var(--blue-11)'
                    }}>
                      {config.style}
                    </Text>
                  </Flex>
                </Box>
              </Card>
            ))}
          </Grid>
        </Box>

        <Flex gap="3" justify="end" style={{ marginTop: 'var(--space-4)' }}>
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Close
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}

// Theme Toggle Button Component
export const ThemeToggle: React.FC = () => {
  const { setIsThemeSelectorOpen } = useTheme()

  return (
    <IconButton 
      variant="ghost" 
      onClick={() => setIsThemeSelectorOpen(true)}
      title="Change theme style"
    >
      <PaletteIcon />
    </IconButton>
  )
}