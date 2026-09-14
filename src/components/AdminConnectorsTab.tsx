import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, Search, MapPin, Briefcase, Hash } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function AdminConnectorsTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form State
  const [connectorType, setConnectorType] = useState('GoogleMaps');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [keyword, setKeyword] = useState('');
  const [limit, setLimit] = useState('50');

  const handleFetchLeads = async () => {
    if (!keyword || !location || !industry) {
      toast({ title: 'Validation Error', description: 'Keyword, Location, and Industry are required.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-maps-scraper', {
        body: { 
          keyword, 
          location, 
          industry, 
          limit: parseInt(limit, 10) 
        }
      });

      if (error) throw error;
      
      toast({ 
        title: 'Leads Fetched Successfully!', 
        description: data.message || `Successfully imported leads into the staging area.` 
      });
      
      // Clear form on success
      setKeyword('');
      setLocation('');
      setIndustry('');
    } catch (err: any) {
      toast({ title: 'Extraction Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Search className="w-6 h-6 text-blue-400" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Lead Connectors</h2>
          <p className="text-sm text-muted-foreground">Extract targeted data from external sources and pipe it directly into the Intelligence Funnel.</p>
        </div>
      </div>

      <Card className="bg-card/40 border-white/5">
        <CardHeader className="border-b border-white/5 pb-6">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" /> Google Maps Extractor API
          </CardTitle>
          <CardDescription>Powered by Omkar Cloud API. Extracts business data and automatically filters duplicates before staging them as Raw Leads.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Search className="w-3 h-3" /> Search Keyword
              </Label>
              <Input 
                placeholder="e.g. PEB Manufacturers" 
                className="bg-white/5 border-white/10"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Location
              </Label>
              <Input 
                placeholder="e.g. Bangalore" 
                className="bg-white/5 border-white/10"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-3 h-3" /> Target Industry
              </Label>
              <Input 
                placeholder="e.g. Pre-Engineered Buildings" 
                className="bg-white/5 border-white/10"
                value={industry}
                onChange={e => setIndustry(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Hash className="w-3 h-3" /> Result Limit
              </Label>
              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 Results</SelectItem>
                  <SelectItem value="50">50 Results</SelectItem>
                  <SelectItem value="100">100 Results</SelectItem>
                  <SelectItem value="500">500 Results (May take longer)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <Button 
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={handleFetchLeads}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              Fetch Leads from Google Maps
            </Button>
          </div>

        </CardContent>
      </Card>
      
      <Card className="bg-white/[0.02] border-white/5 border-dashed">
        <CardContent className="p-6 text-sm text-muted-foreground">
          <strong>Pipeline Info:</strong> When you fetch leads, they do <strong>NOT</strong> go live on the marketplace. They are immediately pushed to the <code>raw_leads</code> database table. You can review, qualify, and approve them in the <strong>Lead Intel</strong> tab.
        </CardContent>
      </Card>
    </div>
  );
}
