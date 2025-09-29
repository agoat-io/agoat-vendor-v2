package handlers

import (
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/oauth2"
)

// OIDCUser represents a user from any OIDC-compliant provider
type OIDCUser struct {
	ID                string                 `json:"id"`
	OIDCSub           string                 `json:"oidc_sub"`
	OIDCIssuer        string                 `json:"oidc_issuer"`
	OIDCAudience      string                 `json:"oidc_audience"`
	Email             string                 `json:"email"`
	EmailVerified     bool                   `json:"email_verified"`
	PhoneNumber       string                 `json:"phone_number"`
	PhoneVerified     bool                   `json:"phone_number_verified"`
	GivenName         string                 `json:"given_name"`
	FamilyName        string                 `json:"family_name"`
	Name              string                 `json:"name"`
	PreferredUsername string                 `json:"preferred_username"`
	Username          string                 `json:"username"`
	Locale            string                 `json:"locale"`
	Timezone          string                 `json:"timezone"`
	AuthMethod        string                 `json:"auth_method"`
	LastLoginAt       time.Time              `json:"last_login_at"`
	CreatedByOIDC     bool                   `json:"created_by_oidc"`
	OIDCCreatedAt     time.Time              `json:"oidc_created_at"`
	OIDCUpdatedAt     time.Time              `json:"oidc_updated_at"`
	ProviderMetadata  map[string]interface{} `json:"provider_metadata"`
	CreatedAt         time.Time              `json:"created_at"`
	UpdatedAt         time.Time              `json:"updated_at"`
}

// OIDCConfig represents OIDC-compliant configuration
type OIDCConfig struct {
	SystemName            string                 `json:"system_name"`
	ProviderType          string                 `json:"provider_type"`
	JWKSURL               string                 `json:"jwks_url"`
	IssuerURL             string                 `json:"issuer_url"`
	OIDCDiscoveryURL      string                 `json:"oidc_discovery_url"`
	AuthorizationEndpoint string                 `json:"authorization_endpoint"`
	TokenEndpoint         string                 `json:"token_endpoint"`
	UserInfoEndpoint      string                 `json:"userinfo_endpoint"`
	EndSessionEndpoint    string                 `json:"end_session_endpoint"`
	ClientID              string                 `json:"client_id"`
	ClientSecret          string                 `json:"client_secret"`
	Scopes                string                 `json:"scopes"`
	ResponseType          string                 `json:"response_type"`
	ResponseMode          string                 `json:"response_mode"`
	CodeChallengeMethod   string                 `json:"code_challenge_method"`
	SupportedClaims       map[string]string      `json:"supported_claims"`
	ProviderMetadata      map[string]interface{} `json:"provider_metadata"`
}

// OIDCAuthHandlers handles OIDC-compliant authentication for any provider
type OIDCAuthHandlers struct {
	db           *sql.DB
	config       *OIDCConfig
	oauth2Config *oauth2.Config
}

// NewOIDCAuthHandlers creates a new OIDCAuthHandlers instance
func NewOIDCAuthHandlers(db *sql.DB, systemName string) (*OIDCAuthHandlers, error) {
	// Load OIDC configuration from database
	config, err := loadOIDCConfig(db, systemName)
	if err != nil {
		return nil, fmt.Errorf("failed to load OIDC config: %w", err)
	}

	oauth2Config := &oauth2.Config{
		ClientID:     config.ClientID,
		ClientSecret: config.ClientSecret,
		RedirectURL:  getRedirectURI(systemName),
		Scopes:       strings.Split(config.Scopes, " "),
		Endpoint: oauth2.Endpoint{
			AuthURL:  config.AuthorizationEndpoint,
			TokenURL: config.TokenEndpoint,
		},
	}

	return &OIDCAuthHandlers{
		db:           db,
		config:       config,
		oauth2Config: oauth2Config,
	}, nil
}

