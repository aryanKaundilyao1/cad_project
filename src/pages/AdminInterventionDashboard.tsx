import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Zap } from 'lucide-react';

export default function AdminInterventionDashboard() {
    const [interventions, setInterventions] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('decision_intervention_recommendations')
                .select('*, companies(name)')
                .order('created_at', { ascending: false })
                .limit(50);
            if (data) setInterventions(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Zap className="h-6 w-6 text-indigo-600"/> Intervention Recommendations</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Intervention Strategy</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason Codes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {interventions.map(i => (
                            <tr key={i.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{i.companies?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-bold text-indigo-700">{i.intervention_type}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${i.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {i.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex gap-1 flex-wrap max-w-xs">
                                        {i.reason_codes?.map((rc: string) => (
                                            <span key={rc} className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] rounded-full">{rc}</span>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {interventions.length === 0 && <p className="p-6 text-center text-gray-500">No interventions recommended yet.</p>}
            </div>
        </div>
    );
}
