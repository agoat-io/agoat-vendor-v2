import React, { useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { buildApiUrl, API_CONFIG } from '../src/config/api'
import { Box, Card, TextField, Button, Heading, Text, Flex, Callout } from '@radix-ui/themes'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'

const LoginPage: React.FC = () => {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.')
      return
    }
    
    setLoading(true)
    setError('')

    try {
      const response = await axios.post(buildApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        username: username.trim(),
        password
      }, {
        withCredentials: true
      })

      if (response.data.success) {
        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        setError('Login failed. Please check your credentials.')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.'
      setError(errorMessage)
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box 
      style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, var(--gray-1) 0%, var(--gray-3) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <Card size="3" style={{ width: '100%', maxWidth: '400px' }}>
        <Box p="6">
          <Flex direction="column" gap="4">
            <Box>
              <Heading size="6" mb="2">Welcome back</Heading>
              <Text color="gray" size="2">
                Enter your credentials to access the admin dashboard
              </Text>
            </Box>

            {error && (
              <Callout.Root color="red" size="1">
                <Callout.Icon>
                  <ExclamationTriangleIcon />
                </Callout.Icon>
                <Callout.Text>{error}</Callout.Text>
              </Callout.Root>
            )}

            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="3">
                <Box>
                  <Text as="label" size="2" weight="bold" htmlFor="username">
                    Username
                  </Text>
                  <TextField.Root 
                    id="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    mt="1"
                  />
                  <Text size="1" color="gray" mt="1">
                    Default: admin
                  </Text>
                </Box>

                <Box>
                  <Text as="label" size="2" weight="bold" htmlFor="password">
                    Password
                  </Text>
                  <TextField.Root 
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    mt="1"
                  />
                  <Text size="1" color="gray" mt="1">
                    Default: admin123
                  </Text>
                </Box>

                <Flex direction="column" gap="2" mt="2">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    size="3"
                  >
                    {loading ? 'Signing in...' : 'Sign in'}
                  </Button>
                  <Button 
                    type="button"
                    variant="soft"
                    color="gray"
                    onClick={() => router.push('/')}
                    size="3"
                  >
                    Back to Blog
                  </Button>
                </Flex>
              </Flex>
            </form>
          </Flex>
        </Box>
      </Card>
    </Box>
  )
}

export default LoginPage