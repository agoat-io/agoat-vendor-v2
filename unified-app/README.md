# AGoat Publisher - Unified App

A unified React.js application that combines the best features from the original Module Federation setup into a single, cohesive application.

## Features

- **Single Application**: No more Module Federation complexity
- **Modern React**: Built with React 18, TypeScript, and Vite
- **Beautiful UI**: Radix UI components with Tailwind CSS
- **Full Blog Functionality**: 
  - View posts (public and authenticated)
  - Create new posts
  - Edit existing posts
  - User authentication
  - Markdown support with DOMPurify sanitization
- **Responsive Design**: Works on all device sizes
- **Type Safety**: Full TypeScript support

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Radix UI, Tailwind CSS
- **Styling**: Tailwind CSS with custom theme variables
- **HTTP Client**: Axios
- **Markdown**: Marked with DOMPurify sanitization
- **Routing**: React Router DOM
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- The backend API server running on `localhost:8080`

### Installation

1. Navigate to the unified app directory:
   ```bash
   cd unified-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run serve` - Serve production build on port 3000

## Project Structure

```
unified-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Radix UI wrapper components
│   │   ├── PostsList.tsx   # Main posts listing component
│   │   ├── ErrorBoundary.tsx
│   │   └── ThemeProvider.tsx
│   ├── pages/              # Page components
│   │   ├── Home.tsx        # Main blog listing page
│   │   ├── Login.tsx       # Authentication page
│   │   ├── Dashboard.tsx   # User dashboard
│   │   ├── NewPost.tsx     # Create new post
│   │   └── PostDetail.tsx  # Individual post view
│   ├── config/             # Configuration files
│   │   └── api.ts          # API configuration
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # Shared types
│   ├── utils/              # Utility functions
│   │   └── cn.ts           # Class name utility
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## API Integration

The app expects a backend API running on `localhost:8080` with the following endpoints:

- `GET /api/status` - Check authentication status
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/posts` - List posts (with pagination)
- `GET /api/posts/:id` - Get individual post
- `POST /api/posts` - Create new post

## Key Improvements Over Module Federation

1. **Simplified Architecture**: No more complex Module Federation setup
2. **Better Performance**: Single bundle, faster loading
3. **Easier Development**: No need to manage multiple applications
4. **Reduced Complexity**: Single codebase, easier to maintain
5. **Better Error Handling**: Centralized error boundaries
6. **Consistent Styling**: Unified design system

## Development

### Adding New Components

1. Create your component in `src/components/`
2. Export it from `src/components/ui/index.ts` if it's a UI component
3. Import and use it in your pages

### Adding New Pages

1. Create your page component in `src/pages/`
2. Add the route to `src/App.tsx`
3. Update navigation as needed

### Styling

The app uses Tailwind CSS with Radix UI components. Custom styles can be added to `src/index.css` or using Tailwind classes directly in components.

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. The built files will be in the `dist/` directory

3. Deploy the contents of `dist/` to your web server

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the AGoat Publisher platform.
