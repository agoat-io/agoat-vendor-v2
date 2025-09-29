package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// OIDCConfig represents the configuration for an OIDC provider
type OIDCConfig struct {
	SystemName            string                 `json:"system_name"`
	DisplayName           string                 `json:"display_name"`
	ProviderType          string                 `json:"provider_type"`
	IsActive              bool                   `json:"is_active"`
	ProviderInstanceID    string                 `json:"provider_instance_id"`
	ProviderEnvironment   string                 `json:"provider_environment"`
	ProviderRegion        string                 `json:"provider_region"`
	ProviderDomain        string                 `json:"provider_domain"`
	IsDefaultForType      bool                   `json:"is_default_for_type"`
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
	RedirectURI           string                 `json:"redirect_uri"`
}

// OIDCConfigs represents the collection of OIDC configurations
type OIDCConfigs struct {
	Providers []OIDCConfig `json:"providers"`
}

// LoadOIDCConfig loads OIDC configuration from the config file
func LoadOIDCConfig(configPath string) (*OIDCConfigs, error) {
	// Default to config directory if no path provided
	if configPath == "" {
		configPath = "./config/oidc-config.json"
	}

	// Check if file exists
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("OIDC config file not found: %s", configPath)
	}

	// Read the config file
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read OIDC config file: %w", err)
	}

	// Parse the JSON
	var configs OIDCConfigs
	if err := json.Unmarshal(data, &configs); err != nil {
		return nil, fmt.Errorf("failed to parse OIDC config JSON: %w", err)
	}

	return &configs, nil
}

// GetOIDCConfig returns the configuration for a specific provider
func (c *OIDCConfigs) GetOIDCConfig(providerName string) (*OIDCConfig, error) {
	for _, config := range c.Providers {
		if config.SystemName == providerName {
			if !config.IsActive {
				return nil, fmt.Errorf("OIDC provider '%s' is not active", providerName)
			}
			return &config, nil
		}
	}
	return nil, fmt.Errorf("OIDC provider '%s' not found in configuration", providerName)
}

// GetDefaultOIDCConfig returns the default OIDC configuration
func (c *OIDCConfigs) GetDefaultOIDCConfig() (*OIDCConfig, error) {
	for _, config := range c.Providers {
		if config.IsActive && config.IsDefaultForType {
			return &config, nil
		}
	}

	// If no default found, return the first active provider
	for _, config := range c.Providers {
		if config.IsActive {
			return &config, nil
		}
	}

	return nil, fmt.Errorf("no active OIDC provider found")
}

// GetConfigPath returns the default config path
func GetConfigPath() string {
	// Try to find config file in current directory or parent directories
	dirs := []string{
		"./config/oidc-config.json",
		"../config/oidc-config.json",
		"../../config/oidc-config.json",
	}

	for _, dir := range dirs {
		if _, err := os.Stat(dir); err == nil {
			absPath, _ := filepath.Abs(dir)
			return absPath
		}
	}

	// Default fallback
	return "./config/oidc-config.json"
}
