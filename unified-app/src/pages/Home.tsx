import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../config/axios'
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
import { CalendarIcon, PersonIcon, ArrowRightIcon, PlusIcon } from '@radix-ui/react-icons'
import { Post } from '../types'
import { buildApiUrl, API_CONFIG, DEFAULT_SITE_ID } from '../config/api'
import { useSimpleAuth } from '../contexts/SimpleAuthContext'

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, isAuthenticated } = useSimpleAuth()

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      setError('')

      try {
        const params = new URLSearchParams({
          page: '1',
          limit: '10',
          published: 'true'
        })

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
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <Container>
        <Flex justify="center" align="center" style={{ minHeight: '200px' }}>
          <Text size="3">Loading posts...</Text>
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
              <Text size="4" color="red">Error loading posts</Text>
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
        <Heading size="8" mb="2">Welcome to topvitaminsupplies.com</Heading>
        <Text size="4" color="gray" mb="4">
          Professional-grade supplements and practitioner resources
        </Text>
        
        {/* Practitioner Access CTA */}
        <Card mb="4" style={{ background: 'var(--green-2)' }}>
          <Box p="4">
            <Flex justify="between" align="center">
              <Box>
                <Heading size="4" mb="1">Practitioner Special Prices</Heading>
                <Text size="3" color="gray">
                  Log in or create account for access to exclusive practitioner pricing on Thorne supplements, including NSF Certified for Sport products with best practices
                </Text>
              </Box>
              {!isAuthenticated ? (
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Button size="3" style={{ 
                    background: 'var(--green-9)', 
                    color: 'white',
                    padding: '12px 24px',
                    minWidth: '160px',
                    whiteSpace: 'nowrap'
                  }}>
                    Create Account
                  </Button>
                </Link>
              ) : (
                <Link to="/thorne/education" style={{ textDecoration: 'none' }}>
                  <Button size="3" style={{ background: 'var(--green-9)', color: 'white' }}>
                    Access Practitioner Pricing
                  </Button>
                </Link>
              )}
            </Flex>
          </Box>
        </Card>
        
        {/* Thorne Supplements Info */}
        <Card mb="4" style={{ background: 'var(--blue-2)' }}>
          <Box p="4">
            <Flex justify="between" align="center">
              <Box>
                <Heading size="4" mb="1">Quality Thorne Supplements</Heading>
                <Text size="3" color="gray">
                  Learn more about the quality of Thorne supplements
                </Text>
              </Box>
              <Link to="/thorne/education" style={{ textDecoration: 'none' }}>
                <Button size="3">
                  Learn More
                </Button>
              </Link>
            </Flex>
          </Box>
        </Card>
        {isAuthenticated && (
          <Flex gap="3" mb="4" justify="between" align="center">
            <Box>
              <Text size="3" color="gray">
                Welcome back, {user?.username}! ({user?.role})
              </Text>
              <Text size="2" color="green" style={{ fontWeight: '500' }}>
                ✓ Access to practitioner special pricing enabled
              </Text>
            </Box>
            {(user?.role === 'admin' || user?.role === 'author') && (
              <Link to="/new-post" style={{ textDecoration: 'none' }}>
                <Button>
                  <PlusIcon />
                  Create New Post
                </Button>
              </Link>
            )}
          </Flex>
        )}
      </Box>

      {posts.length === 0 ? (
        <Card>
          <Box p="4">
            <Flex direction="column" align="center" gap="3">
              <Text size="4">No posts found</Text>
              <Text size="3" color="gray">Be the first to create a post!</Text>
            </Flex>
          </Box>
        </Card>
      ) : (
        <Box>
          <Heading size="6" mb="4">Latest Posts</Heading>
          <Flex direction="column" gap="4">
            {posts.map((post) => (
              <Card key={post.id} style={{ cursor: 'pointer' }}>
                <Box p="4">
                  <Link to={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Box>
                      <Flex justify="between" align="start" mb="3">
                        <Box style={{ flex: 1 }}>
                          <Heading size="5" mb="2" style={{ color: 'var(--gray-12)' }}>
                            {post.title}
                          </Heading>
                          <Text size="3" color="gray" style={{ lineHeight: 1.6 }}>
                            {truncateContent(post.content)}
                          </Text>
                        </Box>
                        <ArrowRightIcon width="20" height="20" color="var(--gray-8)" />
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
                  </Link>
                </Box>
              </Card>
            ))}
          </Flex>
        </Box>
      )}
    </Container>
  )
}
