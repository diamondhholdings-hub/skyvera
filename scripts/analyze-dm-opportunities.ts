#!/usr/bin/env ts-node
/**
 * DM Opportunity Analysis Script
 * Detects pricing, churn risk, upsell, and contract optimization opportunities
 */

import * as fs from 'fs';
import * as path from 'path';

interface Pricing {
  current: number;
  prior: number;
  variance: number;
  pricingTrend: 'declining' | 'increasing' | 'stable';
}

interface Account {
  accountName: string;
  bu: string;
  currentARR: number;
  priorARR: number;
  projectedARR: number;
  dmPercent: number;
  healthScore: number;
  renewalDate: string | null;
  renewalQuarter: string;
  daysToRenewal: number | null;
  pricing: Pricing;
  products: string[];
  contractType: string;
  painPoints: number;
  opportunities: number;
  hasUnresolvedIssues: boolean;
  overallRank: number;
  pctOfBuRevenue: number;
}

interface EnhancedData {
  extractedAt: string;
  totalAccounts: number;
  totalCurrentARR: number;
  totalPriorARR: number;
  overallDM: number;
  accounts: Account[];
}

interface Opportunity {
  accountName: string;
  bu: string;
  type: 'pricing' | 'churn_risk' | 'upsell' | 'contract_optimization';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string;
  expectedArrImpact: number;
  expectedDmImpact: number;
  confidence: 'high' | 'medium' | 'low';
  timelineWeeks: number;
  ownerTeam: string;
  risks: string[];
  dataQuality: 'complete' | 'partial' | 'estimated';
  metrics: {
    currentARR: number;
    healthScore: number;
    dmPercent: number;
    daysToRenewal: number | null;
    productCount: number;
  };
}

interface OpportunityReport {
  analyzedAt: string;
  totalAccounts: number;
  opportunitiesFound: number;
  totalPotentialArrImpact: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  opportunities: Opportunity[];
  dataQualityIssues: string[];
}

