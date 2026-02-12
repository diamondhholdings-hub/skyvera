# Conversational Scenarios - Quick Start Guide

## What's New?

The scenario modeling system now has an **intelligent conversational interface** powered by Claude AI. Instead of filling out forms, you can have a natural conversation about what-if scenarios.

## 5-Minute Quick Start

### Step 1: Run Database Migration
```bash
cd /Users/RAZER/Documents/projects/Skyvera
npx prisma migrate dev --name add_conversational_scenarios
npx prisma generate
```

### Step 2: Verify API Key
Check that your `.env.local` has:
```
ANTHROPIC_API_KEY=sk-ant-...
```

If not, add it and restart your dev server.

### Step 3: Start the Application
```bash
npm run dev
```

### Step 4: Navigate to Scenarios
Open your browser to: `http://localhost:3000/scenario`

### Step 5: Try It Out!

Click the **"Conversational AI"** button (should be selected by default).

Try one of these example prompts:

1. **Simple pricing change:**
   ```
   What if we raise prices by 10%?
   ```

2. **Customer loss scenario:**
   ```
   What if we lose our top 3 customers?
   ```

3. **Acquisition scenario:**
   ```
   What if we acquire a company with $5M ARR and 20 employees?
   ```

4. **Headcount scenario:**
   ```
   What if we reduce headcount by 10 people in Cloudsense?
   ```

## How It Works

### 1. Natural Language Input
Just type your question in plain English. The AI understands:
- Pricing changes: "raise prices 15%"
- Customer scenarios: "lose Telstra account"
- Headcount changes: "add 5 engineers"
- Acquisitions: "buy a company with $X ARR"

### 2. AI Asks Clarifying Questions
If your scenario is ambiguous, the AI will ask focused questions:

**You:** "What if we change pricing?"

**AI:** "I need clarification:
1. Which business unit?
2. Increase or decrease? By how much?
3. Expected customer churn?

Here are smart defaults based on your data..."

### 3. Analysis with Reasoning
The AI doesn't just show numbers - it explains them:

```
Revenue Impact: +$1.2M
Reasoning: 10% price increase on $12M base revenue
Risk Level: Medium
Why: Industry average is 8-12%, so this is within normal range
Recommendation: Approve with conditions
Conditions: 1) Phase over 2 quarters, 2) Monitor churn weekly
```

### 4. Iterative Refinement
After seeing results:
- Click **"Refine Scenario"** for AI suggestions
- Ask follow-up questions to explore alternatives
- Compare multiple versions side-by-side

## Common Use Cases

### Executive Planning
**Scenario:** Board asks "What happens if we lose a major customer?"

**Conversational Flow:**
```
You: "What if we lose Telstra?"
AI: "Telstra is $2.1M ARR. Would this be complete loss or partial?"
You: "Complete loss in Q2"
AI: [Shows impact analysis]
    "This is severe. Here are 3 mitigation strategies..."
You: "Show me the cost reduction option"
AI: [Runs new scenario with cost cuts]
```

### Budget Planning
**Scenario:** CFO wants to hit margin targets

**Conversational Flow:**
```
You: "How do we get to 68% margin?"
AI: "You're currently at 62.5%. To reach 68%, you need +$810K EBITDA.
     Here are 4 approaches: 1) Price increase, 2) Cost reduction..."
You: "Show me the pricing approach"
AI: [Analyzes pricing scenario]
    "A 5.8% price increase would achieve the target..."
```

### Strategic Planning
**Scenario:** Exploring acquisition opportunities

**Conversational Flow:**
```
You: "What if we acquire CloudCo for $15M? They have $5M ARR and 25 people"
AI: "Let me analyze the acquisition impact:
     - Revenue: +$5M ARR
     - Costs: +$3.75M (25 people + integration)
     - Payback: 12 years (expensive)
     - Recommendation: Negotiate down to $8-10M..."
```

## Features

### ✅ What's Included

1. **Natural Language Understanding**
   - Parse complex scenarios from text
   - Handle ambiguous queries
   - Extract intent and parameters

2. **Smart Clarification**
   - Ask focused questions
   - Provide context-aware defaults
   - Learn from your data

3. **Iterative Refinement**
   - Suggest improvements
   - Explore alternatives
   - Compare approaches

4. **Version History**
   - Track all iterations
   - Compare versions
   - See evolution of thinking

