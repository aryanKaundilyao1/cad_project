with open('src/App.tsx', 'r') as f:
    content = f.read()

# I want to add the route: <Route path="lead/:id" element={<LeadDetailPage />} /> inside the /workspace layout.
target = '<Route path="tools/scraper" element={<WebsiteScraperPage />} />'
if target in content:
    content = content.replace(target, target + '\n                <Route path="lead/:id" element={<LeadDetailPage />} />')

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Updated App.tsx")
