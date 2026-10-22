/**
 * OrgStructureTab - Org hierarchy (by reportsTo, or grouped by role) plus the decision hierarchy
 * Server Component: pure display, no interactivity needed
 */

import type { Stakeholder } from '@/lib/types/account-plan'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'

interface OrgStructureTabProps {
  stakeholders: Stakeholder[]
  customerName: string
  bu: string
}

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger'

const roleBadge: Record<Stakeholder['role'], { label: string; variant: BadgeVariant }> = {
  champion: { label: 'Internal advocate', variant: 'success' },
  'decision-maker': { label: 'Key target', variant: 'default' },
  influencer: { label: 'Influencer', variant: 'default' },
  blocker: { label: 'Potential risk', variant: 'danger' },
  user: { label: 'End user', variant: 'default' },
}

function OrgNode({ stakeholder }: { stakeholder: Stakeholder }) {
  const badge = roleBadge[stakeholder.role]
  const isKey = stakeholder.role === 'champion' || stakeholder.role === 'decision-maker'

  return (
    <li
      className="w-full list-none p-4 sm:w-64"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${isKey ? 'var(--border-strong)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
      }}
    >
      <p className="m-0 text-sm font-semibold" style={{ color: 'var(--ink)' }}>
        {stakeholder.title || stakeholder.role}
      </p>
      <p className="m-0 mt-0.5 text-sm" style={{ color: 'var(--ink-2)' }}>{stakeholder.name}</p>
      {badge && <div className="mt-2"><Badge variant={badge.variant}>{badge.label}</Badge></div>}
      {stakeholder.notes && (
        <p className="m-0 mt-2 text-xs" style={{ color: 'var(--muted)' }}>
          {stakeholder.notes.slice(0, 70)}{stakeholder.notes.length > 70 ? '…' : ''}
        </p>
      )}
    </li>
  )
}

function NodeGroup({ title, items }: { title?: string; items: Stakeholder[] }) {
  if (items.length === 0) return null
  return (
    <div>
      {title && <h3 className="m-0 mb-3 text-sm" style={{ color: 'var(--ink-2)' }}>{title}</h3>}
      <ul className="m-0 flex flex-wrap gap-3 p-0">
        {items.map(s => <OrgNode key={s.id} stakeholder={s} />)}
      </ul>
    </div>
  )
}

export function OrgStructureTab({ stakeholders, customerName, bu }: OrgStructureTabProps) {
  if (stakeholders.length === 0) {
    return (
      <EmptyState
        title="No org structure data"
        description="Add stakeholder data with role classifications to see the org hierarchy."
      />
    )
  }

  // Build hierarchy using reportsTo field
  const roots = stakeholders.filter(s => !s.reportsTo)
  const getChildren = (parentId: string) => stakeholders.filter(s => s.reportsTo === parentId)

  // Fallback: if no hierarchy info, group by role
  const useRoleGrouping = roots.length === 0

  const decisionMakers = stakeholders.filter(s => s.role === 'decision-maker')
  const champions = stakeholders.filter(s => s.role === 'champion')
  const influencers = stakeholders.filter(s => s.role === 'influencer')
  const users = stakeholders.filter(s => s.role === 'user')
  const blockers = stakeholders.filter(s => s.role === 'blocker')

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden" aria-labelledby="org-title">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 id="org-title" className="m-0">{customerName} organizational structure</h2>
          <p className="m-0 mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Decision-making hierarchy for {bu} platform systems. Tags mark internal advocates and key targets.
          </p>
        </div>

        <div className="space-y-6 p-5">
          {useRoleGrouping ? (
            // Role-based grouping when no hierarchy data
            <>
              <NodeGroup title="Decision makers" items={decisionMakers} />
              <NodeGroup title="Champions and advocates" items={champions} />
              <NodeGroup title="Influencers" items={influencers} />
              <NodeGroup title="Operational and other" items={[...users, ...blockers]} />
            </>
          ) : (
            // Tree-based hierarchy from reportsTo
            <>
              <NodeGroup title="Leadership" items={roots} />
              {roots.map(root => {
                const children = getChildren(root.id)
                if (children.length === 0) return null
                return <NodeGroup key={root.id} title={`Reports to ${root.name}`} items={children} />
              })}
            </>
          )}
        </div>
      </section>

      {/* Decision Hierarchy */}
      <section className="card p-5" aria-labelledby="org-hierarchy">
        <h2 id="org-hierarchy" className="m-0">Decision hierarchy for platform systems</h2>
        <ol className="m-0 mt-3 list-decimal space-y-1.5 pl-5 text-sm">
          <li className="pl-1"><span className="font-medium">Strategic direction:</span> decision makers (business needs, strategic sponsorship)</li>
          <li className="pl-1"><span className="font-medium">Technical and architectural:</span> IT function, platform teams, technical champions</li>
          <li className="pl-1"><span className="font-medium">Procurement and budget:</span> CFO or finance, chief procurement officer</li>
          <li className="pl-1"><span className="font-medium">Implementation and operations:</span> internal advocates, business analysts, end users</li>
        </ol>
      </section>
    </div>
  )
}
