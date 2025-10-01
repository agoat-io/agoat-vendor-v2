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
  Switch
} from './ui'
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
  EyeNoneIcon,
  CodeIcon as CodeViewIcon,
  EyeOpenIcon as PreviewIcon
} from '@radix-ui/react-icons'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSanitize from 'rehype-sanitize'
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
  showCodeView: boolean
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
    showCodeView: false,
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
      
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      
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

  const handleAutoSave = async () => {
    if (!onSave || state.isSaving) return
    
    try {
      setState(prev => ({ ...prev, isSaving: true }))
      await onSave(state.content, state.title, true)
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        lastSaved: new Date(),
        hasUnsavedChanges: false 
      }))
    } catch (error) {
      console.error('Auto-save failed:', error)
      setState(prev => ({ ...prev, isSaving: false }))
    }
  }

  const handleSave = async () => {
    if (!onSave || state.isSaving) return
    
    try {
      setState(prev => ({ ...prev, isSaving: true }))
      await onSave(state.content, state.title, true)
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        lastSaved: new Date(),
        hasUnsavedChanges: false 
      }))
    } catch (error) {
      console.error('Save failed:', error)
      setState(prev => ({ ...prev, isSaving: false }))
    }
  }

  const handlePublish = async () => {
    if (!onPublish || state.isSaving) return
    
    try {
      setState(prev => ({ ...prev, isSaving: true }))
      await onPublish(state.content, state.title)
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        lastSaved: new Date(),
        hasUnsavedChanges: false 
      }))
    } catch (error) {
      console.error('Publish failed:', error)
      setState(prev => ({ ...prev, isSaving: false }))
    }
  }

  // Format text using markdown syntax
  const formatText = (format: string) => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const selectedText = range.toString()
    
    let replacement = ''
    switch (format) {
      case 'bold':
        replacement = `**${selectedText}**`
        break
      case 'italic':
        replacement = `*${selectedText}*`
        break
      case 'underline':
        replacement = `<u>${selectedText}</u>`
        break
      case 'quote':
        replacement = `> ${selectedText}`
        break
      case 'code':
        replacement = `\`${selectedText}\``
        break
      case 'link':
        const url = prompt('Enter URL:')
        if (url) {
          replacement = `[${selectedText}](${url})`
        } else {
          return
        }
        break
      default:
        return
    }

    // Replace selected text with markdown
    range.deleteContents()
    range.insertNode(document.createTextNode(replacement))
    
    // Update content state
    const newContent = editorRef.current.innerText
    setState(prev => ({ ...prev, content: newContent }))
    
    // Restore focus
    editorRef.current.focus()
  }

  // Insert markdown blocks
  const insertBlock = (blockType: string) => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    let replacement = ''
    
    switch (blockType) {
      case 'h1':
        replacement = '# '
        break
      case 'h2':
        replacement = '## '
        break
      case 'h3':
        replacement = '### '
        break
      case 'ul':
        replacement = '- '
        break
      case 'ol':
        replacement = '1. '
        break
      case 'image':
        const url = prompt('Enter image URL:')
        const alt = prompt('Enter alt text:')
        if (url) {
          replacement = `![${alt || ''}](${url})`
        } else {
          return
        }
        break
      default:
        return
    }

    // Insert at cursor position
    range.insertNode(document.createTextNode(replacement))
    
    // Update content state
    const newContent = editorRef.current.innerText
    setState(prev => ({ ...prev, content: newContent }))
    
    // Restore focus
    editorRef.current.focus()
  }

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerText
    setState(prev => ({ ...prev, content: newContent }))
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, title: e.target.value }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Enter key for new lines
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      document.execCommand('insertLineBreak', false)
    }
  }

  // Toggle between rendered view and code view
  const toggleViewMode = () => {
    setState(prev => ({ 
      ...prev, 
      showCodeView: !prev.showCodeView,
      showPreview: false 
    }))
  }

  // Toggle preview
  const togglePreview = () => {
    setState(prev => ({ 
      ...prev, 
      showPreview: !prev.showPreview,
      showCodeView: false 
    }))
  }

  // Render the editor content based on current mode
  const renderEditorContent = () => {
    if (state.showCodeView) {
      return (
        <textarea
          value={state.content}
          onChange={(e) => setState(prev => ({ ...prev, content: e.target.value }))}
          style={{
            width: '100%',
            minHeight: '400px',
            border: 'none',
            outline: 'none',
            fontSize: 'var(--font-size-3)',
            lineHeight: '1.7',
            color: 'var(--gray-12)',
            fontFamily: 'monospace',
            background: 'transparent',
            resize: 'vertical'
          }}
          placeholder={placeholder}
        />
      )
    }

    return (
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
    )
  }

  // Render markdown preview
  const renderPreview = () => {
    if (!state.showPreview) return null

    return (
      <Card style={{ marginTop: 'var(--space-4)' }}>
        <Box p="4">
          <Text size="2" weight="medium" mb="3" color="gray">Preview</Text>
          <Box className="markdown-preview">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeSanitize]}
                             components={{
                 h1: ({ children }) => <h1 style={{ fontSize: 'var(--font-size-6)', fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>{children}</h1>,
                 h2: ({ children }) => <h2 style={{ fontSize: 'var(--font-size-5)', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>{children}</h2>,
                 h3: ({ children }) => <h3 style={{ fontSize: 'var(--font-size-4)', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>{children}</h3>,
                 p: ({ children }) => <p style={{ fontSize: 'var(--font-size-3)', marginBottom: 'var(--space-3)', lineHeight: '1.7' }}>{children}</p>,
                 strong: ({ children }) => <strong style={{ fontWeight: 'bold' }}>{children}</strong>,
                 em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
                 code: ({ children, className }) => (
                   <code 
                     style={{ 
                       backgroundColor: 'var(--gray-3)', 
                       padding: '2px 4px', 
                       borderRadius: '3px',
                       fontFamily: 'monospace',
                       fontSize: 'var(--font-size-2)'
                     }}
                   >
                     {children}
                   </code>
                 ),
                 pre: ({ children }) => (
                   <pre 
                     style={{ 
                       backgroundColor: 'var(--gray-2)', 
                       padding: 'var(--space-3)', 
                       borderRadius: 'var(--radius-3)',
                       marginBottom: 'var(--space-3)',
                       overflow: 'auto',
                       fontFamily: 'monospace'
                     }}
                   >
                     {children}
                   </pre>
                 ),
                 blockquote: ({ children }) => (
                   <blockquote 
                     style={{ 
                       borderLeft: '4px solid var(--gray-6)', 
                       paddingLeft: 'var(--space-3)', 
                       marginBottom: 'var(--space-3)',
                       fontStyle: 'italic',
                       color: 'var(--gray-11)'
                     }}
                   >
                     {children}
                   </blockquote>
                 ),
                 ul: ({ children }) => (
                   <ul style={{ paddingLeft: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                     {children}
                   </ul>
                 ),
                 ol: ({ children }) => (
                   <ol style={{ paddingLeft: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                     {children}
                   </ol>
                 ),
                 li: ({ children }) => (
                   <li style={{ fontSize: 'var(--font-size-3)', marginBottom: 'var(--space-1)' }}>{children}</li>
                 ),
                 a: ({ children, href }) => (
                   <a href={href} style={{ color: 'var(--blue-9)', textDecoration: 'underline' }}>
                     {children}
                   </a>
                 ),
                 img: ({ src, alt }) => (
                   <img src={src} alt={alt} style={{ maxWidth: '100%', height: 'auto', marginBottom: 'var(--space-3)' }} />
                 )
               }}
            >
              {state.content}
            </ReactMarkdown>
          </Box>
        </Box>
      </Card>
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

          {/* View Mode Toggle */}
          <Flex gap="2" align="center" mb="3">
            <Text size="2" color="gray">View Mode:</Text>
            <Button 
              variant={state.showCodeView ? "solid" : "ghost"} 
              size="1"
              onClick={toggleViewMode}
            >
              <CodeViewIcon />
              Code
            </Button>
            <Button 
              variant={!state.showCodeView ? "solid" : "ghost"} 
              size="1"
              onClick={() => setState(prev => ({ ...prev, showCodeView: false }))}
            >
              <PreviewIcon />
              WYSIWYG
            </Button>
          </Flex>

          {/* Formatting Toolbar */}
          {!state.showCodeView && (
            <Flex gap="1" wrap="wrap">
              <IconButton size="1" variant="ghost" onClick={() => formatText('bold')}>
                <FontBoldIcon />
              </IconButton>
              <IconButton size="1" variant="ghost" onClick={() => formatText('italic')}>
                <FontItalicIcon />
              </IconButton>
              <IconButton size="1" variant="ghost" onClick={() => formatText('underline')}>
                <UnderlineIcon />
              </IconButton>
              
              <Separator orientation="vertical" />
              
              <IconButton size="1" variant="ghost" onClick={() => insertBlock('h1')}>
                <HeadingIcon />
              </IconButton>
              <IconButton size="1" variant="ghost" onClick={() => formatText('quote')}>
                <QuoteIcon />
              </IconButton>
              <IconButton size="1" variant="ghost" onClick={() => formatText('code')}>
                <CodeIcon />
              </IconButton>
              
              <Separator orientation="vertical" />
              
              <IconButton size="1" variant="ghost" onClick={() => insertBlock('ul')}>
                <ListBulletIcon />
              </IconButton>
              <IconButton size="1" variant="ghost" onClick={() => insertBlock('ol')}>
                <ListBulletIcon />
              </IconButton>
              
              <Separator orientation="vertical" />
              
              <IconButton size="1" variant="ghost" onClick={() => formatText('link')}>
                <Link1Icon />
              </IconButton>
              <IconButton size="1" variant="ghost" onClick={() => insertBlock('image')}>
                <ImageIcon />
              </IconButton>
            </Flex>
          )}
        </Box>
      </Card>

      {/* Editor Content */}
      <Card>
        <Box p="4">
          {renderEditorContent()}
          
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
                onClick={togglePreview}
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
