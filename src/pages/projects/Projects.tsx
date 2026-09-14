import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Briefcase, Plus, MapPin, Calendar, Clock, Crown, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const Projects = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    location: "",
    budget: "",
    contractorEmail: ""
  });
  const [creating, setCreating] = useState(false);

  // Premium Access Check
  const isPremium = profile?.subscription_plan === "premium" || profile?.subscription_plan === "elite";

  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ["projects", profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      return data;
    },
    enabled: !!profile && isPremium,
  });

  const handleCreateCustomProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setCreating(true);
    try {
      // 1. Create the project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          client_id: profile.id,
          title: newProject.title,
          description: newProject.description,
          location: newProject.location,
          budget: newProject.budget ? parseFloat(newProject.budget) : null,
          status: "active"
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // 2. If contractor email is provided, try to find them and add to project
      if (newProject.contractorEmail) {
        const { data: contractors } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", newProject.contractorEmail.toLowerCase());
          
        if (contractors && contractors.length > 0) {
          await supabase.from("project_vendors").insert({
            project_id: project.id,
            vendor_id: contractors[0].id
          });
        }
      }

      toast({ title: "Project Created", description: "Your custom project has been set up." });
      setCreateDialogOpen(false);
      setNewProject({ title: "", description: "", location: "", budget: "", contractorEmail: "" });
      refetch();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center pt-20">
          <Card className="max-w-md mx-4 bg-card/95 backdrop-blur-xl border-white/10">
            <CardHeader className="text-center">
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to view your projects.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/auth")} className="w-full">Sign In</Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full">
            <Card className="border-primary/20 bg-black/40 backdrop-blur-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-bl-full -z-10 blur-3xl" />
              <CardContent className="pt-12 pb-12 text-center relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-4 ring-primary/5">
                  <Crown className="w-10 h-10 text-amber-400" />
                </div>
                <h2 className="text-3xl font-display font-bold mb-3 text-white">Project Execution System</h2>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                  Upgrade to Premium or Elite to unlock our dedicated Project Room. Manage phases, track financials, and collaborate seamlessly.
                </p>
                <div className="flex gap-4">
                  <Button variant="outline" className="border-white/10 text-white" onClick={() => navigate("/dashboard")}>
                    Back to Dashboard
                  </Button>
                  <Button onClick={() => navigate("/pricing")} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0 text-white gap-2">
                    Upgrade Now <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
                <Briefcase className="w-8 h-8 text-primary" /> My Projects
              </h1>
              <p className="text-muted-foreground mt-1">Manage your active projects and track execution.</p>
            </div>
            {profile?.user_type === 'client' && (
              <div className="flex gap-2">
                <Button onClick={() => navigate("/dashboard")} variant="outline" className="gap-2 border-white/10">
                  <Plus className="w-4 h-4" /> New from Tenders
                </Button>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" /> Create Custom Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-xl border-white/10">
                    <DialogHeader>
                      <DialogTitle>Create Custom Project</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateCustomProject} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Project Name *</Label>
                        <Input value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} required className="bg-white/5 border-white/10" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} className="bg-white/5 border-white/10" rows={3} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input value={newProject.location} onChange={e => setNewProject({...newProject, location: e.target.value})} className="bg-white/5 border-white/10" />
                        </div>
                        <div className="space-y-2">
                          <Label>Budget (₹)</Label>
                          <Input type="number" value={newProject.budget} onChange={e => setNewProject({...newProject, budget: e.target.value})} className="bg-white/5 border-white/10" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Contractor Email (Optional)</Label>
                        <Input type="email" value={newProject.contractorEmail} onChange={e => setNewProject({...newProject, contractorEmail: e.target.value})} placeholder="Invite via email..." className="bg-white/5 border-white/10" />
                      </div>
                      <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} className="border-white/10">Cancel</Button>
                        <Button type="submit" disabled={creating}>{creating ? "Creating..." : "Create Project"}</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !projects || projects.length === 0 ? (
            <Card className="bg-white/[0.02] border-white/5">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Briefcase className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No active projects</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Projects are created automatically when a requirement is converted. Check your dashboard to convert bids to projects.
                </p>
                <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, idx) => (
                <motion.div key={project.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                  <Link to={`/projects/${project.id}`} className="block group">
                    <Card className="h-full bg-card/40 border-white/5 hover:border-primary/30 hover:bg-card/60 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <Badge variant={project.status === 'completed' ? 'secondary' : 'default'} 
                                 className={project.status === 'active' ? 'bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30' : ''}>
                            {project.status === 'active' ? 'Active' : project.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(project.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {project.title}
                        </h3>
                        
                        <div className="space-y-2 mb-6">
                          {project.location && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground/70" /> {project.location}
                            </p>
                          )}
                          {project.budget && (
                            <p className="text-sm font-medium text-foreground flex items-center gap-2">
                              <span className="w-4 h-4 flex items-center justify-center text-muted-foreground/70">₹</span> 
                              {Number(project.budget).toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>
                        
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full w-[0%]" />
                        </div>
                        <p className="text-xs text-muted-foreground text-right mt-2">Just Started</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Projects;
