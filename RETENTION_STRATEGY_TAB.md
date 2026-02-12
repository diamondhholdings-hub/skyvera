# Retention Strategy Tab - Integration Guide

## Overview

The **Retention Strategy** tab is the 8th tab in the Account Plan pages, providing AI-generated DM% (Decline/Maintenance) recommendations to reduce churn risk and improve customer retention.

## Features Implemented

### 1. Tab Navigation
- **Location**: 8th tab after "Action Items"
- **URL**: `/accounts/[name]?tab=retention`
- **Label**: "Retention Strategy"

### 2. DM% Risk Assessment
Calculates risk level based on multiple factors:
- **Health Score**: Red health (<60) adds +40 points, Yellow (<75) adds +20 points
- **Renewal Proximity**: <90 days adds +30 points, <180 days adds +15 points
- **Open Pain Points**: >2 unresolved adds +20 points
- **Competitive Threats**: Active evaluation adds +10 points

Risk levels:
- **HIGH**: 60+ points (red indicator)
- **MEDIUM**: 30-59 points (orange indicator)
- **LOW**: 0-29 points (green indicator)

### 3. AI-Generated Recommendations
Each recommendation includes:
- **Priority**: High/Medium/Low badge
- **Title & Description**: Clear action to take
- **Impact Metrics**:
  - ARR Impact (projected revenue change)
  - DM% Impact (percentage point change)
  - Margin Impact (optional)
  - Confidence Score (0-100%)
- **Timeline**: Implementation timeframe
- **Owner**: Assigned team member
- **Actions**: "Accept & Create Action" or "Defer" buttons

### 4. Recommendation Statuses
- **Pending**: New recommendation awaiting review
- **Accepted**: Linked to action item in Action Items tab
- **Implemented**: Completed with actual results
- **Dismissed**: Deferred or rejected

### 5. Empty State
For accounts with LOW risk and no recommendations:
- Green success message: "No Retention Concerns Identified"
- Displays current health metrics
- Positive reinforcement

## Technical Implementation

