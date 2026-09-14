import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Plus, Save, Trash2, Edit2, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminRecommendationRules() {
  const queryClient = useQueryClient();
  const [editingRule, setEditingRule] = useState<any>(null);

  const { data: rules, isLoading } = useQuery({
    queryKey: ['admin_recommendation_rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recommendation_rules')
        .select('*')
        .order('priority_weight', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (rule: any) => {
      if (rule.id) {
        const { error } = await supabase.from('recommendation_rules').update(rule).eq('id', rule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('recommendation_rules').insert(rule);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_recommendation_rules'] });
      toast.success("Rule saved successfully");
      setEditingRule(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save rule");
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      const { error } = await supabase.from('recommendation_rules').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_recommendation_rules'] });
      toast.success("Rule status updated");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recommendation_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_recommendation_rules'] });
      toast.success("Rule deleted");
    }
  });

  if (isLoading) return <div className="p-8">Loading rules...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-8 h-8 text-amber-500" />
            Recommendation Rules Engine
          </h1>
          <p className="text-slate-500 mt-2">Configure triggers and Next Best Actions for the intelligence engine.</p>
        </div>
        <button 
          onClick={() => setEditingRule({ rule_name: '', trigger_event: '', action_type: '', priority_weight: 50, is_active: true, description: '' })}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
              <th className="px-6 py-4">Rule Name</th>
              <th className="px-6 py-4">Trigger Event</th>
              <th className="px-6 py-4">Action Type</th>
              <th className="px-6 py-4">Priority Weight</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rules?.map((rule) => (
              <tr key={rule.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">{rule.rule_name}</div>
                  <div className="text-sm text-slate-500 mt-1 truncate max-w-xs">{rule.description}</div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-700">{rule.trigger_event}</td>
                <td className="px-6 py-4 text-sm font-bold text-primary">{rule.action_type.replace(/_/g, ' ')}</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-600">{rule.priority_weight}</td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => toggleMutation.mutate({ id: rule.id, is_active: !rule.is_active })}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${rule.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {rule.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingRule(rule)} className="p-2 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if(confirm('Delete rule?')) deleteMutation.mutate(rule.id) }} className="p-2 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingRule && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50 font-bold text-lg text-slate-800">
              {editingRule.id ? 'Edit Rule' : 'New Rule'}
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rule Name</label>
                <input 
                  type="text" 
                  value={editingRule.rule_name}
                  onChange={e => setEditingRule({...editingRule, rule_name: e.target.value})}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  value={editingRule.description || ''}
                  onChange={e => setEditingRule({...editingRule, description: e.target.value})}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Trigger Event</label>
                  <select 
                    value={editingRule.trigger_event}
                    onChange={e => setEditingRule({...editingRule, trigger_event: e.target.value})}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  >
                    <option value="">Select Trigger...</option>
                    <option value="Tender Published">Tender Published</option>
                    <option value="Project Approved">Project Approved</option>
                    <option value="Stage Stagnation">Stage Stagnation</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Signal Detected">Signal Detected</option>
                    <option value="Score Drop">Score Drop</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Action Type</label>
                  <select 
                    value={editingRule.action_type}
                    onChange={e => setEditingRule({...editingRule, action_type: e.target.value})}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  >
                    <option value="">Select Action...</option>
                    <option value="Bid Tender">Bid Tender</option>
                    <option value="Contact Developer">Contact Developer</option>
                    <option value="Contact Procurement">Contact Procurement</option>
                    <option value="Re-engage">Re-engage</option>
                    <option value="Follow Up">Follow Up</option>
                    <option value="Schedule Meeting">Schedule Meeting</option>
                    <option value="Investigate Project">Investigate Project</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority Weight (1-100)</label>
                <input 
                  type="number" 
                  min="1" max="100"
                  value={editingRule.priority_weight}
                  onChange={e => setEditingRule({...editingRule, priority_weight: parseInt(e.target.value) || 50})}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-end gap-3">
              <button 
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => saveMutation.mutate(editingRule)}
                disabled={saveMutation.isPending || !editingRule.rule_name || !editingRule.trigger_event || !editingRule.action_type}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium text-sm rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saveMutation.isPending ? 'Saving...' : <><Save className="w-4 h-4" /> Save Rule</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
