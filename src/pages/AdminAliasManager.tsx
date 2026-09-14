import React, { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trash2, Plus, Network, Search } from "lucide-react";

const AdminAliasManager = () => {
  const { toast } = useToast();
  const [aliases, setAliases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // For adding a new alias
  const [newAlias, setNewAlias] = useState("");
  const [targetCompanyId, setTargetCompanyId] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadAliases();
  }, []);

  const loadAliases = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('company_aliases')
        .select('*, companies(id, name)')
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (error) throw error;
      setAliases(data || []);
    } catch (err: any) {
      toast({ title: "Error loading aliases", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAlias = async () => {
    if (!newAlias.trim() || !targetCompanyId.trim()) {
      toast({ title: "Validation Error", description: "Alias name and Target Company ID are required.", variant: "destructive" });
      return;
    }

    try {
      setIsAdding(true);
      const { error } = await supabase.from('company_aliases').insert({
        company_id: targetCompanyId.trim(),
        alias_name: newAlias.trim(),
        source: 'manual_admin'
      });

      if (error) throw error;

      toast({ title: "Alias Added Successfully" });
      setNewAlias("");
      setTargetCompanyId("");
      loadAliases();
    } catch (err: any) {
      toast({ title: "Failed to add alias", description: err.message, variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('company_aliases').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Alias Removed" });
      setAliases(aliases.filter(a => a.id !== id));
    } catch (err: any) {
      toast({ title: "Failed to remove alias", description: err.message, variant: "destructive" });
    }
  };

  const filteredAliases = aliases.filter(a => 
    a.alias_name.toLowerCase().includes(search.toLowerCase()) || 
    a.companies?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Network className="h-8 w-8 text-indigo-600" />
            Global Alias Manager
          </h1>
          <p className="text-gray-500 mt-2">Manage entity variations mapped to canonical companies.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Alias Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Add Manual Alias</CardTitle>
                <CardDescription>Force a string to map to a canonical ID</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Alias Name</label>
                  <Input 
                    placeholder="e.g. ABC Metalworks" 
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Canonical Company ID (UUID)</label>
                  <Input 
                    placeholder="UUID of canonical company" 
                    value={targetCompanyId}
                    onChange={(e) => setTargetCompanyId(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleAddAlias}
                  disabled={isAdding}
                >
                  {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Add Mapping
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Alias Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Existing Mappings</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Search aliases..." 
                      className="pl-8"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alias</TableHead>
                        <TableHead>Canonical Target</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin"/></TableCell></TableRow>
                      ) : filteredAliases.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center h-24 text-gray-500">No aliases found.</TableCell></TableRow>
                      ) : (
                        filteredAliases.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.alias_name}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm">{item.companies?.name}</span>
                                <span className="text-[10px] text-gray-400 font-mono">{item.company_id}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded border text-gray-600">{item.source}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminAliasManager;
