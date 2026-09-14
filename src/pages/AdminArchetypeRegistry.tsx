import React, { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArchetypeRegistryService } from "@/services/intelligence/mapping/ArchetypeRegistryService";
import { Loader2, Users, Plus, Building2 } from "lucide-react";

const AdminArchetypeRegistry = () => {
  const { toast } = useToast();
  const [archetypes, setArchetypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // New Archetype Form
  const [newName, setNewName] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadArchetypes();
  }, []);

  const loadArchetypes = async () => {
    try {
      setIsLoading(true);
      const data = await ArchetypeRegistryService.getArchetypes();
      setArchetypes(data);
    } catch (err: any) {
      toast({ title: "Error loading archetypes", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddArchetype = async () => {
    if (!newName.trim() || !newIndustry.trim()) {
      toast({ title: "Validation Error", description: "Name and Industry are required.", variant: "destructive" });
      return;
    }

    try {
      setIsAdding(true);
      await ArchetypeRegistryService.createArchetype({
        name: newName.trim(),
        industry: newIndustry.trim()
      });

      toast({ title: "Archetype Created" });
      setNewName("");
      setNewIndustry("");
      loadArchetypes();
    } catch (err: any) {
      toast({ title: "Failed to create archetype", description: err.message, variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-indigo-600" />
            Buyer Archetype Registry
          </h1>
          <p className="text-gray-500 mt-2">Manage the definitions of your ideal customer profiles (ICPs) for deterministic matching.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Archetype Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Register Archetype</CardTitle>
                <CardDescription>Define a new buyer persona</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Archetype Name</label>
                  <Input 
                    placeholder="e.g. Warehouse Developer" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Primary Industry</label>
                  <Input 
                    placeholder="e.g. Logistics, Manufacturing" 
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleAddArchetype}
                  disabled={isAdding}
                >
                  {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Create Archetype
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Archetype Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Archetype Catalog</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Archetype Name</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow><TableCell colSpan={3} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin"/></TableCell></TableRow>
                      ) : archetypes.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center h-24 text-gray-500">No archetypes found.</TableCell></TableRow>
                      ) : (
                        archetypes.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              {item.name}
                            </TableCell>
                            <TableCell>{item.industry}</TableCell>
                            <TableCell>
                              <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>{item.status}</Badge>
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

export default AdminArchetypeRegistry;
