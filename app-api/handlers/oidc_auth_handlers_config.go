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

	"agoat.io/agoat-publisher/config"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
)

// OIDCUserConfig represents a user from any OIDC-compliant provider (config version)
type OIDCUserConfig struct {
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

// OIDCAuthHandlersConfig handles OIDC-compliant authentication using config file
type OIDCAuthHandlersConfig struct {
	db           *sql.DB
	config       *config.OIDCConfig
	appConfig    *config.AppConfig
	oauth2Config *oauth2.Config
}

// NewOIDCAuthHandlersConfig creates a new OIDCAuthHandlersConfig instance using config file
func NewOIDCAuthHandlersConfig(db *sql.DB, configPath string) (*OIDCAuthHandlersConfig, error) {
	// Load OIDC configuration from config file
	configs, err := config.LoadOIDCConfig(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to load OIDC config: %w", err)
	}

	// Load app configuration
	appConfig, err := config.LoadAppConfig("")
	if err != nil {
		return nil, fmt.Errorf("failed to load app config: %w", err)
	}

	// Get the default OIDC configuration
	oidcConfig, err := configs.GetDefaultOIDCConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to get default OIDC config: %w", err)
	}

	oauth2Config := &oauth2.Config{
		ClientID:     oidcConfig.ClientID,
		ClientSecret: oidcConfig.ClientSecret,
		RedirectURL:  oidcConfig.RedirectURI,
		Scopes:       strings.Split(oidcConfig.Scopes, " "),
		Endpoint: oauth2.Endpoint{
			AuthURL:  oidcConfig.AuthorizationEndpoint,
			TokenURL: oidcConfig.TokenEndpoint,
		},
	}

	return &OIDCAuthHandlersConfig{
		db:           db,
		config:       oidcConfig,
		appConfig:    appConfig,
		oauth2Config: oauth2Config,
	}, nil
}