5. **Strategic Reasoning**
   - Explain recommendations
   - Identify risks
   - Suggest mitigations

### 🔄 Traditional Form Mode Still Available

If you prefer the old structured form interface:
1. Click "Traditional Form" toggle
2. Use familiar dropdown/input fields
3. Same analysis, different input method

## Tips for Best Results

### Do's ✅
- **Start simple:** "What if we raise prices 10%?"
- **Be specific when you know:** "What if Cloudsense loses $2M in revenue?"
- **Ask follow-ups:** "What if we make that churn lower?"
- **Explore alternatives:** "Show me other approaches"
- **Use the refine button:** Let AI suggest improvements

### Don'ts ❌
- **Don't use jargon:** "NPV of LTV/CAC ratio" → Just ask about customer value
- **Don't overcomplicate:** Start with one variable, then add more
- **Don't expect perfection:** First attempt is a starting point, iterate!
- **Don't ignore AI suggestions:** The refinements are often valuable

## Example Session

Here's a complete example session:

```
[USER] What if we raise prices 15% but lose 10% of customers?

[AI] I'll analyze this scenario for all business units.

Quick clarification: Should we apply this uniformly, or phase it in?

Smart default: I'll assume uniform application to be conservative.

[Running analysis...]

[AI] Results: Mixed Impact

Revenue: +$1.32M (+9% net after churn)
- Price increase: +$2.2M
- Customer churn: -$880K

EBITDA: +$825K
Net Margin: 62.5% → 65.1%

⚠️  Risks Identified:
1. High churn assumption (10%) - industry average is 5-7%
2. Could damage brand reputation
3. Support costs won't decrease proportionally

💡 Recommendation: APPROVE WITH CONDITIONS

Conditions:
1. Phase the increase: 8% in Q1, 7% in Q3
2. Grandfather top 10 customers
3. Improve retention program to cap churn at 6%

Would you like me to model the phased approach?

[USER] Yes, show me the phased approach

[AI] [Runs new scenario...]

Phased Approach Results:

Q1-Q2: 8% increase, 4% churn
Q3-Q4: Additional 7% increase, 3% churn

Year 1 Revenue: +$1.48M (+10.1%)
EBITDA: +$925K
Net Margin: 65.8%
Total Churn: 7% (acceptable)

✅ This is significantly better:
- Higher revenue (+$160K)
- Lower customer impact (7% vs 10% churn)
- Time to adjust and improve retention

Recommendation: APPROVE

This phased approach balances growth with customer relationships.

[USER] Save this as "Phased Pricing Strategy"

[AI] Saved as Version 2: "Phased Pricing Strategy"

You can compare this with Version 1 anytime. Would you like to explore other scenarios?
```

## Keyboard Shortcuts

- **Enter:** Send message / Start conversation
- **Shift+Enter:** New line in input (for multi-line queries)
- **Cmd/Ctrl+R:** Refine current scenario
- **Cmd/Ctrl+N:** New scenario (reset conversation)

## Troubleshooting

### "ANTHROPIC_API_KEY not configured"
**Solution:** Add your API key to `.env.local` and restart the server.

### AI responses are slow (>15 seconds)
**Possible causes:**
- Claude API rate limiting (wait and retry)
- Large conversation history (start new conversation)
- Complex calculation (expected for multi-factor scenarios)

### AI gives generic responses
**Solutions:**
- Provide more context in your question
- Use specific numbers instead of "some" or "a lot"
- Ask follow-up questions to guide the AI
- Use the refine feature

### Messages not appearing
**Check:**
- Browser console for errors
- Network tab for failed API calls
- Database connection is working
- Prisma client is generated

## Next Steps

1. **Explore Examples:** Try all the example prompts
2. **Ask Real Questions:** Model actual business scenarios
3. **Iterate:** Use the refine feature extensively
4. **Compare:** Create multiple versions and compare
5. **Share:** Show your team the new capability

## Support

- **Documentation:** See `/docs/CONVERSATIONAL_SCENARIOS.md` for full details
- **Code Issues:** Check browser console and server logs
- **Questions:** Review the conversation examples in documentation

## Feedback

This is a new feature! Please provide feedback:
- What works well?
- What's confusing?
- What scenarios should it handle better?
- What features are missing?

Your input will help improve the system for everyone.

---

**Welcome to the future of scenario planning! 🚀**

Have a conversation with your data instead of filling out forms.
