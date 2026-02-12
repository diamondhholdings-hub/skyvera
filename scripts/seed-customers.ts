import { PrismaClient } from '@prisma/client';
import { getAllCustomersWithHealth } from '../src/lib/data/server/account-data';

const prisma = new PrismaClient();

async function main() {
  console.log('Loading customers from Excel...');
  const result = await getAllCustomersWithHealth();

  if (!result.success) {
    throw new Error(`Failed to load customers: ${result.error.message}`);
  }

  const customers = result.value;
  console.log(`Found ${customers.length} customers`);

  // Clear existing customers
  await prisma.subscription.deleteMany({});
  await prisma.customer.deleteMany({});

  console.log('Seeding customers to database...');

  for (const customer of customers) {
    await prisma.customer.create({
      data: {
        customerName: customer.customer_name,
        bu: customer.bu,
        rr: customer.rr,
        nrr: customer.nrr,
        totalRevenue: customer.total,
        rank: customer.rank || null,
        pctOfTotal: customer.pct_of_total || null,
        healthScore: customer.healthScore,
        subscriptions: {
          create: customer.subscriptions?.map((sub: any) => ({
            subId: sub.sub_id || null,
            arr: sub.arr || null,
            renewalQtr: sub.renewal_qtr || null,
            willRenew: sub.will_renew || null,
            projectedArr: sub.projected_arr || null,
          })) || []
        }
      }
    });
  }

  const count = await prisma.customer.count();
  console.log(`✓ Seeded ${count} customers to database`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
