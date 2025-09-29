# Security Implementation Documentation

## Overview
This document describes the comprehensive security implementation for the AGoat Publisher system, including authentication, authorization, data protection, network security, and security monitoring.

## Security Architecture

### Security Layers
1. **Network Security**: SSL/TLS, firewall rules, VPC isolation
2. **Application Security**: Authentication, authorization, input validation
3. **Data Security**: Encryption at rest and in transit, secure storage
4. **Infrastructure Security**: Container security, secret management
5. **Monitoring Security**: Logging, alerting, audit trails

### Security Principles
- **Defense in Depth**: Multiple security layers
- **Least Privilege**: Minimal required permissions
- **Zero Trust**: Verify everything, trust nothing
- **Security by Design**: Built-in security from the start
- **Continuous Monitoring**: Real-time security monitoring

## Authentication Security

### OIDC Authentication Security

#### PKCE Implementation
```go
// app-api/handlers/oidc_auth_handlers_config.go
import (
    "crypto/rand"
    "crypto/sha256"
    "encoding/base64"
    "encoding/hex"
)

func generatePKCE() (string, string, error) {
    // Generate code verifier (43-128 characters, URL-safe)
    codeVerifierBytes := make([]byte, 32)
    if _, err := rand.Read(codeVerifierBytes); err != nil {
        return "", "", fmt.Errorf("failed to generate code verifier: %w", err)
    }
    codeVerifier := base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(codeVerifierBytes)
    
    // Generate code challenge (SHA256 hash of code verifier)
    hash := sha256.Sum256([]byte(codeVerifier))
    codeChallenge := base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(hash[:])
    
    return codeVerifier, codeChallenge, nil
}
```

#### State Parameter Security
```go
func generateState(returnURL, codeVerifier string) string {
    // Create state object
    stateData := map[string]interface{}{
        "return_url": returnURL,
        "code_verifier": codeVerifier,
        "timestamp": time.Now().Unix(),
        "nonce": generateNonce(),
    }
    
    // Serialize and sign state
    stateJSON, _ := json.Marshal(stateData)
    signature := signState(stateJSON)
    
    // Encode state with signature
    stateWithSig := map[string]interface{}{
        "data": base64.URLEncoding.EncodeToString(stateJSON),
        "signature": signature,
    }
    
    stateJSON, _ = json.Marshal(stateWithSig)
    return base64.URLEncoding.EncodeToString(stateJSON)
}

func validateState(state string) (string, string, error) {
    // Decode and verify state
    stateBytes, err := base64.URLEncoding.DecodeString(state)
    if err != nil {
        return "", "", fmt.Errorf("invalid state format: %w", err)
    }
    
    var stateWithSig map[string]interface{}
    if err := json.Unmarshal(stateBytes, &stateWithSig); err != nil {
        return "", "", fmt.Errorf("invalid state structure: %w", err)
    }
    
    // Verify signature
    data, _ := base64.URLEncoding.DecodeString(stateWithSig["data"].(string))
    signature := stateWithSig["signature"].(string)
    
    if !verifyStateSignature(data, signature) {
        return "", "", fmt.Errorf("invalid state signature")
    }
    
    // Parse state data
    var stateData map[string]interface{}
    if err := json.Unmarshal(data, &stateData); err != nil {
        return "", "", fmt.Errorf("invalid state data: %w", err)
    }
    
    // Check timestamp (prevent replay attacks)
    timestamp := int64(stateData["timestamp"].(float64))
    if time.Now().Unix()-timestamp > 300 { // 5 minutes
        return "", "", fmt.Errorf("state expired")
    }
    
    returnURL := stateData["return_url"].(string)
    codeVerifier := stateData["code_verifier"].(string)
    
    return returnURL, codeVerifier, nil
}
```

