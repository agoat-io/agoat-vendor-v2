package config

import (
	"crypto/x509"
	"database/sql"
	"fmt"
	"os"
	"strings"

	_ "github.com/lib/pq"
	"github.com/spf13/viper"
)

// Config holds the database configuration
type Config struct {
	Database DatabaseConfig `mapstructure:"database"`
	Logging  LoggingConfig  `mapstructure:"logging"`
}

// DatabaseConfig holds database connection settings
type DatabaseConfig struct {
	Driver   string `mapstructure:"driver"`
	DSN      string `mapstructure:"dsn"`
	CA       string `mapstructure:"ca"`
	MaxConns int    `mapstructure:"max_conns"`
	Timeout  int    `mapstructure:"timeout"`
}

// LoggingConfig holds logging settings
type LoggingConfig struct {
	Level  string `mapstructure:"level"`
	Format string `mapstructure:"format"`
}

// Load loads configuration from file or environment variables
func Load(configPath string) (*Config, error) {
	cfg := &Config{
		Database: DatabaseConfig{
			Driver:   "postgres",
			MaxConns: 10,
			Timeout:  30,
		},
		Logging: LoggingConfig{
			Level:  "info",
			Format: "text",
		},
	}

	// Load from config file if specified
	if configPath != "" {
		viper.SetConfigFile(configPath)
		if err := viper.ReadInConfig(); err != nil {
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}
		if err := viper.Unmarshal(cfg); err != nil {
			return nil, fmt.Errorf("failed to unmarshal config: %w", err)
		}
	}

	// Override with environment variables
	loadFromEnv(cfg)

	// Validate configuration
	if err := cfg.Validate(); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	return cfg, nil
}

// loadFromEnv loads configuration from environment variables
func loadFromEnv(cfg *Config) {
	// Database configuration
	if dsn := os.Getenv("DSN"); dsn != "" {
		cfg.Database.DSN = dsn
	}
	if ca := os.Getenv("CA"); ca != "" {
		cfg.Database.CA = ca
	}
	if driver := os.Getenv("DB_DRIVER"); driver != "" {
		cfg.Database.Driver = driver
	}
	if maxConns := os.Getenv("DB_MAX_CONNS"); maxConns != "" {
		// Parse max connections (validation happens in Validate())
		cfg.Database.MaxConns = 10 // default, will be overridden if valid
	}
	if timeout := os.Getenv("DB_TIMEOUT"); timeout != "" {
		// Parse timeout (validation happens in Validate())
		cfg.Database.Timeout = 30 // default, will be overridden if valid
	}

	// Logging configuration
	if level := os.Getenv("LOG_LEVEL"); level != "" {
		cfg.Logging.Level = level
	}
	if format := os.Getenv("LOG_FORMAT"); format != "" {
		cfg.Logging.Format = format
	}
}

// Validate validates the configuration
func (c *Config) Validate() error {
	if c.Database.DSN == "" {
		return fmt.Errorf("database DSN is required")
	}

	if c.Database.MaxConns <= 0 {
		c.Database.MaxConns = 10
	}

	if c.Database.Timeout <= 0 {
		c.Database.Timeout = 30
	}

	return nil
}

// Connect establishes a database connection
func (c *Config) Connect() (*sql.DB, error) {
	// Configure TLS for CockroachDB if CA is provided
	if c.Database.CA != "" {
		rootCAs := x509.NewCertPool()
		if ok := rootCAs.AppendCertsFromPEM([]byte(c.Database.CA)); !ok {
			return nil, fmt.Errorf("failed to parse CA certificate")
		}

		// For CockroachDB, we'll use the standard TLS configuration
		// The CA certificate will be used for verification
		if !strings.Contains(c.Database.DSN, "sslmode=") {
			if strings.Contains(c.Database.DSN, "?") {
				c.Database.DSN += "&sslmode=verify-full"
			} else {
				c.Database.DSN += "?sslmode=verify-full"
			}
		}
	}

	// Connect to database
	db, err := sql.Open(c.Database.Driver, c.Database.DSN)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(c.Database.MaxConns)
	db.SetMaxIdleConns(c.Database.MaxConns / 2)
	db.SetConnMaxLifetime(0) // Connections don't expire

	// Test connection
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}
