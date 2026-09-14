import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ActionCatalogService } from '@/services/intelligence/decision/ActionCatalogService';
import { DecisionAction } from '@/types/decision-intelligence';
import { Zap } from 'lucide-react';

export default function AdminActionManager() {
    const [actions, setActions] = useState<DecisionAction[]>([]);
    const [rules, setRules] = useState<any[]>([]);
    
    useEffect(() => {
        const load = async () => {
            const data = await ActionCatalogService.getActions();
            setActions(data);

            const { data: rulesData } = await supabase
              .from('recommendation_rules')
              .select('*')
              .order('priority_weight', { ascending: false });
            if (rulesData) setRules(rulesData);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Zap className="h-6 w-6 text-indigo-600"/> Action Catalog</h1>
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {actions.map(a => (
                                <tr key={a.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{a.action_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{a.action_type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">{a.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">Recommendation Rules Config</h2>
                    <button className="bg-indigo-600 text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-indigo-700">Add Rule</button>
                </div>
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trigger Event</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority Weight</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {rules.map(r => (
                                <tr key={r.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{r.rule_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{r.trigger_event}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{r.action_type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{r.priority_weight}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${r.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {r.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
