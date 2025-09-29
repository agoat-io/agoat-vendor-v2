import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../config/axios'
import { 
  Box, 
  Heading, 
  Text, 
  Card, 
  Flex, 
  Button, 
  Container,
  Badge
} from '@radix-ui/themes'
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { buildApiUrl, API_CONFIG, DEFAULT_SITE_ID } from '../config/api'
import { useAzureAuth } from '../contexts/AzureAuthContext'
import WysimarkEditor from '../components/WysimarkEditor'
import { Post } from '../types'

export default function EditPost() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const { user, isAuthenticated } = useAzureAuth()

  // Redirect if not authenticated or not authorized
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      return
    }
    
    if (user?.role !== 'admin' && user?.role !== 'author') {
      navigate('/')
      return
    }
  }, [isAuthenticated, user, navigate])

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        setError('No post ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const response = await apiClient.get(API_CONFIG.ENDPOINTS.SITE_POST(DEFAULT_SITE_ID, id))
        
        if (response.data && response.data.data) {
          setPost(response.data.data)
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

    fetchPost()
  }, [id])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleSave = async (content: string, title: string, isDraft: boolean) => {
    if (!id) throw new Error('No post ID')

    try {
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.SITE_POST(DEFAULT_SITE_ID, id), {
        title,
        content,
        published: !isDraft
      })

      if (response.data && response.data.data) {
        setPost(response.data.data)
        setHasUnsavedChanges(false)
        return response.data.data
      } else {
        throw new Error('Failed to save post')
      }
    } catch (err: any) {
      console.error('Error saving post:', err)
      throw new Error(err.response?.data?.message || 'Failed to save post')
    }
  }

  const handlePublish = async (content: string, title: string) => {
    if (!id) throw new Error('No post ID')

    try {
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.SITE_POST(DEFAULT_SITE_ID, id), {
        title,
        content,
        published: true
      })

      if (response.data && response.data.data) {
        setPost(response.data.data)
        setHasUnsavedChanges(false)
        // Navigate to the published post
        navigate(`/post/${id}`)
        return response.data.data
      } else {
        throw new Error('Failed to publish post')
      }
    } catch (err: any) {
      console.error('Error publishing post:', err)
      throw new Error(err.response?.data?.message || 'Failed to publish post')
    }
  }

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true)
    } else {
      navigate('/dashboard')
    }
  }

  const handleConfirmBack = () => {
    setShowUnsavedDialog(false)
    setHasUnsavedChanges(false)
    navigate('/dashboard')
  }

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'author')) {
    return null // Will redirect
  }

  if (loading) {
    return (
      <Container>
        <Flex justify="center" align="center" style={{ minHeight: '200px' }}>
          <Text size="3">Loading post...</Text>
        </Flex>
      </Container>
    )
  }

  if (error || !post) {
    return (
      <Container>
        <Card>
          <Box p="4">
            <Flex direction="column" align="center" gap="3">
              <Text size="4" color="red">Error: {error || 'Post not found'}</Text>
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                Back to Dashboard
              </Button>
            </Flex>
          </Box>
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <Box mb="6">
        <Flex align="center" gap="3" mb="4">
          <Button 
            variant="ghost" 
            onClick={handleBackClick}
            style={{ color: 'var(--gray-11)' }}
          >
            <ArrowLeftIcon />
            Back to Dashboard
          </Button>
          {hasUnsavedChanges && (
            <Badge color="orange" variant="soft">
              Unsaved Changes
            </Badge>
          )}
          {post.published ? (
            <Badge color="green" variant="soft">
              Published
            </Badge>
          ) : (
            <Badge color="orange" variant="soft">
              Draft
            </Badge>
          )}
        </Flex>
        <Heading size="6" mb="2">Edit Post</Heading>
        <Text size="3" color="gray">
          Edit your post with our Medium-style editor
        </Text>
      </Box>

      <WysimarkEditor
        initialContent={post.content}
        initialTitle={post.title}
        onSave={handleSave}
        onPublish={handlePublish}
        autoSaveInterval={30000} // 30 seconds
        placeholder="Tell your story... Start writing here..."
        titlePlaceholder="Enter your post title..."
        className="edit-post-editor"
      />

      {/* Simple unsaved changes warning */}
      {showUnsavedDialog && (
        <Card style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000 }}>
          <Box p="4">
            <Text size="3" weight="medium" mb="3">Unsaved Changes</Text>
            <Text size="2" color="gray" mb="4">You have unsaved changes. Are you sure you want to leave?</Text>
            <Flex gap="2" justify="end">
              <Button variant="soft" color="gray" onClick={() => setShowUnsavedDialog(false)}>
                Continue Editing
              </Button>
              <Button color="red" onClick={handleConfirmBack}>
                Leave Without Saving
              </Button>
            </Flex>
          </Box>
        </Card>
      )}
    </Container>
  )
}
