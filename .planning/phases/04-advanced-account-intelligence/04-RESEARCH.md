# Phase 4: Advanced Account Intelligence - Research

**Researched:** 2026-02-09
**Domain:** 7-Tab Account Plan Interface, Org Charts, Kanban Boards, Real-time Intelligence
**Confidence:** HIGH

## Summary

Phase 4 builds a comprehensive 7-tab account plan interface on top of the existing customer directory (Phase 2) and intelligence features (Phase 3). The primary technical challenges are: (1) tab navigation with URL state persistence in Next.js App Router, (2) org chart tree view rendering, (3) Kanban drag-and-drop for action items, (4) inline editing for stakeholder cards, and (5) Claude-generated intelligence with cached fallback.

The codebase already has significant infrastructure for this phase: `CustomerWithHealth` type with BU annotation, `ClaudeOrchestrator` singleton for AI requests, `NewsAPIAdapter` for real-time news, `account-intel.ts` prompt builder, and pre-generated intelligence reports in `data/intelligence/reports/`. The existing patterns (Server Components fetching data, Client Component islands for interactivity, Result type error handling, Zod schema validation) should be maintained throughout.

The standard approach is: create a dynamic route `/accounts/[accountId]` with a shared layout containing the 7-tab navigation as a Client Component. Each tab renders its content based on URL searchParams (`?tab=overview`). Use `react-organizational-chart` for the org tree, `@dnd-kit/core` + `@dnd-kit/sortable` for the Kanban board, and native React state for inline editing (no library needed). All data that doesn't exist in Excel (stakeholders, pain points, action items) should be seeded as mock data with Zod-validated types, matching the existing MockDataProvider pattern.

**Primary recommendation:** Build `/accounts/[accountId]` as a dynamic route with Server Component page, Client Component tab shell using `useSearchParams` for tab persistence, and lazy-loaded tab content panels. Use mock data for stakeholders, pain points, and action items (not in Excel). Use existing ClaudeOrchestrator + account-intel prompt for strategic insights. Use existing news adapter + Claude sentiment analysis for the Intelligence tab.

## Standard Stack

The established libraries/tools for this phase:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | ^16.1.6 | App Router with dynamic routes | Already in project, provides `[accountId]` routing |
| React | ^19.2.4 | UI with Server/Client Components | Already in project |
| Tailwind CSS | ^4.1.18 | Styling | Already in project, zero-runtime |
| Zod | ^4.3.6 | Schema validation | Already in project, single source of truth for types |
| lucide-react | ^0.563.0 | Icons | Already in project, used throughout |
| date-fns | ^4.1.0 | Date formatting | Already in project |
| sonner | ^2.0.7 | Toast notifications | Already in project |
| react-hook-form | ^7.71.1 | Form handling | Already in project, for action item modal form |
| Recharts | ^3.7.0 | Charts | Already in project, for Financials tab charts |

### New Dependencies
| Library | Version | Purpose | Why This Library |
|---------|---------|---------|-----------------|
| @dnd-kit/core | ^6.3.1 | Drag-and-drop context | Industry standard for React DnD, lightweight (~10kb), accessible, hook-based |
| @dnd-kit/sortable | ^10.0.0 | Sortable preset for Kanban columns | Built on @dnd-kit/core, handles column sorting, arrayMove utility |
| @dnd-kit/utilities | latest | CSS transform utility | Required for `CSS.Transform.toString()` in sortable items |
| react-organizational-chart | latest | Org chart tree rendering | Simple API (Tree + TreeNode), accepts any React children as nodes, MIT license, 192+ stars |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit/core + sortable | @dnd-kit/react (0.2.x) | New package is pre-1.0, unstable, limited documentation. Use proven core + sortable |
| @dnd-kit/core + sortable | @hello-pangea/dnd | Higher-level abstraction but less flexible, maintained fork of react-beautiful-dnd |
| react-organizational-chart | react-d3-tree | D3-based is heavier, requires more config; react-organizational-chart is simpler for static org charts |
| react-organizational-chart | Custom CSS tree | Hand-rolling tree lines/connectors is error-prone; library handles connectors cleanly |
| Custom inline editing | react-easy-edit | Library adds unnecessary dependency; inline editing is simple enough with useState toggle |

