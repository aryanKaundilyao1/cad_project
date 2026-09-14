import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen } from 'lucide-react';

export default function AdminPlaybookDashboard() {
    const [playbooks, setPlaybooks] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('decision_playbook_performance')
                .select('*')
                .order('conversion_rate', { ascending: false })
                .limit(50);
            if (data) setPlaybooks(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><BookOpen className="h-6 w-6 text-indigo-600"/> Playbook Performance</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Playbook ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Executions</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Win Rate</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg. Cycle (Days)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {playbooks.map(p => (
                            <tr key={p.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{p.playbook_id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{p.executions}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-bold text-green-600">{p.conversion_rate}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{p.average_sales_cycle}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {playbooks.length === 0 && <p className="p-6 text-center text-gray-500">No playbook performance data yet.</p>}
            </div>
        </div>
    );
}
