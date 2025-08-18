<template>
  <div class="federated-posts-list">
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

    <!-- Dynamically loaded remote component -->
    <component
      v-else-if="RemotePostsList"
      :is="RemotePostsList"
      :api-url="apiUrl"
      :show-published-only="showPublishedOnly"
      :page="page"
      :limit="limit"
      :is-authenticated="isAuthenticated"
      :max-content-length="maxContentLength"
      @post-clicked="$emit('post-clicked', $event)"
      @posts-loaded="$emit('posts-loaded', $event)"
      @error="$emit('error', $event)"
    />

    <!-- Fallback content -->
    <div v-else class="text-center py-12">
      <p class="text-gray-500">Unable to load remote posts component</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { useAuthStore } from '../stores/auth'

interface Props {
  apiUrl?: string
  showPublishedOnly?: boolean
  page?: number
  limit?: number
  maxContentLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  apiUrl: 'http://localhost:8080/api',
  showPublishedOnly: true,
  page: 1,
  limit: 10,
  maxContentLength: 300
})

const emit = defineEmits<{
  'post-clicked': [post: any]
  'posts-loaded': [posts: any[]]
  'error': [error: string]
}>()

const authStore = useAuthStore()
const loading = ref(true)
const error = ref<string | null>(null)
const RemotePostsList = ref<any>(null)

// Computed
const isAuthenticated = ref(authStore.isAuthenticated)

// Runtime component resolution
const loadRemoteComponent = async () => {
  try {
    console.log('Loading federated PostsList component...')
    
    // Check if we have SSR data available
    const ssrData = (window as any).__SSR_DATA__
    if (ssrData && ssrData.prerenderedHTML) {
      console.log('Using SSR pre-rendered content')
      loading.value = false
      return
    }
    
    // Try to load the federated module at runtime
    try {
      // Attempt federation import
      const remoteModule = await import('viewer-remote/PostsList')
      RemotePostsList.value = remoteModule.default || remoteModule
      console.log('Federation component loaded successfully')
    } catch (federationErr) {
      console.log('Federation not available, using local component')
      
      // Fallback to local component
      const localModule = await import('./PostsList.vue')
      RemotePostsList.value = localModule.default
      console.log('Local component loaded as fallback')
    }
    
  } catch (err: any) {
    console.error('Failed to load any component:', err)
    error.value = 'Failed to load posts component'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRemoteComponent()
})
</script>

<style scoped>
.federated-posts-list {
  @apply w-full;
}
</style>