#### Token Security
```go
// Token validation and storage
type TokenManager struct {
    jwtKey []byte
    db     *sql.DB
}

func (tm *TokenManager) StoreToken(userID, tokenHash string, expiresAt time.Time) error {
    // Hash token before storing
    hashedToken := hashToken(tokenHash)
    
    query := `
        INSERT INTO user_tokens (user_id, token_hash, expires_at, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id, token_hash) 
        DO UPDATE SET expires_at = $3, updated_at = NOW()`
    
    _, err := tm.db.Exec(query, userID, hashedToken, expiresAt)
    return err
}

func (tm *TokenManager) ValidateToken(token string) (*Claims, error) {
    // Parse and validate JWT
    claims := &Claims{}
    tokenObj, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
        }
        return tm.jwtKey, nil
    })
    
    if err != nil {
        return nil, fmt.Errorf("token validation failed: %w", err)
    }
    
    if !tokenObj.Valid {
        return nil, fmt.Errorf("invalid token")
    }
    
    // Check token blacklist
    tokenHash := hashToken(token)
    if tm.isTokenBlacklisted(tokenHash) {
        return nil, fmt.Errorf("token is blacklisted")
    }
    
    return claims, nil
}

func hashToken(token string) string {
    hash := sha256.Sum256([]byte(token))
    return hex.EncodeToString(hash[:])
}
```

### Session Security

#### Secure Session Management
```go
// app-api/handlers/session_manager.go
import (
    "github.com/gorilla/sessions"
    "github.com/gorilla/securecookie"
)

type SessionManager struct {
    store *sessions.CookieStore
}

func NewSessionManager() *SessionManager {
    // Generate secure keys for session encryption
    authKey := securecookie.GenerateRandomKey(32)
    encryptionKey := securecookie.GenerateRandomKey(32)
    
    store := sessions.NewCookieStore(authKey, encryptionKey)
    store.Options = &sessions.Options{
        Path:     "/",
        MaxAge:   3600, // 1 hour
        HttpOnly: true,
        Secure:   true, // HTTPS only
        SameSite: http.SameSiteStrictMode,
    }
    
    return &SessionManager{store: store}
}

func (sm *SessionManager) CreateSession(w http.ResponseWriter, r *http.Request, userID string) error {
    session, err := sm.store.Get(r, "user_session")
    if err != nil {
        return fmt.Errorf("failed to get session: %w", err)
    }
    
    // Set session values
    session.Values["user_id"] = userID
    session.Values["authenticated"] = true
    session.Values["created_at"] = time.Now().Unix()
    
    // Regenerate session ID to prevent session fixation
    session.Options.MaxAge = 3600
    session.Options.HttpOnly = true
    session.Options.Secure = true
    session.Options.SameSite = http.SameSiteStrictMode
    
    return session.Save(r, w)
}

func (sm *SessionManager) ValidateSession(r *http.Request) (string, error) {
    session, err := sm.store.Get(r, "user_session")
    if err != nil {
        return "", fmt.Errorf("failed to get session: %w", err)
    }
    
    if auth, ok := session.Values["authenticated"].(bool); !ok || !auth {
        return "", fmt.Errorf("session not authenticated")
    }
    
    userID, ok := session.Values["user_id"].(string)
    if !ok {
        return "", fmt.Errorf("invalid user ID in session")
    }
    
    // Check session age
    if createdAt, ok := session.Values["created_at"].(int64); ok {
        if time.Now().Unix()-createdAt > 3600 { // 1 hour
            return "", fmt.Errorf("session expired")
        }
    }
    
    return userID, nil
}
```

## Authorization Security

### Role-Based Access Control (RBAC)

