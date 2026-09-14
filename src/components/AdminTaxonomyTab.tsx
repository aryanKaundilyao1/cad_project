import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Plus, Trash2, Edit, Save, X, Building2, Tag,
  MapPin, Target, Users, ChevronDown, ChevronUp
} from 'lucide-react';
import type { Industry, Subcategory, TargetAudience, TargetGeography, IdealLeadType } from '@/types/intelligence';

const AdminTaxonomyTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [audiences, setAudiences] = useState<TargetAudience[]>([]);
  const [geographies, setGeographies] = useState<TargetGeography[]>([]);
  const [leadTypes, setLeadTypes] = useState<IdealLeadType[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  const [newItem, setNewItem] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [newSubcat, setNewSubcat] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newTagCategory, setNewTagCategory] = useState('general');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [indRes, subRes, audRes, geoRes, ltRes, tagRes] = await Promise.all([
        (supabase as any).from('industries').select('*').order('display_order'),
        (supabase as any).from('subcategories').select('*').order('display_order'),
        (supabase as any).from('target_audiences').select('*').order('display_order'),
        (supabase as any).from('target_geographies').select('*').order('display_order'),
        (supabase as any).from('ideal_lead_types').select('*').order('display_order'),
        (supabase as any).from('tags').select('*').order('name'),
      ]);
      setIndustries(indRes.data || []);
      setSubcategories(subRes.data || []);
      setAudiences(audRes.data || []);
      setGeographies(geoRes.data || []);
      setLeadTypes(ltRes.data || []);
      setTags(tagRes.data || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const addIndustry = async () => {
    if (!newItem.trim()) return;
    const { error } = await (supabase as any).from('industries').insert({
      name: newItem.trim(), slug: slugify(newItem), display_order: industries.length + 1
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Industry added' });
    setNewItem('');
    fetchAll();
  };

  const addSubcategory = async () => {
    if (!newSubcat.trim() || !selectedIndustry) return;
    const { error } = await (supabase as any).from('subcategories').insert({
      industry_id: selectedIndustry, name: newSubcat.trim(), slug: slugify(newSubcat),
      display_order: subcategories.filter(s => s.industry_id === selectedIndustry).length + 1
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Subcategory added' });
    setNewSubcat('');
    fetchAll();
  };

  const addTag = async () => {
    if (!newTag.trim()) return;
    const { error } = await (supabase as any).from('tags').insert({
      name: newTag.trim(), slug: slugify(newTag), category: newTagCategory
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Tag added' });
    setNewTag('');
    fetchAll();
  };

  const addSimpleItem = async (table: string, name: string) => {
    if (!name.trim()) return;
    const { error } = await (supabase as any).from(table).insert({
      name: name.trim(), slug: slugify(name), display_order: 0
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Added successfully' });
    setNewItem('');
    fetchAll();
  };

  const toggleActive = async (table: string, id: string, currentState: boolean) => {
    const { error } = await (supabase as any).from(table).update({ is_active: !currentState }).eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    fetchAll();
  };

  const deleteItem = async (table: string, id: string) => {
    const { error } = await (supabase as any).from(table).delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Deleted' });
    fetchAll();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" /> Taxonomy Manager
        </h2>
        <p className="text-sm text-muted-foreground">Manage industries, subcategories, tags, audiences, geographies, and lead types.</p>
      </div>

      <Tabs defaultValue="industries" className="w-full">
        <TabsList className="bg-white/[0.03] border border-white/[0.06] h-10 rounded-xl flex-wrap">
          <TabsTrigger value="industries" className="rounded-lg text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Industries ({industries.length})</TabsTrigger>
          <TabsTrigger value="subcategories" className="rounded-lg text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Subcategories ({subcategories.length})</TabsTrigger>
          <TabsTrigger value="tags" className="rounded-lg text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Tags ({tags.length})</TabsTrigger>
          <TabsTrigger value="audiences" className="rounded-lg text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Audiences ({audiences.length})</TabsTrigger>
          <TabsTrigger value="geographies" className="rounded-lg text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Geographies ({geographies.length})</TabsTrigger>
          <TabsTrigger value="leadtypes" className="rounded-lg text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Lead Types ({leadTypes.length})</TabsTrigger>
        </TabsList>

        {/* INDUSTRIES */}
        <TabsContent value="industries" className="space-y-4">
          <Card className="bg-card/40 border-white/5">
            <CardContent className="p-4">
              <div className="flex gap-2 mb-4">
                <Input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="New industry name..." className="bg-white/[0.03] border-white/[0.08]" onKeyDown={e => e.key === 'Enter' && addIndustry()} />
                <Button size="sm" onClick={addIndustry} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add</Button>
              </div>
              <div className="space-y-1">
                {industries.map(ind => (
                  <div key={ind.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: ind.color }} />
                      <span className={`text-sm font-medium ${ind.is_active ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{ind.name}</span>
                      <Badge variant="secondary" className="text-[10px]">{ind.slug}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleActive('industries', ind.id, ind.is_active)}>
                        {ind.is_active ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteItem('industries', ind.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUBCATEGORIES */}
        <TabsContent value="subcategories" className="space-y-4">
          <Card className="bg-card/40 border-white/5">
            <CardContent className="p-4">
              <div className="flex gap-2 mb-4">
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger className="w-48 bg-white/[0.03] border-white/[0.08]"><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>{industries.map(ind => <SelectItem key={ind.id} value={ind.id}>{ind.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input value={newSubcat} onChange={e => setNewSubcat(e.target.value)} placeholder="New subcategory..." className="bg-white/[0.03] border-white/[0.08] flex-1" onKeyDown={e => e.key === 'Enter' && addSubcategory()} />
                <Button size="sm" onClick={addSubcategory} disabled={!selectedIndustry} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add</Button>
              </div>
              {industries.map(ind => {
                const subs = subcategories.filter(s => s.industry_id === ind.id);
                if (subs.length === 0) return null;
                return (
                  <div key={ind.id} className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: ind.color }} /> {ind.name} ({subs.length})
                    </p>
                    <div className="space-y-1 ml-3">
                      {subs.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-white/[0.02]">
                          <span className={`text-sm ${sub.is_active ? '' : 'text-muted-foreground line-through'}`}>{sub.name}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => deleteItem('subcategories', sub.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAGS */}
        <TabsContent value="tags" className="space-y-4">
          <Card className="bg-card/40 border-white/5">
            <CardContent className="p-4">
              <div className="flex gap-2 mb-4">
                <Input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="New tag..." className="bg-white/[0.03] border-white/[0.08] flex-1" onKeyDown={e => e.key === 'Enter' && addTag()} />
                <Select value={newTagCategory} onValueChange={setNewTagCategory}>
                  <SelectTrigger className="w-32 bg-white/[0.03] border-white/[0.08]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['general', 'industry', 'model', 'stage', 'tech', 'service', 'material', 'budget', 'urgency', 'type'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={addTag} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag.id} variant="secondary" className="text-xs gap-1.5 pr-1 group">
                    <Tag className="h-3 w-3" /> {tag.name}
                    <span className="text-[9px] text-muted-foreground">({tag.category})</span>
                    <button onClick={() => deleteItem('tags', tag.id)} className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUDIENCES */}
        <TabsContent value="audiences">
          <SimpleListManager items={audiences} table="target_audiences" onRefresh={fetchAll} icon={<Users className="h-3.5 w-3.5" />} />
        </TabsContent>

        {/* GEOGRAPHIES */}
        <TabsContent value="geographies">
          <SimpleListManager items={geographies} table="target_geographies" onRefresh={fetchAll} icon={<MapPin className="h-3.5 w-3.5" />} />
        </TabsContent>

        {/* LEAD TYPES */}
        <TabsContent value="leadtypes">
          <SimpleListManager items={leadTypes} table="ideal_lead_types" onRefresh={fetchAll} icon={<Target className="h-3.5 w-3.5" />} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/** Generic simple list CRUD component */
const SimpleListManager = ({ items, table, onRefresh, icon }: { items: any[]; table: string; onRefresh: () => void; icon: React.ReactNode }) => {
  const { toast } = useToast();
  const [newName, setNewName] = useState('');
  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const add = async () => {
    if (!newName.trim()) return;
    const { error } = await (supabase as any).from(table).insert({ name: newName.trim(), slug: slugify(newName), display_order: items.length + 1 });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Added' });
    setNewName('');
    onRefresh();
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from(table).delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Deleted' });
    onRefresh();
  };

  return (
    <Card className="bg-card/40 border-white/5">
      <CardContent className="p-4">
        <div className="flex gap-2 mb-4">
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Add new..." className="bg-white/[0.03] border-white/[0.08]" onKeyDown={e => e.key === 'Enter' && add()} />
          <Button size="sm" onClick={add} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add</Button>
        </div>
        <div className="space-y-1">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.02]">
              <span className="text-sm flex items-center gap-2">{icon} {item.name}</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => remove(item.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminTaxonomyTab;