// loadOIDCConfig loads OIDC configuration from database
func loadOIDCConfig(db *sql.DB, systemName string) (*OIDCConfig, error) {
	query := `
		SELECT 
			system_name, provider_type, jwks_url, issuer_url, oidc_discovery_url,
			authorization_endpoint, token_endpoint, userinfo_endpoint, end_session_endpoint,
			client_id, client_secret_encrypted, scopes, response_type, response_mode,
			code_challenge_method, supported_claims, provider_metadata
		FROM ciam_systems 
		WHERE system_name = $1 AND is_active = TRUE
	`

	var config OIDCConfig
	var supportedClaimsJSON, providerMetadataJSON string

	err := db.QueryRow(query, systemName).Scan(
		&config.SystemName, &config.ProviderType, &config.JWKSURL, &config.IssuerURL,
		&config.OIDCDiscoveryURL, &config.AuthorizationEndpoint, &config.TokenEndpoint,
		&config.UserInfoEndpoint, &config.EndSessionEndpoint, &config.ClientID,
		&config.ClientSecret, &config.Scopes, &config.ResponseType, &config.ResponseMode,
		&config.CodeChallengeMethod, &supportedClaimsJSON, &providerMetadataJSON,
	)

	if err != nil {
		return nil, err
	}

	// Parse JSON fields
	if err := json.Unmarshal([]byte(supportedClaimsJSON), &config.SupportedClaims); err != nil {
		return nil, fmt.Errorf("failed to parse supported_claims: %w", err)
	}

	if err := json.Unmarshal([]byte(providerMetadataJSON), &config.ProviderMetadata); err != nil {
		return nil, fmt.Errorf("failed to parse provider_metadata: %w", err)
	}

	return &config, nil
}

// getRedirectURI returns the redirect URI for the given system
func getRedirectURI(systemName string) string {
	baseURL := "https://dev.np-totalvitaminsupply.com"
	return fmt.Sprintf("%s/auth/%s/callback", baseURL, systemName)
}

// validateReturnURL validates return URL to prevent open redirects
func (h *OIDCAuthHandlers) validateReturnURL(returnURL string) bool {
	// Parse the URL
	u, err := url.Parse(returnURL)
	if err != nil {
		log.Printf("Invalid return URL: %v", err)
		return false
	}

	// Define allowed origins
	allowedOrigins := []string{
		"https://dev.np-totalvitaminsupply.com",
		"http://localhost:3000",
		"http://localhost:5173",
	}

	// Check if the origin is allowed
	for _, allowedOrigin := range allowedOrigins {
		if u.Scheme+"://"+u.Host == allowedOrigin || strings.HasPrefix(u.Scheme+"://"+u.Host, allowedOrigin) {
			return true
		}
	}

	// Check for suspicious patterns
	suspiciousPatterns := []string{
		"javascript:",
		"data:",
		"vbscript:",
		"file:",
	}

	for _, pattern := range suspiciousPatterns {
		if strings.HasPrefix(strings.ToLower(returnURL), pattern) {
			log.Printf("Suspicious return URL pattern detected: %s", pattern)
			return false
		}
	}

	log.Printf("Return URL validation failed for: %s", returnURL)
	return false
}

// getDefaultReturnURL returns the default return URL
func (h *OIDCAuthHandlers) getDefaultReturnURL() string {
	return "https://dev.np-totalvitaminsupply.com/dashboard"
}

