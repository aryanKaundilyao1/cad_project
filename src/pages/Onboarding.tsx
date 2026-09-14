import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIndustries, useSubcategories, useTargetAudiences, useTargetGeographies, useIdealLeadTypes, useSaveBusinessProfile } from "@/hooks/useBusinessProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { TEAM_SIZES, LEAD_REQUIREMENTS } from "@/types/intelligence";
import type { OnboardingFormData } from "@/types/intelligence";
import {
  Loader2, Sparkles, ArrowRight, ArrowLeft, Building2, Globe, Users, Target,
  CheckCircle2, Briefcase, Hash, MapPin, Zap
} from "lucide-react";

const TOTAL_STEPS = 9;

const stepMeta = [
  { icon: Building2, title: "Company Name", subtitle: "What's the name of your company?" },
  { icon: Briefcase, title: "Business Industry", subtitle: "Select the industry your business operates in" },
  { icon: Hash, title: "Business Subcategory", subtitle: "Pick the specific area within your industry" },
  { icon: Users, title: "Target Audience", subtitle: "Who are your ideal customers?" },
  { icon: Globe, title: "Target Geography", subtitle: "Where do you operate or want to expand?" },
  { icon: Zap, title: "Services & Products", subtitle: "Describe what you offer" },
  { icon: Target, title: "Ideal Lead Type", subtitle: "What type of leads are you looking for?" },
  { icon: Users, title: "Team Size", subtitle: "How large is your team?" },
  { icon: Sparkles, title: "Lead Requirements", subtitle: "How many leads do you need per month?" },
];

