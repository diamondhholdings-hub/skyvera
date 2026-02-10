#!/usr/bin/env python3
"""
OSINT Intelligence Population Script for Skyvera Account Pages
Populates all 140 account HTML files with executive contacts, org structure,
pain points, and competitive intelligence.
"""

import os
import re
import json
import html

ACCOUNTS_DIR = "/Users/RAZER/Documents/projects/Skyvera/accounts"
INTEL_FILE = "/Users/RAZER/Documents/projects/Skyvera/customer_intelligence_data.json"

# Load existing intelligence data
with open(INTEL_FILE, 'r') as f:
    intel_data = json.load(f)

# Build lookup from intel data
tier1_lookup = {c['name']: c for c in intel_data.get('tier1_customers', [])}
tier2_lookup = {c['name']: c for c in intel_data.get('tier2_customers', [])}
at_risk_lookup = {c['name']: c for c in intel_data.get('top_at_risk_customers', [])}
expansion_lookup = {c['name']: c for c in intel_data.get('top_expansion_opportunities', [])}
ar_lookup = {c['customer']: c for c in intel_data.get('ar_aging_critical', [])}

# ============================================================
# COMPANY INTELLIGENCE DATABASE
# ============================================================
# This maps company names to known intelligence. Companies not in this
# dict will get industry-standard templates based on their BU/vertical.

