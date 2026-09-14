import React, { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ScoreRebuildService } from "@/services/intelligence/admin/ScoreRebuildService";
import { Loader2, RefreshCcw, DatabaseZap } from "lucide-react";

const AdminRebuildCenter = () => {
  const { toast } = useToast();
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleBulkRebuild = async () => {
    try {
      setIsRebuilding(true);
      setResult(null);
      const res = await ScoreRebuildService.rebuildAll();
      setResult(res);
      toast({ title: "Bulk Rebuild Complete", description: `Success: ${res.success}, Failed: ${res.failed}` });
    } catch (err: any) {
      toast({ title: "Error rebuilding", description: err.message, variant: "destructive" });
    } finally {
      setIsRebuilding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DatabaseZap className="h-8 w-8 text-orange-600" />
            Opportunity Rebuild Center
          </h1>
          <p className="text-gray-500 mt-2">Trigger platform-wide score recalculations.</p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Bulk Rebuild All Master Scores</CardTitle>
            <CardDescription>
              This action will iterate through every generated opportunity score in the database, re-fetch the frozen feature snapshots, apply the latest formulas and vertical weights, and generate new history/audit logs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-md mb-6 text-sm">
              <strong>Warning:</strong> In a production environment with millions of records, this operation is highly resource-intensive and should be offloaded to background workers. For this MVP, it processes synchronously.
            </div>

            <Button onClick={handleBulkRebuild} disabled={isRebuilding} className="w-full h-12 text-lg">
              {isRebuilding ? <Loader2 className="h-6 w-6 mr-2 animate-spin" /> : <RefreshCcw className="h-6 w-6 mr-2" />}
              {isRebuilding ? "Processing Rebuild..." : "Start Full System Rebuild"}
            </Button>

            {result && (
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-gray-100 p-4 rounded text-center">
                  <div className="text-2xl font-bold text-gray-800">{result.total}</div>
                  <div className="text-xs text-gray-500 uppercase">Processed</div>
                </div>
                <div className="bg-green-100 p-4 rounded text-center">
                  <div className="text-2xl font-bold text-green-800">{result.success}</div>
                  <div className="text-xs text-green-600 uppercase">Success</div>
                </div>
                <div className="bg-red-100 p-4 rounded text-center">
                  <div className="text-2xl font-bold text-red-800">{result.failed}</div>
                  <div className="text-xs text-red-600 uppercase">Failed</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AdminRebuildCenter;
