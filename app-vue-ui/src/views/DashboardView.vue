<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Back to dashboard button when viewing single post -->
    <div v-if="showingPost" class="mb-6">
      <button
        @click="backToList"
        class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Your Articles
      </button>
    </div>

    <!-- Single Post View -->
    <div v-if="showingPost && currentPost" class="bg-white rounded-lg shadow-sm p-8">
      <article class="prose prose-lg max-w-none">
        <header class="mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">{{ currentPost.title }}</h1>
          <div class="flex items-center text-sm text-gray-500 space-x-4">
            <span>By {{ currentPost.author || 'Admin' }}</span>
            <span>•</span>
            <span>{{ formatDate(currentPost.created_at) }}</span>
            <span v-if="currentPost.updated_at && currentPost.updated_at !== currentPost.created_at">
              • Updated {{ formatDate(currentPost.updated_at) }}
            </span>
          </div>
        </header>
        
        <div class="prose prose-lg max-w-none" v-html="getRenderedContent()"></div>
        
        <!-- Edit button and status for authenticated users -->
        <div class="mt-8 pt-6 border-t border-gray-200">
          <div class="flex justify-between items-center">
            <div class="text-sm text-gray-500">
              <span v-if="currentPost.published" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Published
              </span>
              <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Draft
              </span>
            </div>
            <button
              @click="editPost"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Article
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- Dashboard Header -->
    <div v-else class="mb-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Your Articles</h1>
          <p class="mt-2 text-gray-600">Manage and edit your blog posts</p>
        </div>
        <router-link to="/post/new">
          <Button>
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Post
          </Button>
        </router-link>
      </div>
    </div>

    <!-- Stats -->
    <div v-if="!showingPost" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Total Posts</dt>
                <dd class="text-lg font-medium text-gray-900">{{ postsStore.posts.length }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Published</dt>
                <dd class="text-lg font-medium text-gray-900">{{ postsStore.publishedPosts.length }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Drafts</dt>
                <dd class="text-lg font-medium text-gray-900">{{ postsStore.draftPosts.length }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Posts List -->
    <div v-if="!showingPost" class="bg-white shadow overflow-hidden sm:rounded-md">
      <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Posts</h3>
      </div>
      
      <div v-if="postsStore.loading" class="p-8 text-center">
        <div class="inline-flex items-center">
          <svg class="animate-spin h-5 w-5 mr-3 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading posts...
        </div>
      </div>

      <div v-else-if="postsStore.error" class="p-8 text-center">
        <div class="text-red-600">
          <svg class="h-12 w-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-lg font-medium">{{ postsStore.error }}</p>
          <Button @click="loadPosts" variant="outline" class="mt-4">
            Try Again
          </Button>
        </div>
      </div>

      <div v-else-if="postsStore.posts.length === 0" class="p-8 text-center">
        <div class="text-gray-500">
          <svg class="h-12 w-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-lg font-medium">No posts yet</p>
          <p class="mt-2">Get started by creating your first post.</p>
          <router-link to="/post/new">
            <Button class="mt-4">
              Create First Post
            </Button>
          </router-link>
        </div>
      </div>

      <ul v-else class="divide-y divide-gray-200">
        <li v-for="post in postsStore.posts" :key="post.id" class="px-4 py-4 sm:px-6">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-indigo-600 truncate">
                  <button @click="viewPost(post)" class="hover:underline text-left">
                    {{ post.title }}
                  </button>
                </p>
                <div class="flex items-center space-x-2">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      post.published
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    ]"
                  >
                    {{ post.published ? 'Published' : 'Draft' }}
                  </span>
                </div>
              </div>
              <div class="mt-2 flex items-center text-sm text-gray-500">
                <span>By {{ post.author }}</span>
                <span class="mx-2">•</span>
                <span>{{ formatDate(post.created_at) }}</span>
                <span v-if="post.updated_at !== post.created_at" class="mx-2">•</span>
                <span v-if="post.updated_at !== post.created_at">Updated {{ formatDate(post.updated_at) }}</span>
              </div>
            </div>
            <div class="ml-4 flex-shrink-0 flex space-x-2">
              <router-link :to="`/post/${post.id}/edit`">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </router-link>
              <Button
                variant="destructive"
                size="sm"
                @click="deletePost(post.id)"
                :loading="deletingPost === post.id"
              >
                Delete
              </Button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Pagination -->
    <div v-if="postsStore.meta && postsStore.meta.total_pages && postsStore.meta.total_pages > 1" class="mt-8 flex justify-center">
      <nav class="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          Previous
        </Button>
        
                  <span class="text-sm text-gray-700">
            Page {{ currentPage }} of {{ postsStore.meta?.total_pages || 1 }}
          </span>
        
        <Button
          variant="outline"
          size="sm"
          :disabled="currentPage === (postsStore.meta?.total_pages || 1)"
          @click="changePage(currentPage + 1)"
        >
          Next
        </Button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePostsStore } from '../stores/posts'
import { marked } from 'marked'
import { Button } from '../components/ui/button'

const router = useRouter()
const postsStore = usePostsStore()
const currentPage = ref(1)
const deletingPost = ref<string | null>(null)
const showingPost = ref(false)
const currentPost = ref<any>(null)

const loadPosts = async () => {
  console.log('🔍 Dashboard: Loading posts for page:', currentPage.value)
  await postsStore.fetchPosts(currentPage.value)
  console.log('🔍 Dashboard: Posts loaded, first post ID:', postsStore.posts[0]?.id, 'type:', typeof postsStore.posts[0]?.id)
}

const changePage = async (page: number) => {
  currentPage.value = page
  await loadPosts()
}

const deletePost = async (id: string) => {
  if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
    return
  }
  
  deletingPost.value = id
  try {
    const success = await postsStore.deletePost(id)
    if (success) {
      // Post deleted successfully
    }
  } catch (error) {
    console.error('Error deleting post:', error)
  } finally {
    deletingPost.value = null
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getRenderedContent = () => {
  if (!currentPost.value) return ''
  
  // Convert markdown to HTML
  return marked.parse(currentPost.value.content) as string
}

const viewPost = (post: any) => {
  currentPost.value = post
  showingPost.value = true
  
  // Update page title
  document.title = `${post.title} - Dashboard - AGoat Blog`
}

const backToList = () => {
  showingPost.value = false
  currentPost.value = null
  
  // Reset page title
  document.title = 'Dashboard - AGoat Blog'
}

const editPost = () => {
  if (currentPost.value) {
    // Navigate to edit page
    router.push(`/post/${currentPost.value.id}/edit`)
  }
}

onMounted(() => {
  loadPosts()
})
</script>
