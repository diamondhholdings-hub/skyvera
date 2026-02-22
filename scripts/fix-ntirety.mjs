import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'

// Load env
for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.+)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function parseJSON(text) {
  const m = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/s)
  return JSON.parse(m ? m[1] : text)
}

const slug = 'ntirety-hosting-com'

const tasks = [
  {
    type: 'stakeholders',
    prompt: 'Generate 3 realistic stakeholders for Ntirety (Hosting.com), a cloud managed services and hosting provider that uses CloudSense CPQ on Salesforce. Return a JSON array with fields: id, name, title, role (decision-maker/champion/influencer/user), relationshipStrength (strong/moderate/weak), email, notes, interests (array), lastInteraction (ISO date).',
  },
  {
    type: 'strategy',
    prompt: 'Generate a strategy plan for Ntirety (Hosting.com) using CloudSense CPQ. Return a JSON object with exactly: "painPoints" (array of 2 objects with id, title, description, status, severity, identifiedDate, owner) and "opportunities" (array of 2 objects with id, title, description, status, estimatedValue, probability, identifiedDate, owner).',
  },
  {
    type: 'competitors',
    prompt: 'Generate 2 competitors for Ntirety (Hosting.com) that compete with CloudSense CPQ from Skyvera. Return a JSON array with fields: id, name, type (our-competitor or customer-competitor), description, strengths (array), weaknesses (array), lastUpdated.',
  },
  {
    type: 'actions',
    prompt: 'Generate 4 action items for the Ntirety (Hosting.com) account team. Mix: 1 done, 1 in-progress, 2 todo. Return a JSON array with fields: id, title, description, status (todo/in-progress/done), priority (high/medium/low), owner, dueDate (ISO Q1-Q2 2026), createdAt (ISO Jan-Feb 2026).',
  },
]

for (const { type, prompt } of tasks) {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })
  const data = parseJSON(msg.content[0].text.trim())
  fs.writeFileSync(`data/account-plans/${type}/${slug}.json`, JSON.stringify(data, null, 2))
  console.log(`${type}: OK`)
}
console.log('Ntirety: all 4 types generated ✓')
