import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { buildApiUrl, API_CONFIG } from '../config/api'
import { 
  Box, 
  Heading, 
  Text, 
  Flex,
  Container,
  Card,
  CardContent,
  Button,
  TextField
} from '../components/ui'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post(buildApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        username,
        password
      }, {
        withCredentials: true
      })

      if (response.data.success) {
        navigate('/dashboard')
      } else {
        setError('Login failed. Please check your credentials.')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--gray-1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Container maxWidth="sm">
        <Card>
          <CardContent>
            <Box style={{ textAlign: 'center', padding: '2rem' }}>
              <Heading size="6" mb="3">Login to AGoat Blog</Heading>
              <Text size="3" color="gray" mb="4">
                Enter your credentials to access the dashboard
              </Text>

              <form onSubmit={handleSubmit}>
                <Flex direction="column" gap="4">
                  <TextField.Root>
                    <TextField.Input
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </TextField.Root>

                  <TextField.Root>
                    <TextField.Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </TextField.Root>

                  {error && (
                    <Text color="red" size="2">
                      {error}
                    </Text>
                  )}

                  <Button 
                    type="submit" 
                    loading={loading}
                    fullWidth
                  >
                    Login
                  </Button>
                </Flex>
              </form>

              <Box mt="4">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/')}
                  fullWidth
                >
                  Back to Home
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default Login
