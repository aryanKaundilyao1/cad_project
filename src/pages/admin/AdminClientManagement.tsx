import React, { useState, useEffect } from 'react';
import { Users, Search, Target, Briefcase, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function AdminClientManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jas_companies')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) {
      setClients(data);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" /> Client Management
          </h1>
          <p className="text-muted-foreground">Manage workspaces, route leads, and oversee client accounts.</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Search Clients</CardTitle>
          <CardDescription>Find client workspaces by name or email.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company name or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button>Search</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading clients...</div>
        ) : clients.filter(c => 
            (c.company_name && c.company_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
            (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
          ).map(client => (
          <Card key={client.id} className="shadow-sm overflow-hidden border-border hover:border-primary/50 transition-colors">
             <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold">{client.company_name}</h3>
                    <Badge variant={client.account_type === 'premium' ? 'default' : 'secondary'}>{client.account_type || 'Free'}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" /> {client.email}
                  </div>
               </div>
               
               <div className="flex items-center gap-6 text-sm">
                 <div className="flex flex-col gap-2 ml-4">
                   <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate(`/admin/lead-import/${client.id}`)}>
                     <Target className="h-4 w-4" /> Import Leads
                   </Button>
                 </div>
               </div>
             </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