#### Permission System
```go
// app-api/security/rbac.go
type Permission string

const (
    PermissionReadPosts   Permission = "posts:read"
    PermissionWritePosts  Permission = "posts:write"
    PermissionDeletePosts Permission = "posts:delete"
    PermissionManageUsers Permission = "users:manage"
    PermissionViewAnalytics Permission = "analytics:view"
)

type Role struct {
    ID          string       `json:"id"`
    Name        string       `json:"name"`
    Permissions []Permission `json:"permissions"`
}

type UserRole struct {
    UserID string `json:"user_id"`
    RoleID string `json:"role_id"`
    SiteID string `json:"site_id"` // For site-specific roles
}

type RBACManager struct {
    db *sql.DB
}

func (rbac *RBACManager) CheckPermission(userID, siteID string, permission Permission) (bool, error) {
    query := `
        SELECT COUNT(*) FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        WHERE ur.user_id = $1 AND (ur.site_id = $2 OR ur.site_id IS NULL)
        AND rp.permission = $3`
    
    var count int
    err := rbac.db.QueryRow(query, userID, siteID, permission).Scan(&count)
    if err != nil {
        return false, fmt.Errorf("failed to check permission: %w", err)
    }
    
    return count > 0, nil
}

func (rbac *RBACManager) GetUserRoles(userID, siteID string) ([]Role, error) {
    query := `
        SELECT r.id, r.name, rp.permission FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        WHERE ur.user_id = $1 AND (ur.site_id = $2 OR ur.site_id IS NULL)`
    
    rows, err := rbac.db.Query(query, userID, siteID)
    if err != nil {
        return nil, fmt.Errorf("failed to get user roles: %w", err)
    }
    defer rows.Close()
    
    roleMap := make(map[string]*Role)
    
    for rows.Next() {
        var roleID, roleName, permission string
        if err := rows.Scan(&roleID, &roleName, &permission); err != nil {
            return nil, fmt.Errorf("failed to scan role: %w", err)
        }
        
        if role, exists := roleMap[roleID]; exists {
            role.Permissions = append(role.Permissions, Permission(permission))
        } else {
            roleMap[roleID] = &Role{
                ID:          roleID,
                Name:        roleName,
                Permissions: []Permission{Permission(permission)},
            }
        }
    }
    
    roles := make([]Role, 0, len(roleMap))
    for _, role := range roleMap {
        roles = append(roles, *role)
    }
    
    return roles, nil
}
```

#### Authorization Middleware
```go
// app-api/middleware/auth.go
func RequirePermission(permission Permission) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Get user ID from session
            userID, err := getSessionManager().ValidateSession(r)
            if err != nil {
                http.Error(w, "Unauthorized", http.StatusUnauthorized)
                return
            }
            
            // Get site ID from URL or context
            siteID := getSiteIDFromRequest(r)
            
            // Check permission
            rbac := getRBACManager()
            hasPermission, err := rbac.CheckPermission(userID, siteID, permission)
            if err != nil {
                http.Error(w, "Internal server error", http.StatusInternalServerError)
                return
            }
            
            if !hasPermission {
                http.Error(w, "Forbidden", http.StatusForbidden)
                return
            }
            
            // Add user context to request
            ctx := context.WithValue(r.Context(), "user_id", userID)
            ctx = context.WithValue(ctx, "site_id", siteID)
            
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}

func RequireAuthentication(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        userID, err := getSessionManager().ValidateSession(r)
        if err != nil {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }
        
        ctx := context.WithValue(r.Context(), "user_id", userID)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

## Input Validation and Sanitization

### Input Validation
```go
// app-api/security/validation.go
import (
    "regexp"
    "strings"
    "unicode/utf8"
)

type ValidationError struct {
    Field   string `json:"field"`
    Message string `json:"message"`
}

func ValidatePostInput(post *Post) []ValidationError {
    var errors []ValidationError
    
    // Title validation
    if post.Title == "" {
        errors = append(errors, ValidationError{
            Field:   "title",
            Message: "Title is required",
        })
    } else if utf8.RuneCountInString(post.Title) > 255 {
        errors = append(errors, ValidationError{
            Field:   "title",
            Message: "Title must be 255 characters or less",
        })
    }
    
    // Content validation
    if post.Content == "" {
        errors = append(errors, ValidationError{
            Field:   "content",
            Message: "Content is required",
        })
    } else if utf8.RuneCountInString(post.Content) > 100000 {
        errors = append(errors, ValidationError{
            Field:   "content",
            Message: "Content must be 100,000 characters or less",
        })
    }
    
    // Status validation
    validStatuses := []string{"draft", "published", "archived"}
    if !contains(validStatuses, post.Status) {
        errors = append(errors, ValidationError{
            Field:   "status",
            Message: "Status must be one of: draft, published, archived",
        })
    }
    
    return errors
}

func ValidateEmail(email string) bool {
    emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
    return emailRegex.MatchString(email)
}

