'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Inspection {
    id: string;
    hive_id: string;
    queen_seen: boolean | null;
    queen_color: string | null;
    brood_frames: number | null;
    treatment: string | null;
    created_at: string;
}

export default function DebugPage() {
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInspections = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: queryError } = await supabase
                .from('inspections')
                .select('id, hive_id, queen_seen, queen_color, brood_frames, treatment, created_at')
                .order('created_at', { ascending: false })
                .limit(20);

            if (queryError) {
                setError(queryError.message);
            } else {
                setInspections(data || []);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInspections();
    }, []);

    return (
        <main className="min-h-screen bg-gray-950 text-gray-100 p-8 font-mono">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-amber-400">🐝 BiKoll Debug</h1>
                        <span className="bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded">
                            TEST MODE
                        </span>
                    </div>
                    <button
                        onClick={fetchInspections}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        ↻ Refresh
                    </button>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
                        <strong>Supabase Error:</strong> {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12 text-gray-400">Loading inspections...</div>
                ) : inspections.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No inspections found. Insert test data to see results here.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-800">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-900 text-amber-400 text-left">
                                    <th className="p-3 font-semibold">ID</th>
                                    <th className="p-3 font-semibold">Hive ID</th>
                                    <th className="p-3 font-semibold">Queen Seen</th>
                                    <th className="p-3 font-semibold">Queen Color</th>
                                    <th className="p-3 font-semibold">Brood Frames</th>
                                    <th className="p-3 font-semibold">Treatment</th>
                                    <th className="p-3 font-semibold">Created At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inspections.map((insp, i) => (
                                    <tr
                                        key={insp.id}
                                        className={`border-t border-gray-800 ${i % 2 === 0 ? 'bg-gray-900/50' : 'bg-gray-950'
                                            } hover:bg-gray-800/70 transition-colors`}
                                    >
                                        <td className="p-3 text-gray-400 truncate max-w-[120px]" title={insp.id}>
                                            {insp.id.slice(0, 8)}…
                                        </td>
                                        <td className="p-3 text-gray-300 truncate max-w-[120px]">{insp.hive_id}</td>
                                        <td className="p-3">
                                            <span className={insp.queen_seen ? 'text-green-400' : 'text-red-400'}>
                                                {insp.queen_seen ? '✅ Yes' : '❌ No'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-300">{insp.queen_color || '—'}</td>
                                        <td className="p-3 text-gray-300">{insp.brood_frames ?? '—'}</td>
                                        <td className="p-3 text-gray-300">{insp.treatment || '—'}</td>
                                        <td className="p-3 text-gray-400">
                                            {new Date(insp.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-6 text-gray-600 text-xs">
                    Showing {inspections.length} inspection{inspections.length !== 1 ? 's' : ''} (limit 20)
                </div>
            </div>
        </main>
    );
}
