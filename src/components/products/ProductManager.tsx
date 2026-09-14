import React from 'react';
import { useWorkspace } from '@/contexts/ClientWorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit2, Archive, ArrowRight, Target } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';

export const ProductManager = ({ isPremium = false }) => {
  const { products } = useWorkspace();
  const navigate = useNavigate();
  
  const activeProducts = products?.filter(p => p.status !== 'ARCHIVED') || [];

  return (
    <div className="space-y-8 animate-fade-in p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-primary/10">
        <div>
          <h1 className="text-3xl font-editorial font-bold text-foreground">Products & Services</h1>
          <p className="text-foreground/60 mt-1 font-light">
            Manage the core offerings JAS uses to score and route B2B opportunities.
          </p>
        </div>
        <Button onClick={() => navigate('/workspace/catalogue/new')} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Product / Service
        </Button>
      </div>

      {activeProducts.length === 0 ? (
        <Card className="border-dashed border-2 shadow-none bg-background/50 border-primary/20">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center h-[400px]">
            <div className="rounded-full bg-primary/5 p-4 mb-4">
              <Target className="h-8 w-8 text-primary/60" />
            </div>
            <h3 className="text-xl font-semibold font-editorial">No products configured yet</h3>
            <p className="text-sm text-foreground/60 mt-2 max-w-md font-light">
              Define your products, target markets, and buyer personas here so JAS can intelligently match leads to the right offering.
            </p>
            <Button onClick={() => navigate('/workspace/catalogue/new')} className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Product / Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeProducts.map((product) => (
            <Card key={product.id} className="shadow-sm hover:shadow-md transition-all cursor-pointer border-primary/10 bg-card rounded-2xl group">
              <CardHeader className="pb-3 border-b border-primary/5">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="text-xl font-editorial text-primary group-hover:text-accent transition-colors">{product.name}</CardTitle>
                    <CardDescription className="mt-1 text-xs uppercase tracking-wider">{product.category || 'Uncategorized'}</CardDescription>
                  </div>
                  <div className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full ${
                    product.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                    product.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {product.status || 'DRAFT'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <p className="text-sm text-foreground/70 line-clamp-2 min-h-[2.5rem] font-light">
                  {product.short_description || product.description || "No description provided."}
                </p>
                <div className="flex justify-between items-center pt-2">
                  <div className="text-xs text-foreground/50">
                    ID: {product.id.substring(0, 8)}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/workspace/catalogue/${product.id}/edit`)} className="rounded-full h-8 px-4 border-primary/20 hover:bg-primary hover:text-white transition-colors">
                    <Edit2 className="h-3 w-3 mr-2" /> Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
