package migrator

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/agoat-publisher/tools/dbmigrate/internal/config"
)

// Migration represents a database migration
type Migration struct {
	Version   int64
	Name      string
	UpSQL     string
	DownSQL   string
	AppliedAt *time.Time
	Checksum  string
}

// Migrator handles database migrations
type Migrator struct {
	config     *config.Config
	db         *sql.DB
	migrations []*Migration
	verbose    bool
}

// New creates a new migrator instance
func New(cfg *config.Config, migrationsPath string) (*Migrator, error) {
	db, err := cfg.Connect()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	m := &Migrator{
		config:  cfg,
		db:      db,
		verbose: false,
	}

	// Load migrations from directory
	if err := m.loadMigrations(migrationsPath); err != nil {
		return nil, fmt.Errorf("failed to load migrations: %w", err)
	}

	// Ensure migration table exists
	if err := m.ensureMigrationTable(); err != nil {
		return nil, fmt.Errorf("failed to create migration table: %w", err)
	}

	return m, nil
}

// SetVerbose sets verbose logging mode
func (m *Migrator) SetVerbose(verbose bool) {
	m.verbose = verbose
}

// ensureMigrationTable creates the migration tracking table if it doesn't exist
func (m *Migrator) ensureMigrationTable() error {
	query := `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version BIGINT PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			applied_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
			checksum VARCHAR(64) NOT NULL,
			execution_time_ms INTEGER,
			status VARCHAR(20) DEFAULT 'success',
			error_message TEXT
		);
		
		CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at 
		ON schema_migrations (applied_at DESC);
		
		CREATE INDEX IF NOT EXISTS idx_schema_migrations_status 
		ON schema_migrations (status);
	`

	_, err := m.db.Exec(query)
	return err
}

// loadMigrations loads migration files from the specified directory
func (m *Migrator) loadMigrations(migrationsPath string) error {
	entries, err := os.ReadDir(migrationsPath)
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %w", err)
	}

	var migrations []*Migration

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}

		migration, err := m.parseMigrationFile(filepath.Join(migrationsPath, entry.Name()))
		if err != nil {
			return fmt.Errorf("failed to parse migration file %s: %w", entry.Name(), err)
		}

		if migration != nil {
			migrations = append(migrations, migration)
		}
	}

	// Sort migrations by version
	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].Version < migrations[j].Version
	})

	m.migrations = migrations
	return nil
}

// parseMigrationFile parses a single migration file
func (m *Migrator) parseMigrationFile(filePath string) (*Migration, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	// Parse filename to extract version and name
	// Expected format: 00001_add_multitenancy.sql
	filename := filepath.Base(filePath)
	parts := strings.Split(strings.TrimSuffix(filename, ".sql"), "_")
	if len(parts) < 2 {
		return nil, fmt.Errorf("invalid migration filename format: %s", filename)
	}

	version, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid version number in filename: %s", parts[0])
	}

	name := strings.Join(parts[1:], "_")

	// Split content into up and down sections
	upSQL, downSQL := m.splitMigrationContent(string(content))

	return &Migration{
		Version: version,
		Name:    name,
		UpSQL:   strings.TrimSpace(upSQL),
		DownSQL: strings.TrimSpace(downSQL),
	}, nil
}

// splitMigrationContent splits migration content into up and down sections
func (m *Migrator) splitMigrationContent(content string) (string, string) {
	// Look for common migration separators
	separators := []string{
		"-- DOWN",
		"-- DOWN MIGRATION",
		"-- ROLLBACK",
		"--- DOWN",
		"--- ROLLBACK",
	}

	var upSQL, downSQL string

	for _, sep := range separators {
		parts := strings.Split(content, sep)
		if len(parts) >= 2 {
			upSQL = strings.TrimSpace(parts[0])
			downSQL = strings.TrimSpace(parts[1])
			break
		}
	}

	// If no separator found, treat entire content as up migration
	if upSQL == "" {
		upSQL = strings.TrimSpace(content)
	}

	return upSQL, downSQL
}

