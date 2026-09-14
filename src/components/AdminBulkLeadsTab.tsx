import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Trash2, Edit2, Loader2, MoreHorizontal, CheckSquare, Settings2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminBulkLeadsTab() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const limit = 50;
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();
    setSelectedLeads(new Set()); // Reset selections on page change
  }, [page]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (searchQuery) {
        query = query.or(`company_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
      }

      const { data, count, error } = await query;

      if (error) throw error;
      setLeads(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error fetching leads', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchLeads();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) return;
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Lead deleted' });
      fetchLeads();
    } catch (err: any) {
      toast({ title: 'Delete Failed', description: err.message, variant: 'destructive' });
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLeads(newSelected);
  };

  const toggleAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map(l => l.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedLeads.size} leads? This action cannot be undone.`)) return;
    
    setIsBulkDeleting(true);
    try {
      const idsToDelete = Array.from(selectedLeads);
      const { error } = await supabase.from('leads').delete().in('id', idsToDelete);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: `Deleted ${selectedLeads.size} leads.` });
      setSelectedLeads(new Set());
      fetchLeads();
    } catch (err: any) {
      toast({ title: 'Delete Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Bulk Lead Management
              </CardTitle>
              <CardDescription>
                Search, modify, or delete leads directly from the master database.
              </CardDescription>
            </div>
            {selectedLeads.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400 mr-2">{selectedLeads.size} selected</span>
                <Button variant="outline" size="sm" className="border-slate-800" onClick={() => toast({ title: "Bulk editing coming soon" })}>
                  <Settings2 className="w-4 h-4 mr-2" /> Bulk Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                  {isBulkDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />} 
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by company name, phone, email, or title..."
                className="pl-10 bg-slate-950 border-slate-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading}>
              Search
            </Button>
          </form>

          <div className="border border-slate-800 rounded-md overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-950">
                <TableRow className="border-slate-800">
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={leads.length > 0 && selectedLeads.size === leads.length} 
                      onCheckedChange={toggleAll} 
                      className="border-slate-700 data-[state=checked]:bg-blue-600"
                    />
                  </TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                      No leads found.
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id} className="border-slate-800 bg-slate-900/30">
                      <TableCell>
                        <Checkbox 
                          checked={selectedLeads.has(lead.id)} 
                          onCheckedChange={() => toggleSelection(lead.id)} 
                          className="border-slate-700 data-[state=checked]:bg-blue-600"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {lead.company_name || lead.title}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{lead.email || 'No email'}</div>
                          <div className="text-slate-400">{lead.phone || 'No phone'}</div>
                        </div>
                      </TableCell>
                      <TableCell>{lead.location || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-blue-900 text-blue-400 bg-blue-950">
                          {lead.quality_score}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={lead.status === 'active' ? 'border-green-900 text-green-400 bg-green-950' : 'border-slate-800 text-slate-400'}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => toast({ title: 'Inline editing coming soon' })}>
                              <Edit2 className="mr-2 h-4 w-4" /> Edit Lead
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-800" />
                            <DropdownMenuItem className="text-red-500 cursor-pointer focus:text-red-500 focus:bg-red-500/10" onClick={() => handleDelete(lead.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-slate-400">
              Showing {Math.min(page * limit + 1, totalCount)} to {Math.min((page + 1) * limit, totalCount)} of {totalCount} leads
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-slate-800 bg-slate-950"
                disabled={page === 0 || loading}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                className="border-slate-800 bg-slate-950"
                disabled={(page + 1) * limit >= totalCount || loading}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
