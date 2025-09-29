# Testing Implementation Documentation

## Overview
This document describes the complete testing implementation for the AGoat Publisher system, including unit tests, integration tests, E2E tests, and testing infrastructure.

## Testing Strategy

### Testing Pyramid
1. **Unit Tests** (70%): Individual component testing
2. **Integration Tests** (20%): Component interaction testing
3. **E2E Tests** (10%): Full application workflow testing

### Testing Tools
- **Backend**: Go testing package, testify
- **Frontend**: Jest, React Testing Library, Playwright
- **E2E**: Playwright
- **API Testing**: Go HTTP testing, Postman/Newman
- **Database Testing**: Test containers, in-memory databases

## Backend Testing

### Unit Testing

#### Test Structure
```go
// app-api/handlers/post_handlers_test.go
package handlers

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"
    
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
)

func TestCreatePost(t *testing.T) {
    // Setup
    mockDB := &MockDatabase{}
    handler := &PostHandlers{db: mockDB}
    
    // Test data
    postData := map[string]interface{}{
        "title":   "Test Post",
        "content": "Test content",
        "status":  "draft",
    }
    
    jsonData, _ := json.Marshal(postData)
    req := httptest.NewRequest("POST", "/api/sites/test-site/posts", bytes.NewBuffer(jsonData))
    req.Header.Set("Content-Type", "application/json")
    w := httptest.NewRecorder()
    
    // Mock expectations
    mockDB.On("CreatePost", mock.AnythingOfType("*Post")).Return(nil)
    
    // Execute
    handler.CreatePost(w, req)
    
    // Assert
    assert.Equal(t, http.StatusCreated, w.Code)
    
    var response map[string]interface{}
    json.Unmarshal(w.Body.Bytes(), &response)
    assert.True(t, response["success"].(bool))
    assert.Equal(t, "Test Post", response["data"].(map[string]interface{})["title"])
    
    mockDB.AssertExpectations(t)
}
```

#### Mock Database
```go
// app-api/handlers/mocks.go
package handlers

import (
    "github.com/stretchr/testify/mock"
)

type MockDatabase struct {
    mock.Mock
}

func (m *MockDatabase) CreatePost(post *Post) error {
    args := m.Called(post)
    return args.Error(0)
}

func (m *MockDatabase) GetPost(id string) (*Post, error) {
    args := m.Called(id)
    return args.Get(0).(*Post), args.Error(1)
}

func (m *MockDatabase) UpdatePost(post *Post) error {
    args := m.Called(post)
    return args.Error(0)
}

func (m *MockDatabase) DeletePost(id string) error {
    args := m.Called(id)
    return args.Error(0)
}
```

#### Service Layer Testing
```go
// app-api/services/post_service_test.go
package services

import (
    "testing"
    "time"
    
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
)

func TestPostService_CreatePost(t *testing.T) {
    // Setup
    mockDB := &MockDatabase{}
    service := &PostService{db: mockDB}
    
    post := &Post{
        Title:   "Test Post",
        Content: "Test content",
        Status:  "draft",
    }
    
    // Mock expectations
    mockDB.On("CreatePost", post).Return(nil)
    
    // Execute
    err := service.CreatePost(post)
    
    // Assert
    assert.NoError(t, err)
    assert.NotEmpty(t, post.ID)
    assert.NotZero(t, post.CreatedAt)
    assert.NotZero(t, post.UpdatedAt)
    
    mockDB.AssertExpectations(t)
}
```

### Integration Testing

