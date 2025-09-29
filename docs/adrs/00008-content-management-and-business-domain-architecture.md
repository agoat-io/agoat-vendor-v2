# ADR-00008: Content Management and Business Domain Architecture

## Status
**Accepted** - 2024-09-28

## Context
The AGoat Publisher system needs to support both general content management (blog posts, articles) and specific business domain functionality (Thorne health products, patient management). The system must provide flexible content creation, management, and delivery while supporting business-specific workflows and data models.

## Decision
Implement a hybrid content management and business domain architecture with:
- **Unified content management** for blog posts and articles
- **Business domain separation** for Thorne-specific functionality
- **Rich text editing** with Wysimark and markdown support
- **Content versioning** and status management
- **Media management** with upload and optimization
- **SEO optimization** with meta tags and URL slugs
- **Business domain APIs** for Thorne products and patient management
- **Content sanitization** for security

## Rationale
1. **Flexibility**: Unified content management supports various content types
2. **Business Support**: Separate domain models support specific business needs
3. **User Experience**: Rich text editing provides modern content creation
4. **Content Quality**: Versioning and status management ensure content quality
5. **Performance**: Media optimization and SEO improve content delivery
6. **Security**: Content sanitization prevents XSS attacks
7. **Scalability**: Domain separation allows independent scaling

## Consequences

### Positive
- **Content Quality**: Rich text editing and versioning improve content
- **Business Support**: Specific domain models support business needs
- **User Experience**: Modern content creation and management tools
- **Performance**: Optimized content delivery and SEO
- **Security**: Content sanitization prevents security issues
- **Flexibility**: Unified system supports multiple content types
- **Scalability**: Domain separation allows independent scaling

### Negative
- **Complexity**: More complex system with multiple domains
- **Development Time**: Additional time for business domain features
- **Maintenance**: More components to maintain and update
- **Learning Curve**: Team needs expertise in multiple domains
- **Testing**: More test scenarios for different content types

## Implementation Details

### Content Management Architecture
```sql
-- Core content management
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id),
    title VARCHAR(500) NOT NULL,
    content TEXT,
    excerpt TEXT,
    slug VARCHAR(500) UNIQUE,
    status VARCHAR(20) DEFAULT 'draft',
    published_at TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Content versioning
CREATE TABLE post_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id),
    version_number INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Media management
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    alt_text TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Business Domain Architecture (Thorne)
```sql
-- Thorne product catalog
CREATE TABLE thorne_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    sku VARCHAR(100) UNIQUE,
    wholesale_price DECIMAL(10,2),
    retail_price DECIMAL(10,2),
    in_stock BOOLEAN DEFAULT TRUE,
    benefits TEXT[],
    ingredients TEXT[],
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Patient management
CREATE TABLE thorne_patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    health_goals TEXT,
    registration_date TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Order management
CREATE TABLE thorne_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES thorne_patients(id),
    order_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(10,2),
    shipping_address JSONB,
    billing_address JSONB
);
```

### Frontend Content Management
```typescript
// Rich text editor integration
import WysimarkEditor from '@wysimark/react';

const PostEditor = () => {
    const [content, setContent] = useState('');
    
    return (
        <WysimarkEditor
            value={content}
            onChange={setContent}
            placeholder="Write your post content..."
            features={[
                'bold', 'italic', 'underline',
                'heading', 'list', 'link',
                'image', 'table', 'code'
            ]}
        />
    );
};

// Content sanitization
import DOMPurify from 'dompurify';

const sanitizeContent = (content: string): string => {
    return DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'a', 'img'],
        ALLOWED_ATTR: ['href', 'target', 'alt', 'src', 'title']
    });
};
```

### Key Features
1. **Rich Text Editing**: Modern WYSIWYG editor with markdown support
2. **Content Versioning**: Complete version history for all content
3. **Media Management**: Upload, optimization, and organization of media files
4. **SEO Optimization**: Meta tags, URL slugs, and structured data
5. **Content Sanitization**: XSS prevention in user-generated content
6. **Business Domain Support**: Specific models for Thorne products and patients
7. **Status Management**: Draft, published, and archived content states

### API Endpoints
```go
// Content management endpoints
GET    /api/sites/{siteId}/posts           // List posts
POST   /api/sites/{siteId}/posts           // Create post
GET    /api/sites/{siteId}/posts/{id}      // Get post
PUT    /api/sites/{siteId}/posts/{id}      // Update post
DELETE /api/sites/{siteId}/posts/{id}      // Delete post

// Thorne business domain endpoints
GET    /api/thorne/products                // List products
GET    /api/thorne/products/{id}           // Get product
GET    /api/thorne/categories              // List categories
POST   /api/thorne/register                // Register patient
GET    /api/thorne/patients                // List patients
POST   /api/thorne/orders                  // Create order
```

### Content Workflow
1. **Content Creation**: Rich text editor with real-time preview
2. **Content Review**: Version control and approval workflows
3. **Content Publishing**: Status management and scheduling
4. **Content Delivery**: Optimized delivery with SEO
5. **Content Management**: Media management and organization

### Business Domain Workflow (Thorne)
1. **Patient Registration**: Secure patient onboarding
2. **Product Catalog**: Comprehensive product management
3. **Order Management**: Complete order lifecycle
4. **Patient Portal**: Personalized patient experience
5. **Educational Content**: Health education and resources

## References
- [Wysimark Documentation](https://wysimark.com/)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Content Management Requirements](../../requirements-and-user-stories/final-functional/database-requirements.md)
- [User Stories: Content Creation](../../requirements-and-user-stories/user-stories/content-creator-create-post.md)
- [User Stories: Thorne Products](../../requirements-and-user-stories/user-stories/thorne-browse-products.md)
- [Security Requirements](../../requirements-and-user-stories/final-nonfunctional/security-requirements.md)
