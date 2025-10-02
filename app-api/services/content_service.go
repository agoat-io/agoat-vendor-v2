package services

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// ContentService handles content management operations
type ContentService struct {
	db     *sql.DB
	logger Logger
}

// Logger interface for logging
type Logger interface {
	Info(component, action, message string, fields map[string]interface{})
	Error(component, action, message string, fields map[string]interface{})
	Debug(component, action, message string, fields map[string]interface{})
}

// Content represents a content item
type Content struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	Content     string     `json:"content"`
	Slug        string     `json:"slug"`
	Status      string     `json:"status"`
	SiteID      string     `json:"site_id"`
	UserID      string     `json:"user_id"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	PublishedAt *time.Time `json:"published_at,omitempty"`
}

// NewContentService creates a new content service
func NewContentService(db *sql.DB, logger Logger) *ContentService {
	return &ContentService{
		db:     db,
		logger: logger,
	}
}

// GetContent retrieves content by ID
func (s *ContentService) GetContent(id string) (*Content, error) {
	s.logger.Debug("content_service", "get_content", "Retrieving content", map[string]interface{}{
		"content_id": id,
	})

	query := `
		SELECT id, title, content, slug, status, site_id, user_id, created_at, updated_at, published_at
		FROM posts 
		WHERE id = $1 AND deleted_at IS NULL
	`

	var content Content
	var publishedAt sql.NullTime

	err := s.db.QueryRow(query, id).Scan(
		&content.ID,
		&content.Title,
		&content.Content,
		&content.Slug,
		&content.Status,
		&content.SiteID,
		&content.UserID,
		&content.CreatedAt,
		&content.UpdatedAt,
		&publishedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			s.logger.Info("content_service", "get_content", "Content not found", map[string]interface{}{
				"content_id": id,
			})
			return nil, fmt.Errorf("content not found")
		}
		s.logger.Error("content_service", "get_content", "Database error", map[string]interface{}{
			"content_id": id,
			"error":      err.Error(),
		})
		return nil, fmt.Errorf("failed to retrieve content: %w", err)
	}

	if publishedAt.Valid {
		content.PublishedAt = &publishedAt.Time
	}

	s.logger.Info("content_service", "get_content", "Content retrieved successfully", map[string]interface{}{
		"content_id": id,
		"title":      content.Title,
		"status":     content.Status,
	})

	return &content, nil
}

// GetContentBySlug retrieves content by slug
func (s *ContentService) GetContentBySlug(slug string, siteID string) (*Content, error) {
	s.logger.Debug("content_service", "get_content_by_slug", "Retrieving content by slug", map[string]interface{}{
		"slug":    slug,
		"site_id": siteID,
	})

	query := `
		SELECT id, title, content, slug, status, site_id, user_id, created_at, updated_at, published_at
		FROM posts 
		WHERE slug = $1 AND site_id = $2 AND deleted_at IS NULL
	`

	var content Content
	var publishedAt sql.NullTime

	err := s.db.QueryRow(query, slug, siteID).Scan(
		&content.ID,
		&content.Title,
		&content.Content,
		&content.Slug,
		&content.Status,
		&content.SiteID,
		&content.UserID,
		&content.CreatedAt,
		&content.UpdatedAt,
		&publishedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			s.logger.Info("content_service", "get_content_by_slug", "Content not found", map[string]interface{}{
				"slug":    slug,
				"site_id": siteID,
			})
			return nil, fmt.Errorf("content not found")
		}
		s.logger.Error("content_service", "get_content_by_slug", "Database error", map[string]interface{}{
			"slug":    slug,
			"site_id": siteID,
			"error":   err.Error(),
		})
		return nil, fmt.Errorf("failed to retrieve content: %w", err)
	}

	if publishedAt.Valid {
		content.PublishedAt = &publishedAt.Time
	}

	s.logger.Info("content_service", "get_content_by_slug", "Content retrieved successfully", map[string]interface{}{
		"content_id": content.ID,
		"slug":       slug,
		"title":      content.Title,
		"status":     content.Status,
	})

	return &content, nil
}

// ListContent retrieves a list of content items
func (s *ContentService) ListContent(siteID string, limit, offset int) ([]*Content, error) {
	s.logger.Debug("content_service", "list_content", "Retrieving content list", map[string]interface{}{
		"site_id": siteID,
		"limit":   limit,
		"offset":  offset,
	})

	query := `
		SELECT id, title, content, slug, status, site_id, user_id, created_at, updated_at, published_at
		FROM posts 
		WHERE site_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.Query(query, siteID, limit, offset)
	if err != nil {
		s.logger.Error("content_service", "list_content", "Database error", map[string]interface{}{
			"site_id": siteID,
			"error":   err.Error(),
		})
		return nil, fmt.Errorf("failed to retrieve content list: %w", err)
	}
	defer rows.Close()

	var contents []*Content
	for rows.Next() {
		var content Content
		var publishedAt sql.NullTime

		err := rows.Scan(
			&content.ID,
			&content.Title,
			&content.Content,
			&content.Slug,
			&content.Status,
			&content.SiteID,
			&content.UserID,
			&content.CreatedAt,
			&content.UpdatedAt,
			&publishedAt,
		)
		if err != nil {
			s.logger.Error("content_service", "list_content", "Row scan error", map[string]interface{}{
				"site_id": siteID,
				"error":   err.Error(),
			})
			return nil, fmt.Errorf("failed to scan content row: %w", err)
		}

		if publishedAt.Valid {
			content.PublishedAt = &publishedAt.Time
		}

		contents = append(contents, &content)
	}

	if err = rows.Err(); err != nil {
		s.logger.Error("content_service", "list_content", "Rows iteration error", map[string]interface{}{
			"site_id": siteID,
			"error":   err.Error(),
		})
		return nil, fmt.Errorf("failed to iterate content rows: %w", err)
	}

	s.logger.Info("content_service", "list_content", "Content list retrieved successfully", map[string]interface{}{
		"site_id": siteID,
		"count":   len(contents),
		"limit":   limit,
		"offset":  offset,
	})

	return contents, nil
}