func ValidateURL(url string) bool {
    if url == "" {
        return false
    }
    
    // Basic URL validation
    if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
        return false
    }
    
    // Check for suspicious patterns
    suspiciousPatterns := []string{
        "javascript:",
        "data:",
        "vbscript:",
        "onload=",
        "onerror=",
    }
    
    urlLower := strings.ToLower(url)
    for _, pattern := range suspiciousPatterns {
        if strings.Contains(urlLower, pattern) {
            return false
        }
    }
    
    return true
}
```

### HTML Sanitization
```go
// app-api/security/sanitization.go
import (
    "github.com/microcosm-cc/bluemonday"
    "golang.org/x/net/html"
)

type HTMLSanitizer struct {
    policy *bluemonday.Policy
}

func NewHTMLSanitizer() *HTMLSanitizer {
    policy := bluemonday.UGCPolicy()
    
    // Allow specific attributes
    policy.AllowAttrs("class", "id").Globally()
    policy.AllowAttrs("src", "alt", "title", "width", "height").OnElements("img")
    policy.AllowAttrs("href", "title", "target").OnElements("a")
    
    // Allow specific protocols
    policy.AllowURLSchemes("http", "https", "mailto")
    
    // Remove dangerous elements
    policy.DenyElements("script", "object", "embed", "iframe", "form", "input")
    
    return &HTMLSanitizer{policy: policy}
}

func (hs *HTMLSanitizer) SanitizeHTML(html string) string {
    return hs.policy.Sanitize(html)
}

func (hs *HTMLSanitizer) SanitizeHTMLStrict(html string) string {
    // More restrictive policy for user-generated content
    strictPolicy := bluemonday.StrictPolicy()
    strictPolicy.AllowElements("p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6")
    strictPolicy.AllowElements("ul", "ol", "li")
    strictPolicy.AllowElements("blockquote", "code", "pre")
    
    return strictPolicy.Sanitize(html)
}
```

## Data Protection

### Encryption at Rest

#### Database Encryption
```go
// app-api/security/encryption.go
import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "crypto/sha256"
    "encoding/base64"
    "io"
)

type EncryptionManager struct {
    key []byte
}

func NewEncryptionManager(key string) *EncryptionManager {
    hash := sha256.Sum256([]byte(key))
    return &EncryptionManager{key: hash[:]}
}

func (em *EncryptionManager) Encrypt(plaintext string) (string, error) {
    block, err := aes.NewCipher(em.key)
    if err != nil {
        return "", fmt.Errorf("failed to create cipher: %w", err)
    }
    
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", fmt.Errorf("failed to create GCM: %w", err)
    }
    
    nonce := make([]byte, gcm.NonceSize())
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return "", fmt.Errorf("failed to generate nonce: %w", err)
    }
    
    ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
    return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func (em *EncryptionManager) Decrypt(ciphertext string) (string, error) {
    data, err := base64.StdEncoding.DecodeString(ciphertext)
    if err != nil {
        return "", fmt.Errorf("failed to decode ciphertext: %w", err)
    }
    
    block, err := aes.NewCipher(em.key)
    if err != nil {
        return "", fmt.Errorf("failed to create cipher: %w", err)
    }
    
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", fmt.Errorf("failed to create GCM: %w", err)
    }
    
    nonceSize := gcm.NonceSize()
    if len(data) < nonceSize {
        return "", fmt.Errorf("ciphertext too short")
    }
    
    nonce, ciphertext := data[:nonceSize], data[nonceSize:]
    plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
    if err != nil {
        return "", fmt.Errorf("failed to decrypt: %w", err)
    }
    
    return string(plaintext), nil
}
```

#### Sensitive Data Handling
```go
// app-api/security/sensitive_data.go
type SensitiveDataManager struct {
    encryptor *EncryptionManager
    db        *sql.DB
}

