import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminFormBuilderTab() {
  const { toast } = useToast();
  const [industries, setIndustries] = useState<any[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddingField, setIsAddingField] = useState(false);
  const [newField, setNewField] = useState({
    field_name: "",
    field_label: "",
    field_type: "text",
    required: false,
    placeholder: "",
    section_name: "General",
    display_order: 0
  });

  useEffect(() => {
    fetchIndustries();
  }, []);

  useEffect(() => {
    if (selectedIndustry) {
      fetchFields(selectedIndustry);
    } else {
      setFields([]);
    }
  }, [selectedIndustry]);

  const fetchIndustries = async () => {
    try {
      const { data, error } = await supabase.from('industries').select('*').order('name');
      if (error) throw error;
      setIndustries(data || []);
      if (data && data.length > 0) {
        setSelectedIndustry(data[0].id);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchFields = async (industryId: string) => {
    try {
      const { data, error } = await supabase
        .from('industry_fields')
        .select('*')
        .eq('industry_id', industryId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      setFields(data || []);
    } catch (err: any) {
      toast({ title: "Error fetching fields", description: err.message, variant: "destructive" });
    }
  };

  const handleAddField = async () => {
    if (!selectedIndustry) return;
    try {
      const { error } = await supabase.from('industry_fields').insert({
        ...newField,
        industry_id: selectedIndustry,
        display_order: fields.length
      });
      if (error) throw error;
      
      toast({ title: "Success", description: "Field added successfully." });
      setIsAddingField(false);
      fetchFields(selectedIndustry);
    } catch (err: any) {
      toast({ title: "Error adding field", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteField = async (id: string) => {
    if (!confirm("Are you sure? This may affect existing leads if they rely on this field.")) return;
    try {
      const { error } = await supabase.from('industry_fields').delete().eq('id', id);
      if (error) throw error;
      
      toast({ title: "Deleted", description: "Field removed successfully." });
      if (selectedIndustry) fetchFields(selectedIndustry);
    } catch (err: any) {
      toast({ title: "Error deleting field", description: err.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-6 h-6" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Industry Form Builder</h2>
        <div className="flex gap-4 items-center w-64">
          <Label>Industry</Label>
          <Select value={selectedIndustry || undefined} onValueChange={setSelectedIndustry}>
            <SelectTrigger>
              <SelectValue placeholder="Select Industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map(ind => (
                <SelectItem key={ind.id} value={ind.id}>{ind.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedIndustry && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddingField} onOpenChange={setIsAddingField}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Field</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Field</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Field Name (internal key, e.g. project_stage)</Label>
                    <Input value={newField.field_name} onChange={e => setNewField({...newField, field_name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')})} placeholder="project_stage" />
                  </div>
                  <div className="space-y-2">
                    <Label>Field Label (Display name)</Label>
                    <Input value={newField.field_label} onChange={e => setNewField({...newField, field_label: e.target.value})} placeholder="Project Stage" />
                  </div>
                  <div className="space-y-2">
                    <Label>Section Name (UI grouping)</Label>
                    <Input value={newField.section_name} onChange={e => setNewField({...newField, section_name: e.target.value})} placeholder="General" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Field Type</Label>
                      <Select value={newField.field_type} onValueChange={(v) => setNewField({...newField, field_type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="textarea">Textarea</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                          <SelectItem value="dropdown">Dropdown</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Placeholder</Label>
                      <Input value={newField.placeholder} onChange={e => setNewField({...newField, placeholder: e.target.value})} placeholder="Enter value..." />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="required" checked={newField.required} onCheckedChange={(c: boolean) => setNewField({...newField, required: c})} />
                    <Label htmlFor="required">Required Field</Label>
                  </div>
                  <Button className="w-full" onClick={handleAddField}>Save Field</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border border-white/10 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Internal Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No fields configured for this industry.
                    </TableCell>
                  </TableRow>
                ) : (
                  fields.map(field => (
                    <TableRow key={field.id}>
                      <TableCell><GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" /></TableCell>
                      <TableCell className="font-medium">{field.field_label}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{field.field_name}</TableCell>
                      <TableCell><span className="bg-white/10 px-2 py-1 rounded text-xs">{field.field_type}</span></TableCell>
                      <TableCell>{field.section_name || 'General'}</TableCell>
                      <TableCell>{field.required ? 'Yes' : 'No'}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteField(field.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
