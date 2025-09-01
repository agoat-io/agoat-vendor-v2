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
  Container,
  Badge
} from '@radix-ui/themes'
import { CalendarIcon, PersonIcon, PlusIcon, EyeOpenIcon } from '@radix-ui/react-icons'
import { Post } from '../types'
import { buildApiUrl, API_CONFIG, DEFAULT_SITE_ID } from '../config/api'
import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

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
        console.log('Dashboard: Making request to:', url)
        const response = await axios.get(url)
        
        if (response.data && response.data.data) {
          setPosts(response.data.data)
          console.log('Dashboard: Loaded posts:', response.data.data.length)
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
      <Box mb="6">
        <Flex justify="between" align="center" mb="4">
          <Box>
            <Heading size="6" mb="2">Dashboard</Heading>
            <Text size="3" color="gray">
              Welcome back, {user?.username}! ({user?.role})
            </Text>
          </Box>
          {(user?.role === 'admin' || user?.role === 'author') && (
            <Button onClick={() => navigate('/new-post')}>
              <PlusIcon />
              Create New Post
            </Button>
          )}
        </Flex>
      </Box>

      <Box>
        <Heading size="5" mb="4">Your Posts</Heading>
        {posts.length === 0 ? (
          <Card>
            <Box p="4">
              <Flex direction="column" align="center" gap="3">
                <Text size="4">No posts found</Text>
                <Text size="3" color="gray">Create your first post to get started!</Text>
                {(user?.role === 'admin' || user?.role === 'author') && (
                  <Button onClick={() => navigate('/new-post')}>
                    <PlusIcon />
                    Create New Post
                  </Button>
                )}
              </Flex>
            </Box>
          </Card>
        ) : (
          <Flex direction="column" gap="4">
            {posts.map((post) => (
              <Card key={post.id}>
                <Box p="4">
                  <Flex justify="between" align="start" mb="3">
                    <Box style={{ flex: 1 }}>
                      <Heading size="4" mb="2" style={{ color: 'var(--gray-12)' }}>
                        {post.title}
                      </Heading>
                      <Text size="3" color="gray" style={{ lineHeight: 1.6 }}>
                        {truncateContent(post.content)}
                      </Text>
                    </Box>
                    <Flex gap="2">
                      <Button 
                        variant="outline" 
                        size="2"
                        onClick={() => navigate(`/post/${post.id}`)}
                      >
                        <EyeOpenIcon />
                        View
                      </Button>
                      {(user?.role === 'admin' || user?.role === 'author') && (
                        <Button 
                          variant="outline" 
                          size="2"
                          onClick={() => navigate(`/edit-post/${post.id}`)}
                        >
                          Edit
                        </Button>
                      )}
                    </Flex>
                  </Flex>
                  
                  <Flex gap="3" align="center">
                    <Flex gap="1" align="center">
                      <PersonIcon width="14" height="14" />
                      <Text size="2" color="gray">{post.author}</Text>
                    </Flex>
                    <Flex gap="1" align="center">
                      <CalendarIcon width="14" height="14" />
                      <Text size="2" color="gray">{formatDate(post.created_at)}</Text>
                    </Flex>
                    {post.published ? (
                      <Badge color="green">Published</Badge>
                    ) : (
                      <Badge color="orange">Draft</Badge>
                    )}
                  </Flex>
                </Box>
              </Card>
            ))}
          </Flex>
        )}
      </Box>
    </Container>
  )
}
