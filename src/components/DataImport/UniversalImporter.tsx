import React, { useState } from 'react';
import Papa from 'papaparse';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { detectAndMapFields, processMappedRow, CsvRow } from '@/lib/importPipeline';
import { UploadCloud, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const PIPELINE_STEPS = [
  "Upload CSV",
  "Field Detection",
  "Auto Mapping",
  "Duplicate Detection",
  "Company Merge",
  "Module Creation",
  "Evidence Assignment",
  "Verification",
  "Scoring",
  "Marketplace Sync",
  "Search Index",
  "CRM Assignment"
];

export function UniversalImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ total: 0, processed: 0, failed: 0 });
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const startImport = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setCurrentStep(1); // Moving to Field Detection

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as CsvRow[];
        setStats(prev => ({ ...prev, total: rows.length }));
        
        // Simulating the rapid early pipeline steps for UI feedback
        for (let i = 1; i <= 3; i++) {
          setCurrentStep(i);
          await new Promise(r => setTimeout(r, 600));
        }

        let processed = 0;
        let failed = 0;

        for (const row of rows) {
          // Field Detection & Auto Mapping
          const mappedRow = detectAndMapFields(row);
          
          // Execute the actual pipeline (Steps 4-12 handled inside or async via DB triggers)
          setCurrentStep(Math.min(4 + Math.floor((processed / rows.length) * 8), 11));
          setProgress((processed / rows.length) * 100);

          const success = await processMappedRow(mappedRow);
          if (success) {
            processed++;
          } else {
            failed++;
          }
          
          setStats({ total: rows.length, processed, failed });
        }

        setProgress(100);
        setCurrentStep(12); // Completed
        setIsProcessing(false);

        toast({
          title: "Import Completed",
          description: `Successfully processed ${processed} records. ${failed} failed.`,
          variant: failed > 0 ? "destructive" : "default",
        });
      },
      error: (error) => {
        toast({
          title: "CSV Parse Error",
          description: error.message,
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border-white/10 bg-black/40 backdrop-blur-md">
      <CardHeader className="border-b border-white/5 pb-6">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <UploadCloud className="text-primary" />
          Universal Data Importer
        </CardTitle>
        <CardDescription>
          Upload standard or custom CSV files. The 12-step engine will automatically detect, map, deduplicate, and assign evidence modules to the Master Data Model.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-8 space-y-8">
        
        {/* File Selection */}
        {!isProcessing && currentStep === 0 && (
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/20 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer relative">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {file ? file.name : "Click or drag CSV to upload"}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Ensure your CSV contains basic company identifiers. Unrecognized columns will be safely appended to the Research Module.
            </p>
          </div>
        )}

        {/* Action Button */}
        {file && currentStep === 0 && (
          <div className="flex justify-end">
            <Button onClick={startImport} size="lg" className="w-full md:w-auto font-semibold">
              Initialize 12-Step Pipeline
            </Button>
          </div>
        )}

        {/* Pipeline Execution UI */}
        {(isProcessing || currentStep > 0) && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {PIPELINE_STEPS.map((stepName, index) => {
                const isActive = currentStep === index;
                const isPast = currentStep > index;
                return (
                  <div key={index} className={`p-4 rounded-lg border transition-all ${isActive ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(34,211,238,0.2)]' : isPast ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5 opacity-40'}`}>
                    <div className="flex items-center gap-3">
                      {isPast ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : isActive ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-white/20" />
                      )}
                      <span className={`text-sm font-medium ${isActive ? 'text-primary' : isPast ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {stepName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 bg-white/[0.02] p-6 rounded-xl border border-white/5">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Processing Record {stats.processed + stats.failed} of {stats.total}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
              
              <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-white/5 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Rows</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">{stats.processed}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Success</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Failed/Skipped</p>
                </div>
              </div>
            </div>

            {currentStep === 12 && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={() => { setFile(null); setCurrentStep(0); setProgress(0); setStats({total:0, processed:0, failed:0})}}>
                  Upload Another File
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
