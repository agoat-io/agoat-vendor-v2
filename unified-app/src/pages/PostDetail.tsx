import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Post } from '../types'
import { buildApiUrl, API_CONFIG, DEFAULT_SITE_ID } from '../config/api'
import { useAuth } from '../contexts/AuthContext'
import { 
  Box, 
  Heading, 
  Text, 
  Flex,
  Container,
  Card,
  CardContent,
  Button,
  Spinner,
  Separator
} from '../components/ui'
import { PersonIcon, CalendarIcon, Pencil1Icon } from '@radix-ui/react-icons'

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, isAuthenticated } = useAuth()

  // Check authentication status
  useEffect(() => {
    // Authentication is now handled by the AuthContext
    // No need for local authentication checks here
  }, [])

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return

      setLoading(true)
      setError('')

      try {
        const response = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.SITE_POST(DEFAULT_SITE_ID, id)))
        
        if (response.data && response.data.data) {
          setPost(response.data.data)
          // Update page title
          document.title = `${response.data.data.title} - AGoat Blog`
        } else {
          setError('Post not found')
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load post')
        console.error('Error fetching post:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getRenderedContent = () => {
    if (!post) return ''
    
    let content = post.content
    
    // Truncate content for non-authenticated users
    if (!isAuthenticated && content.length > 800) {
      content = content.substring(0, 800) + '...'
    }
    
    // Convert markdown to HTML
    return DOMPurify.sanitize(marked.parse(content) as string)
  }

  const handleBackClick = () => {
    navigate('/')
  }

  const handleEditClick = () => {
    // For now, just navigate back to dashboard
    // In a full implementation, this would navigate to an edit page
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <Container>
        <Flex justify="center" align="center" style={{ minHeight: '200px' }}>
          <Spinner size="3" />
          <Text size="3" ml="3">Loading post...</Text>
        </Flex>
      </Container>
    )
  }

  if (error || !post) {
    return (
      <Container>
        <Card>
          <CardContent>
            <Flex direction="column" align="center" gap="3">
              <Text color="red" size="3">Error: {error || 'Post not found'}</Text>
              <Button onClick={handleBackClick} variant="outline">
                Back to Posts
              </Button>
            </Flex>
          </CardContent>
        </Card>
      </Container>
    )
  }

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: 'var(--gray-1)' }}>
      {/* Header */}
      <Box style={{ 
        backgroundColor: 'var(--color-surface)', 
        borderBottom: '1px solid var(--gray-6)',
        padding: '1rem 0'
      }}>
        <Container>
          <Flex justify="between" align="center">
            <Box>
              <Heading size="6" color="blue">AGoat Blog</Heading>
              <Text size="2" color="gray">Unified Publishing Platform</Text>
            </Box>
            <Flex gap="3" align="center">
              <Button variant="outline" onClick={handleBackClick}>
                Back to Posts
              </Button>
              {isAuthenticated && (
                <Button onClick={handleEditClick}>
                  <Pencil1Icon />
                  Edit
                </Button>
              )}
            </Flex>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container>
        <Card>
          <CardContent>
            <Box style={{ padding: '2rem' }}>
              {/* Post Header */}
              <Box mb="4">
                <Heading size="8" mb="3">{post.title}</Heading>
                <Flex gap="4" align="center" mb="3">
                  <Flex align="center" gap="1">
                    <CalendarIcon />
                    <Text size="2" color="gray">{formatDate(post.created_at)}</Text>
                  </Flex>
                  {post.author && (
                    <Flex align="center" gap="1">
                      <PersonIcon />
                      <Text size="2" color="gray">{post.author}</Text>
                    </Flex>
                  )}
                  {!post.published && (
                    <Text size="2" color="yellow">Draft</Text>
                  )}
                </Flex>
                <Separator mb="4" />
              </Box>

              {/* Post Content */}
              <Box>
                <div 
                  dangerouslySetInnerHTML={{ __html: getRenderedContent() }}
                  style={{ 
                    lineHeight: '1.8',
                    fontSize: '1.1rem',
                    color: 'var(--gray-12)'
                  }}
                />
                
                {!isAuthenticated && post.content.length > 800 && (
                  <Box mt="4" style={{ textAlign: 'center' }}>
                    <Text size="3" color="gray" mb="3">
                      This is a preview. Please log in to read the full post.
                    </Text>
                    <Button onClick={() => navigate('/login')}>
                      Login to Read More
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default PostDetail
