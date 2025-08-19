import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { marked } from 'marked'

interface Post {
  id: string
  title: string
  content: string
  slug: string
  published: boolean
  created_at: string
  updated_at: string
  user_id: string
  author?: string
}

interface PostViewerProps {
  postId?: string
  postSlug?: string
  apiUrl?: string
  showLoginPrompt?: boolean
  maxContentLength?: number
  isAuthenticated?: boolean
  onLoginRequested?: () => void
  onPostLoaded?: (post: Post) => void
  onError?: (error: string) => void
}

const PostViewer: React.FC<PostViewerProps> = ({
  postId,
  postSlug,
  apiUrl = 'http://localhost:8080/api',
  showLoginPrompt = true,
  maxContentLength = 800,
  isAuthenticated = false,
  onLoginRequested,
  onPostLoaded,
  onError
}) => {
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getRenderedContent = () => {
    if (!post) return ''
    
    let content = post.content
    
    // Truncate content for non-authenticated users
    if (!isAuthenticated && content.length > maxContentLength) {
      content = content.substring(0, maxContentLength) + '...'
    }
    
    // Convert markdown to HTML
    return marked.parse(content) as string
  }

  const shouldShowLoginPrompt = () => {
    return showLoginPrompt && 
           !isAuthenticated && 
           post && 
           post.content.length > maxContentLength
  }

  const fetchPost = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      let url = `${apiUrl}/posts`
      
      if (postId) {
        url += `/${postId}`
      } else if (postSlug) {
        url += `/slug/${postSlug}`
      } else {
        throw new Error('Either postId or postSlug must be provided')
      }
      
      const response = await axios.get(url)
      
      if (response.data && response.data.data) {
        const postData = response.data.data
        setPost(postData)
        
        // Clean copy for emission
        const cleanPost: Post = {
          id: postData.id,
          title: postData.title,
          content: postData.content,
          slug: postData.slug,
          published: postData.published,
          created_at: postData.created_at,
          updated_at: postData.updated_at,
          user_id: postData.user_id || '',
          author: postData.author
        }
        
        onPostLoaded?.(cleanPost)
      } else {
        throw new Error('Post not found')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load post'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [postId, postSlug, apiUrl, onPostLoaded, onError])

  useEffect(() => {
    if (postId || postSlug) {
      fetchPost()
    }
  }, [fetchPost])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading post...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Post not found</p>
      </div>
    )
  }

  return (
    <div className="viewer-container">
      <article 
        className="prose prose-sm sm:prose-base lg:prose-lg max-w-none"
        itemScope
        itemType="https://schema.org/BlogPosting"
      >
        <header className="mb-6 sm:mb-8">
          <h1 
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight"
            itemProp="headline"
          >
            {post.title}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0 sm:space-x-4">
            <span itemProp="author">By {post.author || 'Admin'}</span>
            <span className="hidden sm:inline">•</span>
            <time dateTime={post.created_at} itemProp="datePublished">{formatDate(post.created_at)}</time>
            {post.updated_at && post.updated_at !== post.created_at && (
              <time dateTime={post.updated_at} itemProp="dateModified" className="hidden sm:inline">
                • Updated {formatDate(post.updated_at)}
              </time>
            )}
          </div>
        </header>
        
        <div 
          className="prose prose-lg max-w-none"
          itemProp="articleBody"
          dangerouslySetInnerHTML={{ __html: getRenderedContent() }}
        />
        
        {/* Login prompt for non-authenticated users */}
        {shouldShowLoginPrompt() && (
          <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gray-50 rounded-lg border">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Want to read more?</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">Sign in to access the full article and discover more great content.</p>
            <button
              onClick={onLoginRequested}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
            >
              Sign In
            </button>
          </div>
        )}
      </article>
    </div>
  )
}

export default PostViewer

