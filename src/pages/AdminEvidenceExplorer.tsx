import React, { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { BrainCircuit, Search, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminEvidenceExplorer() {
    const [signals, setSignals] = useState<any[]>([]);

    useEffect(() => {
        supabase.from('signal_performance_metrics')
            .select('*, signal_evidence_registry(*)')
            .order('iv_score', { ascending: false })
            .then(({ data }) => { if (data) setSignals(data); });
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BrainCircuit className="h-6 w-6 text-indigo-600" />
                        Evidence Explorer (Phase 5C)
                    </h1>
                    <p className="text-gray-500 mt-1">Weight of Evidence (WOE) and Information Value (IV) for all signals.</p>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Signal</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">WOE</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">IV Score</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Predictive Strength</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Bayes Factor</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sample Size</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 font-mono text-sm">
                        {signals.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-sans text-gray-900 font-medium">{s.signal_evidence_registry?.signal_name || s.signal_id}</td>
                                <td className={`px-6 py-4 text-center font-bold ${s.woe_value > 0 ? 'text-green-600' : s.woe_value < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                    {s.woe_value > 0 ? '+' : ''}{s.woe_value}
                                </td>
                                <td className="px-6 py-4 text-center text-indigo-600 font-bold">{s.iv_score}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        s.iv_classification === 'Very Strong' || s.iv_classification === 'Strong' ? 'bg-indigo-100 text-indigo-800' :
                                        s.iv_classification === 'Medium' ? 'bg-blue-100 text-blue-800' :
                                        s.iv_classification === 'Weak' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {s.iv_classification || 'Unknown'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center text-gray-600">{s.bayes_factor}</td>
                                <td className="px-6 py-4 text-center text-gray-400">{s.total_occurrences}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
