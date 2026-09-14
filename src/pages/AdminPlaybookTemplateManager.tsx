import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ListTree } from 'lucide-react';

export default function AdminPlaybookTemplateManager() {
    const [templates, setTemplates] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase.from('decision_playbook_templates').select('*');
            if (data) setTemplates(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><ListTree className="h-6 w-6 text-indigo-600"/> Playbook Template Catalog</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Playbook Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Objectives</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {templates.map(t => (
                            <tr key={t.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{t.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-md">{t.description}</td>
                                <td className="px-6 py-4 text-sm text-gray-700 max-w-sm">{t.objectives}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
