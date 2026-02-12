import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface GeneratePRDRequest {
  patternId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GeneratePRDRequest = await request.json();
    const { patternId } = body;

    console.log('[PRD Generation] Starting for pattern:', patternId);

    // Load the pattern from database
    const pattern = await prisma.pattern.findUnique({
      where: { patternId }
    });

    if (!pattern) {
      return NextResponse.json(
        { error: 'Pattern not found' },
        { status: 404 }
      );
    }

    // Check if PRD already exists for this pattern
    if (pattern.prdGenerated && pattern.linkedPrdId) {
      const existingPRD = await prisma.pRD.findUnique({
        where: { prdId: pattern.linkedPrdId }
      });

      if (existingPRD) {
        return NextResponse.json({
          success: true,
          message: 'PRD already exists for this pattern',
          prd: existingPRD
        });
      }
    }

    // Parse customer list
    const customers = JSON.parse(pattern.customers);

    // Generate PRD using Claude
    const prdContent = await generatePRDWithClaude(pattern, customers);

    // Calculate priority score and classification
    const priorityMetrics = calculatePriorityScore(pattern);

    // Generate unique PRD ID with sequence
    const now = new Date();
    const year = now.getFullYear();
    const dayOfYear = Math.floor((now.getTime() - new Date(year, 0, 0).getTime()) / 86400000);

    // Find existing PRDs for today to generate sequence number
    const todayPrefix = `PRD-${year}-${String(dayOfYear).padStart(3, '0')}`;
    const existingPRDs = await prisma.pRD.findMany({
      where: {
        prdId: {
          startsWith: todayPrefix
        }
      },
      select: { prdId: true }
    });

    const sequence = existingPRDs.length + 1;
    const prdId = `${todayPrefix}-${String(sequence).padStart(2, '0')}`;

    // Save PRD to database
    const savedPRD = await prisma.pRD.create({
      data: {
        prdId,
        title: prdContent.title,
        content: prdContent.markdown,
        confidenceScore: Math.round(pattern.confidence * 100),
        priorityScore: priorityMetrics.score,
        priorityClass: priorityMetrics.class,
        leverageClassification: priorityMetrics.leverage,
        arrImpact: pattern.arrAtRisk || pattern.arrOpportunity || pattern.financialImpact || 0,
        customerCount: customers.length,
        implementationWeeks: prdContent.implementationWeeks,
        status: priorityMetrics.score >= 85 ? 'Auto-Published' : 'Pending Review',
        strategicThemes: JSON.stringify(prdContent.strategicThemes),
        businessUnits: JSON.stringify(extractBusinessUnits(customers)),
        customerTags: JSON.stringify(customers.slice(0, 10)),
        category: prdContent.category,
      }
    });

    // Update pattern to link to PRD
    await prisma.pattern.update({
      where: { patternId },
      data: {
        prdGenerated: true,
        linkedPrdId: savedPRD.prdId,
        status: 'PRD Generated',
        processedAt: new Date()
      }
    });

    console.log(`[PRD Generation] ✓ Generated PRD ${prdId} for pattern ${patternId}`);

    return NextResponse.json({
      success: true,
      message: 'PRD generated successfully',
      prd: savedPRD
    });

  } catch (error) {
    console.error('[PRD Generation] Error:', error);
    return NextResponse.json(
      {
        error: 'PRD generation failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

async function generatePRDWithClaude(pattern: any, customers: string[]) {
  const prompt = `You are a world-class Product Manager creating a comprehensive PRD for a B2B SaaS product opportunity.

## Pattern Analysis

**Pattern Name**: ${pattern.name}
**Signal**: ${pattern.signal}
**Confidence**: ${(pattern.confidence * 100).toFixed(0)}%
**Affected Customers**: ${customers.join(', ')}
**Financial Impact**:
- ARR at Risk: $${(pattern.arrAtRisk || 0).toLocaleString()}
- ARR Opportunity: $${(pattern.arrOpportunity || 0).toLocaleString()}
- Financial Impact: $${(pattern.financialImpact || 0).toLocaleString()}
**Opportunity**: ${pattern.description}

## Task

Generate a comprehensive PRD with the following 14 sections:

1. **Executive Summary** (2-3 paragraphs)
   - Problem statement with business impact
   - Proposed solution
   - Expected outcomes (ARR impact, retention improvement)

2. **Strategic Context**
   - How this aligns with company strategy
   - Market opportunity
   - Competitive landscape

3. **Problem Statement**
   - Detailed customer pain points
   - Current state analysis
   - Cost of inaction

4. **Success Metrics**
   - Primary metric (ARR retained/generated)
   - Secondary metrics (NPS, adoption, engagement)
   - Leading indicators

5. **User Stories & Jobs-to-be-Done**
   - Core user workflows
   - JTBD framework application

6. **Proposed Solution**
   - High-level approach
   - Key features (prioritized)
   - User experience principles

7. **Technical Approach**
   - Architecture overview
   - Integration points
   - Data requirements

8. **Implementation Plan**
   - Phases and milestones
   - Timeline estimate
   - Dependencies

9. **Go-to-Market Strategy**
   - Target customer segments
   - Pricing implications
   - Launch plan

10. **Risk Analysis**
    - Value risk (will customers use it?)
    - Usability risk (can they figure it out?)
    - Feasibility risk (can we build it?)
    - Viability risk (should we build it?)

11. **Open Questions**
    - Key unknowns requiring validation
    - Research needed

12. **Alternatives Considered**
    - Other approaches evaluated
    - Why this approach was chosen

13. **Success Criteria**
    - Launch criteria (what must be true)
    - 30/60/90 day targets

14. **Appendix**
    - Supporting data
    - Customer quotes (inferred from pattern)
    - Reference materials

Return ONLY a JSON object with this structure:
{
  "title": "Brief, compelling title (max 60 chars)",
  "category": "Retention|Expansion|Efficiency|Competitive",
  "strategicThemes": ["theme1", "theme2"],
  "implementationWeeks": <number>,
  "markdown": "# PRD Title\\n\\n[Full markdown content with all 14 sections]"
}

Make it outcome-driven, data-backed, and actionable. Use the Skyvera context (B2B SaaS portfolio company with multiple business units).`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  // Extract JSON from response (handle both raw JSON and markdown code blocks)
  let jsonStr = responseText.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.substring(7, jsonStr.lastIndexOf('```')).trim();
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.substring(3, jsonStr.lastIndexOf('```')).trim();
  }

  const prdData = JSON.parse(jsonStr);
  return prdData;
}

function calculatePriorityScore(pattern: any): {
  score: number;
  class: string;
  leverage: string;
} {
  // Weighted multi-factor scoring
  const arrWeight = 0.40;
  const customerWeight = 0.25;
  const confidenceWeight = 0.20;
  const urgencyWeight = 0.15;

  // Normalize ARR impact (0-100)
  const totalImpact = (pattern.arrAtRisk || 0) + (pattern.arrOpportunity || 0) + (pattern.financialImpact || 0);
  const arrScore = Math.min(100, (totalImpact / 500000) * 100); // $5M+ = 100

  // Customer count score (0-100)
  const customerScore = Math.min(100, (JSON.parse(pattern.customers).length / 20) * 100); // 20+ = 100

  // Confidence score (already 0-100)
  const confidenceScore = pattern.confidence * 100;

  // Urgency (churn risk = 100, expansion = 60)
  const urgencyScore = pattern.arrAtRisk > 0 ? 100 : 60;

  // Calculate weighted score
  const score = Math.round(
    arrScore * arrWeight +
    customerScore * customerWeight +
    confidenceScore * confidenceWeight +
    urgencyScore * urgencyWeight
  );

  // Determine priority class
  let priorityClass = 'P4';
  if (score >= 90) priorityClass = 'P0';
  else if (score >= 80) priorityClass = 'P1';
  else if (score >= 70) priorityClass = 'P2';
  else if (score >= 60) priorityClass = 'P3';

  // Leverage classification (Shreyas Doshi framework)
  let leverage = 'Neutral';
  if (score >= 85 && (pattern.arrAtRisk || 0) > 1000000) {
    leverage = 'Leverage'; // High impact, prevents churn
  } else if (score < 60) {
    leverage = 'Overhead'; // Low impact
  }

  return { score, class: priorityClass, leverage };
}

function extractBusinessUnits(customers: string[]): string[] {
  // This is simplified - in production, would query customer BUs from database
  return ['Cloudsense', 'Kandy', 'STL'];
}