// validateReturnURL validates return URL to prevent open redirects
func (h *OIDCAuthHandlersConfig) validateReturnURL(returnURL string) bool {
	// Parse the URL
	u, err := url.Parse(returnURL)
	if err != nil {
		log.Printf("Invalid return URL: %v", err)
		return false
	}

	// Use allowed origins from configuration
	allowedOrigins := h.appConfig.AllowedOrigins

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
func (h *OIDCAuthHandlersConfig) getDefaultReturnURL() string {
	return h.appConfig.DefaultReturnURL
}

// Login initiates OIDC authentication with PKCE and return URL preservation
func (h *OIDCAuthHandlersConfig) Login(w http.ResponseWriter, r *http.Request) {
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
func (h *OIDCAuthHandlersConfig) Callback(w http.ResponseWriter, r *http.Request) {
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
func (h *OIDCAuthHandlersConfig) RefreshToken(w http.ResponseWriter, r *http.Request) {
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
		"expires_in":    int(time.Until(newToken.Expiry).Seconds()),
	})
}

// Logout handles OIDC logout following the correct sequence:
// 1. Revoke refresh token via /oauth2/revoke
// 2. Clear all tokens and session data
// 3. Redirect to Cognito /logout endpoint
func (h *OIDCAuthHandlersConfig) Logout(w http.ResponseWriter, r *http.Request) {
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

	// Get tokens from request (in production, these would come from session/cookies)
	refreshToken := r.URL.Query().Get("refresh_token")

	// Step 1: Revoke the refresh token by calling the Cognito /oauth2/revoke endpoint
	if refreshToken != "" {
		err := h.revokeTokenInternal(refreshToken)
		if err != nil {
			log.Printf("Failed to revoke refresh token: %v", err)
		} else {
			log.Printf("Refresh token revoked successfully")
		}
	}

	// Step 2: Clear all tokens and session data from your app
	// (In production, this would clear server-side session data)
	log.Printf("Clearing session data for user")

	// Step 3: Redirect the user to the Cognito /logout endpoint
	// Build the logout callback URL that Cognito will redirect to after logout
	logoutCallbackURL := fmt.Sprintf("%s/auth/signout",
		h.appConfig.App.BaseURL)

	// Use the end_session_endpoint from configuration with logout_uri
	logoutURL := fmt.Sprintf("%s?client_id=%s&logout_uri=%s",
		h.config.EndSessionEndpoint,
		h.config.ClientID,
		url.QueryEscape(logoutCallbackURL))

	log.Printf("User logout initiated for system %s, redirecting to Cognito: %s", h.config.SystemName, logoutURL)

	// Redirect to Cognito logout endpoint
	http.Redirect(w, r, logoutURL, http.StatusTemporaryRedirect)
}

// parseIDToken parses JWT ID token to extract user information
func (h *OIDCAuthHandlersConfig) parseIDToken(idToken string) (*OIDCUserConfig, error) {
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
	user := &OIDCUserConfig{
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
func (h *OIDCAuthHandlersConfig) createOrUpdateUser(oidcUser *OIDCUserConfig) (string, error) {
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
func (h *OIDCAuthHandlersConfig) createOIDCMapping(userID string, oidcUser *OIDCUserConfig) error {
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
func (h *OIDCAuthHandlersConfig) storeTokens(userID string, token *oauth2.Token) error {
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
func (h *OIDCAuthHandlersConfig) GetOIDCConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"config":  h.config,
	})
}

// GetUserInfo returns the current user information
func (h *OIDCAuthHandlersConfig) GetUserInfo(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// For now, return a placeholder response
	// In a real implementation, you would:
	// 1. Get the user ID from the session or JWT token
	// 2. Query the database for user information
	// 3. Return the user data

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"user": map[string]interface{}{
			"id":              "placeholder-user-id",
			"email":           "user@example.com",
			"username":        "testuser",
			"auth_method":     "oidc",
			"email_verified":  true,
			"created_by_oidc": true,
		},
	})
}

// LogoutCallback handles the logout callback from Cognito
// This is called after Cognito clears its session cookie and redirects back to our app
func (h *OIDCAuthHandlersConfig) LogoutCallback(w http.ResponseWriter, r *http.Request) {
	// Get return URL from query parameter
	returnURL := r.URL.Query().Get("return_url")

	// Validate return URL if provided
	if returnURL == "" {
		returnURL = h.getDefaultReturnURL()
	} else if !h.validateReturnURL(returnURL) {
		log.Printf("Invalid return URL for logout callback: %s, using default", returnURL)
		returnURL = h.getDefaultReturnURL()
	}

	// Cognito has already cleared its session cookie and redirected back to us
	// We just need to redirect the user to their final destination
	log.Printf("Logout callback received from Cognito for system %s, redirecting to: %s", h.config.SystemName, returnURL)

	// Redirect to the return URL
	http.Redirect(w, r, returnURL, http.StatusTemporaryRedirect)
}

// revokeTokenInternal is a helper function to revoke a token
func (h *OIDCAuthHandlersConfig) revokeTokenInternal(token string) error {
	// Use the custom Cognito domain directly for revoke endpoint
	cognitoDomain := h.config.ProviderDomain

	revokeURL := fmt.Sprintf("https://%s/oauth2/revoke", cognitoDomain)

	// Prepare the request data
	data := url.Values{}
	data.Set("token", token)
	data.Set("client_id", h.config.ClientID)

	// Make the revoke request
	req, err := http.NewRequest("POST", revokeURL, strings.NewReader(data.Encode()))
	if err != nil {
		return fmt.Errorf("error creating revoke request: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("error making revoke request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("token revocation failed with status: %d", resp.StatusCode)
	}

	return nil
}

// RevokeToken revokes a token using Cognito's revoke endpoint
func (h *OIDCAuthHandlersConfig) RevokeToken(w http.ResponseWriter, r *http.Request) {
	// Parse form data to get token from request body
	err := r.ParseForm()
	if err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	// Get token from form data
	token := r.FormValue("token")
	if token == "" {
		// Fallback to query parameter
		token = r.URL.Query().Get("token")
	}
	if token == "" {
		// Fallback to Authorization header
		token = r.Header.Get("Authorization")
		if strings.HasPrefix(token, "Bearer ") {
			token = strings.TrimPrefix(token, "Bearer ")
		}
	}

	if token == "" {
		http.Error(w, "No token provided", http.StatusBadRequest)
		return
	}

	// Use the custom Cognito domain directly for revoke endpoint
	cognitoDomain := h.config.ProviderDomain

	revokeURL := fmt.Sprintf("https://%s/oauth2/revoke", cognitoDomain)

	// Prepare the request data
	data := url.Values{}
	data.Set("token", token)
	data.Set("client_id", h.config.ClientID)

	// Make the revoke request
	req, err := http.NewRequest("POST", revokeURL, strings.NewReader(data.Encode()))
	if err != nil {
		log.Printf("Error creating revoke request: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error making revoke request: %v", err)
		http.Error(w, "Token revocation failed", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		log.Printf("Token revoked successfully")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": "Token revoked successfully",
		})
	} else {
		log.Printf("Token revocation failed with status: %d", resp.StatusCode)
		http.Error(w, "Token revocation failed", http.StatusInternalServerError)
	}
}
