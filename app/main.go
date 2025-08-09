package main

import (
	"crypto/tls"
	"crypto/x509"
	"database/sql"
	"embed"
	"encoding/gob"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

//go:embed templates/*
var templateFS embed.FS

// Configuration
type Config struct {
	Server   ServerConfig   `json:"server"`
	Database DatabaseConfig `json:"database"`
	Session  SessionConfig  `json:"session"`
	Auth     AuthConfig     `json:"auth"`
	API      APIConfig      `json:"api"`
}

type ServerConfig struct {
	Port string `json:"port"`
}

type DatabaseConfig struct {
	Driver string `json:"driver"`
	DSN    string `json:"dsn"`
	CA     string `json:"ca"`
}

type SessionConfig struct {
	Store  string `json:"store"` // "redis" or "cookie"
	Secret string `json:"secret"`
	Redis  RedisConfig `json:"redis"`
}

type RedisConfig struct {
	Addr     string `json:"addr"`
	Password string `json:"password"`
	DB       int    `json:"db"`
}

type AuthConfig struct {
	Provider string `json:"provider"` // "hardcoded", "database", etc.
	Username string `json:"username"`
	Password string `json:"password"`
}

type APIConfig struct {
	Enabled bool   `json:"enabled"`
	Key     string `json:"key"`     // API key for authentication
	RateLimit int  `json:"rateLimit"` // requests per minute
}

// Domain Models
type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

type Post struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Slug      string    `json:"slug"`
	Published bool      `json:"published"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Author    string    `json:"author"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	User    *User  `json:"user,omitempty"`
	Token   string `json:"token,omitempty"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Meta    *APIMeta    `json:"meta,omitempty"`
}

type APIMeta struct {
	Page       int `json:"page,omitempty"`
	PerPage    int `json:"per_page,omitempty"`
	Total      int `json:"total,omitempty"`
	TotalPages int `json:"total_pages,omitempty"`
}

// Interfaces
type Authenticator interface {
	Authenticate(username, password string) (*User, error)
	GetUser(id int) (*User, error)
	ValidateAPIKey(key string) bool
}

type PostRepository interface {
	Create(post *Post) error
	Update(post *Post) error
	Delete(id int) error
	GetByID(id int) (*Post, error)
	GetAll(limit, offset int) ([]Post, error)
	GetBySlug(slug string) (*Post, error)
	Count() (int, error)
}

type SessionStore interface {
	Get(r *http.Request, name string) (*sessions.Session, error)
	Save(r *http.Request, w http.ResponseWriter, s *sessions.Session) error
}

// Implementations
type HardcodedAuth struct {
	username string
	password string
	apiKey   string
}

func (h *HardcodedAuth) Authenticate(username, password string) (*User, error) {
	if username == h.username && password == h.password {
		return &User{
			ID:       1,
			Username: username,
			Email:    username + "@example.com",
		}, nil
	}
	return nil, fmt.Errorf("invalid credentials")
}

func (h *HardcodedAuth) GetUser(id int) (*User, error) {
	if id == 1 {
		return &User{
			ID:       1,
			Username: h.username,
			Email:    h.username + "@example.com",
		}, nil
	}
	return nil, fmt.Errorf("user not found")
}

func (h *HardcodedAuth) ValidateAPIKey(key string) bool {
	return h.apiKey != "" && h.apiKey == key
}

type SQLPostRepository struct {
	db *sql.DB
}

func (r *SQLPostRepository) Create(post *Post) error {
	query := `
		INSERT INTO posts (user_id, title, content, slug, published, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id`
	err := r.db.QueryRow(query, post.UserID, post.Title, post.Content, 
		post.Slug, post.Published, time.Now(), time.Now()).Scan(&post.ID)
	return err
}

func (r *SQLPostRepository) Update(post *Post) error {
	query := `
		UPDATE posts SET title = $1, content = $2, slug = $3, 
		published = $4, updated_at = $5 WHERE id = $6`
	_, err := r.db.Exec(query, post.Title, post.Content, post.Slug, 
		post.Published, time.Now(), post.ID)
	return err
}

func (r *SQLPostRepository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM posts WHERE id = $1", id)
	return err
}

func (r *SQLPostRepository) GetByID(id int) (*Post, error) {
	post := &Post{}
	query := `
		SELECT p.id, p.user_id, p.title, p.content, p.slug, p.published, 
		p.created_at, p.updated_at, COALESCE(u.username, 'Anonymous')
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
		WHERE p.id = $1`
	err := r.db.QueryRow(query, id).Scan(&post.ID, &post.UserID, &post.Title,
		&post.Content, &post.Slug, &post.Published, &post.CreatedAt, 
		&post.UpdatedAt, &post.Author)
	return post, err
}

func (r *SQLPostRepository) GetAll(limit, offset int) ([]Post, error) {
	query := `
		SELECT p.id, p.user_id, p.title, p.content, p.slug, p.published, 
		p.created_at, p.updated_at, COALESCE(u.username, 'Anonymous')
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
		ORDER BY p.created_at DESC
		LIMIT $1 OFFSET $2`
	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		var post Post
		err := rows.Scan(&post.ID, &post.UserID, &post.Title, &post.Content,
			&post.Slug, &post.Published, &post.CreatedAt, &post.UpdatedAt, &post.Author)
		if err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}
	return posts, nil
}

func (r *SQLPostRepository) GetBySlug(slug string) (*Post, error) {
	post := &Post{}
	query := `
		SELECT p.id, p.user_id, p.title, p.content, p.slug, p.published, 
		p.created_at, p.updated_at, COALESCE(u.username, 'Anonymous')
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
		WHERE p.slug = $1`
	err := r.db.QueryRow(query, slug).Scan(&post.ID, &post.UserID, &post.Title,
		&post.Content, &post.Slug, &post.Published, &post.CreatedAt, 
		&post.UpdatedAt, &post.Author)
	return post, err
}

func (r *SQLPostRepository) Count() (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM posts").Scan(&count)
	return count, err
}

// Application
type App struct {
	config    *Config
	db        *sql.DB
	auth      Authenticator
	posts     PostRepository
	sessions  SessionStore
	templates *template.Template
}

func NewApp(config *Config) (*App, error) {
	// Initialize database
	db, err := initDatabase(config.Database)
	if err != nil {
		return nil, err
	}

	// Initialize auth
	var auth Authenticator
	switch config.Auth.Provider {
	case "hardcoded":
		auth = &HardcodedAuth{
			username: config.Auth.Username,
			password: config.Auth.Password,
			apiKey:   config.API.Key,
		}
	default:
		auth = &HardcodedAuth{
			username: "admin",
			password: "admin123",
			apiKey:   config.API.Key,
		}
	}

	// Initialize session store
	var sessionStore SessionStore
	switch config.Session.Store {
	case "redis":
		client := redis.NewClient(&redis.Options{
			Addr:     config.Session.Redis.Addr,
			Password: config.Session.Redis.Password,
			DB:       config.Session.Redis.DB,
		})
		sessionStore = &RedisSessionStore{
			client: client,
			secret: []byte(config.Session.Secret),
		}
	default:
		sessionStore = sessions.NewCookieStore([]byte(config.Session.Secret))
	}

	// Load templates
	templates, err := template.ParseFS(templateFS, "templates/*.html")
	if err != nil {
		return nil, err
	}

	app := &App{
		config:    config,
		db:        db,
		auth:      auth,
		posts:     &SQLPostRepository{db: db},
		sessions:  sessionStore,
		templates: templates,
	}

	// Initialize database schema
	if err := app.initSchema(); err != nil {
		return nil, err
	}

	return app, nil
}

func (app *App) initSchema() error {
	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username VARCHAR(255) UNIQUE NOT NULL,
		email VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS posts (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		title VARCHAR(255) NOT NULL,
		content TEXT NOT NULL,
		slug VARCHAR(255) UNIQUE NOT NULL,
		published BOOLEAN DEFAULT false,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
	CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);
	`
	_, err := app.db.Exec(schema)
	return err
}

// Redis Session Store
type RedisSessionStore struct {
	client *redis.Client
	secret []byte
}

func (s *RedisSessionStore) Get(r *http.Request, name string) (*sessions.Session, error) {
	return sessions.NewCookieStore(s.secret).Get(r, name)
}

func (s *RedisSessionStore) Save(r *http.Request, w http.ResponseWriter, sess *sessions.Session) error {
	return sessions.NewCookieStore(s.secret).Save(r, w, sess)
}

// Middleware
func (app *App) authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Check session auth for web requests
		session, _ := app.sessions.Get(r, "blog-session")
		if auth, ok := session.Values["authenticated"].(bool); ok && auth {
			next(w, r)
			return
		}

		// Check API key for API requests
		if app.config.API.Enabled {
			apiKey := r.Header.Get("X-API-Key")
			if apiKey == "" {
				apiKey = r.URL.Query().Get("api_key")
			}
			if app.auth.ValidateAPIKey(apiKey) {
				next(w, r)
				return
			}
		}

		// Check if it's an API request
		if strings.HasPrefix(r.URL.Path, "/api/") {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   "Unauthorized",
			})
			return
		}

		http.Redirect(w, r, "/login", http.StatusSeeOther)
	}
}

