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

**Implementation File**: `unified-app/src/App.tsx`

The main App component provides:
- **Theme Provider**: Radix UI theme configuration
- **Authentication Provider**: OIDC authentication context
- **Error Handling**: Global error toast and error boundary
- **Routing**: React Router configuration for all application routes
- **Component Structure**: Organized component hierarchy with providers

#### 2. Header Component

**Implementation File**: `unified-app/src/components/Header.tsx`

The Header component provides:
- **Navigation**: Main navigation links (Home, Dashboard, New Post)
- **Authentication State**: Shows login/logout based on authentication status
- **User Information**: Displays user details when authenticated
- **Responsive Design**: Mobile-friendly navigation layout

## State Management

### Authentication Context

**Implementation File**: `unified-app/src/contexts/OIDCAuthContext.tsx`

The OIDC authentication context provides:
- **User State**: Current user information and authentication status
- **Loading State**: Authentication process loading indicators
- **Error Handling**: Authentication error management
- **Authentication Methods**: Login, logout, and token refresh functions
- **Context Provider**: React context for sharing authentication state across components

## Page Components

### 1. Home Page

**Implementation File**: `unified-app/src/pages/Home.tsx`

The Home page provides:
- **Public Content**: Displays published blog posts for public viewing
- **Authentication Integration**: Shows login prompts for unauthenticated users
- **Post Display**: Lists recent posts with titles, excerpts, and metadata
- **Navigation**: Links to individual post details and authentication pages

### 2. Dashboard Page

**Implementation File**: `unified-app/src/pages/Dashboard.tsx`

The Dashboard page provides:
- **User Management**: User-specific content and settings
- **Post Management**: Create, edit, and manage blog posts
- **Site Management**: Configure blog sites and settings
- **Analytics**: View post statistics and performance metrics

## Styling and Theming

### Tailwind CSS Configuration

**Configuration File**: `unified-app/tailwind.config.js`

The Tailwind CSS configuration includes:
- **Content Sources**: HTML and TypeScript/JavaScript files for class detection
- **Theme Extensions**: Custom colors, spacing, and design tokens
- **Plugin Integration**: Radix UI theme integration
- **Responsive Design**: Mobile-first responsive breakpoints

## API Integration

### API Service Layer

**Implementation File**: `unified-app/src/utils/api.ts`

The API service layer provides:
- **HTTP Client**: Fetch-based API requests with error handling
- **Type Safety**: TypeScript interfaces for API responses
- **Authentication**: Automatic token handling for authenticated requests
- **Error Handling**: Standardized error response processing

## Build and Development

### Vite Configuration

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