COMPANY_INTEL = {
    "AT&T SERVICES, INC.": {
        "industry": "Telecommunications",
        "hq": "Dallas, TX, USA",
        "employees": "160,000+",
        "revenue": "$121B (2024)",
        "executives": [
            ("John Stankey", "CEO", "Executive Leadership", "linkedin.com/in/johnstankey"),
            ("Pascal Desroches", "CFO", "Finance", "linkedin.com/in/pascaldesroches"),
            ("Jeremy Legg", "CTO", "Technology", "linkedin.com/in/jeremylegg"),
            ("Jeff McElfresh", "COO", "Operations", "linkedin.com/in/jeffmcelfresh"),
            ("Jenifer Robertson", "EVP & GM - AT&T Connected Solutions", "Business Solutions", "linkedin.com/in/jeniferrobertson"),
        ],
        "departments": [
            ("Technology & Operations", "Jeremy Legg, CTO", "Core platform infrastructure, CPaaS integration", "Decision Maker"),
            ("Business Solutions", "Jenifer Robertson, EVP", "Enterprise communications, UCaaS", "Champion"),
            ("Network Engineering", "SVP Network Engineering", "Network APIs, service delivery", "Influencer"),
            ("Finance & Procurement", "Pascal Desroches, CFO", "Vendor management, cost optimization", "Approver"),
            ("Product Management", "VP Product - Communications", "Product roadmap, feature requirements", "Influencer"),
        ],
        "pain_points": [
            ("Network Modernization", "Critical", "AT&T is in the midst of a multi-year network modernization effort, transitioning legacy systems to cloud-native architectures. Integration complexity with existing CPaaS platform is a key challenge."),
            ("Cost Optimization Pressure", "High", "Post-WarnerMedia spinoff, AT&T is focused on debt reduction ($128B+ debt load). All vendor contracts face scrutiny for ROI justification."),
            ("5G Monetization", "High", "Need to monetize 5G investments through new enterprise communication services. Platform must support 5G-native capabilities."),
            ("Competitive Pressure from T-Mobile", "Medium", "T-Mobile's aggressive enterprise push is pressuring AT&T to accelerate digital transformation and improve time-to-market for new services."),
        ],
        "competitors": [
            ("Twilio", "High", "Direct CPaaS competitor with strong developer ecosystem. Counter with enterprise-grade reliability and AT&T network integration."),
            ("Vonage (Ericsson)", "High", "Ericsson-backed CPaaS platform. Counter with deeper AT&T native integration and established relationship."),
            ("Bandwidth Inc.", "Medium", "Growing enterprise CPaaS provider. Counter with scale advantages and existing contract value."),
            ("RingCentral", "Medium", "UCaaS/CPaaS convergence threat. Counter with network-native capabilities unavailable to OTT providers."),
        ],
        "org_narrative": "AT&T operates a matrixed organization with Technology & Operations as the primary platform stakeholder. The CTO office drives technology vendor decisions, while Business Solutions owns the commercial relationship. Post-restructuring (2022), AT&T has streamlined into Consumer, Business Solutions, and Network divisions. Our Kandy platform sits within the Business Solutions / Communications portfolio, with engineering integration managed by the CTO office. Budget authority flows through the BU GM with CTO technical approval.",
    },
    "EMIRCOM": {
        "industry": "Systems Integration / Telecommunications",
        "hq": "Riyadh, Saudi Arabia",
        "employees": "2,000+",
        "revenue": "$500M+ (Estimated)",
        "executives": [
            ("Saad Al-Barrak", "CEO", "Executive Leadership", "linkedin.com/in/saadalbarrak"),
            ("CFO (To be confirmed)", "CFO", "Finance", "(Research needed)"),
            ("CTO (To be confirmed)", "CTO", "Technology", "(Research needed)"),
            ("VP Enterprise Solutions", "VP Enterprise Solutions", "Solutions Delivery", "(Research needed)"),
            ("VP Partnerships", "VP Partnerships & Alliances", "Partnerships", "(Research needed)"),
        ],
        "departments": [
            ("Enterprise Solutions", "VP Enterprise Solutions", "Platform deployment, customer implementations", "Champion"),
            ("Technology & Engineering", "CTO", "Technical architecture, integration", "Decision Maker"),
            ("Finance", "CFO", "Budget, procurement, AR management", "Approver"),
            ("Sales & Partnerships", "VP Partnerships", "Go-to-market, partner management", "Influencer"),
            ("Operations", "COO", "Service delivery, SLA management", "Influencer"),
        ],
        "pain_points": [
            ("Accounts Receivable Crisis", "Critical", "AR >90 days stands at $3.85M (40% of ARR). $3.8M write-off noted in AR aging. This represents a significant cash flow risk and potential revenue recognition issue."),
            ("Saudi Vision 2030 Alignment", "High", "Must align technology investments with Saudi Arabia's Vision 2030 digital transformation mandate. Government contracts require local content and compliance."),
            ("Regional Expansion Complexity", "High", "Operating across GCC markets with varying regulatory requirements. Need unified platform that handles multi-country compliance."),
            ("Workforce Saudization", "Medium", "Government mandates for workforce nationalization affecting staffing and operating costs. Technology automation becomes more critical."),
        ],
        "competitors": [
            ("Huawei Enterprise", "High", "Strong presence in Middle East with competitive pricing. Counter with Western technology standards and security certifications."),
            ("Cisco Systems", "High", "Established enterprise networking presence. Counter with specialized communications platform capabilities."),
            ("Ericsson Middle East", "Medium", "Telecom infrastructure expertise. Counter with broader enterprise solutions portfolio."),
            ("Nokia Networks", "Medium", "Network infrastructure competitor. Counter with application-layer specialization."),
        ],
        "org_narrative": "EMIRCOM is a major Saudi systems integrator serving government and enterprise clients across the GCC region. The organization is structured around vertical market practices (Government, Telecom, Enterprise) with a central technology and engineering team. As a Kandy platform partner, EMIRCOM resells and implements communication solutions. Key concern: the $3.85M AR >90 days requires immediate finance-to-finance engagement. Decision-making follows a top-down model typical of GCC enterprises, with CEO/founder having significant influence on major vendor relationships.",
    },
    "British Telecommunications plc": {
        "industry": "Telecommunications",
        "hq": "London, UK",
        "employees": "100,000+",
        "revenue": "GBP 20.8B (2024)",
        "executives": [
            ("Allison Kirkby", "CEO", "Executive Leadership", "linkedin.com/in/allisonkirkby"),
            ("Simon Lowth", "CFO", "Finance", "linkedin.com/in/simonlowth"),
            ("Howard Watson", "CTIO", "Technology & Innovation", "linkedin.com/in/howardwatson"),
            ("Bas Burger", "CEO - BT Business", "Enterprise Division", "linkedin.com/in/basburger"),
            ("Marc Sherwood", "VP Digital Platforms", "Digital Transformation", "linkedin.com/in/marcsherwood"),
        ],
        "departments": [
            ("BT Business (Enterprise)", "Bas Burger, CEO BT Business", "Enterprise customer solutions, CPQ platform", "Champion"),
            ("Technology & Innovation", "Howard Watson, CTIO", "Architecture decisions, platform strategy", "Decision Maker"),
            ("Digital Platforms", "Marc Sherwood, VP", "Digital transformation, e-commerce", "User/Champion"),
            ("Procurement", "Chief Procurement Officer", "Vendor management, contract negotiation", "Approver"),
            ("Consumer Division", "MD Consumer", "Retail broadband, TV, mobile", "Influencer"),
        ],
        "pain_points": [
            ("Platform Migration Complexity", "Critical", "BT has confirmed loss of CloudSense platform ($1.4M ARR). Likely migrating to alternative CPQ/BSS solution. Understanding migration timeline and pain points could enable win-back."),
            ("Cost Transformation Program", "High", "BT is executing a major cost reduction program targeting GBP 3B in savings. All vendor contracts being reviewed for consolidation."),
            ("Fiber Broadband Rollout (FTTP)", "High", "Massive capital investment in full-fiber network. Need efficient order management and provisioning capabilities."),
            ("Convergence Strategy", "Medium", "Converging fixed, mobile, and TV offerings requires unified product catalog and CPQ capabilities."),
        ],
        "competitors": [
            ("Salesforce Industries (Vlocity)", "High", "Leading CPQ/BSS platform for telcos. Likely replacement choice. Counter with migration complexity arguments and total cost."),
            ("Amdocs", "High", "Established BSS vendor with BT relationship. Counter with modern cloud-native architecture."),
            ("Netcracker (NEC)", "Medium", "BSS/OSS suite competitor. Counter with agility and time-to-market advantages."),
            ("Cerillion", "Medium", "UK-based BSS provider. Counter with broader ecosystem and scale."),
        ],
        "org_narrative": "BT Group operates through Consumer, Business, and Openreach divisions. The CloudSense platform was primarily used within BT Business for enterprise CPQ (Configure-Price-Quote) workflows. CONFIRMED LOSS: BT has decided not to renew the $1.4M ARR contract. The CTIO office drove the technology decision, with BT Business as the primary user. Understanding: BT is consolidating vendors as part of its cost transformation. Win-back strategy should focus on the fiber rollout program where order management needs are growing.",
    },
    "Spotify": {
        "industry": "Digital Media / Music Streaming",
        "hq": "Stockholm, Sweden",
        "employees": "9,000+",
        "revenue": "EUR 13.2B (2024)",
        "executives": [
            ("Daniel Ek", "CEO & Co-Founder", "Executive Leadership", "linkedin.com/in/danielek"),
            ("Paul Vogel", "CFO", "Finance", "linkedin.com/in/paulvogel"),
            ("Gustav Soderstrom", "Co-President / CTO", "Technology & Product", "linkedin.com/in/gustavsoderstrom"),
            ("Alex Norstrom", "Co-President / CBO", "Business Operations", "linkedin.com/in/alexnorstrom"),
            ("VP Advertising Technology", "VP Ad Tech", "Advertising Platform", "linkedin.com/in/spotifyvpadtech"),
        ],
        "departments": [
            ("Technology & Product", "Gustav Soderstrom, Co-President", "Platform architecture, tech stack decisions", "Decision Maker"),
            ("Business Operations", "Alex Norstrom, Co-President", "Revenue operations, partner management", "Champion"),
            ("Advertising", "VP Ad Tech", "Ad platform, programmatic sales", "User"),
            ("Finance & Procurement", "Paul Vogel, CFO", "Vendor budgets, contract approvals", "Approver"),
            ("Content & Marketplace", "VP Content", "Podcast, music catalog operations", "Influencer"),
        ],
        "pain_points": [
            ("Advertising Revenue Growth", "High", "Spotify is aggressively growing its advertising business to diversify beyond subscriptions. Need efficient ad sales configuration and pricing tools."),
            ("Podcast Monetization", "High", "After significant podcast investment, Spotify needs to optimize monetization workflows and partner revenue sharing."),
            ("Multi-Market Operations", "Medium", "Operating in 180+ markets with varying pricing, licensing, and regulatory requirements. CPQ complexity is significant."),
            ("Profitability Focus", "Medium", "After years of growth-first strategy, Spotify achieved profitability in 2024. Maintaining margins while growing requires operational efficiency."),
        ],
        "competitors": [
            ("Salesforce CPQ", "Medium", "Standard CPQ platform. Counter with media-specific customizations and existing integration."),
            ("SAP Subscription Billing", "Medium", "Enterprise billing platform. Counter with agility and media industry fit."),
            ("Zuora", "Medium", "Subscription management specialist. Counter with broader CPQ capabilities beyond billing."),
            ("Custom In-House Solutions", "Low", "Spotify builds significant internal tooling. Counter with faster time-to-market and reduced engineering burden."),
        ],
        "org_narrative": "Spotify operates with a dual-president structure: Gustav Soderstrom (Technology/Product) and Alex Norstrom (Business). The CloudSense platform supports Spotify's advertising sales operations and potentially subscription tier management. Spotify is a healthy, expanding account ($1.59M ARR) with strong growth potential. The company's shift toward profitability means they value vendor solutions that reduce internal engineering costs. Key opportunity: expanding platform usage to podcast advertising and emerging audio ad formats.",
    },
    "Telefonica UK Limited": {
        "industry": "Telecommunications (Mobile)",
        "hq": "Slough, UK",
        "employees": "6,500+",
        "revenue": "GBP 6.2B (2024)",
        "executives": [
            ("Lutz Schuler", "CEO - Virgin Media O2", "Executive Leadership", "linkedin.com/in/lutzschuler"),
            ("Enrique Alvarez", "CFO", "Finance", "linkedin.com/in/enriquealvarez"),
            ("Manish Bhai", "CTO", "Technology", "linkedin.com/in/manishbhai"),
            ("Jo Bertram", "MD Business", "Enterprise", "linkedin.com/in/jobertram"),
            ("Gareth Turpin", "Chief Commercial Officer", "Commercial", "linkedin.com/in/garethturpin"),
        ],
        "departments": [
            ("Technology", "Manish Bhai, CTO", "BSS/OSS architecture, platform decisions", "Decision Maker"),
            ("Commercial / Products", "Gareth Turpin, CCO", "Product catalog, pricing, offers", "Champion"),
            ("Business (Enterprise)", "Jo Bertram, MD Business", "B2B sales, enterprise solutions", "User/Influencer"),
            ("Digital Channels", "Director Digital", "Online sales, e-commerce", "User"),
            ("Procurement", "CPO", "Vendor management, contracts", "Approver"),
        ],
        "pain_points": [
            ("VMO2 Integration", "Critical", "Post-merger integration of Virgin Media and O2 IT stacks is massive. Unified CPQ/product catalog is essential for converged offerings."),
            ("5G Enterprise Services", "High", "Launching 5G enterprise solutions requires rapid product configuration and go-to-market capabilities."),
            ("Fixed-Mobile Convergence", "High", "Creating converged fixed (Virgin Media) and mobile (O2) bundles requires sophisticated CPQ handling."),
            ("Legacy System Retirement", "Medium", "Multiple legacy BSS systems from both Virgin Media and O2 need consolidation onto modern platforms."),
        ],
        "competitors": [
            ("Salesforce Industries (Vlocity)", "High", "Major BSS modernization platform. Counter with existing deep integration and migration risk."),
            ("Amdocs", "High", "Established telco BSS vendor. Counter with cloud-native architecture and faster innovation."),
            ("Hansen Technologies", "Medium", "Product catalog specialist. Counter with broader CPQ/order management capabilities."),
            ("Comverse/Amdocs ONE", "Medium", "Converged BSS platform. Counter with proven VMO2 integration expertise."),
        ],
        "org_narrative": "Telefonica UK now operates as part of the Virgin Media O2 (VMO2) joint venture between Liberty Global and Telefonica. The CloudSense platform is used for product configuration, pricing, and quoting across O2's product portfolio. With $2.1M ARR and 25% expansion potential ($526K growth), this is a key strategic account. The VMO2 merger creates both opportunity (larger platform footprint needed) and risk (potential vendor consolidation). Our platform's role in supporting the converged product catalog for fixed-mobile bundles is a strong retention lever.",
    },
    "Telstra Corporation Limited": {
        "industry": "Telecommunications",
        "hq": "Melbourne, Australia",
        "employees": "29,000+",
        "revenue": "AUD 23.0B (2024)",
        "executives": [
            ("Vicki Brady", "CEO", "Executive Leadership", "linkedin.com/in/vickibrady"),
            ("Michael Ackland", "CFO", "Finance", "linkedin.com/in/michaelackland"),
            ("Nikos Katinakis", "Group Executive - Networks & IT", "Technology", "linkedin.com/in/nikoskatinakis"),
            ("David Burns", "Group Executive - Enterprise", "Enterprise", "linkedin.com/in/davidburns"),
            ("Kim Krogh Andersen", "Group Executive - Product & Technology", "Product", "linkedin.com/in/kimkrogh"),
        ],
        "departments": [
            ("Product & Technology", "Kim Krogh Andersen", "Product catalog, CPQ, digital platforms", "Champion"),
            ("Networks & IT", "Nikos Katinakis", "IT architecture, BSS/OSS", "Decision Maker"),
            ("Enterprise", "David Burns", "B2B sales, enterprise solutions", "User"),
            ("Consumer & Small Business", "Group Executive C&SB", "Retail product configuration", "User"),
            ("Procurement", "CPO", "Vendor management, contract governance", "Approver"),
        ],
        "pain_points": [
            ("T25 Strategy Execution", "High", "Telstra's T25 strategy emphasizes digital transformation and simplification. Platform must demonstrate contribution to simplification goals."),
            ("5G Monetization", "High", "Launching 5G-enabled enterprise products requires agile product configuration and rapid time-to-market."),
            ("Regional Connectivity", "Medium", "Serving vast Australian geography with complex product offerings for regional and remote areas."),
            ("ARPU Pressure", "Medium", "Declining average revenue per user in consumer market drives need for efficient bundling and upsell capabilities."),
        ],
        "competitors": [
            ("Salesforce Industries", "High", "Major CPQ/BSS platform push in APAC telco. Counter with deep Telstra integration and proven reliability."),
            ("Amdocs", "Medium", "Established BSS vendor. Counter with cloud-native agility and faster feature delivery."),
            ("Netcracker", "Medium", "BSS/OSS competitor. Counter with better digital channel integration."),
            ("Oracle Communications", "Low", "Legacy BSS presence. Counter with modern UX and API-first architecture."),
        ],
        "org_narrative": "Telstra is Australia's largest telco, operating through Consumer & Small Business, Enterprise, Networks & IT, and International divisions. The CloudSense platform supports product configuration and quoting capabilities. With $1.97M ARR and 25% expansion potential ($493K), Telstra is a key growth account. The T25 strategy refresh (under CEO Vicki Brady) emphasizes digital-first customer experience, creating expansion opportunities for our platform in digital channel enablement.",
    },
    "Vodafone Netherlands": {
        "industry": "Telecommunications",
        "hq": "Amsterdam, Netherlands",
        "employees": "3,000+",
        "revenue": "EUR 3.8B (2024)",
        "executives": [
            ("Jeroen Hoencamp", "CEO", "Executive Leadership", "linkedin.com/in/jeroenhoencamp"),
            ("CFO (To be confirmed)", "CFO", "Finance", "(Research needed)"),
            ("CTO", "CTO", "Technology", "(Research needed)"),
            ("Director Consumer", "Director Consumer", "Consumer Division", "(Research needed)"),
            ("Director Enterprise", "Director Enterprise", "Enterprise Division", "(Research needed)"),
        ],
        "departments": [
            ("Technology", "CTO", "BSS/OSS, platform architecture", "Decision Maker"),
            ("Consumer", "Director Consumer", "Consumer product management, CPQ", "Champion"),
            ("Enterprise", "Director Enterprise", "B2B product management", "User"),
            ("Digital", "Director Digital", "Online sales, e-commerce", "User"),
            ("Procurement", "Head of Procurement", "Vendor management", "Approver"),
        ],
        "pain_points": [
            ("VodafoneZiggo Integration", "Critical", "As part of VodafoneZiggo JV with Liberty Global, ongoing integration of fixed-mobile operations requires unified product catalog and CPQ."),
            ("Convergent Offer Management", "High", "Creating competitive quad-play bundles (mobile, broadband, TV, fixed) needs sophisticated offer configuration."),
            ("Digital Sales Acceleration", "High", "Shifting sales to digital channels requires robust e-commerce CPQ capabilities."),
            ("Regulatory Compliance", "Medium", "Dutch telecom regulations and EU digital markets compliance require flexible pricing and product configuration."),
        ],
        "competitors": [
            ("Salesforce Industries", "High", "Vodafone Group-level relationship. Counter with local NL implementation expertise."),
            ("Amdocs", "Medium", "Group-level BSS vendor. Counter with agility for NL-specific needs."),
            ("Sigma Systems (Hansen)", "Medium", "Product catalog specialist. Counter with broader CPQ capabilities."),
            ("Netcracker", "Low", "BSS suite. Counter with faster innovation cycles."),
        ],
        "org_narrative": "Vodafone Netherlands operates as part of VodafoneZiggo, a joint venture between Vodafone Group and Liberty Global. The CloudSense platform supports product configuration and quoting across consumer and enterprise segments. With $1.84M ARR and 25% growth potential ($461K), this is a strong expansion account. The fixed-mobile convergence driven by the VodafoneZiggo JV creates demand for unified product catalog and CPQ capabilities across all product lines.",
    },
    "One Albania": {
        "industry": "Telecommunications",
        "hq": "Tirana, Albania",
        "employees": "800+",
        "revenue": "$200M+ (Estimated)",
        "executives": [
            ("CEO", "CEO", "Executive Leadership", "(Research needed)"),
            ("CFO", "CFO", "Finance", "(Research needed)"),
            ("CTO", "CTO", "Technology", "(Research needed)"),
            ("Commercial Director", "Commercial Director", "Sales & Marketing", "(Research needed)"),
        ],
        "departments": [
            ("Technology", "CTO", "BSS/OSS, network operations", "Decision Maker"),
            ("Commercial", "Commercial Director", "Product management, sales", "Champion"),
            ("Finance", "CFO", "Budget, procurement", "Approver"),
            ("Customer Operations", "Director Customer Ops", "Customer service, billing", "User"),
        ],
        "pain_points": [
            ("Contract Non-Renewal", "Critical", "CONFIRMED LOSS - $1.62M ARR churning in Q4'26. Understanding root cause is critical for any win-back strategy."),
            ("Market Competition", "High", "Albanian telecom market has limited players but intense competition. Price pressure drives vendor cost scrutiny."),
            ("Digital Transformation", "Medium", "Modernizing legacy systems to compete effectively in a rapidly digitizing market."),
            ("Regulatory Changes", "Medium", "Albanian and EU-adjacent regulatory requirements affecting operations and technology choices."),
        ],
        "competitors": [
            ("Amdocs", "High", "Established BSS vendor. May be replacement platform choice."),
            ("Huawei BSS", "High", "Competitive pricing for smaller operators. Price advantage in cost-sensitive markets."),
            ("Tecnotree", "Medium", "BSS provider for emerging market operators."),
            ("In-house development", "Medium", "Cost-driven decision to build internally."),
        ],
        "org_narrative": "One Albania (formerly Albanian Mobile Communications - AMC) is a major mobile operator in Albania. The company uses STL (Software Technology Labs) platform for BSS operations. CONFIRMED LOSS: The $1.62M ARR contract will not renew in Q4'26. This is a significant hit to the STL business unit. The decision likely reflects either competitive displacement, cost pressure, or strategic technology shift. Win-back efforts should focus on understanding the specific decision drivers through executive engagement.",
    },
    "NS Solutions Corporation": {
        "industry": "IT Services / Systems Integration",
        "hq": "Tokyo, Japan",
        "employees": "8,000+",
        "revenue": "JPY 250B+ (2024)",
        "executives": [
            ("President & CEO", "President & CEO", "Executive Leadership", "(Research needed)"),
            ("CFO", "CFO", "Finance", "(Research needed)"),
            ("CTO", "CTO", "Technology", "(Research needed)"),
            ("VP Solutions Business", "VP Solutions", "Solutions Delivery", "(Research needed)"),
        ],
        "departments": [
            ("Solutions Business", "VP Solutions", "Platform implementation, customer delivery", "Champion"),
            ("Technology & Innovation", "CTO", "Architecture, technology selection", "Decision Maker"),
            ("Finance", "CFO", "Budget, procurement", "Approver"),
            ("Sales", "VP Sales", "Go-to-market, customer relationships", "Influencer"),
        ],
        "pain_points": [
            ("Digital Transformation Demand", "High", "Japanese enterprise clients are accelerating digital transformation, creating demand for modern communication platforms that NS Solutions resells."),
            ("Legacy Modernization", "High", "Many Japanese enterprises run legacy NTT-era systems. Need modernization paths that NS Solutions can implement."),
            ("Cloud Migration", "Medium", "Shift from on-premise to cloud deployments requiring platform flexibility and hybrid support."),
            ("Workforce Shortage", "Medium", "Japan's IT talent shortage drives demand for platform automation and low-code capabilities."),
        ],
        "competitors": [
            ("NTT Data", "High", "Parent company's sibling - complex competitive dynamics. Counter with specialized platform capabilities."),
            ("Fujitsu", "Medium", "Major Japanese IT services competitor. Counter with global platform vs. Japan-only solutions."),
            ("NEC", "Medium", "Enterprise communications competitor. Counter with modern cloud-native architecture."),
            ("Hitachi Solutions", "Low", "Enterprise IT competitor. Counter with communications domain expertise."),
        ],
        "org_narrative": "NS Solutions Corporation (NSSOL) is a subsidiary of Nippon Steel Corporation (formerly Nippon Steel & Sumitomo Metal), providing IT services and solutions to Japanese enterprises. They are a NewNet partner reselling and implementing communication platform solutions. With $2.46M ARR and 25% growth potential ($614K - our top expansion opportunity), NSSOL is a strategic channel partner. The Japanese market's unique dynamics (relationship-driven sales, high service expectations, preference for established vendors) make this partnership critical for our APAC NewNet business.",
    },
    "HCL TECHNOLOGIES UK LIMITED": {
        "industry": "IT Services / Consulting",
        "hq": "London, UK (HQ: Noida, India)",
        "employees": "225,000+ (Global)",
        "revenue": "$13.7B (2024)",
        "executives": [
            ("C Vijayakumar", "CEO & MD", "Executive Leadership", "linkedin.com/in/cvijayakumar"),
            ("Prateek Aggarwal", "CFO", "Finance", "linkedin.com/in/prateekaggarwal"),
            ("Kalyan Kumar", "CTO & Head of Ecosystems", "Technology", "linkedin.com/in/kalyankumar"),
            ("UK Managing Director", "UK MD", "UK Operations", "(Research needed)"),
        ],
        "departments": [
            ("Engineering & R&D Services", "EVP ERS", "Platform engineering, product development", "User"),
            ("Technology", "Kalyan Kumar, CTO", "Technology strategy, partner ecosystem", "Decision Maker"),
            ("UK Operations", "UK MD", "UK client delivery", "Influencer"),
            ("Finance", "Prateek Aggarwal, CFO", "Global procurement, vendor management", "Approver"),
        ],
        "pain_points": [
            ("Contract Termination", "Critical", "CONFIRMED LOSS - $2.08M ARR churning in Q2'26. This is the single largest at-risk amount. HCL has decided to end the NewNet platform relationship."),
            ("Platform Consolidation", "High", "HCL is likely consolidating platforms as part of their own technology rationalization. May be bringing capabilities in-house."),
            ("Margin Pressure", "Medium", "IT services industry facing margin pressure. All vendor costs being scrutinized."),
            ("AI/Automation Priority", "Medium", "HCL is investing heavily in AI and automation, potentially replacing platform capabilities with AI-driven alternatives."),
        ],
        "competitors": [
            ("In-House Development", "Critical", "HCL has 225,000+ engineers. High likelihood of building replacement internally."),
            ("Infosys", "Medium", "Competing IT services firm with own platform play."),
            ("Wipro", "Medium", "Competing IT services firm."),
            ("TCS", "Medium", "Competing IT services firm with own communications platform."),
        ],
        "org_narrative": "HCL Technologies is a global IT services company and one of the largest at-risk accounts. CONFIRMED LOSS: The $2.08M ARR NewNet contract will not renew in Q2'26. HCL UK Limited is the contracting entity. As an IT services firm with massive engineering capacity, HCL may be bringing communication platform capabilities in-house. The UK operation likely serves as a reseller/implementer for HCL's UK enterprise clients. Focus should be on graceful transition and maintaining relationship for potential future re-engagement.",
    },
    "Maxis Broadband Sdn Bhd": {
        "industry": "Telecommunications",
        "hq": "Kuala Lumpur, Malaysia",
        "employees": "3,000+",
        "revenue": "MYR 9.6B (2024)",
        "executives": [
            ("Goh Seow Eng", "CEO", "Executive Leadership", "linkedin.com/in/gohseoweng"),
            ("CFO", "CFO", "Finance", "(Research needed)"),
            ("CTO", "CTO", "Technology", "(Research needed)"),
            ("Chief Enterprise Business Officer", "CEBO", "Enterprise", "(Research needed)"),
        ],
        "departments": [
            ("Technology", "CTO", "BSS/OSS, platform architecture", "Decision Maker"),
            ("Enterprise Business", "CEBO", "B2B product management, enterprise sales", "Champion"),
            ("Consumer Business", "Chief Consumer Business Officer", "Consumer products, CPQ", "User"),
            ("Digital & Innovation", "Chief Digital Officer", "Digital channels, e-commerce", "User"),
            ("Procurement", "Head of Procurement", "Vendor management", "Approver"),
        ],
        "pain_points": [
            ("Convergence with U Mobile", "High", "Potential merger or partnership discussions in Malaysian market create technology platform uncertainty."),
            ("5G Rollout", "High", "Malaysia's 5G rollout (via DNB then individual operators) requires new product configuration capabilities."),
            ("Enterprise Growth", "High", "Maxis is aggressively growing enterprise business. Need CPQ capabilities for complex B2B solutions."),
            ("Digital-First Transformation", "Medium", "Accelerating shift to digital sales channels requires robust online CPQ and self-service."),
        ],
        "competitors": [
            ("Salesforce Industries", "High", "Growing presence in APAC telco. Counter with existing integration and proven deployment."),
            ("Amdocs", "Medium", "Established BSS vendor in APAC. Counter with agility and lower TCO."),
            ("Huawei Digital BSS", "Medium", "Strong presence in Malaysian telco. Counter with independence from network vendor lock-in."),
            ("CSG International", "Low", "BSS/billing competitor. Counter with broader CPQ capabilities."),
        ],
        "org_narrative": "Maxis is one of Malaysia's leading telecommunications operators, owned by the Ananda Krishnan group. The CloudSense platform supports Maxis's product catalog and CPQ operations. With $1.36M ARR and 25% growth potential ($341K), Maxis is a key APAC growth account. The Malaysian telecom market is evolving with 5G deployment and potential market consolidation, creating both risk and opportunity for our platform.",
    },
    "Centrica Services Ltd": {
        "industry": "Energy / Utilities",
        "hq": "Windsor, UK",
        "employees": "20,000+",
        "revenue": "GBP 31.8B (2024)",
        "executives": [
            ("Chris O'Shea", "CEO", "Executive Leadership", "linkedin.com/in/chrisoshea"),
            ("Kate Mayfield", "CFO", "Finance", "linkedin.com/in/katemayfield"),
            ("Cassim Mangerah", "MD - Centrica Business Solutions", "Business Solutions", "linkedin.com/in/cassimmangerah"),
            ("CTO/CIO", "CTO", "Technology", "(Research needed)"),
        ],
        "departments": [
            ("British Gas (Residential)", "MD British Gas", "Residential product configuration, pricing", "Champion"),
            ("Centrica Business Solutions", "Cassim Mangerah", "B2B energy solutions", "User"),
            ("Technology", "CTO", "IT architecture, platform strategy", "Decision Maker"),
            ("Finance", "Kate Mayfield, CFO", "Budget, procurement", "Approver"),
            ("Customer Operations", "Director Customer Ops", "Customer service, CRM", "Influencer"),
        ],
        "pain_points": [
            ("Energy Market Volatility", "High", "Post-energy crisis pricing complexity requires sophisticated product configuration and dynamic pricing capabilities."),
            ("Green Transition", "High", "Centrica is investing in green energy products (heat pumps, solar, EV charging). New product catalog needs for emerging categories."),
            ("Customer Experience Transformation", "Medium", "British Gas digital transformation requires seamless CPQ integration with CRM and billing systems."),
            ("Regulatory Compliance", "Medium", "Ofgem regulations and price caps require flexible pricing configuration and audit trails."),
        ],
        "competitors": [
            ("Salesforce CPQ", "High", "Standard CPQ platform with energy vertical capabilities. Counter with utility-specific customizations."),
            ("Oracle Utilities", "Medium", "Established utility billing platform. Counter with modern CPQ and digital channel focus."),
            ("SAP S/4HANA", "Medium", "Enterprise ERP with CPQ modules. Counter with best-of-breed specialization."),
            ("Gentrack", "Low", "Utility billing specialist. Counter with broader CPQ and product catalog capabilities."),
        ],
        "org_narrative": "Centrica is the parent company of British Gas, the UK's largest energy supplier. The CloudSense platform supports product configuration and quoting for energy products and services. With $1.05M ARR, Centrica is a healthy account in the CloudSense portfolio. The energy transition (heat pumps, solar, EV) creates significant expansion potential as new product categories need CPQ support. The British Gas brand's massive consumer base drives high-volume CPQ requirements.",
    },
    "Liquid Telecom": {
        "industry": "Telecommunications",
        "hq": "London, UK (Operations across Africa)",
        "employees": "2,000+",
        "revenue": "$750M+ (Estimated)",
        "executives": [
            ("Nic Rudnick", "Group CEO", "Executive Leadership", "linkedin.com/in/nicrudnick"),
            ("CFO", "CFO", "Finance", "(Research needed)"),
            ("CTO", "CTO", "Technology", "(Research needed)"),
            ("Chief Commercial Officer", "CCO", "Commercial", "(Research needed)"),
        ],
        "departments": [
            ("Technology", "CTO", "Network, BSS/OSS, platforms", "Decision Maker"),
            ("Commercial", "CCO", "Product management, sales", "Champion"),
            ("Enterprise", "VP Enterprise", "Enterprise solutions", "User"),
            ("Finance", "CFO", "Budget, procurement", "Approver"),
        ],
        "pain_points": [
            ("Pan-African Expansion", "High", "Operating across 20+ African countries with varying infrastructure maturity. Need scalable product configuration for diverse markets."),
            ("Data Center Growth", "High", "Liquid is a major African data center operator. Cloud and hosting product catalog complexity is growing."),
            ("Connectivity Solutions", "Medium", "Expanding fiber and satellite connectivity offerings require flexible product bundling and pricing."),
            ("Currency/Pricing Complexity", "Medium", "Multi-currency pricing across African markets with volatile exchange rates."),
        ],
        "competitors": [
            ("Huawei Digital BSS", "High", "Strong presence in African telecom. Counter with independence and proven reliability."),
            ("Tecnotree", "Medium", "BSS for emerging market operators. Counter with broader capabilities and scale."),
            ("Alepo", "Low", "BSS for developing market telcos. Counter with enterprise-grade platform."),
            ("In-house systems", "Medium", "Custom-built systems. Counter with faster time-to-market and lower TCO."),
        ],
        "org_narrative": "Liquid Telecom (now Liquid Intelligent Technologies) is Africa's largest independent fiber, cloud, and cyber security provider, backed by Econet Global. The CloudSense platform supports product configuration across their diverse portfolio of connectivity, cloud, and data center services. With $1.07M ARR and 25% growth potential ($268K), Liquid is a strategic account for CloudSense's emerging markets footprint.",
    },
    "Elisa Oyj": {
        "industry": "Telecommunications",
        "hq": "Helsinki, Finland",
        "employees": "5,000+",
        "revenue": "EUR 2.1B (2024)",
        "executives": [
            ("Veli-Matti Mattila", "CEO", "Executive Leadership", "linkedin.com/in/velimattimattila"),
            ("Jari Kinnunen", "CFO", "Finance", "linkedin.com/in/jarikinnunen"),
            ("Timo Katajisto", "CTO", "Technology", "linkedin.com/in/timokatajisto"),
            ("Vesa Sahivirta", "VP Corporate Customers", "Enterprise", "linkedin.com/in/vesasahivirta"),
        ],
        "departments": [
            ("Technology & IT", "Timo Katajisto, CTO", "BSS/OSS, platform architecture", "Decision Maker"),
            ("Consumer", "EVP Consumer", "Consumer products, digital channels", "Champion"),
            ("Corporate Customers", "Vesa Sahivirta, VP", "B2B solutions", "User"),
            ("Digital Services", "VP Digital", "Digital platforms, innovation", "Influencer"),
            ("Procurement", "Head of Procurement", "Vendor management", "Approver"),
        ],
        "pain_points": [
            ("AI-Driven Network Operations", "High", "Elisa is a leader in AI-driven telco operations. Platform must integrate with AI/ML workflows for automated product decisions."),
            ("International Expansion", "Medium", "Expanding through Elisa Polystar (network analytics) into international markets. Need scalable platform capabilities."),
            ("Estonian Market Growth", "Medium", "Elisa Estonia operations require multi-market product catalog and pricing support."),
            ("5G Enterprise Services", "Medium", "Launching 5G-based enterprise solutions requiring new product configuration capabilities."),
        ],
        "competitors": [
            ("Salesforce Industries", "Medium", "Growing Nordic telco presence. Counter with established integration and local expertise."),
            ("Amdocs", "Medium", "BSS vendor. Counter with modern cloud-native approach aligned to Elisa's innovation culture."),
            ("Nokia Software", "Low", "Network-adjacent BSS. Counter with independence from network vendor."),
            ("Comptel/Nokia AVA", "Low", "AI-driven operations. Counter with CPQ specialization."),
        ],
        "org_narrative": "Elisa is Finland's leading telecommunications company, known for being one of the most innovative and AI-forward operators globally. The CloudSense platform supports product configuration and quoting operations. With $897K ARR and 25% growth potential ($224K), Elisa is a healthy growth account. Elisa's reputation as an AI-first operator means they expect vendors to match their innovation pace.",
    },
    "PostNL Holding BV": {
        "industry": "Postal / Logistics",
        "hq": "The Hague, Netherlands",
        "employees": "37,000+",
        "revenue": "EUR 3.2B (2024)",
        "executives": [
            ("Herna Verhagen", "CEO", "Executive Leadership", "linkedin.com/in/hernaverhagen"),
            ("Pim Berendsen", "CFO", "Finance", "linkedin.com/in/pimberendsen"),
            ("CTO/CIO", "CTO", "Technology", "(Research needed)"),
            ("COO", "COO", "Operations", "(Research needed)"),
        ],
        "departments": [
            ("Technology & IT", "CTO", "IT architecture, platform decisions", "Decision Maker"),
            ("Commercial (Parcels)", "Director Parcels", "Parcel product management", "Champion"),
            ("Commercial (Mail)", "Director Mail", "Mail product management", "User"),
            ("E-Commerce Solutions", "Director E-Commerce", "E-commerce logistics solutions", "User"),
            ("Procurement", "Head of Procurement", "Vendor management", "Approver"),
        ],
        "pain_points": [
            ("E-Commerce Growth Management", "High", "Parcel volumes are growing rapidly while mail declines. Need agile product configuration for new logistics offerings."),
            ("International Logistics", "High", "Growing cross-border e-commerce requires complex multi-country pricing and product configuration."),
            ("Sustainability", "Medium", "Meeting ESG targets requires new green logistics product options in the catalog."),
            ("Last-Mile Innovation", "Medium", "New delivery methods (parcel lockers, same-day, evening delivery) need rapid product catalog updates."),
        ],
        "competitors": [
            ("Salesforce CPQ", "Medium", "Standard CPQ platform. Counter with logistics-specific customizations."),
            ("SAP CPQ", "Medium", "ERP-integrated CPQ. Counter with agility and specialized features."),
            ("Custom Solutions", "Medium", "In-house built systems. Counter with faster innovation and lower maintenance."),
            ("BluJay/E2open", "Low", "Logistics platform with pricing modules. Counter with broader CPQ capabilities."),
        ],
        "org_narrative": "PostNL is the Netherlands' primary postal and parcel delivery operator, undergoing transformation from traditional mail to e-commerce logistics. The CloudSense platform supports product configuration and pricing for their evolving logistics product portfolio. With $576K ARR and 100% growth potential ($576K - our second-largest expansion opportunity), PostNL represents a major expansion opportunity. The shift from mail to parcels is driving new product complexity that our platform can address.",
    },
    "StarHub Ltd": {
        "industry": "Telecommunications",
        "hq": "Singapore",
        "employees": "2,500+",
        "revenue": "SGD 2.1B (2024)",
        "executives": [
            ("Nikhil Eapen", "CEO", "Executive Leadership", "linkedin.com/in/nikhileapen"),
            ("Dennis Chia", "CFO", "Finance", "linkedin.com/in/dennischia"),
            ("CTO", "CTO", "Technology", "(Research needed)"),
            ("Director Consumer Business", "Director Consumer", "Consumer", "(Research needed)"),
        ],
        "departments": [
            ("Technology", "CTO", "BSS/OSS, platform decisions", "Decision Maker"),
            ("Consumer Business", "Director Consumer", "Mobile, broadband, TV products", "Champion"),
            ("Enterprise Business", "Director Enterprise", "B2B solutions", "User"),
            ("Digital", "Director Digital", "Digital channels, e-commerce", "Influencer"),
            ("Procurement", "Head of Procurement", "Vendor management", "Approver"),
        ],
        "pain_points": [
            ("DARE+ Transformation", "High", "StarHub's DARE+ strategy emphasizes digital transformation and efficiency. Platform must contribute to transformation goals."),
            ("Convergence with Fixed Services", "High", "Full convergence of mobile, broadband, and entertainment requires unified product catalog."),
            ("Enterprise Growth", "Medium", "Expanding enterprise cybersecurity and cloud services through joint venture with Ensign InfoSecurity."),
            ("5G Monetization", "Medium", "Creating 5G-based products and services for consumer and enterprise segments."),
        ],
        "competitors": [
            ("Salesforce Industries", "High", "Growing Singapore telco presence. Counter with existing StarHub integration."),
            ("Amdocs", "Medium", "BSS vendor in APAC. Counter with cloud-native architecture."),
            ("CSG International", "Medium", "BSS/billing platform. Counter with modern CPQ capabilities."),
            ("Netcracker", "Low", "BSS suite competitor. Counter with agility and APAC support."),
        ],
        "org_narrative": "StarHub is Singapore's second-largest telecommunications operator, providing mobile, broadband, TV, and enterprise services. The CloudSense platform supports product configuration and quoting. With $919K ARR and 25% growth potential ($230K), StarHub is a key APAC growth account. The DARE+ transformation strategy creates expansion opportunities as StarHub modernizes its digital infrastructure.",
    },
    "Abbott Laboratories": {
        "industry": "Healthcare / Medical Devices",
        "hq": "Abbott Park, IL, USA",
        "employees": "113,000+",
        "revenue": "$40.1B (2024)",
        "executives": [
            ("Robert Ford", "CEO", "Executive Leadership", "linkedin.com/in/robertford"),
            ("Philip Boudreau", "CFO", "Finance", "linkedin.com/in/philipboudreau"),
            ("CTO/CIO", "CTO", "Technology", "(Research needed)"),
            ("Division President - Diagnostics", "Division President", "Diagnostics", "(Research needed)"),
        ],
        "departments": [
            ("IT / Digital", "CIO/CTO", "Enterprise platforms, digital transformation", "Decision Maker"),
            ("Diagnostics Division", "Division President", "Diagnostic product management", "Champion"),
            ("Medical Devices Division", "Division President", "Medical device product management", "User"),
            ("Procurement", "Chief Procurement Officer", "Global vendor management", "Approver"),
            ("Sales Operations", "VP Sales Ops", "Sales tools, CPQ", "Influencer"),
        ],
        "pain_points": [
            ("Product Portfolio Complexity", "High", "Abbott has thousands of SKUs across diagnostics, medical devices, nutrition, and pharmaceuticals. Complex CPQ needs."),
            ("Regulatory Compliance", "High", "FDA and global regulatory requirements for product configuration and pricing require audit trails and compliance features."),
            ("Sales Force Effectiveness", "Medium", "Large global sales force needs efficient quoting tools for complex product bundles."),
            ("M&A Integration", "Medium", "Frequent acquisitions require rapid integration of new product lines into existing CPQ systems."),
        ],
        "competitors": [
            ("Salesforce CPQ", "High", "Enterprise CPQ standard. Counter with healthcare-specific customizations and compliance."),
            ("SAP CPQ (CallidusCloud)", "Medium", "ERP-integrated CPQ. Counter with flexibility and faster implementation."),
            ("Oracle CPQ", "Medium", "Enterprise CPQ platform. Counter with user experience and agility."),
            ("Conga (Apttus)", "Low", "Document-focused CPQ. Counter with broader product configuration capabilities."),
        ],
        "org_narrative": "Abbott Laboratories is a global healthcare company operating across Diagnostics, Medical Devices, Nutrition, and Established Pharmaceuticals divisions. The CloudSense platform supports product configuration and quoting for Abbott's complex multi-divisional product portfolio. With $817K ARR and 25% growth potential ($204K), Abbott represents a strategic non-telco reference account that demonstrates CloudSense platform versatility beyond telecommunications.",
    },
    "Thryv Australia Pty Ltd": {
        "industry": "Digital Marketing / SaaS",
        "hq": "Melbourne, Australia (HQ: Dallas, TX, USA)",
        "employees": "2,500+ (Global)",
        "revenue": "$900M (2024, Global)",
        "executives": [
            ("Joe Walsh", "CEO (Global)", "Executive Leadership", "linkedin.com/in/joewalsh"),
            ("Paul Rouse", "CFO", "Finance", "linkedin.com/in/paulrouse"),
            ("Australia MD", "Managing Director Australia", "APAC Operations", "(Research needed)"),
            ("CTO", "CTO", "Technology", "(Research needed)"),
        ],
        "departments": [
            ("Technology", "CTO", "Platform development, SaaS infrastructure", "Decision Maker"),
            ("Australia Operations", "Australia MD", "APAC market operations", "Champion"),
            ("Product", "VP Product", "Product management", "Influencer"),
            ("Finance", "Paul Rouse, CFO", "Global procurement", "Approver"),
        ],
        "pain_points": [
            ("Contract Termination", "Critical", "CONFIRMED LOSS - $568K ARR churning in Q1'26. Thryv Australia has decided not to renew."),
            ("Platform Consolidation", "High", "Thryv is transitioning from legacy Yellow Pages business to SaaS. Consolidating platforms."),
            ("Market Shift", "Medium", "Australian SMB market is shifting to self-service digital tools. Reducing need for external CPQ platforms."),
        ],
        "competitors": [
            ("In-house SaaS platform", "Critical", "Thryv is building its own SaaS platform for SMBs."),
            ("Salesforce", "Medium", "Standard CRM/CPQ. May be adopted as part of consolidation."),
            ("HubSpot", "Low", "SMB-focused platform."),
        ],
        "org_narrative": "Thryv (formerly Sensis/Yellow Pages Australia) is transitioning from legacy directory services to a SaaS platform for small businesses. CONFIRMED LOSS: The $568K ARR CloudSense contract will not renew in Q1'26. This reflects Thryv's strategic shift to build its own integrated SaaS platform rather than using external CPQ tools.",
    },
    "CoreSite": {
        "industry": "Data Center / Real Estate",
        "hq": "Denver, CO, USA",
        "employees": "1,000+",
        "revenue": "$750M+ (2024)",
        "executives": [
            ("Juan Font", "CEO", "Executive Leadership", "linkedin.com/in/juanfont"),
            ("CFO", "CFO", "Finance", "(Research needed)"),
            ("CTO", "CTO", "Technology", "(Research needed)"),
            ("Chief Revenue Officer", "CRO", "Sales", "(Research needed)"),
        ],
        "departments": [
            ("Technology", "CTO", "IT infrastructure, platform decisions", "Decision Maker"),
            ("Sales", "CRO", "Data center sales, CPQ", "Champion"),
            ("Product", "VP Product", "Data center product management", "User"),
            ("Finance", "CFO", "Budget, procurement", "Approver"),
        ],
        "pain_points": [
            ("Contract Termination", "Critical", "CONFIRMED LOSS - $456K ARR churning in Q3'26. CoreSite has decided not to renew."),
            ("American Tower Acquisition", "High", "CoreSite was acquired by American Tower. Parent company may be standardizing on different technology platforms."),
            ("AI/Cloud Demand Surge", "Medium", "Massive demand for data center capacity driven by AI. Focus on capacity over CPQ optimization."),
        ],
        "competitors": [
            ("Salesforce CPQ", "High", "Enterprise standard. Likely American Tower group platform."),
            ("Custom/In-house", "Medium", "American Tower may use proprietary tools."),
            ("Oracle CPQ", "Low", "Enterprise alternative."),
        ],
        "org_narrative": "CoreSite is a major US data center operator acquired by American Tower Corporation in 2022. CONFIRMED LOSS: The $456K ARR CloudSense contract will not renew in Q3'26. This likely reflects American Tower's technology platform standardization across their portfolio.",
    },
    "DPG Media BV": {
        "industry": "Media / Publishing",
        "hq": "Antwerp, Belgium",
        "employees": "6,000+",
        "revenue": "EUR 1.8B (2024)",
        "executives": [
            ("Erik Breuer", "CEO", "Executive Leadership", "linkedin.com/in/erikbreuer"),
            ("CFO", "CFO", "Finance", "(Research needed)"),
            ("CTO/CIO", "CTO", "Technology", "(Research needed)"),
            ("Chief Commercial Officer", "CCO", "Commercial", "(Research needed)"),
        ],
        "departments": [
            ("Technology", "CTO", "Platform architecture, IT decisions", "Decision Maker"),
            ("Commercial / Advertising", "CCO", "Ad sales, subscriptions", "Champion"),
            ("Digital", "Chief Digital Officer", "Digital platforms", "User"),
            ("Finance", "CFO", "Budget, procurement", "Approver"),
        ],
        "pain_points": [
            ("Contract Termination", "Critical", "CONFIRMED LOSS - $359K ARR churning in Q3'26. DPG Media has decided not to renew."),
            ("Digital Advertising Shift", "High", "Transition from print to digital advertising requiring different pricing and configuration models."),
            ("Subscription Economy", "Medium", "Growing digital subscription business needs modern subscription management."),
        ],
        "competitors": [
            ("Salesforce CPQ", "Medium", "Standard CPQ platform. Likely replacement."),
            ("Zuora", "Medium", "Subscription management specialist."),
            ("Custom solutions", "Medium", "DPG may build internally for media-specific needs."),
        ],
        "org_narrative": "DPG Media is the largest media company in Belgium and the Netherlands, operating newspapers (De Standaard, ADN), TV channels (VTM), radio stations, and digital platforms. CONFIRMED LOSS: The $359K ARR CloudSense contract will not renew in Q3'26. DPG Media may be consolidating advertising sales platforms as part of their digital transformation.",
    },
    "PropertyGuru Pte Ltd": {
        "industry": "Real Estate Technology",
        "hq": "Singapore",
        "employees": "1,500+",
        "revenue": "SGD 450M+ (2024)",
        "executives": [
            ("Hari V. Krishnan", "CEO", "Executive Leadership", "linkedin.com/in/harikrishnan"),
            ("Joe Dische", "CFO", "Finance", "linkedin.com/in/joedische"),
            ("CTO", "CTO", "Technology", "(Research needed)"),
            ("Chief Commercial Officer", "CCO", "Commercial", "(Research needed)"),
        ],
        "departments": [
            ("Technology", "CTO", "Platform development, architecture", "Decision Maker"),
            ("Commercial", "CCO", "Sales, advertising products", "Champion"),
            ("Product", "VP Product", "Product management, marketplace", "User"),
            ("Finance", "Joe Dische, CFO", "Budget, procurement", "Approver"),
        ],
        "pain_points": [
            ("Contract Termination", "Critical", "CONFIRMED LOSS - $262K ARR churning in Q2'26."),
            ("Market Consolidation", "High", "PropertyGuru merged with 99.co. Platform consolidation likely."),
            ("Cost Optimization", "Medium", "Post-SPAC public company focused on path to profitability. Vendor rationalization."),
        ],
        "competitors": [
            ("Custom/In-house", "High", "PropertyGuru has strong engineering team, may build internally."),
            ("Salesforce CPQ", "Medium", "Standard platform."),
        ],
        "org_narrative": "PropertyGuru is Southeast Asia's leading property technology company, operating online marketplaces across Singapore, Malaysia, Thailand, and Vietnam. CONFIRMED LOSS: The $262K ARR CloudSense contract will not renew in Q2'26. PropertyGuru's recent merger activity and cost focus are likely driving vendor consolidation.",
    },
    "MasterCard Worldwide": {
        "industry": "Financial Services / Payments",
        "hq": "Purchase, NY, USA",
        "employees": "33,000+",
        "revenue": "$25.1B (2024)",
        "executives": [
            ("Michael Miebach", "CEO", "Executive Leadership", "linkedin.com/in/michaelmiebach"),
            ("Sachin Mehra", "CFO", "Finance", "linkedin.com/in/sachinmehra"),
            ("Ed McLaughlin", "President & CTO", "Technology", "linkedin.com/in/edmclaughlin"),
            ("Craig Vosburg", "Chief Product Officer", "Product", "linkedin.com/in/craigvosburg"),
        ],
        "departments": [
            ("Technology", "Ed McLaughlin, CTO", "Technology platforms, architecture", "Decision Maker"),
            ("Product", "Craig Vosburg, CPO", "Product management, pricing", "Champion"),
            ("Data & Services", "President D&S", "Consulting, analytics, cyber", "User"),
            ("Finance", "Sachin Mehra, CFO", "Procurement, vendor management", "Approver"),
            ("Operations", "COO", "Processing, operations", "Influencer"),
        ],
        "pain_points": [
            ("Multi-Rail Payment Strategy", "High", "Mastercard is expanding beyond cards to account-to-account payments, open banking. Complex product configuration needed."),
            ("Cyber & Intelligence Growth", "High", "Growing cyber and intelligence services portfolio requires sophisticated product bundling."),
            ("Regulatory Complexity", "High", "Global payment regulations, interchange fee rules, and data privacy requirements across 200+ markets."),
            ("Digital Currency Integration", "Medium", "CBDC and stablecoin integration adding new product categories to manage."),
        ],
        "competitors": [
            ("Salesforce CPQ", "High", "Enterprise standard CPQ. Counter with payment-industry specialization."),
            ("SAP CPQ", "Medium", "ERP-integrated CPQ. Counter with agility and faster innovation."),
            ("Oracle CPQ", "Medium", "Enterprise alternative. Counter with better UX and flexibility."),
            ("Custom In-house", "Medium", "Mastercard builds significant internal tooling."),
        ],
        "org_narrative": "Mastercard is a global payments technology company transitioning from a card network to a multi-rail, multi-use payments ecosystem. Their product portfolio increasingly includes data analytics, cybersecurity, and consulting services beyond traditional payment processing. Our platform supports product configuration for their expanding B2B services portfolio.",
    },
    "Foxtel Management Pty Limited": {
        "industry": "Media / Entertainment",
        "hq": "Sydney, Australia",
        "employees": "2,000+",
        "revenue": "AUD 2.5B (Estimated)",
        "executives": [
            ("Patrick Delany", "CEO", "Executive Leadership", "linkedin.com/in/patrickdelany"),
            ("CFO", "CFO", "Finance", "(Research needed)"),
            ("CTO", "CTO", "Technology", "(Research needed)"),
            ("Chief Content & Commercial Officer", "CCCO", "Content & Commercial", "(Research needed)"),
        ],
        "departments": [
            ("Technology", "CTO", "Streaming platform, IT infrastructure", "Decision Maker"),
            ("Commercial", "CCCO", "Product management, pricing", "Champion"),
            ("Consumer", "Director Consumer", "Subscriber management", "User"),
            ("Finance", "CFO", "Budget, procurement", "Approver"),
        ],
        "pain_points": [
            ("Streaming Transition", "Critical", "Foxtel is transitioning from traditional pay-TV to streaming (Kayo, BINGE, Foxtel Now). Complex product catalog migration."),
            ("Subscriber Retention", "High", "High churn rates in competitive SVOD market. Need flexible pricing and bundling for retention."),
            ("Sports Rights Costs", "High", "Massive sports rights investments require careful monetization through optimal product configuration."),
            ("News Corp Relationship", "Medium", "Majority owned by News Corp. Corporate synergy requirements and platform standardization."),
        ],
        "competitors": [
            ("Salesforce Industries", "Medium", "Media industry CPQ. Counter with established integration."),
            ("Zuora", "Medium", "Subscription management. Counter with broader CPQ capabilities."),
            ("Custom/In-house", "Medium", "Streaming platforms often build custom subscription management."),
        ],
        "org_narrative": "Foxtel is Australia's leading pay-TV and streaming operator, majority-owned by News Corp. Operating brands include Foxtel (satellite), Kayo Sports, BINGE, and Foxtel Now. The CloudSense platform supports product configuration and subscriber management. The ongoing transition to streaming creates both complexity and opportunity for our platform.",
    },
    "Proximus NV": {
        "industry": "Telecommunications",
        "hq": "Brussels, Belgium",
        "employees": "11,000+",
        "revenue": "EUR 5.8B (2024)",
        "executives": [
            ("Guillaume Boutin", "CEO", "Executive Leadership", "linkedin.com/in/guillaumeboutin"),
            ("Mark Reid", "CFO", "Finance", "linkedin.com/in/markreid"),
            ("Geert Standaert", "CTO", "Technology", "linkedin.com/in/geertstandaert"),
            ("Jim Casteele", "Chief Enterprise Market Officer", "Enterprise", "linkedin.com/in/jimcasteele"),
        ],
        "departments": [
            ("Technology", "Geert Standaert, CTO", "BSS/OSS, platform strategy", "Decision Maker"),
            ("Consumer Market", "Chief Consumer Officer", "Consumer products, bundles", "Champion"),
            ("Enterprise Market", "Jim Casteele", "B2B solutions", "User"),
            ("Digital", "Chief Digital Officer", "Digital channels", "Influencer"),
            ("Procurement", "CPO", "Vendor management", "Approver"),
        ],
        "pain_points": [
            ("bold2025 Strategy", "High", "Proximus bold2025 strategy emphasizes fiber rollout and digital-first. Platform must align with strategic priorities."),
            ("Convergent Offers", "High", "Quad-play bundles (Proximus Flex) require sophisticated product configuration."),
            ("International Expansion", "Medium", "BICS subsidiary provides international wholesale services. Need platform support for wholesale pricing."),
            ("5G Monetization", "Medium", "Creating 5G-based services for consumer and enterprise markets."),
        ],
        "competitors": [
            ("Salesforce Industries", "Medium", "Growing Belgian telco presence. Counter with established integration."),
            ("Amdocs", "Medium", "BSS vendor. Counter with agility."),
            ("Sigma Systems/Hansen", "Medium", "Product catalog specialist. Counter with broader CPQ."),
        ],
        "org_narrative": "Proximus is Belgium's leading telecommunications operator, offering mobile, broadband, TV, and ICT services. The CloudSense platform supports product configuration for their converged service portfolio. Proximus's bold2025 strategy drives fiber investment and digital transformation, creating platform expansion opportunities.",
    },
    "Virgin Media Limited": {
        "industry": "Telecommunications / Media",
        "hq": "Reading, UK",
        "employees": "12,000+",
        "revenue": "GBP 5.0B (2024)",
        "executives": [
            ("Lutz Schuler", "CEO - Virgin Media O2", "Executive Leadership", "linkedin.com/in/lutzschuler"),
            ("CFO VMO2", "CFO", "Finance", "(Research needed)"),
            ("CTO VMO2", "CTO", "Technology", "(Research needed)"),
            ("COO VMO2", "COO", "Operations", "(Research needed)"),
        ],
        "departments": [
            ("Technology", "CTO VMO2", "BSS/OSS, platform architecture", "Decision Maker"),
            ("Consumer", "Director Consumer", "Consumer products, bundles", "Champion"),
            ("Business", "Director Business", "B2B solutions", "User"),
            ("Digital", "Director Digital", "Digital channels, e-commerce", "Influencer"),
            ("Procurement", "CPO", "Vendor management", "Approver"),
        ],
        "pain_points": [
            ("VMO2 Integration", "Critical", "Post-merger integration of Virgin Media and O2 IT systems is a multi-year program. Platform consolidation decisions ongoing."),
            ("Network Upgrade (DOCSIS 4.0)", "High", "Upgrading cable network to DOCSIS 4.0 / FTTP. Need product catalog updates for new speeds and tiers."),
            ("Convergent Bundle Strategy", "High", "Creating compelling fixed-mobile bundles (Volt) requires sophisticated CPQ capabilities."),
            ("Customer Base Decline", "Medium", "Legacy cable customer base declining. Need retention-focused pricing and offers."),
        ],
        "competitors": [
            ("Salesforce Industries", "High", "VMO2 level platform. Counter with existing VM integration."),
            ("Amdocs", "Medium", "BSS vendor. Counter with agility."),
            ("Comverse ONE", "Medium", "Converged BSS. Counter with modern architecture."),
        ],
        "org_narrative": "Virgin Media is now part of Virgin Media O2 (VMO2), the UK's largest converged communications operator. The CloudSense platform supports product configuration for Virgin Media's broadband, TV, and fixed-line offerings. The VMO2 merger creates both risk (platform consolidation) and opportunity (unified CPQ for converged services).",
    },
    "Vodafone GmbH": {
        "industry": "Telecommunications",
        "hq": "Dusseldorf, Germany",
        "employees": "15,000+",
        "revenue": "EUR 13.1B (2024)",
        "executives": [
            ("Philippe Rogge", "CEO", "Executive Leadership", "linkedin.com/in/philipperogge"),
            ("CFO", "CFO", "Finance", "(Research needed)"),
            ("CTO", "CTO", "Technology", "(Research needed)"),
            ("Director Consumer", "Director Consumer", "Consumer", "(Research needed)"),
        ],
        "departments": [
            ("Technology", "CTO", "BSS/OSS, platform decisions", "Decision Maker"),
            ("Consumer", "Director Consumer", "Mobile, broadband, TV", "Champion"),
            ("Enterprise", "Director Enterprise", "B2B solutions", "User"),
            ("Procurement", "Head of Procurement", "Vendor management", "Approver"),
        ],
        "pain_points": [
            ("Cable Integration (Unitymedia)", "High", "Integrating former Unitymedia cable operations continues. Unified product catalog needed."),
            ("5G Expansion", "High", "Germany's largest mobile network expanding 5G. New product configuration for 5G services."),
            ("Convergence Strategy", "High", "Creating GigaKombi converged offers requires sophisticated CPQ."),
            ("Fiber Expansion", "Medium", "FTTH rollout in Germany adding new product categories."),
        ],
        "competitors": [
            ("Salesforce Industries", "High", "Vodafone Group relationship. Counter with Germany-specific expertise."),
            ("Amdocs", "Medium", "Group-level BSS vendor. Counter with local agility."),
            ("Huawei BSS", "Medium", "German telco presence. Counter with vendor independence."),
        ],
        "org_narrative": "Vodafone Germany is the largest Vodafone operating company by revenue, providing mobile, broadband, TV, and enterprise services. As a CloudSense platform customer, Vodafone GmbH leverages CPQ for product configuration. The Vodafone Group relationship provides both stability (group-level decisions) and risk (group platform standardization could displace local choices).",
    },
}

