import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, FolderTree, ArrowRight } from 'lucide-react';
import { Industry } from '@/types/importArchitecture';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminIndustriesTab() {
  const { toast } = useToast();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    parent_id: 'none',
    type: 'industry' as 'industry' | 'niche' | 'sub_niche'
  });

  useEffect(() => {
    fetchIndustries();
  }, []);

  const fetchIndustries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('industries').select('*').order('created_at', { ascending: true });
      if (error) {
        // Fallback or ignore if table doesn't exist yet (before migration runs)
        console.error(error);
        return;
      }
      setIndustries(data || []);
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
      const parentId = formData.parent_id === 'none' ? null : formData.parent_id;
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
      
      const { error } = await supabase.from('industries').insert([{
        name: formData.name,
        slug: slug,
        parent_id: parentId,
        type: formData.type
      }]);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Added successfully.' });
      setFormData({ name: '', parent_id: 'none', type: 'industry' });
      fetchIndustries();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure? This will delete all children as well.')) return;
    
    try {
      const { error } = await supabase.from('industries').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted' });
      fetchIndustries();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const renderTree = (parentId: string | null = null, depth = 0) => {
    const children = industries.filter(i => i.parent_id === parentId);
    if (children.length === 0) return null;
    
    return (
      <div className={`space-y-2 ${depth > 0 ? 'ml-6 mt-2 border-l border-white/10 pl-4' : ''}`}>
        {children.map(child => (
          <div key={child.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-md hover:bg-white/[0.04]">
              <div className="flex items-center gap-2">
                {depth === 0 && <FolderTree className="w-4 h-4 text-indigo-400" />}
                {depth > 0 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                <span className="font-medium text-sm">{child.name}</span>
                <span className="text-[10px] uppercase text-muted-foreground bg-white/10 px-1.5 py-0.5 rounded">{child.type}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => handleDelete(child.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            {renderTree(child.id, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 border-white/10 bg-black/40 h-fit">
        <CardHeader>
          <CardTitle className="text-lg">Add New</CardTitle>
          <CardDescription>Create an industry, niche, or sub-niche.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={formData.type} onValueChange={(v: any) => setFormData(prev => ({ ...prev, type: v, parent_id: v === 'industry' ? 'none' : prev.parent_id }))}>
              <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="industry">Industry</SelectItem>
                <SelectItem value="niche">Niche</SelectItem>
                <SelectItem value="sub_niche">Sub-Niche</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {(formData.type === 'niche' || formData.type === 'sub_niche') && (
            <div className="space-y-2">
              <Label>Parent</Label>
              <Select value={formData.parent_id} onValueChange={(v) => setFormData(prev => ({ ...prev, parent_id: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select Parent" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- None --</SelectItem>
                  {industries.filter(i => formData.type === 'niche' ? i.type === 'industry' : i.type === 'niche').map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Name</Label>
            <Input 
              placeholder="e.g. Construction" 
              className="bg-white/5 border-white/10"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          <Button onClick={handleAdd} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Add
          </Button>
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-2 border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="text-lg">Hierarchy</CardTitle>
          <CardDescription>Manage the industry taxonomy tree.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && industries.length === 0 ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : industries.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border border-dashed border-white/10 rounded-lg">No industries found. Add one to get started.</div>
          ) : (
            <div className="space-y-2">
              {renderTree(null, 0)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
