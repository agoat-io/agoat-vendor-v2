package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	"github.com/joho/godotenv"
	"topvitaminsupply.com/app/internal/handlers"
	"topvitaminsupply.com/app/internal/middleware"
	"topvitaminsupply.com/app/internal/templates"
)

var (
	store = sessions.NewCookieStore([]byte("your-secret-key"))
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize template engine
	templateEngine := templates.NewEngine("web/templates")

	// Initialize handlers (no database dependency)
	handlers := handlers.NewHandlers(store, templateEngine)

	// Create router
	r := mux.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.CORS)
	r.Use(middleware.SessionMiddleware(store))

	// Static files
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("web/static"))))

	// Web routes
	r.HandleFunc("/", handlers.Home).Methods("GET")
	r.HandleFunc("/login", handlers.LoginPage).Methods("GET")
	r.HandleFunc("/dashboard", handlers.Dashboard).Methods("GET")
	r.HandleFunc("/post/{id}", handlers.PostView).Methods("GET")
	r.HandleFunc("/post/{id}/edit", handlers.EditPost).Methods("GET")
	r.HandleFunc("/new-post", handlers.NewPost).Methods("GET")

	// Hotwire Turbo Stream routes
	r.HandleFunc("/turbo/posts", handlers.TurboPosts).Methods("GET")
	r.HandleFunc("/turbo/post/{id}", handlers.TurboPost).Methods("GET")

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Create server
	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("🚀 Top Vitamin Supply Hotwire App starting on http://localhost:%s", port)
		log.Printf("📊 Consuming API: http://localhost:8080/api")
		log.Printf("🎨 Web: http://localhost:%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("🛑 Server shutting down...")

	// Create a deadline for server shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Attempt graceful shutdown
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("✅ Server exited gracefully")
}
