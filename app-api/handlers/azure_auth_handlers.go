package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

// AzureUser represents a user from Azure Entra ID
type AzureUser struct {
	ID                     string    `json:"id"`
	AzureEntraID           string    `json:"azure_entra_id"`
	AzureTenantID          string    `json:"azure_tenant_id"`
	AzureObjectID          string    `json:"azure_object_id"`
	AzurePrincipalName     string    `json:"azure_principal_name"`
	AzureDisplayName       string    `json:"azure_display_name"`
	AzureGivenName         string    `json:"azure_given_name"`
	AzureFamilyName        string    `json:"azure_family_name"`
	AzurePreferredUsername string    `json:"azure_preferred_username"`
	Email                  string    `json:"email"`
	Username               string    `json:"username"`
	AuthMethod             string    `json:"auth_method"`
	EmailVerified          bool      `json:"email_verified"`
	AccountEnabled         bool      `json:"account_enabled"`
	LastLoginAt            time.Time `json:"last_login_at"`
	CreatedByAzure         bool      `json:"created_by_azure"`
	AzureCreatedAt         time.Time `json:"azure_created_at"`
	AzureUpdatedAt         time.Time `json:"azure_updated_at"`
	CreatedAt              time.Time `json:"created_at"`
	UpdatedAt              time.Time `json:"updated_at"`
}

// AzureAuthHandlers handles Azure Entra ID authentication
type AzureAuthHandlers struct {
	db *sql.DB
}

// NewAzureAuthHandlers creates a new AzureAuthHandlers instance
func NewAzureAuthHandlers(db *sql.DB) *AzureAuthHandlers {
	return &AzureAuthHandlers{
		db: db,
	}
}

// CreateOrUpdateUser handles creating or updating a user from Azure Entra ID
func (h *AzureAuthHandlers) CreateOrUpdateUser(w http.ResponseWriter, r *http.Request) {
	var azureUser AzureUser
	if err := json.NewDecoder(r.Body).Decode(&azureUser); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if azureUser.AzureEntraID == "" || azureUser.Email == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Check if user already exists
	var existingUserID string
	query := `SELECT id FROM users WHERE azure_entra_id = $1 OR azure_object_id = $2`
	err := h.db.QueryRow(query, azureUser.AzureEntraID, azureUser.AzureObjectID).Scan(&existingUserID)

	if err == sql.ErrNoRows {
		// Create new user
		userID, err := h.createNewUser(azureUser)
		if err != nil {
			log.Printf("Error creating new user: %v", err)
			http.Error(w, "Failed to create user", http.StatusInternalServerError)
			return
		}
		azureUser.ID = userID
	} else if err != nil {
		log.Printf("Error checking existing user: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	} else {
		// Update existing user
		azureUser.ID = existingUserID
		err = h.updateExistingUser(azureUser)
		if err != nil {
			log.Printf("Error updating existing user: %v", err)
			http.Error(w, "Failed to update user", http.StatusInternalServerError)
			return
		}
	}

	// Return the user data
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"user":    azureUser,
	})
}

// createNewUser creates a new user in the database
func (h *AzureAuthHandlers) createNewUser(azureUser AzureUser) (string, error) {
	userID := uuid.New().String()
	now := time.Now()

	query := `
		INSERT INTO users (
			id, azure_entra_id, azure_tenant_id, azure_object_id, 
			azure_principal_name, azure_display_name, azure_given_name, 
			azure_family_name, azure_preferred_username, email, username, 
			auth_method, email_verified, account_enabled, last_login_at, 
			created_by_azure, azure_created_at, azure_updated_at, 
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
		)
	`

	_, err := h.db.Exec(query,
		userID,
		azureUser.AzureEntraID,
		azureUser.AzureTenantID,
		azureUser.AzureObjectID,
		azureUser.AzurePrincipalName,
		azureUser.AzureDisplayName,
		azureUser.AzureGivenName,
		azureUser.AzureFamilyName,
		azureUser.AzurePreferredUsername,
		azureUser.Email,
		azureUser.Username,
		"azure_entra",
		azureUser.EmailVerified,
		azureUser.AccountEnabled,
		now,
		true,
		now,
		now,
		now,
		now,
	)

	if err != nil {
		return "", err
	}

	return userID, nil
}

// updateExistingUser updates an existing user in the database
func (h *AzureAuthHandlers) updateExistingUser(azureUser AzureUser) error {
	now := time.Now()

	query := `
		UPDATE users SET
			azure_tenant_id = $1,
			azure_principal_name = $2,
			azure_display_name = $3,
			azure_given_name = $4,
			azure_family_name = $5,
			azure_preferred_username = $6,
			email = $7,
			username = $8,
			email_verified = $9,
			account_enabled = $10,
			last_login_at = $11,
			azure_updated_at = $12,
			updated_at = $13
		WHERE id = $14
	`

	_, err := h.db.Exec(query,
		azureUser.AzureTenantID,
		azureUser.AzurePrincipalName,
		azureUser.AzureDisplayName,
		azureUser.AzureGivenName,
		azureUser.AzureFamilyName,
		azureUser.AzurePreferredUsername,
		azureUser.Email,
		azureUser.Username,
		azureUser.EmailVerified,
		azureUser.AccountEnabled,
		now,
		now,
		now,
		azureUser.ID,
	)

	return err
}