func (app *App) apiMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !app.config.API.Enabled {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   "API is disabled",
			})
			return
		}

		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-Key")
		
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

// Handlers
func (app *App) homeHandler(w http.ResponseWriter, r *http.Request) {
	posts, err := app.posts.GetAll(10, 0)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"Title": "Blog",
		"Posts": posts,
		"APIEnabled": app.config.API.Enabled,
	}
	if err := app.templates.ExecuteTemplate(w, "index.html", data); err != nil {
		log.Printf("Template error: %v", err)
		http.Error(w, "Template rendering error", http.StatusInternalServerError)
	}
}

func (app *App) loginPageHandler(w http.ResponseWriter, r *http.Request) {
	data := map[string]interface{}{
		"APIEnabled": app.config.API.Enabled,
	}
	if err := app.templates.ExecuteTemplate(w, "login.html", data); err != nil {
		log.Printf("Template error: %v", err)
		http.Error(w, "Template rendering error", http.StatusInternalServerError)
	}
}

func (app *App) loginHandler(w http.ResponseWriter, r *http.Request) {
	var loginReq LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&loginReq); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Message: "Invalid request format",
		})
		return
	}

	user, err := app.auth.Authenticate(loginReq.Username, loginReq.Password)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Message: "Invalid credentials",
		})
		return
	}

	// Create session
	session, _ := app.sessions.Get(r, "blog-session")
	session.Values["authenticated"] = true
	session.Values["user_id"] = user.ID
	session.Save(r, w)

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(LoginResponse{
		Success: true,
		User:    user,
		Token:   "session-created", // In a real app, you might return a JWT token here
	})
}

