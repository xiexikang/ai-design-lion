// 七牛云API配置
export const QINIU_CONFIG = {
  baseURL:
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_QINIU_BASE_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.REACT_APP_API_BASE_URL) ||
    'https://api.qnaigc.com/v1',
  apiKey:
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_QINIU_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.REACT_APP_QINIU_API_KEY) ||
    ''
}

// 支持的模型列表
export const SUPPORTED_MODELS = {
  TEXT_TO_IMAGE: 'gemini-2.5-flash-image', // Nano Banana
  TEXT_TO_IMAGE_PRO: 'gemini-3.0-pro-image-preview', // Nano Banana Pro
  IMAGE_TO_IMAGE: 'gemini-2.5-flash-image',
  KLING_V2: 'kling-v2'
}

export const MODEL_OPTIONS = [
  { id: 'gemini-2.5-flash-image', name: 'Nano Banana' },
  { id: 'gemini-3.0-pro-image-preview', name: 'Nano Banana Pro' },
  { id: 'kling-v2', name: 'kling v2' }
]

// 支持的图片尺寸
export const IMAGE_SIZES = {
  SQUARE: '1024x1024',
  PORTRAIT_4_3: '768x1344',
  LANDSCAPE_4_3: '1344x768',
  PORTRAIT_16_9: '768x1344',
  LANDSCAPE_16_9: '1344x768'
}

// API响应接口
export interface GenerateImageRequest {
  model: string
  prompt: string
  n?: number
  size?: string
  image_config?: {
    aspect_ratio?: string
    image_size?: string
  }
  response_format?: 'b64_json' | 'url'
}

export interface GenerateImageResponse {
  images: Array<{
    b64_json?: string
    url?: string
  }>
  created: number
  model: string
}

export interface ImageEditRequest {
  model: string
  image: string // Base64或URL
  prompt: string
  n?: number
  size?: string
  mask?: string // 可选的遮罩
  image_config?: {
    aspect_ratio?: string
    image_size?: string
  }
}
