import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HeartPulse } from 'lucide-react';

export default function AdminDealHealthDashboard() {
    const [healthRecords, setHealthRecords] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('decision_deal_health')
                .select('*, companies(name)')
                .order('created_at', { ascending: false })
                .limit(50);
            if (data) setHealthRecords(data);
        };
        load();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Healthy': return 'bg-green-100 text-green-800';
            case 'Watchlist': return 'bg-yellow-100 text-yellow-800';
            case 'At Risk': return 'bg-orange-100 text-orange-800';
            case 'Critical': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><HeartPulse className="h-6 w-6 text-indigo-600"/> Deal Health Dashboard</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engagement</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {healthRecords.map(r => (
                            <tr key={r.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{r.companies?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{r.deal_health_score}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(r.health_status)}`}>
                                        {r.health_status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{r.engagement_score}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {healthRecords.length === 0 && <p className="p-6 text-center text-gray-500">No deal health records yet.</p>}
            </div>
        </div>
    );
}