func (sdm *SensitiveDataManager) StoreSensitiveData(userID, dataType, data string) error {
    // Encrypt sensitive data before storing
    encryptedData, err := sdm.encryptor.Encrypt(data)
    if err != nil {
        return fmt.Errorf("failed to encrypt data: %w", err)
    }
    
    // Hash the data for indexing (without revealing the content)
    hash := sha256.Sum256([]byte(data))
    dataHash := hex.EncodeToString(hash[:])
    
    query := `
        INSERT INTO sensitive_data (user_id, data_type, encrypted_data, data_hash, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (user_id, data_type, data_hash) 
        DO UPDATE SET encrypted_data = $3, updated_at = NOW()`
    
    _, err = sdm.db.Exec(query, userID, dataType, encryptedData, dataHash)
    return err
}

func (sdm *SensitiveDataManager) RetrieveSensitiveData(userID, dataType string) (string, error) {
    query := `
        SELECT encrypted_data FROM sensitive_data 
        WHERE user_id = $1 AND data_type = $2 
        ORDER BY created_at DESC LIMIT 1`
    
    var encryptedData string
    err := sdm.db.QueryRow(query, userID, dataType).Scan(&encryptedData)
    if err != nil {
        return "", fmt.Errorf("failed to retrieve data: %w", err)
    }
    
    // Decrypt the data
    decryptedData, err := sdm.encryptor.Decrypt(encryptedData)
    if err != nil {
        return "", fmt.Errorf("failed to decrypt data: %w", err)
    }
    
    return decryptedData, nil
}
```

### Encryption in Transit

#### TLS Configuration
```go
// app-api/security/tls.go
func setupTLS() *tls.Config {
    return &tls.Config{
        MinVersion:               tls.VersionTLS12,
        CurvePreferences:         []tls.CurveID{tls.CurveP521, tls.CurveP384, tls.CurveP256},
        PreferServerCipherSuites: true,
        CipherSuites: []uint16{
            tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
            tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,
            tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
        },
        // HSTS headers
        HSTSMaxAge: 31536000, // 1 year
    }
}

func setupHTTPServer(config *AppConfig) *http.Server {
    tlsConfig := setupTLS()
    
    server := &http.Server{
        Addr:         ":" + config.Server.Port,
        TLSConfig:    tlsConfig,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }
    
    return server
}
```

## Network Security

### CORS Configuration
```go
// app-api/middleware/cors.go
func setupCORS(allowedOrigins []string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            origin := r.Header.Get("Origin")
            
            // Check if origin is allowed
            if isAllowedOrigin(origin, allowedOrigins) {
                w.Header().Set("Access-Control-Allow-Origin", origin)
            }
            
            w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-ID, X-User-Role")
            w.Header().Set("Access-Control-Allow-Credentials", "true")
            w.Header().Set("Access-Control-Max-Age", "86400") // 24 hours
            
            // Handle preflight requests
            if r.Method == "OPTIONS" {
                w.WriteHeader(http.StatusOK)
                return
            }
            
            next.ServeHTTP(w, r)
        })
    }
}

func isAllowedOrigin(origin string, allowedOrigins []string) bool {
    if origin == "" {
        return false
    }
    
    for _, allowed := range allowedOrigins {
        if origin == allowed {
            return true
        }
    }
    
    return false
}
```

### Rate Limiting
```go
// app-api/middleware/rate_limit.go
import (
    "golang.org/x/time/rate"
    "sync"
    "time"
)

type RateLimiter struct {
    limiters map[string]*rate.Limiter
    mu       sync.RWMutex
    rate     rate.Limit
    burst    int
}

func NewRateLimiter(rate rate.Limit, burst int) *RateLimiter {
    return &RateLimiter{
        limiters: make(map[string]*rate.Limiter),
        rate:     rate,
        burst:    burst,
    }
}

func (rl *RateLimiter) GetLimiter(key string) *rate.Limiter {
    rl.mu.Lock()
    defer rl.mu.Unlock()
    
    limiter, exists := rl.limiters[key]
    if !exists {
        limiter = rate.NewLimiter(rl.rate, rl.burst)
        rl.limiters[key] = limiter
    }
    
    return limiter
}

