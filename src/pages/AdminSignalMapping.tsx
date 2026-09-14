import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SignalWeightEngine } from "@/services/intelligence/mapping/SignalWeightEngine";
import { ProductRegistryService } from "@/services/intelligence/mapping/ProductRegistryService";
import { Loader2, Link as LinkIcon, Settings, Plus, Activity } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminSignalMapping = () => {
  const { productId } = useParams<{ productId: string }>();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<any>(null);
  const [mappings, setMappings] = useState<any[]>([]);
  const [availableSignals, setAvailableSignals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mapping Form
  const [selectedSignalId, setSelectedSignalId] = useState("");
  const [selectedWeight, setSelectedWeight] = useState<"High" | "Medium" | "Low">("Medium");
  const [isMapping, setIsMapping] = useState(false);

  useEffect(() => {
    if (productId) {
      loadData(productId);
    }
  }, [productId]);

  const loadData = async (id: string) => {
    try {
      setIsLoading(true);
      
      // Load Product info
      const prod = await ProductRegistryService.getProductWithMappings(id);
      setProduct(prod);
      
      // Load existing mappings
      const maps = await SignalWeightEngine.getProductSignalMappings(id);
      setMappings(maps);

      // Load all available signals
      const { data: signals } = await supabase.from('signal_definitions').select('*').order('name');
      setAvailableSignals(signals || []);
      
    } catch (err: any) {
      toast({ title: "Error loading mappings", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapSignal = async () => {
    if (!selectedSignalId || !productId) return;
    
    try {
      setIsMapping(true);
      await SignalWeightEngine.mapSignalToProduct(
        productId,
        selectedSignalId,
        selectedWeight,
        undefined, // userId
        "Admin manual mapping"
      );
      
      toast({ title: "Mapping Updated" });
      setSelectedSignalId("");
      setSelectedWeight("Medium");
      loadData(productId);
    } catch (err: any) {
      toast({ title: "Failed to map signal", description: err.message, variant: "destructive" });
    } finally {
      setIsMapping(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <main className="flex-1 flex justify-center items-center">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link to="/admin/products" className="text-sm text-indigo-600 hover:underline mb-2 inline-block">&larr; Back to Products</Link>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <LinkIcon className="h-8 w-8 text-indigo-600" />
              Signal Mapping: {product?.name}
            </h1>
            <p className="text-gray-500 mt-2">Map universal intelligence signals to this specific product, determining their relevance weight.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
            {/* Context Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Category</span> <span className="font-medium">{product?.category}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Industry</span> <span className="font-medium">{product?.industry || 'N/A'}</span></div>
                </div>
              </CardContent>
            </Card>

            {/* Mapping Form */}
            <Card>
              <CardHeader>
                <CardTitle>Map New Signal</CardTitle>
                <CardDescription>Associate a universal signal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Signal</label>
                  <Select value={selectedSignalId} onValueChange={setSelectedSignalId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a signal..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSignals.map(sig => (
                        <SelectItem key={sig.id} value={sig.id}>{sig.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Relevance Weight</label>
                  <Select value={selectedWeight} onValueChange={(v: any) => setSelectedWeight(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High (Core indicator)</SelectItem>
                      <SelectItem value="Medium">Medium (Correlated)</SelectItem>
                      <SelectItem value="Low">Low (Contextual only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleMapSignal}
                  disabled={isMapping || !selectedSignalId}
                >
                  {isMapping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Apply Mapping
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Mapped Signals ({mappings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Signal Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Weight</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappings.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center h-24 text-gray-500">No signals mapped to this product.</TableCell></TableRow>
                    ) : (
                      mappings.map(map => (
                        <TableRow key={map.id}>
                          <TableCell className="font-medium flex items-center gap-2">
                            <Activity className="h-4 w-4 text-gray-400"/>
                            {map.signal_definitions?.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{map.signal_definitions?.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              map.weight === 'High' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                              map.weight === 'Medium' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' :
                              'bg-gray-100 text-gray-700 hover:bg-gray-100'
                            }>{map.weight}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminSignalMapping;
