import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, Star, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Portfolio = () => {
  const { data: stats } = useQuery({
    queryKey: ["portfolio-stats"],
    queryFn: async () => {
      const [leads, profiles, reviews] = await Promise.all([
        supabase.from("leads").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("user_type", "company"),
        supabase.from("reviews").select("rating"),
      ]);
      const avgRating = reviews.data?.length
        ? (reviews.data.reduce((s, r) => s + r.rating, 0) / reviews.data.length).toFixed(1)
        : "4.8";
      return {
        totalProjects: leads.count || 0,
        verifiedCompanies: profiles.count || 0,
        totalReviews: reviews.data?.length || 0,
        avgRating,
      };
    },
  });

  const { data: recentLeads, isLoading } = useQuery({
    queryKey: ["completed-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, profiles!leads_seller_id_fkey(company_name, full_name)")
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  const statCards = [
    { label: "Total Projects", value: stats ? `${stats.totalProjects}+` : "—", icon: CheckCircle2 },
    { label: "Verified Companies", value: stats ? `${stats.verifiedCompanies}+` : "—", icon: Building2 },
    { label: "Reviews", value: stats ? `${stats.totalReviews}` : "—", icon: Star },
    { label: "Avg Rating", value: stats ? `${stats.avgRating}/5` : "—", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="flex-1">
        <section className="bg-gradient-to-b from-background to-secondary py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-display font-bold mb-4">Success Stories</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Showcasing projects and partnerships facilitated through JAS CONNECT
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-6">
              {statCards.map((stat, i) => (
                <Card key={i} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <stat.icon className="h-10 w-10 mx-auto mb-3 text-primary" />
                    <CardTitle className="text-3xl font-bold text-primary">{stat.value}</CardTitle>
                    <CardDescription className="font-medium">{stat.label}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Projects */}
        <section className="py-12 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold mb-4">Recent Projects</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Projects listed on JAS CONNECT</p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {recentLeads?.map((lead: any) => (
                  <Card key={lead.id} className="hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-primary to-accent" />
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <Badge className={lead.status === "active" ? "bg-success text-success-foreground" : "bg-muted"}>{lead.status}</Badge>
                        {lead.category && <Badge variant="outline">{lead.category}</Badge>}
                      </div>
                      <CardTitle className="text-xl mb-2">{lead.title}</CardTitle>
                      <CardDescription>
                        <p>Posted by: {lead.profiles?.company_name || lead.profiles?.full_name || "Buyer"}</p>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{lead.location}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Office */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Our Office</CardTitle>
                <CardDescription>Visit us or get in touch for any assistance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Address</h3>
                  <p className="text-muted-foreground">
                    JAS CONNECT<br />
                    Delta-1, Greater Noida, India
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Contact</h3>
                  <p className="text-muted-foreground">
                    Email: jasinfra.connect@gmail.com<br />
                    Business Hours: Mon-Sat, 9:00 AM - 6:00 PM
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Portfolio;
