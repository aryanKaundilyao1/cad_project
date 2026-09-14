import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarClock } from 'lucide-react';

export default function AdminFollowUpDashboard() {
    const [followUps, setFollowUps] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('decision_followup_recommendations')
                .select('*, companies(name)')
                .order('created_at', { ascending: false })
                .limit(50);
            if (data) setFollowUps(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><CalendarClock className="h-6 w-6 text-blue-600"/> Follow-Up Recommendations</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days to Wait</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason Codes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {followUps.map(f => (
                            <tr key={f.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{f.companies?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-indigo-700">{f.recommended_action}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{f.days_to_wait} Days</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex gap-1 flex-wrap max-w-xs">
                                        {f.reason_codes?.map((rc: string) => (
                                            <span key={rc} className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] rounded-full">{rc}</span>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {followUps.length === 0 && <p className="p-6 text-center text-gray-500">No follow-ups recommended yet.</p>}
            </div>
        </div>
    );
}