### Database Schema (Prisma)
```prisma
model DMRecommendation {
  id                  Int      @id @default(autoincrement())
  recommendationId    String   @unique @default(cuid())
  accountName         String
  title               String
  description         String
  priority            String   // high/medium/low
  arrImpact           Float
  dmImpact            Float
  marginImpact        Float?
  confidence          Float    // 0-100
  timeline            String
  owner               String?
  status              String   // pending/accepted/implemented/dismissed
  acceptedAt          DateTime?
  implementedAt       DateTime?
  linkedActionId      String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

### TypeScript Types
Located in `/src/lib/types/account-plan.ts`:
- `DMRecommendation`
- `DMRecommendationStatus`
- `DMRiskLevel` ('HIGH' | 'MEDIUM' | 'LOW')
- `RetentionStrategy`

### Server Functions
Located in `/src/lib/data/server/account-plan-data.ts`:
- `getDMRecommendations(customerName)`: Fetch recommendations from JSON
- `getAccountRetentionStrategy(customerName, params)`: Calculate risk and fetch recommendations
- `calculateDMRisk(params)`: Risk scoring algorithm

### Components
- **RetentionTab** (`/src/app/accounts/[name]/_components/retention-tab.tsx`)
  - Server Component
  - Displays risk assessment and recommendations
  - Handles empty states

## Data Structure

### Recommendation JSON Format
Location: `/data/account-plans/dm-recommendations/{account-slug}.json`

Example:
```json
[
  {
    "id": "dm-rec-1",
    "recommendationId": "dm-rec-bt-001",
    "accountName": "British Telecommunications plc",
    "title": "Proactive License Optimization & Training Program",
    "description": "Customer currently has 850 active licenses...",
    "priority": "high",
    "arrImpact": 125000,
    "dmImpact": 2.8,
    "marginImpact": 1.2,
    "confidence": 85,
    "timeline": "30-60 days",
    "owner": "Emma Thompson (CSM)",
    "status": "pending",
    "createdAt": "2026-02-10T08:00:00Z"
  }
]
```

### Sample Data
Created for 4 accounts:
1. **British Telecommunications plc**: 4 high/medium priority recommendations
2. **AT&T SERVICES, INC.**: 3 recommendations including competitive defense
3. **Verizon Communications Inc.**: 3 recommendations including SLA breach
4. **Vodafone Group plc**: Empty array (LOW risk demo)

## File Locations

### New Files
- `/src/app/accounts/[name]/_components/retention-tab.tsx` - Main tab component
- `/data/account-plans/dm-recommendations/*.json` - Recommendation data files
- `/RETENTION_STRATEGY_TAB.md` - This documentation

### Modified Files
- `/src/app/accounts/[name]/page.tsx` - Added retention tab rendering
- `/src/app/accounts/[name]/_components/tab-navigation.tsx` - Added 8th tab
- `/src/lib/data/server/account-plan-data.ts` - Added retention strategy functions
- `/src/lib/types/account-plan.ts` - Added DM recommendation types
- `/prisma/schema.prisma` - Added DMRecommendation model

## Usage

### Viewing Retention Strategy
1. Navigate to any account: `/accounts/british-telecommunications-plc`
2. Click "Retention Strategy" tab
3. View risk assessment and recommendations

### Adding Recommendations for New Accounts
1. Create JSON file: `/data/account-plans/dm-recommendations/{account-slug}.json`
2. Use slugified account name (lowercase, hyphens, no special chars)
3. Follow JSON structure above
4. Restart dev server or rebuild

### Integrating with Action Items (Future)
The "Accept & Create Action" button currently shows an alert. To implement:
1. Create API route: `/api/account-plans/accept-recommendation`
2. Create ActionItem in database with `linkedRecommendationId`
3. Update recommendation status to "accepted"
4. Refresh Action Items tab to show new action

## Health Score Conversion
Since customer health is stored as "green"/"yellow"/"red" strings, the system converts:
- **green** → 85 (numeric)
- **yellow** → 65 (numeric)
- **red** → 35 (numeric)

This allows numeric risk calculations while preserving the color-based health system.

## Design Principles

### Skyvera Branding
- Blue/cyan accent colors
- Clean, professional card layouts
- Consistent with existing account plan tabs
- Clear visual hierarchy

### User Experience
- Priority-based sorting (high → medium → low)
- Color-coded risk levels
- Clear impact metrics prominently displayed
- One-click action acceptance
- Empty state for healthy accounts

## Future Enhancements

1. **Action Item Integration**: Complete the flow to create linked action items
2. **Historical Tracking**: Track actual vs. projected impact for completed recommendations
3. **AI Regeneration**: Button to regenerate recommendations based on latest data
4. **Bulk Accept**: Accept multiple recommendations at once
5. **Email Notifications**: Alert account managers of new high-priority recommendations
6. **Recommendation Templates**: Pre-defined recommendation types with smart defaults
7. **Impact Analytics**: Dashboard showing aggregate DM% improvement across all accounts

## Testing

### Manual Testing Checklist
- [ ] Navigate to British Telecommunications plc account
- [ ] Click "Retention Strategy" tab
- [ ] Verify risk assessment displays correctly
- [ ] Verify 4 recommendations display with metrics
- [ ] Click "Accept & Create Action" (should show alert)
- [ ] Navigate to Vodafone Group plc
- [ ] Verify empty state displays for LOW risk account
- [ ] Test mobile responsive layout

### Accounts with Sample Data
1. British Telecommunications plc - HIGH risk, 4 recommendations
2. AT&T SERVICES, INC. - MEDIUM/HIGH risk, 3 recommendations
3. Verizon Communications Inc. - MEDIUM risk, 3 recommendations
4. Vodafone Group plc - LOW risk, 0 recommendations (empty state)

## Notes

- Recommendations are currently stored as static JSON files
- Future iterations will generate recommendations dynamically using AI
- Risk scoring algorithm is configurable via `calculateDMRisk()` function
- All currency values in recommendations are in USD

## Support

For questions or issues:
1. Check TypeScript types in `/src/lib/types/account-plan.ts`
2. Review sample data in `/data/account-plans/dm-recommendations/`
3. Check server logs for data fetching errors
4. Verify Prisma client is regenerated after schema changes
