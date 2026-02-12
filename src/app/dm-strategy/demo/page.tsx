'use client';

import React from 'react';
import Link from 'next/link';
import DMStrategyHero from '../components/dm-strategy-hero';
import PortfolioDashboard from '../components/portfolio-dashboard';
import { sampleBusinessUnits } from './demo-data';
import type { Recommendation, DashboardStats } from '../types';
import '../styles.css';

/**
 * Demo Page - Shows all DM% Strategy Components with Sample Data
 * This demonstrates the complete UI component library with Skyvera branding
 */

// Sample Data
const sampleStats: DashboardStats = {
  currentDM: 94.8,       // TTM - Primary metric (trailing 12 months)
  monthlyDM: 93.5,       // January 2026 (volatile, one bad month)
  quarterlyDM: 94.2,     // Q1'26 (3-month average)
  ttmDM: 94.8,           // Trailing 12 months (most stable)
  potentialARR: 2100000, // $2.1M ARR at risk or recoverable
  activeRecommendations: 12,
  totalAccounts: 140,
  atRiskAccounts: 8      // 8 accounts below 90% retention threshold
};

const sampleRecommendations: Recommendation[] = [
  {
    id: '1',
    accountName: 'Telstra Corporation',
    businessUnit: 'Cloudsense',
    priority: 'critical',
    title: 'Optimize Salesforce UK Contract - $4.1M Annual Cost',
    description: 'Current Salesforce UK contract represents 64% of Q1\'26 revenue. Renegotiate terms, explore alternatives, or implement usage optimization to reduce costs and improve margins.',
    dmImpact: 2.5,
    arrImpact: 850000,
    confidence: 92,
    owner: 'Pricing Team',
    timeline: 'Q1 2026',
    risk: 'Low',
    status: 'pending',
    category: 'Pricing',
    createdAt: new Date('2026-02-10')
  },
  {
    id: '2',
    accountName: 'Vodafone Group',
    businessUnit: 'Kandy',
    priority: 'high',
    title: 'Implement Feature Adoption Program',
    description: 'Usage analytics show 40% of licensed features are unused. Create adoption program to increase utilization and demonstrate value before renewal.',
    dmImpact: 1.8,
    arrImpact: 450000,
    confidence: 85,
    owner: 'Customer Success',
    timeline: '60 days',
    risk: 'Medium',
    status: 'pending',
    category: 'Engagement',
    createdAt: new Date('2026-02-09')
  },
  {
    id: '3',
    accountName: 'Deutsche Telekom',
    businessUnit: 'Cloudsense',
    priority: 'critical',
    title: 'Address API Performance Issues',
    description: 'Support tickets indicate recurring API latency issues. Engineering review shows optimization opportunities that could prevent churn at renewal.',
    dmImpact: 3.2,
    arrImpact: 680000,
    confidence: 78,
    owner: 'Engineering',
    timeline: 'Q1 2026',
    risk: 'High',
    status: 'pending',
    category: 'Technical',
    createdAt: new Date('2026-02-08')
  },
  {
    id: '4',
    accountName: 'AT&T',
    businessUnit: 'Kandy',
    priority: 'medium',
    title: 'Expand Seat Count via Department Rollout',
    description: 'Currently deployed in 2 departments. Analysis shows 5 additional departments could benefit. Target expansion to increase ARR and utilization.',
    dmImpact: 0.8,
    arrImpact: 320000,
    confidence: 88,
    owner: 'Account Manager',
    timeline: 'Q2 2026',
    risk: 'Low',
    status: 'pending',
    category: 'Expansion',
    createdAt: new Date('2026-02-07')
  },
  {
    id: '5',
    accountName: 'Orange SA',
    businessUnit: 'STL',
    priority: 'high',
    title: 'Consolidate Redundant Licenses',
    description: 'License audit reveals 15% overlap with deprecated products. Consolidate to modern platform, reduce cost, improve experience.',
    dmImpact: 1.5,
    arrImpact: 280000,
    confidence: 91,
    owner: 'Product',
    timeline: '45 days',
    risk: 'Low',
    status: 'pending',
    category: 'Pricing',
    createdAt: new Date('2026-02-06')
  },
  {
    id: '6',
    accountName: 'BT Group',
    businessUnit: 'Cloudsense',
    priority: 'medium',
    title: 'Schedule Executive Business Review',
    description: 'No EBR in past 180 days. Schedule strategic review to align on roadmap, gather feedback, and strengthen executive relationships.',
    dmImpact: 0.5,
    arrImpact: 150000,
    confidence: 72,
    owner: 'Account Manager',
    timeline: '30 days',
    risk: 'Low',
    status: 'pending',
    category: 'Engagement',
    createdAt: new Date('2026-02-05')
  },
  {
    id: '7',
    accountName: 'Verizon',
    businessUnit: 'Kandy',
    priority: 'critical',
    title: 'Resolve Billing Dispute - $120K Outstanding',
    description: 'AR aging shows $120K > 90 days. Billing dispute related to contract interpretation. Immediate resolution required to prevent escalation.',
    dmImpact: 2.0,
    arrImpact: 520000,
    confidence: 95,
    owner: 'Account Manager',
    timeline: 'Immediate',
    risk: 'High',
    status: 'pending',
    category: 'Financial',
    createdAt: new Date('2026-02-11')
  },
  {
    id: '8',
    accountName: 'Telefonica',
    businessUnit: 'STL',
    priority: 'low',
    title: 'Increase Training Participation',
    description: 'Only 30% of users have completed onboarding training. Higher training completion correlates with lower churn. Incentivize participation.',
    dmImpact: 0.3,
    arrImpact: 85000,
    confidence: 68,
    owner: 'Customer Success',
    timeline: 'Q2 2026',
    risk: 'Low',
    status: 'pending',
    category: 'Engagement',
    createdAt: new Date('2026-02-04')
  },
  {
    id: '9',
    accountName: 'Sprint/T-Mobile',
    businessUnit: 'Cloudsense',
    priority: 'high',
    title: 'Migrate Legacy Integration to Modern API',
    description: 'Account uses deprecated integration that will be sunset. Proactive migration to modern API prevents disruption and enables new features.',
    dmImpact: 1.2,
    arrImpact: 410000,
    confidence: 89,
    owner: 'Engineering',
    timeline: 'Q1 2026',
    risk: 'Medium',
    status: 'pending',
    category: 'Technical',
    createdAt: new Date('2026-02-03')
  },
  {
    id: '10',
    accountName: 'Singtel',
    businessUnit: 'Kandy',
    priority: 'medium',
    title: 'Implement Multi-Year Contract Incentive',
    description: 'Annual renewal coming up. Offer 15% discount for 3-year commitment. Increases retention, predictable revenue, reduces sales cycle.',
    dmImpact: 0.9,
    arrImpact: 275000,
    confidence: 81,
    owner: 'Sales',
    timeline: '60 days',
    risk: 'Low',
    status: 'pending',
    category: 'Pricing',
    createdAt: new Date('2026-02-02')
  },
  {
    id: '11',
    accountName: 'Telus',
    businessUnit: 'STL',
    priority: 'high',
    title: 'Address Security Compliance Gap',
    description: 'Account requires SOC 2 Type II certification. Compliance team confirms certification completion expected Q2. Communicate timeline to prevent blocker.',
    dmImpact: 1.6,
    arrImpact: 390000,
    confidence: 93,
    owner: 'Compliance',
    timeline: 'Q2 2026',
    risk: 'Medium',
    status: 'pending',
    category: 'Compliance',
    createdAt: new Date('2026-02-01')
  },
  {
    id: '12',
    accountName: 'Rogers Communications',
    businessUnit: 'Cloudsense',
    priority: 'low',
    title: 'Expand Champion Network',
    description: 'Single point of contact (SPOC) risk. Identify and cultivate additional champions across teams to strengthen relationship resilience.',
    dmImpact: 0.4,
    arrImpact: 95000,
    confidence: 65,
    owner: 'Customer Success',
    timeline: 'Q3 2026',
    risk: 'Low',
    status: 'pending',
    category: 'Engagement',
    createdAt: new Date('2026-01-31')
  }
];

export default function DMStrategyDemoPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA' }}>
      {/* Hero Section */}
      <DMStrategyHero stats={sampleStats} />

      {/* Trends Link Banner */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto var(--space-lg) auto',
        padding: '0 var(--space-lg)'
      }}>
        <Link
          href="/dm-strategy/trends"
          style={{
            display: 'block',
            background: 'linear-gradient(135deg, #0066A1 0%, #00B8D4 100%)',
            color: 'white',
            padding: 'var(--space-lg)',
            borderRadius: 'var(--radius-lg)',
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(0, 102, 161, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 102, 161, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 102, 161, 0.3)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                📊 View 12-Month DM% Trend Charts
              </h3>
              <p style={{ opacity: 0.9, fontSize: '0.875rem' }}>
                Visualize retention trends with interactive charts for each business unit and portfolio-wide analysis
              </p>
            </div>
            <span style={{ fontSize: '2rem' }}>→</span>
          </div>
        </Link>
      </div>

      {/* Portfolio Dashboard */}
      <PortfolioDashboard
        businessUnits={sampleBusinessUnits}
        recommendations={sampleRecommendations}
      />
    </div>
  );
}
