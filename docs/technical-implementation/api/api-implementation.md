# API Implementation Documentation

## Overview
This document describes the complete API implementation for the AGoat Publisher system, including architecture, endpoints, authentication, and technical details.

## Architecture

### Technology Stack
- **Language**: Go 1.21+
- **Framework**: Gorilla Mux for HTTP routing
- **Database**: CockroachDB with PostgreSQL driver
- **Authentication**: OIDC-compliant with AWS Cognito
- **Configuration**: JSON-based configuration files
- **Logging**: Structured JSON logging
- **SSL/TLS**: Self-signed certificates for development

### Project Structure
```
app-api/
├── main.go                 # Main application entry point
├── config/                 # Configuration files and structs
│   ├── app_config.go       # Application configuration
│   ├── app-config.json     # Application settings
│   ├── oidc_config.go      # OIDC configuration
│   └── oidc-config.json    # OIDC provider settings
├── handlers/               # HTTP request handlers
│   ├── auth_handlers.go    # Authentication handlers
│   ├── oidc_auth_handlers_config.go  # OIDC authentication
│   ├── post_handlers.go    # Blog post handlers
│   ├── site_handlers.go    # Site management handlers
│   └── thorne_handlers.go  # Thorne integration handlers
├── services/               # Business logic services
│   └── post_service.go     # Post management service
├── migrations/             # Database migrations
├── templates/              # HTML templates
└── static/                 # Static assets
```

## Configuration Management

### Application Configuration (`app-config.json`)
```json
{
  "app": {
    "name": "AGoat Publisher",
    "version": "1.0.0",
    "base_url": "https://dev.np-topvitaminsupply.com",
    "allowed_origins": [
      "https://dev.np-topvitaminsupply.com",
      "https://localhost:3000"
    ]
  },
  "server": {
    "port": "8080",
    "host": "0.0.0.0",
    "ssl": {
      "enabled": true,
      "cert_file": "certs/dev.np-topvitaminsupply.com.crt",
      "key_file": "certs/dev.np-topvitaminsupply.com.key"
    }
  },
  "database": {
    "host": "localhost",
    "port": 26257,
    "name": "agoat_publisher",
    "ssl_mode": "require"
  },
  "logging": {
    "level": "INFO",
    "format": "json"
  }
}
```

### OIDC Configuration (`oidc-config.json`)
```json
{
  "providers": [
    {
      "system_name": "cognito",
      "display_name": "AWS Cognito Dev",
      "provider_type": "oidc",
      "is_active": true,
      "is_default_for_type": true,
      "provider_instance_id": "us-east-1_FJUcN8W07",
      "provider_environment": "development",
      "provider_region": "us-east-1",
      "provider_domain": "auth.dev.np-topvitaminsupply.com",
      "jwks_url": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07/.well-known/jwks.json",
      "issuer_url": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07",
      "oidc_discovery_url": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07/.well-known/openid_configuration",
      "authorization_endpoint": "https://auth.dev.np-topvitaminsupply.com/login",
      "token_endpoint": "https://auth.dev.np-topvitaminsupply.com/oauth2/token",
      "userinfo_endpoint": "https://auth.dev.np-topvitaminsupply.com/oauth2/userInfo",
      "end_session_endpoint": "https://auth.dev.np-topvitaminsupply.com/logout",
      "client_id": "4lt0iqap612c9jug55f3a1s69k",
      "client_secret": "",
      "scopes": "email openid phone",
      "response_type": "code",
      "response_mode": "query",
      "code_challenge_method": "S256",
      "supported_claims": {
        "sub": "string",
        "email": "string",
        "email_verified": "boolean",
        "phone_number": "string",
        "phone_number_verified": "boolean",
        "given_name": "string",
        "family_name": "string",
        "name": "string",
        "preferred_username": "string",
        "cognito:username": "string"
      },
      "provider_metadata": {
        "user_pool_id": "us-east-1_FJUcN8W07",
        "region": "us-east-1",
        "domain": "auth.dev.np-topvitaminsupply.com"
      },
      "redirect_uri": "https://dev.np-topvitaminsupply.com/auth/callback"
    }
  ]
}
```

## API Endpoints

