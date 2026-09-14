import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users } from 'lucide-react';

export default function AdminContactRankingDashboard() {
    const [rankings, setRankings] = useState<any[]>([]);
    
    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('decision_contact_rankings')
                .select('*, companies(name)') // Would usually join contacts table here, but skipping for demo if no explicit contacts table
                .order('rank_position', { ascending: true })
                .limit(50);
            if (data) setRankings(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Users className="h-6 w-6 text-indigo-600"/> Contact Prioritization Engine</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {rankings.map(r => (
                            <tr key={r.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">#{r.rank_position}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{r.companies?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm truncate max-w-xs">{r.contact_id}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${r.stakeholder_role === 'Decision Maker' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {r.stakeholder_role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-mono text-gray-700">{r.rank_score}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rankings.length === 0 && <p className="p-6 text-center text-gray-500">No contact rankings generated yet.</p>}
            </div>
        </div>
    );
}