// Login initiates OIDC authentication with PKCE and return URL preservation
func (h *OIDCAuthHandlers) Login(w http.ResponseWriter, r *http.Request) {
	// Get return URL from query parameter
	returnURL := r.URL.Query().Get("return_url")

	// Validate return URL
	if returnURL == "" {
		returnURL = h.getDefaultReturnURL()
	} else if !h.validateReturnURL(returnURL) {
		log.Printf("Invalid return URL provided: %s, using default", returnURL)
		returnURL = h.getDefaultReturnURL()
	}

	log.Printf("OIDC login initiated for system %s with return URL: %s", h.config.SystemName, returnURL)

	// Generate PKCE parameters
	codeVerifier, codeChallenge, err := generatePKCE()
	if err != nil {
		log.Printf("Error generating PKCE: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Generate state parameter for CSRF protection and return URL preservation
	state := uuid.New().String()

	// Store PKCE, state, and return URL in session data
	stateData := map[string]string{
		"state":         state,
		"return_url":    returnURL,
		"code_verifier": codeVerifier,
		"system_name":   h.config.SystemName,
	}
	stateJSON, _ := json.Marshal(stateData)
	encodedState := base64.URLEncoding.EncodeToString(stateJSON)

	// Build authorization URL with PKCE
	authURL := h.oauth2Config.AuthCodeURL(encodedState,
		oauth2.SetAuthURLParam("code_challenge", codeChallenge),
		oauth2.SetAuthURLParam("code_challenge_method", h.config.CodeChallengeMethod))

	log.Printf("Redirecting to OIDC provider: %s", authURL)
	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}

// Callback handles OIDC authentication callback with return URL processing
func (h *OIDCAuthHandlers) Callback(w http.ResponseWriter, r *http.Request) {
	// Get authorization code and state
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")
	errorParam := r.URL.Query().Get("error")

	if errorParam != "" {
		log.Printf("OIDC authentication error: %s", errorParam)
		http.Error(w, "Authentication failed", http.StatusUnauthorized)
		return
	}

	if code == "" || state == "" {
		log.Printf("Missing code or state parameter")
		http.Error(w, "Invalid callback parameters", http.StatusBadRequest)
		return
	}

	// Decode state parameter
	stateBytes, err := base64.URLEncoding.DecodeString(state)
	if err != nil {
		log.Printf("Error decoding state: %v", err)
		http.Error(w, "Invalid state parameter", http.StatusBadRequest)
		return
	}

	var stateData map[string]string
	if err := json.Unmarshal(stateBytes, &stateData); err != nil {
		log.Printf("Error unmarshaling state: %v", err)
		http.Error(w, "Invalid state parameter", http.StatusBadRequest)
		return
	}

	codeVerifier := stateData["code_verifier"]
	returnURL := stateData["return_url"]
	systemName := stateData["system_name"]

	// Validate return URL again for security
	if !h.validateReturnURL(returnURL) {
		log.Printf("Invalid return URL in state: %s, using default", returnURL)
		returnURL = h.getDefaultReturnURL()
	}

	log.Printf("Processing OIDC callback for system %s with return URL: %s", systemName, returnURL)

	// Exchange authorization code for tokens
	token, err := h.oauth2Config.Exchange(r.Context(), code, oauth2.SetAuthURLParam("code_verifier", codeVerifier))
	if err != nil {
		log.Printf("Error exchanging code for token: %v", err)
		http.Error(w, "Token exchange failed", http.StatusInternalServerError)
		return
	}

	// Extract ID token and user information
	idToken, ok := token.Extra("id_token").(string)
	if !ok {
		log.Printf("No ID token in response")
		http.Error(w, "Invalid token response", http.StatusInternalServerError)
		return
	}

	// Parse ID token to extract user information
	userInfo, err := h.parseIDToken(idToken)
	if err != nil {
		log.Printf("Error parsing ID token: %v", err)
		http.Error(w, "Invalid ID token", http.StatusInternalServerError)
		return
	}

	// Create or update user in database
	userID, err := h.createOrUpdateUser(userInfo)
	if err != nil {
		log.Printf("Error creating/updating user: %v", err)
		http.Error(w, "User management failed", http.StatusInternalServerError)
		return
	}

	// Create OIDC mapping
	err = h.createOIDCMapping(userID, userInfo)
	if err != nil {
		log.Printf("Error creating OIDC mapping: %v", err)
		http.Error(w, "OIDC mapping failed", http.StatusInternalServerError)
		return
	}

	// Store tokens securely (in production, use secure session storage)
	err = h.storeTokens(userID, token)
	if err != nil {
		log.Printf("Error storing tokens: %v", err)
		// Continue without storing tokens for now
	}

	log.Printf("User authenticated successfully: %s, redirecting to: %s", userInfo.Email, returnURL)

	// Redirect back to return URL
	http.Redirect(w, r, returnURL, http.StatusTemporaryRedirect)
}

// RefreshToken refreshes OIDC tokens
func (h *OIDCAuthHandlers) RefreshToken(w http.ResponseWriter, r *http.Request) {
	// Get refresh token from session or request
	// In production, this should come from secure session storage
	refreshToken := r.Header.Get("X-Refresh-Token")
	if refreshToken == "" {
		http.Error(w, "No refresh token provided", http.StatusUnauthorized)
		return
	}

	// Create token source for refresh
	token := &oauth2.Token{
		RefreshToken: refreshToken,
	}
	tokenSource := h.oauth2Config.TokenSource(r.Context(), token)

	// Refresh the token
	newToken, err := tokenSource.Token()
	if err != nil {
		log.Printf("Error refreshing token: %v", err)
		http.Error(w, "Token refresh failed", http.StatusUnauthorized)
		return
	}

	// Return new tokens
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":       true,
		"access_token":  newToken.AccessToken,
		"refresh_token": newToken.RefreshToken,
		"expires_in":    int(newToken.Expiry.Sub(time.Now()).Seconds()),
	})
}