**Installation:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-organizational-chart
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    accounts/
      [accountId]/
        page.tsx              # Server Component - fetches customer data, renders tab shell
        loading.tsx           # Skeleton for page load
        components/
          account-tab-shell.tsx    # "use client" - tab navigation + URL state
          tab-overview.tsx         # Overview tab content
          tab-financials.tsx       # Financials tab with Recharts
          tab-organization.tsx     # Org chart tree + stakeholder cards
          tab-strategy.tsx         # Pain points + opportunities
          tab-competitive.tsx      # Competitive intelligence
          tab-intelligence.tsx     # News timeline + Claude insights
          tab-action-items.tsx     # Kanban board
          stakeholder-card.tsx     # Inline-editable stakeholder card
          kanban-board.tsx         # DnD Kanban with columns
          kanban-column.tsx        # Single Kanban column
          kanban-item.tsx          # Draggable action item card
          action-item-modal.tsx    # Modal form for creating/editing actions
  lib/
    types/
      account-plan.ts         # Zod schemas for stakeholders, pain points, actions, competitive intel
    data/
      server/
        account-detail-data.ts  # Server-side data fetching for account detail page
      mock/
        account-plan-mock.ts    # Mock data for stakeholders, pain points, actions
    intelligence/
      claude/
        prompts/
          account-intel.ts      # Already exists - enhance for competitive + strategy tabs
          sentiment-analysis.ts # New prompt for news sentiment enrichment
```

### Pattern 1: Dynamic Route with Tab Navigation via URL SearchParams
**What:** Account detail page uses `[accountId]` dynamic segment. Tab state persisted in URL searchParams (`?tab=financials`).
**When to use:** For the 7-tab interface where users need bookmarkable/shareable tab state.
**Example:**
```typescript
// src/app/accounts/[accountId]/page.tsx (Server Component)
import { getAllCustomersWithHealth } from '@/lib/data/server/account-data'
import { AccountTabShell } from './components/account-tab-shell'

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ accountId: string }>
}) {
  const { accountId } = await params
  const customersResult = await getAllCustomersWithHealth()
  // Find customer by encoded name or ID
  // Pass to client shell
  return <AccountTabShell customer={customer} accountId={accountId} />
}
```

```typescript
// src/app/accounts/[accountId]/components/account-tab-shell.tsx
'use client'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'financials', label: 'Financials' },
  { key: 'organization', label: 'Organization' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'competitive', label: 'Competitive' },
  { key: 'intelligence', label: 'Intelligence' },
  { key: 'actions', label: 'Action Items' },
] as const

export function AccountTabShell({ customer, accountId }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const activeTab = searchParams.get('tab') || 'overview'

  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', tab)
    router.replace(`${pathname}?${params.toString()}`)
  }
  // Render horizontal tabs on desktop, dropdown on mobile
  // Render active tab content with loading skeleton
}
```

### Pattern 2: Inline Editing with View/Edit Mode Toggle
**What:** Stakeholder cards toggle between view and edit mode on click. No library needed.
**When to use:** For stakeholder profile cards in Organization tab.
**Example:**
```typescript
'use client'
import { useState } from 'react'

interface StakeholderCardProps {
  stakeholder: Stakeholder
  onSave: (updated: Stakeholder) => void
}

