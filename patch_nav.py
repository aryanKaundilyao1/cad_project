with open('src/components/Navigation.tsx', 'r') as f:
    content = f.read()

nav_item = '                      <DropdownMenuItem onClick={() => navigate("/admin/data-acquisition")} className="gap-2 cursor-pointer text-primary font-semibold"><Database className="h-4 w-4" /> Data Acquisition</DropdownMenuItem>'
nav_new = nav_item + '\n                      <DropdownMenuItem onClick={() => navigate("/admin/intelligence")} className="gap-2 cursor-pointer text-purple-400 font-semibold"><Radar className="h-4 w-4" /> Intelligence Center</DropdownMenuItem>'

content = content.replace(nav_item, nav_new)

if 'Radar,' not in content and 'Radar ' not in content:
    content = content.replace('import { ', 'import { Radar, ')

with open('src/components/Navigation.tsx', 'w') as f:
    f.write(content)

