'use client';

import React, { useState } from 'react';
import type { Recommendation, Priority } from '../types';
import { useDialogFocus } from './use-dialog-focus';

interface AcceptRecommendationModalProps {
  recommendation: Recommendation;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (actionItem: {
    assignedTo: string;
    dueDate: Date;
    priority: Priority;
    board: string;
    notes?: string;
  }) => void;
}

const labelClass = 'mb-1 block text-sm font-medium';

export default function AcceptRecommendationModal({
  recommendation,
  isOpen,
  onClose,
  onSubmit
}: AcceptRecommendationModalProps) {
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('high');
  const [board, setBoard] = useState('');
  const [notes, setNotes] = useState('');
  const dialogRef = useDialogFocus<HTMLDivElement>(isOpen, onClose);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      assignedTo,
      dueDate: new Date(dueDate),
      priority,
      board,
      notes: notes || undefined
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ background: 'color-mix(in oklch, var(--ink) 40%, transparent)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="accept-modal-title"
        aria-describedby="accept-modal-desc"
        className="flex w-full max-w-[600px] flex-col overflow-hidden"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div className="border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
          <h2 id="accept-modal-title" className="m-0 text-base font-semibold">
            Create action item
          </h2>
          <p id="accept-modal-desc" className="m-0 mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
            {recommendation.title}
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col" style={{ minHeight: 0 }}>
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {/* Recommendation Summary */}
            <div className="p-3" style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{recommendation.accountName}</span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>{recommendation.businessUnit}</span>
              </div>
              <p className="m-0 text-xs" style={{ color: 'var(--ink-2)' }}>
                {recommendation.description}
              </p>
            </div>

            {/* Assign To */}
            <div>
              <label htmlFor="assignedTo" className={labelClass}>Assign to</label>
              <select
                id="assignedTo"
                className="input"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                required
              >
                <option value="">Select a team</option>
                <option value="Engineering">Engineering</option>
                <option value="Account Manager">Account Manager</option>
                <option value="Product">Product</option>
                <option value="Pricing">Pricing</option>
                <option value="Customer Success">Customer Success</option>
                <option value="Sales">Sales</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="dueDate" className={labelClass}>Due date</label>
              <input
                id="dueDate"
                type="date"
                className="input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                aria-describedby="dueDate-hint"
              />
              <p id="dueDate-hint" className="m-0 mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                Suggested timeline: {recommendation.timeline}
              </p>
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className={labelClass}>Priority</label>
              <select
                id="priority"
                className="input"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                required
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Add to Board */}
            <div>
              <label htmlFor="board" className={labelClass}>Add to board</label>
              <select
                id="board"
                className="input"
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                required
              >
                <option value="">Select a board</option>
                <option value="Account Plan Actions">Account Plan Actions</option>
                <option value="Engineering Backlog">Engineering Backlog</option>
                <option value="Product Roadmap">Product Roadmap</option>
                <option value="Pricing Review">Pricing Review</option>
                <option value="CS Initiatives">CS Initiatives</option>
              </select>
            </div>

            {/* Notes (Optional) */}
            <div>
              <label htmlFor="notes" className={labelClass}>
                Notes <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                id="notes"
                className="input"
                style={{ height: 'auto', padding: '0.5rem 0.75rem' }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional context or instructions"
                rows={4}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t px-5 py-3" style={{ borderColor: 'var(--border)' }}>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!assignedTo || !dueDate || !board}
            >
              Create action
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
