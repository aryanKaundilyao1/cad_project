import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DecisionUrgencyScore } from '@/types/decision-intelligence';
import { Timer } from 'lucide-react';

export default function AdminUrgencyDashboard() {
    const [scores, setScores] = useState<any[]>([]);
    
    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('decision_urgency_scores')
                .select('*, companies(name)')
                .order('created_at', { ascending: false })
                .limit(50);
            if (data) setScores(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Timer className="h-6 w-6 text-indigo-600"/> Urgency Engine Dashboard</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Decay Factor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {scores.map(s => (
                            <tr key={s.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{s.companies?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${s.urgency_level === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {s.urgency_level}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{s.urgency_score}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{s.decay_factor}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(s.created_at).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {scores.length === 0 && <p className="p-6 text-center text-gray-500">No urgency scores generated yet.</p>}
            </div>
        </div>
    );
}