const Onboarding = () => {
  const { user, profile } = useAuth() as any;
  const navigate = useNavigate();
  const { toast } = useToast();
  const saveMutation = useSaveBusinessProfile();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingFormData>({
    companyName: "",
    industryId: "",
    subcategoryId: "",
    targetAudience: [],
    targetGeography: [],
    servicesProducts: "",
    idealLeadTypes: [],
    teamSize: "",
    monthlyLeadRequirement: "",
  });

  const { data: industries, isLoading: indLoading } = useIndustries();
  const { data: subcategories, isLoading: subLoading } = useSubcategories(form.industryId || null);
  const { data: audiences } = useTargetAudiences();
  const { data: geographies } = useTargetGeographies();
  const { data: idealLeadTypes } = useIdealLeadTypes();

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user]);

  useEffect(() => {
    if (profile?.onboarding_completed) navigate("/dashboard");
  }, [profile]);

  // Pre-fill company name from profile
  useEffect(() => {
    if (profile?.company_name && !form.companyName) {
      setForm(f => ({ ...f, companyName: profile.company_name }));
    }
  }, [profile]);

  const toggleArray = (field: keyof OnboardingFormData, value: string, max = 5) => {
    setForm(f => {
      const arr = f[field] as string[];
      if (arr.includes(value)) return { ...f, [field]: arr.filter(v => v !== value) };
      if (arr.length >= max) return f;
      return { ...f, [field]: [...arr, value] };
    });
  };

  const canProceed = () => {
    switch (step) {
      case 0: return form.companyName.trim().length > 0;
      case 1: return !!form.industryId;
      case 2: return true; // subcategory is optional
      case 3: return form.targetAudience.length > 0;
      case 4: return form.targetGeography.length > 0;
      case 5: return true; // services is optional
      case 6: return form.idealLeadTypes.length > 0;
      case 7: return !!form.teamSize;
      case 8: return !!form.monthlyLeadRequirement;
      default: return true;
    }
  };

  const handleFinish = async () => {
    try {
      await saveMutation.mutateAsync(form);
      toast({ title: "Welcome to JAS CONNECT! 🚀", description: "Your platform is now personalized for your business." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1) setStep(s => s + 1);
    else handleFinish();
  };
  const prev = () => { if (step > 0) setStep(s => s - 1); };

  const CurrentIcon = stepMeta[step]?.icon || Sparkles;
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: "rgba(59,130,246,0.04)" }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl" style={{ background: "rgba(139,92,246,0.03)" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl min-h-screen flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-display font-bold text-foreground flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> JAS CONNECT AI
          </h2>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Step {step + 1} of {TOTAL_STEPS}</span>
            <span className="text-xs font-semibold text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #3B82F6, #8B5CF6)", boxShadow: "0 0 12px rgba(59,130,246,0.4)" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Step Header */}
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
                  <CurrentIcon className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">{stepMeta[step]?.title}</h1>
                <p className="text-muted-foreground">{stepMeta[step]?.subtitle}</p>
              </div>

              {/* Step Fields */}
              <div className="max-w-lg mx-auto w-full">
                {/* Step 0: Company Name */}
                {step === 0 && (
                  <Input
                    value={form.companyName}
                    onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                    placeholder="e.g. Acme Industries Pvt. Ltd."
                    className="h-14 text-lg bg-white/[0.03] border-white/[0.08] focus:border-primary/40 rounded-xl text-center"
                    autoFocus
                    onKeyDown={e => e.key === "Enter" && canProceed() && next()}
                  />
                )}

                {/* Step 1: Industry */}
                {step === 1 && (
                  <div className="space-y-4">
                    {indLoading ? (
                      <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : (
                      <div className="flex flex-wrap justify-center gap-2">
                        {(industries || []).map((ind, i) => (
                          <motion.button
                            key={ind.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.02 }}
                            onClick={() => setForm(f => ({ ...f, industryId: ind.id, subcategoryId: "" }))}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                              form.industryId === ind.id
                                ? "bg-primary/20 text-primary border-primary/30 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                                : "bg-white/[0.02] text-muted-foreground border-white/[0.06] hover:border-primary/20 hover:text-foreground hover:bg-white/[0.04]"
                            }`}
                          >
                            <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ background: ind.color }} />
                            {ind.name}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Subcategory */}
                {step === 2 && (
                  <div className="space-y-4">
                    {subLoading ? (
                      <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : (subcategories || []).length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm">No subcategories available. You can skip this step.</p>
                    ) : (
                      <div className="flex flex-wrap justify-center gap-2">
                        {(subcategories || []).map((sub, i) => (
                          <motion.button
                            key={sub.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.02 }}
                            onClick={() => setForm(f => ({ ...f, subcategoryId: sub.id }))}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                              form.subcategoryId === sub.id
                                ? "bg-primary/20 text-primary border-primary/30 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                                : "bg-white/[0.02] text-muted-foreground border-white/[0.06] hover:border-primary/20 hover:text-foreground hover:bg-white/[0.04]"
                            }`}
                          >
                            {sub.name}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Target Audience */}
                {step === 3 && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground text-center">Select up to 5 • {form.targetAudience.length}/5 selected</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {(audiences || []).map((aud, i) => (
                        <motion.button
                          key={aud.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.02 }}
                          onClick={() => toggleArray("targetAudience", aud.name)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                            form.targetAudience.includes(aud.name)
                              ? "bg-primary/20 text-primary border-primary/30"
                              : "bg-white/[0.02] text-muted-foreground border-white/[0.06] hover:border-primary/20"
                          }`}
                        >
                          {form.targetAudience.includes(aud.name) && <CheckCircle2 className="h-3.5 w-3.5 inline mr-1.5" />}
                          {aud.name}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Target Geography */}
                {step === 4 && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground text-center">Select up to 5 • {form.targetGeography.length}/5 selected</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {(geographies || []).map((geo, i) => (
                        <motion.button
                          key={geo.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.02 }}
                          onClick={() => toggleArray("targetGeography", geo.name)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                            form.targetGeography.includes(geo.name)
                              ? "bg-primary/20 text-primary border-primary/30"
                              : "bg-white/[0.02] text-muted-foreground border-white/[0.06] hover:border-primary/20"
                          }`}
                        >
                          <MapPin className="h-3.5 w-3.5 inline mr-1.5" />
                          {geo.name}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 5: Services/Products */}
                {step === 5 && (
                  <Textarea
                    value={form.servicesProducts}
                    onChange={e => setForm(f => ({ ...f, servicesProducts: e.target.value }))}
                    placeholder="Describe the services or products your company provides...&#10;&#10;e.g. We provide PEB steel structures for warehouse construction, industrial sheds, and factory buildings across India."
                    className="min-h-[150px] bg-white/[0.03] border-white/[0.08] focus:border-primary/40 rounded-xl text-sm"
                    autoFocus
                  />
                )}

                {/* Step 6: Ideal Lead Type */}
                {step === 6 && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground text-center">Select up to 5 • {form.idealLeadTypes.length}/5 selected</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {(idealLeadTypes || []).map((lt, i) => (
                        <motion.button
                          key={lt.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.02 }}
                          onClick={() => toggleArray("idealLeadTypes", lt.name)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                            form.idealLeadTypes.includes(lt.name)
                              ? "bg-primary/20 text-primary border-primary/30"
                              : "bg-white/[0.02] text-muted-foreground border-white/[0.06] hover:border-primary/20"
                          }`}
                        >
                          <Target className="h-3.5 w-3.5 inline mr-1.5" />
                          {lt.name}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 7: Team Size */}
                {step === 7 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {TEAM_SIZES.map((size, i) => (
                      <motion.button
                        key={size}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => setForm(f => ({ ...f, teamSize: size }))}
                        className={`px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                          form.teamSize === size
                            ? "bg-primary/20 text-primary border-primary/30"
                            : "bg-white/[0.02] text-muted-foreground border-white/[0.06] hover:border-primary/20"
                        }`}
                      >
                        {size}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Step 8: Monthly Lead Requirement */}
                {step === 8 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {LEAD_REQUIREMENTS.map((req, i) => (
                      <motion.button
                        key={req}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => setForm(f => ({ ...f, monthlyLeadRequirement: req }))}
                        className={`px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                          form.monthlyLeadRequirement === req
                            ? "bg-primary/20 text-primary border-primary/30"
                            : "bg-white/[0.02] text-muted-foreground border-white/[0.06] hover:border-primary/20"
                        }`}
                      >
                        {req}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={prev}
            disabled={step === 0}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>

          <div className="flex items-center gap-3">
            {step < TOTAL_STEPS - 1 && (
              <button
                onClick={() => navigate("/dashboard")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now →
              </button>
            )}
            <Button
              onClick={next}
              disabled={!canProceed() || saveMutation.isPending}
              className="h-12 px-8 gap-2 rounded-xl"
              style={{
                background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                boxShadow: canProceed() ? "0 0 25px rgba(59,130,246,0.25)" : "none",
              }}
            >
              {saveMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : step === TOTAL_STEPS - 1 ? (
                <><CheckCircle2 className="h-4 w-4" /> Complete Setup</>
              ) : (
                <>Continue <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
