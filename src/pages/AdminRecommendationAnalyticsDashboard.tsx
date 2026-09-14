import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Activity } from 'lucide-react';

export default function AdminRecommendationAnalyticsDashboard() {
    const [performance, setPerformance] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('decision_recommendation_performance')
                .select('*')
                .order('conversion_rate', { ascending: false })
                .limit(50);
            if (data) setPerformance(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Activity className="h-6 w-6 text-indigo-600"/> Recommendation Analytics</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Followed</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversion Rate</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {performance.map(p => (
                            <tr key={p.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{p.recommendation_type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{p.recommendations_generated}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{p.recommendations_followed}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-bold text-green-600">{p.conversion_rate}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {performance.length === 0 && <p className="p-6 text-center text-gray-500">No performance data yet.</p>}
            </div>
        </div>
    );
}
