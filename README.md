# AGoat Publisher

A modern blog publishing platform with a Vue.js frontend, Go API backend, and embedded microfrontend viewer.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Go 1.21+
- Google Cloud CLI (for database secrets)
- CockroachDB (or access to a CockroachDB instance)

### One-Command Setup
```bash
# Start everything (API + UI + Embedded Viewer)
./local-scripts/start-full-stack.sh
```

This will:
1. Start the Go API with GCP secrets and hot reload
2. Start the viewer microfrontend on a separate port
3. Start the Vue UI with hot reload
4. Make everything available at:
   - API: http://localhost:8080
   - UI: http://localhost:5173
   - Viewer: http://localhost:5175

## 📁 Project Structure

```
agoat-publisher/
├── app-api/                    # Go API backend
├── app-vue-ui/                 # Main Vue.js application
├── app-vue-ui-viewer/          # Microfrontend viewer (separate project)
├── app-api-database-schema/    # Database schema extraction tools
└── local-scripts/              # Development and deployment scripts
```

## 🎯 Key Features

### Main Application
- **Blog Management**: Create, edit, and publish blog posts
- **Authentication**: Secure login system
- **Rich Text Editor**: Medium-style WYSIWYG editor with markdown support
- **SEO Optimization**: SEO-friendly URLs and meta tags
- **Responsive Design**: Mobile-first design with Tailwind CSS

### Microfrontend Viewer
- **Embeddable**: Can be embedded in any website via iframe
- **Authentication-aware**: Different content for logged-in vs anonymous users
- **Configurable**: Customizable via URL parameters or JavaScript API
- **SEO-friendly**: Proper meta tags and structured data
- **No Dependencies**: Self-contained, no external dependencies required

## 🔧 Development Scripts

### Full Stack Development
```bash
# Start everything (recommended for development)
./local-scripts/start-full-stack.sh
```

### Individual Services
```bash
# API only (with GCP secrets & hot reload)
./local-scripts/start-api.sh

# UI only (with hot reload)
./local-scripts/start-ui.sh

# Build and embed viewer
./local-scripts/build-viewer-embedded.sh

# Rebuild viewer after changes
./local-scripts/rebuild-viewer.sh
```

## 🌐 Using the Embedded Viewer

### Iframe Embedding
```html
<!-- Single post -->
<iframe 
  src="http://localhost:5173/viewer/?mode=single&postSlug=my-post-title"
  width="100%" 
  height="600"
  frameborder="0">
</iframe>

<!-- Posts list -->
<iframe 
  src="http://localhost:5173/viewer/?mode=list&page=1&limit=5"
  width="100%" 
  height="800"
  frameborder="0">
</iframe>
```

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `mode` | `single` \| `list` | View mode |
| `postId` | string | Load post by ID |
| `postSlug` | string | Load post by slug |
| `page` | number | Page number for list view |
| `limit` | number | Posts per page |
| `isAuthenticated` | boolean | User login status |
| `maxContentLength` | number | Content truncation limit |
| `apiUrl` | string | Custom API endpoint |

### JavaScript API
```javascript
// Set configuration
window.postMessage({
  type: 'set-config',
  apiUrl: 'https://api.example.com',
  isAuthenticated: true,
  maxContentLength: 1000
}, '*')

// Show single post
window.postMessage({
  type: 'set-post-slug',
  postSlug: 'my-post-title'
}, '*')

// Listen for events
window.addEventListener('message', (event) => {
  if (event.data.type === 'post-loaded') {
    console.log('Post loaded:', event.data.post)
  }
})
```

## 🗄️ Database

The application uses CockroachDB with secure configuration:

- **Credentials**: Stored in Google Cloud Secret Manager
- **Connection**: Loaded via environment variables
- **Schema**: Auto-generated from live database
- **Migration**: Automatic schema extraction and documentation

### Database Schema Extraction
```bash
# Extract current database schema
./local-scripts/extract-schema.sh
```

This creates:
- SQL schema files
- JSON documentation
- Markdown documentation

## 🔐 Security

- **Database**: Credentials stored in GCP Secret Manager
- **Authentication**: Session-based with secure cookies
- **Content**: HTML sanitization with DOMPurify
- **CORS**: Properly configured for microfrontend embedding

## 🎨 UI Components

### Editor Options
- **Medium-style Editor**: WYSIWYG editor with toolbar
- **Markdown Editor**: Code-based with live preview
- **Switching**: Users can choose their preferred editor

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Responsive**: Mobile-first design
- **Theming**: Consistent design system

## 📦 Deployment

### Production Build
```bash
# Build the main application
cd app-vue-ui
npm run build

# Build the viewer
cd ../app-vue-ui-viewer
npm run build
```

### Docker Deployment
```bash
# Build and run with Docker
docker-compose up -d
```

## 🔄 Development Workflow

1. **Start Development**: `./local-scripts/start-full-stack.sh`
2. **Edit Code**: Make changes to API, UI, or viewer
3. **Hot Reload**: Changes automatically reload
4. **Rebuild Viewer**: `./local-scripts/rebuild-viewer.sh` (if viewer changes)
5. **Test**: Check all functionality works

## 🐛 Troubleshooting

### Common Issues

**API won't start:**
- Check GCP authentication: `gcloud auth login`
- Verify GCP project: `gcloud config set project agoat-publisher-dev`
- Check secrets exist in GCP Secret Manager

**Viewer not loading:**
- Rebuild viewer: `./local-scripts/rebuild-viewer.sh`
- Check viewer files: `ls app-vue-ui/public/viewer/`
- Verify iframe URL: `http://localhost:5173/viewer/`

**Database connection issues:**
- Extract schema: `./local-scripts/extract-schema.sh`
- Check CockroachDB is running
- Verify environment variables

### Logs
- **API logs**: Check terminal running `start-api.sh`
- **UI logs**: Check terminal running `start-ui.sh`
- **Viewer logs**: Check browser console at `/viewer/`

## 📚 API Documentation

### Authentication
```
POST /api/login
POST /api/logout
GET  /api/status
```

### Posts
```
GET    /api/posts              # List posts
POST   /api/posts              # Create post
GET    /api/posts/:id          # Get post by ID
GET    /api/posts/slug/:slug   # Get post by slug
PUT    /api/posts/:id          # Update post
DELETE /api/posts/:id          # Delete post
```

### Parameters
- `page`: Page number (default: 1)
- `limit`: Posts per page (default: 10)
- `published`: Filter published posts (true/false)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs
3. Create an issue with detailed information

---

**AGoat Publisher** - Modern blog publishing with microfrontend architecture
