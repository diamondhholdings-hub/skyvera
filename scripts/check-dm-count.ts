import { config } from 'dotenv';
import * as path from 'path';
config({ path: path.join(__dirname, '..', '.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCount() {
  const count = await prisma.dMRecommendation.count();
  console.log(`Total DM Recommendations in database: ${count}`);

  const byPriority = await prisma.dMRecommendation.groupBy({
    by: ['priority'],
    _count: true
  });

  console.log('\nBy Priority:');
  for (const group of byPriority) {
    console.log(`  ${group.priority}: ${group._count}`);
  }

  await prisma.$disconnect();
}

checkCount();
