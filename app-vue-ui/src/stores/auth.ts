import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../utils/api'
import type { User, LoginRequest } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const isAuthenticated = computed(() => !!user.value)

  // Initialize auth state from localStorage
  const initializeAuth = () => {
    const storedUser = localStorage.getItem('user')
    
    if (storedUser) {
      user.value = JSON.parse(storedUser)
    }
  }

  // Login action
  const login = async (credentials: LoginRequest) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.login(credentials)
      
      if (response.success && response.user) {
        user.value = response.user
        
        // Store user in localStorage (session is handled by cookies)
        localStorage.setItem('user', JSON.stringify(user.value))
        
        return { success: true }
      } else {
        error.value = response.message || 'Login failed'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Login failed'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Logout action
  const logout = async () => {
    loading.value = true
    
    try {
      await api.logout()
    } catch (err) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', err)
    } finally {
      // Clear local state
      user.value = null
      error.value = null
      
      // Clear localStorage
      localStorage.removeItem('user')
      
      loading.value = false
    }
  }

  // Check authentication status
  const checkAuth = async () => {
    try {
      const response = await api.getStatus()
      
      if (response.success && response.data?.user) {
        user.value = response.data.user
        localStorage.setItem('user', JSON.stringify(user.value))
        return true
      } else {
        // Clear user if not authenticated
        user.value = null
        localStorage.removeItem('user')
        return false
      }
    } catch (err) {
      // Clear user if API call fails
      user.value = null
      localStorage.removeItem('user')
      throw err
    }
  }

  // Clear error
  const clearError = () => {
    error.value = null
  }

  // Initialize auth on store creation
  initializeAuth()

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    clearError
  }
})
