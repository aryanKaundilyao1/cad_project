import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShieldAlert } from 'lucide-react';

export default function AdminStakeholderViewer() {
    const [roles, setRoles] = useState<any[]>([]);
    
    useEffect(() => {
        const load = async () => {
            const { data } = await supabase.from('decision_stakeholder_roles').select('*');
            if (data) setRoles(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-indigo-600"/> Stakeholder Roles Taxonomy</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {roles.map(r => (
                            <tr key={r.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{r.role_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{r.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
