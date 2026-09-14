const fs = require('fs');

let content = fs.readFileSync('src/pages/LeadDetailPage.tsx', 'utf8');

const replacement = `
import validationLeads from '@/data/validation_leads.json';

  const fetchLead = async () => {
    if (!id) return;
    try {
      // Check validation static leads first
      const staticLead = validationLeads.find(l => l.id === id);
      if (staticLead) {
        // Adapt it to match the expected schema somewhat
        setLead({
            id: staticLead.id,
            company_name: staticLead.company,
            description: staticLead.reason,
            industry: 'Validation Target',
            city: staticLead.city,
            country: 'India',
            contact_email: 'hello@' + staticLead.company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
            score: staticLead.quality,
            opportunity_quality: staticLead.quality,
            evidence_confidence: staticLead.conf_value,
            commercial_value: staticLead.ev,
            lcb: staticLead.lcb,
            status: staticLead.status,
            source: staticLead.type,
            signals: staticLead.signal
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
`;

content = content.replace(/const fetchLead = async \(\) => \{\n    if \(\!id\) return;\n    try \{/, replacement);

fs.writeFileSync('src/pages/LeadDetailPage.tsx', content);
console.log("Updated LeadDetailPage.tsx");
