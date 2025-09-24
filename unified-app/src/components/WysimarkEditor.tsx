import React, { useState, useEffect, useCallback } from 'react'
import { 
  Box, 
  Text, 
  Flex, 
  Button, 
  Card,
  Badge,
  Separator
} from '@radix-ui/themes'
import { 
  UpdateIcon,
  EyeOpenIcon,
  ClockIcon,
  EnterFullScreenIcon,
  ExitFullScreenIcon
} from '@radix-ui/react-icons'
import { Editable, useEditor } from '@wysimark/react'
import logger from '../utils/logger'

interface WysimarkEditorProps {
  initialContent?: string
  initialTitle?: string
  onSave?: (content: string, title: string, isDraft: boolean) => Promise<void>
  onPublish?: (content: string, title: string) => Promise<void>
  autoSaveInterval?: number
  placeholder?: string
  titlePlaceholder?: string
  className?: string
}

interface EditorState {
  content: string
  title: string
  isDraft: boolean
  lastSaved: Date | null
  isSaving: boolean
  hasUnsavedChanges: boolean
  wordCount: number
  readingTime: number
  isFullscreen: boolean
}

const WysimarkEditor: React.FC<WysimarkEditorProps> = ({
  initialContent = '',
  initialTitle = '',
  onSave,
  onPublish,
  autoSaveInterval = 30000, // 30 seconds
  placeholder = 'Tell your story...',
  titlePlaceholder = 'Title',
  className = ''
}) => {
  const [state, setState] = useState<EditorState>({
    content: initialContent,
    title: initialTitle,
    isDraft: true,
    lastSaved: null,
    isSaving: false,
    hasUnsavedChanges: false,
    wordCount: 0,
    readingTime: 0,
    isFullscreen: false
  })

  // Initialize Wysimark editor with all features enabled
  const editor = useEditor({
    height: '500px',
    minHeight: '300px',
    maxHeight: '800px',
    authToken: '' // Suppress upload warnings
  })

  // Calculate reading time and word count
  const calculateStats = useCallback((content: string) => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0)
    const wordCount = words.length
    const readingTime = Math.ceil(wordCount / 200) // Average reading speed: 200 words per minute
    return { wordCount, readingTime }
  }, [])

  // Update stats when content changes
  useEffect(() => {
    const { wordCount, readingTime } = calculateStats(state.content)
    setState(prev => ({ ...prev, wordCount, readingTime }))
  }, [state.content, calculateStats])

  // Auto-save functionality
  useEffect(() => {
    if (state.hasUnsavedChanges && state.content) {
      const timer = setTimeout(() => {
        handleAutoSave()
      }, autoSaveInterval)

      return () => clearTimeout(timer)
    }
  }, [state.content, state.hasUnsavedChanges, autoSaveInterval])

  const handleAutoSave = async () => {
    if (!onSave || state.isSaving) return

    logger.info('WysimarkEditor', 'auto_save', 'Auto-saving post', {
      title: state.title,
      contentLength: state.content.length,
      wordCount: state.wordCount
    })

    setState(prev => ({ ...prev, isSaving: true }))
    try {
      await onSave(state.content, state.title, true)
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        hasUnsavedChanges: false,
        lastSaved: new Date()
      }))
      
      logger.info('WysimarkEditor', 'auto_save', 'Auto-save completed successfully', {
        title: state.title,
        lastSaved: new Date()
      })
    } catch (error) {
      logger.error('WysimarkEditor', 'auto_save', 'Auto-save failed', {
        title: state.title,
        error: error instanceof Error ? error.message : String(error)
      })
      setState(prev => ({ ...prev, isSaving: false }))
    }
  }

  const handleSave = async () => {
    if (!onSave || state.isSaving) return

    logger.info('WysimarkEditor', 'manual_save', 'Manual save requested', {
      title: state.title,
      contentLength: state.content.length,
      wordCount: state.wordCount
    })

    setState(prev => ({ ...prev, isSaving: true }))
    try {
      await onSave(state.content, state.title, true)
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        hasUnsavedChanges: false,
        lastSaved: new Date()
      }))
      
      logger.info('WysimarkEditor', 'manual_save', 'Manual save completed successfully', {
        title: state.title,
        lastSaved: new Date()
      })
    } catch (error) {
      logger.error('WysimarkEditor', 'manual_save', 'Manual save failed', {
        title: state.title,
        error: error instanceof Error ? error.message : String(error)
      })
      setState(prev => ({ ...prev, isSaving: false }))
    }
  }

  const handlePublish = async () => {
    if (!onPublish || state.isSaving) return

    logger.info('WysimarkEditor', 'publish', 'Publish requested', {
      title: state.title,
      contentLength: state.content.length,
      wordCount: state.wordCount
    })

    setState(prev => ({ ...prev, isSaving: true }))
    try {
      await onPublish(state.content, state.title)
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        hasUnsavedChanges: false,
        lastSaved: new Date(),
        isDraft: false
      }))
      
      logger.info('WysimarkEditor', 'publish', 'Post published successfully', {
        title: state.title,
        lastSaved: new Date(),
        isDraft: false
      })
    } catch (error) {
      logger.error('WysimarkEditor', 'publish', 'Publish failed', {
        title: state.title,
        error: error instanceof Error ? error.message : String(error)
      })
      setState(prev => ({ ...prev, isSaving: false }))
    }
  }

  const handleContentChange = (markdown: string) => {
    logger.debug('WysimarkEditor', 'content_change', 'Content changed', {
      contentLength: markdown.length,
      hasUnsavedChanges: true
    })
    
    setState(prev => ({ 
      ...prev, 
      content: markdown,
      hasUnsavedChanges: true
    }))
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    logger.debug('WysimarkEditor', 'title_change', 'Title changed', {
      title: e.target.value,
      hasUnsavedChanges: true
    })
    
    setState(prev => ({ 
      ...prev, 
      title: e.target.value,
      hasUnsavedChanges: true
    }))
  }

  const toggleFullscreen = () => {
    const newFullscreenState = !state.isFullscreen
    logger.info('WysimarkEditor', 'fullscreen_toggle', 'Fullscreen toggled', {
      isFullscreen: newFullscreenState,
      title: state.title
    })
    
    setState(prev => ({ ...prev, isFullscreen: newFullscreenState }))
  }

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isFullscreen) {
        setState(prev => ({ ...prev, isFullscreen: false }))
      }
    }

    if (state.isFullscreen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [state.isFullscreen])

  // Manage body/html classes for fullscreen
  useEffect(() => {
    if (state.isFullscreen) {
      document.body.classList.add('wysimark-fullscreen-active')
      document.documentElement.classList.add('wysimark-fullscreen-active')
    } else {
      document.body.classList.remove('wysimark-fullscreen-active')
      document.documentElement.classList.remove('wysimark-fullscreen-active')
    }

    return () => {
      document.body.classList.remove('wysimark-fullscreen-active')
      document.documentElement.classList.remove('wysimark-fullscreen-active')
    }
  }, [state.isFullscreen])

  if (state.isFullscreen) {
    return (
      <div className="wysimark-fullscreen">
        {/* Wysimark Editor - Full Height */}
        <Editable
          editor={editor}
          value={state.content}
          onChange={handleContentChange}
          placeholder={placeholder}
          throttleInMs={1000}
          className="wysimark-editable"
        />

        {/* Compact Footer */}
        <div className="wysimark-footer">
          <Flex justify="between" align="center">
            {/* Statistics */}
            <Flex gap="3" align="center">
              <Text size="2" color="gray">
                {state.wordCount} words
              </Text>
              <Flex gap="1" align="center">
                <ClockIcon width="12" height="12" />
                <Text size="2" color="gray">
                  {state.readingTime} min read
                </Text>
              </Flex>
              {state.lastSaved && (
                <Flex gap="1" align="center">
                  <UpdateIcon width="12" height="12" />
                  <Text size="1" color="gray">
                    Saved {state.lastSaved.toLocaleTimeString()}
                  </Text>
                </Flex>
              )}
            </Flex>

            {/* Compact Actions */}
            <Flex gap="2" align="center">
              {state.hasUnsavedChanges && (
                <Badge color="orange" variant="soft" size="1">
                  Unsaved
                </Badge>
              )}
              {state.isSaving && (
                <Badge color="blue" variant="soft" size="1">
                  Saving...
                </Badge>
              )}
              
              <Button
                size="2"
                variant="soft"
                onClick={toggleFullscreen}
                title="Exit Fullscreen (Esc)"
              >
                <ExitFullScreenIcon />
                Exit
              </Button>
              
              <Button
                size="2"
                variant="soft"
                onClick={handleSave}
                disabled={state.isSaving || !state.hasUnsavedChanges}
              >
                <UpdateIcon />
                Save
              </Button>
              
              <Button
                size="2"
                onClick={handlePublish}
                disabled={state.isSaving}
              >
                <EyeOpenIcon />
                Publish
              </Button>
            </Flex>
          </Flex>
        </div>
      </div>
    )
  }

  return (
    <Card className={`wysimark-editor ${className}`}>
      {/* Title Input */}
      <Box p="4" style={{ borderBottom: '1px solid var(--gray-6)' }}>
        <input
          type="text"
          value={state.title}
          onChange={handleTitleChange}
          placeholder={titlePlaceholder}
          style={{
            width: '100%',
            fontSize: 'var(--font-size-6)',
            fontWeight: 'bold',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--gray-12)',
            fontFamily: 'var(--font-family-sans)'
          }}
        />
      </Box>

      {/* Wysimark Editor */}
      <Box style={{ position: 'relative' }}>
        <Editable
          editor={editor}
          value={state.content}
          onChange={handleContentChange}
          placeholder={placeholder}
          throttleInMs={1000}
          className="wysimark-editable"
          style={{
            minHeight: '400px',
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--font-family-sans)',
            fontSize: 'var(--font-size-3)',
            lineHeight: '1.6',
            color: 'var(--gray-11)'
          }}
        />
      </Box>

      {/* Editor Footer */}
      <Box p="4" style={{ 
        borderTop: '1px solid var(--gray-6)',
        background: 'var(--gray-1)'
      }}>
        <Flex justify="between" align="center">
          {/* Statistics */}
          <Flex gap="4" align="center">
            <Flex gap="1" align="center">
              <Text size="2" color="gray">
                {state.wordCount} words
              </Text>
            </Flex>
            <Flex gap="1" align="center">
              <ClockIcon width="14" height="14" />
              <Text size="2" color="gray">
                {state.readingTime} min read
              </Text>
            </Flex>
            {state.lastSaved && (
              <Flex gap="1" align="center">
                <UpdateIcon width="14" height="14" />
                <Text size="2" color="gray">
                  Saved {state.lastSaved.toLocaleTimeString()}
                </Text>
              </Flex>
            )}
          </Flex>

          {/* Status and Actions */}
          <Flex gap="2" align="center">
            {state.hasUnsavedChanges && (
              <Badge color="orange" variant="soft">
                Unsaved Changes
              </Badge>
            )}
            {state.isSaving && (
              <Badge color="blue" variant="soft">
                Saving...
              </Badge>
            )}
            {state.isDraft ? (
              <Badge color="orange" variant="soft">
                Draft
              </Badge>
            ) : (
              <Badge color="green" variant="soft">
                Published
              </Badge>
            )}
            
            <Separator orientation="vertical" />
            
            <Button
              variant="soft"
              onClick={toggleFullscreen}
              title="Enter Fullscreen"
            >
              <EnterFullScreenIcon />
              Fullscreen
            </Button>
            
            <Button
              variant="soft"
              onClick={handleSave}
              disabled={state.isSaving || !state.hasUnsavedChanges}
            >
              <UpdateIcon />
              Save Draft
            </Button>
            
            <Button
              onClick={handlePublish}
              disabled={state.isSaving}
            >
              <EyeOpenIcon />
              Publish
            </Button>
          </Flex>
        </Flex>
      </Box>
    </Card>
  )
}

export default WysimarkEditor
