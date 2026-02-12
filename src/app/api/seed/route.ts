import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAllCustomersWithHealth } from '@/lib/data/server/account-data';

export async function POST() {
  try {
    console.log('[Seed] Loading customers from Excel...');
    const result = await getAllCustomersWithHealth();

    if (!result.success) {
      throw new Error(`Failed to load customers: ${result.error.message}`);
    }

    const customers = result.value;
    console.log(`[Seed] Found ${customers.length} customers`);

    // Clear existing data
    await prisma.subscription.deleteMany({});
    await prisma.customer.deleteMany({});
    console.log('[Seed] Cleared existing data');

    // Seed customers
    let seeded = 0;
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
              subId: typeof sub.sub_id === 'number' ? sub.sub_id : null,
              arr: sub.arr || null,
              renewalQtr: sub.renewal_qtr || null,
              willRenew: sub.will_renew || null,
              projectedArr: sub.projected_arr || null,
            })) || []
          }
        }
      });
      seeded++;

      if (seeded % 20 === 0) {
        console.log(`[Seed] Progress: ${seeded}/${customers.length}`);
      }
    }

    const count = await prisma.customer.count();
    console.log(`[Seed] ✓ Seeded ${count} customers to database`);

    return NextResponse.json({
      success: true,
      message: `Seeded ${count} customers successfully`,
      count
    });
  } catch (error) {
    console.error('[Seed] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
