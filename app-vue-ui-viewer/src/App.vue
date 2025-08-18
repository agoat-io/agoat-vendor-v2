<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PostViewer from './components/PostViewer.vue'
import PostsList from './components/PostsList.vue'

// Configuration from URL parameters or props
const viewMode = ref<'single' | 'list' | null>(null)
const postId = ref<string | undefined>()
const postSlug = ref<string | undefined>()
const apiUrl = ref('http://localhost:8080/api')
const showLoginPrompt = ref(true)
const maxContentLength = ref(800)
const isAuthenticated = ref(false)
const showPublishedOnly = ref(true)
const page = ref(1)
const limit = ref(10)

// Safe serialization function
const safeSerialize = (data: any) => {
  try {
    return JSON.parse(JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to serialize data:', error)
    return null
  }
}

// Event handlers
const handleLoginRequested = () => {
  // Emit event to parent or redirect to login
  console.log('Login requested')
  window.parent?.postMessage({ type: 'login-requested' }, '*')
}

const handlePostLoaded = (post: any) => {
  console.log('Post loaded:', post)
  const safePost = safeSerialize(post)
  if (safePost) {
    window.parent?.postMessage({ type: 'post-loaded', post: safePost }, '*')
  }
}

const handlePostsLoaded = (posts: any[]) => {
  console.log('Posts loaded:', posts)
  const safePosts = safeSerialize(posts)
  if (safePosts) {
    window.parent?.postMessage({ type: 'posts-loaded', posts: safePosts }, '*')
  }
}

const handlePostClicked = (post: any) => {
  console.log('Post clicked:', post)
  const safePost = safeSerialize(post)
  if (safePost) {
    window.parent?.postMessage({ type: 'post-clicked', post: safePost }, '*')
  }
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
  
  viewMode.value = (urlParams.get('mode') as 'single' | 'list') || null
  postId.value = urlParams.get('postId') || undefined
  postSlug.value = urlParams.get('postSlug') || undefined
  apiUrl.value = urlParams.get('apiUrl') || 'http://localhost:8080/api'
  showLoginPrompt.value = urlParams.get('showLoginPrompt') !== 'false'
  maxContentLength.value = parseInt(urlParams.get('maxContentLength') || '800')
  isAuthenticated.value = urlParams.get('isAuthenticated') === 'true'
  showPublishedOnly.value = urlParams.get('showPublishedOnly') !== 'false'
  page.value = parseInt(urlParams.get('page') || '1')
  limit.value = parseInt(urlParams.get('limit') || '10')
  
  console.log('Viewer URL params parsed:', {
    viewMode: viewMode.value,
    apiUrl: apiUrl.value,
    isAuthenticated: isAuthenticated.value,
    showPublishedOnly: showPublishedOnly.value,
    page: page.value,
    limit: limit.value
  })
}

// Listen for messages from parent
const handleMessage = (event: MessageEvent) => {
  if (event.data && typeof event.data === 'object') {
    const { type, ...data } = event.data
    
    switch (type) {
      case 'set-config':
        Object.assign({
          apiUrl,
          showLoginPrompt,
          maxContentLength,
          isAuthenticated,
          showPublishedOnly,
          page,
          limit
        }, data)
        break
      case 'set-post-id':
        postId.value = data.postId
        viewMode.value = 'single'
        break
      case 'set-post-slug':
        postSlug.value = data.postSlug
        viewMode.value = 'single'
        break
      case 'set-view-mode':
        viewMode.value = data.mode
        break
    }
  }
}

onMounted(() => {
  console.log('Viewer App: Mounted, parsing URL params...')
  parseUrlParams()
  window.addEventListener('message', handleMessage)
  
  // Debug: Check if we're in an iframe
  console.log('Viewer App: In iframe?', window !== window.parent)
  console.log('Viewer App: Current URL:', window.location.href)
})
</script>

<template>
  <div id="app">
    <!-- Single post viewer -->
    <PostViewer
      v-if="viewMode === 'single'"
      :post-id="postId"
      :post-slug="postSlug"
      :api-url="apiUrl"
      :show-login-prompt="showLoginPrompt"
      :max-content-length="maxContentLength"
      :is-authenticated="isAuthenticated"
      @login-requested="handleLoginRequested"
      @post-loaded="handlePostLoaded"
      @error="handleError"
    />

    <!-- Posts list viewer -->
    <PostsList
      v-else-if="viewMode === 'list'"
      :api-url="apiUrl"
      :show-published-only="showPublishedOnly"
      :page="page"
      :limit="limit"
      :is-authenticated="isAuthenticated"
      :max-content-length="maxContentLength"
      @post-clicked="handlePostClicked"
      @posts-loaded="handlePostsLoaded"
      @error="handleError"
    />

    <!-- Default view -->
    <div v-else class="viewer-container">
      <div class="text-center py-12">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">AGoat Publisher Viewer</h1>
        <p class="text-gray-600 mb-6">
          This is a microfrontend component for displaying blog posts.
        </p>
        <div class="bg-gray-50 p-6 rounded-lg">
          <h2 class="text-lg font-semibold text-gray-800 mb-3">Usage Examples:</h2>
          <div class="text-left space-y-2 text-sm text-gray-700">
            <p><strong>Single Post:</strong> ?mode=single&postId=123</p>
            <p><strong>Single Post by Slug:</strong> ?mode=single&postSlug=my-post-title</p>
            <p><strong>Posts List:</strong> ?mode=list&page=1&limit=10</p>
            <p><strong>Custom API:</strong> &apiUrl=https://api.example.com</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
