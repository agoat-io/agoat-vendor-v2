package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"text/template"

	_ "github.com/lib/pq"
)

type DatabaseConfig struct {
	Driver string `json:"driver"`
	DSN    string `json:"dsn"`
	CA     string `json:"ca"`
}

type Config struct {
	Database DatabaseConfig `json:"database"`
}

type TableInfo struct {
	TableName    string   `json:"table_name"`
	Columns      []Column `json:"columns"`
	Indexes      []Index  `json:"indexes"`
	ForeignKeys  []FK     `json:"foreign_keys"`
	PrimaryKeys  []string `json:"primary_keys"`
	CreateTable  string   `json:"create_table"`
}

type Column struct {
	Name         string `json:"name"`
	DataType     string `json:"data_type"`
	IsNullable   string `json:"is_nullable"`
	DefaultValue string `json:"default_value"`
	IsPrimaryKey bool   `json:"is_primary_key"`
}

type Index struct {
	Name        string `json:"name"`
	Columns     string `json:"columns"`
	IsUnique    bool   `json:"is_unique"`
	IndexType   string `json:"index_type"`
}

type FK struct {
	ConstraintName string `json:"constraint_name"`
	TableName      string `json:"table_name"`
	ColumnName     string `json:"column_name"`
	ForeignTable   string `json:"foreign_table"`
	ForeignColumn  string `json:"foreign_column"`
}

func main() {
	// Load config
	config, err := loadConfig()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	// Connect to database
	db, err := sql.Open(config.Database.Driver, config.Database.DSN)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	fmt.Println("Connected to database successfully!")

	// Extract schema
	schema, err := extractSchema(db)
	if err != nil {
		log.Fatal("Failed to extract schema:", err)
	}

	// Generate files
	if err := generateSchemaFiles(schema); err != nil {
		log.Fatal("Failed to generate schema files:", err)
	}

	fmt.Println("Schema extraction completed successfully!")
}

func loadConfig() (*Config, error) {
	config := &Config{
		Database: DatabaseConfig{
			Driver: "postgres",
		},
	}
	
	// Load from environment variables only
	if dsn := os.Getenv("DSN"); dsn != "" {
		config.Database.DSN = dsn
	} else {
		return nil, fmt.Errorf("DSN environment variable is required")
	}
	
	if ca := os.Getenv("CA"); ca != "" {
		config.Database.CA = ca
	}
	
	if driver := os.Getenv("DB_DRIVER"); driver != "" {
		config.Database.Driver = driver
	}
	
	return config, nil
}

func extractSchema(db *sql.DB) (map[string]*TableInfo, error) {
	schema := make(map[string]*TableInfo)

	// Get all tables
	tables, err := getTables(db)
	if err != nil {
		return nil, err
	}

	for _, tableName := range tables {
		tableInfo := &TableInfo{TableName: tableName}

		// Get columns
		columns, err := getColumns(db, tableName)
		if err != nil {
			return nil, err
		}
		tableInfo.Columns = columns

		// Get indexes
		indexes, err := getIndexes(db, tableName)
		if err != nil {
			return nil, err
		}
		tableInfo.Indexes = indexes

		// Get foreign keys
		fks, err := getForeignKeys(db, tableName)
		if err != nil {
			return nil, err
		}
		tableInfo.ForeignKeys = fks

		// Get primary keys
		pks, err := getPrimaryKeys(db, tableName)
		if err != nil {
			return nil, err
		}
		tableInfo.PrimaryKeys = pks

		// Get CREATE TABLE statement
		createTable, err := getCreateTable(db, tableName)
		if err != nil {
			return nil, err
		}
		tableInfo.CreateTable = createTable

		schema[tableName] = tableInfo
	}

	return schema, nil
}

