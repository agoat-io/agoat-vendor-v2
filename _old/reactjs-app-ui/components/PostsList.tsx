import React, { useState, useEffect } from 'react'
import { apiService } from '../src/services/api'
import type { Post } from '../src/types/api'
import { 
  Box, 
  Heading, 
  Text, 
  Badge, 
  Spinner,
  Flex,
  Card,
  CardContent,
  Button
} from '../src/components/ui'
import { ReaderIcon, Pencil1Icon } from '@radix-ui/react-icons'

interface PostsListProps {
  siteId?: string
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
  siteId,
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
        
        // Use the current site ID or the provided one
        const currentSiteId = siteId || apiService.getSiteId()
        
        const response = await apiService.getPosts(
          currentSiteId,
          page,
          limit,
          showPublishedOnly
        )
        
        if (response.success && response.data) {
          setPosts(response.data)
          onPostsLoaded?.(response.data)
        } else {
          setPosts([])
          if (response.error) {
            setError(response.error)
            onError?.(response.error)
          }
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load posts'
        setError(errorMessage)
        onError?.(errorMessage)
        console.error('Error fetching posts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [siteId, showPublishedOnly, page, limit, onPostsLoaded, onError])

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
      const currentSiteId = siteId || apiService.getSiteId()
      
      const response = await apiService.getPosts(
        currentSiteId,
        page,
        limit,
        showPublishedOnly
      )
      
      if (response.success && response.data) {
        setPosts(response.data)
        onPostsLoaded?.(response.data)
      } else {
        setPosts([])
        if (response.error) {
          setError(response.error)
          onError?.(response.error)
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load posts'
      setError(errorMessage)
      onError?.(errorMessage)
      console.error('Error retrying posts fetch:', err)
    } finally {
      setRetrying(false)
    }
  }

  const handlePostClick = (post: Post) => {
    onPostClicked?.(post)
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: '200px' }}>
        <Spinner size="3" />
        <Text ml="3" color="gray">Loading posts...</Text>
      </Flex>
    )
  }

  if (error) {
    return (
      <Card style={{ backgroundColor: 'var(--red-1)', border: '1px solid var(--red-6)' }}>
        <CardContent>
          <Flex direction="column" align="center" gap="3">
            <Text color="red" size="3" weight="medium">
              Error loading posts
            </Text>
            <Text color="gray" size="2" align="center">
              {error}
            </Text>
            <Button 
              variant="soft" 
              color="red" 
              onClick={handleRetry}
              loading={retrying}
            >
              Try Again
            </Button>
          </Flex>
        </CardContent>
      </Card>
    )
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent>
          <Flex direction="column" align="center" gap="3">
            <Text color="gray" size="3">
              No posts found
            </Text>
            <Text color="gray" size="2" align="center">
              {showPublishedOnly 
                ? 'No published posts available at the moment.' 
                : 'No posts available at the moment.'
              }
            </Text>
          </Flex>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box>
      <Flex direction="column" gap="4">
        {posts.map((post) => (
          <Card 
            key={post.id} 
            interactive 
            onClick={() => handlePostClick(post)}
            style={{ cursor: 'pointer' }}
          >
            <CardContent>
              <Flex direction="column" gap="3">
                {/* Post Header */}
                <Flex justify="between" align="start" gap="3">
                  <Box style={{ flex: 1 }}>
                    <Heading size="4" mb="2" style={{ lineHeight: '1.3' }}>
                      {post.title}
                    </Heading>
                    <Flex align="center" gap="2" mb="2">
                      <Text size="2" color="gray">
                        By {post.author || 'Admin'}
                      </Text>
                      <Text size="2" color="gray">•</Text>
                      <Text size="2" color="gray">
                        {formatDate(post.created_at)}
                      </Text>
                      {post.updated_at && post.updated_at !== post.created_at && (
                        <>
                          <Text size="2" color="gray">•</Text>
                          <Text size="2" color="gray">
                            Updated {formatDate(post.updated_at)}
                          </Text>
                        </>
                      )}
                    </Flex>
                  </Box>
                  
                  {/* Status Badge */}
                  <Badge 
                    color={post.published ? 'green' : 'yellow'} 
                    variant="soft"
                    size="2"
                  >
                    {post.published ? 'Published' : 'Draft'}
                  </Badge>
                </Flex>

                {/* Post Content Preview */}
                <Text 
                  size="3" 
                  color="gray" 
                  style={{ 
                    lineHeight: '1.6',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {truncateContent(post.content, maxContentLength)}
                </Text>

                {/* Action Buttons */}
                <Flex justify="between" align="center">
                  <Button variant="soft" size="2">
                    <ReaderIcon />
                    Read More
                  </Button>
                  
                  {isAuthenticated && (
                    <Button variant="ghost" size="2">
                      <Pencil1Icon />
                      Edit
                    </Button>
                  )}
                </Flex>
              </Flex>
            </CardContent>
          </Card>
        ))}
      </Flex>
    </Box>
  )
}

export default PostsList