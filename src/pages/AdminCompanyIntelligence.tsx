import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CompanyProfileService, CompanyIntelligenceProfile } from "@/services/intelligence/profile/CompanyProfileService";
import { Loader2, Building2, ExternalLink, Network, Database, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AdminCompanyIntelligence = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [profile, setProfile] = useState<CompanyIntelligenceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProfile(id);
    }
  }, [id]);

  const loadProfile = async (companyId: string) => {
    try {
      setIsLoading(true);
      const data = await CompanyProfileService.getIntelligenceProfile(companyId);
      setProfile(data);
    } catch (err: any) {
      toast({ title: "Failed to load profile", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </main>
      </div>
    );
  }

  if (!profile || !profile.company) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center text-red-500">Company not found.</div>
        </main>
      </div>
    );
  }

  const { company, aliases, enrichments, signals } = profile;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-100 rounded-xl">
              <Building2 className="h-8 w-8 text-indigo-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                {company.name}
                {company.resolution_confidence === 100 && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100" variant="secondary">Canonical Entity</Badge>
                )}
                {company.resolution_confidence < 100 && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Pending Review</Badge>
                )}
              </h1>
              <p className="text-gray-500 mt-1 flex items-center gap-2">
                {company.domain && <a href={`https://${company.domain}`} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">{company.domain} <ExternalLink className="h-3 w-3" /></a>}
                {company.industry && <span>• {company.industry}</span>}
              </p>
            </div>
          </div>
          <div>
            <Button onClick={() => loadProfile(company.id)} variant="outline">Refresh Profile</Button>
          </div>
        </div>

        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="mb-6 h-auto p-1 bg-gray-100 rounded-lg">
            <TabsTrigger value="timeline" className="py-2.5 px-4 text-sm"><History className="mr-2 h-4 w-4"/> Signal Timeline ({signals.length})</TabsTrigger>
            <TabsTrigger value="aliases" className="py-2.5 px-4 text-sm"><Network className="mr-2 h-4 w-4"/> Entity Aliases ({aliases.length})</TabsTrigger>
            <TabsTrigger value="enrichment" className="py-2.5 px-4 text-sm"><Database className="mr-2 h-4 w-4"/> Enrichment History ({enrichments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Unified Signal Timeline</CardTitle>
                <CardDescription>Chronological history of all internal and external intelligence signals.</CardDescription>
              </CardHeader>
              <CardContent>
                {signals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No signals recorded yet.</div>
                ) : (
                  <div className="relative border-l-2 border-indigo-100 ml-3 pl-6 space-y-8 mt-4">
                    {signals.map((signal) => (
                      <div key={signal.id} className="relative">
                        <div className="absolute -left-[31px] bg-indigo-500 rounded-full w-4 h-4 border-2 border-white top-1"></div>
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-lg">{signal.signal_definitions?.name || 'Unknown Signal'}</h4>
                          <span className="text-xs text-gray-400 font-mono">
                            {new Date(signal.occurred_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">{signal.signal_definitions?.category || 'Uncategorized'}</Badge>
                          <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-700">{signal.raw_source}</Badge>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono text-gray-700 border">
                          {JSON.stringify(signal.payload, null, 2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aliases">
            <Card>
              <CardHeader>
                <CardTitle>Resolved Aliases</CardTitle>
                <CardDescription>All variations of this company name mapped to this canonical entity.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alias Name</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aliases.length === 0 ? (
                       <TableRow><TableCell colSpan={4} className="text-center h-24 text-gray-500">No aliases recorded.</TableCell></TableRow>
                    ) : (
                      aliases.map(alias => (
                        <TableRow key={alias.id}>
                          <TableCell className="font-medium">{alias.alias_name}</TableCell>
                          <TableCell>{alias.source}</TableCell>
                          <TableCell>{alias.confidence}%</TableCell>
                          <TableCell className="text-gray-500 text-sm">{new Date(alias.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enrichment">
            <Card>
              <CardHeader>
                <CardTitle>Immutable Enrichment Log</CardTitle>
                <CardDescription>Append-only history of third-party data enrichment.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrichments.length === 0 ? (
                       <TableRow><TableCell colSpan={4} className="text-center h-24 text-gray-500">No enrichment data.</TableCell></TableRow>
                    ) : (
                      enrichments.map(e => (
                        <TableRow key={e.id}>
                          <TableCell className="text-xs text-gray-500">{new Date(e.created_at).toLocaleString()}</TableCell>
                          <TableCell className="font-semibold">{e.field_name}</TableCell>
                          <TableCell className="font-mono text-xs">{JSON.stringify(e.field_value)}</TableCell>
                          <TableCell><Badge variant="outline">{e.enrichment_sources?.source_name}</Badge></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default AdminCompanyIntelligence;