func getTables(db *sql.DB) ([]string, error) {
	query := `
		SELECT table_name 
		FROM information_schema.tables 
		WHERE table_schema = 'public' 
		AND table_type = 'BASE TABLE'
		ORDER BY table_name
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tables []string
	for rows.Next() {
		var tableName string
		if err := rows.Scan(&tableName); err != nil {
			return nil, err
		}
		tables = append(tables, tableName)
	}

	return tables, nil
}

func getColumns(db *sql.DB, tableName string) ([]Column, error) {
	query := `
		SELECT 
			column_name,
			data_type,
			is_nullable,
			column_default,
			CASE WHEN pk.pk_column_name IS NOT NULL THEN true ELSE false END as is_primary_key
		FROM information_schema.columns c
		LEFT JOIN (
			SELECT kcu.column_name as pk_column_name
			FROM information_schema.table_constraints tc
			JOIN information_schema.key_column_usage kcu 
				ON tc.constraint_name = kcu.constraint_name
			WHERE tc.constraint_type = 'PRIMARY KEY' 
				AND tc.table_name = $1
		) pk ON c.column_name = pk.pk_column_name
		WHERE c.table_name = $1
		ORDER BY ordinal_position
	`

	rows, err := db.Query(query, tableName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var columns []Column
	for rows.Next() {
		var col Column
		var isPK sql.NullBool
		var defaultValue sql.NullString
		if err := rows.Scan(&col.Name, &col.DataType, &col.IsNullable, &defaultValue, &isPK); err != nil {
			return nil, err
		}
		col.IsPrimaryKey = isPK.Bool
		if defaultValue.Valid {
			col.DefaultValue = defaultValue.String
		}
		columns = append(columns, col)
	}

	return columns, nil
}

func getIndexes(db *sql.DB, tableName string) ([]Index, error) {
	query := `
		SELECT 
			indexname,
			indexdef
		FROM pg_indexes 
		WHERE tablename = $1 
		AND indexname NOT LIKE '%_pkey'
		ORDER BY indexname
	`

	rows, err := db.Query(query, tableName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var indexes []Index
	for rows.Next() {
		var index Index
		var indexDef string
		if err := rows.Scan(&index.Name, &indexDef); err != nil {
			return nil, err
		}

		// Parse index definition
		index.IsUnique = strings.Contains(indexDef, "UNIQUE")
		if strings.Contains(indexDef, "btree") {
			index.IndexType = "btree"
		} else if strings.Contains(indexDef, "hash") {
			index.IndexType = "hash"
		}

		// Extract column names from index definition
		start := strings.Index(indexDef, "(")
		end := strings.LastIndex(indexDef, ")")
		if start != -1 && end != -1 {
			index.Columns = indexDef[start+1 : end]
		}

		indexes = append(indexes, index)
	}

	return indexes, nil
}

func getForeignKeys(db *sql.DB, tableName string) ([]FK, error) {
	query := `
		SELECT 
			tc.constraint_name,
			tc.table_name,
			kcu.column_name,
			ccu.table_name AS foreign_table_name,
			ccu.column_name AS foreign_column_name
		FROM information_schema.table_constraints AS tc
		JOIN information_schema.key_column_usage AS kcu
			ON tc.constraint_name = kcu.constraint_name
		JOIN information_schema.constraint_column_usage AS ccu
			ON ccu.constraint_name = tc.constraint_name
		WHERE tc.constraint_type = 'FOREIGN KEY' 
			AND tc.table_name = $1
		ORDER BY tc.constraint_name
	`

	rows, err := db.Query(query, tableName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var fks []FK
	for rows.Next() {
		var fk FK
		if err := rows.Scan(&fk.ConstraintName, &fk.TableName, &fk.ColumnName, &fk.ForeignTable, &fk.ForeignColumn); err != nil {
			return nil, err
		}
		fks = append(fks, fk)
	}

	return fks, nil
}

func getPrimaryKeys(db *sql.DB, tableName string) ([]string, error) {
	query := `
		SELECT kcu.column_name
		FROM information_schema.table_constraints tc
		JOIN information_schema.key_column_usage kcu 
			ON tc.constraint_name = kcu.constraint_name
		WHERE tc.constraint_type = 'PRIMARY KEY' 
			AND tc.table_name = $1
		ORDER BY kcu.ordinal_position
	`

	rows, err := db.Query(query, tableName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pks []string
	for rows.Next() {
		var pk string
		if err := rows.Scan(&pk); err != nil {
			return nil, err
		}
		pks = append(pks, pk)
	}

	return pks, nil
}

func getCreateTable(db *sql.DB, tableName string) (string, error) {
	query := `
		SELECT 
			'CREATE TABLE ' || quote_ident(table_name) || ' (' ||
			string_agg(
				quote_ident(column_name) || ' ' || 
				data_type || 
				CASE 
					WHEN character_maximum_length IS NOT NULL 
					THEN '(' || character_maximum_length || ')'
					ELSE ''
				END ||
				CASE 
					WHEN is_nullable = 'NO' THEN ' NOT NULL'
					ELSE ''
				END ||
				CASE 
					WHEN column_default IS NOT NULL 
					THEN ' DEFAULT ' || column_default
					ELSE ''
				END,
				', '
				ORDER BY ordinal_position
			) || ');' as create_statement
		FROM information_schema.columns
		WHERE table_name = $1
		GROUP BY table_name
	`

	var createTable string
	err := db.QueryRow(query, tableName).Scan(&createTable)
	return createTable, err
}

func generateSchemaFiles(schema map[string]*TableInfo) error {
	// Generate JSON schema file
	jsonData, err := json.MarshalIndent(schema, "", "  ")
	if err != nil {
		return err
	}

	if err := os.WriteFile("extracted-schema.json", jsonData, 0644); err != nil {
		return err
	}

	// Generate SQL schema file
	if err := generateSQLSchema(schema); err != nil {
		return err
	}

	// Generate documentation
	if err := generateDocumentation(schema); err != nil {
		return err
	}

	return nil
}

func generateSQLSchema(schema map[string]*TableInfo) error {
	file, err := os.Create("extracted-schema.sql")
	if err != nil {
		return err
	}
	defer file.Close()

	// Write header
	file.WriteString("-- Extracted Database Schema\n")
	file.WriteString("-- Generated automatically from live database\n\n")

	// Write CREATE TABLE statements
	for tableName, tableInfo := range schema {
		file.WriteString(fmt.Sprintf("-- Table: %s\n", tableName))
		file.WriteString(tableInfo.CreateTable)
		file.WriteString("\n\n")

		// Write indexes
		for _, index := range tableInfo.Indexes {
			file.WriteString(fmt.Sprintf("-- Index: %s\n", index.Name))
			file.WriteString(fmt.Sprintf("CREATE INDEX %s ON %s (%s);\n", 
				index.Name, tableName, index.Columns))
			file.WriteString("\n")
		}
	}

	return nil
}

func generateDocumentation(schema map[string]*TableInfo) error {
	tmpl := `
# Extracted Database Schema

This schema was automatically extracted from the live database.

## Tables

{{range $tableName, $table := .}}
### {{$tableName}}

**Columns:**
{{range $table.Columns}}
- **{{.Name}}** ({{.DataType}}){{if .IsPrimaryKey}} - PRIMARY KEY{{end}}{{if eq .IsNullable "NO"}} - NOT NULL{{end}}{{if .DefaultValue}} - DEFAULT: {{.DefaultValue}}{{end}}
{{end}}

{{if $table.Indexes}}
**Indexes:**
{{range $table.Indexes}}
- **{{.Name}}** ({{.IndexType}}){{if .IsUnique}} - UNIQUE{{end}} on ({{.Columns}})
{{end}}
{{end}}

{{if $table.ForeignKeys}}
**Foreign Keys:**
{{range $table.ForeignKeys}}
- **{{.ColumnName}}** → {{.ForeignTable}}.{{.ForeignColumn}}
{{end}}
{{end}}

{{end}}
`

	t, err := template.New("doc").Parse(tmpl)
	if err != nil {
		return err
	}

	file, err := os.Create("EXTRACTED-SCHEMA.md")
	if err != nil {
		return err
	}
	defer file.Close()

	return t.Execute(file, schema)
}