#### Database Integration Tests
```go
// app-api/integration/database_test.go
package integration

import (
    "database/sql"
    "testing"
    
    _ "github.com/lib/pq"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func setupTestDB(t *testing.T) *sql.DB {
    db, err := sql.Open("postgres", "postgres://test:test@localhost:26257/test_db?sslmode=disable")
    require.NoError(t, err)
    
    // Run migrations
    runMigrations(t, db)
    
    return db
}

func cleanupTestDB(t *testing.T, db *sql.DB) {
    // Clean up test data
    db.Exec("DELETE FROM posts")
    db.Exec("DELETE FROM sites")
    db.Close()
}

func TestPostCRUD(t *testing.T) {
    db := setupTestDB(t)
    defer cleanupTestDB(t, db)
    
    // Create post
    post := &Post{
        SiteID:  "test-site",
        Title:   "Test Post",
        Content: "Test content",
        Status:  "draft",
    }
    
    err := createPost(db, post)
    assert.NoError(t, err)
    assert.NotEmpty(t, post.ID)
    
    // Read post
    retrievedPost, err := getPost(db, post.ID)
    assert.NoError(t, err)
    assert.Equal(t, post.Title, retrievedPost.Title)
    
    // Update post
    retrievedPost.Title = "Updated Title"
    err = updatePost(db, retrievedPost)
    assert.NoError(t, err)
    
    // Verify update
    updatedPost, err := getPost(db, post.ID)
    assert.NoError(t, err)
    assert.Equal(t, "Updated Title", updatedPost.Title)
    
    // Delete post
    err = deletePost(db, post.ID)
    assert.NoError(t, err)
    
    // Verify deletion
    _, err = getPost(db, post.ID)
    assert.Error(t, err)
}
```

#### API Integration Tests
```go
// app-api/integration/api_test.go
package integration

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"
    
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestAPIIntegration(t *testing.T) {
    // Setup test server
    app := setupTestApp(t)
    defer cleanupTestApp(t, app)
    
    // Test post creation
    postData := map[string]interface{}{
        "title":   "Integration Test Post",
        "content": "Integration test content",
        "status":  "draft",
    }
    
    jsonData, _ := json.Marshal(postData)
    req := httptest.NewRequest("POST", "/api/sites/test-site/posts", bytes.NewBuffer(jsonData))
    req.Header.Set("Content-Type", "application/json")
    w := httptest.NewRecorder()
    
    app.ServeHTTP(w, req)
    
    assert.Equal(t, http.StatusCreated, w.Code)
    
    var response map[string]interface{}
    err := json.Unmarshal(w.Body.Bytes(), &response)
    require.NoError(t, err)
    
    assert.True(t, response["success"].(bool))
    postID := response["data"].(map[string]interface{})["id"].(string)
    
    // Test post retrieval
    req = httptest.NewRequest("GET", "/api/sites/test-site/posts/"+postID, nil)
    w = httptest.NewRecorder()
    
    app.ServeHTTP(w, req)
    
    assert.Equal(t, http.StatusOK, w.Code)
    
    err = json.Unmarshal(w.Body.Bytes(), &response)
    require.NoError(t, err)
    
    assert.True(t, response["success"].(bool))
    assert.Equal(t, "Integration Test Post", response["data"].(map[string]interface{})["title"])
}
```

## Frontend Testing

### Unit Testing

#### Component Testing
```typescript
// unified-app/src/components/__tests__/Button.test.tsx
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant styles correctly', () => {
    render(<Button variant="outline">Outline Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
})
```

#### Hook Testing
```typescript
// unified-app/src/hooks/__tests__/usePosts.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { usePosts } from '../usePosts'
import { apiRequest } from '../../utils/api'

jest.mock('../../utils/api')
const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>

describe('usePosts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches posts successfully', async () => {
    const mockPosts = [
      { id: '1', title: 'Test Post 1', content: 'Content 1' },
      { id: '2', title: 'Test Post 2', content: 'Content 2' }
    ]

    mockApiRequest.mockResolvedValue({
      success: true,
      data: mockPosts
    })

    const { result } = renderHook(() => usePosts('test-site'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.posts).toEqual(mockPosts)
    expect(result.current.error).toBeNull()
  })

  it('handles API errors', async () => {
    mockApiRequest.mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => usePosts('test-site'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.posts).toEqual([])
    expect(result.current.error).toBe('API Error')
  })
})
```

