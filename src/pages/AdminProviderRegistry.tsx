import React, { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ProviderRegistryService, SignalProvider } from "@/services/intelligence/providers/ProviderRegistryService";
import { ConnectorManager } from "@/services/intelligence/providers/ConnectorManager";
import { Loader2, Plus, RefreshCw, Server, AlertCircle } from "lucide-react";

const AdminProviderRegistry = () => {
  const { toast } = useToast();
  const [providers, setProviders] = useState<SignalProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setIsLoading(true);
      const data = await ProviderRegistryService.getProviders();
      setProviders(data);
    } catch (err: any) {
      toast({ title: "Error loading providers", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (id: string, is_enabled: boolean) => {
    try {
      await ProviderRegistryService.toggleProvider(id, is_enabled);
      setProviders(providers.map(p => p.id === id ? { ...p, is_enabled } : p));
      toast({ title: "Provider updated", description: `Provider is now ${is_enabled ? 'enabled' : 'disabled'}` });
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  const handleRunSync = async (id: string) => {
    try {
      setIsSyncing(id);
      await ConnectorManager.runSync(id);
      toast({ title: "Sync Complete", description: "Provider sync finished successfully." });
      await loadProviders();
    } catch (err: any) {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
      await loadProviders(); // Refresh to see error status
    } finally {
      setIsSyncing(null);
    }
  };

  const handleCreateMockProvider = async () => {
    try {
      await ProviderRegistryService.registerProvider({
        name: `Gov Tender API ${Math.floor(Math.random() * 1000)}`,
        provider_type: 'mock_government_tender',
        category: 'Tender Providers',
        auth_method: 'api_key',
        sync_frequency: 'manual',
        is_enabled: true
      });
      loadProviders();
      toast({ title: "Success", description: "Mock Provider created." });
    } catch (err: any) {
      toast({ title: "Creation failed", description: err.message, variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Server className="h-8 w-8 text-indigo-600" />
              Provider Registry
            </h1>
            <p className="text-gray-500 mt-2">Manage external signal data providers, APIs, and sync schedules.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadProviders} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button onClick={handleCreateMockProvider}>
              <Plus className="mr-2 h-4 w-4" /> Add Mock Provider
            </Button>
          </div>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                    </TableCell>
                  </TableRow>
                ) : providers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                      No providers registered. Click "Add Mock Provider" to begin.
                    </TableCell>
                  </TableRow>
                ) : (
                  providers.map(p => (
                    <TableRow key={p.id} className={!p.is_enabled ? 'opacity-60 bg-gray-50' : ''}>
                      <TableCell>
                        <Switch 
                          checked={p.is_enabled} 
                          onCheckedChange={(c) => handleToggle(p.id, c)} 
                        />
                      </TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell className="font-mono text-xs text-gray-500">{p.provider_type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            p.health_status === 'healthy' ? 'bg-green-500' :
                            p.health_status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <span className="text-sm capitalize">{p.health_status}</span>
                          {p.error_count > 0 && (
                            <Badge variant="destructive" className="ml-1 text-[10px]">
                              {p.error_count} errors
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {p.last_sync ? new Date(p.last_sync).toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          disabled={!p.is_enabled || isSyncing === p.id}
                          onClick={() => handleRunSync(p.id)}
                        >
                          {isSyncing === p.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-1" />
                          )}
                          Run Sync
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AdminProviderRegistry;
