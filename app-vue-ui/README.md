# AGoat Publisher - Vue UI

A modern Vue.js frontend for the AGoat Publisher blog management system, built with Vue 3, TypeScript, Tailwind CSS, and shadcn/ui components.

## Features

- 🔐 **Authentication**: Secure login/logout with session management
- 📝 **Post Management**: Create, edit, delete, and view blog posts
- 📊 **Dashboard**: Overview with statistics and post listing
- 🎨 **Modern UI**: Beautiful interface built with Tailwind CSS and shadcn/ui
- 📱 **Responsive**: Works perfectly on desktop and mobile devices
- ⚡ **Fast**: Built with Vite for lightning-fast development and builds
- 🔒 **Type Safe**: Full TypeScript support for better development experience

## Tech Stack

- **Framework**: Vue 3 with Composition API
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (via radix-vue)
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Package Manager**: npm

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Running Go API backend (see `../app-api/`)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure the API URL in `.env`:
```env
VITE_API_URL=http://localhost:8080/api
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── ui/             # shadcn/ui styled components
├── views/              # Page components
├── stores/             # Pinia stores for state management
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── assets/             # Static assets
├── App.vue             # Root component
└── main.ts             # Application entry point
```

## API Integration

The application connects to the Go API backend with the following endpoints:

- `POST /api/login` - User authentication
- `POST /api/logout` - User logout
- `GET /api/status` - API health check
- `GET /api/posts` - List all posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

## Authentication

The application uses session-based authentication with the Go backend. Login credentials are:

- **Username**: `admin`
- **Password**: `admin123`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is part of the AGoat Publisher system.