func (app *App) logoutHandler(w http.ResponseWriter, r *http.Request) {
	session, _ := app.sessions.Get(r, "blog-session")
	session.Values["authenticated"] = false
	session.Save(r, w)
	
	// Check if it's an API request
	if r.Header.Get("Content-Type") == "application/json" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(APIResponse{
			Success: true,
			Data:    "Logged out successfully",
		})
		return
	}
	
	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func (app *App) adminHandler(w http.ResponseWriter, r *http.Request) {
	posts, err := app.posts.GetAll(20, 0)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"Title": "Admin Dashboard",
		"Posts": posts,
		"APIEnabled": app.config.API.Enabled,
	}
	if err := app.templates.ExecuteTemplate(w, "admin.html", data); err != nil {
		log.Printf("Template error: %v", err)
		http.Error(w, "Template rendering error", http.StatusInternalServerError)
	}
}

func (app *App) createPostHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		data := map[string]interface{}{
			"APIEnabled": app.config.API.Enabled,
		}
		if err := app.templates.ExecuteTemplate(w, "editor.html", data); err != nil {
			log.Printf("Template error: %v", err)
			http.Error(w, "Template rendering error", http.StatusInternalServerError)
		}
		return
	}

	session, _ := app.sessions.Get(r, "blog-session")
	userID := session.Values["user_id"].(int)

	post := &Post{
		UserID:    userID,
		Title:     r.FormValue("title"),
		Content:   r.FormValue("content"),
		Slug:      slugify(r.FormValue("title")),
		Published: r.FormValue("published") == "on",
	}

	if err := app.posts.Create(post); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Send event via Turbo Stream
	w.Header().Set("Content-Type", "text/vnd.turbo-stream.html")
	fmt.Fprintf(w, `<turbo-stream action="append" target="posts-list">
		<template>
			<div class="post-item" data-post-id="%d">
				<h3>%s</h3>
				<p>Created just now</p>
			</div>
		</template>
	</turbo-stream>`, post.ID, post.Title)
}

