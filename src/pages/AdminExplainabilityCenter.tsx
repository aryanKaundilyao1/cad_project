import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Network } from 'lucide-react';

export default function AdminExplainabilityCenter() {
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('decision_explainability_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);
            if (data) setLogs(data);
        };
        load();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Network className="h-6 w-6 text-indigo-600"/> Decision Trace Center</h1>
            
            <div className="space-y-6">
                {logs.map(log => (
                    <div key={log.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
                        <div className="text-xs text-gray-400 mb-4">{new Date(log.created_at).toLocaleString()} | ID: {log.id}</div>
                        <pre className="font-mono text-sm bg-gray-50 p-4 rounded text-gray-800 whitespace-pre-wrap">
                            {log.decision_trace}
                        </pre>
                        {log.reasons && log.reasons.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Reason Codes Fired:</h4>
                                <div className="flex gap-2 flex-wrap">
                                    {log.reasons.map((r: string) => (
                                        <span key={r} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded border border-indigo-100">{r}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {logs.length === 0 && (
                    <div className="bg-white p-12 text-center rounded-lg border border-gray-200 text-gray-500">
                        No explainability traces logged yet.
                    </div>
                )}
            </div>
        </div>
    );
}
