import React, { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { BrainCircuit, TrendingUp, TrendingDown, Zap } from 'lucide-react';

export default function AdminSignalIntelligenceDashboard() {
    const [topPos, setTopPos] = useState<any[]>([]);
    const [topNeg, setTopNeg] = useState<any[]>([]);
    const [mostPred, setMostPred] = useState<any[]>([]);

    useEffect(() => {
        supabase.from('signal_performance_metrics').select('*, signal_evidence_registry(signal_name)').order('woe_value', { ascending: false }).limit(5).then(({ data }) => { if (data) setTopPos(data); });
        supabase.from('signal_performance_metrics').select('*, signal_evidence_registry(signal_name)').order('woe_value', { ascending: true }).limit(5).then(({ data }) => { if (data) setTopNeg(data); });
        supabase.from('signal_performance_metrics').select('*, signal_evidence_registry(signal_name)').order('iv_score', { ascending: false }).limit(5).then(({ data }) => { if (data) setMostPred(data); });
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-indigo-600" />
                Signal Intelligence Dashboard
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Most Predictive */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                        <Zap className="h-5 w-5 text-indigo-500" /> Most Predictive Signals (IV)
                    </h3>
                    <div className="space-y-3">
                        {mostPred.map((s, i) => (
                            <div key={s.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                                <span className="font-medium">{i + 1}. {s.signal_evidence_registry?.signal_name}</span>
                                <span className="font-mono text-indigo-600">{s.iv_score} IV</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Positive */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                        <TrendingUp className="h-5 w-5 text-green-500" /> Top Positive Signals (WOE)
                    </h3>
                    <div className="space-y-3">
                        {topPos.map((s, i) => (
                            <div key={s.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                                <span className="font-medium">{i + 1}. {s.signal_evidence_registry?.signal_name}</span>
                                <span className="font-mono text-green-600">+{s.woe_value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Negative */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                        <TrendingDown className="h-5 w-5 text-red-500" /> Top Negative Signals (WOE)
                    </h3>
                    <div className="space-y-3">
                        {topNeg.map((s, i) => (
                            <div key={s.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                                <span className="font-medium">{i + 1}. {s.signal_evidence_registry?.signal_name}</span>
                                <span className="font-mono text-red-600">{s.woe_value}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
