import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Trash2, Plus, ArrowUp, ArrowDown, Edit2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Industry, Source, TemplateField } from '@/types/importArchitecture';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'URL' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'multi_select', label: 'Multi Select' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'percentage', label: 'Percentage' }
];

const FIELD_CATEGORIES = [
  { value: 'company', label: 'Company Field' },
  { value: 'project', label: 'Project Field' },
  { value: 'custom', label: 'Custom Field' }
];

const REQUIRED_SCORING_FIELDS: TemplateField[] = [
  { name: 'Title', key: 'title', type: 'text', field_category: 'project', required: true },
  { name: 'Company Name', key: 'company_name', type: 'text', field_category: 'company', required: true },
  { name: 'Description', key: 'description', type: 'textarea', field_category: 'project', required: true },
  { name: 'Location', key: 'location', type: 'text', field_category: 'project', required: true },
  { name: 'Email', key: 'email', type: 'email', field_category: 'company', required: true },
  { name: 'Phone', key: 'phone', type: 'phone', field_category: 'company', required: true },
  { name: 'Website', key: 'website', type: 'url', field_category: 'company', required: false },
  { name: 'Budget Min', key: 'budget_min', type: 'number', field_category: 'project', required: false },
  { name: 'Budget Max', key: 'budget_max', type: 'number', field_category: 'project', required: false },
  { name: 'Google Rating', key: 'google_rating', type: 'number', field_category: 'company', required: false },
  { name: 'Google Reviews', key: 'google_reviews', type: 'number', field_category: 'company', required: false },
];

