import { Routes, Route } from 'react-router-dom'
import { Theme, Container, Flex, Box, Heading, Button, Separator, Text } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import { Link, useLocation } from 'react-router-dom'
import { HomeIcon, DashboardIcon, PlusIcon, PersonIcon, ExitIcon, HeartIcon, PaletteIcon } from '@radix-ui/react-icons'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import NewPost from './pages/NewPost'
import PostDetail from './pages/PostDetail'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider, ThemeSelector, useTheme } from './components/ThemeProvider'
import { OIDCAuthProvider, useOIDCAuth } from './contexts/OIDCAuthContext'
import EditPost from './pages/EditPost'
import GlobalErrorToast from './components/GlobalErrorToast'
import ThorneEducation from './pages/ThorneEducation'
import ThorneCategory from './pages/ThorneCategory'
import ThorneRegistration from './pages/ThorneRegistration'
import ThornePatientPortal from './pages/ThornePatientPortal'
import ThorneCompliance from './pages/ThorneCompliance'
import AuthCallback from './pages/AuthCallback'
import AuthLogout from './pages/AuthLogout'

function Header() {
  const location = useLocation()
  const { user, isAuthenticated, logout, login } = useOIDCAuth()
  const { themeConfig, setIsThemeSelectorOpen } = useTheme()
  
  return (
    <Box 
      className="app-header"
      style={{ 
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
                AGoat Publisher
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
            <Link to="/thorne/education" style={{ textDecoration: 'none' }}>
              <Button variant={location.pathname.startsWith('/thorne') ? 'solid' : 'ghost'} size="2">
                <HeartIcon />
                Thorne Supplements
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
                {(user?.auth_method === 'cognito' || user?.email_verified) && (
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
            <Button 
              variant="ghost" 
              size="2" 
              onClick={() => setIsThemeSelectorOpen(true)}
              title={`Current theme: ${themeConfig.name}`}
            >
              <PaletteIcon />
            </Button>
            {isAuthenticated ? (
              <Flex gap="2" align="center">
                <Text size="2" color="gray">
                  Welcome, {user?.username || user?.email} ({user?.auth_method})
                </Text>
                <Button variant="outline" size="2" onClick={logout}>
                  <ExitIcon />
                  Logout
                </Button>
              </Flex>
            ) : (
              <Button 
                variant="outline" 
                size="2" 
                onClick={async () => {
                  try {
                    const returnUrl = window.location.href;
                    await login(returnUrl);
                  } catch (err) {
                    console.error('Login error:', err);
                  }
                }}
              >
                <PersonIcon />
                Login
              </Button>
            )}
          </Flex>
        </Flex>
      </Container>
    </Box>
  )
}

function AppContent() {
  const { isLoading } = useOIDCAuth()

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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-post" element={<NewPost />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/edit-post/:id" element={<EditPost />} />
            
            {/* Thorne Reseller Routes */}
            <Route path="/thorne/education" element={<ThorneEducation />} />
            <Route path="/thorne/category/:categoryId" element={<ThorneCategory />} />
            <Route path="/thorne/register" element={<ThorneRegistration />} />
            <Route path="/thorne/portal" element={<ThornePatientPortal />} />
            <Route path="/thorne/compliance" element={<ThorneCompliance />} />
            
            {/* Authentication Routes */}
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/logout" element={<AuthLogout />} />
            <Route path="/auth/signout" element={<AuthLogout />} />
          </Routes>
        </Container>
      </Box>
      <ThemeSelector />
    </Box>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <OIDCAuthProvider>
        <ThemeProvider>
          <Theme>
            <AppContent />
            <GlobalErrorToast />
          </Theme>
        </ThemeProvider>
      </OIDCAuthProvider>
    </ErrorBoundary>
  )
}

export default App
