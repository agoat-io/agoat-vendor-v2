package main

import (
	"database/sql"
	"encoding/gob"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	_ "github.com/lib/pq"
)

// Updated structs for multitenancy
type User struct {
	ID          string    `json:"id"`
	Username    string    `json:"username"`
	Email       string    `json:"email"`
	CustomerID  string    `json:"customer_id,omitempty"`
	SiteID      string    `json:"site_id,omitempty"`
	Role        string    `json:"role,omitempty"`
	Status      string    `json:"status,omitempty"`
	ExternalID  string    `json:"external_id,omitempty"`
	IAMProvider string    `json:"iam_provider,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type Post struct {
	ID          string     `json:"id"`
	UserID      string     `json:"user_id"`
	SiteID      string     `json:"site_id"`
	Title       string     `json:"title"`
	Content     string     `json:"content"`
	Slug        string     `json:"slug"`
	Status      string     `json:"status"`
	Published   bool       `json:"published"`
	PublishedAt *time.Time `json:"published_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	Author      string     `json:"author"`
}

type Site struct {
	ID         string    `json:"id"`
	CustomerID string    `json:"customer_id"`
	Name       string    `json:"name"`
	Slug       string    `json:"slug"`
	Status     string    `json:"status"`
	Template   string    `json:"template"`
	Settings   string    `json:"settings"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type Customer struct {
	ID               string    `json:"id"`
	Name             string    `json:"name"`
	Email            string    `json:"email"`
	Status           string    `json:"status"`
	SubscriptionPlan string    `json:"subscription_plan"`
	MaxSites         int       `json:"max_sites"`
	MaxStorageGB     int       `json:"max_storage_gb"`
	MaxBandwidthGB   int       `json:"max_bandwidth_gb"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

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
	Secret string `json:"secret"`
}

