package main

import (
	"flag"
	"fmt"
	"log"

	"github.com/agoat-publisher/tools/dbmigrate/internal/config"
	"github.com/agoat-publisher/tools/dbmigrate/internal/migrator"
)

func main() {
	// Parse command line flags
	var (
		configPath     = flag.String("config", "", "Path to configuration file")
		migrationsPath = flag.String("migrations", "./migrations", "Path to migrations directory")
		action         = flag.String("action", "status", "Action to perform: status, up, down, create, reset")
		version        = flag.Int("version", 0, "Target version for up/down migrations")
		dryRun         = flag.Bool("dry-run", false, "Show what would be executed without running")
		verbose        = flag.Bool("verbose", false, "Enable verbose output")
		help           = flag.Bool("help", false, "Show help information")
	)
	flag.Parse()

	if *help {
		showHelp()
		return
	}

	// Load configuration
	cfg, err := config.Load(*configPath)
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Create migrator instance
	m, err := migrator.New(cfg, *migrationsPath)
	if err != nil {
		log.Fatalf("Failed to create migrator: %v", err)
	}

	// Set verbose mode
	m.SetVerbose(*verbose)

	// Get action from positional arguments if not provided as flag
	actionToExecute := *action
	if actionToExecute == "status" && len(flag.Args()) > 0 {
		actionToExecute = flag.Args()[0]
	}

	// Execute requested action
	switch actionToExecute {
	case "status":
		if err := m.Status(); err != nil {
			log.Fatalf("Status check failed: %v", err)
		}
	case "up":
		if err := m.Up(int64(*version), *dryRun); err != nil {
			log.Fatalf("Migration up failed: %v", err)
		}
	case "down":
		if err := m.Down(int64(*version), *dryRun); err != nil {
			log.Fatalf("Migration down failed: %v", err)
		}
	case "create":
		if len(flag.Args()) < 2 {
			log.Fatal("Migration name required for create action")
		}
		name := flag.Args()[1]
		if err := m.Create(name); err != nil {
			log.Fatalf("Failed to create migration: %v", err)
		}
	case "reset":
		if err := m.Reset(*dryRun); err != nil {
			log.Fatalf("Migration reset failed: %v", err)
		}
	case "validate":
		if err := m.Validate(); err != nil {
			log.Fatalf("Migration validation failed: %v", err)
		}
	default:
		log.Fatalf("Unknown action: %s", actionToExecute)
	}
}

func showHelp() {
	fmt.Println(`
Database Migration Tool for AGoat Publisher

Usage:
  dbmigrate [flags] [action] [args]

Actions:
  status              Show current migration status
  up [version]        Apply migrations up to version (or latest if not specified)
  down [version]      Rollback migrations down to version
  create <name>       Create a new migration file
  reset               Reset database to initial state
  validate            Validate migration files without executing

Flags:
  -config string       Path to configuration file (default: auto-detect)
  -migrations string   Path to migrations directory (default: "./migrations")
  -action string       Action to perform (default: "status")
  -version int         Target version for up/down migrations
  -dry-run            Show what would be executed without running
  -verbose            Enable verbose output
  -help               Show this help information

Examples:
  dbmigrate status
  dbmigrate up
  dbmigrate up -version 5
  dbmigrate down -version 3
  dbmigrate create add_users_table
  dbmigrate reset -dry-run
  dbmigrate validate

Configuration:
  The tool automatically detects configuration from environment variables:
  - DSN: Database connection string
  - CA: Database CA certificate (for CockroachDB)
  
  Or from a config file specified with -config flag.
`)
}