func (app *App) postHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	slug := vars["slug"]

	post, err := app.posts.GetBySlug(slug)
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	data := map[string]interface{}{
		"Title": post.Title,
		"Post":  post,
		"APIEnabled": app.config.API.Enabled,
	}
	if err := app.templates.ExecuteTemplate(w, "post.html", data); err != nil {
		log.Printf("Template error: %v", err)
		http.Error(w, "Template rendering error", http.StatusInternalServerError)
	}
}

// API Handlers
func (app *App) apiPostsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	switch r.Method {
	case "GET":
		// Parse pagination
		page := 1
		perPage := 10
		if p := r.URL.Query().Get("page"); p != "" {
			fmt.Sscanf(p, "%d", &page)
		}
		if pp := r.URL.Query().Get("per_page"); pp != "" {
			fmt.Sscanf(pp, "%d", &perPage)
		}
		
		offset := (page - 1) * perPage
		posts, err := app.posts.GetAll(perPage, offset)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}
		
		total, _ := app.posts.Count()
		totalPages := (total + perPage - 1) / perPage
		
		json.NewEncoder(w).Encode(APIResponse{
			Success: true,
			Data:    posts,
			Meta: &APIMeta{
				Page:       page,
				PerPage:    perPage,
				Total:      total,
				TotalPages: totalPages,
			},
		})
		
	case "POST":
		var post Post
		if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   "Invalid request body",
			})
			return
		}
		
		// Get user from session or API context
		session, _ := app.sessions.Get(r, "blog-session")
		if userID, ok := session.Values["user_id"].(int); ok {
			post.UserID = userID
		} else {
			post.UserID = 1 // Default user for API
		}
		
		post.Slug = slugify(post.Title)
		if err := app.posts.Create(&post); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}
		
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(APIResponse{
			Success: true,
			Data:    post,
		})
	}
}

func (app *App) apiPostHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	idStr := vars["id"]
	
	var id int
	fmt.Sscanf(idStr, "%d", &id)
	
	switch r.Method {
	case "GET":
		post, err := app.posts.GetByID(id)
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   "Post not found",
			})
			return
		}
		
		json.NewEncoder(w).Encode(APIResponse{
			Success: true,
			Data:    post,
		})
		
	case "PUT":
		var post Post
		if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   "Invalid request body",
			})
			return
		}
		
		post.ID = id
		post.Slug = slugify(post.Title)
		if err := app.posts.Update(&post); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}
		
		json.NewEncoder(w).Encode(APIResponse{
			Success: true,
			Data:    post,
		})
		
	case "DELETE":
		if err := app.posts.Delete(id); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}
		
		json.NewEncoder(w).Encode(APIResponse{
			Success: true,
			Data:    "Post deleted successfully",
		})
	}
}

