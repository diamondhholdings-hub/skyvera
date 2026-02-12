#!/usr/bin/env ts-node
/**
 * Seed DM Recommendations to Database
 * Loads generated recommendations and inserts them into the database
 */

import { config } from 'dotenv';
import * as path from 'path';

// Load .env.local first, then .env
config({ path: path.join(__dirname, '..', '.env.local') });
config({ path: path.join(__dirname, '..', '.env') });

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

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

const prisma = new PrismaClient();

// Map recommendation types to DB types
function mapRecommendationType(type: string): string {
  const typeMap: Record<string, string> = {
    'pricing': 'pricing',
    'churn_risk': 'churn_prevention',
    'upsell': 'upsell',
    'contract_optimization': 'contract_restructure'
  };
  return typeMap[type] || 'account_intervention';
}

// Map confidence to priority
function mapConfidenceToPriority(confidence: string, arrImpact: number, type: string): string {
  if (type === 'churn_risk' || (confidence === 'high' && arrImpact > 500000)) {
    return 'critical';
  } else if (confidence === 'high' || arrImpact > 300000) {
    return 'high';
  } else if (confidence === 'medium' || arrImpact > 100000) {
    return 'medium';
  } else {
    return 'low';
  }
}

// Map timeline from weeks to category
function mapTimelineToCategory(weeks: number): string {
  if (weeks <= 4) return 'immediate';
  if (weeks <= 8) return 'short-term';
  if (weeks <= 16) return 'medium-term';
  return 'long-term';
}

// Map risk level
function mapRiskLevel(risks: string[], confidence: string): string {
  if (risks.length > 3 || confidence === 'low') return 'high';
  if (risks.length > 2 || confidence === 'medium') return 'medium';
  return 'low';
}

// Load recommendations from JSON
function loadRecommendations(): RecommendationReport {
  const dataPath = path.join(__dirname, '..', 'data', 'dm-recommendations.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Recommendations not found at ${dataPath}. Run generate-recommendations.ts first.`);
  }
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

// Seed database
async function seedRecommendations() {
  try {
    console.error('Loading recommendations...');
    const report = loadRecommendations();

    console.error(`Seeding ${report.totalRecommendations} recommendations to database...`);

    // Clear existing recommendations (optional - comment out to keep existing)
    // console.error('Clearing existing recommendations...');
    // await prisma.dMRecommendation.deleteMany();

    let inserted = 0;
    let skipped = 0;

    for (const rec of report.recommendations) {
      try {
        // Combine description with specific actions for full context
        const fullDescription = `${rec.description}\n\nSpecific Actions:\n${rec.specificActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nSuccess Factors:\n${rec.successFactors.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;

        // Check if already exists
        const existing = await prisma.dMRecommendation.findFirst({
          where: {
            accountName: rec.accountName,
            type: mapRecommendationType(rec.type)
          }
        });

        if (existing) {
          console.error(`Skipping duplicate: ${rec.accountName} - ${rec.type}`);
          skipped++;
          continue;
        }

        await prisma.dMRecommendation.create({
          data: {
            accountName: rec.accountName,
            bu: rec.bu,
            type: mapRecommendationType(rec.type),
            priority: mapConfidenceToPriority(rec.confidence, rec.expectedArrImpact, rec.type),
            title: rec.title,
            description: fullDescription,
            reasoning: rec.reasoning,
            arrImpact: rec.expectedArrImpact,
            dmImpact: rec.expectedDmImpact,
            marginImpact: 0, // Not calculated in current version
            confidenceLevel: rec.confidence === 'high' ? 85 : rec.confidence === 'medium' ? 65 : 45,
            timeline: mapTimelineToCategory(rec.timelineWeeks),
            ownerTeam: rec.ownerTeam,
            risk: mapRiskLevel(rec.risks, rec.confidence),
            status: 'pending'
          }
        });

        inserted++;

        if (inserted % 10 === 0) {
          console.error(`Progress: ${inserted}/${report.totalRecommendations}`);
        }
      } catch (error) {
        console.error(`Error inserting recommendation for ${rec.accountName}:`, error);
      }
    }

    console.error(`\n✓ Successfully inserted ${inserted} recommendations`);
    console.error(`✓ Skipped ${skipped} duplicates`);
    console.error(`✓ Total in database: ${inserted + skipped}`);

    // Show summary by type
    const byType = await prisma.dMRecommendation.groupBy({
      by: ['type'],
      _count: true,
      _sum: {
        arrImpact: true
      }
    });

    console.error('\nRecommendations by type:');
    for (const group of byType) {
      console.error(`  ${group.type}: ${group._count} recommendations, $${(group._sum.arrImpact || 0).toLocaleString()} total ARR impact`);
    }

    // Show summary by priority
    const byPriority = await prisma.dMRecommendation.groupBy({
      by: ['priority'],
      _count: true
    });

    console.error('\nRecommendations by priority:');
    for (const group of byPriority) {
      console.error(`  ${group.priority}: ${group._count} recommendations`);
    }

  } catch (error) {
    console.error('Error seeding recommendations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
if (require.main === module) {
  seedRecommendations()
    .then(() => {
      console.error('\n✓ Seeding complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seedRecommendations };
