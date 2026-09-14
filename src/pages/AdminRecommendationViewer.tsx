import React, { useState, useEffect } from 'react';
import { DecisionRecommendationService } from '@/services/intelligence/decision/DecisionRecommendationService';
import { FileText } from 'lucide-react';

export default function AdminRecommendationViewer() {
    const [recs, setRecs] = useState<any[]>([]);
    
    useEffect(() => {
        const load = async () => {
            const { data } = await DecisionRecommendationService.getRecommendations({ limit: 50, page: 1 });
            setRecs(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><FileText className="h-6 w-6 text-indigo-600"/> Recommendation Viewer</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated At</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {recs.map(r => (
                            <tr key={r.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{r.companies?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 capitalize">{r.recommendation_type}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full capitalize">{r.recommendation_status}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(r.generated_at).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {recs.length === 0 && <p className="p-6 text-center text-gray-500">No recommendations generated yet.</p>}
            </div>
        </div>
    );
}
