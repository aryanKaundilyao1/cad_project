import React, { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Settings2, Activity, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminCalibrationDashboard() {
    const [activeModel, setActiveModel] = useState<any>(null);

    useEffect(() => {
        // Fetch active calibration model
        supabase.from('probability_calibration_models')
            .select('*')
            .eq('active', true)
            .limit(1)
            .single()
            .then(({ data }) => { if (data) setActiveModel(data); });
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Settings2 className="h-6 w-6 text-indigo-600" />
                Probability Calibration Engine
            </h1>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Active Calibration Model</h2>
                {activeModel ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-sm text-gray-500">Model Name</p>
                            <p className="font-medium text-gray-900">{activeModel.model_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Version</p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {activeModel.version}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Model Type</p>
                            <p className="font-mono text-indigo-600 text-sm">{activeModel.model_type}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Sample Size Trained</p>
                            <p className="font-medium text-gray-900">{activeModel.sample_size.toLocaleString()}</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md border border-yellow-200 flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        No active calibration model found. The system is likely defaulting to Phase 5B Cold Start probabilities.
                    </div>
                )}

                <div className="mt-8 flex gap-4">
                    <Link to="/admin/calibration/reliability" className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                        View Reliability Metrics
                    </Link>
                    <Link to="/admin/calibration/retrain" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
                        <Play className="h-4 w-4" /> Trigger Retraining
                    </Link>
                </div>
            </div>
        </div>
    );
}
