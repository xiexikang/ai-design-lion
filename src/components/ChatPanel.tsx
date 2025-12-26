import React, { useRef, useState } from 'react'
import { Send, Paperclip, Settings, Minimize2, X } from 'lucide-react'
import './ChatPanel.css'
import './AuthModal.css'
import { useViewer } from '../hooks/useViewer'
import logoImg from '@/assets/logo.png'
import { MODEL_OPTIONS } from '../services/api.types'
import Dropdown from './Dropdown'
import './Dropdown.css'
import { qiniuAIAPIService } from '../services/api.service'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  images?: string[]
  template?: string
}

interface Template {
  id: string
  title: string
  subtitle: string
  prompt: string
  previewImages: string[]
}

interface ChatPanelProps {
  onGenerateImage: (prompt: string, template?: string, model?: string, imageData?: string) => Promise<string[]>
  isGenerating: boolean
  isMobileMenuOpen?: boolean
  onMobileMenuToggle?: () => void
  onCollapse?: () => void
}

const ChatPanel: React.FC<ChatPanelProps> = ({ onGenerateImage, isGenerating, isMobileMenuOpen, onMobileMenuToggle, onCollapse }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const messagesRef = useRef<HTMLDivElement>(null)
  const chatInnerRef = useRef<HTMLDivElement>(null)

  const { openByElement } = useViewer(messagesRef)

  const [selectedModel, setSelectedModel] = useState<string>(MODEL_OPTIONS[0].id)

  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedName, setUploadedName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [keyModalOpen, setKeyModalOpen] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('qiniu_api_key') || ''
    }
    return ''
  })

  const getPreviewImages = (key: string): string[] => {
    const mk = (seed: string) => `https://picsum.photos/seed/${seed}/64/72`
    const map: Record<string, string[]> = {
      poster: [mk('poster-1'), mk('poster-2'), mk('poster-3')],
      logo: [mk('logo-1'), mk('logo-2'), mk('logo-3')],
      book: [mk('book-1'), mk('book-2'), mk('book-3')],
      wine: [mk('wine-1'), mk('wine-2'), mk('wine-3')],
      promotion: [mk('promotion-1'), mk('promotion-2'), mk('promotion-3')],
      landing: [mk('landing-1'), mk('landing-2'), mk('landing-3')],
      app: [mk('app-1'), mk('app-2'), mk('app-3')],
      album: [mk('album-1'), mk('album-2'), mk('album-3')],
      storyboard: [mk('storyboard-1'), mk('storyboard-2'), mk('storyboard-3')],
      banner: [mk('banner-1'), mk('banner-2'), mk('banner-3')],
      menu: [mk('menu-1'), mk('menu-2'), mk('menu-3')],
      travel: [mk('travel-1'), mk('travel-2'), mk('travel-3')],
      coffee: [mk('coffee-1'), mk('coffee-2'), mk('coffee-3')],
    }
    return map[key] || [mk(`${key}-a`), mk(`${key}-b`), mk(`${key}-c`)]
  }

  const [templates, setTemplates] = useState<Template[]>([
    { id: 'poster', title: '海报', subtitle: '现代字体海报', prompt: '设计一张现代风格的字体海报，使用渐变背景与强烈层次', previewImages: getPreviewImages('poster') },
    { id: 'logo', title: '标志', subtitle: '极简品牌标志', prompt: '为一家科技初创公司设计一个极简几何风格的Logo', previewImages: getPreviewImages('logo') },
    { id: 'book', title: '书籍封面', subtitle: '编辑风格', prompt: '设计一本书籍封面，使用衬线字体与平衡的版式布局', previewImages: getPreviewImages('book') },
  ])

  const generateRandomTemplates = () => {
    const pool = [
      { id: 'wine', title: '酒单海报', subtitle: '模仿此风格生成海报', prompt: '请模仿该风格生成一张优雅的酒单海报设计' },
      { id: 'promotion', title: '宣传单', subtitle: '活动推广', prompt: '生成一张活动宣传单，包含日期、地点和主视觉图片' },
      { id: 'landing', title: '落地页', subtitle: '产品网站', prompt: '设计网站落地页主视觉区域，包含CTA与产品展示图' },
      { id: 'app', title: 'App界面', subtitle: '移动端屏幕', prompt: '设计一套移动App的引导页（3屏插画与简洁文案）' },
      { id: 'album', title: '专辑封面', subtitle: '复古氛围', prompt: '生成一张复古配色与质感的专辑封面，突出主题文字' },
      { id: 'storyboard', title: '故事板', subtitle: '为脚本生成故事板', prompt: '请为以下脚本生成一个故事板（分镜、场景说明与视觉要点）' },
      { id: 'banner', title: '活动横幅', subtitle: '社媒素材', prompt: '为活动制作一张社媒横幅，结合图标与柔和渐变' },
      { id: 'menu', title: '餐厅菜单', subtitle: '优雅菜单', prompt: '生成一份优雅的餐厅菜单，包含分区与美食图片' },
      { id: 'travel', title: '旅游广告', subtitle: '目的地推广', prompt: '设计一张旅游广告，突出风景摄影并包含行动按钮' },
      { id: 'coffee', title: '咖啡店品牌物料', subtitle: '你是品牌设计专家', prompt: '你是品牌设计专家，请生成一套咖啡店品牌物料（Logo、海报、贴纸等）' },
    ]
    const pick = (n: number) => {
      const res: typeof pool = []
      const used = new Set<number>()
      while (res.length < n) {
        const i = Math.floor(Math.random() * pool.length)
        if (!used.has(i)) {
          used.add(i)
          res.push(pool[i])
        }
      }
      return res
    }
    return pick(3).map((p, idx): Template => ({
      id: `${Date.now()}-${idx}-${Math.floor(Math.random()*1000)}`,
      title: p.title,
      subtitle: p.subtitle,
      prompt: p.prompt,
      previewImages: getPreviewImages(p.id)
    }))
  }

  const handleToggleTemplates = () => {
    setTemplates(generateRandomTemplates())
    setSelectedTemplate('')
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      images: uploadedImage ? [uploadedImage] : undefined
    }

    setMessages(prev => [...prev, userMessage])

    const images = await onGenerateImage(inputValue, selectedTemplate, selectedModel, uploadedImage || undefined)

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      images,
      template: selectedTemplate
    }

    setMessages(prev => [...prev, assistantMessage])
    setInputValue('')
    setUploadedImage(null)
  }

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template.id)
  }

  const handleTemplateUse = (template: Template) => {
    setSelectedTemplate(template.id)
    setInputValue(template.prompt)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedImage(reader.result)
      }
    }
    reader.readAsDataURL(file)
    setUploadedName(file.name || 'image')
    e.target.value = ''
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const dt = e.clipboardData
    if (!dt) return
    const items = dt.items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              setUploadedImage(reader.result)
              setUploadedName(file.name || 'clipboard-image')
            }
          }
          reader.readAsDataURL(file)
          e.preventDefault()
        }
        break
      }
    }
  }

  const handleRemoveUpload = () => {
    setUploadedImage(null)
    setUploadedName(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  React.useEffect(() => {
    const el = chatInnerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, isGenerating, inputValue])

  return (
    <article className={`chat-panel ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
      <div className='chat-panel-container'>
      {/* 移动端遮罩 */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={onMobileMenuToggle}></div>
      )}
      
      {/* 顶部标题 */}
      <div className="chat-header">
        <div className="header-left">
          <div className="logo">
            <img src={logoImg} alt="logo" className="logo-image" />
          </div>
        </div>
        <div className="header-actions">
          <Dropdown
            className="model-select"
            value={selectedModel}
            options={MODEL_OPTIONS}
            onChange={setSelectedModel}
          />
          <button className="header-btn" onClick={() => setKeyModalOpen(true)}>
            <Settings size={16} />
          </button>
          <button className="header-btn" title="收缩侧边栏" onClick={onCollapse}>
            <Minimize2 size={16} />
          </button>
        </div>
      </div>

      <section className='chat-inner' ref={chatInnerRef}>
        {/* 模板与欢迎区域 */}
        {messages.length === 0 && (
        <div className="template-section">
          <div className="hero">
            <h1 className="hero-title">Hi，我是你的AI设计狮</h1>
            <p className="hero-subtitle">让我们开始今天的创作吧！</p>
          </div>
          <div className="template-list">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`template-card template-large ${selectedTemplate === template.id ? 'selected' : ''}`}
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="template-content">
                  <div className="template-title">{template.title}</div>
                  <div className="template-subtitle">{template.subtitle}</div>
                  <button
                    className="template-use-btn"
                    onClick={(e) => { e.stopPropagation(); handleTemplateUse(template); }}
                  >
                    使用
                  </button>
                </div>
                <div className="template-preview">
                  <div className="preview-card pc1">
                    <img src={template.previewImages[0]} alt={`${template.title} preview 1`} />
                  </div>
                  <div className="preview-card pc2">
                    <img src={template.previewImages[1]} alt={`${template.title} preview 2`} />
                  </div>
                  <div className="preview-card pc3">
                    <img src={template.previewImages[2]} alt={`${template.title} preview 3`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="template-toggle" onClick={handleToggleTemplates}>切换</button>
        </div>

        )}

        {/* 聊天消息区域 */}
        <div ref={messagesRef} className="chat-messages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-content">
                {message.type === 'assistant' ? (
                  <div className="assistant-message">
                    <div className="message-header">
                      <span className="assistant-name">AI小狮</span>
                      <span className="message-time">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="message-text">
                      {message.content.split('\n').map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                    {message.images && (
                      <div className="message-images">
                        {message.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Generated ${index + 1}`}
                            onClick={(e) => openByElement(e.currentTarget)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="user-message">
                    <div className="message-text">{message.content}</div>
                    {message.images && (
                      <div className="message-images">
                        {message.images.map((image, idx) => (
                          <img key={idx} src={image} alt={`Upload ${idx + 1}`} />
                        ))}
                      </div>
                    )}
                    <div className="message-time">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="generating-block">
              <div className="gen-header">
                <span className="gen-model">{MODEL_OPTIONS.find(m => m.id === selectedModel)?.name || 'Model'}</span>
              </div>
              <div className="gen-status">生成中</div>
              <div className="gen-card"></div>
            </div>
          )}
        </div>
      </section>

      

        {/* 输入区域 */}
        <div className="chat-input-section">
          <div className="chat-input-container">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
              placeholder="请输入你的设计需求"
              className="chat-input"
              rows={4}
              disabled={isGenerating}
            />
            {uploadedImage && (
              <div className="upload-chips">
                <div className="upload-chip">
                  <img className="upload-thumb" src={uploadedImage} alt="thumb" />
                  <span className="upload-name">{(uploadedName || 'image').slice(0, 10)}...</span>
                  <button className="upload-remove" onClick={handleRemoveUpload}>×</button>
                </div>
              </div>
            )}
            <div className="input-actions">
              <button className="input-btn" disabled={isGenerating} onClick={handleUploadClick}>
                <Paperclip size={16} />
              </button>
              <button 
                className={`send-btn ${isGenerating ? 'disabled' : ''}`}
                onClick={handleSendMessage}
                disabled={isGenerating || !inputValue.trim()}
              >
                {isGenerating ? (
                  <div className="loading-dot"></div>
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          </div>
        </div>

        {keyModalOpen && (
          <div className="auth-modal-overlay" onClick={() => setKeyModalOpen(false)}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
              <div className="auth-modal-header">
                <h3>设置七牛云的密钥</h3>
                <button className="close-btn" onClick={() => setKeyModalOpen(false)} aria-label="关闭">
                  <X size={18} />
                </button>
              </div>
              <div className='auth-reg-link'>
                <span>注册链接：</span>
                <a href="https://s.qiniu.com/FbMvqa" target="_blank" rel="noopener noreferrer">https://s.qiniu.com/FbMvqa</a>
              </div>
              <form className="auth-form" onSubmit={(e) => { e.preventDefault(); qiniuAIAPIService.setApiKey(apiKeyInput.trim()); setKeyModalOpen(false) }}>
                <div className="form-group">
                  <label>API Key</label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="请输入七牛云秘钥"
                    required
                  />
                </div>
                <button className="submit-btn" type="submit">保存</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

export default ChatPanel
