<template>
  <div class="viewer-container">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Loading post...</span>
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

    <!-- Post content -->
    <div v-else-if="post" class="post-viewer">
      <!-- Post header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">{{ post.title }}</h1>
        <div class="flex items-center text-sm text-gray-500 space-x-4">
          <span>Published {{ formatDate(post.created_at) }}</span>
          <span v-if="post.updated_at && post.updated_at !== post.created_at">
            • Updated {{ formatDate(post.updated_at) }}
          </span>
        </div>
      </div>

      <!-- Post content -->
      <div class="post-content" v-html="renderedContent"></div>

      <!-- Login prompt for non-authenticated users -->
      <div v-if="!isAuthenticated && shouldShowLoginPrompt" class="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-lg font-medium text-blue-800">Want to read more?</h3>
            <p class="mt-1 text-blue-700">
              Log in or register to view the full content of this post and access all our articles.
            </p>
            <div class="mt-4">
              <button 
                @click="handleLoginClick"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not found state -->
    <div v-else class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">Post not found</h3>
      <p class="mt-1 text-sm text-gray-500">The post you're looking for doesn't exist or has been removed.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { marked } from 'marked'
import axios from 'axios'

interface Post {
  id: string
  title: string
  content: string
  slug: string
  published: boolean
  created_at: string
  updated_at: string
  user_id: string
}

interface Props {
  postId?: string
  postSlug?: string
  apiUrl?: string
  showLoginPrompt?: boolean
  maxContentLength?: number
  isAuthenticated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  apiUrl: 'http://localhost:8080/api',
  showLoginPrompt: true,
  maxContentLength: 800,
  isAuthenticated: false
})

const emit = defineEmits<{
  'login-requested': []
  'post-loaded': [post: Post]
  'error': [error: string]
}>()

// State
const post = ref<Post | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Computed
const renderedContent = computed(() => {
  if (!post.value) return ''
  
  let content = post.value.content
  
  // Truncate content for non-authenticated users
  if (!props.isAuthenticated && content.length > props.maxContentLength) {
    content = content.substring(0, props.maxContentLength) + '...'
  }
  
  // Convert markdown to HTML
  return marked.parse(content) as string
})

const shouldShowLoginPrompt = computed(() => {
  return props.showLoginPrompt && 
         !props.isAuthenticated && 
         post.value && 
         post.value.content.length > props.maxContentLength
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

const fetchPost = async () => {
  loading.value = true
  error.value = null
  
  try {
    let url = `${props.apiUrl}/posts`
    
    if (props.postId) {
      url += `/${props.postId}`
    } else if (props.postSlug) {
      url += `/slug/${props.postSlug}`
    } else {
      throw new Error('Either postId or postSlug must be provided')
    }
    
    const response = await axios.get(url)
    
    if (response.data && response.data.data) {
      post.value = response.data.data
      
      // Create a clean copy of the post for emission
      const cleanPost = {
        id: post.value.id,
        title: post.value.title,
        content: post.value.content,
        slug: post.value.slug,
        published: post.value.published,
        created_at: post.value.created_at,
        updated_at: post.value.updated_at,
        author: post.value.author
      }
      
      emit('post-loaded', cleanPost)
    } else {
      throw new Error('Post not found')
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to load post'
    emit('error', error.value)
  } finally {
    loading.value = false
  }
}

const handleLoginClick = () => {
  emit('login-requested')
}

// Lifecycle
onMounted(() => {
  if (props.postId || props.postSlug) {
    fetchPost()
  }
})

// Watch for prop changes
watch(() => [props.postId, props.postSlug], () => {
  if (props.postId || props.postSlug) {
    fetchPost()
  }
})
</script>

<style scoped>
/* Additional styles can be added here if needed */
</style>
