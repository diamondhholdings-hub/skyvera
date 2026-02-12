/**
 * Notion Integration Test
 *
 * Simple test file to verify the Notion adapter compiles and initializes correctly
 * Run this to test your Notion configuration
 */

import { getConnectorFactory } from '@/lib/data/registry/connector-factory'
import type { NotionAdapter } from './notion'
import type { NotionAccountPlan } from '@/lib/types/notion'

/**
 * Test Notion adapter initialization
 */
export async function testNotionConnection() {
  console.log('Testing Notion integration...')

  try {
    // Get connector factory
    const factory = await getConnectorFactory()

    // Get Notion adapter
    const notion = factory.getAdapter('notion') as NotionAdapter

    if (!notion) {
      console.error('✗ Notion adapter not registered')
      return false
    }

    // Check status
    const status = notion.getStatus()
    console.log('Notion Status:', status)

    if (status.degraded) {
      console.warn('⚠ Notion running in degraded mode (not configured)')
      return false
    }

    // Test health check
    const healthy = await notion.healthCheck()

    if (healthy) {
      console.log('✓ Notion adapter is healthy')
      return true
    } else {
      console.error('✗ Notion adapter health check failed')
      return false
    }
  } catch (error) {
    console.error('✗ Test failed:', error)
    return false
  }
}

/**
 * Test Notion read operations
 */
export async function testNotionRead(accountName: string) {
  console.log(`Testing Notion read for: ${accountName}`)

  const factory = await getConnectorFactory()
  const notion = factory.getAdapter('notion') as NotionAdapter

  if (!notion || notion.getStatus().degraded) {
    console.warn('⚠ Notion not configured')
    return null
  }

  try {
    // Test account plan read
    const planResult = await notion.readAccountPlan(accountName)

    if (planResult.success) {
      console.log('✓ Read successful:', planResult.value)
      return planResult.value
    } else {
      console.error('✗ Read failed:', planResult.error.message)
      return null
    }
  } catch (error) {
    console.error('✗ Test failed:', error)
    return null
  }
}

/**
 * Test Notion write operations
 */
export async function testNotionWrite() {
  console.log('Testing Notion write...')

  const factory = await getConnectorFactory()
  const notion = factory.getAdapter('notion') as NotionAdapter

  if (!notion || notion.getStatus().degraded) {
    console.warn('⚠ Notion not configured')
    return false
  }

  try {
    // Create test account plan
    const testPlan: NotionAccountPlan = {
      accountName: 'Test Account',
      businessUnit: 'Cloudsense',
      accountStatus: 'active',
      healthScore: 85,
      arr: 100000,
      executiveSummary: 'This is a test account created by the Notion integration test.',
      strategicInitiatives: ['Test initiative 1', 'Test initiative 2'],
      keyContacts: [
        {
          name: 'Test Contact',
          role: 'Test Role',
          email: 'test@example.com',
        },
      ],
      churnRisk: 'low',
      lastUpdated: new Date().toISOString(),
    }

    // Write to Notion
    const writeResult = await notion.writeAccountPlan(testPlan)

    if (writeResult.success) {
      console.log('✓ Write successful. Page ID:', writeResult.value)
      return true
    } else {
      console.error('✗ Write failed:', writeResult.error.message)
      return false
    }
  } catch (error) {
    console.error('✗ Test failed:', error)
    return false
  }
}

/**
 * Run all tests
 */
export async function runNotionTests() {
  console.log('='.repeat(50))
  console.log('Notion Integration Test Suite')
  console.log('='.repeat(50))

  // Test 1: Connection
  console.log('\n[Test 1] Connection Test')
  const connectionOk = await testNotionConnection()

  if (!connectionOk) {
    console.log('\n⚠ Notion not configured. Skipping remaining tests.')
    console.log('To configure Notion:')
    console.log('1. Set NOTION_API_KEY in .env')
    console.log('2. Set NOTION_DATABASE_* variables for each database')
    console.log('3. Share databases with your Notion integration')
    return
  }

  // Test 2: Read
  console.log('\n[Test 2] Read Test')
  await testNotionRead('Telstra')

  // Test 3: Write
  console.log('\n[Test 3] Write Test')
  await testNotionWrite()

  console.log('\n' + '='.repeat(50))
  console.log('Test suite complete')
  console.log('='.repeat(50))
}

// Export for use in scripts or API routes
export default {
  testNotionConnection,
  testNotionRead,
  testNotionWrite,
  runNotionTests,
}
