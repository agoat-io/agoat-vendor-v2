package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"agoat.io/agoat-publisher/services"
	"github.com/gorilla/mux"
)

// ContentHandlers handles HTTP requests for content management
type ContentHandlers struct {
	contentService *services.ContentService
}

// NewContentHandlers creates a new content handlers instance
func NewContentHandlers(contentService *services.ContentService) *ContentHandlers {
	return &ContentHandlers{
		contentService: contentService,
	}
}

// CreateContentRequest represents the request body for creating content
type CreateContentRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
	Slug    string `json:"slug"`
	Status  string `json:"status"`
	SiteID  string `json:"site_id"`
	UserID  string `json:"user_id"`
}

// UpdateContentRequest represents the request body for updating content
type UpdateContentRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
	Slug    string `json:"slug"`
	Status  string `json:"status"`
}

// APIResponse represents a standard API response
type APIResponse struct {
	Success bool          `json:"success"`
	Data    interface{}   `json:"data,omitempty"`
	Error   interface{}   `json:"error,omitempty"`
	Errors  []interface{} `json:"errors,omitempty"`
}

// GetContent handles GET /api/content/{id}
func (h *ContentHandlers) GetContent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	contentID := vars["id"]

	if contentID == "" {
		http.Error(w, "Content ID is required", http.StatusBadRequest)
		return
	}

	content, err := h.contentService.GetContent(contentID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Content not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to retrieve content", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{
		Success: true,
		Data:    content,
	})
}

// GetContentBySlug handles GET /api/content/slug/{slug}
func (h *ContentHandlers) GetContentBySlug(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	slug := vars["slug"]
	siteID := r.URL.Query().Get("site_id")

	if slug == "" {
		http.Error(w, "Slug is required", http.StatusBadRequest)
		return
	}

	if siteID == "" {
		http.Error(w, "Site ID is required", http.StatusBadRequest)
		return
	}

	content, err := h.contentService.GetContentBySlug(slug, siteID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Content not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to retrieve content", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{
		Success: true,
		Data:    content,
	})
}

// ListContent handles GET /api/content
func (h *ContentHandlers) ListContent(w http.ResponseWriter, r *http.Request) {
	siteID := r.URL.Query().Get("site_id")
	if siteID == "" {
		http.Error(w, "Site ID is required", http.StatusBadRequest)
		return
	}

	// Parse pagination parameters
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 10 // default limit
	offset := 0 // default offset

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	contents, err := h.contentService.ListContent(siteID, limit, offset)
	if err != nil {
		http.Error(w, "Failed to retrieve content list", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{
		Success: true,
		Data:    contents,
	})
}

// CreateContent handles POST /api/content
func (h *ContentHandlers) CreateContent(w http.ResponseWriter, r *http.Request) {
	var req CreateContentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Title == "" {
		http.Error(w, "Title is required", http.StatusBadRequest)
		return
	}
	if req.SiteID == "" {
		http.Error(w, "Site ID is required", http.StatusBadRequest)
		return
	}
	if req.UserID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	// Set default status if not provided
	if req.Status == "" {
		req.Status = "draft"
	}

	// Generate slug if not provided
	if req.Slug == "" {
		req.Slug = slugify(req.Title)
	}

	content, err := h.contentService.CreateContent(
		req.Title,
		req.Content,
		req.Slug,
		req.Status,
		req.SiteID,
		req.UserID,
	)
	if err != nil {
		http.Error(w, "Failed to create content", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(APIResponse{
		Success: true,
		Data:    content,
	})
}

// UpdateContent handles PUT /api/content/{id}
func (h *ContentHandlers) UpdateContent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	contentID := vars["id"]

	if contentID == "" {
		http.Error(w, "Content ID is required", http.StatusBadRequest)
		return
	}

	var req UpdateContentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Title == "" {
		http.Error(w, "Title is required", http.StatusBadRequest)
		return
	}

	// Generate slug if not provided
	if req.Slug == "" {
		req.Slug = slugify(req.Title)
	}

	content, err := h.contentService.UpdateContent(
		contentID,
		req.Title,
		req.Content,
		req.Slug,
		req.Status,
	)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Content not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to update content", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{
		Success: true,
		Data:    content,
	})
}

