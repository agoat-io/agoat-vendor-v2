# AGoat Publisher - Unified React.js Application

A modern, unified React.js application built with Vite, TypeScript, and Radix UI components.

## 🚀 Features

- **Single Application**: Pure React.js without any federation complexity
- **Modern Stack**: Vite + React 18 + TypeScript + Tailwind CSS
- **Beautiful UI**: Radix UI components with custom styling
- **Full Blog Functionality**: Create, read, update, and manage blog posts
- **User Authentication**: Secure login/logout system
- **Markdown Support**: Rich text editing with DOMPurify sanitization
- **Responsive Design**: Works perfectly on all devices
- **API Integration**: Seamless backend communication

## 🛠️ Tech Stack

- **Frontend**: React 18.3.1, TypeScript 5.3.3
- **Build Tool**: Vite 5.0.0
- **UI Components**: Radix UI Themes 2.0.0
- **Styling**: Tailwind CSS 4.1.12
- **HTTP Client**: Axios 1.11.0
- **Markdown**: Marked 16.2.0 + DOMPurify 3.2.6
- **Routing**: React Router DOM 6.20.1
- **Icons**: Radix UI Icons + Lucide React

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
unified-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Radix UI wrapper components
│   │   └── PostsList.tsx   # Blog posts display component
│   ├── pages/              # Application pages
│   │   ├── Home.tsx        # Landing page with posts
│   │   ├── Login.tsx       # Authentication page
│   │   ├── Dashboard.tsx   # User dashboard
│   │   ├── NewPost.tsx     # Create new post
│   │   └── PostDetail.tsx  # Individual post view
│   ├── config/             # Configuration files
│   │   └── api.ts          # API configuration
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # Shared interfaces
│   ├── utils/              # Utility functions
│   │   └── cn.ts           # Class name utility
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## 🎯 Key Features

### Blog Management
- **Post Creation**: Rich markdown editor with live preview
- **Post Editing**: Update existing posts with full markdown support
- **Post Publishing**: Draft/published status management
- **Post Viewing**: Beautiful post display with markdown rendering

### User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Smooth Animations**: CSS transitions and hover effects
- **Loading States**: Skeleton loaders and progress indicators
- **Error Handling**: Graceful error messages and recovery

### Authentication
- **Secure Login**: Username/password authentication
- **Session Management**: Persistent login state
- **Protected Routes**: Dashboard access control
- **Logout Functionality**: Secure session termination

### API Integration
- **RESTful API**: Communication with Go backend
- **Error Handling**: Comprehensive error management
- **Loading States**: User feedback during API calls
- **Data Validation**: Type-safe API responses

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd unified-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run type-check` - Run TypeScript type checking

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8080/api
```

### API Configuration

The application is configured to communicate with a Go backend API running on `localhost:8080`. Ensure the backend is running before testing the application.

## 🎨 Design System

### Colors
- **Primary**: Radix UI accent colors
- **Gray Scale**: Consistent gray palette
- **Semantic**: Success (green), warning (yellow), error (red)

### Typography
- **Headings**: Radix UI heading scale (1-9)
- **Body Text**: Optimized for readability
- **Monospace**: For code and technical content

### Components
- **Cards**: Elevated containers with shadows
- **Buttons**: Multiple variants (solid, outline, ghost)
- **Forms**: Consistent input styling
- **Navigation**: Responsive header with active states

## 🧪 Testing

### Manual Testing Checklist

- [ ] Home page loads and displays posts
- [ ] Login functionality works with demo credentials
- [ ] Dashboard shows user's posts
- [ ] New post creation works
- [ ] Post editing and publishing
- [ ] Responsive design on different screen sizes
- [ ] Error handling for API failures
- [ ] Loading states display correctly

### Demo Credentials

- **Username**: `admin`
- **Password**: `password`

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory, ready for deployment to any static hosting service.

### Deployment Options

- **Vercel**: Connect repository for automatic deployments
- **Netlify**: Drag and drop the `dist/` folder
- **GitHub Pages**: Configure GitHub Actions for deployment
- **AWS S3**: Upload build files to S3 bucket

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the code comments
- Open an issue on GitHub

---

**Built with ❤️ using React, Vite, and Radix UI**
