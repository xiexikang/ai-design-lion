// API配置
const ENV = (typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: Record<string, string> }) : undefined)

export const API_CONFIG = {
  baseURL:
    ENV?.env?.VITE_API_BASE_URL ||
    ENV?.env?.REACT_APP_API_BASE_URL ||
    'http://localhost:8080/api/v1',
  timeout: 30000,
}

// API响应接口
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    username: string
    avatar?: string
  }
}

export interface User {
  id: string
  email: string
  username: string
  avatar?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  title: string
  description: string
  type: 'single' | 'storyboard'
  status: string
  created_at: string
  updated_at: string
  image_count?: number
}

export interface Image {
  id: string
  project_id: string
  prompt: string
  model: string
  size: string
  image_url: string
  image_data: string
  status: 'pending' | 'completed' | 'failed'
  error?: string
  generated_at?: string
  created_at: string
  updated_at: string
}

export interface GenerateImageRequest {
  prompt: string
  model?: string
  size?: string
  n?: number
  project_id?: string
  template?: string
}

export interface GenerateImageResponse {
  success: boolean
  images: string[]
  message: string
}