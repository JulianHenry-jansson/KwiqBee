'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Inspection {
  id: string;
  hive_id: string;
  queen_seen: boolean | null;
  queen_color: string | null;
  brood_frames: number | null;
  colony_strength: string | null;
  treatment: string | null;
  notes: string | null;
  transcript: string | null;
  created_at: string;
}

export default function HivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRawJson, setLastRawJson] = useState<string | null>(null);
  const hiveName = `Bikupa ${id}`;

  // Fetch existing inspections
  useEffect(() => {
    const fetchInspections = async () => {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('inspections')
        .select('*')
        .eq('hive_id', id)
        .order('created_at', { ascending: false });

      if (queryError) {
        setError(queryError.message);
      } else {
        setInspections(data || []);
        if (data && data.length > 0) {
          setLastRawJson(JSON.stringify(data[0], null, 2));
        }
      }
      setLoading(false);
    };

    fetchInspections();
  }, [id]);

  // Realtime: listen for new inspections on this hive
  useEffect(() => {
    const channel = supabase
      .channel(`hive-${id}-inspections`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inspections',
          filter: `hive_id=eq.${id}`,
        },
        (payload) => {
          const newInspection = payload.new as Inspection;
          setInspections((prev) => [newInspection, ...prev]);
          setLastRawJson(JSON.stringify(newInspection, null, 2));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const latest = inspections[0];

  return (
    <main className="p-8 font-sans bg-gray-50 min-h-screen">
      <div className="mb-4">
        <Link href="/" className="text-blue-600 hover:underline text-sm">
          &larr; Back to Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6 text-gray-900">{hiveName}</h1>

      {/* Raw JSON from Qwen */}
      <div className="max-w-2xl mb-8">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">Qwen JSON Response</h2>
        <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-auto max-h-80 border border-gray-700">
          {lastRawJson ? (
            <pre className="whitespace-pre-wrap">{lastRawJson}</pre>
          ) : (
            <p className="text-gray-500 italic">Waiting for inspection data from mobile...</p>
          )}
        </div>
      </div>

      {loading && <p className="text-gray-500">Loading inspections...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && (
        <>
          {/* Latest Inspection — Predefined Fields */}
          {latest ? (
            <div className="bg-white border rounded-xl shadow p-6 max-w-lg text-gray-800 mb-8">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">Latest Inspection</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Queen seen:</span>
                  <span>{latest.queen_seen ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Queen color:</span>
                  <span>{latest.queen_color || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Brood frames:</span>
                  <span>{latest.brood_frames ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Treatment:</span>
                  <span>{latest.treatment || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Colony strength:</span>
                  <span>{latest.colony_strength || 'Unknown'}</span>
                </div>
                <div className="flex flex-col mt-4">
                  <span className="font-medium text-gray-600 mb-1">Notes:</span>
                  <p className="bg-gray-50 p-3 rounded border">{latest.notes || '\u2014'}</p>
                </div>
                {latest.transcript && (
                  <div className="flex flex-col mt-2">
                    <span className="font-medium text-gray-600 mb-1">Transcript:</span>
                    <p className="bg-gray-50 p-3 rounded border text-sm italic">{latest.transcript}</p>
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(latest.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 mb-8">No inspections recorded yet.</p>
          )}

          {/* Inspection History */}
          {inspections.length > 1 && (
            <div className="max-w-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Inspection History</h2>
              <div className="space-y-3">
                {inspections.slice(1).map((insp) => (
                  <div
                    key={insp.id}
                    className="bg-white border rounded-lg p-4 text-sm text-gray-700"
                  >
                    <div className="flex justify-between mb-1">
                      <span>Queen: {insp.queen_seen ? 'Yes' : 'No'}</span>
                      <span className="text-gray-400">
                        {new Date(insp.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-gray-500">
                      Brood: {insp.brood_frames ?? '\u2014'} | Strength: {insp.colony_strength || '\u2014'} |
                      Treatment: {insp.treatment || '\u2014'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
