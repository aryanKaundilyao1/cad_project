import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Archive, Play, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminScoreVersionManager = () => {
  const [versions, setVersions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data, error } = await supabase.from('score_versions').select('*').order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setVersions(data || [{ id: '1', version: 'v1.0-master', description: 'Initial stable multi-pillar scoring formula.', status: 'active', created_at: new Date().toISOString() }]);
    } catch (err) {
      console.error(err);
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
            <Copy className="h-8 w-8 text-cyan-600" />
            Score Version Manager
          </h1>
          <p className="text-gray-500 mt-2">Manage multiple scoring formulas and versions for A/B testing or historical audits.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-24"><Loader2 className="h-12 w-12 animate-spin text-cyan-600"/></div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Deployed Formulas</CardTitle>
              <CardDescription>Only one version can be "active" at a time across the global namespace unless testing via Shadow Mode.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version Tag</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deployed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono font-medium">{v.version}</TableCell>
                      <TableCell>{v.description}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${v.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {v.status.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(v.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {v.status !== 'active' ? (
                          <Button size="sm" variant="outline"><Play className="h-4 w-4 mr-1"/> Activate</Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled><Archive className="h-4 w-4 mr-1"/> Active</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AdminScoreVersionManager;
