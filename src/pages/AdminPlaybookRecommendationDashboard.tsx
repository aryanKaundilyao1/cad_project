import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen } from 'lucide-react';

export default function AdminPlaybookRecommendationDashboard() {
    const [recs, setRecs] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('decision_playbook_recommendations')
                .select('*, companies(name), decision_playbook_templates(name)')
                .order('created_at', { ascending: false })
                .limit(50);
            if (data) setRecs(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><BookOpen className="h-6 w-6 text-indigo-600"/> Playbook Recommendations</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recommended Playbook</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason Codes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {recs.map(r => (
                            <tr key={r.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{r.companies?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-bold text-indigo-700">{r.decision_playbook_templates?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{r.playbook_score}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex gap-1 flex-wrap max-w-xs">
                                        {r.reason_codes?.map((rc: string) => (
                                            <span key={rc} className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] rounded-full">{rc}</span>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {recs.length === 0 && <p className="p-6 text-center text-gray-500">No playbook recommendations generated yet.</p>}
            </div>
        </div>
    );
}
