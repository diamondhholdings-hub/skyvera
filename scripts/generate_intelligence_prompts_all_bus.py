#!/usr/bin/env python3
"""
Generate customer intelligence research prompts for all Business Units
Reads customer data from JSON files and creates comprehensive research prompts
"""

import json
import os

# Define paths
BASE_DIR = "/Users/RAZER/Documents/projects/Skyvera"
DATA_DIR = os.path.join(BASE_DIR, "data")
PROMPTS_DIR = os.path.join(DATA_DIR, "intelligence", "prompts")

# BU configurations with descriptions
BU_CONFIGS = {
    "CloudSense": {
        "file": "customers_top80.json",
        "description": "CloudSense delivers CPQ (Configure, Price, Quote) and Commercial Order Management software for telecommunications and communications companies. It's a Salesforce-native platform that enables complex B2B product configuration, multi-site quoting, automated order fulfillment, and seamless BSS/OSS integration."
    },
    "Kandy": {
        "file": "customers_kandy_top80.json",
        "description": "Kandy provides CPaaS (Communications Platform as a Service) and UCaaS (Unified Communications as a Service) solutions with APIs for voice, video, messaging, SMS, and team collaboration. It enables businesses to embed real-time communications capabilities directly into their applications and workflows."
    },
    "STL": {
        "file": "customers_stl_top80.json",
        "description": "STL (Software Technology Labs) delivers specialized software solutions and technology consulting services. STL focuses on custom software development, systems integration, and technical consulting for enterprise clients requiring tailored technology solutions."
    },
    "NewNet": {
        "file": "customers_newnet_top80.json",
        "description": "NewNet provides network management and telecommunications software solutions. NewNet specializes in OSS/BSS systems, network operations, service assurance, and telecommunications infrastructure management for carriers and service providers."
    }
}

def sanitize_filename(name):
    """Sanitize customer name for use in filename"""
    # Replace problematic characters
    sanitized = name.replace("/", "_").replace("\\", "_").replace(":", "_")
    sanitized = sanitized.replace("*", "_").replace("?", "_").replace('"', "_")
    sanitized = sanitized.replace("<", "_").replace(">", "_").replace("|", "_")
    return sanitized

def generate_prompt(customer, bu_name, bu_description):
    """Generate intelligence research prompt for a customer"""

    customer_name = customer["customer_name"]
    rr = customer["rr"]
    nrr = customer["nrr"]
    total = customer["total"]
    rank = customer["rank"]
    pct_of_total = customer["pct_of_total"]
    num_subscriptions = len([sub for sub in customer["subscriptions"] if isinstance(sub.get("sub_id"), (int, float))])

    prompt = f"""Create a comprehensive B2B SaaS account plan for {customer_name} ({bu_name} customer #{rank} by revenue).

**CUSTOMER CONTEXT:**
- **Total Revenue:** ${total:,.0f} ({pct_of_total:.1f}% of {bu_name})
- **Recurring Revenue (RR/ARR):** ${rr:,.0f}
- **Non-Recurring Revenue (NRR/FY26):** ${nrr:,.0f}
- **Customer Rank:** #{rank} of top 80% customers
- **Active Subscriptions:** {num_subscriptions}
- **Business Unit:** {bu_name} (part of Skyvera multi-BU SaaS company)

**WHAT {bu_name.upper()} PROVIDES:**
{bu_description}

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
- Role in {bu_name} relationship (Decision Maker vs Influencer)
- Likely stance (Supporter/Neutral/Detractor based on public info)

## 3. Product Alignment & Value Proposition
- How does {bu_name} align with their business needs?
- What specific use cases benefit them?
- Integration with their tech stack
- Quantifiable business value delivered
- ROI and efficiency gains

## 4. Pain Points & Strategic Initiatives
- Top 3-5 current business challenges
- Technology pain points {bu_name} addresses
- Strategic initiatives for 2025-2026 where {bu_name} is relevant
- Budget priorities and cost reduction targets
- Revenue growth and expansion goals

For each pain point:
- Urgency level (Critical/High/Medium/Low)
- Budget allocated (if known)
- Executive owner
- How {bu_name} solves or mitigates it

## 5. Competitive Landscape
- Who are their main business competitors?
- What technology vendors do they use?
- Competitive threats to our {bu_name} relationship
- Our differentiation and defensive positioning

## 6. Subscription Analysis
Current subscriptions: {num_subscriptions}
- Renewal timeline and dates
- Contract terms and duration
- Renewal risk assessment
- Expansion/upsell opportunities
- Cross-sell potential (other Skyvera products: CloudSense, Kandy, STL, NewNet)

## 7. Opportunities & Growth Potential
- Upsell opportunities (expand {bu_name} usage)
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
- If NRR is significantly higher than RR, focus on understanding the professional services/consulting relationship
- Look for recent news, press releases, earnings calls, strategy documents
- Identify any recent M&A, leadership changes, or strategic shifts
- Consider cross-sell opportunities to other Skyvera BUs based on customer profile

**DELIVERABLE:** Comprehensive account plan intelligence brief ready for HTML dashboard population.
"""

    return prompt

def main():
    """Main execution function"""

    # Ensure prompts directory exists
    os.makedirs(PROMPTS_DIR, exist_ok=True)

    total_prompts = 0

    # Process each BU
    for bu_name, config in BU_CONFIGS.items():
        print(f"\n{'='*60}")
        print(f"Processing {bu_name}...")
        print(f"{'='*60}")

        # Load customer data
        json_file = os.path.join(DATA_DIR, config["file"])

        if not os.path.exists(json_file):
            print(f"WARNING: {json_file} not found. Skipping {bu_name}.")
            continue

        with open(json_file, 'r') as f:
            data = json.load(f)

        customers = data.get("customers", [])
        bu_description = config["description"]

        print(f"Found {len(customers)} customers in {bu_name}")

        # Generate prompts for each customer
        bu_prompts = 0
        for customer in customers:
            customer_name = customer["customer_name"]

            # Generate prompt
            prompt = generate_prompt(customer, bu_name, bu_description)

            # Create filename
            sanitized_name = sanitize_filename(customer_name)
            filename = f"{sanitized_name}_{bu_name}.txt"
            filepath = os.path.join(PROMPTS_DIR, filename)

            # Write prompt file
            with open(filepath, 'w') as f:
                f.write(prompt)

            bu_prompts += 1
            print(f"  [{bu_prompts}] {customer_name}")

        total_prompts += bu_prompts
        print(f"\n{bu_name}: {bu_prompts} prompts generated")

    print(f"\n{'='*60}")
    print(f"TOTAL: {total_prompts} intelligence prompts generated")
    print(f"Location: {PROMPTS_DIR}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
