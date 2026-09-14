import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building, Users, Calendar, Clock, CheckCircle2, Target, Zap, 
  ShieldAlert, ArrowRight, MoreHorizontal, ChevronRight, Activity,
  Mail, Phone, Linkedin, Globe, User, Plus, CheckSquare, MessageSquare, 
  AlertCircle, Play, MoreVertical, Flame, Building2, Radar, Link2, 
  Sparkles, ShieldCheck, ChevronDown, ChevronUp, Copy, Check, ExternalLink,
  MessageCircle, Info, HeartPulse, Map, Share2, CalendarDays, PlusCircle,
  Smartphone, FileText, Send, CalendarCheck, Upload, History, CalendarRange, Percent, DollarSign, Scale, XCircle, CheckCircle, Trash
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const STAGES = ['Discovery', 'Qualification', 'Outreach', 'Proposal', 'Negotiation', 'Won', 'Lost'];

// Helper to trigger automation rules
export async function triggerAutomationRules(triggerEvent: string, context: { 
  workspaceId: string; 
  opportunityId: string; 
  accountId: string | null; 
  stage?: string;
}) {
  try {
    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('trigger_event', triggerEvent)
      .eq('is_active', true);
      
    if (error) {
      console.error("Error fetching automation rules:", error);
      return;
    }
    
    if (!rules || rules.length === 0) return;
    
    for (const rule of rules) {
      if (rule.conditions && Object.keys(rule.conditions).length > 0) {
        if (rule.conditions.new_stage && context.stage && rule.conditions.new_stage.toLowerCase() !== context.stage.toLowerCase()) {
          continue;
        }
      }
      
      if (rule.action_type === 'CREATE_TASK') {
        const payload = rule.action_payload as any;
        const dueDays = payload.due_in_days || 2;
        const dueDate = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString();
        
        await supabase.from('tasks').insert({
          workspace_id: context.workspaceId,
          opportunity_id: context.opportunityId,
          account_id: context.accountId,
          title: payload.title || 'Automated Task',
          description: payload.description || `Auto-generated via rule: ${rule.rule_name}`,
          priority: payload.priority || 'medium',
          task_type: payload.type || 'other',
          due_date: dueDate,
          status: 'pending'
        });
      }
    }
  } catch (e) {
    console.error("Failed to run automation rules:", e);
  }
}

