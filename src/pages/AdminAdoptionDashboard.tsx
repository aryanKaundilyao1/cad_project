import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, BarChart2 } from 'lucide-react';

export default function AdminAdoptionDashboard() {
    const [adoptions, setAdoptions] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('decision_recommendation_adoption')
                .select('*, companies(name)')
                .order('created_at', { ascending: false })
                .limit(50);
            if (data) setAdoptions(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><BarChart2 className="h-6 w-6 text-indigo-600"/> Recommendation Adoption</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recommendation Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {adoptions.map(a => (
                            <tr key={a.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{a.companies?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{a.recommendation_type}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full w-max ${
                                        a.adoption_status === 'Accepted' || a.adoption_status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {a.adoption_status === 'Accepted' || a.adoption_status === 'Completed' ? <CheckCircle className="h-3 w-3"/> : <XCircle className="h-3 w-3"/>}
                                        {a.adoption_status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(a.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {adoptions.length === 0 && <p className="p-6 text-center text-gray-500">No adoption data yet.</p>}
            </div>
        </div>
    );
}
