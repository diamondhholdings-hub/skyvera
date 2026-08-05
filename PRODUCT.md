# Product

## Register

product

## Users

**The board-facing executive (primary).** Skyvera's CEO, CFO, and CRO open this platform between meetings, often on a laptop minutes before a board update or QBR. They are not browsing — they came in with a question ("why did Cloudsense miss margin again?", "what's the AR > 90 picture?", "what's our Salesforce UK exposure?") and need a defensible answer in under sixty seconds. They are financially literate, allergic to fluff, and will trust the tool only as far as the numbers can be traced back to the Q1'26 budget. They screenshot. They paste into decks. They forward URLs to their CFO and expect the link to load to the same view.

**The BU general manager (secondary).** Cloudsense, Kandy, and STL leaders use the dashboard and account pages to track their own P&L, watch at-risk renewals, and prep for monthly reviews. They live inside the 140-account portfolio, drill into individual accounts (8-tab account plans, OSINT intelligence, action kanbans), and care about the diff between Q1'26 Plan and Prior Plan more than any rolled-up summary.

**The ops/finance analyst (tertiary).** Pulls weekly numbers, runs scenarios (pricing changes, churn forecasts, expansion modeling), and exports account plans to PDF for partners and the audit committee. They are the ones who will notice if a number doesn't reconcile to the spreadsheet, so they need the lineage visible.

## Product Purpose

Skyvera is the executive intelligence layer over a multi-BU SaaS portfolio. The raw material — the current quarter's (Q3'26) budget Excel, 101 customer subscriptions, RapidAPI + OpenCorporates enrichment, OSINT reports — already exists; it just lives in places no executive has time to assemble. This product reads it all, lets a leader ask plain-English questions ("which accounts are most at risk?"), models scenarios with traceable math, and surfaces the things that should not be buried: **whether the EBITDA test holds this quarter, a -$199K blended margin gap (61.4% actual vs. 63.0% target), recurring revenue declining across all three core BUs (Cloudsense -$168K, Kandy -$531K, STL -$30K vs. Prior Plan), $9.81M of AR over 90 days, and the concentration risk carried by Skyvera's largest vendor contracts.** Success looks like: a board member opens a URL, sees the answer, and trusts it without checking the spreadsheet.

## Brand Personality

Finance-grade. Quietly authoritative. Dense without being cluttered. The voice is closer to a senior partner's memo than a SaaS marketing site — short sentences, specific numbers, no exclamation points, no hedging. When something is bad ("EBITDA test FAILED"), say it directly; do not soften with euphemism or color it with surprise. When something is uncertain (cached enrichment, degraded adapter), label it that way — never pretend confidence the data does not earn.

Three words: **precise, composed, accountable.**

The interface should feel like the kind of tool a board member would screenshot and forward without embarrassment. It should not feel exciting. It should feel correct.

## Anti-references

Things this must explicitly NOT look like:

- **Generic SaaS dashboard.** No hero metric tiles with gradient backgrounds, no glowing accent colors over four-digit ARR numbers, no purple-to-blue card washes, no animated count-ups. The Stripe/Vercel/Linear "starter dashboard" aesthetic is the default we are designing against, not toward.
- **Consumer fintech (Robinhood, Cash App, Mercury's marketing site).** Too playful. Big rounded shapes, illustrated empty states, friendly copy, and confetti moments are wrong here — the user is reviewing a $918K margin miss, not depositing a check.
- **Bloomberg Terminal.** Too dense, too dark, too much information per pixel, requires training to read. We are not optimizing for traders; we are optimizing for an exec who has thirty seconds before walking into a meeting.
- **Notion-style "minimalist" page.** Too soft, too undifferentiated. Skyvera is not a doc; it has live numbers, exception states, and material consequence. A page that looks like a wiki underclaims the seriousness of the data.
- **Crypto/AI startup energy.** No glowing borders, no aurora gradients, no "AI sparkle" iconography, no monospace headlines pretending to be a terminal. The Claude-powered NLQ is a feature, not a personality.

## Design Principles

**1. Every number traces back.** A figure on screen must be reachable to its source — Q1'26 budget cell, customer record, enrichment cache, adapter response. If a value is cached, degraded, or skipped, label it. The product loses all credibility the first time a CFO can't reconcile a headline number; the design must never get in the way of that lineage.

**2. Surface the pains, do not bury them.** The five headline issues (EBITDA test failure, margin gap, RR decline, AR > 90, Salesforce UK exposure) are the reason the platform exists. They belong above the fold, in plain language, with the actual dollar amount. Hierarchy serves the bad news, not the prettiest chart.

**3. Density with restraint.** Executives can absorb dense data — that's the job — but each screen must have one obvious primary thing to look at. Solve density with typographic scale, alignment, and quiet rules; not with whitespace padding that pushes the second-most-important fact off the viewport. Tabular numerals everywhere. No decorative icons next to dollar values.

**4. Bookmarkable and shareable by default.** Tab state lives in the URL (`?tab=overview`), search lives in the URL (`?search=`), filters live in the URL. A board member forwarding a link must land their colleague on the exact same view. State that lives only in React is a bug against this principle.

**5. Print/PDF parity is a first-class concern.** Account plans get exported, printed, and handed to partners. The `@media print` layout is not an afterthought — A4 must look intentional, `[data-print="hide"]` must remove chrome cleanly, color must reproduce on a black-and-white printer. If a screen looks great but prints as a cropped mess, the screen is wrong.

**6. Server-rendered data, client-rendered interaction.** Architecturally this is already the rule (Server Components fetch, Client islands handle interactivity); design must honor it. Initial paint shows real numbers, not skeletons that resolve a beat later. Interactive flourishes (hover, drag, optimistic status edits) are layered on top, never required for the data itself to land.

## Accessibility & Inclusion

WCAG 2.2 AA as the floor — this is enterprise software used at the executive and board level, and accessibility lapses are a procurement issue, not just an ethical one. Specific requirements:

- **Color is never the only signal.** Healthy / At Risk / Critical states need icon + label + color, not color alone. Red-green color blindness affects a non-trivial share of finance executives; don't gate "is this account in trouble?" on hue.
- **Reduced motion is honored.** Skip count-ups, parallax, and any non-essential transition when `prefers-reduced-motion: reduce` is set. The data is the point; motion is decoration.
- **Keyboard-first paths everywhere.** Every interactive surface — kanban drag, inline status cycling, tab navigation, account search — must work without a mouse. Executives use trackpads on planes; analysts live on keyboards.
- **Print stylesheet contrast holds.** Greys that read fine on screen must remain legible on a monochrome laser printer. Test the `@media print` layout against actual paper, not just print preview.
- **Numeric data is screen-reader-legible.** Currency and percentage values need explicit labels; "$8.0M" should be announced as "eight million dollars," not "dollar sign eight period zero M."
