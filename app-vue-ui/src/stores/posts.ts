import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../utils/api'
import type { Post, CreatePostRequest, UpdatePostRequest, APIMeta } from '../types'

export const usePostsStore = defineStore('posts', () => {
  const posts = ref<Post[]>([])
  const currentPost = ref<Post | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<APIMeta | null>(null)

  // Computed properties
  const publishedPosts = computed(() => posts.value.filter(post => post.published))
  const draftPosts = computed(() => posts.value.filter(post => !post.published))

  // Fetch all posts
  const fetchPosts = async (page: number = 1, perPage: number = 10) => {
    loading.value = true
    error.value = null
    
    console.log('🔍 Fetching posts, page:', page, 'perPage:', perPage)
    
    try {
      const response = await api.getPosts(page, perPage)
      console.log('🔍 Raw API response:', response)
      
      if (response.success && response.data) {
        console.log('🔍 Posts before assignment:', response.data)
        console.log('🔍 First post ID type:', typeof response.data[0]?.id, 'value:', response.data[0]?.id)
        posts.value = response.data
        console.log('🔍 Posts after assignment:', posts.value)
        console.log('🔍 First post ID after assignment:', typeof posts.value[0]?.id, 'value:', posts.value[0]?.id)
        meta.value = response.meta || null
      } else {
        error.value = response.error || 'Failed to fetch posts'
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch posts'
    } finally {
      loading.value = false
    }
  }

  // Fetch single post
  const fetchPost = async (id: string | number, slug?: string) => {
    loading.value = true
    error.value = null
    
    console.log('Fetching post with ID:', id, 'and slug:', slug)
    
    try {
      const response = await api.getPost(id, slug)
      console.log('API response:', response)
      
      if (response.success && response.data) {
        currentPost.value = response.data
        console.log('Post loaded successfully:', response.data)
        return response.data
      } else {
        error.value = response.error || 'Post not found'
        console.log('Post not found, error:', response.error)
        return null
      }
    } catch (err: any) {
      console.error('Error fetching post:', err)
      error.value = err.response?.data?.error || 'Failed to fetch post'
      return null
    } finally {
      loading.value = false
    }
  }

  // Create new post
  const createPost = async (postData: CreatePostRequest) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.createPost(postData)
      
      if (response.success && response.data) {
        posts.value.unshift(response.data)
        return response.data
      } else {
        error.value = response.error || 'Failed to create post'
        return null
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create post'
      return null
    } finally {
      loading.value = false
    }
  }

  // Update post
  const updatePost = async (id: string | number, postData: UpdatePostRequest) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.updatePost(id, postData)
      
      if (response.success && response.data) {
        // Update in posts array
        const index = posts.value.findIndex(p => p.id === response.data!.id)
        if (index !== -1) {
          posts.value[index] = response.data!
        }
        
        // Update current post if it's the same
        if (currentPost.value?.id === response.data!.id) {
          currentPost.value = response.data!
        }
        
        return response.data
      } else {
        error.value = response.error || 'Failed to update post'
        return null
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update post'
      return null
    } finally {
      loading.value = false
    }
  }

  // Delete post
  const deletePost = async (id: string | number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.deletePost(id)
      
      if (response.success) {
        // Remove from posts array
        posts.value = posts.value.filter(p => p.id !== id.toString())
        
        // Clear current post if it's the same
        if (currentPost.value?.id === id.toString()) {
          currentPost.value = null
        }
        
        return true
      } else {
        error.value = response.error || 'Failed to delete post'
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete post'
      return false
    } finally {
      loading.value = false
    }
  }

  // Clear error
  const clearError = () => {
    error.value = null
  }

  // Clear current post
  const clearCurrentPost = () => {
    currentPost.value = null
  }

  return {
    posts,
    currentPost,
    loading,
    error,
    meta,
    publishedPosts,
    draftPosts,
    fetchPosts,
    fetchPost,
    createPost,
    updatePost,
    deletePost,
    clearError,
    clearCurrentPost
  }
})