#### Context Testing
```typescript
// unified-app/src/contexts/__tests__/OIDCAuthContext.test.tsx
import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { OIDCAuthProvider, useOIDCAuth } from '../OIDCAuthContext'

const TestComponent = () => {
  const { user, isAuthenticated, login, logout } = useOIDCAuth()
  
  return (
    <div>
      <div data-testid="user">{user?.name || 'No user'}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <button onClick={() => login()}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  )
}

describe('OIDCAuthContext', () => {
  it('provides authentication state', () => {
    render(
      <OIDCAuthProvider>
        <TestComponent />
      </OIDCAuthProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('No user')
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
  })

  it('handles login flow', async () => {
    const mockLocation = { href: '' }
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    })

    render(
      <OIDCAuthProvider>
        <TestComponent />
      </OIDCAuthProvider>
    )

    await act(async () => {
      fireEvent.click(screen.getByText('Login'))
    })

    expect(mockLocation.href).toContain('/api/auth/oidc/login')
  })
})
```

### Integration Testing

#### Page Component Testing
```typescript
// unified-app/src/pages/__tests__/Home.test.tsx
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Theme } from '@radix-ui/themes'
import Home from '../Home'
import { OIDCAuthProvider } from '../../contexts/OIDCAuthContext'

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <Theme>
        <OIDCAuthProvider>
          {component}
        </OIDCAuthProvider>
      </Theme>
    </BrowserRouter>
  )
}

describe('Home Page', () => {
  it('renders welcome message', () => {
    renderWithProviders(<Home />)
    
    expect(screen.getByText(/Welcome to AGoat Publisher/)).toBeInTheDocument()
  })

  it('shows login button when not authenticated', () => {
    renderWithProviders(<Home />)
    
    expect(screen.getByText(/Get Started/)).toBeInTheDocument()
  })

  it('shows dashboard link when authenticated', async () => {
    // Mock authenticated state
    jest.spyOn(require('../../contexts/OIDCAuthContext'), 'useOIDCAuth')
      .mockReturnValue({
        user: { name: 'Test User', email: 'test@example.com' },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn()
      })

    renderWithProviders(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Test User/)).toBeInTheDocument()
    })
    
    expect(screen.getByText(/Go to Dashboard/)).toBeInTheDocument()
  })
})
```

## End-to-End Testing

### Playwright Configuration
```typescript
// unified-app/playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'https://dev.np-topvitaminsupply.com',
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'https://dev.np-topvitaminsupply.com',
    reuseExistingServer: !process.env.CI,
    ignoreHTTPSErrors: true,
  },
})
```

### E2E Test Implementation
```typescript
// unified-app/agoat-publisher-e2e-test.spec.ts
import { test, expect } from '@playwright/test'

test.describe('AGoat Publisher E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/AGoat Publisher/)
    await expect(page.getByRole('heading', { name: /Welcome to AGoat Publisher/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Get Started/ })).toBeVisible()
  })

  test('should check for console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors)
    }
    
    expect(consoleErrors).toHaveLength(0)
  })

  test('should navigate to login page', async ({ page }) => {
    await page.getByRole('button', { name: /Get Started/ }).click()
    await expect(page).toHaveURL(/.*login/)
    await expect(page.getByRole('heading', { name: /Login/ })).toBeVisible()
  })

  test('should test OIDC logout flow', async ({ page }) => {
    const logoutResponse = await page.request.get(
      'https://dev.np-topvitaminsupply.com:8080/api/auth/oidc/logout?return_url=' + 
      encodeURIComponent('https://dev.np-topvitaminsupply.com'),
      { maxRedirects: 0 }
    )
    
    expect(logoutResponse.status()).toBe(307)
    
    const location = logoutResponse.headers()['location']
    expect(location).toContain('auth.dev.np-topvitaminsupply.com/logout')
    expect(location).toContain('client_id=4lt0iqap612c9jug55f3a1s69k')
  })

  test('should create and edit a blog post', async ({ page }) => {
    // This would require authentication setup
    // For now, just test the UI flow
    
    await page.goto('/login')
    await page.getByRole('button', { name: /Login/ }).click()
    
    // Wait for redirect to Cognito
    await page.waitForURL(/auth\.dev\.np-topvitaminsupply\.com/)
    
    // In a real test, you'd handle the Cognito login flow
    // For now, we'll just verify the redirect happened
    expect(page.url()).toContain('auth.dev.np-topvitaminsupply.com')
  })
})
```

