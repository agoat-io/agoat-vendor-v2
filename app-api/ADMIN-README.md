# Database Admin Panel

A comprehensive admin interface for viewing and managing all database tables in the AGoat Publisher system.

## Features

### 🔍 **Table Overview**
- View all database tables with row counts and descriptions
- Visual table cards with statistics
- Quick access to table data

### 📊 **Data Viewer**
- Paginated table data display
- Sortable columns
- Real-time row count and pagination stats

### 🔧 **Advanced Filtering**
- Multiple filter conditions per table
- Support for various operators:
  - `eq` - Equals
  - `ne` - Not Equals
  - `like` - Contains (case sensitive)
  - `ilike` - Contains (case insensitive)
  - `gt` - Greater Than
  - `lt` - Less Than
  - `gte` - Greater Than or Equal
  - `lte` - Less Than or Equal
  - `in` - In List (comma-separated values)
  - `not_in` - Not In List (comma-separated values)

### 📤 **Data Export**
- Export filtered data to CSV format
- Includes all visible columns and rows

### 🔄 **Real-time Updates**
- Refresh data without page reload
- Apply/clear filters dynamically
- Navigate through paginated results

## Access

### URL
```
https://dev.np-topvitaminsupply.com/admin
```

### Authentication
- Available to any logged-in user
- No additional admin role required (configurable)

## API Endpoints

### Get All Tables
```http
GET /api/admin/tables
```

**Response:**
```json
{
  "tables": [
    {
      "name": "users",
      "description": "User accounts with authentication information",
      "row_count": 150,
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "is_nullable": false,
          "is_primary_key": true,
          "is_unique": false
        }
      ]
    }
  ],
  "count": 8
}
```

### Get Table Data
```http
GET /api/admin/tables/{table}?page=1&page_size=50&filters=[{"column":"status","operator":"eq","value":"active"}]
```

**Parameters:**
- `page` - Page number (default: 1)
- `page_size` - Rows per page (default: 50, max: 1000)
- `filters` - JSON array of filter objects
- `order_by` - Column to sort by
- `order_dir` - Sort direction (asc/desc)

**Response:**
```json
{
  "table_name": "users",
  "columns": ["id", "username", "email", "status"],
  "rows": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "status": "active"
    }
  ],
  "total_rows": 150,
  "page": 1,
  "page_size": 50,
  "total_pages": 3
}
```

### Execute Custom Query
```http
POST /api/admin/query
```

**Request Body:**
```json
{
  "table": "users",
  "page": 1,
  "page_size": 50,
  "filters": [
    {
      "column": "status",
      "operator": "eq",
      "value": "active"
    }
  ],
  "order_by": "created_at",
  "order_dir": "desc"
}
```

## Security Features

### SQL Injection Prevention
- Parameterized queries for all database operations
- Input validation for table and column names
- Whitelist-based filtering for allowed characters

### Access Control
- Read-only operations (no data modification)
- Table name validation
- Column name validation

### Rate Limiting
- Built-in pagination limits (max 1000 rows per request)
- Request logging for audit trails

## Supported Tables

The admin panel automatically detects and displays all tables in the `public` schema:

- **users** - User accounts with authentication information
- **posts** - Content posts and articles
- **customers** - Customer/tenant information
- **sites** - Sites within customers
- **ciam_systems** - CIAM authentication system configurations
- **user_ciam_mappings** - User-to-CIAM system mappings
- **migration_status** - Database migration tracking
- **platform_users** - Platform-level user accounts
- **platform_ciam_systems** - Platform-level CIAM systems
- **platform_user_ciam_mappings** - Platform-level user CIAM mappings
- **platform_oidc_tokens** - Platform-level OIDC tokens
- **platform_oidc_sessions** - Platform-level OIDC sessions
- **platform_tenant_databases** - Platform tenant database connections
- **platform_keyvault_secrets** - Platform keyvault secrets
- **platform_tenant_access** - Platform tenant access permissions

## Usage Examples

### Basic Table Viewing
1. Navigate to `/admin`
2. Click on any table card to view its data
3. Use pagination controls to navigate through results

### Filtering Data
1. Select a column from the dropdown
2. Choose an operator (equals, contains, etc.)
3. Enter a filter value
4. Click "Add Filter" to add the condition
5. Click "Apply Filters" to execute the query

### Exporting Data
1. Apply any desired filters
2. Click "Export CSV" button
3. File will be downloaded with current view data

### Advanced Filtering
- Use "In List" operator with comma-separated values: `active,pending,disabled`
- Use "Contains" for partial text matching
- Combine multiple filters with AND logic

## Technical Implementation

### Backend (Go)
- **AdminHandler** - Main handler for admin operations
- **TableInfo** - Structure for table metadata
- **TableData** - Structure for paginated data
- **FilterRequest** - Structure for filter conditions

### Frontend (HTML/JavaScript)
- **DatabaseAdmin** class - Main frontend controller
- Responsive design with CSS Grid and Flexbox
- Real-time data updates without page refresh
- CSV export functionality

### Database Queries
- Dynamic SQL generation with parameterized queries
- Support for complex WHERE clauses
- Efficient pagination with LIMIT/OFFSET
- Column metadata extraction from information_schema

## Future Enhancements

- [ ] Role-based access control
- [ ] Data modification capabilities (with confirmation)
- [ ] Query history and saved filters
- [ ] Advanced search across multiple tables
- [ ] Data visualization and charts
- [ ] Bulk operations
- [ ] Real-time data updates via WebSocket
- [ ] Custom SQL query execution (admin-only)
- [ ] Data backup and restore functionality
- [ ] Audit logging for all admin actions

## Troubleshooting

### Common Issues

**"Failed to load tables"**
- Check database connection
- Verify user has SELECT permissions on information_schema

**"Invalid table name"**
- Table names must contain only alphanumeric characters and underscores
- Table must exist in the public schema

**"No data found"**
- Check if table has data
- Verify filters are not too restrictive
- Check pagination settings

**"Export not working"**
- Ensure browser allows file downloads
- Check for JavaScript errors in browser console
- Verify data is loaded before attempting export

### Performance Tips

- Use filters to limit large datasets
- Adjust page size based on data volume
- Avoid exporting extremely large datasets
- Use specific column filters when possible
