import React, { useEffect, useState } from 'react';
import { TrainingDatasetBuilder, TrainingRecord } from '../services/intelligence/outcomes/TrainingDatasetBuilder';
import { Target, Download, FlaskConical } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminTrainingDatasetViewer() {
    const [dataset, setDataset] = useState<TrainingRecord[]>([]);

    useEffect(() => {
        TrainingDatasetBuilder.generateTrainingDataset().then(setDataset);
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Target className="h-6 w-6 text-green-600" />
                        Training Dataset (ML Ready)
                    </h1>
                    <p className="text-gray-500 mt-1">Flat feature matrix mapping initial historical scores to final known outcomes.</p>
                </div>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 font-medium">
                    <Download className="h-4 w-4" />
                    Export CSV
                </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-emerald-800">
                <FlaskConical className="h-5 w-5 shrink-0" />
                <div className="text-sm">
                    <strong>Phase 5B/5C Foundation:</strong> This data represents the earliest recorded score (X) for an opportunity joined with its ultimate terminal state (y). This exact matrix will be fed into the Logistic and Gradient Boosted Models for Probability Calibration.
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opp ID</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fit (X)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Intent (X)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Timing (X)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Engage (X)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase border-r">Master (X)</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-indigo-600 uppercase">Days to Close</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-purple-600 uppercase bg-purple-50">Outcome (y)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 font-mono text-sm">
                        {dataset.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-gray-500">{row.opportunity_id.substring(0,6)}</td>
                                <td className="px-6 py-4 text-right text-gray-600">{row.fit_score}</td>
                                <td className="px-6 py-4 text-right text-gray-600">{row.intent_score}</td>
                                <td className="px-6 py-4 text-right text-gray-600">{row.timing_score}</td>
                                <td className="px-6 py-4 text-right text-gray-600">{row.engagement_score}</td>
                                <td className="px-6 py-4 text-right font-bold border-r text-gray-900">{row.opportunity_score}</td>
                                <td className="px-6 py-4 text-center text-gray-500">{row.days_to_close}</td>
                                <td className="px-6 py-4 font-bold bg-purple-50/50">
                                    <span className={row.final_outcome === 'WON' ? 'text-green-600' : 'text-red-600'}>
                                        {row.final_outcome}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {dataset.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-sans">
                                    No closed outcomes found to generate training dataset.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
