/**
 * ActionItemsTab - Kanban board with drag-and-drop for action items
 * Uses @dnd-kit/core for drag-and-drop context and DragOverlay
 * Client-side state management (not persisted to disk for demo)
 */

'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import type { ActionItem } from '@/lib/types/account-plan'
import { KanbanColumn } from './kanban-column'
import { ActionCard } from './action-card'

interface ActionItemsTabProps {
  initialActions: ActionItem[]
}

export function ActionItemsTab({ initialActions }: ActionItemsTabProps) {
  const [actions, setActions] = useState<ActionItem[]>(initialActions)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Get the currently dragged action for DragOverlay
  const activeAction = activeId ? actions.find((a) => a.id === activeId) : null

  // Group actions by status
  const todoActions = actions.filter((a) => a.status === 'todo')
  const inProgressActions = actions.filter((a) => a.status === 'in-progress')
  const doneActions = actions.filter((a) => a.status === 'done')

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  // Handle drag end - update action status
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    // Determine which column the card was dropped on
    // over.id could be:
    // 1. A column droppable id ('todo', 'in-progress', 'done')
    // 2. Another action card id (in which case, find its column)
    let newStatus: 'todo' | 'in-progress' | 'done' | null = null

    if (over.id === 'todo' || over.id === 'in-progress' || over.id === 'done') {
      // Dropped on column droppable
      newStatus = over.id as 'todo' | 'in-progress' | 'done'
    } else {
      // Dropped on another card - find that card's status
      const overAction = actions.find((a) => a.id === over.id)
      if (overAction) {
        newStatus = overAction.status
      }
    }

    if (newStatus && active.id !== over.id) {
      // Update the dragged action's status
      setActions((prev) =>
        prev.map((action) =>
          action.id === active.id ? { ...action, status: newStatus } : action
        )
      )
    }

    setActiveId(null)
  }

  // Handle drag cancel
  const handleDragCancel = () => {
    setActiveId(null)
  }

  // Handle quick add - create new action item
  const handleQuickAdd = (title: string, status: string) => {
    const newAction: ActionItem = {
      id: crypto.randomUUID(),
      title,
      status: status as 'todo' | 'in-progress' | 'done',
      priority: 'medium',
      createdAt: new Date().toISOString(),
    }

    setActions((prev) => [...prev, newAction])
  }

  // Calculate statistics
  const totalCount = actions.length
  const highCount = actions.filter((a) => a.priority === 'high').length
  const mediumCount = actions.filter((a) => a.priority === 'medium').length
  const lowCount = actions.filter((a) => a.priority === 'low').length

  return (
    <div className="space-y-6">
      {/* Empty state */}
      {actions.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <p className="text-slate-600 mb-2">No action items yet</p>
          <p className="text-sm text-slate-500">Create your first action using the form below</p>
        </div>
      )}

      {/* Kanban board */}
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid md:grid-cols-3 gap-6">
          <KanbanColumn
            id="todo"
            title="To Do"
            actions={todoActions}
            onQuickAdd={handleQuickAdd}
          />
          <KanbanColumn
            id="in-progress"
            title="In Progress"
            actions={inProgressActions}
            onQuickAdd={handleQuickAdd}
          />
          <KanbanColumn id="done" title="Done" actions={doneActions} onQuickAdd={handleQuickAdd} />
        </div>

        {/* DragOverlay - floating preview while dragging */}
        <DragOverlay>{activeAction && <ActionCard action={activeAction} isDragging />}</DragOverlay>
      </DndContext>

      {/* Summary bar */}
      {actions.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">Total:</span>
            <span className="text-slate-900">{totalCount} items</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">Priority:</span>
            <span className="text-red-700">{highCount} High</span>
            <span className="text-slate-400">•</span>
            <span className="text-yellow-700">{mediumCount} Medium</span>
            <span className="text-slate-400">•</span>
            <span className="text-green-700">{lowCount} Low</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">Status:</span>
            <span className="text-slate-900">{todoActions.length} To Do</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-900">{inProgressActions.length} In Progress</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-900">{doneActions.length} Done</span>
          </div>
        </div>
      )}
    </div>
  )
}
