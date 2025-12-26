import React, { useRef, useState } from 'react'
import { ZoomIn, ZoomOut, Download, Grid3x3, Square, MoreHorizontal, Trash2, Move } from 'lucide-react'
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
  const [viewMode, setViewMode] = useState<'single' | 'grid' | 'free'>('single')
  const [menuOpenIndex, setMenuOpenIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [positions, setPositions] = useState<{ left: number; top: number }[]>([])
  const [dragging, setDragging] = useState<{ index: number; offsetX: number; offsetY: number; itemW: number; itemH: number } | null>(null)
  const lastShiftRef = useRef(false)
  type EdgeX = 'left' | 'center' | 'right'
  type EdgeY = 'top' | 'middle' | 'bottom'
  type GuideState = {
    v: number | null
    h: number | null
    vTop?: number
    hLeft?: number
    vDist?: number
    hDist?: number
    vItemEdge?: EdgeX
    hItemEdge?: EdgeY
    vTargetEdge?: EdgeX | 'center'
    hTargetEdge?: EdgeY | 'middle'
    vItemX?: number
    hItemY?: number
    vTargetFrom?: 'canvas' | 'item'
    hTargetFrom?: 'canvas' | 'item'
  }
  const [guides, setGuides] = useState<GuideState>({ v: null, h: null })
  const guideActiveRef = useRef(false)

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

  React.useEffect(() => {
    const singleWidthPx = Math.min(800, Math.max(200, Math.round(320 * (zoom / 100))))
    const gap = 24
    setPositions(prev => {
      const next = images.map((_, i) => prev[i] || {
        left: (i % 3) * (singleWidthPx + gap),
        top: Math.floor(i / 3) * (singleWidthPx + gap),
      })
      return next
    })
  }, [images, zoom])

  const onItemPointerDown = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
    if (viewMode !== 'free') return
    const container = containerRef.current
    if (!container) return
    const itemRect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const offsetX = e.clientX - itemRect.left
    const offsetY = e.clientY - itemRect.top
    setDragging({ index, offsetX, offsetY, itemW: itemRect.width, itemH: itemRect.height })
    const onMove = (evt: PointerEvent) => {
      const cr = container.getBoundingClientRect()
      let left = evt.clientX - cr.left - offsetX
      let top = evt.clientY - cr.top - offsetY
      left = Math.max(0, Math.min(left, cr.width - itemRect.width))
      top = Math.max(0, Math.min(top, cr.height - itemRect.height))
      lastShiftRef.current = !!evt.shiftKey

      let vGuide: number | null = null
      let hGuide: number | null = null
      let vLabelTop: number | undefined
      let hLabelLeft: number | undefined
      let vDist: number | undefined
      let hDist: number | undefined
      let vItemEdge: EdgeX | undefined
      let hItemEdge: EdgeY | undefined
      let vTargetEdge: EdgeX | 'center' | undefined
      let hTargetEdge: EdgeY | 'middle' | undefined
      let vItemX: number | undefined
      let hItemY: number | undefined
      let vTargetFrom: 'canvas' | 'item' | undefined
      let hTargetFrom: 'canvas' | 'item' | undefined
      let snapLeft = left
      let snapTop = top
      guideActiveRef.current = false
      if (!lastShiftRef.current) {
        const threshold = 8
        const items = Array.from(container.querySelectorAll('.draggable-item')) as HTMLDivElement[]
        const candidatesX: Array<{ pos: number; edge: EdgeX | 'center'; from: 'canvas' | 'item'; rect?: { left: number; top: number; width: number; height: number } }> = [
          { pos: cr.width / 2, edge: 'center', from: 'canvas' },
        ]
        const candidatesY: Array<{ pos: number; edge: EdgeY | 'middle'; from: 'canvas' | 'item'; rect?: { left: number; top: number; width: number; height: number } }> = [
          { pos: cr.height / 2, edge: 'middle', from: 'canvas' },
        ]
        for (let i = 0; i < items.length; i++) {
          if (i === index) continue
          const r = items[i].getBoundingClientRect()
          const rx = r.left - cr.left
          const ry = r.top - cr.top
          candidatesX.push(
            { pos: rx, edge: 'left', from: 'item', rect: { left: rx, top: ry, width: r.width, height: r.height } },
            { pos: rx + r.width / 2, edge: 'center', from: 'item', rect: { left: rx, top: ry, width: r.width, height: r.height } },
            { pos: rx + r.width, edge: 'right', from: 'item', rect: { left: rx, top: ry, width: r.width, height: r.height } },
          )
          candidatesY.push(
            { pos: ry, edge: 'top', from: 'item', rect: { left: rx, top: ry, width: r.width, height: r.height } },
            { pos: ry + r.height / 2, edge: 'middle', from: 'item', rect: { left: rx, top: ry, width: r.width, height: r.height } },
            { pos: ry + r.height, edge: 'bottom', from: 'item', rect: { left: rx, top: ry, width: r.width, height: r.height } },
          )
        }
        const trySnapX = (target: number, current: number) => {
          const diff = Math.abs(current - target)
          return diff <= threshold ? diff : Infinity
        }
        let bestX = Infinity
        let bestLeft = snapLeft
        for (const cx of candidatesX) {
          const d1 = trySnapX(cx.pos, left)
          if (d1 < bestX) { bestX = d1; bestLeft = cx.pos; vGuide = cx.pos; vItemEdge = 'left'; vTargetEdge = cx.edge; vTargetFrom = cx.from; vItemX = left }
          const centerX = left + itemRect.width / 2
          const d2 = trySnapX(cx.pos, centerX)
          if (d2 < bestX) { bestX = d2; bestLeft = cx.pos - itemRect.width / 2; vGuide = cx.pos; vItemEdge = 'center'; vTargetEdge = cx.edge; vTargetFrom = cx.from; vItemX = centerX }
          const rightX = left + itemRect.width
          const d3 = trySnapX(cx.pos, rightX)
          if (d3 < bestX) { bestX = d3; bestLeft = cx.pos - itemRect.width; vGuide = cx.pos; vItemEdge = 'right'; vTargetEdge = cx.edge; vTargetFrom = cx.from; vItemX = rightX }
        }
        if (bestX !== Infinity) {
          snapLeft = Math.max(0, Math.min(bestLeft, cr.width - itemRect.width))
          guideActiveRef.current = true
          vLabelTop = top + itemRect.height / 2
          vDist = Math.round(bestX)
        }
        let bestY = Infinity
        let bestTop = snapTop
        for (const cy of candidatesY) {
          const d1 = trySnapX(cy.pos, top)
          if (d1 < bestY) { bestY = d1; bestTop = cy.pos; hGuide = cy.pos; hItemEdge = 'top'; hTargetEdge = cy.edge; hTargetFrom = cy.from; hItemY = top }
          const centerY = top + itemRect.height / 2
          const d2 = trySnapX(cy.pos, centerY)
          if (d2 < bestY) { bestY = d2; bestTop = cy.pos - itemRect.height / 2; hGuide = cy.pos; hItemEdge = 'middle'; hTargetEdge = cy.edge; hTargetFrom = cy.from; hItemY = centerY }
          const bottomY = top + itemRect.height
          const d3 = trySnapX(cy.pos, bottomY)
          if (d3 < bestY) { bestY = d3; bestTop = cy.pos - itemRect.height; hGuide = cy.pos; hItemEdge = 'bottom'; hTargetEdge = cy.edge; hTargetFrom = cy.from; hItemY = bottomY }
        }
        if (bestY !== Infinity) {
          snapTop = Math.max(0, Math.min(bestTop, cr.height - itemRect.height))
          guideActiveRef.current = true
          hLabelLeft = left + itemRect.width / 2
          hDist = Math.round(bestY)
        }
      }
      setGuides({ v: vGuide, h: hGuide, vTop: vLabelTop, hLeft: hLabelLeft, vDist, hDist, vItemEdge, hItemEdge, vTargetEdge, hTargetEdge, vItemX, hItemY, vTargetFrom, hTargetFrom })
      setPositions(prev => {
        const next = [...prev]
        next[index] = { left: snapLeft, top: snapTop }
        return next
      })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setGuides({ v: null, h: null })
      setPositions(prev => {
        const next = [...prev]
        const cur = next[index]
        if (cur) {
          if (!lastShiftRef.current && !guideActiveRef.current) {
            const grid = 24
            next[index] = {
              left: Math.round(cur.left / grid) * grid,
              top: Math.round(cur.top / grid) * grid,
            }
          }
        }
        return next
      })
      setDragging(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const onFreeImageDoubleClick = (e: React.MouseEvent<HTMLImageElement>) => {
    e.stopPropagation()
    const img = e.currentTarget
    const wrap = img.parentElement as HTMLDivElement | null
    if (wrap) {
      const rect = wrap.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const ripple = document.createElement('span')
      ripple.className = 'dbl-ripple'
      ripple.style.left = `${x - 16}px`
      ripple.style.top = `${y - 16}px`
      ripple.style.width = `32px`
      ripple.style.height = `32px`
      wrap.appendChild(ripple)
      setTimeout(() => { try { wrap.removeChild(ripple) } catch {} }, 600)
    }
    setTimeout(() => openByElement(img), 80)
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
          <button title="单图模式"
            className={`toolbar-btn ${viewMode === 'single' ? 'active' : ''}`}
            onClick={() => setViewMode('single')}
          >
            <Square size={16} />
          </button>
          <button title="网格模式"
            className={`toolbar-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 size={16} />
          </button>
          <button title="自由模式"
            className={`toolbar-btn ${viewMode === 'free' ? 'active' : ''}`}
            onClick={() => setViewMode('free')}
          >
            <Move size={16} />
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
            viewMode === 'free' ? (
              <div ref={containerRef} className="free-canvas" onClick={() => setMenuOpenIndex(null)}>
                {guides.v !== null && <div className="guide-line-v" style={{ left: guides.v }} />}
                {guides.h !== null && <div className="guide-line-h" style={{ top: guides.h }} />}
                {guides.v !== null && guides.vTop !== undefined && guides.vDist !== undefined && guides.vItemX !== undefined && (
                  <>
                    <div className="guide-connector-v" style={{ top: guides.vTop, left: Math.min(guides.vItemX, guides.v), width: Math.abs((guides.v as number) - guides.vItemX) }} />
                    <div className="guide-label guide-label-v" style={{ left: (guides.v as number) + 6, top: guides.vTop }}>
                      {guides.vItemEdge === 'left' ? '左' : guides.vItemEdge === 'center' ? '中' : '右'} → {(guides.vTargetFrom === 'canvas' && guides.vTargetEdge === 'center') ? '画布中' : (guides.vTargetEdge === 'left' ? '左' : guides.vTargetEdge === 'center' ? '中' : '右')} {guides.vDist}px
                    </div>
                  </>
                )}
                {guides.h !== null && guides.hLeft !== undefined && guides.hDist !== undefined && guides.hItemY !== undefined && (
                  <>
                    <div className="guide-connector-h" style={{ left: guides.hLeft, top: Math.min(guides.hItemY, guides.h), height: Math.abs((guides.h as number) - guides.hItemY) }} />
                    <div className="guide-label guide-label-h" style={{ top: (guides.h as number) + 6, left: guides.hLeft }}>
                      {guides.hItemEdge === 'top' ? '上' : guides.hItemEdge === 'middle' ? '中' : '下'} → {(guides.hTargetFrom === 'canvas' && guides.hTargetEdge === 'middle') ? '画布中' : (guides.hTargetEdge === 'top' ? '上' : guides.hTargetEdge === 'middle' ? '中' : '下')} {guides.hDist}px
                    </div>
                  </>
                )}
                {images.map((image, index) => {
                  const singleWidthPx = Math.min(800, Math.max(200, Math.round(240 * (zoom / 100))))
                  const pos = positions[index] || { left: 0, top: 0 }
                  return (
                    <div
                      key={index}
                      className="image-item draggable-item"
                      style={{ left: pos.left, top: pos.top, width: `${singleWidthPx}px`, height: `${singleWidthPx}px` }}
                      onPointerDown={(e) => onItemPointerDown(e, index)}
                    >
                      <img
                        src={image}
                        alt={`Generated ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onClickCapture={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDoubleClick={onFreeImageDoubleClick}
                      />
                      <div className={`image-overlay ${menuOpenIndex === index ? 'open' : ''}`}>
                        
                        <button
                          className="menu-btn"
                          onPointerDown={(e) => e.stopPropagation()}
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
                      <div className="dbl-hint">双击预览</div>
                    </div>
                  )
                })}
                {isGenerating && (
                  <div className="generating-placeholder">
                    <div className="generating-spinner"></div>
                    <span>渲染中...</span>
                  </div>
                )}
              </div>
            ) : (
              <div
                ref={containerRef}
                className={`image-container ${viewMode === 'grid' ? 'grid-view' : 'single-view'}`}
                style={viewMode === 'grid' ? {
                  gridTemplateColumns: `repeat(auto-fit, minmax(${Math.min(400, Math.max(120, Math.round(200 * (zoom / 100))))}px, 1fr))`
                } : undefined}
                onClick={() => setMenuOpenIndex(null)}
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
                      onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                      onClickCapture={(e) => { e.preventDefault(); e.stopPropagation() }}
                      onDoubleClick={(e) => openByElement(e.currentTarget)}
                    />
                    <div className="dbl-hint">双击预览</div>
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
          )
        )}
      </div>
    </div>
  )
}

export default Canvas
