import React, { useState } from 'react';
import { ModuleSchemas, ModuleSchema, ModuleField } from '@/types/ModuleSchemas';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Save, UploadCloud } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdminModuleUploadFormProps {
  moduleKey: string;
  leadId?: string;
  onSubmit: (data: any) => void;
}

export const AdminModuleUploadForm: React.FC<AdminModuleUploadFormProps> = ({ moduleKey, leadId, onSubmit }) => {
  const schema: ModuleSchema = ModuleSchemas[moduleKey];
  const [formData, setFormData] = useState<Record<string, any>>({});

  if (!schema) {
    return <div className="text-red-500">Invalid Module Schema</div>;
  }

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const renderField = (field: ModuleField) => {
    const value = formData[field.id] || '';

    switch (field.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2 h-10">
            <Switch 
              checked={!!formData[field.id]} 
              onCheckedChange={(checked) => handleInputChange(field.id, checked)} 
            />
            <Label className="text-sm font-medium">{field.label}</Label>
          </div>
        );
      case 'enum':
        return (
          <div className="space-y-1">
            <Label className="text-sm font-medium">{field.label} {field.required && '*'}</Label>
            <Select onValueChange={(val) => handleInputChange(field.id, val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'number':
        return (
          <div className="space-y-1">
            <Label className="text-sm font-medium">{field.label} {field.required && '*'}</Label>
            <Input 
              type="number" 
              value={value} 
              onChange={(e) => handleInputChange(field.id, e.target.value ? Number(e.target.value) : undefined)} 
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </div>
        );
      case 'date':
        return (
          <div className="space-y-1">
            <Label className="text-sm font-medium">{field.label} {field.required && '*'}</Label>
            <Input 
              type="date" 
              value={value} 
              onChange={(e) => handleInputChange(field.id, e.target.value)} 
            />
          </div>
        );
      case 'array':
        return (
          <div className="space-y-1">
            <Label className="text-sm font-medium">{field.label} {field.required && '*'}</Label>
            <Input 
              type="text" 
              value={Array.isArray(value) ? value.join(', ') : value} 
              onChange={(e) => handleInputChange(field.id, e.target.value.split(',').map(s => s.trim()))} 
              placeholder="Comma separated values"
            />
          </div>
        );
      case 'text':
      default:
        return (
          <div className="space-y-1">
            <Label className="text-sm font-medium">{field.label} {field.required && '*'}</Label>
            <Input 
              type={field.validation === 'email' ? 'email' : field.validation === 'url' ? 'url' : 'text'} 
              value={value} 
              onChange={(e) => handleInputChange(field.id, e.target.value)} 
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </div>
        );
    }
  };

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl text-primary">{schema.name}</CardTitle>
            <CardDescription className="mt-1">{schema.description}</CardDescription>
          </div>
          <UploadCloud className="text-primary w-8 h-8 opacity-50" />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {schema.fields.map(field => (
              <div key={field.id} className="relative group">
                {renderField(field)}
                {field.scoringPillar && (
                  <Badge variant="outline" className="absolute -top-2 right-0 text-[10px] bg-background text-muted-foreground border-primary/20 group-hover:border-primary/50 transition-colors">
                    {field.scoringPillar}
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-border flex justify-end">
            <Button type="submit" className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" /> Save Module Data
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
