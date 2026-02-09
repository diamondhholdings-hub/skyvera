'use client'

/**
 * StakeholderCard - Display and inline edit stakeholder profile
 * Shows role badges, RACI indicators, contact info, relationship strength
 * Click to edit mode with save/cancel
 */

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Mail, Phone, Clock, MessageSquare } from 'lucide-react'
import type { Stakeholder, StakeholderRole, RACIRole, RelationshipStrength } from '@/lib/types/account-plan'

interface StakeholderCardProps {
  stakeholder: Stakeholder
  onUpdate?: (updated: Stakeholder) => void
}

const roleColors: Record<StakeholderRole, string> = {
  'decision-maker': 'bg-purple-100 text-purple-800 border-purple-200',
  'influencer': 'bg-blue-100 text-blue-800 border-blue-200',
  'champion': 'bg-green-100 text-green-800 border-green-200',
  'user': 'bg-gray-100 text-gray-800 border-gray-200',
  'blocker': 'bg-red-100 text-red-800 border-red-200',
}

const roleLabels: Record<StakeholderRole, string> = {
  'decision-maker': 'Decision Maker',
  'influencer': 'Influencer',
  'champion': 'Champion',
  'user': 'User',
  'blocker': 'Blocker',
}

const relationshipColors: Record<RelationshipStrength, { dot: string; text: string }> = {
  'strong': { dot: 'bg-green-500', text: 'text-green-700' },
  'moderate': { dot: 'bg-amber-500', text: 'text-amber-700' },
  'weak': { dot: 'bg-red-500', text: 'text-red-700' },
  'unknown': { dot: 'bg-gray-400', text: 'text-gray-600' },
}

export function StakeholderCard({ stakeholder, onUpdate }: StakeholderCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<Stakeholder>(stakeholder)

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedData)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedData(stakeholder)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="bg-white p-4 rounded-lg shadow border-2 border-blue-500 w-64">
        {/* Edit mode */}
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-slate-700">Name</label>
            <input
              type="text"
              value={editedData.name}
              onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Title</label>
            <input
              type="text"
              value={editedData.title}
              onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Role</label>
            <select
              value={editedData.role}
              onChange={(e) => setEditedData({ ...editedData, role: e.target.value as StakeholderRole })}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            >
              <option value="decision-maker">Decision Maker</option>
              <option value="influencer">Influencer</option>
              <option value="champion">Champion</option>
              <option value="user">User</option>
              <option value="blocker">Blocker</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">RACI Role</label>
            <select
              value={editedData.raciRole || ''}
              onChange={(e) => setEditedData({ ...editedData, raciRole: (e.target.value || undefined) as RACIRole | undefined })}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            >
              <option value="">None</option>
              <option value="responsible">Responsible</option>
              <option value="accountable">Accountable</option>
              <option value="consulted">Consulted</option>
              <option value="informed">Informed</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={editedData.email || ''}
              onChange={(e) => setEditedData({ ...editedData, email: e.target.value || undefined })}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Phone</label>
            <input
              type="tel"
              value={editedData.phone || ''}
              onChange={(e) => setEditedData({ ...editedData, phone: e.target.value || undefined })}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Relationship Strength</label>
            <select
              value={editedData.relationshipStrength}
              onChange={(e) => setEditedData({ ...editedData, relationshipStrength: e.target.value as RelationshipStrength })}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            >
              <option value="strong">Strong</option>
              <option value="moderate">Moderate</option>
              <option value="weak">Weak</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Notes</label>
            <textarea
              value={editedData.notes || ''}
              onChange={(e) => setEditedData({ ...editedData, notes: e.target.value || undefined })}
              rows={2}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-1.5 text-slate-600 text-sm font-medium rounded hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // View mode
  const relationshipStyle = relationshipColors[stakeholder.relationshipStrength]

  return (
    <div
      className="bg-white p-4 rounded-lg shadow hover:shadow-md w-64 cursor-pointer transition-shadow"
      onClick={() => setIsEditing(true)}
    >
      {/* Name and role badges */}
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 text-sm leading-tight">{stakeholder.name}</h3>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <span className={`px-2 py-0.5 text-xs font-medium rounded border ${roleColors[stakeholder.role]}`}>
            {roleLabels[stakeholder.role]}
          </span>
          {stakeholder.raciRole && (
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700 border border-gray-200">
              {stakeholder.raciRole.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <p className="text-sm text-slate-600 mb-3">{stakeholder.title}</p>

      {/* Contact info */}
      {(stakeholder.email || stakeholder.phone) && (
        <div className="space-y-1 mb-3">
          {stakeholder.email && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Mail className="w-3 h-3" />
              <span className="truncate">{stakeholder.email}</span>
            </div>
          )}
          {stakeholder.phone && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Phone className="w-3 h-3" />
              <span>{stakeholder.phone}</span>
            </div>
          )}
        </div>
      )}

      {/* Relationship strength */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-2 h-2 rounded-full ${relationshipStyle.dot}`}
          aria-label={`Relationship strength: ${stakeholder.relationshipStrength}`}
        />
        <span className={`text-xs font-medium ${relationshipStyle.text} capitalize`}>
          {stakeholder.relationshipStrength}
        </span>
      </div>

      {/* Last interaction */}
      {stakeholder.lastInteraction && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <Clock className="w-3 h-3" />
          <span>
            {formatDistanceToNow(new Date(stakeholder.lastInteraction), { addSuffix: true })}
          </span>
        </div>
      )}

      {/* Notes (truncated) */}
      {stakeholder.notes && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-start gap-1.5">
            <MessageSquare className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-600 line-clamp-2">{stakeholder.notes}</p>
          </div>
        </div>
      )}
    </div>
  )
}
