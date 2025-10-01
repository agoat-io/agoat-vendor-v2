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
} from '../components/ui'
import { ChevronLeftIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { buildApiUrl, API_CONFIG, DEFAULT_SITE_ID } from '../config/api'
import { useOIDCAuth } from '../contexts/OIDCAuthContext'
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
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const { user, isAuthenticated } = useOIDCAuth()

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

        const response = await apiClient.get(buildApiUrl(API_CONFIG.ENDPOINTS.SITE_POST(DEFAULT_SITE_ID, id)))
        
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

  const validatePost = (title: string, content: string): string[] => {
    const errors: string[] = []
    
    if (!title || title.trim().length === 0) {
      errors.push('Title is required')
    }
    
    if (!content || content.trim().length === 0) {
      errors.push('Content is required')
    }
    
    if (title && title.length > 200) {
      errors.push('Title must be less than 200 characters')
    }
    
    return errors
  }

  const handleSave = async (content: string, title: string, status: string) => {
    if (!id) throw new Error('No post ID')

    // Clear any previous errors
    setError('')
    setValidationErrors([])
    setShowValidationModal(false)
    
    // Validate the post data
    const validationErrors = validatePost(title, content)
    if (validationErrors.length > 0) {
      setValidationErrors(validationErrors)
      setShowValidationModal(true)
      return
    }

    try {
      const response = await apiClient.put(buildApiUrl(API_CONFIG.ENDPOINTS.SITE_POST(DEFAULT_SITE_ID, id)), {
        title,
        content,
        published: status === 'published',
        status: status
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
      setError(err.response?.data?.message || 'Failed to save post')
      throw new Error(err.response?.data?.message || 'Failed to save post')
    }
  }

  const handleStatusChange = (newStatus: 'draft' | 'published' | 'archived') => {
    setHasUnsavedChanges(true)
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
            <ChevronLeftIcon />
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
        autoSaveInterval={30000} // 30 seconds
        placeholder="Tell your story... Start writing here..."
        titlePlaceholder="Enter your post title..."
        className="edit-post-editor"
        status={post.status}
        onStatusChange={handleStatusChange}
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

      {/* Validation errors modal */}
      {showValidationModal && (
        <Card style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, maxWidth: '400px', width: '90%' }}>
          <Box p="4">
            <Flex align="center" gap="2" mb="3">
              <ExclamationTriangleIcon style={{ color: 'var(--orange-9)' }} />
              <Text size="3" weight="medium">Validation Errors</Text>
            </Flex>
            <Text size="2" color="gray" mb="3">Please fix the following issues before saving:</Text>
            <Box mb="4">
              {validationErrors.map((error, index) => (
                <Text key={index} size="2" color="red" style={{ marginBottom: 'var(--space-1)' }}>
                  • {error}
                </Text>
              ))}
            </Box>
            <Flex gap="2" justify="end">
              <Button variant="soft" color="gray" onClick={() => setShowValidationModal(false)}>
                OK
              </Button>
            </Flex>
          </Box>
        </Card>
      )}
    </Container>
  )
}
