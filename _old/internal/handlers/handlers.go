package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	"topvitaminsupply.com/app/internal/templates"
)

// Handlers contains all HTTP handlers
type Handlers struct {
	store          *sessions.CookieStore
	templateEngine *templates.Engine
	apiBaseURL     string
	httpClient     *http.Client
}

// NewHandlers creates a new handlers instance
func NewHandlers(store *sessions.CookieStore, templateEngine *templates.Engine) *Handlers {
	return &Handlers{
		store:          store,
		templateEngine: templateEngine,
		apiBaseURL:     "http://localhost:8080/api",
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// APIResponse represents the standard API response structure
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// Post represents a blog post
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

// User represents a user
type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Home handles the home page
func (h *Handlers) Home(w http.ResponseWriter, r *http.Request) {
	// Check if user is authenticated
	session, _ := h.store.Get(r, "session-name")
	userID, authenticated := session.Values["user_id"].(int)

	if !authenticated || userID == 0 {
		// Show public home page
		h.renderPublicHome(w, r)
		return
	}

	// Show authenticated home page
	h.renderAuthenticatedHome(w, r)
}

// renderPublicHome renders the public home page
func (h *Handlers) renderPublicHome(w http.ResponseWriter, r *http.Request) {
	// Fetch posts from API
	posts, err := h.fetchPosts()
	if err != nil {
		log.Printf("Error fetching posts: %v", err)
		http.Error(w, "Failed to load posts", http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"Posts": posts,
		"Title": "Top Vitamin Supply - Your Health Partner",
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	err = h.templateEngine.Render(w, "home", data)
	if err != nil {
		log.Printf("Error rendering home template: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

// renderAuthenticatedHome renders the authenticated home page
func (h *Handlers) renderAuthenticatedHome(w http.ResponseWriter, r *http.Request) {
	// Fetch posts from API
	posts, err := h.fetchPosts()
	if err != nil {
		log.Printf("Error fetching posts: %v", err)
		http.Error(w, "Failed to load posts", http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"Posts": posts,
		"Title": "Dashboard - Top Vitamin Supply",
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	err = h.templateEngine.Render(w, "dashboard", data)
	if err != nil {
		log.Printf("Error rendering dashboard template: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

// LoginPage handles the login page
func (h *Handlers) LoginPage(w http.ResponseWriter, r *http.Request) {
	data := map[string]interface{}{
		"Title": "Login - Top Vitamin Supply",
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	err := h.templateEngine.Render(w, "login", data)
	if err != nil {
		log.Printf("Error rendering login template: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

// Dashboard handles the dashboard page
func (h *Handlers) Dashboard(w http.ResponseWriter, r *http.Request) {
	// Check authentication
	session, _ := h.store.Get(r, "session-name")
	userID, authenticated := session.Values["user_id"].(int)

	if !authenticated || userID == 0 {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	// Fetch posts from API
	posts, err := h.fetchPosts()
	if err != nil {
		log.Printf("Error fetching posts: %v", err)
		http.Error(w, "Failed to load posts", http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"Posts": posts,
		"Title": "Dashboard - Top Vitamin Supply",
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	err = h.templateEngine.Render(w, "dashboard", data)
	if err != nil {
		log.Printf("Error rendering dashboard template: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

// PostView handles viewing a single post
func (h *Handlers) PostView(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	postID := vars["id"]

	// Fetch post from API
	post, err := h.fetchPost(postID)
	if err != nil {
		log.Printf("Error fetching post %s: %v", postID, err)
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	data := map[string]interface{}{
		"Post":  post,
		"Title": post.Title + " - Top Vitamin Supply",
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	err = h.templateEngine.Render(w, "post", data)
	if err != nil {
		log.Printf("Error rendering post template: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

// EditPost handles editing a post
func (h *Handlers) EditPost(w http.ResponseWriter, r *http.Request) {
	// Check authentication
	session, _ := h.store.Get(r, "session-name")
	userID, authenticated := session.Values["user_id"].(int)

	if !authenticated || userID == 0 {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	vars := mux.Vars(r)
	postID := vars["id"]

	// Fetch post from API
	post, err := h.fetchPost(postID)
	if err != nil {
		log.Printf("Error fetching post %s: %v", postID, err)
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	data := map[string]interface{}{
		"Post":  post,
		"Title": "Edit Post - Top Vitamin Supply",
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	err = h.templateEngine.Render(w, "edit_post", data)
	if err != nil {
		log.Printf("Error rendering edit post template: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

// NewPost handles creating a new post
func (h *Handlers) NewPost(w http.ResponseWriter, r *http.Request) {
	// Check authentication
	session, _ := h.store.Get(r, "session-name")
	userID, authenticated := session.Values["user_id"].(int)

	if !authenticated || userID == 0 {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	data := map[string]interface{}{
		"Title": "New Post - Top Vitamin Supply",
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	err := h.templateEngine.Render(w, "new_post", data)
	if err != nil {
		log.Printf("Error rendering new post template: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

// TurboPosts handles Turbo Stream for posts list
func (h *Handlers) TurboPosts(w http.ResponseWriter, r *http.Request) {
	posts, err := h.fetchPosts()
	if err != nil {
		log.Printf("Error fetching posts for turbo: %v", err)
		http.Error(w, "Failed to load posts", http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"Posts": posts,
	}

	w.Header().Set("Content-Type", "text/vnd.turbo-stream.html")
	err = h.templateEngine.RenderTurboStream(w, "replace", "posts-list", "posts_list", data)
	if err != nil {
		log.Printf("Error rendering turbo stream: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

// TurboPost handles Turbo Stream for single post
func (h *Handlers) TurboPost(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	postID := vars["id"]

	post, err := h.fetchPost(postID)
	if err != nil {
		log.Printf("Error fetching post for turbo: %v", err)
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	data := map[string]interface{}{
		"Post": post,
	}

	w.Header().Set("Content-Type", "text/vnd.turbo-stream.html")
	err = h.templateEngine.RenderTurboStream(w, "replace", "post-content", "post_content", data)
	if err != nil {
		log.Printf("Error rendering turbo stream: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

// fetchPosts fetches posts from the API
func (h *Handlers) fetchPosts() ([]Post, error) {
	resp, err := h.httpClient.Get(h.apiBaseURL + "/posts")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var apiResp APIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, err
	}

	if !apiResp.Success {
		return nil, fmt.Errorf("API error: %s", apiResp.Error)
	}

	// Convert the data to posts
	postsData, err := json.Marshal(apiResp.Data)
	if err != nil {
		return nil, err
	}

	var posts []Post
	if err := json.Unmarshal(postsData, &posts); err != nil {
		return nil, err
	}

	return posts, nil
}

// fetchPost fetches a single post from the API
func (h *Handlers) fetchPost(postID string) (*Post, error) {
	resp, err := h.httpClient.Get(h.apiBaseURL + "/posts/" + postID)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var apiResp APIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, err
	}

	if !apiResp.Success {
		return nil, fmt.Errorf("API error: %s", apiResp.Error)
	}

	// Convert the data to post
	postData, err := json.Marshal(apiResp.Data)
	if err != nil {
		return nil, err
	}

	var post Post
	if err := json.Unmarshal(postData, &post); err != nil {
		return nil, err
	}

	return &post, nil
}

// makeAPIRequest makes a request to the API
func (h *Handlers) makeAPIRequest(method, endpoint string, body io.Reader) (*http.Response, error) {
	req, err := http.NewRequest(method, h.apiBaseURL+endpoint, body)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	return h.httpClient.Do(req)
}
