const fs = require('fs');
const path = require('path');

const managerPath = path.join(__dirname, 'src', 'components', 'products', 'ProductManager.tsx');
let managerContent = fs.readFileSync(managerPath, 'utf8');

managerContent = managerContent.replace(/isPremium \? '\/workspace\/catalogue\/import' : '\/seller\/products\/import'/g, "'/workspace/catalogue/import'");
managerContent = managerContent.replace(/isPremium \? '\/workspace\/catalogue\/new' : '\/seller\/products\/new'/g, "'/workspace/catalogue/new'");
managerContent = managerContent.replace(/isPremium \? `\/workspace\/catalogue\/\$\{p.product_id\}\/edit` : `\/seller\/products\/\$\{p.product_id\}\/edit`/g, "`\/workspace\/catalogue\/${p.product_id}\/edit`");

fs.writeFileSync(managerPath, managerContent);

const editorPath = path.join(__dirname, 'src', 'components', 'products', 'ProductEditor.tsx');
let editorContent = fs.readFileSync(editorPath, 'utf8');
editorContent = editorContent.replace(/isPremium \? '\/workspace\/catalogue' : '\/seller\/products'/g, "'/workspace/catalogue'");

fs.writeFileSync(editorPath, editorContent);