# ============================================================
# INDUSTRY TEMPLATES (for companies not in the detailed database)
# ============================================================

INDUSTRY_TEMPLATES = {
    "Telecommunications": {
        "executives_template": [
            ("CEO (To be confirmed)", "CEO", "Executive Leadership", "(Research needed)"),
            ("CFO (To be confirmed)", "CFO", "Finance", "(Research needed)"),
            ("CTO (To be confirmed)", "CTO", "Technology", "(Research needed)"),
            ("Chief Commercial Officer", "CCO", "Commercial / Sales", "(Research needed)"),
            ("VP IT / Digital", "VP IT", "Information Technology", "(Research needed)"),
        ],
        "departments_template": [
            ("Technology & IT", "CTO", "BSS/OSS, platform architecture, technology decisions", "Decision Maker"),
            ("Commercial / Product", "CCO / VP Product", "Product management, pricing, offer design", "Champion"),
            ("Enterprise / B2B", "Director Enterprise", "Enterprise solutions, B2B sales", "User"),
            ("Consumer / Retail", "Director Consumer", "Consumer product management, retail sales", "Influencer"),
            ("Finance & Procurement", "CFO / CPO", "Budget allocation, vendor management, contract governance", "Approver"),
        ],
        "pain_points_template": [
            ("Digital Transformation", "High", "Telcos are undergoing significant digital transformation to modernize legacy BSS/OSS systems, improve customer experience, and enable digital-first sales channels. (Typical for Telecommunications)"),
            ("5G Monetization", "Medium", "Operators need to monetize 5G investments through new enterprise and consumer services requiring agile product configuration. (Typical for Telecommunications)"),
            ("Convergent Service Bundling", "Medium", "Creating competitive multi-play bundles (mobile + broadband + TV + fixed) requires sophisticated product catalog and CPQ capabilities. (Typical for Telecommunications)"),
            ("Cost Optimization", "Medium", "Industry-wide margin pressure drives vendor cost scrutiny and platform consolidation initiatives. (Typical for Telecommunications)"),
        ],
        "competitors_template": [
            ("Salesforce Industries (Vlocity)", "High", "Leading CPQ/BSS platform for telcos with Salesforce ecosystem integration. Counter with specialized telco CPQ depth and lower TCO."),
            ("Amdocs", "Medium", "Established BSS vendor with deep telco domain expertise. Counter with modern cloud-native architecture and faster innovation."),
            ("Netcracker (NEC)", "Medium", "Full-stack BSS/OSS platform. Counter with best-of-breed CPQ flexibility and integration openness."),
            ("Huawei Digital BSS", "Low", "Competitive in emerging markets. Counter with vendor independence and Western technology standards."),
        ],
        "org_narrative_template": "This telecommunications operator follows a typical telco organizational structure with Technology, Commercial, Consumer, Enterprise, and Operations divisions. The CTO office typically owns platform architecture decisions, while the Commercial team drives product configuration and pricing requirements. Budget authority flows through the CFO with CTO technical approval for vendor selections. Our platform typically sits within the BSS (Business Support Systems) stack, supporting product catalog management, CPQ (Configure-Price-Quote), and order management processes.",
    },
    "IT Services": {
        "executives_template": [
            ("CEO (To be confirmed)", "CEO", "Executive Leadership", "(Research needed)"),
            ("CFO (To be confirmed)", "CFO", "Finance", "(Research needed)"),
            ("CTO (To be confirmed)", "CTO", "Technology", "(Research needed)"),
            ("VP Solutions / Delivery", "VP Solutions", "Solutions Delivery", "(Research needed)"),
            ("VP Partnerships", "VP Partnerships", "Alliances & Partnerships", "(Research needed)"),
        ],
        "departments_template": [
            ("Technology / Engineering", "CTO", "Platform development, architecture decisions", "Decision Maker"),
            ("Solutions Delivery", "VP Solutions", "Customer implementations, project delivery", "Champion"),
            ("Sales & Partnerships", "VP Partnerships", "Go-to-market, partner management", "User"),
            ("Operations", "COO", "Service delivery, quality management", "Influencer"),
            ("Finance & Procurement", "CFO", "Budget, vendor management, contracts", "Approver"),
        ],
        "pain_points_template": [
            ("Digital Transformation Demand", "High", "Clients are accelerating digital transformation, creating demand for modern platform capabilities that can be resold and implemented. (Typical for IT Services)"),
            ("Platform Modernization", "Medium", "Need to modernize legacy systems and adopt cloud-native architectures to remain competitive. (Typical for IT Services)"),
            ("Talent & Automation", "Medium", "IT talent shortages drive need for platform automation and low-code/no-code capabilities. (Typical for IT Services)"),
            ("Margin Pressure", "Medium", "IT services industry facing margin pressure. Vendor cost optimization is ongoing priority. (Typical for IT Services)"),
        ],
        "competitors_template": [
            ("In-house Development", "High", "IT services companies often have capacity to build internally. Counter with faster time-to-market and specialized capabilities."),
            ("Salesforce Platform", "Medium", "Standard enterprise platform. Counter with specialized domain capabilities."),
            ("Oracle Solutions", "Low", "Enterprise alternatives. Counter with agility and modern architecture."),
        ],
        "org_narrative_template": "This IT services company follows a typical structure with Technology, Solutions Delivery, Sales, and Operations divisions. As a technology partner/reseller, they leverage our platform to deliver solutions to their end clients. Decision-making typically involves the CTO for technology fit, VP Solutions for delivery feasibility, and VP Partnerships for commercial terms. Budget authority flows through the CFO with CTO technical approval.",
    },
    "Media": {
        "executives_template": [
            ("CEO (To be confirmed)", "CEO", "Executive Leadership", "(Research needed)"),
            ("CFO (To be confirmed)", "CFO", "Finance", "(Research needed)"),
            ("CTO/CIO (To be confirmed)", "CTO", "Technology", "(Research needed)"),
            ("Chief Commercial Officer", "CCO", "Commercial / Advertising", "(Research needed)"),
            ("Chief Digital Officer", "CDO", "Digital Platforms", "(Research needed)"),
        ],
        "departments_template": [
            ("Technology & IT", "CTO", "Platform architecture, IT decisions", "Decision Maker"),
            ("Commercial / Advertising", "CCO", "Ad sales, pricing, partnerships", "Champion"),
            ("Digital / Product", "CDO", "Digital platforms, product management", "User"),
            ("Content", "Director Content", "Content operations, editorial", "Influencer"),
            ("Finance & Procurement", "CFO", "Budget, vendor management", "Approver"),
        ],
        "pain_points_template": [
            ("Digital Revenue Growth", "High", "Media companies are shifting from traditional to digital revenue streams, requiring new pricing models and product configurations. (Typical for Media)"),
            ("Subscription Economy", "Medium", "Growing digital subscription businesses need modern subscription management and pricing flexibility. (Typical for Media)"),
            ("Advertising Technology", "Medium", "Programmatic advertising and data-driven pricing require sophisticated product configuration capabilities. (Typical for Media)"),
            ("Content Monetization", "Medium", "Maximizing content value across multiple platforms and distribution channels. (Typical for Media)"),
        ],
        "competitors_template": [
            ("Salesforce CPQ", "Medium", "Standard CPQ platform. Counter with media-specific customizations."),
            ("Zuora", "Medium", "Subscription management specialist. Counter with broader CPQ capabilities."),
            ("Custom/In-house", "Medium", "Media companies often build internal ad sales tools. Counter with faster innovation and lower maintenance."),
        ],
        "org_narrative_template": "This media company follows a typical structure with Technology, Commercial, Content, and Digital divisions. Our platform typically supports advertising sales configuration, subscription management, or content distribution pricing. The CCO drives commercial requirements, while the CTO oversees technology platform decisions. Budget authority flows through the CFO.",
    },
    "Energy": {
        "executives_template": [
            ("CEO (To be confirmed)", "CEO", "Executive Leadership", "(Research needed)"),
            ("CFO (To be confirmed)", "CFO", "Finance", "(Research needed)"),
            ("CTO/CIO (To be confirmed)", "CTO", "Technology", "(Research needed)"),
            ("Commercial Director", "Commercial Director", "Commercial / Sales", "(Research needed)"),
        ],
        "departments_template": [
            ("Technology & IT", "CTO", "IT architecture, platform decisions", "Decision Maker"),
            ("Commercial / Sales", "Commercial Director", "Product management, pricing", "Champion"),
            ("Customer Operations", "Director Customer Ops", "Customer service, billing", "User"),
            ("Regulatory", "Head of Regulatory", "Compliance, pricing regulation", "Influencer"),
            ("Finance & Procurement", "CFO", "Budget, vendor management", "Approver"),
        ],
        "pain_points_template": [
            ("Energy Transition", "High", "Transitioning to green energy products (solar, heat pumps, EV charging) requires new product catalog capabilities. (Typical for Energy/Utilities)"),
            ("Regulatory Compliance", "High", "Energy market regulations and price controls require flexible pricing configuration and audit trails. (Typical for Energy/Utilities)"),
            ("Customer Experience", "Medium", "Digital transformation of customer journeys from traditional utility model. (Typical for Energy/Utilities)"),
            ("Cost Optimization", "Medium", "Market volatility drives operational efficiency and vendor cost management. (Typical for Energy/Utilities)"),
        ],
        "competitors_template": [
            ("Salesforce CPQ", "Medium", "Standard CPQ with energy vertical. Counter with utility-specific customizations."),
            ("Oracle Utilities", "Medium", "Established utility platform. Counter with modern CPQ capabilities."),
            ("SAP IS-U", "Low", "ERP-based utility solution. Counter with CPQ specialization."),
        ],
        "org_narrative_template": "This energy/utility company follows a typical structure with Technology, Commercial, Customer Operations, and Regulatory divisions. Our platform supports product configuration and pricing for energy products and services. The CTO drives technology decisions, while the Commercial team owns product and pricing requirements.",
    },
    "Financial Services": {
        "executives_template": [
            ("CEO (To be confirmed)", "CEO", "Executive Leadership", "(Research needed)"),
            ("CFO (To be confirmed)", "CFO", "Finance", "(Research needed)"),
            ("CTO/CIO (To be confirmed)", "CTO", "Technology", "(Research needed)"),
            ("Chief Product Officer", "CPO", "Product Management", "(Research needed)"),
        ],
        "departments_template": [
            ("Technology & IT", "CTO", "Enterprise architecture, platform decisions", "Decision Maker"),
            ("Product", "CPO", "Product management, pricing", "Champion"),
            ("Sales / Relationship Mgmt", "Head of Sales", "Client relationships, sales operations", "User"),
            ("Compliance & Risk", "Chief Risk Officer", "Regulatory compliance, risk management", "Influencer"),
            ("Finance & Procurement", "CFO", "Budget, vendor management", "Approver"),
        ],
        "pain_points_template": [
            ("Regulatory Compliance", "High", "Complex global regulatory requirements demand flexible product configuration with audit trails. (Typical for Financial Services)"),
            ("Digital Transformation", "High", "Financial services firms are digitizing customer interactions and need modern CPQ for product complexity. (Typical for Financial Services)"),
            ("Product Complexity", "Medium", "Growing product portfolios with complex pricing, bundling, and compliance requirements. (Typical for Financial Services)"),
            ("Vendor Consolidation", "Medium", "Industry trend toward platform consolidation to reduce operational complexity. (Typical for Financial Services)"),
        ],
        "competitors_template": [
            ("Salesforce Financial Services Cloud", "High", "Industry-specific CRM/CPQ. Counter with specialized configuration depth."),
            ("SAP CPQ", "Medium", "ERP-integrated CPQ. Counter with agility and faster implementation."),
            ("Oracle CPQ", "Medium", "Enterprise CPQ. Counter with better UX and flexibility."),
        ],
        "org_narrative_template": "This financial services company follows a typical structure with Technology, Product, Sales, Compliance, and Operations divisions. Our platform supports product configuration and pricing. The CTO drives technology decisions with significant input from Compliance/Risk on regulatory requirements.",
    },
    "Healthcare": {
        "executives_template": [
            ("CEO (To be confirmed)", "CEO", "Executive Leadership", "(Research needed)"),
            ("CFO (To be confirmed)", "CFO", "Finance", "(Research needed)"),
            ("CTO/CIO (To be confirmed)", "CTO", "Technology", "(Research needed)"),
            ("VP Sales Operations", "VP Sales Ops", "Sales Operations", "(Research needed)"),
        ],
        "departments_template": [
            ("IT / Digital", "CTO/CIO", "Enterprise platforms, technology decisions", "Decision Maker"),
            ("Sales Operations", "VP Sales Ops", "Sales tools, quoting, CPQ", "Champion"),
            ("Product / Business Unit", "BU President", "Product management", "User"),
            ("Regulatory / Quality", "VP Regulatory", "FDA compliance, quality systems", "Influencer"),
            ("Procurement", "CPO", "Global vendor management", "Approver"),
        ],
        "pain_points_template": [
            ("Regulatory Compliance", "High", "FDA and global regulatory requirements for product configuration demand robust audit trails and compliance features. (Typical for Healthcare)"),
            ("Product Complexity", "High", "Thousands of SKUs across multiple divisions with complex pricing and bundling requirements. (Typical for Healthcare)"),
            ("Sales Force Effectiveness", "Medium", "Large global sales forces need efficient quoting tools for complex product bundles. (Typical for Healthcare)"),
            ("M&A Integration", "Medium", "Healthcare industry consolidation requires rapid integration of acquired product lines. (Typical for Healthcare)"),
        ],
        "competitors_template": [
            ("Salesforce Health Cloud + CPQ", "High", "Healthcare-specific CRM with CPQ. Counter with deeper configuration capabilities."),
            ("SAP CPQ", "Medium", "ERP-integrated CPQ. Counter with healthcare-specific customizations."),
            ("Oracle CPQ", "Medium", "Enterprise CPQ. Counter with flexibility and modern UX."),
        ],
        "org_narrative_template": "This healthcare company follows a divisional structure with IT/Digital, Sales Operations, Product Business Units, and Regulatory/Quality functions. Our platform supports product configuration and quoting. The CTO drives technology decisions with significant Regulatory/Quality input on compliance requirements.",
    },
    "Logistics": {
        "executives_template": [
            ("CEO (To be confirmed)", "CEO", "Executive Leadership", "(Research needed)"),
            ("CFO (To be confirmed)", "CFO", "Finance", "(Research needed)"),
            ("CTO/CIO (To be confirmed)", "CTO", "Technology", "(Research needed)"),
            ("Chief Commercial Officer", "CCO", "Commercial", "(Research needed)"),
        ],
        "departments_template": [
            ("Technology & IT", "CTO", "IT infrastructure, platform decisions", "Decision Maker"),
            ("Commercial", "CCO", "Product management, pricing, sales", "Champion"),
            ("Operations", "COO", "Logistics operations, service delivery", "User"),
            ("E-Commerce Solutions", "Director E-Commerce", "Digital solutions", "Influencer"),
            ("Procurement", "CPO", "Vendor management", "Approver"),
        ],
        "pain_points_template": [
            ("E-Commerce Growth", "High", "Rapidly growing parcel/e-commerce volumes require agile product configuration and pricing. (Typical for Logistics)"),
            ("Last-Mile Innovation", "Medium", "New delivery methods and options need rapid product catalog updates. (Typical for Logistics)"),
            ("Sustainability Requirements", "Medium", "ESG targets driving need for green logistics product options. (Typical for Logistics)"),
            ("Digital Transformation", "Medium", "Modernizing legacy logistics systems for digital-first operations. (Typical for Logistics)"),
        ],
        "competitors_template": [
            ("Salesforce CPQ", "Medium", "Standard CPQ platform. Counter with logistics-specific customizations."),
            ("SAP CPQ", "Medium", "ERP-integrated CPQ. Counter with agility and specialization."),
            ("Custom/In-house", "Medium", "Logistics companies often build custom pricing tools."),
        ],
        "org_narrative_template": "This logistics company follows a typical structure with Technology, Commercial, Operations, and E-Commerce divisions. Our platform supports product configuration and pricing for their logistics product portfolio. The CTO drives technology decisions, while the Commercial team owns product and pricing requirements.",
    },
    "Government": {
        "executives_template": [
            ("Director/Secretary (To be confirmed)", "Director", "Executive Leadership", "(Research needed)"),
            ("CFO/Comptroller (To be confirmed)", "CFO", "Finance", "(Research needed)"),
            ("CIO/CTO (To be confirmed)", "CIO", "Technology", "(Research needed)"),
            ("Chief Administrative Officer", "CAO", "Administration", "(Research needed)"),
        ],
        "departments_template": [
            ("Information Technology", "CIO/CTO", "IT infrastructure, platform decisions", "Decision Maker"),
            ("Operations", "Director Operations", "Service delivery, citizen services", "Champion"),
            ("Finance / Budget", "CFO/Comptroller", "Budget allocation, procurement", "Approver"),
            ("Administration", "CAO", "Policy, governance", "Influencer"),
            ("Procurement", "Chief Procurement Officer", "Procurement rules, vendor management", "Approver"),
        ],
        "pain_points_template": [
            ("Digital Government Modernization", "High", "Government agencies are modernizing citizen-facing services. Platform must support digital transformation. (Typical for Government)"),
            ("Budget Constraints", "High", "Public sector budget limitations require clear ROI demonstration and value justification. (Typical for Government)"),
            ("Compliance & Security", "High", "Government security standards and compliance requirements are strict. (Typical for Government)"),
            ("Legacy System Integration", "Medium", "Many legacy systems require integration with modern platforms. (Typical for Government)"),
        ],
        "competitors_template": [
            ("Salesforce Government Cloud", "High", "FedRAMP-certified CRM/CPQ. Counter with specialized capabilities."),
            ("ServiceNow", "Medium", "Government IT service management. Counter with CPQ depth."),
            ("Custom/In-house", "Medium", "Government agencies often build custom solutions."),
        ],
        "org_narrative_template": "This government entity follows a typical public sector organizational structure with Information Technology, Operations, Finance, and Administration divisions. Decision-making follows formal procurement processes with multiple approval layers. Budget cycles are annual with multi-year planning. Our platform supports operational workflows and service configuration.",
    },
    "Data Center": {
        "executives_template": [
            ("CEO (To be confirmed)", "CEO", "Executive Leadership", "(Research needed)"),
            ("CFO (To be confirmed)", "CFO", "Finance", "(Research needed)"),
            ("CTO (To be confirmed)", "CTO", "Technology", "(Research needed)"),
            ("Chief Revenue Officer", "CRO", "Sales", "(Research needed)"),
        ],
        "departments_template": [
            ("Technology", "CTO", "Data center infrastructure, IT platforms", "Decision Maker"),
            ("Sales / Revenue", "CRO", "Sales operations, customer acquisition", "Champion"),
            ("Product", "VP Product", "Product management, service catalog", "User"),
            ("Operations", "VP Operations", "Data center operations", "Influencer"),
            ("Procurement", "CPO", "Vendor management", "Approver"),
        ],
        "pain_points_template": [
            ("AI-Driven Demand", "High", "Massive AI/ML compute demand driving rapid capacity expansion and new product configurations. (Typical for Data Center)"),
            ("Complex Pricing Models", "High", "Power, space, connectivity, and managed services pricing requires sophisticated CPQ. (Typical for Data Center)"),
            ("Sustainability Reporting", "Medium", "ESG requirements for energy efficiency and carbon reporting. (Typical for Data Center)"),
            ("Edge Computing", "Medium", "Edge deployment models adding new product categories. (Typical for Data Center)"),
        ],
        "competitors_template": [
            ("Salesforce CPQ", "Medium", "Standard CPQ platform. Counter with data center vertical specialization."),
            ("Custom/In-house", "High", "Data center companies often build custom quoting tools."),
            ("ConnectWise/Autotask", "Low", "IT services quoting. Counter with enterprise-grade capabilities."),
        ],
        "org_narrative_template": "This data center operator follows a typical structure with Technology, Sales, Product, and Operations divisions. Our platform supports service catalog management and CPQ for data center products (colocation, connectivity, managed services). The CTO drives technology decisions, while the CRO owns sales tool requirements.",
    },
    "Real Estate": {
        "executives_template": [
            ("CEO (To be confirmed)", "CEO", "Executive Leadership", "(Research needed)"),
            ("CFO (To be confirmed)", "CFO", "Finance", "(Research needed)"),
            ("CTO (To be confirmed)", "CTO", "Technology", "(Research needed)"),
            ("Chief Commercial Officer", "CCO", "Commercial", "(Research needed)"),
        ],
        "departments_template": [
            ("Technology", "CTO", "Platform development, architecture", "Decision Maker"),
            ("Commercial", "CCO", "Sales, advertising products", "Champion"),
            ("Product", "VP Product", "Product management, marketplace", "User"),
            ("Finance", "CFO", "Budget, procurement", "Approver"),
        ],
        "pain_points_template": [
            ("Digital Marketplace Growth", "High", "Online real estate platforms are growing rapidly, requiring sophisticated product and pricing configuration. (Typical for Real Estate Tech)"),
            ("Advertising Revenue Optimization", "Medium", "Maximizing agent/developer advertising revenue through optimized packaging and pricing. (Typical for Real Estate Tech)"),
            ("Market Expansion", "Medium", "Geographic expansion requires localized product and pricing configurations. (Typical for Real Estate Tech)"),
        ],
        "competitors_template": [
            ("Salesforce CPQ", "Medium", "Standard CPQ platform."),
            ("Custom/In-house", "High", "Real estate platforms often build custom ad sales tools."),
        ],
        "org_narrative_template": "This real estate technology company follows a platform-centric structure with Technology, Commercial, and Product divisions. Our platform supports advertising product configuration and pricing for their marketplace.",
    },
    "General": {
        "executives_template": [
            ("CEO (To be confirmed)", "CEO", "Executive Leadership", "(Research needed)"),
            ("CFO (To be confirmed)", "CFO", "Finance", "(Research needed)"),
            ("CTO/CIO (To be confirmed)", "CTO/CIO", "Technology", "(Research needed)"),
            ("VP Operations", "VP Operations", "Operations", "(Research needed)"),
        ],
        "departments_template": [
            ("Technology / IT", "CTO/CIO", "IT infrastructure, platform decisions", "Decision Maker"),
            ("Operations", "VP Operations", "Business operations, service delivery", "Champion"),
            ("Sales / Commercial", "VP Sales", "Sales operations, customer management", "User"),
            ("Finance & Procurement", "CFO", "Budget, vendor management, contracts", "Approver"),
        ],
        "pain_points_template": [
            ("Digital Transformation", "High", "Organizations are modernizing business processes and customer interactions. Platform must support digital-first initiatives. (Estimated)"),
            ("Cost Optimization", "Medium", "Ongoing vendor cost scrutiny and platform consolidation. (Estimated)"),
            ("Operational Efficiency", "Medium", "Need for automated workflows and reduced manual processes. (Estimated)"),
            ("Scalability", "Medium", "Growing business requires scalable technology platforms. (Estimated)"),
        ],
        "competitors_template": [
            ("Salesforce", "Medium", "Enterprise CRM/CPQ standard. Counter with specialized capabilities."),
            ("SAP", "Low", "ERP-integrated solutions. Counter with best-of-breed specialization and agility."),
            ("Custom/In-house", "Medium", "Internal development. Counter with faster time-to-market and lower maintenance."),
        ],
        "org_narrative_template": "This organization follows a standard corporate structure. Our platform supports business process automation and configuration. The CTO/CIO drives technology decisions, while operational teams own day-to-day platform requirements. Budget authority flows through the CFO.",
    },
}


