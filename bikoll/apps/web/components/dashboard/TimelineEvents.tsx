'use client';

import { useState } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import CorrectionModule from './CorrectionForm';

// Dummy data for Timeline
const initialEvents = [
    {
        id: 'e1',
        time: 'Idag, 14:30',
        apiary: 'Bigård Ängen',
        hive: 'Kupa 3',
        transcription: 'Starkt samhälle, 3 ramar yngel, behandlad med oxalsyra.',
        status: 'needs-review', // 'needs-review', 'approved'
        parsedData: {
            strength: 'Starkt',
            broodFrames: 3,
            treatment: 'Oxalsyra',
        }
    },
    {
        id: 'e2',
        time: 'Igår, 09:15',
        apiary: 'Skogskanten',
        hive: 'Kupa 1',
        transcription: 'Svagt samhälle, verkar sakna drottning. Inget yngel.',
        status: 'approved',
        parsedData: {
            strength: 'Svagt',
            broodFrames: 0,
            treatment: 'Ingen',
        }
    },
];

export default function TimelineEvents() {
    const [events, setEvents] = useState(initialEvents);
    const [activeCorrectionId, setActiveCorrectionId] = useState<string | null>(null);

    const toggleCorrection = (id: string) => {
        setActiveCorrectionId((prev) => (prev === id ? null : id));
    };

    const handleSaveCorrection = (id: string, updatedData: any) => {
        setEvents(events.map(ev =>
            ev.id === id
                ? { ...ev, parsedData: updatedData, status: 'approved' }
                : ev
        ));
        setActiveCorrectionId(null);
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-amber-500" />
                    Senaste händelser från fältet
                </h2>
            </div>

            <div className="relative border-l-2 border-gray-100 ml-3 space-y-10">
                {events.map((event) => (
                    <div key={event.id} className="relative pl-8">
                        {/* Timeline Dot */}
                        <span className={`absolute -left-[10px] top-1.5 rounded-full w-4 h-4 border-2 border-white ${event.status === 'approved' ? 'bg-green-500' : 'bg-amber-400'}`}></span>

                        <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 font-medium mb-1">{event.time} • <span className="text-amber-600 font-bold">{event.apiary}, {event.hive}</span></p>
                                <p className="text-gray-800 italic text-lg leading-relaxed">"{event.transcription}"</p>

                                {/* AI Parsed Chips */}
                                <div className="flex gap-2 mt-4 flex-wrap">
                                    <span className="px-3 py-1.5 text-xs font-semibold bg-slate-50 text-slate-600 rounded-md border border-slate-200 shadow-sm">
                                        Styrka: {event.parsedData.strength}
                                    </span>
                                    <span className="px-3 py-1.5 text-xs font-semibold bg-slate-50 text-slate-600 rounded-md border border-slate-200 shadow-sm">
                                        Yngel: {event.parsedData.broodFrames} ramar
                                    </span>
                                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-md border shadow-sm ${event.parsedData.treatment !== 'Ingen' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                        Medicin: {event.parsedData.treatment}
                                    </span>
                                </div>
                            </div>

                            {/* Action Area */}
                            <div className="shrink-0 pt-2 md:pt-0">
                                {event.status === 'approved' ? (
                                    <div className="flex items-center gap-1.5 text-sm font-bold text-green-600 px-3 py-1.5 bg-green-50/50 rounded-lg">
                                        <CheckCircle2 className="w-5 h-5" />
                                        Granskad
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => toggleCorrection(event.id)}
                                        className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-lg text-white bg-amber-500 hover:bg-amber-600 shadow-md hover:shadow-lg transition-all"
                                    >
                                        Granska & Redigera
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Mount Correction Module inline if active */}
                        {activeCorrectionId === event.id && (
                            <div className="mt-6 ml-2">
                                <CorrectionModule
                                    initialData={event.parsedData}
                                    onSave={(data: any) => handleSaveCorrection(event.id, data)}
                                    onCancel={() => setActiveCorrectionId(null)}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
