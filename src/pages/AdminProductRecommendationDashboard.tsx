import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PackageSearch } from 'lucide-react';

export default function AdminProductRecommendationDashboard() {
    const [recs, setRecs] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('decision_product_recommendations')
                .select('*, companies(name), product_catalog(name)')
                .order('created_at', { ascending: false })
                .limit(50);
            if (data) setRecs(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><PackageSearch className="h-6 w-6 text-indigo-600"/> Product Recommendations</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recommended Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Match Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason Codes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {recs.map(r => (
                            <tr key={r.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{r.companies?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-bold text-indigo-700">{r.product_catalog?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{r.product_match_score}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${r.confidence_score >= 80 ? 'bg-green-100 text-green-800' : r.confidence_score >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                        {r.confidence_score}%
                                    </span>
                                </td>
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
                {recs.length === 0 && <p className="p-6 text-center text-gray-500">No product recommendations generated yet.</p>}
            </div>
        </div>
    );
}
