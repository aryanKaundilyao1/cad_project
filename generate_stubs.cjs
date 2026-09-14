const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'pages', 'workspace');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const components = [
  'WorkspaceOverview',
  'WorkspaceProductDashboard',
  'WorkspaceCampaigns',
  'WorkspaceLeadIntelligence',
  'WorkspaceEnquiries',
  'WorkspaceMyLeads',
  'WorkspaceCRM',
  'WorkspaceMeetings',
  'WorkspaceFollowUps',
  'WorkspaceCompanyProfile',
  'WorkspaceProductManagement',
  'WorkspaceDocuments',
  'WorkspaceProfilePreview'
];

components.forEach(comp => {
  const code = `import React from 'react';
import { useWorkspace } from '@/contexts/ClientWorkspaceContext';

const ${comp} = () => {
  const { activeProduct } = useWorkspace();
  return (
    <div className="bg-card rounded-xl border border-border p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold mb-4">${comp}</h1>
      <p className="text-muted-foreground">This section is currently under development.</p>
      {activeProduct && <p className="mt-4 text-sm font-medium text-primary">Context: {activeProduct.name}</p>}
    </div>
  );
};

export default ${comp};
`;
  fs.writeFileSync(path.join(dir, `${comp}.tsx`), code);
});

console.log('Stubs generated!');
