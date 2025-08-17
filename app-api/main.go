package main

import (
	"crypto/tls"
	"crypto/x509"
	"database/sql"
	"encoding/gob"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

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
	GetPublished(limit, offset int) ([]Post, error)
	GetBySlug(slug string) (*Post, error)
	Count() (int, error)
	CountPublished() (int, error)
}

type SessionStore interface {
	Get(r *http.Request, name string) (*sessions.Session, error)
	Save(r *http.Request, w http.ResponseWriter, s *sessions.Session) error
}

// ----- logging -----

func logJSON(level, category, message string, fields map[string]interface{}) {
	entry := map[string]interface{}{
		"ts":       time.Now().Format(time.RFC3339Nano),
		"level":    level,
		"category": category,
		"message":  message,
	}
	for k, v := range fields {
		entry[k] = v
	}
	b, _ := json.Marshal(entry)
	fmt.Println(string(b))
}

func logInfo(category, message string, fields map[string]interface{})  { logJSON("info", category, message, fields) }
func logWarn(category, message string, fields map[string]interface{})  { logJSON("warn", category, message, fields) }
func logError(category, message string, fields map[string]interface{}) { logJSON("error", category, message, fields) }
func logFatal(category, message string, fields map[string]interface{}) {
	logJSON("fatal", category, message, fields)
	os.Exit(1)
}

// ----- auth -----

type HardcodedAuth struct {
	username string
	password string
	apiKey   string
	db       *sql.DB
}

func (h *HardcodedAuth) Authenticate(username, password string) (*User, error) {
	if username != h.username || password != h.password {
		return nil, fmt.Errorf("invalid credentials")
	}
	u := &User{}
	err := h.db.QueryRow(`SELECT id, username, email, created_at FROM users WHERE username = $1`, h.username).
		Scan(&u.ID, &u.Username, &u.Email, &u.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("user not found in db")
	}
	return u, nil
}

func (h *HardcodedAuth) GetUser(id int) (*User, error) {
	u := &User{}
	err := h.db.QueryRow(`SELECT id, username, email, created_at FROM users WHERE id = $1`, id).
		Scan(&u.ID, &u.Username, &u.Email, &u.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}
	return u, nil
}

func (h *HardcodedAuth) ValidateAPIKey(key string) bool {
	return h.apiKey != "" && h.apiKey == key
}

// ----- posts repo -----

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

