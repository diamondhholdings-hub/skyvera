# DM% Strategy Component Tree

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                         App Layout                               │
└─────────────────────────────────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼─────────┐ ┌───▼──────┐  ┌─────▼──────────┐
    │  DM Strategy Page │ │Dashboard │  │ Account Plan   │
    └───────────────────┘ └──────────┘  └────────────────┘
              │                │                │
              │                │                │
    ┌─────────▼─────────┐     │         ┌──────▼─────────┐
    │  DMStrategyHero   │     │         │  RetentionTab  │
    └───────────────────┘     │         └────────────────┘
              │                │                │
    ┌─────────▼─────────┐     │         ┌──────▼─────────┐
    │PortfolioDashboard │     │         │  HealthSummary │
    └───────────────────┘     │         └────────────────┘
              │                │                │
        ┌─────┼─────┐          │         ┌──────▼─────────┐
        │     │     │          │         │RecommendCard(s)│
        ▼     ▼     ▼          │         └────────────────┘
       BU  Rec.  Impact        │
      Card Feed  Calc.         │
        │     │     │          │
        │     │     └──────────┤
        │     │                │
        │     └──────────┬─────┤
        │                │     │
        ▼                ▼     ▼
      Click      Filter   Modal
    Handler       Tabs    Accept
```

## Component Details

### Page Level Components

#### 1. **DM Strategy Page** (`/dm-strategy/demo/page.tsx`)
```
DMStrategyPage
├─ DMStrategyHero (stats)
└─ PortfolioDashboard (BUs, recommendations)
```

#### 2. **Executive Dashboard** (`/dashboard`)
```
Dashboard
└─ DMBriefingWidget (urgent recommendations)
   ├─ Recommendation rows (compact)
   └─ Total impact summary
```

#### 3. **Account Plan** (`/accounts/[name]`)
```
AccountPlanPage
└─ TabNavigation
   └─ RetentionTab (8th tab)
      ├─ Health Summary (hero)
      └─ RecommendationCard(s)
```

---

### Composite Components

#### **PortfolioDashboard**
Main orchestrator component (3-column layout)

```
PortfolioDashboard
├─ Left Sidebar (300px)
│  ├─ BUCard (Cloudsense)
│  ├─ BUCard (Kandy)
│  └─ BUCard (STL)
│
├─ Center Feed (flex-1)
│  ├─ RecommendationFilters
│  │  ├─ Tab: All (count)
│  │  ├─ Tab: Critical (count)
│  │  ├─ Tab: High Impact (count)
│  │  └─ Tab: Quick Wins (count)
│  │
│  └─ RecommendationCard(s)
│     ├─ RecommendationCard #1
│     ├─ RecommendationCard #2
│     └─ RecommendationCard #3...
│
└─ Right Sidebar (350px, sticky)
   └─ ImpactCalculator
      ├─ DM% before/after
      ├─ ARR before/after
      ├─ Progress bar
      └─ "Accept All" button
```

**State Management:**
- `selectedBU` (string | null) - Filter by BU
- `activeFilter` (string) - Filter type (all/critical/high-impact/quick-wins)
- `isModalOpen` (boolean) - Accept modal visibility
- `selectedRecommendation` (Recommendation | null) - Modal data

**Props:**
```typescript
{
  businessUnits: BusinessUnitMetrics[]
  recommendations: Recommendation[]
}
```

---

### Atomic Components

#### **DMStrategyHero**
Hero section with portfolio stats

```
DMStrategyHero
├─ Heading + Subtitle
└─ Stats Grid
   ├─ Current DM% card
   ├─ Potential ARR card (highlighted)
   ├─ Active Recommendations card
   ├─ Total Accounts card
   └─ At-Risk Accounts card (conditional)
```

**Props:**
```typescript
{
  stats: DashboardStats {
    currentDM: number
    potentialARR: number
    activeRecommendations: number
    totalAccounts: number
    atRiskAccounts: number
  }
}
```

---

#### **RecommendationCard**
Individual recommendation with actions

```
RecommendationCard
├─ Priority badge (top)
├─ Account + BU tag
├─ Title (h3)
├─ Description
├─ Impact Metrics
│  ├─ DM% Impact
│  ├─ ARR Impact
│  └─ Confidence
├─ Metadata Tags
│  ├─ Owner
│  ├─ Timeline
│  ├─ Risk
│  └─ Category
└─ Action Buttons
   ├─ Accept & Create Action (cyan)
   ├─ Review Details (blue outline)
   └─ Defer (gray text)
```

**Props:**
```typescript
{
  recommendation: Recommendation
  onAccept?: (id: string) => void
  onReview?: (id: string) => void
  onDefer?: (id: string) => void
}
```

---

#### **BUCard**
Business unit overview with donut chart

```
BUCard
├─ Header
│  ├─ BU Name
│  └─ Recommendation count badge
├─ Donut Chart (SVG)
│  ├─ Background circle
│  ├─ Progress arc
│  └─ Center text (current/target)
├─ Trend indicator (↑/↓/→)
└─ Metrics
   ├─ ARR
   ├─ Accounts
   └─ Status (on/below target)