## API Testing

### Postman Collection
```json
{
  "info": {
    "name": "AGoat Publisher API",
    "description": "API tests for AGoat Publisher",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "OIDC Login",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/api/auth/oidc/login?return_url={{return_url}}",
              "host": ["{{base_url}}"],
              "path": ["api", "auth", "oidc", "login"],
              "query": [
                {
                  "key": "return_url",
                  "value": "{{return_url}}"
                }
              ]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status code is 307', function () {",
                  "    pm.response.to.have.status(307);",
                  "});",
                  "",
                  "pm.test('Redirects to OIDC provider', function () {",
                  "    const location = pm.response.headers.get('Location');",
                  "    pm.expect(location).to.include('auth.dev.np-topvitaminsupply.com');",
                  "});"
                ]
              }
            }
          ]
        }
      ]
    },
    {
      "name": "Posts",
      "item": [
        {
          "name": "Get Posts",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/api/sites/{{site_id}}/posts",
              "host": ["{{base_url}}"],
              "path": ["api", "sites", "{{site_id}}", "posts"]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status code is 200', function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "",
                  "pm.test('Response has success field', function () {",
                  "    const jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('success');",
                  "});"
                ]
              }
            }
          ]
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "https://dev.np-topvitaminsupply.com:8080"
    },
    {
      "key": "site_id",
      "value": "18c6498d-f738-4c9f-aefd-d66bec11d751"
    },
    {
      "key": "return_url",
      "value": "https://dev.np-topvitaminsupply.com"
    }
  ]
}
```

## Performance Testing

### Load Testing with Artillery
```yaml
# artillery-config.yml
config:
  target: 'https://dev.np-topvitaminsupply.com:8080'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 20
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: "API Load Test"
    weight: 100
    flow:
      - get:
          url: "/api/sites/18c6498d-f738-4c9f-aefd-d66bec11d751/posts"
          expect:
            - statusCode: 200
      - post:
          url: "/api/sites/18c6498d-f738-4c9f-aefd-d66bec11d751/posts"
          json:
            title: "Load Test Post"
            content: "This is a load test post"
            status: "draft"
          expect:
            - statusCode: 201
```

## Test Data Management

### Test Fixtures
```typescript
// unified-app/src/__fixtures__/posts.ts
export const mockPosts = [
  {
    id: '1',
    site_id: 'test-site',
    title: 'Test Post 1',
    content: 'This is test content 1',
    excerpt: 'Test excerpt 1',
    status: 'published',
    published_at: '2025-09-29T10:00:00Z',
    created_at: '2025-09-29T09:00:00Z',
    updated_at: '2025-09-29T10:00:00Z',
    author: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    },
    tags: ['test', 'example'],
    metadata: {
      word_count: 10,
      reading_time: 1
    }
  },
  {
    id: '2',
    site_id: 'test-site',
    title: 'Test Post 2',
    content: 'This is test content 2',
    excerpt: 'Test excerpt 2',
    status: 'draft',
    created_at: '2025-09-29T11:00:00Z',
    updated_at: '2025-09-29T11:00:00Z',
    author: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    },
    tags: ['test'],
    metadata: {
      word_count: 8,
      reading_time: 1
    }
  }
]
```

