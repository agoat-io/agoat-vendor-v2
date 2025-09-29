import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { marked } from 'marked';
import PostsList from './PostsList';
import FederatedComponent from '../src/components/FederatedComponent';
import { apiService } from '../src/services/api';
import type { Post } from '../src/types/api';
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
  Button
} from '../src/components/ui';
import { ArrowLeftIcon, Pencil1Icon, PersonIcon } from '@radix-ui/react-icons';
import { useTheme } from '../src/components/ThemeProvider';

const BlogListView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appearance } = useTheme();
  
  // State
  const [currentPage, setCurrentPage] = useState(1)
  const [postsPerPage] = useState(10)
  const [showingPost, setShowingPost] = useState(false)
  const [currentPost, setCurrentPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    
    // Truncate content for preview
    if (content.length > 800) {
      content = content.substring(0, 800) + '...'
    }
    
    // Convert markdown to HTML
    return marked.parse(content) as string
  }

  const fetchPost = async (postId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiService.getPost(postId)
      
      if (response.success && response.data) {
        setCurrentPost(response.data)
        setShowingPost(true)
        
        // Update page title
        document.title = `${response.data.title} - AGoat Blog`
      } else {
        setError(response.error || 'Post not found')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load post')
      console.error('Error fetching post:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePostClick = (post: Post) => {
    setCurrentPost(post)
    setShowingPost(true)
    
    // Update URL
    navigate(`/post/${post.slug}`)
    
    // Update page title
    document.title = `${post.title} - AGoat Blog`
  }

  const handleBackToList = () => {
    setShowingPost(false)
    setCurrentPost(null)
    setError(null)
    
    // Update URL back to list
    navigate('/')
    
    // Reset page title
    document.title = 'AGoat Blog'
  }

  // Handle direct post access via URL
  useEffect(() => {
    const pathname = location.pathname;
    const postMatch = pathname.match(/^\/post\/(.+)$/);
    
    if (postMatch && !showingPost) {
      const slug = postMatch[1];
      // Find post by slug in the current posts list
      // This is a simplified approach - in a real app you'd fetch the specific post
      console.log('Direct post access detected:', slug);
    }
  }, [location.pathname, showingPost]);

  // Show loading state
  if (loading) {
    return (
      <Container size="3" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <Flex justify="center" align="center" style={{ minHeight: '400px' }}>
          <Spinner size="3" />
        </Flex>
      </Container>
    )
  }

  // Show error state
  if (error) {
    return (
      <Container size="3" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <Card>
          <CardContent>
            <Flex direction="column" align="center" gap="3">
              <Text size="5" weight="bold" color="red">Error</Text>
              <Text>{error}</Text>
              <Button onClick={handleBackToList}>
                <ArrowLeftIcon />
                Back to Posts
              </Button>
            </Flex>
          </CardContent>
        </Card>
      </Container>
    )
  }

  // Show single post view
  if (showingPost && currentPost) {
    return (
      <Container size="3" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <Flex direction="column" gap="4">
          {/* Back button */}
          <Button 
            variant="soft" 
            onClick={handleBackToList}
            style={{ alignSelf: 'flex-start' }}
          >
            <ArrowLeftIcon />
            Back to Posts
          </Button>

          {/* Mandatory Federated Component */}
          <FederatedComponent
            componentName="PostViewer"
            remoteName="viewer"
            post={currentPost}
            onError={(error) => {
              console.error('Federated component error:', error)
              setError('Failed to load post viewer component')
            }}
          />
        </Flex>
      </Container>
    )
  }

  // Show posts list with mandatory federated component
  return (
    <Container size="3" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <Flex direction="column" gap="4">
        {/* Header */}
        <Box>
          <Heading size="8" mb="2">AGoat Blog</Heading>
          <Text size="3" color="gray">
            Discover insights, tutorials, and stories from our community
          </Text>
        </Box>

        {/* Mandatory Federated Component for Posts List */}
        <FederatedComponent
          componentName="PostsList"
          remoteName="viewer"
          showPublishedOnly={true}
          page={currentPage}
          limit={postsPerPage}
          maxContentLength={300}
          isAuthenticated={false}
          onPostClicked={handlePostClick}
          onError={(error) => {
            console.error('Federated component error:', error)
            setError('Failed to load posts list component')
          }}
        />
      </Flex>
    </Container>
  )
}

export default BlogListView