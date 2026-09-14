import React, { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Database, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const AdminRawEventExplorer = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('raw_external_events')
        .select('*, signal_providers(name)')
        .order('received_at', { ascending: false })
        .limit(100);
        
      if (error) throw error;
      setEvents(data || []);
    } catch (err: any) {
      toast({ title: "Error loading events", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8 text-indigo-600" />
            Raw Event Explorer
          </h1>
          <p className="text-gray-500 mt-2">Inspect raw payloads and trace the ingestion pipeline from payload to signal.</p>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Received</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pipeline Trace</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                    </TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                      No raw events found. Run a provider sync to ingest data.
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map(event => (
                    <TableRow key={event.id}>
                      <TableCell className="whitespace-nowrap text-sm text-gray-500">
                        {new Date(event.received_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {event.signal_providers?.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{event.event_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={
                          event.status === 'processed' ? 'bg-green-100 text-green-700' :
                          event.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }>
                          {event.status}
                        </Badge>
                        {event.error_message && (
                          <div className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={event.error_message}>
                            {event.error_message}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">Inspect Payload</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Pipeline Trace: {event.id}</DialogTitle>
                            </DialogHeader>
                            <div className="mt-4 space-y-4">
                              <div>
                                <h4 className="font-bold text-sm text-gray-700 mb-2 flex items-center gap-2">
                                  <Database className="h-4 w-4" /> 1. Raw Payload (Immutable)
                                </h4>
                                <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
                                  {JSON.stringify(event.raw_payload, null, 2)}
                                </pre>
                              </div>
                              
                              <div className="flex justify-center text-gray-400"><ArrowRight className="h-6 w-6 rotate-90 md:rotate-0" /></div>

                              <div>
                                <h4 className="font-bold text-sm text-gray-700 mb-2 flex items-center gap-2">
                                  <Search className="h-4 w-4" /> 2. Pipeline Result
                                </h4>
                                {event.status === 'processed' ? (
                                  <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg text-sm">
                                    <p className="font-medium mb-1">Successfully Processed</p>
                                    <p className="text-green-600 mb-2 text-xs">The Event Normalizer mapped this payload and the Entity Resolver found/created the company.</p>
                                    <p className="text-xs font-mono">Processed at: {new Date(event.processed_at).toLocaleString()}</p>
                                  </div>
                                ) : event.status === 'failed' ? (
                                  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm">
                                    <p className="font-medium mb-1">Pipeline Failed</p>
                                    <p className="font-mono text-xs">{event.error_message}</p>
                                  </div>
                                ) : (
                                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-sm">
                                    Pending execution by the ConnectorManager.
                                  </div>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AdminRawEventExplorer;
