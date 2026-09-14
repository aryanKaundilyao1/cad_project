import fs from 'fs';

['src/components/Navigation.tsx', 'src/components/Sidebar.tsx', 'src/components/crm/CrmSidebar.tsx'].forEach(path => {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    
    // Find scoring engine items and remove them if they exist
    // Navigation might have /scoring
    const lines = content.split('\n');
    const filteredLines = lines.filter(line => {
      if (line.includes('/scoring')) return false;
      if (line.includes('Scoring Engine')) return false;
      return true;
    });
    
    if (lines.length !== filteredLines.length) {
      fs.writeFileSync(path, filteredLines.join('\n'));
      console.log('Removed scoring engine links from ' + path);
    }
  }
});
