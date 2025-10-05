package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
)

// AdminHandler handles admin operations
type AdminHandler struct {
	db     *sql.DB
	logger Logger
}

// Logger interface for logging
type Logger interface {
	Info(component, action, message string, fields map[string]interface{})
	Error(component, action, message string, fields map[string]interface{})
	Debug(component, action, message string, fields map[string]interface{})
}

// TableInfo represents information about a database table
type TableInfo struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	RowCount    int64  `json:"row_count"`
	Columns     []ColumnInfo `json:"columns"`
}

// ColumnInfo represents information about a table column
type ColumnInfo struct {
	Name         string `json:"name"`
	Type         string `json:"type"`
	IsNullable   bool   `json:"is_nullable"`
	IsPrimaryKey bool   `json:"is_primary_key"`
	IsUnique     bool   `json:"is_unique"`
	DefaultValue *string `json:"default_value,omitempty"`
}

// TableData represents paginated table data
type TableData struct {
	TableName string                   `json:"table_name"`
	Columns   []string                 `json:"columns"`
	Rows      []map[string]interface{} `json:"rows"`
	TotalRows int64                    `json:"total_rows"`
	Page      int                      `json:"page"`
	PageSize  int                      `json:"page_size"`
	TotalPages int                     `json:"total_pages"`
}

// FilterRequest represents filtering parameters
type FilterRequest struct {
	Column   string `json:"column"`
	Operator string `json:"operator"` // eq, ne, gt, lt, gte, lte, like, ilike, in, not_in
	Value    string `json:"value"`
}

// QueryRequest represents a query request
type QueryRequest struct {
	Table     string           `json:"table"`
	Page      int              `json:"page"`
	PageSize  int              `json:"page_size"`
	Filters   []FilterRequest  `json:"filters"`
	OrderBy   string           `json:"order_by"`
	OrderDir  string           `json:"order_dir"` // asc, desc
}

// NewAdminHandler creates a new admin handler
func NewAdminHandler(db *sql.DB, logger Logger) *AdminHandler {
	return &AdminHandler{
		db:     db,
		logger: logger,
	}
}