### Authentication Endpoints

#### OIDC Authentication
- `GET /api/auth/oidc/login` - Initiate OIDC login
- `GET /api/auth/oidc/callback` - Handle OIDC callback
- `GET /api/auth/oidc/logout` - Initiate OIDC logout
- `GET /api/auth/oidc/refresh` - Refresh access token
- `GET /api/auth/oidc/user-info` - Get user information
- `GET /api/auth/oidc/config` - Get OIDC configuration
- `POST /api/auth/oidc/revoke` - Revoke tokens

#### Frontend Authentication Routes
- `GET /auth/signout` - Frontend signout callback

### Blog Management Endpoints

#### Sites
- `GET /api/sites` - List all sites
- `GET /api/sites/{id}` - Get site details
- `POST /api/sites` - Create new site
- `PUT /api/sites/{id}` - Update site
- `DELETE /api/sites/{id}` - Delete site

#### Posts
- `GET /api/sites/{site_id}/posts` - List posts for site
- `GET /api/sites/{site_id}/posts/{id}` - Get post details
- `POST /api/sites/{site_id}/posts` - Create new post
- `PUT /api/sites/{site_id}/posts/{id}` - Update post
- `DELETE /api/sites/{site_id}/posts/{id}` - Delete post

### Thorne Integration Endpoints

#### Categories
- `GET /api/thorne/categories` - List Thorne categories
- `GET /api/thorne/categories/{id}` - Get category details

#### Products
- `GET /api/thorne/products` - List Thorne products
- `GET /api/thorne/products/{id}` - Get product details

#### Orders
- `GET /api/thorne/orders` - List Thorne orders
- `GET /api/thorne/orders/{id}` - Get order details

#### Patients
- `GET /api/thorne/patients` - List Thorne patients
- `GET /api/thorne/patients/{id}` - Get patient details

#### Settings
- `GET /api/thorne/settings` - Get Thorne settings
- `PUT /api/thorne/settings` - Update Thorne settings

## Request/Response Formats

### Standard Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2025-09-29T12:00:00Z"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": "The provided email address is invalid",
    "error_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "timestamp": "2025-09-29T12:00:00Z"
}
```

### Post Object Format
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "site_id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "Sample Blog Post",
  "content": "This is the blog post content...",
  "excerpt": "Short excerpt of the post",
  "status": "published",
  "published_at": "2025-09-29T12:00:00Z",
  "created_at": "2025-09-29T10:00:00Z",
  "updated_at": "2025-09-29T12:00:00Z",
  "author": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "tags": ["technology", "blogging"],
  "metadata": {
    "word_count": 500,
    "reading_time": 2
  }
}
```

## Authentication Implementation

### OIDC Flow Implementation

#### 1. Login Initiation
```go
func (h *OIDCAuthHandlersConfig) Login(w http.ResponseWriter, r *http.Request) {
    // Get return URL from query parameters
    returnURL := r.URL.Query().Get("return_url")
    
    // Validate return URL
    if returnURL != "" && !h.validateReturnURL(returnURL) {
        returnURL = h.getDefaultReturnURL()
    }
    
    // Generate PKCE parameters
    codeVerifier, codeChallenge, err := generatePKCE()
    if err != nil {
        http.Error(w, "Error generating PKCE", http.StatusInternalServerError)
        return
    }
    
    // Store state and PKCE verifier
    state := generateState(returnURL, codeVerifier)
    
    // Build authorization URL
    authURL := h.oauth2Config.AuthCodeURL(state, oauth2.SetAuthURLParam("code_challenge", codeChallenge))
    
    // Redirect to OIDC provider
    http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}
```

