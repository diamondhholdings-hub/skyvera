#!/usr/bin/env ts-node
/**
 * DM Recommendation Generation Script
 * Uses Claude API to generate specific, creative recommendations for each opportunity
 */

import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
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

// Generate recommendation using Claude
async function generateRecommendation(
  opportunity: Opportunity,
  anthropic: Anthropic
): Promise<GeneratedRecommendation> {
  const prompt = `You are a strategic account management expert helping improve revenue retention for a SaaS company with three business units (CloudSense, Kandy, STL).

Account Information:
- Name: ${opportunity.accountName}
- Business Unit: ${opportunity.bu}
- Current ARR: $${opportunity.metrics.currentARR.toLocaleString()}
- Health Score: ${opportunity.metrics.healthScore}/100
- DM% (Retention Rate): ${opportunity.metrics.dmPercent}%
- Days to Renewal: ${opportunity.metrics.daysToRenewal || 'Unknown'}
- Products: ${opportunity.metrics.productCount} product(s)

Opportunity Detected:
- Type: ${opportunity.type}
- Severity: ${opportunity.severity}
- Description: ${opportunity.description}
- Current Reasoning: ${opportunity.reasoning}

Context:
${opportunity.type === 'churn_risk' ? '- This customer shows signs of dissatisfaction or competitive threat' : ''}
${opportunity.type === 'pricing' ? '- Pricing has declined vs prior year or is below market rate' : ''}
${opportunity.type === 'upsell' ? '- Healthy customer with expansion potential' : ''}
${opportunity.type === 'contract_optimization' ? '- Contract structure can be improved' : ''}

Generate a specific, creative, actionable recommendation to address this opportunity.

Requirements:
1. Be SPECIFIC with numbers, timelines, and concrete actions
2. Focus on what exactly the team should DO (not generic advice)
3. Consider why this will work for THIS specific customer (not generic)
4. Include 3-5 specific action steps
5. List 2-3 success factors that will make this work
6. Be realistic about expected impact and risks

Respond in JSON format:
{
  "title": "Clear, specific recommendation title (under 60 chars)",
  "description": "Detailed description of the recommendation (2-3 sentences)",
  "reasoning": "Why this specific approach will work for this customer (2-3 sentences)",
  "specificActions": [
    "Action 1: Specific task with timeline",
    "Action 2: Specific task with owner",
    "Action 3: etc."
  ],
  "expectedArrImpact": <realistic number>,
  "expectedDmImpact": <realistic percentage point improvement>,
  "confidence": "high|medium|low",
  "timelineWeeks": <number>,
  "ownerTeam": "Account Management|Customer Success|Sales",
  "risks": ["Risk 1", "Risk 2"],
  "successFactors": ["Factor 1", "Factor 2", "Factor 3"]
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    });

    // Extract JSON from response
    const content = message.content[0].type === 'text' ? message.content[0].text : '';

    // Try to parse JSON (Claude might wrap it in markdown)
    let jsonStr = content;
    const jsonMatch = content.match(/```json\n([\s\S]+)\n```/) || content.match(/```\n([\s\S]+)\n```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const generated = JSON.parse(jsonStr);

    // Combine with original opportunity data
    const recommendation: GeneratedRecommendation = {
      opportunityId: `${opportunity.accountName.toLowerCase().replace(/\s+/g, '-')}-${opportunity.type}`,
      accountName: opportunity.accountName,
      bu: opportunity.bu,
      type: opportunity.type,
      title: generated.title,
      description: generated.description,
      reasoning: generated.reasoning,
      specificActions: generated.specificActions,
      expectedArrImpact: generated.expectedArrImpact,
      expectedDmImpact: generated.expectedDmImpact,
      confidence: generated.confidence,
      timelineWeeks: generated.timelineWeeks,
      ownerTeam: generated.ownerTeam,
      risks: generated.risks,
      successFactors: generated.successFactors,
      metrics: opportunity.metrics,
      generatedAt: new Date().toISOString()
    };

    return recommendation;
  } catch (error) {
    console.error(`Error generating recommendation for ${opportunity.accountName}:`, error);
    // Return fallback recommendation
    return {
      opportunityId: `${opportunity.accountName.toLowerCase().replace(/\s+/g, '-')}-${opportunity.type}`,
      accountName: opportunity.accountName,
      bu: opportunity.bu,
      type: opportunity.type,
      title: opportunity.title,
      description: opportunity.description,
      reasoning: opportunity.reasoning,
      specificActions: ['Review account health', 'Schedule customer meeting', 'Develop action plan'],
      expectedArrImpact: opportunity.expectedArrImpact,
      expectedDmImpact: opportunity.expectedDmImpact,
      confidence: opportunity.confidence,
      timelineWeeks: opportunity.timelineWeeks,
      ownerTeam: opportunity.ownerTeam,
      risks: opportunity.risks,
      successFactors: ['Strong executive relationship', 'Clear value proposition', 'Competitive pricing'],
      metrics: opportunity.metrics,
      generatedAt: new Date().toISOString()
    };
  }
}

// Main generation function
async function generateRecommendations(limit?: number): Promise<RecommendationReport> {
  console.error('Loading opportunities...');
  const opportunityReport = loadOpportunities();

  // Filter to high and medium severity only
  let opportunities = opportunityReport.opportunities.filter(o => o.severity === 'high' || o.severity === 'medium');

  if (limit) {
    opportunities = opportunities.slice(0, limit);
  }

  console.error(`Generating recommendations for ${opportunities.length} opportunities...`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable not set');
  }

  const anthropic = new Anthropic({ apiKey });

  const recommendations: GeneratedRecommendation[] = [];
  let processed = 0;

  for (const opportunity of opportunities) {
    processed++;
    console.error(
      `\n[${processed}/${opportunities.length}] Generating recommendation for ${opportunity.accountName} (${opportunity.type})...`
    );

    const recommendation = await generateRecommendation(opportunity, anthropic);
    recommendations.push(recommendation);

    // Save progress incrementally (every 10)
    if (processed % 10 === 0) {
      const progressPath = path.join(__dirname, '..', 'data', 'dm-recommendations-progress.json');
      fs.writeFileSync(
        progressPath,
        JSON.stringify(
          {
            processed,
            total: opportunities.length,
            recommendations: recommendations.slice(0, processed)
          },
          null,
          2
        )
      );
      console.error(`Progress saved (${processed}/${opportunities.length})`);
    }

    // Rate limiting: 2 second delay between API calls
    if (processed < opportunities.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

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

  // Generate summary
  const summaryPath = path.join(__dirname, '..', 'data', 'dm-summary.txt');
  const summary = generateSummary(report);
  fs.writeFileSync(summaryPath, summary);

  console.error(`\n✓ Generated ${recommendations.length} recommendations`);
  console.error(`✓ Total potential ARR impact: $${report.totalPotentialArrImpact.toLocaleString()}`);
  console.error(`✓ Accounts covered: ${report.accountsCovered}`);
  console.error(`✓ Saved to: ${reportPath}`);
  console.error(`✓ Summary saved to: ${summaryPath}`);

  return report;
}

// Generate executive summary
function generateSummary(report: RecommendationReport): string {
  const byType = report.recommendations.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byBu = report.recommendations.reduce((acc, r) => {
    acc[r.bu] = (acc[r.bu] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byConfidence = report.recommendations.reduce((acc, r) => {
    acc[r.confidence] = (acc[r.confidence] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let summary = `DM RECOMMENDATIONS EXECUTIVE SUMMARY
Generated: ${new Date(report.generatedAt).toLocaleString()}

OVERVIEW
========
Total Recommendations: ${report.totalRecommendations}
Accounts Covered: ${report.accountsCovered}
Total Potential ARR Impact: $${report.totalPotentialArrImpact.toLocaleString()}

BY TYPE
=======
`;

  for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    const typeRecs = report.recommendations.filter(r => r.type === type);
    const arrImpact = typeRecs.reduce((sum, r) => sum + r.expectedArrImpact, 0);
    summary += `${type.padEnd(25)} ${count.toString().padStart(3)} recommendations  $${arrImpact.toLocaleString().padStart(12)} ARR impact\n`;
  }

  summary += `\nBY BUSINESS UNIT
================
`;

  for (const [bu, count] of Object.entries(byBu).sort((a, b) => b[1] - a[1])) {
    const buRecs = report.recommendations.filter(r => r.bu === bu);
    const arrImpact = buRecs.reduce((sum, r) => sum + r.expectedArrImpact, 0);
    summary += `${bu.padEnd(15)} ${count.toString().padStart(3)} recommendations  $${arrImpact.toLocaleString().padStart(12)} ARR impact\n`;
  }

  summary += `\nBY CONFIDENCE
=============
`;

  for (const confidence of ['high', 'medium', 'low']) {
    const count = byConfidence[confidence] || 0;
    const confRecs = report.recommendations.filter(r => r.confidence === confidence);
    const arrImpact = confRecs.reduce((sum, r) => sum + r.expectedArrImpact, 0);
    summary += `${confidence.padEnd(10)} ${count.toString().padStart(3)} recommendations  $${arrImpact.toLocaleString().padStart(12)} ARR impact\n`;
  }

  summary += `\nTOP 10 HIGH-IMPACT RECOMMENDATIONS
===================================
`;

  const top10 = report.recommendations
    .sort((a, b) => b.expectedArrImpact - a.expectedArrImpact)
    .slice(0, 10);

  for (let i = 0; i < top10.length; i++) {
    const rec = top10[i];
    summary += `\n${i + 1}. ${rec.accountName} (${rec.bu})\n`;
    summary += `   Type: ${rec.type}  |  Impact: $${rec.expectedArrImpact.toLocaleString()}  |  Timeline: ${rec.timelineWeeks} weeks\n`;
    summary += `   ${rec.title}\n`;
  }

  return summary;
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;

  generateRecommendations(limit)
    .then(report => {
      console.log(JSON.stringify(report, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export { generateRecommendations };
export type { GeneratedRecommendation, RecommendationReport };
