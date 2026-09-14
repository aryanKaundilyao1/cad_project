with open('src/components/layout/SidebarLayout.tsx', 'r') as f:
    content = f.read()

import_stat = "import { LayoutDashboard, Users, Target, CheckSquare, Activity, Bookmark, Building2, Bell, MessageSquare, Radar } from 'lucide-react';"
content = content.replace(
    "import { LayoutDashboard, Users, Target, CheckSquare, Activity, Bookmark, Building2, Bell, MessageSquare } from 'lucide-react';",
    import_stat
)

nav_item = """              <Link to="/opportunities" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive('/opportunities') ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/70 hover:bg-muted'}`}>
                <Target className="h-4 w-4" />
                Opportunities
              </Link>"""

nav_new = nav_item + """
              <Link to="/signals" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive('/signals') ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/70 hover:bg-muted'}`}>
                <Radar className="h-4 w-4" />
                Signal Explorer
              </Link>"""

content = content.replace(nav_item, nav_new)

with open('src/components/layout/SidebarLayout.tsx', 'w') as f:
    f.write(content)

