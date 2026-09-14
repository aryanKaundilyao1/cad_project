import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyBadge } from "@/components/CompanyBadge";
import { Loader2 } from "lucide-react";

const CompanyProfile = () => {
  const { id } = useParams();

  // Fetch company profile
  const { data: company, isLoading } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      return data;
    },
  });

  // Fetch vendor portfolio projects
  const { data: portfolioProjects = [] } = useQuery({
    queryKey: ["vendor-portfolio", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("vendor_portfolio")
        .select("*")
        .eq("vendor_id", id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return [];
      }

      return data || [];
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="container mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {company?.company_name || company?.full_name || "Company"}
              <CompanyBadge profile={company} />
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Description */}
            <p>
              {company?.description || "No company description yet."}
            </p>

            {/* Email */}
            {company?.email && (
              <p>
                <strong>Email:</strong> {company.email}
              </p>
            )}

            {/* Phone */}
            {company?.phone && (
              <p>
                <strong>Phone:</strong> {company.phone}
              </p>
            )}

            {/* Portfolio Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Portfolio Projects</CardTitle>
              </CardHeader>

              <CardContent className="grid md:grid-cols-2 gap-4">
                {portfolioProjects.length === 0 && (
                  <p className="text-muted-foreground">
                    No portfolio projects yet.
                  </p>
                )}

                {portfolioProjects.map((project: any) => (
                  <div
                    key={project.id}
                    className="border rounded-lg p-4"
                  >
                    {/* Image */}
                    <img
                      src={project.image_url || "/placeholder.jpg"}
                      alt={project.title}
                      className="rounded mb-3 w-full h-40 object-cover"
                    />

                    {/* Title */}
                    <h3 className="font-semibold">
                      {project.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground">
                      {project.description}
                    </p>

                    {/* Project Value */}
                    {project.project_value && (
                      <p className="text-primary font-semibold mt-2">
                        ₹{Number(project.project_value).toLocaleString("en-IN")}
                      </p>
                    )}

                    {/* Location */}
                    {project.location && (
                      <p className="text-xs text-muted-foreground">
                        {project.location}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* External Portfolio Link */}
            {company?.portfolio_url && (
              <p>
                <strong>Portfolio:</strong>{" "}
                <a
                  href={company.portfolio_url}
                  className="text-primary underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit Website
                </a>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default CompanyProfile;