#### 2. Callback Handling
```go
func (h *OIDCAuthHandlersConfig) Callback(w http.ResponseWriter, r *http.Request) {
    // Extract authorization code and state
    code := r.URL.Query().Get("code")
    state := r.URL.Query().Get("state")
    
    // Validate state and extract return URL
    returnURL, codeVerifier, err := h.validateState(state)
    if err != nil {
        http.Error(w, "Invalid state", http.StatusBadRequest)
        return
    }
    
    // Exchange code for tokens
    token, err := h.oauth2Config.Exchange(r.Context(), code, oauth2.SetAuthURLParam("code_verifier", codeVerifier))
    if err != nil {
        http.Error(w, "Token exchange failed", http.StatusInternalServerError)
        return
    }
    
    // Get user information
    userInfo, err := h.getUserInfo(token.AccessToken)
    if err != nil {
        http.Error(w, "Failed to get user info", http.StatusInternalServerError)
        return
    }
    
    // Store user session
    h.storeUserSession(w, r, userInfo, token)
    
    // Redirect to return URL
    http.Redirect(w, r, returnURL, http.StatusTemporaryRedirect)
}
```

#### 3. Logout Implementation
```go
func (h *OIDCAuthHandlersConfig) Logout(w http.ResponseWriter, r *http.Request) {
    // Get return URL from query parameters
    returnURL := r.URL.Query().Get("return_url")
    
    // Get tokens from request
    refreshToken := r.URL.Query().Get("refresh_token")
    
    // Step 1: Revoke refresh token
    if refreshToken != "" {
        err := h.revokeTokenInternal(refreshToken)
        if err != nil {
            log.Printf("Failed to revoke refresh token: %v", err)
        }
    }
    
    // Step 2: Clear session data
    log.Printf("Clearing session data for user")
    
    // Step 3: Redirect to Cognito logout
    logoutCallbackURL := fmt.Sprintf("%s/auth/signout", h.appConfig.App.BaseURL)
    logoutURL := fmt.Sprintf("%s?client_id=%s&logout_uri=%s",
        h.config.EndSessionEndpoint,
        h.config.ClientID,
        url.QueryEscape(logoutCallbackURL))
    
    http.Redirect(w, r, logoutURL, http.StatusTemporaryRedirect)
}
```

## Database Integration

### Connection Management
```go
type App struct {
    db              *sql.DB
    logger          *Logger
    oidcAuthHandlers *OIDCAuthHandlersConfig
    // ... other fields
}

func (app *App) initDatabase() error {
    // Build connection string from environment variables
    connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
        os.Getenv("DB_USER"),
        os.Getenv("DB_PASSWORD"),
        os.Getenv("DB_HOST"),
        os.Getenv("DB_PORT"),
        os.Getenv("DB_NAME"),
        os.Getenv("DB_SSL_MODE"))
    
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        return fmt.Errorf("failed to connect to database: %w", err)
    }
    
    // Test connection
    if err := db.Ping(); err != nil {
        return fmt.Errorf("failed to ping database: %w", err)
    }
    
    app.db = db
    return nil
}
```

### Query Examples
```go
// Get posts for a site
func (app *App) getPosts(siteID string, page, perPage int) ([]Post, error) {
    query := `
        SELECT id, site_id, title, content, excerpt, status, 
               published_at, created_at, updated_at
        FROM posts 
        WHERE site_id = $1 AND status = 'published'
        ORDER BY published_at DESC
        LIMIT $2 OFFSET $3`
    
    rows, err := app.db.Query(query, siteID, perPage, (page-1)*perPage)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var posts []Post
    for rows.Next() {
        var post Post
        err := rows.Scan(&post.ID, &post.SiteID, &post.Title, 
                        &post.Content, &post.Excerpt, &post.Status,
                        &post.PublishedAt, &post.CreatedAt, &post.UpdatedAt)
        if err != nil {
            return nil, err
        }
        posts = append(posts, post)
    }
    
    return posts, nil
}
```

## Error Handling

### Structured Error Response
```go
type BusinessError struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Details string `json:"details,omitempty"`
    ErrorID string `json:"error_id"`
}

func generateErrorResponse(err BusinessError, errorID string) map[string]interface{} {
    return map[string]interface{}{
        "success": false,
        "error":   err,
        "timestamp": time.Now().UTC().Format(time.RFC3339),
    }
}
```

### Error Types
- `VALIDATION_ERROR` - Input validation failures
- `AUTHENTICATION_ERROR` - Authentication failures
- `AUTHORIZATION_ERROR` - Authorization failures
- `NOT_FOUND` - Resource not found
- `INTERNAL_ERROR` - Internal server errors
- `EXTERNAL_SERVICE_ERROR` - External service failures