export function StakeholderCard({ stakeholder, onSave }: StakeholderCardProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(stakeholder)

  if (!editing) {
    return (
      <div onClick={() => setEditing(true)} className="cursor-pointer hover:ring-2 ...">
        {/* View mode: display name, title, role, RACI badge */}
      </div>
    )
  }

  return (
    <div className="ring-2 ring-blue-500 ...">
      {/* Edit mode: input fields for each property */}
      <button onClick={() => { onSave(draft); setEditing(false) }}>Save</button>
      <button onClick={() => { setDraft(stakeholder); setEditing(false) }}>Cancel</button>
    </div>
  )
}
```

### Pattern 3: Kanban Board with @dnd-kit
**What:** Three-column Kanban (To Do, In Progress, Done) with drag-and-drop between columns.
**When to use:** Action Items tab.
**Example:**
```typescript
'use client'
import { DndContext, DragOverlay, closestCorners, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'

export function KanbanBoard({ items, onItemsChange }) {
  const [activeItem, setActiveItem] = useState(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-3 gap-4">
        {columns.map(column => (
          <KanbanColumn key={column.id} column={column} items={columnItems}>
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
              {columnItems.map(item => <KanbanItem key={item.id} item={item} />)}
            </SortableContext>
          </KanbanColumn>
        ))}
      </div>
      <DragOverlay>{activeItem && <KanbanItem item={activeItem} isDragOverlay />}</DragOverlay>
    </DndContext>
  )
}
```

### Pattern 4: Org Chart Tree with Custom Node Cards
**What:** Hierarchical org chart using react-organizational-chart with custom styled TreeNode labels.
**When to use:** Organization tab.
**Example:**
```typescript
import { Tree, TreeNode } from 'react-organizational-chart'

export function OrgChart({ stakeholders }: { stakeholders: Stakeholder[] }) {
  const root = buildHierarchy(stakeholders) // Build tree from flat list with parentId

  return (
    <Tree
      label={<StakeholderCard stakeholder={root} />}
      lineWidth="2px"
      lineColor="#94a3b8"
      lineBorderRadius="4px"
      lineHeight="30px"
      nodePadding="8px"
    >
      {root.children.map(child => renderNode(child))}
    </Tree>
  )
}

function renderNode(node: StakeholderNode) {
  return (
    <TreeNode key={node.id} label={<StakeholderCard stakeholder={node} />}>
      {node.children?.map(child => renderNode(child))}
    </TreeNode>
  )
}
```

### Pattern 5: Intelligence Tab with Cached Fallback
**What:** Fetch fresh Claude intelligence on tab visit, show stale data with warning if API fails.
**When to use:** Intelligence tab auto-refresh behavior.
**Example:**
```typescript
'use client'
import { useState, useEffect } from 'react'

export function IntelligenceTab({ accountId, initialData }) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [staleWarning, setStaleWarning] = useState<string | null>(null)

  useEffect(() => {
    async function refresh() {
      setLoading(true)
      try {
        const res = await fetch(`/api/accounts/${accountId}/intelligence`)
        if (res.ok) {
          const fresh = await res.json()
          setData(fresh)
          setStaleWarning(null)
        } else {
          // Show stale warning with last fetch timestamp
          setStaleWarning(`Data from ${data.fetchedAt} - API unavailable`)
        }
      } catch {
        setStaleWarning(`Data from ${data.fetchedAt} - API unavailable`)
      } finally {
        setLoading(false)
      }
    }
    refresh()
  }, [accountId])
  // Render cards for Opportunities, Risks, Recommendations + News timeline
}
```

### Anti-Patterns to Avoid
- **Parallel Routes for tabs**: Overkill for this use case. URL searchParams with client-side tab switching is simpler and faster. Parallel routes add file system complexity (7 @slots) without benefit since tabs don't need independent navigation.
- **Fetching data per tab separately**: Fetch all account data in the Server Component page, pass to the client tab shell. Individual API calls per tab add latency and complexity.
- **Using @dnd-kit/react (0.2.x)**: Pre-1.0, sparse documentation, React 19 compatibility issues reported. Use proven @dnd-kit/core + @dnd-kit/sortable.
- **Storing tab state in React state only**: Loses state on refresh. URL searchParams persist across refreshes and enable sharing.
- **Over-fetching intelligence**: Claude API calls are expensive. Cache aggressively and only refresh when Intelligence tab is actively visited.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop Kanban | Custom mouse event handlers | @dnd-kit/core + sortable | Touch support, keyboard accessibility, collision detection, drag overlays are complex |
| Org chart tree lines | CSS border-left/border-bottom connectors | react-organizational-chart | Handles line routing, spacing, nesting automatically. Hand-rolling breaks on deep trees |
| Sentiment analysis | Regex/keyword matching | Claude API via existing orchestrator | LLM understanding of nuance, sarcasm, context is far superior to rules |
| Tab accessibility | Manual aria-role management | Semantic HTML + aria-selected | But use `role="tablist"`, `role="tab"`, `role="tabpanel"` attributes explicitly |
| Date relative display | Manual "X hours ago" calculation | date-fns `formatDistanceToNow` | Already in project, handles edge cases (just now, minutes, hours, days) |
| Toast notifications | Custom notification component | sonner (already installed) | Already in project, handles stacking, auto-dismiss, rich content |
| Form validation | Manual validation logic | Zod + react-hook-form (already installed) | Already in project for scenario forms, reuse for action item modal |

**Key insight:** This phase has many UI components but most build on existing patterns. The biggest risk is building custom drag-and-drop or tree rendering when proven libraries handle edge cases (accessibility, touch, keyboard) that are easy to miss.

## Common Pitfalls

### Pitfall 1: Account Identification by Name (No Unique ID)
**What goes wrong:** Customer data from Excel uses `customer_name` as identifier, not a numeric ID. Names may contain special characters (ampersands, parentheses, commas).
**Why it happens:** Excel data doesn't have stable IDs; names are the natural key.
**How to avoid:** URL-encode customer names for the `[accountId]` route segment. Use `encodeURIComponent` / `decodeURIComponent` consistently. Consider using a slug (lowercase, hyphenated) or a hash of the name for cleaner URLs.
**Warning signs:** 404 errors on accounts with special characters (e.g., "AT&T SERVICES, INC.").

### Pitfall 2: Mock Data Not Matching Real Data Shape
**What goes wrong:** Stakeholders, pain points, and action items don't exist in Excel. Mock data is created with different shapes than what the real API would return, causing refactoring later.
**Why it happens:** Demo urgency leads to ad-hoc mock data without schema validation.
**How to avoid:** Define Zod schemas first for ALL new types (Stakeholder, PainPoint, ActionItem, CompetitiveIntel). Create mock data that validates against these schemas. This is the existing project pattern.
**Warning signs:** TypeScript `any` casts, missing validation, inconsistent field names.

### Pitfall 3: DnD Context Conflicts
**What goes wrong:** Multiple DndContext providers on the same page (e.g., if Kanban is nested inside another draggable area) cause event bubbling issues.
**Why it happens:** dnd-kit uses React context which can conflict when nested.
**How to avoid:** Ensure only ONE DndContext wraps the Kanban board. The tab shell should NOT be draggable. Keep DndContext scope narrow (just the Kanban column area).
**Warning signs:** Items from one column appear to "stick" or drag events fire on wrong elements.

### Pitfall 4: Over-fetching Claude API on Tab Switches
**What goes wrong:** Each time user switches to Intelligence tab, a new Claude API call fires. With 50 RPM limit and multiple tabs being explored, rate limits hit quickly.
**Why it happens:** The "auto-refresh on tab visit" decision means every tab activation triggers a fetch.
**How to avoid:** Use the existing CacheManager with TTL. Only call Claude if cache is expired (5min for HIGH priority). Show cached data immediately, refresh in background. The `staleWarning` pattern handles API failures gracefully.
**Warning signs:** 429 errors in console, intelligence tab showing loading spinners for >5 seconds.

### Pitfall 5: Mobile Dropdown Tab Not Preserving State
**What goes wrong:** Mobile dropdown tab selector doesn't sync with URL searchParams, causing tab state to desync.
**Why it happens:** Native `<select>` onChange doesn't automatically update URL.
**How to avoid:** Use the same `setTab()` function (which updates URL searchParams) for both the desktop tab bar clicks and the mobile dropdown onChange. Single source of truth = URL.
**Warning signs:** Selecting a tab on mobile shows different content than the URL indicates.

### Pitfall 6: Org Chart Renders Flat Instead of Hierarchical
**What goes wrong:** Stakeholders stored as a flat array need parent-child relationships for the tree view. Without a `reportsTo` field, all nodes render as siblings.
**Why it happens:** Mock data created without hierarchy relationships.
**How to avoid:** Include `reportsTo` (or `parentId`) field in the Stakeholder schema. Build a `buildHierarchy()` utility that converts flat array to tree structure. Root node has `reportsTo: null`.
**Warning signs:** Org chart shows all stakeholders on one level with no tree structure.

## Code Examples

Verified patterns from the existing codebase and official documentation:

### Dynamic Route Page (Next.js App Router)
```typescript
// src/app/accounts/[accountId]/page.tsx
// Source: Next.js docs + existing project pattern from accounts/page.tsx
import { Suspense } from 'react'
import { getAllCustomersWithHealth } from '@/lib/data/server/account-data'
import { getAccountPlanData } from '@/lib/data/server/account-detail-data'
import { AccountTabShell } from './components/account-tab-shell'

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ accountId: string }>
}) {
  const { accountId } = await params
  const decodedName = decodeURIComponent(accountId)

  const [customersResult, planResult] = await Promise.all([
    getAllCustomersWithHealth(),
    getAccountPlanData(decodedName),
  ])

  if (!customersResult.success) {
    return <ErrorState message={customersResult.error.message} />
  }

  const customer = customersResult.value.find(
    c => c.customer_name.toLowerCase() === decodedName.toLowerCase()
  )

  if (!customer) {
    return <NotFoundState accountId={decodedName} />
  }

  return (
    <Suspense fallback={<AccountDetailSkeleton />}>
      <AccountTabShell
        customer={customer}
        planData={planResult.success ? planResult.value : null}
      />
    </Suspense>
  )
}
```

### Horizontal Tab Bar with Mobile Dropdown
```typescript
// Source: Project convention + Next.js useSearchParams docs
'use client'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Suspense } from 'react'

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
  { key: 'financials', label: 'Financials', icon: 'DollarSign' },
  { key: 'organization', label: 'Organization', icon: 'Users' },
  { key: 'strategy', label: 'Strategy', icon: 'Target' },
  { key: 'competitive', label: 'Competitive', icon: 'Swords' },
  { key: 'intelligence', label: 'Intelligence', icon: 'Brain' },
  { key: 'actions', label: 'Action Items', icon: 'CheckSquare' },
] as const

