// DM% Strategy Component Library - TypeScript Types

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export type BusinessUnit = 'Cloudsense' | 'Kandy' | 'STL';

export type RecommendationStatus = 'pending' | 'accepted' | 'deferred' | 'in_progress' | 'completed';

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface Recommendation {
  id: string;
  accountName: string;
  businessUnit: BusinessUnit;
  priority: Priority;
  title: string;
  description: string;
  dmImpact: number; // percentage points
  arrImpact: number; // dollars
  confidence: number; // percentage 0-100
  owner?: string;
  timeline: string; // e.g., "Q1 2026", "30 days"
  risk: string; // e.g., "Low", "Medium", "High"
  status: RecommendationStatus;
  category?: string; // e.g., "Pricing", "Engagement", "Technical"
  createdAt: Date;
  dueDate?: Date;
}

export interface BusinessUnitMetrics {
  name: BusinessUnit;
  currentDM: number; // percentage
  targetDM: number; // percentage
  trend: TrendDirection;
  trendValue: number; // percentage points change
  arr: number; // annual recurring revenue
  accountCount: number;
  recommendationCount: number;
  color: string; // hex color for branding
}

export interface ImpactProjection {
  currentDM: number;
  projectedDM: number;
  dmDelta: number;
  currentARR: number;
  projectedARR: number;
  arrDelta: number;
  acceptedRecommendations: number;
  totalRecommendations: number;
}

export interface FilterOption {
  id: string;
  label: string;
  count: number;
  active: boolean;
}

export interface ActionItem {
  recommendationId: string;
  assignedTo: string;
  dueDate: Date;
  priority: Priority;
  board: string; // e.g., "Account Plan Actions", "Engineering Backlog"
  status: 'todo' | 'in_progress' | 'completed';
  notes?: string;
}

export interface AccountHealthSummary {
  accountName: string;
  businessUnit: BusinessUnit;
  healthScore: number; // 0-100
  renewalDate: Date;
  dmRisk: 'low' | 'medium' | 'high' | 'critical';
  currentDM: number;
  targetDM: number;
  arr: number;
  recommendationCount: number;
}

export interface DashboardStats {
  currentDM: number;
  potentialARR: number;
  activeRecommendations: number;
  totalAccounts: number;
  atRiskAccounts: number;
}
