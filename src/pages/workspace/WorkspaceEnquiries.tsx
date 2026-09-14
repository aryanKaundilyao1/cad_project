import React, { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/ClientWorkspaceContext';
import { MessageSquare, Calendar, Phone, Mail, CheckCircle, Clock, Archive, Ban, ArrowRight, UserPlus, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const WorkspaceEnquiries = () => {
  const { company } = useWorkspace();
  const { productId } = useParams();
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (company) {
      fetchEnquiries();
    }
  }, [company, productId]);

  const fetchEnquiries = async () => {
    setLoading(true);
    let query = supabase
      .from('marketplace_enquiries')
      .select(`
        *,
        products (name)
      `)
      .eq('company_id', company?.id)
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }
      
    const { data, error } = await query;
      
    if (data) {
      setEnquiries(data);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('marketplace_enquiries').update({ status: newStatus }).eq('id', id);
    if (!error) {
      toast({ title: "Status Updated", description: `Enquiry marked as ${newStatus}` });
      fetchEnquiries();
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const convertToCRM = async (enq: any) => {
    try {
      // Create CRM lead
      const { data, error } = await supabase.from('crm_leads').insert([{
        company_id: company?.id,
        name: enq.buyer_name,
        company_name: enq.buyer_company || 'Unknown Company',
        email: enq.buyer_email,
        phone: enq.buyer_phone,
        status: 'New',
        source: 'Marketplace Enquiry',
        notes: `Requirement: ${enq.message}\nQuantity: ${enq.required_quantity}\nTarget Price: ${enq.target_price}`
      }]);

      if (error) throw error;

      await updateStatus(enq.id, 'Converted');
      toast({ title: "Converted to Lead", description: "Enquiry successfully converted to a CRM Lead." });
    } catch (err: any) {
      toast({ title: "Conversion Failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><MessageSquare className="h-8 w-8 text-primary" /> Marketplace Enquiries</h1>
          <p className="text-muted-foreground mt-1">Manage all incoming buyer enquiries and quotes from your marketplace profile.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading enquiries...</div>
        ) : enquiries.length === 0 ? (
          <div className="text-center py-16 bg-card border border-dashed rounded-xl border-border">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-lg font-medium text-foreground">No enquiries found</p>
            <p className="text-muted-foreground">You don't have any marketplace enquiries yet.</p>
          </div>
        ) : (
          enquiries.map((enq) => (
            <Card key={enq.id} className={`shadow-sm overflow-hidden border ${enq.status === 'New' ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border'}`}>
              <div className={`h-1 w-full ${enq.status === 'New' ? 'bg-primary' : 'bg-muted'}`} />
              <CardHeader className="flex flex-col md:flex-row md:items-start justify-between bg-muted/10 pb-4 border-b">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {enq.status === 'New' && <Badge className="bg-primary hover:bg-primary">New Enquiry</Badge>}
                    <Badge variant="outline" className="bg-red-50 dark:bg-red-950/20 text-red-600 border-red-200 dark:border-red-900">{enq.priority || 'High'} Priority</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 ml-2">
                      <Clock className="h-3 w-3" /> 
                      {enq.created_at ? formatDistanceToNow(new Date(enq.created_at), { addSuffix: true }) : 'Unknown date'}
                    </span>
                  </div>
                  <CardTitle className="text-xl mt-1">{enq.buyer_name} <span className="text-muted-foreground font-normal text-base">from</span> {enq.buyer_company || 'Unknown Company'}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2 font-medium text-foreground">
                    Interested in: <span className="text-primary">{enq.products?.name || 'General Enquiry'}</span>
                  </CardDescription>
                </div>
                <div className="mt-4 md:mt-0 flex gap-2">
                  <Badge variant={
                    enq.status === 'Converted' ? 'default' : 
                    enq.status === 'Rejected' ? 'destructive' : 
                    enq.status === 'Replied' ? 'secondary' : 'outline'
                  } className="px-3 py-1 text-sm">
                    {enq.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Left Column - Details */}
                  <div className="p-6 md:w-1/3 bg-muted/5 border-r border-border">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b pb-2">Buyer Details</h4>
                    <div className="space-y-3 text-sm">
                      <p className="flex items-center gap-3 text-foreground"><Mail className="h-4 w-4 text-muted-foreground" /> {enq.buyer_email}</p>
                      {enq.buyer_phone && <p className="flex items-center gap-3 text-foreground"><Phone className="h-4 w-4 text-muted-foreground" /> {enq.buyer_phone}</p>}
                      {enq.buyer_whatsapp && <p className="flex items-center gap-3 text-foreground"><MessageSquare className="h-4 w-4 text-green-500" /> {enq.buyer_whatsapp} (WhatsApp)</p>}
                      {enq.buyer_country && <p className="flex items-center gap-3 text-foreground"><Globe className="h-4 w-4 text-muted-foreground" /> {enq.buyer_country}</p>}
                    </div>

                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 mt-8 border-b pb-2">Requirement Specs</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-medium">{enq.required_quantity || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Target Price:</span>
                        <span className="font-medium">{enq.target_price || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery:</span>
                        <span className="font-medium">{enq.expected_delivery || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column - Message & Actions */}
                  <div className="p-6 md:w-2/3 flex flex-col">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b pb-2">Message</h4>
                    <div className="bg-muted/20 p-4 rounded-lg border border-border/50 text-sm whitespace-pre-wrap flex-grow mb-6">
                      {enq.message}
                    </div>
                    
                    <div className="mt-auto flex flex-wrap gap-3 pt-4 border-t border-border">
                      {enq.status !== 'Converted' && (
                        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => convertToCRM(enq)}>
                          <UserPlus className="h-4 w-4" /> Convert to CRM Lead
                        </Button>
                      )}
                      
                      {enq.status === 'New' && (
                        <Button variant="outline" className="gap-2" onClick={() => updateStatus(enq.id, 'Replied')}>
                          <ArrowRight className="h-4 w-4" /> Mark as Replied
                        </Button>
                      )}
                      
                      {enq.status !== 'Rejected' && enq.status !== 'Converted' && (
                        <Button variant="ghost" className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 ml-auto" onClick={() => updateStatus(enq.id, 'Rejected')}>
                          <Ban className="h-4 w-4" /> Reject
                        </Button>
                      )}
                      
                      <Button variant="ghost" className="gap-2 text-muted-foreground" onClick={() => updateStatus(enq.id, 'Archived')}>
                        <Archive className="h-4 w-4" /> Archive
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkspaceEnquiries;
