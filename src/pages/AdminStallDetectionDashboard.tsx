import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Clock } from 'lucide-react';

export default function AdminStallDetectionDashboard() {
    const [stalls, setStalls] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('decision_stall_events')
                .select('*, companies(name)')
                .order('created_at', { ascending: false })
                .limit(50);
            if (data) setStalls(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Clock className="h-6 w-6 text-orange-600"/> Stall Detection Dashboard</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days / Expected</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stall Risk</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {stalls.map(s => (
                            <tr key={s.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{s.companies?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{s.pipeline_stage}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{s.days_in_stage} / {s.expected_days}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${s.stall_risk > 100 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {s.stall_risk}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {stalls.length === 0 && <p className="p-6 text-center text-gray-500">No stall events logged.</p>}
            </div>
        </div>
    );
}
