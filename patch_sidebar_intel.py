with open('src/components/layout/SidebarLayout.tsx', 'r') as f:
    content = f.read()

nav_item = """<Link to="/signals" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive('/signals') ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/70 hover:bg-muted'}`}>"""

new_nav = """<Link to="/intelligence/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive('/intelligence/dashboard') ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/70 hover:bg-muted'}`}>
                <Activity className="h-4 w-4" />
                Intelligence Hub
              </Link>
              """ + nav_item

content = content.replace(nav_item, new_nav)

with open('src/components/layout/SidebarLayout.tsx', 'w') as f:
    f.write(content)

