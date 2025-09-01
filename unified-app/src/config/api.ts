export const API_CONFIG = {
  BASE_URL: '/api',
  ENDPOINTS: {
    STATUS: '/status',
    SITES: '/sites',
    SITE: (id: string) => `/sites/${id}`,
    SITE_POSTS: (siteId: string) => `/sites/${siteId}/posts`,
    SITE_POST: (siteId: string, postId: string) => `/sites/${siteId}/posts/${postId}`,
    SITE_POST_BY_SLUG: (siteId: string, slug: string) => `/sites/${siteId}/posts/slug/${slug}`,
    LOGIN: '/login',
    LOGOUT: '/logout',
    AUTH_CHECK: '/status',
  }
} as const

export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

export const DEFAULT_SITE_ID = '18c6498d-f738-4c9f-aefd-d66bec11d751'
