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
    
    try {
      const response = await api.getPosts(page, perPage)
      
      if (response.success && response.data) {
        posts.value = response.data
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
  const fetchPost = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.getPost(id)
      
      if (response.success && response.data) {
        currentPost.value = response.data
        return response.data
      } else {
        error.value = response.error || 'Post not found'
        return null
      }
    } catch (err: any) {
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
  const updatePost = async (id: number, postData: UpdatePostRequest) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.updatePost(id, postData)
      
      if (response.success && response.data) {
        // Update in posts array
        const index = posts.value.findIndex(p => p.id === id)
        if (index !== -1) {
          posts.value[index] = response.data
        }
        
        // Update current post if it's the same
        if (currentPost.value?.id === id) {
          currentPost.value = response.data
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
  const deletePost = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.deletePost(id)
      
      if (response.success) {
        // Remove from posts array
        posts.value = posts.value.filter(p => p.id !== id)
        
        // Clear current post if it's the same
        if (currentPost.value?.id === id) {
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
