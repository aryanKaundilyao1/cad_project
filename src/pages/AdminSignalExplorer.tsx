import React, { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { SignalTimelineBuilder } from "@/services/intelligence/SignalTimelineBuilder";
import { InternalSignalRebuilder } from "@/services/intelligence/InternalSignalRebuilder";
import { Loader2, Search, Filter, RefreshCw } from "lucide-react";

const AdminSignalExplorer = () => {
  const { toast } = useToast();
  const [signals, setSignals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRebuilding, setIsRebuilding] = useState(false);
  
  const [filters, setFilters] = useState({
    industry: '',
    category: ''
  });

  useEffect(() => {
    loadSignals();
  }, [filters]);

  const loadSignals = async () => {
    try {
      setIsLoading(true);
      const data = await SignalTimelineBuilder.getAllSignalsFiltered(filters);
      setSignals(data);
    } catch (err: any) {
      toast({ title: "Error loading signals", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRebuild = async () => {
    if (!confirm("Are you sure? This will rebuild the entire signal history from internal JAS data.")) return;
    try {
      setIsRebuilding(true);
      const total = await InternalSignalRebuilder.rebuildAll();
      toast({ title: "Rebuild Complete", description: `Generated ${total} historical signals.` });
      loadSignals();
    } catch (err: any) {
      toast({ title: "Error rebuilding signals", description: err.message, variant: "destructive" });
    } finally {
      setIsRebuilding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Search className="h-8 w-8 text-indigo-600" />
              Signal Explorer
            </h1>
            <p className="text-gray-500 mt-2">Filter and analyze extracted signals across all JAS entities.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={loadSignals} variant="outline" disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleRebuild} variant="default" disabled={isRebuilding} className="bg-indigo-600 hover:bg-indigo-700">
              {isRebuilding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Rebuild All Signals
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-64">
              <label className="text-sm font-medium mb-1 block">Industry</label>
              <Input 
                placeholder="Filter by industry..." 
                value={filters.industry}
                onChange={e => setFilters({...filters, industry: e.target.value})}
              />
            </div>
            <div className="w-full md:w-64">
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Input 
                placeholder="Filter by category..." 
                value={filters.category}
                onChange={e => setFilters({...filters, category: e.target.value})}
              />
            </div>
            <Button variant="secondary" onClick={() => setFilters({ industry: '', category: ''})}>
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </CardContent>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Signal</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Reliability</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                    </TableCell>
                  </TableRow>
                ) : signals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                      No signals found. Try adjusting filters or click "Rebuild All Signals".
                    </TableCell>
                  </TableRow>
                ) : (
                  signals.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="whitespace-nowrap text-sm text-gray-500">
                        {new Date(s.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {s.companies?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {s.signal_definitions?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>{s.signal_definitions?.category}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${s.confidence >= 90 ? 'bg-green-500' : s.confidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                              style={{ width: `${s.confidence || 0}%`}} 
                            />
                          </div>
                          <span className="text-xs text-gray-500">{s.confidence || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={
                          s.reliability === 'high' ? 'bg-green-100 text-green-700' :
                          s.reliability === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100'
                        }>
                          {s.reliability}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{s.raw_source}</TableCell>
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

export default AdminSignalExplorer;
