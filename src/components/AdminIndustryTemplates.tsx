import React, { useState } from 'react';
import { LayoutTemplate, Briefcase, Plus, Upload, BarChart, Database, Network, Search, PlayCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import AdminTemplateBuilder from './AdminTemplateBuilder';
import AdminTemplateUpload from './AdminTemplateUpload';
import AdminDataViewerTab from './AdminDataViewerTab';
import AdminResultViewTab from './AdminResultViewTab';
import MasterLeadSchemaManager from './MasterLeadSchemaManager';

export default function AdminIndustryTemplates() {
  const [activeTab, setActiveTab] = useState('master-schema');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <LayoutTemplate className="w-6 h-6 text-indigo-400" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Ingestion Workflow Engine</h2>
          <p className="text-sm text-muted-foreground">End-to-end pipeline: Map Templates → Upload Data → Run Intelligence → Publish</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/5 border border-white/10 flex w-full overflow-x-auto scrollbar-hide h-12 rounded-xl">
          <TabsTrigger value="master-schema" className="flex-1 min-w-[150px] rounded-lg gap-2"><Database className="w-4 h-4"/> 1. Master Lead Schema</TabsTrigger>
          <TabsTrigger value="upload" className="flex-1 min-w-[150px] rounded-lg gap-2"><Upload className="w-4 h-4"/> 2. Upload Dataset</TabsTrigger>
          <TabsTrigger value="viewer" className="flex-1 min-w-[150px] rounded-lg gap-2"><Search className="w-4 h-4"/> 3. Raw Data & Engine</TabsTrigger>
          <TabsTrigger value="result" className="flex-1 min-w-[150px] rounded-lg gap-2"><PlayCircle className="w-4 h-4"/> 4. Results & Publish</TabsTrigger>
          <TabsTrigger value="advanced" className="flex-1 min-w-[150px] rounded-lg gap-2"><Plus className="w-4 h-4"/> Advanced / Custom</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="master-schema" className="mt-0">
            <MasterLeadSchemaManager />
          </TabsContent>

          <TabsContent value="advanced" className="mt-0">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-amber-500">Legacy Template Builder</h3>
              <p className="text-sm text-muted-foreground">Used for building custom one-off scraper schemas not mapped to the Master Lead ontology.</p>
            </div>
            <AdminTemplateBuilder />
          </TabsContent>

          <TabsContent value="upload" className="mt-0">
            <AdminTemplateUpload />
          </TabsContent>
          
          <TabsContent value="viewer" className="mt-0">
            <AdminDataViewerTab onRunCoifComplete={() => setActiveTab('result')} />
          </TabsContent>

          <TabsContent value="result" className="mt-0">
            <AdminResultViewTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
