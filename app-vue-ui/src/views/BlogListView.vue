<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header with AGoat Blog title and Admin Login link -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-gray-900">AGoat Blog</h1>
            <p class="text-xs sm:text-sm text-gray-600">All articles and insights</p>
          </div>
          <router-link 
            v-if="!isAuthenticated" 
            to="/login" 
            class="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Admin Login
          </router-link>
          <router-link 
            v-else 
            to="/dashboard" 
            class="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Dashboard
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <!-- Back to list button when viewing single post -->
      <div v-if="showingPost" class="mb-6">
        <button
          @click="backToList"
          class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to All Articles
        </button>
      </div>

      <!-- Single Post View -->
      <div v-if="showingPost && currentPost" class="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
        <article class="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
          <header class="mb-6 sm:mb-8">
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">{{ currentPost.title }}</h1>
            <div class="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0 sm:space-x-4">
              <span>By {{ currentPost.author || 'Admin' }}</span>
              <span class="hidden sm:inline">•</span>
              <span>{{ formatDate(currentPost.created_at) }}</span>
              <span v-if="currentPost.updated_at && currentPost.updated_at !== currentPost.created_at" class="hidden sm:inline">
                • Updated {{ formatDate(currentPost.updated_at) }}
              </span>
            </div>
          </header>
          
          <div class="prose prose-lg max-w-none" v-html="getRenderedContent()"></div>
          
          <!-- Edit button for authenticated users -->
          <div v-if="isAuthenticated" class="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
              <div class="text-sm text-gray-500">
                <span v-if="currentPost.published" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Published
                </span>
                <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Draft
                </span>
              </div>
              <button
                @click="editPost"
                class="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Article
              </button>
            </div>
          </div>
          
          <!-- Login prompt for non-authenticated users -->
          <div v-if="!isAuthenticated && shouldShowLoginPrompt" class="mt-6 sm:mt-8 p-4 sm:p-6 bg-gray-50 rounded-lg border">
            <h3 class="text-base sm:text-lg font-medium text-gray-900 mb-2">Want to read more?</h3>
            <p class="text-sm sm:text-base text-gray-600 mb-4">Sign in to access the full article and discover more great content.</p>
            <button
              @click="handleLoginRequested"
              class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
            >
              Sign In
            </button>
          </div>
        </article>
      </div>

      <!-- Posts List View -->
      <div v-else>
        <!-- Loading state -->
        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-3 text-gray-600">Loading posts...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-800">{{ error }}</p>
            </div>
          </div>
        </div>

        <!-- Posts list -->
        <div v-else-if="posts.length > 0" class="posts-list">
          <div class="mb-6 sm:mb-8">
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Latest Posts</h1>
            <p class="text-sm sm:text-base text-gray-600">Discover our latest articles and insights</p>
          </div>

          <div class="grid gap-4 sm:gap-6 lg:gap-8">
            <article 
              v-for="post in posts" 
              :key="post.id" 
              class="post-card bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div class="mb-3 sm:mb-4">
                <h2 class="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 leading-tight">
                  <button 
                    @click="handlePostClick(post)"
                    class="hover:text-blue-600 transition-colors text-left w-full"
                  >
                    {{ post.title }}
                  </button>
                </h2>
                <div class="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0 sm:space-x-4">
                  <span>Published {{ formatDate(post.created_at) }}</span>
                  <span v-if="post.updated_at && post.updated_at !== post.created_at" class="hidden sm:inline">
                    • Updated {{ formatDate(post.updated_at) }}
                  </span>
                </div>
              </div>

              <div class="post-preview mb-3 sm:mb-4">
                <div class="text-sm sm:text-base text-gray-700 leading-relaxed" v-html="getPreviewText(post.content)"></div>
              </div>

              <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                <button 
                  @click="handlePostClick(post)"
                  class="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base text-left"
                >
                  {{ isAuthenticated ? 'Read full article' : 'Read more' }}
                </button>
                
                <div v-if="!isAuthenticated && post.content.length > 800" class="text-xs sm:text-sm text-gray-500">
                  {{ Math.ceil(post.content.length / 100) }} min read
                </div>
              </div>
            </article>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="mt-6 sm:mt-8 flex justify-center">
            <nav class="flex items-center space-x-1 sm:space-x-2">
              <button 
                @click="changePage(currentPage - 1)"
                :disabled="currentPage <= 1"
                class="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span class="px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
              
              <button 
                @click="changePage(currentPage + 1)"
                :disabled="currentPage >= totalPages"
                class="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="text-center py-8 sm:py-12">
          <svg class="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No posts found</h3>
          <p class="mt-1 text-xs sm:text-sm text-gray-500">There are no posts available at the moment.</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { marked } from 'marked'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// State
const currentPage = ref(1)
const postsPerPage = ref(10)
const showingPost = ref(false)
const currentPost = ref<any>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const posts = ref<any[]>([])
const totalPages = ref(1)
const totalPosts = ref(0)

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated)

const shouldShowLoginPrompt = computed(() => {
  if (!currentPost.value || isAuthenticated.value) return false
  return currentPost.value.content.length > 800
})

// Methods
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getRenderedContent = () => {
  if (!currentPost.value) return ''
  
  let content = currentPost.value.content
  
  // Truncate content for non-authenticated users
  if (!isAuthenticated.value && content.length > 800) {
    content = content.substring(0, 800) + '...'
  }
  
  // Convert markdown to HTML
  return marked.parse(content) as string
}

