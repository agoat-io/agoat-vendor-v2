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

const Dashboard: React.FC = () => {
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
        if (!response.data.authenticated) {
          navigate('/login')
        }
      } catch (error) {
        setIsAuthenticated(false)
        navigate('/login')
      } finally {
        setAuthChecked(true)
      }
    }

    checkAuth()
  }, [navigate])

  const handlePostClick = (post: Post) => {
    navigate(`/post/${post.id}`)
  }

  const handleLogout = async () => {
    try {
      await axios.post(buildApiUrl(API_CONFIG.ENDPOINTS.LOGOUT), {}, {
        withCredentials: true
      })
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
      navigate('/')
    }
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

  if (!isAuthenticated) {
    return null // Will redirect to login
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
              <Heading size="6" color="blue">Dashboard</Heading>
              <Text size="2" color="gray">Manage your posts and content</Text>
            </Box>
            <Flex gap="3" align="center">
              <Button variant="outline" onClick={() => navigate('/')}>
                View Blog
              </Button>
              <Button onClick={() => navigate('/new-post')}>
                New Post
              </Button>
              <Button variant="soft" color="red" onClick={handleLogout}>
                Logout
              </Button>
            </Flex>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container>
        <Box mb="4">
          <Heading size="8" mb="2">Your Posts</Heading>
          <Text size="4" color="gray" mb="4">
            Manage and edit your published and draft posts
          </Text>
          <Separator mb="4" />
        </Box>

        <PostsList
          apiUrl={API_CONFIG.BASE_URL}
          showPublishedOnly={false}
          isAuthenticated={true}
          onPostClicked={handlePostClick}
        />
      </Container>
    </Box>
  )
}

export default Dashboard