func (r *SQLPostRepository) GetPublished(limit, offset int) ([]Post, error) {
	query := `
		SELECT p.id, p.user_id, p.title, p.content, p.slug, p.published, 
		p.created_at, p.updated_at, COALESCE(u.username, 'Anonymous')
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
		WHERE p.published = true
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

func (r *SQLPostRepository) CountPublished() (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM posts WHERE published = true").Scan(&count)
	return count, err
}

// ----- app -----

type App struct {
	config   *Config
	db       *sql.DB
	auth     Authenticator
	posts    PostRepository
	sessions SessionStore
}

func NewApp(config *Config) (*App, error) {
	db, err := initDatabase(config.Database)
	if err != nil {
		return nil, err
	}

	var auth Authenticator
	switch config.Auth.Provider {
	case "hardcoded":
		auth = &HardcodedAuth{
			username: config.Auth.Username,
			password: config.Auth.Password,
			apiKey:   config.API.Key,
			db:       db,
		}
	default:
		auth = &HardcodedAuth{
			username: "admin",
			password: "admin123",
			apiKey:   config.API.Key,
			db:       db,
		}
	}

	var sessionStore SessionStore
	sessionStore = sessions.NewCookieStore([]byte(config.Session.Secret))

	app := &App{
		config:   config,
		db:       db,
		auth:     auth,
		posts:    &SQLPostRepository{db: db},
		sessions: sessionStore,
	}

	if err := app.initSchema(); err != nil {
		return nil, err
	}
	if err := app.ensureDefaultUser(); err != nil {
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

func (app *App) ensureDefaultUser() error {
	username := app.config.Auth.Username
	if username == "" {
		username = "admin"
	}
	email := username + "@example.com"
	pw := app.config.Auth.Password
	if pw == "" {
		pw = "admin123"
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	_, err = app.db.Exec(
		`INSERT INTO users (username, email, password_hash) 
         VALUES ($1, $2, $3)
         ON CONFLICT (username) DO NOTHING`,
		username, email, string(hash),
	)
	return err
}

// ----- middleware -----

func (app *App) authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, _ := app.sessions.Get(r, "blog-session")
		if auth, ok := session.Values["authenticated"].(bool); ok && auth {
			next(w, r)
			return
		}
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
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(APIResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		logWarn("business", "Unauthorized API access", map[string]interface{}{
			"path":   r.URL.Path,
			"method": r.Method,
			"ip":     r.RemoteAddr,
		})
	}
}

func (app *App) apiMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !app.config.API.Enabled {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			_ = json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   "API is disabled",
			})
			logWarn("business", "API disabled", map[string]interface{}{
				"path":   r.URL.Path,
				"method": r.Method,
			})
			return
		}
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

// ----- handlers (REST only) -----

// Missing apiStatusHandler - this was the main error
func (app *App) apiStatusHandler(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers for status
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	
	// Handle OPTIONS preflight request
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	status := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().Format(time.RFC3339),
		"version":   "1.0.0",
		"api": map[string]interface{}{
			"enabled": app.config.API.Enabled,
		},
	}
	_ = json.NewEncoder(w).Encode(APIResponse{
		Success: true,
		Data:    status,
	})
}

func (app *App) loginHandler(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers for login
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	
	// Handle OPTIONS preflight request
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	
	var loginReq LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&loginReq); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Message: "Invalid request format",
		})
		logWarn("business", "Invalid login request format", map[string]interface{}{"error": err.Error()})
		return
	}
	user, err := app.auth.Authenticate(loginReq.Username, loginReq.Password)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Message: "Invalid credentials",
		})
		logWarn("business", "Invalid credentials", map[string]interface{}{"username": loginReq.Username})
		return
	}
	session, _ := app.sessions.Get(r, "blog-session")
	session.Values["authenticated"] = true
	session.Values["user_id"] = user.ID
	_ = session.Save(r, w)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(LoginResponse{
		Success: true,
		User:    user,
		Token:   "session-created",
	})
	logInfo("business", "User login", map[string]interface{}{"user_id": user.ID, "username": user.Username})
}

func (app *App) logoutHandler(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers for logout
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	
	// Handle OPTIONS preflight request
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	
	session, _ := app.sessions.Get(r, "blog-session")
	session.Values["authenticated"] = false
	_ = session.Save(r, w)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(APIResponse{
		Success: true,
		Data:    "Logged out successfully",
	})
	logInfo("business", "User logout (API)", map[string]interface{}{})
}

func (app *App) apiPostsHandler(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers for posts
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	
	// Handle OPTIONS preflight request
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	switch r.Method {
	case "GET":
		page := 1
		perPage := 10
		publishedOnly := false
		
		if p := r.URL.Query().Get("page"); p != "" {
			fmt.Sscanf(p, "%d", &page)
		}
		if pp := r.URL.Query().Get("per_page"); pp != "" {
			fmt.Sscanf(pp, "%d", &perPage)
		}
		if published := r.URL.Query().Get("published"); published == "true" {
			publishedOnly = true
		}
		
		offset := (page - 1) * perPage
		var posts []Post
		var err error
		var total int
		
		if publishedOnly {
			posts, err = app.posts.GetPublished(perPage, offset)
			total, _ = app.posts.CountPublished()
		} else {
			posts, err = app.posts.GetAll(perPage, offset)
			total, _ = app.posts.Count()
		}
		
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_ = json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   err.Error(),
			})
			logError("technical", "GetAll posts failed", map[string]interface{}{"error": err.Error()})
			return
		}
		
		totalPages := (total + perPage - 1) / perPage
		_ = json.NewEncoder(w).Encode(APIResponse{
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
			_ = json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   "Invalid request body",
			})
			logWarn("business", "Invalid post body", map[string]interface{}{"error": err.Error()})
			return
		}
		session, _ := app.sessions.Get(r, "blog-session")
		if userID, ok := session.Values["user_id"].(int); ok {
			post.UserID = userID
		} else {
			post.UserID = 1
		}
		post.Slug = slugify(post.Title)
		if err := app.posts.Create(&post); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_ = json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   err.Error(),
			})
			logError("technical", "Post create failed", map[string]interface{}{"error": err.Error(), "user_id": post.UserID})
			return
		}
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(APIResponse{
			Success: true,
			Data:    post,
		})
		logInfo("business", "Post created (API)", map[string]interface{}{"post_id": post.ID, "user_id": post.UserID})
	}
}

func (app *App) apiPostHandler(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers for individual post
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	
	// Handle OPTIONS preflight request
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	idStr := vars["id"]
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(APIResponse{
			Success: false,
			Error:   "Invalid post ID",
		})
		return
	}
	switch r.Method {
	case "GET":
		post, err := app.posts.GetByID(id)
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			_ = json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   "Post not found",
			})
			logWarn("business", "Post not found (API)", map[string]interface{}{"post_id": id})
			return
		}
		_ = json.NewEncoder(w).Encode(APIResponse{
			Success: true,
			Data:    post,
		})
	case "PUT":
		var post Post
		if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   "Invalid request body",
			})
			logWarn("business", "Invalid post body (PUT)", map[string]interface{}{"error": err.Error()})
			return
		}
		post.ID = id
		post.Slug = slugify(post.Title)
		if err := app.posts.Update(&post); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_ = json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   err.Error(),
			})
			logError("technical", "Post update failed", map[string]interface{}{"error": err.Error(), "post_id": id})
			return
		}
		_ = json.NewEncoder(w).Encode(APIResponse{
			Success: true,
			Data:    post,
		})
		logInfo("business", "Post updated", map[string]interface{}{"post_id": id})
	case "DELETE":
		if err := app.posts.Delete(id); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_ = json.NewEncoder(w).Encode(APIResponse{
				Success: false,
				Error:   err.Error(),
			})
			logError("technical", "Post delete failed", map[string]interface{}{"error": err.Error(), "post_id": id})
			return
		}
		_ = json.NewEncoder(w).Encode(APIResponse{
			Success: true,
			Data:    "Post deleted successfully",
		})
		logInfo("business", "Post deleted", map[string]interface{}{"post_id": id})
	}
}

// ----- infra helpers -----

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
	caPEM, ok, err := envOrFile("CA", "CA_CERT_FILE")
	if err != nil {
		return nil, err
	}
	if !ok && config.CA != "" {
		caPEM = config.CA
	}
	if caPEM != "" && config.Driver == "postgres" {
		caPool, err := loadCAFromEnvOrFile(caPEM)
		if err != nil {
			return nil, err
		}
		if !strings.Contains(dsn, "sslmode") {
			dsn += "?sslmode=require"
		}
		_ = (&tls.Config{RootCAs: caPool})
	}
	db, err := sql.Open(config.Driver, dsn)
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
	var result strings.Builder
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			result.WriteRune(r)
		}
	}
	return result.String()
}

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
	if data, err := os.ReadFile("config.json"); err == nil {
		if err := json.Unmarshal(data, config); err != nil {
			return nil, err
		}
	}
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

// ----- main -----

func main() {
	gob.Register(&User{})
	config, err := loadConfig()
	if err != nil {
		logFatal("technical", "Failed to load config", map[string]interface{}{"error": err.Error()})
	}
	app, err := NewApp(config)
	if err != nil {
		logFatal("technical", "Failed to initialize app", map[string]interface{}{"error": err.Error()})
	}
	defer func() { _ = app.db.Close() }()

	router := mux.NewRouter()

	api := router.PathPrefix("/api").Subrouter()
	api.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			app.apiMiddleware(next.ServeHTTP)(w, r)
		})
	})
	api.HandleFunc("/status", app.apiStatusHandler).Methods("GET", "OPTIONS")
	api.HandleFunc("/login", app.loginHandler).Methods("POST", "OPTIONS")
	api.HandleFunc("/logout", app.authMiddleware(app.logoutHandler)).Methods("POST", "OPTIONS")
	api.HandleFunc("/posts", app.apiPostsHandler).Methods("GET", "POST", "OPTIONS")
	api.HandleFunc("/posts/{id}", app.apiPostHandler).Methods("GET", "PUT", "DELETE", "OPTIONS")

	logInfo("technical", "Server starting", map[string]interface{}{"port": config.Server.Port})
	logInfo("business", "API configuration", map[string]interface{}{"enabled": config.API.Enabled, "apiKeyPresent": config.API.Key != ""})
	if err := http.ListenAndServe(":"+config.Server.Port, router); err != nil {
		logFatal("technical", "HTTP server error", map[string]interface{}{"error": err.Error()})
	}
}