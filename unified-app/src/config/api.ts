export const API_CONFIG = {
  BASE_URL: '/api',
  ENDPOINTS: {
    STATUS: '/status',
    LOGIN: '/login',
    LOGOUT: '/logout',
    POSTS: '/posts',
    POST: (id: string) => `/posts/${id}`,
    AUTH_CHECK: '/status',
  }
} as const

export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}
