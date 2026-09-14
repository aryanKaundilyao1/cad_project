import re

with open("src/pages/AdminDataAcquisition.tsx", "r") as f:
    content = f.read()

# 1. Add import
content = content.replace(
    'import { CPPPTenderConnector } from "@/lib/connectors/CPPPTenderConnector";',
    'import { CPPPTenderConnector } from "@/lib/connectors/CPPPTenderConnector";\nimport { IndustrialProjectConnector } from "@/lib/connectors/IndustrialProjectConnector";'
)

# 2. Add state
content = content.replace(
    'const [isTenderSyncing, setIsTenderSyncing] = useState(false);',
    'const [isTenderSyncing, setIsTenderSyncing] = useState(false);\n  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);\n  const [isProjectSyncing, setIsProjectSyncing] = useState(false);\n  const [rawProjects, setRawProjects] = useState<any[]>([]);'
)

# 3. Add fetch
fetch_leads = "const { data: rawLeadsData } = await supabase.from('raw_leads').select('*').order('created_at', { ascending: false }).limit(100);\n        if (rawLeadsData) setRawLeads(rawLeadsData);"
fetch_projects = "\n        const { data: rawProjectsData } = await supabase.from('raw_projects').select('*').order('created_at', { ascending: false }).limit(100);\n        if (rawProjectsData) setRawProjects(rawProjectsData);"
content = content.replace(fetch_leads, fetch_leads + fetch_projects)

# 4. Add handler
add_cppp = """  const handleAddCPPPSource = async () => {
    try {
      const { error } = await supabase.from('source_registry').insert({
        name: 'CPPP Tenders',
        source_type: 'Tender Portal',
        status: 'active',
        api_endpoint: 'https://eprocure.gov.in/eprocure/app',
        cron_schedule: 'Manual'
      });
      if (error) {
        if (error.code === '23505') {
          toast.error('CPPP source already exists.');
        } else throw error;
      } else {
        toast.success('CPPP source added successfully.');
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error adding source');
    }
  };"""

add_industrial = """\n\n  const handleAddIndustrialSource = async () => {
    try {
      const { error } = await supabase.from('source_registry').insert({
        name: 'Industrial Projects Portal',
        source_type: 'Project Portal',
        status: 'active',
        api_endpoint: '/api/projects.json',
        cron_schedule: 'Manual'
      });
      if (error) {
        if (error.code === '23505') {
          toast.error('Project source already exists.');
        } else throw error;
      } else {
        toast.success('Project source added successfully.');
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error adding source');
    }
  };"""
content = content.replace(add_cppp, add_cppp + add_industrial)

# 5. Handle run
run_source = """  const handleRunSource = (sourceId: string, sourceName: string, sourceType: string) => {
    setActiveSourceId(sourceId);
    if (sourceType === 'Tender Portal') {
      setIsTenderDialogOpen(true);
    } else {"""
run_source_new = """  const handleRunSource = (sourceId: string, sourceName: string, sourceType: string) => {
    setActiveSourceId(sourceId);
    if (sourceType === 'Tender Portal') {
      setIsTenderDialogOpen(true);
    } else if (sourceType === 'Project Portal') {
      setIsProjectDialogOpen(true);
    } else {"""
content = content.replace(run_source, run_source_new)

# 6. execute sync
execute_tender = """  const executeTenderSync = async () => {
    if (!activeSourceId) return;
    
    setIsTenderSyncing(true);
    try {
      const connector = new CPPPTenderConnector(activeSourceId);
      await connector.authenticate();
      
      toast.info('Syncing tenders from CPPP...');
      const { data } = await connector.fetchData({});
      
      toast.info(`Fetched ${data.length} tenders. Transforming...`);
      const transformedData = data.map((item: any) => connector.transform(item));
      
      toast.info('Uploading and processing tender batch...');
      const jobId = await connector.uploadBatch(transformedData);
      
      await connector.triggerProcessing(jobId, user!.id);
      
      toast.success('Tender sync completed and processed!');
      setIsTenderDialogOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      toast.error(`Tender sync failed: ${error.message}`);
    } finally {
      setIsTenderSyncing(false);
    }
  };"""
  
