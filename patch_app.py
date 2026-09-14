with open('src/App.tsx', 'r') as f:
    content = f.read()

import_statement = "import AdminIntelligenceCenter from \"@/pages/AdminIntelligenceCenter\";\n"
content = content.replace(
    'import AdminDataAcquisition from "@/pages/AdminDataAcquisition";',
    'import AdminDataAcquisition from "@/pages/AdminDataAcquisition";\n' + import_statement
)

route_statement = "<Route path=\"/admin/intelligence\" element={<AdminIntelligenceCenter />} />\n              "
content = content.replace(
    '<Route path="/admin/data-acquisition" element={<AdminDataAcquisition />} />',
    '<Route path="/admin/data-acquisition" element={<AdminDataAcquisition />} />\n              ' + route_statement
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

