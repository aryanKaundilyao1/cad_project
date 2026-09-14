import fs from 'fs';

let content = fs.readFileSync('src/pages/LeadDetailPage.tsx', 'utf-8');

const targetFunction = `  const handleViewInCRM = async () => {
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
  };`;

// Remove the wrongly placed function
content = content.replace(targetFunction, '');

// Insert it right after handleBookmark
const insertTarget = `    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };`;

content = content.replace(insertTarget, insertTarget + '\n\n' + targetFunction);

fs.writeFileSync('src/pages/LeadDetailPage.tsx', content);
console.log("Fixed handleViewInCRM scope.");
