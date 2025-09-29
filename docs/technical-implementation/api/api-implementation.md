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

### Application Configuration

**Configuration File**: `app-api/config/app-config.json`

The application configuration includes settings for:
- **App**: Name, version, base URL, and allowed origins
- **Server**: Port, host, and SSL certificate paths
- **Database**: Connection settings and SSL mode
- **Logging**: Log level and format

### OIDC Configuration

**Configuration File**: `app-api/config/oidc-config.json`

The OIDC configuration defines AWS Cognito as the active provider with:
- **Provider Details**: System name, display name, instance ID, region
- **Endpoints**: Authorization, token, userinfo, and end session endpoints
- **Client Settings**: Client ID, scopes, response type, PKCE method
- **Claims**: Supported OIDC claims and provider-specific metadata
- **Redirect URI**: Callback URL for authentication flow

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

### Response Formats

**Standard Response**: Success responses include `success: true`, `data` object, `message`, and `timestamp`

**Error Response**: Error responses include `success: false`, `error` object with code, message, details, and error_id

**Post Object**: Contains post metadata including ID, site_id, title, content, status, timestamps, author info, tags, and metadata

**Implementation Files**:
- Response handling: `app-api/handlers/` (various handler files)
- Data structures: `app-api/types/` (if exists) or defined in handler files

## Authentication Implementation

### OIDC Flow Implementation

**Implementation File**: `app-api/handlers/oidc_auth_handlers_config.go`

#### 1. Login Initiation (`Login` function)
- Validates return URL from query parameters
- Generates PKCE parameters for security
- Creates state parameter with return URL and code verifier
- Builds authorization URL and redirects to OIDC provider

#### 2. Callback Handling (`Callback` function)
- Extracts authorization code and state from URL
- Validates state parameter to prevent CSRF attacks
- Exchanges authorization code for access/refresh tokens
- Retrieves user information from OIDC provider
- Stores user session and redirects to return URL

#### 3. Logout Implementation (`Logout` function)
- Implements secure logout sequence:
  1. Revokes refresh token via `/oauth2/revoke` endpoint
  2. Clears server-side session data
  3. Redirects to Cognito logout endpoint with proper logout_uri

**Key Implementation Files**:
- `app-api/handlers/oidc_auth_handlers_config.go` - Main OIDC authentication handlers
- `app-api/config/oidc_config.go` - OIDC configuration loading
- `app-api/config/oidc-config.json` - OIDC provider configuration

## Database Integration

### Connection Management
**Implementation File**: `app-api/main.go` (in `App` struct and `initDatabase` method)

The database connection is established using:
- **Connection String**: Built from environment variables (DB_USER, DB_PASSWORD, DB_HOST, etc.)
- **PostgreSQL Driver**: Uses `lib/pq` driver for CockroachDB compatibility
- **Connection Testing**: Ping validation on startup
- **Connection Pooling**: Standard Go database/sql connection management

### Query Implementation

**Implementation Files**: Database queries are implemented in handler functions throughout the application

Key query patterns include:
- **Post Retrieval**: `getPosts` function with pagination and filtering
- **User Management**: User creation, retrieval, and authentication
- **Site Management**: Site creation and configuration
- **Parameterized Queries**: All queries use parameterized statements for security

**Migration Management**:
- **Migration Files**: Located in `app-api/migrations/` directory
- **Migration Tool**: Uses goose for PostgreSQL schema management
- **Automatic Execution**: Migrations run on application startup

## Error Handling

### Structured Error Response

**Implementation**: Error handling is implemented throughout handler functions

**Error Structure**:
- **BusinessError**: Contains code, message, details, and error_id
- **Error Response**: Standardized JSON format with success flag, error object, and timestamp
- **Error ID**: Unique identifier for tracking and debugging

### Error Types
- `VALIDATION_ERROR` - Input validation failures
- `AUTHENTICATION_ERROR` - Authentication failures
- `AUTHORIZATION_ERROR` - Authorization failures
- `NOT_FOUND` - Resource not found
- `INTERNAL_ERROR` - Internal server errors
- `EXTERNAL_SERVICE_ERROR` - External service failures

## Logging Implementation

### Structured Logging
**Implementation**: Logging is implemented in the `Logger` struct throughout the application

**Log Structure**:
- **Log ID**: Unique identifier for each log entry
- **Timestamp**: UTC timestamp in RFC3339 format
- **Level**: Log level (INFO, ERROR, DEBUG, etc.)
- **Component**: Application component generating the log
- **Action**: Specific action being performed
- **Message**: Descriptive message
- **Additional Fields**: Context-specific data

**Log Output**: JSON format for structured logging and easy parsing

### Log Levels
- `DEBUG` - Detailed debugging information
- `INFO` - General information about application flow
- `WARNING` - Warning messages for potential issues
- `ERROR` - Error messages for failures

## Security Implementation

### CORS Configuration

**Implementation**: CORS is configured in middleware functions throughout the application

**CORS Settings**:
- **Allowed Origins**: Validated against configured allowed origins
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization, X-User-ID, X-User-Role
- **Credentials**: Allow credentials for authenticated requests

### Input Validation

**Implementation**: Input validation is implemented in handler functions and validation utilities

**Validation Features**:
- **Required Fields**: Validation for required input fields
- **Length Limits**: Maximum length validation for text fields
- **Data Types**: Type validation for different input formats
- **Business Rules**: Custom validation logic for business requirements

## Performance Considerations

### Database Connection Pooling

**Implementation**: Database connection pooling is configured in the `initDatabase` method

**Pool Configuration**:
- **Max Open Connections**: 25 concurrent connections
- **Max Idle Connections**: 5 idle connections maintained
- **Connection Lifetime**: 5-minute maximum connection lifetime
- **Connection Testing**: Ping validation for connection health

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
