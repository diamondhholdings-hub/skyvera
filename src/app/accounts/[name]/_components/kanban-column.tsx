/**
 * KanbanColumn - Droppable column with sortable context for action items
 * Uses @dnd-kit/sortable for vertical list sorting
 * Uses @dnd-kit/core useDroppable so cards can be dropped into empty columns
 */

'use client'

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import type { ActionItem } from '@/lib/types/account-plan'
import { SortableActionCard } from './action-card'
import { QuickAddAction } from './quick-add-action'

interface KanbanColumnProps {
  id: string // Column status: 'todo' | 'in-progress' | 'done'
  title: string
  actions: ActionItem[]
  onQuickAdd: (title: string, status: string) => void
}

export function KanbanColumn({ id, title, actions, onQuickAdd }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div ref={setNodeRef} className="bg-highlight/20 p-4 rounded-lg min-h-[200px] border border-[var(--border)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg font-semibold text-secondary">{title}</h3>
        <span className="text-sm text-muted">
          {actions.length} {actions.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Quick add form */}
      <div className="mb-3">
        <QuickAddAction columnStatus={id} onAdd={(title) => onQuickAdd(title, id)} />
      </div>

      {/* Sortable action cards */}
      <SortableContext items={actions.map((a) => a.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {actions.map((action) => (
            <SortableActionCard key={action.id} action={action} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
