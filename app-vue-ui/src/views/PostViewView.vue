<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="postsStore.loading" class="text-center py-12">
      <div class="inline-flex items-center">
        <svg class="animate-spin h-8 w-8 mr-3 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading post...
      </div>
    </div>

    <div v-else-if="postsStore.error" class="text-center py-12">
      <div class="text-red-600">
        <svg class="h-16 w-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 class="text-2xl font-bold mb-2">Post Not Found</h2>
        <p class="text-gray-600 mb-6">{{ postsStore.error }}</p>
        <router-link to="/">
          <Button>
            Back to Blog
          </Button>
        </router-link>
      </div>
    </div>

    <div v-else-if="post" class="bg-white shadow-lg rounded-lg overflow-hidden">
      <!-- Post Header -->
      <div class="px-6 py-8 border-b border-gray-200">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">{{ post.title }}</h1>
            <div class="flex items-center text-sm text-gray-500 space-x-4">
              <span>By {{ post.author }}</span>
              <span>•</span>
              <span>{{ formatDate(post.created_at) }}</span>
              <span v-if="isAuthenticated && post.updated_at !== post.created_at">
                <span>•</span>
                <span>Updated {{ formatDate(post.updated_at) }}</span>
              </span>
            </div>
          </div>
          <div v-if="isAuthenticated" class="ml-6">
            <span
              :class="[
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                post.published
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              ]"
            >
              {{ post.published ? 'Published' : 'Draft' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Post Content -->
      <div class="px-6 py-8">
        <div class="prose prose-lg max-w-none">
          <div class="text-gray-700 leading-relaxed" v-html="displayContent"></div>
        </div>
        
        <!-- Login Prompt for Non-Authenticated Users -->
        <div v-if="!isAuthenticated && isContentTruncated" class="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div class="text-center">
            <div class="mb-4">
              <svg class="h-12 w-12 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Continue Reading</h3>
            <p class="text-gray-600 mb-4">
              This is a preview of the full article. Sign in or register to read the complete content.
            </p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <router-link to="/login">
                <Button class="w-full sm:w-auto">
                  Sign In to Continue Reading
                </Button>
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Post Footer -->
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-500">
            <span>Slug: {{ post.slug }}</span>
          </div>
          <div class="flex space-x-2">
            <!-- Only show edit button if user came from dashboard and is the author -->
            <router-link v-if="isAuthenticated && isAuthor && fromAuthorDashboard" :to="`/post/${post.id}/edit`">
              <Button variant="outline" size="sm">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Button>
            </router-link>
            <!-- Back button - returns to dashboard if came from there, otherwise to blog -->
            <router-link :to="fromAuthorDashboard ? '/dashboard' : '/'">
              <Button variant="secondary" size="sm">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {{ fromAuthorDashboard ? 'Back to Your Articles' : 'Back to All Articles' }}
              </Button>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeMount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostsStore } from '../stores/posts'
import { useAuthStore } from '../stores/auth'
import { Button } from '../components/ui/button'
import { extractPostIdFromUrl, createPostUrl, generateSlug } from '../utils/seo'
import { marked } from 'marked'
import type { Post } from '../types'

// Configure marked for markdown rendering
marked.use({
  breaks: true,
  gfm: true
})

const route = useRoute()
const router = useRouter()
const postsStore = usePostsStore()
const authStore = useAuthStore()

const postId = computed(() => {
  // Extract ID from SEO-friendly URL format: /post/:id/:slug
  const id = route.params.id as string
  return id
})

// Get the current slug from the URL
const currentSlug = computed(() => route.params.slug as string)

const post = computed(() => postsStore.currentPost)
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Check if current user is the author of the post
const isAuthor = computed(() => {
  if (!isAuthenticated.value || !post.value || !authStore.user) return false
  return post.value.user_id === authStore.user.id
})

// Check if user came from the author dashboard
const fromAuthorDashboard = computed(() => {
  // Check if the referrer path was the dashboard
  return route.query.from === 'dashboard'
})

// Validate slug and redirect if necessary
const validateAndRedirect = computed(() => {
  if (!post.value || !currentSlug.value) return false
  
  // Generate the correct slug from the post title
  const correctSlug = post.value.slug || generateSlug(post.value.title)
  
  // If the current slug doesn't match the correct slug, redirect
  if (currentSlug.value !== correctSlug) {
    const correctUrl = createPostUrl(post.value)
    router.replace(correctUrl)
    return true
  }
  
  return false
})

// Content display logic
const displayContent = computed(() => {
  if (!post.value) return ''
  
  let content = post.value.content
  
  // If user is not authenticated, show truncated content
  if (!isAuthenticated.value) {
    const maxLength = 800 // Good for SEO while requiring login for full content
    
    if (content.length <= maxLength) {
      // Convert markdown to HTML
      return marked.parse(content)
    }
    
    // Find a good breaking point (end of sentence or paragraph)
    const truncated = content.substring(0, maxLength)
    const lastPeriod = truncated.lastIndexOf('.')
    const lastNewline = truncated.lastIndexOf('\n')
    const breakPoint = Math.max(lastPeriod, lastNewline)
    
    if (breakPoint > maxLength * 0.7) { // If we found a good break point
      content = content.substring(0, breakPoint + 1)
    } else {
      content = truncated + '...'
    }
  }
  
  // Convert markdown to HTML
  return marked.parse(content) as string
})

// Check if content was truncated
const isContentTruncated = computed(() => {
  if (!post.value || isAuthenticated.value) return false
  return post.value.content.length > 800
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadPost = async () => {
  if (postId.value) {
    const response = await postsStore.fetchPost(postId.value, currentSlug.value)
    
    // Check if server sent a redirect
    if (response?.redirected && response?.redirectUrl) {
      console.log('Redirecting to:', response.redirectUrl)
      // Convert API URL to frontend URL
      const frontendUrl = response.redirectUrl.replace('/api/posts/', '/post/')
      router.replace(frontendUrl)
      return
    }
    
    // After loading the post, validate the slug and redirect if necessary
    if (post.value && currentSlug.value) {
      const correctSlug = post.value.slug || generateSlug(post.value.title)
      
      // If the current slug doesn't match the correct slug, redirect
      if (currentSlug.value !== correctSlug) {
        const correctUrl = createPostUrl(post.value)
        router.replace(correctUrl)
        return
      }
    }
  }
}

// Watch for route changes to load post data
watch(() => route.params.id, () => {
  loadPost()
})

// Watch for slug changes in the route
watch(() => route.params.slug, () => {
  if (post.value && currentSlug.value) {
    const correctSlug = post.value.slug || generateSlug(post.value.title)
    
    // If the current slug doesn't match the correct slug, redirect
    if (currentSlug.value !== correctSlug) {
      const correctUrl = createPostUrl(post.value)
      router.replace(correctUrl)
    }
  }
})

// Watch for post changes to update SEO meta tags
watch(() => post.value, (newPost) => {
  if (newPost) {
    // Update page title
    document.title = `${newPost.title} - AGoat Blog`
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    const description = newPost.content.substring(0, 160) + '...'
    if (metaDescription) {
      metaDescription.setAttribute('content', description)
    }
    
    // Update canonical URL
    const canonicalUrl = `${window.location.origin}${createPostUrl(newPost)}`
    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (canonical) {
      canonical.href = canonicalUrl
    }
    
    // Update Open Graph URL
    const ogUrl = document.querySelector('meta[property="og:url"]')
    if (ogUrl) {
      ogUrl.setAttribute('content', canonicalUrl)
    }
  }
}, { immediate: true })

onMounted(() => {
  // Set up initial SEO meta tags
  const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
  if (!canonical) {
    const link = document.createElement('link') as HTMLLinkElement
    link.rel = 'canonical'
    link.href = window.location.href
    document.head.appendChild(link)
  }
  
  // Set up Open Graph meta tags if they don't exist
  const ogTitle = document.querySelector('meta[property="og:title"]')
  if (!ogTitle) {
    const meta = document.createElement('meta')
    meta.setAttribute('property', 'og:title')
    meta.content = 'AGoat Blog'
    document.head.appendChild(meta)
  }
  
  const ogDescription = document.querySelector('meta[property="og:description"]')
  if (!ogDescription) {
    const meta = document.createElement('meta')
    meta.setAttribute('property', 'og:description')
    meta.content = 'Latest articles and insights from AGoat'
    document.head.appendChild(meta)
  }
  
  const ogUrl = document.querySelector('meta[property="og:url"]')
  if (!ogUrl) {
    const meta = document.createElement('meta')
    meta.setAttribute('property', 'og:url')
    meta.content = window.location.href
    document.head.appendChild(meta)
  }
  
  const ogType = document.querySelector('meta[property="og:type"]')
  if (!ogType) {
    const meta = document.createElement('meta')
    meta.setAttribute('property', 'og:type')
    meta.content = 'article'
    document.head.appendChild(meta)
  }
  
  loadPost()
})
</script>
