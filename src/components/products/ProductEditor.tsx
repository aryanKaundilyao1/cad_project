import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from '@/contexts/ClientWorkspaceContext';
import { ArrowLeft, Save, ShieldCheck, Target, Users, LayoutDashboard } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const ProductEditor = ({ isPremium = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeClient, products, refreshWorkspace } = useWorkspace();
  
  const existingProduct = products?.find(p => p.id === id);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: existingProduct?.name || '',
    category: existingProduct?.category || '',
    type: existingProduct?.type || 'SERVICE',
    status: existingProduct?.status || 'ACTIVE',
    priority: existingProduct?.priority || 'PRIMARY',
    short_description: existingProduct?.short_description || existingProduct?.description || '',
    target_industries: existingProduct?.target_industries || '',
    buyer_personas: existingProduct?.buyer_personas || '',
    value_proposition: existingProduct?.value_proposition || '',
    typical_deal_value: existingProduct?.typical_deal_value || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (statusOverride?: string) => {
    if (!activeClient) {
      toast.error("No active workspace found.");
      return;
    }
    
    if (!formData.name) {
      toast.error("Product name is required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        client_id: activeClient.id,
        name: formData.name,
        category: formData.category,
        type: formData.type,
        status: statusOverride || formData.status,
        short_description: formData.short_description,
        description: formData.short_description,
        target_industries: formData.target_industries,
        buyer_personas: formData.buyer_personas,
        value_proposition: formData.value_proposition,
        typical_deal_value: formData.typical_deal_value
      };

      if (id) {
        const { error } = await supabase.from('joep_products').update(payload).eq('id', id);
        if (error) throw error;
        toast.success("Product updated successfully.");
      } else {
        const { error } = await supabase.from('joep_products').insert([payload]);
        if (error) throw error;
        toast.success("Product created successfully.");
      }
      
      await refreshWorkspace();
      navigate('/workspace/catalogue');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-primary/10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-primary/5">
            <ArrowLeft className="h-5 w-5 text-primary" />
          </Button>
          <div>
            <h1 className="text-3xl font-editorial font-bold text-foreground">
              {id ? 'Edit Offering' : 'Add Product / Service'}
            </h1>
            <p className="text-sm text-foreground/60 mt-1 font-light">Define configuration for JOEP scoring routing.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => handleSave('DRAFT')} disabled={loading} className="border-primary/20 hover:bg-primary/5">
            Save as Draft
          </Button>
          <Button onClick={() => handleSave('ACTIVE')} disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
            <Save className="h-4 w-4 mr-2" /> Publish
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        <div className="w-64 shrink-0 hidden md:block space-y-2">
          <button onClick={() => setActiveTab('basic')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'basic' ? 'bg-primary/10 text-primary' : 'text-foreground/60 hover:bg-primary/5'}`}>
            <LayoutDashboard className="h-4 w-4" /> Basic Info
          </button>
          <button onClick={() => setActiveTab('market')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'market' ? 'bg-primary/10 text-primary' : 'text-foreground/60 hover:bg-primary/5'}`}>
            <Target className="h-4 w-4" /> Target Market
          </button>
          <button onClick={() => setActiveTab('buying')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'buying' ? 'bg-primary/10 text-primary' : 'text-foreground/60 hover:bg-primary/5'}`}>
            <Users className="h-4 w-4" /> Buying Context
          </button>
          <button onClick={() => setActiveTab('commercial')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'commercial' ? 'bg-primary/10 text-primary' : 'text-foreground/60 hover:bg-primary/5'}`}>
            <ShieldCheck className="h-4 w-4" /> Commercial
          </button>
        </div>

        <div className="flex-1 space-y-6">
          {activeTab === 'basic' && (
            <Card className="border-primary/10 shadow-sm rounded-2xl">
              <CardHeader className="pb-4 border-b border-primary/5">
                <CardTitle className="text-xl font-editorial">General Information</CardTitle>
                <CardDescription>The core identity of this offering.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Product / Service Name *</label>
                    <Input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Enterprise Data Enrichment" className="bg-background/50 border-primary/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Input name="category" value={formData.category} onChange={handleChange} placeholder="e.g. API Services" className="bg-background/50 border-primary/20" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="flex h-10 w-full rounded-md border border-primary/20 bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
                      <option value="SERVICE">Service</option>
                      <option value="PRODUCT">Product</option>
                      <option value="SOLUTION">Solution</option>
                      <option value="PLATFORM">Platform</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Short Description</label>
                  <Textarea name="short_description" value={formData.short_description} onChange={handleChange} placeholder="A concise 1-2 sentence description of what this is..." className="h-24 bg-background/50 border-primary/20 resize-none" />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'market' && (
            <Card className="border-primary/10 shadow-sm rounded-2xl">
              <CardHeader className="pb-4 border-b border-primary/5">
                <CardTitle className="text-xl font-editorial">Target Market (ICP)</CardTitle>
                <CardDescription>Define who this offering is meant for to assist scoring accuracy.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Industries</label>
                  <Input name="target_industries" value={formData.target_industries} onChange={handleChange} placeholder="e.g. SaaS, Fintech, Healthcare (comma separated)" className="bg-background/50 border-primary/20" />
                  <p className="text-xs text-foreground/50">Used by the JAS engine to boost fit scores for matching domains.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'buying' && (
            <Card className="border-primary/10 shadow-sm rounded-2xl">
              <CardHeader className="pb-4 border-b border-primary/5">
                <CardTitle className="text-xl font-editorial">Buying Context</CardTitle>
                <CardDescription>Who buys this and why.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Primary Buyer Personas</label>
                  <Input name="buyer_personas" value={formData.buyer_personas} onChange={handleChange} placeholder="e.g. VP Operations, RevOps, CTO" className="bg-background/50 border-primary/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Value Proposition</label>
                  <Textarea name="value_proposition" value={formData.value_proposition} onChange={handleChange} placeholder="What core problem does this solve for them?" className="h-24 bg-background/50 border-primary/20 resize-none" />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'commercial' && (
            <Card className="border-primary/10 shadow-sm rounded-2xl">
              <CardHeader className="pb-4 border-b border-primary/5">
                <CardTitle className="text-xl font-editorial">Commercial Details</CardTitle>
                <CardDescription>Pricing and sales cycle metadata.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2 max-w-md">
                  <label className="text-sm font-medium">Typical Deal Value (Optional)</label>
                  <Input name="typical_deal_value" value={formData.typical_deal_value} onChange={handleChange} placeholder="e.g. $10k - $25k ARR" className="bg-background/50 border-primary/20" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