type AuthConfig struct {
	Provider string `json:"provider"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type APIConfig struct {
	Enabled   bool   `json:"enabled"`
	Key       string `json:"key"`
	RateLimit int    `json:"rateLimit"`
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

// Updated repository interfaces
type PostRepository interface {
	Create(post *Post) error
	Update(post *Post) error
	Delete(id string) error
	GetByID(id string) (*Post, error)
	GetBySlug(slug string, siteID string) (*Post, error)
	GetAll(limit, offset int, siteID string) ([]Post, error)
	GetPublished(limit, offset int, siteID string) ([]Post, error)
	Count(siteID string) (int, error)
	CountPublished(siteID string) (int, error)
}

type SiteRepository interface {
	GetByID(id string) (*Site, error)
	GetBySlug(slug string, customerID string) (*Site, error)
	GetAll(customerID string) ([]Site, error)
	Create(site *Site) error
	Update(site *Site) error
	Delete(id string) error
}

type CustomerRepository interface {
	GetByID(id string) (*Customer, error)
	GetByEmail(email string) (*Customer, error)
	Create(customer *Customer) error
	Update(customer *Customer) error
}

// Updated repositories
type SQLPostRepository struct {
	db *sql.DB
}

func (r *SQLPostRepository) Create(post *Post) error {
	query := `
		INSERT INTO posts (user_id, site_id, title, content, slug, status, published, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id`
	now := time.Now()
	err := r.db.QueryRow(query, post.UserID, post.SiteID, post.Title, post.Content,
		post.Slug, post.Status, post.Published, now, now).Scan(&post.ID)
	return err
}

func (r *SQLPostRepository) Update(post *Post) error {
	query := `
		UPDATE posts SET title = $1, content = $2, slug = $3, 
		status = $4, published = $5, updated_at = $6 WHERE id = $7`
	_, err := r.db.Exec(query, post.Title, post.Content, post.Slug,
		post.Status, post.Published, time.Now(), post.ID)
	return err
}

func (r *SQLPostRepository) Delete(id string) error {
	_, err := r.db.Exec("DELETE FROM posts WHERE id = $1", id)
	return err
}

func (r *SQLPostRepository) GetByID(id string) (*Post, error) {
	post := &Post{}
	query := `
		SELECT p.id, p.user_id, p.site_id, p.title, p.content, p.slug, p.status, p.published, 
		p.published_at, p.created_at, p.updated_at, COALESCE(u.username, 'Anonymous')
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
		WHERE p.id = $1`
	err := r.db.QueryRow(query, id).Scan(&post.ID, &post.UserID, &post.SiteID, &post.Title,
		&post.Content, &post.Slug, &post.Status, &post.Published, &post.PublishedAt,
		&post.CreatedAt, &post.UpdatedAt, &post.Author)
	return post, err
}

func (r *SQLPostRepository) GetBySlug(slug string, siteID string) (*Post, error) {
	post := &Post{}
	query := `
		SELECT p.id, p.user_id, p.site_id, p.title, p.content, p.slug, p.status, p.published, 
		p.published_at, p.created_at, p.updated_at, COALESCE(u.username, 'Anonymous')
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
		WHERE p.slug = $1 AND p.site_id = $2`
	err := r.db.QueryRow(query, slug, siteID).Scan(&post.ID, &post.UserID, &post.SiteID, &post.Title,
		&post.Content, &post.Slug, &post.Status, &post.Published, &post.PublishedAt,
		&post.CreatedAt, &post.UpdatedAt, &post.Author)
	return post, err
}

func (r *SQLPostRepository) GetAll(limit, offset int, siteID string) ([]Post, error) {
	query := `
		SELECT p.id, p.user_id, p.site_id, p.title, p.content, p.slug, p.status, p.published, 
		p.published_at, p.created_at, p.updated_at, COALESCE(u.username, 'Anonymous')
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
		WHERE p.site_id = $1
		ORDER BY p.created_at DESC
		LIMIT $2 OFFSET $3`
	rows, err := r.db.Query(query, siteID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		var post Post
		err := rows.Scan(&post.ID, &post.UserID, &post.SiteID, &post.Title, &post.Content,
			&post.Slug, &post.Status, &post.Published, &post.PublishedAt,
			&post.CreatedAt, &post.UpdatedAt, &post.Author)
		if err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}
	return posts, nil
}

func (r *SQLPostRepository) GetPublished(limit, offset int, siteID string) ([]Post, error) {
	query := `
		SELECT p.id, p.user_id, p.site_id, p.title, p.content, p.slug, p.status, p.published, 
		p.published_at, p.created_at, p.updated_at, COALESCE(u.username, 'Anonymous')
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
		WHERE p.site_id = $1 AND p.published = true
		ORDER BY p.created_at DESC
		LIMIT $2 OFFSET $3`
	rows, err := r.db.Query(query, siteID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		var post Post
		err := rows.Scan(&post.ID, &post.UserID, &post.SiteID, &post.Title, &post.Content,
			&post.Slug, &post.Status, &post.Published, &post.PublishedAt,
			&post.CreatedAt, &post.UpdatedAt, &post.Author)
		if err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}
	return posts, nil
}

func (r *SQLPostRepository) Count(siteID string) (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM posts WHERE site_id = $1", siteID).Scan(&count)
	return count, err
}

func (r *SQLPostRepository) CountPublished(siteID string) (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM posts WHERE site_id = $1 AND published = true", siteID).Scan(&count)
	return count, err
}

// Site repository implementation
type SQLSiteRepository struct {
	db *sql.DB
}

func (r *SQLSiteRepository) GetByID(id string) (*Site, error) {
	site := &Site{}
	query := `SELECT id, customer_id, name, slug, status, template, settings, created_at, updated_at FROM sites WHERE id = $1`
	err := r.db.QueryRow(query, id).Scan(&site.ID, &site.CustomerID, &site.Name, &site.Slug, &site.Status, &site.Template, &site.Settings, &site.CreatedAt, &site.UpdatedAt)
	return site, err
}

func (r *SQLSiteRepository) GetBySlug(slug string, customerID string) (*Site, error) {
	site := &Site{}
	query := `SELECT id, customer_id, name, slug, status, template, settings, created_at, updated_at FROM sites WHERE slug = $1 AND customer_id = $2`
	err := r.db.QueryRow(query, slug, customerID).Scan(&site.ID, &site.CustomerID, &site.Name, &site.Slug, &site.Status, &site.Template, &site.Settings, &site.CreatedAt, &site.UpdatedAt)
	return site, err
}

func (r *SQLSiteRepository) GetAll(customerID string) ([]Site, error) {
	query := `SELECT id, customer_id, name, slug, status, template, settings, created_at, updated_at FROM sites WHERE customer_id = $1 ORDER BY created_at DESC`
	rows, err := r.db.Query(query, customerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sites []Site
	for rows.Next() {
		var site Site
		err := rows.Scan(&site.ID, &site.CustomerID, &site.Name, &site.Slug, &site.Status, &site.Template, &site.Settings, &site.CreatedAt, &site.UpdatedAt)
		if err != nil {
			return nil, err
		}
		sites = append(sites, site)
	}
	return sites, nil
}

func (r *SQLSiteRepository) Create(site *Site) error {
	query := `INSERT INTO sites (customer_id, name, slug, status, template, settings, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`
	now := time.Now()
	err := r.db.QueryRow(query, site.CustomerID, site.Name, site.Slug, site.Status, site.Template, site.Settings, now, now).Scan(&site.ID)
	return err
}

func (r *SQLSiteRepository) Update(site *Site) error {
	query := `UPDATE sites SET name = $1, slug = $2, status = $3, template = $4, settings = $5, updated_at = $6 WHERE id = $7`
	_, err := r.db.Exec(query, site.Name, site.Slug, site.Status, site.Template, site.Settings, time.Now(), site.ID)
	return err
}

func (r *SQLSiteRepository) Delete(id string) error {
	_, err := r.db.Exec("DELETE FROM sites WHERE id = $1", id)
	return err
}

// Main app structure
type App struct {
	config   *Config
	db       *sql.DB
	posts    PostRepository
	sites    SiteRepository
	sessions *sessions.CookieStore
}

func NewApp(config *Config) (*App, error) {
	db, err := initDatabase(config.Database)
	if err != nil {
		return nil, err
	}

	app := &App{
		config:   config,
		db:       db,
		posts:    &SQLPostRepository{db: db},
		sites:    &SQLSiteRepository{db: db},
		sessions: sessions.NewCookieStore([]byte(config.Session.Secret)),
	}

	return app, nil
}

// Helper functions
func slugify(s string) string {
	s = strings.ToLower(s)
	s = strings.ReplaceAll(s, " ", "-")
	s = strings.ReplaceAll(s, "_", "-")
	var result strings.Builder
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			result.WriteRune(r)
		}
	}
	return result.String()
}

// Database initialization
func initDatabase(config DatabaseConfig) (*sql.DB, error) {
	dsn := os.Getenv("DSN")
	if dsn == "" {
		return nil, fmt.Errorf("DSN environment variable is required")
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}

// Load configuration
func loadConfig() (*Config, error) {
	config := &Config{
		Server: ServerConfig{Port: "8080"},
		Database: DatabaseConfig{
			Driver: "postgres",
		},
		Session: SessionConfig{
			Secret: "change-this-secret-key-in-production-min-32-chars",
		},
		Auth: AuthConfig{
			Provider: "hardcoded",
			Username: "admin",
			Password: "admin123",
		},
		API: APIConfig{
			Enabled:   true,
			Key:       "your-api-key-here",
			RateLimit: 60,
		},
	}

	if port := os.Getenv("PORT"); port != "" {
		config.Server.Port = port
	}

	return config, nil
}

// Handler functions
func (app *App) statusHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	status := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().Format(time.RFC3339),
		"version":   "2.0.0",
		"api": map[string]interface{}{
			"enabled": app.config.API.Enabled,
		},
	}

	json.NewEncoder(w).Encode(APIResponse{
		Success: true,
		Data:    status,
	})
}

func (app *App) sitesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case "GET":
		// For now, get the default customer's sites
		customerID := "81b04b17-cb1d-4664-a158-c4f9b66a39b9" // Default customer UUID

		sites, err := app.sites.GetAll(customerID)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}

		json.NewEncoder(w).Encode(APIResponse{
			Success: true,
			Data:    sites,
		})

	case "POST":
		var site Site
		if err := json.NewDecoder(r.Body).Decode(&site); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   "Invalid request body",
			})
			return
		}

		// Set defaults
		if site.Status == "" {
			site.Status = "active"
		}
		if site.Template == "" {
			site.Template = "default"
		}
		if site.Settings == "" {
			site.Settings = "{}"
		}
		if site.Slug == "" {
			site.Slug = slugify(site.Name)
		}

		// For now, use a default customer ID
		site.CustomerID = "81b04b17-cb1d-4664-a158-c4f9b66a39b9"

		if err := app.sites.Create(&site); err != nil {
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
			Data:    site,
		})
	}
}

func (app *App) siteHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	id := vars["id"]

	switch r.Method {
	case "GET":
		site, err := app.sites.GetByID(id)
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   "Site not found",
			})
			return
		}

		json.NewEncoder(w).Encode(APIResponse{
			Success: true,
			Data:    site,
		})

	case "PUT":
		var site Site
		if err := json.NewDecoder(r.Body).Decode(&site); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   "Invalid request body",
			})
			return
		}

		site.ID = id
		if site.Slug == "" {
			site.Slug = slugify(site.Name)
		}

		if err := app.sites.Update(&site); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}

		json.NewEncoder(w).Encode(APIResponse{
			Success: true,
			Data:    site,
		})

	case "DELETE":
		if err := app.sites.Delete(id); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}

		json.NewEncoder(w).Encode(APIResponse{
			Success: true,
			Data:    "Site deleted successfully",
		})
	}
}

func (app *App) postsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	siteID := vars["siteId"]

	switch r.Method {
	case "GET":
		page := 1
		perPage := 10
		publishedOnly := false

		if p := r.URL.Query().Get("page"); p != "" {
			if val, err := strconv.Atoi(p); err == nil {
				page = val
			}
		}
		if pp := r.URL.Query().Get("per_page"); pp != "" {
			if val, err := strconv.Atoi(pp); err == nil {
				perPage = val
			}
		}
		if published := r.URL.Query().Get("published"); published == "true" {
			publishedOnly = true
		}

		offset := (page - 1) * perPage
		var posts []Post
		var err error
		var total int

		if publishedOnly {
			posts, err = app.posts.GetPublished(perPage, offset, siteID)
			total, _ = app.posts.CountPublished(siteID)
		} else {
			posts, err = app.posts.GetAll(perPage, offset, siteID)
			total, _ = app.posts.Count(siteID)
		}

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}

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

		post.SiteID = siteID
		post.UserID = "default-user-id" // This should come from auth
		if post.Status == "" {
			post.Status = "draft"
		}
		if post.Slug == "" {
			post.Slug = slugify(post.Title)
		}

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

func (app *App) postHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	id := vars["id"]
	siteID := vars["siteId"]

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

		// Verify the post belongs to the specified site
		if post.SiteID != siteID {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   "Post not found in this site",
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
		post.SiteID = siteID
		if post.Slug == "" {
			post.Slug = slugify(post.Title)
		}

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

func (app *App) postBySlugHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	slug := vars["slug"]
	siteID := vars["siteId"]

	post, err := app.posts.GetBySlug(slug, siteID)
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
}

func main() {
	gob.Register(&User{})

	config, err := loadConfig()
	if err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		os.Exit(1)
	}

	app, err := NewApp(config)
	if err != nil {
		fmt.Printf("Failed to initialize app: %v\n", err)
		os.Exit(1)
	}
	defer app.db.Close()

	router := mux.NewRouter()

	// API routes
	api := router.PathPrefix("/api").Subrouter()

	// CORS middleware
	api.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	})

	// API endpoints
	api.HandleFunc("/status", app.statusHandler).Methods("GET")
	api.HandleFunc("/sites", app.sitesHandler).Methods("GET", "POST")
	api.HandleFunc("/sites/{id}", app.siteHandler).Methods("GET", "PUT", "DELETE")
	api.HandleFunc("/sites/{siteId}/posts", app.postsHandler).Methods("GET", "POST")
	api.HandleFunc("/sites/{siteId}/posts/{id}", app.postHandler).Methods("GET", "PUT", "DELETE")
	api.HandleFunc("/sites/{siteId}/posts/slug/{slug}", app.postBySlugHandler).Methods("GET")

	fmt.Printf("Server starting on port %s\n", config.Server.Port)
	if err := http.ListenAndServe(":"+config.Server.Port, router); err != nil {
		fmt.Printf("HTTP server error: %v\n", err)
		os.Exit(1)
	}
}
