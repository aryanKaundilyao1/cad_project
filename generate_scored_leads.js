const fs = require('fs');

const rawLeads = JSON.parse(fs.readFileSync('leads.json', 'utf8'));

const scoredLeads = rawLeads.map(lead => {
    // 1. Evidence Confidence
    let conf = 0.3; // Low
    if (lead.confidence === 'High') conf = 0.9;
    if (lead.confidence === 'Medium') conf = 0.6;
    
    // 2. EV (Expected Value)
    // The PDF gave a Priority Score 1-10. We'll use this to scale a base EV.
    // Let's say max EV is $25,000 for top tier B2B SaaS.
    const ev = lead.raw_score * 2500;
    
    // 3. LCB (Lower Confidence Bound)
    // Formula: LCB = EV * (1 - k * (1 - Conf))
    const k = 1.0;
    const lcb = ev * (1 - k * (1 - conf));
    
    // 4. Opportunity Quality (0-100)
    const quality = lead.raw_score * 10;
    
    // Determine status
    let status = 'INVESTIGATE';
    if (lcb > 15000) status = 'CONTACT NOW';
    else if (lcb > 8000) status = 'NURTURE';
    else status = 'LOW PRIORITY';

    return {
        ...lead,
        ev: ev,
        conf_value: conf,
        lcb: lcb,
        quality: quality,
        status: status,
        id: lead.id.toString(), // string ID for routing
        created_at: new Date().toISOString()
    };
});

// Sort by LCB descending
scoredLeads.sort((a, b) => b.lcb - a.lcb);

// Assign Ranks
scoredLeads.forEach((lead, index) => {
    lead.rank = index + 1;
});

// Save to frontend data directory
fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/validation_leads.json', JSON.stringify(scoredLeads, null, 2));
console.log("Generated scored leads at src/data/validation_leads.json");
