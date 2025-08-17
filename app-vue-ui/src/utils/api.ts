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
          localStorage.removeItem('user')
          window.location.href = '/login'
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
  async getPosts(page: number = 1, perPage: number = 10): Promise<PostsResponse> {
    const response: AxiosResponse<PostsResponse> = await this.client.get('/posts', {
      params: { page, per_page: perPage }
    })
    return response.data
  }

  async getPost(id: number): Promise<PostResponse> {
    const response: AxiosResponse<PostResponse> = await this.client.get(`/posts/${id}`)
    return response.data
  }

  async createPost(post: CreatePostRequest): Promise<PostResponse> {
    const response: AxiosResponse<PostResponse> = await this.client.post('/posts', post)
    return response.data
  }

  async updatePost(id: number, post: UpdatePostRequest): Promise<PostResponse> {
    const response: AxiosResponse<PostResponse> = await this.client.put(`/posts/${id}`, post)
    return response.data
  }

  async deletePost(id: number): Promise<APIResponse> {
    const response: AxiosResponse<APIResponse> = await this.client.delete(`/posts/${id}`)
    return response.data
  }
}

export const api = new API()
