import { 
  Users, 
  Globe, 
  Search, 
  Bookmark, 
  Download,
  Building,
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Briefcase } from "lucide-react";

type ModuleType = 'dashboard' | 'leads' | 'scraper' | 'enrichment' | 'research' | 'saved' | 'export';

interface CrmSidebarProps {
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
}

const CRM_MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'scraper', label: 'Website Scraper', icon: Globe },
  { id: 'enrichment', label: 'Company Enrichment', icon: Briefcase },
  { id: 'research', label: 'Company Research', icon: Search },
  { id: 'saved', label: 'Saved Companies', icon: Bookmark },
  { id: 'export', label: 'Export Center', icon: Download },
];

export const CrmSidebar = ({ activeModule, onModuleChange }: CrmSidebarProps) => {
  return (
    <div className="w-64 border-r border-white/10 bg-card/30 min-h-[calc(100vh-4rem)] flex flex-col p-4">
      <div className="mb-6 px-2">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          My CRM
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Lead & Intelligence Platform
        </p>
      </div>

      <nav className="flex-1 space-y-1">
        {CRM_MODULES.map((mod) => {
          const Icon = mod.icon;
          const isActive = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => onModuleChange(mod.id as ModuleType)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "opacity-70")} />
              {mod.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