// Status shows the current migration status
func (m *Migrator) Status() error {
	applied, err := m.getAppliedMigrations()
	if err != nil {
		return fmt.Errorf("failed to get applied migrations: %w", err)
	}

	fmt.Printf("\n📊 Migration Status\n")
	fmt.Printf("==================\n")
	fmt.Printf("Database: %s\n", m.config.Database.DSN)
	fmt.Printf("Total migrations: %d\n", len(m.migrations))
	fmt.Printf("Applied migrations: %d\n", len(applied))
	fmt.Printf("Pending migrations: %d\n", len(m.migrations)-len(applied))
	fmt.Printf("\n")

	if len(m.migrations) == 0 {
		fmt.Printf("No migration files found.\n")
		return nil
	}

	fmt.Printf("Migration History:\n")
	fmt.Printf("%-8s %-30s %-20s %-10s\n", "Version", "Name", "Applied At", "Status")
	fmt.Printf("%-8s %-30s %-20s %-10s\n", "-------", "----", "-----------", "------")

	for _, migration := range m.migrations {
		appliedAt := "Pending"
		status := "Pending"

		if applied, exists := applied[migration.Version]; exists {
			appliedAt = applied.AppliedAt.Format("2006-01-02 15:04:05")
			status = "Applied"
		}

		fmt.Printf("%-8d %-30s %-20s %-10s\n",
			migration.Version,
			truncateString(migration.Name, 28),
			appliedAt,
			status)
	}

	fmt.Printf("\n")
	return nil
}

// getAppliedMigrations returns a map of applied migrations
func (m *Migrator) getAppliedMigrations() (map[int64]*Migration, error) {
	query := `
		SELECT version, name, applied_at, checksum 
		FROM schema_migrations 
		WHERE status = 'success' 
		ORDER BY version
	`

	rows, err := m.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applied := make(map[int64]*Migration)
	for rows.Next() {
		var migration Migration
		err := rows.Scan(&migration.Version, &migration.Name, &migration.AppliedAt, &migration.Checksum)
		if err != nil {
			return nil, err
		}
		applied[migration.Version] = &migration
	}

	return applied, nil
}

// Up applies migrations up to the specified version (or latest if 0)
func (m *Migrator) Up(targetVersion int64, dryRun bool) error {
	applied, err := m.getAppliedMigrations()
	if err != nil {
		return fmt.Errorf("failed to get applied migrations: %w", err)
	}

	fmt.Printf("DEBUG: Found %d applied migrations\n", len(applied))
	fmt.Printf("DEBUG: Total migrations loaded: %d\n", len(m.migrations))

	var pendingMigrations []*Migration
	for _, migration := range m.migrations {
		fmt.Printf("DEBUG: Checking migration %d (%s)\n", migration.Version, migration.Name)
		if _, exists := applied[migration.Version]; !exists {
			fmt.Printf("DEBUG: Migration %d is not applied, adding to pending\n", migration.Version)
			if targetVersion == 0 || migration.Version <= targetVersion {
				pendingMigrations = append(pendingMigrations, migration)
			}
		} else {
			fmt.Printf("DEBUG: Migration %d is already applied\n", migration.Version)
		}
	}

	fmt.Printf("DEBUG: Pending migrations: %d\n", len(pendingMigrations))

	if len(pendingMigrations) == 0 {
		fmt.Printf("✅ No pending migrations to apply.\n")
		return nil
	}

	fmt.Printf("🚀 Applying %d migrations...\n", len(pendingMigrations))
	if dryRun {
		fmt.Printf("🔍 DRY RUN - No changes will be made\n")
	}

	for _, migration := range pendingMigrations {
		if err := m.applyMigration(migration, dryRun); err != nil {
			return fmt.Errorf("failed to apply migration %d: %w", migration.Version, err)
		}
	}

	fmt.Printf("✅ All migrations applied successfully!\n")
	return nil
}

