import React, { useState, useEffect } from 'react';
import { PlaybookCatalogService } from '@/services/intelligence/decision/PlaybookCatalogService';
import { DecisionPlaybook } from '@/types/decision-intelligence';
import { Book } from 'lucide-react';

export default function AdminPlaybookManager() {
    const [playbooks, setPlaybooks] = useState<DecisionPlaybook[]>([]);
    
    useEffect(() => {
        const load = async () => {
            const data = await PlaybookCatalogService.getPlaybooks();
            setPlaybooks(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Book className="h-6 w-6 text-indigo-600"/> Playbook Catalog</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Playbook Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {playbooks.map(p => (
                            <tr key={p.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{p.playbook_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{p.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">{p.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
