export interface Post {
  id: string
  title: string
  content: string
  slug: string
  published: boolean
  created_at: string
  updated_at: string
  user_id: string
  author?: string
}

export interface User {
  id: string
  username: string
  email: string
  created_at: string
  updated_at: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  meta?: {
    total: number
    total_pages: number
    current_page: number
    per_page: number
  }
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
}
