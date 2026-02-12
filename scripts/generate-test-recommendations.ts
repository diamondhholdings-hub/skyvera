#!/usr/bin/env ts-node
/**
 * Generate Test Recommendations (No API calls)
 * Creates sample recommendations for testing the database seeding
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Opportunity, OpportunityReport } from './analyze-dm-opportunities';

interface GeneratedRecommendation {
  opportunityId: string;
  accountName: string;
  bu: string;
  type: string;
  title: string;
  description: string;
  reasoning: string;
  specificActions: string[];
  expectedArrImpact: number;
  expectedDmImpact: number;
  confidence: string;
  timelineWeeks: number;
  ownerTeam: string;
  risks: string[];
  successFactors: string[];
  metrics: any;
  generatedAt: string;
}

interface RecommendationReport {
  generatedAt: string;
  totalRecommendations: number;
  totalPotentialArrImpact: number;
  accountsCovered: number;
  recommendations: GeneratedRecommendation[];
}

// Load opportunities
function loadOpportunities(): OpportunityReport {
  const dataPath = path.join(__dirname, '..', 'data', 'dm-opportunities.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Opportunities not found at ${dataPath}. Run analyze-dm-opportunities.ts first.`);
  }
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

// Generate template recommendation (no AI)
function generateTemplateRecommendation(opportunity: Opportunity): GeneratedRecommendation {
  const templates: Record<string, { actions: string[]; successFactors: string[] }> = {
    pricing: {
      actions: [
        'Conduct competitive pricing analysis within 2 weeks',
        'Schedule executive business review to discuss value delivered',
        'Prepare pricing justification document with ROI metrics',
        'Present pricing adjustment proposal with 30-day notice'
      ],
      successFactors: [
        'Strong demonstrated ROI and value delivery',
        'Executive relationship and trust established',
        'Market rates support pricing adjustment'
      ]
    },
    churn_risk: {
      actions: [
        'Schedule immediate stakeholder meeting to understand concerns',
        'Conduct product usage analysis to identify friction points',
        'Develop 90-day success plan with clear milestones',
        'Assign dedicated CSM resource for intensive support'
      ],
      successFactors: [
        'Quick identification and resolution of pain points',
        'Executive escalation and commitment',
        'Competitive positioning and product roadmap alignment'
      ]
    },
    upsell: {
      actions: [
        'Analyze usage patterns to identify expansion opportunities',
        'Schedule product roadmap session with customer stakeholders',
        'Develop custom expansion proposal with ROI projections',
        'Present pilot program for additional products/services'
      ],
      successFactors: [
        'Strong existing relationship and satisfaction',
        'Clear business case for expansion',
        'Budget availability and stakeholder buy-in'
      ]
    },
    contract_optimization: {
      actions: [
        'Review current contract terms and renewal timeline',
        'Prepare multi-year proposal with strategic pricing',
        'Schedule renewal discussion 90 days before expiration',
        'Negotiate mutually beneficial terms with legal review'
      ],
      successFactors: [
        'Long-term partnership mindset from customer',
        'Competitive differentiation and switching costs',
        'Flexible terms that align with customer needs'
      ]
    }
  };

  const template = templates[opportunity.type] || templates.pricing;

  const recommendation: GeneratedRecommendation = {
    opportunityId: `${opportunity.accountName.toLowerCase().replace(/\s+/g, '-')}-${opportunity.type}`,
    accountName: opportunity.accountName,
    bu: opportunity.bu,
    type: opportunity.type,
    title: opportunity.title,
    description: opportunity.description,
    reasoning: opportunity.reasoning,
    specificActions: template.actions,
    expectedArrImpact: opportunity.expectedArrImpact,
    expectedDmImpact: opportunity.expectedDmImpact,
    confidence: opportunity.confidence,
    timelineWeeks: opportunity.timelineWeeks,
    ownerTeam: opportunity.ownerTeam,
    risks: opportunity.risks,
    successFactors: template.successFactors,
    metrics: opportunity.metrics,
    generatedAt: new Date().toISOString()
  };

  return recommendation;
}

// Main generation function
function generateTestRecommendations(): RecommendationReport {
  console.error('Loading opportunities...');
  const opportunityReport = loadOpportunities();

  // Filter to high and medium severity only
  const opportunities = opportunityReport.opportunities.filter(o => o.severity === 'high' || o.severity === 'medium');

  console.error(`Generating test recommendations for ${opportunities.length} opportunities...`);

  const recommendations: GeneratedRecommendation[] = opportunities.map(opp => {
    console.error(`Generating: ${opp.accountName} (${opp.type})`);
    return generateTemplateRecommendation(opp);
  });

  const report: RecommendationReport = {
    generatedAt: new Date().toISOString(),
    totalRecommendations: recommendations.length,
    totalPotentialArrImpact: recommendations.reduce((sum, r) => sum + r.expectedArrImpact, 0),
    accountsCovered: new Set(recommendations.map(r => r.accountName)).size,
    recommendations
  };

  // Save final report
  const reportPath = path.join(__dirname, '..', 'data', 'dm-recommendations.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.error(`\n✓ Generated ${recommendations.length} test recommendations`);
  console.error(`✓ Total potential ARR impact: $${report.totalPotentialArrImpact.toLocaleString()}`);
  console.error(`✓ Accounts covered: ${report.accountsCovered}`);
  console.error(`✓ Saved to: ${reportPath}`);

  return report;
}

// Run
if (require.main === module) {
  try {
    const report = generateTestRecommendations();
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

export { generateTestRecommendations };
