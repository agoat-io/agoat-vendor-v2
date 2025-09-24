import { Routes, Route } from 'react-router-dom'
import { Theme, Container, Flex, Box, Heading, Button, Separator, Text } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import { Link, useLocation } from 'react-router-dom'
import { HomeIcon, DashboardIcon, PlusIcon, PersonIcon, ExitIcon } from '@radix-ui/react-icons'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewPost from './pages/NewPost'
import PostDetail from './pages/PostDetail'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './components/ThemeProvider'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import EditPost from './pages/EditPost'
import GlobalErrorToast from './components/GlobalErrorToast'

function Header() {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()
  
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
            {isAuthenticated && (
              <>
                <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                  <Button variant={location.pathname === '/dashboard' ? 'solid' : 'ghost'} size="2">
                    <DashboardIcon />
                    Dashboard
                  </Button>
                </Link>
                {(user?.role === 'admin' || user?.role === 'author') && (
                  <Link to="/new-post" style={{ textDecoration: 'none' }}>
                    <Button variant={location.pathname === '/new-post' ? 'solid' : 'ghost'} size="2">
                      <PlusIcon />
                      New Post
                    </Button>
                  </Link>
                )}
              </>
            )}
            <Separator orientation="vertical" />
            {isAuthenticated ? (
              <Flex gap="2" align="center">
                <Text size="2" color="gray">
                  Welcome, {user?.username} ({user?.role})
                </Text>
                <Button variant="outline" size="2" onClick={logout}>
                  <ExitIcon />
                  Logout
                </Button>
              </Flex>
            ) : (
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant={location.pathname === '/login' ? 'solid' : 'outline'} size="2">
                  <PersonIcon />
                  Login
                </Button>
              </Link>
            )}
          </Flex>
        </Flex>
      </Container>
    </Box>
  )
}

function AppContent() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <Box style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh' 
      }}>
        <Text>Loading...</Text>
      </Box>
    )
  }

  return (
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
            <Route path="/edit-post/:id" element={<EditPost />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <Theme>
            <AppContent />
            <GlobalErrorToast />
          </Theme>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
