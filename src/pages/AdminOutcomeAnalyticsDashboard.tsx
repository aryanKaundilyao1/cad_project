import React, { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { OutcomeAnalyticsService, OutcomeAnalytics } from '../services/intelligence/outcomes/OutcomeAnalyticsService';
import { BarChart3, TrendingUp, TrendingDown, Target, Clock } from 'lucide-react';

export default function AdminOutcomeAnalyticsDashboard() {
    const [analytics, setAnalytics] = useState<OutcomeAnalytics | null>(null);

    useEffect(() => {
        OutcomeAnalyticsService.getGlobalAnalytics().then(setAnalytics);
    }, []);

    if (!analytics) return <div className="p-8">Loading analytics...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                    Outcome Analytics Dashboard
                </h1>
                <p className="text-gray-500 mt-1">Global performance metrics for pipeline tracking and historical outcomes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-gray-500">
                        <Target className="h-5 w-5 text-blue-500" /> Total Opportunities
                    </div>
                    <div className="text-3xl font-bold">{analytics.totalOpportunities}</div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-gray-500">
                        <TrendingUp className="h-5 w-5 text-green-500" /> Win Rate
                    </div>
                    <div className="text-3xl font-bold text-green-600">{analytics.winRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-500 mt-1">{analytics.wonOpportunities} closed-won</div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-gray-500">
                        <TrendingDown className="h-5 w-5 text-red-500" /> Loss Rate
                    </div>
                    <div className="text-3xl font-bold text-red-600">{analytics.lossRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-500 mt-1">{analytics.lostOpportunities} closed-lost</div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-gray-500">
                        <Clock className="h-5 w-5 text-amber-500" /> Avg Score at Close
                    </div>
                    <div className="text-3xl font-bold text-indigo-600">{analytics.avgScoreWon.toFixed(1)}</div>
                    <div className="text-sm text-gray-500 mt-1">For won opportunities</div>
                </div>
            </div>
        </div>
    );
}