func (app *App) apiLoginHandler(w http.ResponseWriter, r *http.Request) {
	app.loginHandler(w, r) // Reuse the same login handler
}

func (app *App) apiStatusHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"status":  "online",
			"version": "1.0.0",
			"api_enabled": app.config.API.Enabled,
		},
	})
}

// Helper functions
func envOrFile(varName, fileVarName string) (string, bool, error) {
	if p, ok := os.LookupEnv(fileVarName); ok && p != "" {
		if _, err := os.Stat(p); err == nil {
			b, err := os.ReadFile(filepath.Clean(p))
			if err != nil {
				return "", false, err
			}
			return string(b), true, nil
		}
	}
	if v, ok := os.LookupEnv(varName); ok {
		return v, true, nil
	}
	return "", false, nil
}

func loadCAFromEnvOrFile(val string) (*x509.CertPool, error) {
	pool := x509.NewCertPool()
	



	
	if ok := pool.AppendCertsFromPEM([]byte(val)); !ok {
		return nil, fmt.Errorf("invalid CA pem")
		panic("invalid CA pem") // This should not happen in production code
	}
	return pool, nil
}

func initDatabase(config DatabaseConfig) (*sql.DB, error) {
	dsn, ok, err := envOrFile("DSN", "DSN_FILE")
	if err != nil {
		return nil, err
	}
	if !ok && config.DSN != "" {
		dsn = config.DSN
	}
	if dsn == "" {
		return nil, fmt.Errorf("DSN not configured")
	}

	// Handle CA certificate for CockroachDB
	caPEM, ok, err := envOrFile("CA", "CA_CERT_FILE")
	
	if err != nil {
		return nil, err
	}
	if !ok && config.CA != "" {
		caPEM = config.CA
	}

	var db *sql.DB
	if caPEM != "" && config.Driver == "postgres" {
		// CockroachDB with TLS
		caPool, err := loadCAFromEnvOrFile(caPEM)
		if err != nil {
			return nil, err
		}
		
		// Parse DSN and add SSL parameters
		if !strings.Contains(dsn, "sslmode") {
			dsn += "?sslmode=require"
		}
		
		// Register custom TLS config
		tlsConfig := &tls.Config{
			RootCAs: caPool,
		}
		
		// Note: In production, you'd register this TLS config with the driver
		_ = tlsConfig
	}

	db, err = sql.Open(config.Driver, dsn)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}

func slugify(s string) string {
	s = strings.ToLower(s)
	s = strings.ReplaceAll(s, " ", "-")
	s = strings.ReplaceAll(s, "_", "-")
	// Remove special characters
	var result strings.Builder
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			result.WriteRune(r)
		}
	}
	return result.String()
}

func loadConfig() (*Config, error) {
	// Default configuration
	config := &Config{
		Server: ServerConfig{
			Port: "8080",
		},
		Database: DatabaseConfig{
			Driver: "postgres",
		},
		Session: SessionConfig{
			Store:  "cookie",
			Secret: "change-this-secret-key-in-production-min-32-chars",
		},
		Auth: AuthConfig{
			Provider: "hardcoded",
			Username: "admin",
			Password: "admin123",
		},
		API: APIConfig{
			Enabled: true,
			Key:     "your-api-key-here",
			RateLimit: 60,
		},
	}

	// Load from config file if exists
	if data, err := os.ReadFile("config.json"); err == nil {
		if err := json.Unmarshal(data, config); err != nil {
			return nil, err
		}
	}

	// Override with environment variables
	if port := os.Getenv("PORT"); port != "" {
		config.Server.Port = port
	}
	if apiEnabled := os.Getenv("API_ENABLED"); apiEnabled != "" {
		config.API.Enabled = apiEnabled == "true"
	}
	if apiKey := os.Getenv("API_KEY"); apiKey != "" {
		config.API.Key = apiKey
	}

	return config, nil
}

