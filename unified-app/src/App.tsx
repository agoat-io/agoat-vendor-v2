import { Routes, Route } from 'react-router-dom'
import { Theme } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewPost from './pages/NewPost'
import PostDetail from './pages/PostDetail'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './components/ThemeProvider'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Theme>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-post" element={<NewPost />} />
            <Route path="/post/:id" element={<PostDetail />} />
          </Routes>
        </Theme>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