export default function OpportunityWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth() as any;
  const queryClient = useQueryClient();
  const [outreachTab, setOutreachTab] = React.useState<'email' | 'linkedin' | 'whatsapp' | 'call' | 'followup' | 'objections'>('email');
  const [copiedText, setCopiedText] = React.useState<string | null>(null);

  // New Feature States
  const [scoreModalOpen, setScoreModalOpen] = React.useState(false);
  const [reminderModalOpen, setReminderModalOpen] = React.useState(false);
  const [reminderDate, setReminderDate] = React.useState('');
  const [reminderNote, setReminderNote] = React.useState('');
  const [saveContactName, setSaveContactName] = React.useState('');
  const [saveContactTitle, setSaveContactTitle] = React.useState('');

  const [qualStep, setQualStep] = React.useState(0);
  const qualChecklist = [
    "Company verified",
    "Industry match",
    "Contact verified",
    "Website verified",
    "Procurement detected",
    "Confidence calculated",
    "Opportunity ranked"
  ];

  // ─── Data Fetching ─── All useQuery hooks must be declared BEFORE any
  // useEffect or handler that references `opp`, because the useEffect deps
  // array [opp?.stage, id] is evaluated synchronously during render.

  // 1. Fetch Main Opportunity Details with nested account and intelligence signals
  const { data: opp, isLoading, refetch: refetchOpp } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          account:accounts(*),
          lead:leads(*),
          pipeline_items(stage, id),
          opportunity_intelligence(
            id,
            summary,
            confidence,
            opportunity_signals(
              id,
              signal_instance:signal_instances(
                *,
                signal_registry:signal_registry(*)
              )
            )
          )
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id
  });

  // (moved dynamic calculations below query hooks)

  // 2. Fetch Contacts mapped to this account (Priority 1 & 4)
  const { data: contacts } = useQuery({
    queryKey: ['opp_contacts', opp?.account_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('account_id', opp!.account_id);
      if (error) throw error;
      return data;
    },
    enabled: !!opp?.account_id
  });

  // 3. Fetch Activities mapped to this opportunity (Priority 6)
  const { data: activities, refetch: refetchActivities } = useQuery({
    queryKey: ['opp_activities', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('opportunity_id', id)
        .order('activity_timestamp', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // 4. Fetch Tasks mapped to this opportunity (Priority 4 & 6)
  const { data: tasks, refetch: refetchTasks } = useQuery({
    queryKey: ['opp_tasks', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('opportunity_id', id)
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // 5. Fetch Meetings (Priority 8)
  const { data: meetings, refetch: refetchMeetings } = useQuery({
    queryKey: ['opp_meetings', opp?.legacy_lead_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('lead_id', opp!.legacy_lead_id)
        .order('scheduled_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!opp?.legacy_lead_id
  });

  // 6. Fetch OIE Score Breakdown
  const { data: leadScoreData } = useQuery({
    queryKey: ['lead-score-details', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('opportunity_scores')
        .select('*')
        .eq('opportunity_id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Calculate dynamic primary contact
  const primaryContact = React.useMemo(() => {
    if (contacts && contacts.length > 0) {
      const dm = contacts.find((c: any) => c.is_decision_maker);
      return dm || contacts[0];
    }
    if (opp?.lead?.contact_name) {
      return { 
        full_name: opp.lead.contact_name, 
        phone: opp.lead.phone || opp.lead.external_phone, 
        email: opp.lead.email || opp.lead.external_email 
      };
    }
    return null;
  }, [contacts, opp]);

  // Calculate dynamic action text
  const parseMeta = (meta: any) => typeof meta === 'string' ? JSON.parse(meta) : meta;
  const extractLeadMeta = (opp: any) => {
    const lead = Array.isArray(opp?.leads) ? opp.leads[0] : opp?.leads;
    if (!lead || !lead.metadata) return null;
    return parseMeta(lead.metadata);
  };
  const normalizedScoreData = leadScoreData?.score_breakdown || extractLeadMeta(opp)?.oie_score || null;
  const leadScore = opp?.lead_score || normalizedScoreData?.lead_score || null;
  const dynamicActionText = React.useMemo(() => {
    const stage = (opp?.stage || 'discovery').toLowerCase();
    const target = primaryContact ? primaryContact.full_name : 'Decision Maker';
    
    if (stage === 'discovery' || stage === 'qualification') {
      if (leadScore !== null) {
        return `Lead Scored (${leadScore.toFixed(0)}). Next step: Outreach to ${target}.`;
      }
      return 'Run qualification and score lead.';
    }
    if (stage === 'outreach') return `Send Pitch Follow-Up to ${target}`;
    if (stage === 'proposal') return `Generate & Send Tender Proposal Draft to ${target}`;
    if (stage === 'negotiation') return `Send Contract Review & Pricing Negotiation to ${target}`;
    return opp?.recommended_action || `Contact ${target}`;
  }, [opp?.stage, leadScore, primaryContact, opp?.recommended_action]);

  const handleSaveContact = async () => {
    if (!saveContactName || !opp?.account_id) return;
    try {
      const { error } = await supabase.from('contacts').insert({
        workspace_id: opp.workspace_id,
        account_id: opp.account_id,
        full_name: saveContactName,
        job_title: saveContactTitle,
        email: opp?.lead?.email || opp?.lead?.external_email || null,
        phone: opp?.lead?.phone || opp?.lead?.external_phone || null,
        created_by: profile?.id
      });
      if (error) throw error;
      toast.success("Contact saved successfully");
      setSaveContactName('');
      setSaveContactTitle('');
      queryClient.invalidateQueries({ queryKey: ['opp_contacts'] });
    } catch (e: any) {
      toast.error("Failed to save contact: " + e.message);
    }
  };

  const handleSaveReminder = async () => {
    if (!reminderDate || !opp) return;
    try {
      const { error } = await supabase.from('tasks').insert({
        workspace_id: opp.workspace_id,
        opportunity_id: opp.id,
        account_id: opp.account_id,
        title: "Follow-up Reminder",
        description: reminderNote,
        due_date: new Date(reminderDate).toISOString(),
        task_type: 'reminder',
        status: 'pending'
      });
      if (error) throw error;
      toast.success("Reminder set successfully");
      setReminderModalOpen(false);
      setReminderDate('');
      setReminderNote('');
      queryClient.invalidateQueries({ queryKey: ['opp_tasks'] });
    } catch (e: any) {
      toast.error("Failed to set reminder: " + e.message);
    }
  };

  const [lostReasonOpen, setLostReasonOpen] = React.useState(false);

  const handleStatusAction = async (action: string) => {
    let nextStage = currentStage;
    
    if (action === 'Meeting Scheduled' || action === 'Meeting Completed') {
      nextStage = 'Proposal';
    } else if (action === 'Proposal Sent' || action === 'Proposal Revised' || action === 'Negotiating') {
      nextStage = 'Negotiation';
    } else if (action === 'Won') {
      nextStage = 'Won';
    } else if (action === 'Lost') {
      setLostReasonOpen(true);
      return;
    }

    try {
      const isClosed = nextStage.toLowerCase() === 'won' || nextStage.toLowerCase() === 'lost';
      const statusValue = isClosed ? nextStage.toLowerCase() : 'open';

      const { error } = await supabase
        .from('opportunities')
        .update({ 
          stage: nextStage.toLowerCase(), 
          status: statusValue 
        })
        .eq('id', id);

      if (error) throw error;

      if (nextStage.toLowerCase() === 'won' && opp.legacy_lead_id) {
        const { error: leadErr } = await supabase
          .from('leads')
          .update({ status: 'Awarded' })
          .eq('id', opp.legacy_lead_id);
        if (leadErr) console.error("Failed to update marketplace lead status:", leadErr);
      }

      // Log to activities table
      await supabase.from('activities').insert({
        workspace_id: opp.workspace_id,
        opportunity_id: id,
        account_id: opp.account_id,
        activity_type: 'system',
        title: `Status Updated`,
        description: `Action "${action}" triggered. Opportunity moved to stage: ${nextStage}.`
      });

      // Log to activity_timeline table
      await supabase.from('activity_timeline').insert({
        user_id: profile?.id,
        activity_type: 'profile_updated',
        title: `Stage Updated to ${nextStage}`,
        description: `Action "${action}" triggered. Opportunity moved to stage: ${nextStage}.`,
        related_id: id,
        related_type: 'lead'
      }).catch(err => console.error("Timeline insertion failed:", err));

      // Auto-create tasks on stage change
      if (nextStage.toLowerCase() === 'proposal') {
        await supabase.from('tasks').insert({
          workspace_id: opp.workspace_id,
          opportunity_id: id,
          account_id: opp.account_id,
          title: `Prepare & Send Proposal`,
          description: `Generate tailored commercial proposal and submit to prospect.`,
          priority: 'critical',
          task_type: 'email',
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        });
      } else if (nextStage.toLowerCase() === 'negotiation') {
        await supabase.from('tasks').insert({
          workspace_id: opp.workspace_id,
          opportunity_id: id,
          account_id: opp.account_id,
          title: `Contract Negotiation`,
          description: `Review payment terms, pricing adjustments, and close contract.`,
          priority: 'high',
          task_type: 'meeting',
          due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        });
      }

      // Trigger automation rules
      await triggerAutomationRules('STAGE_CHANGED', {
        workspaceId: opp.workspace_id,
        opportunityId: id!,
        accountId: opp.account_id,
        stage: nextStage
      });

      toast.success(`Action "${action}" logged. Stage updated to ${nextStage}`);
      refetchOpp();
      refetchActivities();
    } catch (e: any) {
      toast.error("Failed to update status: " + e.message);
    }
  };

  const handleConfirmLost = async (reason: string) => {
    try {
      const { error } = await supabase
        .from('opportunities')
        .update({ 
          stage: 'lost', 
          status: 'lost',
          lost_reason: reason
        })
        .eq('id', id);

      if (error) throw error;

      await supabase.from('activities').insert({
        workspace_id: opp.workspace_id,
        opportunity_id: id,
        account_id: opp.account_id,
        activity_type: 'system',
        title: `Opportunity Lost`,
        description: `Opportunity marked as Lost. Reason: ${reason}`
      });

      await supabase.from('activity_timeline').insert({
        user_id: profile?.id,
        activity_type: 'conversion_rejected',
        title: 'Opportunity Lost',
        description: `Opportunity marked as Lost. Reason: ${reason}`,
        related_id: id,
        related_type: 'lead'
      }).catch(err => console.error("Timeline insertion failed:", err));

      // Trigger automation rules
      await triggerAutomationRules('STAGE_CHANGED', {
        workspaceId: opp.workspace_id,
        opportunityId: id!,
        accountId: opp.account_id,
        stage: 'lost'
      });

      toast.success(`Opportunity marked as Lost. Reason saved: ${reason}`);
      setLostReasonOpen(false);
      refetchOpp();
      refetchActivities();
    } catch (e: any) {
      toast.error("Failed to log Lost status: " + e.message);
    }
  };

  // Direct Outreach Dialog/Modal State (Priority 1)
  const [activeOutreachModal, setActiveOutreachModal] = React.useState<{
    type: 'email' | 'whatsapp' | 'linkedin' | 'sms';
    recipient: string;
    subject?: string;
    body: string;
  } | null>(null);

  // Call Logging Outcome Modal State (Priority 1)
  const [callModalOpen, setCallModalOpen] = React.useState(false);
  const [callOutcome, setCallOutcome] = React.useState('Connected');
  const [callNotes, setCallNotes] = React.useState('');

  // Meeting Management Modal State (Priority 8)
  const [meetingModalOpen, setMeetingModalOpen] = React.useState(false);
  const [meetingAgenda, setMeetingAgenda] = React.useState('');
  const [meetingDate, setMeetingDate] = React.useState('');
  const [meetingTime, setMeetingTime] = React.useState('10:00');
  const [meetingType, setMeetingType] = React.useState('Zoom');
  const [meetingAttendeeEmail, setMeetingAttendeeEmail] = React.useState('');

  // Checklist Item State (Priority 5)
  const [customChecklistItem, setCustomChecklistItem] = React.useState('');

  // Custom Task Insertion States
  const [newTitle, setNewTitle] = React.useState('');
  const [newType, setNewType] = React.useState('call');
  const [newPriority, setNewPriority] = React.useState('medium');
  const [isCreatingTask, setIsCreatingTask] = React.useState(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = React.useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = React.useState<string[]>([]);

  // Proposal States
  const [quotations, setQuotations] = React.useState<{ name: string; size: string; date: string }[]>(() => {
    const saved = localStorage.getItem(`opp_${id}_quotes`);
    return saved ? JSON.parse(saved) : [
      { name: "Jas_Connect_Bid_Draft_v1.pdf", size: "1.2 MB", date: new Date().toLocaleDateString() }
    ];
  });

  const [proposalVersions, setProposalVersions] = React.useState<{ version: string; date: string; author: string; status: string }[]>(() => {
    const saved = localStorage.getItem(`opp_${id}_prop_versions`);
    return saved ? JSON.parse(saved) : [
      { version: "v1.0 - Initial Draft", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1050).toLocaleDateString(), author: "AI Assistant", status: "Approved" },
      { version: "v1.1 - Sent to Client", date: new Date().toLocaleDateString(), author: "Current User", status: "Under Review" }
    ];
  });

  const [customerFeedback, setCustomerFeedback] = React.useState<{ text: string; date: string; author: string }[]>(() => {
    const saved = localStorage.getItem(`opp_${id}_feedback`);
    return saved ? JSON.parse(saved) : [
      { text: "Asked for clarification on pricing breakdown for section B.", date: new Date().toLocaleDateString(), author: "Operations Director" }
    ];
  });

  const [proposalTimeline, setProposalTimeline] = React.useState<{ task: string; completed: boolean }[]>(() => {
    const saved = localStorage.getItem(`opp_${id}_timeline`);
    return saved ? JSON.parse(saved) : [
      { task: "Draft generated by AI", completed: true },
      { task: "Review pricing specifications", completed: true },
      { task: "Upload official quote sheet", completed: false },
      { task: "Submit to procurement portal", completed: false }
    ];
  });

  // Negotiation States
  const [bidPrice, setBidPrice] = React.useState<number>(12500);
  const [discountPercent, setDiscountPercent] = React.useState<number>(5);
  const [negotiationNotes, setNegotiationNotes] = React.useState<string>(() => {
    return localStorage.getItem(`opp_${id}_neg_notes`) || "Client requested 5% volume discount. Standard payment terms apply.";
  });
  const [closeDate, setCloseDate] = React.useState<string>(() => {
    return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  });

  // Proposal Handlers
  const handleUploadQuotation = () => {
    const newQuote = { name: `Jas_Connect_Quotation_${Date.now().toString().slice(-4)}.pdf`, size: "840 KB", date: new Date().toLocaleDateString() };
    const updated = [...quotations, newQuote];
    setQuotations(updated);
    localStorage.setItem(`opp_${id}_quotes`, JSON.stringify(updated));
    toast.success("Quotation uploaded and saved successfully!");
  };

  const handleAddVersion = () => {
    const name = prompt("Enter version details:", `v1.${proposalVersions.length} - Revised Pricing`);
    if (!name) return;
    const newVer = { version: name, date: new Date().toLocaleDateString(), author: "Current User", status: "Under Review" };
    const updated = [...proposalVersions, newVer];
    setProposalVersions(updated);
    localStorage.setItem(`opp_${id}_prop_versions`, JSON.stringify(updated));
    toast.success("New proposal version saved.");
  };

  const handleAddCustomerFeedback = () => {
    const text = prompt("Enter customer feedback:");
    if (!text) return;
    const newFeed = { text, date: new Date().toLocaleDateString(), author: "Customer Rep" };
    const updated = [...customerFeedback, newFeed];
    setCustomerFeedback(updated);
    localStorage.setItem(`opp_${id}_feedback`, JSON.stringify(updated));
    toast.success("Customer feedback logged.");
  };

  const handleToggleProposalTimeline = (idx: number) => {
    const updated = proposalTimeline.map((item, i) => i === idx ? { ...item, completed: !item.completed } : item);
    setProposalTimeline(updated);
    localStorage.setItem(`opp_${id}_timeline`, JSON.stringify(updated));
  };

  // Negotiation Handlers
  const handleSavePriceRevision = async () => {
    const { error } = await supabase
      .from('opportunities')
      .update({ estimated_value: bidPrice })
      .eq('id', id);
    if (error) {
      toast.error(`Failed to adjust price: ${error.message}`);
    } else {
      toast.success(`Bid Price updated to $${bidPrice.toLocaleString()}!`);
      refetchOpp();
    }
  };

  const handleSaveCloseDate = async () => {
    const { error } = await supabase
      .from('opportunities')
      .update({ expected_close_date: closeDate })
      .eq('id', id);
    if (error) {
      toast.error(`Failed to adjust expected close date: ${error.message}`);
    } else {
      toast.success(`Expected close date updated to ${new Date(closeDate).toLocaleDateString()}!`);
      refetchOpp();
    }
  };

  // Sync initial DB values to local state once opportunity loads
  React.useEffect(() => {
    if (opp) {
      if (opp.estimated_value) setBidPrice(opp.estimated_value);
      if (opp.expected_close_date) {
        setCloseDate(new Date(opp.expected_close_date).toISOString().split('T')[0]);
      }
    }
  }, [opp]);


  if (isLoading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-white">Dossier Not Found</h2>
        <Button onClick={() => navigate('/dashboard')} variant="outline">Return to Dashboard</Button>
      </div>
    );
  }

  const currentStage = opp.stage || 'Discovery';
  const companyName = opp.account?.name || 'Unknown Company';
  const industry = opp.account?.industry || opp.industry || 'Infrastructure & Logistics';
  const location = [opp.account?.hq_location || opp.account?.city, opp.account?.state_province].filter(Boolean).join(', ') || 'HQ Location Unmapped';
  const website = opp.account?.website || '';
  const phone = opp.account?.phone || '';
  const email = opp.account?.email || '';

  // Pipeline Stage Synchronization (Priority 2)
  const handleUpdateStage = async (stageName: string) => {
    try {
      const { error } = await supabase
        .from('opportunities')
        .update({ stage: stageName })
        .eq('id', id);
      if (error) throw error;
      
      await supabase.from('activities').insert({
        opportunity_id: id,
        account_id: opp.account_id,
        activity_type: 'system',
        title: 'Stage Changed',
        description: `Opportunity stage updated to ${stageName}.`
      });
      
      toast.success(`Stage updated to ${stageName}`);
      refetchOpp();
      refetchActivities();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Opportunity Health Calculation (Priority 10)
  const healthStatus = (() => {
    const lastAct = activities?.[0]?.activity_timestamp 
      ? new Date(activities[0].activity_timestamp) 
      : new Date(opp.created_at);
    const diffDays = Math.floor((Date.now() - lastAct.getTime()) / (1000 * 60 * 60 * 24));
    const overdueCount = tasks?.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date()).length || 0;
    
    if (diffDays > 14 || overdueCount > 2) return 'Inactive';
    if (diffDays > 7 || overdueCount > 0) return 'At Risk';
    if (diffDays > 3) return 'Stalled';
    return 'Healthy';
  })();

  const daysInStage = Math.max(1, Math.floor((Date.now() - new Date(opp.created_at).getTime()) / (1000 * 60 * 60 * 24)));
  
  // Aggregate activities (Priority 6)
  const activityStats = {
    emails: activities?.filter(a => a.activity_type === 'email').length || 0,
    calls: activities?.filter(a => a.activity_type === 'call').length || 0,
    whatsapp: activities?.filter(a => a.activity_type === 'whatsapp').length || 0,
    sms: activities?.filter(a => a.activity_type === 'sms').length || 0,
    linkedin: activities?.filter(a => a.activity_type === 'linkedin').length || 0,
    meetings: meetings?.filter(m => m.status === 'completed').length || 0,
    notes: activities?.filter(a => a.activity_type === 'note').length || 0
  };

  // Checklist Engine (Priority 5)
  const defaultChecklistByStage: Record<string, string[]> = {
    'discovery': ['Verify company information', 'Assess lead source', 'Check website availability'],
    'qualification': ['Verify phone number', 'Verify email address', 'Identify decision maker', 'Assess growth indicators'],
    'validation': ['Complete introductory call', 'Understand budget availability', 'Map timelines & tender responses'],
    'proposal': ['Schedule discovery meeting', 'Present technical proposal', 'Log next-step follow-ups'],
    'negotiation': ['Review vendor registration', 'Confirm procurement stage', 'Finalize pricing outline'],
    'won': ['Contract signed', 'Project kickoff scheduled', 'Review feedback'],
    'lost': ['Analyze drop-off reasons', 'Log competitor winner', 'Archive dossier']
  };

  const currentStageChecklist = (() => {
    const list = opp.checklist_progress || [];
    const stageItems = list.filter((item: any) => item.stage?.toLowerCase() === currentStage.toLowerCase());
    
    if (stageItems.length === 0) {
      const defaults = defaultChecklistByStage[currentStage.toLowerCase()] || [];
      return defaults.map((label, idx) => ({
        id: `default-${currentStage.toLowerCase()}-${idx}`,
        label,
        completed: false,
        stage: currentStage
      }));
    }
    return stageItems;
  })();

  const handleToggleChecklist = async (itemId: string, completed: boolean) => {
    try {
      const savedList = opp.checklist_progress || [];
      const hasItemSaved = savedList.some((i: any) => i.id === itemId);
      let updatedList = [];
      
      if (hasItemSaved) {
        updatedList = savedList.map((item: any) => 
          item.id === itemId ? { ...item, completed } : item
        );
      } else {
        const stageDefaultsWithUpdate = currentStageChecklist.map((item: any) => 
          item.id === itemId ? { ...item, completed } : item
        );
        const otherStagesList = savedList.filter((item: any) => item.stage?.toLowerCase() !== currentStage.toLowerCase());
        updatedList = [...otherStagesList, ...stageDefaultsWithUpdate];
      }

      const { error } = await supabase
        .from('opportunities')
        .update({ checklist_progress: updatedList })
        .eq('id', id);
      if (error) throw error;
      
      const toggledItem = updatedList.find((i: any) => i.id === itemId);
      if (toggledItem) {
        await supabase.from('activities').insert({
          opportunity_id: id,
          account_id: opp.account_id,
          activity_type: 'system',
          title: `Task Checked ${completed ? 'ON' : 'OFF'}`,
          description: `Checklist item: "${toggledItem.label}" marked as ${completed ? 'completed' : 'pending'}.`
        });
      }

      refetchOpp();
      refetchActivities();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customChecklistItem.trim()) return;
    try {
      const savedList = opp.checklist_progress || [];
      const hasStageItemsSaved = savedList.some((item: any) => item.stage?.toLowerCase() === currentStage.toLowerCase());
      let updatedList = [];
      
      const newItem = {
        id: `custom-${Date.now()}`,
        label: customChecklistItem,
        completed: false,
        stage: currentStage
      };

      if (hasStageItemsSaved) {
        updatedList = [...savedList, newItem];
      } else {
        const otherStagesList = savedList.filter((item: any) => item.stage?.toLowerCase() !== currentStage.toLowerCase());
        updatedList = [...otherStagesList, ...currentStageChecklist, newItem];
      }

      const { error } = await supabase
        .from('opportunities')
        .update({ checklist_progress: updatedList })
        .eq('id', id);
      if (error) throw error;
      
      setCustomChecklistItem('');
      refetchOpp();
      toast.success("Checklist item added");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Unified Chronological Timeline Assembler (Priority 6)
  const timelineItems = (() => {
    const items: any[] = [];
    
    // Lead Imported On (Opportunity creation date)
    items.push({
      type: 'system',
      timestamp: new Date(opp.created_at),
      title: 'Lead Imported',
      description: `Opportunity dossier created for ${companyName}.`,
      badge: 'imported',
      color: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
    });

    // Signals
    const intelSignals = opp.opportunity_intelligence?.[0]?.opportunity_signals || [];
    intelSignals.forEach((os: any) => {
      const inst = os.signal_instance;
      if (inst) {
        items.push({
          type: 'signal',
          timestamp: new Date(inst.detected_at || opp.created_at),
          title: inst.signal_registry?.name || 'Signal Detected',
          description: inst.raw_content || `Signal detected with strength ${inst.strength || 50}%.`,
          badge: `${inst.strength || 50}% Str`,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
        });
      }
    });

    // Activities (Includes Call logs, Emails, WhatsApp, SMS, LinkedIn)
    activities?.forEach((act: any) => {
      items.push({
        type: 'activity',
        timestamp: new Date(act.activity_timestamp),
        title: act.title || act.activity_type?.toUpperCase(),
        description: act.description,
        badge: act.activity_type,
        color: act.activity_type === 'email' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
               act.activity_type === 'call' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
               act.activity_type === 'whatsapp' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
               act.activity_type === 'linkedin' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' :
               act.activity_type === 'sms' ? 'text-pink-400 bg-pink-500/10 border-pink-500/20' :
               'text-slate-400 bg-slate-500/10 border-slate-500/20'
      });
    });

    // Meetings
    meetings?.forEach((meet: any) => {
      items.push({
        type: 'meeting',
        timestamp: new Date(meet.scheduled_at),
        title: `Meeting Scheduled: ${meet.agenda || 'Discovery Call'}`,
        description: `Scheduled type: ${meet.meeting_type}. Status: ${meet.status}. Email: ${meet.attendee_email || 'None'}`,
        badge: 'meeting',
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
      });
    });

    // Tasks (Completed & Pending)
    tasks?.forEach((task: any) => {
      if (task.completed_at) {
        items.push({
          type: 'task_completed',
          timestamp: new Date(task.completed_at),
          title: `Task Completed: ${task.title}`,
          description: task.description || 'Execution completed.',
          badge: 'task-completed',
          color: 'text-teal-400 bg-teal-500/10 border-teal-500/20'
        });
      }
    });

    // Sort newest first
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  })();

  // AI outreach messages custom variables (Priority 1 & 9)
  const generatedOutreach = (() => {
    const industryName = opp.account?.industry || opp.industry || 'Infrastructure Services';
    const rating = opp.account?.rating || '4.2';
    const reviews = opp.account?.reviews || 12;
    const senderName = user?.user_metadata?.full_name || 'Account Specialist';
    const primaryContact = contacts?.[0]?.first_name || 'Operations Lead';
    const location = opp.location || 'your region';

    const intelSignals = opp.opportunity_intelligence?.[0]?.opportunity_signals || [];
    const signalNames = intelSignals.map((os: any) => os.signal_instance?.signal_registry?.name).filter(Boolean);
    const primarySignal = signalNames[0] || 'High Growth Indicators';

    const localHook = reviews > 10 
      ? `your verified local operational footprint (${reviews} reviews, ${rating} rating)`
      : `your target activity in ${location}`;

    const emailSubject = `Operational qualification update: ${companyName} (${primarySignal})`;
    const emailBody = `Hi ${primaryContact},\n\nWe detected a verified ${primarySignal} event regarding ${localHook} in our ${industryName} intelligence index.\n\nFor contractors in ${location}, qualification velocity determines bid outcomes. JAS CONNECT maps intent signals like ${primarySignal} directly to qualification outcomes, bypassing standard 14-day vendor audit delays. Our value proposition: we accelerate supplier verification and tender registration times by 40%.\n\nLet's schedule a 5-minute technical brief this week to qualify upcoming project capabilities.\n\nBest regards,\n\n${senderName}\nJAS CONNECT Specialist`;

    const linkedinBody = `Hi ${primaryContact}, noticed ${companyName}'s trigger on ${primarySignal} in the ${industryName} vertical. We assist ops leaders in ${location} to compress vendor qualification times by 40% using real-time signal tracking. Would love to share our Complimentary procurement outline. Let's connect.`;

    const whatsappBody = `Hello ${primaryContact},\n\nReaching out from JAS CONNECT regarding the opportunity with *${companyName}* (*${opp.title || 'Expansion'}*) in the *${industryName}* sector.\n\nOur intelligence engine has qualified this opportunity with a *${(opp.confidence_overall || 75).toFixed(0)}% Confidence Score* based on current triggers.\n\n*Key Details & Procurement Context:*\n- *Current Stage:* ${currentStage || opp.stage}\n- *Opportunity Strength:* ${(opp.opportunity_strength || 70).toFixed(0)}%\n- *Procurement Summary:* ${opp.explanation || 'High relevance indicator matches operational footprint.'}\n\n*Our Recommended Next Action:*\n${opp.recommended_action || 'Initiate direct outreach to qualification contact.'}\n\nDo you have 2 minutes for a quick sync regarding vendor qualification requirements for this project?\n\nBest regards,\n${senderName}`;

    const smsBody = `Hi ${primaryContact} - we detected a ${primarySignal} event for ${companyName}. We help firms in ${industryName} qualify vendor profiles. Let us know if you have 3 minutes to align on procurement requirements.`;

    const callScript = `Hi ${primaryContact}, this is ${senderName} with JAS CONNECT. I am calling because we tracked a ${primarySignal} signal for ${companyName} in the ${industryName} space. We compiled a qualification operations report for ${companyName}. I wanted to see who manages your procurement qualifications or tender vendor registrations for upcoming projects?`;

    const followUpBody = `${primaryContact}, sharing a brief operational overview showing how contractors in ${industryName} use qualified signals to accelerate vendor audits.\n\nBy mapping events like ${primarySignal} directly to active tender pipelines, we eliminate standard manual verification delays.\n\nDo you have 5 minutes for a short walkthrough next Tuesday at 10:00 AM?\n\nBest regards,\n\n${senderName}`;

    const objections = [
      { objection: "We are currently using standard CRM databases", response: "We act as an overlay scoring and intelligence engine to provide priority scoring rather than replacing your database." },
      { objection: "We do not have a budget right now", response: "No worries. We can initialize a free automated alert tracking public tender listings so you get notified of new opportunities." }
    ];

    return {
      email: { subject: emailSubject, body: emailBody },
      linkedin: linkedinBody,
      whatsapp: whatsappBody,
      sms: smsBody,
      callScript: callScript,
      followUp: followUpBody,
      objections: objections,
      metadata: {
        email: {
          why: `Generated dynamically because ${companyName} triggered a verified ${primarySignal} signal in the ${industryName} sector.`,
          trigger: primarySignal,
          outcome: "Secure a 5-minute introduction call to qualify operations capabilities."
        },
        linkedin: {
          why: `Optimized for LinkedIn connection invitation. Hooks onto ${primarySignal}.`,
          trigger: primarySignal,
          outcome: "Acceptance of connection invitation followed by qualified profile delivery."
        },
        whatsapp: {
          why: `High-urgency direct mobile message targeting verified decision makers.`,
          trigger: primarySignal,
          outcome: "Prompt response indicating availability or redirecting to primary operations contact."
        },
        sms: {
          why: `Direct mobile SMS qualification prompt referencing company and signal variables.`,
          trigger: primarySignal,
          outcome: "Prompt response indicating interest and scheduling introductory sync."
        },
        callScript: {
          why: `Direct phone script avoiding gatekeeper prompts by referencing verified intent signals.`,
          trigger: primarySignal,
          outcome: "Direct transfer to decision maker or verification of operations contact."
        },
        followUp: {
          why: `Structured follow-up adding tangible value regarding signal qualification efficiency.`,
          trigger: primarySignal,
          outcome: "Schedule walkthrough meeting to demo automated signals dashboard."
        }
      }
    };
  })();

  // Follow-up Intelligence Heuristics (Priority 9)
  const followUpIntelligence = (() => {
    if (!opp) return null;
    const lastActivity = activities?.[0];
    if (!lastActivity) return { type: 'initial', message: 'No outreach logged yet. Initiate intro sequence.' };
    
    const diffDays = Math.floor((Date.now() - new Date(lastActivity.activity_timestamp).getTime()) / (1000 * 60 * 60 * 24));
    
    if (lastActivity.activity_type === 'email' && diffDays >= 5) {
      return {
        type: 'followup_email',
        message: `No reply received for ${diffDays} days following email outreach. Send follow-up bump.`,
        actionText: 'Compose Follow-Up Email'
      };
    }
    if (lastActivity.activity_type === 'call' && lastActivity.title?.includes('No Answer') && diffDays >= 1) {
      return {
        type: 'whatsapp_nudge',
        message: `Last call outcome was 'No Answer'. Nudge contact via WhatsApp to connect.`,
        actionText: 'Nudge on WhatsApp'
      };
    }
    if (meetings && meetings.some(m => m.status === 'completed') && !tasks?.some(t => t.title.includes('Proposal'))) {
      return {
        type: 'create_proposal',
        message: `Discovery meeting completed successfully. Draft and schedule technical proposal follow-up.`,
        actionText: 'Create Proposal Task'
      };
    }
    return null;
  })();

  // Task Execution Queue Actions (Priority 4)
  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', taskId);
      if (error) throw error;



      toast.success("Task completed");
      refetchTasks();
      refetchActivities();

      // Trigger automation rules
      await triggerAutomationRules('TASK_COMPLETED', {
        workspaceId: opp.workspace_id,
        opportunityId: id!,
        accountId: opp.account_id
      });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      if (error) throw error;
      toast.success("Task deleted");
      setSelectedTaskIds(prev => prev.filter(tid => tid !== taskId));
      refetchTasks();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleBulkCompleteTasks = async () => {
    if (selectedTaskIds.length === 0) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .in('id', selectedTaskIds);
      if (error) throw error;



      toast.success("Selected tasks completed");
      setSelectedTaskIds([]);
      refetchTasks();
      refetchActivities();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleBulkDeleteTasks = async () => {
    if (selectedTaskIds.length === 0) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', selectedTaskIds);
      if (error) throw error;
      toast.success("Selected tasks deleted");
      setSelectedTaskIds([]);
      refetchTasks();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Custom Task Creation with Inherited IDs (Priority 4)
  const handleCreateCustomTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreatingTask(true);
    try {
      const { error } = await supabase.from('tasks').insert({
        workspace_id: opp.workspace_id,
        opportunity_id: id,
        account_id: opp.account_id,
        title: newTitle,
        task_type: newType,
        priority: newPriority,
        due_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      });
      if (error) throw error;
      toast.success("Task created");
      setNewTitle('');
      refetchTasks();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Auto Generate Task Sequence with Inherited IDs (Priority 4)
  const handleAutoGenerateTasks = async () => {
    setIsGeneratingTasks(true);
    try {
      const recommendedTasks = [
        {
          workspace_id: opp.workspace_id,
          opportunity_id: id,
          account_id: opp.account_id,
          title: 'Initial Outreach Call',
          description: `Call contact using cold script. Target channel: ${opp.explanation?.recommended_contact_method || 'Phone'}.`,
          priority: opp.explanation?.urgency_level === 'CRITICAL' ? 'critical' : 'high',
          task_type: 'call',
          due_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        },
        {
          workspace_id: opp.workspace_id,
          opportunity_id: id,
          account_id: opp.account_id,
          title: 'Send Introduction Email',
          description: `Send personalized introduction email based on Google Maps reviews and category signals.`,
          priority: 'high',
          task_type: 'email',
          due_date: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        },
        {
          workspace_id: opp.workspace_id,
          opportunity_id: id,
          account_id: opp.account_id,
          title: 'Schedule Discovery Meeting',
          description: 'Qualify procurement budget availability and tender response timeline.',
          priority: 'medium',
          task_type: 'meeting',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        }
      ];

      const { error } = await supabase.from('tasks').insert(recommendedTasks);
      if (error) throw error;

      toast.success("Outreach checklist generated successfully!");
      refetchTasks();
    } catch (e: any) {
      toast.error(`Failed to generate tasks: ${e.message}`);
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  // Direct Meeting Scheduling & Auto-Tasks Setup (Priority 8)
  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingAgenda.trim() || !meetingDate) return;
    try {
      const scheduledAt = new Date(`${meetingDate}T${meetingTime}:00`).toISOString();
      const { error: meetErr } = await supabase.from('meetings').insert({
        lead_id: opp.legacy_lead_id,
        organizer_id: profile?.id || null,
        user_id: user?.id,
        opportunity_id: id,
        account_id: opp.account_id,
        title: meetingAgenda,
        date: meetingDate,
        time: meetingTime,
        scheduled_at: scheduledAt,
        status: 'scheduled',
        notes: `Meeting scheduled. Type: ${meetingType}.`,
        agenda: meetingAgenda,
        meeting_type: meetingType,
        attendee_email: meetingAttendeeEmail || contacts?.[0]?.email || ''
      });

      if (meetErr) throw meetErr;

      // Log activity to activities table
      await supabase.from('activities').insert({
        workspace_id: opp.workspace_id,
        opportunity_id: id,
        account_id: opp.account_id,
        activity_type: 'meeting',
        title: 'Meeting Scheduled',
        description: `Scheduled discovery meeting on ${meetingDate} at ${meetingTime}. Type: ${meetingType}. Agenda: ${meetingAgenda}`
      });

      // Log to activity_timeline table (Priority 6)
      await supabase.from('activity_timeline').insert({
        user_id: profile?.id,
        activity_type: 'meeting_scheduled',
        title: 'Meeting Scheduled',
        description: `Scheduled discovery meeting on ${meetingDate} at ${meetingTime}. Type: ${meetingType}. Agenda: ${meetingAgenda}`,
        related_id: id,
        related_type: 'lead'
      }).catch(err => console.error("Timeline insertion failed:", err));

      // Create reminder task
      await supabase.from('tasks').insert({
        workspace_id: opp.workspace_id,
        opportunity_id: id,
        account_id: opp.account_id,
        title: `Attend Meeting: ${meetingAgenda}`,
        description: `Pre-qualify options using dossier scripts before call.`,
        priority: 'high',
        task_type: 'meeting',
        due_date: scheduledAt,
        status: 'pending'
      });

      // Trigger automation rules
      await triggerAutomationRules('MEETING_SCHEDULED', {
        workspaceId: opp.workspace_id,
        opportunityId: id!,
        accountId: opp.account_id
      });

      toast.success("Meeting scheduled and tasks queued");
      setMeetingModalOpen(false);
      setMeetingAgenda('');
      setMeetingDate('');
      refetchMeetings();
      refetchActivities();
      refetchTasks();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Confirm Outreach Modal Sent: Launch external link & save activity log (Priority 1)
  const handleConfirmSendOutreach = async () => {
    if (!activeOutreachModal) return;
    const { type, recipient, subject, body } = activeOutreachModal;
    
    if (type === 'email') {
      window.open(`mailto:${recipient}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body)}`);
    } else if (type === 'whatsapp') {
      const cleanPhone = recipient.replace(/[^\d+]/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(body)}`);
    } else if (type === 'linkedin') {
      window.open(contacts?.[0]?.linkedin_url || opp.account?.linkedin_url || 'https://linkedin.com');
      navigator.clipboard.writeText(body);
      toast.success("Message copied. Paste in connection invitation.");
    } else if (type === 'sms') {
      window.open(`sms:${recipient}?&body=${encodeURIComponent(body)}`);
    }

    try {
      await supabase.from('activities').insert({
        workspace_id: opp.workspace_id,
        opportunity_id: id,
        account_id: opp.account_id,
        activity_type: type,
        title: `Outbound ${type.toUpperCase()} Sent`,
        description: body
      });
      toast.success(`Outreach activity logged for ${type.toUpperCase()}`);
      setActiveOutreachModal(null);
      refetchActivities();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Outbound Call Outcome Logger (Priority 1)
  const handleSaveCallLog = async () => {
    try {
      await supabase.from('activities').insert({
        workspace_id: opp.workspace_id,
        opportunity_id: id,
        account_id: opp.account_id,
        activity_type: 'call',
        title: `Call Logged: ${callOutcome}`,
        description: `Notes: ${callNotes || 'No notes added.'}`
      });
      
      // Queue follow-up callback task if outcome indicates callback
      if (callOutcome === 'Follow-up Scheduled') {
        await supabase.from('tasks').insert({
          workspace_id: opp.workspace_id,
          opportunity_id: id,
          account_id: opp.account_id,
          title: 'Follow-up Callback',
          description: 'Callback requested during outbound contact.',
          priority: 'high',
          task_type: 'call',
          due_date: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        });
      }

      toast.success("Call outcome logged");
      setCallModalOpen(false);
      setCallNotes('');
      refetchActivities();
      refetchTasks();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // OIE: single Lead Score using the one declared above

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden relative">
      
      {/* HEADER BAR SECTION (Priority 2 Stages Synchronized) */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col gap-4 flex-shrink-0 z-10 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold tracking-wider uppercase">
              <span className="hover:text-slate-200 cursor-pointer" onClick={() => navigate('/dashboard')}>Opportunities</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-300">{opp.title}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">{companyName}</h1>
              {/* glowing health status indicator (Priority 10) */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help">
                      <span className={`h-2.5 w-2.5 rounded-full block animate-ping ${
                        healthStatus === 'Healthy' ? 'bg-emerald-500' :
                        healthStatus === 'Stalled' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      <Badge className={`text-[10px] font-bold border-0 uppercase ${
                        healthStatus === 'Healthy' ? 'bg-emerald-500/20 text-emerald-400' :
                        healthStatus === 'Stalled' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {healthStatus}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Dynamic health: computed based on timing of activity logs & overdue tasks.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-primary" /> {industry}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Map className="w-3.5 h-3.5 text-primary" /> {location}</span>
              {website && (
                <>
                  <span>•</span>
                  <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    <Globe className="w-3.5 h-3.5" /> {website.replace(/https?:\/\/(www\.)?/, '')} <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Lead Score — OIE single score */}
          <div className="flex items-center gap-2">
            <div 
              className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-center min-w-[120px] cursor-pointer hover:bg-slate-750 transition-colors shadow-sm group"
              onClick={() => setScoreModalOpen(true)}
            >
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-center gap-1 group-hover:text-slate-300">
                Lead Score <ExternalLink className="w-2.5 h-2.5" />
              </div>
              {leadScore !== null ? (
                <div className={`text-lg font-bold mt-0.5 ${
                  leadScore >= 75 ? 'text-emerald-400' :
                  leadScore >= 50 ? 'text-amber-400' : 'text-slate-400'
                }`}>{leadScore.toFixed(0)}</div>
              ) : (
                <div className="text-slate-600 text-sm mt-0.5 italic">Pending</div>
              )}
            </div>
          </div>
        </div>

        {/* PIPELINE PROGRESS BAR - Visual stage updates (non-clickable) */}
        <div className="border-t border-slate-800/80 pt-3">
          <div className="flex items-center justify-between gap-1">
            {STAGES.map((stage, idx) => {
              const isCurrent = stage.toLowerCase() === currentStage.toLowerCase();
              const isPast = STAGES.findIndex(s => s.toLowerCase() === currentStage.toLowerCase()) > idx;
              return (
                <div
                  key={stage}
                  className="flex-1 text-center space-y-1.5"
                >
                  <div className={`h-1.5 rounded-full transition-all ${
                    isCurrent ? 'bg-primary animate-pulse' :
                    isPast ? 'bg-primary/80' : 'bg-slate-800'
                  }`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider block transition-colors ${
                    isCurrent ? 'text-primary' : 'text-slate-500'
                  }`}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {opp.stage?.toLowerCase() === 'qualification' ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
          <Card className="max-w-2xl w-full bg-slate-900/60 border-slate-800/80 p-8 shadow-xl">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <BrainCircuit className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl text-white">AI Intelligence Verification</CardTitle>
              <CardDescription className="text-slate-400 mt-2">
                Evaluating real-time industrial signals, structural fit, and procurement profiles for {companyName}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3.5 bg-slate-950/40 p-6 rounded-lg border border-slate-800/50">
                {qualChecklist.map((item, idx) => {
                  const isChecked = qualStep > idx;
                  const isCurrent = qualStep === idx;
                  return (
                    <div key={item} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        {isChecked ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : isCurrent ? (
                          <div className="w-5 h-5 border border-primary/50 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-800 flex items-center justify-center text-slate-700">
                            <span className="text-[10px]">{idx + 1}</span>
                          </div>
                        )}
                        <span className={`transition-colors duration-250 ${isChecked ? 'text-slate-350 font-medium' : isCurrent ? 'text-primary font-bold' : 'text-slate-600'}`}>
                          {item}
                        </span>
                      </div>
                      <div>
                        {isChecked ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-semibold">Verified</Badge>
                        ) : isCurrent ? (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold animate-pulse">Running</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-900 text-slate-700 border-slate-800 text-[10px] font-medium">Pending</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Intelligence Pipeline Processing</span>
                  <span>{Math.round((qualStep / qualChecklist.length) * 100)}%</span>
                </div>
                <Progress value={(qualStep / qualChecklist.length) * 100} className="h-2 bg-slate-850" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* DENSE 3-COLUMN CONTENT DOSSIER */
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-6 p-6 overflow-y-auto bg-slate-950">
        
        {/* ================= LEFT COLUMN: COMPANY PROFILE & CONTACT CENTER ================= */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Company Profile Details */}
          <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-4 shadow-md">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" /> Company Profile
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 uppercase font-semibold">HQ Phone</span>
                <p className="font-medium text-slate-200 mt-0.5">{phone || 'Unmapped'}</p>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold">HQ Email</span>
                <p className="font-medium text-slate-200 mt-0.5 truncate" title={email}>{email || 'Unmapped'}</p>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold">Lead Source</span>
                <p className="font-medium text-slate-200 mt-0.5 capitalize">{opp.source || 'Scraped Lead'}</p>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold">Imported On</span>
                <p className="font-medium text-slate-200 mt-0.5">{new Date(opp.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="xs" variant="outline" className="text-[10px] w-full" onClick={() => setMeetingModalOpen(true)}>
                <CalendarDays className="w-3 h-3 mr-1" /> Schedule Meeting
              </Button>
            </div>
          </div>

          {/* Contact Center with Direct Outreach Actions (Priority 1) */}
          <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-4 shadow-md">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Contact Center
            </h3>
            {(() => {
              const displayedContacts = (() => {
                if (contacts && contacts.length > 0) {
                  return contacts.map((c: any) => ({
                    id: c.id,
                    full_name: c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Contact Target',
                    job_title: c.job_title || c.designation || 'Lead Target',
                    phone: c.phone || 'Unavailable',
                    email: c.email || 'Unavailable',
                    website: opp?.account?.website || opp?.lead?.external_website || opp?.lead?.website || 'Unavailable',
                    linkedin_url: c.linkedin_url || opp?.lead?.linkedin_url || 'Unavailable',
                    is_decision_maker: c.is_decision_maker || false
                  }));
                }

                if (opp?.lead) {
                  return [{
                    id: 'lead-fallback',
                    full_name: opp.lead.contact_name || 'Primary Contact',
                    job_title: opp.lead.designation || 'Lead Target',
                    phone: opp.lead.phone || opp.lead.external_phone || 'Unavailable',
                    email: opp.lead.email || opp.lead.external_email || 'Unavailable',
                    website: opp.lead.external_website || opp.lead.website || 'Unavailable',
                    linkedin_url: opp.lead.linkedin_url || 'Unavailable',
                    is_decision_maker: true
                  }];
                }

                return [];
              })();

              if (displayedContacts.length === 0) {
                return (
                  <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded">
                    No contacts mapped. Use enrichment to pull key contact details.
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {displayedContacts.map((c: any) => (
                    <div key={c.id} className="p-3 bg-slate-950 border border-slate-850 rounded-md space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-white">{c.full_name}</h4>
                          <span className="text-[10px] text-slate-400 font-semibold">{c.job_title}</span>
                        </div>
                        {c.is_decision_maker && (
                          <Badge variant="outline" className="text-[9px] font-semibold border-primary/20 bg-primary/10 text-primary uppercase shrink-0">
                            DM
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>Phone: {c.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span>Email: {c.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-500" />
                          <span>Website: {c.website && c.website !== 'Unavailable' ? (
                            <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{c.website}</a>
                          ) : 'Unavailable'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Linkedin className="w-3.5 h-3.5 text-slate-500" />
                          <span>LinkedIn: {c.linkedin_url && c.linkedin_url !== 'Unavailable' ? (
                            <a href={c.linkedin_url.startsWith('http') ? c.linkedin_url : `https://${c.linkedin_url}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Profile</a>
                          ) : 'Unavailable'}</span>
                        </div>
                      </div>

                      {/* Direct Contact Actions (Priority 1: EMAIL, WHATSAPP, CALL, LINKEDIN, SMS) */}
                      <div className="flex gap-1.5 pt-2 border-t border-slate-900">
                        {c.email && c.email !== 'Unavailable' && (
                          <Button 
                            size="xs" 
                            variant="ghost" 
                            className="p-1 h-7 w-7 rounded bg-slate-900 border border-slate-805 text-slate-300 hover:text-white"
                            title="Send Email"
                            onClick={() => setActiveOutreachModal({
                              type: 'email',
                              recipient: c.email,
                              subject: generatedOutreach.email.subject,
                              body: generatedOutreach.email.body
                            })}
                          >
                            <Mail className="w-3 h-3 text-emerald-400" />
                          </Button>
                        )}
                        {c.phone && c.phone !== 'Unavailable' && (
                          <>
                            <Button 
                              size="xs" 
                              variant="ghost" 
                              className="p-1 h-7 w-7 rounded bg-slate-900 border border-slate-805 text-slate-300 hover:text-white"
                              title="Start Call"
                              onClick={() => {
                                window.open(`tel:${c.phone}`);
                                setCallModalOpen(true);
                              }}
                            >
                              <Phone className="w-3 h-3 text-blue-400" />
                            </Button>
                            <Button 
                              size="xs" 
                              variant="ghost" 
                              className="p-1 h-7 w-7 rounded bg-slate-900 border border-slate-805 text-slate-300 hover:text-white"
                              title="WhatsApp Chat"
                              onClick={() => setActiveOutreachModal({
                                type: 'whatsapp',
                                recipient: c.phone,
                                body: generatedOutreach.whatsapp
                              })}
                            >
                              <MessageCircle className="w-3 h-3 text-green-400" />
                            </Button>
                            <Button 
                              size="xs" 
                              variant="ghost" 
                              className="p-1 h-7 w-7 rounded bg-slate-900 border border-slate-805 text-slate-300 hover:text-white"
                              title="Send SMS"
                              onClick={() => setActiveOutreachModal({
                                type: 'sms',
                                recipient: c.phone,
                                body: generatedOutreach.sms
                              })}
                            >
                              <Smartphone className="w-3 h-3 text-pink-400" />
                            </Button>
                            <Button 
                              size="xs" 
                              variant="ghost" 
                              className="p-1 h-7 w-7 rounded bg-slate-900 border border-slate-805 text-slate-300 hover:text-white"
                              title="Log Call"
                              onClick={() => {
                                setCallModalOpen(true);
                              }}
                            >
                              <Phone className="w-3 h-3 text-rose-400" />
                            </Button>
                          </>
                        )}
                        <Button 
                          size="xs" 
                          variant="ghost" 
                          className="p-1 h-7 w-7 rounded bg-slate-900 border border-slate-805 text-slate-300 hover:text-white ml-auto"
                          title="Set Reminder"
                          onClick={() => setReminderModalOpen(true)}
                        >
                          <CalendarCheck className="w-3 h-3 text-primary" />
                        </Button>
                      </div>

                      {c.id === 'lead-fallback' && (
                        <div className="pt-3 border-t border-slate-800/50 space-y-2">
                          <p className="text-[10px] text-slate-400 italic">This is an unmapped contact. Save it to build your directory.</p>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="Full Name" 
                              value={saveContactName} 
                              onChange={e => setSaveContactName(e.target.value)}
                              className="h-7 text-xs bg-slate-900 border-slate-800 text-white"
                            />
                            <Input 
                              placeholder="Job Title" 
                              value={saveContactTitle} 
                              onChange={e => setSaveContactTitle(e.target.value)}
                              className="h-7 text-xs bg-slate-900 border-slate-800 text-white"
                            />
                            <Button 
                              size="xs" 
                              onClick={handleSaveContact}
                              disabled={!saveContactName}
                              className="h-7 text-[10px]"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Checklist Engine (Priority 5) */}
          <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" /> {currentStage} Checklist
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                {currentStageChecklist.filter((i: any) => i.completed).length} / {currentStageChecklist.length} Done
              </span>
            </div>
            
            <div className="space-y-2.5">
              {currentStageChecklist.map((item: any) => (
                <div key={item.id} className="flex items-start gap-2.5 text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={(e) => handleToggleChecklist(item.id, e.target.checked)}
                    className="h-3.5 w-3.5 mt-0.5 rounded border-slate-800 text-primary bg-slate-950 focus:ring-primary/20 cursor-pointer"
                  />
                  <span className={item.completed ? 'line-through text-slate-500' : 'text-slate-350'}>{item.label}</span>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleAddChecklistItem} className="flex gap-1.5 pt-2 border-t border-slate-900">
              <input
                type="text"
                placeholder="Custom checklist step..."
                value={customChecklistItem}
                onChange={(e) => setCustomChecklistItem(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-white placeholder-slate-650 focus:outline-none"
              />
              <Button type="submit" size="xs" variant="outline" className="p-1.5 bg-slate-900 border-slate-800 text-slate-300">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>

          {/* ── Outreach Actions Panel ── */}
          <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-4 shadow-md">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Outreach Actions
            </h3>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Every action is logged to the Activity Timeline and automatically advances the pipeline stage.
            </p>

            {/* Communication actions */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Communication</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Call', icon: '📞', type: 'call', stage: null },
                  { label: 'WhatsApp', icon: '💬', type: 'whatsapp', stage: null },
                  { label: 'Email', icon: '✉️', type: 'email', stage: null },
                  { label: 'LinkedIn', icon: '🔗', type: 'linkedin', stage: null },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={async () => {
                      await supabase.from('activities').insert({
                        workspace_id: opp.workspace_id,
                        opportunity_id: id,
                        account_id: opp.account_id,
                        activity_type: action.type,
                        title: `${action.label} Outreach`,
                        description: `${action.label} outreach initiated.`,
                        created_by: user?.id,
                      });
                      toast.success(`${action.label} logged.`);
                      refetchActivities();
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-xs text-slate-300 font-medium transition-colors"
                  >
                    <span>{action.icon}</span> {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Meeting actions */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Meeting</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Schedule Meeting', icon: '📅', nextStage: null },
                  { label: 'Meeting Completed', icon: '✅', nextStage: 'proposal' },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleStatusAction(action.label)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-xs text-slate-300 font-medium transition-colors"
                  >
                    <span>{action.icon}</span> {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Proposal actions */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Proposal</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Proposal Sent', icon: '📤', stage: 'negotiation' },
                  { label: 'Proposal Revised', icon: '📝', stage: 'negotiation' },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleStatusAction(action.label)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-xs text-slate-300 font-medium transition-colors"
                  >
                    <span>{action.icon}</span> {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status signals */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Status Signals</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Negotiation Started', icon: '🤝', color: 'text-indigo-400', type: 'negotiation' },
                  { label: 'Customer Interested', icon: '⭐', color: 'text-emerald-400', type: 'interested' },
                  { label: 'Customer Not Interested', icon: '⛔', color: 'text-rose-400', type: 'not_interested' },
                  { label: 'Waiting Response', icon: '⏳', color: 'text-amber-400', type: 'waiting' },
                  { label: 'No Response', icon: '🔕', color: 'text-slate-400', type: 'no_response' },
                  { label: 'Lost Contact', icon: '📵', color: 'text-rose-500', type: 'lost_contact' },
                ].map((sig) => (
                  <button
                    key={sig.label}
                    onClick={async () => {
                      await supabase.from('activities').insert({
                        workspace_id: opp.workspace_id,
                        opportunity_id: id,
                        account_id: opp.account_id,
                        activity_type: sig.type,
                        title: sig.label,
                        description: `Status signal: ${sig.label} recorded.`,
                        created_by: user?.id,
                      });
                      toast.success(`"${sig.label}" logged.`);
                      refetchActivities();
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-xs ${sig.color} font-medium transition-colors`}
                  >
                    <span>{sig.icon}</span> {sig.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Close actions */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Close</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: 'Won', icon: '🏆', color: 'bg-emerald-600 hover:bg-emerald-500 text-white' },
                  { label: 'Lost', icon: '❌', color: 'bg-rose-700 hover:bg-rose-600 text-white' },
                  { label: 'On Hold', icon: '⏸️', color: 'bg-slate-700 hover:bg-slate-600 text-white' },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={async () => {
                      if (action.label === 'On Hold') {
                        await supabase.from('opportunities').update({ status: 'on_hold' }).eq('id', id);
                        await supabase.from('activities').insert({
                          workspace_id: opp.workspace_id,
                          opportunity_id: id,
                          account_id: opp.account_id,
                          activity_type: 'system',
                          title: 'On Hold',
                          description: 'Opportunity placed on hold.',
                          created_by: user?.id,
                        });
                        toast.info('Opportunity placed on hold.');
                        refetchOpp();
                      } else {
                        handleStatusAction(action.label);
                      }
                    }}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded text-xs font-semibold transition-colors ${action.color}`}
                  >
                    <span>{action.icon}</span> {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── AI Follow-Up Planner ── */}
          {(() => {
            const expl = opp.explanation || {};
            const urgency: string = (expl.urgency_level || 'LOW').toString().toUpperCase();
            const recAction: string = expl.recommended_action || opp.recommended_action || 'Send Introduction';
            const recChannel: string = expl.recommended_contact_method || 'Email';
            const daysOut = urgency === 'HIGH' ? 2 : urgency === 'MEDIUM' ? 5 : 7;
            const recDate = new Date(Date.now() + daysOut * 86400000);
            const recDateStr = recDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const reason = expl.why_this_opportunity || expl.reasoning || 'Based on signal strength and urgency analysis.';
            const urgencyColor = urgency === 'HIGH' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
              : urgency === 'MEDIUM' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              : 'text-slate-400 bg-slate-500/10 border-slate-500/20';
            return (
              <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-4 shadow-md">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> AI Follow-Up Planner
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Urgency</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${urgencyColor}`}>
                      {urgency}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Recommended Action</span>
                    <span className="text-xs text-primary font-semibold">↳ {recAction}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Recommended Channel</span>
                    <span className="text-xs text-slate-200 font-medium">{recChannel}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Recommended Date</span>
                    <span className="text-xs text-emerald-400 font-semibold">{recDateStr}</span>
                    <span className="text-[10px] text-slate-500 ml-2">(in {daysOut} days)</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Reason</span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{reason}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await supabase.from('tasks').insert({
                        workspace_id: opp.workspace_id,
                        opportunity_id: id,
                        account_id: opp.account_id,
                        task_type: recChannel.toLowerCase() === 'call' ? 'call' : recChannel.toLowerCase().includes('linkedin') ? 'linkedin' : 'follow_up',
                        title: `${recChannel} Follow-up: ${recAction}`,
                        description: `AI-recommended follow-up. Reason: ${reason}`,
                        priority: urgency === 'HIGH' ? 'high' : urgency === 'MEDIUM' ? 'medium' : 'low',
                        status: 'pending',
                        due_date: recDate.toISOString(),
                        created_by: user?.id,
                        assigned_to: user?.id,
                      });
                      toast.success(`Follow-up task scheduled for ${recDateStr}!`);
                    }}
                    className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <CalendarDays className="w-3.5 h-3.5" /> Schedule This Follow-up
                  </button>
                </div>
              </div>
            );
          })()}

        </div>
        {/* ================= CENTER COLUMN: DOSSIER, OUTREACH, CHRONOLOGICAL FEED ================= */}
        <div className="xl:col-span-2 space-y-6">
          {currentStage.toLowerCase() === 'proposal' ? (
            /* PROPOSAL STAGE WORKSPACE PANEL */
            <div className="p-6 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-6 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Proposal Management Center
                </h3>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Stage: Proposal</Badge>
              </div>

              {/* Quotation Uploads */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-450" /> Quotation Uploads
                </h4>
                <div className="p-4 border border-dashed border-slate-800 rounded bg-slate-950/40 text-center space-y-2">
                  <div className="text-xs text-slate-400">Drag and drop files here, or click to upload quotation sheet</div>
                  <Button size="xs" variant="outline" onClick={handleUploadQuotation} className="bg-slate-900 border-slate-800 text-[10px]">
                    Choose PDF File
                  </Button>
                </div>
                <div className="space-y-2">
                  {quotations.map((q, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-950 p-2.5 rounded border border-slate-850 text-xs">
                      <span className="font-medium text-slate-200">{q.name} ({q.size})</span>
                      <span className="text-slate-500">{q.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proposal Versions */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-400" /> Proposal Versions
                  </h4>
                  <Button size="xs" variant="outline" onClick={handleAddVersion} className="bg-slate-900 border-slate-800 text-[10px]">
                    + Add Version
                  </Button>
                </div>
                <div className="space-y-2">
                  {proposalVersions.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-2 bg-slate-950 p-2.5 rounded border border-slate-850 text-xs items-center">
                      <span className="font-semibold text-slate-200">{v.version}</span>
                      <span className="text-slate-500 text-center">{v.date}</span>
                      <span className="text-slate-400 text-center">{v.author}</span>
                      <Badge className="ml-auto text-[9px]" variant={v.status === 'Approved' ? 'default' : 'secondary'}>{v.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Feedback */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-amber-400" /> Customer Feedback Log
                  </h4>
                  <Button size="xs" variant="outline" onClick={handleAddCustomerFeedback} className="bg-slate-900 border-slate-800 text-[10px]">
                    + Add Feedback
                  </Button>
                </div>
                <div className="space-y-2">
                  {customerFeedback.map((f, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded border border-slate-850 text-xs space-y-1">
                      <p className="text-slate-300 leading-relaxed italic">"{f.text}"</p>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Logged by {f.author}</span>
                        <span>{f.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proposal Timeline */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarRange className="w-4 h-4 text-teal-400" /> Proposal Timeline (Milestones)
                </h4>
                <div className="space-y-2">
                  {proposalTimeline.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2.5 rounded border border-slate-850 text-xs">
                      <input 
                        type="checkbox" 
                        checked={t.completed} 
                        onChange={() => handleToggleProposalTimeline(idx)}
                        className="rounded border-slate-800 bg-background text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                      <span className={t.completed ? 'line-through text-slate-500' : 'text-slate-200'}>{t.task}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : currentStage.toLowerCase() === 'negotiation' ? (
            /* NEGOTIATION WORKSPACE PANEL */
            <div className="p-6 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-6 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider flex items-center gap-2">
                  <Percent className="w-5 h-5 text-primary" /> Negotiation Control Center
                </h3>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Stage: Negotiation</Badge>
              </div>

              {/* Price & Rev Revisions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-450" /> Price & Revenue Revisions
                </h4>
                <div className="bg-slate-950 p-4 rounded border border-slate-850 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Bid Price Value:</span>
                    <span className="text-sm font-bold text-emerald-400">${bidPrice.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min={Math.round((opp?.estimated_value || 10000) * 0.5)}
                    max={Math.round((opp?.estimated_value || 10000) * 1.5)}
                    step={500}
                    value={bidPrice}
                    onChange={(e) => setBidPrice(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                    <span>Min: ${Math.round((opp?.estimated_value || 10000) * 0.5).toLocaleString()}</span>
                    <span>Max: ${Math.round((opp?.estimated_value || 10000) * 1.5).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Volume Discount %</span>
                      <input 
                        type="number" 
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                        className="bg-slate-900 border border-slate-850 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none w-full"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Est Margin Value</span>
                      <p className="text-xs font-semibold text-slate-300 mt-2">${Math.round(bidPrice * (1 - discountPercent / 100) * 0.4).toLocaleString()}</p>
                    </div>
                  </div>
                  <Button size="xs" onClick={handleSavePriceRevision} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    Save Adjusted Bid Price
                  </Button>
                </div>
              </div>

              {/* Expected Close Date Picker */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" /> Expected Close Date
                </h4>
                <div className="bg-slate-950 p-4 rounded border border-slate-850 flex items-center justify-between gap-4">
                  <input 
                    type="date" 
                    value={closeDate}
                    onChange={(e) => setCloseDate(e.target.value)}
                    className="bg-slate-900 border border-slate-850 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none flex-1 max-w-[200px]"
                  />
                  <Button size="xs" onClick={handleSaveCloseDate} variant="outline" className="bg-slate-900 border-slate-800 text-[10px]">
                    Update Target Date
                  </Button>
                </div>
              </div>

              {/* Contract Discussions Log */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-blue-400" /> Contract Discussions Log
                </h4>
                <div className="space-y-2">
                  <div className="bg-slate-950 p-3 rounded border border-slate-850 text-xs">
                    <p className="font-semibold text-slate-200">Clause 4.2 - Indemnity Clause Revision</p>
                    <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">Negotiating cap of liability at 1x total annual contract value. Standard vendor clause.</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-850 text-xs">
                    <p className="font-semibold text-slate-200">Clause 8.1 - Payment Terms Adjustment</p>
                    <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">Client requested Net-45 payments. Standard corporate policy is Net-30. Adjusted margin accordingly.</p>
                  </div>
                </div>
              </div>

              {/* AI Negotiation Reminders */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> AI Negotiation Reminders
                </h4>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded space-y-2.5">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-250 leading-relaxed">
                      <strong>Competitor activity detected:</strong> Vendor B offered a 5% volume rebate. Suggest offering equivalent value in Clause 8.2 or service level SLA upgrades rather than lowering price directly.
                    </div>
                  </div>
                </div>
              </div>

              {/* Negotiation Notes */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-400" /> Negotiation Notes
                </h4>
                <textarea
                  value={negotiationNotes}
                  onChange={(e) => {
                    setNegotiationNotes(e.target.value);
                    localStorage.setItem(`opp_${id}_neg_notes`, e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-3 text-xs text-slate-200 focus:outline-none h-24"
                  placeholder="Record discussions, revised targets, and next steps..."
                />
              </div>
            </div>
          ) : (currentStage.toLowerCase() === 'won' || currentStage.toLowerCase() === 'lost') ? (
            /* WON / LOST ARCHIVE WORKSPACE PANEL */
            <div className="p-6 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-6 shadow-md text-center">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-slate-950 border border-slate-800">
                {currentStage.toLowerCase() === 'won' ? (
                  <CheckCircle className="w-8 h-8 text-emerald-450" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-500" />
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white capitalize">Opportunity {currentStage}</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {currentStage.toLowerCase() === 'won' 
                    ? "This opportunity is closed as Won. Public lead status set to Awarded." 
                    : "This opportunity is marked as Lost. Review the loss reasons log to optimize future bids."}
                </p>
              </div>
              <div className="bg-slate-950 p-4 rounded border border-slate-850 text-left max-w-md mx-auto space-y-3 text-xs">
                {opp.lost_reason && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Loss Reason</span>
                    <span className="font-semibold text-slate-250 mt-1 block">{opp.lost_reason}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Value Realized</span>
                  <span className="font-semibold text-emerald-450 mt-1 block">${(opp.estimated_value || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Close Date</span>
                  <span className="font-semibold text-slate-200 mt-1 block">{new Date(opp.expected_close_date || opp.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ) : (
            /* DEFAULT OUTREACH/DASHBOARD WORKSPACE VIEW */
            <>
              {/* Dossier Intelligence Summary */}
              <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-4 shadow-md">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Intelligence Dossier Summary
                </h3>
                {/* AI Automation Planner */}
                <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-4 shadow-md">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-primary" /> AI Automation Planner
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 uppercase font-semibold">Current Stage</span>
                      <Badge variant="outline" className="mt-1 bg-primary/10 text-primary border-primary/20 capitalize font-bold">{currentStage}</Badge>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase font-semibold">Suggested Waiting</span>
                      <p className="font-semibold text-slate-200 mt-1">{opp.suggested_waiting_period || 9} Days</p>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase font-semibold">Probability of Reply</span>
                      <p className="font-bold text-emerald-400 mt-1">{opp.probability_of_reply || 68}%</p>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase font-semibold">Best Time to Call</span>
                      <p className="font-semibold text-slate-200 mt-1">{opp.best_time_to_call || "10:30 AM"}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase font-semibold">Best Channel</span>
                      <p className="font-semibold text-primary mt-1 capitalize">{opp.best_channel || "Email"}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase font-semibold">AI Recommended Date</span>
                      <p className="font-semibold text-slate-200 mt-1">{opp.next_contact_date ? new Date(opp.next_contact_date).toLocaleDateString() : "Immediate Action"}</p>
                    </div>
                  </div>
                </div>

                {/* AI Follow-up Planner */}
                <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-4 shadow-md">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> AI Follow-up Planner
                  </h3>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded border border-slate-850">
                      <span className="text-slate-400">Suggested Action</span>
                      <span className="font-semibold text-slate-200">
                        {currentStage.toLowerCase() === 'discovery' ? `Initial Outreach to ${primaryContact?.full_name || 'Contact'}` : 'Send Follow-up Email'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-950/40 p-2.5 rounded border border-slate-850">
                        <span className="text-slate-500 uppercase font-semibold block text-[10px]">Suggested Delay</span>
                        <span className="font-bold text-slate-200 mt-0.5 block">{currentStage.toLowerCase() === 'discovery' ? 0 : (opp?.suggested_delay || 5)} days</span>
                      </div>
                      <div className="bg-slate-950/40 p-2.5 rounded border border-slate-850">
                        <span className="text-slate-500 uppercase font-semibold block text-[10px]">Response Probability</span>
                        <span className="font-bold text-emerald-400 mt-0.5 block">{normalizedScoreData?.cont_score || normalizedScoreData?.contactability_score || ((opp?.probability_of_reply || 68) - 10)}%</span>
                      </div>
                    </div>
                    <div className="bg-slate-950/40 p-3 rounded border border-slate-850">
                      <span className="text-slate-500 uppercase font-semibold block text-[10px] mb-1">Suggested Message Blueprint</span>
                      <p className="text-[11px] text-slate-300 leading-relaxed italic">
                        "{opp.suggested_message || `Following up regarding our discussion on vendor qualification compressions. Do you have a quick minute for alignment?`}"
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {opp.explanation?.why_this_opportunity || 'This opportunity is prioritized due to strong reviews variables, corroborating verified signals, and high estimated conversion probability.'}
                </p>
                
                {/* Follow-up Intelligence widget */}
                {followUpIntelligence && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded flex items-center justify-between gap-4">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-200 leading-relaxed">{followUpIntelligence.message}</p>
                    </div>
                    {followUpIntelligence.type === 'whatsapp_nudge' && (
                      <Button 
                        size="xs" 
                        className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 text-[10px]"
                        onClick={() => setActiveOutreachModal({
                          type: 'whatsapp',
                          recipient: phone || contacts?.[0]?.phone || '',
                          body: generatedOutreach.whatsapp
                        })}
                      >
                        Send WhatsApp
                      </Button>
                    )}
                    {followUpIntelligence.type === 'followup_email' && (
                      <Button 
                        size="xs" 
                        className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 text-[10px]"
                        onClick={() => setActiveOutreachModal({
                          type: 'email',
                          recipient: email || contacts?.[0]?.email || '',
                          subject: generatedOutreach.email.subject,
                          body: generatedOutreach.followUp
                        })}
                      >
                        Send Follow-up Email
                      </Button>
                    )}
                    {followUpIntelligence.type === 'create_proposal' && (
                      <Button 
                        size="xs" 
                        className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 text-[10px]"
                        onClick={() => {
                          setNewTitle('Draft and send proposal outline');
                          setNewType('other');
                          setNewPriority('high');
                          toast.info('Prepared task form in the right panel. Click Queue Task.');
                        }}
                      >
                        Prepare Task
                      </Button>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Signal Count</span>
                    <div className="text-base font-bold text-slate-200 mt-1">
                      {opp.opportunity_intelligence?.[0]?.opportunity_signals?.length || 0} Signals
                    </div>
                  </div>
                  <div 
                    className="p-3 bg-slate-950 border border-slate-850 rounded text-center cursor-pointer hover:bg-slate-900"
                    onClick={() => setScoreModalOpen(true)}
                  >
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Lead Score</span>
                    <div className="text-base font-bold text-amber-500 mt-1">
                      {leadScore !== null ? `${leadScore.toFixed(0)}` : 'Pending'}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Outreach Center */}
              <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-4 shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-2 gap-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Radar className="w-4 h-4 text-primary" /> AI Outreach Composer
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {['email', 'linkedin', 'whatsapp', 'call', 'followup', 'objections'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setOutreachTab(tab as any)}
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-colors ${
                          outreachTab === tab ? 'bg-primary text-primary-foreground' : 'text-slate-400 hover:text-slate-200 bg-slate-950'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded border border-slate-850 text-xs font-mono space-y-3 leading-relaxed relative min-h-[160px]">
                  {outreachTab === 'email' && (
                    <>
                      <div className="text-slate-400 border-b border-slate-900 pb-2">
                        <span className="font-bold text-slate-500 uppercase">Subject:</span> {generatedOutreach.email.subject}
                      </div>
                      <div className="whitespace-pre-line text-slate-200 pb-8">{generatedOutreach.email.body}</div>
                      
                      <div className="absolute right-4 bottom-4 flex gap-1.5">
                        <Button 
                          size="xs" 
                          variant="outline" 
                          className="text-[10px] bg-slate-900 border-slate-800"
                          onClick={() => copyToClipboard(`${generatedOutreach.email.subject}\n\n${generatedOutreach.email.body}`, 'Email')}
                        >
                          <Copy className="w-3 h-3 mr-1" /> Copy
                        </Button>
                        <Button 
                          size="xs" 
                          variant="outline" 
                          className="text-[10px] bg-slate-900 border-slate-800"
                          onClick={() => setActiveOutreachModal({
                            type: 'email',
                            recipient: email || contacts?.[0]?.email || '',
                            subject: generatedOutreach.email.subject,
                            body: generatedOutreach.email.body
                          })}
                        >
                          <Share2 className="w-3 h-3 mr-1" /> Edit & Send
                        </Button>
                      </div>
                    </>
                  )}

                  {outreachTab === 'linkedin' && (
                    <>
                      <div className="whitespace-pre-line text-slate-200 pb-8">{generatedOutreach.linkedin}</div>
                      <div className="absolute right-4 bottom-4 flex gap-1.5">
                        <Button 
                          size="xs" 
                          variant="outline" 
                          className="text-[10px] bg-slate-900 border-slate-800"
                          onClick={() => copyToClipboard(generatedOutreach.linkedin, 'LinkedIn')}
                        >
                          <Copy className="w-3 h-3 mr-1" /> Copy
                        </Button>
                        <Button 
                          size="xs" 
                          variant="outline" 
                          className="text-[10px] bg-slate-900 border-slate-800"
                          onClick={() => setActiveOutreachModal({
                            type: 'linkedin',
                            recipient: contacts?.[0]?.linkedin_url || opp.account?.linkedin_url || '',
                            body: generatedOutreach.linkedin
                          })}
                        >
                          <Share2 className="w-3 h-3 mr-1" /> Edit & Send
                        </Button>
                      </div>
                    </>
                  )}

                  {outreachTab === 'whatsapp' && (
                    <>
                      <div className="whitespace-pre-line text-slate-200 pb-8">{generatedOutreach.whatsapp}</div>
                      <div className="absolute right-4 bottom-4 flex gap-1.5">
                        <Button 
                          size="xs" 
                          variant="outline" 
                          className="text-[10px] bg-slate-900 border-slate-800"
                          onClick={() => copyToClipboard(generatedOutreach.whatsapp, 'WhatsApp')}
                        >
                          <Copy className="w-3 h-3 mr-1" /> Copy
                        </Button>
                        <Button 
                          size="xs" 
                          variant="outline" 
                          className="text-[10px] bg-slate-900 border-slate-800"
                          onClick={() => setActiveOutreachModal({
                            type: 'whatsapp',
                            recipient: phone || contacts?.[0]?.phone || '',
                            body: generatedOutreach.whatsapp
                          })}
                        >
                          <Share2 className="w-3 h-3 mr-1" /> Edit & Send
                        </Button>
                      </div>
                    </>
                  )}

                  {outreachTab === 'call' && (
                    <>
                      <div className="text-amber-500 font-bold uppercase text-[10px] mb-1">Cold Phone Script Pitch:</div>
                      <div className="whitespace-pre-line text-slate-200 italic pb-8">"{generatedOutreach.callScript}"</div>
                      <div className="absolute right-4 bottom-4 flex gap-1.5">
                        <Button 
                          size="xs" 
                          variant="outline" 
                          className="text-[10px] bg-slate-900 border-slate-800"
                          onClick={() => copyToClipboard(generatedOutreach.callScript, 'Call Script')}
                        >
                          <Copy className="w-3 h-3 mr-1" /> Copy
                        </Button>
                        <Button 
                          size="xs" 
                          className="bg-primary hover:bg-primary/95 text-white text-[10px] font-bold" 
                          onClick={() => {
                            window.open(`tel:${phone || contacts?.[0]?.phone || ''}`);
                            setCallModalOpen(true);
                          }}
                        >
                          <Phone className="w-3 h-3 mr-1" /> Start Call
                        </Button>
                      </div>
                    </>
                  )}

                  {outreachTab === 'followup' && (
                    <>
                      <div className="whitespace-pre-line text-slate-200 pb-8">{generatedOutreach.followUp}</div>
                      <div className="absolute right-4 bottom-4 flex gap-1.5">
                        <Button 
                          size="xs" 
                          variant="outline" 
                          className="text-[10px] bg-slate-900 border-slate-800"
                          onClick={() => copyToClipboard(generatedOutreach.followUp, 'Follow-up')}
                        >
                          <Copy className="w-3 h-3 mr-1" /> Copy
                        </Button>
                        <Button 
                          size="xs" 
                          variant="outline" 
                          className="text-[10px] bg-slate-900 border-slate-800"
                          onClick={() => setActiveOutreachModal({
                            type: 'email',
                            recipient: email || contacts?.[0]?.email || '',
                            subject: generatedOutreach.email.subject,
                            body: generatedOutreach.followUp
                          })}
                        >
                          <Share2 className="w-3 h-3 mr-1" /> Edit & Send
                        </Button>
                      </div>
                    </>
                  )}

                  {outreachTab === 'objections' && (
                    <div className="space-y-4">
                      {generatedOutreach.objections.map((o, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="text-rose-400 font-bold uppercase text-[10px]">Objection: "{o.objection}"</div>
                          <div className="text-emerald-450 italic">Response: {o.response}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Outreach Metadata Box */}
                {outreachTab !== 'objections' && (generatedOutreach as any).metadata?.[outreachTab] && (
                  <div className="mt-4 p-3 bg-slate-950/45 border border-slate-850 rounded text-xs space-y-2.5">
                    <div className="flex items-center gap-1.5 text-primary font-bold uppercase text-[9px] tracking-wider">
                      <Info className="w-3.5 h-3.5" /> Outreach Intelligence Details
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Why Generated</span>
                        <p className="text-slate-350 text-[11px] mt-0.5 leading-relaxed">
                          {(generatedOutreach as any).metadata[outreachTab].why}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Trigger Signal</span>
                        <p className="text-amber-400 text-[11px] mt-0.5 font-semibold flex items-center gap-1">
                          <Zap className="w-3 h-3 shrink-0 text-amber-500" />
                          {(generatedOutreach as any).metadata[outreachTab].trigger}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Expected Outcome</span>
                        <p className="text-slate-350 text-[11px] mt-0.5 leading-relaxed">
                          {(generatedOutreach as any).metadata[outreachTab].outcome}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Activity Statistics Dashboard Widget */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800/80 text-center shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Emails</span>
                  <div className="text-lg font-bold text-white mt-0.5">{activityStats.emails}</div>
                </div>
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800/80 text-center shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Calls</span>
                  <div className="text-lg font-bold text-white mt-0.5">{activityStats.calls}</div>
                </div>
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800/80 text-center shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">WhatsApp</span>
                  <div className="text-lg font-bold text-white mt-0.5">{activityStats.whatsapp}</div>
                </div>
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800/80 text-center shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">SMS</span>
                  <div className="text-lg font-bold text-white mt-0.5">{activityStats.sms}</div>
                </div>
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800/80 text-center shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Meetings</span>
                  <div className="text-lg font-bold text-white mt-0.5">{meetings?.length || 0}</div>
                </div>
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800/80 text-center shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Notes</span>
                  <div className="text-lg font-bold text-white mt-0.5">{activityStats.notes}</div>
                </div>
              </div>

              {/* Unified Chronological Timeline Feed */}
              <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-4 shadow-md">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Unified Timeline Feed
                </h3>
                {timelineItems.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded">
                    No events logged in the timeline feed.
                  </div>
                ) : (
                  <div className="relative border-l border-slate-800 pl-4 space-y-4 ml-2 max-h-[360px] overflow-y-auto pr-1">
                    {timelineItems.map((item, idx) => (
                      <div key={idx} className="relative group">
                        <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-slate-950 border-2 border-slate-800 group-hover:border-primary transition-colors flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-primary transition-all" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs font-bold text-white">{item.title}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-slate-500">{item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {item.badge && (
                                <Badge className="text-[8px] px-1 py-0 uppercase tracking-wide font-bold">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ================= RIGHT COLUMN: TASKS, ACTION EXECUTION & CALENDAR MILESTONES ================= */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Dynamic Action Engine */}
          <div className="p-5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 space-y-4 shadow-md">
            <div>
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-indigo-400" /> Dynamic Action Engine
              </h3>
              <p className="text-xs text-indigo-200 leading-relaxed font-semibold">
                {dynamicActionText}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-indigo-950/40 pt-3">
              <Button 
                size="xs" 
                className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-[10px]"
                onClick={() => {
                  window.open(`tel:${primaryContact?.phone || phone || ''}`);
                  setCallModalOpen(true);
                }}
              >
                Call {primaryContact?.full_name?.split(' ')[0] || 'Contact'}
              </Button>
              <Button 
                size="xs" 
                variant="outline" 
                className="border-indigo-500/30 text-indigo-300 font-bold text-[10px]"
                onClick={() => {
                  setActiveOutreachModal({
                    type: 'email',
                    recipient: primaryContact?.email || email || '',
                    subject: 'JAS CONNECT - Following up',
                    body: `Hi ${primaryContact?.full_name?.split(' ')[0] || ''},\n\nLooking forward to aligning on project requirements.`
                  });
                }}
              >
                Email {primaryContact?.full_name?.split(' ')[0] || 'Contact'}
              </Button>
              <Button 
                size="xs" 
                variant="outline" 
                className="border-indigo-500/30 text-indigo-300 font-bold text-[10px]"
                onClick={() => {
                  setActiveOutreachModal({
                    type: 'whatsapp',
                    recipient: phone || contacts?.[0]?.phone || '',
                    body: 'Following up regarding vendor qualification.'
                  });
                }}
              >
                WhatsApp
              </Button>
            </div>
          </div>

          {/* Status Actions */}
          <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-4 shadow-md">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" /> Status Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Mark Contacted', 'Meeting Requested', 'Meeting Scheduled', 'Meeting Completed',
                'Proposal Sent', 'Proposal Revised', 'Negotiating', 'Waiting',
                'Won', 'Lost', 'On Hold', 'No Response'
              ].map(action => (
                <Button 
                  key={action}
                  variant="outline"
                  size="xs"
                  className="text-[10px] text-left justify-start border-slate-800 hover:bg-slate-800"
                  onClick={() => handleStatusAction(action)}
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Execution Queue
              </h3>
              <div className="flex items-center gap-1.5">
                {selectedTaskIds.length > 0 && (
                  <>
                    <Button 
                      size="xs" 
                      variant="outline" 
                      className="text-[9px] h-5 py-0.5 px-2 bg-emerald-950 text-emerald-400 border-emerald-900 hover:bg-emerald-900"
                      onClick={handleBulkCompleteTasks}
                    >
                      Complete ({selectedTaskIds.length})
                    </Button>
                    <Button 
                      size="xs" 
                      variant="outline" 
                      className="text-[9px] h-5 py-0.5 px-2 bg-rose-950 text-rose-400 border-rose-900 hover:bg-rose-900"
                      onClick={handleBulkDeleteTasks}
                    >
                      Delete ({selectedTaskIds.length})
                    </Button>
                  </>
                )}
                {(!tasks || tasks.filter(t => t.status !== 'completed').length === 0) && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-[9px] h-5 py-0.5 px-2 bg-slate-950 hover:bg-slate-900 border-slate-850"
                    onClick={handleAutoGenerateTasks}
                    disabled={isGeneratingTasks}
                  >
                    {isGeneratingTasks ? 'Generating...' : 'Auto-Generate'}
                  </Button>
                )}
              </div>
            </div>

            {(() => {
              const activeTasks = tasks?.filter((t: any) => t.status !== 'completed') || [];
              if (activeTasks.length === 0) {
                return (
                  <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded">
                    No tasks queued. Click Auto-Generate or create a custom task.
                  </div>
                );
              }

              return (
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                  {activeTasks.map((task: any) => {
                    const isSelected = selectedTaskIds.includes(task.id);
                    return (
                      <div key={task.id} className="p-3 rounded border transition-colors bg-slate-950 border-slate-850 text-slate-200 hover:border-slate-700">
                        <div className="flex items-start gap-2.5 justify-between">
                          <div className="flex items-start gap-2.5">
                            {/* Selection Checkbox */}
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedTaskIds(prev => [...prev, task.id]);
                                } else {
                                  setSelectedTaskIds(prev => prev.filter(id => id !== task.id));
                                }
                              }}
                              className="mt-1 h-3.5 w-3.5 rounded border-slate-800 text-primary bg-slate-950 focus:ring-primary/20 cursor-pointer data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white"
                            />
                            {/* Complete Task Circle Checkbox */}
                            <button
                              onClick={() => handleCompleteTask(task.id)}
                              className="mt-0.5 w-4 h-4 rounded border border-slate-700 hover:border-emerald-500 flex items-center justify-center shrink-0"
                              title="Mark Completed"
                            >
                              <div className="w-2 h-2 rounded bg-transparent group-hover:bg-slate-700" />
                            </button>
                            <div>
                              <div className="text-xs font-semibold text-slate-200">{task.title}</div>
                              {task.description && <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{task.description}</p>}
                            </div>
                          </div>
                          <Badge className={`text-[8px] uppercase shrink-0 font-bold border-0 ${
                            task.priority === 'critical' ? 'bg-rose-600 text-white' :
                            task.priority === 'high' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="text-[9px] text-slate-500 mt-2 flex justify-between items-center border-t border-slate-900 pt-1.5">
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            <span className="capitalize">{task.task_type}</span>
                            <button 
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-slate-650 hover:text-rose-400 p-0.5 rounded transition-colors"
                              title="Delete Task"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Add Custom Task Form */}
          <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-4 shadow-md">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Create Custom Task
            </h3>
            <form onSubmit={handleCreateCustomTask} className="space-y-3">
              <input
                type="text"
                placeholder="Task title (e.g. Call callback)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-primary"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary"
                >
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <Button type="submit" size="sm" className="w-full text-xs font-semibold animate-transition" disabled={isCreatingTask}>
                {isCreatingTask ? 'Creating...' : 'Queue Task'}
              </Button>
            </form>
          </div>

          {/* Calendar & Milestones Widget (Priority 7) */}
          <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-4 shadow-md">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" /> Milestone Calendar
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-500 font-semibold">Lead Imported On</span>
                <span className="text-slate-300 font-medium">{new Date(opp.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-500 font-semibold">Stage Updated On</span>
                <span className="text-slate-300 font-medium">
                  {activities?.find(a => a.title === 'Stage Changed')?.activity_timestamp
                    ? new Date(activities.find(a => a.title === 'Stage Changed').activity_timestamp).toLocaleDateString()
                    : new Date(opp.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-500 font-semibold">Next Follow-Up Date</span>
                <span className="text-primary font-bold">
                  {tasks?.filter(t => t.status === 'pending')?.[0]?.due_date
                    ? new Date(tasks.filter(t => t.status === 'pending')[0].due_date).toLocaleDateString()
                    : 'Not Scheduled'}
                </span>
              </div>
              
              {meetings && meetings.length > 0 && (
                <div className="pt-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Upcoming Meetings</span>
                  <div className="space-y-1.5">
                    {meetings.map((m: any) => (
                      <div key={m.id} className="p-2 bg-slate-950 border border-slate-850 rounded text-[11px]">
                        <div className="flex justify-between font-semibold text-white">
                          <span>{m.meeting_type} Meet</span>
                          <span>{new Date(m.scheduled_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-400 mt-0.5 truncate">{m.agenda}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ================= OUTREACH EDIT & SEND OVERLAY MODAL (Priority 1) ================= */}
      {activeOutreachModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Edit & Send AI Outreach ({activeOutreachModal.type.toUpperCase()})
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-semibold">Recipient</label>
                <input
                  type="text"
                  value={activeOutreachModal.recipient}
                  onChange={(e) => setActiveOutreachModal({ ...activeOutreachModal, recipient: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-1.5 text-xs text-white"
                />
              </div>
              {activeOutreachModal.subject !== undefined && (
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-semibold">Subject</label>
                  <input
                    type="text"
                    value={activeOutreachModal.subject}
                    onChange={(e) => setActiveOutreachModal({ ...activeOutreachModal, subject: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-1.5 text-xs text-white"
                  />
                </div>
              )}
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-semibold">Outreach Copy Body</label>
                <textarea
                  rows={8}
                  value={activeOutreachModal.body}
                  onChange={(e) => setActiveOutreachModal({ ...activeOutreachModal, body: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-xs text-slate-200 font-mono leading-relaxed"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={() => setActiveOutreachModal(null)}>
                Cancel
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold" onClick={handleConfirmSendOutreach}>
                Launch & Log Outreach
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CALL LOG OUTCOME MODAL (Priority 1) ================= */}
      {callModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" /> Track & Log Outbound Call
            </h3>
            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-semibold">Call Outcome</label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-xs text-slate-350"
                >
                  <option value="Connected">Connected / Answered</option>
                  <option value="No Answer">No Answer / Voicemail</option>
                  <option value="Busy">Line Busy</option>
                  <option value="Gatekeeper Blocked">Gatekeeper Blocked</option>
                  <option value="Follow-up Scheduled">Callback Requested</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-semibold">Call Logs & Summary Notes</label>
                <textarea
                  rows={4}
                  placeholder="Summarize the conversation outcome..."
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-xs text-white placeholder-slate-700"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={() => setCallModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold" onClick={handleSaveCallLog}>
                Save Call Log
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SCHEDULE MEETING MODAL (Priority 8) ================= */}
      {meetingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" /> Schedule Direct Meeting
            </h3>
            <form onSubmit={handleScheduleMeeting} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-semibold">Meeting Agenda / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Discovery Call to clarify procurement"
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-xs text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-semibold">Meeting Date</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-semibold">Meeting Time</label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-semibold">Meeting Type</label>
                  <select
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-xs text-slate-350"
                  >
                    <option value="Zoom">Zoom Meet</option>
                    <option value="Google Meet">Google Meet</option>
                    <option value="Phone">Phone Call</option>
                    <option value="In-Person">In-Person</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-semibold">Attendee Email</label>
                  <input
                    type="email"
                    placeholder="guest@company.com"
                    value={meetingAttendeeEmail}
                    onChange={(e) => setMeetingAttendeeEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button type="button" size="sm" variant="ghost" onClick={() => setMeetingModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold">
                  Schedule Event
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lost Reason Dialog Modal */}
      {lostReasonOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in duration-200">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Loss Reason</h3>
              <p className="text-xs text-slate-400">Please select a reason for marking this opportunity as lost.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['Price', 'Competition', 'Cancelled', 'Budget', 'No Response', 'Timing', 'Other'].map(reason => (
                <Button 
                  key={reason}
                  variant="outline"
                  size="sm"
                  className="text-xs justify-start border-slate-850 hover:bg-slate-800"
                  onClick={() => handleConfirmLost(reason)}
                >
                  {reason}
                </Button>
              ))}
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button size="sm" variant="ghost" onClick={() => setLostReasonOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* OIE Score Breakdown Modal */}
      <Dialog open={scoreModalOpen} onOpenChange={setScoreModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-slate-200 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Radar className="w-5 h-5 text-primary" /> Opportunity Intelligence Engine
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Complete breakdown of the algorithmic lead score.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">Total Score</span>
              <span className={`text-3xl font-bold ${leadScore && leadScore >= 75 ? 'text-emerald-400' : leadScore && leadScore >= 50 ? 'text-amber-400' : 'text-slate-300'}`}>
                {leadScore?.toFixed(0) || 'N/A'}
              </span>
            </div>

            {normalizedScoreData ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Procurement Setup</span>
                    <span className="font-semibold text-blue-400">{Math.round((normalizedScoreData.proc_score || 0) * 100)}</span>
                  </div>
                  <Progress value={Math.round((normalizedScoreData.proc_score || 0) * 100)} className="h-1.5 bg-slate-800 [&>div]:bg-blue-500" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Contactability</span>
                    <span className="font-semibold text-emerald-400">{Math.round((normalizedScoreData.cont_score || 0) * 100)}</span>
                  </div>
                  <Progress value={Math.round((normalizedScoreData.cont_score || 0) * 100)} className="h-1.5 bg-slate-800 [&>div]:bg-emerald-500" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Confidence</span>
                    <span className="font-semibold text-amber-400">{Math.round((normalizedScoreData.conf_score || 0) * 100)}</span>
                  </div>
                  <Progress value={Math.round((normalizedScoreData.conf_score || 0) * 100)} className="h-1.5 bg-slate-800 [&>div]:bg-amber-500" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Commercial Fit</span>
                    <span className="font-semibold text-purple-400">{Math.round((normalizedScoreData.fit_score || 0) * 100)}</span>
                  </div>
                  <Progress value={Math.round((normalizedScoreData.fit_score || 0) * 100)} className="h-1.5 bg-slate-800 [&>div]:bg-purple-500" />
                </div>

                <div className="pt-4 border-t border-slate-800 grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-slate-800/50 p-2 rounded flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1">QUAL Gate</span>
                    <span className={`text-sm font-bold ${normalizedScoreData?.qual_passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {normalizedScoreData?.qual_passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1">Risk Status</span>
                    <span className={`text-sm font-bold ${(normalizedScoreData?.risk_score || 0) > 0.7 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {(normalizedScoreData?.risk_score || 0) > 0.7 ? 'HIGH' : 'LOW'}
                    </span>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1">OPP Strength</span>
                    <span className="text-sm font-bold text-sky-400">
                      {normalizedScoreData?.opp_bucket || 'N/A'}
                    </span>
                  </div>
                </div>
                
                {normalizedScoreData.evidence_used && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <span className="text-xs text-slate-400 block mb-2">Evidence Processed:</span>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                      {Array.isArray(normalizedScoreData.evidence_used) 
                        ? normalizedScoreData.evidence_used.map((ev: string, i: number) => <li key={i}>{ev.replace(/_/g, ' ')}</li>)
                        : <li>{normalizedScoreData.evidence_used}</li>}
                    </ul>
                  </div>
                )}
                {normalizedScoreData.missing_evidence && normalizedScoreData.missing_evidence.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <span className="text-xs text-slate-400 block mb-2">Missing Evidence:</span>
                    <ul className="text-xs text-amber-400/80 space-y-1 list-disc pl-4">
                      {normalizedScoreData.missing_evidence.map((ev: string, i: number) => <li key={i}>{ev}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-sm italic">
                Detailed score breakdown is not yet available for this opportunity.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Set Reminder Modal */}
      <Dialog open={reminderModalOpen} onOpenChange={setReminderModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-primary" /> Set Follow-up Reminder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase font-semibold">Reminder Date & Time</label>
              <Input 
                type="datetime-local" 
                value={reminderDate}
                onChange={e => setReminderDate(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase font-semibold">Note (Optional)</label>
              <Input 
                placeholder="e.g. Call to discuss pricing..."
                value={reminderNote}
                onChange={e => setReminderNote(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>
            <Button className="w-full" onClick={handleSaveReminder} disabled={!reminderDate}>
              Save Reminder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
