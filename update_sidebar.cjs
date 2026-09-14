const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/layout/ClientWorkspaceLayout.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Also removing bg-white dark:bg-gray-900 hardcodes
content = content.replace(/bg-white dark:bg-gray-900/g, 'bg-background');
content = content.replace(/<SidebarLink to="\/workspace\/settings" icon=\{<Settings className="h-4 w-4" \/>\} label="Settings" isActive=\{isActive\('\/workspace\/settings'\)\} \/>/g, 
  \`<SidebarLink to="/workspace/scoring" icon={<Zap className="h-4 w-4" />} label="Scoring Engine" isActive={isActive('/workspace/scoring')} />
              <SidebarLink to="/workspace/settings" icon={<Settings className="h-4 w-4" />} label="Settings" isActive={isActive('/workspace/settings')} />\`);

fs.writeFileSync(filePath, content, 'utf8');
