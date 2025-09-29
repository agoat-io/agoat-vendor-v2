import React, { useState, useEffect } from 'react'
import PostViewer from './components/PostViewer'
import PostsList from './components/PostsList'

interface AppProps {
  mode?: 'single' | 'list'
  postId?: string
  postSlug?: string
  apiUrl?: string
  showLoginPrompt?: boolean
  maxContentLength?: number
  isAuthenticated?: boolean
  showPublishedOnly?: boolean
  page?: number
  limit?: number
}

const App: React.FC<AppProps> = (props) => {
  const [viewMode, setViewMode] = useState<'single' | 'list' | null>(null)
  const [postId, setPostId] = useState<string | undefined>()
  const [postSlug, setPostSlug] = useState<string | undefined>()
  const [apiUrl, setApiUrl] = useState('http://localhost:8080/api')
  const [showLoginPrompt, setShowLoginPrompt] = useState(true)
  const [maxContentLength, setMaxContentLength] = useState(800)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPublishedOnly, setShowPublishedOnly] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // Event handlers
  const handleLoginRequested = () => {
    console.log('Login requested')
    window.parent?.postMessage({ type: 'login-requested' }, '*')
  }

  const handlePostLoaded = (post: any) => {
    console.log('Post loaded:', post)
    window.parent?.postMessage({ type: 'post-loaded', post }, '*')
  }

  const handlePostsLoaded = (posts: any[]) => {
    console.log('Posts loaded:', posts)
    window.parent?.postMessage({ type: 'posts-loaded', posts }, '*')
  }

  const handlePostClicked = (post: any) => {
    console.log('Post clicked:', post)
    window.parent?.postMessage({ type: 'post-clicked', post }, '*')
  }

  const handleError = (error: string) => {
    console.error('Error:', error)
    window.parent?.postMessage({ type: 'error', error }, '*')
  }

  // Parse URL parameters
  const parseUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search)
    
    console.log('Viewer: Raw URL params:', window.location.search)
    console.log('Viewer: All URL params:', Object.fromEntries(urlParams.entries()))
    
    setViewMode((urlParams.get('mode') as 'single' | 'list') || null)
    setPostId(urlParams.get('postId') || undefined)
    setPostSlug(urlParams.get('postSlug') || undefined)
    setApiUrl(urlParams.get('apiUrl') || 'http://localhost:8080/api')
    setShowLoginPrompt(urlParams.get('showLoginPrompt') !== 'false')
    setMaxContentLength(parseInt(urlParams.get('maxContentLength') || '800'))
    setIsAuthenticated(urlParams.get('isAuthenticated') === 'true')
    setShowPublishedOnly(urlParams.get('showPublishedOnly') !== 'false')
    setPage(parseInt(urlParams.get('page') || '1'))
    setLimit(parseInt(urlParams.get('limit') || '10'))
  }

  // Listen for messages from parent
  const handleMessage = (event: MessageEvent) => {
    if (event.data && typeof event.data === 'object') {
      const { type, ...data } = event.data
      
      switch (type) {
        case 'set-config':
          Object.assign({
            setApiUrl,
            setShowLoginPrompt,
            setMaxContentLength,
            setIsAuthenticated,
            setShowPublishedOnly,
            setPage,
            setLimit
          }, data)
          break
        case 'set-post-id':
          setPostId(data.postId)
          setViewMode('single')
          break
        case 'set-post-slug':
          setPostSlug(data.postSlug)
          setViewMode('single')
          break
        case 'set-view-mode':
          setViewMode(data.mode)
          break
      }
    }
  }

  useEffect(() => {
    console.log('Viewer App: Mounted, parsing URL params...')
    parseUrlParams()
    window.addEventListener('message', handleMessage)
    
    // Debug: Check if we're in an iframe
    console.log('Viewer App: In iframe?', window !== window.parent)
    console.log('Viewer App: Current URL:', window.location.href)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  // Override with props if provided (for direct usage)
  const effectiveProps = {
    viewMode: props.mode || viewMode,
    postId: props.postId || postId,
    postSlug: props.postSlug || postSlug,
    apiUrl: props.apiUrl || apiUrl,
    showLoginPrompt: props.showLoginPrompt ?? showLoginPrompt,
    maxContentLength: props.maxContentLength || maxContentLength,
    isAuthenticated: props.isAuthenticated ?? isAuthenticated,
    showPublishedOnly: props.showPublishedOnly ?? showPublishedOnly,
    page: props.page || page,
    limit: props.limit || limit
  }

  return (
    <div id="app">
      {/* Single post viewer */}
      {effectiveProps.viewMode === 'single' && (
        <PostViewer
          postId={effectiveProps.postId}
          postSlug={effectiveProps.postSlug}
          apiUrl={effectiveProps.apiUrl}
          showLoginPrompt={effectiveProps.showLoginPrompt}
          maxContentLength={effectiveProps.maxContentLength}
          isAuthenticated={effectiveProps.isAuthenticated}
          onLoginRequested={handleLoginRequested}
          onPostLoaded={handlePostLoaded}
          onError={handleError}
        />
      )}

      {/* Posts list viewer */}
      {effectiveProps.viewMode === 'list' && (
        <PostsList
          apiUrl={effectiveProps.apiUrl}
          showPublishedOnly={effectiveProps.showPublishedOnly}
          page={effectiveProps.page}
          limit={effectiveProps.limit}
          isAuthenticated={effectiveProps.isAuthenticated}
          maxContentLength={effectiveProps.maxContentLength}
          onPostClicked={handlePostClicked}
          onPostsLoaded={handlePostsLoaded}
          onError={handleError}
        />
      )}

      {/* Default view */}
      {!effectiveProps.viewMode && (
        <div className="viewer-container">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">AGoat Publisher Viewer</h1>
            <p className="text-gray-600 mb-6">
              This is a React microfrontend component for displaying blog posts.
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Usage Examples:</h2>
              <div className="text-left space-y-2 text-sm text-gray-700">
                <p><strong>Single Post:</strong> ?mode=single&postId=123</p>
                <p><strong>Single Post by Slug:</strong> ?mode=single&postSlug=my-post-title</p>
                <p><strong>Posts List:</strong> ?mode=list&page=1&limit=10</p>
                <p><strong>Custom API:</strong> &apiUrl=https://api.example.com</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
