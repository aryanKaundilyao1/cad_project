import React, { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Network, FileSearch, Building2, CheckCircle2, ShieldAlert } from "lucide-react";
import { Link } from "react-react-dom";
import { Button } from "@/components/ui/button";

const AdminEntityDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalCompanies: 0,
    canonicalCompanies: 0,
    totalAliases: 0,
    pendingReviews: 0,
    totalMerges: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      
      const { count: totalCompanies } = await supabase.from('companies').select('*', { count: 'exact', head: true });
      const { count: canonicalCompanies } = await supabase.from('companies').select('*', { count: 'exact', head: true }).eq('resolution_confidence', 100);
      const { count: totalAliases } = await supabase.from('company_aliases').select('*', { count: 'exact', head: true });
      const { count: pendingReviews } = await supabase.from('entity_review_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: totalMerges } = await supabase.from('entity_audit_log').select('*', { count: 'exact', head: true }).eq('action_type', 'MERGE');

      setStats({
        totalCompanies: totalCompanies || 0,
        canonicalCompanies: canonicalCompanies || 0,
        totalAliases: totalAliases || 0,
        pendingReviews: pendingReviews || 0,
        totalMerges: totalMerges || 0
      });

    } catch (err: any) {
      toast({ title: "Error loading stats", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Network className="h-8 w-8 text-indigo-600" />
            Entity Resolution Dashboard
          </h1>
          <p className="text-gray-500 mt-2">Monitor canonical entities, aliases, and manage manual reviews.</p>
        </div>

        {/* Action Bar */}
        <div className="flex gap-4 mb-8">
          <Button asChild>
            <a href="/admin/entity/review"><FileSearch className="mr-2 h-4 w-4"/> Review Queue ({stats.pendingReviews})</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/admin/intelligence/explorer"><Building2 className="mr-2 h-4 w-4"/> Company Explorer</a>
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Canonical Entities</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.canonicalCompanies}</h3>
                  <p className="text-xs text-gray-400 mt-1">out of {stats.totalCompanies} total rows</p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600"><CheckCircle2 className="h-5 w-5"/></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Aliases</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.totalAliases}</h3>
                  <p className="text-xs text-gray-400 mt-1">Variations mapped</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Network className="h-5 w-5"/></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Auto-Merges</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.totalMerges}</h3>
                  <p className="text-xs text-gray-400 mt-1">Deduplications performed</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg text-green-600"><Building2 className="h-5 w-5"/></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
                  <h3 className="text-3xl font-bold mt-2 text-yellow-600">{stats.pendingReviews}</h3>
                  <p className="text-xs text-gray-400 mt-1">Requires manual attention</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg text-yellow-600"><ShieldAlert className="h-5 w-5"/></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminEntityDashboard;
