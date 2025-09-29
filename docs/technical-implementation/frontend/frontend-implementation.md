# Frontend Implementation Documentation

## Overview
This document describes the complete frontend implementation for the AGoat Publisher system, including architecture, components, state management, and technical details.

## Architecture

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.x
- **UI Library**: Radix UI with Tailwind CSS 4.1.12
- **Routing**: React Router v6
- **State Management**: React Context API
- **HTTP Client**: Fetch API with custom hooks
- **Testing**: Playwright for E2E testing
- **Styling**: Tailwind CSS with Radix UI themes

### Project Structure
```
unified-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Spinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorPopup.tsx
│   │   ├── GlobalErrorToast.tsx
│   │   ├── Header.tsx
│   │   ├── PostsList.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── WysimarkEditor.tsx
│   │   └── MediumEditor.tsx
│   ├── contexts/           # React Context providers
│   │   ├── OIDCAuthContext.tsx
│   │   ├── SimpleAuthContext.tsx
│   │   ├── CognitoAuthContext.tsx
│   │   ├── AzureAuthContext.tsx
│   │   └── AuthContext.tsx
│   ├── pages/              # Page components
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── NewPost.tsx
│   │   ├── PostDetail.tsx
│   │   ├── EditPost.tsx
│   │   ├── AuthCallback.tsx
│   │   ├── AuthLogout.tsx
│   │   ├── ThorneEducation.tsx
│   │   ├── ThorneCategory.tsx
│   │   ├── ThorneRegistration.tsx
│   │   ├── ThornePatientPortal.tsx
│   │   └── ThorneCompliance.tsx
│   ├── services/           # API service layer
│   │   └── cognitoAuth.ts
│   ├── types/              # TypeScript type definitions
│   │   ├── auth.ts
│   │   ├── post.ts
│   │   └── api.ts
│   ├── utils/              # Utility functions
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── validation.ts
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── tests/                  # Test files
│   └── agoat-publisher-e2e-test.spec.ts
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── playwright.config.ts    # Playwright configuration
```

## Component Architecture

### Component Hierarchy
```
App
├── ThemeProvider
├── OIDCAuthProvider
├── GlobalErrorToast
├── ErrorBoundary
└── AppContent
    ├── Header
    └── Routes
        ├── Home
        ├── Login
        ├── Dashboard
        ├── NewPost
        ├── PostDetail
        ├── EditPost
        ├── AuthCallback
        ├── AuthLogout
        └── ThornePages
```

### Core Components

#### 1. App Component
```typescript
import { Routes, Route } from 'react-router-dom'
import { Theme, Container, Flex, Box, Heading, Button, Separator, Text } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import { Link, useLocation } from 'react-router-dom'
import { HomeIcon, DashboardIcon, PlusIcon, PersonIcon, ExitIcon, HeartIcon } from '@radix-ui/react-icons'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewPost from './pages/NewPost'
import PostDetail from './pages/PostDetail'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './components/ThemeProvider'
import { OIDCAuthProvider, useOIDCAuth } from './contexts/OIDCAuthContext'
import EditPost from './pages/EditPost'
import GlobalErrorToast from './components/GlobalErrorToast'
import ThorneEducation from './pages/ThorneEducation'
import ThorneCategory from './pages/ThorneCategory'
import ThorneRegistration from './pages/ThorneRegistration'
import ThornePatientPortal from './pages/ThornePatientPortal'
import ThorneCompliance from './pages/ThorneCompliance'
import AuthCallback from './pages/AuthCallback'
import AuthLogout from './pages/AuthLogout'

function App() {
  return (
    <ThemeProvider>
      <OIDCAuthProvider>
        <GlobalErrorToast />
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </OIDCAuthProvider>
    </ThemeProvider>
  )
}

export default App
```

