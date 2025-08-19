import React, { useState, useEffect } from 'react'
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
  author?: string
}

interface FallbackPostsListProps {
  apiUrl?: string
  showPublishedOnly?: boolean
  page?: number
  limit?: number
  isAuthenticated?: boolean
  maxContentLength?: number
  onPostClicked?: (post: Post) => void
  onPostsLoaded?: (posts: Post[]) => void
  onError?: (error: string) => void
}

const FallbackPostsList: React.FC<FallbackPostsListProps> = ({
  apiUrl = 'http://localhost:8080/api',
  showPublishedOnly = true,
  page = 1,
  limit = 10,
  isAuthenticated = false,
  maxContentLength = 300,
  onPostClicked,
  onPostsLoaded,
  onError
}) => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getPreviewText = (content: string) => {
    let text = content
    
    if (!isAuthenticated && text.length > maxContentLength) {
      text = text.substring(0, maxContentLength) + '...'
    }
    
    return marked.parse(text) as string
  }

  const fetchPosts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: limit.toString(),
        published: 'true'
      })
      
      const response = await axios.get(`${apiUrl}/posts?${params}`, {
        withCredentials: true
      })
      
      if (response.data && response.data.data) {
        setPosts(response.data.data)
        onPostsLoaded?.(response.data.data)
      } else {
        setPosts([])
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load posts'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [page, limit])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading posts...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-sm text-red-800">{error}</p>
        <p className="text-xs text-red-600 mt-1">Using fallback component</p>
      </div>
    )
  }

  return (
    <div className="posts-list">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Latest Posts</h1>
        <p className="text-sm sm:text-base text-gray-600">Discover our latest articles and insights</p>
        <p className="text-xs text-orange-600 mt-1">⚠️ Using fallback component (federated module not available)</p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:gap-8">
        {posts.map(post => (
          <article 
            key={post.id}
            className="post-card bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 leading-tight">
                <button 
                  onClick={() => onPostClicked?.(post)}
                  className="hover:text-blue-600 transition-colors text-left w-full"
                >
                  {post.title}
                </button>
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0 sm:space-x-4">
                <span>By {post.author || 'Admin'}</span>
                <span>Published {formatDate(post.created_at)}</span>
              </div>
            </div>

            <div className="post-preview mb-3 sm:mb-4">
              <div 
                className="text-sm sm:text-base text-gray-700 leading-relaxed" 
                dangerouslySetInnerHTML={{ __html: getPreviewText(post.content) }}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
              <button 
                onClick={() => onPostClicked?.(post)}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base text-left"
              >
                {isAuthenticated ? 'Read full article' : 'Read more'}
              </button>
              
              {!isAuthenticated && post.content.length > maxContentLength && (
                <div className="text-xs sm:text-sm text-gray-500">
                  {Math.ceil(post.content.length / 100)} min read
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default FallbackPostsList

