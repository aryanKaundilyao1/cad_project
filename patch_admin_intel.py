with open('src/pages/AdminIntelligenceCenter.tsx', 'r') as f:
    content = f.read()

import_statement = 'import { Activity, Radar, Layers, ShieldAlert, Loader2, Radio, PlayCircle, Sliders } from "lucide-react";\n'
content = content.replace(
    'import {\n  Activity, Radar, Layers, ShieldAlert,\n  Loader2, Radio, PlayCircle\n} from "lucide-react";',
    import_statement
)

state_vars = """
  const [rules, setRules] = useState<any[]>([]);

  const fetchRules = async () => {
    const { data } = await supabase.from('intelligence_readiness_rules').select('*').order('created_at', { ascending: false });
    if (data) setRules(data);
  };
"""

content = content.replace(
    'const [events, setEvents] = useState<any[]>([]);',
    'const [events, setEvents] = useState<any[]>([]);' + state_vars
)

fetch_data_inject = """
        await fetchRules();
"""
content = content.replace(
    'if (eventsData) setEvents(eventsData);',
    'if (eventsData) setEvents(eventsData);' + fetch_data_inject
)

tabs_trigger = """<TabsTrigger value="rules" className="flex-1 rounded-lg"><Sliders className="w-4 h-4 mr-2" /> Readiness Rules</TabsTrigger>"""

content = content.replace(
    '<TabsTrigger value="events" className="flex-1 rounded-lg"><ShieldAlert className="w-4 h-4 mr-2" /> Audit Logs</TabsTrigger>',
    '<TabsTrigger value="events" className="flex-1 rounded-lg"><ShieldAlert className="w-4 h-4 mr-2" /> Audit Logs</TabsTrigger>\n          ' + tabs_trigger
)

tabs_content = """
        <TabsContent value="rules">
          <Card className="bg-card/40 border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Readiness Engine Rules</CardTitle>
                <CardDescription>Configure logic for Opportunity Readiness momentum.</CardDescription>
              </div>
              <Button size="sm" variant="outline">Add Rule</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5">
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Conditions</TableHead>
                    <TableHead>Resulting Readiness</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No readiness rules configured.</TableCell></TableRow>
                  ) : (
                    rules.map(rule => (
                      <TableRow key={rule.id} className="border-white/5">
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell className="font-mono text-xs">{JSON.stringify(rule.conditions)}</TableCell>
                        <TableCell>
                           <Badge variant="outline" className={
                             rule.resulting_readiness === 'Critical' ? 'border-red-500/50 text-red-400' :
                             rule.resulting_readiness === 'High' ? 'border-purple-500/50 text-purple-400' :
                             rule.resulting_readiness === 'Medium' ? 'border-blue-500/50 text-blue-400' : ''
                           }>
                            {rule.resulting_readiness}
                           </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={rule.is_active ? 'default' : 'secondary'} className={rule.is_active ? 'bg-emerald-500/20 text-emerald-400' : ''}>
                            {rule.is_active ? 'Active' : 'Disabled'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
"""

content = content.replace(
    '</Tabs>\n    </div>',
    tabs_content + '\n      </Tabs>\n    </div>'
)

with open('src/pages/AdminIntelligenceCenter.tsx', 'w') as f:
    f.write(content)
