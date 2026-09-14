import React, { useState, useEffect } from 'react';
import { DecisionAuditService } from '@/services/intelligence/decision/DecisionAuditService';
import { DecisionAuditLog } from '@/types/decision-intelligence';
import { History } from 'lucide-react';

export default function AdminDecisionAuditViewer() {
    const [logs, setLogs] = useState<DecisionAuditLog[]>([]);
    
    useEffect(() => {
        const load = async () => {
            const { data } = await DecisionAuditService.getLogs({ limit: 50, page: 1 });
            setLogs(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><History className="h-6 w-6 text-indigo-600"/> Decision Audit Logs</h1>
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {logs.map(l => (
                            <tr key={l.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(l.timestamp).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{l.action}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 capitalize">{l.entity_type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{l.reason || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {logs.length === 0 && <p className="p-6 text-center text-gray-500">No audit logs found.</p>}
            </div>
        </div>
    );
}
