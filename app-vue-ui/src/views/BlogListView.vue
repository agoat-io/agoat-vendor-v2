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
            to="/login" 
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Admin Login
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main content with filters, loading, error, and posts list -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Filters Section -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-gray-700">Date Range:</label>
              <DateRangePicker v-model="selectedDateRange" @update:modelValue="onDateRangeChange" />
            </div>
            <div v-if="showPublishedFilter" class="flex items-center gap-2">
              <label class="text-sm font-medium text-gray-700">Show:</label>
              <select 
                v-model="showPublishedOnly" 
                @change="loadPosts(1)"
                class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option :value="false">All Posts</option>
                <option :value="true">Published Only</option>
              </select>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button 
              @click="clearFilters"
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-400 transition ease-in-out duration-150 cursor-not-allowed">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading posts...
        </div>
      </div>
      
      <div v-else-if="error" class="text-center py-12">
        <div class="max-w-md mx-auto">
          <div class="text-red-600 text-lg font-medium mb-2">Error loading posts</div>
          <div class="text-gray-600 mb-4">{{ error }}</div>
          <button 
            @click="loadPosts(currentPage)"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try Again
          </button>
        </div>
      </div>
      
      <div v-else-if="posts.length > 0" class="space-y-8">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Latest Posts</h2>
          <p class="text-lg text-gray-600">
            {{ effectiveShowPublishedOnly ? 'Published articles and insights' : 'All articles and insights' }}
            <span v-if="selectedDateRange" class="block text-sm text-gray-500 mt-1">
              Filtered by date range: {{ formatDate(selectedDateRange.from) }} - {{ formatDate(selectedDateRange.to) }}
            </span>
          </p>
        </div>
        
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <article v-for="post in posts" :key="post.id" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div class="p-6">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-xl font-semibold text-gray-900 line-clamp-2 flex-1">
                  <router-link :to="createPostUrl(post)" class="hover:text-indigo-600 transition-colors duration-200">{{ post.title }}</router-link>
                </h3>
                <span v-if="isAuthenticated && !post.published" class="ml-2 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  Draft
                </span>
              </div>
              <div class="text-sm text-gray-500 mb-4">
                <time :datetime="post.created_at">{{ formatDate(post.created_at) }}</time>
                <span v-if="isAuthenticated && post.updated_at && post.updated_at !== post.created_at" class="ml-2">(updated {{ formatDate(post.updated_at) }})</span>
              </div>
              <div class="text-gray-700 mb-4 line-clamp-4">{{ getPreviewText(post.content) }}</div>
              <router-link :to="createPostUrl(post)" class="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Read more 
                <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </router-link>
            </div>
          </article>
        </div>
        
        <!-- Pagination -->
        <div v-if="meta && meta.total_pages > 1" class="flex justify-center mt-8">
          <nav class="flex items-center space-x-2">
            <button
              @click="changePage(currentPage - 1)"
              :disabled="currentPage <= 1"
              class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <template v-for="page in visiblePages" :key="page">
              <button
                v-if="page !== '...'"
                @click="changePage(page)"
                :class="[
                  'px-3 py-2 text-sm font-medium rounded-md',
                  page === currentPage
                    ? 'text-white bg-indigo-600 border border-indigo-600'
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
              <span v-else class="px-3 py-2 text-sm text-gray-500">...</span>
            </template>
            
            <button
              @click="changePage(currentPage + 1)"
              :disabled="currentPage >= meta.total_pages"
              class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      </div>
      
      <div v-else class="text-center py-12">
        <div class="max-w-md mx-auto">
          <div class="text-gray-500 text-lg font-medium mb-2">No posts found</div>
          <div class="text-gray-400">
            {{ effectiveShowPublishedOnly ? 'No published posts match your criteria.' : 'No posts match your criteria.' }}
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeMount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../utils/api'
import { DateRangePicker } from '../components/ui/date-range-picker'
import { useAuthStore } from '../stores/auth'
import { createPostUrl } from '../utils/seo'
import type { Post, PostsResponse } from '../types'

