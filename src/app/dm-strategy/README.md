# DM% Strategy & Revenue Retention Component Library

Complete UI component library for the DM% (Decline/Maintenance) Strategy and Revenue Retention system, built with Skyvera's official brand identity.

## 🎨 Brand Identity

### Colors
```css
--primary-blue: #0066A1;     /* Hero backgrounds, primary elements */
--accent-cyan: #00B8D4;      /* Interactive elements, highlights, CTAs */
--white: #FFFFFF;
--text-dark: #2C3E50;
--text-light: #95A5A6;
--background: #F8F9FA;
--border: #E1E8ED;
--critical: #E74C3C;
--warning: #F39C12;
--success: #27AE60;
```

### Typography
- Font: DM Sans (or Inter fallback)
- Clean, modern sans-serif throughout
- Professional B2B SaaS aesthetic

### Design Principles
- Clean, data-focused layouts
- White backgrounds with blue hero sections
- Subtle shadows and borders
- Cyan (#00B8D4) for interactive elements
- Blue (#0066A1) for primary branding

## 📦 Components

### 1. DMStrategyHero
**Location:** `components/dm-strategy-hero.tsx`

Full-width blue hero section with key portfolio statistics.

**Props:**
```typescript
interface DMStrategyHeroProps {
  stats: DashboardStats;
}

interface DashboardStats {
  currentDM: number;          // Current DM% rate
  potentialARR: number;        // Potential ARR recovery (dollars)
  activeRecommendations: number;
  totalAccounts: number;
  atRiskAccounts: number;
}
```

**Features:**
- Gradient blue background
- Translucent stat cards with blur effect
- Highlighted "Potential ARR" card with cyan accent
- Responsive grid layout
- At-risk accounts shown conditionally

**Example:**
```tsx
<DMStrategyHero
  stats={{
    currentDM: 8.2,
    potentialARR: 2100000,
    activeRecommendations: 12,
    totalAccounts: 140,
    atRiskAccounts: 8
  }}
/>
```

---

### 2. RecommendationCard
**Location:** `components/recommendation-card.tsx`

Individual recommendation card with priority, metrics, and action buttons.

**Props:**
```typescript
interface RecommendationCardProps {
  recommendation: Recommendation;
  onAccept?: (id: string) => void;
  onReview?: (id: string) => void;
  onDefer?: (id: string) => void;
}
```

**Features:**
- Colored left border matching priority
- Priority badge (critical=red, high=orange, medium=green, low=gray)
- Account name + BU tag
- Impact metrics: DM%, ARR, Confidence
- Metadata tags: Owner, Timeline, Risk
- Three action buttons: Accept, Review, Defer
- Status indicator for non-pending recommendations

---

### 3. BUCard
**Location:** `components/bu-card.tsx`

Business unit overview card with DM% donut chart.

**Props:**
```typescript
interface BUCardProps {
  metrics: BusinessUnitMetrics;
  isActive?: boolean;
  onClick?: (bu: string) => void;
}

interface BusinessUnitMetrics {
  name: 'Cloudsense' | 'Kandy' | 'STL';
  currentDM: number;
  targetDM: number;
  trend: 'up' | 'down' | 'neutral';
  trendValue: number;
  arr: number;
  accountCount: number;
  recommendationCount: number;
  color: string;
}
```

**Features:**
- Colored left border (blue=Cloudsense, cyan=Kandy, green=STL)
- SVG donut chart showing DM% vs target
- Trend indicator with arrow
- Recommendation count badge
- ARR, account count, target status
- Clickable for filtering
- Active state styling

---

### 4. ImpactCalculator
**Location:** `components/impact-calculator.tsx`

Sticky sidebar calculator showing projected impact of recommendations.

**Props:**
```typescript
interface ImpactCalculatorProps {
  projection: ImpactProjection;
  onAcceptAll?: () => void;
}

interface ImpactProjection {
  currentDM: number;
  projectedDM: number;
  dmDelta: number;
  currentARR: number;
  projectedARR: number;
  arrDelta: number;
  acceptedRecommendations: number;
  totalRecommendations: number;
}
```

**Features:**
- Before/after comparison for DM% and ARR
- Cyan gradient highlight boxes for deltas
- Progress bar showing implementation %
- "Accept All High Priority" button
- Summary stats panel
- Sticky positioning

---

### 5. RecommendationFilters
**Location:** `components/recommendation-filters.tsx`

Horizontal tab bar for filtering recommendations.

**Props:**
```typescript
interface RecommendationFiltersProps {
  filters: FilterOption[];
  onFilterChange: (filterId: string) => void;
}

interface FilterOption {
  id: string;
  label: string;
  count: number;
  active: boolean;
}
```

**Features:**
- Four default filters: All, Critical, High Impact, Quick Wins
- Count badges on each tab
- Blue underline for active tab
- Horizontal scrolling on mobile

---

### 6. AcceptRecommendationModal
**Location:** `components/accept-modal.tsx`

Modal for creating action items from recommendations.

**Props:**
```typescript
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
```

**Features:**
- Full-screen overlay with backdrop
- Form with dropdowns and date picker
- Recommendation summary at top
- Assign to team/person
- Due date (with suggested timeline)
- Priority selector
- Board selector (Account Plan Actions, Engineering Backlog, etc.)
- Optional notes textarea
- Create & Cancel buttons

---

### 7. PortfolioDashboard
**Location:** `components/portfolio-dashboard.tsx`

Main 3-column layout orchestrating all components.

**Props:**
```typescript
interface PortfolioDashboardProps {
  businessUnits: BusinessUnitMetrics[];
  recommendations: Recommendation[];
}
```

**Layout:**
- **Left (300px):** BU overview cards
- **Center (flex 1):** Recommendation feed with filters
- **Right (350px, sticky):** Impact calculator

**Features:**
- BU filtering (click BU card to filter)
- Filter tabs (All, Critical, High Impact, Quick Wins)
- Empty state when no recommendations match
- Modal integration for accepting recommendations
- Responsive (stacks on mobile)

---

### 8. DMBriefingWidget
**Location:** `../../dashboard/components/dm-briefing-widget.tsx`

Compact widget for executive dashboard showing urgent recommendations.

**Props:**
```typescript
interface DMBriefingWidgetProps {
  recommendations: Recommendation[];
  maxItems?: number;  // default: 5
}
```

**Features:**
- Blue header with "View All →" link
- Shows critical and high priority recommendations only
- Compact rows with priority dot, account, title
- ARR impact highlighted
- Accept/Details quick actions
- Total impact summary footer

---

### 9. RetentionTab (Integration)
**Location:** `../../accounts/[name]/_components/retention-tab.tsx`

Account-specific retention tab showing health summary and recommendations.

**Props:**
```typescript
interface RetentionTabProps {
  accountName: string;
  healthSummary: AccountHealthSummary;
  recommendations: Recommendation[];
}
```

**Features:**
- Blue hero with health metrics (4-card grid)
- Health score, DM% risk, renewal date, ARR
- List of account-specific recommendations
- Accept/Review/Defer buttons inline
- Empty state for healthy accounts

---

## 🗂️ File Structure

```
src/app/dm-strategy/
├── styles.css                 # Complete style system
├── types.ts                   # TypeScript types
├── README.md                  # This file
├── demo/
│   └── page.tsx              # Demo page with sample data
└── components/
    ├── dm-strategy-hero.tsx
    ├── recommendation-card.tsx
    ├── bu-card.tsx
    ├── impact-calculator.tsx
    ├── recommendation-filters.tsx
    ├── accept-modal.tsx
    └── portfolio-dashboard.tsx
```

## 🎯 Usage Examples

### Full Portfolio Page
```tsx
import DMStrategyHero from './components/dm-strategy-hero';
import PortfolioDashboard from './components/portfolio-dashboard';

export default function DMStrategyPage() {
  return (
    <div>
      <DMStrategyHero stats={dashboardStats} />
      <PortfolioDashboard
        businessUnits={businessUnits}
        recommendations={recommendations}
      />
    </div>
  );
}
```

### Dashboard Widget
```tsx
import DMBriefingWidget from './dashboard/components/dm-briefing-widget';

<DMBriefingWidget
  recommendations={recommendations}
  maxItems={5}
/>
```

### Account Plan Tab
```tsx
import RetentionTab from './accounts/[name]/_components/retention-tab';

<RetentionTab
  accountName="Telstra Corporation"
  healthSummary={healthSummary}
  recommendations={accountRecommendations}
/>
```

## 🧪 Demo Page

View all components with sample data:
```
http://localhost:3000/dm-strategy/demo
```

## 🎨 CSS Classes

All components use the custom CSS classes defined in `styles.css`:

### Typography
- `.dm-h1` through `.dm-h4`
- `.dm-body`, `.dm-body-sm`, `.dm-caption`

### Layout
- `.dm-card`, `.dm-card-header`, `.dm-card-body`, `.dm-card-footer`
- `.dm-grid-3col` (responsive 3-column grid)
- `.dm-sticky-sidebar`

### Buttons
- `.dm-btn` + `.dm-btn-primary` (cyan)
- `.dm-btn` + `.dm-btn-secondary` (blue outline)
- `.dm-btn` + `.dm-btn-tertiary` (text only)
- Size modifiers: `.dm-btn-sm`, `.dm-btn-md`, `.dm-btn-lg`

### Badges
- `.dm-badge`, `.dm-badge-critical`, `.dm-badge-warning`, `.dm-badge-success`, `.dm-badge-info`, `.dm-badge-neutral`
- `.dm-priority-badge` + `.dm-priority-critical/high/medium/low`

### Utilities
- `.dm-flex`, `.dm-flex-col`, `.dm-items-center`, `.dm-justify-between`
- `.dm-gap-xs/sm/md/lg`
- `.dm-mb-xs/sm/md/lg/xl`, `.dm-mt-xs/sm/md/lg/xl`
- `.dm-truncate`

## 🔧 TypeScript Types

All types are defined in `types.ts`:

- `Priority`: 'critical' | 'high' | 'medium' | 'low'
- `BusinessUnit`: 'Cloudsense' | 'Kandy' | 'STL'
- `RecommendationStatus`: 'pending' | 'accepted' | 'deferred' | 'in_progress' | 'completed'
- `TrendDirection`: 'up' | 'down' | 'neutral'
- `Recommendation`: Full recommendation object
- `BusinessUnitMetrics`: BU summary metrics
- `ImpactProjection`: Projected impact calculations
- `FilterOption`: Filter tab configuration
- `ActionItem`: Action item for tracking
- `AccountHealthSummary`: Account health metrics
- `DashboardStats`: Portfolio-level statistics

## 🚀 Production Checklist

- [x] All components use "use client" directive
- [x] TypeScript types defined
- [x] Skyvera brand colors applied (blue #0066A1, cyan #00B8D4)
- [x] Clean B2B SaaS aesthetic
- [x] Responsive design (mobile stacking)
- [x] Accessible (semantic HTML, keyboard navigation)
- [x] No emojis (professional)
- [x] Consistent naming conventions
- [x] Documentation complete

## 📝 Notes

- All currency formatting uses helper functions (M, K notation)
- Percentage formatting shows +/- for deltas
- Colors use CSS variables for consistency
- Components are self-contained with minimal dependencies
- Modal uses portal pattern with backdrop click-to-close
- Sticky sidebar uses `position: sticky` for smooth scrolling

## 🔗 Integration Points

1. **Dashboard** - Add DMBriefingWidget to executive dashboard
2. **Account Plans** - RetentionTab already integrated as 8th tab
3. **Navigation** - Add "DM% Strategy" link to main nav
4. **API** - Connect to backend for recommendation CRUD operations
5. **Notifications** - Alert on critical recommendations
6. **Reporting** - Export impact projections to Excel

---

Built with ❤️ using Skyvera's brand identity.
