import re

with open('src/pages/LeadDetailPage.tsx', 'r') as f:
    content = f.read()

# Add import at the top
if 'import validationLeads' not in content:
    content = content.replace('import { useState, useEffect } from "react";', 'import { useState, useEffect } from "react";\nimport validationLeads from "@/data/validation_leads.json";')

replacement = """
  const fetchLead = async () => {
    if (!id) return;
    try {
      const staticLead = (validationLeads as any[]).find(l => l.id === id);
      if (staticLead) {
        setLead({
            id: staticLead.id,
            company_name: staticLead.company,
            description: staticLead.reason,
            industry: 'Technology',
            city: staticLead.city,
            country: 'India',
            contact_email: 'hello@' + staticLead.company.lower().replace(/[^a-z0-9]/g, '') + '.com',
            score: staticLead.quality,
            opportunity_quality: staticLead.quality,
            evidence_confidence: staticLead.conf_value,
            commercial_value: staticLead.ev,
            lcb: staticLead.lcb,
            status: staticLead.status,
            source: staticLead.type,
            signals: staticLead.signal,
            rank: staticLead.rank
        });
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
"""

content = re.sub(r'const fetchLead = async \(\) => \{\n    if \(\!id\) return;\n    try \{\n      const \{ data, error \} = await supabase\.from\(\'leads\'\)\.select\(\'\*\'\)\.eq\(\'id\', id\)\.single\(\);', replacement.strip(), content)

# I should also fix the navigate path when not found:
content = content.replace("navigate('/tenders');", "navigate('/workspace/opportunities');")

with open('src/pages/LeadDetailPage.tsx', 'w') as f:
    f.write(content)
print("Updated LeadDetailPage")
