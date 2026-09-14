import React, { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Database, Target, TrendingUp, History, Activity, Anchor } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminOutcomeExplorer() {
    const [outcomes, setOutcomes] = useState<any[]>([]);

    useEffect(() => {
        loadOutcomes();
    }, []);

    const loadOutcomes = async () => {
        const { data } = await supabase
            .from('crm_outcomes')
            .select(`
                *,
                companies(name),
                products(name)
            `)
            .order('created_at', { ascending: false });
        
        if (data) setOutcomes(data);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Database className="h-6 w-6 text-purple-600" />
                        Outcome Explorer
                    </h1>
                    <p className="text-gray-500 mt-1">Single source of truth for CRM opportunity outcomes and historical tracking.</p>
                </div>
                <div className="flex gap-4">
                    <Link to="/admin/outcomes/dataset" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 font-medium">
                        <Target className="h-4 w-4" />
                        Training Dataset
                    </Link>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opportunity (Company)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stage</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final Outcome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {outcomes.map((o) => (
                            <tr key={o.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{o.companies?.name || 'Unknown'}</div>
                                    <div className="text-sm text-gray-500 font-mono">{o.opportunity_id.substring(0, 8)}...</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{o.products?.name}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {o.current_status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {o.outcome_type === 'IN_PROGRESS' ? (
                                         <span className="text-gray-400 text-sm">Pending</span>
                                    ) : (
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            o.outcome_type === 'WON' ? 'bg-green-100 text-green-800' :
                                            o.outcome_type === 'LOST' || o.outcome_type === 'COMPETITOR_WON' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {o.outcome_type}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <div className="flex items-center gap-3">
                                        <Link to={`/admin/outcomes/timeline/${o.opportunity_id}`} className="text-purple-600 hover:text-purple-800 flex items-center gap-1">
                                            <Activity className="h-4 w-4" /> Timeline
                                        </Link>
                                        <Link to={`/admin/outcomes/snapshots/${o.opportunity_id}`} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                            <History className="h-4 w-4" /> Snapshots
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {outcomes.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    <Anchor className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                                    No outcomes recorded yet. Pipeline tracking must be initialized.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
