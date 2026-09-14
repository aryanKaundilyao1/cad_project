import React from 'react';
import { Lightbulb } from 'lucide-react';

export default function AdminRecommendationExplainabilityViewer() {
    // In a real app this would query a dedicated explanation table similar to contact explanations
    // For Phase 6D we generate explanations on the fly via the RecommendationExplainabilityService
    // This dashboard acts as a placeholder/viewer for those text blobs.
    
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Lightbulb className="h-6 w-6 text-indigo-600"/> Strategy Explainability Engine</h1>
            <div className="bg-white rounded-lg shadow p-8 text-center border border-gray-200">
                <Lightbulb className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Explainability Traces</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    The Product and Playbook Explainability Service generates logic traces at runtime. This viewer will store the historical snapshots of those text explanations.
                </p>
            </div>
        </div>
    );
}
