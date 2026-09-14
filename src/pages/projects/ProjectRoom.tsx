import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Building2, Calendar, MapPin, DollarSign, Wallet, FileText, CheckCircle2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// Components
import Timeline from "@/components/project/Timeline";
import Chat from "@/components/project/Chat";

const ProjectRoom = () => {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDesc, setPaymentDesc] = useState("");
  const [paymentType, setPaymentType] = useState("expense");
  const [addingPayment, setAddingPayment] = useState(false);

  const { data: projectData, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      // Fetch Project
      const { data: project, error: projError } = await supabase
        .from("projects")
        .select("*, leads(project_type), profiles!projects_client_id_fkey(full_name, company_name, email)")
        .eq("id", id)
        .single();
      
      if (projError) throw projError;

      // Fetch Vendors
      const { data: vendors } = await supabase
        .from("project_vendors")
        .select("profiles(id, full_name, company_name)")
        .eq("project_id", id);

      // Fetch Phases
      const { data: phases } = await supabase
        .from("project_phases")
        .select("*")
        .eq("project_id", id)
        .order("order_index", { ascending: true });

      // Fetch Tasks
      const { data: tasks } = await supabase
        .from("project_tasks")
        .select("*")
        .in("phase_id", phases?.map(p => p.id) || []);

      // Fetch Payments
      const { data: payments } = await supabase
        .from("project_payments")
        .select("*, profiles(full_name, company_name)")
        .eq("project_id", id)
        .order("created_at", { ascending: false });

      // Fetch Messages
      const { data: messages } = await supabase
        .from("project_messages")
        .select("*, profiles(full_name, company_name, user_type, is_admin)")
        .eq("project_id", id)
        .order("created_at", { ascending: true });

      return {
        project,
        vendors: vendors?.map(v => v.profiles) || [],
        phases: phases || [],
        tasks: tasks || [],
        payments: payments || [],
        messages: messages || []
      };
    },
    enabled: !!id && !!profile,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <p>Project not found.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const { project, vendors, phases, tasks, payments, messages } = projectData;

  const isAdminOrClient = profile?.is_admin || profile?.id === project.client_id;
  const isVendor = vendors.some((v: any) => v.id === profile?.id);

  // Stats Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.is_completed).length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  
  // Tricount Financial Calculations
  const budget = Number(project.budget) || 0;
  const expenses = payments.filter(p => p.payment_type === 'expense' || !p.payment_type);
  const totalProjectCost = expenses.reduce((sum, p) => sum + Number(p.amount), 0);
  
  const clientPaidExpenses = expenses.filter(p => p.paid_by === project.client_id).reduce((sum, p) => sum + Number(p.amount), 0);
  const vendorPaidExpenses = expenses.filter(p => p.paid_by !== project.client_id).reduce((sum, p) => sum + Number(p.amount), 0);
  
  const clientToVendorTransfers = payments.filter(p => p.payment_type === 'transfer').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalClientSpent = clientPaidExpenses + clientToVendorTransfers;
  
  const pendingOwedToVendor = Math.max(0, vendorPaidExpenses - clientToVendorTransfers);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || isNaN(Number(paymentAmount))) return;
    setAddingPayment(true);
    
    const { error } = await supabase.from('project_payments').insert({
      project_id: id,
      amount: Number(paymentAmount),
      description: paymentDesc,
      paid_by: profile?.id,
      payment_type: paymentType
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payment Recorded" });
      setPaymentAmount("");
      setPaymentDesc("");
      queryClient.invalidateQueries({ queryKey: ["project", id] });
    }
    setAddingPayment(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          
          <Button variant="ghost" className="mb-6 gap-2 text-muted-foreground hover:text-foreground pl-0" onClick={() => navigate("/projects")}>
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </Button>

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 bg-card/40 border border-white/5 p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="z-10">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={project.status === 'active' ? 'bg-primary/20 text-primary hover:bg-primary/30 border-0' : ''}>
                  {project.status === 'active' ? 'Active Project' : project.status}
                </Badge>
                {project.leads?.project_type && (
                  <Badge variant="outline" className="border-white/10">{project.leads.project_type}</Badge>
                )}
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">{project.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {project.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {project.location}</span>}
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Started {new Date(project.start_date).toLocaleDateString('en-IN')}</span>
                <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> Client: {project.profiles?.company_name || project.profiles?.full_name}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6 bg-black/20 p-4 rounded-xl border border-white/5 z-10">
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Overall Progress</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-primary">{progressPercent}%</span>
                  <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs UI */}
          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="bg-white/[0.03] border border-white/[0.06] p-1 w-full flex overflow-x-auto justify-start md:justify-center rounded-xl h-14">
              <TabsTrigger value="overview" className="rounded-lg h-10 px-6 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all">Overview</TabsTrigger>
              <TabsTrigger value="timeline" className="rounded-lg h-10 px-6 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all">Phases & Tasks</TabsTrigger>
              <TabsTrigger value="financials" className="rounded-lg h-10 px-6 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all">Financials</TabsTrigger>
              <TabsTrigger value="activity" className="rounded-lg h-10 px-6 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all">Activity & Chat</TabsTrigger>
            </TabsList>

            {/* TAB: OVERVIEW */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <Card className="bg-card/40 border-white/5 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Project Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap">{project.description || "No description provided."}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-card/40 border-white/5 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Assigned Vendors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {vendors.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {vendors.map((v: any) => (
                            <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {(v.company_name || v.full_name)?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{v.company_name || v.full_name}</p>
                                <p className="text-xs text-muted-foreground">Assigned Contractor</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">No vendors assigned yet.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-6">
                  <Card className="bg-card/40 border-white/5 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5 text-emerald-500" /> Financial Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Total Budget</span>
                            <span className="font-semibold text-foreground">₹{budget.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Total Project Cost</span>
                            <span className="font-semibold text-emerald-500">₹{totalProjectCost.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${budget === 0 ? 0 : Math.min(100, Math.round((totalProjectCost / budget) * 100))}%` }} />
                          </div>
                          <p className="text-xs text-right text-muted-foreground mt-2">{budget === 0 ? 0 : Math.round((totalProjectCost / budget) * 100)}% utilized</p>
                        </div>
                        
                        <div className="pt-4 border-t border-white/5 space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Client Spent (Total)</span>
                            <span className="font-medium">₹{totalClientSpent.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Vendor Out of Pocket</span>
                            <span className="font-medium">₹{vendorPaidExpenses.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                            <span className="font-semibold text-amber-500">Pending to Vendor</span>
                            <span className="font-bold text-amber-500">₹{pendingOwedToVendor.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* TAB: TIMELINE */}
            <TabsContent value="timeline">
              <Timeline 
                projectId={id!} 
                phases={phases} 
                tasks={tasks} 
                isAdminOrClient={isAdminOrClient} 
                isVendor={isVendor} 
              />
            </TabsContent>

            {/* TAB: FINANCIALS */}
            <TabsContent value="financials">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-card/40 border-white/5 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Payment History</CardTitle>
                      <CardDescription>Log of all transactions for this project.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {payments.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8 border border-dashed border-white/10 rounded-lg">No payments recorded.</p>
                      ) : (
                        <div className="space-y-3">
                          {payments.map((payment: any) => (
                            <div key={payment.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                  <DollarSign className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-foreground">{payment.description || "Project Payment"}</p>
                                    <Badge variant="outline" className={`text-[10px] py-0 h-4 border-white/10 ${payment.payment_type === 'transfer' ? 'text-amber-500 bg-amber-500/10' : 'text-blue-500 bg-blue-500/10'}`}>
                                      {payment.payment_type === 'transfer' ? 'Transfer' : 'Expense'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <span>{new Date(payment.date || payment.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                    <span>•</span>
                                    <span>Paid by: {payment.profiles?.company_name || payment.profiles?.full_name || 'Unknown'}</span>
                                  </div>
                                </div>
                              </div>
                              <span className="font-bold text-emerald-500">₹{Number(payment.amount).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {(isAdminOrClient || isVendor) && (
                  <div>
                    <Card className="bg-card/40 border-white/5 backdrop-blur-sm sticky top-24">
                      <CardHeader>
                        <CardTitle className="text-lg">Log Payment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleAddPayment} className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Payment Type</label>
                            <div className="flex gap-2">
                              <Button 
                                type="button" 
                                variant={paymentType === 'expense' ? 'default' : 'outline'} 
                                onClick={() => setPaymentType('expense')}
                                className={`flex-1 ${paymentType === 'expense' ? 'bg-blue-600 hover:bg-blue-700' : 'border-white/10'}`}
                              >
                                Project Expense
                              </Button>
                              <Button 
                                type="button" 
                                variant={paymentType === 'transfer' ? 'default' : 'outline'} 
                                onClick={() => setPaymentType('transfer')}
                                className={`flex-1 ${paymentType === 'transfer' ? 'bg-amber-600 hover:bg-amber-700' : 'border-white/10'}`}
                              >
                                Direct Transfer
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {paymentType === 'expense' ? 'Money spent on materials, labor, etc.' : 'Money sent from Client to Vendor.'}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Amount (₹)</label>
                            <Input 
                              type="number" 
                              placeholder="e.g. 50000" 
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              className="bg-white/5 border-white/10"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Input 
                              placeholder="e.g. Advance Payment for Steel" 
                              value={paymentDesc}
                              onChange={(e) => setPaymentDesc(e.target.value)}
                              className="bg-white/5 border-white/10"
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full gap-2" disabled={addingPayment}>
                            {addingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Record Transaction
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB: ACTIVITY */}
            <TabsContent value="activity">
              <Chat projectId={id!} messages={messages} />
            </TabsContent>

          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProjectRoom;