// Logout handles OIDC logout with return URL preservation
func (h *OIDCAuthHandlers) Logout(w http.ResponseWriter, r *http.Request) {
	// Get return URL from query parameter (optional)
	returnURL := r.URL.Query().Get("return_url")

	// Validate return URL if provided
	if returnURL != "" && !h.validateReturnURL(returnURL) {
		log.Printf("Invalid return URL for logout: %s, using default", returnURL)
		returnURL = h.getDefaultReturnURL()
	}

	// If no return URL provided, use default
	if returnURL == "" {
		returnURL = h.getDefaultReturnURL()
	}

	// Build OIDC logout URL
	logoutURL := fmt.Sprintf("%s?client_id=%s&logout_uri=%s",
		h.config.EndSessionEndpoint,
		h.config.ClientID,
		url.QueryEscape(returnURL))

	// Clear session (in production, clear secure session)
	log.Printf("User logged out from system %s, redirecting to: %s", h.config.SystemName, logoutURL)
	http.Redirect(w, r, logoutURL, http.StatusTemporaryRedirect)
}

// parseIDToken parses JWT ID token to extract user information
func (h *OIDCAuthHandlers) parseIDToken(idToken string) (*OIDCUser, error) {
	// In production, you should properly validate the JWT token using the JWKS endpoint
	// For now, we'll do basic parsing (this is not secure for production)
	parts := strings.Split(idToken, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid JWT format")
	}

	// Decode payload (base64url)
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("error decoding JWT payload: %v", err)
	}

	var claims map[string]interface{}
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, fmt.Errorf("error unmarshaling JWT claims: %v", err)
	}

	// Extract user information from claims based on supported claims
	user := &OIDCUser{
		OIDCSub:           getStringClaim(claims, "sub"),
		OIDCIssuer:        getStringClaim(claims, "iss"),
		OIDCAudience:      getStringClaim(claims, "aud"),
		Email:             getStringClaim(claims, "email"),
		EmailVerified:     getBoolClaim(claims, "email_verified"),
		PhoneNumber:       getStringClaim(claims, "phone_number"),
		PhoneVerified:     getBoolClaim(claims, "phone_number_verified"),
		GivenName:         getStringClaim(claims, "given_name"),
		FamilyName:        getStringClaim(claims, "family_name"),
		Name:              getStringClaim(claims, "name"),
		PreferredUsername: getStringClaim(claims, "preferred_username"),
		Username:          getStringClaim(claims, "cognito:username"), // Cognito-specific
		Locale:            getStringClaim(claims, "locale"),
		Timezone:          getStringClaim(claims, "timezone"),
		AuthMethod:        h.config.SystemName,
		LastLoginAt:       time.Now(),
		CreatedByOIDC:     true,
		OIDCCreatedAt:     time.Now(),
		OIDCUpdatedAt:     time.Now(),
		ProviderMetadata:  make(map[string]interface{}),
	}

	// Generate username if not provided
	if user.Username == "" {
		user.Username = user.Email
	}

	// Store provider-specific metadata
	user.ProviderMetadata["system_name"] = h.config.SystemName
	user.ProviderMetadata["provider_type"] = h.config.ProviderType
	user.ProviderMetadata["issuer"] = user.OIDCIssuer

	// Add provider-specific claims to metadata
	for claim, value := range claims {
		if _, exists := h.config.SupportedClaims[claim]; !exists {
			user.ProviderMetadata[claim] = value
		}
	}

	return user, nil
}

