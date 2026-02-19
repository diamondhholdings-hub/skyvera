/**
 * ActionCard - Draggable card for action items in Kanban board
 * Two exports: ActionCard (for DragOverlay) and SortableActionCard (wrapped with useSortable)
 * WCAG 2.2 Level AA: Priority badges use color + icon + text + aria-label
 */

'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlertCircle, Minus, CheckCircle, User, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import type { ActionItem } from '@/lib/types/account-plan'

interface ActionCardProps {
  action: ActionItem
  isDragging?: boolean
}

/**
 * ActionCard - Base card component for action items
 */
export function ActionCard({ action, isDragging }: ActionCardProps) {
  const isPastDue = action.dueDate && new Date(action.dueDate) < new Date()

  const isDone = action.status === 'done'

  return (
    <div
      className={`bg-white border border-[var(--border)] p-4 rounded shadow-sm cursor-move ${
        isDragging ? 'opacity-50' : ''
      } ${isDone ? 'opacity-60 border-l-4 border-l-[var(--success)]' : 'border-l-4 border-l-[var(--accent)]'}`}
    >
      {/* Top row: title + priority badge */}
      <div className="flex items-start gap-2 mb-2">
        <div className="font-medium text-sm flex-1 text-ink">{action.title}</div>
        <PriorityBadge priority={action.priority} />
      </div>

      {/* Owner line */}
      {action.owner && (
        <div className="flex items-center gap-1 text-xs text-muted mb-1">
          <User size={12} />
          <span>{action.owner}</span>
        </div>
      )}

      {/* Due date line */}
      {action.dueDate && (
        <div className="flex items-center gap-1 text-xs text-muted">
          <Calendar size={12} />
          <span className={isPastDue ? 'text-critical font-medium' : ''}>
            {format(new Date(action.dueDate), 'MMM d, yyyy')}
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * PriorityBadge - Accessible priority indicator with color + icon + text
 */
function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const config = {
    high: {
      className: 'bg-critical/20 text-[#c62828]',
      icon: AlertCircle,
      label: 'High',
    },
    medium: {
      className: 'bg-warning/20 text-[#e65100]',
      icon: Minus,
      label: 'Medium',
    },
    low: {
      className: 'bg-success/20 text-[#2e7d32]',
      icon: CheckCircle,
      label: 'Low',
    },
  }

  const { className, icon: Icon, label } = config[priority]

  return (
    <span
      className={`${className} px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1`}
      aria-label={`Priority: ${label}`}
    >
      <Icon size={12} />
      <span>{label}</span>
    </span>
  )
}

/**
 * SortableActionCard - Wraps ActionCard with useSortable for drag-and-drop
 */
export function SortableActionCard({ action }: { action: ActionItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: action.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ActionCard action={action} isDragging={isDragging} />
    </div>
  )
}
