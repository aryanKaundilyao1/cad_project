import { useState } from "react";
import { Mail, MapPin, Phone, ArrowRight, MessageCircle, Loader2, Linkedin, Instagram, Facebook, Twitter, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    
    setLoading(true);
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: email.trim() });
    
    if (error) {
      if (error.code === '23505') {
        toast({ title: "Already subscribed!", description: "This email is already on our list.", variant: "default" });
      } else {
        toast({ title: "Subscription failed", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Subscribed Successfully!", description: "You'll now receive our latest updates.", variant: "default" });
      setEmail("");
    }
    setLoading(false);
  };

  const scrollToSection = (id: string) => {
    if (location.pathname !== "/") {
      navigate(`/#${id}`);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="relative bg-primary text-primary-foreground">
      <div className="absolute top-0 left-0 right-0 h-px bg-foreground/20" />

      {/* Main footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10">
          
          <div className="col-span-2 lg:col-span-2 pr-8">
            <span className="font-bold text-2xl mb-4 block">
              <span>JAS</span>{" "}
              <span className="text-primary-foreground/90">CONNECT</span>
            </span>
            <p className="text-sm text-primary-foreground/70 leading-relaxed mb-6">
              The opportunity intelligence platform for modern B2B growth. We organize fragmented business information into verifiable, actionable opportunities.
            </p>
            
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-primary-foreground/70">Contact</h4>
            <div className="space-y-2 text-sm text-primary-foreground/70">
              <a href="mailto:jasinfra.connect@gmail.com" className="flex items-center gap-2 hover:text-primary transition-colors"><Mail className="h-4 w-4" /> jasinfra.connect@gmail.com</a>
              <a href="tel:+919971867719" className="flex items-center gap-2 hover:text-primary transition-colors"><Phone className="h-4 w-4" /> +91 99718 67719</a>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Noida, India</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground">Solutions</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/#services" className="text-primary-foreground/70 hover:text-primary transition-colors">Opportunity Intelligence</Link></li>
              <li><Link to="/#services" className="text-primary-foreground/70 hover:text-primary transition-colors">CRM & 1st-Party Data</Link></li>
              <li><Link to="/pricing" className="text-primary-foreground/70 hover:text-primary transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground">Services</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/#services" className="text-primary-foreground/70 hover:text-primary transition-colors">Opportunity Intelligence</Link></li>
              <li><Link to="/#services" className="text-primary-foreground/70 hover:text-primary transition-colors">CRM & First-Party Data Intelligence</Link></li>
              <li><Link to="/#services" className="text-primary-foreground/70 hover:text-primary transition-colors">Lead Discovery & Enrichment</Link></li>
              <li><Link to="/#services" className="text-primary-foreground/70 hover:text-primary transition-colors">Sales & Outreach Intelligence</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground">Resources</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/#services" className="text-primary-foreground/70 hover:text-primary transition-colors">Industries</Link></li>
              <li><Link to="/#problem" className="text-primary-foreground/70 hover:text-primary transition-colors">How it Works</Link></li>
              <li><Link to="/book-demo" className="text-primary-foreground/70 hover:text-primary transition-colors">Interactive Demo</Link></li>
              <li><Link to="/faq" className="text-primary-foreground/70 hover:text-primary transition-colors">FAQs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about" className="text-primary-foreground/70 hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/about#founder" className="text-primary-foreground/70 hover:text-primary transition-colors">Founder Message</Link></li>
              <li><Link to="/contact" className="text-primary-foreground/70 hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/auth" className="text-primary-foreground/70 hover:text-primary transition-colors">Sign In</Link></li>
            </ul>
          </div>
          
        </div>
      </div>

      <div className="border-t border-primary-foreground/20">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6 text-sm text-primary-foreground/70">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary" /> SOC2 Compliant Data</span>
            <span>&copy; {new Date().getFullYear()} JAS CONNECT. All rights reserved.</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-4 border-r border-primary-foreground/20 pr-6">
              <a href="#" className="text-primary-foreground/70 hover:text-primary transition-colors"><Linkedin className="w-5 h-5" /></a>
              <a href="#" className="text-primary-foreground/70 hover:text-primary transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-primary-foreground/70 hover:text-primary transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="text-primary-foreground/70 hover:text-primary transition-colors"><Facebook className="w-5 h-5" /></a>
            </div>
            <Link to="/privacy" className="text-primary-foreground/70 hover:text-primary transition-colors">Privacy</Link>
            <Link to="/terms" className="text-primary-foreground/70 hover:text-primary transition-colors">Terms</Link>
            <Link to="/refund-policy" className="text-primary-foreground/70 hover:text-primary transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