// createOrUpdateUser creates or updates a user in the database
func (h *OIDCAuthHandlers) createOrUpdateUser(oidcUser *OIDCUser) (string, error) {
	// Check if user already exists by email
	var existingUserID string
	query := `SELECT id FROM users WHERE email = $1`
	err := h.db.QueryRow(query, oidcUser.Email).Scan(&existingUserID)

	if err == sql.ErrNoRows {
		// Create new user
		userID := uuid.New().String()
		now := time.Now()

		insertQuery := `
			INSERT INTO users (
				id, email, username, auth_method, email_verified, 
				account_enabled, last_login_at, created_at, updated_at,
				oidc_sub, oidc_issuer, oidc_audience, phone_number, phone_number_verified,
				given_name, family_name, name, preferred_username, locale, timezone,
				oidc_created_at, oidc_updated_at, provider_metadata
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
			)
		`

		providerMetadataJSON, _ := json.Marshal(oidcUser.ProviderMetadata)

		_, err = h.db.Exec(insertQuery,
			userID,
			oidcUser.Email,
			oidcUser.Username,
			oidcUser.AuthMethod,
			oidcUser.EmailVerified,
			true, // account_enabled
			oidcUser.LastLoginAt,
			now,
			now,
			oidcUser.OIDCSub,
			oidcUser.OIDCIssuer,
			oidcUser.OIDCAudience,
			oidcUser.PhoneNumber,
			oidcUser.PhoneVerified,
			oidcUser.GivenName,
			oidcUser.FamilyName,
			oidcUser.Name,
			oidcUser.PreferredUsername,
			oidcUser.Locale,
			oidcUser.Timezone,
			oidcUser.OIDCCreatedAt,
			oidcUser.OIDCUpdatedAt,
			providerMetadataJSON,
		)

		if err != nil {
			return "", err
		}

		oidcUser.ID = userID
		return userID, nil
	} else if err != nil {
		return "", err
	} else {
		// Update existing user
		oidcUser.ID = existingUserID
		now := time.Now()

		updateQuery := `
			UPDATE users SET
				username = $1,
				email_verified = $2,
				last_login_at = $3,
				updated_at = $4,
				oidc_sub = $5,
				oidc_issuer = $6,
				oidc_audience = $7,
				phone_number = $8,
				phone_number_verified = $9,
				given_name = $10,
				family_name = $11,
				name = $12,
				preferred_username = $13,
				locale = $14,
				timezone = $15,
				oidc_updated_at = $16,
				provider_metadata = $17
			WHERE id = $18
		`

		providerMetadataJSON, _ := json.Marshal(oidcUser.ProviderMetadata)

		_, err = h.db.Exec(updateQuery,
			oidcUser.Username,
			oidcUser.EmailVerified,
			oidcUser.LastLoginAt,
			now,
			oidcUser.OIDCSub,
			oidcUser.OIDCIssuer,
			oidcUser.OIDCAudience,
			oidcUser.PhoneNumber,
			oidcUser.PhoneVerified,
			oidcUser.GivenName,
			oidcUser.FamilyName,
			oidcUser.Name,
			oidcUser.PreferredUsername,
			oidcUser.Locale,
			oidcUser.Timezone,
			oidcUser.OIDCUpdatedAt,
			providerMetadataJSON,
			existingUserID,
		)

		if err != nil {
			return "", err
		}

		return existingUserID, nil
	}
}

