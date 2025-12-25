import React, { useRef, useState } from 'react'
import { ZoomIn, ZoomOut, Download, Grid3x3, Square, MoreHorizontal, Trash2 } from 'lucide-react'
import Storyboard from './Storyboard'
import './Canvas.css'
import { useViewer } from '../hooks/useViewer'
import logoImg from '@/assets/logo.png'
import emptyImg from '@/assets/des-img.webp'

interface CanvasProps {
  images: string[]
  isGenerating: boolean
  templateType?: string
  onRemoveImage?: (index: number) => void
}

const Canvas: React.FC<CanvasProps> = ({ images, isGenerating, templateType, onRemoveImage }) => {
  const [zoom, setZoom] = useState(25)
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single')
  const [menuOpenIndex, setMenuOpenIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { openByElement } = useViewer(containerRef)

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25))
  }

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `generated-image-${index + 1}.png`
    link.click()
  }

  return (
    <div className="canvas">
      {/* 顶部工具栏 */}
      <div className="canvas-toolbar" >
        <div className="toolbar-left">
          <h1>
            <img src={logoImg} alt="logo" className="logo-image" />
            <span>AI设计狮</span>
          </h1>
        </div>
        <div className="toolbar-right">
          <button 
            className={`toolbar-btn ${viewMode === 'single' ? 'active' : ''}`}
            onClick={() => setViewMode('single')}
          >
            <Square size={16} />
          </button>
          <button 
            className={`toolbar-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 size={16} />
          </button>
          <button className="toolbar-btn toolbar-text-btn" onClick={handleZoomOut}>-</button>
          <span className="zoom-label">{zoom}%</span>
          <button className="toolbar-btn toolbar-text-btn" onClick={handleZoomIn}>+</button>
        </div>
      </div>

      {/* 画布内容区域 */}
      <div className="canvas-content">
        {images.length === 0 ? (
          <div className="empty-canvas">
            <div className="empty-placeholder">
              <img src={emptyImg} alt="empty" className="empty-image" />
              <p>开始创建你的设计</p>
              <span>在右侧面板输入你的设计需求</span>
            </div>
          </div>
        ) : (
          templateType === 'storyboard' ? (
            <Storyboard 
              images={images}
              isGenerating={isGenerating}
              script={{
                scenes: [
                  { time: "[0–5s]", description: "She found his voice in a shoebox", visual: "Static shot: an old Converse shoebox opens" },
                  { time: "[5–10s]", description: "Some memories don't fade", visual: "Close-up: Jaya slips a tape into a boombox" },
                  { time: "[10–15s]", description: "Her name is Jaya", visual: "She walks through an old colony neighborhood" },
                  { time: "[15–20s]", description: "They used to trade mixtapes", visual: "Flashback-style: two teens at a bus stop" },
                  { time: "[20–25s]", description: "Then life got louder", visual: "Jaya in her college hostel" }
                ]
              }}
            />
          ) : (
            <div
              ref={containerRef}
              className={`image-container ${viewMode === 'grid' ? 'grid-view' : 'single-view'}`}
              style={viewMode === 'grid' ? {
                gridTemplateColumns: `repeat(auto-fit, minmax(${Math.min(400, Math.max(120, Math.round(200 * (zoom / 100))))}px, 1fr))`
              } : undefined}
            >
              {images.map((image, index) => {
                const singleWidthPx = Math.min(800, Math.max(200, Math.round(320 * (zoom / 100))))
                return (
                <div key={index} className="image-item" style={{ width: viewMode === 'grid' ? 'auto' : `${singleWidthPx}px` }}>
                  <img 
                    src={image} 
                    alt={`Generated ${index + 1}`}
                    style={{ 
                      width: '100%',
                      height: 'auto'
                    }}
                    onClick={(e) => openByElement(e.currentTarget)}
                  />
                  <div className={`image-overlay ${menuOpenIndex === index ? 'open' : ''}`}>
                    <button 
                      className="menu-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpenIndex(menuOpenIndex === index ? null : index)
                      }}
                      aria-haspopup="true"
                      aria-expanded={menuOpenIndex === index}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {menuOpenIndex === index && (
                      <div className="image-menu">
                        <button className="image-menu-item" onClick={() => { setMenuOpenIndex(null); handleDownload(image, index) }}>
                          <Download size={16} />
                          <span>下载图片</span>
                        </button>
                        <button className="image-menu-item danger" onClick={() => { setMenuOpenIndex(null); onRemoveImage?.(index) }}>
                          <Trash2 size={16} />
                          <span>删除图片</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )})}
              {isGenerating && (
                <div className="generating-placeholder">
                  <div className="generating-spinner"></div>
                  <span>渲染中...</span>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default Canvas
