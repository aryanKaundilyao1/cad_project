import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import { Building2, User, Loader2, Eye, EyeOff, Shield, Zap, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const [userType, setUserType] = useState<"client" | "company">("client");
  const [activeTab, setActiveTab] = useState("signin");
  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [yearsOperation, setYearsOperation] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [otpStep, setOtpStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [signupStep, setSignupStep] = useState<"form" | "otp">("form");
  const [signupOtp, setSignupOtp] = useState("");

  const { signIn, signUp, sendOtp, verifyOtp, user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if we have the profile loaded, or if there's no profile but we have a user (fallback)
    if (user && !authLoading) {
      navigate("/workspace");
    }
  }, [user, profile, authLoading, navigate]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try { emailSchema.parse(otpEmail); } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: "Invalid Email", description: err.errors[0].message, variant: "destructive" });
        return;
      }
    }
    setLoading(true);
    const { error } = await sendOtp(otpEmail);
    setLoading(false);
    if (error) {
      toast({ title: "Failed to send OTP", description: error.message, variant: "destructive" });
    } else {
      setOtpStep("otp");
      setResendCooldown(30);
      toast({ title: "OTP Sent!", description: "Check your email for the 6-digit code." });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await verifyOtp(otpEmail, otp);
    setLoading(false);
    if (error) {
      toast({ title: "Invalid OTP", description: "The code is incorrect or expired.", variant: "destructive" });
    } else {
      toast({ title: "Logged in!", description: "Welcome to JAS CONNECT." });
      // Redirection is handled by the useEffect above once user and profile are set
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    await sendOtp(otpEmail);
    setLoading(false);
    setResendCooldown(30);
    toast({ title: "OTP Resent", description: "A new code was sent to your email." });
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: "Validation Error", description: err.errors[0].message, variant: "destructive" });
        return;
      }
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "Sign In Failed", description: error.message === "Invalid login credentials" ? "Invalid email or password." : error.message, variant: "destructive" });
    } else {
      toast({ title: "Welcome back!", description: "You have successfully signed in." });
      // Redirection is handled by the useEffect above once user and profile are set
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: "Validation Error", description: err.errors[0].message, variant: "destructive" });
        return;
      }
    }
    if (userType === "company" && (!gstNumber || !panNumber || !companyName)) {
      toast({ title: "Missing Information", description: "Please fill in all required company details.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, {
      full_name: userType === "client" ? fullName : companyName,
      user_type: userType,
      phone,
      company_name: companyName,
      company_address: companyAddress,
      business_type: businessType,
      years_operation: yearsOperation ? parseInt(yearsOperation) : undefined,
      gst_number: gstNumber,
      pan_number: panNumber,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Sign Up Failed", description: error.message.includes("already registered") ? "This email is already registered." : error.message, variant: "destructive" });
    } else {
      setSignupStep("otp");
      toast({ title: "Verification required", description: "Please enter the 6-digit code sent to your email/phone." });
    }
  };

  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await verifyOtp(email, signupOtp, "signup");
    setLoading(false);
    if (error) {
      toast({ title: "Verification Failed", description: "The code is incorrect or expired.", variant: "destructive" });
    } else {
      toast({ title: "Account Verified!", description: "Welcome to JAS CONNECT." });
      navigate("/onboarding");
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      
      
      <Navigation />

      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
          {/* Left Side — Branding */}
          <div className="hidden lg:block space-y-8">
            <div>
              <h1 className="text-4xl font-display font-bold mb-4 leading-tight">
                AI-Powered B2B Lead
                <span className="text-primary italic"> Intelligence Platform</span>
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Discover verified B2B leads, enrich contacts with AI, and build your sales pipeline — all in one intelligent platform.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: Shield, text: "KYC & GST verified companies" },
                { icon: Zap, text: "Instant lead access & unlocking" },
                { icon: CheckCircle2, text: "Refundable security deposit" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(56,130,246,0.1)', border: '1px solid rgba(56,130,246,0.15)' }}>
                    <item.icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side — Form */}
          <div>
            <div className="text-center mb-6 lg:hidden">
              <h1 className="text-2xl font-display font-bold mb-2">Welcome to JAS CONNECT</h1>
              <p className="text-muted-foreground text-sm">Sign in to access the platform</p>
            </div>

            <Card className="animate-scale-in">
              <CardHeader className="space-y-4 pb-4">
                <div className="hidden lg:block">
                  <CardTitle className="text-xl font-sans">Welcome</CardTitle>
                  <CardDescription className="mt-1">Choose your account type to get started</CardDescription>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setUserType("client")}
                    className={`p-3.5 border-2 rounded-xl transition-all duration-200 text-center ${userType === "client"
                      ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/5"
                      : "border-white/10 hover:border-primary/30"
                      }`}
                  >
                    <User className={`h-6 w-6 mx-auto mb-1.5 ${userType === "client" ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-semibold text-sm">Buyer</p>
                    <p className="text-[11px] text-muted-foreground">Post requirements</p>
                  </button>

                  <button
                    onClick={() => setUserType("company")}
                    className={`p-3.5 border-2 rounded-xl transition-all duration-200 text-center ${userType === "company"
                      ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/5"
                      : "border-white/10 hover:border-primary/30"
                      }`}
                  >
                    <Building2 className={`h-6 w-6 mx-auto mb-1.5 ${userType === "company" ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-semibold text-sm">Sales Pro</p>
                    <p className="text-[11px] text-muted-foreground">Unlock leads</p>
                  </button>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-5">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="space-y-4">
                    {!showForgotPassword ? (
                      <>
                        <div className="flex bg-background p-1 rounded-lg border border-white/[0.06] mb-4">
                          <button
                            onClick={() => setLoginMode("password")}
                            className={`flex-1 text-xs font-medium py-2 rounded-md transition-all ${loginMode === "password" ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            Password
                          </button>
                          <button
                            onClick={() => setLoginMode("otp")}
                            className={`flex-1 text-xs font-medium py-2 rounded-md transition-all ${loginMode === "otp" ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            OTP Login
                          </button>
                        </div>

                        {loginMode === "password" ? (
                          <form onSubmit={handleSignIn} className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                              <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                                <button type="button" className="text-xs text-primary hover:underline" onClick={() => setShowForgotPassword(true)}>Forgot password?</button>
                              </div>
                              <div className="relative">
                                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPassword(!showPassword)}>
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="rounded border-white/10 bg-white/5 accent-primary w-4 h-4"
                              />
                              <Label htmlFor="rememberMe" className="text-xs text-muted-foreground cursor-pointer">Keep me logged in</Label>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                            </Button>
                          </form>
                        ) : (
                          <>
                            {otpStep === "email" ? (
                              <form onSubmit={handleSendOtp} className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                                  <Input type="email" placeholder="your@email.com" value={otpEmail} onChange={(e) => setOtpEmail(e.target.value)} required />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
                                </Button>
                              </form>
                            ) : (
                              <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to <strong className="text-foreground">{otpEmail}</strong></p>
                                <div className="space-y-2">
                                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">OTP Code</Label>
                                  <Input
                                    placeholder="123456"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    className="text-center text-lg tracking-[0.5em] font-mono"
                                  />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Login"}
                                </Button>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <button type="button" className="hover:text-foreground transition-colors" onClick={() => setOtpStep("email")}>← Change email</button>
                                  <button
                                    type="button"
                                    className={`transition-colors ${resendCooldown > 0 ? "opacity-50 cursor-not-allowed" : "text-primary hover:text-primary/80"}`}
                                    onClick={handleResendOtp}
                                    disabled={resendCooldown > 0}
                                  >
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                                  </button>
                                </div>
                              </form>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm font-medium">Reset via OTP</p>
                        {otpStep === "email" ? (
                          <form onSubmit={handleSendOtp} className="space-y-4">
                            <Input type="email" placeholder="your@email.com" value={otpEmail} onChange={(e) => setOtpEmail(e.target.value)} required />
                            <Button type="submit" className="w-full" disabled={loading}>
                              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset OTP"}
                            </Button>
                          </form>
                        ) : (
                          <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <p className="text-sm text-muted-foreground">Code sent to <strong>{otpEmail}</strong></p>
                            <Input placeholder="123456" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} required className="text-center text-lg tracking-[0.5em] font-mono" />
                            <Button type="submit" className="w-full" disabled={loading}>
                              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Login"}
                            </Button>
                          </form>
                        )}
                        <button className="text-xs text-muted-foreground hover:underline" onClick={() => { setShowForgotPassword(false); setOtpStep("email"); }}>← Back to login</button>
                      </div>
                    )}
                    <p className="text-sm text-center text-muted-foreground mt-4">
                      Don't have an account?{" "}
                      <button className="text-primary hover:underline font-medium" onClick={() => setActiveTab("signup")}>Sign up</button>
                    </p>
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-4">
                    {signupStep === "form" ? (
                      <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          {userType === "client" ? "Full Name" : "Company Name *"}
                        </Label>
                        <Input
                          placeholder={userType === "client" ? "John Doe" : "ABC Manufacturing"}
                          value={userType === "client" ? fullName : companyName}
                          onChange={(e) => userType === "client" ? setFullName(e.target.value) : setCompanyName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email *</Label>
                        <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                        <Input type="tel" placeholder="+91 1234567890" value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password *</Label>
                        <div className="relative">
                          <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {userType === "client" && (
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">GST Number</Label>
                          <Input placeholder="22AAAAA0000A1Z5" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
                          <p className="text-[11px] text-muted-foreground">Optional but required to post projects</p>
                        </div>
                      )}

                      {userType === "company" && (
                        <>
                          <div className="pt-3 border-t border-white/[0.06]">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Company Verification</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">GST Number *</Label>
                            <Input placeholder="22AAAAA0000A1Z5" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} required />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">PAN Number *</Label>
                            <Input placeholder="ABCDE1234F" value={panNumber} onChange={(e) => setPanNumber(e.target.value)} required />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Company Address *</Label>
                            <Input placeholder="Full registered address" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} required />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Business Type *</Label>
                            <Input placeholder="e.g., Digital Marketing Agency" value={businessType} onChange={(e) => setBusinessType(e.target.value)} required />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Years in Operation</Label>
                            <Input type="number" placeholder="5" value={yearsOperation} onChange={(e) => setYearsOperation(e.target.value)} />
                          </div>
                        </>
                      )}

                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                      </Button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifySignupOtp} className="space-y-4">
                        <p className="text-sm text-muted-foreground">Enter the 6-digit verification code sent to <strong className="text-foreground">{email}</strong></p>
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Verification Code</Label>
                          <Input
                            placeholder="123456"
                            maxLength={6}
                            value={signupOtp}
                            onChange={(e) => setSignupOtp(e.target.value)}
                            required
                            className="text-center text-lg tracking-[0.5em] font-mono"
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Create Account"}
                        </Button>
                        <div className="flex justify-between text-xs text-muted-foreground mt-4">
                          <button type="button" className="hover:text-foreground transition-colors" onClick={() => setSignupStep("form")}>← Back to form</button>
                        </div>
                      </form>
                    )}
                    <p className="text-sm text-center text-muted-foreground mt-4">
                      Already have an account?{" "}
                      <button className="text-primary hover:underline font-medium" onClick={() => { setActiveTab("signin"); setSignupStep("form"); }}>Sign in</button>
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <p className="text-center text-xs text-muted-foreground mt-5">
              By signing up, you agree to our{" "}
              <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