#### 2. Header Component
```typescript
function Header() {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useOIDCAuth()
  
  return (
    <Box style={{ 
      background: 'var(--color-surface)', 
      borderBottom: '1px solid var(--gray-6)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <Container size="3">
        <Flex justify="between" align="center" py="4">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Flex align="center" gap="3">
              <Box style={{ 
                width: '32px', 
                height: '32px', 
                background: 'var(--accent-9)', 
                borderRadius: 'var(--radius-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold'
              }}>
                A
              </Box>
              <Heading size="5" style={{ color: 'var(--gray-12)' }}>
                AGoat Publisher
              </Heading>
            </Flex>
          </Link>
          
          <Flex gap="3" align="center">
            <Link to="/thorne/education" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="2">
                <HeartIcon />
                Thorne Supplements
              </Button>
            </Link>
            
            {isAuthenticated ? (
              <Flex gap="3" align="center">
                <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                  <Button variant={location.pathname === '/dashboard' ? 'solid' : 'ghost'} size="2">
                    <DashboardIcon />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/new-post" style={{ textDecoration: 'none' }}>
                  <Button variant={location.pathname === '/new-post' ? 'solid' : 'ghost'} size="2">
                    <PlusIcon />
                    New Post
                  </Button>
                </Link>
                <Button variant="ghost" size="2" onClick={() => logout()}>
                  <ExitIcon />
                  Logout
                </Button>
              </Flex>
            ) : (
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant={location.pathname === '/login' ? 'solid' : 'outline'} size="2">
                  <PersonIcon />
                  Login
                </Button>
              </Link>
            )}
          </Flex>
        </Flex>
      </Container>
    </Box>
  )
}
```

## State Management

### Authentication Context
```typescript
interface OIDCAuthContextType {
  user: OIDCUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (returnUrl?: string) => Promise<void>
  logout: (returnUrl?: string) => Promise<void>
  refreshToken: () => Promise<void>
}

export const OIDCAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<OIDCUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const login = async (returnUrl?: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const currentUrl = returnUrl || window.location.origin
      const loginUrl = `/api/auth/oidc/login?return_url=${encodeURIComponent(currentUrl)}`
      window.location.href = loginUrl
    } catch (err: any) {
      setError(err.message || 'Login failed')
      setIsLoading(false)
    }
  }

  const logout = async (returnUrl?: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      setUser(null)
      localStorage.removeItem('oidc_user')
      
      const currentUrl = returnUrl || window.location.origin
      const logoutUrl = `/api/auth/oidc/logout?return_url=${encodeURIComponent(currentUrl)}`
      window.location.href = logoutUrl
    } catch (err: any) {
      setError(err.message || 'Logout failed')
      setIsLoading(false)
    }
  }

  return (
    <OIDCAuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      error,
      login,
      logout,
      refreshToken
    }}>
      {children}
    </OIDCAuthContext.Provider>
  )
}
```

### Type Definitions
```typescript
// types/auth.ts
export interface OIDCUser {
  id: string
  email: string
  name: string
  given_name?: string
  family_name?: string
  email_verified: boolean
  phone_number?: string
  phone_number_verified?: boolean
  preferred_username?: string
  picture?: string
  sub: string
  iss: string
  aud: string
  exp: number
  iat: number
}

// types/post.ts
export interface Post {
  id: string
  site_id: string
  title: string
  content: string
  excerpt: string
  status: 'draft' | 'published' | 'archived'
  published_at?: string
  created_at: string
  updated_at: string
  author?: {
    id: string
    name: string
    email: string
  }
  tags?: string[]
  metadata?: {
    word_count?: number
    reading_time?: number
  }
}

// types/api.ts
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: string
    error_id: string
  }
  message?: string
  timestamp: string
}
```

## Page Components

