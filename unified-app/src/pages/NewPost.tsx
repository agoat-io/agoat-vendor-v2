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
  Badge
} from '@radix-ui/themes'
import { ChevronLeftIcon, PlusIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { buildApiUrl, API_CONFIG, DEFAULT_SITE_ID } from '../config/api'
import { useAzureAuth } from '../contexts/AzureAuthContext'
import WysimarkEditor from '../components/WysimarkEditor'

export default function NewPost() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const navigate = useNavigate()
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
    logger.info('NewPost', 'save', 'Attempting to save post', {
      title,
      isDraft,
      contentLength: content.length,
      hasUnsavedChanges: hasUnsavedChanges
    })

    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.SITE_POSTS(DEFAULT_SITE_ID), {
        title,
        content,
        published: !isDraft
      })

      if (response.data && response.data.data) {
        setHasUnsavedChanges(false)
        
        logger.info('NewPost', 'save', 'Post saved successfully', {
          postId: response.data.data.id,
          title,
          isDraft,
          published: !isDraft
        })
        
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
        isDraft,
        error: errorMessage,
        responseStatus: err.response?.status,
        responseData: err.response?.data
      })
      
      throw new Error(errorMessage)
    }
  }

  const handlePublish = async (content: string, title: string) => {
    logger.info('NewPost', 'publish', 'Attempting to publish post', {
      title,
      contentLength: content.length,
      hasUnsavedChanges: hasUnsavedChanges
    })

    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.SITE_POSTS(DEFAULT_SITE_ID), {
        title,
        content,
        published: true
      })

      if (response.data && response.data.data) {
        setHasUnsavedChanges(false)
        
        logger.info('NewPost', 'publish', 'Post published successfully', {
          postId: response.data.data.id,
          title,
          published: true
        })
        
        // Navigate to the published post
        navigate(`/post/${response.data.data.id}`)
        return response.data.data
      } else {
        logger.warning('NewPost', 'publish', 'Publish response missing data', {
          response: response.data
        })
        throw new Error('Failed to publish post')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to publish post'
      
      logger.error('NewPost', 'publish', 'Failed to publish post', {
        title,
        error: errorMessage,
        responseStatus: err.response?.status,
        responseData: err.response?.data
      })
      
      throw new Error(errorMessage)
    }
  }

  const handleEditorChange = (newContent: string, newTitle: string) => {
    setContent(newContent)
    setTitle(newTitle)
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
        <Text size="3" color="gray">
          Write and publish your next great article with our Medium-style editor
        </Text>
      </Box>

      <WysimarkEditor
        initialContent={content}
        initialTitle={title}
        onSave={handleSave}
        onPublish={handlePublish}
        autoSaveInterval={30000} // 30 seconds
        placeholder="Tell your story... Start writing here..."
        titlePlaceholder="Enter your post title..."
        className="new-post-editor"
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
