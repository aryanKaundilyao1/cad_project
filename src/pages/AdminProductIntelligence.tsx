import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ProductIntelligenceService, ProductIntelligenceData } from "@/services/intelligence/profile/ProductIntelligenceService";
import { Loader2, Package, Building2, Target, History } from "lucide-react";

const AdminProductIntelligence = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [data, setData] = useState<ProductIntelligenceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (productId: string) => {
    try {
      setIsLoading(true);
      const intel = await ProductIntelligenceService.getProductIntelligence(productId);
      setData(intel);
    } catch (err: any) {
      toast({ title: "Failed to load product intelligence", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
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

  if (!data || !data.product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <main className="flex-1 flex justify-center items-center">
          <div className="text-red-500 text-center">Product not found.</div>
        </main>
      </div>
    );
  }

  const { product, mappedArchetypes, mappedSignals, eligibleCompanies } = data;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link to="/admin/products" className="text-sm text-indigo-600 hover:underline mb-2 inline-block">&larr; Back to Registry</Link>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-8 w-8 text-indigo-600" />
              {product.name}
            </h1>
            <p className="text-gray-500 mt-2">Product Intelligence Profile: Showing only signals mapped to this specific product.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{product.category}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Target Archetypes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-500"/>
                {mappedArchetypes.length} Mapped
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Eligible Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-500"/>
                {eligibleCompanies.length} Found
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Relevant Signal Configuration</CardTitle>
            <CardDescription>Signals that matter to this product and their assigned weights.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mappedSignals.length === 0 ? <span className="text-gray-500 italic">No signals mapped.</span> : (
                mappedSignals.map(sig => (
                  <Badge key={sig.id} variant="secondary" className="px-3 py-1">
                    {sig.signal_definitions?.name} ({sig.weight})
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Qualified Companies Timeline</CardTitle>
            <CardDescription>Companies that match via Archetypes, showing only the signals relevant to this product.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Matched Via</TableHead>
                  <TableHead>Relevant Activity</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eligibleCompanies.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center h-24 text-gray-500">No companies currently qualify for this product.</TableCell></TableRow>
                ) : (
                  eligibleCompanies.map(comp => (
                    <TableRow key={comp.company_id}>
                      <TableCell>
                        <div className="font-bold">{comp.companies?.name}</div>
                        <div className="text-xs text-gray-500">{comp.companies?.industry}</div>
                      </TableCell>
                      <TableCell>
                        {comp.reason_codes.map((r: string) => <Badge key={r} variant="outline" className="text-xs">{r}</Badge>)}
                      </TableCell>
                      <TableCell>
                        {comp.relevantEvents && comp.relevantEvents.length > 0 ? (
                          <div className="space-y-1">
                            {comp.relevantEvents.slice(0, 3).map((ev: any) => (
                              <div key={ev.id} className="text-xs flex items-center gap-1">
                                <History className="h-3 w-3 text-gray-400"/>
                                <span className="font-medium">{ev.signal_definitions?.name}</span>
                                <span className="text-gray-400 ml-1">({new Date(ev.occurred_at).toLocaleDateString()})</span>
                              </div>
                            ))}
                            {comp.relevantEvents.length > 3 && <div className="text-xs text-indigo-500">+{comp.relevantEvents.length - 3} more relevant signals</div>}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No direct relevant signals (Archetype match only)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/admin/intelligence/company/${comp.company_id}`} className="text-sm text-indigo-600 hover:underline">Full Profile &rarr;</Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </main>
      <Footer />
    </div>
  );
};

export default AdminProductIntelligence;