// Load enhanced data
function loadEnhancedData(): EnhancedData {
  const dataPath = path.join(__dirname, '..', 'data', 'dm-enhanced-data.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Enhanced data not found at ${dataPath}. Run extract-dm-enhanced-data.py first.`);
  }
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

// Pricing opportunity detection
function detectPricingOpportunities(account: Account, allAccounts: Account[]): Opportunity | null {
  // Find accounts with pricing declined by 5%+ or significantly below peers
  if (account.pricing.variance < -5 || account.pricing.pricingTrend === 'declining') {
    // Calculate peer average (same BU, similar size)
    const peers = allAccounts.filter(
      a =>
        a.bu === account.bu &&
        a.accountName !== account.accountName &&
        Math.abs(a.currentARR - account.currentARR) / account.currentARR < 0.3 // Within 30% size
    );

    const avgPeerDM = peers.length > 0
      ? peers.reduce((sum, p) => sum + p.dmPercent, 0) / peers.length
      : 100;

    // If this account is 10%+ below peer average, flag it
    const belowPeerAverage = avgPeerDM - account.dmPercent > 10;

    if (account.pricing.variance < -5 || belowPeerAverage) {
      // Calculate optimal pricing recovery
      const targetDM = Math.min(avgPeerDM, 100);
      const targetARR = account.priorARR * (targetDM / 100);
      const arrImpact = targetARR - account.currentARR;
      const dmImpact = targetDM - account.dmPercent;

      return {
        accountName: account.accountName,
        bu: account.bu,
        type: 'pricing',
        severity: arrImpact > 200000 ? 'high' : arrImpact > 100000 ? 'medium' : 'low',
        title: 'Pricing Recovery Opportunity',
        description: `Account pricing has declined ${Math.abs(account.pricing.variance).toFixed(1)}% vs prior year${
          belowPeerAverage ? ` and is ${(avgPeerDM - account.dmPercent).toFixed(1)}% below peer average` : ''
        }. Strategic price adjustment could recover revenue.`,
        reasoning: `Current ARR: $${account.currentARR.toLocaleString()}, Prior: $${account.priorARR.toLocaleString()} (${account.pricing.variance.toFixed(1)}% decline). Peer average DM: ${avgPeerDM.toFixed(1)}%. This suggests pricing pressure or undervaluation.`,
        expectedArrImpact: Math.round(arrImpact),
        expectedDmImpact: Math.round(dmImpact * 10) / 10,
        confidence: belowPeerAverage ? 'high' : 'medium',
        timelineWeeks: 8,
        ownerTeam: 'Account Management',
        risks: [
          'Customer pushback on price increase',
          'Competitive pricing pressure',
          'May require product/service enhancements to justify'
        ],
        dataQuality: 'complete',
        metrics: {
          currentARR: account.currentARR,
          healthScore: account.healthScore,
          dmPercent: account.dmPercent,
          daysToRenewal: account.daysToRenewal,
          productCount: account.products.length
        }
      };
    }
  }

  return null;
}

// Churn risk detection
function detectChurnRisk(account: Account): Opportunity | null {
  const isHighRisk =
    (account.healthScore < 70 && (account.daysToRenewal || 999) < 180) ||
    (account.dmPercent < 90 && account.dmPercent < 85) ||
    (account.hasUnresolvedIssues && account.painPoints > 2);

  if (isHighRisk) {
    // Calculate potential ARR at risk
    const churnRiskPct = account.healthScore < 60 ? 0.5 : account.healthScore < 70 ? 0.3 : 0.2;
    const arrAtRisk = account.currentARR * churnRiskPct;

    // Recovery potential
    const recoveryARR = Math.min(arrAtRisk * 0.8, account.priorARR - account.currentARR);

    return {
      accountName: account.accountName,
      bu: account.bu,
      type: 'churn_risk',
      severity: account.healthScore < 60 || account.dmPercent < 85 ? 'high' : 'medium',
      title: 'Churn Risk - Immediate Intervention Required',
      description: `Account shows multiple risk signals: ${
        account.healthScore < 70 ? `Low health score (${account.healthScore})` : ''
      }${account.dmPercent < 90 ? `, Revenue declining (${account.dmPercent.toFixed(1)}% DM)` : ''}${
        account.hasUnresolvedIssues ? `, Unresolved pain points (${account.painPoints})` : ''
      }${account.daysToRenewal && account.daysToRenewal < 180 ? `, Renewal in ${account.daysToRenewal} days` : ''}.`,
      reasoning: `Health score ${account.healthScore} indicates dissatisfaction. DM% of ${account.dmPercent.toFixed(
        1
      )}% shows revenue contraction. ${
        account.daysToRenewal && account.daysToRenewal < 180 ? 'Upcoming renewal creates urgency.' : ''
      }`,
      expectedArrImpact: Math.round(recoveryARR),
      expectedDmImpact: Math.round(((recoveryARR / account.priorARR) * 100) * 10) / 10,
      confidence: account.healthScore < 60 ? 'high' : 'medium',
      timelineWeeks: 4,
      ownerTeam: 'Customer Success',
      risks: [
        'Customer may have already decided to churn',
        'Competitor may be actively pursuing',
        'Product gaps may be difficult to address quickly'
      ],
      dataQuality: 'complete',
      metrics: {
        currentARR: account.currentARR,
        healthScore: account.healthScore,
        dmPercent: account.dmPercent,
        daysToRenewal: account.daysToRenewal,
        productCount: account.products.length
      }
    };
  }

  return null;
}

// Upsell opportunity detection
function detectUpsellOpportunity(account: Account): Opportunity | null {
  const isUpsellCandidate =
    account.currentARR > 500000 &&
    account.products.length < 3 &&
    account.healthScore > 70 &&
    account.dmPercent >= 95;

  if (isUpsellCandidate) {
    // Estimate upsell potential (20-40% of current ARR for enterprise accounts)
    const upsellPct = account.currentARR > 1500000 ? 0.3 : account.currentARR > 1000000 ? 0.25 : 0.2;
    const upsellARR = account.currentARR * upsellPct;

    return {
      accountName: account.accountName,
      bu: account.bu,
      type: 'upsell',
      severity: upsellARR > 300000 ? 'high' : 'medium',
      title: 'Cross-Sell & Expansion Opportunity',
      description: `Strong account (health: ${account.healthScore}, DM: ${account.dmPercent.toFixed(
        1
      )}%) using only ${account.products.length} product(s). High potential for product expansion.`,
      reasoning: `Account demonstrates strong satisfaction and retention (${account.dmPercent.toFixed(
        1
      )}% DM). Currently using ${account.products.join(', ')}. Similar accounts typically adopt ${
        account.bu === 'Cloudsense' ? '4-5' : '3-4'
      } products. ARR of $${account.currentARR.toLocaleString()} suggests budget capacity.`,
      expectedArrImpact: Math.round(upsellARR),
      expectedDmImpact: Math.round(((upsellARR / account.currentARR) * 100) * 10) / 10,
      confidence: account.healthScore > 80 ? 'high' : 'medium',
      timelineWeeks: 12,
      ownerTeam: 'Sales',
      risks: [
        'Customer may not see value in additional products',
        'Budget constraints or approval required',
        'Competitive products may already be in use'
      ],
      dataQuality: 'complete',
      metrics: {
        currentARR: account.currentARR,
        healthScore: account.healthScore,
        dmPercent: account.dmPercent,
        daysToRenewal: account.daysToRenewal,
        productCount: account.products.length
      }
    };
  }

  return null;
}

// Contract optimization detection
function detectContractOptimization(account: Account): Opportunity | null {
  const isOptimizationCandidate =
    (account.currentARR > 1000000 && account.contractType.includes('Annual') && !account.contractType.includes('Multi')) ||
    (account.contractType.includes('Basic') && account.currentARR > 300000) ||
    ((account.daysToRenewal || 999) < 90 && account.healthScore > 75);

  if (isOptimizationCandidate) {
    let optimizationType = '';
    let arrImpact = 0;

    if (account.currentARR > 1000000 && !account.contractType.includes('Multi')) {
      optimizationType = 'multi-year';
      // Multi-year typically offers 10-15% discount but locks in revenue
      arrImpact = account.currentARR * 2.5; // 3-year lock-in value minus 10% discount
    } else if ((account.daysToRenewal || 999) < 90 && account.healthScore > 75) {
      optimizationType = 'early-renewal';
      // Early renewal with modest increase
      arrImpact = account.currentARR * 0.05; // 5% increase
    } else {
      optimizationType = 'upgrade';
      // Upgrade to better tier
      arrImpact = account.currentARR * 0.15; // 15% increase
    }

    return {
      accountName: account.accountName,
      bu: account.bu,
      type: 'contract_optimization',
      severity: arrImpact > 500000 ? 'high' : 'medium',
      title: `Contract Optimization - ${optimizationType.charAt(0).toUpperCase() + optimizationType.slice(1)}`,
      description: `Account on ${account.contractType} contract with ARR $${account.currentARR.toLocaleString()}. ${
        optimizationType === 'multi-year'
          ? 'Strong candidate for multi-year agreement to lock in revenue.'
          : optimizationType === 'early-renewal'
          ? `Renewal in ${account.daysToRenewal} days - opportunity for early renewal with increase.`
          : 'Contract tier upgrade would better align with account size and usage.'
      }`,
      reasoning: `Current contract type (${account.contractType}) with ARR $${account.currentARR.toLocaleString()} ${
        optimizationType === 'multi-year'
          ? 'and strong health score suggests multi-year stability'
          : optimizationType === 'early-renewal'
          ? `and upcoming renewal (${account.daysToRenewal} days) creates negotiation opportunity`
          : 'does not match account value and commitment level'
      }.`,
      expectedArrImpact: Math.round(arrImpact),
      expectedDmImpact: 0,
      confidence: account.healthScore > 80 ? 'high' : 'medium',
      timelineWeeks: optimizationType === 'early-renewal' ? 4 : 8,
      ownerTeam: 'Account Management',
      risks: [
        optimizationType === 'multi-year' ? 'Customer may prefer annual flexibility' : 'Customer may resist pricing increase',
        'Procurement approval may be required',
        'Competitive renewal process risk'
      ],
      dataQuality: 'complete',
      metrics: {
        currentARR: account.currentARR,
        healthScore: account.healthScore,
        dmPercent: account.dmPercent,
        daysToRenewal: account.daysToRenewal,
        productCount: account.products.length
      }
    };
  }

  return null;
}

// Main analysis function
function analyzeOpportunities(): OpportunityReport {
  console.error('Loading enhanced DM data...');
  const data = loadEnhancedData();

  console.error(`Analyzing ${data.totalAccounts} accounts...`);

  const opportunities: Opportunity[] = [];
  const dataQualityIssues: string[] = [];

  for (const account of data.accounts) {
    // Check data quality
    if (!account.daysToRenewal) {
      dataQualityIssues.push(`${account.accountName}: Missing renewal date`);
    }

    // Detect opportunities
    const pricingOpp = detectPricingOpportunities(account, data.accounts);
    if (pricingOpp) opportunities.push(pricingOpp);

    const churnOpp = detectChurnRisk(account);
    if (churnOpp) opportunities.push(churnOpp);

    const upsellOpp = detectUpsellOpportunity(account);
    if (upsellOpp) opportunities.push(upsellOpp);

    const contractOpp = detectContractOptimization(account);
    if (contractOpp) opportunities.push(contractOpp);
  }

  // Calculate summary statistics
  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  let totalPotentialArrImpact = 0;

  for (const opp of opportunities) {
    byType[opp.type] = (byType[opp.type] || 0) + 1;
    bySeverity[opp.severity] = (bySeverity[opp.severity] || 0) + 1;
    totalPotentialArrImpact += opp.expectedArrImpact;
  }

  // Sort by severity and ARR impact
  opportunities.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return b.expectedArrImpact - a.expectedArrImpact;
  });

  const report: OpportunityReport = {
    analyzedAt: new Date().toISOString(),
    totalAccounts: data.totalAccounts,
    opportunitiesFound: opportunities.length,
    totalPotentialArrImpact,
    byType,
    bySeverity,
    opportunities,
    dataQualityIssues: dataQualityIssues.slice(0, 10) // First 10 issues
  };

  // Save report
  const reportPath = path.join(__dirname, '..', 'data', 'dm-opportunities.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.error(`\n✓ Found ${opportunities.length} opportunities across ${data.totalAccounts} accounts`);
  console.error(`✓ Total potential ARR impact: $${totalPotentialArrImpact.toLocaleString()}`);
  console.error(`✓ By type: ${JSON.stringify(byType)}`);
  console.error(`✓ By severity: ${JSON.stringify(bySeverity)}`);
  console.error(`✓ Data quality issues: ${dataQualityIssues.length}`);
  console.error(`✓ Saved to: ${reportPath}`);

  return report;
}

// Run analysis
if (require.main === module) {
  try {
    const report = analyzeOpportunities();
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

export { analyzeOpportunities };
export type { Opportunity, OpportunityReport };
