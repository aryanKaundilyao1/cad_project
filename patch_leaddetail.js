import fs from 'fs';

const path = 'src/pages/LeadDetailPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add handleViewInCRM function
const importLine = `import { useToast } from "@/hooks/use-toast";`;
if (!content.includes('import { useToast }')) {
    content = content.replace('import { useParams', importLine + '\nimport { useParams');
}

const functionToInsert = `
  const handleViewInCRM = async () => {
    if (!user?.id || !id) return;
    try {
      // Check if already in CRM (assigned_leads)
      const { data: existing } = await supabase
        .from('assigned_leads')
        .select('id')
        .eq('lead_id', id)
        .eq('client_id', user.id)
        .maybeSingle();

      if (!existing) {
        // Auto-create on the fly
        await supabase
          .from('assigned_leads')
          .insert({
            lead_id: id,
            client_id: user.id,
            status: 'New',
            is_contacted: false
          });
      }
      navigate('/workspace/crm');
    } catch (err) {
      console.error("Error auto-creating CRM entry:", err);
      navigate('/workspace/crm');
    }
  };
`;

// Insert the function before the return statement inside LeadDetailPage
if (content.includes('return (') && !content.includes('handleViewInCRM')) {
    // Find the last return (
    const lastReturnIndex = content.lastIndexOf('return (');
    content = content.slice(0, lastReturnIndex) + functionToInsert + '\n  ' + content.slice(lastReturnIndex);
}

// Replace the click handler
content = content.replace(
    /onClick=\{\(\) => navigate\('\/workspace\/crm'\)\}/g,
    'onClick={handleViewInCRM}'
);

fs.writeFileSync(path, content);