```

**Props:**
```typescript
{
  metrics: BusinessUnitMetrics {
    name: 'Cloudsense' | 'Kandy' | 'STL'
    currentDM: number
    targetDM: number
    trend: 'up' | 'down' | 'neutral'
    trendValue: number
    arr: number
    accountCount: number
    recommendationCount: number
    color: string
  }
  isActive?: boolean
  onClick?: (bu: string) => void
}
```

---

#### **ImpactCalculator**
Projected impact sidebar (sticky)

```
ImpactCalculator
├─ Header (with recommendation count)
├─ DM% Comparison
│  ├─ Current DM%
│  ├─ Arrow (→)
│  └─ Projected DM%
├─ DM% Delta Highlight (cyan gradient)
├─ ARR Comparison
│  ├─ Current ARR
│  ├─ Arrow (→)
│  └─ Projected ARR
├─ ARR Delta Highlight (green gradient)
├─ Progress Bar
│  └─ Accepted / Total
├─ "Accept All High Priority" button
└─ Summary Stats Panel
   ├─ DM% Lift
   ├─ ARR Growth %
   └─ Confidence
```

**Props:**
```typescript
{
  projection: ImpactProjection {
    currentDM: number
    projectedDM: number
    dmDelta: number
    currentARR: number
    projectedARR: number
    arrDelta: number
    acceptedRecommendations: number
    totalRecommendations: number
  }
  onAcceptAll?: () => void
}
```

---

#### **RecommendationFilters**
Horizontal tab bar

```
RecommendationFilters
├─ Tab: All (count badge)
├─ Tab: Critical (count badge)
├─ Tab: High Impact (count badge)
└─ Tab: Quick Wins (count badge)
```

**Props:**
```typescript
{
  filters: FilterOption[] {
    id: string
    label: string
    count: number
    active: boolean
  }
  onFilterChange: (filterId: string) => void
}
```

---

#### **AcceptRecommendationModal**
Modal for creating action items

```
AcceptRecommendationModal (Portal)
├─ Overlay (backdrop)
└─ Modal Content
   ├─ Header
   │  └─ Title + Recommendation summary
   ├─ Form Body
   │  ├─ Assign To (dropdown)
   │  ├─ Due Date (date picker)
   │  ├─ Priority (dropdown)
   │  ├─ Add to Board (dropdown)
   │  └─ Notes (textarea, optional)
   └─ Footer
      ├─ Cancel button (gray)
      └─ Create Action button (cyan)
```

**Props:**
```typescript
{
  recommendation: Recommendation
  isOpen: boolean
  onClose: () => void
  onSubmit: (actionItem: {
    assignedTo: string
    dueDate: Date
    priority: Priority
    board: string
    notes?: string
  }) => void
}
```

---

#### **DMBriefingWidget**
Compact widget for dashboard

```
DMBriefingWidget
├─ Header (blue background)
│  ├─ "💡 Revenue Retention Briefing"
│  └─ "View All →" link
├─ Recommendation Rows (max 5)
│  ├─ Row #1
│  │  ├─ Priority dot
│  │  ├─ Account name + BU tag
│  │  ├─ Title (truncated)
│  │  ├─ ARR impact
│  │  └─ Quick actions (Accept, Details)
│  ├─ Row #2
│  └─ Row #3...
└─ Summary Footer (cyan highlight)
   └─ Total Potential Impact
```

**Props:**
```typescript
{
  recommendations: Recommendation[]
  maxItems?: number  // default: 5
}
```

---

#### **RetentionTab**
Account-specific retention view

```
RetentionTab
├─ Health Summary (blue hero)
│  ├─ Health Score card
│  ├─ DM% Status card
│  ├─ Renewal Date card
│  └─ ARR card
├─ Section Header
│  └─ "Retention Recommendations" + pending count
└─ RecommendationCard(s) (account-filtered)
   ├─ RecommendationCard #1
   ├─ RecommendationCard #2
   └─ RecommendationCard #3...
```

**Props:**
```typescript
{
  accountName: string
  healthSummary: AccountHealthSummary {
    accountName: string
    businessUnit: BusinessUnit
    healthScore: number
    renewalDate: Date
    dmRisk: 'low' | 'medium' | 'high' | 'critical'
    currentDM: number
    targetDM: number
    arr: number
    recommendationCount: number
  }
  recommendations: Recommendation[]
}
```

---

## Data Flow

### Recommendation Lifecycle

```
1. DATA FETCH
   └─> Server fetches recommendations from database

2. DISPLAY
   ├─> PortfolioDashboard receives recommendations
   ├─> Filters applied (BU, priority, type)
   └─> RecommendationCard(s) rendered