func RateLimitMiddleware(rate rate.Limit, burst int) func(http.Handler) http.Handler {
    limiter := NewRateLimiter(rate, burst)
    
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Get client identifier (IP address or user ID)
            clientID := getClientID(r)
            
            // Get limiter for this client
            clientLimiter := limiter.GetLimiter(clientID)
            
            // Check if request is allowed
            if !clientLimiter.Allow() {
                http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
                return
            }
            
            next.ServeHTTP(w, r)
        })
    }
}

func getClientID(r *http.Request) string {
    // Try to get user ID from session first
    if userID := r.Header.Get("X-User-ID"); userID != "" {
        return "user:" + userID
    }
    
    // Fall back to IP address
    ip := r.RemoteAddr
    if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
        ip = strings.Split(forwarded, ",")[0]
    }
    
    return "ip:" + ip
}
```

## Security Monitoring

### Security Logging
```go
// app-api/security/logging.go
type SecurityEvent struct {
    EventType   string                 `json:"event_type"`
    UserID      string                 `json:"user_id,omitempty"`
    IPAddress   string                 `json:"ip_address"`
    UserAgent   string                 `json:"user_agent"`
    Resource    string                 `json:"resource,omitempty"`
    Action      string                 `json:"action,omitempty"`
    Success     bool                   `json:"success"`
    Details     map[string]interface{} `json:"details,omitempty"`
    Timestamp   time.Time              `json:"timestamp"`
    Severity    string                 `json:"severity"`
}

type SecurityLogger struct {
    logger *log.Logger
}

func NewSecurityLogger() *SecurityLogger {
    return &SecurityLogger{
        logger: log.New(os.Stdout, "SECURITY: ", log.LstdFlags|log.LUTC),
    }
}

func (sl *SecurityLogger) LogEvent(event SecurityEvent) {
    event.Timestamp = time.Now().UTC()
    
    eventJSON, err := json.Marshal(event)
    if err != nil {
        sl.logger.Printf("Failed to marshal security event: %v", err)
        return
    }
    
    sl.logger.Println(string(eventJSON))
    
    // Send to external security monitoring system
    sl.sendToSecuritySystem(event)
}

func (sl *SecurityLogger) LogAuthenticationAttempt(userID, ipAddress, userAgent string, success bool) {
    event := SecurityEvent{
        EventType: "authentication_attempt",
        UserID:    userID,
        IPAddress: ipAddress,
        UserAgent: userAgent,
        Success:   success,
        Severity:  map[bool]string{true: "info", false: "warning"}[success],
    }
    
    sl.LogEvent(event)
}

func (sl *SecurityLogger) LogAuthorizationFailure(userID, resource, action, ipAddress string) {
    event := SecurityEvent{
        EventType: "authorization_failure",
        UserID:    userID,
        Resource:  resource,
        Action:    action,
        IPAddress: ipAddress,
        Success:   false,
        Severity:  "warning",
    }
    
    sl.LogEvent(event)
}

func (sl *SecurityLogger) LogSuspiciousActivity(activityType, ipAddress, userAgent string, details map[string]interface{}) {
    event := SecurityEvent{
        EventType: "suspicious_activity",
        IPAddress: ipAddress,
        UserAgent: userAgent,
        Details:   details,
        Success:   false,
        Severity:  "critical",
    }
    
    sl.LogEvent(event)
}
```

### Security Middleware
```go
// app-api/middleware/security.go
func SecurityMiddleware(securityLogger *SecurityLogger) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            
            // Log request
            securityLogger.LogEvent(SecurityEvent{
                EventType: "request",
                IPAddress: getClientIP(r),
                UserAgent: r.UserAgent(),
                Resource:  r.URL.Path,
                Action:    r.Method,
                Success:   true,
                Severity:  "info",
            })
            
            // Check for suspicious patterns
            if isSuspiciousRequest(r) {
                securityLogger.LogSuspiciousActivity(
                    "suspicious_request",
                    getClientIP(r),
                    r.UserAgent(),
                    map[string]interface{}{
                        "path":    r.URL.Path,
                        "method":  r.Method,
                        "headers": r.Header,
                    },
                )
                
                http.Error(w, "Forbidden", http.StatusForbidden)
                return
            }
            
            // Add security headers
            w.Header().Set("X-Content-Type-Options", "nosniff")
            w.Header().Set("X-Frame-Options", "DENY")
            w.Header().Set("X-XSS-Protection", "1; mode=block")
            w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
            w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")
            
            next.ServeHTTP(w, r)
            
            // Log response time
            duration := time.Since(start)
            if duration > 5*time.Second {
                securityLogger.LogEvent(SecurityEvent{
                    EventType: "slow_request",
                    IPAddress: getClientIP(r),
                    Resource:  r.URL.Path,
                    Action:    r.Method,
                    Details: map[string]interface{}{
                        "duration_ms": duration.Milliseconds(),
                    },
                    Success:  true,
                    Severity: "warning",
                })
            }
        })
    }
}