// createOIDCMapping creates an OIDC mapping for the user
func (h *OIDCAuthHandlers) createOIDCMapping(userID string, oidcUser *OIDCUser) error {
	// Get provider identifier from metadata
	providerIdentifier := ""
	if userPoolID, exists := oidcUser.ProviderMetadata["user_pool_id"]; exists {
		providerIdentifier = fmt.Sprintf("%v", userPoolID)
	} else if tenantID, exists := oidcUser.ProviderMetadata["tenant_id"]; exists {
		providerIdentifier = fmt.Sprintf("%v", tenantID)
	}

	// Use the upsert function from the database
	query := `SELECT upsert_oidc_user_mapping($1, $2, $3, $4, $5)`
	_, err := h.db.Exec(query, userID, h.config.SystemName, oidcUser.OIDCSub, providerIdentifier, oidcUser.ProviderMetadata)
	return err
}

// storeTokens stores OIDC tokens securely
func (h *OIDCAuthHandlers) storeTokens(userID string, token *oauth2.Token) error {
	// Get CIAM system ID
	var ciamSystemID string
	query := `SELECT id FROM ciam_systems WHERE system_name = $1 AND is_active = TRUE`
	err := h.db.QueryRow(query, h.config.SystemName).Scan(&ciamSystemID)
	if err != nil {
		return err
	}

	// Hash tokens for security
	accessTokenHash := hashToken(token.AccessToken)
	refreshTokenHash := hashToken(token.RefreshToken)

	// Store access token
	accessTokenMetadata := map[string]interface{}{
		"expires_at": token.Expiry,
		"scope":      token.Extra("scope"),
	}
	accessTokenMetadataJSON, _ := json.Marshal(accessTokenMetadata)

	_, err = h.db.Exec(`
		INSERT INTO oidc_tokens (user_id, ciam_system_id, token_type, token_hash, token_metadata, expires_at)
		VALUES ($1, $2, 'access', $3, $4, $5)
		ON CONFLICT (user_id, ciam_system_id, token_type) 
		DO UPDATE SET token_hash = EXCLUDED.token_hash, token_metadata = EXCLUDED.token_metadata, expires_at = EXCLUDED.expires_at, updated_at = NOW()
	`, userID, ciamSystemID, accessTokenHash, accessTokenMetadataJSON, token.Expiry)

	if err != nil {
		return err
	}

	// Store refresh token (if available)
	if token.RefreshToken != "" {
		refreshTokenMetadata := map[string]interface{}{
			"scope": token.Extra("scope"),
		}
		refreshTokenMetadataJSON, _ := json.Marshal(refreshTokenMetadata)

		_, err = h.db.Exec(`
			INSERT INTO oidc_tokens (user_id, ciam_system_id, token_type, token_hash, token_metadata)
			VALUES ($1, $2, 'refresh', $3, $4)
			ON CONFLICT (user_id, ciam_system_id, token_type) 
			DO UPDATE SET token_hash = EXCLUDED.token_hash, token_metadata = EXCLUDED.token_metadata, updated_at = NOW()
		`, userID, ciamSystemID, refreshTokenHash, refreshTokenMetadataJSON)

		if err != nil {
			return err
		}
	}

	return nil
}

// GetOIDCConfig returns the OIDC configuration
func (h *OIDCAuthHandlers) GetOIDCConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"config":  h.config,
	})
}