export default function AdminTemplateBuilder() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Data for selects
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  
  const [formData, setFormData] = useState({
    industry_id: '',
    niche_id: 'none',
    sub_niche_id: 'none',
    template_name: '',
    description: ''
  });
  
  const [fields, setFields] = useState<TemplateField[]>(REQUIRED_SCORING_FIELDS);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentField, setCurrentField] = useState<TemplateField>({
    name: '',
    key: '',
    type: 'text',
    field_category: 'custom',
    required: false,
    defaultValue: '',
    options: ''
  });

  useEffect(() => {
    fetchDependencies();
  }, []);

  const fetchDependencies = async () => {
    try {
      const [indRes] = await Promise.all([
        supabase.from('industries').select('*').eq('status', 'active')
      ]);
      
      if (indRes.data) setIndustries(indRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = (index: number | null = null) => {
    if (index !== null) {
      setEditingIndex(index);
      setCurrentField({ ...fields[index] });
    } else {
      setEditingIndex(null);
      setCurrentField({
        name: '',
        key: '',
        type: 'text',
        field_category: 'custom',
        required: false,
        defaultValue: '',
        options: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveField = () => {
    if (!currentField.name) {
      toast({ title: 'Missing Information', description: 'Field Name is required.', variant: 'destructive' });
      return;
    }
    
    let fieldKey = currentField.key;
    if (!fieldKey) {
      fieldKey = currentField.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    }

    const fieldToSave = { ...currentField, key: fieldKey };

    if (editingIndex !== null) {
      const updated = [...fields];
      updated[editingIndex] = fieldToSave;
      setFields(updated);
    } else {
      setFields([...fields, fieldToSave]);
    }
    setIsModalOpen(false);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newFields = [...fields];
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      setFields(newFields);
    } else if (direction === 'down' && index < fields.length - 1) {
      const newFields = [...fields];
      [newFields[index + 1], newFields[index]] = [newFields[index], newFields[index + 1]];
      setFields(newFields);
    }
  };

  const deleteField = (index: number) => {
    const fieldToDelete = fields[index];
    const isRequiredScoringField = REQUIRED_SCORING_FIELDS.some(f => f.key === fieldToDelete.key);
    
    if (isRequiredScoringField) {
      toast({ title: 'Cannot Delete Field', description: 'This field is required by the OIE scoring engine.', variant: 'destructive' });
      return;
    }

    if (window.confirm('Are you sure you want to delete this field?')) {
      const newFields = [...fields];
      newFields.splice(index, 1);
      setFields(newFields);
    }
  };

  const handleSaveTemplate = async () => {
    if (!formData.industry_id || !formData.template_name) {
      toast({ title: 'Missing Information', description: 'Industry and Template Name are required.', variant: 'destructive' });
      return;
    }

    if (fields.length === 0) {
      toast({ title: 'No Fields', description: 'Please add at least one field to the template.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('templates').insert([{
        industry_id: formData.industry_id,
        niche_id: formData.niche_id === 'none' ? null : formData.niche_id,
        sub_niche_id: formData.sub_niche_id === 'none' ? null : formData.sub_niche_id,
        template_name: formData.template_name,
        description: formData.description,
        fields_json: fields
      }]);

      if (error) throw error;
      toast({ title: 'Template Saved', description: 'The template has been successfully created.' });
      
      setFormData({ 
        industry_id: '', niche_id: 'none', sub_niche_id: 'none', template_name: '', description: '' 
      });
      setFields([]);
    } catch (err: any) {
      toast({ title: 'Error saving template', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  
  // Helpers to filter hierarchy
  const availableNiches = industries.filter(i => i.type === 'niche' && i.parent_id === formData.industry_id);
  const availableSubNiches = industries.filter(i => i.type === 'sub_niche' && i.parent_id === formData.niche_id);

  return (
    <Card className="border-white/10 bg-black/40">
      <CardHeader>
        <CardTitle>Dynamic Template Builder</CardTitle>
        <CardDescription>Design industry-specific templates that define the expected schema.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white/[0.02] rounded-lg border border-white/5">
          <div className="space-y-2">
            <Label>Industry *</Label>
            <Select value={formData.industry_id} onValueChange={(v) => setFormData(prev => ({ ...prev, industry_id: v, niche_id: 'none', sub_niche_id: 'none' }))}>
              <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select Industry..." /></SelectTrigger>
              <SelectContent>
                {industries.filter(i => i.type === 'industry').map(ind => <SelectItem key={ind.id} value={ind.id}>{ind.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Niche</Label>
            <Select value={formData.niche_id} onValueChange={(v) => setFormData(prev => ({ ...prev, niche_id: v, sub_niche_id: 'none' }))} disabled={!formData.industry_id || availableNiches.length === 0}>
              <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="-- None --" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- None --</SelectItem>
                {availableNiches.map(ind => <SelectItem key={ind.id} value={ind.id}>{ind.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Sub-Niche</Label>
            <Select value={formData.sub_niche_id} onValueChange={(v) => setFormData(prev => ({ ...prev, sub_niche_id: v }))} disabled={!formData.niche_id || formData.niche_id === 'none' || availableSubNiches.length === 0}>
              <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="-- None --" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- None --</SelectItem>
                {availableSubNiches.map(ind => <SelectItem key={ind.id} value={ind.id}>{ind.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Template Name *</Label>
            <Input 
              placeholder="e.g. Construction Tender Template" 
              className="bg-white/5 border-white/10"
              value={formData.template_name}
              onChange={e => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input 
              placeholder="Briefly describe what this template is for..."
              className="bg-white/5 border-white/10"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <h3 className="text-lg font-semibold">Template Fields</h3>
            <Button onClick={() => handleOpenModal(null)} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Add Field
            </Button>
          </div>
          
          {fields.length === 0 ? (
            <div className="text-center py-10 bg-white/5 rounded-lg border border-dashed border-white/10">
              <p className="text-muted-foreground text-sm">No fields added yet. Click "Add Field" to start building your template.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-foreground">{field.name}</span>
                      {field.required && <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Required</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Category: <span className="text-emerald-300 font-medium capitalize">{field.field_category || 'custom'}</span></span>
                      <span>Type: <span className="text-indigo-300 font-mono">{field.type}</span></span>
                      <span>Key: <span className="font-mono">{field.key}</span></span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col mr-4">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white" onClick={() => moveField(index, 'up')} disabled={index === 0}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white" onClick={() => moveField(index, 'down')} disabled={index === fields.length - 1}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button variant="outline" size="sm" className="bg-transparent border-white/10" onClick={() => handleOpenModal(index)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteField(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-white/10">
          <Button onClick={handleSaveTemplate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full md:w-auto">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Template
          </Button>
        </div>
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? 'Edit Field' : 'Add New Field'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Field Name *</Label>
              <Input 
                placeholder="e.g. Project Value" 
                value={currentField.name} 
                onChange={(e) => setCurrentField(prev => ({ ...prev, name: e.target.value }))} 
                className="bg-black border-white/10"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Field Key (Optional - Auto-generated)</Label>
              <Input 
                placeholder="e.g. project_value" 
                value={currentField.key} 
                onChange={(e) => setCurrentField(prev => ({ ...prev, key: e.target.value.toLowerCase().replace(/\s+/g, '_') }))} 
                className="bg-black border-white/10 font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground">Used as the column header in CSV and DB identifier.</p>
            </div>

            <div className="space-y-2">
              <Label>Field Category</Label>
              <Select value={currentField.field_category} onValueChange={(v: any) => setCurrentField(prev => ({ ...prev, field_category: v }))}>
                <SelectTrigger className="bg-black border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_CATEGORIES.map(fc => <SelectItem key={fc.value} value={fc.value}>{fc.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select value={currentField.type} onValueChange={(v) => setCurrentField(prev => ({ ...prev, type: v }))}>
                <SelectTrigger className="bg-black border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map(ft => <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {(currentField.type === 'dropdown' || currentField.type === 'multi_select') && (
              <div className="space-y-2">
                <Label>Options (Comma-separated)</Label>
                <Input 
                  placeholder="e.g. Active, Pending, Closed" 
                  value={currentField.options || ''} 
                  onChange={(e) => setCurrentField(prev => ({ ...prev, options: e.target.value }))} 
                  className="bg-black border-white/10"
                />
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2 border-t border-white/5">
              <Checkbox 
                id="required" 
                checked={currentField.required} 
                onCheckedChange={(checked) => setCurrentField(prev => ({ ...prev, required: !!checked }))} 
                className="border-white/20 data-[state=checked]:bg-indigo-600"
              />
              <Label htmlFor="required" className="text-sm font-medium leading-none cursor-pointer">
                Mark as Required
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="bg-transparent border-white/10 text-white hover:text-white">Cancel</Button>
            <Button onClick={handleSaveField} className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Field</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