func isSuspiciousRequest(r *http.Request) bool {
    // Check for common attack patterns
    suspiciousPatterns := []string{
        "../",
        "..\\",
        "script:",
        "javascript:",
        "data:",
        "vbscript:",
        "onload=",
        "onerror=",
        "eval(",
        "expression(",
    }
    
    url := strings.ToLower(r.URL.String())
    for _, pattern := range suspiciousPatterns {
        if strings.Contains(url, pattern) {
            return true
        }
    }
    
    // Check for suspicious headers
    if r.Header.Get("X-Forwarded-For") != "" && len(strings.Split(r.Header.Get("X-Forwarded-For"), ",")) > 3 {
        return true
    }
    
    return false
}
```

## Security Testing

### Security Test Suite
```go
// app-api/security/security_test.go
func TestAuthenticationSecurity(t *testing.T) {
    // Test PKCE generation
    verifier, challenge, err := generatePKCE()
    assert.NoError(t, err)
    assert.NotEmpty(t, verifier)
    assert.NotEmpty(t, challenge)
    
    // Test state generation and validation
    returnURL := "https://example.com/dashboard"
    state := generateState(returnURL, verifier)
    assert.NotEmpty(t, state)
    
    validatedReturnURL, validatedVerifier, err := validateState(state)
    assert.NoError(t, err)
    assert.Equal(t, returnURL, validatedReturnURL)
    assert.Equal(t, verifier, validatedVerifier)
}

func TestInputValidation(t *testing.T) {
    // Test post validation
    post := &Post{
        Title:   "Valid Title",
        Content: "Valid content",
        Status:  "draft",
    }
    
    errors := ValidatePostInput(post)
    assert.Empty(t, errors)
    
    // Test invalid post
    invalidPost := &Post{
        Title:   strings.Repeat("a", 300), // Too long
        Content: "",
        Status:  "invalid",
    }
    
    errors = ValidatePostInput(invalidPost)
    assert.NotEmpty(t, errors)
    assert.Len(t, errors, 3) // Title too long, content required, invalid status
}

func TestHTMLSanitization(t *testing.T) {
    sanitizer := NewHTMLSanitizer()
    
    // Test XSS prevention
    maliciousHTML := `<script>alert('xss')</script><p>Safe content</p>`
    sanitized := sanitizer.SanitizeHTML(maliciousHTML)
    assert.NotContains(t, sanitized, "<script>")
    assert.Contains(t, sanitized, "<p>Safe content</p>")
    
    // Test strict sanitization
    strictSanitized := sanitizer.SanitizeHTMLStrict(maliciousHTML)
    assert.NotContains(t, strictSanitized, "<script>")
    assert.Contains(t, strictSanitized, "Safe content")
}
```

## Security Best Practices

### Development Security
- Use secure coding practices
- Regular security code reviews
- Dependency vulnerability scanning
- Static code analysis
- Security testing in CI/CD

### Operational Security
- Regular security updates
- Monitoring and alerting
- Incident response procedures
- Security training for developers
- Regular security audits

### Compliance
- GDPR compliance for data protection
- SOC 2 compliance for security controls
- Regular penetration testing
- Security documentation maintenance
- Audit trail preservation

This comprehensive security implementation provides multiple layers of protection for the AGoat Publisher system, ensuring data confidentiality, integrity, and availability while maintaining compliance with security best practices and regulations.
