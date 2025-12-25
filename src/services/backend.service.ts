import { API_CONFIG } from './backend.types'
import type { APIResponse, AuthResponse, User, Project, Image, GenerateImageRequest, GenerateImageResponse } from './backend.types'

class BackendAPIService {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = API_CONFIG.baseURL
    this.token = localStorage.getItem('token')
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
  }

  // 认证相关
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    
    if (response.data) {
      this.setToken(response.data.token)
      return response.data
    }
    
    throw new Error(response.error || 'Login failed')
  }

  async register(email: string, username: string, password: string): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    })
    
    if (response.data) {
      this.setToken(response.data.token)
      return response.data
    }
    
    throw new Error(response.error || 'Registration failed')
  }

  async getUserProfile(): Promise<User> {
    const response = await this.makeRequest<User>('/user/profile')
    
    if (response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to get user profile')
  }

  async updateUserProfile(username: string, avatar?: string): Promise<User> {
    const response = await this.makeRequest<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ username, avatar }),
    })
    
    if (response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to update user profile')
  }

  // 项目相关
  async getProjects(): Promise<Project[]> {
    const response = await this.makeRequest<Project[]>('/projects')
    
    if (response.data) {
      return Array.isArray(response.data) ? response.data : [response.data]
    }
    
    return []
  }

  async createProject(title: string, description: string, type: 'single' | 'storyboard'): Promise<Project> {
    const response = await this.makeRequest<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify({ title, description, type }),
    })
    
    if (response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to create project')
  }

  async getProject(id: string): Promise<Project> {
    const response = await this.makeRequest<Project>(`/projects/${id}`)
    
    if (response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to get project')
  }

  async updateProject(id: string, title: string, description: string, type: 'single' | 'storyboard'): Promise<Project> {
    const response = await this.makeRequest<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, description, type }),
    })
    
    if (response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to update project')
  }

  async deleteProject(id: string): Promise<void> {
    const response = await this.makeRequest<void>(`/projects/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.success && response.error) {
      throw new Error(response.error)
    }
  }

  // 图片生成相关
  async generateImage(request: GenerateImageRequest): Promise<GenerateImageResponse> {
    const response = await this.makeRequest<GenerateImageResponse>('/generate/image', {
      method: 'POST',
      body: JSON.stringify(request),
    })
    
    if (response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to generate image')
  }

  async generateBatchImages(prompts: string[], model?: string, size?: string, projectId?: string): Promise<GenerateImageResponse> {
    const response = await this.makeRequest<GenerateImageResponse>('/generate/batch', {
      method: 'POST',
      body: JSON.stringify({
        prompts,
        model,
        size,
        project_id: projectId,
      }),
    })
    
    if (response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to generate batch images')
  }

  async editImage(image: string, prompt: string, model?: string, size?: string, mask?: string, projectId?: string): Promise<GenerateImageResponse> {
    const response = await this.makeRequest<GenerateImageResponse>('/generate/edit', {
      method: 'POST',
      body: JSON.stringify({
        image,
        prompt,
        model,
        size,
        mask,
        project_id: projectId,
      }),
    })
    
    if (response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to edit image')
  }

  // 图片管理相关
  async getImages(projectId?: string): Promise<Image[]> {
    const endpoint = projectId ? `/images?project_id=${projectId}` : '/images'
    const response = await this.makeRequest<Image[]>(endpoint)
    
    if (response.data) {
      return Array.isArray(response.data) ? response.data : [response.data]
    }
    
    return []
  }

  async getImage(id: string): Promise<Image> {
    const response = await this.makeRequest<Image>(`/images/${id}`)
    
    if (response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to get image')
  }

  async deleteImage(id: string): Promise<void> {
    const response = await this.makeRequest<void>(`/images/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.success && response.error) {
      throw new Error(response.error)
    }
  }

  async downloadImage(id: string): Promise<Blob> {
    const url = `${this.baseURL}/images/${id}/download`
    
    const headers: HeadersInit = {}
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`)
    }

    return await response.blob()
  }

  // 工具方法
  isAuthenticated(): boolean {
    return !!this.token
  }

  logout(): void {
    this.setToken(null)
  }
}

// 创建单例实例
export const backendAPIService = new BackendAPIService()

export default BackendAPIService