func main() {
	// Initialize gob for session encoding
	gob.Register(&User{})

	config, err := loadConfig()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	app, err := NewApp(config)
	if err != nil {
		log.Fatal("Failed to initialize app:", err)
	}
	defer app.db.Close()

	// Setup routes
	router := mux.NewRouter()
	
	// Static files (for Alpine.js, Hotwire, etc.)
	router.PathPrefix("/static/").Handler(http.StripPrefix("/static/", 
		http.FileServer(http.Dir("./static/"))))

	// Public routes
	router.HandleFunc("/", app.homeHandler).Methods("GET")
	router.HandleFunc("/login", app.loginPageHandler).Methods("GET")
	router.HandleFunc("/login", app.loginHandler).Methods("POST")
	router.HandleFunc("/logout", app.logoutHandler).Methods("POST")
	router.HandleFunc("/posts/{slug}", app.postHandler).Methods("GET")
	
	// API routes (with middleware to check if API is enabled)
	api := router.PathPrefix("/api").Subrouter()
	api.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			app.apiMiddleware(next.ServeHTTP)(w, r)
		})
	})
	
	// Public API endpoints
	api.HandleFunc("/status", app.apiStatusHandler).Methods("GET")
	api.HandleFunc("/login", app.apiLoginHandler).Methods("POST")
	api.HandleFunc("/posts", app.apiPostsHandler).Methods("GET")
	api.HandleFunc("/posts/{id}", app.apiPostHandler).Methods("GET")
	
	// Protected API endpoints
	api.HandleFunc("/posts", app.authMiddleware(app.apiPostsHandler)).Methods("POST")
	api.HandleFunc("/posts/{id}", app.authMiddleware(app.apiPostHandler)).Methods("PUT", "DELETE")
	api.HandleFunc("/logout", app.authMiddleware(app.logoutHandler)).Methods("POST")
	
	// Admin routes (protected)
	admin := router.PathPrefix("/admin").Subrouter()
	admin.HandleFunc("", app.authMiddleware(app.adminHandler)).Methods("GET")
	admin.HandleFunc("/posts/new", app.authMiddleware(app.createPostHandler)).Methods("GET", "POST")
	
	// WebSocket endpoint for live updates
	router.HandleFunc("/ws", app.websocketHandler)

	log.Printf("Server starting on port %s", config.Server.Port)
	log.Printf("API Enabled: %v", config.API.Enabled)
	if config.API.Enabled {
		log.Printf("API Key: %s", config.API.Key)
	}
	log.Fatal(http.ListenAndServe(":"+config.Server.Port, router))
}

// Template rendering helper
func (app *App) renderTemplate(w http.ResponseWriter, name string, data interface{}) {
	if app.templates == nil {
		// Fallback to embedded templates if file templates not loaded
		app.renderEmbeddedTemplate(w, name, data)
		return
	}
	if err := app.templates.ExecuteTemplate(w, name, data); err != nil {
		log.Printf("Template error: %v", err)
		http.Error(w, "Template rendering error", http.StatusInternalServerError)
	}
}

func (app *App) renderEmbeddedTemplate(w http.ResponseWriter, name string, data interface{}) {
	// Embedded templates as fallback
	tmplStr := ""
	switch name {
	case "index.html":
		tmplStr = indexHTMLTemplate
	case "login.html":
		tmplStr = loginHTMLTemplate
	case "admin.html":
		tmplStr = adminHTMLTemplate
	case "editor.html":
		tmplStr = editorHTMLTemplate
	case "post.html":
		tmplStr = postHTMLTemplate
	default:
		http.Error(w, "Template not found", http.StatusNotFound)
		return
	}
	
	tmpl, err := template.New(name).Parse(tmplStr)
	if err != nil {
		http.Error(w, "Template parse error", http.StatusInternalServerError)
		return
	}
	
	if err := tmpl.Execute(w, data); err != nil {
		http.Error(w, "Template execution error", http.StatusInternalServerError)
	}
}