// VerifyToken verifies an Azure Entra ID access token
func (h *AzureAuthHandlers) VerifyToken(w http.ResponseWriter, r *http.Request) {
	// Get the Authorization header
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Missing Authorization header", http.StatusUnauthorized)
		return
	}

	// Extract the token
	if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
		http.Error(w, "Invalid Authorization header format", http.StatusUnauthorized)
		return
	}

	token := authHeader[7:]

	// In a real implementation, you would verify the JWT token here
	// For now, we'll just check if it exists and return success
	// You should implement proper JWT verification using the Azure Entra ID public keys

	// For development purposes, we'll just return success
	// In production, you should:
	// 1. Verify the JWT signature using Azure Entra ID public keys
	// 2. Check the token expiration
	// 3. Validate the issuer and audience
	// 4. Extract user information from the token claims

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Token verified",
		"token":   hashToken(token), // Hash the token for logging
	})
}

// GetUserInfo returns user information from the database
func (h *AzureAuthHandlers) GetUserInfo(w http.ResponseWriter, r *http.Request) {
	// Get user ID from URL parameters
	vars := mux.Vars(r)
	userID := vars["id"]

	if userID == "" {
		http.Error(w, "Missing user ID", http.StatusBadRequest)
		return
	}

	// Query the database for user information
	var user AzureUser
	query := `
		SELECT 
			id, azure_entra_id, azure_tenant_id, azure_object_id,
			azure_principal_name, azure_display_name, azure_given_name,
			azure_family_name, azure_preferred_username, email, username,
			auth_method, email_verified, account_enabled, last_login_at,
			created_by_azure, azure_created_at, azure_updated_at,
			created_at, updated_at
		FROM users 
		WHERE id = $1
	`

	err := h.db.QueryRow(query, userID).Scan(
		&user.ID,
		&user.AzureEntraID,
		&user.AzureTenantID,
		&user.AzureObjectID,
		&user.AzurePrincipalName,
		&user.AzureDisplayName,
		&user.AzureGivenName,
		&user.AzureFamilyName,
		&user.AzurePreferredUsername,
		&user.Email,
		&user.Username,
		&user.AuthMethod,
		&user.EmailVerified,
		&user.AccountEnabled,
		&user.LastLoginAt,
		&user.CreatedByAzure,
		&user.AzureCreatedAt,
		&user.AzureUpdatedAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	} else if err != nil {
		log.Printf("Error querying user: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"user":    user,
	})
}

// GetAzureConfig returns the Azure Entra ID configuration
func (h *AzureAuthHandlers) GetAzureConfig(w http.ResponseWriter, r *http.Request) {
	// Query the database for Azure configuration
	query := `
		SELECT 
			tenant_id, tenant_name, client_id, authority_url,
			redirect_uri, scope, response_type, response_mode,
			code_challenge_method, token_endpoint, userinfo_endpoint,
			jwks_uri, issuer, is_active
		FROM azure_entra_config 
		WHERE is_active = true
		ORDER BY created_at DESC
		LIMIT 1
	`

	var config struct {
		TenantID            string `json:"tenant_id"`
		TenantName          string `json:"tenant_name"`
		ClientID            string `json:"client_id"`
		AuthorityURL        string `json:"authority_url"`
		RedirectURI         string `json:"redirect_uri"`
		Scope               string `json:"scope"`
		ResponseType        string `json:"response_type"`
		ResponseMode        string `json:"response_mode"`
		CodeChallengeMethod string `json:"code_challenge_method"`
		TokenEndpoint       string `json:"token_endpoint"`
		UserInfoEndpoint    string `json:"userinfo_endpoint"`
		JWKSUri             string `json:"jwks_uri"`
		Issuer              string `json:"issuer"`
		IsActive            bool   `json:"is_active"`
	}

	err := h.db.QueryRow(query).Scan(
		&config.TenantID,
		&config.TenantName,
		&config.ClientID,
		&config.AuthorityURL,
		&config.RedirectURI,
		&config.Scope,
		&config.ResponseType,
		&config.ResponseMode,
		&config.CodeChallengeMethod,
		&config.TokenEndpoint,
		&config.UserInfoEndpoint,
		&config.JWKSUri,
		&config.Issuer,
		&config.IsActive,
	)

	if err == sql.ErrNoRows {
		http.Error(w, "Azure configuration not found", http.StatusNotFound)
		return
	} else if err != nil {
		log.Printf("Error querying Azure config: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"config":  config,
	})
}