// Down rolls back migrations down to the specified version
func (m *Migrator) Down(targetVersion int64, dryRun bool) error {
	applied, err := m.getAppliedMigrations()
	if err != nil {
		return fmt.Errorf("failed to get applied migrations: %w", err)
	}

	var rollbackMigrations []*Migration
	for _, migration := range m.migrations {
		if _, exists := applied[migration.Version]; exists {
			if migration.Version > targetVersion {
				rollbackMigrations = append(rollbackMigrations, migration)
			}
		}
	}

	// Sort in reverse order for rollback
	sort.Slice(rollbackMigrations, func(i, j int) bool {
		return rollbackMigrations[i].Version > rollbackMigrations[j].Version
	})

	if len(rollbackMigrations) == 0 {
		fmt.Printf("✅ No migrations to rollback.\n")
		return nil
	}

	fmt.Printf("🔄 Rolling back %d migrations...\n", len(rollbackMigrations))
	if dryRun {
		fmt.Printf("🔍 DRY RUN - No changes will be made\n")
	}

	for _, migration := range rollbackMigrations {
		if err := m.rollbackMigration(migration, dryRun); err != nil {
			return fmt.Errorf("failed to rollback migration %d: %w", migration.Version, err)
		}
	}

	fmt.Printf("✅ All migrations rolled back successfully!\n")
	return nil
}

// applyMigration applies a single migration
func (m *Migrator) applyMigration(migration *Migration, dryRun bool) error {
	fmt.Printf("📝 Applying migration %d: %s\n", migration.Version, migration.Name)

	if dryRun {
		fmt.Printf("   SQL: %s\n", truncateString(migration.UpSQL, 100))
		return nil
	}

	startTime := time.Now()

	// Execute migration without transaction for complex migrations
	_, err := m.db.Exec(migration.UpSQL)
	if err != nil {
		// Record failed migration
		m.recordFailedMigrationDirect(migration, err, time.Since(startTime))
		return fmt.Errorf("migration failed: %w", err)
	}

	// Record successful migration
	checksum := m.calculateChecksum(migration.UpSQL)
	err = m.recordSuccessfulMigrationDirect(migration, checksum, time.Since(startTime))
	if err != nil {
		return err
	}

	executionTime := time.Since(startTime)
	fmt.Printf("   ✅ Applied in %v\n", executionTime)
	return nil
}

// rollbackMigration rolls back a single migration
func (m *Migrator) rollbackMigration(migration *Migration, dryRun bool) error {
	fmt.Printf("🔄 Rolling back migration %d: %s\n", migration.Version, migration.Name)

	if dryRun {
		fmt.Printf("   SQL: %s\n", truncateString(migration.DownSQL, 100))
		return nil
	}

	if migration.DownSQL == "" {
		return fmt.Errorf("no down migration available for version %d", migration.Version)
	}

	// Start transaction
	tx, err := m.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	startTime := time.Now()

	// Execute rollback
	_, err = tx.Exec(migration.DownSQL)
	if err != nil {
		return fmt.Errorf("rollback failed: %w", err)
	}

	// Remove migration record
	_, err = tx.Exec("DELETE FROM schema_migrations WHERE version = $1", migration.Version)
	if err != nil {
		return err
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return err
	}

	executionTime := time.Since(startTime)
	fmt.Printf("   ✅ Rolled back in %v\n", executionTime)
	return nil
}

// recordSuccessfulMigration records a successful migration
func (m *Migrator) recordSuccessfulMigration(tx *sql.Tx, migration *Migration, checksum string, executionTime time.Duration) error {
	query := `
		INSERT INTO schema_migrations (version, name, applied_at, checksum, execution_time_ms, status)
		VALUES ($1, $2, $3, $4, $5, 'success')
	`

	_, err := tx.Exec(query,
		migration.Version,
		migration.Name,
		time.Now(),
		checksum,
		executionTime.Milliseconds())

	return err
}

// recordFailedMigration records a failed migration
func (m *Migrator) recordFailedMigration(tx *sql.Tx, migration *Migration, err error, executionTime time.Duration) {
	query := `
		INSERT INTO schema_migrations (version, name, applied_at, checksum, execution_time_ms, status, error_message)
		VALUES ($1, $2, $3, $4, $5, 'failed', $6)
	`

	checksum := m.calculateChecksum(migration.UpSQL)
	tx.Exec(query,
		migration.Version,
		migration.Name,
		time.Now(),
		checksum,
		executionTime.Milliseconds(),
		err.Error())
}

// recordFailedMigrationDirect records a failed migration without transaction
func (m *Migrator) recordFailedMigrationDirect(migration *Migration, err error, executionTime time.Duration) {
	query := `
		INSERT INTO schema_migrations (version, name, applied_at, checksum, execution_time_ms, status, error_message)
		VALUES ($1, $2, $3, $4, $5, 'failed', $6)
	`

	checksum := m.calculateChecksum(migration.UpSQL)
	m.db.Exec(query,
		migration.Version,
		migration.Name,
		time.Now(),
		checksum,
		executionTime.Milliseconds(),
		err.Error())
}

