import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Box, 
  Text, 
  Flex, 
  Button, 
  Card,
  Badge,
  Separator,
  IconButton,
  Tooltip
} from '@radix-ui/themes'
import { 
  FontBoldIcon, 
  FontItalicIcon, 
  UnderlineIcon,
  QuoteIcon,
  ListBulletIcon,
  Link1Icon,
  ImageIcon,
  HeadingIcon,
  CodeIcon,
  CheckIcon,
  Cross2Icon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  UpdateIcon,
  EyeOpenIcon,
  EyeNoneIcon
} from '@radix-ui/react-icons'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

interface MediumEditorProps {
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
  showPreview: boolean
  readingTime: number
  wordCount: number
}

const MediumEditor: React.FC<MediumEditorProps> = ({
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
    showPreview: false,
    readingTime: 0,
    wordCount: 0
  })

  const editorRef = useRef<HTMLDivElement>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastContentRef = useRef<string>('')

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
    if (state.content !== lastContentRef.current) {
      lastContentRef.current = state.content
      setState(prev => ({ ...prev, hasUnsavedChanges: true }))

      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      // Set new timer
      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSave()
      }, autoSaveInterval)
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [state.content, autoSaveInterval])

  // Handle auto-save
  const handleAutoSave = async () => {
    if (!onSave || state.isSaving) return

    setState(prev => ({ ...prev, isSaving: true }))
    try {
      await onSave(state.content, state.title, true)
      setState(prev => ({ 
        ...prev, 
        lastSaved: new Date(), 
        hasUnsavedChanges: false,
        isSaving: false 
      }))
    } catch (error) {
      console.error('Auto-save failed:', error)
      setState(prev => ({ ...prev, isSaving: false }))
    }
  }

  // Handle manual save
  const handleSave = async () => {
    if (!onSave || state.isSaving) return

    setState(prev => ({ ...prev, isSaving: true }))
    try {
      await onSave(state.content, state.title, state.isDraft)
      setState(prev => ({ 
        ...prev, 
        lastSaved: new Date(), 
        hasUnsavedChanges: false,
        isSaving: false 
      }))
    } catch (error) {
      console.error('Save failed:', error)
      setState(prev => ({ ...prev, isSaving: false }))
    }
  }

  // Handle publish
  const handlePublish = async () => {
    if (!onPublish || state.isSaving) return

    setState(prev => ({ ...prev, isSaving: true }))
    try {
      await onPublish(state.content, state.title)
      setState(prev => ({ 
        ...prev, 
        isDraft: false,
        lastSaved: new Date(), 
        hasUnsavedChanges: false,
        isSaving: false 
      }))
    } catch (error) {
      console.error('Publish failed:', error)
      setState(prev => ({ ...prev, isSaving: false }))
    }
  }

  // Formatting functions
  const formatText = (format: string) => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const selectedText = range.toString()
    
    if (!selectedText) return

    let formattedText = ''
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        break
      case 'underline':
        formattedText = `<u>${selectedText}</u>`
        break
      case 'code':
        formattedText = `\`${selectedText}\``
        break
      case 'quote':
        formattedText = `> ${selectedText}`
        break
      case 'link':
        const url = prompt('Enter URL:')
        if (url) {
          formattedText = `[${selectedText}](${url})`
        } else {
          return
        }
        break
      default:
        return
    }

    // Replace selected text with formatted text
    range.deleteContents()
    range.insertNode(document.createTextNode(formattedText))
    
    // Update content state
    if (editorRef.current) {
      setState(prev => ({ 
        ...prev, 
        content: editorRef.current?.innerText || prev.content 
      }))
    }
  }

  // Insert block elements
  const insertBlock = (blockType: string) => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    let blockText = ''
    
    switch (blockType) {
      case 'h1':
        blockText = '\n# '
        break
      case 'h2':
        blockText = '\n## '
        break
      case 'h3':
        blockText = '\n### '
        break
      case 'ul':
        blockText = '\n- '
        break
      case 'ol':
        blockText = '\n1. '
        break
      case 'image':
        const imageUrl = prompt('Enter image URL:')
        if (imageUrl) {
          blockText = `\n![Image](${imageUrl})`
        } else {
          return
        }
        break
      default:
        return
    }

    // Insert at cursor position
    range.insertNode(document.createTextNode(blockText))
    
    // Update content state
    if (editorRef.current) {
      setState(prev => ({ 
        ...prev, 
        content: editorRef.current?.innerText || prev.content 
      }))
    }
  }

  // Handle content changes
  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerText
    setState(prev => ({ ...prev, content }))
  }

  // Handle title changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setState(prev => ({ ...prev, title }))
  }

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault()
          handleSave()
          break
        case 'p':
          e.preventDefault()
          handlePublish()
          break
        case 'b':
          e.preventDefault()
          formatText('bold')
          break
        case 'i':
          e.preventDefault()
          formatText('italic')
          break
        case 'k':
          e.preventDefault()
          formatText('link')
          break
      }
    }
  }

  // Render preview content
  const renderPreview = () => {
    if (!state.showPreview) return null
    
    const htmlContent = DOMPurify.sanitize(marked.parse(state.content) as string)
    
    return (
      <Box className="preview-content" style={{ 
        padding: 'var(--space-4)',
        border: '1px solid var(--gray-6)',
        borderRadius: 'var(--radius-3)',
        background: 'var(--gray-1)',
        marginTop: 'var(--space-4)'
      }}>
        <Text size="2" weight="medium" mb="3" color="gray">Preview</Text>
        <div 
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          style={{
            lineHeight: '1.7',
            fontSize: 'var(--font-size-3)'
          }}
        />
      </Box>
    )
  }

  return (
    <Box className={`medium-editor ${className}`}>
      {/* Editor Header */}
      <Card style={{ marginBottom: 'var(--space-4)' }}>
        <Box p="4">
          <Flex justify="between" align="center" mb="4">
            <Box style={{ flex: 1 }}>
              <input
                type="text"
                placeholder={titlePlaceholder}
                value={state.title}
                onChange={handleTitleChange}
                style={{
                  width: '100%',
                  fontSize: 'var(--font-size-6)',
                  fontWeight: 'bold',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: 'var(--gray-12)'
                }}
              />
            </Box>
            <Flex gap="2" align="center">
              {state.hasUnsavedChanges && (
                <Badge color="orange" variant="soft">
                  Unsaved
                </Badge>
              )}
              {state.isSaving && (
                <Badge color="blue" variant="soft">
                  Saving...
                </Badge>
              )}
              {state.lastSaved && (
                <Flex gap="1" align="center">
                  <UpdateIcon width="14" height="14" />
                  <Text size="1" color="gray">
                    {state.lastSaved.toLocaleTimeString()}
                  </Text>
                </Flex>
              )}
            </Flex>
          </Flex>

          {/* Formatting Toolbar */}
          <Flex gap="1" wrap="wrap">
            <Tooltip content="Bold (Ctrl+B)">
              <IconButton size="1" variant="ghost" onClick={() => formatText('bold')}>
                <FontBoldIcon />
              </IconButton>
            </Tooltip>
            <Tooltip content="Italic (Ctrl+I)">
              <IconButton size="1" variant="ghost" onClick={() => formatText('italic')}>
                <FontItalicIcon />
              </IconButton>
            </Tooltip>
            <Tooltip content="Underline">
              <IconButton size="1" variant="ghost" onClick={() => formatText('underline')}>
                <UnderlineIcon />
              </IconButton>
            </Tooltip>
            
            <Separator orientation="vertical" />
            
            <Tooltip content="Heading 1">
              <IconButton size="1" variant="ghost" onClick={() => insertBlock('h1')}>
                <HeadingIcon />
              </IconButton>
            </Tooltip>
            <Tooltip content="Quote">
              <IconButton size="1" variant="ghost" onClick={() => formatText('quote')}>
                <QuoteIcon />
              </IconButton>
            </Tooltip>
            <Tooltip content="Code">
              <IconButton size="1" variant="ghost" onClick={() => formatText('code')}>
                <CodeIcon />
              </IconButton>
            </Tooltip>
            
            <Separator orientation="vertical" />
            
            <Tooltip content="Bullet List">
              <IconButton size="1" variant="ghost" onClick={() => insertBlock('ul')}>
                <ListBulletIcon />
              </IconButton>
            </Tooltip>
            <Tooltip content="Numbered List">
              <IconButton size="1" variant="ghost" onClick={() => insertBlock('ol')}>
                <ListBulletIcon />
              </IconButton>
            </Tooltip>
            
            <Separator orientation="vertical" />
            
            <Tooltip content="Link (Ctrl+K)">
              <IconButton size="1" variant="ghost" onClick={() => formatText('link')}>
                <Link1Icon />
              </IconButton>
            </Tooltip>
            <Tooltip content="Image">
              <IconButton size="1" variant="ghost" onClick={() => insertBlock('image')}>
                <ImageIcon />
              </IconButton>
            </Tooltip>
          </Flex>
        </Box>
      </Card>

      {/* Editor Content */}
      <Card>
        <Box p="4">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleContentChange}
            onKeyDown={handleKeyDown}
            style={{
              minHeight: '400px',
              outline: 'none',
              fontSize: 'var(--font-size-3)',
              lineHeight: '1.7',
              color: 'var(--gray-12)',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word'
            }}
            data-placeholder={placeholder}
          />
          
          {/* Editor Footer */}
          <Flex justify="between" align="center" mt="4" pt="4" style={{ borderTop: '1px solid var(--gray-6)' }}>
            <Flex gap="3" align="center">
              <Flex gap="1" align="center">
                <ClockIcon width="14" height="14" />
                <Text size="1" color="gray">{state.readingTime} min read</Text>
              </Flex>
              <Text size="1" color="gray">{state.wordCount} words</Text>
            </Flex>
            
            <Flex gap="2">
              <Button 
                variant="ghost" 
                size="2"
                onClick={() => setState(prev => ({ ...prev, showPreview: !prev.showPreview }))}
              >
                {state.showPreview ? <EyeNoneIcon /> : <EyeOpenIcon />}
                {state.showPreview ? 'Hide Preview' : 'Preview'}
              </Button>
              <Button 
                variant="outline" 
                size="2"
                onClick={handleSave}
                disabled={state.isSaving}
              >
                <UpdateIcon />
                Save Draft
              </Button>
              <Button 
                size="2"
                onClick={handlePublish}
                disabled={state.isSaving}
              >
                <CheckIcon />
                Publish
              </Button>
            </Flex>
          </Flex>
        </Box>
      </Card>

      {/* Preview */}
      {renderPreview()}
    </Box>
  )
}

export default MediumEditor