const getPreviewText = (content: string) => {
  let text = content
  
  // For non-authenticated users, truncate content
  if (!isAuthenticated.value && text.length > 300) {
    text = text.substring(0, 300) + '...'
  }
  
  // Convert markdown to HTML for preview
  return marked.parse(text) as string
}

const fetchPosts = async () => {
  loading.value = true
  error.value = null
  
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      per_page: postsPerPage.value.toString(),
      published: 'true' // Only show published posts on public page
    })
    
    const response = await axios.get(`http://localhost:8080/api/posts?${params}`, {
      withCredentials: true
    })
    
    if (response.data && response.data.data) {
      posts.value = response.data.data
      totalPosts.value = response.data.meta?.total || posts.value.length
      totalPages.value = response.data.meta?.total_pages || Math.ceil(totalPosts.value / postsPerPage.value)
      
      console.log('BlogListView: Loaded posts:', posts.value.length)
    } else {
      posts.value = []
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to load posts'
    console.error('Error fetching posts:', err)
  } finally {
    loading.value = false
  }
}

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchPosts()
    
    // Update URL with page parameter
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('page', page.toString())
    window.history.pushState({}, '', currentUrl.toString())
  }
}

const fetchPost = async (postId: string) => {
  loading.value = true
  error.value = null
  
  try {
    const response = await axios.get(`http://localhost:8080/api/posts/${postId}`, {
      withCredentials: true
    })
    
    if (response.data && response.data.data) {
      currentPost.value = response.data.data
      showingPost.value = true
      
      // Update page title
      document.title = `${currentPost.value.title} - AGoat Blog`
    } else {
      error.value = 'Post not found'
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load post'
    console.error('Error fetching post:', err)
  } finally {
    loading.value = false
  }
}

const handlePostClick = (post: any) => {
  console.log('BlogListView: Post clicked:', post)
  
  // Set the current post and show single post view
  currentPost.value = post
  showingPost.value = true
  
  // Update URL with post-path parameter
  const postPath = `${post.slug}/${post.id}`
  const currentUrl = new URL(window.location.href)
  currentUrl.searchParams.set('post-path', postPath)
  window.history.pushState({}, '', currentUrl.toString())
  
  // Update page title
  document.title = `${post.title} - AGoat Blog`
}

const backToList = () => {
  showingPost.value = false
  currentPost.value = null
  
  // Remove post-path from URL
  const currentUrl = new URL(window.location.href)
  currentUrl.searchParams.delete('post-path')
  window.history.pushState({}, '', currentUrl.toString())
  
  // Reset page title
  document.title = 'AGoat Blog - Latest Posts and Insights'
}

const editPost = () => {
  if (currentPost.value) {
    // Navigate to edit page
    router.push(`/post/${currentPost.value.id}/edit`)
  }
}

const handleLoginRequested = () => {
  // Navigate to login page
  router.push('/login')
}

const handleViewerError = (error: string) => {
  console.error('Viewer error:', error)
}

const checkForPostPath = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const postPath = urlParams.get('post-path')
  
  if (postPath) {
    // Extract post ID from the path (format: slug/id)
    const parts = postPath.split('/')
    const postId = parts[parts.length - 1]
    
    if (postId) {
      fetchPost(postId)
    }
  } else {
    showingPost.value = false
    currentPost.value = null
  }
}

// SSR data fetching
const ssrFetchPosts = async (page: number = 1) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: postsPerPage.value.toString(),
      published: 'true'
    })
    
    // Use direct fetch for SSR (no axios interceptors)
    const response = await fetch(`http://localhost:8080/api/posts?${params}`)
    const data = await response.json()
    
    if (data.success && data.data) {
      posts.value = data.data
      totalPosts.value = data.meta?.total || data.data.length
      totalPages.value = data.meta?.total_pages || Math.ceil(totalPosts.value / postsPerPage.value)
      currentPage.value = page
    }
  } catch (err) {
    console.error('SSR fetch error:', err)
    // Fallback to client-side fetch
    await fetchPosts()
  }
}

// Lifecycle
onMounted(() => {
  // Check for post-path in URL on initial load
  checkForPostPath()
  
  // If not showing a specific post and no posts loaded (SSR didn't run), fetch the posts list
  if (!showingPost.value && posts.value.length === 0) {
    // Check for page parameter in URL
    const urlParams = new URLSearchParams(window.location.search)
    const pageParam = urlParams.get('page')
    if (pageParam) {
      currentPage.value = parseInt(pageParam) || 1
    }
    
    fetchPosts()
  }
  
  // Set default page title and meta description
  if (!showingPost.value) {
    document.title = 'AGoat Blog - Latest Posts and Insights'
    
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Discover the latest articles, insights, and stories from AGoat. Read our blog for valuable content and updates.')
    } else {
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = 'Discover the latest articles, insights, and stories from AGoat. Read our blog for valuable content and updates.'
      document.head.appendChild(meta)
    }
  }
  
  // Listen for browser back/forward navigation
  window.addEventListener('popstate', checkForPostPath)
})

// Server-side data fetching hook
if (typeof window === 'undefined') {
  // This runs only on the server
  ssrFetchPosts()
}

// Watch for URL changes (though we're handling this manually now)
watch(() => route.query, () => {
  checkForPostPath()
}, { deep: true })
</script>

<style scoped>
/* Additional styles can be added here if needed */
</style>