type TabKey = typeof TABS[number]['key']

function TabShellContent({ customer, planData }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const activeTab = (searchParams.get('tab') as TabKey) || 'overview'

  const setTab = (tab: TabKey) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div>
      {/* Desktop tabs */}
      <div className="hidden md:block border-b border-slate-200" role="tablist">
        <div className="flex space-x-1 px-6">
          {TABS.map(tab => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile dropdown */}
      <div className="md:hidden px-4 py-2">
        <select
          value={activeTab}
          onChange={(e) => setTab(e.target.value as TabKey)}
          className="w-full px-3 py-2 border rounded-lg"
          aria-label="Select tab"
        >
          {TABS.map(tab => (
            <option key={tab.key} value={tab.key}>{tab.label}</option>
          ))}
        </select>
      </div>

      {/* Tab content */}
      <div role="tabpanel" className="p-6">
        {renderTabContent(activeTab, customer, planData)}
      </div>
    </div>
  )
}

// Wrap in Suspense because useSearchParams causes client-side rendering
export function AccountTabShell(props) {
  return (
    <Suspense fallback={<TabSkeleton />}>
      <TabShellContent {...props} />
    </Suspense>
  )
}
```

### Kanban DnD Setup (dnd-kit)
```typescript
// Source: @dnd-kit docs + community Kanban patterns
'use client'
import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type ColumnId = 'todo' | 'in-progress' | 'done'

