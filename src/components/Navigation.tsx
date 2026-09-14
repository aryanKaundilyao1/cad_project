import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, Settings, Crown, ShieldCheck, Database, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/ClientWorkspaceContext";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { activeClient } = useWorkspace();
  const displayEmail = activeClient?.slug === 'jumbl' ? 'founder@jumbl.in' : user?.email;
  const displayName = activeClient?.slug === 'jumbl' ? 'Jumbl' : (profile?.full_name || profile?.company_name || user?.email?.split('@')[0]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const getUserInitial = () => {
    const name = profile?.full_name || profile?.company_name || displayEmail || "";
    return name.charAt(0).toUpperCase();
  };

  const NavDropdown = ({ title, items }: { title: string, items: { label: string, to: string }[] }) => (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 nav-link px-3 py-2 rounded-lg text-[13px] text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
        {title} <ChevronDown className="w-3 h-3 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 bg-background border-primary/20">
        {items.map((item, idx) => (
          <DropdownMenuItem 
            key={idx} 
            className="cursor-pointer text-sm" 
            onClick={() => navigate(item.to)}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 glass-nav ${scrolled ? "scrolled" : ""}`}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className={`absolute bottom-0 left-0 right-0 h-px transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'linear-gradient(90deg, transparent, hsl(217 91% 60% / 0.3), hsl(187 85% 53% / 0.2), transparent)' }}
      />

      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <span className="text-lg font-bold tracking-tight text-foreground  transition-all duration-300">
              <span className="text-primary">JAS</span>{" "}
              <span className="text-foreground/90">CONNECT</span>
            </span>
          </Link>

          {/* Center Nav */}
          <div className="hidden lg:flex items-center gap-1">
            <Link to="/" className={`nav-link px-3 py-2 rounded-lg text-[13px] ${location.pathname === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} transition-colors`}>Home</Link>
            <Link to="/workspace" className={`nav-link px-3 py-2 rounded-lg text-[13px] ${location.pathname.startsWith('/workspace') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} transition-colors`}>Dashboard</Link>
            
            <NavDropdown title="Resources" items={[
              { label: "About Us", to: "/about" },
              { label: "FAQs", to: "/faq" },
              
            ]} />
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-primary/5 transition-colors focus:outline-none">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-primary ring-2 ring-primary/30"
                      style={{ background: 'rgba(56, 130, 246, 0.1)' }}>
                      {getUserInitial()}
                    </div>
                    <span className="text-sm font-medium text-muted-foreground max-w-[120px] truncate">
                      {displayName}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background border-primary/20">
                  <div className="px-3 py-2.5 border-b border-primary/20">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Client</p>
                  </div>
                  <div className="py-1">
                    <DropdownMenuItem onClick={() => navigate("/workspace")} className="gap-2 cursor-pointer"><Database className="h-4 w-4" /> Dashboard</DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="bg-primary/10" />
                  <div className="py-1">
                    <DropdownMenuItem onClick={() => navigate("/pricing")} className="gap-2 cursor-pointer"><Crown className="h-4 w-4" /> Subscription</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2 cursor-pointer"><Settings className="h-4 w-4" /> Settings</DropdownMenuItem>
                  </div>
                  {profile?.is_admin && (
                    <>
                      <DropdownMenuSeparator className="bg-primary/10" />
                      <DropdownMenuItem onClick={() => navigate("/admin")} className="gap-2 cursor-pointer text-primary font-semibold"><ShieldCheck className="h-4 w-4" /> Admin Panel</DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-primary/10" />
                  <DropdownMenuItem onSelect={(e) => { handleSignOut(); }} className="gap-2 cursor-pointer text-destructive"><LogOut className="h-4 w-4" /> Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button size="sm" variant="ghost" className="text-muted-foreground text-[13px] hover:text-foreground" onClick={() => navigate('/book-demo')}>
                  Book a Demo
                </Button>
                <Button size="sm" className="text-[13px] bg-primary text-primary-foreground hover:bg-primary/90  border-0" onClick={() => navigate('/auth')}>
                  Start Free Trial
                </Button>
              </>
            )}
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-primary/5 rounded-lg transition-colors"><Menu className="h-5 w-5 text-foreground/70" /></button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0 bg-background border-primary/20">
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-primary/20">
                  <SheetTitle className="text-left font-bold"><span className="text-primary">JAS</span> CONNECT</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-[calc(100%-80px)]">
                  <div className="flex-1 py-4 px-3 space-y-2 overflow-y-auto">
                    
                    <div className="flex flex-col gap-2 pl-2">
                      <Link to="/" onClick={() => setMobileOpen(false)} className="text-sm text-left text-foreground hover:text-primary">Home</Link>
                      <Link to="/workspace" onClick={() => setMobileOpen(false)} className="text-sm text-left text-foreground hover:text-primary">Dashboard</Link>
                      <Link to="/pricing" onClick={() => setMobileOpen(false)} className="text-sm text-left text-foreground hover:text-primary">Pricing</Link>
                      <Link to="/faq" onClick={() => setMobileOpen(false)} className="text-sm text-left text-foreground hover:text-primary">Resources</Link>
                      <Link to="/about" onClick={() => setMobileOpen(false)} className="text-sm text-left text-foreground hover:text-primary">About Us</Link>
                    </div>

                  </div>
                  <div className="border-t border-primary/20 px-4 py-4 space-y-2">
                    {user ? (
                      <>
                        <div className="flex items-center gap-3 px-2 py-2 mb-2">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-primary ring-2 ring-primary/30" style={{ background: 'rgba(56, 130, 246, 0.1)' }}>{getUserInitial()}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{displayName}</p>
                            <p className="text-xs text-muted-foreground">Client</p>
                          </div>
                        </div>
                        <Link to="/workspace" onClick={() => setMobileOpen(false)}><Button variant="outline" className="w-full justify-start gap-2 border-primary/20" size="sm"><Database className="h-4 w-4" /> Dashboard</Button></Link>
                        <Button variant="ghost" className="w-full justify-start gap-2 text-destructive" size="sm" onClick={() => { handleSignOut(); setMobileOpen(false); }}><LogOut className="h-4 w-4" /> Sign Out</Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" className="w-full mb-2" onClick={() => { navigate('/book-demo'); setMobileOpen(false); }}>Book a Demo</Button>
                        <Button className="w-full bg-primary text-primary-foreground border-0" onClick={() => { navigate('/auth'); setMobileOpen(false); }}>
                          Start Free Trial
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navigation;
