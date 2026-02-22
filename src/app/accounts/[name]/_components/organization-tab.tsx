'use client'

/**
 * OrganizationTab - 4-quadrant decision matrix with stakeholder cards
 * Client Component — uses useState for expand/collapse
 */

import { useState } from 'react'
import type { Stakeholder } from '@/lib/types/account-plan'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface OrganizationTabProps {
  stakeholders: Stakeholder[]
}

export function OrganizationTab({ stakeholders }: OrganizationTabProps) {
  const [expanded, setExpanded] = useState<string[]>([])

  const toggle = (id: string) =>
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  // Classify into 4 quadrants using role field (StakeholderRole enum)
  // Champions: champion role (explicitly positive + high influence)
  const champions = stakeholders.filter((s) => s.role === 'champion')

  // Blockers: blocker role (negative + high influence)
  const blockers = stakeholders.filter((s) => s.role === 'blocker')

  // Decision makers & influencers: high influence stakeholders
  const supporters = stakeholders.filter(
    (s) => s.role === 'decision-maker' || s.role === 'influencer'
  )

  // Users: lower influence, neutral/operational
  const users = stakeholders.filter((s) => s.role === 'user')

  const StakeholderCard = ({ stakeholder }: { stakeholder: Stakeholder }) => {
    const isOpen = expanded.includes(stakeholder.id)
    const isExecutive =
      stakeholder.title?.toLowerCase().includes('ceo') ||
      stakeholder.title?.toLowerCase().includes('cto') ||
      stakeholder.title?.toLowerCase().includes('coo') ||
      stakeholder.title?.toLowerCase().includes('vp') ||
      stakeholder.title?.toLowerCase().includes('chief') ||
      stakeholder.role === 'decision-maker'

    return (
      <div
        style={{ background: "white", border: "1px solid var(--border)", padding: "0.75rem", marginBottom: "0.5rem", cursor: "pointer", transition: "box-shadow 0.2s ease", ...(isExecutive ? { borderLeft: '3px solid var(--accent)' } : {}) }}
        onClick={() => toggle(stakeholder.id)}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-[var(--secondary)] text-sm">{stakeholder.name}</div>
            <div className="text-xs text-[var(--muted)]">{stakeholder.title}</div>
          </div>
          {isOpen ? (
            <ChevronUp size={14} className="text-[var(--muted)]" />
          ) : (
            <ChevronDown size={14} className="text-[var(--muted)]" />
          )}
        </div>
        {isOpen && stakeholder.notes && (
          <div className="mt-2 pt-2 border-t border-[var(--border)] text-xs text-[var(--muted)] leading-relaxed">
            {stakeholder.notes}
          </div>
        )}
        {isOpen && stakeholder.email && (
          <div className="mt-1 text-xs text-[var(--muted)]">{stakeholder.email}</div>
        )}
      </div>
    )
  }

  const Quadrant = ({
    title,
    items,
    accent,
    description,
  }: {
    title: string
    items: Stakeholder[]
    accent: string
    description: string
  }) => (
    <div
      style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: "1.5rem", borderTop: `3px solid ${accent}` }}
    >
      <div className="font-display text-lg font-semibold text-[var(--secondary)] mb-1">{title}</div>
      <div className="text-xs text-[var(--muted)] mb-4">{description}</div>
      {items.length > 0 ? (
        items.map((s) => <StakeholderCard key={s.id} stakeholder={s} />)
      ) : (
        <div className="text-xs text-[var(--muted)] italic py-2">None identified</div>
      )}
    </div>
  )

  if (stakeholders.length === 0) {
    return (
      <div className="py-16 text-center text-[var(--muted)]">
        <div className="font-display text-2xl mb-2">No stakeholders mapped</div>
        <div className="text-sm">Add stakeholder data to visualize the organization structure.</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Decision Matrix — 4 quadrant */}
      <div>
        <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-2 pb-2 border-b-[2px] border-[var(--border)]">
          Stakeholder Decision Matrix
        </h2>
        <p className="text-sm text-[var(--muted)] mb-6">
          Classify stakeholders by role and influence to prioritize engagement strategy.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Quadrant
            title="Champions"
            items={champions}
            accent="var(--success)"
            description="Positive advocate · High influence"
          />
          <Quadrant
            title="Blockers"
            items={blockers}
            accent="var(--critical)"
            description="Risk to deal · High influence"
          />
          <Quadrant
            title="Decision Makers & Influencers"
            items={supporters}
            accent="var(--accent)"
            description="Key decision authority · Must engage"
          />
          <Quadrant
            title="Users"
            items={users}
            accent="var(--warning)"
            description="Operational · Lower strategic influence"
          />
        </div>
      </div>

      {/* Full Stakeholder Table */}
      <div>
        <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
          All Stakeholders
        </h2>
        <div style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--secondary)] text-white">
                <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Name</th>
                <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Title</th>
                <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Role</th>
                <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Relationship</th>
              </tr>
            </thead>
            <tbody>
              {stakeholders.map((s, i) => (
                <tr
                  key={i}
                  className="border-b border-[var(--border)] hover:bg-[var(--highlight)] transition-colors"
                >
                  <td className="p-4 font-medium text-[var(--secondary)]">{s.name}</td>
                  <td className="p-4 text-[var(--muted)]">{s.title || '—'}</td>
                  <td className="p-4">
                    <span className="inline-block px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-wide bg-[var(--highlight)] text-[var(--secondary)]">
                      {s.role || '—'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-wide text-white ${
                        s.relationshipStrength === 'strong'
                          ? 'bg-[var(--success)]'
                          : s.relationshipStrength === 'moderate'
                          ? 'bg-[var(--warning)]'
                          : s.relationshipStrength === 'weak'
                          ? 'bg-[var(--critical)]'
                          : 'bg-[var(--muted)]'
                      }`}
                    >
                      {s.relationshipStrength || 'unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
