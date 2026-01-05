import { useEffect, useState } from 'react'
import './ApiKeyModal.css'
import { qiniuAIAPIService } from '../services/api.service'

type Props = {
  open: boolean
  onClose: () => void
}

function ApiKeyModal({ open, onClose }: Props) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setValue('')
      setError('')
    }
  }, [open])

  if (!open) return null

  const handleSave = async () => {
    const v = value.trim()
    if (!v) {
      setError('请输入密钥')
      return
    }
    try {
      await qiniuAIAPIService.setApiKey(v)
      window.dispatchEvent(new CustomEvent('api-error', { detail: { message: '密钥保存成功', type: 'success', source: 'qiniu' } }))
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    }
  }

  return (
    <div className="akm-overlay">
      <div className="akm-modal">
        <div className="akm-title">设置七牛云密钥</div>
        <div className="akm-desc">请填写用于调用七牛云接口的密钥</div>
        <div className="akm-desc"><a href="https://s.qiniu.com/FbMvqa" target="_blank" rel="noopener noreferrer">点击免费获取</a></div>
        <input
          className="akm-input"
          type="password"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="请输入密钥"
        />
        {error && <div className="akm-error">{error}</div>}
        <div className="akm-actions">
          <button className="akm-btn akm-secondary" onClick={onClose}>取消</button>
          <button className="akm-btn" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  )
}

export default ApiKeyModal

