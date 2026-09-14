import React, { useState, useEffect } from 'react';
import { ReasonCodeService } from '@/services/intelligence/decision/ReasonCodeService';
import { DecisionReasonCode } from '@/types/decision-intelligence';
import { Tags } from 'lucide-react';

export default function AdminReasonCodeManager() {
    const [codes, setCodes] = useState<DecisionReasonCode[]>([]);
    
    useEffect(() => {
        const load = async () => {
            const data = await ReasonCodeService.getReasonCodes();
            setCodes(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Tags className="h-6 w-6 text-indigo-600"/> Reason Code Manager</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {codes.map(c => (
                            <tr key={c.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-indigo-600">{c.code}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{c.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 capitalize">{c.category}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
