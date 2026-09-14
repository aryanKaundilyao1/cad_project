import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, BrainCircuit, Search, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { COIFEngine } from '@/scoring/coif/COIFEngine';
import { ClientContext, Lead, SourceType } from '@/scoring/coif/types';

interface CoifExecutionModalProps {
  uploadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (mappedData: any) => void;
}

export default function CoifExecutionModal({ uploadId, isOpen, onClose, onSuccess }: CoifExecutionModalProps) {
  const { toast } = useToast();
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Selection State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  
  const [subProducts, setSubProducts] = useState<any[]>([]);
  const [selectedSubProductId, setSelectedSubProductId] = useState<string>('');

  const [isExecuting, setIsExecuting] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
      setSelectedCompanyId('');
      setSelectedCompany(null);
      setSelectedCategoryId('');
      setSelectedProductId('');
      setSelectedSubProductId('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchCategories(selectedCompanyId);
    } else {
      setCategories([]);
      setSelectedCategoryId('');
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchProducts(selectedCategoryId);
    } else {
      setProducts([]);
      setSelectedProductId('');
    }
  }, [selectedCategoryId]);
  
  useEffect(() => {
    if (selectedProductId) {
      fetchSubProducts(selectedProductId);
    } else {
      setSubProducts([]);
      setSelectedSubProductId('');
    }
  }, [selectedProductId]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    
    // Search Premium Clients ONLY (those with emails attached to workspaces)
    // Matches by email, company_name, or exact ID
    let query = supabase.from('jas_companies').select('id, company_name, email').not('email', 'is', null);
    
    // Check if query is a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (uuidRegex.test(searchQuery)) {
      query = query.eq('id', searchQuery);
    } else if (searchQuery.includes('@')) {
      query = query.ilike('email', `%${searchQuery}%`);
    } else {
      query = query.ilike('company_name', `%${searchQuery}%`);
    }
    
    const { data } = await query.limit(10);
    setSearchResults(data || []);
    setIsSearching(false);
  };

  const fetchCategories = async (companyId: string) => {
    const { data } = await supabase.from('client_business_categories').select('id, name').eq('company_id', companyId);
    if (data) setCategories(data);
  };

  const fetchProducts = async (categoryId: string) => {
    // Only fetch parent products (parent_id is null)
    const { data } = await supabase.from('products')
      .select('id, name')
      .eq('business_category_id', categoryId)
      .is('parent_id', null);
    if (data) setProducts(data);
  };

  const fetchSubProducts = async (productId: string) => {
    // Fetch children of the selected product
    const { data } = await supabase.from('products')
      .select('id, name')
      .eq('parent_id', productId);
    if (data) setSubProducts(data);
  };

  const selectClient = (client: any) => {
    setSelectedCompany(client);
    setSelectedCompanyId(client.id);
  };

  const handleRunCoif = async () => {
    if (!selectedProductId || !uploadId) return;

    setIsExecuting(true);
    try {
      const finalProductId = selectedSubProductId || selectedProductId;
      
      const { data: productData, error: productErr } = await supabase
        .from('products')
        .select('name, description')
        .eq('id', finalProductId)
        .single();
        
      if (productErr) throw productErr;

      // 1. Fetch ALL valid upload rows using pagination
      let rows: any[] = [];
      let fetchCount = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: batch, error: fetchErr } = await supabase
          .from('upload_rows')
          .select('id, raw_data')
          .eq('upload_id', uploadId)
          .eq('validation_status', 'valid')
          .range(fetchCount, fetchCount + 999);
          
        if (fetchErr) throw fetchErr;
        
        if (batch && batch.length > 0) {
          rows = [...rows, ...batch];
          fetchCount += batch.length;
          if (batch.length < 1000) hasMore = false;
        } else {
          hasMore = false;
        }
      }

      // Build ClientContext from selected client and product
      const clientContext: ClientContext = {
        id: selectedCompanyId,
        name: selectedCompany.company_name,
        industry: selectedCompany.industry || 'Unknown',
        targetProducts: [productData.name.toLowerCase()],
        targetBuyerTypes: [], 
        targetCountries: [],
        requiredCertifications: []
      };

      // Map rows to Lead objects for the COIF Engine
      const leadsForCoif: Lead[] = rows.map((r: any) => {
        const raw = r.raw_data || {};
        
        let keywordArray: string[] = [];
        
        // Extract keywords from all relevant text fields to better differentiate leads
        const textToSearch = [
          raw.description, 
          raw.category, 
          raw.title, 
          raw.company_name, 
          raw.project_name
        ].filter(Boolean).join(' ').toLowerCase().replace(/[.,]/g, '');
        
        if (textToSearch) {
           keywordArray = textToSearch.split(' ').filter((w: string) => w.length > 3);
        }
        
        // Add exact match manually if the category closely aligns
        if (raw.category && raw.category.toLowerCase().includes(productData.name.toLowerCase())) {
          keywordArray.push(productData.name.toLowerCase());
        }

        // Run OIE Score if missing
        let baselineOIEScore = 50;
        if (raw.oie_score && raw.oie_score.lead_score) {
          baselineOIEScore = raw.oie_score.lead_score;
        } else if (raw.quality_score) {
          baselineOIEScore = raw.quality_score;
        } else {
          // Calculate OIE on the fly
          let oieTempScore = 0;
          if (raw.website || raw.url) oieTempScore += 20;
          if (raw.email || raw.email_address) oieTempScore += 20;
          if (raw.phone || raw.mobile) oieTempScore += 20;
          if (raw.description || raw.about) oieTempScore += 20;
          if (raw.rating && parseFloat(raw.rating) > 3) oieTempScore += 20;
          baselineOIEScore = oieTempScore || 50;
        }

        return {
          id: r.id,
          name: raw.company_name || raw.title || 'Unknown',
          sources: [(raw.source || 'Website') as SourceType],
          baselineOIEScore,
          metrics: {
            hasWebsite: !!raw.website || !!raw.url,
            hasEmail: !!raw.email || !!raw.email_address,
            hasPhone: !!raw.phone || !!raw.mobile,
            country: raw.address || raw.country || raw.location || 'Unknown',
            productKeywords: keywordArray,
            businessCategory: raw.category || raw.business_category || 'Unknown',
            businessDescription: raw.description || raw.about || raw.company_name || raw.title || '',
            reviewCount: parseInt(raw.review_count || raw.reviews || '0', 10),
            rating: parseFloat(raw.rating || raw.google_rating || '0')
          }
        };
      });

      // Run the actual COIF math engine
      const coifResults = COIFEngine.evaluate(clientContext, leadsForCoif);

      const updates = rows.map((r: any) => {
        const raw = r.raw_data || {};
        const coifRes = coifResults.find(c => c.leadId === r.id);
        
        if (coifRes) {
          raw['COIF: Score'] = coifRes.coifScore;
          raw['COIF: Fusion Score'] = coifRes.finalScore;
          raw['COIF: Confidence'] = coifRes.confidenceTier;
          raw['COIF: Top Reason'] = coifRes.reasons[0]?.description || 'No reasons provided';
          raw['COIF: Mapped Product'] = productData.name;
          
          raw.coif_score = coifRes;
        }

        // Keep the mapping on the raw data so it can be picked up during Publish
        raw.mapped_company_id = selectedCompanyId;
        raw.mapped_category_id = selectedCategoryId;
        raw.mapped_product_id = selectedProductId;
        raw.mapped_sub_product_id = selectedSubProductId || null;

        return {
          id: r.id,
          upload_id: uploadId,
          raw_data: raw
        };
      });

      // Update rows in batches of 100 to prevent Payload Too Large (CORS) issues on 8K rows
      for (let i = 0; i < updates.length; i += 100) {
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to prevent network flooding
        const batch = updates.slice(i, i + 100);
        const { error: upsertErr } = await supabase.from('upload_rows').upsert(batch, { onConflict: 'id' });
        
        if (upsertErr) {
          console.error("Failed to upsert batch:", upsertErr);
          throw new Error(`Failed to save COIF scores: ${upsertErr.message}`);
        }
      }

      toast({ title: 'COIF Execution Complete', description: 'Leads have been ranked against client profile.' });
      onSuccess({ companyId: selectedCompanyId, categoryId: selectedCategoryId, productId: selectedProductId, subProductId: selectedSubProductId });
      onClose();
    } catch (err: any) {
      toast({ title: 'COIF Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-950 border-slate-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-indigo-400" /> Run COIF Engine
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Map this dataset to a specific client profile to generate Opportunity Intelligence Rankings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Client Search Block */}
          {!selectedCompany ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Search Premium Client</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Search by Email, ID, or Company Name" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="bg-slate-900 border-slate-700"
                  />
                  <Button onClick={handleSearch} disabled={isSearching} className="bg-slate-800 hover:bg-slate-700 text-white">
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              {hasSearched && (
                <div className="border border-slate-800 rounded-md bg-slate-900/50 max-h-48 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">No premium clients found.</div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {searchResults.map(client => (
                        <div key={client.id} className="p-3 flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => selectClient(client)}>
                          <div>
                            <div className="font-medium text-sm text-slate-200">{client.company_name}</div>
                            <div className="text-xs text-slate-500">{client.email}</div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-indigo-400 hover:text-indigo-300">Select</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 border border-indigo-500/30 bg-indigo-500/10 rounded-md flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Building className="h-8 w-8 text-indigo-400 p-1.5 bg-indigo-500/20 rounded" />
                <div>
                  <div className="text-sm font-medium text-white">{selectedCompany.company_name}</div>
                  <div className="text-xs text-indigo-300">{selectedCompany.email}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCompany(null)} className="h-7 text-xs text-slate-400 hover:text-white">Change</Button>
            </div>
          )}

          {selectedCompanyId && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Business Category</label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger className="bg-slate-900 border-slate-700">
                    <SelectValue placeholder="Select Business Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                    {categories.length === 0 && <div className="p-2 text-sm text-muted-foreground italic text-center">No categories found</div>}
                  </SelectContent>
                </Select>
              </div>

              {selectedCategoryId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Target Product</label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="bg-slate-900 border-slate-700">
                      <SelectValue placeholder="Select Product" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                      {products.length === 0 && <div className="p-2 text-sm text-muted-foreground italic text-center">No products found</div>}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedProductId && subProducts.length > 0 && (
                <div className="space-y-2 border border-slate-800 p-3 rounded-md bg-slate-900/30">
                  <label className="text-sm font-medium text-slate-400">Target Sub Product (Optional)</label>
                  <Select value={selectedSubProductId} onValueChange={setSelectedSubProductId}>
                    <SelectTrigger className="bg-slate-900 border-slate-700">
                      <SelectValue placeholder="Select Sub Product" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                      <SelectItem value="">-- None (Target Parent Product) --</SelectItem>
                      {subProducts.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={isExecuting}>Cancel</Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700"
            disabled={!selectedProductId || isExecuting}
            onClick={handleRunCoif}
          >
            {isExecuting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
            ) : (
              <><BrainCircuit className="w-4 h-4 mr-2" /> Execute Framework</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
