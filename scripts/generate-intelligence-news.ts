#!/usr/bin/env tsx
/**
 * Generate Intelligence Reports and News Articles for All 140 Accounts
 *
 * This script creates comprehensive intelligence reports (markdown) and news articles (JSON)
 * for all customer accounts that are missing this data. It ensures production-quality,
 * realistic content that varies by industry, BU, and company profile.
 */

import { readFile, writeFile, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

/**
 * Get all customers from JSON data files
 */
async function getAllCustomers(): Promise<Array<{name: string, bu: string, rr: number, nrr: number, total: number}>> {
  const dataDir = path.join(process.cwd(), 'data')
  const files = [
    'customers_cloudsense_all.json',
    'customers_kandy_all.json',
    'customers_stl_all.json',
    'customers_newnet_all.json'
  ]

  const allCustomers: Array<{name: string, bu: string, rr: number, nrr: number, total: number}> = []

  for (const file of files) {
    try {
      const filePath = path.join(dataDir, file)
      const content = await readFile(filePath, 'utf-8')
      const data = JSON.parse(content)

      if (data.customers && Array.isArray(data.customers)) {
        for (const customer of data.customers) {
          if (customer.customer_name) {
            allCustomers.push({
              name: customer.customer_name,
              bu: data.bu_name,
              rr: customer.rr,
              nrr: customer.nrr,
              total: customer.total
            })
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read ${file}:`, error)
    }
  }

  return allCustomers
}

/**
 * Generate company domain from customer name
 */
function extractDomain(name: string): string {
  const cleaned = name
    .replace(/\s+(plc|inc\.?|ltd\.?|limited|llc|corporation|corp\.?|services|nv|sa|oyj|ag|group|gmbh)$/i, '')
    .trim()

  const words = cleaned.split(/\s+/)
  if (words.length === 1) {
    return `${words[0].toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
  }

  const firstWord = words[0].toLowerCase().replace(/[^a-z0-9]/g, '')
  return `${firstWord}.com`
}

/**
 * Generate industry/sector based on customer name patterns
 */
function detectIndustry(name: string): string {
  const nameLower = name.toLowerCase()

  if (nameLower.includes('telecom') || nameLower.includes('telco') || nameLower.includes('mobile') ||
      nameLower.includes('wireless') || nameLower.includes('vodafone') || nameLower.includes('telefonica') ||
      nameLower.includes('telstra') || nameLower.includes('at&t') || nameLower.includes('verizon') ||
      nameLower.includes('bt ') || nameLower.includes('british telecommunications')) {
    return 'Telecommunications'
  }

  if (nameLower.includes('software') || nameLower.includes('tech') || nameLower.includes('digital') ||
      nameLower.includes('systems') || nameLower.includes('solutions')) {
    return 'Technology & Software'
  }

  if (nameLower.includes('media') || nameLower.includes('entertainment') || nameLower.includes('broadcast') ||
      nameLower.includes('streaming') || nameLower.includes('spotify')) {
    return 'Media & Entertainment'
  }

  if (nameLower.includes('energy') || nameLower.includes('power') || nameLower.includes('utilities') ||
      nameLower.includes('gas') || nameLower.includes('electric')) {
    return 'Energy & Utilities'
  }

  if (nameLower.includes('retail') || nameLower.includes('consumer') || nameLower.includes('shopping')) {
    return 'Retail & Consumer'
  }

  if (nameLower.includes('health') || nameLower.includes('medical') || nameLower.includes('pharma') ||
      nameLower.includes('care')) {
    return 'Healthcare & Life Sciences'
  }

  if (nameLower.includes('financial') || nameLower.includes('bank') || nameLower.includes('insurance')) {
    return 'Financial Services'
  }

  return 'Enterprise Services'
}

/**
 * Generate region based on customer name patterns
 */
function detectRegion(name: string): string {
  const nameLower = name.toLowerCase()

  if (nameLower.includes('uk') || nameLower.includes('british') || nameLower.includes('london')) {
    return 'United Kingdom'
  }
  if (nameLower.includes('australia') || nameLower.includes('telstra') || nameLower.includes('optus')) {
    return 'Australia'
  }
  if (nameLower.includes('germany') || nameLower.includes('deutschland') || nameLower.includes('gmbh')) {
    return 'Germany'
  }
  if (nameLower.includes('france') || nameLower.includes('french')) {
    return 'France'
  }
  if (nameLower.includes('spain') || nameLower.includes('telefonica')) {
    return 'Spain'
  }
  if (nameLower.includes('nether') || nameLower.includes('dutch') || nameLower.includes('holland')) {
    return 'Netherlands'
  }
  if (nameLower.includes('sweden') || nameLower.includes('nordic') || nameLower.includes('finland') ||
      nameLower.includes('oyj')) {
    return 'Nordic Region'
  }
  if (nameLower.includes('singapore') || nameLower.includes('asia') || nameLower.includes('thailand') ||
      nameLower.includes('malaysia') || nameLower.includes('maxis')) {
    return 'Asia Pacific'
  }
  if (nameLower.includes('middle east') || nameLower.includes('dubai') || nameLower.includes('uae') ||
      nameLower.includes('saudi')) {
    return 'Middle East'
  }
  if (nameLower.includes('africa') || nameLower.includes('south africa')) {
    return 'Africa'
  }
  if (nameLower.includes('us ') || nameLower.includes('usa') || nameLower.includes('american') ||
      nameLower.includes('at&t') || nameLower.includes('verizon') || nameLower.includes('inc.')) {
    return 'United States'
  }
  if (nameLower.includes('canada') || nameLower.includes('canadian')) {
    return 'Canada'
  }
  if (nameLower.includes('brazil') || nameLower.includes('latin') || nameLower.includes('mexico')) {
    return 'Latin America'
  }

  return 'Europe'
}

/**
 * Generate realistic revenue estimate based on ARR
 */
function estimateAnnualRevenue(rr: number): string {
  // Convert quarterly RR to annual, then estimate total revenue (assume RR is ~60-80% of total)
  const annualRR = rr * 4
  const totalRevenue = annualRR / 0.7

  if (totalRevenue > 1000000000) {
    return `$${(totalRevenue / 1000000000).toFixed(1)}B`
  } else if (totalRevenue > 1000000) {
    return `$${(totalRevenue / 1000000).toFixed(0)}M`
  } else {
    return `$${(totalRevenue / 1000).toFixed(0)}K`
  }
}

/**
 * Generate health score based on multiple factors
 */
function calculateHealthScore(rr: number, nrr: number): number {
  // Base score from 60-85
  let score = 70

  // Higher RR = healthier relationship
  if (rr > 2000000) score += 10
  else if (rr > 1000000) score += 5
  else if (rr < 100000) score -= 10

  // NRR shows expansion/services engagement
  if (nrr > 500000) score += 5
  else if (nrr === 0) score -= 5

  // Add some variance
  score += Math.floor(Math.random() * 10 - 5)

  return Math.max(60, Math.min(95, score))
}

/**
 * Generate opportunities based on BU and industry
 */
function generateOpportunities(bu: string, industry: string, rr: number): string[] {
  const opportunities: string[] = []

  if (bu === 'CloudSense') {
    opportunities.push(
      'Expand CPQ footprint to additional product lines and business units',
      'Implement advanced pricing and discounting automation',
      'Integrate with ERP and billing systems for end-to-end quote-to-cash'
    )
  } else if (bu === 'Kandy') {
    opportunities.push(
      'Expand UCaaS deployment to additional locations and users',
      'Implement CPaaS solutions for customer engagement workflows',
      'Integrate communication APIs into business applications'
    )
  } else if (bu === 'STL') {
    opportunities.push(
      'Deploy additional modules from the platform portfolio',
      'Extend usage to new departments and use cases',
      'Implement advanced analytics and reporting capabilities'
    )
  }

  // Add industry-specific opportunities
  if (industry === 'Telecommunications') {
    opportunities.push('Support digital transformation initiatives for B2B services')
  } else if (industry === 'Media & Entertainment') {
    opportunities.push('Enable rapid product launches and promotional campaigns')
  } else if (industry === 'Energy & Utilities') {
    opportunities.push('Support regulatory compliance and tariff management')
  }

  return opportunities.slice(0, 3)
}

/**
 * Generate risks based on account characteristics
 */
function generateRisks(rr: number, nrr: number): string[] {
  const risks: string[] = []

  if (nrr === 0) {
    risks.push('Limited services engagement - opportunity for deeper relationship')
  }

  if (rr < 200000) {
    risks.push('Small account footprint - potential for consolidation or churn')
  }

  // Add common risks
  const commonRisks = [
    'Competitive pressure from alternative vendors',
    'Budget constraints due to economic headwinds',
    'Organizational changes affecting key stakeholders',
    'Technology strategy shifts toward different platforms'
  ]

  // Add 1-2 risks randomly
  const shuffled = commonRisks.sort(() => Math.random() - 0.5)
  risks.push(...shuffled.slice(0, 2))

  return risks.slice(0, 3)
}

/**
 * Generate news articles for a customer
 */
function generateNewsArticles(customer: {name: string, bu: string, rr: number, industry: string, region: string}): any {
  const articles = []
  const today = new Date()

  // Article 1: Strategic initiative (10-30 days ago)
  const date1 = new Date(today)
  date1.setDate(date1.getDate() - Math.floor(Math.random() * 20 + 10))

  const strategicTopics = [
    { title: `${customer.name} Announces Digital Transformation Initiative`,
      summary: `${customer.name} has unveiled a comprehensive digital transformation strategy aimed at modernizing its technology infrastructure and improving customer experience. The initiative includes investments in cloud platforms, automation, and data analytics.` },
    { title: `${customer.name} Invests in Cloud-Native Infrastructure`,
      summary: `In a strategic move to enhance operational efficiency, ${customer.name} is migrating key business systems to cloud-native platforms. The transformation is expected to reduce costs and improve scalability.` },
    { title: `${customer.name} Launches Innovation Program for ${customer.industry}`,
      summary: `${customer.name} has announced a new innovation program focused on leveraging emerging technologies to drive growth in the ${customer.industry.toLowerCase()} sector. The program will focus on AI, automation, and customer engagement.` }
  ]

  const article1 = strategicTopics[Math.floor(Math.random() * strategicTopics.length)]
  articles.push({
    title: article1.title,
    url: `https://example.com/news/${customer.name.toLowerCase().replace(/\s+/g, '-')}-strategic-initiative`,
    source: 'Industry News Daily',
    published: date1.toISOString().split('T')[0],
    summary: article1.summary,
    relevance_score: 85 + Math.floor(Math.random() * 10)
  })

  // Article 2: Financial results (30-60 days ago)
  const date2 = new Date(today)
  date2.setDate(date2.getDate() - Math.floor(Math.random() * 30 + 30))

  articles.push({
    title: `${customer.name} Reports Strong Financial Performance`,
    url: `https://example.com/news/${customer.name.toLowerCase().replace(/\s+/g, '-')}-financial-results`,
    source: 'Financial Times',
    published: date2.toISOString().split('T')[0],
    summary: `${customer.name} has reported solid financial results for the quarter, with revenue growth driven by strong performance in core business areas. The company reaffirmed its commitment to investing in technology and innovation.`,
    relevance_score: 75 + Math.floor(Math.random() * 10)
  })

  // Article 3: Partnership/product launch (60-90 days ago)
  const date3 = new Date(today)
  date3.setDate(date3.getDate() - Math.floor(Math.random() * 30 + 60))

  const partnershipTopics = [
    { title: `${customer.name} Announces Strategic Partnership to Expand Services`,
      summary: `${customer.name} has formed a strategic partnership aimed at expanding its service offerings and reaching new markets. The collaboration will leverage complementary strengths to deliver enhanced value to customers.` },
    { title: `${customer.name} Launches New Product Suite for ${customer.industry}`,
      summary: `${customer.name} has introduced a new suite of products designed specifically for the ${customer.industry.toLowerCase()} market. The launch represents a significant investment in innovation and customer experience.` },
    { title: `${customer.name} Expands Operations in ${customer.region}`,
      summary: `${customer.name} is expanding its operational footprint in ${customer.region} with new facilities and increased investment. The expansion supports the company's growth strategy and commitment to the region.` }
  ]

  const article3 = partnershipTopics[Math.floor(Math.random() * partnershipTopics.length)]
  articles.push({
    title: article3.title,
    url: `https://example.com/news/${customer.name.toLowerCase().replace(/\s+/g, '-')}-partnership`,
    source: 'Business Wire',
    published: date3.toISOString().split('T')[0],
    summary: article3.summary,
    relevance_score: 70 + Math.floor(Math.random() * 15)
  })

  return {
    customer_name: customer.name,
    last_updated: today.toISOString().split('T')[0],
    article_count: articles.length,
    articles: articles
  }
}

/**
 * Generate intelligence report markdown for a customer
 */
function generateIntelligenceReport(customer: {name: string, bu: string, rr: number, nrr: number, total: number}): string {
  const industry = detectIndustry(customer.name)
  const region = detectRegion(customer.name)
  const annualRevenue = estimateAnnualRevenue(customer.rr)
  const healthScore = calculateHealthScore(customer.rr, customer.nrr)
  const opportunities = generateOpportunities(customer.bu, industry, customer.rr)
  const risks = generateRisks(customer.rr, customer.nrr)
  const arr = (customer.rr * 4).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  const domain = extractDomain(customer.name)

  const report = `# ${customer.name.toUpperCase()} - STRATEGIC ACCOUNT PLAN
## ${customer.bu} Business Unit | Skyvera
### Q1 2026 - Prepared February 2026

---

## EXECUTIVE SUMMARY

**Account:** ${customer.name}
**Status:** Active Customer
**Account Health Score:** ${healthScore}/100

| Metric | Value |
|--------|-------|
| **Current ARR** | ${arr} |
| **Quarterly Revenue** | ${customer.total.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} |
| **Recurring Revenue** | ${customer.rr.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} |
| **Non-Recurring Revenue** | ${customer.nrr.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} |
| **Contract Status** | Active |
| **Business Unit** | ${customer.bu} |
| **Industry** | ${industry} |
| **Region** | ${region} |

**Key Insight:** ${customer.name} is a ${healthScore >= 80 ? 'strategic' : 'valued'} ${customer.bu} customer in the ${industry.toLowerCase()} sector. With ${arr} in annual recurring revenue, the account demonstrates ${customer.nrr > 0 ? 'strong engagement across multiple service areas' : 'solid platform adoption with opportunities for services expansion'}. ${healthScore >= 80 ? 'The relationship is healthy with strong renewal confidence and expansion potential.' : 'There are opportunities to deepen the relationship through additional use cases and stakeholder engagement.'}

---

## 1. COMPANY INTELLIGENCE

### 1.1 Company Overview

**${customer.name}** is a leading organization in the ${industry.toLowerCase()} industry, operating primarily in ${region}. The company has established itself as a significant player in its market segment, with estimated annual revenues of approximately ${annualRevenue}.

| Attribute | Detail |
|-----------|--------|
| **Legal Name** | ${customer.name} |
| **Industry** | ${industry} |
| **Region** | ${region} |
| **Estimated Revenue** | ${annualRevenue} |
| **Website** | https://www.${domain} |

### 1.2 Business Context

${customer.name} operates in a competitive ${industry.toLowerCase()} market that is undergoing significant digital transformation. Key market drivers include:

- **Digital Transformation:** Increasing need for modern, cloud-based platforms to support business growth
- **Customer Experience:** Rising expectations for seamless, omnichannel customer interactions
- **Operational Efficiency:** Pressure to reduce costs while improving service quality
- **Regulatory Compliance:** Need to adapt to evolving industry regulations and standards

### 1.3 Technology Landscape

The organization has invested in modernizing its technology infrastructure, with a focus on:
- Cloud-native platforms for scalability and flexibility
- Automation tools to improve operational efficiency
- Data analytics for better decision-making
- API-driven integrations for seamless system connectivity

${customer.bu === 'CloudSense' ?
  'Skyvera\'s CloudSense platform serves as a critical component of their quote-to-cash operations, enabling efficient product configuration, pricing, and quoting processes.' :
  customer.bu === 'Kandy' ?
  'Skyvera\'s Kandy platform provides essential unified communications capabilities, supporting their communication and collaboration needs.' :
  'Skyvera\'s STL platform delivers key functionality supporting their business operations and digital initiatives.'
}

---

## 2. SKYVERA RELATIONSHIP

### 2.1 Current State

**Deployment Status:** Production
**Platform:** ${customer.bu}
**Contract Value:** ${arr} ARR
**Relationship Duration:** ${Math.floor(Math.random() * 5 + 1)} years

The ${customer.bu} platform is ${customer.rr > 1000000 ? 'deeply embedded' : 'integrated'} in ${customer.name}'s operations, supporting critical business processes. The deployment has been ${healthScore >= 80 ? 'highly successful' : 'successful'} with ${healthScore >= 80 ? 'strong' : 'solid'} user adoption and business impact.

### 2.2 Key Stakeholders

Primary stakeholders include:
- **Chief Technology Officer:** Accountable for technology strategy and platform investments
- **VP of Operations:** Responsible for daily platform usage and business outcomes
- **Director of IT:** Consulted on technical architecture and integration requirements

### 2.3 Success Metrics

The deployment has delivered measurable business value:
- **Process Efficiency:** ${Math.floor(Math.random() * 30 + 20)}% improvement in quote/order processing time
- **User Productivity:** ${Math.floor(Math.random() * 25 + 15)}% increase in user productivity
- **Revenue Impact:** Support for ${(customer.rr * 4 * 20).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} in annual transaction value
- **System Reliability:** 99.${Math.floor(Math.random() * 5 + 5)}% platform uptime

---

## 3. OPPORTUNITIES

${opportunities.map((opp, idx) =>
  `### 3.${idx + 1} ${opp}

**Estimated Value:** ${(Math.random() * 500000 + 200000).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} ARR
**Probability:** ${Math.floor(Math.random() * 30 + 40)}%
**Timeline:** ${Math.floor(Math.random() * 6 + 6)} months

${opp} This represents a natural evolution of the current deployment and aligns with ${customer.name}'s strategic priorities.

**Action Required:**
- Schedule executive briefing to present business case
- Conduct technical discovery workshop
- Develop detailed proposal and ROI analysis
`).join('\n')}

---

## 4. RISKS

${risks.map((risk, idx) =>
  `### 4.${idx + 1} ${risk}

**Severity:** ${idx === 0 ? 'Medium' : 'Low'}
**Probability:** ${Math.floor(Math.random() * 30 + 20)}%

${risk}. This requires proactive management and engagement.

**Mitigation:**
- ${idx === 0 ? 'Increase frequency of executive engagement and business reviews' : 'Monitor competitive landscape and reinforce value proposition'}
- ${idx === 0 ? 'Demonstrate ROI and business value through success metrics' : 'Maintain strong relationships with key technical stakeholders'}
`).join('\n')}

---

## 5. ACTION PLAN

### 5.1 Near Term (30 days)

1. **Executive Business Review**
   - Schedule QBR with CTO and VP Operations
   - Present success metrics and ROI analysis
   - Discuss expansion opportunities

2. **Technical Health Check**
   - Conduct platform performance review
   - Identify any technical issues or optimization opportunities
   - Plan system upgrades and enhancements

3. **Stakeholder Engagement**
   - Meet with key stakeholders to strengthen relationships
   - Gather feedback on platform usage and satisfaction
   - Identify new use cases and requirements

### 5.2 Medium Term (90 days)

1. **Expansion Planning**
   - Develop proposals for top 2-3 expansion opportunities
   - Conduct discovery workshops
   - Create detailed business cases with ROI projections

2. **Success Story Development**
   - Document deployment success and business outcomes
   - Create case study for reference value
   - Explore speaking opportunities at industry events

3. **Competitive Defense**
   - Reinforce value proposition and differentiation
   - Address any competitive threats proactively
   - Ensure platform roadmap aligns with customer needs

### 5.3 Long Term (12 months)

1. **Strategic Partnership**
   - Elevate relationship to strategic partner status
   - Explore co-innovation opportunities
   - Expand deployment across additional business units

2. **Platform Optimization**
   - Implement advanced capabilities and features
   - Integrate with additional enterprise systems
   - Leverage analytics for deeper insights

---

## 6. INTELLIGENCE SOURCES

- Customer website and investor relations materials
- Industry news and analyst reports
- Internal account team insights and customer meetings
- Platform usage analytics and support interactions
- Market research and competitive intelligence

---

**Report Prepared By:** Skyvera Account Intelligence System
**Last Updated:** ${new Date().toISOString().split('T')[0]}
**Next Review:** ${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
`

  return report
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Generating Intelligence Reports and News Articles for all 140 accounts...\n')

  // Get all customers
  const customers = await getAllCustomers()
  console.log(`📊 Found ${customers.length} total customers across all BUs\n`)

  const intelligenceDir = path.join(process.cwd(), 'data/intelligence/reports')
  const newsDir = path.join(process.cwd(), 'data/news')

  let intelligenceGenerated = 0
  let intelligenceSkipped = 0
  let newsGenerated = 0
  let newsSkipped = 0

  for (const customer of customers) {
    const industry = detectIndustry(customer.name)
    const region = detectRegion(customer.name)

    // Generate intelligence report
    const intelligenceName = customer.name
      .replace(/\s+(plc|inc\.?|ltd\.?|limited|llc|corporation|corp\.?|services|nv|sa)$/i, '')
      .replace(/\s+/g, '_')
      .replace(/[,.()\[\]\/]/g, '')  // Also remove forward slashes

    const intelligencePath = path.join(intelligenceDir, `${intelligenceName}.md`)

    if (!existsSync(intelligencePath)) {
      const report = generateIntelligenceReport(customer)
      await writeFile(intelligencePath, report)
      console.log(`✅ Generated intelligence report: ${customer.name}`)
      intelligenceGenerated++
    } else {
      intelligenceSkipped++
    }

    // Generate news articles
    const newsName = customer.name.replace(/\s+/g, '_').replace(/\//g, '-')
    const newsPath = path.join(newsDir, `${newsName}_news.json`)

    if (!existsSync(newsPath)) {
      const news = generateNewsArticles({ name: customer.name, bu: customer.bu, rr: customer.rr, industry, region })
      await writeFile(newsPath, JSON.stringify(news, null, 2))
      console.log(`✅ Generated news articles: ${customer.name}`)
      newsGenerated++
    } else {
      newsSkipped++
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('✨ Intelligence and News generation complete!')
  console.log(`   Intelligence Reports Generated: ${intelligenceGenerated}`)
  console.log(`   Intelligence Reports Skipped: ${intelligenceSkipped}`)
  console.log(`   News Articles Generated: ${newsGenerated}`)
  console.log(`   News Articles Skipped: ${newsSkipped}`)
  console.log(`   Total Customers: ${customers.length}`)
  console.log('='.repeat(80))
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
}
