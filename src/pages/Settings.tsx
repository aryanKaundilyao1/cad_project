import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  CreditCard,
  Lock,
  Loader2,
  Moon,
  AlertTriangle,
  Building2,
  Mail,
  Smartphone,
  LogOut,
  Trash2
} from "lucide-react";

type TabValue = "profile" | "industry" | "security" | "preferences" | "billing";

const Settings = () => {
  const { profile, user, refreshProfile, signOut } = useAuth() as any;
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabValue>("profile");

  // Profile Form State
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    company_name: "",
    business_type: "",
    gst_number: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Industry & Niche settings state
  const [selectedIndustryId, setSelectedIndustryId] = useState<string>("");
  const [nicheText, setNicheText] = useState<string>("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>("");
  const [isSavingNiche, setIsSavingNiche] = useState(false);
  const [industries, setIndustries] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);

  // Niche state
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);

  // Security Form State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Preferences State
  const [notifications, setNotifications] = useState({
    email_leads: true,
    email_bids: true,
    whatsapp_alerts: false,
  });

  useEffect(() => {
    const loadNicheAndIndustries = async () => {
      if (!profile) return;
      try {
        const { data: indData } = await supabase
          .from("industries")
          .select("*")
          .eq("is_active", true)
          .order("display_order");
        if (indData) setIndustries(indData);

        const { data: bpData } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("user_id", profile.id)
          .maybeSingle();
        if (bpData) {
          setSelectedIndustryId(bpData.industry_id || "");
          setNicheText(bpData.business_niche || "");
          setSelectedSubcategoryId(bpData.subcategory_id || "");
        }
      } catch (e) {
        console.warn("Failed to load industry settings:", e);
      }
    };

    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        company_name: profile.company_name || "",
        business_type: profile.business_type || "",
        gst_number: profile.gst_number || "",
      });
      setSelectedNiches(profile.business_niche || []);
      loadNicheAndIndustries();
    }
  }, [profile]);

  useEffect(() => {
    const loadSubcategories = async () => {
      if (selectedIndustryId) {
        const { data: subData } = await supabase
          .from("subcategories")
          .select("*")
          .eq("industry_id", selectedIndustryId)
          .eq("is_active", true)
          .order("display_order");
        if (subData) setSubcategories(subData);
      } else {
        setSubcategories([]);
      }
    };
    loadSubcategories();
  }, [selectedIndustryId]);

  const handleProfileUpdate = async () => {
    if (!profile) return;
    setIsSavingProfile(true);
    const { error } = await supabase.from("profiles").update(formData).eq("id", profile.id);
    setIsSavingProfile(false);

    if (error) {
      toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated", description: "Your details have been saved successfully." });
      await refreshProfile();
    }
  };

  const handleUserTypeChange = async (value: string) => {
    if (!profile) return;
    const { error } = await supabase.from("profiles").update({ user_type: value }).eq("id", profile.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: "Account type changed successfully." });
      await refreshProfile();
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters required", variant: "destructive" });
      return;
    }

    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsUpdatingPassword(false);

    if (error) {
      toast({ title: "Error updating password", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      setPassword("");
      setConfirmPassword("");
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const SidebarItem = ({ id, label, icon: Icon }: { id: TabValue, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === id
          ? "bg-primary/20 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
        }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <div className="flex-1 pt-16">
        {/* Header Section */}
        <section className="py-10 border-b relative" style={{ background: 'linear-gradient(180deg, hsl(222 47% 4%), hsl(222 47% 6%))', borderColor: 'rgba(255,255,255,0.04)' }}>
          
          <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(56,130,246,0.1)', border: '1px solid rgba(56,130,246,0.15)' }}>
                <SettingsIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account preferences and integrations</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-10">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col md:flex-row gap-8">

              {/* Sidebar */}
              <div className="w-full md:w-64 shrink-0 space-y-1">
                <SidebarItem id="profile" label="Profile & Account" icon={User} />
                <SidebarItem id="industry" label="Industry & Niche Settings" icon={Building2} />
                <SidebarItem id="security" label="Security" icon={Shield} />
                <SidebarItem id="preferences" label="Preferences" icon={Bell} />
                <SidebarItem id="billing" label="Billing & Plan" icon={CreditCard} />
              </div>

              {/* Content Area */}
              <div className="flex-1 space-y-6">

                {/* ── INDUSTRY & NICHE SETTINGS ── */}
                {activeTab === "industry" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          Industry & Niche Settings
                        </CardTitle>
                        <CardDescription>
                          Customize your business industry, sub-category, and personalized niche keywords.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          {/* Primary Industry Dropdown */}
                          <div className="space-y-2">
                            <Label>Primary Industry</Label>
                            <Select
                              value={selectedIndustryId}
                              onValueChange={(val) => {
                                setSelectedIndustryId(val);
                                setSelectedSubcategoryId(""); // reset subcategory on industry change
                              }}
                            >
                              <SelectTrigger className="bg-white/[0.03] border-white/[0.08]">
                                <SelectValue placeholder="Select Industry" />
                              </SelectTrigger>
                              <SelectContent className="bg-card/95 backdrop-blur-xl border-white/10">
                                {industries.map((ind) => (
                                  <SelectItem key={ind.id} value={ind.id}>
                                    {ind.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Sub Niche Dropdown */}
                          <div className="space-y-2">
                            <Label>Sub Niche (Subcategory)</Label>
                            <Select
                              value={selectedSubcategoryId}
                              onValueChange={setSelectedSubcategoryId}
                              disabled={!selectedIndustryId}
                            >
                              <SelectTrigger className="bg-white/[0.03] border-white/[0.08]">
                                <SelectValue placeholder="Select Subcategory" />
                              </SelectTrigger>
                              <SelectContent className="bg-card/95 backdrop-blur-xl border-white/10">
                                {subcategories.map((sub) => (
                                  <SelectItem key={sub.id} value={sub.id}>
                                    {sub.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Business Niche Input */}
                          <div className="space-y-2 sm:col-span-2">
                            <Label>Business Niche (Keywords / Core Focus)</Label>
                            <Input
                              value={nicheText}
                              onChange={(e) => setNicheText(e.target.value)}
                              placeholder="e.g. PEB Structures, SEO Agency, Hospitals & Clinics"
                              className="bg-white/[0.03] border-white/[0.08]"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              This value is used to match and auto-assign incoming leads to your CRM.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t border-white/[0.04] pt-5 justify-end">
                        <Button
                          onClick={async () => {
                            if (!profile) return;
                            setIsSavingNiche(true);
                            try {
                              // Update profiles
                              const { error: profErr } = await supabase
                                .from("profiles")
                                .update({
                                  primary_industry_id: selectedIndustryId || null,
                                } as any)
                                .eq("id", profile.id);
                              if (profErr) throw profErr;

                              // Upsert business_profiles
                              const { error: bpErr } = await supabase
                                .from("business_profiles")
                                .upsert({
                                  user_id: profile.id,
                                  industry_id: selectedIndustryId || null,
                                  subcategory_id: selectedSubcategoryId || null,
                                  business_niche: nicheText || null,
                                }, { onConflict: 'user_id' });
                              if (bpErr) throw bpErr;

                              toast({
                                title: "Niche settings updated",
                                description: "Your industry, sub-niche, and keyword focus have been saved.",
                              });
                              await refreshProfile();
                            } catch (err: any) {
                              toast({
                                title: "Error saving settings",
                                description: err.message,
                                variant: "destructive",
                              });
                            } finally {
                              setIsSavingNiche(false);
                            }
                          }}
                          disabled={isSavingNiche}
                        >
                          {isSavingNiche && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Niche Settings
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                )}

                {/* ── PROFILE & ACCOUNT ── */}
                {activeTab === "profile" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          Personal Information
                        </CardTitle>
                        <CardDescription>Update your personal and contact details.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                              value={formData.full_name}
                              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                              className="bg-white/[0.03] border-white/[0.08]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email <span className="text-xs text-muted-foreground">(Read-only)</span></Label>
                            <Input value={user?.email || ""} disabled className="bg-white/[0.02] border-transparent opacity-60" />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input
                              value={formData.phone}
                              onChange={e => setFormData({ ...formData, phone: e.target.value })}
                              className="bg-white/[0.03] border-white/[0.08]"
                            />
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t border-white/[0.04] pt-5 justify-end">
                        <Button onClick={handleProfileUpdate} disabled={isSavingProfile}>
                          {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Changes
                        </Button>
                      </CardFooter>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          Account Type & Company
                        </CardTitle>
                        <CardDescription>Manage how you interact on the platform.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-start justify-between gap-4">
                          <div>
                            <Label className="text-base font-semibold text-foreground">Current Account Role</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Switching your role changes your dashboard access. Clients post projects, while manufacturers bid on them.
                            </p>
                          </div>
                          <Select value={profile?.user_type || "client"} onValueChange={handleUserTypeChange}>
                            <SelectTrigger className="w-48 bg-white/[0.03] border-white/[0.08]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card/95 backdrop-blur-xl border-white/10">
                              <SelectItem value="client">Client (Post Projects)</SelectItem>
                              <SelectItem value="company">Manufacturer / Vendor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {profile?.user_type === "company" && (
                          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-white/[0.04]">
                            <div className="space-y-2">
                              <Label>Company Name</Label>
                              <Input
                                value={formData.company_name}
                                onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                                className="bg-white/[0.03] border-white/[0.08]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Business Type</Label>
                              <Input
                                value={formData.business_type}
                                onChange={e => setFormData({ ...formData, business_type: e.target.value })}
                                className="bg-white/[0.03] border-white/[0.08]"
                                placeholder="e.g. PEB Contractor"
                              />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <Label>GST Number</Label>
                              <Input
                                value={formData.gst_number}
                                onChange={e => setFormData({ ...formData, gst_number: e.target.value })}
                                className="bg-white/[0.03] border-white/[0.08]"
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                      {profile?.user_type === "company" && (
                        <CardFooter className="border-t border-white/[0.04] pt-5 justify-end">
                          <Button onClick={handleProfileUpdate} disabled={isSavingProfile}>
                            {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Company Info
                          </Button>
                        </CardFooter>
                      )}
                    </Card>

                    {/* Business Interests */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <SettingsIcon className="h-5 w-5 text-primary" />
                          Business Interests
                        </CardTitle>
                        <CardDescription>Select up to 3 industry categories to see relevant leads first.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {industries.map((industry) => {
                            const cat = industry.name;
                            const isSelected = selectedNiches.includes(cat);
                            return (
                              <button
                                key={cat}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedNiches(prev => prev.filter(n => n !== cat));
                                  } else if (selectedNiches.length < 3) {
                                    setSelectedNiches(prev => [...prev, cat]);
                                  } else {
                                    toast({ title: "Max 3 niches", description: "Remove one to add another.", variant: "destructive" });
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                  isSelected
                                    ? 'bg-primary/20 text-primary border-primary/30'
                                    : 'bg-white/[0.02] text-muted-foreground border-white/[0.06] hover:border-primary/20 hover:text-foreground'
                                }`}
                              >
                                {cat}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground">{selectedNiches.length}/3 selected</p>
                      </CardContent>
                      <CardFooter className="border-t border-white/[0.04] pt-5 justify-end">
                        <Button
                          disabled={isSavingProfile}
                          onClick={async () => {
                            if (!profile) return;
                            setIsSavingProfile(true);
                            const { error } = await supabase.from("profiles").update({ business_niche: selectedNiches } as any).eq("id", profile.id);
                            setIsSavingProfile(false);
                            if (error) {
                              toast({ title: "Error", description: error.message, variant: "destructive" });
                            } else {
                              toast({ title: "Interests saved", description: "Your lead feed will now prioritize these categories." });
                              await refreshProfile();
                            }
                          }}
                        >
                          {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Interests
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                )}

                {/* ── SECURITY ── */}
                {activeTab === "security" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lock className="h-5 w-5 text-primary" />
                          Change Password
                        </CardTitle>
                        <CardDescription>Update your password to keep your account secure.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                          <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input
                              type="password"
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              className="bg-white/[0.03] border-white/[0.08]"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Confirm New Password</Label>
                            <Input
                              type="password"
                              value={confirmPassword}
                              onChange={e => setConfirmPassword(e.target.value)}
                              className="bg-white/[0.03] border-white/[0.08]"
                              required
                            />
                          </div>
                          <Button type="submit" disabled={isUpdatingPassword}>
                            {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          Sessions & Verification
                        </CardTitle>
                        <CardDescription>Manage active sessions and account verification.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">Email Status</p>
                            <p className="text-sm text-muted-foreground">Your email is verified for this account.</p>
                          </div>
                          <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Verified</Badge>
                        </div>
                        <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">Sign out everywhere</p>
                            <p className="text-sm text-muted-foreground">End all active sessions across all devices.</p>
                          </div>
                          <Button variant="outline" onClick={handleLogout} className="border-white/10 hover:bg-white/5 gap-2">
                            <LogOut className="h-4 w-4" /> Sign Out
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ── PREFERENCES ── */}
                {activeTab === "preferences" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Moon className="h-5 w-5 text-primary" />
                          Appearance
                        </CardTitle>
                        <CardDescription>Customize how the JAS CONNECT platform looks.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">Dark Mode</p>
                            <p className="text-sm text-muted-foreground">Toggle between light and dark modes.</p>
                          </div>
                          <Switch 
                            checked={theme === 'dark' || (theme === 'system' && window.matchMedia("(prefers-color-scheme: dark)").matches)} 
                            onCheckedChange={(c) => setTheme(c ? 'dark' : 'light')} 
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Bell className="h-5 w-5 text-primary" />
                          Notifications
                        </CardTitle>
                        <CardDescription>Control how you receive alerts and updates.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-3 items-start">
                            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium text-foreground">Email: New Leads</p>
                              <p className="text-sm text-muted-foreground">Receive daily summaries of new matched projects.</p>
                            </div>
                          </div>
                          <Switch
                            checked={notifications.email_leads}
                            onCheckedChange={c => setNotifications(p => ({ ...p, email_leads: c }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-3 items-start">
                            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium text-foreground">Email: Bid Updates</p>
                              <p className="text-sm text-muted-foreground">Get notified when a client interacts with your bids.</p>
                            </div>
                          </div>
                          <Switch
                            checked={notifications.email_bids}
                            onCheckedChange={c => setNotifications(p => ({ ...p, email_bids: c }))}
                          />
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                          <div className="flex gap-3 items-start">
                            <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium text-foreground">WhatsApp Alerts</p>
                              <p className="text-sm text-muted-foreground">Get instant notifications for high-priority updates.</p>
                            </div>
                          </div>
                          <Switch
                            checked={notifications.whatsapp_alerts}
                            onCheckedChange={c => setNotifications(p => ({ ...p, whatsapp_alerts: c }))}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ── BILLING & PLAN ── */}
                {activeTab === "billing" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card style={{ background: 'linear-gradient(135deg, hsl(217 91% 40% / 0.1), transparent)' }}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-primary" />
                          Current Subscription
                        </CardTitle>
                        <CardDescription>Manage your JAS CONNECT billing plan.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Active Plan</p>
                            <div className="flex items-center gap-3">
                              <h3 className="text-2xl font-bold uppercase text-foreground">{profile?.subscription_plan || "Free"}</h3>
                              <Badge className="bg-primary/20 text-primary border-primary/30">Active</Badge>
                            </div>
                          </div>
                          <Link to="/pricing">
                            <Button className="shadow-lg shadow-primary/20">Upgrade Plan</Button>
                          </Link>
                        </div>

                        {profile?.subscription_expires_at && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Next Billing Date</span>
                            <span className="font-medium text-foreground">
                              {new Date(profile.subscription_expires_at).toLocaleDateString("en-IN")}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Platform Verification</span>
                          <span className="font-medium text-foreground">
                            {profile?.is_verified ? "Verified ✅" : "Pending ⏳"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-red-500/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-400">
                          <AlertTriangle className="h-5 w-5" />
                          Danger Zone
                        </CardTitle>
                        <CardDescription>Permanently delete your account and all associated data.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground max-w-sm">
                            Once you delete your account, there is no going back. Please be certain.
                          </p>
                          <Button variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white gap-2">
                            <Trash2 className="h-4 w-4" /> Delete Account
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Settings;