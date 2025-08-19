import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { buildApiUrl, API_CONFIG } from '../../../src/config/api'
import { 
  Card, 
  Heading, 
  Text, 
  TextField, 
  Button, 
  Flex, 
  Box,
  Callout, 
  RadioGroup,
  Badge,
  Container
} from '@radix-ui/themes'
import { 
  InfoCircledIcon, 
  ArrowLeftIcon, 
  CheckIcon,
  Cross2Icon,
  Pencil1Icon
} from '@radix-ui/react-icons'

interface Post {
  id: string
  title: string
  content: string
  published: boolean
  slug: string
  created_at: string
  updated_at: string
  user_id: string
  author?: string
}

const EditPostPage: React.FC = () => {
  const router = useRouter()
  const { id } = router.query
  
  // State
  const [post, setPost] = useState<Post | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.STATUS), {
          withCredentials: true
        })
        
        if (response.data?.data?.authenticated) {
          setIsAuthenticated(true)
        } else {
          // Redirect to login if not authenticated
          router.push('/login')
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  // Load post data
  useEffect(() => {
    if (!id || !isAuthenticated) return

    const loadPost = async () => {
      setLoading(true)
      setError('')
      
      try {
        const response = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.POST(id as string)), {
          withCredentials: true
        })
        
        if (response.data?.data) {
          const postData = response.data.data
          setPost(postData)
          setTitle(postData.title)
          setContent(postData.content)
          setPublished(postData.published)
        } else {
          setError('Post not found')
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load post')
        console.error('Error loading post:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [id, isAuthenticated])

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!content.trim()) {
      setError('Content is required')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await axios.put(buildApiUrl(API_CONFIG.ENDPOINTS.POST(id as string)), {
        title: title.trim(),
        content: content.trim(),
        published
      }, {
        withCredentials: true
      })

      if (response.data?.success) {
        setSuccess('Post saved successfully!')
        
        // Update local post data
        const updatedPost = response.data.data
        setPost(updatedPost)
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save post')
      console.error('Error saving post:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard')
  }

  const handleBackToPost = () => {
    if (post) {
      router.push(`/?post-path=${post.slug}/${post.id}`)
    }
  }

  if (!isAuthenticated) {
    return (
      <Container size="2">
        <Box py="9">
          <Card>
            <Flex direction="column" align="center" gap="4" p="6">
              <InfoCircledIcon width="24" height="24" />
              <Text>Checking authentication...</Text>
            </Flex>
          </Card>
        </Box>
      </Container>
    )
  }

  if (loading) {
    return (
      <Container size="2">
        <Box py="9">
          <Card>
            <Flex direction="column" align="center" gap="4" p="6">
              <InfoCircledIcon width="24" height="24" />
              <Text>Loading post...</Text>
            </Flex>
          </Card>
        </Box>
      </Container>
    )
  }

  if (error && !post) {
    return (
      <Container size="2">
        <Box py="9">
          <Card>
            <Flex direction="column" gap="4" p="6">
              <Callout.Root color="red">
                <Callout.Icon><InfoCircledIcon /></Callout.Icon>
                <Callout.Text>{error}</Callout.Text>
              </Callout.Root>
              <Button onClick={handleCancel} variant="soft">
                <ArrowLeftIcon />
                Back to Dashboard
              </Button>
            </Flex>
          </Card>
        </Box>
      </Container>
    )
  }

  return (
    <Container size="4">
      <Box py="6">
        {/* Header */}
        <Flex justify="between" align="center" mb="6">
          <Flex align="center" gap="3">
            <Button onClick={handleCancel} variant="ghost" size="2">
              <ArrowLeftIcon />
              Dashboard
            </Button>
            <Text size="1" color="gray">•</Text>
            <Heading size="6">Edit Article</Heading>
          </Flex>
          
          {post && (
            <Flex align="center" gap="3">
              <Badge 
                color={post.published ? 'green' : 'yellow'} 
                variant="soft"
                size="2"
              >
                {post.published ? 'Published' : 'Draft'}
              </Badge>
              <Button onClick={handleBackToPost} variant="soft" size="2">
                View Article
              </Button>
            </Flex>
          )}
        </Flex>

        {/* Main Content */}
        <Card size="3">
          <Flex direction="column" gap="6" p="6">
            {/* Status Messages */}
            {error && (
              <Callout.Root color="red">
                <Callout.Icon><Cross2Icon /></Callout.Icon>
                <Callout.Text>{error}</Callout.Text>
              </Callout.Root>
            )}
            
            {success && (
              <Callout.Root color="green">
                <Callout.Icon><CheckIcon /></Callout.Icon>
                <Callout.Text>{success}</Callout.Text>
              </Callout.Root>
            )}

            {/* Post Form */}
            <Flex direction="column" gap="4">
              {/* Title */}
              <Box>
                <Text size="3" weight="medium" mb="2" as="label">Title</Text>
                <TextField.Root
                  size="3"
                  placeholder="Enter your article title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Box>

              {/* Content */}
              <Box>
                <Text size="3" weight="medium" mb="2" as="label">Content</Text>
                <textarea
                  placeholder="Write your article content in Markdown..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={{ 
                    minHeight: '400px', 
                    fontFamily: 'monospace',
                    width: '100%',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--gray-6)',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    resize: 'vertical'
                  }}
                />
                <Text size="1" color="gray" mt="1">
                  You can use Markdown syntax for formatting. The content will be rendered as HTML when displayed.
                </Text>
              </Box>

              {/* Published Status */}
              <Box>
                <Text size="3" weight="medium" mb="3">Status</Text>
                <RadioGroup.Root
                  value={published ? 'published' : 'draft'}
                  onValueChange={(value) => setPublished(value === 'published')}
                >
                  <Flex gap="4">
                    <Text size="2">
                      <Flex align="center" gap="2">
                        <RadioGroup.Item value="draft" />
                        <Text>Draft</Text>
                      </Flex>
                    </Text>
                    <Text size="2">
                      <Flex align="center" gap="2">
                        <RadioGroup.Item value="published" />
                        <Text>Published</Text>
                      </Flex>
                    </Text>
                  </Flex>
                </RadioGroup.Root>
                <Text size="1" color="gray" mt="1">
                  Drafts are only visible to you. Published articles are visible to everyone.
                </Text>
              </Box>
            </Flex>

            {/* Action Buttons */}
            <Flex justify="end" gap="3" pt="4" style={{ borderTop: '1px solid var(--gray-6)' }}>
              <Button 
                onClick={handleCancel} 
                variant="soft" 
                size="3"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                size="3"
                disabled={saving || !title.trim() || !content.trim()}
              >
                <Pencil1Icon />
                {saving ? 'Saving...' : 'Save Article'}
              </Button>
            </Flex>
          </Flex>
        </Card>

        {/* Post Info */}
        {post && (
          <Card mt="4" variant="surface">
            <Box p="4">
              <Flex justify="between" align="center">
                <Text size="2" color="gray">
                  Created: {new Date(post.created_at).toLocaleDateString()}
                </Text>
                <Text size="2" color="gray">
                  Last updated: {new Date(post.updated_at).toLocaleDateString()}
                </Text>
              </Flex>
            </Box>
          </Card>
        )}
      </Box>
    </Container>
  )
}

export default EditPostPage
