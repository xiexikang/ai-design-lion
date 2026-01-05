import { QINIU_CONFIG, SUPPORTED_MODELS, IMAGE_SIZES } from './api.types'
import { encryptString, decryptString } from '../utils/crypto'
import type { GenerateImageRequest, GenerateImageResponse, ImageEditRequest } from './api.types'

class QiniuAIAPIService {
  private baseURL: string
  private apiKey: string

  constructor() {
    this.baseURL = QINIU_CONFIG.baseURL
    this.apiKey = QINIU_CONFIG.apiKey || ''
    if (typeof window !== 'undefined') {
      const enc = localStorage.getItem('qiniu_api_key_enc')
      if (enc) {
        try {
          const parsed = JSON.parse(enc)
          decryptString(parsed).then(v => { this.apiKey = v || this.apiKey }).catch((_e) => { void 0 })
        } catch (_err) { void 0 }
      }
    }
  }

  async setApiKey(key: string) {
    this.apiKey = key || ''
    if (typeof window !== 'undefined') {
      if (key) {
        const payload = await encryptString(key)
        localStorage.setItem('qiniu_api_key_enc', JSON.stringify(payload))
      } else {
        localStorage.removeItem('qiniu_api_key_enc')
      }
    }
  }

  private async getApiKey(): Promise<string> {
    let key = this.apiKey || ''
    if (typeof window !== 'undefined') {
      const enc = localStorage.getItem('qiniu_api_key_enc')
      if (enc) {
        try {
          const parsed = JSON.parse(enc)
          const v = await decryptString(parsed)
          key = v || key
        } catch (_err) { void 0 }
      }
    }
    return key
  }

  private async makeRequest(endpoint: string, data: any): Promise<any> {
    try {
      const apiKey = await this.getApiKey()
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        const rawMsg = error.error?.message || error.error || response.statusText
        const errType = error.error?.type || 'error'
        const friendly = errType === 'authentication_error' ? '七牛云鉴权失败，请检查 API Key' : `请求失败: ${rawMsg}`
        window.dispatchEvent(new CustomEvent('api-error', { detail: { message: friendly, type: 'error', source: 'qiniu' } }))
        throw new Error(`API Error: ${rawMsg}`)
      }

      return await response.json()
    } catch (error) {
      const msg = error instanceof Error ? error.message : '网络异常'
      if (!(msg || '').startsWith('API Error:')) {
        window.dispatchEvent(new CustomEvent('api-error', { detail: { message: '网络异常，请稍后重试', type: 'error', source: 'qiniu' } }))
      }
      console.error('API Request failed:', error)
      throw error
    }
  }

  /**
   * 文生图API调用
   */
  async generateImage(request: GenerateImageRequest): Promise<GenerateImageResponse> {
    const payload = {
      model: request.model || SUPPORTED_MODELS.TEXT_TO_IMAGE,
      prompt: request.prompt,
      n: request.n || 1,
      size: request.size || IMAGE_SIZES.SQUARE,
      image_config: request.image_config || {
        aspect_ratio: "1:1",
        image_size: "1024x1024"
      },
      response_format: request.response_format || 'url'
    }

    const raw = await this.makeRequest('/images/generations', payload)
    const images = (raw.images || raw.data || []).map((item: any) => ({ url: item.url, b64_json: item.b64_json }))
    return {
      images,
      created: raw.created || Date.now(),
      model: raw.model || payload.model
    }
  }

  /**
   * 图生图API调用
   */
  async editImage(request: ImageEditRequest): Promise<GenerateImageResponse> {
    const payload = {
      model: request.model || SUPPORTED_MODELS.IMAGE_TO_IMAGE,
      image: request.image,
      prompt: request.prompt,
      n: request.n || 1,
      size: request.size || IMAGE_SIZES.SQUARE,
      mask: request.mask,
      image_config: request.image_config || {
        aspect_ratio: "1:1",
        image_size: "1024x1024"
      }
    }

    const raw = await this.makeRequest('/images/edits', payload)
    const images = (raw.images || raw.data || []).map((item: any) => ({ url: item.url, b64_json: item.b64_json }))
    return {
      images,
      created: raw.created || Date.now(),
      model: raw.model || payload.model
    }
  }

  /**
   * 批量生成图片（用于故事板等场景）
   */
  async generateBatchImages(prompts: string[], model?: string): Promise<string[]> {
    const results: string[] = []
    
    for (const prompt of prompts) {
      try {
        const response = await this.generateImage({
          model: model || SUPPORTED_MODELS.TEXT_TO_IMAGE,
          prompt: prompt,
          n: 1,
          response_format: 'url'
        })
        
        if (response.images && response.images.length > 0) {
          results.push(response.images[0].url || response.images[0].b64_json)
        }
      } catch (error) {
        console.error(`Failed to generate image for prompt: ${prompt}`, error)
        // 继续处理其他图片，而不是中断整个流程
        results.push('')
      }
    }
    
    return results
  }

  /**
   * 获取支持的模型列表
   */
  async getModels(): Promise<any[]> {
    try {
      const apiKey = await this.getApiKey()
      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Failed to get models:', error)
      return []
    }
  }

  /**
   * 将Base64图片数据转换为Blob
   */
  base64ToBlob(base64Data: string, contentType: string = 'image/png'): Blob {
    const byteCharacters = atob(base64Data)
    const byteArrays = []
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512)
      const byteNumbers = new Array(slice.length)
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i)
      }
      
      const byteArray = new Uint8Array(byteNumbers)
      byteArrays.push(byteArray)
    }
    
    return new Blob(byteArrays, { type: contentType })
  }

  /**
   * 下载生成的图片
   */
  async downloadImage(imageData: string, filename: string): Promise<void> {
    try {
      let blob: Blob
      
      if (imageData.startsWith('data:')) {
        // Data URL
        const response = await fetch(imageData)
        blob = await response.blob()
      } else if (imageData.startsWith('http')) {
        // URL
        const response = await fetch(imageData)
        blob = await response.blob()
      } else {
        // Base64
        blob = this.base64ToBlob(imageData)
      }
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download image:', error)
      throw error
    }
  }
}

// 创建单例实例
export const qiniuAIAPIService = new QiniuAIAPIService()

export default QiniuAIAPIService
