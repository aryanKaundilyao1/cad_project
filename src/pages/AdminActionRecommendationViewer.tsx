import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DecisionActionRecommendation } from '@/types/decision-intelligence';
import { Target } from 'lucide-react';

export default function AdminActionRecommendationViewer() {
    const [recs, setRecs] = useState<any[]>([]);
    
    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('decision_action_recommendations')
                .select('*, companies(name)')
                .order('generated_at', { ascending: false })
                .limit(50);
            if (data) setRecs(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Target className="h-6 w-6 text-indigo-600"/> Action Recommendations (Phase 6B)</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgency</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Window</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {recs.map(r => (
                            <tr key={r.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{r.companies?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-indigo-600 font-medium">{r.recommended_action}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${r.urgency_level === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {r.urgency_level} ({r.urgency_score})
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{r.best_contact_window}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(r.generated_at).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {recs.length === 0 && <p className="p-6 text-center text-gray-500">No action recommendations generated yet.</p>}
            </div>
        </div>
    );
}
