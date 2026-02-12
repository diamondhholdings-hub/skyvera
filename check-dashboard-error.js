// Quick test to see if we can load the dashboard data
const { getDashboardData } = require('./src/lib/data/server/dashboard-data.ts')

async function test() {
  console.log('Testing dashboard data loading...')
  try {
    const result = await getDashboardData()
    if (result.success) {
      console.log('✓ Dashboard data loaded successfully')
      console.log('Revenue:', result.value.totalRevenue)
    } else {
      console.error('✗ Failed to load:', result.error)
    }
  } catch (error) {
    console.error('✗ Error:', error.message)
  }
}

test()
