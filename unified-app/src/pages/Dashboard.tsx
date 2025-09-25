import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../config/axios'
import { 
  Box, 
  Heading, 
  Text, 
  Card, 
  Flex, 
  Button, 
  Container,
  Badge,
  Grid
} from '@radix-ui/themes'
import { CalendarIcon, PersonIcon, PlusIcon, EyeOpenIcon } from '@radix-ui/react-icons'
import { Post } from '../types'
import { buildApiUrl, API_CONFIG, DEFAULT_SITE_ID } from '../config/api'
import { useAzureAuth } from '../contexts/AzureAuthContext'

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAzureAuth()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
  }, [isAuthenticated, navigate])

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      if (!isAuthenticated) return

      setLoading(true)
      setError('')

      try {
        const params = new URLSearchParams({
          page: '1',
          limit: '50'
        })

        // Don't filter by published status for dashboard - show all posts
        const url = `${buildApiUrl(API_CONFIG.ENDPOINTS.SITE_POSTS(DEFAULT_SITE_ID))}?${params}`
        const response = await apiClient.get(url)
        
        if (response.data && response.data.data) {
          setPosts(response.data.data)
        } else {
          setPosts([])
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load posts')
        console.error('Error fetching posts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [isAuthenticated])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  if (loading) {
    return (
      <Container>
        <Flex justify="center" align="center" style={{ minHeight: '200px' }}>
          <Text size="3">Loading dashboard...</Text>
        </Flex>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Card>
          <Box p="4">
            <Flex direction="column" align="center" gap="3">
              <Text size="4" color="red">Error loading dashboard</Text>
              <Text size="3" color="gray">{error}</Text>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </Flex>
          </Box>
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      {/* Enhanced Header Section */}
      <Box mb="8" style={{
        background: 'linear-gradient(135deg, var(--blue-3) 0%, var(--purple-3) 100%)',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <Flex justify="between" align="center">
          <Box>
            <Heading size="7" mb="2" style={{ color: 'var(--gray-12)' }}>
              📊 Dashboard
            </Heading>
            <Text size="4" color="gray" style={{ fontWeight: '500' }}>
              Welcome back, <strong>{user?.username}</strong>! 
            </Text>
            <Badge color="blue" size="2" style={{ marginTop: '0.5rem' }}>
              {user?.role?.toUpperCase()}
            </Badge>
          </Box>
          {(user?.role === 'admin' || user?.role === 'author') && (
            <Button 
              size="3" 
              onClick={() => navigate('/new-post')}
              style={{
                background: 'var(--green-9)',
                color: 'white',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              <PlusIcon />
              Create New Post
            </Button>
          )}
        </Flex>
      </Box>

      {/* Enhanced Posts Section */}
      <Box>
        <Flex justify="between" align="center" mb="6">
          <Heading size="6" style={{ color: 'var(--gray-12)' }}>
            📝 Your Posts ({posts.length})
          </Heading>
          {posts.length > 0 && (
            <Text size="3" color="gray">
              {posts.filter(p => p.published).length} published, {posts.filter(p => !p.published).length} drafts
            </Text>
          )}
        </Flex>
        
        {posts.length === 0 ? (
          <Card style={{
            background: 'var(--gray-2)',
            border: '2px dashed var(--gray-6)',
            borderRadius: '12px'
          }}>
            <Box p="6">
              <Flex direction="column" align="center" gap="4">
                <Box style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: 'var(--blue-3)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  📝
                </Box>
                <Heading size="5" style={{ color: 'var(--gray-11)' }}>
                  No posts yet
                </Heading>
                <Text size="3" color="gray" style={{ textAlign: 'center', maxWidth: '400px' }}>
                  Start your journey by creating your first post. Share your thoughts, insights, and stories with the world!
                </Text>
                {(user?.role === 'admin' || user?.role === 'author') && (
                  <Button 
                    size="3"
                    onClick={() => navigate('/new-post')}
                    style={{
                      background: 'var(--blue-9)',
                      color: 'white',
                      fontWeight: '600'
                    }}
                  >
                    <PlusIcon />
                    Create Your First Post
                  </Button>
                )}
              </Flex>
            </Box>
          </Card>
        ) : (
          <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4">
            {posts.map((post) => (
              <Card 
                key={post.id} 
                style={{
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  border: '1px solid var(--gray-6)',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <Box p="5">
                  {/* Post Header */}
                  <Flex justify="between" align="start" mb="4">
                    <Box style={{ flex: 1 }}>
                      <Heading 
                        size="4" 
                        mb="2" 
                        style={{ 
                          color: 'var(--gray-12)',
                          lineHeight: 1.3,
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/post/${post.id}`)}
                      >
                        {post.title}
                      </Heading>
                      <Text 
                        size="3" 
                        color="gray" 
                        style={{ 
                          lineHeight: 1.6,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {truncateContent(post.content)}
                      </Text>
                    </Box>
                  </Flex>
                  
                  {/* Post Meta */}
                  <Flex gap="3" align="center" mb="4">
                    <Flex gap="1" align="center">
                      <PersonIcon width="14" height="14" color="var(--gray-9)" />
                      <Text size="2" color="gray">{post.author}</Text>
                    </Flex>
                    <Flex gap="1" align="center">
                      <CalendarIcon width="14" height="14" color="var(--gray-9)" />
                      <Text size="2" color="gray">{formatDate(post.created_at)}</Text>
                    </Flex>
                  </Flex>
                  
                  {/* Status Badge */}
                  <Flex justify="between" align="center">
                    {post.published ? (
                      <Badge 
                        color="green" 
                        size="2"
                        style={{ fontWeight: '600' }}
                      >
                        ✅ Published
                      </Badge>
                    ) : (
                      <Badge 
                        color="orange" 
                        size="2"
                        style={{ fontWeight: '600' }}
                      >
                        📝 Draft
                      </Badge>
                    )}
                    
                    {/* Action Buttons */}
                    <Flex gap="2">
                      <Button 
                        variant="outline" 
                        size="2"
                        onClick={() => navigate(`/post/${post.id}`)}
                        style={{ minWidth: '60px' }}
                      >
                        <EyeOpenIcon />
                        View
                      </Button>
                      {(user?.role === 'admin' || user?.role === 'author') && (
                        <Button 
                          variant="outline" 
                          size="2"
                          onClick={() => navigate(`/edit-post/${post.id}`)}
                          style={{ minWidth: '60px' }}
                        >
                          Edit
                        </Button>
                      )}
                    </Flex>
                  </Flex>
                </Box>
              </Card>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  )
}
