import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Post } from '../types'
import { 
  Box, 
  Heading, 
  Text, 
  Badge, 
  Flex,
  Card,
  Button,
  Separator,
  Grid
} from '@radix-ui/themes'
import { 
  ArrowLeftIcon, 
  Pencil1Icon, 
  PersonIcon, 
  CalendarIcon,
  ClockIcon,
  EyeOpenIcon
} from '@radix-ui/react-icons'

interface PostsListProps {
  apiUrl?: string
  showPublishedOnly?: boolean
  page?: number
  limit?: number
  isAuthenticated?: boolean
  maxContentLength?: number
  onPostClicked?: (post: Post) => void
  onPostsLoaded?: (posts: Post[]) => void
  onError?: (error: string) => void
  showBackButton?: boolean
  onBackClick?: () => void
}

const PostsList: React.FC<PostsListProps> = ({
  apiUrl = '/api',
  showPublishedOnly = true,
  page = 1,
  limit = 10,
  isAuthenticated = false,
  maxContentLength = 300,
  onPostClicked,
  onPostsLoaded,
  onError,
  showBackButton = false,
  onBackClick
}) => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(page)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getPreviewText = (content: string) => {
    let text = content
    
    // For non-authenticated users, truncate content
    if (!isAuthenticated && text.length > maxContentLength) {
      text = text.substring(0, maxContentLength) + '...'
    }
    
    // Convert markdown to HTML for preview
    return DOMPurify.sanitize(marked.parse(text) as string)
  }

  const fetchPosts = useCallback(async () => {
    console.log('PostsList: Fetching posts with params:', {
      apiUrl,
      page: currentPage,
      limit,
      showPublishedOnly: showPublishedOnly || !isAuthenticated
    })
    
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString()
      })
      
      if (showPublishedOnly || !isAuthenticated) {
        params.append('published', 'true')
      }
      
      const url = `${apiUrl}/sites/18c6498d-f738-4c9f-aefd-d66bec11d751/posts?${params}`
      console.log('PostsList: Making request to:', url)
      const response = await axios.get(url)
      
      if (response.data && response.data.data) {
        setPosts(response.data.data)
        setTotalPosts(response.data.meta?.total || response.data.data.length)
        setTotalPages(response.data.meta?.total_pages || Math.ceil(response.data.data.length / limit))
        
        console.log('PostsList: Loaded posts:', response.data.data.length)
        onPostsLoaded?.(response.data.data)
      } else {
        setError('No posts found')
        onError?.('No posts found')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load posts'
      console.error('PostsList: Error fetching posts:', err)
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [apiUrl, currentPage, limit, showPublishedOnly, isAuthenticated, maxContentLength, onPostsLoaded, onError])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handlePostClick = (post: Post) => {
    onPostClicked?.(post)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  if (loading) {
    return (
      <Box style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px' 
      }}>
        <Card style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <Flex direction="column" align="center" gap="3">
            <Box style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid var(--gray-6)', 
              borderTop: '3px solid var(--accent-9)', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }} />
            <Text size="3">Loading posts...</Text>
          </Flex>
        </Card>
      </Box>
    )
  }

  if (error) {
    return (
      <Card>
        <Box p="4">
          <Flex direction="column" align="center" gap="3">
            <Text color="red" size="3">Error: {error}</Text>
            <Button onClick={fetchPosts} variant="outline">
              Try Again
            </Button>
          </Flex>
        </Box>
      </Card>
    )
  }

  if (posts.length === 0) {
    return (
      <Card>
        <Box p="6" style={{ textAlign: 'center' }}>
          <Flex direction="column" align="center" gap="3">
            <Box style={{ 
              width: '64px', 
              height: '64px', 
              background: 'var(--gray-3)', 
              borderRadius: 'var(--radius-6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <EyeOpenIcon width="32" height="32" color="var(--gray-8)" />
            </Box>
            <Text size="4" color="gray">No posts available</Text>
            {!isAuthenticated && (
              <Text size="2" color="gray">Please log in to see all posts</Text>
            )}
          </Flex>
        </Box>
      </Card>
    )
  }

  return (
    <Box>
      {showBackButton && (
        <Flex mb="4">
          <Button 
            variant="ghost" 
            onClick={onBackClick}
          >
            <ArrowLeftIcon />
            Back to Posts
          </Button>
        </Flex>
      )}

      <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
        {posts.map((post) => (
          <Card 
            key={post.id} 
            style={{ 
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={() => handlePostClick(post)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = 'var(--shadow-4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--shadow-2)'
            }}
          >
            <Box p="4" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <Box mb="3">
                <Flex justify="between" align="start" mb="2">
                  <Badge 
                    variant="soft" 
                    color={post.published ? "green" : "yellow"}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {post.published ? 'Published' : 'Draft'}
                  </Badge>
                  {isAuthenticated && (
                    <Button size="1" variant="ghost" style={{ padding: '2px' }}>
                      <Pencil1Icon width="12" height="12" />
                    </Button>
                  )}
                </Flex>
                <Heading size="4" mb="2" style={{ 
                  lineHeight: '1.3',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {post.title}
                </Heading>
              </Box>

              {/* Content Preview */}
              <Box mb="3" style={{ flex: 1 }}>
                <div 
                  dangerouslySetInnerHTML={{ __html: getPreviewText(post.content) }}
                  style={{ 
                    lineHeight: '1.6',
                    color: 'var(--gray-11)',
                    fontSize: '0.875rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                />
              </Box>

              {/* Footer */}
              <Box>
                <Separator mb="3" />
                <Flex justify="between" align="center" mb="2">
                  <Flex align="center" gap="1">
                    <CalendarIcon width="12" height="12" />
                    <Text size="1" color="gray">{formatDate(post.created_at)}</Text>
                  </Flex>
                  <Flex align="center" gap="1">
                    <ClockIcon width="12" height="12" />
                    <Text size="1" color="gray">{post.content.split(' ').length} words</Text>
                  </Flex>
                </Flex>
                {post.author && (
                  <Flex align="center" gap="1">
                    <PersonIcon width="12" height="12" />
                    <Text size="1" color="gray">{post.author}</Text>
                  </Flex>
                )}
              </Box>
            </Box>
          </Card>
        ))}
      </Grid>

      {totalPages > 1 && (
        <Box mt="6">
          <Separator mb="4" />
          <Flex justify="center" gap="3" align="center">
            <Button 
              variant="outline" 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <Text size="2" style={{ 
              display: 'flex', 
              alignItems: 'center',
              padding: '0 var(--space-3)'
            }}>
              Page {currentPage} of {totalPages}
            </Text>
            <Button 
              variant="outline" 
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </Button>
          </Flex>
        </Box>
      )}
    </Box>
  )
}

export default PostsList
