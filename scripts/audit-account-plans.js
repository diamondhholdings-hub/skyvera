const fs = require('fs');
const path = require('path');

// Load all customers — each file is { bu_name, customers: [...] }
const files = ['customers_cloudsense_all.json', 'customers_kandy_all.json', 'customers_stl_all.json', 'customers_newnet_all.json'];
let allCustomers = [];
for (const f of files) {
  try {
    const data = JSON.parse(fs.readFileSync('data/' + f));
    const list = Array.isArray(data) ? data : (data.customers || []);
    allCustomers = allCustomers.concat(list.map(c => ({ ...c, bu: c.bu || data.bu_name })));
  } catch(e) { console.error('Failed to load', f, e.message); }
}

// slugify matching app logic
const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Build unique customer map: slug -> name
const customerMap = {};
for (const c of allCustomers) {
  const name = c.customer_name || c.name || '';
  if (name) customerMap[slugify(name)] = { name, bu: c.bu };
}

const slugs = Object.keys(customerMap);
console.log('Total unique slugs:', slugs.length);

const types = ['stakeholders', 'strategy', 'competitors', 'actions'];
const complete = [];
const incomplete = [];

for (const slug of slugs) {
  const missingTypes = types.filter(t => {
    const fp = 'data/account-plans/' + t + '/' + slug + '.json';
    return !fs.existsSync(fp);
  });
  if (missingTypes.length === 0) {
    complete.push(slug);
  } else {
    incomplete.push({ slug, name: customerMap[slug].name, bu: customerMap[slug].bu, missing: missingTypes });
  }
}

console.log('\nComplete (all 4 types):', complete.length);
console.log('Incomplete:', incomplete.length);

// Check intelligence separately (AI-generated)
const withIntelligence = slugs.filter(s => fs.existsSync('data/account-plans/intelligence/' + s + '.json'));
console.log('With intelligence data:', withIntelligence.length);

// Breakdown by what's missing
const missingBreakdown = {};
for (const item of incomplete) {
  const key = item.missing.join(',');
  missingBreakdown[key] = (missingBreakdown[key] || 0) + 1;
}
console.log('\nMissing breakdown:', JSON.stringify(missingBreakdown, null, 2));

// Check content quality — files are plain JSON arrays (or {painPoints,opportunities} for strategy)
let emptyStakeholders = 0, emptyStrategy = 0, emptyCompetitors = 0, emptyActions = 0;
const emptyDetails = { stakeholders: [], competitors: [], actions: [], strategy: [] };

for (const slug of complete) {
  const s = JSON.parse(fs.readFileSync('data/account-plans/stakeholders/' + slug + '.json'));
  const st = JSON.parse(fs.readFileSync('data/account-plans/strategy/' + slug + '.json'));
  const c = JSON.parse(fs.readFileSync('data/account-plans/competitors/' + slug + '.json'));
  const a = JSON.parse(fs.readFileSync('data/account-plans/actions/' + slug + '.json'));

  const stakeholderArr = Array.isArray(s) ? s : (s.stakeholders || []);
  const competitorArr = Array.isArray(c) ? c : (c.competitors || []);
  const actionArr = Array.isArray(a) ? a : (a.actions || []);
  const painPoints = Array.isArray(st) ? st : (st.painPoints || []);

  if (stakeholderArr.length === 0) { emptyStakeholders++; emptyDetails.stakeholders.push(slug); }
  if (painPoints.length === 0) { emptyStrategy++; emptyDetails.strategy.push(slug); }
  if (competitorArr.length === 0) { emptyCompetitors++; emptyDetails.competitors.push(slug); }
  if (actionArr.length === 0) { emptyActions++; emptyDetails.actions.push(slug); }
}
console.log('\nContent quality (among', complete.length, 'complete accounts):');
console.log('  Empty stakeholders:', emptyStakeholders);
console.log('  Empty strategy/pain points:', emptyStrategy);
console.log('  Empty competitors:', emptyCompetitors);
console.log('  Empty actions:', emptyActions);
console.log('\nAccounts needing stakeholder enrichment:', emptyDetails.stakeholders.length);
console.log('Accounts needing competitor enrichment:', emptyDetails.competitors.length);

fs.writeFileSync('data/account-plan-audit.json', JSON.stringify({ complete, incomplete, withIntelligence, emptyDetails }, null, 2));

// Save full list
fs.writeFileSync('data/account-plan-audit.json', JSON.stringify({ complete, incomplete, withIntelligence }, null, 2));
console.log('\nFull audit saved to data/account-plan-audit.json');
