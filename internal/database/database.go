package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

// InitDB initializes the database and creates tables if they don't exist
func InitDB(dbPath string) (*sql.DB, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %v", err)
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %v", err)
	}

	// Create tables
	if err := createTables(db); err != nil {
		return nil, fmt.Errorf("failed to create tables: %v", err)
	}

	// Seed initial data
	if err := seedData(db); err != nil {
		log.Printf("Warning: failed to seed data: %v", err)
	}

	return db, nil
}

// createTables creates all necessary tables
func createTables(db *sql.DB) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			email TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS posts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			content TEXT NOT NULL,
			slug TEXT UNIQUE NOT NULL,
			published BOOLEAN DEFAULT FALSE,
			user_id INTEGER NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users (id)
		)`,
		`CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)`,
		`CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published)`,
		`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at)`,
	}

	for _, query := range queries {
		if _, err := db.Exec(query); err != nil {
			return fmt.Errorf("failed to execute query: %v", err)
		}
	}

	return nil
}

// seedData adds initial data to the database
func seedData(db *sql.DB) error {
	// Check if admin user exists
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users WHERE username = 'admin'").Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to check admin user: %v", err)
	}

	if count == 0 {
		// Create admin user (password: admin123)
		_, err := db.Exec(`
			INSERT INTO users (username, password_hash, email) 
			VALUES (?, ?, ?)
		`, "admin", "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", "admin@topvitaminsupply.com")
		if err != nil {
			return fmt.Errorf("failed to create admin user: %v", err)
		}
		log.Println("✅ Admin user created (username: admin, password: admin123)")
	}

	// Check if sample posts exist
	err = db.QueryRow("SELECT COUNT(*) FROM posts").Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to check posts: %v", err)
	}

	if count == 0 {
		// Create sample posts
		samplePosts := []struct {
			title   string
			content string
			slug    string
		}{
			{
				title:   "Welcome to Top Vitamin Supply",
				content: "# Welcome to Top Vitamin Supply\n\nWe are your trusted source for high-quality vitamins and supplements.\n\n## Our Mission\n\nTo provide the best nutritional supplements to support your health and wellness journey.\n\n## Why Choose Us?\n\n- Premium quality products\n- Expert guidance\n- Fast shipping\n- Excellent customer service",
				slug:    "welcome-to-top-vitamin-supply",
			},
			{
				title:   "Essential Vitamins for Daily Health",
				content: "# Essential Vitamins for Daily Health\n\n## Vitamin D\n\nEssential for bone health and immune function.\n\n## Vitamin C\n\nPowerful antioxidant that supports immune health.\n\n## B Vitamins\n\nImportant for energy production and brain function.\n\n## Omega-3\n\nSupports heart health and brain function.",
				slug:    "essential-vitamins-for-daily-health",
			},
		}

		for _, post := range samplePosts {
			_, err := db.Exec(`
				INSERT INTO posts (title, content, slug, published, user_id) 
				VALUES (?, ?, ?, ?, ?)
			`, post.title, post.content, post.slug, true, 1)
			if err != nil {
				return fmt.Errorf("failed to create sample post: %v", err)
			}
		}
		log.Println("✅ Sample posts created")
	}

	return nil
}

// GetUserByID retrieves a user by ID
func GetUserByID(db *sql.DB, id int) (*User, error) {
	user := &User{}
	err := db.QueryRow(`
		SELECT id, username, email, created_at, updated_at 
		FROM users WHERE id = ?
	`, id).Scan(&user.ID, &user.Username, &user.Email, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// GetUserByUsername retrieves a user by username
func GetUserByUsername(db *sql.DB, username string) (*User, error) {
	user := &User{}
	err := db.QueryRow(`
		SELECT id, username, password_hash, email, created_at, updated_at 
		FROM users WHERE username = ?
	`, username).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.Email, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// GetPosts retrieves all published posts
func GetPosts(db *sql.DB, limit, offset int) ([]*Post, error) {
	rows, err := db.Query(`
		SELECT p.id, p.title, p.content, p.slug, p.published, p.created_at, p.updated_at,
		       u.username as author
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.published = true
		ORDER BY p.created_at DESC
		LIMIT ? OFFSET ?
	`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []*Post
	for rows.Next() {
		post := &Post{}
		err := rows.Scan(
			&post.ID, &post.Title, &post.Content, &post.Slug, &post.Published,
			&post.CreatedAt, &post.UpdatedAt, &post.Author,
		)
		if err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}

	return posts, nil
}

// GetPostByID retrieves a post by ID
func GetPostByID(db *sql.DB, id int) (*Post, error) {
	post := &Post{}
	err := db.QueryRow(`
		SELECT p.id, p.title, p.content, p.slug, p.published, p.created_at, p.updated_at,
		       u.username as author
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.id = ?
	`, id).Scan(
		&post.ID, &post.Title, &post.Content, &post.Slug, &post.Published,
		&post.CreatedAt, &post.UpdatedAt, &post.Author,
	)
	if err != nil {
		return nil, err
	}
	return post, nil
}

// GetPostBySlug retrieves a post by slug
func GetPostBySlug(db *sql.DB, slug string) (*Post, error) {
	post := &Post{}
	err := db.QueryRow(`
		SELECT p.id, p.title, p.content, p.slug, p.published, p.created_at, p.updated_at,
		       u.username as author
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.slug = ? AND p.published = true
	`, slug).Scan(
		&post.ID, &post.Title, &post.Content, &post.Slug, &post.Published,
		&post.CreatedAt, &post.UpdatedAt, &post.Author,
	)
	if err != nil {
		return nil, err
	}
	return post, nil
}

// CreatePost creates a new post
func CreatePost(db *sql.DB, post *Post) error {
	result, err := db.Exec(`
		INSERT INTO posts (title, content, slug, published, user_id, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, post.Title, post.Content, post.Slug, post.Published, post.UserID, time.Now(), time.Now())
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	post.ID = int(id)
	return nil
}

// UpdatePost updates an existing post
func UpdatePost(db *sql.DB, post *Post) error {
	_, err := db.Exec(`
		UPDATE posts 
		SET title = ?, content = ?, slug = ?, published = ?, updated_at = ?
		WHERE id = ?
	`, post.Title, post.Content, post.Slug, post.Published, time.Now(), post.ID)
	return err
}

// DeletePost deletes a post
func DeletePost(db *sql.DB, id int) error {
	_, err := db.Exec("DELETE FROM posts WHERE id = ?", id)
	return err
}

// User represents a user in the database
type User struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	Email        string    `json:"email"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Post represents a blog post in the database
type Post struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Slug      string    `json:"slug"`
	Published bool      `json:"published"`
	UserID    int       `json:"user_id"`
	Author    string    `json:"author"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
