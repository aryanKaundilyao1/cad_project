const fs = require('fs');
const content = fs.readFileSync('src/integrations/supabase/types.ts', 'utf8');
const tablesStart = content.indexOf('Tables: {');
const viewsStart = content.indexOf('Views: {');
const tablesSection = content.substring(tablesStart, viewsStart);
const regex = /^\s{6}([a-zA-Z_]+): \{/gm;
let match;
while ((match = regex.exec(tablesSection)) !== null) {
  console.log(match[1]);
}