// CreateContent creates a new content item
func (s *ContentService) CreateContent(title, content, slug, status, siteID, userID string) (*Content, error) {
	s.logger.Debug("content_service", "create_content", "Creating new content", map[string]interface{}{
		"title":   title,
		"slug":    slug,
		"status":  status,
		"site_id": siteID,
		"user_id": userID,
	})

	id := uuid.New().String()
	now := time.Now()

	query := `
		INSERT INTO posts (id, title, content, slug, status, site_id, user_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, title, content, slug, status, site_id, user_id, created_at, updated_at, published_at
	`

	var newContent Content
	var publishedAt sql.NullTime

	err := s.db.QueryRow(query, id, title, content, slug, status, siteID, userID, now, now).Scan(
		&newContent.ID,
		&newContent.Title,
		&newContent.Content,
		&newContent.Slug,
		&newContent.Status,
		&newContent.SiteID,
		&newContent.UserID,
		&newContent.CreatedAt,
		&newContent.UpdatedAt,
		&publishedAt,
	)

	if err != nil {
		s.logger.Error("content_service", "create_content", "Database error", map[string]interface{}{
			"title":   title,
			"slug":    slug,
			"site_id": siteID,
			"user_id": userID,
			"error":   err.Error(),
		})
		return nil, fmt.Errorf("failed to create content: %w", err)
	}

	if publishedAt.Valid {
		newContent.PublishedAt = &publishedAt.Time
	}

	s.logger.Info("content_service", "create_content", "Content created successfully", map[string]interface{}{
		"content_id": newContent.ID,
		"title":      title,
		"slug":       slug,
		"status":     status,
		"site_id":    siteID,
		"user_id":    userID,
	})

	return &newContent, nil
}

// UpdateContent updates an existing content item
func (s *ContentService) UpdateContent(id, title, content, slug, status string) (*Content, error) {
	s.logger.Debug("content_service", "update_content", "Updating content", map[string]interface{}{
		"content_id": id,
		"title":      title,
		"slug":       slug,
		"status":     status,
	})

	now := time.Now()

	query := `
		UPDATE posts 
		SET title = $1, content = $2, slug = $3, status = $4, updated_at = $5
		WHERE id = $6 AND deleted_at IS NULL
		RETURNING id, title, content, slug, status, site_id, user_id, created_at, updated_at, published_at
	`

	var updatedContent Content
	var publishedAt sql.NullTime

	err := s.db.QueryRow(query, title, content, slug, status, now, id).Scan(
		&updatedContent.ID,
		&updatedContent.Title,
		&updatedContent.Content,
		&updatedContent.Slug,
		&updatedContent.Status,
		&updatedContent.SiteID,
		&updatedContent.UserID,
		&updatedContent.CreatedAt,
		&updatedContent.UpdatedAt,
		&publishedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			s.logger.Info("content_service", "update_content", "Content not found", map[string]interface{}{
				"content_id": id,
			})
			return nil, fmt.Errorf("content not found")
		}
		s.logger.Error("content_service", "update_content", "Database error", map[string]interface{}{
			"content_id": id,
			"error":      err.Error(),
		})
		return nil, fmt.Errorf("failed to update content: %w", err)
	}

	if publishedAt.Valid {
		updatedContent.PublishedAt = &publishedAt.Time
	}

	s.logger.Info("content_service", "update_content", "Content updated successfully", map[string]interface{}{
		"content_id": id,
		"title":      title,
		"slug":       slug,
		"status":     status,
	})

	return &updatedContent, nil
}

// DeleteContent soft deletes a content item
func (s *ContentService) DeleteContent(id string) error {
	s.logger.Debug("content_service", "delete_content", "Deleting content", map[string]interface{}{
		"content_id": id,
	})

	now := time.Now()

	query := `
		UPDATE posts 
		SET deleted_at = $1, updated_at = $2
		WHERE id = $3 AND deleted_at IS NULL
	`

	result, err := s.db.Exec(query, now, now, id)
	if err != nil {
		s.logger.Error("content_service", "delete_content", "Database error", map[string]interface{}{
			"content_id": id,
			"error":      err.Error(),
		})
		return fmt.Errorf("failed to delete content: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		s.logger.Error("content_service", "delete_content", "Rows affected error", map[string]interface{}{
			"content_id": id,
			"error":      err.Error(),
		})
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		s.logger.Info("content_service", "delete_content", "Content not found", map[string]interface{}{
			"content_id": id,
		})
		return fmt.Errorf("content not found")
	}

	s.logger.Info("content_service", "delete_content", "Content deleted successfully", map[string]interface{}{
		"content_id": id,
	})

	return nil
}
