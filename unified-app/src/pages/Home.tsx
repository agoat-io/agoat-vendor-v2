import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import PostsList from '../components/PostsList'
import { Post } from '../types'
import { buildApiUrl, API_CONFIG } from '../config/api'
import { 
  Box, 
  Heading, 
  Text, 
  Flex,
  Container,
  Button,
  Separator,
  Card,
  Badge
} from '@radix-ui/themes'
import { 
  BookmarkIcon, 
  CalendarIcon, 
  PersonIcon 
} from '@radix-ui/react-icons'

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      // Simple mock authentication check - in a real app this would call an API
      // For now, we'll assume the user is not authenticated
      setIsAuthenticated(false)
      setAuthChecked(true)
    }

    checkAuth()
  }, [])

  const handlePostClick = (post: Post) => {
    navigate(`/post/${post.id}`)
  }

  if (!authChecked) {
    return (
      <Box style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <Card style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <Text size="3">Loading...</Text>
        </Card>
      </Box>
    )
  }

  return (
    <Box>
      {/* Hero Section */}
      <Card style={{ 
        background: 'linear-gradient(135deg, var(--accent-9) 0%, var(--accent-10) 100%)',
        color: 'white',
        marginBottom: 'var(--space-6)',
        border: 'none'
      }}>
        <Flex direction="column" align="center" py="6" gap="4">
          <Box style={{ 
            width: '80px', 
            height: '80px', 
            background: 'rgba(255, 255, 255, 0.2)', 
            borderRadius: 'var(--radius-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 'bold'
          }}>
            <BookmarkIcon width="40" height="40" />
          </Box>
          <Box style={{ textAlign: 'center' }}>
            <Heading size="8" mb="2">Welcome to AGoat Blog</Heading>
            <Text size="4" style={{ opacity: 0.9 }}>
              Discover the latest posts and insights from our community
            </Text>
          </Box>
          {isAuthenticated && (
            <Flex gap="3" mt="2">
              <Button 
                variant="solid" 
                style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
                onClick={() => navigate('/new-post')}
              >
                Create New Post
              </Button>
              <Button 
                variant="outline" 
                style={{ borderColor: 'rgba(255, 255, 255, 0.3)', color: 'white' }}
                onClick={() => navigate('/dashboard')}
              >
                View Dashboard
              </Button>
            </Flex>
          )}
        </Flex>
      </Card>

      {/* Stats Section */}
      <Flex gap="4" mb="6" wrap="wrap">
        <Card style={{ flex: 1, minWidth: '200px' }}>
          <Flex align="center" gap="3">
            <Box style={{ 
              width: '48px', 
              height: '48px', 
              background: 'var(--accent-3)', 
              borderRadius: 'var(--radius-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookmarkIcon color="var(--accent-11)" />
            </Box>
            <Box>
              <Text size="2" color="gray">Total Posts</Text>
              <Heading size="4">Latest Articles</Heading>
            </Box>
          </Flex>
        </Card>
        
        <Card style={{ flex: 1, minWidth: '200px' }}>
          <Flex align="center" gap="3">
            <Box style={{ 
              width: '48px', 
              height: '48px', 
              background: 'var(--green-3)', 
              borderRadius: 'var(--radius-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CalendarIcon color="var(--green-11)" />
            </Box>
            <Box>
              <Text size="2" color="gray">Updated</Text>
              <Heading size="4">Regularly</Heading>
            </Box>
          </Flex>
        </Card>
        
        <Card style={{ flex: 1, minWidth: '200px' }}>
          <Flex align="center" gap="3">
            <Box style={{ 
              width: '48px', 
              height: '48px', 
              background: 'var(--blue-3)', 
              borderRadius: 'var(--radius-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PersonIcon color="var(--blue-11)" />
            </Box>
            <Box>
              <Text size="2" color="gray">Community</Text>
              <Heading size="4">Growing</Heading>
            </Box>
          </Flex>
        </Card>
      </Flex>

      {/* Posts Section */}
      <Card>
        <Box p="4">
          <Flex justify="between" align="center" mb="4">
            <Box>
              <Heading size="5" mb="1">Latest Posts</Heading>
              <Text size="2" color="gray">
                {isAuthenticated ? 'View all posts including drafts' : 'Published articles only'}
              </Text>
            </Box>
            {!isAuthenticated && (
              <Badge variant="soft" color="blue">
                <PersonIcon />
                Login to see more
              </Badge>
            )}
          </Flex>
          <Separator mb="4" />
          <PostsList
            apiUrl={API_CONFIG.BASE_URL}
            showPublishedOnly={!isAuthenticated}
            isAuthenticated={isAuthenticated}
            onPostClicked={handlePostClick}
          />
        </Box>
      </Card>
    </Box>
  )
}

export default Home
