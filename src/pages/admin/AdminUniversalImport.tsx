import React from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { UniversalImporter } from '@/components/DataImport/UniversalImporter';
import { Database, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminUniversalImport() {
  
  const handleDownloadTemplate = () => {
    const templateRows = [
      "Source_Name,Company_Legal_Name,Website,Company_Identifier,Full_Address,Primary_Industry,Main_Phone,Contact_Name,Contact_Email,Contact_Title,LinkedIn_URL,Opportunity_Title,Opportunity_Budget_USD,Opportunity_Deadline_YYYYMMDD,Product_Keywords_Comma_Separated,Additional_Notes",
      "Gov.uk Contracts,Acme Steel Corp,acmesteel.com,GB123456,123 Main St London,Manufacturing,+442071234567,Jane Doe,jane@acmesteel.com,Procurement Director,linkedin.com/company/acme,Supply of Grade A Steel,500000,2024-12-31,\"Steel, Rebar\",High Priority"
    ].join("\\n");
    
    const blob = new Blob([templateRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "JAS_Universal_Template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Database className="w-8 h-8 text-primary" />
              Master Data Injection
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Upload intelligence directly into the Universal Data Model.
            </p>
          </div>
          <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
            <Download className="w-4 h-4" /> Download CSV Template
          </Button>
        </div>

        <UniversalImporter />
        
        <div className="mt-12 bg-white/[0.02] border border-white/5 p-6 rounded-xl text-sm text-muted-foreground max-w-4xl mx-auto">
          <h4 className="text-foreground font-semibold mb-2">How it works:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Single Entity Principle:</strong> All rows map back to a central <code>MASTER_COMPANY</code>.</li>
            <li><strong>Non-Destructive:</strong> We never overwrite core identity; new data is appended as Evidence Modules.</li>
            <li><strong>Duplicate Handling:</strong> Handled automatically via Universal ID and Website Domain matching.</li>
          </ul>
        </div>
      </div>
    </SidebarLayout>
  );
}