// SortableItem wraps each action card
function SortableActionItem({ item }: { item: ActionItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ActionCard item={item} />
    </div>
  )
}
```

### Zod Schemas for New Types
```typescript
// src/lib/types/account-plan.ts
import { z } from 'zod'

export const StakeholderRoleSchema = z.enum([
  'Decision Maker', 'Influencer', 'Champion', 'User', 'Blocker'
])

export const RACIRoleSchema = z.enum([
  'Responsible', 'Accountable', 'Consulted', 'Informed'
])

export const StakeholderSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  role: StakeholderRoleSchema,
  raciRole: RACIRoleSchema.optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  tenure: z.string().optional(),
  interests: z.array(z.string()).default([]),
  relationshipStrength: z.number().min(1).max(5),
  interactionHistory: z.array(z.object({
    date: z.string(),
    type: z.string(),
    notes: z.string(),
  })).default([]),
  notes: z.string().default(''),
  reportsTo: z.string().nullable(), // parent stakeholder ID for org chart
})
export type Stakeholder = z.infer<typeof StakeholderSchema>

export const PainPointSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.enum(['high', 'medium', 'low']),
  status: z.enum(['active', 'mitigated', 'resolved']),
  category: z.string(),
})
export type PainPoint = z.infer<typeof PainPointSchema>

