"""Generate customer intelligence prompts for AI agents."""
import json
import os

def load_customers():
    with open('data/customers_top80.json', 'r') as f:
        return json.load(f)['customers']

def generate_prompt(customer):
    """Generate comprehensive intelligence prompt for customer."""
    customer_name = customer['customer_name']
    rr = customer['rr']
    nrr = customer['nrr']
    total = customer['total']
    rank = customer['rank']
    subs_count = len(customer['subscriptions'])

    prompt = f"""Create a comprehensive B2B SaaS account plan for {customer_name} (CloudSense customer #{rank} by revenue).

**CUSTOMER CONTEXT:**
- **Total Revenue:** ${total:,.0f} ({customer['pct_of_total']:.1f}% of CloudSense)
- **Recurring Revenue (RR/ARR):** ${rr:,.0f}
- **Non-Recurring Revenue (NRR/FY26):** ${nrr:,.0f}
- **Customer Rank:** #{rank} of top 80% customers
- **Active Subscriptions:** {subs_count}
- **Business Unit:** CloudSense (part of Skyvera multi-BU SaaS company)

**WHAT CLOUDSENSE PROVIDES:**
CloudSense delivers CPQ (Configure, Price, Quote) and Commercial Order Management software for telecommunications and communications companies. It's a Salesforce-native platform that enables complex B2B product configuration, multi-site quoting, automated order fulfillment, and seamless BSS/OSS integration.

**RESEARCH REQUIRED:**

## 1. Company Intelligence
- Business model, industry vertical, market position
- Annual revenue, employee count, market cap (if public)
- Geographic presence and key markets
- Strategic initiatives and priorities (2025-2026)
- Digital transformation goals
- Technology modernization plans

## 2. Executive Leadership & Stakeholders
- **C-Suite:** CEO, CFO, CTO/CIO, COO with names, backgrounds, tenure
- **Technology Leaders:** Head of IT, Head of Digital, VP Engineering, VP Product
- **Business Leaders:** Head of Sales, Head of B2B/Enterprise, Head of Operations
- **Procurement:** CPO, vendor management contacts

For each key executive:
- Full name and current title
- Career background and tenure at company
- LinkedIn profile (if available)
- Public statements about technology/business priorities
- Role in CloudSense relationship (Decision Maker vs Influencer)
- Likely stance (Supporter/Neutral/Detractor based on public info)

## 3. Product Alignment & Value Proposition
- How does CloudSense CPQ align with their business needs?
- What specific use cases benefit them? (complex quotes, B2B sales, multi-site)
- Integration with their tech stack (CRM, billing, BSS/OSS)
- Quantifiable business value delivered
- ROI and efficiency gains

## 4. Pain Points & Strategic Initiatives
- Top 3-5 current business challenges
- Technology pain points CloudSense addresses
- Strategic initiatives for 2025-2026 where CloudSense is relevant
- Budget priorities and cost reduction targets
- Revenue growth and expansion goals

For each pain point:
- Urgency level (Critical/High/Medium/Low)
- Budget allocated (if known)
- Executive owner
- How CloudSense solves or mitigates it

## 5. Competitive Landscape
- Who are their main business competitors?
- What technology vendors do they use? (CRM, billing, CPQ alternatives)
- Competitive threats to our CloudSense relationship:
  - Salesforce Revenue Cloud
  - Amdocs
  - Oracle CPQ
  - Other CPQ/BSS vendors
- Our differentiation and defensive positioning

## 6. Subscription Analysis
Current subscriptions: {subs_count}
- Renewal timeline and dates
- Contract terms and duration
- Renewal risk assessment
- Expansion/upsell opportunities
- Cross-sell potential (other Skyvera products: Kandy, STL)

## 7. Opportunities & Growth Potential
- Upsell opportunities (expand CloudSense usage)
- Cross-sell to other divisions/geographies
- New use cases or product features
- Strategic partnership potential
- Reference customer / case study value
- Revenue potential with probability estimates

## 8. Risks & Threats
- Churn risk factors
- Budget cuts or cost reduction pressures
- Competitive displacement threats
- M&A activity affecting relationship
- Technology platform shifts
- Contact turnover / champion departure

## 9. Account Strategy & Action Plan
- Immediate actions (next 30 days)
- 60-day priorities
- 90-day strategic initiatives
- Key messages for each executive stakeholder
- Relationship building actions
- Defensive moves against competitive threats

## 10. Decision Maker Mapping
Create a 2x2 matrix categorizing stakeholders:
- **Supporter & Decision Maker:** High priority engagement
- **Detractor & Decision Maker:** Risk mitigation required
- **Supporter & Influencer:** Leverage for access
- **Detractor & Influencer:** Monitor and address concerns

**OUTPUT FORMAT:**
- Structured markdown with clear sections
- Specific names, titles, and data (not placeholders)
- Actionable recommendations with timelines
- Risk/opportunity assessment with revenue impact estimates
- Include LinkedIn URLs where available
- Cite sources for public information

**SPECIAL CONSIDERATIONS:**
- If this is a technology/software company (not a telecom operator), they may be a KANDY customer (communications APIs) rather than CloudSense
- If NRR is significantly higher than RR, focus on understanding the professional services/consulting relationship
- Look for recent news, press releases, earnings calls, strategy documents
- Identify any recent M&A, leadership changes, or strategic shifts

**DELIVERABLE:** Comprehensive account plan intelligence brief ready for HTML dashboard population.
"""

    return prompt

def main():
    customers = load_customers()

    os.makedirs('data/intelligence/prompts', exist_ok=True)

    print("="*100)
    print("GENERATING CUSTOMER INTELLIGENCE PROMPTS")
    print("="*100)
    print(f"\nTotal customers: {len(customers)}\n")

    for customer in customers:
        customer_name = customer['customer_name']
        filename = f"{customer_name.replace('/', '-').replace(' ', '_')}.txt"
        filepath = f"data/intelligence/prompts/{filename}"

        prompt = generate_prompt(customer)

        with open(filepath, 'w') as f:
            f.write(prompt)

        print(f"#{customer['rank']:<3} {customer_name[:60]:<60} → {filename}")

    print("\n" + "="*100)
    print(f"✅ Generated {len(customers)} intelligence prompts")
    print(f"📁 Saved to: data/intelligence/prompts/")
    print("="*100)
    print("\nNEXT STEP: Run customer-intelligence-analyst agents using these prompts")
    print("  - Use Task tool with subagent_type='customer-intelligence-analyst'")
    print("  - Load prompt from data/intelligence/prompts/{customer}.txt")
    print("  - Save output to data/intelligence/reports/{customer}.md")

if __name__ == '__main__':
    main()
