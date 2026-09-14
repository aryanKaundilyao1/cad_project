import React from 'react';
import { BrainCircuit, Link as LinkIcon, BarChart3, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminPredictiveIntelligenceDashboard() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-purple-600" />
                Predictive Intelligence Engine
            </h1>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-gray-500 mb-6">Central command for ensemble predictions, combining Bayesian, Logistic Regression, and GBM probabilities.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <Link to="/admin/predictive/ensemble" className="p-4 border rounded-lg hover:border-purple-500 hover:bg-purple-50 flex items-center gap-2 transition-colors">
                        <LinkIcon className="h-5 w-5 text-purple-500" />
                        <span className="font-medium text-gray-900">Ensemble Engine</span>
                    </Link>
                    <Link to="/admin/predictive/models" className="p-4 border rounded-lg hover:border-purple-500 hover:bg-purple-50 flex items-center gap-2 transition-colors">
                        <BarChart3 className="h-5 w-5 text-purple-500" />
                        <span className="font-medium text-gray-900">Model Explorer</span>
                    </Link>
                     <Link to="/admin/predictive/confidence" className="p-4 border rounded-lg hover:border-purple-500 hover:bg-purple-50 flex items-center gap-2 transition-colors">
                        <BrainCircuit className="h-5 w-5 text-purple-500" />
                        <span className="font-medium text-gray-900">Confidence Engine</span>
                    </Link>
                    <Link to="/admin/predictive/drift" className="p-4 border rounded-lg hover:border-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <span className="font-medium text-gray-900">Drift Monitoring</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
