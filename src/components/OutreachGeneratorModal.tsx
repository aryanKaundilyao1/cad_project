import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Wand2, Copy, Check } from 'lucide-react';
import { generateOutreach, OutreachVariants } from '@/lib/aiOutreach';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { trackEvent } from '@/utils/analytics';

interface OutreachGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Partial<Tables<'leads'>>;
  userProfile: Partial<Tables<'profiles'>>;
  businessProfile?: any;
}

export function OutreachGeneratorModal({
  isOpen,
  onClose,
  lead,
  userProfile,
  businessProfile,
}: OutreachGeneratorModalProps) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [variants, setVariants] = useState<OutreachVariants | null>(null);
  const [activeTab, setActiveTab] = useState<keyof OutreachVariants>('coldEmail');
  const [editedText, setEditedText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const generated = await generateOutreach(lead, userProfile, businessProfile);
      setVariants(generated);
      setEditedText(generated['coldEmail']);
      setActiveTab('coldEmail');
      trackEvent('cold_email_generated', { lead_id: lead.id });
      toast.success('Outreach variants generated successfully!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to generate outreach');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (val: string) => {
    const key = val as keyof OutreachVariants;
    setActiveTab(key);
    if (variants) {
      setEditedText(variants[key]);
    }
  };

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const handleSend = async () => {
    try {
      setSending(true);
      // Call the supabase edge function for email delivery
      // We will send via Resend with Reply-To set to the user
      
      const { data, error } = await supabase.functions.invoke('send-outreach', {
        body: {
          lead_id: lead.id,
          lead_email: lead.email || lead.external_email, // Fallbacks
          subject: activeTab === 'coldEmail' ? `Exploring synergies with ${lead.company_name || 'your team'}` : `Following up: ${lead.company_name}`,
          html_body: editedText.replace(/\n/g, '<br />'),
          reply_to: userProfile.email,
          sender_id: userProfile.id
        }
      });

      if (error) throw error;
      toast.success('Outreach sent successfully! Tracking initialized.');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send outreach');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            AI Outreach Generator
          </DialogTitle>
          <DialogDescription>
            Generate highly personalized, unique outreach messages for {lead.company_name || 'this lead'}.
          </DialogDescription>
        </DialogHeader>

        {!variants && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4 border-2 border-dashed border-white/10 rounded-xl">
            <Wand2 className="w-12 h-12 text-muted-foreground opacity-50" />
            <div>
              <h3 className="font-medium text-lg">Ready to Generate</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                Our AI will analyze the lead's requirements and your business profile to draft 5 unique outreach variants perfectly tailored for conversion.
              </p>
            </div>
            <Button onClick={handleGenerate} size="lg" className="mt-4">
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Magic
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground animate-pulse">Generating AI Outreach...</p>
          </div>
        )}

        {variants && !loading && (
          <div className="flex-1 flex flex-col min-h-0">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="coldEmail">Cold Email</TabsTrigger>
                <TabsTrigger value="followUpEmail">Follow-up</TabsTrigger>
                <TabsTrigger value="introEmail">Soft Intro</TabsTrigger>
                <TabsTrigger value="linkedinMessage">LinkedIn</TabsTrigger>
                <TabsTrigger value="whatsappMessage">WhatsApp</TabsTrigger>
              </TabsList>

              <div className="flex-1 relative mb-4">
                <Textarea 
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="absolute inset-0 resize-none h-full p-4 font-mono text-sm leading-relaxed focus-visible:ring-primary/20 bg-muted/50"
                  placeholder="Your generated message will appear here..."
                />
              </div>
            </Tabs>

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleGenerate} disabled={loading}>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
                <Button variant="outline" onClick={() => handleCopy(variants?.coldEmail || '')}>
                  {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                  Copy Email
                </Button>
                <Button variant="outline" onClick={() => handleCopy(variants?.whatsappMessage || '')}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy WhatsApp
                </Button>
                <Button variant="outline" onClick={() => handleCopy(variants?.linkedinMessage || '')}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy LinkedIn
                </Button>
                <Button variant="outline" onClick={() => handleCopy(variants?.followUpEmail || '')}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Follow Up
                </Button>
              </div>

              {(activeTab === 'coldEmail' || activeTab === 'followUpEmail' || activeTab === 'introEmail') ? (
                <Button onClick={handleSend} disabled={sending || !lead.email && !lead.external_email} className="bg-primary hover:bg-primary/90">
                  {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send with Tracking
                </Button>
              ) : (
                <Button onClick={() => window.open(activeTab === 'whatsappMessage' ? `https://wa.me/${lead.phone}?text=${encodeURIComponent(editedText)}` : lead.linkedin_url || '#', '_blank')} className="bg-green-600 hover:bg-green-700">
                  <Send className="w-4 h-4 mr-2" />
                  Open {activeTab === 'whatsappMessage' ? 'WhatsApp' : 'LinkedIn'}
                </Button>
              )}
            </div>
            
            {(!lead.email && !lead.external_email) && (activeTab.includes('Email')) && (
              <p className="text-xs text-red-400 mt-2 text-right">No email address available for this lead.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
