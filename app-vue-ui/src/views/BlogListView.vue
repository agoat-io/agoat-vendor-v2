<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header with AGoat Blog title and Admin Login link -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">AGoat Blog</h1>
            <p class="text-sm text-gray-600">All articles and insights</p>
          </div>
          <router-link 
            v-if="!isAuthenticated" 
            to="/login" 
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Admin Login
          </router-link>
          <router-link 
            v-else 
            to="/dashboard" 
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Dashboard
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <div v-if="showingPost && currentPost" class="bg-white rounded-lg shadow-sm p-8">
        <article class="prose prose-lg max-w-none">
          <header class="mb-8">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">{{ currentPost.title }}</h1>
            <div class="flex items-center text-sm text-gray-500 space-x-4">
              <span>By {{ currentPost.author || 'Admin' }}</span>
              <span>•</span>
              <span>{{ formatDate(currentPost.created_at) }}</span>
              <span v-if="currentPost.updated_at && currentPost.updated_at !== currentPost.created_at">
                • Updated {{ formatDate(currentPost.updated_at) }}
              </span>
            </div>
          </header>
          
          <div class="prose prose-lg max-w-none" v-html="getRenderedContent()"></div>
          
          <!-- Login prompt for non-authenticated users -->
          <div v-if="!isAuthenticated && shouldShowLoginPrompt" class="mt-8 p-6 bg-gray-50 rounded-lg border">
            <h3 class="text-lg font-medium text-gray-900 mb-2">Want to read more?</h3>
            <p class="text-gray-600 mb-4">Sign in to access the full article and discover more great content.</p>
            <button
              @click="handleLoginRequested"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign In
            </button>
          </div>
        </article>
      </div>

      <!-- Posts List View -->
      <ViewerMicrofrontend
        v-else
        mode="list"
        :page="currentPage"
        :limit="postsPerPage"
        :height="800"
        @post-clicked="handlePostClick"
        @login-requested="handleLoginRequested"
        @error="handleViewerError"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { marked } from 'marked'
import axios from 'axios'
import ViewerMicrofrontend from '../components/ViewerMicrofrontend.vue'

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
  // The PostsList component now handles URL updates
  currentPost.value = post
  showingPost.value = true
  
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

// Lifecycle
onMounted(() => {
  // Check for post-path in URL on initial load
  checkForPostPath()
  
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

// Watch for URL changes (though we're handling this manually now)
watch(() => route.query, () => {
  checkForPostPath()
}, { deep: true })
</script>

<style scoped>
/* Additional styles can be added here if needed */
</style>
