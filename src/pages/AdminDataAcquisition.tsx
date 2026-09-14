import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { 
  Database, Play, StopCircle, RefreshCw, Layers, 
  CheckCircle2, AlertTriangle, AlertCircle, Loader2, Link as LinkIcon, Edit, Power, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { GoogleMapsConnector } from "@/lib/connectors/GoogleMapsConnector";
import { CPPPTenderConnector } from "@/lib/connectors/CPPPTenderConnector";
import { IndustrialProjectConnector } from "@/lib/connectors/IndustrialProjectConnector";

export default function AdminDataAcquisition() {
  const { user, profile, authLoading } = useAuth();
  const navigate = useNavigate();
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Stats State
  const [stats, setStats] = useState({
    totalSources: 0,
    activeSources: 0,
    jobsToday: 0,
    runningJobs: 0,
    failedJobs: 0,
    rawLeads: 0,
    validationQueue: 0,
    duplicateQueue: 0,
    successRate: 0,
  });

  // Table Data State
  const [sources, setSources] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [rawLeads, setRawLeads] = useState<any[]>([]);
  const [validationQueue, setValidationQueue] = useState<any[]>([]);
  const [duplicateQueue, setDuplicateQueue] = useState<any[]>([]);

  // Search Dialog State
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    location: '',
    radius: '10',
    limit: '20',
    industry: '',
    apiKey: ''
  });
  const [isSearching, setIsSearching] = useState(false);

  // Tender Dialog State
  const [isTenderDialogOpen, setIsTenderDialogOpen] = useState(false);
  const [isTenderSyncing, setIsTenderSyncing] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isProjectSyncing, setIsProjectSyncing] = useState(false);
  const [rawProjects, setRawProjects] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !profile?.is_admin) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      setDataLoading(true);
      try {
        // Fetch Sources
        const { data: sourcesData } = await supabase.from('source_registry').select('*').order('created_at', { ascending: false });
        if (sourcesData) setSources(sourcesData);

        // Fetch Jobs
        const { data: jobsData } = await supabase.from('import_jobs').select('*').order('created_at', { ascending: false });
        if (jobsData) setJobs(jobsData);

        // Fetch Raw Leads
        const { data: rawLeadsData } = await supabase.from('raw_leads').select('*').order('created_at', { ascending: false }).limit(100);
        if (rawLeadsData) setRawLeads(rawLeadsData);
        const { data: rawProjectsData } = await supabase.from('raw_projects').select('*').order('created_at', { ascending: false }).limit(100);
        if (rawProjectsData) setRawProjects(rawProjectsData);

        // Fetch Validation Queue
        const { data: validationData } = await supabase.from('raw_leads').select('*').eq('validation_status', 'invalid').order('created_at', { ascending: false });
        if (validationData) setValidationQueue(validationData);

        // Fetch Duplicate Queue
        const { data: duplicateData } = await supabase.from('duplicate_registry').select('*').eq('resolution_status', 'pending').order('created_at', { ascending: false });
        if (duplicateData) setDuplicateQueue(duplicateData);

        // Calculate Stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let totalProcessed = 0;
        let totalValid = 0;
        let jobsTodayCount = 0;
        let runningJobsCount = 0;
        let failedJobsCount = 0;

        jobsData?.forEach(job => {
          if (new Date(job.created_at) >= today) jobsTodayCount++;
          if (job.status === 'running') runningJobsCount++;
          if (job.status === 'failed') failedJobsCount++;
          
          totalProcessed += (job.rows_processed || 0);
          totalValid += (job.rows_valid || 0);
        });

        const successRate = totalProcessed > 0 ? Math.round((totalValid / totalProcessed) * 100) : 0;

        setStats({
          totalSources: sourcesData?.length || 0,
          activeSources: sourcesData?.filter(s => s.status === 'active').length || 0,
          jobsToday: jobsTodayCount,
          runningJobs: runningJobsCount,
          failedJobs: failedJobsCount,
          rawLeads: rawLeadsData?.length || 0,
          validationQueue: validationData?.length || 0,
          duplicateQueue: duplicateData?.length || 0,
          successRate
        });

      } catch (error) {
        console.error("Error fetching data acquisition data:", error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [user, profile, authLoading, navigate, refreshTrigger]);

  const handleResolveDuplicate = async (duplicateId: string, action: string) => {
    try {
      const { error } = await supabase.rpc('resolve_duplicate', {
        p_duplicate_id: duplicateId,
        p_action: action,
        p_admin_id: user?.id
      });
      if (error) throw error;
      toast.success(`Duplicate ${action.replace('_', ' ')} successfully.`);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast.error(err.message || 'Error resolving duplicate');
    }
  };

  const handleResolveValidation = async (recordType: string, recordId: string, action: string) => {
    try {
      const { error } = await supabase.rpc('resolve_validation', {
        p_record_type: recordType,
        p_record_id: recordId,
        p_action: action,
        p_admin_id: user?.id
      });
      if (error) throw error;
      toast.success(`Validation ${action} successfully.`);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast.error(err.message || 'Error resolving validation');
    }
  };

  const handleAddGoogleMapsSource = async () => {
    try {
      const { error } = await supabase.from('source_registry').insert({
        name: 'Google Maps',
        source_type: 'Maps API',
        status: 'active',
        api_endpoint: 'https://api.outscraper.com/maps/search-v3',
        cron_schedule: 'Manual'
      });
      if (error) {
        if (error.code === '23505') { // Unique violation
          toast.error('Google Maps source already exists.');
        } else {
          throw error;
        }
      } else {
        toast.success('Google Maps source added successfully.');
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error adding source');
    }
  };

  const handleAddCPPPSource = async () => {
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
  };

  const handleAddIndustrialSource = async () => {
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
  };

  const handleToggleSourceStatus = async (sourceId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const { error } = await supabase.from('source_registry').update({ status: newStatus }).eq('id', sourceId);
      if (error) throw error;
      toast.success(`Source is now ${newStatus}.`);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast.error(err.message || 'Error updating source status');
    }
  };

  const handleRunSource = (sourceId: string, sourceName: string, sourceType: string) => {
    setActiveSourceId(sourceId);
    if (sourceType === 'Tender Portal') {
      setIsTenderDialogOpen(true);
    } else if (sourceType === 'Project Portal') {
      setIsProjectDialogOpen(true);
    } else {
      setIsSearchDialogOpen(true);
    }
  };

  const executeSearch = async () => {
    if (!activeSourceId) return;
    if (!searchParams.apiKey) {
      toast.error('API Key is required to run this search');
      return;
    }
    
    setIsSearching(true);
    try {
      const connector = new GoogleMapsConnector(activeSourceId, searchParams.apiKey);
      const isAuthenticated = await connector.authenticate();
      if (!isAuthenticated) throw new Error('Authentication failed');

      toast.info('Fetching data from Google Maps...');
      const { data } = await connector.fetchData({
        query: `${searchParams.keyword} ${searchParams.location}`,
        limit: parseInt(searchParams.limit)
      });
      
      toast.info(`Fetched ${data.length} records. Transforming...`);
      const transformedData = data.map((item: any) => connector.transform(item));
      
      toast.info('Uploading and processing batch...');
      const jobId = await connector.uploadBatch(transformedData);
      
      await connector.triggerProcessing(jobId, user!.id);
      
      toast.success('Search completed and processed!');
      setIsSearchDialogOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      toast.error(`Connector failed: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const executeTenderSync = async () => {
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
  };

  const executeProjectSync = async () => {
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
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card/40 border border-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(56,130,246,0.1)', border: '1px solid rgba(56,130,246,0.15)' }}>
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold">Data Acquisition Module</h1>
                  <p className="text-sm text-muted-foreground">Manage ingestion pipelines, raw data, and data quality.</p>
                </div>
              </div>
              </div>
            </div>
            
          <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-6 bg-white/[0.03] border border-white/[0.06] flex w-full h-12 rounded-xl overflow-x-auto">
                <TabsTrigger value="overview" className="flex-1 rounded-lg"><Layers className="w-4 h-4 mr-2" /> Overview</TabsTrigger>
                <TabsTrigger value="sources" className="flex-1 rounded-lg"><LinkIcon className="w-4 h-4 mr-2" /> Sources</TabsTrigger>
                <TabsTrigger value="jobs" className="flex-1 rounded-lg"><Play className="w-4 h-4 mr-2" /> Import Jobs</TabsTrigger>
                <TabsTrigger value="raw" className="flex-1 rounded-lg"><Database className="w-4 h-4 mr-2" /> Raw Data</TabsTrigger>
                <TabsTrigger value="validation" className="flex-1 rounded-lg">
                  <AlertCircle className="w-4 h-4 mr-2" /> Validation
                  {stats.validationQueue > 0 && <Badge variant="destructive" className="ml-2">{stats.validationQueue}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="duplicates" className="flex-1 rounded-lg">
                  <RefreshCw className="w-4 h-4 mr-2" /> Duplicates
                  {stats.duplicateQueue > 0 && <Badge variant="secondary" className="ml-2">{stats.duplicateQueue}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="health" className="flex-1 rounded-lg"><CheckCircle2 className="w-4 h-4 mr-2" /> Health</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-card/40 border-white/5">
                    <CardContent className="p-6">
                      <p className="text-3xl font-bold">{stats.totalSources}</p>
                      <p className="text-sm text-muted-foreground">Total Sources</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/40 border-white/5">
                    <CardContent className="p-6">
                      <p className="text-3xl font-bold text-emerald-400">{stats.activeSources}</p>
                      <p className="text-sm text-muted-foreground">Active Sources</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/40 border-white/5">
                    <CardContent className="p-6">
                      <p className="text-3xl font-bold">{stats.jobsToday}</p>
                      <p className="text-sm text-muted-foreground">Jobs Today</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/40 border-white/5">
                    <CardContent className="p-6">
                      <p className="text-3xl font-bold text-blue-400">{stats.successRate}%</p>
                      <p className="text-sm text-muted-foreground">Import Success Rate</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="sources">
                <Card className="bg-card/40 border-white/5">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle>Source Registry</CardTitle>
                      <CardDescription>Manage all data acquisition endpoints and scrapers.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddGoogleMapsSource}><LinkIcon className="h-4 w-4 mr-2" /> Add Maps Source</Button>
                      <Button size="sm" onClick={handleAddCPPPSource}><LinkIcon className="h-4 w-4 mr-2" /> Add CPPP Source</Button>
                      <Button size="sm" onClick={handleAddIndustrialSource}><LinkIcon className="h-4 w-4 mr-2" /> Add Project Source</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                     <Table>
                        <TableHeader>
                          <TableRow className="border-white/5">
                            <TableHead>Source Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Endpoint</TableHead>
                            <TableHead>Schedule</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sources.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No sources found.</TableCell></TableRow>
                          ) : (
                            sources.map(source => (
                              <TableRow key={source.id} className="border-white/5">
                                <TableCell className="font-medium">{source.name}</TableCell>
                                <TableCell><Badge variant="outline">{source.source_type}</Badge></TableCell>
                                <TableCell>
                                  <Badge variant={source.status === 'active' ? 'default' : 'secondary'} className={source.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : ''}>
                                    {source.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">{source.api_endpoint || 'N/A'}</TableCell>
                                <TableCell>{source.cron_schedule || 'Manual'}</TableCell>
                                <TableCell className="text-right space-x-2">
                                  <Button onClick={() => handleRunSource(source.id, source.name, source.source_type)} variant="ghost" size="icon" className="h-8 w-8" title="Run Connector">
                                    <Play className="h-4 w-4 text-emerald-400" />
                                  </Button>
                                  <Button onClick={() => handleToggleSourceStatus(source.id, source.status)} variant="ghost" size="icon" className="h-8 w-8" title={source.status === 'active' ? 'Pause Connector' : 'Activate Connector'}>
                                    {source.status === 'active' ? <StopCircle className="h-4 w-4 text-amber-400" /> : <Power className="h-4 w-4 text-blue-400" />}
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit Configuration"><Edit className="h-4 w-4" /></Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                     </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="jobs">
                <Card className="bg-card/40 border-white/5">
                  <CardHeader>
                    <CardTitle>Import Jobs</CardTitle>
                    <CardDescription>Track the status of all data ingestion pipelines.</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <Table>
                        <TableHeader>
                          <TableRow className="border-white/5">
                            <TableHead>Job ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Fetched</TableHead>
                            <TableHead>Valid</TableHead>
                            <TableHead>Invalid</TableHead>
                            <TableHead>Duplicate</TableHead>
                            <TableHead>Started</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {jobs.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No jobs found.</TableCell></TableRow>
                          ) : (
                            jobs.map(job => (
                              <TableRow key={job.id} className="border-white/5">
                                <TableCell className="font-mono text-xs">{job.id.substring(0, 8)}...</TableCell>
                                <TableCell>
                                  <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'} className={job.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : ''}>
                                    {job.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{job.rows_fetched || 0}</TableCell>
                                <TableCell className="text-emerald-400">{job.rows_valid || 0}</TableCell>
                                <TableCell className="text-amber-400">{job.rows_invalid || 0}</TableCell>
                                <TableCell className="text-blue-400">{job.rows_duplicate || 0}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{job.started_at ? format(new Date(job.started_at), 'PP p') : 'Pending'}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                     </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="raw">
                <Card className="bg-card/40 border-white/5">
                  <CardHeader>
                    <CardTitle>Raw Data (Last 100)</CardTitle>
                    <CardDescription>Inspect unprocessed records arriving from sources.</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <Table>
                        <TableHeader>
                          <TableRow className="border-white/5">
                            <TableHead>Company</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Validation</TableHead>
                            <TableHead>Imported</TableHead>
                            <TableHead className="text-right">Payload</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rawLeads.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No raw data found.</TableCell></TableRow>
                          ) : (
                            rawLeads.map(lead => (
                              <TableRow key={lead.id} className="border-white/5">
                                <TableCell className="font-medium">{lead.company_name || 'N/A'}</TableCell>
                                <TableCell>{lead.source || 'Unknown'}</TableCell>
                                <TableCell>
                                  <Badge variant={lead.validation_status === 'valid' ? 'default' : lead.validation_status === 'invalid' ? 'destructive' : 'secondary'} className={lead.validation_status === 'valid' ? 'bg-emerald-500/20 text-emerald-400' : ''}>
                                    {lead.validation_status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{format(new Date(lead.created_at), 'PP p')}</TableCell>
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
                                        {JSON.stringify(lead.raw_json, null, 2)}
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
              </TabsContent>

              <TabsContent value="validation">
                <Card className="bg-card/40 border-white/5">
                  <CardHeader>
                    <CardTitle>Validation Queue</CardTitle>
                    <CardDescription>Review records that failed semantic normalization or data quality checks.</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <Table>
                        <TableHeader>
                          <TableRow className="border-white/5">
                            <TableHead>Company</TableHead>
                            <TableHead>Errors</TableHead>
                            <TableHead>Job ID</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validationQueue.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Queue is empty. Great job!</TableCell></TableRow>
                          ) : (
                            validationQueue.map(lead => (
                              <TableRow key={lead.id} className="border-white/5">
                                <TableCell className="font-medium">{lead.company_name || 'N/A'}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1 text-xs text-rose-400">
                                    {lead.processing_errors && Array.isArray(lead.processing_errors) ? 
                                      lead.processing_errors.map((err: string, i: number) => <span key={i}>• {err}</span>) 
                                      : <span>• {JSON.stringify(lead.processing_errors)}</span>}
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{lead.job_id?.substring(0, 8) || 'N/A'}</TableCell>
                                <TableCell className="text-right space-x-2">
                                  <Button onClick={() => handleResolveValidation('lead', lead.id, 'approve')} variant="default" size="sm" className="bg-green-600 hover:bg-green-700">Approve</Button>
                                  <Button variant="outline" size="sm">Edit</Button>
                                  <Button onClick={() => handleResolveValidation('lead', lead.id, 'reject')} variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                     </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="duplicates">
                <Card className="bg-card/40 border-white/5">
                  <CardHeader>
                    <CardTitle>Duplicate Resolution</CardTitle>
                    <CardDescription>Manually resolve fuzzy duplicate matches (Scenario C).</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <Table>
                        <TableHeader>
                          <TableRow className="border-white/5">
                            <TableHead>Match Score</TableHead>
                            <TableHead>Existing Entity ID</TableHead>
                            <TableHead>Incoming Raw ID</TableHead>
                            <TableHead>Date Detected</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {duplicateQueue.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No duplicates to resolve.</TableCell></TableRow>
                          ) : (
                            duplicateQueue.map(dup => (
                              <TableRow key={dup.id} className="border-white/5">
                                <TableCell>
                                  <Badge className="bg-amber-500/20 text-amber-400">{Math.round((dup.confidence_score || 0) * 100)}% Match</Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{dup.existing_record_id?.substring(0, 8) || 'N/A'}</TableCell>
                                <TableCell className="font-mono text-xs">{dup.raw_record_id?.substring(0, 8) || 'N/A'}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{format(new Date(dup.created_at), 'PP p')}</TableCell>
                                <TableCell className="text-right space-x-2 whitespace-nowrap">
                                  <Button onClick={() => handleResolveDuplicate(dup.id, 'merge')} variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">Merge</Button>
                                  <Button onClick={() => handleResolveDuplicate(dup.id, 'keep_existing')} variant="outline" size="sm">Keep Existing</Button>
                                  <Button onClick={() => handleResolveDuplicate(dup.id, 'keep_incoming')} variant="outline" size="sm">Keep Incoming</Button>
                                  <Button onClick={() => handleResolveDuplicate(dup.id, 'reject')} variant="destructive" size="sm">Reject</Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                     </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="health">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-card/40 border-white/5">
                    <CardHeader>
                      <CardTitle className="text-lg">Database Storage</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-muted-foreground">Raw Leads Capacity</span>
                        <span className="font-bold">{stats.rawLeads} Rows</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-muted-foreground">Duplicates Quarantined</span>
                        <span className="font-bold">{stats.duplicateQueue} Rows</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Validation Queue Size</span>
                        <span className="font-bold">{stats.validationQueue} Rows</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-card/40 border-white/5">
                    <CardHeader>
                      <CardTitle className="text-lg">Ingestion Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-muted-foreground">Success Rate</span>
                        <span className="font-bold text-emerald-400">{stats.successRate}%</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-muted-foreground">Failed Jobs (All Time)</span>
                        <span className="font-bold text-rose-400">{stats.failedJobs}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Active Pipelines</span>
                        <span className="font-bold text-blue-400">{stats.activeSources}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
            
            <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
              <DialogContent className="bg-card border-white/5">
                <DialogHeader>
                  <DialogTitle>Run Google Maps Connector</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Outscraper API Key</Label>
                    <Input 
                      type="password" 
                      placeholder="Paste your API key here" 
                      value={searchParams.apiKey}
                      onChange={(e) => setSearchParams({...searchParams, apiKey: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Keyword</Label>
                      <Input placeholder="e.g. Warehouses" value={searchParams.keyword} onChange={(e) => setSearchParams({...searchParams, keyword: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input placeholder="e.g. Delhi NCR" value={searchParams.location} onChange={(e) => setSearchParams({...searchParams, location: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Limit</Label>
                      <Input type="number" placeholder="20" value={searchParams.limit} onChange={(e) => setSearchParams({...searchParams, limit: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Industry Tag</Label>
                      <Input placeholder="e.g. Logistics" value={searchParams.industry} onChange={(e) => setSearchParams({...searchParams, industry: e.target.value})} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsSearchDialogOpen(false)}>Cancel</Button>
                  <Button onClick={executeSearch} disabled={isSearching} className="bg-primary">
                    {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    Run Search
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isTenderDialogOpen} onOpenChange={setIsTenderDialogOpen}>
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
            </Dialog>

            <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
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
            </Dialog>

    </div>
  );
}
