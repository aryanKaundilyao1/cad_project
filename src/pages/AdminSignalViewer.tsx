import React, { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SignalService, Company, SignalEvent } from "@/services/SignalService";
import { Loader2, Activity, Clock, Building2 } from "lucide-react";

const AdminSignalViewer = () => {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const data = await SignalService.getCompanies();
      setCompanies(data);
    } catch (err: any) {
      toast({ title: "Error loading companies", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTimeline = async (companyId: string) => {
    setSelectedCompanyId(companyId);
    try {
      setIsTimelineLoading(true);
      const data = await SignalService.getCompanySignalTimeline(companyId);
      setTimeline(data);
    } catch (err: any) {
      toast({ title: "Error loading timeline", description: err.message, variant: "destructive" });
    } finally {
      setIsTimelineLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="h-8 w-8 text-blue-600" />
              Signal Event Viewer
            </h1>
            <p className="text-gray-500 mt-2">Phase 3A: Immutable Signal Event Store and Registry</p>
          </div>
          <Button onClick={loadCompanies} variant="outline">Refresh Data</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 h-[800px] flex flex-col">
            <CardHeader>
              <CardTitle>Companies</CardTitle>
              <CardDescription>Select a company to view its signal timeline</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pr-2">
              {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-gray-400" /></div>
              ) : companies.length === 0 ? (
                <div className="text-center p-8 text-gray-500">No companies found in registry.</div>
              ) : (
                <div className="space-y-2">
                  {companies.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => loadTimeline(c.id)}
                      className={`p-4 rounded-lg cursor-pointer border transition-colors ${
                        selectedCompanyId === c.id 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-white hover:bg-gray-50 border-gray-100'
                      }`}
                    >
                      <h3 className="font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        {c.name}
                      </h3>
                      {c.industry && <Badge variant="secondary" className="mt-2">{c.industry}</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 h-[800px] flex flex-col">
            <CardHeader>
              <CardTitle>Signal Timeline</CardTitle>
              <CardDescription>Immutable history of events</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto bg-gray-50/50 rounded-b-xl p-6">
              {!selectedCompanyId ? (
                <div className="h-full flex items-center justify-center text-gray-400">
                  Select a company from the left panel
                </div>
              ) : isTimelineLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-gray-400" /></div>
              ) : timeline.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No signals recorded for this company yet.
                </div>
              ) : (
                <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                  {timeline.map((event, i) => (
                    <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-blue-500 text-white group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-white shadow">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-slate-900">
                            {event.signal_definition?.name || 'Unknown Signal'}
                          </div>
                          <time className="text-xs font-medium text-blue-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(event.created_at).toLocaleDateString()}
                          </time>
                        </div>
                        <div className="text-sm text-slate-500 mb-3 flex gap-2">
                          <Badge variant="outline">{event.signal_definition?.category}</Badge>
                          <Badge variant="outline">{event.raw_source}</Badge>
                        </div>
                        <div className="bg-slate-50 p-3 rounded text-xs font-mono text-slate-600 overflow-x-auto">
                          {JSON.stringify(event.payload, null, 2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminSignalViewer;
