// API Types for Multitenancy Support

export interface User {
  id: string;
  username: string;
  email: string;
  customer_id?: string;
  site_id?: string;
  role?: string;
  status?: string;
  external_id?: string;
  iam_provider?: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  site_id: string;
  title: string;
  content: string;
  slug: string;
  status: string;
  published: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
  author?: string;
}

export interface Site {
  id: string;
  customer_id: string;
  name: string;
  slug: string;
  status: string;
  template: string;
  settings: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  status: string;
  subscription_plan: string;
  max_sites: number;
  max_storage_gb: number;
  max_bandwidth_gb: number;
  created_at: string;
  updated_at: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: APIMeta;
}

export interface APIMeta {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}

// API Endpoints
export const API_ENDPOINTS = {
  STATUS: '/status',
  SITES: '/sites',
  SITE: (id: string) => `/sites/${id}`,
  SITE_POSTS: (siteId: string) => `/sites/${siteId}/posts`,
  SITE_POST: (siteId: string, postId: string) => `/sites/${siteId}/posts/${postId}`,
  SITE_POST_BY_SLUG: (siteId: string, slug: string) => `/sites/${siteId}/posts/slug/${slug}`,
} as const;
