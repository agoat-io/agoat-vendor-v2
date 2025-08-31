import { Routes, Route } from 'react-router-dom'
import { Theme, Container, Flex, Box, Heading, Button, Separator } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import { Link, useLocation } from 'react-router-dom'
import { HomeIcon, DashboardIcon, PlusIcon, PersonIcon } from '@radix-ui/react-icons'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewPost from './pages/NewPost'
import PostDetail from './pages/PostDetail'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './components/ThemeProvider'

function Header() {
  const location = useLocation()
  
  return (
    <Box style={{ 
      background: 'var(--color-surface)', 
      borderBottom: '1px solid var(--gray-6)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <Container size="3">
        <Flex justify="between" align="center" py="4">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Flex align="center" gap="3">
              <Box style={{ 
                width: '32px', 
                height: '32px', 
                background: 'var(--accent-9)', 
                borderRadius: 'var(--radius-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold'
              }}>
                A
              </Box>
              <Heading size="5" style={{ color: 'var(--gray-12)' }}>
                AGoat Blog
              </Heading>
            </Flex>
          </Link>
          
          <Flex gap="3" align="center">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Button variant={location.pathname === '/' ? 'solid' : 'ghost'} size="2">
                <HomeIcon />
                Home
              </Button>
            </Link>
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <Button variant={location.pathname === '/dashboard' ? 'solid' : 'ghost'} size="2">
                <DashboardIcon />
                Dashboard
              </Button>
            </Link>
            <Link to="/new-post" style={{ textDecoration: 'none' }}>
              <Button variant={location.pathname === '/new-post' ? 'solid' : 'ghost'} size="2">
                <PlusIcon />
                New Post
              </Button>
            </Link>
            <Separator orientation="vertical" />
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button variant={location.pathname === '/login' ? 'solid' : 'outline'} size="2">
                <PersonIcon />
                Login
              </Button>
            </Link>
          </Flex>
        </Flex>
      </Container>
    </Box>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Theme>
          <Box style={{ minHeight: '100vh', background: 'var(--gray-1)' }}>
            <Header />
            <Box style={{ padding: 'var(--space-6) 0' }}>
              <Container size="3">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/new-post" element={<NewPost />} />
                  <Route path="/post/:id" element={<PostDetail />} />
                </Routes>
              </Container>
            </Box>
          </Box>
        </Theme>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
