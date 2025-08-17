<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gray-900">AGoat Blog</h1>
          </div>
          <div class="flex items-center space-x-4">
            <router-link
              to="/login"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Admin Login
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading state -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-400 transition ease-in-out duration-150 cursor-not-allowed">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading posts...
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center py-12">
        <div class="bg-red-50 border border-red-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-800">
                {{ error }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Posts list -->
      <div v-else-if="posts.length > 0" class="space-y-8">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Latest Posts</h2>
          <p class="text-lg text-gray-600">Discover our latest articles and insights</p>
        </div>

        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="post in posts"
            :key="post.id"
            class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            <div class="p-6">
              <h3 class="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                <router-link
                  :to="`/post/${post.id}`"
                  class="hover:text-indigo-600 transition-colors duration-200"
                >
                  {{ post.title }}
                </router-link>
              </h3>
              
              <div class="text-sm text-gray-500 mb-4">
                <time :datetime="post.created_at">
                  {{ formatDate(post.created_at) }}
                </time>
                <span v-if="post.updated_at && post.updated_at !== post.created_at" class="ml-2">
                  (updated {{ formatDate(post.updated_at) }})
                </span>
              </div>

              <div class="text-gray-700 mb-4 line-clamp-4">
                {{ getPreviewText(post.content) }}
              </div>

              <router-link
                :to="`/post/${post.id}`"
                class="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
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
              v-if="currentPage > 1"
              @click="changePage(currentPage - 1)"
              class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Previous
            </button>
            
            <span class="px-3 py-2 text-sm text-gray-700">
              Page {{ currentPage }} of {{ meta.total_pages }}
            </span>
            
            <button
              v-if="currentPage < meta.total_pages"
              @click="changePage(currentPage + 1)"
              class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Next
            </button>
          </nav>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No posts yet</h3>
        <p class="mt-1 text-sm text-gray-500">Check back later for new content.</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeMount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../utils/api'
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

const posts = ref<Post[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const meta = ref<any>(null)
const currentPage = ref(1)

// Get preview text (first 10 lines or ~500 characters)
const getPreviewText = (content: string): string => {
  const lines = content.split('\n').filter(line => line.trim())
  const firstLines = lines.slice(0, 10).join('\n')
  
  if (firstLines.length <= 500) {
    return firstLines
  }
  
  // Truncate to ~500 characters at word boundary
  const truncated = firstLines.substring(0, 500)
  const lastSpace = truncated.lastIndexOf(' ')
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
}

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
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
    const response: PostsResponse = await api.getPosts(page, 12, true) // 12 posts per page, published only
    
    if (response.success) {
      posts.value = response.data || []
      meta.value = response.meta
      currentPage.value = page
    } else {
      error.value = response.message || 'Failed to load posts'
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load posts'
  } finally {
    loading.value = false
  }
}

// Change page
const changePage = (page: number) => {
  router.push({ query: { page: page.toString() } })
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
        "url": `${window.location.origin}/post/${post.id}`
      }))
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(structuredData)
    document.head.appendChild(script)
  }

  onMounted(() => {
    const page = parseInt(route.query.page as string) || 1
    loadPosts(page)
  })

  // Watch for route changes
  watchRoute()

  // Add structured data when posts are loaded
  const originalLoadPosts = loadPosts
  loadPosts = async (page: number = 1) => {
    await originalLoadPosts(page)
    if (posts.value.length > 0) {
      addStructuredData(posts.value)
    }
  }
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