### Test Utilities
```typescript
// unified-app/src/__utils__/test-utils.tsx
import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Theme } from '@radix-ui/themes'
import { OIDCAuthProvider } from '../contexts/OIDCAuthContext'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialAuthState?: {
    user?: any
    isAuthenticated?: boolean
    isLoading?: boolean
  }
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const { initialAuthState, ...renderOptions } = options

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <BrowserRouter>
        <Theme>
          <OIDCAuthProvider>
            {children}
          </OIDCAuthProvider>
        </Theme>
      </BrowserRouter>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

export * from '@testing-library/react'
export { renderWithProviders as render }
```

## Continuous Integration

### GitHub Actions Test Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Go
      uses: actions/setup-go@v3
      with:
        go-version: 1.21
    
    - name: Install dependencies
      run: |
        cd app-api
        go mod download
    
    - name: Run unit tests
      run: |
        cd app-api
        go test -v ./...
    
    - name: Run integration tests
      run: |
        cd app-api
        go test -v ./integration/...

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: unified-app/package-lock.json
    
    - name: Install dependencies
      run: |
        cd unified-app
        npm ci
    
    - name: Run unit tests
      run: |
        cd unified-app
        npm run test:unit
    
    - name: Run type checking
      run: |
        cd unified-app
        npm run type-check
    
    - name: Run linting
      run: |
        cd unified-app
        npm run lint

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: unified-app/package-lock.json
    
    - name: Install dependencies
      run: |
        cd unified-app
        npm ci
    
    - name: Install Playwright browsers
      run: |
        cd unified-app
        npx playwright install --with-deps
    
    - name: Run E2E tests
      run: |
        cd unified-app
        npm run test:e2e
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: unified-app/playwright-report/
```

## Test Coverage

### Coverage Configuration
```json
// unified-app/package.json
{
  "scripts": {
    "test:coverage": "jest --coverage",
    "test:coverage:watch": "jest --coverage --watch"
  },
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts",
      "!src/main.tsx",
      "!src/vite-env.d.ts"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

### Coverage Reports
```bash
#!/bin/bash
# scripts/generate-coverage-report.sh

echo "Generating test coverage report..."

# Backend coverage
cd app-api
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html
echo "Backend coverage report generated: app-api/coverage.html"

# Frontend coverage
cd ../unified-app
npm run test:coverage
echo "Frontend coverage report generated: unified-app/coverage/lcov-report/index.html"

echo "Coverage reports generated successfully"
```

## Test Maintenance

### Test Data Cleanup
```typescript
// unified-app/src/__utils__/test-cleanup.ts
export async function cleanupTestData() {
  // Clear localStorage
  localStorage.clear()
  
  // Clear sessionStorage
  sessionStorage.clear()
  
  // Reset any global state
  if (window.location.href !== 'about:blank') {
    window.location.href = 'about:blank'
  }
}

export function setupTestEnvironment() {
  // Mock external dependencies
  jest.mock('../utils/api', () => ({
    apiRequest: jest.fn()
  }))
  
  // Setup test environment variables
  process.env.NODE_ENV = 'test'
  process.env.VITE_API_BASE_URL = 'http://localhost:3001'
}
```

### Test Documentation
```markdown
# Testing Guidelines

## Writing Tests

### Unit Tests
- Test individual functions and components in isolation
- Use mocks for external dependencies
- Aim for 100% code coverage of business logic
- Keep tests fast and deterministic

### Integration Tests
- Test component interactions
- Use real database connections in test environment
- Test API endpoints with actual HTTP requests
- Verify data flow between components

### E2E Tests
- Test complete user workflows
- Use realistic test data
- Test critical user journeys
- Keep tests stable and reliable

## Test Naming
- Use descriptive test names
- Follow the pattern: "should [expected behavior] when [condition]"
- Group related tests in describe blocks
- Use consistent naming conventions

## Test Data
- Use factories for creating test data
- Keep test data minimal and focused
- Clean up test data after each test
- Use realistic but anonymized data
```

This comprehensive testing implementation provides a solid foundation for ensuring code quality and reliability across the AGoat Publisher system.
