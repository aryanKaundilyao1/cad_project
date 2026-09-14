import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Box, Users, Briefcase, Building2, MapPin } from 'lucide-react';

export default function AdminNormalizedViewer() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  
  const [entities, setEntities] = useState<any[]>([]);
  const [entityType, setEntityType] = useState<string>('company');
  const [entitiesLoading, setEntitiesLoading] = useState(false);

  const entityTypes = [
    { id: 'company', label: 'Companies', icon: Building2 },
    { id: 'buyer', label: 'Buyers', icon: Users },
    { id: 'project', label: 'Projects', icon: Briefcase },
    { id: 'awarder', label: 'Awarders', icon: Box },
    { id: 'location', label: 'Locations', icon: MapPin },
  ];

  useEffect(() => {
    fetchDatasets();
  }, []);

  useEffect(() => {
    if (selectedDatasetId) {
      fetchEntities();
    }
  }, [selectedDatasetId, entityType]);

  const fetchDatasets = async () => {
    try {
      const { data } = await supabase.from('industry_datasets').select('id, dataset_name');
      setDatasets(data || []);
      if (data && data.length > 0) {
        setSelectedDatasetId(data[0].id);
      }
    } catch (err: any) {
      toast({ title: 'Error loading datasets', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchEntities = async () => {
    setEntitiesLoading(true);
    try {
      // We first need the dataset_record_ids for the selected dataset
      const { data: records } = await supabase
        .from('dataset_records')
        .select('id')
        .eq('dataset_id', selectedDatasetId);
        
      if (!records || records.length === 0) {
        setEntities([]);
        return;
      }
      
      const recordIds = records.map(r => r.id);
      
      // Fetch entities linked to these records
      const { data: entityData } = await supabase
        .from('normalized_entities')
        .select(`
          *,
          entity_attributes(attribute_name, attribute_value)
        `)
        .in('dataset_record_id', recordIds)
        .eq('entity_type', entityType)
        .limit(100); // Limit for performance

      setEntities(entityData || []);
    } catch (err: any) {
      toast({ title: 'Error loading entities', description: err.message, variant: 'destructive' });
    } finally {
      setEntitiesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle>Normalized Data Viewer</CardTitle>
          <CardDescription>View standardized semantic entities extracted from raw dataset records.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <select 
              className="bg-black/50 border border-white/10 text-white rounded p-2"
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
            >
              {datasets.map(d => (
                <option key={d.id} value={d.id}>{d.dataset_name}</option>
              ))}
            </select>
            
            <div className="flex gap-2 bg-black/50 border border-white/10 rounded p-1">
              {entityTypes.map(type => (
                <Button
                  key={type.id}
                  variant={entityType === type.id ? 'secondary' : 'ghost'}
                  className={entityType === type.id ? 'bg-indigo-600 hover:bg-indigo-700' : 'hover:bg-white/10'}
                  onClick={() => setEntityType(type.id)}
                >
                  <type.icon className="w-4 h-4 mr-2" /> {type.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="border border-white/10 rounded overflow-hidden">
            <Table>
              <TableHeader className="bg-black/40">
                <TableRow className="border-white/10">
                  <TableHead className="text-white">Name</TableHead>
                  <TableHead className="text-white">Contact</TableHead>
                  <TableHead className="text-white">Location / Details</TableHead>
                  <TableHead className="text-white">Custom Attributes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entitiesLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : entities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      No {entityType} entities found in this dataset. Run normalization first.
                    </TableCell>
                  </TableRow>
                ) : (
                  entities.map(entity => (
                    <TableRow key={entity.id} className="border-white/5">
                      <TableCell className="font-medium text-white">{entity.name || '-'}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {entity.phone && <div>{entity.phone}</div>}
                          {entity.email && <div className="text-muted-foreground">{entity.email}</div>}
                          {!entity.phone && !entity.email && '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {entityType === 'project' ? (
                            <>
                              {entity.budget && <div>Budget: {entity.budget}</div>}
                              {entity.project_type && <div>Type: {entity.project_type}</div>}
                            </>
                          ) : (
                            <>
                              {entity.city && <div>{entity.city}{entity.state ? `, ${entity.state}` : ''}</div>}
                              {entity.website && <div>{entity.website}</div>}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {entity.entity_attributes?.map((attr: any) => (
                            <span key={attr.attribute_name} className="px-2 py-1 bg-white/10 text-xs rounded" title={attr.attribute_value}>
                              {attr.attribute_name}
                            </span>
                          ))}
                          {(!entity.entity_attributes || entity.entity_attributes.length === 0) && '-'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
