with open('src/App.tsx', 'r') as f:
    content = f.read()

import_statement = "import IntelligenceDashboard from \"@/pages/IntelligenceDashboard\";\n"
content = content.replace(
    'import SignalExplorer from "@/pages/SignalExplorer";',
    'import SignalExplorer from "@/pages/SignalExplorer";\n' + import_statement
)

route_statement = "<Route path=\"/intelligence/dashboard\" element={<IntelligenceDashboard />} />\n                "
content = content.replace(
    '<Route path="/signals" element={<SignalExplorer />} />',
    '<Route path="/signals" element={<SignalExplorer />} />\n                ' + route_statement
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

