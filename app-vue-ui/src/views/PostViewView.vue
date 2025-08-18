<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">AGoat Blog</h1>
            <p class="text-sm text-gray-600">Article</p>
          </div>
          <div class="flex space-x-4">
            <router-link 
              :to="fromAuthorDashboard ? '/dashboard' : '/'"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {{ fromAuthorDashboard ? 'Back to Dashboard' : 'Back to Articles' }}
            </router-link>
            <router-link 
              v-if="!isAuthenticated" 
              to="/login" 
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Admin Login
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content with viewer microfrontend -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Viewer Microfrontend -->
      <ViewerMicrofrontend
        mode="single"
        :post-id="postId"
        :post-slug="postSlug"
        :height="800"
        @post-clicked="handlePostClick"
        @login-requested="handleLoginRequested"
        @error="handleViewerError"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import ViewerMicrofrontend from '../components/ViewerMicrofrontend.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Computed
const postId = computed(() => route.params.id as string)
const postSlug = computed(() => route.params.slug as string)
const isAuthenticated = computed(() => authStore.isAuthenticated)
const fromAuthorDashboard = computed(() => route.query.from === 'dashboard')

// Methods
const handlePostClick = (post: any) => {
  // Navigate to the post view
  router.push(`/post/${post.slug}`)
}

const handleLoginRequested = () => {
  // Navigate to login page
  router.push('/login')
}

const handleViewerError = (error: string) => {
  console.error('Viewer error:', error)
  // You could show a toast notification here
}

// Lifecycle
onMounted(() => {
  // Set page title for SEO
  document.title = 'AGoat Blog - Article'
  
  // Add meta description
  const metaDescription = document.querySelector('meta[name="description"]')
  if (metaDescription) {
    metaDescription.setAttribute('content', 'Read this article on AGoat Blog.')
  } else {
    const meta = document.createElement('meta')
    meta.name = 'description'
    meta.content = 'Read this article on AGoat Blog.'
    document.head.appendChild(meta)
  }
})
</script>

<style scoped>
/* Additional styles can be added here if needed */
</style>
