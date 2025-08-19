<template>
  <div class="viewer-container">
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

    <!-- Posts list -->
    <div v-else-if="posts.length > 0" class="posts-list">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Latest Posts</h1>
        <p class="text-gray-600">Discover our latest articles and insights</p>
      </div>

      <div class="grid gap-8">
        <article 
          v-for="post in posts" 
          :key="post.id" 
          class="post-card border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div class="mb-4">
            <h2 class="text-2xl font-bold text-gray-900 mb-2">
              <a 
                :href="`/post/${post.slug}`" 
                class="hover:text-blue-600 transition-colors"
                @click.prevent="handlePostClick(post)"
              >
                {{ post.title }}
              </a>
            </h2>
            <div class="flex items-center text-sm text-gray-500 space-x-4">
              <span>Published {{ formatDate(post.created_at) }}</span>
              <span v-if="post.updated_at && post.updated_at !== post.created_at">
                • Updated {{ formatDate(post.updated_at) }}
              </span>
            </div>
          </div>

          <div class="post-preview mb-4">
            <div class="text-gray-700 leading-relaxed" v-html="getPreviewText(post.content)"></div>
          </div>

          <div class="flex justify-between items-center">
            <a 
              :href="`/post/${post.slug}`" 
              class="text-blue-600 hover:text-blue-800 font-medium"
              @click.prevent="handlePostClick(post)"
            >
              {{ isAuthenticated ? 'Read full article' : 'Read more' }}
            </a>
            
            <div v-if="!isAuthenticated && post.content.length > maxContentLength" class="text-sm text-gray-500">
              {{ Math.ceil(post.content.length / 100) }} min read
            </div>
          </div>
        </article>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-8 flex justify-center">
        <nav class="flex items-center space-x-2">
          <button 
            @click="changePage(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span class="px-3 py-2 text-sm text-gray-700">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          
          <button 
            @click="changePage(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </nav>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No posts found</h3>
      <p class="mt-1 text-sm text-gray-500">There are no posts available at the moment.</p>
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
  apiUrl?: string
  showPublishedOnly?: boolean
  page?: number
  limit?: number
  isAuthenticated?: boolean
  maxContentLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  apiUrl: 'http://localhost:8080/api',
  showPublishedOnly: true,
  page: 1,
  limit: 10,
  isAuthenticated: false,
  maxContentLength: 300
})

const emit = defineEmits<{
  'post-clicked': [post: Post]
  'posts-loaded': [posts: Post[]]
  'error': [error: string]
}>()

// State
const posts = ref<Post[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(props.page)
const totalPages = ref(1)
const totalPosts = ref(0)

// Computed
const effectiveShowPublishedOnly = computed(() => {
  return props.showPublishedOnly || !props.isAuthenticated
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

const getPreviewText = (content: string) => {
  let text = content
  
  // For non-authenticated users, truncate content
  if (!props.isAuthenticated && text.length > props.maxContentLength) {
    text = text.substring(0, props.maxContentLength) + '...'
  }
  
  // Convert markdown to HTML for preview
  return marked.parse(text) as string
}

const fetchPosts = async () => {
  console.log('PostsList: Fetching posts with params:', {
    apiUrl: props.apiUrl,
    page: currentPage.value,
    limit: props.limit,
    showPublishedOnly: effectiveShowPublishedOnly.value
  })
  
  loading.value = true
  error.value = null
  
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: props.limit.toString()
    })
    
    if (effectiveShowPublishedOnly.value) {
      params.append('published', 'true')
    }
    
    const url = `${props.apiUrl}/posts?${params}`
    console.log('PostsList: Making request to:', url)
    const response = await axios.get(url)
    
    if (response.data && response.data.data) {
      posts.value = response.data.data
      totalPosts.value = response.data.total || posts.value.length
      totalPages.value = Math.ceil(totalPosts.value / props.limit)
      
      // Create a clean copy of posts for emission (remove any reactive properties)
      const cleanPosts = posts.value.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        slug: post.slug,
        published: post.published,
        created_at: post.created_at,
        updated_at: post.updated_at,
        author: post.author
      }))
      
      console.log('PostsList: Emitting clean posts:', cleanPosts.length)
      emit('posts-loaded', cleanPosts)
    } else {
      posts.value = []
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to load posts'
    emit('error', error.value)
  } finally {
    loading.value = false
  }
}

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchPosts()
  }
}

const handlePostClick = (post: Post) => {
  // Create a clean copy of the post for emission
  const cleanPost = {
    id: post.id,
    title: post.title,
    content: post.content,
    slug: post.slug,
    published: post.published,
    created_at: post.created_at,
    updated_at: post.updated_at,
    author: post.author
  }
  emit('post-clicked', cleanPost)
}

// Lifecycle
onMounted(() => {
  fetchPosts()
})

// Watch for prop changes
watch(() => [props.showPublishedOnly, props.page], () => {
  currentPage.value = props.page
  fetchPosts()
})
</script>

<style scoped>
.post-card {
  @apply transition-all duration-200;
}

.post-card:hover {
  @apply transform translate-y-[-2px];
}

.post-preview :deep(p) {
  @apply mb-2;
}

.post-preview :deep(p:last-child) {
  @apply mb-0;
}
</style>

