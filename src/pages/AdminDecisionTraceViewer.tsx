import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DecisionDecisionTrace } from '@/types/decision-intelligence';
import { Network } from 'lucide-react';

export default function AdminDecisionTraceViewer() {
    const [traces, setTraces] = useState<any[]>([]);
    
    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('decision_decision_traces')
                .select('*, companies(name)')
                .order('generated_at', { ascending: false })
                .limit(25);
            if (data) setTraces(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Network className="h-6 w-6 text-indigo-600"/> Decision Traces (Explainability)</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conf</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urg</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trace Data</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {traces.map(t => (
                            <tr key={t.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{t.companies?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-indigo-600 font-medium">{t.recommended_action}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{t.confidence}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{t.urgency_score}</td>
                                <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                                    {JSON.stringify(t.decision_trace)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {traces.length === 0 && <p className="p-6 text-center text-gray-500">No traces generated yet.</p>}
            </div>
        </div>
    );
}
