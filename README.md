# Top Vitamin Supply - Hotwire Blog Platform

A modern, efficient blog platform built with Go, Hotwire (Turbo + Stimulus), and Liquid templates. This application provides a beautiful, responsive interface for managing and displaying blog content with minimal page reloads.

## 🚀 Features

- **Hotwire Integration**: Real-time updates with Turbo Streams and Stimulus controllers
- **Liquid Templates**: Shopify-style templating for flexible content rendering
- **Responsive Design**: Beautiful Tailwind CSS styling that works on all devices
- **Markdown Support**: Rich content editing with markdown formatting
- **SEO Optimized**: Server-side rendering with structured data
- **Efficient Updates**: Partial page updates to minimize reloads
- **API Integration**: Consumes the existing AGoat Publisher API

## 🏗️ Architecture

```
topvitaminsupply.com/app/
├── cmd/server/           # Main application entry point
├── internal/             # Private application code
│   ├── database/         # Database operations
│   ├── handlers/         # HTTP request handlers
│   ├── middleware/       # HTTP middleware
│   └── templates/        # Template engine
├── web/                  # Web assets and templates
│   ├── static/           # CSS, JS, images
│   └── templates/        # Liquid templates
├── scripts/              # Build and deployment scripts
└── migrations/           # Database migrations
```

## 🛠️ Technology Stack

- **Backend**: Go with Gorilla Mux router
- **Templates**: Liquid (Shopify-style) with Go template conversion
- **Styling**: Tailwind CSS
- **Real-time**: Hotwire (Turbo + Stimulus)
- **Database**: SQLite (local development)
- **API**: HTTP client consuming external API

## 📦 Installation

### Prerequisites

- Go 1.21 or higher
- The AGoat Publisher API server running on `http://localhost:8080`

### Quick Start

1. **Clone and navigate to the project**:
   ```bash
   cd topvitaminsupply.com/app
   ```

2. **Install dependencies**:
   ```bash
   go mod tidy
   ```

3. **Start the application**:
   ```bash
   ./scripts/start.sh
   ```

4. **Access the application**:
   - Web Interface: http://localhost:3000
   - API Server: http://localhost:8080 (must be running)

## 🎯 Usage

### For Content Creators

1. **Login**: Use `admin / admin123` to access the dashboard
2. **Create Posts**: Click "New Post" to create content with markdown
3. **Edit Posts**: Click "Edit" on any post to modify content
4. **Publish**: Toggle publish status to control visibility

### For Developers

1. **Template Development**: Edit `.liquid` files in `web/templates/`
2. **Styling**: Modify Tailwind classes or add custom CSS
3. **Hotwire Features**: Add Turbo Streams for real-time updates
4. **API Integration**: Extend handlers to consume additional API endpoints

## 🔧 Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `API_BASE_URL`: External API base URL (default: http://localhost:8080/api)

### Template Customization

The application uses Liquid templates that are converted to Go templates:

```liquid
{% extends "layout" %}

{% block content %}
<div class="container">
    <h1>{{ post.title }}</h1>
    <div class="content">
        {{ post.content | markdown }}
    </div>
</div>
{% endblock %}
```

## 🎨 Styling

The application uses Tailwind CSS with a custom color scheme:

- **Primary**: Green tones for vitamin/health theme
- **Secondary**: Blue accents
- **Responsive**: Mobile-first design approach

### Custom CSS Classes

```css
/* Primary button styling */
.btn-primary {
    @apply bg-green-600 hover:bg-green-700 text-white;
}

/* Card styling */
.card {
    @apply bg-white shadow-lg rounded-lg p-6;
}
```

## 🔄 Hotwire Features

### Turbo Streams

Real-time updates without full page reloads:

```go
// Example Turbo Stream response
func (h *Handlers) TurboPosts(w http.ResponseWriter, r *http.Request) {
    posts := h.fetchPosts()
    h.templateEngine.RenderTurboStream(w, "replace", "posts-list", "posts_list", posts)
}
```

### Stimulus Controllers

Interactive JavaScript components:

```javascript
// Example Stimulus controller
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    connect() {
        console.log("Post form controller connected")
    }
    
    async submit(event) {
        event.preventDefault()
        // Handle form submission
    }
}
```

## 📱 Responsive Design

The application is fully responsive with breakpoints:

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px  
- **Desktop**: > 1024px

## 🔍 SEO Features

- **Structured Data**: JSON-LD markup for articles
- **Meta Tags**: Open Graph and Twitter Card support
- **Server-Side Rendering**: Full HTML output for crawlers
- **Clean URLs**: SEO-friendly routing

## 🚀 Deployment

### Local Development

```bash
# Start with hot reload
./scripts/start.sh

# Or run directly
go run cmd/server/main.go
```

### Production

1. **Build the application**:
   ```bash
   go build -o bin/server cmd/server/main.go
   ```

2. **Set environment variables**:
   ```bash
   export PORT=3000
   export API_BASE_URL=https://your-api-domain.com/api
   ```

3. **Run the server**:
   ```bash
   ./bin/server
   ```

## 🔧 Development

### Project Structure

```
├── cmd/server/main.go          # Application entry point
├── internal/
│   ├── database/database.go    # Database operations
│   ├── handlers/handlers.go    # HTTP handlers
│   ├── middleware/middleware.go # Middleware functions
│   └── templates/engine.go     # Template engine
├── web/
│   ├── templates/              # Liquid templates
│   │   ├── layout.liquid       # Base layout
│   │   ├── home.liquid         # Home page
│   │   ├── post.liquid         # Single post
│   │   ├── dashboard.liquid    # Admin dashboard
│   │   ├── login.liquid        # Login page
│   │   ├── new_post.liquid     # Create post
│   │   ├── edit_post.liquid    # Edit post
│   │   ├── posts_list.liquid   # Posts list partial
│   │   └── post_content.liquid # Post content partial
│   └── static/                 # Static assets
└── scripts/start.sh            # Startup script
```

### Adding New Features

1. **New Template**: Create `.liquid` file in `web/templates/`
2. **New Handler**: Add method to `internal/handlers/handlers.go`
3. **New Route**: Register in `cmd/server/main.go`
4. **Styling**: Add Tailwind classes or custom CSS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the AGoat Publisher ecosystem.

## 🆘 Support

For issues and questions:

1. Check the existing documentation
2. Review the AGoat Publisher API documentation
3. Create an issue in the repository

---

**Built with ❤️ using Go, Hotwire, and Liquid templates**