// DeleteContent handles DELETE /api/content/{id}
func (h *ContentHandlers) DeleteContent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	contentID := vars["id"]

	if contentID == "" {
		http.Error(w, "Content ID is required", http.StatusBadRequest)
		return
	}

	err := h.contentService.DeleteContent(contentID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Content not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to delete content", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{
		Success: true,
		Data:    map[string]string{"message": "Content deleted successfully"},
	})
}

// GetSitePage handles GET /api/sites/{siteSlug}/pages/{pageSlug}
func (h *ContentHandlers) GetSitePage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)
	json.NewEncoder(w).Encode(APIResponse{
		Success: false,
		Error: map[string]string{
			"code":    "NOT_IMPLEMENTED",
			"message": "GetSitePage endpoint is not yet implemented",
		},
	})
}

// GetSiteComponents handles GET /api/sites/{siteSlug}/components/{type}
func (h *ContentHandlers) GetSiteComponents(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)
	json.NewEncoder(w).Encode(APIResponse{
		Success: false,
		Error: map[string]string{
			"code":    "NOT_IMPLEMENTED",
			"message": "GetSiteComponents endpoint is not yet implemented",
		},
	})
}

// GetSiteDataItems handles GET /api/sites/{siteSlug}/data/{collection}
func (h *ContentHandlers) GetSiteDataItems(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)
	json.NewEncoder(w).Encode(APIResponse{
		Success: false,
		Error: map[string]string{
			"code":    "NOT_IMPLEMENTED",
			"message": "GetSiteDataItems endpoint is not yet implemented",
		},
	})
}

// GetSiteDataItem handles GET /api/sites/{siteSlug}/data/{collection}/{id}
func (h *ContentHandlers) GetSiteDataItem(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)
	json.NewEncoder(w).Encode(APIResponse{
		Success: false,
		Error: map[string]string{
			"code":    "NOT_IMPLEMENTED",
			"message": "GetSiteDataItem endpoint is not yet implemented",
		},
	})
}

// SearchSiteDataItems handles GET /api/sites/{siteSlug}/data/{collection}/search
func (h *ContentHandlers) SearchSiteDataItems(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)
	json.NewEncoder(w).Encode(APIResponse{
		Success: false,
		Error: map[string]string{
			"code":    "NOT_IMPLEMENTED",
			"message": "SearchSiteDataItems endpoint is not yet implemented",
		},
	})
}

// CreateSiteDataItem handles POST /api/sites/{siteSlug}/data/{collection}
func (h *ContentHandlers) CreateSiteDataItem(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)
	json.NewEncoder(w).Encode(APIResponse{
		Success: false,
		Error: map[string]string{
			"code":    "NOT_IMPLEMENTED",
			"message": "CreateSiteDataItem endpoint is not yet implemented",
		},
	})
}

// GetSiteSettings handles GET /api/sites/{siteSlug}/settings
func (h *ContentHandlers) GetSiteSettings(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)
	json.NewEncoder(w).Encode(APIResponse{
		Success: false,
		Error: map[string]string{
			"code":    "NOT_IMPLEMENTED",
			"message": "GetSiteSettings endpoint is not yet implemented",
		},
	})
}

// GetSiteNavigation handles GET /api/sites/{siteSlug}/navigation/{type}
func (h *ContentHandlers) GetSiteNavigation(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)
	json.NewEncoder(w).Encode(APIResponse{
		Success: false,
		Error: map[string]string{
			"code":    "NOT_IMPLEMENTED",
			"message": "GetSiteNavigation endpoint is not yet implemented",
		},
	})
}

// slugify converts a string to a URL-friendly slug
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
