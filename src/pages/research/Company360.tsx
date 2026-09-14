import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Save, Activity, Globe, MapPin, Building, Briefcase, Users, FileText } from 'lucide-react';

export default function Company360() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [company, setCompany] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [scores, setScores] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // New Module State
  const [newModuleType, setNewModuleType] = useState('GoogleMaps');
  const [newModuleData, setNewModuleData] = useState('{}');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCompanyData();
  }, [id]);

  const fetchCompanyData = async () => {
    if (!id) return;
    setLoading(true);
    
    // Fetch Master Company
    const { data: compData, error: compErr } = await supabase
      .from('jas_companies')
      .select('*')
      .eq('id', id)
      .single();
      
    if (compErr) {
      toast({ title: 'Error', description: 'Company not found', variant: 'destructive' });
      navigate('/admin/entity');
      return;
    }
    
    // Fetch Modules
    const { data: modData } = await supabase
      .from('jas_evidence_modules')
      .select('*')
      .eq('entity_id', id)
      .eq('entity_type', 'Company')
      .order('created_at', { ascending: false });
      
    // Fetch Scores
    const { data: scoreData } = await supabase
      .from('jas_scores')
      .select('*')
      .eq('entity_id', id)
      .eq('entity_type', 'Company')
      .maybeSingle();

    setCompany(compData);
    setModules(modData || []);
    setScores(scoreData);
    setLoading(false);
  };

  const handleSaveModule = async () => {
    try {
      setSaving(true);
      const parsedData = JSON.parse(newModuleData);
      
      const { error } = await supabase
        .from('jas_evidence_modules')
        .insert({
          entity_type: 'Company',
          entity_id: id,
          module_type: newModuleType,
          raw_data: parsedData
        });
        
      if (error) throw error;
      
      // Explicitly trigger scoring engine update
      await supabase.functions.invoke('run-client-scoring', {
        body: { entityId: id, entityType: 'Company' }
      });
      
      toast({ title: 'Module Saved', description: 'Evidence attached. Scoring engine triggered.' });
      setNewModuleData('{}');
      
      // Refresh to see new module and updated scores
      await fetchCompanyData();
    } catch (e: any) {
      toast({ title: 'Failed to save', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{company?.name}</h1>
              <Badge variant="outline" className="bg-primary/10">{company?.universal_id || 'No Universal ID'}</Badge>
            </div>
            <p className="text-muted-foreground flex gap-4 mt-1">
              <span>{company?.primary_industry || company?.industry || 'Unknown Industry'}</span>
              <span>•</span>
              <span>{company?.headquarters_location_id || company?.location || 'Unknown Location'}</span>
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 py-2 flex items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">Master Score</p>
                <p className="text-2xl font-bold text-primary">{scores?.total_score || '0.00'}</p>
              </div>
              <Activity className="h-8 w-8 text-primary/50" />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: MODULE VIEWER */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="modules">Evidence Modules ({modules.length})</TabsTrigger>
              <TabsTrigger value="timeline">History Timeline</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground italic">
                    AI Summary is generated automatically by listening to the Event Engine whenever modules update. (Simulated view).
                  </p>
                  <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
                    {company?.description || "No description generated yet."}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="modules" className="mt-6 space-y-4">
              {modules.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                  No evidence modules attached to this company.
                </div>
              ) : (
                modules.map(mod => (
                  <Card key={mod.evidence_id}>
                    <CardHeader className="py-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {mod.module_type === 'GoogleMaps' && <MapPin className="h-4 w-4 text-red-500" />}
                          {mod.module_type === 'Website' && <Globe className="h-4 w-4 text-blue-500" />}
                          {mod.module_type === 'LinkedIn' && <Briefcase className="h-4 w-4 text-indigo-500" />}
                          {mod.module_type === 'Procurement' && <Building className="h-4 w-4 text-emerald-500" />}
                          {mod.module_type} Module
                        </CardTitle>
                        <Badge variant="secondary">{new Date(mod.extracted_at).toLocaleDateString()}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                        {JSON.stringify(mod.raw_data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="timeline" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                  <CardDescription>All module updates and score recalculations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 border-l-2 border-muted ml-4 pl-4">
                    {modules.map(mod => (
                      <div key={mod.evidence_id} className="relative">
                        <div className="absolute -left-6 top-1 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                        <p className="text-sm font-medium">Added {mod.module_type} Evidence</p>
                        <p className="text-xs text-muted-foreground">{new Date(mod.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                    <div className="relative">
                      <div className="absolute -left-6 top-1 h-4 w-4 rounded-full bg-muted ring-4 ring-background" />
                      <p className="text-sm font-medium">Company Master Record Created</p>
                      <p className="text-xs text-muted-foreground">{new Date(company?.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT COLUMN: DATA ENTRY / RESEARCH TOOLS */}
        <div className="space-y-6">
          <Card className="border-primary/20 shadow-md">
            <CardHeader>
              <CardTitle>Attach New Evidence</CardTitle>
              <CardDescription>Manually attach a module to trigger score recalculations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Module Type</label>
                <select 
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newModuleType}
                  onChange={e => setNewModuleType(e.target.value)}
                >
                  <option value="GoogleMaps">Google Maps</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Website">Website Analysis</option>
                  <option value="Procurement">Procurement Data</option>
                  <option value="ImportExport">Import/Export Data</option>
                  <option value="Contacts">Contacts Enrichment</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Raw JSON Data</label>
                <Textarea 
                  value={newModuleData}
                  onChange={e => setNewModuleData(e.target.value)}
                  className="font-mono text-xs min-h-[200px]"
                />
              </div>
              <Button className="w-full" onClick={handleSaveModule} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Attach Module
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Client Segregation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This master company is distributed to client pipelines. Any evidence added above automatically syncs the <Badge variant="outline">client_score</Badge> across all client leads.
              </p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/workspace/crm')}>
                View Client CRM Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
