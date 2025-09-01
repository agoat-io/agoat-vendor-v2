// API Configuration for Multitenancy
export const API_CONFIG = {
  BASE_URL: '/api',
  VIEWER_URL: 'http://localhost:3001',
  ENDPOINTS: {
    STATUS: '/status',
    SITES: '/sites',
    SITE: (id: string) => `/sites/${id}`,
    SITE_POSTS: (siteId: string) => `/sites/${siteId}/posts`,
    SITE_POST: (siteId: string, postId: string) => `/sites/${siteId}/posts/${postId}`,
    SITE_POST_BY_SLUG: (siteId: string, slug: string) => `/sites/${siteId}/posts/slug/${slug}`,
  }
} as const

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

// Default site ID for development (actual UUID from database)
export const DEFAULT_SITE_ID = '18c6498d-f738-4c9f-aefd-d66bec11d751'
