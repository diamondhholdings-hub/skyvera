'use client';

import React, { useState } from 'react';
import type { Recommendation, Priority } from '../types';
import '../styles.css';

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
      className="dm-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--space-lg)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="dm-modal"
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          className="dm-modal-header"
          style={{
            padding: 'var(--space-lg)',
            borderBottom: '1px solid var(--border)'
          }}
        >
          <h2 className="dm-h3" style={{ margin: 0, marginBottom: 'var(--space-xs)' }}>
            ✓ Create Action Item
          </h2>
          <p className="dm-body-sm" style={{ color: 'var(--text-light)', margin: 0 }}>
            {recommendation.title}
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div
            className="dm-modal-body"
            style={{
              padding: 'var(--space-lg)',
              overflowY: 'auto',
              flex: 1
            }}
          >
            {/* Recommendation Summary */}
            <div
              style={{
                background: 'var(--background)',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--space-lg)'
              }}
            >
              <div className="dm-flex dm-justify-between dm-mb-sm">
                <span className="dm-body-sm" style={{ fontWeight: 600 }}>
                  {recommendation.accountName}
                </span>
                <span className="dm-badge-info">
                  {recommendation.businessUnit}
                </span>
              </div>
              <p className="dm-caption" style={{ margin: 0 }}>
                {recommendation.description}
              </p>
            </div>

            {/* Assign To */}
            <div className="dm-form-group">
              <label htmlFor="assignedTo" className="dm-form-label">
                Assign To *
              </label>
              <select
                id="assignedTo"
                className="dm-form-select"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                required
              >
                <option value="">Select a team...</option>
                <option value="Engineering">Engineering</option>
                <option value="Account Manager">Account Manager</option>
                <option value="Product">Product</option>
                <option value="Pricing">Pricing</option>
                <option value="Customer Success">Customer Success</option>
                <option value="Sales">Sales</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="dm-form-group">
              <label htmlFor="dueDate" className="dm-form-label">
                Due Date *
              </label>
              <input
                id="dueDate"
                type="date"
                className="dm-form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              <p className="dm-caption" style={{ marginTop: 'var(--space-xs)', marginBottom: 0 }}>
                Suggested timeline: {recommendation.timeline}
              </p>
            </div>

            {/* Priority */}
            <div className="dm-form-group">
              <label htmlFor="priority" className="dm-form-label">
                Priority *
              </label>
              <select
                id="priority"
                className="dm-form-select"
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
            <div className="dm-form-group">
              <label htmlFor="board" className="dm-form-label">
                Add to Board *
              </label>
              <select
                id="board"
                className="dm-form-select"
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                required
              >
                <option value="">Select a board...</option>
                <option value="Account Plan Actions">Account Plan Actions</option>
                <option value="Engineering Backlog">Engineering Backlog</option>
                <option value="Product Roadmap">Product Roadmap</option>
                <option value="Pricing Review">Pricing Review</option>
                <option value="CS Initiatives">CS Initiatives</option>
              </select>
            </div>

            {/* Notes (Optional) */}
            <div className="dm-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="notes" className="dm-form-label">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                className="dm-form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional context or instructions..."
                rows={4}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            className="dm-modal-footer"
            style={{
              padding: 'var(--space-lg)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: 'var(--space-sm)',
              justifyContent: 'flex-end'
            }}
          >
            <button
              type="button"
              className="dm-btn dm-btn-tertiary dm-btn-md"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="dm-btn dm-btn-primary dm-btn-md"
              disabled={!assignedTo || !dueDate || !board}
            >
              ✓ Create Action & Track
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
