// tests/utils/screenshot-all-pages.ts
// Run with: npx tsx tests/utils/screenshot-all-pages.ts
import { chromium } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = 'http://localhost:3000'

const PAGES = [
  { route: '/',                                        name: 'root' },
  { route: '/dashboard',                               name: 'dashboard' },
  { route: '/accounts',                                name: 'accounts' },
  { route: '/accounts/British%20Telecommunications',   name: 'account-plan-bt' },
  { route: '/alerts',                                  name: 'alerts' },
  { route: '/query',                                   name: 'query' },
  { route: '/scenario',                                name: 'scenario' },
  { route: '/dm-strategy',                             name: 'dm-strategy' },
  { route: '/dm-strategy/demo',                        name: 'dm-strategy-demo' },
  { route: '/dm-strategy/trends',                      name: 'dm-strategy-trends' },
  { route: '/product-agent',                           name: 'product-agent' },
  { route: '/product-agent/test-analysis',             name: 'product-agent-test-analysis' },
  { route: '/test-dm-tracker',                         name: 'test-dm-tracker' },
]

async function screenshotAll() {
  const outDir = 'tests/screenshots'
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })

  const results: { name: string; status: 'ok' | 'error'; error?: string }[] = []

  for (const p of PAGES) {
    const page = await context.newPage()
    try {
      await page.goto(`${BASE_URL}${p.route}`, { waitUntil: 'networkidle', timeout: 15000 })
      // Wait a beat for client-side hydration
      await page.waitForTimeout(1500)
      await page.screenshot({
        path: path.join(outDir, `${p.name}.png`),
        fullPage: true,
      })
      console.log(`✓ ${p.name}`)
      results.push({ name: p.name, status: 'ok' })
    } catch (err) {
      console.error(`✗ ${p.name}: ${err}`)
      fs.writeFileSync(path.join(outDir, `${p.name}.ERROR.txt`), String(err))
      results.push({ name: p.name, status: 'error', error: String(err) })
    } finally {
      await page.close()
    }
  }

  await browser.close()

  console.log(`\n── Summary ──`)
  const ok = results.filter(r => r.status === 'ok').length
  const err = results.filter(r => r.status === 'error').length
  console.log(`  ✓ ${ok} pages captured`)
  if (err > 0) console.log(`  ✗ ${err} pages errored (see .ERROR.txt files)`)
  console.log(`\nScreenshots saved to ${outDir}/`)
}

screenshotAll()
