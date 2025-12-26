import { useEffect, useState } from 'react'
import Canvas from './components/Canvas'
import ChatPanel from './components/ChatPanel'
import { qiniuAIAPIService } from './services/api.service'
import { SUPPORTED_MODELS } from './services/api.types'
import './App.css'
import { Sparkles } from 'lucide-react'

function App() {
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [expandBtnTop, setExpandBtnTop] = useState<number>(72)

  useEffect(() => {
    const updatePos = () => {
      const toolbar = document.querySelector('.canvas-toolbar') as HTMLElement | null
      if (!toolbar) return
      const rect = toolbar.getBoundingClientRect()
      const btnH = 58
      setExpandBtnTop(rect.top + (rect.height - btnH) / 2)
    }
    updatePos()
    window.addEventListener('resize', updatePos)
    return () => window.removeEventListener('resize', updatePos)
  }, [isSidebarCollapsed])
  

  

  const handleGenerateImage = async (
    prompt: string,
    template?: string,
    modelId?: string,
    imageData?: string
  ): Promise<string[]> => {
    setIsGenerating(true)
    setSelectedTemplate(template || '')
    try {
      if (template === 'storyboard') {
        const scenePrompts = [
          `${prompt} - Scene 1: Opening shot with shoebox`,
          `${prompt} - Scene 2: Close-up of boombox interaction`,
          `${prompt} - Scene 3: Neighborhood walking scene`,
          `${prompt} - Scene 4: Bus stop flashback moment`,
          `${prompt} - Scene 5: College hostel contemplation`
        ]
        const results = await qiniuAIAPIService.generateBatchImages(scenePrompts, modelId)
        const filtered = results.filter(url => url !== '')
        setGeneratedImages(prev => [...prev, ...filtered])
        return filtered
      } else if (imageData) {
        const response = await qiniuAIAPIService.editImage({
          model: SUPPORTED_MODELS.IMAGE_TO_IMAGE,
          image: imageData,
          prompt,
          n: 1
        })
        if (response.images && response.images.length > 0) {
          const first = response.images[0]
          const imageUrl = first.url || (first.b64_json ? `data:image/png;base64,${first.b64_json}` : '')
          setGeneratedImages(prev => [...prev, imageUrl])
          return [imageUrl]
        }
        return []
      } else {
        const response = await qiniuAIAPIService.generateImage({
          model: modelId || SUPPORTED_MODELS.TEXT_TO_IMAGE,
          prompt,
          n: 1,
          response_format: 'url'
        })
        if (response.images && response.images.length > 0) {
          const first = response.images[0]
          const imageUrl = first.url || (first.b64_json ? `data:image/png;base64,${first.b64_json}` : '')
          setGeneratedImages(prev => [...prev, imageUrl])
          return [imageUrl]
        }
        return []
      }
    } catch (error) {
      const mockImage = `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square`
      setGeneratedImages(prev => [...prev, mockImage])
      return [mockImage]
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    setGeneratedImages(prev => prev.filter((_, i) => i !== index))
  }

  

  return (
    <div className={`app ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* 移动端菜单按钮 */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>
      {isSidebarCollapsed && (
        <button
          className="sidebar-toggle-btn"
          style={{ top: expandBtnTop }}
          onClick={() => setIsSidebarCollapsed(false)}
          aria-label="展开侧边栏"
          title='展开侧边栏'
        >
          <Sparkles size={23} />
        </button>
      )}
      
      <div className="app-container">
        <Canvas 
          images={generatedImages} 
          isGenerating={isGenerating}
          templateType={selectedTemplate}
          onRemoveImage={handleRemoveImage}
        />
        {!isSidebarCollapsed && (
          <ChatPanel 
            onGenerateImage={handleGenerateImage}
            isGenerating={isGenerating}
            isMobileMenuOpen={isMobileMenuOpen}
            onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            onCollapse={() => setIsSidebarCollapsed(true)}
          />
        )}
      </div>
      
    </div>
  )
}

export default App
