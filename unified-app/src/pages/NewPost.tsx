import React, { useState, useEffect } from 'react'
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
  TextField,
  TextArea,
  Switch
} from '../components/ui'

const NewPost: React.FC = () => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH_CHECK), {
          withCredentials: true
        })
        setIsAuthenticated(!!response.data.authenticated)
        if (!response.data.authenticated) {
          navigate('/login')
        }
      } catch (error) {
        setIsAuthenticated(false)
        navigate('/login')
      }
    }

    checkAuth()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post(buildApiUrl(API_CONFIG.ENDPOINTS.POSTS), {
        title,
        content,
        published
      }, {
        withCredentials: true
      })

      if (response.data.success) {
        navigate('/dashboard')
      } else {
        setError('Failed to create post. Please try again.')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return (
    <Box style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--gray-1)',
      padding: '2rem 0'
    }}>
      <Container maxWidth="lg">
        <Card>
          <CardContent>
            <Box style={{ padding: '2rem' }}>
              <Heading size="6" mb="3">Create New Post</Heading>
              <Text size="3" color="gray" mb="4">
                Write and publish your new blog post
              </Text>

              <form onSubmit={handleSubmit}>
                <Flex direction="column" gap="4">
                  <TextField.Root>
                    <TextField.Input
                      placeholder="Post Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </TextField.Root>

                  <TextArea
                    placeholder="Write your post content here... (Markdown supported)"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{ minHeight: '300px' }}
                    required
                  />

                  <Flex align="center" gap="3">
                    <Switch
                      checked={published}
                      onCheckedChange={setPublished}
                    />
                    <Text size="3">
                      {published ? 'Publish immediately' : 'Save as draft'}
                    </Text>
                  </Flex>

                  {error && (
                    <Text color="red" size="2">
                      {error}
                    </Text>
                  )}

                  <Flex gap="3" justify="end">
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/dashboard')}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      loading={loading}
                    >
                      {published ? 'Publish Post' : 'Save Draft'}
                    </Button>
                  </Flex>
                </Flex>
              </form>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default NewPost
