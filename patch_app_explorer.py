with open('src/App.tsx', 'r') as f:
    content = f.read()

import_statement = "import SignalExplorer from \"@/pages/SignalExplorer\";\n"
content = content.replace(
    'import AdminDataAcquisition from "@/pages/AdminDataAcquisition";',
    'import AdminDataAcquisition from "@/pages/AdminDataAcquisition";\n' + import_statement
)

route_statement = "<Route path=\"/signals\" element={<SignalExplorer />} />\n              "
content = content.replace(
    '<Route path="/opportunities" element={<OpportunitiesPage />} />',
    '<Route path="/opportunities" element={<OpportunitiesPage />} />\n                ' + route_statement
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

