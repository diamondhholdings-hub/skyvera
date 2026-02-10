import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scope, businessUnit, analysisType, focus } = body;

    console.log('[Product Agent] Starting analysis:', { scope, businessUnit, analysisType, focus });

    // Step 1: Load customer data
    let customers = await prisma.customer.findMany({
      where: businessUnit && businessUnit !== 'all'
        ? { bu: businessUnit }
        : undefined,
      include: {
        subscriptions: true
      }
    });

    console.log(`[Product Agent] Loaded ${customers.length} customers`);

    // Step 2: Detect patterns
    const patterns = await detectPatterns(customers);

    console.log(`[Product Agent] Detected ${patterns.length} patterns`);

    // Step 3: Save patterns to database
    const savedPatterns = await Promise.all(
      patterns.map(async (pattern) => {
        return await prisma.pattern.create({
          data: {
            name: pattern.name,
            description: pattern.opportunity,
            signal: pattern.signal,
            confidence: pattern.confidence,
            customers: JSON.stringify(pattern.customers),
            arrAtRisk: pattern.arr_at_risk,
            arrOpportunity: pattern.arr_opportunity,
            financialImpact: pattern.financial_impact,
            status: 'Detected',
            prdGenerated: false
          }
        });
      })
    );

    // Return results
    return NextResponse.json({
      success: true,
      patterns_detected: patterns.length,
      prds_recommended: patterns.filter(p => p.recommended_prd).length,
      total_arr_opportunity: patterns.reduce((sum, p) =>
        sum + (p.arr_at_risk || 0) + (p.arr_opportunity || 0) + (p.financial_impact || 0), 0
      ),
      patterns: patterns.map((p, idx) => ({
        ...p,
        id: `pat_${String(idx + 1).padStart(3, '0')}`,
        patternId: savedPatterns[idx].patternId
      }))
    });

  } catch (error) {
    console.error('[Product Agent] Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Pattern Detection Logic
async function detectPatterns(customers: any[]) {
  const patterns = [];

  // Pattern 1: AR Aging + Support Volume (Churn Risk)
  const arAgingCustomers = customers.filter(c => {
    // Mock: Assume customers with declining revenue have AR issues
    return c.totalRevenue > 400000 && c.rr < c.nrr; // RR < NRR suggests issues
  });

  if (arAgingCustomers.length >= 2) {
    const totalArr = arAgingCustomers.reduce((sum, c) => sum + c.totalRevenue, 0);
    patterns.push({
      name: 'Enterprise AR Aging + Support Volume Spike',
      signal: `${arAgingCustomers.length} enterprise customers with potential AR issues detected`,
      customers: arAgingCustomers.map(c => c.customerName),
      arr_at_risk: totalArr,
      confidence: 0.85 + (arAgingCustomers.length * 0.02), // Higher confidence with more customers
      opportunity: 'Automated billing reminder system with customer self-service portal',
      recommended_prd: true,
      prd_title: 'Automated AR Management & Customer Portal',
      reason: arAgingCustomers.length >= 3 ? 'Strong signal from multiple enterprise customers' : 'Moderate signal, needs validation'
    });
  }

  // Pattern 2: RR Decline Pattern
  const decliningRevenue = customers.filter(c => c.rr < (c.totalRevenue * 0.85));
  if (decliningRevenue.length > 0) {
    patterns.push({
      name: 'Recurring Revenue Decline Pattern',
      signal: `${decliningRevenue.length} customers showing RR decline vs total revenue`,
      customers: decliningRevenue.map(c => c.customerName).slice(0, 10),
      financial_impact: decliningRevenue.reduce((sum, c) => sum + (c.totalRevenue - c.rr), 0),
      confidence: 0.72,
      opportunity: 'Usage analytics dashboard + proactive engagement alerts',
      recommended_prd: true,
      prd_title: 'Customer Success Early Warning System'
    });
  }

  // Pattern 3: High-value customers (Expansion Opportunity)
  const highValueCustomers = customers.filter(c =>
    c.totalRevenue > 500000 && c.bu === 'Cloudsense'
  ).slice(0, 5);

  if (highValueCustomers.length >= 2) {
    patterns.push({
      name: 'High-Value Customer Expansion Opportunity',
      signal: `${highValueCustomers.length} high-value customers (>${500}K ARR) could benefit from premium features`,
      customers: highValueCustomers.map(c => c.customerName),
      arr_opportunity: highValueCustomers.reduce((sum, c) => sum + c.totalRevenue * 0.2, 0), // 20% expansion potential
      confidence: 0.68,
      opportunity: 'Premium tier with advanced analytics and dedicated support',
      recommended_prd: false,
      reason: 'Needs customer validation before PRD generation'
    });
  }

  // Pattern 4: Multi-BU Customers
  const customersByName = customers.reduce((acc, c) => {
    if (!acc[c.customerName]) acc[c.customerName] = [];
    acc[c.customerName].push(c);
    return acc;
  }, {} as Record<string, any[]>);

  const multiBuCustomers = Object.entries(customersByName)
    .filter(([_, cs]) => new Set((cs as any[]).map(c => c.bu)).size > 1)
    .map(([name, _]) => name);

  if (multiBuCustomers.length >= 2) {
    const totalArr = multiBuCustomers.reduce((sum, name) => {
      const customerRecords = customersByName[name] as any[];
      return sum + customerRecords.reduce((s: number, c: any) => s + c.totalRevenue, 0);
    }, 0);

    patterns.push({
      name: 'Multi-BU Customer Consolidation Requests',
      signal: `${multiBuCustomers.length} customers with multiple BU relationships`,
      customers: multiBuCustomers,
      arr_opportunity: totalArr * 0.15, // 15% consolidation opportunity
      confidence: 0.65,
      opportunity: 'Multi-BU consolidated view and unified billing',
      recommended_prd: false,
      reason: 'Below confidence threshold - needs customer validation'
    });
  }

  return patterns;
}
