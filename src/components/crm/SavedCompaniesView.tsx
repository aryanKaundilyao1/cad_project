import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Building, Globe, Mail, Phone, Calendar, Target, ChevronRight } from "lucide-react";

export const SavedCompaniesView = () => {
  const { profile } = useAuth() as any;
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (profile) fetchCompanies();
  }, [profile]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crm_companies')
        .select(`
          *,
          crm_company_analysis (opportunity_score)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Building className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Saved Companies</h1>
            <p className="text-muted-foreground text-sm">View your scraped and researched companies.</p>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64 bg-card/50 border-white/10"
          />
        </div>
      </div>

      {filteredCompanies.length === 0 ? (
        <Card className="bg-card/40 border-white/5">
          <CardContent className="py-20 text-center flex flex-col items-center">
            <Building className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">No saved companies found</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-md">
              You haven't saved any companies yet. Use the Website Scraper to analyze and save company intelligence.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCompanies.map(company => (
            <Card key={company.id} className="bg-card/40 border-white/5 hover:bg-card/60 transition-colors cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1">{company.company_name}</h3>
                    <p className="text-xs text-muted-foreground">{company.industry}</p>
                  </div>
                  {company.crm_company_analysis?.[0]?.opportunity_score && (
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase text-muted-foreground">Score</span>
                      <span className="text-sm font-bold text-primary">{company.crm_company_analysis[0].opportunity_score}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {company.website_url && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5" />
                      <a href={company.website_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="hover:text-primary truncate">
                        {company.website_url.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {company.headquarters && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{company.headquarters}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Saved {new Date(company.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    View Details <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
