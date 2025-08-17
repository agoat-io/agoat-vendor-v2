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
              <span v-if="post.updated_at !== post.created_at">
                <span>•</span>
                <span>Updated {{ formatDate(post.updated_at) }}</span>
              </span>
            </div>
          </div>
          <div class="ml-6">
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
          <div class="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {{ displayContent }}
          </div>
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
            <!-- Only show edit button if user is authenticated and is the author -->
            <router-link v-if="isAuthenticated && isAuthor" :to="`/post/${post.id}/edit`">
              <Button variant="outline" size="sm">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Button>
            </router-link>
            <router-link to="/">
              <Button variant="secondary" size="sm">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Blog
              </Button>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePostsStore } from '../stores/posts'
import { useAuthStore } from '../stores/auth'
import { Button } from '../components/ui/button'

const route = useRoute()
const postsStore = usePostsStore()
const authStore = useAuthStore()

const postId = computed(() => route.params.id as string)
const post = computed(() => postsStore.currentPost)
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Check if current user is the author of the post
const isAuthor = computed(() => {
  if (!isAuthenticated.value || !post.value || !authStore.user) return false
  return post.value.user_id === authStore.user.id
})

// Content display logic
const displayContent = computed(() => {
  if (!post.value) return ''
  
  // If user is authenticated, show full content
  if (isAuthenticated.value) {
    return post.value.content
  }
  
  // For non-authenticated users, show truncated content
  const content = post.value.content
  const maxLength = 800 // Good for SEO while requiring login for full content
  
  if (content.length <= maxLength) {
    return content
  }
  
  // Find a good breaking point (end of sentence or paragraph)
  const truncated = content.substring(0, maxLength)
  const lastPeriod = truncated.lastIndexOf('.')
  const lastNewline = truncated.lastIndexOf('\n')
  const breakPoint = Math.max(lastPeriod, lastNewline)
  
  if (breakPoint > maxLength * 0.7) { // If we found a good break point
    return content.substring(0, breakPoint + 1)
  }
  
  return truncated + '...'
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
    await postsStore.fetchPost(postId.value)
  }
}

// Watch for route changes to load post data
watch(() => route.params.id, () => {
  loadPost()
})

onMounted(() => {
  loadPost()
})
</script>
