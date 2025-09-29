package config

import (
	"encoding/json"
	"fmt"
	"os"
)

// AppConfig represents the application configuration
type AppConfig struct {
	App              AppSettings `json:"app"`
	AllowedOrigins   []string    `json:"allowed_origins"`
	DefaultReturnURL string      `json:"default_return_url"`
	SSL              SSLConfig   `json:"ssl"`
}

// AppSettings represents basic app settings
type AppSettings struct {
	BaseURL      string `json:"base_url"`
	APIPort      string `json:"api_port"`
	FrontendPort string `json:"frontend_port"`
}

// SSLConfig represents SSL certificate configuration
type SSLConfig struct {
	CertFile string `json:"cert_file"`
	KeyFile  string `json:"key_file"`
}

// LoadAppConfig loads application configuration from the config file
func LoadAppConfig(configPath string) (*AppConfig, error) {
	// Default to config directory if no path provided
	if configPath == "" {
		configPath = "./config/app-config.json"
	}

	// Check if file exists
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("app config file not found: %s", configPath)
	}

	// Read the config file
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read app config file: %w", err)
	}

	// Parse the JSON
	var config AppConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to parse app config JSON: %w", err)
	}

	return &config, nil
}

// GetAppConfigPath returns the default config path
func GetAppConfigPath() string {
	// Try to find config file in current directory or parent directories
	dirs := []string{
		"./config/app-config.json",
		"../config/app-config.json",
		"../../config/app-config.json",
	}

	for _, dir := range dirs {
		if _, err := os.Stat(dir); err == nil {
			return dir
		}
	}

	// Default fallback
	return "./config/app-config.json"
}