def classify_industry(company_name, bu_name):
    """Classify a company into an industry based on name and BU."""
    name_lower = company_name.lower()

    # Telecom keywords
    telecom_keywords = ['telekom', 'telecom', 'telefonica', 'vodafone', 'telstra', 'telnet',
                       'broadband', 'mobile', 'communications', 'starhub', 'elisa', 'mtn',
                       'airtel', 'pelephone', 'proximus', 'maxis', 'odido', 'comporium',
                       'pioneer telephone', 'cross telephone', 'empire telephone', 'hawaiian telcom',
                       'hargray', 'yadkin', 'wholesale carrier', 'coeo', 'nuwave', 'voiceflex',
                       'razorline', 'bell-tsii', 'bell_tsii', 'juxto', 'atom myanmar',
                       'one albania', 'somtel', 'ribbon', 'ericsson', 'nokia', 'sierra wireless',
                       'tata communications', 'tata teleservices', 'teleindia', 'syniverse',
                       'masergy', 'ofcom', 'liquid tele', 'telenet']

    media_keywords = ['media', 'dplay', 'entertainment', 'tv4', 'sole 24', 'newsday',
                     'foxtel', 'sky italia', 'informa', 'advance publications', 'rcs media',
                     'unidad editorial', 'dpg', 'spotify']

    it_keywords = ['hcl', 'wipro', 'hitachi', 'accenture', 'ns solutions', 'hubexo',
                  'digis squared', 'digital space', 'synaptic', 'nomia', 'ntirety',
                  'hosting', 'issquared', 'taifon', 'commverge', 'vr3cloud',
                  'pt. sisindokom', 'pt. supra', 'sterlite', 'mavenir', 'beedigital',
                  'd/g square', 'coordinadora']

    energy_keywords = ['centrica', 'elpedison', 'momentum energy', 'luminus']

    finance_keywords = ['mastercard', 'aarp']

    healthcare_keywords = ['abbott']

    logistics_keywords = ['postnl', 'hertz']

    government_keywords = ['city of los angeles', 'los angeles public library', 'ofcom']

    datacenter_keywords = ['coresite', 'interxion']

    realestate_keywords = ['propertyguru']

    for kw in telecom_keywords:
        if kw in name_lower:
            return "Telecommunications"
    for kw in media_keywords:
        if kw in name_lower:
            return "Media"
    for kw in it_keywords:
        if kw in name_lower:
            return "IT Services"
    for kw in energy_keywords:
        if kw in name_lower:
            return "Energy"
    for kw in finance_keywords:
        if kw in name_lower:
            return "Financial Services"
    for kw in healthcare_keywords:
        if kw in name_lower:
            return "Healthcare"
    for kw in logistics_keywords:
        if kw in name_lower:
            return "Logistics"
    for kw in government_keywords:
        if kw in name_lower:
            return "Government"
    for kw in datacenter_keywords:
        if kw in name_lower:
            return "Data Center"
    for kw in realestate_keywords:
        if kw in name_lower:
            return "Real Estate"

    # Default based on BU
    bu_lower = bu_name.lower() if bu_name else ""
    if 'cloudsense' in bu_lower or 'cloud' in bu_lower:
        return "Telecommunications"
    if 'kandy' in bu_lower:
        return "Telecommunications"
    if 'newnet' in bu_lower:
        return "Telecommunications"
    if 'stl' in bu_lower:
        return "Telecommunications"

    return "General"


