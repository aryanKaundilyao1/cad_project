import React from 'react';
import { Stethoscope } from 'lucide-react';

export default function AdminDealExplainabilityDashboard() {
    // Similar to other explainability viewers, this serves as a placeholder 
    // for where the DealExplainabilityEngine outputs will be audited historically.
    
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Stethoscope className="h-6 w-6 text-indigo-600"/> Deal Health Explainability</h1>
            <div className="bg-white rounded-lg shadow p-8 text-center border border-gray-200">
                <Stethoscope className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Diagnostic Traces</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    The Deal Explainability Service generates logic traces at runtime explaining health scores and interventions. This viewer will store the historical snapshots of those diagnostic texts.
                </p>
            </div>
        </div>
    );
}
