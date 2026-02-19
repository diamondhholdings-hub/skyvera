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
import type { ActionItem, Stakeholder } from '@/lib/types/account-plan'
import { KanbanColumn } from './kanban-column'
import { ActionCard } from './action-card'

interface ActionItemsTabProps {
  initialActions: ActionItem[]
  stakeholders?: Stakeholder[]
}

export function ActionItemsTab({ initialActions, stakeholders = [] }: ActionItemsTabProps) {
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
        <div className="text-center py-12 bg-[var(--highlight)] rounded-lg border border-[var(--border)]">
          <p className="text-[var(--muted)] mb-2">No action items yet</p>
          <p className="text-sm text-[var(--muted)]">Create your first action using the form below</p>
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
        <div className="bg-highlight/30 rounded-lg p-4 flex flex-wrap gap-4 text-sm border border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="font-medium text-muted">Total:</span>
            <span className="text-ink font-semibold">{totalCount} items</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-muted">Priority:</span>
            <span className="text-[#c62828] font-medium">{highCount} High</span>
            <span className="text-muted/50">•</span>
            <span className="text-[#e65100] font-medium">{mediumCount} Medium</span>
            <span className="text-muted/50">•</span>
            <span className="text-[#2e7d32] font-medium">{lowCount} Low</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-muted">Status:</span>
            <span className="text-ink">{todoActions.length} To Do</span>
            <span className="text-muted/50">•</span>
            <span className="text-ink">{inProgressActions.length} In Progress</span>
            <span className="text-muted/50">•</span>
            <span className="text-ink">{doneActions.length} Done</span>
          </div>
        </div>
      )}

      {/* W1-P2-006: Key Messages by Stakeholder */}
      {stakeholders && stakeholders.length > 0 && (
        <div className="mt-8">
          <h3 className="font-display text-xl text-[var(--secondary)] mb-4">Key Messages by Stakeholder</h3>
          <div className="grid grid-cols-2 gap-4">
            {stakeholders.slice(0, 4).map((s) => (
              <div
                key={s.id}
                className="p-6 bg-[var(--highlight)] border-l-[3px] border-[var(--accent)] rounded-r-lg"
              >
                <h4 className="font-display font-semibold text-[var(--secondary)] mb-2">
                  To {s.name} ({s.role})
                </h4>
                <p className="text-sm text-[var(--ink)]">
                  {`Focus on ${s.name}'s strategic priorities and demonstrate CloudSense's value in addressing their key challenges.`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* W1-P2-007: Escalation Triggers */}
      <div className="mt-6 border-l-4 border-[var(--critical)] bg-[var(--paper)] rounded-r-lg p-6 shadow-sm">
        <h3 className="font-display font-semibold text-[var(--ink)] mb-2">
          ⚠ Escalation Triggers to Skyvera Leadership
        </h3>
        <p className="text-sm text-[var(--muted)] mb-3">
          Escalate immediately if any of the following occur:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--ink)]">
          <li>Contract renewal discussions stall or customer requests pricing concessions {`>`} 20%</li>
          <li>Key champion or executive sponsor departs the organization</li>
          <li>Customer escalates a support issue to their C-suite</li>
          <li>Competitive POC or RFP initiated without Skyvera involvement</li>
          <li>Health score drops below 6.0 or transitions to red status</li>
          <li>Invoice payment overdue {`>`} 60 days</li>
        </ul>
      </div>
    </div>
  )
}
