'use client'

/**
 * OrganizationTab - Display stakeholder org chart with hierarchy
 * Uses indented list view with connector lines for simplicity
 * Inline editing enabled via StakeholderCard
 */

import { useState, useMemo } from 'react'
import type { Stakeholder } from '@/lib/types/account-plan'
import { StakeholderCard } from './stakeholder-card'

interface OrganizationTabProps {
  stakeholders: Stakeholder[]
}

export function OrganizationTab({ stakeholders }: OrganizationTabProps) {
  const [localStakeholders, setLocalStakeholders] = useState<Stakeholder[]>(stakeholders)

  // Build org hierarchy
  const { roots, childrenMap } = useMemo(() => {
    const childrenMap = new Map<string | null, Stakeholder[]>()
    const roots: Stakeholder[] = []

    // Group stakeholders by reportsTo
    localStakeholders.forEach((stakeholder) => {
      const parentId = stakeholder.reportsTo || null
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, [])
      }
      childrenMap.get(parentId)!.push(stakeholder)
    })

    // Find roots (no reportsTo or reportsTo not found)
    const allIds = new Set(localStakeholders.map((s) => s.id))
    localStakeholders.forEach((stakeholder) => {
      if (!stakeholder.reportsTo || !allIds.has(stakeholder.reportsTo)) {
        roots.push(stakeholder)
      }
    })

    return { roots, childrenMap }
  }, [localStakeholders])

  const handleStakeholderUpdate = (updated: Stakeholder) => {
    setLocalStakeholders((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    )
  }

  // Calculate summary stats
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    localStakeholders.forEach((s) => {
      const role = s.role
      counts[role] = (counts[role] || 0) + 1
    })
    return counts
  }, [localStakeholders])

  const relationshipCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    localStakeholders.forEach((s) => {
      const strength = s.relationshipStrength
      counts[strength] = (counts[strength] || 0) + 1
    })
    return counts
  }, [localStakeholders])

  const roleLabels: Record<string, string> = {
    'decision-maker': 'Decision Maker',
    'influencer': 'Influencer',
    'champion': 'Champion',
    'user': 'User',
    'blocker': 'Blocker',
  }

  // Recursive tree rendering with indentation
  const renderStakeholderTree = (stakeholder: Stakeholder, level: number = 0) => {
    const children = childrenMap.get(stakeholder.id) || []

    return (
      <div key={stakeholder.id} className="relative">
        {/* Current stakeholder */}
        <div
          className="flex items-start gap-4 mb-4"
          style={{ paddingLeft: `${level * 48}px` }}
        >
          {/* Connector line for non-root nodes */}
          {level > 0 && (
            <div className="absolute left-0 top-0 bottom-0 border-l-2 border-slate-300" style={{ left: `${(level - 1) * 48 + 16}px` }}>
              <div className="absolute top-8 w-8 border-t-2 border-slate-300" />
            </div>
          )}

          <StakeholderCard
            stakeholder={stakeholder}
            onUpdate={handleStakeholderUpdate}
          />
        </div>

        {/* Render children recursively */}
        {children.map((child) => renderStakeholderTree(child, level + 1))}
      </div>
    )
  }

  if (localStakeholders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium text-slate-700 mb-2">No stakeholders mapped yet</p>
        <p className="text-sm text-slate-500">
          Add stakeholder data to visualize the organization structure
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Org chart */}
      <div className="bg-highlight/30 p-6 rounded-lg border border-[var(--border)]">
        <h2 className="font-display text-xl font-semibold text-secondary mb-6">Organization Structure</h2>

        <div className="space-y-6">
          {roots.map((root) => renderStakeholderTree(root))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Role breakdown */}
        <div className="bg-white p-6 rounded-lg border border-[var(--border)] shadow-sm">
          <h3 className="font-display text-lg font-semibold text-secondary mb-4">Roles</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Total Stakeholders</span>
              <span className="font-semibold text-ink">{localStakeholders.length}</span>
            </div>
            {Object.entries(roleCounts).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between text-sm">
                <span className="text-muted capitalize">
                  {roleLabels[role] || role}
                  {count > 1 ? 's' : ''}
                </span>
                <span className="font-medium text-ink">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Relationship health */}
        <div className="bg-white p-6 rounded-lg border border-[var(--border)] shadow-sm">
          <h3 className="font-display text-lg font-semibold text-secondary mb-4">Relationship Health</h3>
          <div className="space-y-2">
            {Object.entries(relationshipCounts).map(([strength, count]) => (
              <div key={strength} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      strength === 'strong'
                        ? 'bg-success'
                        : strength === 'moderate'
                        ? 'bg-warning'
                        : strength === 'weak'
                        ? 'bg-critical'
                        : 'bg-muted'
                    }`}
                  />
                  <span className="text-muted capitalize">{strength}</span>
                </div>
                <span className="font-medium text-ink">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
