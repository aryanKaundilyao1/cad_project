import React, { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Percent, Activity, ThermometerSnowflake } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminProbabilityExplorer() {
    const [probs, setProbs] = useState<any[]>([]);

    useEffect(() => {
        supabase.from('purchase_probabilities')
            .select('*, companies(name), products(name)')
            .order('purchase_probability', { ascending: false })
            .then(({ data }) => { if (data) setProbs(data); });
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Percent className="h-6 w-6 text-fuchsia-600" />
                        Purchase Probability Explorer
                    </h1>
                    <p className="text-gray-500 mt-1">Deterministic Purchase Likelihoods (Cold Start).</p>
                </div>
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex gap-3 text-sky-800">
                <ThermometerSnowflake className="h-5 w-5 shrink-0" />
                <div className="text-sm">
                    <strong>Cold-Start Active:</strong> These probabilities are calculated via Linear Interpolation from the Opportunity Score. Once enough outcomes are collected, this view will automatically switch to displaying Logistic-calibrated scores.
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Opp Score</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-fuchsia-600 uppercase">Probability</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 font-mono text-sm">
                        {probs.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-sans text-gray-900 font-medium">{p.companies?.name}</td>
                                <td className="px-6 py-4 font-sans text-gray-600">{p.products?.name}</td>
                                <td className="px-6 py-4 text-center text-gray-500">{p.opportunity_score}</td>
                                <td className="px-6 py-4 text-center font-bold text-lg text-fuchsia-600">{p.purchase_probability}%</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        {p.probability_version}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <Link to={`/admin/probabilities/company/${p.id}`} className="text-indigo-600 hover:text-indigo-900 font-sans font-medium text-sm flex items-center gap-1">
                                        <Activity className="h-4 w-4" /> Explain
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
