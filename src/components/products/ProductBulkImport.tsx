import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Upload, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ProductBulkImport() {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    
    // Simulate parsing
    setTimeout(() => {
      setUploading(false);
      toast({ title: "Import Successful", description: "Successfully imported 142 products." });
    }, 2000);
  };

  return (
    <Card className="max-w-2xl mx-auto mt-10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-primary" /> Bulk Product Import</CardTitle>
        <CardDescription>Upload a CSV or Excel file to map thousands of products at once.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg border border-border">
          <div>
            <h4 className="font-medium text-sm">Download Template</h4>
            <p className="text-xs text-muted-foreground mt-1">Use this template to ensure your columns map correctly.</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> CSV Template</Button>
        </div>

        <label className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center gap-3 hover:bg-muted/30 transition-colors cursor-pointer text-muted-foreground hover:text-foreground">
          {uploading ? <Loader2 className="animate-spin h-10 w-10 text-primary" /> : <Upload className="h-10 w-10 mb-2 opacity-50" />}
          <div className="text-center">
            <span className="text-base font-semibold block text-foreground">{uploading ? 'Processing file...' : 'Click to upload or drag and drop'}</span>
            <span className="text-sm mt-1 block">CSV or XLSX (Max 10MB)</span>
          </div>
          <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </CardContent>
    </Card>
  );
}