// SEO meta tags
onBeforeMount(() => {
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
  
  // Add Open Graph tags
  const ogTitle = document.querySelector('meta[property="og:title"]')
  if (ogTitle) {
    ogTitle.setAttribute('content', 'AGoat Blog - Latest Posts and Insights')
  } else {
    const meta = document.createElement('meta')
    meta.setAttribute('property', 'og:title')
    meta.content = 'AGoat Blog - Latest Posts and Insights'
    document.head.appendChild(meta)
  }
  
  const ogDescription = document.querySelector('meta[property="og:description"]')
  if (ogDescription) {
    ogDescription.setAttribute('content', 'Discover the latest articles, insights, and stories from AGoat.')
  } else {
    const meta = document.createElement('meta')
    meta.setAttribute('property', 'og:description')
    meta.content = 'Discover the latest articles, insights, and stories from AGoat.'
    document.head.appendChild(meta)
  }
  
  const ogType = document.querySelector('meta[property="og:type"]')
  if (!ogType) {
    const meta = document.createElement('meta')
    meta.setAttribute('property', 'og:type')
    meta.content = 'website'
    document.head.appendChild(meta)
  }
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const posts = ref<Post[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const meta = ref<any>(null)
const currentPage = ref(1)
const showPublishedOnly = ref(false)
const selectedDateRange = ref<{ from: Date; to: Date } | null>(null)

// Check if user is authenticated
const isAuthenticated = computed(() => authStore.isAuthenticated)

// For non-authenticated users, always show only published posts
const effectiveShowPublishedOnly = computed(() => {
  return !isAuthenticated.value || showPublishedOnly.value
})

// Show the published filter only for authenticated users
const showPublishedFilter = computed(() => isAuthenticated.value)

// Get preview text (300 chars for non-auth, 500 for auth users)
const getPreviewText = (content: string): string => {
  const maxLength = isAuthenticated.value ? 500 : 300
  const lines = content.split('\n').filter(line => line.trim())
  const firstLines = lines.slice(0, 10).join('\n')
  
  if (firstLines.length <= maxLength) {
    return firstLines
  }
  
  // Truncate to maxLength characters at word boundary
  const truncated = firstLines.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
}

// Format date
const formatDate = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Load posts
const loadPosts = async (page: number = 1) => {
  loading.value = true
  error.value = null
  
  try {
    const response: PostsResponse = await api.getPosts(
      page, 
      5, // 5 posts per page
      effectiveShowPublishedOnly.value,
      selectedDateRange.value || undefined
    )
    
    if (response.success) {
      posts.value = response.data || []
      meta.value = response.meta
      currentPage.value = page
      
      // Add structured data for SEO after posts are loaded
      if (posts.value.length > 0) {
        addStructuredData(posts.value)
      }
    } else {
      error.value = response.error || 'Failed to load posts'
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to load posts'
  } finally {
    loading.value = false
  }
}

// Change page
const changePage = (page: number | string) => {
  const pageNum = typeof page === 'string' ? parseInt(page) : page
  router.push({ query: { page: pageNum.toString() } })
}

// Handle date range change
const onDateRangeChange = (dateRange: { from: Date; to: Date } | null) => {
  selectedDateRange.value = dateRange
  loadPosts(1) // Reset to first page when filter changes
}

// Clear all filters
const clearFilters = () => {
  selectedDateRange.value = null
  // Only reset published filter if user is authenticated
  if (isAuthenticated.value) {
    showPublishedOnly.value = false
  }
  loadPosts(1)
}

// Watch for route changes
const watchRoute = () => {
  const page = parseInt(route.query.page as string) || 1
  if (page !== currentPage.value) {
    loadPosts(page)
  }
}

// Add structured data for SEO
const addStructuredData = (posts: Post[]) => {
  // Remove existing structured data
  const existingScript = document.querySelector('script[type="application/ld+json"]')
  if (existingScript) {
    existingScript.remove()
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "AGoat Blog",
    "description": "Latest articles, insights, and stories from AGoat",
    "url": window.location.origin,
    "blogPost": posts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": getPreviewText(post.content),
      "datePublished": post.created_at,
      "dateModified": post.updated_at,
      "author": {
        "@type": "Person",
        "name": post.author || "Anonymous"
      },
      "url": `${window.location.origin}${createPostUrl(post)}`
    }))
  }

  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(structuredData)
  document.head.appendChild(script)
}

// Computed property for pagination
const visiblePages = computed(() => {
  if (!meta.value) return []
  
  const totalPages = meta.value.total_pages
  const current = currentPage.value
  const pages: (number | string)[] = []
  
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(totalPages)
    } else if (current >= totalPages - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(totalPages)
    }
  }
  
  return pages
})

onMounted(() => {
  const page = parseInt(route.query.page as string) || 1
  loadPosts(page)
})

// Watch for route changes
watch(() => route.query.page, () => {
  const page = parseInt(route.query.page as string) || 1
  if (page !== currentPage.value) {
    loadPosts(page)
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
