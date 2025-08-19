import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Box, Card, Heading, Text, Button, Flex, Badge, Spinner } from '@radix-ui/themes'
import { ReaderIcon, Pencil1Icon } from '@radix-ui/react-icons'

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
}

const PostsList: React.FC<PostsListProps> = ({
  apiUrl = 'http://localhost:8080/api',
  showPublishedOnly = true,
  page = 1,
  limit = 10,
  isAuthenticated = false,
  maxContentLength = 300,
  onPostClicked,
  onPostsLoaded,
  onError
}) => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString()
        })
        
        if (showPublishedOnly) {
          params.append('published', 'true')
        }
        
        const response = await axios.get(`${apiUrl}/posts?${params}`, {
          withCredentials: true
        })
        
        if (response.data && response.data.data) {
          const fetchedPosts = response.data.data
          setPosts(fetchedPosts)
          onPostsLoaded?.(fetchedPosts)
        } else {
          setPosts([])
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to load posts'
        setError(errorMessage)
        onError?.(errorMessage)
        console.error('Error fetching posts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [apiUrl, showPublishedOnly, page, limit, onPostsLoaded, onError])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const truncateContent = (content: string, maxLength: number): string => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + '...'
  }

  const handleRetry = async () => {
    setRetrying(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      if (showPublishedOnly) {
        params.append('published', 'true')
      }
      
      const response = await axios.get(`${apiUrl}/posts?${params}`, {
        withCredentials: true
      })
      
      if (response.data && response.data.data) {
        const fetchedPosts = response.data.data
        setPosts(fetchedPosts)
        onPostsLoaded?.(fetchedPosts)
      } else {
        setPosts([])
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load posts'
      setError(errorMessage)
      onError?.(errorMessage)
      console.error('Error fetching posts:', err)
    } finally {
      setRetrying(false)
    }
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" py="9">
        <Spinner size="3" />
        <Text ml="3" color="gray">Loading posts...</Text>
      </Flex>
    )
  }

  if (error) {
    return (
      <Flex direction="column" align="center" py="9" gap="4">
        <Text color="red" size="3">Error loading posts: {error}</Text>
        <Button 
          onClick={handleRetry}
          disabled={retrying}
          variant="soft"
        >
          {retrying ? 'Retrying...' : 'Retry'}
        </Button>
      </Flex>
    )
  }

  if (posts.length === 0) {
    return (
      <Flex justify="center" py="9">
        <Text color="gray">No posts found.</Text>
      </Flex>
    )
  }

  return (
    <Box>
      <Flex direction="column" gap="4">
        {posts.map((post) => (
          <Card 
            key={post.id} 
            size="3" 
            style={{ cursor: 'pointer' }}
            onClick={() => onPostClicked?.(post)}
          >
            <Flex direction="column" gap="3">
              <Flex justify="between" align="start">
                <Box style={{ flex: 1 }}>
                  <Heading size="4" mb="2" style={{ lineHeight: '1.3' }}>
                    {post.title}
                  </Heading>
                  <Flex align="center" gap="2" mb="3">
                    <Text size="2" color="gray">By {post.author || 'Admin'}</Text>
                    <Text size="2" color="gray">•</Text>
                    <Text size="2" color="gray">{formatDate(post.created_at)}</Text>
                    {!isAuthenticated && post.content.length > maxContentLength && (
                      <>
                        <Text size="2" color="gray">•</Text>
                        <Button
                          variant="ghost"
                          size="1"
                          onClick={(e) => {
                            e.stopPropagation()
                            onPostClicked?.(post)
                          }}
                        >
                          <ReaderIcon />
                          Read more
                        </Button>
                      </>
                    )}
                  </Flex>
                </Box>
                {isAuthenticated && (
                  <Badge 
                    color={post.published ? 'green' : 'yellow'} 
                    variant="soft"
                  >
                    {post.published ? 'Published' : 'Draft'}
                  </Badge>
                )}
              </Flex>
              
              <Text size="3" style={{ lineHeight: '1.6' }}>
                {truncateContent(post.content, maxContentLength)}
              </Text>
              
              {isAuthenticated && (
                <Flex pt="3" style={{ borderTop: '1px solid var(--gray-6)' }}>
                  <Button
                    variant="soft"
                    size="2"
                    onClick={(e) => {
                      e.stopPropagation()
                      onPostClicked?.(post)
                    }}
                  >
                    <Pencil1Icon />
                    View & Edit
                  </Button>
                </Flex>
              )}
            </Flex>
          </Card>
        ))}
      </Flex>
    </Box>
  )
}

export default PostsList