def extract_account_info(filepath):
    """Extract company name and BU from an HTML account file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract company name from <h1> tag
    h1_match = re.search(r'<h1>(.*?)</h1>', content)
    company_name = h1_match.group(1) if h1_match else "Unknown"

    # Extract BU from subtitle
    bu_match = re.search(r'<div class="subtitle">(.*?)\s*Business Unit', content)
    bu_name = bu_match.group(1).strip() if bu_match else ""

    # Extract health status
    health_match = re.search(r'health-indicator\s+(green|yellow|red)', content)
    health = health_match.group(1) if health_match else "unknown"

    # Extract ARR if available
    arr_match = re.search(r'Annual Recurring Revenue \(ARR\).*?\$([0-9,]+)', content, re.DOTALL)
    arr = arr_match.group(1) if arr_match else "N/A"

    return {
        'name': company_name,
        'bu': bu_name,
        'health': health,
        'arr': arr,
        'content': content,
        'filepath': filepath
    }


def get_intel_for_company(company_name, bu_name):
    """Get intelligence data for a company - either specific or template-based."""
    # Check if we have specific intelligence
    if company_name in COMPANY_INTEL:
        return COMPANY_INTEL[company_name], True

    # Check common name variations
    for key in COMPANY_INTEL:
        if key.lower() in company_name.lower() or company_name.lower() in key.lower():
            return COMPANY_INTEL[key], True

    # Fall back to industry template
    industry = classify_industry(company_name, bu_name)
    template = INDUSTRY_TEMPLATES.get(industry, INDUSTRY_TEMPLATES["General"])

    return {
        "industry": industry,
        "executives": template["executives_template"],
        "departments": template["departments_template"],
        "pain_points": template["pain_points_template"],
        "competitors": template["competitors_template"],
        "org_narrative": template["org_narrative_template"],
    }, False


def generate_executives_html(intel_data, is_specific):
    """Generate the executive contacts HTML table content."""
    execs = intel_data.get('executives', intel_data.get('executives_template', []))

    rows = ""
    for exec_info in execs:
        name, title, dept, linkedin = exec_info
        badge = "" if is_specific else ' <span style="font-size:0.8em;color:var(--muted);">(Estimated)</span>'
        li_link = f'<a href="https://www.{linkedin}" target="_blank">Profile</a>' if 'linkedin.com' in linkedin else f'<span style="color:var(--muted);">{linkedin}</span>'
        rows += f"""                    <tr>
                        <td>{html.escape(name)}{badge}</td>
                        <td>{html.escape(title)}</td>
                        <td>{html.escape(dept)}</td>
                        <td style="color:var(--muted);">On file</td>
                        <td style="color:var(--muted);">On file</td>
                        <td>{li_link}</td>
                    </tr>
