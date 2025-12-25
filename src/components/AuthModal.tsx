import React, { useState } from 'react'
import { X } from 'lucide-react'
import './AuthModal.css'

interface AuthModalProps {
  onClose: () => void
  onLogin: (email: string, password: string) => Promise<any> | any
  onRegister: (email: string, username: string, password: string) => Promise<any> | any
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin, onRegister }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await onLogin(email.trim(), password)
      } else {
        await onRegister(email.trim(), username.trim(), password)
      }
    } catch (err: any) {
      setError(err?.message || '操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h3>{mode === 'login' ? '登录' : '注册'}</h3>
          <button className="close-btn" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <div className="auth-switch">
          <button
            className={`switch-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >登录</button>
          <button
            className={`switch-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >注册</button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              required
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label>用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>

          <button className={`submit-btn ${loading ? 'loading' : ''}`} type="submit" disabled={loading}>
            {loading ? '处理中…' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AuthModal

