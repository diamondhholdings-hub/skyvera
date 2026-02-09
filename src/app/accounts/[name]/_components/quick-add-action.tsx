/**
 * QuickAddAction - Inline action creation form for Kanban columns
 * Default state: dashed border button
 * Clicked state: input + Add/Cancel buttons
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Check, X } from 'lucide-react'

interface QuickAddActionProps {
  columnStatus: string
  onAdd: (title: string) => void
}

export function QuickAddAction({ columnStatus, onAdd }: QuickAddActionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when entering add mode
  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAdding])

  const handleAdd = () => {
    if (title.trim()) {
      onAdd(title.trim())
      setTitle('')
      // Stay in add mode for next item
    }
  }

  const handleCancel = () => {
    setTitle('')
    setIsAdding(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="w-full text-sm text-slate-600 border-2 border-dashed border-slate-300 rounded p-2 hover:border-slate-400 hover:text-slate-800 transition-colors flex items-center justify-center gap-1"
      >
        <Plus size={14} />
        <span>Add action</span>
      </button>
    )
  }

  return (
    <div className="bg-white rounded shadow p-2 space-y-2">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Action title..."
        className="w-full text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          disabled={!title.trim()}
          className="flex-1 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-1"
        >
          <Check size={12} />
          <span>Add</span>
        </button>
        <button
          onClick={handleCancel}
          className="flex-1 bg-slate-200 text-slate-700 text-xs font-medium px-2 py-1 rounded hover:bg-slate-300 flex items-center justify-center gap-1"
        >
          <X size={12} />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  )
}
