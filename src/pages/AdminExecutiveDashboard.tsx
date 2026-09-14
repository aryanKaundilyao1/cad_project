import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Briefcase, TrendingUp, DollarSign } from 'lucide-react';

export default function AdminExecutiveDashboard() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><LineChart className="h-6 w-6 text-indigo-600"/> Executive Analytics Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <div className="flex items-center text-gray-500 mb-2"><TrendingUp className="h-4 w-4 mr-2"/> Recommendation Adoption</div>
                    <div className="text-3xl font-bold text-gray-900">74.2%</div>
                    <div className="text-sm text-green-600 mt-2">+5.1% this month</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <div className="flex items-center text-gray-500 mb-2"><DollarSign className="h-4 w-4 mr-2"/> Revenue Influenced</div>
                    <div className="text-3xl font-bold text-gray-900">$14.2M</div>
                    <div className="text-sm text-green-600 mt-2">from adopted playbooks</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <div className="flex items-center text-gray-500 mb-2"><Briefcase className="h-4 w-4 mr-2"/> Win Rate Lift</div>
                    <div className="text-3xl font-bold text-gray-900">+18%</div>
                    <div className="text-sm text-gray-500 mt-2">vs. non-adopted deals</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <div className="flex items-center text-gray-500 mb-2"><LineChart className="h-4 w-4 mr-2"/> Sales Cycle Reduction</div>
                    <div className="text-3xl font-bold text-gray-900">14 Days</div>
                    <div className="text-sm text-gray-500 mt-2">faster time-to-close</div>
                </div>
            </div>
        </div>
    );
}
