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
  Separator
} from '../components/ui'


const Home: React.FC = () => {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH_CHECK), {
          withCredentials: true
        })
        setIsAuthenticated(!!response.data.authenticated)
      } catch (error) {
        setIsAuthenticated(false)
      } finally {
        setAuthChecked(true)
      }
    }

    checkAuth()
  }, [])

  const handlePostClick = (post: Post) => {
    navigate(`/post/${post.id}`)
  }

  const handleLoginClick = () => {
    navigate('/login')
  }

  const handleDashboardClick = () => {
    navigate('/dashboard')
  }

  if (!authChecked) {
    return (
      <Container>
        <Box style={{ textAlign: 'center', padding: '2rem' }}>
          <Text>Loading...</Text>
        </Box>
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
              {isAuthenticated ? (
                <>
                  <Button variant="outline" onClick={handleDashboardClick}>
                    Dashboard
                  </Button>
                  <Button onClick={() => navigate('/new-post')}>
                    New Post
                  </Button>
                </>
              ) : (
                <Button onClick={handleLoginClick}>
                  Login
                </Button>
              )}
            </Flex>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container>
        <Box mb="4">
          <Heading size="8" mb="2">Welcome to AGoat Blog</Heading>
          <Text size="4" color="gray" mb="4">
            Discover the latest posts and insights from our community
          </Text>
          <Separator mb="4" />
        </Box>

        <PostsList
          apiUrl={API_CONFIG.BASE_URL}
          showPublishedOnly={!isAuthenticated}
          isAuthenticated={isAuthenticated}
          onPostClicked={handlePostClick}
        />
      </Container>
    </Box>
  )
}

export default Home
