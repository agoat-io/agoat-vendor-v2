import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { buildApiUrl, API_CONFIG } from '../src/config/api'
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
  Container
} from '@radix-ui/themes'
import { 
  InfoCircledIcon, 
  ArrowLeftIcon, 
  CheckIcon,
  Cross2Icon,
  PlusIcon
} from '@radix-ui/react-icons'

const NewPostPage: React.FC = () => {
  const router = useRouter()
  
  // State
  const [title, setTitle] = useState('')
  const [content, setContent] = useState(`# Welcome to Your New Article

Start writing your content here. You can use Markdown syntax for formatting.

## Some Examples

- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- [Links](https://example.com) to reference sources
- \`inline code\` for technical terms

> Blockquotes for important notes

\`\`\`javascript
// Code blocks for examples
console.log('Hello, World!');
\`\`\`

Happy writing! 🚀`)
  const [published, setPublished] = useState(false)
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
      const response = await axios.post(buildApiUrl(API_CONFIG.ENDPOINTS.POSTS), {
        title: title.trim(),
        content: content.trim(),
        published
      }, {
        withCredentials: true
      })

      if (response.data?.success) {
        setSuccess('Post created successfully!')
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create post')
      console.error('Error creating post:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard')
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
            <Heading size="6">Create New Article</Heading>
          </Flex>
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
                <PlusIcon />
                {saving ? 'Creating...' : 'Create Article'}
              </Button>
            </Flex>
          </Flex>
        </Card>

        {/* Help Card */}
        <Card mt="4" variant="surface">
          <Box p="4">
            <Heading size="3" mb="3">Markdown Quick Reference</Heading>
            <Flex direction="column" gap="2">
              <Text size="2" color="gray">
                <strong>Headers:</strong> # H1, ## H2, ### H3
              </Text>
              <Text size="2" color="gray">
                <strong>Emphasis:</strong> **bold**, *italic*
              </Text>
              <Text size="2" color="gray">
                <strong>Links:</strong> [text](url)
              </Text>
              <Text size="2" color="gray">
                <strong>Lists:</strong> - item or 1. item
              </Text>
              <Text size="2" color="gray">
                <strong>Code:</strong> `inline` or ```block```
              </Text>
              <Text size="2" color="gray">
                <strong>Quotes:</strong> > blockquote
              </Text>
            </Flex>
          </Box>
        </Card>
      </Box>
    </Container>
  )
}

export default NewPostPage
