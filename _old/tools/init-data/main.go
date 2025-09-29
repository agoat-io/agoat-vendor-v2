package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

func main() {
	// Get DSN from environment
	dsn := os.Getenv("DSN")
	if dsn == "" {
		log.Fatal("DSN environment variable is required")
	}

	// Connect to database
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	fmt.Println("✅ Connected to database successfully")

	// Create default customer
	var customerID string
	err = db.QueryRow(`
		INSERT INTO customers (id, name, email, status, subscription_plan, max_sites, max_storage_gb, max_bandwidth_gb, created_at, updated_at)
		VALUES (gen_random_uuid(), 'Default Customer', 'admin@agoat-publisher.com', 'active', 'basic', 10, 100, 1000, $1, $1)
		ON CONFLICT DO NOTHING
		RETURNING id
	`, time.Now()).Scan(&customerID)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("Warning: Could not create customer: %v", err)
	} else if err == nil {
		fmt.Printf("✅ Created default customer with ID: %s\n", customerID)
	}

	// Get customer ID if not created above
	if customerID == "" {
		err = db.QueryRow("SELECT id FROM customers WHERE name = 'Default Customer'").Scan(&customerID)
		if err != nil {
			log.Fatalf("Failed to get customer ID: %v", err)
		}
		fmt.Printf("✅ Found existing customer with ID: %s\n", customerID)
	}

	// Create default site
	var siteID string
	err = db.QueryRow(`
		INSERT INTO sites (id, customer_id, name, slug, status, template, settings, created_at, updated_at)
		VALUES (gen_random_uuid(), $1, 'Default Site', 'default-site', 'active', 'default', '{}', $2, $2)
		ON CONFLICT DO NOTHING
		RETURNING id
	`, customerID, time.Now()).Scan(&siteID)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("Warning: Could not create site: %v", err)
	} else if err == nil {
		fmt.Printf("✅ Created default site with ID: %s\n", siteID)
	}

	// Get site ID if not created above
	if siteID == "" {
		err = db.QueryRow("SELECT id FROM sites WHERE name = 'Default Site'").Scan(&siteID)
		if err != nil {
			log.Fatalf("Failed to get site ID: %v", err)
		}
		fmt.Printf("✅ Found existing site with ID: %s\n", siteID)
	}

	// Create default user
	var userID string
	err = db.QueryRow(`
		INSERT INTO users (id, username, email, password_hash, customer_id, site_id, role, status, created_at)
		VALUES (gen_random_uuid(), 'admin', 'admin@agoat-publisher.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', $1, $2, 'admin', 'active', $3)
		ON CONFLICT DO NOTHING
		RETURNING id
	`, customerID, siteID, time.Now()).Scan(&userID)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("Warning: Could not create user: %v", err)
	} else if err == nil {
		fmt.Printf("✅ Created default user with ID: %s\n", userID)
	}

	// Get user ID if not created above
	if userID == "" {
		err = db.QueryRow("SELECT id FROM users WHERE username = 'admin'").Scan(&userID)
		if err != nil {
			log.Fatalf("Failed to get user ID: %v", err)
		}
		fmt.Printf("✅ Found existing user with ID: %s\n", userID)
	}

	// Create sample posts
	now := time.Now()
	
	// Check if posts already exist
	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM posts WHERE site_id = $1", siteID).Scan(&count)
	if err != nil {
		log.Printf("Warning: Could not check posts count: %v", err)
	}

	if count == 0 {
		// Create welcome post
		_, err = db.Exec(`
			INSERT INTO posts (id, user_id, site_id, title, content, slug, status, published, created_at, updated_at)
			VALUES (gen_random_uuid(), $1, $2, 'Welcome to AGoat Publisher', $3, 'welcome-to-agoat-publisher', 'published', true, $4, $4)
		`, userID, siteID, `# Welcome to AGoat Publisher

This is your first blog post. You can edit this post or create new ones from the dashboard.

## Features

- **Multitenancy**: Support for multiple customers and sites
- **Markdown Support**: Write posts in Markdown
- **Modern UI**: Built with React and Radix UI
- **Scalable**: Powered by CockroachDB

Start writing your content today!`, now)
		if err != nil {
			log.Printf("Warning: Could not create welcome post: %v", err)
		} else {
			fmt.Println("✅ Created welcome post")
		}

		// Create getting started post
		_, err = db.Exec(`
			INSERT INTO posts (id, user_id, site_id, title, content, slug, status, published, created_at, updated_at)
			VALUES (gen_random_uuid(), $1, $2, 'Getting Started Guide', $3, 'getting-started-guide', 'published', true, $4, $4)
		`, userID, siteID, `# Getting Started Guide

Here's how to get started with AGoat Publisher:

## 1. Create Your First Post

Navigate to the dashboard and click "New Post" to create your first blog post.

## 2. Customize Your Site

You can customize your site settings and template from the dashboard.

## 3. Publish Content

Write your content in Markdown and publish it for your readers.

Happy blogging!`, now)
		if err != nil {
			log.Printf("Warning: Could not create getting started post: %v", err)
		} else {
			fmt.Println("✅ Created getting started post")
		}
	} else {
		fmt.Printf("✅ Found %d existing posts\n", count)
	}

	// Display summary
	fmt.Println("\n📊 Database Summary:")
	fmt.Printf("   Customer ID: %s\n", customerID)
	fmt.Printf("   Site ID: %s\n", siteID)
	fmt.Printf("   User ID: %s\n", userID)
	fmt.Printf("   Posts: %d\n", count)

	fmt.Println("\n🎉 Database initialization completed!")
}
