import React from 'react';
import { Outlet, useLocation, Link, Navigate, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/ClientWorkspaceContext';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Crown, LayoutDashboard, Zap, Box, Database, Target, 
  MessageSquare, BarChart2, Settings, Users, Megaphone, 
  Briefcase, Activity 
} from 'lucide-react';

export function ClientWorkspaceLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const { activeClient, company, products, loading, activeProduct, setActiveProduct } = useWorkspace();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const clientName = activeClient?.name || company?.name || 'Your Business';

  React.useEffect(() => {
    if (products && products.length > 0) {
      const match = location.pathname.match(/\/workspace\/product\/([^\/]+)/);
      if (match && match[1] && match[1] !== 'undefined') {
        const id = match[1];
        const prod = products.find(p => p.id === id);
        if (prod && prod.id !== activeProduct?.id) {
          setActiveProduct(prod);
        }
      } else if (!activeProduct && products.length > 0) {
        setActiveProduct(products[0]);
      }
    }
  }, [location.pathname, products, activeProduct, setActiveProduct]);

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <div className="flex-1 flex pt-16">
        {/* Left Sidebar */}
        <div className="w-64 bg-card border-r border-border hidden lg:flex flex-col h-[calc(100vh-4rem)] fixed left-0 overflow-y-auto shadow-[2px_0_10px_rgba(0,0,0,0.02)] z-10">
          <div className="p-4 flex-1">
            
            <div className="flex items-center gap-2 mb-6 mt-2 px-2 text-foreground font-editorial font-bold text-xl">
              <Crown className="h-5 w-5 text-accent" />
              <span className="truncate">{clientName}</span>
            </div>

            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4 px-2">WORKSPACE TOOLS</div>
            <nav className="space-y-1 mb-6">
              <SidebarLink to="/workspace" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" isActive={isActive('/workspace') && location.pathname === '/workspace'} />
              <SidebarLink to="/workspace/opportunities" icon={<Zap className="h-4 w-4" />} label="Opportunity Intelligence" isActive={isActive('/workspace/opportunities')} />
              <SidebarLink to="/workspace/crm" icon={<Users className="h-4 w-4" />} label="CRM" isActive={isActive('/workspace/crm')} />
              <SidebarLink to="/workspace/gtm" icon={<Megaphone className="h-4 w-4" />} label="GTM Campaigns" isActive={isActive('/workspace/gtm')} />
              <SidebarLink to="/workspace/catalogue" icon={<Box className="h-4 w-4" />} label="Products & Services" isActive={isActive('/workspace/catalogue')} />
            </nav>

            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">YOUR PRODUCTS</div>
            <Accordion type="single" collapsible className="w-full space-y-2" value={activeProduct?.id}>
              {products?.map(product => (
                <AccordionItem key={product.id} value={product.id} className="border-none">
                  <AccordionTrigger 
                    className={`px-3 py-2 rounded-md text-sm hover:no-underline transition-colors ${activeProduct?.id === product.id ? 'bg-primary/5 text-primary font-medium' : 'text-foreground/70 hover:bg-muted'}`}
                    onClick={() => {
                      setActiveProduct(product);
                      if (!location.pathname.includes(`/workspace/product/${product.id}`)) {
                        navigate(`/workspace/product/${product.id}`);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span className="truncate">{product.name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-0 px-2">
                    <nav className="space-y-1 border-l border-border ml-2 pl-2">
                      <SidebarLink to={`/workspace/product/${product.id}/leads`} icon={<Database className="h-3 w-3" />} label="Scored Leads" isActive={isActive(`/workspace/product/${product.id}/leads`)} />
                      <SidebarLink to={`/workspace/product/${product.id}`} icon={<BarChart2 className="h-3 w-3" />} label="Analytics" isActive={isActive(`/workspace/product/${product.id}`) && !location.pathname.includes('/leads')} />
                    </nav>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {(!products || products.length === 0) && (
              <div className="px-3 py-4 text-sm text-muted-foreground italic text-center bg-background rounded-md border border-dashed mt-2">
                No products yet. <br/><Link to="/workspace/catalogue/new" className="text-primary hover:underline font-medium mt-1 inline-block">Add Product</Link>
              </div>
            )}

            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-8 px-2">SYSTEM</div>
            <nav className="space-y-1">
              <SidebarLink to="/workspace/settings" icon={<Settings className="h-4 w-4" />} label="Settings" isActive={isActive('/workspace/settings')} />
            </nav>

          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64 flex flex-col bg-background/50">
          <div className="p-6">
             <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarLink({ to, icon, label, isActive, className = "" }: { to: string; icon: React.ReactNode; label: string; isActive: boolean; className?: string }) {
  return (
    <Link to={to} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-primary border border-primary/20 text-primary-foreground font-medium shadow-sm' : 'text-foreground/70 hover:bg-muted/80'} ${className}`}>
      {icon} <span className="truncate">{label}</span>
    </Link>
  );
}
