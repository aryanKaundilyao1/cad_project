import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FitScoreService } from "@/services/intelligence/scoring/FitScoreService";
import { FeatureSnapshotService } from "@/services/intelligence/scoring/FeatureSnapshotService";
import { Loader2, RefreshCcw, Activity, Info, Clock, CheckCircle2, ShieldAlert } from "lucide-react";

const AdminFitExplorer = () => {
  const { toast } = useToast();
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  
  const [scoreData, setScoreData] = useState<any>(null);
  const [features, setFeatures] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadDropdowns();
  }, []);

  const loadDropdowns = async () => {
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('companies').select('id, name').order('name'),
      supabase.from('products').select('id, name').order('name')
    ]);
    setCompanies(c || []);
    setProducts(p || []);
  };

  const loadData = async () => {
    if (!selectedCompanyId || !selectedProductId) return;
    try {
      setIsLoading(true);
      const [scoreRes, featRes, auditRes, histRes] = await Promise.all([
        FitScoreService.getFitScore(selectedCompanyId, selectedProductId),
        FeatureSnapshotService.getSnapshots(selectedCompanyId, selectedProductId),
        FitScoreService.getAuditLog(selectedCompanyId, selectedProductId),
        FitScoreService.getFitHistory(selectedCompanyId, selectedProductId)
      ]);
      
      setScoreData(scoreRes);
      setFeatures(featRes);
      setAuditLog(auditRes);
      setHistory(histRes);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCompanyId, selectedProductId]);

  const handleRebuild = async () => {
    if (!selectedCompanyId || !selectedProductId) return;
    try {
      setIsRebuilding(true);
      await FitScoreService.calculateFitScore(selectedCompanyId, selectedProductId, 'Admin Manual Rebuild');
      toast({ title: "Score Rebuilt Successfully" });
      await loadData();
    } catch (err: any) {
      toast({ title: "Failed to rebuild score", description: err.message, variant: "destructive" });
    } finally {
      setIsRebuilding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="h-8 w-8 text-indigo-600" />
              Fit Score Explorer
            </h1>
            <p className="text-gray-500 mt-2">Analyze firmographic fit scores, feature snapshots, reason codes, and audit logs.</p>
          </div>
          <div className="flex gap-4 items-center">
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select Company" /></SelectTrigger>
              <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select Product" /></SelectTrigger>
              <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={handleRebuild} disabled={!selectedCompanyId || !selectedProductId || isRebuilding}>
              {isRebuilding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
              Rebuild Score
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /></div>
        ) : (!selectedCompanyId || !selectedProductId) ? (
          <div className="text-center p-12 text-gray-500">Select a company and product to view the score.</div>
        ) : !scoreData ? (
          <div className="text-center p-12 text-gray-500">No score exists yet. Click Rebuild Score to calculate.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Score & Reason Codes */}
            <div className="space-y-6 lg:col-span-1">
              <Card className="bg-indigo-50 border-indigo-100">
                <CardHeader>
                  <CardTitle className="text-indigo-800 flex justify-between">
                    Fit Score
                    <Badge variant="outline" className="bg-white">{scoreData.score_version}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-6xl font-black text-indigo-600 mb-2">
                    {scoreData.fit_score} <span className="text-xl text-indigo-300">/ 25</span>
                  </div>
                  <div className="text-sm text-indigo-800 opacity-70">
                    Last calculated: {new Date(scoreData.calculated_at).toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/> Reason Codes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scoreData.score_reason_codes?.map((rc: any) => (
                      <div key={rc.id} className="flex gap-3">
                        {rc.reason_category === 'Positive' ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0"/> :
                         rc.reason_category === 'Negative' ? <ShieldAlert className="h-5 w-5 text-red-500 shrink-0"/> :
                         <Info className="h-5 w-5 text-gray-400 shrink-0"/>}
                        <div>
                          <div className="text-sm font-medium">{rc.reason_text}</div>
                          <div className="text-xs text-gray-500 capitalize">{rc.reason_type} • +{rc.contribution_value} pts</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Middle Column: Feature Snapshots */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Feature Snapshot</CardTitle>
                  <CardDescription>The frozen firmographic data used to calculate the current score.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Feature Key</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Version</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {features.map((f: any) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-medium text-xs font-mono">{f.feature_key}</TableCell>
                          <TableCell className="text-sm">
                            {typeof f.feature_value === 'object' && f.feature_value !== null 
                              ? JSON.stringify(f.feature_value) 
                              : (f.feature_value || <span className="text-gray-400 italic">null</span>)}
                          </TableCell>
                          <TableCell><Badge variant="secondary">v{f.feature_version}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Audit Log */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5"/> Audit & History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Trigger</TableHead>
                        <TableHead>Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLog.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</TableCell>
                          <TableCell className="text-sm">{log.trigger_source}</TableCell>
                          <TableCell className="text-sm">
                            {log.old_score ? `${log.old_score.fit_score} → ${log.new_score.fit_score}` : `New: ${log.new_score.fit_score}`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AdminFitExplorer;
