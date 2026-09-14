import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Target } from 'lucide-react';

export default function AdminOutcomeTrackingDashboard() {
    const [outcomes, setOutcomes] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('decision_recommendation_outcomes')
                .select('*, companies(name)')
                .order('created_at', { ascending: false })
                .limit(50);
            if (data) setOutcomes(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Target className="h-6 w-6 text-indigo-600"/> Outcome Tracking</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outcome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days to Close</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {outcomes.map(o => (
                            <tr key={o.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{o.companies?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${o.outcome_type === 'Won' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {o.outcome_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-green-700 font-medium">${o.revenue_generated}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{o.days_to_outcome}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {outcomes.length === 0 && <p className="p-6 text-center text-gray-500">No outcomes tracked yet.</p>}
            </div>
        </div>
    );
}
