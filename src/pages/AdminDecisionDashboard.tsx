import React from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import { Compass, Book, Zap, FileText, History } from 'lucide-react';

export default function AdminDecisionDashboard() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Compass className="h-6 w-6 text-indigo-600" />
                Decision Intelligence Command Center
            </h1>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-gray-500 mb-6">Manage the rules, actions, and playbooks that power JAS CONNECT's Prescriptive Engine.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <Link to="/admin/decision/playbooks" className="p-4 border rounded-lg hover:border-indigo-500 hover:bg-indigo-50 flex items-center gap-2 transition-colors">
                        <Book className="h-5 w-5 text-indigo-500" />
                        <span className="font-medium text-gray-900">Playbook Catalog</span>
                    </Link>
                    <Link to="/admin/decision/actions" className="p-4 border rounded-lg hover:border-indigo-500 hover:bg-indigo-50 flex items-center gap-2 transition-colors">
                        <Zap className="h-5 w-5 text-indigo-500" />
                        <span className="font-medium text-gray-900">Action Catalog</span>
                    </Link>
                     <Link to="/admin/decision/recommendations" className="p-4 border rounded-lg hover:border-indigo-500 hover:bg-indigo-50 flex items-center gap-2 transition-colors">
                        <FileText className="h-5 w-5 text-indigo-500" />
                        <span className="font-medium text-gray-900">Live Recommendations</span>
                    </Link>
                    <Link to="/admin/decision/audit" className="p-4 border rounded-lg hover:border-indigo-500 hover:bg-indigo-50 flex items-center gap-2 transition-colors">
                        <History className="h-5 w-5 text-indigo-500" />
                        <span className="font-medium text-gray-900">Audit & History</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
