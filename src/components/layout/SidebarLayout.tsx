import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Target, CheckSquare, Activity, Users, Building, Search, Bookmark, PlusCircle, Globe, Briefcase, Download, BarChart2, GitPullRequest, Zap, Lock, Database, Settings } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Paid-only routes that require a non-free subscription
const PAID_ONLY_PATHS = [
  '/discovery',
  '/opportunities',
  '/accounts',
  '/contacts',
  '/tasks',
  '/activity',
  '/action-center',
  '/tools/scraper',
  '/tools/enrichment',
  '/tools/research',
];

export function SidebarLayout() {
  const location = useLocation();
  const { profile, loading, user } = useAuth() as any;
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname.startsWith(path);

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // If not logged in at all, redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isTrialClient = user?.email === 'trial1@jasconnectt.in';
  const isFreePlan = false; // The client gets access to all features because they are already paying

  // Check if current path requires a paid plan
  const requiresPaid = PAID_ONLY_PATHS.some(p => location.pathname.startsWith(p));

  if (isFreePlan && requiresPaid) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center pt-16">
          <div className="text-center max-w-md p-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Upgrade to Access This Feature</h2>
            <p className="text-muted-foreground mb-6">
              This feature is available on Basic, Premium, or Elite plans. Upgrade to unlock your full CRM, Discovery, and AI opportunity intelligence workspace.
            </p>
            <Button onClick={() => navigate('/pricing')} size="lg" className="w-full">
              View Pricing Plans
            </Button>
            <Button variant="ghost" onClick={() => navigate('/tenders')} className="mt-2 w-full">
              Browse Free Lead Database
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <div className="flex-1 flex pt-16">
        {/* Left Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-900 border-r border-border hidden lg:flex flex-col h-[calc(100vh-4rem)] fixed left-0 overflow-y-auto shadow-sm z-10">
          <div className="p-4 flex-1">
            
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4 px-2">WORKSPACE</div>
            <nav className="space-y-1">
              <Link to="/app/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive('/app/dashboard') ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/70 hover:bg-muted'}`}>
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              <SidebarLink to="/app/crm" icon={<Users className="h-4 w-4" />} label="CRM" isActive={isActive('/app/crm')} locked={isFreePlan} />
            </nav>

            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-8 px-2">INTELLIGENCE</div>
            <nav className="space-y-1">
              <SidebarLink to="/app/discovery" icon={<Search className="h-4 w-4" />} label="Discovery" isActive={isActive('/app/discovery')} locked={isFreePlan} />
              <SidebarLink to="/app/opportunities" icon={<Zap className="h-4 w-4" />} label="Opportunity Intelligence" isActive={isActive('/app/opportunities')} locked={isFreePlan} />
              <SidebarLink to="/app/tenders" icon={<Database className="h-4 w-4" />} label="Lead Database" isActive={isActive('/app/tenders')} locked={isFreePlan} />
              <SidebarLink to="/app/tools/research" icon={<Globe className="h-4 w-4" />} label="Research" isActive={isActive('/app/tools/research')} locked={isFreePlan} />
              <SidebarLink to="/app/scoring" icon={<Target className="h-4 w-4" />} label="Scoring" isActive={isActive('/app/scoring')} locked={isFreePlan} />
            </nav>

            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-8 px-2">INSIGHTS & TOOLS</div>
            <nav className="space-y-1">
              <SidebarLink to="/app/analytics" icon={<BarChart2 className="h-4 w-4" />} label="Analytics" isActive={isActive('/app/analytics')} locked={isFreePlan} />
              <SidebarLink to="/app/reports" icon={<Briefcase className="h-4 w-4" />} label="Reports" isActive={isActive('/app/reports')} locked={isFreePlan} />
              <SidebarLink to="/app/saved-leads" icon={<Bookmark className="h-4 w-4" />} label="Saved Leads" isActive={isActive('/app/saved-leads')} locked={isFreePlan} />
              <SidebarLink to="/settings" icon={<Settings className="h-4 w-4" />} label="Settings" isActive={isActive('/settings')} locked={isFreePlan} />
            </nav>

          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64 overflow-x-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

// Helper component for sidebar links with lock state
function SidebarLink({ to, icon, label, isActive, locked }: { to: string; icon: React.ReactNode; label: string; isActive: boolean; locked: boolean }) {
  if (locked) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground/40 cursor-not-allowed select-none">
        {icon} {label}
        <Lock className="h-3 w-3 ml-auto" />
      </div>
    );
  }
  return (
    <Link to={to} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/70 hover:bg-muted'}`}>
      {icon} {label}
    </Link>
  );
}
