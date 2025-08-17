<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            {{ isEditing ? 'Edit Post' : 'New Post' }}
          </h1>
          <p class="mt-2 text-gray-600">
            {{ isEditing ? 'Update your post content and settings' : 'Create a new blog post' }}
          </p>
        </div>
        <router-link to="/dashboard">
          <Button variant="outline">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Button>
        </router-link>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Title -->
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700">
          Title
        </label>
        <Input
          id="title"
          v-model="form.title"
          type="text"
          placeholder="Enter post title"
          :class="errors.title ? 'border-destructive focus-visible:ring-destructive' : ''"
          required
        />
        <div v-if="errors.title" class="mt-1 text-sm text-destructive">
          {{ errors.title }}
        </div>
      </div>

      <!-- Content -->
      <div>
        <label for="content" class="block text-sm font-medium text-gray-700 mb-2">
          Content
        </label>
        <BlogEditor
          v-model="form.content"
          placeholder="Write your blog post content here..."
        />
        <div v-if="errors.content" class="mt-1 text-sm text-destructive">
          {{ errors.content }}
        </div>
      </div>

      <!-- Published Status -->
      <div class="flex items-center">
        <input
          id="published"
          v-model="form.published"
          type="checkbox"
          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label for="published" class="ml-2 block text-sm text-gray-900">
          Publish immediately
        </label>
      </div>

      <!-- Error Display -->
      <div v-if="postsStore.error" class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-800">
              {{ postsStore.error }}
            </p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end space-x-4">
        <router-link to="/dashboard">
          <Button variant="secondary">
            Cancel
          </Button>
        </router-link>
        <Button
          type="submit"
          :disabled="!isFormValid || postsStore.loading"
        >
          <svg v-if="postsStore.loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isEditing ? 'Update Post' : 'Create Post' }}
        </Button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostsStore } from '../stores/posts'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import BlogEditor from '../components/BlogEditor.vue'

const route = useRoute()
const router = useRouter()
const postsStore = usePostsStore()

const form = ref({
  title: '',
  content: '',
  published: false
})

const errors = ref({
  title: '',
  content: ''
})

const isEditing = computed(() => route.name === 'post-edit')
const postId = computed(() => route.params.id as string)

const isFormValid = computed(() => {
  return form.value.title.trim() && form.value.content.trim()
})

const validateForm = () => {
  errors.value = {
    title: '',
    content: ''
  }
  
  if (!form.value.title.trim()) {
    errors.value.title = 'Title is required'
  }
  
  if (!form.value.content.trim()) {
    errors.value.content = 'Content is required'
  }
  
  return !errors.value.title && !errors.value.content
}

const loadPost = async () => {
  if (isEditing.value && postId.value) {
    try {
      const post = await postsStore.fetchPost(postId.value)
      if (post && post.data) {
        console.log('Loading post data:', post.data)
        form.value = {
          title: post.data.title || '',
          content: post.data.content || '',
          published: post.data.published || false
        }
        console.log('Form data after loading:', form.value)
      } else {
        console.error('Post not found')
      }
    } catch (error) {
      console.error('Error loading post:', error)
    }
  }
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  postsStore.clearError()
  
  try {
    if (isEditing.value && postId.value) {
      const updatedPost = await postsStore.updatePost(postId.value, {
        title: form.value.title,
        content: form.value.content,
        published: form.value.published
      })
      
      if (updatedPost) {
        router.push('/dashboard')
      }
    } else {
      const newPost = await postsStore.createPost({
        title: form.value.title,
        content: form.value.content,
        published: form.value.published
      })
      
      if (newPost) {
        router.push('/dashboard')
      }
    }
  } catch (error) {
    console.error('Error saving post:', error)
  }
}

// Watch for route changes to load post data
watch(() => route.params.id, () => {
  if (isEditing.value) {
    loadPost()
  }
})

onMounted(() => {
  loadPost()
})
</script>
