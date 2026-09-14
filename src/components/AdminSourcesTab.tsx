import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Edit2, CheckCircle2, XCircle } from 'lucide-react';
import { Source } from '@/types/importArchitecture';
import { Badge } from '@/components/ui/badge';

export default function AdminSourcesTab() {
  const { toast } = useToast();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('sources').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error(error);
        return;
      }
      setSources(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.from('sources').insert([{
        name: formData.name,
        description: formData.description
      }]);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Source added successfully.' });
      setFormData({ name: '', description: '' });
      fetchSources();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase.from('sources').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Updated' });
      fetchSources();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure? This may break existing templates that use this source.')) return;
    try {
      const { error } = await supabase.from('sources').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted' });
      fetchSources();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 border-white/10 bg-black/40 h-fit">
        <CardHeader>
          <CardTitle className="text-lg">Add Source</CardTitle>
          <CardDescription>Create a new origin for incoming data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Source Name</Label>
            <Input 
              placeholder="e.g. Google Maps" 
              className="bg-white/5 border-white/10"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input 
              placeholder="e.g. Scraped using Apify" 
              className="bg-white/5 border-white/10"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <Button onClick={handleAdd} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Add Source
          </Button>
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-2 border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="text-lg">Existing Sources</CardTitle>
          <CardDescription>Manage your data ingestion points.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && sources.length === 0 ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : sources.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border border-dashed border-white/10 rounded-lg">No sources found.</div>
          ) : (
            <div className="space-y-3">
              {sources.map(source => (
                <div key={source.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-lg hover:bg-white/[0.04] transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm text-foreground">{source.name}</h4>
                      <Badge variant={source.status === 'active' ? 'default' : 'secondary'} className={source.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : ''}>
                        {source.status}
                      </Badge>
                    </div>
                    {source.description && <p className="text-xs text-muted-foreground">{source.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-white" onClick={() => toggleStatus(source.id, source.status)}>
                      {source.status === 'active' ? <XCircle className="w-3 h-3 mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {source.status === 'active' ? 'Disable' : 'Enable'}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => handleDelete(source.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