## Logging Implementation

### Structured Logging
```go
type Logger struct {
    level string
}

func (l *Logger) log(level, component, action, message string, fields map[string]interface{}) {
    if l.shouldLog(level) {
        logID := uuid.New().String()
        logEntry := map[string]interface{}{
            "log_id":    logID,
            "timestamp": time.Now().UTC().Format(time.RFC3339),
            "level":     level,
            "component": component,
            "action":    action,
            "message":   message,
        }
        
        // Add additional fields
        for key, value := range fields {
            logEntry[key] = value
        }
        
        jsonData, _ := json.Marshal(logEntry)
        log.Println(string(jsonData))
    }
}
```

### Log Levels
- `DEBUG` - Detailed debugging information
- `INFO` - General information about application flow
- `WARNING` - Warning messages for potential issues
- `ERROR` - Error messages for failures

## Security Implementation

### CORS Configuration
```go
func setupCORS(w http.ResponseWriter, r *http.Request) {
    origin := r.Header.Get("Origin")
    if isAllowedOrigin(origin) {
        w.Header().Set("Access-Control-Allow-Origin", origin)
    }
    w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-ID, X-User-Role")
    w.Header().Set("Access-Control-Allow-Credentials", "true")
}
```

### Input Validation
```go
func validatePostInput(post *Post) error {
    if post.Title == "" {
        return errors.New("title is required")
    }
    if len(post.Title) > 255 {
        return errors.New("title too long")
    }
    if post.Content == "" {
        return errors.New("content is required")
    }
    return nil
}
```

## Performance Considerations

### Database Connection Pooling
```go
func (app *App) initDatabase() error {
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        return err
    }
    
    // Configure connection pool
    db.SetMaxOpenConns(25)
    db.SetMaxIdleConns(5)
    db.SetConnMaxLifetime(5 * time.Minute)
    
    app.db = db
    return nil
}
```

### Caching Strategy
- In-memory caching for frequently accessed data
- Redis integration for distributed caching (future)
- Database query optimization with proper indexing

## Testing

### Unit Testing
```go
func TestPostHandler(t *testing.T) {
    // Setup test database
    db := setupTestDB(t)
    defer cleanupTestDB(t, db)
    
    // Create test app
    app := &App{db: db}
    
    // Test post creation
    req := createTestRequest("POST", "/api/sites/test-site/posts", testPostData)
    w := httptest.NewRecorder()
    
    app.createPost(w, req)
    
    assert.Equal(t, http.StatusCreated, w.Code)
    // ... additional assertions
}
```

### Integration Testing
- End-to-end API testing with test database
- Authentication flow testing
- Database migration testing

## Deployment

### Environment Variables
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=26257
DB_NAME=agoat_publisher
DB_USER=agoat_user
DB_PASSWORD=secure_password
DB_SSL_MODE=require

# Application Configuration
APP_BASE_URL=https://dev.np-topvitaminsupply.com
APP_PORT=8080
LOG_LEVEL=INFO

# OIDC Configuration
OIDC_CLIENT_ID=4lt0iqap612c9jug55f3a1s69k
OIDC_CLIENT_SECRET=your_client_secret
OIDC_PROVIDER_DOMAIN=auth.dev.np-topvitaminsupply.com
```

### SSL/TLS Configuration
- Self-signed certificates for development
- Let's Encrypt integration for production
- HSTS headers for security

## Monitoring and Observability

### Health Checks
```go
func (app *App) healthCheck(w http.ResponseWriter, r *http.Request) {
    // Check database connection
    if err := app.db.Ping(); err != nil {
        http.Error(w, "Database unhealthy", http.StatusServiceUnavailable)
        return
    }
    
    // Check external services
    // ... additional health checks
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "status": "healthy",
        "timestamp": time.Now().UTC().Format(time.RFC3339),
    })
}
```

### Metrics Collection
- Request/response metrics
- Database query performance
- Authentication success/failure rates
- Error rates by endpoint

## Future Enhancements

### Planned Features
- GraphQL API support
- WebSocket support for real-time updates
- Rate limiting and throttling
- API versioning
- OpenAPI/Swagger documentation
- Distributed tracing
- Advanced caching strategies
