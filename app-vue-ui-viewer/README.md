# AGoat Publisher Viewer Microfrontend

A Vue.js microfrontend component for displaying blog posts that can be embedded in any website without requiring installation of dependencies.

## Features

- **Single Post Viewer**: Display individual blog posts with markdown rendering
- **Posts List**: Show paginated lists of blog posts
- **Authentication-aware**: Different content for logged-in vs anonymous users
- **Configurable**: Customizable via URL parameters or JavaScript API
- **SEO-friendly**: Server-side rendering support
- **Responsive**: Mobile-first design with Tailwind CSS

## Quick Start

### 1. Development

```bash
npm install
npm run dev
```

The viewer will be available at `http://localhost:5175`

### 2. Build for Production

```bash
npm run build
```

This creates a standalone build that can be deployed to any static hosting service.

## Usage

### URL Parameters

The viewer can be configured via URL parameters:

#### Single Post Viewer
```
http://localhost:5175/?mode=single&postId=123
http://localhost:5175/?mode=single&postSlug=my-post-title
```

#### Posts List Viewer
```
http://localhost:5175/?mode=list&page=1&limit=10
```

#### Configuration Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `mode` | `single` \| `list` | - | View mode |
| `postId` | string | - | Post ID for single view |
| `postSlug` | string | - | Post slug for single view |
| `apiUrl` | string | `http://localhost:8080/api` | API endpoint |
| `showLoginPrompt` | boolean | `true` | Show login prompt for truncated content |
| `maxContentLength` | number | `800` | Max content length for anonymous users |
| `isAuthenticated` | boolean | `false` | User authentication status |
| `showPublishedOnly` | boolean | `true` | Show only published posts |
| `page` | number | `1` | Page number for list view |
| `limit` | number | `10` | Posts per page |

### JavaScript API

The viewer can also be controlled via JavaScript messages:

```javascript
// Set configuration
window.postMessage({
  type: 'set-config',
  apiUrl: 'https://api.example.com',
  isAuthenticated: true,
  maxContentLength: 1000
}, '*')

// Show single post by ID
window.postMessage({
  type: 'set-post-id',
  postId: '123'
}, '*')

// Show single post by slug
window.postMessage({
  type: 'set-post-slug',
  postSlug: 'my-post-title'
}, '*')

// Switch to list view
window.postMessage({
  type: 'set-view-mode',
  mode: 'list'
}, '*')
```

### Event Handling

The viewer emits events via `postMessage`:

```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'post-loaded') {
    console.log('Post loaded:', event.data.post)
  } else if (event.data.type === 'login-requested') {
    // Handle login request
    window.location.href = '/login'
  }
})
```

## Embedding in Other Websites

### Iframe Embedding

```html
<!-- Single post -->
<iframe 
  src="http://localhost:5175/?mode=single&postSlug=my-post-title"
  width="100%" 
  height="600"
  frameborder="0">
</iframe>

<!-- Posts list -->
<iframe 
  src="http://localhost:5175/?mode=list&page=1&limit=5"
  width="100%" 
  height="800"
  frameborder="0">
</iframe>
```

### JavaScript Embedding

```html
<div id="post-viewer"></div>

<script>
// Load the viewer
const script = document.createElement('script')
script.src = 'http://localhost:5175/agoat-publisher-viewer.js'
document.head.appendChild(script)

script.onload = () => {
  // Initialize the viewer
  const viewer = new AGoatPublisherViewer({
    target: '#post-viewer',
    props: {
      mode: 'single',
      postSlug: 'my-post-title',
      apiUrl: 'https://api.example.com'
    }
  })
}
</script>
```

## API Requirements

The viewer expects the following API endpoints:

### Get Single Post
```
GET /api/posts/{id}
GET /api/posts/slug/{slug}
```

Response:
```json
{
  "data": {
    "id": "123",
    "title": "Post Title",
    "content": "Markdown content...",
    "slug": "post-title",
    "published": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "user_id": "456"
  }
}
```

### Get Posts List
```
GET /api/posts?page=1&limit=10&published=true
```

Response:
```json
{
  "data": [
    {
      "id": "123",
      "title": "Post Title",
      "content": "Markdown content...",
      "slug": "post-title",
      "published": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "user_id": "456"
    }
  ],
  "total": 100
}
```

## Styling

The viewer uses Tailwind CSS and can be customized by overriding CSS classes. The main container has the class `viewer-container` and post content uses `post-content`.

## Development

### Project Structure

```
src/
├── components/
│   ├── PostViewer.vue      # Single post display
│   └── PostsList.vue       # Posts list display
├── assets/
│   └── main.css           # Tailwind CSS and custom styles
├── App.vue                # Main app component
└── main.ts               # Entry point
```

### Adding New Features

1. Create new components in `src/components/`
2. Add them to `App.vue` with appropriate conditions
3. Update the URL parameter parsing in `App.vue`
4. Add new message types for JavaScript API

## License

MIT License
