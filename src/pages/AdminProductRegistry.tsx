import React, { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProductRegistryService } from "@/services/intelligence/mapping/ProductRegistryService";
import { Loader2, Package, Plus, Link as LinkIcon, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";

const AdminProductRegistry = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // New Product Form
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await ProductRegistryService.getProducts();
      setProducts(data);
    } catch (err: any) {
      toast({ title: "Error loading products", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newName.trim() || !newCategory.trim()) {
      toast({ title: "Validation Error", description: "Name and Category are required.", variant: "destructive" });
      return;
    }

    try {
      setIsAdding(true);
      await ProductRegistryService.createProduct({
        name: newName.trim(),
        category: newCategory.trim(),
        industry: newIndustry.trim() || null
      });

      toast({ title: "Product Created" });
      setNewName("");
      setNewCategory("");
      setNewIndustry("");
      loadProducts();
    } catch (err: any) {
      toast({ title: "Failed to create product", description: err.message, variant: "destructive" });
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
            <Package className="h-8 w-8 text-indigo-600" />
            Product Registry
          </h1>
          <p className="text-gray-500 mt-2">Manage the master catalog of products and services to map signals against.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Product Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Register Product</CardTitle>
                <CardDescription>Add a new product or offering</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Product Name</label>
                  <Input 
                    placeholder="e.g. PEB Warehouse" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <Input 
                    placeholder="e.g. Construction, Software" 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Industry Focus (Optional)</label>
                  <Input 
                    placeholder="e.g. Manufacturing" 
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleAddProduct}
                  disabled={isAdding}
                >
                  {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Create Product
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Product Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Catalog</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin"/></TableCell></TableRow>
                      ) : products.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center h-24 text-gray-500">No products found.</TableCell></TableRow>
                      ) : (
                        products.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.name}
                              {item.industry && <div className="text-xs text-gray-500">Focus: {item.industry}</div>}
                            </TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>
                              <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>{item.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button asChild variant="outline" size="sm">
                                  <Link to={`/admin/products/mapping/${item.id}`}><LinkIcon className="h-4 w-4 mr-1" /> Map Signals</Link>
                                </Button>
                                <Button asChild variant="outline" size="sm">
                                  <Link to={`/admin/intelligence/product/${item.id}`}><Settings2 className="h-4 w-4 mr-1" /> Profile</Link>
                                </Button>
                              </div>
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

export default AdminProductRegistry;
