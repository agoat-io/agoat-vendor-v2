// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  VIEWER_URL: process.env.NEXT_PUBLIC_VIEWER_URL || 'http://localhost:3001',
  ENDPOINTS: {
    STATUS: '/status',
    LOGIN: '/login',
    LOGOUT: '/logout',
    POSTS: '/posts',
    POST: (id: string) => `/posts/${id}`,
  }
} as const

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}