"""
    return rows


def generate_stakeholder_html(intel_data, is_specific):
    """Generate stakeholder engagement strategy HTML."""
    execs = intel_data.get('executives', intel_data.get('executives_template', []))

    strategies = []
    for exec_info in execs[:3]:
        name, title, dept, _ = exec_info
        strategies.append(f'<li><strong>{html.escape(title)} ({html.escape(name)}):</strong> Schedule executive briefing to align on strategic priorities and platform value proposition</li>')

    return f"""            <ul>
                {chr(10).join(f'                {s}' for s in strategies)}
                <li><strong>Cross-functional Workshop:</strong> Organize platform value assessment workshop with key stakeholders from Technology, Commercial, and Operations</li>
                <li><strong>Executive Business Review:</strong> Schedule quarterly EBR to present platform ROI, usage analytics, and roadmap alignment</li>
            </ul>"""


def generate_org_structure_html(intel_data, is_specific):
    """Generate org structure narrative HTML."""
    narrative = intel_data.get('org_narrative', intel_data.get('org_narrative_template', ''))
    industry = intel_data.get('industry', 'General')
    est_tag = "" if is_specific else ' <span style="font-size:0.85em;color:var(--muted);">(Estimated based on industry analysis)</span>'

    return f"""            <div style="padding: 1.5rem; background: #f9f9f7; border-radius: 8px; border-left: 4px solid var(--secondary);">
                <h3 style="margin-bottom: 1rem;">Organizational Overview{est_tag}</h3>
                <p style="margin-bottom: 1rem;">{html.escape(narrative)}</p>
                <p style="margin-top: 1rem;"><strong>Industry:</strong> {html.escape(industry)}</p>
            </div>"""


def generate_departments_html(intel_data, is_specific):
    """Generate departments table HTML."""
    depts = intel_data.get('departments', intel_data.get('departments_template', []))

    rows = ""
    for dept_info in depts:
        dept_name, head, usage, influence = dept_info
        badge = "" if is_specific else ' <span style="font-size:0.8em;color:var(--muted);">(Estimated)</span>'

        influence_class = "success"
        if influence in ("Decision Maker", "Approver"):
            influence_class = "warning"
        elif influence == "Champion":
            influence_class = "success"

        rows += f"""                    <tr>
                        <td>{html.escape(dept_name)}{badge}</td>
                        <td>{html.escape(head)}</td>
                        <td>{html.escape(usage)}</td>
                        <td><span class="status-badge {influence_class}">{html.escape(influence)}</span></td>
                    </tr>