### 1. Home Page
```typescript
import React, { useEffect, useState } from 'react'
import { useOIDCAuth } from '../contexts/OIDCAuthContext'
import { 
  Box, 
  Heading, 
  Text, 
  Card, 
  Flex, 
  Container,
  Button,
  Grid
} from '@radix-ui/themes'
import { CalendarIcon, PersonIcon, ArrowRightIcon, PlusIcon } from '@radix-ui/react-icons'
import { Link } from 'react-router-dom'
import { Post } from '../types/post'
import { apiRequest } from '../utils/api'

export default function Home() {
  const { isAuthenticated, user } = useOIDCAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await apiRequest<Post[]>('/api/sites/18c6498d-f738-4c9f-aefd-d66bec11d751/posts')
        if (response.success && response.data) {
          setPosts(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  return (
    <Container size="3">
      <Box py="6">
        <Flex direction="column" gap="6">
          {/* Hero Section */}
          <Box>
            <Heading size="8" mb="4">
              Welcome to AGoat Publisher
            </Heading>
            <Text size="4" color="gray" mb="6">
              Create and manage your blog content with ease. 
              {isAuthenticated ? ` Welcome back, ${user?.name}!` : ' Get started by logging in.'}
            </Text>
            
            {isAuthenticated ? (
              <Flex gap="3">
                <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                  <Button size="3">
                    <PersonIcon />
                    Go to Dashboard
                  </Button>
                </Link>
                <Link to="/new-post" style={{ textDecoration: 'none' }}>
                  <Button variant="outline" size="3">
                    <PlusIcon />
                    Create New Post
                  </Button>
                </Link>
              </Flex>
            ) : (
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button size="3">
                  <PersonIcon />
                  Get Started
                </Button>
              </Link>
            )}
          </Box>

          {/* Recent Posts */}
          <Box>
            <Heading size="6" mb="4">Recent Posts</Heading>
            {loading ? (
              <Text>Loading posts...</Text>
            ) : posts.length > 0 ? (
              <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
                {posts.map((post) => (
                  <Card key={post.id} style={{ height: '100%' }}>
                    <Box p="4">
                      <Heading size="4" mb="2">
                        <Link to={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {post.title}
                        </Link>
                      </Heading>
                      <Text size="2" color="gray" mb="3">
                        {post.excerpt}
                      </Text>
                      <Flex justify="between" align="center">
                        <Flex align="center" gap="2">
                          <CalendarIcon />
                          <Text size="1" color="gray">
                            {new Date(post.published_at || post.created_at).toLocaleDateString()}
                          </Text>
                        </Flex>
                        <Link to={`/post/${post.id}`} style={{ textDecoration: 'none' }}>
                          <Button variant="ghost" size="1">
                            Read More
                            <ArrowRightIcon />
                          </Button>
                        </Link>
                      </Flex>
                    </Box>
                  </Card>
                ))}
              </Grid>
            ) : (
              <Text color="gray">No posts available.</Text>
            )}
          </Box>
        </Flex>
      </Box>
    </Container>
  )
}
```

### 2. Dashboard Page
```typescript
import React, { useEffect, useState } from 'react'
import { useOIDCAuth } from '../contexts/OIDCAuthContext'
import { 
  Box, 
  Heading, 
  Text, 
  Card, 
  Flex, 
  Container,
  Button,
  Table,
  Badge
} from '@radix-ui/themes'
import { PlusIcon, Pencil1Icon, EyeOpenIcon } from '@radix-ui/react-icons'
import { Link } from 'react-router-dom'
import { Post } from '../types/post'
import { apiRequest } from '../utils/api'

export default function Dashboard() {
  const { user } = useOIDCAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await apiRequest<Post[]>('/api/sites/18c6498d-f738-4c9f-aefd-d66bec11d751/posts')
        if (response.success && response.data) {
          setPosts(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'green'
      case 'draft': return 'yellow'
      case 'archived': return 'gray'
      default: return 'gray'
    }
  }

  return (
    <Container size="3">
      <Box py="6">
        <Flex direction="column" gap="6">
          <Flex justify="between" align="center">
            <Box>
              <Heading size="6" mb="2">Dashboard</Heading>
              <Text color="gray">Manage your blog posts and content</Text>
            </Box>
            <Link to="/new-post" style={{ textDecoration: 'none' }}>
              <Button>
                <PlusIcon />
                New Post
              </Button>
            </Link>
          </Flex>

          <Card>
            <Box p="4">
              <Heading size="4" mb="4">Your Posts</Heading>
              {loading ? (
                <Text>Loading posts...</Text>
              ) : (
                <Table.Root>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Published</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {posts.map((post) => (
                      <Table.Row key={post.id}>
                        <Table.Cell>
                          <Text weight="medium">{post.title}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge color={getStatusColor(post.status)}>
                            {post.status}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2" color="gray">
                            {post.published_at 
                              ? new Date(post.published_at).toLocaleDateString()
                              : 'Not published'
                            }
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex gap="2">
                            <Link to={`/post/${post.id}`} style={{ textDecoration: 'none' }}>
                              <Button variant="ghost" size="1">
                                <EyeOpenIcon />
                              </Button>
                            </Link>
                            <Link to={`/edit-post/${post.id}`} style={{ textDecoration: 'none' }}>
                              <Button variant="ghost" size="1">
                                <Pencil1Icon />
                              </Button>
                            </Link>
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              )}
            </Box>
          </Card>
        </Flex>
      </Box>
    </Container>
  )
}
```

## API Integration