// recordSuccessfulMigrationDirect records a successful migration without transaction
func (m *Migrator) recordSuccessfulMigrationDirect(migration *Migration, checksum string, executionTime time.Duration) error {
	query := `
		INSERT INTO schema_migrations (version, name, applied_at, checksum, execution_time_ms, status)
		VALUES ($1, $2, $3, $4, $5, 'success')
	`

	_, err := m.db.Exec(query,
		migration.Version,
		migration.Name,
		time.Now(),
		checksum,
		executionTime.Milliseconds())

	return err
}

// calculateChecksum calculates a simple checksum for migration content
func (m *Migrator) calculateChecksum(content string) string {
	// Simple hash for now - in production, use a proper hash function
	return fmt.Sprintf("%d", len(content))
}

// Create creates a new migration file
func (m *Migrator) Create(name string) error {
	// Find the next version number
	nextVersion := int64(1)
	if len(m.migrations) > 0 {
		nextVersion = m.migrations[len(m.migrations)-1].Version + 1
	}

	// Create migration filename
	filename := fmt.Sprintf("%05d_%s.sql", nextVersion, name)
	filepath := filepath.Join("migrations", filename)

	// Create migrations directory if it doesn't exist
	if err := os.MkdirAll("migrations", 0755); err != nil {
		return fmt.Errorf("failed to create migrations directory: %w", err)
	}

	// Create migration file with template
	template := fmt.Sprintf(`-- Migration: %s
-- Description: %s
-- Date: %s
-- Author: AGoat Publisher Team

-- UP MIGRATION
-- Add your migration SQL here
-- Example:
-- CREATE TABLE example (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP NOT NULL DEFAULT current_timestamp()
-- );

-- DOWN MIGRATION
-- Add your rollback SQL here
-- Example:
-- DROP TABLE IF EXISTS example;
`, filename, name, time.Now().Format("2006-01-02"))

	if err := os.WriteFile(filepath, []byte(template), 0644); err != nil {
		return fmt.Errorf("failed to create migration file: %w", err)
	}

	fmt.Printf("✅ Created migration file: %s\n", filepath)
	return nil
}

// Reset resets the database to initial state
func (m *Migrator) Reset(dryRun bool) error {
	fmt.Printf("⚠️  WARNING: This will reset the database to initial state!\n")
	fmt.Printf("   This action cannot be undone.\n\n")

	if dryRun {
		fmt.Printf("🔍 DRY RUN - No changes will be made\n")
		return nil
	}

	// Get all applied migrations
	applied, err := m.getAppliedMigrations()
	if err != nil {
		return fmt.Errorf("failed to get applied migrations: %w", err)
	}

	if len(applied) == 0 {
		fmt.Printf("✅ Database is already in initial state.\n")
		return nil
	}

	// Rollback all migrations
	return m.Down(0, dryRun)
}

// Validate validates migration files without executing them
func (m *Migrator) Validate() error {
	fmt.Printf("🔍 Validating migration files...\n")

	for _, migration := range m.migrations {
		if migration.UpSQL == "" {
			return fmt.Errorf("migration %d (%s) has no UP migration", migration.Version, migration.Name)
		}

		// Basic SQL validation (could be enhanced with a SQL parser)
		if !strings.Contains(strings.ToUpper(migration.UpSQL), "CREATE") &&
			!strings.Contains(strings.ToUpper(migration.UpSQL), "ALTER") &&
			!strings.Contains(strings.ToUpper(migration.UpSQL), "INSERT") &&
			!strings.Contains(strings.ToUpper(migration.UpSQL), "UPDATE") &&
			!strings.Contains(strings.ToUpper(migration.UpSQL), "DELETE") &&
			!strings.Contains(strings.ToUpper(migration.UpSQL), "DROP") {
			fmt.Printf("⚠️  Warning: Migration %d (%s) may not contain valid SQL\n", migration.Version, migration.Name)
		}
	}

	fmt.Printf("✅ All migration files are valid.\n")
	return nil
}

// Close closes the database connection
func (m *Migrator) Close() error {
	return m.db.Close()
}

// truncateString truncates a string to the specified length
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}
