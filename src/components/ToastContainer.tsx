import { useEffect, useState } from 'react'
import './Toast.css'

type ToastItem = {
  id: number
  type: 'error' | 'success' | 'info'
  text: string
}

function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {}
      const text = detail.message || '请求异常'
      const type = (detail.type as ToastItem['type']) || 'error'
      const id = Date.now() + Math.random()
      setToasts(prev => [...prev, { id, type, text }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 4000)
    }
    window.addEventListener('api-error', handler as EventListener)
    return () => window.removeEventListener('api-error', handler as EventListener)
  }, [])

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}

export default ToastContainer