execute_project = """\n\n  const executeProjectSync = async () => {
    if (!activeSourceId) return;
    
    const source = sources.find(s => s.id === activeSourceId);
    if (!source || !source.api_endpoint) {
      toast.error('Source endpoint not configured');
      return;
    }
    
    setIsProjectSyncing(true);
    try {
      const connector = new IndustrialProjectConnector(activeSourceId, source.api_endpoint);
      await connector.authenticate();
      
      toast.info('Syncing projects...');
      const { data } = await connector.fetchData({});
      
      toast.info(`Fetched ${data.length} projects. Transforming...`);
      const transformedData = data.map((item: any) => connector.transform(item));
      
      toast.info('Uploading and processing project batch...');
      const jobId = await connector.uploadBatch(transformedData);
      
      await connector.triggerProcessing(jobId, user!.id);
      
      toast.success('Project sync completed and processed!');
      setIsProjectDialogOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      toast.error(`Project sync failed: ${error.message}`);
    } finally {
      setIsProjectSyncing(false);
    }
  };"""
content = content.replace(execute_tender, execute_tender + execute_project)

# 7. Add UI buttons
button_cppp = '<Button size="sm" onClick={handleAddCPPPSource}><LinkIcon className="h-4 w-4 mr-2" /> Add CPPP Source</Button>'
button_project = '\n                      <Button size="sm" onClick={handleAddIndustrialSource}><LinkIcon className="h-4 w-4 mr-2" /> Add Project Source</Button>'
content = content.replace(button_cppp, button_cppp + button_project)

# 8. Add project table in raw tab
# Finding the end of the rawLeads Card
raw_leads_card_end = """                    </CardContent>
                </Card>
              </TabsContent>"""

raw_projects_table = """                    </CardContent>
                </Card>
                
                <Card className="bg-card/40 border-white/5 mt-6">
                  <CardHeader>
                    <CardTitle>Raw Projects (Last 100)</CardTitle>
                    <CardDescription>Inspect unprocessed projects arriving from portals.</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <Table>
                        <TableHeader>
                          <TableRow className="border-white/5">
                            <TableHead>Project Name</TableHead>
                            <TableHead>Developer</TableHead>
                            <TableHead>Validation</TableHead>
                            <TableHead>Imported</TableHead>
                            <TableHead className="text-right">Payload</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rawProjects.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No raw projects found.</TableCell></TableRow>
                          ) : (
                            rawProjects.map(proj => (
                              <TableRow key={proj.id} className="border-white/5">
                                <TableCell className="font-medium">{proj.project_name || 'N/A'}</TableCell>
                                <TableCell>{proj.developer || 'Unknown'}</TableCell>
                                <TableCell>
                                  <Badge variant={proj.validation_status === 'valid' ? 'default' : proj.validation_status === 'invalid' ? 'destructive' : 'secondary'} className={proj.validation_status === 'valid' ? 'bg-emerald-500/20 text-emerald-400' : ''}>
                                    {proj.validation_status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{format(new Date(proj.created_at), 'PP p')}</TableCell>
                                <TableCell className="text-right">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm">View JSON</Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle>Raw JSON Payload</DialogTitle>
                                      </DialogHeader>
                                      <pre className="bg-black/50 p-4 rounded-lg text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                                        {JSON.stringify(proj.raw_json, null, 2)}
                                      </pre>
                                    </DialogContent>
                                  </Dialog>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                     </Table>
                  </CardContent>
                </Card>
              </TabsContent>"""
content = content.replace(raw_leads_card_end, raw_projects_table)


# 9. Add project dialog
tender_dialog = """            <Dialog open={isTenderDialogOpen} onOpenChange={setIsTenderDialogOpen}>
              <DialogContent className="bg-card border-white/5">
                <DialogHeader>
                  <DialogTitle>Sync CPPP Tenders</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    This will run the CPPP Tender Scraper to pull the latest PEB and Construction tenders. 
                    (Currently using mock data for safe testing).
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsTenderDialogOpen(false)}>Cancel</Button>
                  <Button onClick={executeTenderSync} disabled={isTenderSyncing} className="bg-primary">
                    {isTenderSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    Start Sync
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>"""
            
project_dialog = """\n\n            <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
              <DialogContent className="bg-card border-white/5">
                <DialogHeader>
                  <DialogTitle>Sync Industrial Projects</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    This will pull the latest industrial and construction projects from the configured portal.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsProjectDialogOpen(false)}>Cancel</Button>
                  <Button onClick={executeProjectSync} disabled={isProjectSyncing} className="bg-primary">
                    {isProjectSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    Start Sync
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>"""
content = content.replace(tender_dialog, tender_dialog + project_dialog)


with open("src/pages/AdminDataAcquisition.tsx", "w") as f:
    f.write(content)

