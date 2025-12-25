import React, { useEffect, useRef, useState } from 'react'

export interface DropdownOption {
  id: string
  name: string
}

interface DropdownProps {
  value: string
  options: DropdownOption[]
  onChange: (id: string) => void
  className?: string
  placeholder?: string
}

const Dropdown: React.FC<DropdownProps> = ({ value, options, onChange, className, placeholder }) => {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const current = options.find(o => o.id === value)

  return (
    <div className={`dropdown ${open ? 'open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`dropdown-trigger ${className || ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
          if (e.key === 'Enter' || e.key === ' ') setOpen(prev => !prev)
        }}
      >
        <span className="dropdown-label">
          {current?.name || placeholder || '请选择'}
        </span>
        <span className="dropdown-arrow" />
      </button>

      {open && (
        <div ref={menuRef} className="dropdown-menu" role="listbox">
          {options.map(opt => (
            <div
              key={opt.id}
              role="option"
              aria-selected={opt.id === value}
              className={`dropdown-option ${opt.id === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.id)
                setOpen(false)
              }}
            >
              {opt.name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dropdown
