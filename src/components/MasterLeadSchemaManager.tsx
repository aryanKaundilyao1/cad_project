import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, MapPin, Download, Upload, ShieldCheck, FileSpreadsheet, Lock } from 'lucide-react';
import { ModuleSchemas } from '@/types/ModuleSchemas';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AdminModuleUploadForm } from './AdminModuleUploadForm';

const GOOGLE_MAPS_FIELDS = [
  { id: 'place_id', type: 'text', req: false, score: false, pillar: null },
  { id: 'name', type: 'text', req: true, score: true, pillar: 'Fit Score' },
  { id: 'description', type: 'text', req: false, score: false, pillar: null },
  { id: 'is_spending_on_ads', type: 'boolean', req: false, score: true, pillar: 'Intent Score' },
  { id: 'reviews', type: 'number', req: false, score: true, pillar: 'Reputation Score' },
  { id: 'rating', type: 'number', req: false, score: true, pillar: 'Trust Score' },
  { id: 'competitors', type: 'jsonb', req: false, score: false, pillar: null },
  { id: 'website', type: 'text', req: false, score: true, pillar: 'Trust Score' },
  { id: 'phone', type: 'text', req: false, score: true, pillar: 'Contactability' },
  { id: 'can_claim', type: 'boolean', req: false, score: false, pillar: null },
  { id: 'owner_name', type: 'text', req: false, score: false, pillar: null },
  { id: 'owner_profile_link', type: 'text', req: false, score: false, pillar: null },
  { id: 'featured_image', type: 'text', req: false, score: false, pillar: null },
  { id: 'main_category', type: 'text', req: false, score: true, pillar: 'Fit Score' },
  { id: 'categories', type: 'text[]', req: false, score: false, pillar: null },
  { id: 'workday_timing', type: 'text', req: false, score: false, pillar: null },
  { id: 'is_temporarily_closed', type: 'boolean', req: false, score: true, pillar: 'Qualification' },
  { id: 'closed_on', type: 'text', req: false, score: false, pillar: null },
  { id: 'address', type: 'text', req: false, score: false, pillar: null },
  { id: 'review_keywords', type: 'jsonb', req: false, score: false, pillar: null },
  { id: 'link', type: 'text', req: false, score: false, pillar: null },
  { id: 'query', type: 'text', req: false, score: false, pillar: null },
];

export default function MasterLeadSchemaManager() {
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const handleManualUploadSubmit = (data: any) => {
    console.log("Saving module data natively:", data);
    // Stub for saving data to backend
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Database className="w-6 h-6 text-indigo-400" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Master Lead Schema Manager</h2>
          <p className="text-sm text-muted-foreground">Permanent unified intelligence contract for JAS CONNECT</p>
        </div>
      </div>

      {/* BASE INTELLIGENCE */}
      <Card className="border-emerald-500/20 shadow-md">
        <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-500" />
              <div>
                <CardTitle className="text-emerald-500">Google Maps Base Intelligence</CardTitle>
                <CardDescription>Default Permanent Schema — Mapped natively to `public.leads`</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-500 text-emerald-500 gap-1">
              <Lock className="w-3 h-3" /> Protected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Backend Field</th>
                  <th className="px-4 py-3 font-medium">Data Type</th>
                  <th className="px-4 py-3 font-medium">Required</th>
                  <th className="px-4 py-3 font-medium">Used in Scoring</th>
                  <th className="px-4 py-3 font-medium">Scoring Pillar</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {GOOGLE_MAPS_FIELDS.map(f => (
                  <tr key={f.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs text-primary">{f.id}</td>
                    <td className="px-4 py-3"><Badge variant="secondary" className="text-[10px]">{f.type}</Badge></td>
                    <td className="px-4 py-3">{f.req ? <span className="text-rose-400 font-medium">Yes</span> : 'No'}</td>
                    <td className="px-4 py-3">{f.score ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{f.pillar || '-'}</td>
                    <td className="px-4 py-3">Google Maps</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* RESEARCH MODULES */}
      <div className="pt-4 pb-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          Research Modules <Badge variant="secondary">{Object.keys(ModuleSchemas).length} Configured</Badge>
        </h3>
        <p className="text-sm text-muted-foreground">Dynamically appended to the Master Lead via `lead_modules`</p>
      </div>

      <Accordion type="single" collapsible className="space-y-4" onValueChange={setActiveModule}>
        {Object.values(ModuleSchemas).map(schema => (
          <AccordionItem value={schema.id} key={schema.id} className="border rounded-xl bg-card overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30">
              <div className="flex flex-col text-left">
                <span className="font-semibold text-primary">{schema.name}</span>
                <span className="text-sm text-muted-foreground font-normal">{schema.description}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0">
              <div className="border-t border-border">
                <div className="bg-muted/20 p-4 flex gap-3 justify-end border-b border-border">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" /> Download Template
                  </Button>
                  <Button size="sm" className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" /> Upload Excel
                  </Button>
                </div>
                
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground sticky top-0 backdrop-blur-md z-10">
                      <tr>
                        <th className="px-4 py-3 font-medium">Backend Field</th>
                        <th className="px-4 py-3 font-medium">Data Type</th>
                        <th className="px-4 py-3 font-medium">Required</th>
                        <th className="px-4 py-3 font-medium">Used in Scoring</th>
                        <th className="px-4 py-3 font-medium">Scoring Pillar</th>
                        <th className="px-4 py-3 font-medium">Validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {schema.fields.map(f => (
                        <tr key={f.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium">{f.label}</span>
                              <span className="font-mono text-[10px] text-muted-foreground">{f.id}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3"><Badge variant="secondary" className="text-[10px]">{f.type}</Badge></td>
                          <td className="px-4 py-3">{f.required ? <span className="text-rose-400 font-medium">Yes</span> : 'No'}</td>
                          <td className="px-4 py-3">{f.scoringPillar ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : '-'}</td>
                          <td className="px-4 py-3 text-muted-foreground">{f.scoringPillar || '-'}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{f.validation || f.options?.join(', ') || 'None'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* DYNAMIC FORM PREVIEW */}
                <div className="p-6 bg-muted/10 border-t border-border">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Manual Entry Form Preview
                  </h4>
                  <AdminModuleUploadForm 
                    moduleKey={Object.keys(ModuleSchemas).find(k => ModuleSchemas[k].id === schema.id) || ''} 
                    onSubmit={handleManualUploadSubmit} 
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
