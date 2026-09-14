import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { ArrowLeft, Percent, Compass, History, Clock } from 'lucide-react';

export default function AdminProbabilityProfile() {
    const { id } = useParams<{ id: string }>();
    const [prob, setProb] = useState<any>(null);
    const [drivers, setDrivers] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            supabase.from('purchase_probabilities').select('*, companies(name), products(name)').eq('id', id).single().then(({ data }) => setProb(data));
            supabase.from('probability_drivers').select('*').eq('probability_id', id).order('driver_contribution', { ascending: false }).then(({ data }) => { if(data) setDrivers(data); });
        }
    }, [id]);

    if (!prob) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link to="/admin/probabilities/explorer" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{prob.companies?.name}</h1>
                    <p className="text-gray-500 mt-1">{prob.products?.name} • Version: {prob.probability_version}</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Master Probability</div>
                    <div className="text-5xl font-black text-fuchsia-600">{prob.purchase_probability}%</div>
                    <div className="text-sm text-gray-400 mt-3 font-mono">Based on Score: {prob.opportunity_score}</div>
                </div>
                <div className="col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Window Distribution</div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className={`p-4 rounded-lg border ${prob.recommended_window === '30-day' ? 'bg-fuchsia-50 border-fuchsia-200' : 'bg-gray-50 border-gray-100'} text-center`}>
                            <div className="text-xl font-bold text-gray-900">{prob.probability_30_day}%</div>
                            <div className="text-xs text-gray-500 mt-1">30 Days</div>
                        </div>
                        <div className={`p-4 rounded-lg border ${prob.recommended_window === '90-day' ? 'bg-fuchsia-50 border-fuchsia-200' : 'bg-gray-50 border-gray-100'} text-center`}>
                            <div className="text-xl font-bold text-gray-900">{prob.probability_90_day}%</div>
                            <div className="text-xs text-gray-500 mt-1">90 Days</div>
                        </div>
                        <div className={`p-4 rounded-lg border ${prob.recommended_window === '180-day' ? 'bg-fuchsia-50 border-fuchsia-200' : 'bg-gray-50 border-gray-100'} text-center`}>
                            <div className="text-xl font-bold text-gray-900">{prob.probability_180_day}%</div>
                            <div className="text-xs text-gray-500 mt-1">180 Days</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                    <Compass className="h-5 w-5 text-gray-500" />
                    <h2 className="font-semibold text-gray-900">Probability Drivers</h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {drivers.map(d => (
                        <div key={d.id} className="p-4 flex items-center justify-between">
                            <div className="font-medium text-gray-900">{d.driver_name}</div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                d.driver_type === 'POSITIVE' ? 'bg-green-100 text-green-800' :
                                d.driver_type === 'NEGATIVE' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {d.driver_type} (Contribution: {d.driver_contribution})
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-4">
                 <Link to={`/admin/probabilities/timeline/${prob.company_id}`} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium">
                    <History className="h-4 w-4" /> View History
                </Link>
            </div>
        </div>
    );
}