// GetTables returns information about all database tables
func (h *AdminHandler) GetTables(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("admin_handler", "get_tables", "Retrieving database tables", map[string]interface{}{
		"user_agent": r.UserAgent(),
		"remote_addr": r.RemoteAddr,
	})

	// Get list of all tables
	query := `
		SELECT table_name 
		FROM information_schema.tables 
		WHERE table_schema = 'public' 
		AND table_type = 'BASE TABLE'
		ORDER BY table_name
	`

	rows, err := h.db.Query(query)
	if err != nil {
		h.logger.Error("admin_handler", "get_tables", "Database error", map[string]interface{}{
			"error": err.Error(),
		})
		http.Error(w, "Failed to retrieve tables", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var tables []TableInfo
	for rows.Next() {
		var tableName string
		if err := rows.Scan(&tableName); err != nil {
			h.logger.Error("admin_handler", "get_tables", "Scan error", map[string]interface{}{
				"error": err.Error(),
			})
			continue
		}

		// Get row count for this table
		countQuery := fmt.Sprintf("SELECT COUNT(*) FROM %s", tableName)
		var rowCount int64
		err := h.db.QueryRow(countQuery).Scan(&rowCount)
		if err != nil {
			h.logger.Error("admin_handler", "get_tables", "Count query error", map[string]interface{}{
				"table": tableName,
				"error": err.Error(),
			})
			rowCount = 0
		}

		// Get column information
		columns, err := h.getTableColumns(tableName)
		if err != nil {
			h.logger.Error("admin_handler", "get_tables", "Column info error", map[string]interface{}{
				"table": tableName,
				"error": err.Error(),
			})
			columns = []ColumnInfo{}
		}

		tableInfo := TableInfo{
			Name:        tableName,
			Description: h.getTableDescription(tableName),
			RowCount:    rowCount,
			Columns:     columns,
		}

		tables = append(tables, tableInfo)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"tables": tables,
		"count":  len(tables),
	})

	h.logger.Info("admin_handler", "get_tables", "Tables retrieved successfully", map[string]interface{}{
		"table_count": len(tables),
	})
}

// GetTableData returns paginated data from a specific table
func (h *AdminHandler) GetTableData(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tableName := vars["table"]

	h.logger.Info("admin_handler", "get_table_data", "Retrieving table data", map[string]interface{}{
		"table":       tableName,
		"user_agent":  r.UserAgent(),
		"remote_addr": r.RemoteAddr,
	})

	// Parse query parameters
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}

	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))
	if pageSize < 1 || pageSize > 1000 {
		pageSize = 50
	}

	orderBy := r.URL.Query().Get("order_by")
	orderDir := r.URL.Query().Get("order_dir")
	if orderDir != "desc" {
		orderDir = "asc"
	}

	// Parse filters from query parameters
	var filters []FilterRequest
	filterParam := r.URL.Query().Get("filters")
	if filterParam != "" {
		if err := json.Unmarshal([]byte(filterParam), &filters); err != nil {
			h.logger.Error("admin_handler", "get_table_data", "Filter parse error", map[string]interface{}{
				"table": tableName,
				"error": err.Error(),
			})
		}
	}

	// Build the query
	query, args, err := h.buildTableQuery(tableName, page, pageSize, filters, orderBy, orderDir)
	if err != nil {
		h.logger.Error("admin_handler", "get_table_data", "Query build error", map[string]interface{}{
			"table": tableName,
			"error": err.Error(),
		})
		http.Error(w, "Failed to build query", http.StatusBadRequest)
		return
	}

	// Get total count
	countQuery, countArgs, err := h.buildCountQuery(tableName, filters)
	if err != nil {
		h.logger.Error("admin_handler", "get_table_data", "Count query build error", map[string]interface{}{
			"table": tableName,
			"error": err.Error(),
		})
		http.Error(w, "Failed to build count query", http.StatusBadRequest)
		return
	}

	var totalRows int64
	err = h.db.QueryRow(countQuery, countArgs...).Scan(&totalRows)
	if err != nil {
		h.logger.Error("admin_handler", "get_table_data", "Count query error", map[string]interface{}{
			"table": tableName,
			"error": err.Error(),
		})
		http.Error(w, "Failed to get row count", http.StatusInternalServerError)
		return
	}

	// Execute the main query
	rows, err := h.db.Query(query, args...)
	if err != nil {
		h.logger.Error("admin_handler", "get_table_data", "Query execution error", map[string]interface{}{
			"table": tableName,
			"error": err.Error(),
		})
		http.Error(w, "Failed to execute query", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Get column names
	columns, err := rows.Columns()
	if err != nil {
		h.logger.Error("admin_handler", "get_table_data", "Column names error", map[string]interface{}{
			"table": tableName,
			"error": err.Error(),
		})
		http.Error(w, "Failed to get column names", http.StatusInternalServerError)
		return
	}

	// Scan rows
	var data []map[string]interface{}
	for rows.Next() {
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range values {
			valuePtrs[i] = &values[i]
		}

		if err := rows.Scan(valuePtrs...); err != nil {
			h.logger.Error("admin_handler", "get_table_data", "Row scan error", map[string]interface{}{
				"table": tableName,
				"error": err.Error(),
			})
			continue
		}

		row := make(map[string]interface{})
		for i, col := range columns {
			val := values[i]
			if val != nil {
				// Convert time.Time to string for JSON serialization
				if t, ok := val.(time.Time); ok {
					row[col] = t.Format(time.RFC3339)
				} else {
					row[col] = val
				}
			} else {
				row[col] = nil
			}
		}
		data = append(data, row)
	}

	totalPages := int((totalRows + int64(pageSize) - 1) / int64(pageSize))

	response := TableData{
		TableName:  tableName,
		Columns:    columns,
		Rows:       data,
		TotalRows:  totalRows,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

	h.logger.Info("admin_handler", "get_table_data", "Table data retrieved successfully", map[string]interface{}{
		"table":       tableName,
		"row_count":   len(data),
		"total_rows":  totalRows,
		"page":        page,
		"page_size":   pageSize,
	})
}

// ExecuteQuery executes a custom SQL query (read-only)
func (h *AdminHandler) ExecuteQuery(w http.ResponseWriter, r *http.Request) {
	var queryReq QueryRequest
	if err := json.NewDecoder(r.Body).Decode(&queryReq); err != nil {
		h.logger.Error("admin_handler", "execute_query", "Request decode error", map[string]interface{}{
			"error": err.Error(),
		})
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	h.logger.Info("admin_handler", "execute_query", "Executing custom query", map[string]interface{}{
		"table":      queryReq.Table,
		"user_agent": r.UserAgent(),
		"remote_addr": r.RemoteAddr,
	})

	// Validate table name to prevent SQL injection
	if !h.isValidTableName(queryReq.Table) {
		h.logger.Error("admin_handler", "execute_query", "Invalid table name", map[string]interface{}{
			"table": queryReq.Table,
		})
		http.Error(w, "Invalid table name", http.StatusBadRequest)
		return
	}

	// Build the query
	query, args, err := h.buildTableQuery(queryReq.Table, queryReq.Page, queryReq.PageSize, queryReq.Filters, queryReq.OrderBy, queryReq.OrderDir)
	if err != nil {
		h.logger.Error("admin_handler", "execute_query", "Query build error", map[string]interface{}{
			"table": queryReq.Table,
			"error": err.Error(),
		})
		http.Error(w, "Failed to build query", http.StatusBadRequest)
		return
	}

	// Execute the query
	rows, err := h.db.Query(query, args...)
	if err != nil {
		h.logger.Error("admin_handler", "execute_query", "Query execution error", map[string]interface{}{
			"table": queryReq.Table,
			"error": err.Error(),
		})
		http.Error(w, "Failed to execute query", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Get column names
	columns, err := rows.Columns()
	if err != nil {
		h.logger.Error("admin_handler", "execute_query", "Column names error", map[string]interface{}{
			"table": queryReq.Table,
			"error": err.Error(),
		})
		http.Error(w, "Failed to get column names", http.StatusInternalServerError)
		return
	}

	// Scan rows
	var data []map[string]interface{}
	for rows.Next() {
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range values {
			valuePtrs[i] = &values[i]
		}

		if err := rows.Scan(valuePtrs...); err != nil {
			h.logger.Error("admin_handler", "execute_query", "Row scan error", map[string]interface{}{
				"table": queryReq.Table,
				"error": err.Error(),
			})
			continue
		}

		row := make(map[string]interface{})
		for i, col := range columns {
			val := values[i]
			if val != nil {
				// Convert time.Time to string for JSON serialization
				if t, ok := val.(time.Time); ok {
					row[col] = t.Format(time.RFC3339)
				} else {
					row[col] = val
				}
			} else {
				row[col] = nil
			}
		}
		data = append(data, row)
	}

	response := map[string]interface{}{
		"table":   queryReq.Table,
		"columns": columns,
		"rows":    data,
		"count":   len(data),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

	h.logger.Info("admin_handler", "execute_query", "Query executed successfully", map[string]interface{}{
		"table":     queryReq.Table,
		"row_count": len(data),
	})
}

// Helper functions

func (h *AdminHandler) getTableColumns(tableName string) ([]ColumnInfo, error) {
	query := `
		SELECT 
			c.column_name,
			c.data_type,
			c.is_nullable,
			CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
			CASE WHEN c.column_name IN (
				SELECT column_name 
				FROM information_schema.table_constraints tc
				JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
				WHERE tc.table_name = $1 AND tc.constraint_type = 'UNIQUE'
			) THEN true ELSE false END as is_unique,
			c.column_default
		FROM information_schema.columns c
		LEFT JOIN (
			SELECT ku.column_name
			FROM information_schema.table_constraints tc
			JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
			WHERE tc.table_name = $1 AND tc.constraint_type = 'PRIMARY KEY'
		) pk ON c.column_name = pk.column_name
		WHERE c.table_name = $1
		ORDER BY c.ordinal_position
	`

	rows, err := h.db.Query(query, tableName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var columns []ColumnInfo
	for rows.Next() {
		var col ColumnInfo
		var isNullable, isPrimaryKey, isUnique string
		var defaultValue sql.NullString

		err := rows.Scan(
			&col.Name,
			&col.Type,
			&isNullable,
			&isPrimaryKey,
			&isUnique,
			&defaultValue,
		)
		if err != nil {
			return nil, err
		}

		col.IsNullable = isNullable == "YES"
		col.IsPrimaryKey = isPrimaryKey == "true"
		col.IsUnique = isUnique == "true"
		if defaultValue.Valid {
			col.DefaultValue = &defaultValue.String
		}

		columns = append(columns, col)
	}

	return columns, nil
}

func (h *AdminHandler) getTableDescription(tableName string) string {
	descriptions := map[string]string{
		"users":                "User accounts with authentication information",
		"posts":                "Content posts and articles",
		"customers":            "Customer/tenant information",
		"sites":                "Sites within customers",
		"ciam_systems":         "CIAM authentication system configurations",
		"user_ciam_mappings":   "User-to-CIAM system mappings",
		"migration_status":     "Database migration tracking",
		"platform_users":       "Platform-level user accounts",
		"platform_ciam_systems": "Platform-level CIAM systems",
		"platform_user_ciam_mappings": "Platform-level user CIAM mappings",
		"platform_oidc_tokens": "Platform-level OIDC tokens",
		"platform_oidc_sessions": "Platform-level OIDC sessions",
		"platform_tenant_databases": "Platform tenant database connections",
		"platform_keyvault_secrets": "Platform keyvault secrets",
		"platform_tenant_access": "Platform tenant access permissions",
	}

	if desc, exists := descriptions[tableName]; exists {
		return desc
	}
	return "Database table"
}

func (h *AdminHandler) buildTableQuery(tableName string, page, pageSize int, filters []FilterRequest, orderBy, orderDir string) (string, []interface{}, error) {
	// Start with base query
	query := fmt.Sprintf("SELECT * FROM %s", tableName)
	var args []interface{}
	argIndex := 1

	// Add WHERE clause for filters
	if len(filters) > 0 {
		whereClause := " WHERE "
		conditions := []string{}

		for _, filter := range filters {
			if !h.isValidColumnName(filter.Column) {
				return "", nil, fmt.Errorf("invalid column name: %s", filter.Column)
			}

			condition := ""
			switch filter.Operator {
			case "eq":
				condition = fmt.Sprintf("%s = $%d", filter.Column, argIndex)
			case "ne":
				condition = fmt.Sprintf("%s != $%d", filter.Column, argIndex)
			case "gt":
				condition = fmt.Sprintf("%s > $%d", filter.Column, argIndex)
			case "lt":
				condition = fmt.Sprintf("%s < $%d", filter.Column, argIndex)
			case "gte":
				condition = fmt.Sprintf("%s >= $%d", filter.Column, argIndex)
			case "lte":
				condition = fmt.Sprintf("%s <= $%d", filter.Column, argIndex)
			case "like":
				condition = fmt.Sprintf("%s LIKE $%d", filter.Column, argIndex)
			case "ilike":
				condition = fmt.Sprintf("%s ILIKE $%d", filter.Column, argIndex)
			case "in":
				// For IN operator, we need to handle multiple values
				values := strings.Split(filter.Value, ",")
				placeholders := []string{}
				for _, value := range values {
					placeholders = append(placeholders, fmt.Sprintf("$%d", argIndex))
					args = append(args, strings.TrimSpace(value))
					argIndex++
				}
				condition = fmt.Sprintf("%s IN (%s)", filter.Column, strings.Join(placeholders, ","))
				argIndex-- // Adjust for the loop increment
			case "not_in":
				values := strings.Split(filter.Value, ",")
				placeholders := []string{}
				for _, value := range values {
					placeholders = append(placeholders, fmt.Sprintf("$%d", argIndex))
					args = append(args, strings.TrimSpace(value))
					argIndex++
				}
				condition = fmt.Sprintf("%s NOT IN (%s)", filter.Column, strings.Join(placeholders, ","))
				argIndex-- // Adjust for the loop increment
			default:
				return "", nil, fmt.Errorf("unsupported operator: %s", filter.Operator)
			}

			if filter.Operator != "in" && filter.Operator != "not_in" {
				args = append(args, filter.Value)
			}
			conditions = append(conditions, condition)
			argIndex++
		}

		query += whereClause + strings.Join(conditions, " AND ")
	}

	// Add ORDER BY clause
	if orderBy != "" && h.isValidColumnName(orderBy) {
		query += fmt.Sprintf(" ORDER BY %s %s", orderBy, orderDir)
	}

	// Add LIMIT and OFFSET
	offset := (page - 1) * pageSize
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, pageSize, offset)

	return query, args, nil
}

func (h *AdminHandler) buildCountQuery(tableName string, filters []FilterRequest) (string, []interface{}, error) {
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s", tableName)
	var args []interface{}
	argIndex := 1

	// Add WHERE clause for filters (same logic as buildTableQuery)
	if len(filters) > 0 {
		whereClause := " WHERE "
		conditions := []string{}

		for _, filter := range filters {
			if !h.isValidColumnName(filter.Column) {
				return "", nil, fmt.Errorf("invalid column name: %s", filter.Column)
			}

			condition := ""
			switch filter.Operator {
			case "eq":
				condition = fmt.Sprintf("%s = $%d", filter.Column, argIndex)
			case "ne":
				condition = fmt.Sprintf("%s != $%d", filter.Column, argIndex)
			case "gt":
				condition = fmt.Sprintf("%s > $%d", filter.Column, argIndex)
			case "lt":
				condition = fmt.Sprintf("%s < $%d", filter.Column, argIndex)
			case "gte":
				condition = fmt.Sprintf("%s >= $%d", filter.Column, argIndex)
			case "lte":
				condition = fmt.Sprintf("%s <= $%d", filter.Column, argIndex)
			case "like":
				condition = fmt.Sprintf("%s LIKE $%d", filter.Column, argIndex)
			case "ilike":
				condition = fmt.Sprintf("%s ILIKE $%d", filter.Column, argIndex)
			case "in":
				values := strings.Split(filter.Value, ",")
				placeholders := []string{}
				for _, value := range values {
					placeholders = append(placeholders, fmt.Sprintf("$%d", argIndex))
					args = append(args, strings.TrimSpace(value))
					argIndex++
				}
				condition = fmt.Sprintf("%s IN (%s)", filter.Column, strings.Join(placeholders, ","))
				argIndex--
			case "not_in":
				values := strings.Split(filter.Value, ",")
				placeholders := []string{}
				for _, value := range values {
					placeholders = append(placeholders, fmt.Sprintf("$%d", argIndex))
					args = append(args, strings.TrimSpace(value))
					argIndex++
				}
				condition = fmt.Sprintf("%s NOT IN (%s)", filter.Column, strings.Join(placeholders, ","))
				argIndex--
			default:
				return "", nil, fmt.Errorf("unsupported operator: %s", filter.Operator)
			}

			if filter.Operator != "in" && filter.Operator != "not_in" {
				args = append(args, filter.Value)
			}
			conditions = append(conditions, condition)
			argIndex++
		}

		query += whereClause + strings.Join(conditions, " AND ")
	}

	return query, args, nil
}

func (h *AdminHandler) isValidTableName(tableName string) bool {
	// Allow only alphanumeric characters and underscores
	for _, char := range tableName {
		if !((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || (char >= '0' && char <= '9') || char == '_') {
			return false
		}
	}
	return len(tableName) > 0
}

func (h *AdminHandler) isValidColumnName(columnName string) bool {
	// Allow only alphanumeric characters and underscores
	for _, char := range columnName {
		if !((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || (char >= '0' && char <= '9') || char == '_') {
			return false
		}
	}
	return len(columnName) > 0
}
