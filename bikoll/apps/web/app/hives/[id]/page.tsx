'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Sidebar from '../../../components/layout/Sidebar';
import { ChevronRight, Droplets, CheckCircle2, ShieldAlert, AlignLeft, Bot, CalendarClock, Crown, Info, Layers } from 'lucide-react';

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
  const [showRaw, setShowRaw] = useState(false);

  const hiveName = `Kupa ${id}`;

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
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-4">
            <Link href="/hives" className="hover:text-amber-600 transition-colors">Bigårdar & Kupor</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">{hiveName}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{hiveName}</h1>
          <p className="text-gray-500 text-lg">Detaljerad vy och logghistorik från fältet.</p>
        </header>

        {loading && (
          <div className="flex items-center gap-3 text-amber-600 font-bold p-6 bg-amber-50 rounded-xl border border-amber-100 max-w-lg shadow-sm">
            <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            Laddar inspectioner...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 text-red-600 p-6 bg-red-50 rounded-xl border border-red-100 max-w-lg shadow-sm">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-bold">Ett fel uppstod:</span> {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-8">

              {/* Latest Inspection Card */}
              {latest ? (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <div className="bg-slate-50 border-b border-gray-100 p-6 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                      Senaste inspektion
                    </h2>
                    <div className="text-sm font-bold text-gray-500 bg-white px-4 py-1.5 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-amber-500" />
                      {new Date(latest.created_at).toLocaleString('sv-SE', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                      {/* Metrics Block */}
                      <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="bg-amber-100 p-2.5 rounded-lg text-amber-600">
                          <Crown className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Drottning</p>
                          <p className="font-bold text-gray-900 text-lg mt-0.5">
                            {latest.queen_seen ? `Hittad (${latest.queen_color || 'Okänd färg'})` : 'Ej funnen'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="bg-amber-100 p-2.5 rounded-lg text-amber-600">
                          <Layers className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Yngelramar</p>
                          <p className="font-bold text-gray-900 text-lg mt-0.5">
                            {latest.brood_frames !== null ? `${latest.brood_frames} st` : 'Ej angivet'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="bg-amber-100 p-2.5 rounded-lg text-amber-600">
                          <Info className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Samhälls-styrka</p>
                          <p className="font-bold text-gray-900 text-lg mt-0.5">
                            {latest.colony_strength || 'Okänd'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 rounded-xl bg-green-50 border border-green-100">
                        <div className="bg-green-100 p-2.5 rounded-lg text-green-600">
                          <Droplets className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-green-700 uppercase tracking-wide">Behandling</p>
                          <p className="font-bold text-green-900 text-lg mt-0.5">
                            {latest.treatment || 'Ingen loggad'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {latest.notes && (
                        <div>
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                            <AlignLeft className="w-4 h-4" /> Anteckningar
                          </p>
                          <p className="bg-slate-50 p-4 rounded-xl font-medium text-gray-700 leading-relaxed border border-slate-100">
                            {latest.notes}
                          </p>
                        </div>
                      )}

                      {latest.transcript && (
                        <div>
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                            <Bot className="w-4 h-4" /> AI Transkription
                          </p>
                          <p className="bg-amber-50/50 p-4 rounded-xl text-gray-700 italic border border-amber-100 leading-relaxed">
                            "{latest.transcript}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-10 text-center">
                  <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Inga loggar ännu</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Prata in en uppdatering för denna kupa i mobilappen ("Ny logg för kupa {id}...") så dyker tolkningen upp här automatiskt.
                  </p>
                </div>
              )}

              {/* Developer / Raw JSON accordion */}
              {latest && (
                <div className="bg-slate-900 rounded-xl shadow-md border border-slate-800 overflow-hidden text-gray-300">
                  <button
                    onClick={() => setShowRaw(!showRaw)}
                    className="w-full text-left font-mono text-sm px-6 py-4 flex items-center justify-between hover:bg-slate-800 transition-colors focus:outline-none"
                  >
                    <span>&lt; /&gt; Rådata (Supabase JSON)</span>
                    <span className="text-slate-500 text-xs uppercase tracking-wider">{showRaw ? 'Göm' : 'Visa'}</span>
                  </button>
                  {showRaw && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-800">
                      <pre className="text-xs text-green-400 overflow-x-auto whitespace-pre-wrap font-mono">
                        {lastRawJson || 'Ingen respons från Supabase.'}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar / History Panel */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Tidigare historik</h3>

                {inspections.length > 1 ? (
                  <div className="space-y-4">
                    {inspections.slice(1).map((insp) => (
                      <div key={insp.id} className="group cursor-pointer">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-gray-800 group-hover:text-amber-600 transition-colors">
                            {new Date(insp.created_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${insp.treatment ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                            {insp.treatment || 'Ingen med'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-500">
                          {insp.colony_strength || 'Okänd styrka'} • Yngel: {insp.brood_frames ?? '-'}
                        </p>
                        <div className="h-px w-full bg-slate-100 mt-4 group-last:hidden"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-gray-500">Endast en logg finns för kupan. Kommande uppdateringar visas här trådat per datum.</p>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
