import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SnapshotArchiveService } from '../services/intelligence/outcomes/SnapshotArchiveService';
import { History, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function AdminSnapshotViewer() {
    const { id } = useParams<{ id: string }>();
    const [snapshots, setSnapshots] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            SnapshotArchiveService.getSnapshots(id).then(setSnapshots);
        }
    }, [id]);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link to="/admin/outcomes/explorer" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <History className="h-6 w-6 text-indigo-600" />
                        Score Snapshot Archive
                    </h1>
                    <p className="text-gray-500 mt-1 font-mono text-sm">Opportunity: {id}</p>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <div className="text-sm">
                    <strong>Immutable Records:</strong> These snapshots represent the exact state of the Opportunity Score at the moment the deal transitioned stages. They are permanently frozen to prevent Target Leakage in machine learning datasets.
                </div>
            </div>

            <div className="space-y-6">
                {snapshots.map((snap, idx) => (
                    <div key={snap.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <div className="font-semibold text-gray-900">Snapshot #{snapshots.length - idx}</div>
                                <div className="text-sm text-gray-500">{new Date(snap.snapshot_timestamp).toLocaleString()}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500">Master Score</div>
                                <div className="text-2xl font-bold text-indigo-600">{snap.opportunity_score}</div>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-4 gap-6">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Fit</div>
                                <div className="text-xl font-semibold">{snap.fit_score}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Intent</div>
                                <div className="text-xl font-semibold">{snap.intent_score}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Timing</div>
                                <div className="text-xl font-semibold">{snap.timing_score}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Engagement</div>
                                <div className="text-xl font-semibold">{snap.engagement_score}</div>
                            </div>
                        </div>
                    </div>
                ))}
                {snapshots.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        No snapshots found for this opportunity.
                    </div>
                )}
            </div>
        </div>
    );
}
