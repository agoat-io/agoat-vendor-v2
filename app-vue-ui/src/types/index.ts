export interface User {
  id: number
  username: string
  email: string
  created_at: string
}

export interface Post {
  id: number
  user_id: number
  title: string
  content: string
  slug: string
  published: boolean
  created_at: string
  updated_at: string
  author: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message?: string
  user?: User
  token?: string
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  meta?: APIMeta
}

export interface APIMeta {
  page?: number
  per_page?: number
  total?: number
  total_pages?: number
}

export interface PostsResponse extends APIResponse<Post[]> {
  meta?: APIMeta
}

export interface PostResponse extends APIResponse<Post> {}

export interface CreatePostRequest {
  title: string
  content: string
  published?: boolean
}

export interface UpdatePostRequest {
  title?: string
  content?: string
  published?: boolean
}
