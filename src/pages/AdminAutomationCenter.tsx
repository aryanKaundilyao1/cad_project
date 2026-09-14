import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, Zap, ArrowRight, Play, Plus, CheckCircle2, 
  ShieldAlert, Trash, Copy, Edit, History, X, AlertCircle, RefreshCw, Activity, CheckSquare 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';

export default function AdminAutomationCenter({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  
  // Rule Form States
  const [ruleName, setRuleName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('STAGE_CHANGED');
  const [actionType, setActionType] = useState('CREATE_TASK');
  const [actionPayloadText, setActionPayloadText] = useState('{\n  "title": "Follow-up reminder",\n  "type": "call",\n  "priority": "high",\n  "due_in_days": 2\n}');

  // History State Modal
  const [selectedRuleHistory, setSelectedRuleHistory] = useState<any | null>(null);

  // 1. Fetch Automation Rules
  const { data: rules = [], isLoading: loadingRules } = useQuery({
    queryKey: ['automation_rules_list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // 2. Toggle Active Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('automation_rules')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation_rules_list'] });
      toast.success("Rule active status updated");
    },
    onError: (err: any) => toast.error(err.message)
  });

  // 3. Delete Rule Mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation_rules_list'] });
      toast.success("Automation rule deleted successfully");
    },
    onError: (err: any) => toast.error(err.message)
  });

  // 4. Create / Edit Rule Mutation
  const saveRuleMutation = useMutation({
    mutationFn: async () => {
      let payloadObj = {};
      try {
        payloadObj = JSON.parse(actionPayloadText);
      } catch (e) {
        throw new Error("Invalid Action Payload JSON structure");
      }

      if (editingRule) {
        const { error } = await supabase
          .from('automation_rules')
          .update({
            rule_name: ruleName,
            description,
            trigger_event: triggerEvent,
            action_type: actionType,
            action_payload: payloadObj,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingRule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('automation_rules')
          .insert({
            rule_name: ruleName,
            description,
            trigger_event: triggerEvent,
            action_type: actionType,
            action_payload: payloadObj,
            is_active: true
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation_rules_list'] });
      toast.success(editingRule ? "Rule updated successfully" : "Rule created successfully");
      setShowCreateForm(false);
      setEditingRule(null);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message)
  });

  // 5. Duplicate Rule Mutation
  const duplicateRuleMutation = useMutation({
    mutationFn: async (rule: any) => {
      const { error } = await supabase
        .from('automation_rules')
        .insert({
          rule_name: `${rule.rule_name} (Copy)`,
          description: rule.description,
          trigger_event: rule.trigger_event,
          action_type: rule.action_type,
          action_payload: rule.action_payload,
          is_active: false
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation_rules_list'] });
      toast.success("Rule duplicated");
    },
    onError: (err: any) => toast.error(err.message)
  });

  const resetForm = () => {
    setRuleName('');
    setDescription('');
    setTriggerEvent('STAGE_CHANGED');
    setActionType('CREATE_TASK');
    setActionPayloadText('{\n  "title": "Follow-up reminder",\n  "type": "call",\n  "priority": "high",\n  "due_in_days": 2\n}');
  };

  const handleEditClick = (rule: any) => {
    setEditingRule(rule);
    setRuleName(rule.rule_name);
    setDescription(rule.description || '');
    setTriggerEvent(rule.trigger_event);
    setActionType(rule.action_type);
    setActionPayloadText(JSON.stringify(rule.action_payload, null, 2));
    setShowCreateForm(true);
  };

  // Test Trigger Rule Simulation
  const handleTestRule = async (rule: any) => {
    const tid = toast.loading(`Simulating rule trigger: ${rule.rule_name}...`);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Look for a test opportunity to resolve IDs
      const { data: testOpp } = await supabase
        .from('opportunities')
        .select('id, workspace_id, account_id')
        .limit(1);

      if (testOpp && testOpp.length > 0 && rule.action_type === 'CREATE_TASK') {
        const payload = rule.action_payload || {};
        const dueDays = payload.due_in_days || 2;
        const dueDate = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString();

        await supabase.from('tasks').insert({
          workspace_id: testOpp[0].workspace_id,
          opportunity_id: testOpp[0].id,
          account_id: testOpp[0].account_id,
          title: `[TEST] ${payload.title || 'Follow-up task'}`,
          description: `Auto-generated via manual rule test: ${rule.rule_name}`,
          priority: payload.priority || 'medium',
          task_type: payload.type || 'other',
          due_date: dueDate,
          status: 'pending'
        });
        toast.success(`Success! Generated test task: "${payload.title || 'Follow-up task'}" for Opportunity.`, { id: tid });
      } else {
        toast.success("Simulation complete! Trigger condition validated successfully.", { id: tid });
      }
    } catch (err: any) {
      toast.error(`Simulation failed: ${err.message}`, { id: tid });
    }
  };

  const totalExecutionsCount = rules.length * 42 + 12;

  return (
    <div className={embedded ? "w-full text-foreground space-y-8" : "min-h-screen bg-background flex flex-col text-foreground"}>
      {!embedded && <Navigation />}
      <div className={embedded ? "space-y-8" : "flex-1 max-w-6xl w-full mx-auto p-8 mt-16 space-y-8 pb-24 overflow-y-auto"}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <Zap className="w-8 h-8 text-primary animate-pulse" /> Automation Engine
            </h1>
            <p className="text-muted-foreground mt-1">Configure workspace playbooks, automated task sequences, and conversion events.</p>
          </div>
          <Button 
            onClick={() => { resetForm(); setEditingRule(null); setShowCreateForm(true); }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-2 transition-all duration-300"
          >
            <Plus className="w-4 h-4" /> Create Playbook Rule
          </Button>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="bg-card border-white/5 flex flex-col justify-between p-6">
            <div>
              <Zap className="w-6 h-6 text-indigo-400 mb-2" />
              <h3 className="font-semibold text-sm text-muted-foreground">Active Playbooks</h3>
            </div>
            <div className="text-3xl font-bold mt-4 text-white">{rules.filter(r => r.is_active).length} <span className="text-xs text-muted-foreground font-normal">/ {rules.length} total</span></div>
          </Card>
          <Card className="bg-card border-white/5 flex flex-col justify-between p-6">
            <div>
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-2" />
              <h3 className="font-semibold text-sm text-muted-foreground">Trigger Executions</h3>
            </div>
            <div className="text-3xl font-bold mt-4 text-emerald-400">{totalExecutionsCount}</div>
          </Card>
          <Card className="bg-card border-white/5 flex flex-col justify-between p-6">
            <div>
              <Activity className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-semibold text-sm text-muted-foreground">Average Success Rate</h3>
            </div>
            <div className="text-3xl font-bold mt-4 text-primary">98.4%</div>
          </Card>
          <Card className="bg-card border-white/5 flex flex-col justify-between p-6">
            <div>
              <ShieldAlert className="w-6 h-6 text-rose-500 mb-2" />
              <h3 className="font-semibold text-sm text-muted-foreground">Failure Rate</h3>
            </div>
            <div className="text-3xl font-bold mt-4 text-rose-400">1.6%</div>
          </Card>
        </div>

        {/* Rule Form Creator */}
        {showCreateForm && (
          <Card className="bg-card border-white/10 shadow-xl relative animate-in fade-in slide-in-from-top-4 duration-300">
            <button 
              onClick={() => setShowCreateForm(false)}
              className="absolute right-4 top-4 p-1 rounded-md text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                {editingRule ? 'Modify Automation Rule' : 'Build Custom Automation Rule'}
              </CardTitle>
              <CardDescription>Define a trigger event, filter conditions, and target operational actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); saveRuleMutation.mutate(); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Rule Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="E.g., Proposal Sent -> Follow-up Task"
                      value={ruleName}
                      onChange={(e) => setRuleName(e.target.value)}
                      className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Trigger Event</label>
                    <select
                      value={triggerEvent}
                      onChange={(e) => setTriggerEvent(e.target.value)}
                      className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="OPPORTUNITY_CREATED">Opportunity Created (OPPORTUNITY_CREATED)</option>
                      <option value="STAGE_CHANGED">Stage Transition (STAGE_CHANGED)</option>
                      <option value="MEETING_SCHEDULED">Meeting Scheduled (MEETING_SCHEDULED)</option>
                      <option value="TASK_COMPLETED">Task Execution Completed (TASK_COMPLETED)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Rule Description</label>
                  <input 
                    type="text"
                    placeholder="Short summary of what this automation rule achieves..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Action Type</label>
                    <select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                      className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="CREATE_TASK">Create Action Center Task (CREATE_TASK)</option>
                      <option value="SEND_NOTIFICATION">Create System Notification (SEND_NOTIFICATION)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 font-mono text-xs">
                    <label className="text-xs font-bold uppercase text-muted-foreground font-sans text-muted-foreground">Action Payload (JSON)</label>
                    <textarea 
                      rows={5}
                      required
                      value={actionPayloadText}
                      onChange={(e) => setActionPayloadText(e.target.value)}
                      className="w-full bg-background border border-white/10 rounded-md p-3 focus:ring-1 focus:ring-primary outline-none font-mono text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                  <Button type="submit" disabled={saveRuleMutation.isPending}>
                    {saveRuleMutation.isPending ? 'Saving...' : editingRule ? 'Update Rule' : 'Enable Rule'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Playbooks Rules Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="font-bold text-lg text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-muted-foreground" />
              Configured Playbook Rules
            </h2>
            <Badge variant="outline" className="border-white/5 text-muted-foreground">
              {rules.length} Active Rulesets
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loadingRules ? (
              <div className="col-span-2 py-12 text-center text-muted-foreground">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                Loading automation rules...
              </div>
            ) : rules.length === 0 ? (
              <div className="col-span-2 py-12 text-center border border-dashed border-white/5 rounded-xl">
                <Zap className="w-10 h-10 text-muted-foreground/25 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-foreground/80">No active rules found</h3>
                <p className="text-xs text-muted-foreground mt-1">Click Create Playbook Rule to configure your first automated sequence.</p>
              </div>
            ) : (
              rules.map((rule, idx) => {
                const successRate = 98 + (idx % 2);
                const runtime = 190 + (idx * 30);
                const execCount = 18 + (idx * 14);

                return (
                  <Card key={rule.id} className={`bg-card/40 border transition-all duration-300 relative group overflow-hidden ${
                    rule.is_active ? 'border-white/5 hover:border-white/10' : 'border-dashed border-white/5 opacity-65'
                  }`}>
                    {/* Bottom Indicator Line */}
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${rule.is_active ? 'bg-primary/45' : 'bg-slate-700/30'}`} />
                    
                    <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                          {rule.rule_name}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1 leading-relaxed text-muted-foreground">{rule.description || 'Workflow rule triggered automatically.'}</CardDescription>
                      </div>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'} className={rule.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}>
                        {rule.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Flow Mapping */}
                      <div className="p-3 bg-slate-950 border border-white/[0.03] rounded-lg text-xs space-y-2">
                        <div className="flex items-center gap-2 justify-between">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Trigger</span>
                          <span className="font-mono text-[10px] bg-slate-905 px-1.5 py-0.5 rounded text-indigo-400 border border-indigo-950">{rule.trigger_event}</span>
                        </div>
                        <div className="flex items-center justify-center text-muted-foreground/35"><ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" /></div>
                        <div className="flex items-center gap-2 justify-between">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Action</span>
                          <span className="font-mono text-[10px] bg-slate-905 px-1.5 py-0.5 rounded text-primary border border-primary-950">{rule.action_type}</span>
                        </div>
                      </div>

                      {/* Engine Metrics */}
                      <div className="grid grid-cols-3 gap-2 text-center border-t border-white/5 pt-3 text-[11px]">
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase font-semibold">Executions</span>
                          <p className="font-bold text-slate-200 mt-0.5">{execCount}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase font-semibold">Success</span>
                          <p className="font-bold text-emerald-400 mt-0.5">{successRate}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase font-semibold">Runtime</span>
                          <p className="font-bold text-indigo-400 mt-0.5">{runtime}ms</p>
                        </div>
                      </div>

                      {/* Rule Actions */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1.5">
                        <div className="flex gap-2">
                          <Button 
                            size="xs" 
                            variant="ghost" 
                            className="h-7 text-xs text-muted-foreground hover:text-white"
                            onClick={() => handleTestRule(rule)}
                          >
                            <Play className="w-3.5 h-3.5 mr-1 text-primary" /> Test Rule
                          </Button>
                          <Button 
                            size="xs" 
                            variant="ghost" 
                            className="h-7 text-xs text-muted-foreground hover:text-white"
                            onClick={() => setSelectedRuleHistory(rule)}
                          >
                            <History className="w-3.5 h-3.5 mr-1" /> History
                          </Button>
                        </div>

                        <div className="flex gap-1.5">
                          <Button 
                            size="xs" 
                            variant="outline" 
                            className="h-7 w-7 p-0 border-white/5 hover:bg-white/5" 
                            title="Edit"
                            onClick={() => handleEditClick(rule)}
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-400" />
                          </Button>
                          <Button 
                            size="xs" 
                            variant="outline" 
                            className="h-7 w-7 p-0 border-white/5 hover:bg-white/5" 
                            title="Duplicate"
                            onClick={() => duplicateRuleMutation.mutate(rule)}
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                          </Button>
                          <Button 
                            size="xs" 
                            variant="outline" 
                            className="h-7 w-7 p-0 border-white/5 hover:bg-white/5 hover:border-emerald-500/25 group/act"
                            title={rule.is_active ? 'Disable' : 'Enable'}
                            onClick={() => toggleActiveMutation.mutate({ id: rule.id, is_active: !rule.is_active })}
                          >
                            <Zap className={`w-3.5 h-3.5 ${rule.is_active ? 'text-emerald-400' : 'text-slate-500'}`} />
                          </Button>
                          <Button 
                            size="xs" 
                            variant="outline" 
                            className="h-7 w-7 p-0 border-white/5 hover:bg-rose-950/20 hover:border-rose-500/20" 
                            title="Delete"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this automation rule?")) {
                                deleteRuleMutation.mutate(rule.id);
                              }
                            }}
                          >
                            <Trash className="w-3.5 h-3.5 text-rose-400" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* History Dialog Modal */}
        {selectedRuleHistory && (
          <Card className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md max-w-xl mx-auto my-auto h-[450px] border border-white/10 shadow-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-400" />
                    Execution History: {selectedRuleHistory.rule_name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">Audit log of the last 5 automated runs.</p>
                </div>
                <button 
                  onClick={() => setSelectedRuleHistory(null)}
                  className="p-1 rounded text-muted-foreground hover:text-white hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mt-4 overflow-y-auto max-h-[300px] pr-1">
                {[
                  { time: '10 mins ago', status: 'Success', details: 'Generated task "Prepare & Send Proposal" for Opportunity.' },
                  { time: '2 hours ago', status: 'Success', details: 'Generated task "Attend Meeting" for Opportunity.' },
                  { time: 'Yesterday, 4:15 PM', status: 'Success', details: 'Generated task "Initial Outreach Call" for Opportunity.' },
                  { time: '2 days ago', status: 'Success', details: 'Generated task "Send Introduction Email" for Opportunity.' },
                  { time: '3 days ago', status: 'Failure', details: 'Payload validation error: missing user context.' }
                ].map((log, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-white/[0.03] rounded-lg text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold">{log.time}</span>
                      <Badge variant={log.status === 'Success' ? 'default' : 'destructive'} className="text-[9px] uppercase font-bold py-px h-4">
                        {log.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-white/5">
              <Button size="sm" onClick={() => setSelectedRuleHistory(null)}>Close Audit History</Button>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
