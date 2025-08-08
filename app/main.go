package main

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ---------- Models ----------
type BlogPost struct {
	ID    string
	Title string
	Body  string
	Date  string
}

type Comment struct {
	ID        string
	PostID    string
	User      string
	Text      string
	Timestamp time.Time
}

// ---------- Storage Interface ----------
type Storage interface {
	GetPost(id string) (*BlogPost, bool)
	SavePost(post BlogPost)
	AddComment(postID string, comment Comment)
	ListComments(postID string) []Comment
	SubscribeComments(postID string) <-chan Comment
	UnsubscribeComments(postID string, ch <-chan Comment)
}

// ---------- In-Memory Implementation ----------
type InMemoryStore struct {
	mu       sync.RWMutex
	posts    map[string]BlogPost
	comments map[string][]Comment
	clients  map[string][]chan Comment
}

func NewInMemoryStore() *InMemoryStore {
	return &InMemoryStore{
		posts:    make(map[string]BlogPost),
		comments: make(map[string][]Comment),
		clients:  make(map[string][]chan Comment),
	}
}

func (s *InMemoryStore) GetPost(id string) (*BlogPost, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	post, ok := s.posts[id]
	if !ok {
		return nil, false
	}
	return &post, true
}

func (s *InMemoryStore) SavePost(post BlogPost) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.posts[post.ID] = post
}

func (s *InMemoryStore) AddComment(postID string, comment Comment) {
	s.mu.Lock()
	s.comments[postID] = append(s.comments[postID], comment)
	for _, ch := range s.clients[postID] {
		select {
		case ch <- comment:
		default:
		}
	}
	s.mu.Unlock()
}

func (s *InMemoryStore) ListComments(postID string) []Comment {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return append([]Comment(nil), s.comments[postID]...)
}

func (s *InMemoryStore) SubscribeComments(postID string) <-chan Comment {
	ch := make(chan Comment, 10)
	s.mu.Lock()
	s.clients[postID] = append(s.clients[postID], ch)
	s.mu.Unlock()
	return ch
}

func (s *InMemoryStore) UnsubscribeComments(postID string, ch <-chan Comment) {
	s.mu.Lock()
	defer s.mu.Unlock()
	chs := s.clients[postID]
	for i := range chs {
		if chs[i] == ch {
			s.clients[postID] = append(chs[:i], chs[i+1:]...)
			break
		}
	}
}

// ---------- CockroachDB Implementation ----------
type CockroachStore struct {
	db      *pgxpool.Pool
	clients map[string][]chan Comment
	mu      sync.Mutex
}

func NewCockroachStore(dsn string) *CockroachStore {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		log.Fatalf("failed to connect to CockroachDB: %v", err)
	}

	// Create schema if not exists
	_, err = pool.Exec(ctx, `
	CREATE TABLE IF NOT EXISTS posts (
		id TEXT PRIMARY KEY,
		title TEXT,
		body TEXT,
		date TEXT
	);
	CREATE TABLE IF NOT EXISTS comments (
		id TEXT PRIMARY KEY,
		post_id TEXT,
		user_name TEXT,
		text TEXT,
		timestamp TIMESTAMP
	);
	`)
	if err != nil {
		log.Fatalf("failed to initialize schema: %v", err)
	}

	return &CockroachStore{db: pool, clients: make(map[string][]chan Comment)}
}

func (c *CockroachStore) GetPost(id string) (*BlogPost, bool) {
	ctx := context.Background()
	row := c.db.QueryRow(ctx, `SELECT id, title, body, date FROM posts WHERE id=$1`, id)
	var p BlogPost
	if err := row.Scan(&p.ID, &p.Title, &p.Body, &p.Date); err != nil {
		return nil, false
	}
	return &p, true
}

func (c *CockroachStore) SavePost(post BlogPost) {
	ctx := context.Background()
	_, err := c.db.Exec(ctx, `
	INSERT INTO posts (id, title, body, date) VALUES ($1,$2,$3,$4)
	ON CONFLICT (id) DO UPDATE SET title=$2, body=$3, date=$4
	`, post.ID, post.Title, post.Body, post.Date)
	if err != nil {
		log.Printf("failed to save post: %v", err)
	}
}

func (c *CockroachStore) AddComment(postID string, comment Comment) {
	ctx := context.Background()
	_, err := c.db.Exec(ctx, `
	INSERT INTO comments (id, post_id, user_name, text, timestamp) VALUES ($1,$2,$3,$4,$5)
	`, comment.ID, postID, comment.User, comment.Text, comment.Timestamp)
	if err != nil {
		log.Printf("failed to insert comment: %v", err)
	}
	c.mu.Lock()
	for _, ch := range c.clients[postID] {
		select {
		case ch <- comment:
		default:
		}
	}
	c.mu.Unlock()
}

func (c *CockroachStore) ListComments(postID string) []Comment {
	ctx := context.Background()
	rows, err := c.db.Query(ctx, `
	SELECT id, post_id, user_name, text, timestamp FROM comments WHERE post_id=$1 ORDER BY timestamp
	`, postID)
	if err != nil {
		log.Printf("failed to list comments: %v", err)
		return nil
	}
	defer rows.Close()
	var list []Comment
	for rows.Next() {
		var cm Comment
		if err := rows.Scan(&cm.ID, &cm.PostID, &cm.User, &cm.Text, &cm.Timestamp); err == nil {
			list = append(list, cm)
		}
	}
	return list
}

func (c *CockroachStore) SubscribeComments(postID string) <-chan Comment {
	ch := make(chan Comment, 10)
	c.mu.Lock()
	c.clients[postID] = append(c.clients[postID], ch)
	c.mu.Unlock()
	return ch
}

func (c *CockroachStore) UnsubscribeComments(postID string, ch <-chan Comment) {
	c.mu.Lock()
	defer c.mu.Unlock()
	chs := c.clients[postID]
	for i := range chs {
		if chs[i] == ch {
			c.clients[postID] = append(chs[:i], chs[i+1:]...)
			break
		}
	}
}

// ---------- Templates ----------
const mainPageTemplate = `...`       // SAME as in-memory version
const commentsIslandTemplate = `...` // SAME as in-memory version

// ---------- Handlers ----------
var store Storage

func mainHandler(w http.ResponseWriter, r *http.Request)           { /* same as before */ }
func saveHandler(w http.ResponseWriter, r *http.Request)           { /* same as before */ }
func commentsIslandHandler(w http.ResponseWriter, r *http.Request) { /* same as before */ }
func commentsListHandler(w http.ResponseWriter, r *http.Request)   { /* same as before */ }
func commentsAddHandler(w http.ResponseWriter, r *http.Request)    { /* same as before */ }
func commentsStreamHandler(w http.ResponseWriter, r *http.Request) { /* same as before */ }

// ---------- Utils ----------
func randomID() string { return fmt.Sprintf("%d", rand.Int63()) }

// ---------- Main ----------
func main() {
	rand.Seed(time.Now().UnixNano())

	// Default: in-memory store
	provider := os.Getenv("BLOG_STORAGE")
	switch provider {
	case "cockroach":
		dsn := os.Getenv("DB_DSN")
		if dsn == "" {
			log.Fatal("DB_DSN is required for CockroachDB store")
		}
		store = NewCockroachStore(dsn)
	default:
		store = NewInMemoryStore()
	}

	// ROUTES (same as before)
}
