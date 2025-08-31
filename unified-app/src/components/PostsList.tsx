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
  Spinner,
  Flex,
  Container,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Separator
} from './ui'
import { ArrowLeftIcon, Pencil1Icon, PersonIcon, CalendarIcon } from '@radix-ui/react-icons'

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
      
      const url = `${apiUrl}/posts?${params}`
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
      <Container>
        <Flex justify="center" align="center" style={{ minHeight: '200px' }}>
          <Spinner size="3" />
          <Text size="3" ml="3">Loading posts...</Text>
        </Flex>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Card>
          <CardContent>
            <Flex direction="column" align="center" gap="3">
              <Text color="red" size="3">Error: {error}</Text>
              <Button onClick={fetchPosts} variant="outline">
                Try Again
              </Button>
            </Flex>
          </CardContent>
        </Card>
      </Container>
    )
  }

  if (posts.length === 0) {
    return (
      <Container>
        <Card>
          <CardContent>
            <Flex direction="column" align="center" gap="3">
              <Text size="3" color="gray">No posts available</Text>
              {!isAuthenticated && (
                <Text size="2" color="gray">Please log in to see all posts</Text>
              )}
            </Flex>
          </CardContent>
        </Card>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl">
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

      <Box mb="4">
        <Heading size="6" mb="2">Latest Posts</Heading>
        <Text color="gray" size="2">
          Showing {posts.length} of {totalPosts} posts
        </Text>
      </Box>

      <Flex direction="column" gap="4">
        {posts.map((post) => (
          <div key={post.id} onClick={() => handlePostClick(post)} style={{ cursor: 'pointer' }}>
            <Card>
            <CardHeader>
              <Flex justify="between" align="start">
                <Box>
                  <Heading size="4" mb="2">{post.title}</Heading>
                  <Flex gap="3" align="center" mb="2">
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
                  </Flex>
                </Box>
                <Flex gap="2">
                  {!post.published && (
                    <Badge color="yellow">Draft</Badge>
                  )}
                  {isAuthenticated && (
                    <Button size="1" variant="ghost">
                      <Pencil1Icon />
                    </Button>
                  )}
                </Flex>
              </Flex>
            </CardHeader>
            
            <CardContent>
              <div 
                dangerouslySetInnerHTML={{ __html: getPreviewText(post.content) }}
                style={{ 
                  lineHeight: '1.6',
                  color: 'var(--gray-11)'
                }}
              />
            </CardContent>
            
            <CardFooter>
              <Flex justify="between" align="center" style={{ width: '100%' }}>
                <Text size="2" color="gray">
                  {post.content.length > maxContentLength ? 'Click to read more...' : 'Full post'}
                </Text>
                <Badge variant="soft" color="blue">
                  {post.content.split(' ').length} words
                </Badge>
              </Flex>
            </CardFooter>
            </Card>
          </div>
        ))}
      </Flex>

      {totalPages > 1 && (
        <Box mt="6">
          <Separator mb="4" />
          <Flex justify="center" gap="2">
            <Button 
              variant="outline" 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <Text size="2" style={{ display: 'flex', alignItems: 'center' }}>
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
    </Container>
  )
}

export default PostsList
