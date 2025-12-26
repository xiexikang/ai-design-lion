import React, { useRef } from 'react'
import './Storyboard.css'
import { useViewer } from '../hooks/useViewer'

interface StoryboardProps {
  images: string[]
  isGenerating: boolean
  script?: {
    scenes: Array<{
      time: string
      description: string
      visual: string
    }>
  }
}

const Storyboard: React.FC<StoryboardProps> = ({ images, isGenerating, script }) => {
  const defaultScenes = [
    { time: "[0–5s]", description: "Scene 1", visual: "Opening scene" },
    { time: "[5–10s]", description: "Scene 2", visual: "Development" },
    { time: "[10–15s]", description: "Scene 3", visual: "Climax" },
    { time: "[15–20s]", description: "Scene 4", visual: "Resolution" },
    { time: "[20–25s]", description: "Scene 5", visual: "Ending" }
  ]

  const scenes = script?.scenes || defaultScenes
  const framesRef = useRef<HTMLDivElement>(null)

  const { openByElement } = useViewer(framesRef)

  return (
    <div className="storyboard">
      <div className="storyboard-header">
        <h3>Story Board 故事板</h3>
        {script && (
          <div className="script-info">
            <span className="script-title">{script.scenes[0]?.description || 'Narrative Script'}</span>
          </div>
        )}
      </div>
      
      <div ref={framesRef} className="storyboard-frames">
        {scenes.map((scene, index) => (
          <div key={index} className="storyboard-frame">
            <div className="frame-header">
              <span className="frame-time">{scene.time}</span>
              <span className="frame-description">{scene.description}</span>
            </div>
            
            <div className="frame-content">
              {images[index] ? (
                <div className="image-item" style={{ width: '100%', height: '100%' }}>
                  <img 
                    src={images[index]} 
                    alt={`Frame ${index + 1}`}
                    className="frame-image"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                    onClickCapture={(e) => { e.preventDefault(); e.stopPropagation() }}
                    onDoubleClick={(e) => openByElement(e.currentTarget)}
                  />
                  <div className="dbl-hint">双击预览</div>
                </div>
              ) : isGenerating ? (
                <div className="frame-generating">
                  <div className="generating-indicator">
                    <div className="generating-spinner"></div>
                    <span>渲染中...</span>
                  </div>
                </div>
              ) : (
                <div className="frame-placeholder">
                  <div className="placeholder-icon">🎬</div>
                  <span>{scene.visual}</span>
                </div>
              )}
            </div>
            
            <div className="frame-footer">
              <span className="frame-visual">{scene.visual}</span>
            </div>
          </div>
        ))}
      </div>
      
      {script && (
        <div className="script-details">
          <h4>Narrative (Full VO / captions):</h4>
          <div className="script-scenes">
            {script.scenes.map((scene, index) => (
              <div key={index} className="script-scene">
                <span className="scene-time">{scene.time}</span>
                <p className="scene-description">{scene.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Storyboard