### API Service Layer
```typescript
// utils/api.ts
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://dev.np-topvitaminsupply.com:8080'
  const url = `${baseURL}${endpoint}`
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  }

  try {
    const response = await fetch(url, { ...defaultOptions, ...options })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// Custom hooks for API calls
export function usePosts(siteId: string) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        const response = await apiRequest<Post[]>(`/api/sites/${siteId}/posts`)
        if (response.success && response.data) {
          setPosts(response.data)
        } else {
          setError(response.error?.message || 'Failed to fetch posts')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [siteId])

  return { posts, loading, error, refetch: () => fetchPosts() }
}
```

## Styling and Theming

### Tailwind CSS Configuration
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Radix UI theme colors
        'gray': {
          1: 'hsl(0 0% 99%)',
          2: 'hsl(0 0% 97.3%)',
          3: 'hsl(0 0% 95.1%)',
          4: 'hsl(0 0% 93%)',
          5: 'hsl(0 0% 90.9%)',
          6: 'hsl(0 0% 88.7%)',
          7: 'hsl(0 0% 85.8%)',
          8: 'hsl(0 0% 78%)',
          9: 'hsl(0 0% 56.1%)',
          10: 'hsl(0 0% 52.3%)',
          11: 'hsl(0 0% 43.5%)',
          12: 'hsl(0 0% 9%)',
        },
        'accent': {
          1: 'hsl(210 100% 98%)',
          2: 'hsl(210 97% 94.5%)',
          3: 'hsl(210 96% 90%)',
          4: 'hsl(210 94% 85.5%)',
          5: 'hsl(210 90% 81%)',
          6: 'hsl(210 85% 76.5%)',
          7: 'hsl(210 80% 72%)',
          8: 'hsl(210 75% 67.5%)',
          9: 'hsl(210 70% 63%)',
          10: 'hsl(210 65% 58.5%)',
          11: 'hsl(210 60% 54%)',
          12: 'hsl(210 55% 49.5%)',
        }
      }
    },
  },
  plugins: [],
}
```

### Theme Provider
```typescript
// components/ThemeProvider.tsx
import { Theme } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <Theme
      appearance="light"
      accentColor="blue"
      grayColor="gray"
      radius="medium"
      scaling="100%"
    >
      {children}
    </Theme>
  )
}
```

## Error Handling

### Error Boundary
```typescript
// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Box, Heading, Text, Button, Card } from '@radix-ui/themes'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card style={{ maxWidth: '500px', margin: '20px' }}>
            <Box p="6">
              <Heading size="4" mb="4" color="red">
                Something went wrong
              </Heading>
              <Text mb="4" color="gray">
                An unexpected error occurred. Please try refreshing the page.
              </Text>
              {this.state.error && (
                <Text size="2" color="gray" mb="4" style={{ fontFamily: 'monospace' }}>
                  {this.state.error.message}
                </Text>
              )}
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </Box>
          </Card>
        </Box>
      )
    }

    return this.props.children
  }
}
```

### Global Error Toast
```typescript
// components/GlobalErrorToast.tsx
import React, { createContext, useContext, useState, useCallback } from 'react'
import { Toast, ToastProvider, ToastViewport } from '@radix-ui/themes'

interface ErrorContextType {
  showError: (message: string) => void
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export function useError() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}

