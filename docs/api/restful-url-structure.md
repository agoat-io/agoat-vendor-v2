# RESTful URL Structure Analysis & Recommendations

## Current URL Structure

```
GET    /api/status                           # Health check
GET    /api/sites                           # List all sites
POST   /api/sites                           # Create a site
GET    /api/sites/{id}                      # Get a specific site
PUT    /api/sites/{id}                      # Update a site
DELETE /api/sites/{id}                      # Delete a site
GET    /api/sites/{siteId}/posts            # List posts for a site
POST   /api/sites/{siteId}/posts            # Create a post for a site
GET    /api/sites/{siteId}/posts/{id}       # Get a specific post
PUT    /api/sites/{siteId}/posts/{id}       # Update a post
DELETE /api/sites/{siteId}/posts/{id}       # Delete a post
GET    /api/sites/{siteId}/posts/slug/{slug} # Get post by slug
```

## RESTful Analysis

### ✅ **Strengths (Already RESTful)**
1. **Resource-based naming**: Clear resource identification (`sites`, `posts`)
2. **Proper HTTP methods**: GET, POST, PUT, DELETE used semantically
3. **Hierarchical relationships**: `/sites/{siteId}/posts` shows ownership
4. **Consistent patterns**: Similar structure across endpoints
5. **Plural nouns**: Resources are plural (`sites`, `posts`)

### ❌ **Areas for Improvement**

#### 1. **Inconsistent Parameter Naming**
- **Current**: `/sites/{id}` vs `/sites/{siteId}/posts/{id}`
- **Better**: Use consistent parameter names
- **Recommended**: `/sites/{siteId}` and `/sites/{siteId}/posts/{postId}`

#### 2. **Non-RESTful Slug Endpoint**
- **Current**: `/sites/{siteId}/posts/slug/{slug}`
- **Issue**: `slug` is not a resource, it's a query parameter
- **Better**: Use query parameters or a different approach

#### 3. **Missing Standard REST Patterns**
- **Current**: No filtering, sorting, or pagination in URL structure
- **Better**: Use query parameters for these operations

## **Recommended RESTful URL Structure**

### **Core Resources**
```
# Sites
GET    /api/sites                           # List sites (with pagination/filtering)
POST   /api/sites                           # Create a site
GET    /api/sites/{siteId}                  # Get a specific site
PUT    /api/sites/{siteId}                  # Update a site
DELETE /api/sites/{siteId}                  # Delete a site

# Posts (nested under sites)
GET    /api/sites/{siteId}/posts            # List posts for a site
POST   /api/sites/{siteId}/posts            # Create a post for a site
GET    /api/sites/{siteId}/posts/{postId}   # Get a specific post
PUT    /api/sites/{siteId}/posts/{postId}   # Update a post
DELETE /api/sites/{siteId}/posts/{postId}   # Delete a post

# Users (if needed)
GET    /api/sites/{siteId}/users            # List users for a site
POST   /api/sites/{siteId}/users            # Create a user for a site
GET    /api/sites/{siteId}/users/{userId}   # Get a specific user
PUT    /api/sites/{siteId}/users/{userId}   # Update a user
DELETE /api/sites/{siteId}/users/{userId}   # Delete a user
```

### **Query Parameters for Filtering/Sorting**
```
# Pagination
GET /api/sites/{siteId}/posts?page=1&per_page=10

# Filtering
GET /api/sites/{siteId}/posts?status=published
GET /api/sites/{siteId}/posts?author=john
GET /api/sites/{siteId}/posts?published=true

# Sorting
GET /api/sites/{siteId}/posts?sort=created_at&order=desc
GET /api/sites/{siteId}/posts?sort=title&order=asc

# Search
GET /api/sites/{siteId}/posts?search=keyword
GET /api/sites/{siteId}/posts?q=search+term

# Combined
GET /api/sites/{siteId}/posts?status=published&page=1&per_page=10&sort=created_at&order=desc
```

### **Alternative Approaches for Slug-based Access**

#### Option 1: Query Parameter (Recommended)
```
GET /api/sites/{siteId}/posts?slug=my-post-slug
```

#### Option 2: Separate Endpoint (Less RESTful)
```
GET /api/sites/{siteId}/posts/by-slug/{slug}
```

#### Option 3: Content Negotiation
```
GET /api/sites/{siteId}/posts/{postId}?format=slug&value=my-post-slug
```

## **Implementation Recommendations**

### 1. **Update Parameter Names**
```go
// Current
api.HandleFunc("/sites/{id}", app.siteHandler)
api.HandleFunc("/sites/{siteId}/posts/{id}", app.postHandler)

// Recommended
api.HandleFunc("/sites/{siteId}", app.siteHandler)
api.HandleFunc("/sites/{siteId}/posts/{postId}", app.postHandler)
```

### 2. **Replace Slug Endpoint with Query Parameter**
```go
// Remove this endpoint
api.HandleFunc("/sites/{siteId}/posts/slug/{slug}", app.postBySlugHandler)

// Handle slug in the main posts endpoint
func (app *App) postsHandler(w http.ResponseWriter, r *http.Request) {
    // ... existing code ...
    
    // Handle slug query parameter
    if slug := r.URL.Query().Get("slug"); slug != "" {
        post, err := app.posts.GetBySlug(slug, siteID)
        // ... handle response ...
        return
    }
    
    // ... existing list logic ...
}
```

### 3. **Add Standard Query Parameters**
```go
// Support for filtering, sorting, pagination
type PostQueryParams struct {
    Page      int    `json:"page"`
    PerPage   int    `json:"per_page"`
    Status    string `json:"status"`
    Published *bool  `json:"published"`
    Author    string `json:"author"`
    Search    string `json:"search"`
    Sort      string `json:"sort"`
    Order     string `json:"order"`
    Slug      string `json:"slug"`
}
```

## **Benefits of These Changes**

1. **Consistency**: Uniform parameter naming across all endpoints
2. **Standards Compliance**: Follows REST conventions more closely
3. **Flexibility**: Query parameters allow for complex filtering/sorting
4. **Maintainability**: Easier to extend and modify
5. **Documentation**: More intuitive for API consumers

## **Migration Strategy**

1. **Phase 1**: Add new endpoints alongside existing ones
2. **Phase 2**: Update frontend to use new endpoints
3. **Phase 3**: Deprecate old endpoints with proper versioning
4. **Phase 4**: Remove old endpoints

## **Versioning Strategy**

```
# Version 1 (current)
/api/v1/sites/{siteId}/posts/slug/{slug}

# Version 2 (recommended)
/api/v2/sites/{siteId}/posts?slug={slug}
```

This approach ensures backward compatibility while moving toward a more RESTful structure.
