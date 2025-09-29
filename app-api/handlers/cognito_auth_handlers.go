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

// CognitoUser represents a user from AWS Cognito
type CognitoUser struct {
	ID                string    `json:"id"`
	CognitoSub        string    `json:"cognito_sub"`
	CognitoUserPoolID string    `json:"cognito_user_pool_id"`
	Email             string    `json:"email"`
	EmailVerified     bool      `json:"email_verified"`
	PhoneNumber       string    `json:"phone_number"`
	PhoneVerified     bool      `json:"phone_number_verified"`
	GivenName         string    `json:"given_name"`
	FamilyName        string    `json:"family_name"`
	Name              string    `json:"name"`
	PreferredUsername string    `json:"preferred_username"`
	Username          string    `json:"username"`
	AuthMethod        string    `json:"auth_method"`
	LastLoginAt       time.Time `json:"last_login_at"`
	CreatedByCognito  bool      `json:"created_by_cognito"`
	CognitoCreatedAt  time.Time `json:"cognito_created_at"`
	CognitoUpdatedAt  time.Time `json:"cognito_updated_at"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// CognitoConfig represents Cognito configuration
type CognitoConfig struct {
	UserPoolID   string `json:"user_pool_id"`
	ClientID     string `json:"client_id"`
	ClientSecret string `json:"client_secret"`
	Region       string `json:"region"`
	Domain       string `json:"domain"`
	JWKSURL      string `json:"jwks_url"`
	IssuerURL    string `json:"issuer_url"`
	AuthURL      string `json:"auth_url"`
	TokenURL     string `json:"token_url"`
	RedirectURI  string `json:"redirect_uri"`
	Scope        string `json:"scope"`
	ResponseType string `json:"response_type"`
}

// CognitoAuthHandlers handles AWS Cognito authentication
type CognitoAuthHandlers struct {
	db           *sql.DB
	config       *CognitoConfig
	oauth2Config *oauth2.Config
}

// NewCognitoAuthHandlers creates a new CognitoAuthHandlers instance
func NewCognitoAuthHandlers(db *sql.DB, config *CognitoConfig) *CognitoAuthHandlers {
	oauth2Config := &oauth2.Config{
		ClientID:     config.ClientID,
		ClientSecret: config.ClientSecret,
		RedirectURL:  config.RedirectURI,
		Scopes:       strings.Split(config.Scope, " "),
		Endpoint: oauth2.Endpoint{
			AuthURL:  config.AuthURL,
			TokenURL: config.TokenURL,
		},
	}

	return &CognitoAuthHandlers{
		db:           db,
		config:       config,
		oauth2Config: oauth2Config,
	}
}

// validateReturnURL validates return URL to prevent open redirects
func (h *CognitoAuthHandlers) validateReturnURL(returnURL string) bool {
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
func (h *CognitoAuthHandlers) getDefaultReturnURL() string {
	return "https://dev.np-totalvitaminsupply.com/dashboard"
}

// Login initiates Cognito authentication with PKCE and return URL preservation
func (h *CognitoAuthHandlers) Login(w http.ResponseWriter, r *http.Request) {
	// Get return URL from query parameter
	returnURL := r.URL.Query().Get("return_url")

	// Validate return URL
	if returnURL == "" {
		returnURL = h.getDefaultReturnURL()
	} else if !h.validateReturnURL(returnURL) {
		log.Printf("Invalid return URL provided: %s, using default", returnURL)
		returnURL = h.getDefaultReturnURL()
	}

	log.Printf("Cognito login initiated with return URL: %s", returnURL)

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
	}
	stateJSON, _ := json.Marshal(stateData)
	encodedState := base64.URLEncoding.EncodeToString(stateJSON)

	// Build authorization URL with PKCE
	authURL := h.oauth2Config.AuthCodeURL(encodedState,
		oauth2.SetAuthURLParam("code_challenge", codeChallenge),
		oauth2.SetAuthURLParam("code_challenge_method", "S256"))

	log.Printf("Redirecting to Cognito: %s", authURL)
	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}

// Callback handles Cognito authentication callback with return URL processing
func (h *CognitoAuthHandlers) Callback(w http.ResponseWriter, r *http.Request) {
	// Get authorization code and state
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")
	errorParam := r.URL.Query().Get("error")

	if errorParam != "" {
		log.Printf("Cognito authentication error: %s", errorParam)
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

	// Validate return URL again for security
	if !h.validateReturnURL(returnURL) {
		log.Printf("Invalid return URL in state: %s, using default", returnURL)
		returnURL = h.getDefaultReturnURL()
	}

	log.Printf("Processing Cognito callback with return URL: %s", returnURL)

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

	// Create CIAM mapping
	err = h.createCIAMMapping(userID, userInfo)
	if err != nil {
		log.Printf("Error creating CIAM mapping: %v", err)
		http.Error(w, "CIAM mapping failed", http.StatusInternalServerError)
		return
	}

	// Store tokens in session (in production, use secure session storage)
	// For now, we'll redirect with success
	log.Printf("User authenticated successfully: %s, redirecting to: %s", userInfo.Email, returnURL)

	// Redirect back to return URL
	http.Redirect(w, r, returnURL, http.StatusTemporaryRedirect)
}

// RefreshToken refreshes Cognito tokens
func (h *CognitoAuthHandlers) RefreshToken(w http.ResponseWriter, r *http.Request) {
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

// Logout handles Cognito logout with return URL preservation
func (h *CognitoAuthHandlers) Logout(w http.ResponseWriter, r *http.Request) {
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

	// Build Cognito logout URL
	logoutURL := fmt.Sprintf("https://%s/logout?client_id=%s&logout_uri=%s",
		h.config.Domain,
		h.config.ClientID,
		url.QueryEscape(returnURL))

	// Clear session (in production, clear secure session)
	log.Printf("User logged out, redirecting to: %s", logoutURL)
	http.Redirect(w, r, logoutURL, http.StatusTemporaryRedirect)
}

// parseIDToken parses JWT ID token to extract user information
func (h *CognitoAuthHandlers) parseIDToken(idToken string) (*CognitoUser, error) {
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

	// Extract user information from claims
	user := &CognitoUser{
		CognitoSub:        getStringClaim(claims, "sub"),
		CognitoUserPoolID: h.config.UserPoolID,
		Email:             getStringClaim(claims, "email"),
		EmailVerified:     getBoolClaim(claims, "email_verified"),
		PhoneNumber:       getStringClaim(claims, "phone_number"),
		PhoneVerified:     getBoolClaim(claims, "phone_number_verified"),
		GivenName:         getStringClaim(claims, "given_name"),
		FamilyName:        getStringClaim(claims, "family_name"),
		Name:              getStringClaim(claims, "name"),
		PreferredUsername: getStringClaim(claims, "preferred_username"),
		Username:          getStringClaim(claims, "cognito:username"),
		AuthMethod:        "cognito",
		LastLoginAt:       time.Now(),
		CreatedByCognito:  true,
		CognitoCreatedAt:  time.Now(),
		CognitoUpdatedAt:  time.Now(),
	}

	// Generate username if not provided
	if user.Username == "" {
		user.Username = user.Email
	}

	return user, nil
}

// createOrUpdateUser creates or updates a user in the database
func (h *CognitoAuthHandlers) createOrUpdateUser(cognitoUser *CognitoUser) (string, error) {
	// Check if user already exists by email
	var existingUserID string
	query := `SELECT id FROM users WHERE email = $1`
	err := h.db.QueryRow(query, cognitoUser.Email).Scan(&existingUserID)

	if err == sql.ErrNoRows {
		// Create new user
		userID := uuid.New().String()
		now := time.Now()

		insertQuery := `
			INSERT INTO users (
				id, email, username, auth_method, email_verified, 
				account_enabled, last_login_at, created_at, updated_at,
				cognito_sub, cognito_user_pool_id, phone_number, phone_number_verified,
				given_name, family_name, name, preferred_username,
				cognito_created_at, cognito_updated_at
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
			)
		`

		_, err = h.db.Exec(insertQuery,
			userID,
			cognitoUser.Email,
			cognitoUser.Username,
			cognitoUser.AuthMethod,
			cognitoUser.EmailVerified,
			true, // account_enabled
			cognitoUser.LastLoginAt,
			now,
			now,
			cognitoUser.CognitoSub,
			cognitoUser.CognitoUserPoolID,
			cognitoUser.PhoneNumber,
			cognitoUser.PhoneVerified,
			cognitoUser.GivenName,
			cognitoUser.FamilyName,
			cognitoUser.Name,
			cognitoUser.PreferredUsername,
			cognitoUser.CognitoCreatedAt,
			cognitoUser.CognitoUpdatedAt,
		)

		if err != nil {
			return "", err
		}

		cognitoUser.ID = userID
		return userID, nil
	} else if err != nil {
		return "", err
	} else {
		// Update existing user
		cognitoUser.ID = existingUserID
		now := time.Now()

		updateQuery := `
			UPDATE users SET
				username = $1,
				email_verified = $2,
				last_login_at = $3,
				updated_at = $4,
				cognito_sub = $5,
				cognito_user_pool_id = $6,
				phone_number = $7,
				phone_number_verified = $8,
				given_name = $9,
				family_name = $10,
				name = $11,
				preferred_username = $12,
				cognito_updated_at = $13
			WHERE id = $14
		`

		_, err = h.db.Exec(updateQuery,
			cognitoUser.Username,
			cognitoUser.EmailVerified,
			cognitoUser.LastLoginAt,
			now,
			cognitoUser.CognitoSub,
			cognitoUser.CognitoUserPoolID,
			cognitoUser.PhoneNumber,
			cognitoUser.PhoneVerified,
			cognitoUser.GivenName,
			cognitoUser.FamilyName,
			cognitoUser.Name,
			cognitoUser.PreferredUsername,
			cognitoUser.CognitoUpdatedAt,
			existingUserID,
		)

		if err != nil {
			return "", err
		}

		return existingUserID, nil
	}
}

// createCIAMMapping creates a CIAM mapping for the user
func (h *CognitoAuthHandlers) createCIAMMapping(userID string, cognitoUser *CognitoUser) error {
	// Check if mapping already exists
	var existingMappingID string
	query := `SELECT id FROM user_ciam_mappings WHERE app_user_id = $1 AND ciam_identifier = $2 AND ciam_system = 'cognito'`
	err := h.db.QueryRow(query, userID, cognitoUser.CognitoSub).Scan(&existingMappingID)

	if err == sql.ErrNoRows {
		// Create new mapping
		now := time.Now()
		insertQuery := `
			INSERT INTO user_ciam_mappings (
				app_user_id, ciam_identifier, ciam_system, ciam_user_pool_id,
				is_current_ciam, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7)
		`

		_, err = h.db.Exec(insertQuery,
			userID,
			cognitoUser.CognitoSub,
			"cognito",
			cognitoUser.CognitoUserPoolID,
			true, // is_current_ciam
			now,
			now,
		)

		return err
	} else if err != nil {
		return err
	} else {
		// Update existing mapping
		now := time.Now()
		updateQuery := `
			UPDATE user_ciam_mappings SET
				is_current_ciam = true,
				updated_at = $1
			WHERE id = $2
		`

		_, err = h.db.Exec(updateQuery, now, existingMappingID)
		return err
	}
}

// GetCognitoConfig returns the Cognito configuration
func (h *CognitoAuthHandlers) GetCognitoConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"config":  h.config,
	})
}