3. USER INTERACTION
   ├─> User clicks "Accept & Create Action"
   └─> AcceptRecommendationModal opens

4. FORM SUBMISSION
   ├─> User fills form (assign, date, priority, board)
   ├─> Form submitted
   └─> Action item created

5. STATE UPDATE
   ├─> Recommendation status: pending → accepted
   ├─> ImpactCalculator updates projections
   └─> Progress bar increments
```

### Filtering Flow

```
1. BU FILTER
   ├─> User clicks BUCard
   ├─> selectedBU state updated
   └─> Recommendations filtered by BU

2. PRIORITY FILTER
   ├─> User clicks filter tab (All/Critical/High Impact/Quick Wins)
   ├─> activeFilter state updated
   └─> Recommendations filtered by criteria

3. COMBINED FILTER
   └─> Recommendations filtered by BOTH BU AND priority
```

### Impact Calculation

```
1. ACCEPTED RECOMMENDATIONS
   └─> Filter recommendations where status === 'accepted'

2. CALCULATE TOTALS
   ├─> Sum dmImpact values → totalDMImpact
   └─> Sum arrImpact values → totalARRImpact

3. PROJECT FUTURE STATE
   ├─> projectedDM = currentDM + totalDMImpact
   └─> projectedARR = currentARR + totalARRImpact

4. UPDATE DISPLAY
   └─> ImpactCalculator shows before/after comparison
```

---

## Styling System

### CSS Class Naming

All classes use `dm-` prefix for namespacing:

```
Component Classes:
  dm-card, dm-card-header, dm-card-body, dm-card-footer
  dm-hero, dm-hero-title, dm-hero-subtitle, dm-hero-stats
  dm-modal, dm-modal-overlay, dm-modal-header, dm-modal-body, dm-modal-footer

Typography:
  dm-h1, dm-h2, dm-h3, dm-h4
  dm-body, dm-body-sm, dm-caption

Buttons:
  dm-btn, dm-btn-primary, dm-btn-secondary, dm-btn-tertiary
  dm-btn-sm, dm-btn-md, dm-btn-lg

Badges:
  dm-badge, dm-badge-critical, dm-badge-warning, dm-badge-success
  dm-priority-badge, dm-priority-critical, dm-priority-high

Layout:
  dm-grid-3col, dm-sticky-sidebar
  dm-flex, dm-flex-col, dm-items-center, dm-justify-between

Utilities:
  dm-gap-xs/sm/md/lg
  dm-mb-xs/sm/md/lg/xl
  dm-truncate
```

### Color Variables

```css
--primary-blue: #0066A1;
--accent-cyan: #00B8D4;
--white: #FFFFFF;
--text-dark: #2C3E50;
--text-light: #95A5A6;
--background: #F8F9FA;
--border: #E1E8ED;
--critical: #E74C3C;
--warning: #F39C12;
--success: #27AE60;
```

---

## File Structure

```
src/app/
├─ dm-strategy/
│  ├─ styles.css                    # Complete CSS system
│  ├─ types.ts                      # TypeScript definitions
│  ├─ README.md                     # API documentation
│  ├─ COMPONENT_GUIDE.md            # Visual guide
│  ├─ COMPONENT_TREE.md             # This file
│  ├─ demo/
│  │  └─ page.tsx                   # Demo with sample data
│  └─ components/
│     ├─ index.ts                   # Export barrel
│     ├─ dm-strategy-hero.tsx       # Hero section
│     ├─ recommendation-card.tsx    # Recommendation card
│     ├─ bu-card.tsx               # Business unit card
│     ├─ impact-calculator.tsx     # Impact calculator
│     ├─ recommendation-filters.tsx # Filter tabs
│     ├─ accept-modal.tsx          # Accept modal
│     └─ portfolio-dashboard.tsx   # Main layout
│
├─ dashboard/
│  └─ components/
│     └─ dm-briefing-widget.tsx    # Dashboard widget
│
└─ accounts/[name]/
   └─ _components/
      └─ retention-tab.tsx         # Account retention tab
```

---

## Integration Points

### 1. Main Navigation
```tsx
// Add to main nav
<NavLink href="/dm-strategy">DM% Strategy</NavLink>
```

### 2. Executive Dashboard
```tsx
// Add widget to dashboard
import DMBriefingWidget from '@/app/dashboard/components/dm-briefing-widget';

<DMBriefingWidget recommendations={urgentRecommendations} maxItems={5} />
```

### 3. Account Plans
```tsx
// Already integrated as 8th tab
<TabNavigation activeTab="retention" />
<RetentionTab {...props} />
```

---

## Technology Stack

- **React 18+** - Component library
- **TypeScript** - Type safety
- **CSS Variables** - Theming
- **Next.js 14+** - Framework (App Router)
- **No external UI libraries** - Pure React components

---

**Complete Component Tree Documentation**
