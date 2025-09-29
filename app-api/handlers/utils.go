package handlers

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"math/big"
	"strings"
)

// generatePKCE generates PKCE code verifier and code challenge
func generatePKCE() (string, string, error) {
	// Generate code verifier (43-128 characters, URL-safe)
	verifierBytes := make([]byte, 32)
	if _, err := rand.Read(verifierBytes); err != nil {
		return "", "", fmt.Errorf("failed to generate code verifier: %v", err)
	}

	codeVerifier := base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(verifierBytes)

	// Generate code challenge (SHA256 hash of verifier, base64url encoded)
	hash := sha256.Sum256([]byte(codeVerifier))
	codeChallenge := base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(hash[:])

	return codeVerifier, codeChallenge, nil
}

// getStringClaim safely extracts a string claim from JWT claims
func getStringClaim(claims map[string]interface{}, key string) string {
	if val, ok := claims[key].(string); ok {
		return val
	}
	return ""
}

// getBoolClaim safely extracts a boolean claim from JWT claims
func getBoolClaim(claims map[string]interface{}, key string) bool {
	if val, ok := claims[key].(bool); ok {
		return val
	}
	return false
}

// hashToken creates a SHA256 hash of a token for secure storage
func hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

// generateRandomString generates a random string of specified length
func generateRandomString(length int) (string, error) {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := make([]byte, length)

	for i := range result {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		result[i] = charset[num.Int64()]
	}

	return string(result), nil
}

// isValidURL checks if a URL is valid and safe for redirects
func isValidURL(url string) bool {
	if url == "" {
		return false
	}

	// Basic URL validation - should start with http:// or https://
	return strings.HasPrefix(url, "http://") || strings.HasPrefix(url, "https://")
}

// sanitizeRedirectURL ensures redirect URL is safe
func sanitizeRedirectURL(url string) string {
	if !isValidURL(url) {
		return ""
	}

	// Remove any potentially dangerous characters
	url = strings.TrimSpace(url)

	// Basic sanitization - remove javascript: and data: protocols
	if strings.HasPrefix(strings.ToLower(url), "javascript:") ||
		strings.HasPrefix(strings.ToLower(url), "data:") {
		return ""
	}

	return url
}
