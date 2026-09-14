import React from 'react';
import { Lock, Crown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function PremiumLockScreen() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="h-8 w-8 text-amber-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Premium Feature</h2>
        <p className="text-slate-400 mb-8 text-sm leading-relaxed">
          The Opportunity Intelligence Dashboard is a custom-built solution strictly for Premium Clients. Accounts are configured manually within 72 hours of payment.
        </p>

        <div className="bg-slate-950 rounded-xl p-4 mb-8 border border-slate-800/50">
          <div className="flex items-center gap-3 text-sm text-slate-300 mb-2">
            <Crown className="h-4 w-4 text-amber-500" />
            <span>AI Opportunity Scoring</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300 mb-2">
            <Crown className="h-4 w-4 text-amber-500" />
            <span>Dedicated CRM</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Crown className="h-4 w-4 text-amber-500" />
            <span>Global Market Intelligence</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button onClick={() => navigate('/pricing')} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center justify-center gap-2">
            View Pricing Plans <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')} className="w-full text-slate-400 hover:text-white">
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