export function GlobalErrorToast({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = useState<string[]>([])

  const showError = useCallback((message: string) => {
    setErrors(prev => [...prev, message])
  }, [])

  const removeError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index))
  }, [])

  return (
    <ErrorContext.Provider value={{ showError }}>
      <ToastProvider>
        {children}
        {errors.map((error, index) => (
          <Toast
            key={index}
            open={true}
            onOpenChange={() => removeError(index)}
            variant="destructive"
          >
            <Toast.Title>Error</Toast.Title>
            <Toast.Description>{error}</Toast.Description>
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ErrorContext.Provider>
  )
}
```

## Testing Implementation

### Playwright E2E Tests
```typescript
// agoat-publisher-e2e-test.spec.ts
import { test, expect } from '@playwright/test'

test.describe('AGoat Publisher E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('https://dev.np-topvitaminsupply.com')
  })

  test('should load the homepage successfully', async ({ page }) => {
    // Check if the page loads
    await expect(page).toHaveTitle(/AGoat Publisher/)
    
    // Check for main heading
    await expect(page.getByRole('heading', { name: /Welcome to AGoat Publisher/ })).toBeVisible()
    
    // Check for login button
    await expect(page.getByRole('button', { name: /Get Started/ })).toBeVisible()
  })

  test('should check for console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.goto('https://dev.np-topvitaminsupply.com')
    await page.waitForLoadState('networkidle')
    
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors)
    }
    
    expect(consoleErrors).toHaveLength(0)
  })

  test('should test OIDC logout flow and callback handling', async ({ page }) => {
    // Test the logout endpoint directly with redirect following disabled
    const logoutResponse = await page.request.get('https://dev.np-topvitaminsupply.com:8080/api/auth/oidc/logout?return_url=' + encodeURIComponent('https://dev.np-topvitaminsupply.com'), {
      maxRedirects: 0
    })
    
    // Check if logout endpoint returns redirect
    expect(logoutResponse.status()).toBe(307)
    
    // Get the redirect location
    const location = logoutResponse.headers()['location']
    console.log('Logout redirect location:', location)
    
    // Verify the logout URL format
    expect(location).toContain('auth.dev.np-topvitaminsupply.com/logout')
    expect(location).toContain('client_id=4lt0iqap612c9jug55f3a1s69k')
    expect(location).toContain('logout_uri=')
    expect(location).toContain('auth%2Fsignout')
    
    // Test the logout callback endpoint
    const callbackResponse = await page.request.get('https://dev.np-topvitaminsupply.com:8080/auth/signout?return_url=' + encodeURIComponent('https://dev.np-topvitaminsupply.com'), {
      maxRedirects: 0
    })
    
    // Check if callback endpoint returns redirect
    expect(callbackResponse.status()).toBe(307)
    
    // Get the callback redirect location
    const callbackLocation = callbackResponse.headers()['location']
    console.log('Logout callback redirect location:', callbackLocation)
    
    // Verify the callback redirects to the return URL
    expect(callbackLocation).toBe('https://dev.np-topvitaminsupply.com')
    
    console.log('✅ OIDC logout flow working correctly')
  })
})
```

## Build and Development

### Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 443,
    https: {
      key: '../certs/dev.np-topvitaminsupply.com.key',
      cert: '../certs/dev.np-topvitaminsupply.com.crt',
    },
    host: 'dev.np-topvitaminsupply.com',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui"
  }
}
```

## Performance Optimization

### Code Splitting
```typescript
// Lazy loading for route components
import { lazy, Suspense } from 'react'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const NewPost = lazy(() => import('./pages/NewPost'))
const EditPost = lazy(() => import('./pages/EditPost'))

// Usage in routes
<Route path="/dashboard" element={
  <Suspense fallback={<div>Loading...</div>}>
    <Dashboard />
  </Suspense>
} />
```

### Memoization
```typescript
import { memo, useMemo, useCallback } from 'react'

const PostCard = memo(({ post, onEdit, onDelete }: PostCardProps) => {
  const handleEdit = useCallback(() => {
    onEdit(post.id)
  }, [post.id, onEdit])

  const formattedDate = useMemo(() => {
    return new Date(post.published_at || post.created_at).toLocaleDateString()
  }, [post.published_at, post.created_at])

  return (
    <Card>
      {/* Post card content */}
    </Card>
  )
})
```

## Security Considerations

### Input Sanitization
```typescript
import DOMPurify from 'dompurify'

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title']
  })
}
```

### XSS Prevention
```typescript
// Safe HTML rendering
export function SafeHtml({ html }: { html: string }) {
  const sanitizedHtml = useMemo(() => sanitizeHtml(html), [html])
  
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}
```

## Accessibility

### ARIA Labels and Roles
```typescript
<Button
  aria-label="Create new blog post"
  role="button"
  tabIndex={0}
>
  <PlusIcon aria-hidden="true" />
  New Post
</Button>
```

### Keyboard Navigation
```typescript
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleClick()
  }
}
```

## Future Enhancements

### Planned Features
- **PWA Support**: Service worker and offline functionality
- **Real-time Updates**: WebSocket integration for live updates
- **Advanced Editor**: Rich text editor with media support
- **Analytics**: User behavior tracking and analytics
- **SEO Optimization**: Meta tags and structured data
- **Performance Monitoring**: Real user monitoring (RUM)
- **Accessibility Improvements**: WCAG 2.1 AA compliance
- **Internationalization**: Multi-language support
