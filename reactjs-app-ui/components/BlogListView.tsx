import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { marked } from 'marked'
import axios from 'axios'
import PostsList from './PostsList'
import FederatedComponent from '../src/components/FederatedComponent'
import { buildApiUrl, API_CONFIG } from '../src/config/api'
import { Box, Card, Heading, Text, Button, Flex, Badge, Spinner } from '@radix-ui/themes'
import { ArrowLeftIcon, Pencil1Icon, PersonIcon } from '@radix-ui/react-icons'

interface Post {
  id: string
  title: string
  content: string
  slug: string
  published: boolean
  created_at: string
  updated_at: string
  user_id: string
  author?: string
}

const BlogListView: React.FC = () => {
  const router = useRouter()
  
  // State
  const [currentPage, setCurrentPage] = useState(1)
  const [postsPerPage] = useState(10)
  const [showingPost, setShowingPost] = useState(false)
  const [currentPost, setCurrentPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getRenderedContent = () => {
    if (!currentPost) return ''
    
    let content = currentPost.content
    
    // Truncate content for non-authenticated users
    if (!isAuthenticated && content.length > 800) {
      content = content.substring(0, 800) + '...'
    }
    
    // Convert markdown to HTML
    return marked.parse(content) as string
  }

  const fetchPost = async (postId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.POST(postId)), {
        withCredentials: true
      })
      
      if (response.data && response.data.data) {
        setCurrentPost(response.data.data)
        setShowingPost(true)
        
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

  const handlePostClick = (post: Post) => {
    console.log('BlogListView: Post clicked:', post)
    
    // Set the current post and show single post view
    setCurrentPost(post)
    setShowingPost(true)
    
    // Update URL with post-path parameter
    const postPath = `${post.slug}/${post.id}`
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('post-path', postPath)
    window.history.pushState({}, '', currentUrl.toString())
    
    // Update page title
    document.title = `${post.title} - AGoat Blog`
  }

  const backToList = () => {
    setShowingPost(false)
    setCurrentPost(null)
    
    // Remove post-path from URL
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.delete('post-path')
    window.history.pushState({}, '', currentUrl.toString())
    
    // Reset page title
    document.title = 'AGoat Blog - Latest Posts and Insights'
  }

  const editPost = () => {
    if (currentPost) {
      // Navigate to edit page
      router.push(`/post/${currentPost.id}/edit`)
    }
  }

  const handleLoginRequested = () => {
    // Navigate to login page
    router.push('/login')
  }

  const handleViewerError = (error: Error) => {
    console.error('Viewer error:', error)
    setError(error.message)
  }

  const handlePostsLoaded = (posts: Post[]) => {
    console.log('Posts loaded via federation:', posts.length)
  }

  const checkForPostPath = () => {
    const postPath = router.query['post-path'] as string
    
    if (postPath) {
      // Extract post ID from the path (format: slug/id)
      const parts = postPath.split('/')
      const postId = parts[parts.length - 1]
      
      if (postId) {
        fetchPost(postId)
      }
    } else {
      setShowingPost(false)
      setCurrentPost(null)
    }
  }

  const shouldShowLoginPrompt = () => {
    if (!currentPost || isAuthenticated) return false
    return currentPost.content.length > 800
  }

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const response = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.STATUS), {
          withCredentials: true
        })
        setIsAuthenticated(response.data.data?.authenticated || false)
      } catch (err) {
        console.error('Auth check failed:', err)
        setIsAuthenticated(false)
      } finally {
        setAuthChecked(true)
      }
    }

    checkAuth()
  }, []) // Empty dependency array is correct here as we only want to run this once on mount

  useEffect(() => {
    // Check for post-path in URL on initial load
    if (router.isReady) {
      checkForPostPath()
      
      // Check for page parameter in URL
      const pageParam = router.query.page as string
      if (pageParam) {
        setCurrentPage(parseInt(pageParam) || 1)
      }
    }
    
    // Listen for browser back/forward navigation
    const handlePopState = () => checkForPostPath()
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [router.isReady, router.query]) // Dependencies are correct

  // Show loading while checking authentication
  if (!authChecked) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: '100vh' }}>
        <Spinner size="3" />
        <Text ml="3" color="gray">Loading...</Text>
      </Flex>
    )
  }

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: 'var(--gray-1)' }}>
      {/* Header */}
      <Box style={{ backgroundColor: 'white', borderBottom: '1px solid var(--gray-6)' }}>
        <Box style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px' }}>
          <Flex justify="between" align="center">
            <Box>
              <Heading size="6">AGoat Blog</Heading>
              <Text size="2" color="gray">All articles and insights</Text>
            </Box>
            {!isAuthenticated ? (
              <Button onClick={() => router.push('/login')}>
                <PersonIcon />
                Admin Login
              </Button>
            ) : (
              <Button onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
            )}
          </Flex>
        </Box>
      </Box>

      {/* Main content */}
      <Box style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Back to list button when viewing single post */}
        {showingPost && (
          <Box mb="6">
            <Button variant="soft" onClick={backToList}>
              <ArrowLeftIcon />
              Back to All Articles
            </Button>
          </Box>
        )}

        {/* Single Post View */}
        {showingPost && currentPost && (
          <Card size="4" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Box p="6">
              <Heading size="8" mb="4" style={{ lineHeight: '1.2' }}>
                {currentPost.title}
              </Heading>
              
              <Flex align="center" gap="3" mb="6" style={{ color: 'var(--gray-11)' }}>
                <Text size="2">By {currentPost.author || 'Admin'}</Text>
                <Text size="2">•</Text>
                <Text size="2">{formatDate(currentPost.created_at)}</Text>
                {currentPost.updated_at && currentPost.updated_at !== currentPost.created_at && (
                  <>
                    <Text size="2">•</Text>
                    <Text size="2">Updated {formatDate(currentPost.updated_at)}</Text>
                  </>
                )}
              </Flex>
              
              <Box 
                style={{ 
                  lineHeight: '1.7',
                  fontSize: '16px'
                }}
                dangerouslySetInnerHTML={{ __html: getRenderedContent() }}
              />
              
              {/* Edit button for authenticated users */}
              {isAuthenticated && (
                <Box mt="6" pt="6" style={{ borderTop: '1px solid var(--gray-6)' }}>
                  <Flex justify="between" align="center">
                    <Badge 
                      color={currentPost.published ? 'green' : 'yellow'} 
                      variant="soft"
                      size="2"
                    >
                      {currentPost.published ? 'Published' : 'Draft'}
                    </Badge>
                    <Button onClick={editPost}>
                      <Pencil1Icon />
                      Edit Article
                    </Button>
                  </Flex>
                </Box>
              )}
              
              {/* Login prompt for non-authenticated users */}
              {!isAuthenticated && shouldShowLoginPrompt() && (
                <Card mt="6" style={{ backgroundColor: 'var(--gray-3)' }}>
                  <Box p="4">
                    <Heading size="4" mb="2">Want to read more?</Heading>
                    <Text color="gray" mb="4">Sign in to access the full article and discover more great content.</Text>
                    <Button onClick={handleLoginRequested}>
                      Sign In
                    </Button>
                  </Box>
                </Card>
              )}
            </Box>
          </Card>
        )}

        {/* Posts List View - Using Federated Component with Zero-Knowledge */}
        {!showingPost && (
          <FederatedComponent
            componentName="PostsList"
            remoteName="viewer"
            fallback={PostsList}
            onError={handleViewerError}
            // Props for the PostsList component
            apiUrl={API_CONFIG.BASE_URL}
            showPublishedOnly={true}
            page={currentPage}
            limit={postsPerPage}
            maxContentLength={300}
            isAuthenticated={isAuthenticated}
            onPostClicked={handlePostClick}
            onPostsLoaded={handlePostsLoaded}
          />
        )}
      </Box>
    </Box>
  )
}

export default BlogListView