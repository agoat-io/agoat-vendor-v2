# Database Schema Extraction Tool

This tool extracts the actual database schema from your live CockroachDB/PostgreSQL database and generates documentation and SQL files.

## Features

- **Live Schema Extraction**: Connects to your actual database
- **Complete Schema**: Extracts tables, columns, indexes, foreign keys, and primary keys
- **Multiple Output Formats**: Generates JSON, SQL, and Markdown documentation
- **Same Connection**: Uses the same connection method as your API

## Usage

### Option 1: Using the Script (Recommended)
```bash
# From the project root
./local-scripts/extract-schema.sh
```

This script will:
- Load GCP secrets automatically
- Set up environment variables
- Run the schema extraction tool
- Show helpful output and error messages

### Option 2: Manual Execution

#### Prerequisites

1. **Database Running**: Make sure CockroachDB is running and accessible
2. **Database Created**: Ensure the `blog` database exists
3. **Go Installed**: Go 1.21 or later

#### Run the Tool

```bash
# Install dependencies
go mod tidy

# Run the schema extraction
go run extract-schema.go
```

### Output Files

The tool generates three files:

1. **`extracted-schema.json`** - Complete schema in JSON format
2. **`extracted-schema.sql`** - SQL CREATE statements
3. **`EXTRACTED-SCHEMA.md`** - Human-readable documentation

## Configuration

The tool loads database configuration from environment variables (DSN, CA, DB_DRIVER) that are set by the startup script. This ensures no sensitive connection information is stored in configuration files.

## Workflow

1. **Start CockroachDB** and create the database
2. **Run your API** to create the initial schema
3. **Run this tool** to extract the actual schema
4. **Review generated files** for documentation and version control

## Example Output

### JSON Schema
```json
{
  "users": {
    "table_name": "users",
    "columns": [
      {
        "name": "id",
        "data_type": "integer",
        "is_nullable": "NO",
        "default_value": "nextval('users_id_seq'::regclass)",
        "is_primary_key": true
      }
    ],
    "indexes": [],
    "foreign_keys": [],
    "primary_keys": ["id"],
    "create_table": "CREATE TABLE users (id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass), ...);"
  }
}
```

### SQL Schema
```sql
-- Table: users
CREATE TABLE users (
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Index: idx_users_username
CREATE INDEX idx_users_username ON users (username);
```

### Markdown Documentation
```markdown
# Extracted Database Schema

## Tables

### users

**Columns:**
- **id** (integer) - PRIMARY KEY - NOT NULL - DEFAULT: nextval('users_id_seq'::regclass)
- **username** (character varying) - NOT NULL
- **email** (character varying) - NOT NULL
- **password_hash** (character varying) - NOT NULL
- **created_at** (timestamp without time zone) - DEFAULT: CURRENT_TIMESTAMP

**Indexes:**
- **idx_users_username** (btree) on (username)
```

## Troubleshooting

### Connection Issues
- Ensure CockroachDB is running on port 26257
- Check that the `blog` database exists
- Verify that the startup script is loading GCP secrets correctly
- Check that DSN environment variable is set properly

### Permission Issues
- Make sure the database user has SELECT permissions on information_schema
- For CockroachDB, ensure the user has appropriate privileges

## Integration

This tool is designed to work seamlessly with your existing API:
- Uses the same database connection configuration
- Generates schema files that can be used for documentation
- Helps maintain schema consistency between development and production
