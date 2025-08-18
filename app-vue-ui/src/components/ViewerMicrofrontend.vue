<template>
  <div class="viewer-microfrontend">
    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col justify-center items-center py-12">
      <div class="flex items-center mb-4">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">Loading viewer...</span>
      </div>
      <div class="text-xs text-gray-500 bg-gray-100 p-2 rounded">
        <p>URL: {{ viewerUrl }}</p>
        <p>Mode: {{ mode }}</p>
        <p>Authenticated: {{ authStore.isAuthenticated }}</p>
      </div>
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
          <p class="text-xs text-red-600 mt-1">URL: {{ viewerUrl }}</p>
        </div>
      </div>
    </div>

    <!-- Direct component approach instead of iframe -->
    <div v-else class="viewer-content">
      <PostsList
        :api-url="'http://localhost:8080/api'"
        :show-published-only="true"
        :page="page"
        :limit="limit"
        :is-authenticated="false"
        :max-content-length="300"
        @post-clicked="handlePostClick"
        @posts-loaded="handlePostsLoaded"
        @error="handleError"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import PostsList from './PostsList.vue'

interface Props {
  mode: 'single' | 'list'
  postId?: string
  postSlug?: string
  page?: number
  limit?: number
  height?: number
  viewerUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  page: 1,
  limit: 10,
  height: 600,
  viewerUrl: 'http://localhost:5175'
})

const emit = defineEmits<{
  'post-clicked': [post: any]
  'login-requested': []
  'error': [error: string]
}>()

const authStore = useAuthStore()
const loading = ref(false)
const error = ref<string | null>(null)

// Computed
const viewerUrl = computed(() => {
  // Use the viewer URL directly since it's already a full URL
  const url = new URL(props.viewerUrl)
  
  // Add mode
  url.searchParams.set('mode', props.mode)
  
  // Add authentication status - force to false for testing
  url.searchParams.set('isAuthenticated', 'false')
  
  // Add API URL
  url.searchParams.set('apiUrl', 'http://localhost:8080/api')
  
  // Add mode-specific parameters
  if (props.mode === 'single') {
    if (props.postId) {
      url.searchParams.set('postId', props.postId)
    } else if (props.postSlug) {
      url.searchParams.set('postSlug', props.postSlug)
    }
  } else if (props.mode === 'list') {
    url.searchParams.set('page', props.page.toString())
    url.searchParams.set('limit', props.limit.toString())
    url.searchParams.set('showPublishedOnly', 'true')
  }
  
  const finalUrl = url.toString()
  console.log('ViewerMicrofrontend: Constructed URL:', finalUrl)
  console.log('ViewerMicrofrontend: Auth state:', {
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user
  })
  return finalUrl
})

// Methods (iframe-related methods removed since we're using direct components)

// Direct component event handlers
const handlePostClick = (post: any) => {
  emit('post-clicked', post)
}

const handlePostsLoaded = (posts: any[]) => {
  console.log('Posts loaded:', posts.length)
  loading.value = false
}

const handleError = (error: string) => {
  console.error('PostsList error:', error)
  emit('error', error)
  loading.value = false
}

// Lifecycle
onMounted(() => {
  // Debug: Check auth state
  console.log('ViewerMicrofrontend: Auth state on mount:', {
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user
  })
})

// Watch for prop changes
watch(() => [props.mode, props.postId, props.postSlug, props.page], () => {
  error.value = null
})
</script>

<style scoped>
.viewer-microfrontend {
  @apply w-full;
}
</style>
