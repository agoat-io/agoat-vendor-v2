import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, 
  Card, 
  Heading, 
  Text, 
  Button, 
  Flex, 
  Container
} from '../components/ui'
import { PersonIcon } from '@radix-ui/react-icons'
import { useOIDCAuth } from '../contexts/OIDCAuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login, isAuthenticated, user, isLoading, error } = useOIDCAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, user, navigate])

  const handleLogin = async () => {
    try {
      // Get the current URL to return to after login
      const returnUrl = window.location.href
      await login(returnUrl)
    } catch (err) {
      console.error('Login error:', err)
    }
  }

  return (
    <Container>
      <Box style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh'
      }}>
        <Card style={{ 
          width: '100%', 
          maxWidth: '400px',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-4)'
        }}>
          {/* Header */}
          <Box style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <Box style={{ 
              width: '64px', 
              height: '64px', 
              background: 'linear-gradient(135deg, var(--blue-9) 0%, var(--blue-10) 100%)',
              borderRadius: 'var(--radius-6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-4)',
              color: 'white'
            }}>
              <PersonIcon width="32" height="32" />
            </Box>
            <Heading size="6" style={{ marginBottom: 'var(--space-2)' }}>
              Welcome Back
            </Heading>
            <Text size="3" color="gray">
              Sign in to your account to continue
            </Text>
          </Box>

          {/* Error Display */}
          {error && (
            <Box style={{ 
              background: 'var(--red-3)', 
              border: '1px solid var(--red-6)',
              borderRadius: 'var(--radius-3)',
              padding: 'var(--space-3)',
              marginBottom: 'var(--space-4)'
            }}>
              <Text size="2" color="red">
                {error}
              </Text>
            </Box>
          )}

          {/* Login Form */}
          <Flex direction="column" gap="4">
            <Button 
              size="3" 
              onClick={handleLogin}
              disabled={isLoading}
              style={{ width: '100%' }}
            >
              <PersonIcon />
              {isLoading ? 'Redirecting to login...' : 'Login with OIDC'}
            </Button>
          </Flex>

          {/* Footer */}
          <Box style={{ 
            textAlign: 'center', 
            marginTop: 'var(--space-6)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--gray-6)'
          }}>
            <Text size="2" color="gray">
              Secure login with OIDC (AWS Cognito)
            </Text>
          </Box>
        </Card>
      </Box>
    </Container>
  )
}