// Embedded template strings (fallback if template files are not found)
const indexHTMLTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{.Title}}</title>
    <script src="https://unpkg.com/@hotwired/turbo@7/dist/turbo.es2017-umd.js"></script>
    <script src="https://unpkg.com/alpinejs@3/dist/cdn.min.js" defer></script>
    <link href="https://cdn.jsdelivr.net/npm/daisyui@4/dist/full.min.css" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-base-200">
    <div class="navbar bg-base-100 shadow-lg">
        <div class="flex-1">
            <a href="/" class="btn btn-ghost text-xl">Blog</a>
        </div>
        <div class="flex-none">
            <ul class="menu menu-horizontal px-1">
                <li><a href="/">Home</a></li>
                <li><a href="/admin">Admin</a></li>
                <li><a href="/login">Login</a></li>
            </ul>
        </div>
    </div>
    <div class="container mx-auto mt-8 px-4">
        <h1 class="text-4xl font-bold mb-8">Welcome to Our Blog</h1>
        <div class="grid gap-6">
            {{range .Posts}}
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <h2 class="card-title">{{.Title}}</h2>
                    <p>{{.Content}}</p>
                    <div class="card-actions justify-end">
                        <a href="/posts/{{.Slug}}" class="btn btn-primary">Read More</a>
                    </div>
                </div>
            </div>
            {{end}}
        </div>
    </div>
</body>
</html>`

const loginHTMLTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
    <script src="https://unpkg.com/alpinejs@3/dist/cdn.min.js" defer></script>
    <link href="https://cdn.jsdelivr.net/npm/daisyui@4/dist/full.min.css" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-primary/20 to-secondary/20 min-h-screen">
    <div class="container mx-auto flex items-center justify-center min-h-screen">
        <div class="card w-96 bg-base-100 shadow-2xl" x-data="loginForm()">
            <div class="card-body">
                <h2 class="card-title text-2xl mb-4 justify-center">Login</h2>
                <div x-show="error" class="alert alert-error mb-4">
                    <span x-text="error"></span>
                </div>
                <form @submit.prevent="submitLogin">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Username</span>
                        </label>
                        <input type="text" x-model="username" class="input input-bordered" required>
                    </div>
                    <div class="form-control mt-4">
                        <label class="label">
                            <span class="label-text">Password</span>
                        </label>
                        <input type="password" x-model="password" class="input input-bordered" required>
                    </div>
                    <div class="form-control mt-6">
                        <button type="submit" class="btn btn-primary" :disabled="loading">
                            <span x-show="!loading">Login</span>
                            <span x-show="loading">Loading...</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <script>
        function loginForm() {
            return {
                username: '',
                password: '',
                loading: false,
                error: '',
                async submitLogin() {
                    this.loading = true;
                    this.error = '';
                    try {
                        const response = await fetch('/login', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({username: this.username, password: this.password})
                        });
                        const data = await response.json();
                        if (data.success) {
                            window.location.href = '/admin';
                        } else {
                            this.error = data.message || 'Login failed';
                        }
                    } catch (err) {
                        this.error = 'Network error';
                    } finally {
                        this.loading = false;
                    }
                }
            }
        }
    </script>
</body>
</html>`

const adminHTMLTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
    <script src="https://unpkg.com/@hotwired/turbo@7/dist/turbo.es2017-umd.js"></script>
    <script src="https://unpkg.com/alpinejs@3/dist/cdn.min.js" defer></script>
    <link href="https://cdn.jsdelivr.net/npm/daisyui@4/dist/full.min.css" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-base-200">
    <div class="navbar bg-base-100 shadow-lg">
        <div class="flex-1">
            <a class="btn btn-ghost text-xl">Admin Dashboard</a>
        </div>
        <div class="flex-none">
            <a href="/admin/posts/new" class="btn btn-primary">New Post</a>
            <form method="POST" action="/logout" class="inline ml-2">
                <button type="submit" class="btn btn-ghost">Logout</button>
            </form>
        </div>
    </div>
    <div class="container mx-auto mt-8 px-4">
        <h1 class="text-3xl font-bold mb-6">Posts Management</h1>
        <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
            <table class="table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {{range .Posts}}
                    <tr>
                        <td>{{.Title}}</td>
                        <td>
                            {{if .Published}}
                            <span class="badge badge-success">Published</span>
                            {{else}}
                            <span class="badge badge-warning">Draft</span>
                            {{end}}
                        </td>
                        <td>{{.CreatedAt.Format "Jan 2, 2006"}}</td>
                        <td>
                            <a href="/posts/{{.Slug}}" class="btn btn-sm">View</a>
                        </td>
                    </tr>
                    {{end}}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`

const editorHTMLTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Post</title>
    <script src="https://unpkg.com/@hotwired/turbo@7/dist/turbo.es2017-umd.js"></script>
    <script src="https://unpkg.com/alpinejs@3/dist/cdn.min.js" defer></script>
    <link href="https://cdn.jsdelivr.net/npm/daisyui@4/dist/full.min.css" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-base-200">
    <div class="navbar bg-base-100 shadow-lg">
        <div class="flex-1">
            <a href="/admin" class="btn btn-ghost text-xl">← Back to Dashboard</a>
        </div>
    </div>
    <div class="container mx-auto mt-8 px-4 max-w-4xl">
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h2 class="card-title text-2xl mb-4">Create New Post</h2>
                <form method="POST" action="/admin/posts/new">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Title</span>
                        </label>
                        <input type="text" name="title" class="input input-bordered" required>
                    </div>
                    <div class="form-control mt-4">
                        <label class="label">
                            <span class="label-text">Content</span>
                        </label>
                        <textarea name="content" class="textarea textarea-bordered h-64" required></textarea>
                    </div>
                    <div class="form-control mt-4">
                        <label class="label cursor-pointer">
                            <span class="label-text">Publish immediately</span>
                            <input type="checkbox" name="published" class="checkbox checkbox-primary">
                        </label>
                    </div>
                    <div class="card-actions justify-end mt-6">
                        <button type="submit" class="btn btn-primary">Save Post</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</body>
</html>`

const postHTMLTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{.Title}}</title>
    <script src="https://unpkg.com/@hotwired/turbo@7/dist/turbo.es2017-umd.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/daisyui@4/dist/full.min.css" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-base-200">
    <div class="navbar bg-base-100 shadow-lg">
        <div class="flex-1">
            <a href="/" class="btn btn-ghost text-xl">← Back to Blog</a>
        </div>
    </div>
    <article class="container mx-auto mt-8 px-4 max-w-4xl">
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h1 class="text-4xl font-bold mb-4">{{.Post.Title}}</h1>
                <div class="text-sm text-base-content/70 mb-6">
                    <span>By {{.Post.Author}}</span> • 
                    <time>{{.Post.CreatedAt.Format "January 2, 2006"}}</time>
                </div>
                <div class="prose prose-lg max-w-none">
                    {{.Post.Content}}
                </div>
            </div>
        </div>
    </article>
</body>
</html>`

func (app *App) websocketHandler(w http.ResponseWriter, r *http.Request) {
	// Server-Sent Events for real-time updates
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}
	
	// Send initial connection event
	fmt.Fprintf(w, "event: connected\ndata: {\"status\": \"connected\", \"time\": \"%s\"}\n\n", 
		time.Now().Format(time.RFC3339))
	flusher.Flush()
	
	// Keep connection alive with periodic pings
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			fmt.Fprintf(w, "event: ping\ndata: {\"time\": \"%s\"}\n\n", 
				time.Now().Format(time.RFC3339))
			flusher.Flush()
		case <-r.Context().Done():
			return
		}
	}
}