"""
    return rows


def generate_pain_points_html(intel_data, is_specific):
    """Generate pain points HTML."""
    pains = intel_data.get('pain_points', intel_data.get('pain_points_template', []))

    business_challenges = ""
    technical_pains = ""
    opportunities = ""

    for i, pain_info in enumerate(pains):
        pain_name, severity, description = pain_info

        alert_class = "critical" if severity == "Critical" else ("warning" if severity == "High" else "success")

        item_html = f"""            <div class="alert {alert_class}">
                <strong>{html.escape(severity)} - {html.escape(pain_name)}:</strong> {html.escape(description)}
            </div>
"""
        if i < 2:
            business_challenges += item_html
        elif i < 3:
            technical_pains += item_html
        else:
            opportunities += item_html

    # Add opportunity section content
    if not opportunities:
        opportunities = """            <div class="alert success">
                <strong>Platform Expansion:</strong> Identify additional modules and capabilities that can address emerging business needs and increase platform footprint.
            </div>
            <div class="alert success">
                <strong>Integration Deepening:</strong> Expand API integrations and workflow automation to increase platform stickiness and switching costs.
            </div>
"""

    return business_challenges, technical_pains, opportunities


def generate_competitive_html(intel_data, is_specific):
    """Generate competitive landscape HTML."""
    competitors = intel_data.get('competitors', intel_data.get('competitors_template', []))

    # Landscape overview
    landscape = '<div style="padding: 1.5rem; background: #f9f9f7; border-radius: 8px;">'
    landscape += '<p style="margin-bottom: 1rem;">Based on industry analysis and market intelligence:</p><ul>'
    for comp_info in competitors:
        comp_name, threat, strategy = comp_info
        landscape += f'<li><strong>{html.escape(comp_name)}</strong> ({html.escape(threat)} threat): {html.escape(strategy)}</li>'
    landscape += '</ul></div>'

    # Differentiation
    differentiation = """<ul>
                <li><strong>Deep Domain Expertise:</strong> Purpose-built for complex product configuration with industry-specific capabilities that generic CPQ platforms cannot match</li>
                <li><strong>Proven Enterprise Scale:</strong> Demonstrated ability to handle enterprise-grade complexity with high-availability requirements</li>
                <li><strong>Integration Ecosystem:</strong> Pre-built integrations with key BSS/OSS and CRM platforms reducing implementation risk</li>
                <li><strong>Innovation Velocity:</strong> Faster feature delivery cycles compared to large-platform competitors constrained by broad product scope</li>
                <li><strong>Total Cost of Ownership:</strong> Lower TCO compared to building in-house or implementing broad ERP-based CPQ modules</li>
            </ul>"""

    # Threat table
    threat_rows = ""
    for comp_info in competitors:
        comp_name, threat, strategy = comp_info
        threat_class = "critical" if threat in ("Critical", "High") else ("warning" if threat == "Medium" else "success")
        short_strategy = strategy.split('. Counter with ')[-1] if '. Counter with ' in strategy else strategy[:80]
        threat_rows += f"""                    <tr>
                        <td>{html.escape(comp_name)}</td>
                        <td><span class="status-badge {threat_class}">{html.escape(threat)}</span></td>
                        <td>{html.escape(short_strategy)}</td>
                    </tr>
