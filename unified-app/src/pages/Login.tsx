import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { buildApiUrl, API_CONFIG } from '../config/api'
import { 
  Box, 
  Heading, 
  Text, 
  Flex,
  Card,
  Button,
  TextField,
  Separator
} from '@radix-ui/themes'
import { 
  PersonIcon, 
  LockClosedIcon, 
  ArrowLeftIcon,
  EyeOpenIcon,
  EyeNoneIcon
} from '@radix-ui/react-icons'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Simple mock authentication - in a real app this would call an API
      if (username === 'admin' && password === 'admin123') {
        // Mock successful login
        navigate('/dashboard')
      } else {
        setError('Invalid username or password. Try admin/admin123')
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="1"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ padding: '4px' }}
                  >
                    {showPassword ? (
                      <EyeNoneIcon width="16" height="16" />
                    ) : (
                      <EyeOpenIcon width="16" height="16" />
                    )}
                  </Button>
                </TextField.Slot>
              </TextField.Root>
            </Box>

            {error && (
              <Card style={{ 
                background: 'var(--red-3)', 
                border: '1px solid var(--red-6)',
                padding: 'var(--space-3)'
              }}>
                <Text size="2" color="red">
                  {error}
                </Text>
              </Card>
            )}

            <Button 
              type="submit" 
              disabled={loading}
              style={{ 
                height: '44px',
                background: 'linear-gradient(135deg, var(--accent-9) 0%, var(--accent-10) 100%)',
                border: 'none',
                color: 'white',
                fontWeight: '600'
              }}
              className="btn-hover"
            >
              {loading ? (
                <Flex align="center" gap="2">
                  <Box style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid transparent', 
                    borderTop: '2px solid currentColor', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite' 
                  }} />
                  Signing in...
                </Flex>
              ) : (
                'Sign In'
              )}
            </Button>
          </Flex>
        </form>

        <Separator my="6" />

        {/* Footer */}
        <Box style={{ textAlign: 'center' }}>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            style={{ color: 'var(--gray-11)' }}
          >
            <ArrowLeftIcon />
            Back to Home
          </Button>
        </Box>

        {/* Demo Credentials */}
        <Box mt="4" p="3" style={{ 
          background: 'var(--gray-2)', 
          borderRadius: 'var(--radius-3)',
          border: '1px solid var(--gray-5)'
        }}>
          <Text size="1" color="gray" weight="medium" mb="2">
            Demo Credentials:
          </Text>
          <Text size="1" color="gray" style={{ fontFamily: 'monospace' }}>
            Username: admin<br />
            Password: password
          </Text>
        </Box>
      </Card>
    </Box>
  )
}

export default Login
