import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { OutcomeTrackingService } from '../services/intelligence/outcomes/OutcomeTrackingService';
import { Activity, ArrowLeft, Clock, ArrowRight, Save } from 'lucide-react';

export default function AdminOutcomeTimeline() {
    const { id } = useParams<{ id: string }>();
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            OutcomeTrackingService.getOutcomeHistory(id).then(setHistory);
        }
    }, [id]);

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link to="/admin/outcomes/explorer" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="h-6 w-6 text-blue-600" />
                        Pipeline Lifecycle Timeline
                    </h1>
                    <p className="text-gray-500 mt-1 font-mono text-sm">Opportunity: {id}</p>
                </div>
            </div>

            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
                {history.map((event, index) => (
                    <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <Clock className="h-5 w-5" />
                        </div>

                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-bold text-gray-900">{event.change_reason}</div>
                                <div className="text-xs text-gray-500">{new Date(event.changed_at).toLocaleString()}</div>
                            </div>
                            
                            <div className="flex items-center gap-3 text-sm mt-3">
                                {event.previous_status ? (
                                    <>
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">{event.previous_status}</span>
                                        <ArrowRight className="h-4 w-4 text-gray-400" />
                                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium">{event.new_status}</span>
                                    </>
                                ) : (
                                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-medium">Initialized: {event.new_status}</span>
                                )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-indigo-600 font-medium">
                                <Save className="h-4 w-4" />
                                Triggered ML Score Snapshot
                            </div>
                        </div>
                    </div>
                ))}

                {history.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300 relative z-10">
                        No history recorded.
                    </div>
                )}
            </div>
        </div>
    );
}
