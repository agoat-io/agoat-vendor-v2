import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  Box, 
  Heading, 
  Text, 
  Card, 
  Flex, 
  Button, 
  TextField, 
  TextArea,
  Switch,
  Container
} from '@radix-ui/themes'
import { ArrowLeftIcon, PlusIcon } from '@radix-ui/react-icons'
import { buildApiUrl, API_CONFIG, DEFAULT_SITE_ID } from '../config/api'
import { useAuth } from '../contexts/AuthContext'

export default function NewPost() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  // Redirect if not authenticated or not authorized
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    if (user?.role !== 'admin' && user?.role !== 'author') {
      navigate('/')
      return
    }
  }, [isAuthenticated, user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post(buildApiUrl(API_CONFIG.ENDPOINTS.SITE_POSTS(DEFAULT_SITE_ID)), {
        title,
        content,
        published
      })

      if (response.data && response.data.data) {
        // Navigate to the new post
        navigate(`/post/${response.data.data.id}`)
      } else {
        setError('Failed to create post')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create post')
      console.error('Error creating post:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'author')) {
    return null // Will redirect
  }

  return (
    <Container>
      <Box mb="6">
        <Flex align="center" gap="3" mb="4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            style={{ color: 'var(--gray-11)' }}
          >
            <ArrowLeftIcon />
            Back to Dashboard
          </Button>
        </Flex>
        <Heading size="6" mb="2">Create New Post</Heading>
        <Text size="3" color="gray">
          Write and publish your next great article
        </Text>
      </Box>

      <Card>
        <Box p="6">
          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="4">
              <Box>
                <Text size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                  Title
                </Text>
                <TextField.Root>
                  <TextField.Input
                    type="text"
                    placeholder="Enter post title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    style={{ height: '44px' }}
                  />
                </TextField.Root>
              </Box>

              <Box>
                <Text size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                  Content
                </Text>
                <TextArea
                  placeholder="Write your post content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  style={{ 
                    minHeight: '300px',
                    resize: 'vertical'
                  }}
                />
              </Box>

              <Box>
                <Flex align="center" gap="3">
                  <Switch
                    checked={published}
                    onCheckedChange={setPublished}
                  />
                  <Text size="2" weight="medium">
                    Publish immediately
                  </Text>
                </Flex>
                <Text size="1" color="gray" mt="1">
                  {published ? 'Post will be published immediately' : 'Post will be saved as a draft'}
                </Text>
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

              <Flex gap="3" mt="2">
                <Button 
                  type="submit" 
                  disabled={loading}
                  style={{ height: '44px' }}
                >
                  <PlusIcon />
                  {loading ? 'Creating...' : published ? 'Publish Post' : 'Save Draft'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  disabled={loading}
                  style={{ height: '44px' }}
                >
                  Cancel
                </Button>
              </Flex>
            </Flex>
          </form>
        </Box>
      </Card>
    </Container>
  )
}
