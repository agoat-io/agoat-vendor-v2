import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../config/axios'
import logger from '../utils/logger'
import { 
  Box, 
  Heading, 
  Text, 
  Card, 
  Flex, 
  Button, 
  Container,
  Badge,
  Select
} from '../components/ui'
import { ChevronLeftIcon, PlusIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { buildApiUrl, API_CONFIG, DEFAULT_SITE_ID } from '../config/api'
import { useOIDCAuth } from '../contexts/OIDCAuthContext'
import WysimarkEditor from '../components/WysimarkEditor'

export default function NewPost() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const navigate = useNavigate()
  const { user, isAuthenticated } = useOIDCAuth()

  // Check authentication and authorization
  useEffect(() => {
    console.log('NewPost: Authentication check', { isAuthenticated, user })
    
    if (!isAuthenticated) {
      console.log('NewPost: Not authenticated, redirecting to login')
      navigate('/login')
      return
    }
    
    console.log('NewPost: User authenticated, allowing access', { user })
    
    // For now, allow all authenticated users to create posts
    // You can add role checking later if needed
    // if (user?.role !== 'admin' && user?.role !== 'author') {
    //   navigate('/')
    //   return
    // }
  }, [isAuthenticated, user, navigate])

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

  const handleSave = async (content: string, title: string, saveStatus: string) => {
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
    
    logger.info('NewPost', 'save', 'Attempting to save post', {
      title,
      status: saveStatus,
      contentLength: content.length,
      hasUnsavedChanges: hasUnsavedChanges
    })

    try {
      const response = await apiClient.post(buildApiUrl(API_CONFIG.ENDPOINTS.SITE_POSTS(DEFAULT_SITE_ID)), {
        title,
        content,
        published: saveStatus === 'published',
        status: saveStatus
      })

      if (response.data && response.data.data) {
        setHasUnsavedChanges(false)
        
        logger.info('NewPost', 'save', 'Post saved successfully', {
          postId: response.data.data.id,
          title,
          status: saveStatus,
          published: saveStatus === 'published'
        })
        
        // Stay on the same page - no redirect
        return response.data.data
      } else {
        logger.warning('NewPost', 'save', 'Save response missing data', {
          response: response.data
        })
        throw new Error('Failed to save post')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save post'
      
      logger.error('NewPost', 'save', 'Failed to save post', {
        title,
        status: saveStatus,
        error: errorMessage,
        responseStatus: err.response?.status,
        responseData: err.response?.data
      })
      
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }


  const handleEditorChange = (newContent: string, newTitle: string) => {
    setContent(newContent)
    setTitle(newTitle)
    setHasUnsavedChanges(true)
  }

  const handleStatusChange = (newStatus: 'draft' | 'published' | 'archived') => {
    setStatus(newStatus)
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

  if (!isAuthenticated) {
    return null // Will redirect to login
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
        </Flex>
        <Heading size="6" mb="2">Create New Post</Heading>
        <Text size="3" color="gray" mb="4">
          Write and publish your next great article with our Medium-style editor
        </Text>
        
        {error && (
          <Card style={{ backgroundColor: 'var(--red-3)', border: '1px solid var(--red-6)', marginBottom: 'var(--space-4)' }}>
            <Box p="3">
              <Text size="2" color="red" weight="medium">
                Error: {error}
              </Text>
            </Box>
          </Card>
        )}
        
      </Box>

      <WysimarkEditor
        initialContent={content}
        initialTitle={title}
        onSave={handleSave}
        autoSaveInterval={30000} // 30 seconds
        placeholder="Tell your story... Start writing here..."
        titlePlaceholder="Enter your post title..."
        className="new-post-editor"
        status={status}
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
