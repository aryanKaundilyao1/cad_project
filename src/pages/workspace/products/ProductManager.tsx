import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/ClientWorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Edit2, Archive, Trash2 } from "lucide-react";

export default function ProductManager() {
  const { activeClient, products, refreshWorkspace } = useWorkspace();
  
  if (!activeClient) {
    return <div className="p-8 text-center text-foreground/60">Loading products...</div>;
  }

  const activeProducts = products.filter(p => p.status !== 'ARCHIVED');

  return (
    <div className="space-y-6 animate-fade-in p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-editorial font-bold text-foreground">Products & Services</h1>
          <p className="text-foreground/60 mt-1">Manage the offerings JAS uses to score and route opportunities.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Offering
        </Button>
      </div>

      {activeProducts.length === 0 ? (
        <Card className="border-dashed border-2 shadow-sm bg-background/50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <PlusCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold font-editorial">No products configured yet</h3>
            <p className="text-sm text-foreground/60 mt-1 max-w-sm">
              Define your products or services here so JAS can match leads to the right offering.
            </p>
            <Button className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground">
              Configure Offering
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeProducts.map((product) => (
            <Card key={product.id} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-editorial">{product.name}</CardTitle>
                    <CardDescription className="mt-1">{product.category}</CardDescription>
                  </div>
                  <div className={`px-2 py-1 text-xs font-medium rounded-full ${product.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {product.status}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80 line-clamp-2 min-h-10">
                  {product.short_description || product.full_description || "No description provided."}
                </p>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm" className="h-8 border-primary/20 hover:bg-primary/5">
                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
