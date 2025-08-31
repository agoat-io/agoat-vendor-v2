import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

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

interface PostsListProps {
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

const PostsList: React.FC<PostsListProps> = ({
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(page)
  const [totalPages, setTotalPages] = useState(1)
  const [, setTotalPosts] = useState(0)

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
    
    // For non-authenticated users, truncate content
    if (!isAuthenticated && text.length > maxContentLength) {
      text = text.substring(0, maxContentLength) + '...'
    }
    
    // Convert markdown to HTML for preview
    return DOMPurify.sanitize(marked.parse(text) as string)
  }

  const fetchPosts = useCallback(async () => {
    console.log('PostsList: Fetching posts with params:', {
      apiUrl,
      page: currentPage,
      limit,
      showPublishedOnly: showPublishedOnly || !isAuthenticated
    })
    
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString()
      })
      
      if (showPublishedOnly || !isAuthenticated) {
        params.append('published', 'true')
      }
      
      const url = `${apiUrl}/posts?${params}`
      console.log('PostsList: Making request to:', url)
      const response = await axios.get(url)
      
      if (response.data && response.data.data) {
        setPosts(response.data.data)
        setTotalPosts(response.data.meta?.total || response.data.data.length)
        setTotalPages(response.data.meta?.total_pages || Math.ceil(response.data.data.length / limit))
        
        console.log('PostsList: Loaded posts:', response.data.data.length)
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
  }, [apiUrl, currentPage, limit, showPublishedOnly, isAuthenticated, onPostsLoaded, onError])

  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const handlePostClick = (post: Post) => {
    // Create URL with query string parameter
    const postPath = `${post.slug}/${post.id}`
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('post-path', postPath)
    
    // Update URL without page reload
    window.history.pushState({}, '', currentUrl.toString())
    
    // Emit the post click event
    onPostClicked?.(post)
  }

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  useEffect(() => {
    setCurrentPage(page)
  }, [page])

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

  if (posts.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No posts found</h3>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">There are no posts available at the moment.</p>
      </div>
    )
  }

  return (
    <div className="viewer-container">
      {/* Posts list with SEO optimization */}
      <div className="posts-list">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Latest Posts</h1>
          <p className="text-sm sm:text-base text-gray-600">Discover our latest articles and insights</p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:gap-8">
          {posts.map(post => (
            <article 
              key={post.id}
              className="post-card bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
              itemScope
              itemType="https://schema.org/BlogPosting"
            >
              <div className="mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 leading-tight" itemProp="headline">
                  <button 
                    onClick={() => handlePostClick(post)}
                    className="hover:text-blue-600 transition-colors text-left w-full"
                  >
                    {post.title}
                  </button>
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0 sm:space-x-4">
                  <span itemProp="author">By {post.author || 'Admin'}</span>
                  <time dateTime={post.created_at} itemProp="datePublished">Published {formatDate(post.created_at)}</time>
                  {post.updated_at && post.updated_at !== post.created_at && (
                    <time dateTime={post.updated_at} itemProp="dateModified" className="hidden sm:inline">
                      • Updated {formatDate(post.updated_at)}
                    </time>
                  )}
                </div>
              </div>

              <div className="post-preview mb-3 sm:mb-4" itemProp="description">
                <div 
                  className="text-sm sm:text-base text-gray-700 leading-relaxed" 
                  dangerouslySetInnerHTML={{ __html: getPreviewText(post.content) }}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                <button 
                  onClick={() => handlePostClick(post)}
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

        {/* Pagination with SEO-friendly URLs */}
        {totalPages > 1 && (
          <div className="mt-6 sm:mt-8 flex justify-center">
            <nav className="flex items-center space-x-1 sm:space-x-2" role="navigation" aria-label="Pagination">
              {currentPage > 1 && (
                <a 
                  href={`?page=${currentPage - 1}`}
                  onClick={(e) => {
                    e.preventDefault()
                    changePage(currentPage - 1)
                  }}
                  className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  rel="prev"
                >
                  Previous
                </a>
              )}
              
              <span className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              
              {currentPage < totalPages && (
                <a 
                  href={`?page=${currentPage + 1}`}
                  onClick={(e) => {
                    e.preventDefault()
                    changePage(currentPage + 1)
                  }}
                  className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  rel="next"
                >
                  Next
                </a>
              )}
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}

export default PostsList

