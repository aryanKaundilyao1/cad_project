import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LayoutList, AlertCircle, ArrowRight } from 'lucide-react';

export default function AdminActionCenter() {
    const [tasks, setTasks] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('decision_action_center')
                .select('*, companies(name)')
                .order('priority_score', { ascending: false })
                .limit(50);
            if (data) setTasks(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><LayoutList className="h-6 w-6 text-indigo-600"/> Action Center (Execution Queue)</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Execute</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tasks.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap font-bold text-indigo-700">{t.recommended_action}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{t.companies?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full w-max ${
                                        t.priority === 'Critical' ? 'bg-red-100 text-red-800' : 
                                        t.priority === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {t.priority === 'Critical' && <AlertCircle className="h-3 w-3"/>}
                                        {t.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{t.priority_score}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded flex items-center gap-1">
                                        Execute <ArrowRight className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {tasks.length === 0 && <p className="p-6 text-center text-gray-500">No actions in your queue! You're all caught up.</p>}
            </div>
        </div>
    );
}