export const OpportunitySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  estimatedValue: z.number().optional(),
  probability: z.enum(['high', 'medium', 'low']),
  status: z.enum(['identified', 'qualified', 'pursuing', 'won', 'lost']),
  type: z.enum(['upsell', 'cross_sell', 'expansion', 'new_use_case']),
})
export type Opportunity = z.infer<typeof OpportunitySchema>

export const ActionItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  owner: z.string(),
  dueDate: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['todo', 'in-progress', 'done']),
  description: z.string().default(''),
})
export type ActionItem = z.infer<typeof ActionItemSchema>

export const CompetitorSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['competitor_for_us', 'competitor_for_customer']),
  threat: z.enum(['high', 'medium', 'low']),
  notes: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
})
export type Competitor = z.infer<typeof CompetitorSchema>

// Full account plan combining all tab data
export const AccountPlanSchema = z.object({
  customerName: z.string(),
  stakeholders: z.array(StakeholderSchema),
  painPoints: z.array(PainPointSchema),
  opportunities: z.array(OpportunitySchema),
  actionItems: z.array(ActionItemSchema),
  competitors: z.array(CompetitorSchema),
})
export type AccountPlan = z.infer<typeof AccountPlanSchema>
```

### Linking from Account Table to Account Detail
```typescript
// In account-table.tsx, customer_name column cell renderer:
{
  accessorKey: 'customer_name',
  header: 'Customer Name',
  cell: (info) => (
    <Link
      href={`/accounts/${encodeURIComponent(info.getValue() as string)}`}
      className="font-semibold text-blue-600 hover:underline"
    >
      {info.getValue() as string}
    </Link>
  ),
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit/core + sortable | 2023 (rbd deprecated) | rbd is unmaintained; dnd-kit is the standard |
| CSS-only org charts | react-organizational-chart | 2022+ | Library handles connector lines, nesting, spacing |
| Client-side tab routing | URL searchParams with useSearchParams | Next.js 13+ (App Router) | Tabs become bookmarkable, shareable, survive refresh |
| Full page re-render on tab | Client-side tab switch with server data | React 19 Server Components | Fetch once server-side, switch tabs client-side instantly |
| react-dnd | @dnd-kit | 2023+ | react-dnd also has React 19 compatibility issues |

**Deprecated/outdated:**
- **react-beautiful-dnd**: No longer maintained. Do NOT use.
- **react-dnd**: React 19 compatibility issues (issue #3655). Prefer @dnd-kit.
- **@dnd-kit/react (0.2.x)**: Pre-1.0, not production ready. Use @dnd-kit/core + @dnd-kit/sortable.

## Existing Codebase Assets (Reuse, Don't Rebuild)

Critical existing code that Phase 4 should leverage:

| Asset | Location | How to Reuse |
|-------|----------|-------------|
| Customer data fetching | `src/lib/data/server/account-data.ts` | `getAllCustomersWithHealth()` for finding specific customer |
| Health scoring | `src/lib/semantic/schema/customer.ts` | `calculateHealthScore()` for Overview tab |
| Claude orchestrator | `src/lib/intelligence/claude/orchestrator.ts` | `getOrchestrator().processRequest()` for insights |
| Account intel prompt | `src/lib/intelligence/claude/prompts/account-intel.ts` | Enhance for competitive + strategy analysis |
| NewsAPI adapter | `src/lib/data/adapters/external/newsapi.ts` | Fetch news for Intelligence tab |
| News article types | `src/lib/types/news.ts` | `NewsArticle`, `CustomerNews` schemas |
| Result type | `src/lib/types/result.ts` | `ok()`, `err()` for all data boundaries |
| Card component | `src/components/ui/card.tsx` | Reuse for all card-based layouts |
| Badge component | `src/components/ui/badge.tsx` | Reuse for priority badges, role badges, status |
| Health indicator | `src/components/ui/health-indicator.tsx` | Reuse for Overview tab health display |
| KPI card | `src/components/ui/kpi-card.tsx` | Reuse for financial KPIs in Overview/Financials tabs |
| Pre-generated intelligence | `data/intelligence/reports/*.md` | Parse and display in Intelligence tab as fallback |
| Pre-fetched news | `data/news/*.json` | Use as cached/fallback news data |
| Nav bar | `src/components/ui/nav-bar.tsx` | Update links array to highlight Accounts for detail pages |
| Existing account table | `src/app/accounts/components/account-table.tsx` | Add Link to customer_name column for navigation |

## Open Questions

Things that couldn't be fully resolved:

1. **Account ID Strategy**
   - What we know: Customers are identified by `customer_name` string. No numeric IDs exist.
   - What's unclear: Whether URL-encoded names (e.g., `AT%26T%20SERVICES%2C%20INC.`) are acceptable UX, or if we need a slug/hash system.
   - Recommendation: Use `encodeURIComponent(customer_name)` for URLs. It works, and for a 24-hour demo, the URL aesthetics are secondary to functionality. Add a helper function `customerToSlug()` if needed later.

2. **Mock Data Volume**
   - What we know: Stakeholders, pain points, action items, and competitors don't exist in Excel data. Need mock data.
   - What's unclear: How many mock accounts should have full plan data (all 140? top 10? just demo accounts?).
   - Recommendation: Create detailed mock plans for 3-5 top customers per BU (matched to existing intelligence reports in `data/intelligence/reports/`). Show empty states with helpful CTAs for other accounts.

3. **react-organizational-chart with React 19**
   - What we know: Library is actively maintained (192+ stars, MIT license), accepts any React children as nodes.
   - What's unclear: No explicit React 19 compatibility statement found. Package may use older React patterns.
   - Recommendation: Install and test immediately. Fallback plan: a simple CSS-only tree using nested `<ul>` with `border-left` connectors (less polished but guaranteed to work).

## Sources

### Primary (HIGH confidence)
- Next.js App Router docs: Dynamic Routes, useSearchParams, Parallel Routes
- @dnd-kit official docs: Sortable preset, SortableContext, useSortable, collision detection
- Existing codebase: All patterns verified from actual source files in `src/`

### Secondary (MEDIUM confidence)
- [dnd-kit Kanban tutorials](https://plaintext-engineering.com/blog/drag-n-drop-kanban-board-react/) - Multiple concordant community tutorials
- [react-organizational-chart GitHub](https://github.com/daniel-hauser/react-organizational-chart) - API verified from README
- [shadcn Kanban with dnd-kit](https://marmelab.com/blog/2026/01/15/building-a-kanban-board-with-shadcn.html) - Recent (Jan 2026) confirming dnd-kit is current standard

### Tertiary (LOW confidence)
- @dnd-kit/react (0.2.x) stability assessment - based on version number and issue reports, not official statement
- react-organizational-chart React 19 compatibility - no official statement found

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All core libraries already in project. New deps (dnd-kit, react-organizational-chart) are well-documented with community consensus.
- Architecture: HIGH - Patterns follow existing codebase conventions (Server Component pages, Client Component islands, Result types, Zod schemas).
- Pitfalls: HIGH - Based on real data inspection (customer names with special chars, mock data needs, DnD context nesting).
- New library compatibility: MEDIUM - dnd-kit core/sortable well-proven, but react-organizational-chart lacks explicit React 19 testing.

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days - stable libraries, well-understood patterns)