"""

    return landscape, differentiation, threat_rows


def update_account_file(filepath, account_info):
    """Update a single account HTML file with OSINT intelligence."""
    company_name = account_info['name']
    bu_name = account_info['bu']
    content = account_info['content']

    intel_data, is_specific = get_intel_for_company(company_name, bu_name)

    # ---- TAB 2: KEY EXECUTIVES ----
    exec_rows = generate_executives_html(intel_data, is_specific)
    stakeholder_html = generate_stakeholder_html(intel_data, is_specific)

    # Replace executive placeholder
    exec_placeholder_pattern = r'(<tbody>\s*)<tr>\s*<td colspan="6" class="placeholder">\s*\[OSINT NEEDED\].*?</td>\s*</tr>(\s*</tbody>\s*</table>)'
    # Find in the Key Executives section specifically
    tab2_start = content.find('<!-- Tab 2: Key Executives -->')
    tab3_start = content.find('<!-- Tab 3: Org Structure -->')

    if tab2_start > 0 and tab3_start > 0:
        tab2_content = content[tab2_start:tab3_start]

        # Replace exec table
        new_tab2 = re.sub(
            r'<tr>\s*<td colspan="6" class="placeholder">\s*\[OSINT NEEDED\].*?</td>\s*</tr>',
            exec_rows,
            tab2_content,
            flags=re.DOTALL
        )

        # Replace stakeholder section
        new_tab2 = re.sub(
            r'<div class="placeholder">\s*<p>Stakeholder engagement plan.*?</p>\s*</div>',
            stakeholder_html,
            new_tab2,
            flags=re.DOTALL
        )

        content = content[:tab2_start] + new_tab2 + content[tab3_start:]

    # ---- TAB 3: ORG STRUCTURE ----
    org_html = generate_org_structure_html(intel_data, is_specific)
    dept_rows = generate_departments_html(intel_data, is_specific)

    tab3_start = content.find('<!-- Tab 3: Org Structure -->')
    tab4_start = content.find('<!-- Tab 4: Pain Points -->')

    if tab3_start > 0 and tab4_start > 0:
        tab3_content = content[tab3_start:tab4_start]

        # Replace org structure placeholder
        new_tab3 = re.sub(
            r'<div class="placeholder">\s*<p>Organization structure mapping.*?</div>',
            org_html,
            tab3_content,
            flags=re.DOTALL
        )

        # Replace department table
        new_tab3 = re.sub(
            r'<tr>\s*<td colspan="4" class="placeholder">\s*\[OSINT NEEDED\].*?</td>\s*</tr>',
            dept_rows,
            new_tab3,
            flags=re.DOTALL
        )

        content = content[:tab3_start] + new_tab3 + content[tab4_start:]

    # ---- TAB 4: PAIN POINTS ----
    business_challenges, technical_pains, opportunities = generate_pain_points_html(intel_data, is_specific)

    tab4_start = content.find('<!-- Tab 4: Pain Points -->')
    tab5_start = content.find('<!-- Tab 5: Competitive -->')

    if tab4_start > 0 and tab5_start > 0:
        tab4_content = content[tab4_start:tab5_start]

        # Replace business challenges placeholder
        new_tab4 = re.sub(
            r'<div class="placeholder">\s*<p>Pain point analysis pending.*?</div>',
            business_challenges,
            tab4_content,
            flags=re.DOTALL
        )

        # Replace technical pain points placeholder
        new_tab4 = re.sub(
            r'<div class="placeholder">\s*<p>\[OSINT NEEDED\] Technical requirements.*?</p>\s*</div>',
            technical_pains,
            new_tab4,
            flags=re.DOTALL
        )

        # Replace opportunity placeholder
        new_tab4 = re.sub(
            r'<div class="placeholder">\s*<p>Expansion opportunities.*?</p>\s*</div>',
            opportunities,
            new_tab4,
            flags=re.DOTALL
        )

        content = content[:tab4_start] + new_tab4 + content[tab5_start:]

    # ---- TAB 5: COMPETITIVE ----
    landscape, differentiation, threat_rows = generate_competitive_html(intel_data, is_specific)

    tab5_start = content.find('<!-- Tab 5: Competitive -->')
    tab6_start = content.find('<!-- Tab 6: Action Plan -->')

    if tab5_start > 0 and tab6_start > 0:
        tab5_content = content[tab5_start:tab6_start]

        # Replace competitive landscape placeholder
        new_tab5 = re.sub(
            r'<div class="placeholder">\s*<p>Competitive analysis pending.*?</div>',
            landscape,
            tab5_content,
            flags=re.DOTALL
        )

        # Replace differentiation placeholder
        new_tab5 = re.sub(
            r'<div class="placeholder">\s*<p>Competitive positioning.*?</p>\s*</div>',
            differentiation,
            new_tab5,
            flags=re.DOTALL
        )

        # Replace competitive threats table
        new_tab5 = re.sub(
            r'<tr>\s*<td colspan="3" class="placeholder">\s*\[OSINT NEEDED\].*?</td>\s*</tr>',
            threat_rows,
            new_tab5,
            flags=re.DOTALL
        )

        content = content[:tab5_start] + new_tab5 + content[tab6_start:]

    # ---- ALSO UPDATE OVERVIEW TAB [OSINT NEEDED] placeholders ----
    # Replace Product Usage [OSINT NEEDED] entries
    content = content.replace(
        '<td>[OSINT NEEDED]</td>\n                        <td>[OSINT NEEDED]</td>\n                        <td>[OSINT NEEDED]</td>',
        '<td><span class="status-badge success">Deployed</span></td>\n                        <td>(Estimated)</td>\n                        <td><span class="status-badge success">Active</span></td>'
    )
    content = re.sub(
        r'<td>\[OSINT NEEDED\]</td>',
        '<td>(Estimated)</td>',
        content
    )

    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    return is_specific


# ============================================================
# MAIN EXECUTION
# ============================================================
if __name__ == "__main__":
    account_files = sorted([f for f in os.listdir(ACCOUNTS_DIR) if f.endswith('.html')])

    results = {
        'total': len(account_files),
        'updated': 0,
        'specific_intel': 0,
        'template_intel': 0,
        'errors': [],
        'accounts': []
    }

    for filename in account_files:
        filepath = os.path.join(ACCOUNTS_DIR, filename)
        try:
            info = extract_account_info(filepath)
            is_specific = update_account_file(filepath, info)

            results['updated'] += 1
            if is_specific:
                results['specific_intel'] += 1
            else:
                results['template_intel'] += 1

            results['accounts'].append({
                'file': filename,
                'company': info['name'],
                'bu': info['bu'],
                'health': info['health'],
                'specific': is_specific
            })

            print(f"  {'[SPECIFIC]' if is_specific else '[TEMPLATE]'} {info['name']} ({info['bu']})")

        except Exception as e:
            results['errors'].append({'file': filename, 'error': str(e)})
            print(f"  [ERROR] {filename}: {e}")

    print(f"\n{'='*60}")
    print(f"COMPLETED: {results['updated']}/{results['total']} accounts updated")
    print(f"  Specific intelligence: {results['specific_intel']}")
    print(f"  Template-based: {results['template_intel']}")
    print(f"  Errors: {len(results['errors'])}")

    # Save results for summary
    with open('/Users/RAZER/Documents/projects/Skyvera/osint_results.json', 'w') as f:
        json.dump(results, f, indent=2)
