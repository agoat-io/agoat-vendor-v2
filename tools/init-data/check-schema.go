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
	dsn := os.Getenv("DSN")
	if dsn == "" {
		log.Fatal("DSN environment variable is required")
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer db.Close()

	// Check posts table schema
	fmt.Println("📋 Posts table schema:")
	rows, err := db.Query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'posts' ORDER BY ordinal_position")
	if err != nil {
		log.Fatalf("Failed to query schema: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var col, typ string
		rows.Scan(&col, &typ)
		fmt.Printf("  %s: %s\n", col, typ)
	}

	// Get site ID
	var siteID string
	err = db.QueryRow("SELECT id FROM sites WHERE name = 'Default Site'").Scan(&siteID)
	if err != nil {
		log.Fatalf("Failed to get site ID: %v", err)
	}
	fmt.Printf("\n📍 Site ID: %s\n", siteID)

	// Check if posts exist
	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM posts WHERE site_id = $1", siteID).Scan(&count)
	if err != nil {
		log.Fatalf("Failed to count posts: %v", err)
	}
	fmt.Printf("📊 Current posts count: %d\n", count)

	// Create a test post if none exist
	if count == 0 {
		fmt.Println("\n📝 Creating test post...")

		// Get user ID (use the first user or create one)
		var userID string
		err = db.QueryRow("SELECT id FROM users LIMIT 1").Scan(&userID)
		if err != nil {
			// Create a user if none exists
			err = db.QueryRow(`
				INSERT INTO users (id, username, email, password_hash, customer_id, site_id, role, status, created_at)
				VALUES (gen_random_uuid(), 'admin', 'admin@test.com', 'hash', 
					(SELECT id FROM customers WHERE name = 'Default Customer'), $1, 'admin', 'active', $2)
				RETURNING id
			`, siteID, time.Now()).Scan(&userID)
			if err != nil {
				log.Fatalf("Failed to create user: %v", err)
			}
			fmt.Printf("✅ Created user with ID: %s\n", userID)
		} else {
			fmt.Printf("✅ Using existing user with ID: %s\n", userID)
		}

		// Create test post
		_, err = db.Exec(`
			INSERT INTO posts (id, user_id, site_id, title, content, slug, status, published, created_at, updated_at)
			VALUES (gen_random_uuid(), $1, $2, 'Test Post', 'This is a test post content.', 'test-post', 'published', true, $3, $3)
		`, userID, siteID, time.Now())
		if err != nil {
			log.Fatalf("Failed to create test post: %v", err)
		}
		fmt.Println("✅ Created test post")
	}

	// Show final count
	err = db.QueryRow("SELECT COUNT(*) FROM posts WHERE site_id = $1", siteID).Scan(&count)
	if err != nil {
		log.Fatalf("Failed to count posts: %v", err)
	}
	fmt.Printf("📊 Final posts count: %d\n", count)
}
