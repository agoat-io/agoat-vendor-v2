import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, 
  Card, 
  CardContent,
  Heading, 
  Text, 
  TextField, 
  Button, 
  Flex, 
  Separator,
  IconButton
} from '@radix-ui/themes'
import { PersonIcon, LockClosedIcon, EyeOpenIcon, EyeNoneIcon } from '@radix-ui/react-icons'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login, isAuthenticated, user } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin' || user.role === 'author') {
        navigate('/dashboard')
      } else {
        navigate('/')
      }
    }
  }, [isAuthenticated, user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const success = await login(username, password)
      
      if (success) {
        // The redirect will be handled by the useEffect above
        // based on the user's role
      } else {
        setError('Invalid username or password. Try admin/admin123, author/author123, or user/user123')
      }
    } catch (err: any) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
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
            background: 'linear-gradient(135deg, var(--accent-9) 0%, var(--accent-10) 100%)',
            borderRadius: 'var(--radius-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-4)'
          }}>
            <PersonIcon width="32" height="32" color="white" />
          </Box>
          <Heading size="6" mb="2">Welcome Back</Heading>
          <Text size="3" color="gray">
            Sign in to your AGoat Blog account
          </Text>
        </Box>

        <Separator mb="6" />

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            <Box>
              <Text size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                Username
              </Text>
              <TextField.Root>
                <TextField.Slot>
                  <PersonIcon width="16" height="16" />
                </TextField.Slot>
                <TextField.Input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{ height: '44px' }}
                />
              </TextField.Root>
            </Box>

            <Box>
              <Text size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                Password
              </Text>
              <TextField.Root>
                <TextField.Slot>
                  <LockClosedIcon width="16" height="16" />
                </TextField.Slot>
                <TextField.Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ height: '44px' }}
                />
                <TextField.Slot>
                  <IconButton
                    type="button"
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeNoneIcon width="16" height="16" /> : <EyeOpenIcon width="16" height="16" />}
                  </IconButton>
                </TextField.Slot>
              </TextField.Root>
            </Box>

            {error && (
              <Box style={{ 
                padding: 'var(--space-3)', 
                background: 'var(--red-2)', 
                border: '1px solid var(--red-6)',
                borderRadius: 'var(--radius-3)',
                color: 'var(--red-11)'
              }}>
                <Text size="2">{error}</Text>
              </Box>
            )}

            <Button 
              type="submit" 
              disabled={loading}
              style={{ height: '44px', marginTop: 'var(--space-2)' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Flex>
        </form>

        <Separator my="6" />

        {/* Demo Credentials */}
        <Box>
          <Text size="2" weight="medium" mb="3" style={{ display: 'block' }}>
            Demo Credentials:
          </Text>
          <Flex direction="column" gap="2">
            <Text size="1" color="gray">
              <strong>Admin:</strong> admin / admin123
            </Text>
            <Text size="1" color="gray">
              <strong>Author:</strong> author / author123
            </Text>
            <Text size="1" color="gray">
              <strong>User:</strong> user / user123
            </Text>
          </Flex>
        </Box>
      </Card>
    </Box>
  )
}
