import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type {
  LoginRequest,
  LoginResponse,
  APIResponse,
  PostsResponse,
  PostResponse,
  CreatePostRequest,
  UpdatePostRequest,
  Post
} from '../types'

class API {
  private client: AxiosInstance
  private baseURL: string

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
    this.client = axios.create({
      baseURL: this.baseURL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // No request interceptor needed for session-based auth
    // Cookies are automatically sent with requests when withCredentials: true

    // Add response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear user data but don't redirect - let the navigation guard handle it
          localStorage.removeItem('user')
          // Don't use window.location.href as it can cause navigation issues
          // The navigation guard will handle the redirect
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.client.post('/login', credentials)
    return response.data
  }

  async logout(): Promise<APIResponse> {
    const response: AxiosResponse<APIResponse> = await this.client.post('/logout')
    return response.data
  }

  async getStatus(): Promise<APIResponse> {
    const response: AxiosResponse<APIResponse> = await this.client.get('/status')
    return response.data
  }

  // Posts endpoints
  async getPosts(
    page: number = 1, 
    perPage: number = 10, 
    publishedOnly: boolean = false,
    dateRange?: { from: Date; to: Date }
  ): Promise<PostsResponse> {
    const params: any = { 
      page, 
      per_page: perPage,
      published: publishedOnly ? 'true' : undefined
    }
    
    if (dateRange) {
      params.from_date = dateRange.from.toISOString().split('T')[0]
      params.to_date = dateRange.to.toISOString().split('T')[0]
    }
    
    console.log('🔍 API: Making request to get posts with params:', params)
    const response: AxiosResponse<PostsResponse> = await this.client.get('/posts', { params })
    console.log('🔍 API: Raw response data:', response.data)
    console.log('🔍 API: First post ID in response:', response.data.data?.[0]?.id, 'type:', typeof response.data.data?.[0]?.id)
    return response.data
  }

  async getPost(id: string | number, slug?: string): Promise<PostResponse & { redirected?: boolean; redirectUrl?: string }> {
    console.log('API: Making request to get post', id, 'with slug:', slug)
    const url = slug ? `/posts/${id}/${slug}` : `/posts/${id}`
    
    try {
      const response: AxiosResponse<PostResponse> = await this.client.get(url)
      console.log('API: Response received:', response.data)
      return response.data
    } catch (error: any) {
      // Check if it's a redirect response
      if (error.response?.status === 301 || error.response?.status === 302) {
        const redirectUrl = error.response.headers.location
        console.log('API: Redirect detected to:', redirectUrl)
        return {
          success: false,
          error: 'Redirect required',
          redirected: true,
          redirectUrl: redirectUrl
        }
      }
      throw error
    }
  }

  async createPost(post: CreatePostRequest): Promise<PostResponse> {
    const response: AxiosResponse<PostResponse> = await this.client.post('/posts', post)
    return response.data
  }

  async updatePost(id: string | number, post: UpdatePostRequest): Promise<PostResponse> {
    const response: AxiosResponse<PostResponse> = await this.client.put(`/posts/${id}`, post)
    return response.data
  }

  async deletePost(id: string | number): Promise<APIResponse> {
    const response: AxiosResponse<APIResponse> = await this.client.delete(`/posts/${id}`)
    return response.data
  }
}

export const api = new API()
