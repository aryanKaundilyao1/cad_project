import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CrmSidebar } from "@/components/crm/CrmSidebar";
import CrmLeadsView from "@/components/crm/CrmLeadsView";
import { WebsiteScraperView } from "@/components/crm/WebsiteScraperView";
import { SavedCompaniesView } from "@/components/crm/SavedCompaniesView";
import { EnrichmentView } from "@/components/crm/EnrichmentView";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Dashboard3 from "@/pages/dashboard/Dashboard3";

type ModuleType = 'dashboard' | 'leads' | 'scraper' | 'enrichment' | 'research' | 'saved' | 'export';

const CRM = () => {
  const { user } = useAuth() as any;
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardHeader className="text-center">
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to access CRM.</CardDescription>
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

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard3 />;
      case 'leads':
        return <CrmLeadsView />;
      case 'scraper':
        return <WebsiteScraperView />;
      case 'enrichment':
        return <EnrichmentView />;
      case 'research':
        // For now, redirecting research to Scraper as it encompasses AI Research
        return <WebsiteScraperView />;
      case 'saved':
        return <SavedCompaniesView />;
      case 'export':
        // A placeholder for Export Center. Can be expanded later.
        return (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Export Center</h2>
            <p className="text-muted-foreground">Export functionality is available directly within the Leads and Saved Companies views.</p>
          </div>
        );
      default:
        return <CrmLeadsView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 pt-16 flex">
        <CrmSidebar activeModule={activeModule} onModuleChange={setActiveModule} />
        <main className="flex-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {renderModule()}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default CRM;
