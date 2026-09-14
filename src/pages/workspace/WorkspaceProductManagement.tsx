import React, { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/ClientWorkspaceContext';
import { Briefcase, Plus, Box, Edit, Trash2, Folder, ChevronDown, ChevronRight, Save, X, Settings2, Layers, Users, Target, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIndustries } from '@/hooks/useBusinessProfile';

const WorkspaceProductManagement = () => {
  const { company, products, refreshWorkspace } = useWorkspace();
  const { toast } = useToast();
  const { data: industries = [] } = useIndustries();
  
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [expandedProds, setExpandedProds] = useState<Record<string, boolean>>({});
  
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");
  const [newProductImage, setNewProductImage] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const toggleCat = (cat: string) => setExpandedCats(prev => ({...prev, [cat]: !prev[cat]}));
  const toggleProd = (id: string) => setExpandedProds(prev => ({...prev, [id]: !prev[id]}));

  // Group products by category
  const categoriesMap = products.reduce((acc, product) => {
    const cat = product.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {} as Record<string, any[]>);

  const categoryNames = Object.keys(categoriesMap);

  const handleAddProduct = async () => {
    if (!newProductName.trim()) {
      toast({ title: "Validation Error", description: `Product name is required.`, variant: "destructive" });
      return;
    }
    
    try {
      // 1. Insert Product
      const { data: prodData, error: prodError } = await supabase.from('jas_products').insert({
        company_id: company.id,
        name: newProductName,
        description: newProductDesc,
        category: newProductCategory || 'Uncategorized',
      }).select().single();
      
      if (prodError) throw prodError;

      // 2. Insert Image if provided
      if (newProductImage && prodData) {
        await supabase.from('jas_product_images').insert({
          product_id: prodData.product_id,
          url: newProductImage,
          media_type: 'main'
        });
      }

      // 3. Insert Pricing if provided
      if (newProductPrice && prodData) {
        await supabase.from('jas_product_pricing').insert({
          product_id: prodData.product_id,
          price: parseFloat(newProductPrice),
          price_type: 'fixed'
        });
      }
      
      setNewProductName("");
      setNewProductDesc("");
      setNewProductImage("");
      setNewProductCategory("");
      setNewProductPrice("");
      setIsAddingProduct(false);
      
      refreshWorkspace();
      toast({ title: "Success", description: `Product created successfully.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
    try {
      await supabase.from('jas_products').delete().eq('product_id', id);
      refreshWorkspace();
      toast({ title: "Deleted Successfully" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingProduct || !editingProduct.name.trim()) return;
    try {
      await supabase.from('jas_products').update({ 
        name: editingProduct.name, 
        description: editingProduct.description,
        category: editingProduct.category
      }).eq('product_id', editingProduct.product_id);
      
      setEditingProduct(null);
      refreshWorkspace();
      toast({ title: "Updated Successfully" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Briefcase className="h-8 w-8 text-primary" /> Catalogue Manager</h1>
          <p className="text-muted-foreground">Manage your products and their categories to display on the JAS Marketplace.</p>
        </div>
        <Button onClick={() => setIsAddingProduct(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
      </div>

      <div className="space-y-4">
        {categoryNames.map((catName) => {
          const catProducts = categoriesMap[catName];
          const isExpanded = expandedCats[catName];
          
          return (
            <Card key={catName} className="shadow-sm overflow-hidden border-border">
              <div 
                className="bg-muted/30 px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleCat(catName)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                  <Folder className="h-5 w-5 text-primary/70" />
                  <h3 className="text-lg font-bold">{catName}</h3>
                  <Badge variant="secondary" className="ml-2">{catProducts.length} Products</Badge>
                </div>
              </div>
              
              {isExpanded && (
                <div className="p-6 bg-card border-t border-border space-y-4">
                  {catProducts.map(product => {
                    const isProdExpanded = expandedProds[product.product_id];
                    return (
                    <div key={product.product_id} className="flex flex-col border border-border rounded-lg overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-32 h-32 bg-muted flex flex-col items-center justify-center shrink-0 border-b md:border-b-0 md:border-r border-border cursor-pointer hover:bg-muted/80" onClick={() => toggleProd(product.product_id)}>
                           <Box className="h-8 w-8 text-muted-foreground/30 mb-2" />
                        </div>
                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div className="w-full">
                            {editingProduct?.product_id === product.product_id ? (
                              <div className="space-y-2 mb-2 w-full pr-4">
                                <Input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} placeholder="Product Name" className="h-8" autoFocus />
                                <Input value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} placeholder="Product Description" className="h-8" />
                                <Input value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} placeholder="Category" className="h-8" />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleSaveEdit} className="h-8"><Save className="h-4 w-4 mr-1" /> Save</Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingProduct(null)} className="h-8"><X className="h-4 w-4 mr-1" /> Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="text-lg font-bold">{product.name}</h4>
                                  <div className="flex gap-2">
                                    <Badge variant="default" className="bg-green-600">
                                      Live on Marketplace
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-sm text-foreground/80 line-clamp-1 mb-2">{product.description || 'No description provided.'}</p>
                              </>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 ml-auto" onClick={() => setEditingProduct(product)}><Edit className="h-3 w-3" /> Edit</Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:bg-destructive/10 gap-1" onClick={() => handleDeleteProduct(product.product_id)}><Trash2 className="h-3 w-3" /> Delete</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </Card>
          );
        })}

        {categoryNames.length === 0 && (
          <div className="text-center p-12 bg-card border border-border rounded-xl">
            <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No products found</h3>
            <p className="text-muted-foreground mb-4">You need to add products to your catalogue for buyers to see them.</p>
            <Button onClick={() => setIsAddingProduct(true)} className="gap-2"><Plus className="h-4 w-4" /> Add First Product</Button>
          </div>
        )}
      </div>

      {isAddingProduct && (
        <Dialog open={true} onOpenChange={(open) => {
          if (!open) {
            setIsAddingProduct(false);
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Create a new product to list in the marketplace.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name <span className="text-destructive">*</span></Label>
                <Input
                  id="product-name"
                  placeholder="e.g. Ashwagandha"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-category">Category</Label>
                <Select value={newProductCategory} onValueChange={setNewProductCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-desc">Description</Label>
                <Textarea
                  id="product-desc"
                  placeholder="Describe your product..."
                  value={newProductDesc}
                  onChange={(e) => setNewProductDesc(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-price">Price (USD)</Label>
                <Input
                  id="product-price"
                  type="number"
                  placeholder="e.g. 50"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-image">Image URL</Label>
                <Input
                  id="product-image"
                  placeholder="https://example.com/image.jpg"
                  value={newProductImage}
                  onChange={(e) => setNewProductImage(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingProduct(false)}>Cancel</Button>
              <Button onClick={handleAddProduct}>Create Product</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WorkspaceProductManagement;
