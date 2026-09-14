import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Filter, AlertCircle, Radar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignalBadge } from "@/components/intelligence/SignalBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Signal } from "@/lib/intelligence/BaseSignalExtractor";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";

export default function SignalExplorer() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStrength, setFilterStrength] = useState<string>("All");

  useEffect(() => {
    fetchSignals();
  }, [filterStrength]);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      let query = supabase.from('signals').select('*').order('detected_at', { ascending: false }).limit(50);
      
      if (filterStrength !== 'All') {
        query = query.eq('signal_strength', filterStrength);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setSignals(data as Signal[]);
    } catch (err) {
      console.error("Error fetching signals:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSignals = signals.filter(sig => 
    sig.signal_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sig.signal_source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sig.raw_payload?.title && sig.raw_payload.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6 pt-24 max-w-7xl mx-auto">
      <Navigation />
      
      <div className="bg-card/40 border border-white/5 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500/10 border border-purple-500/20">
            <Radar className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Signal Explorer</h1>
            <p className="text-sm text-muted-foreground">Search, filter, and explore all business intelligence signals.</p>
          </div>
        </div>
      </div>

      <Card className="bg-card/40 border-white/5">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search signals by type, source, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-black/20 border-white/10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground mr-2">Strength:</span>
              <div className="flex gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
                {['All', 'Critical', 'High', 'Medium', 'Low'].map(strength => (
                  <Button
                    key={strength}
                    variant={filterStrength === strength ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setFilterStrength(strength)}
                    className="h-7 text-xs"
                  >
                    {strength}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="rounded-md border border-white/5 overflow-hidden">
              <Table>
                <TableHeader className="bg-black/20">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead>Type & Source</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Strength</TableHead>
                    <TableHead>Context</TableHead>
                    <TableHead className="text-right">Detected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSignals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        <AlertCircle className="w-5 h-5 mx-auto mb-2 opacity-50" />
                        No signals found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSignals.map((signal) => (
                      <TableRow key={signal.id} className="border-white/5 hover:bg-white/[0.02]">
                        <TableCell>
                          <div className="font-medium text-foreground/90">{signal.signal_type}</div>
                          <div className="text-xs text-muted-foreground mt-1">{signal.signal_source}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={signal.confidence_score >= 80 ? 'default' : 'secondary'} className={signal.confidence_score >= 80 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : ''}>
                            {signal.confidence_score}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <SignalBadge strength={signal.signal_strength} />
                        </TableCell>
                        <TableCell>
                          {signal.raw_payload?.title ? (
                            <span className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]" title={signal.raw_payload.title}>
                              {signal.raw_payload.title}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {signal.detected_at && format(new Date(signal.detected_at), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
