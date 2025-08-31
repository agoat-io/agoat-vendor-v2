// API Configuration
export const API_CONFIG = {
  BASE_URL: '/api',
  VIEWER_URL: 'http://localhost:3001',
  ENDPOINTS: {
    STATUS: '/status',
    LOGIN: '/login',
    LOGOUT: '/logout',
    POSTS: '/posts',
    POST: (id: string) => `/posts/${id}`,
    AUTH_CHECK: '/status',
  }
} as const

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}
