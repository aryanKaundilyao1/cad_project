import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HelpCircle } from 'lucide-react';

export default function AdminContactExplainabilityViewer() {
    const [explanations, setExplanations] = useState<any[]>([]);
    
    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('decision_contact_explanations')
                .select('*, companies(name)')
                .order('generated_at', { ascending: false })
                .limit(50);
            if (data) setExplanations(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><HelpCircle className="h-6 w-6 text-indigo-600"/> Contact Explainability Engine</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Explanation</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {explanations.map(e => (
                            <tr key={e.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{e.companies?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm truncate max-w-[150px]">{e.contact_id}</td>
                                <td className="px-6 py-4 text-sm text-gray-700 max-w-md">{e.explanation}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex gap-1 flex-wrap max-w-xs">
                                        {e.reason_codes?.map((rc: string) => (
                                            <span key={rc} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{rc}</span>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {explanations.length === 0 && <p className="p-6 text-center text-gray-500">No contact explanations generated yet.</p>}
            </div>
        </div>
    );
}
