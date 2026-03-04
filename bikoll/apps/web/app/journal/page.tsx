import Sidebar from '../../components/layout/Sidebar';
import { FileText, Download, CheckCircle2, Search, Filter } from 'lucide-react';

export default function JournalPage() {
    const treatments = [
        {
            id: 't1',
            date: '2026-08-15',
            apiary: 'Bigård Ängen',
            hive: 'Kupa 3',
            type: 'Oxalsyra',
            status: 'Slutförd',
            notes: 'Droppbehandling enligt schema, 30ml.'
        },
        {
            id: 't2',
            date: '2026-08-12',
            apiary: 'Skogskanten',
            hive: 'Kupa 1',
            type: 'Thymol',
            status: 'Pågår',
            notes: 'Dag 1 av 14. Bricka insatt.'
        },
        {
            id: 't3',
            date: '2026-07-20',
            apiary: 'Bigård Ängen',
            hive: 'Kupa 2',
            type: 'Myrsyra',
            status: 'Slutförd',
            notes: 'Korttidsbehandling, Nassenheider professionell.'
        }
    ];

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 flex items-center gap-3">
                            <FileText className="w-8 h-8 text-green-600" />
                            Läkemedelsjournal
                        </h1>
                        <p className="text-gray-500 text-lg">Översikt över dina registrerade behandlingar för Jordbruksverket.</p>
                    </div>
                    <button className="bg-slate-900 hover:bg-slate-800 text-amber-400 px-6 py-3 rounded-lg font-bold shadow-md flex items-center gap-2 transition-all hover:shadow-lg focus:ring-4 focus:ring-slate-900/10">
                        <Download className="w-5 h-5" />
                        Exportera PDF-rapport
                    </button>
                </header>

                {/* Search & Filter Toolbar */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Sök bigård, kupa eller behandling..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                    </div>
                    <div className="flex gap-4">
                        <select className="px-4 py-3 border border-gray-200 rounded-lg text-gray-700 text-sm font-semibold bg-white hover:bg-gray-50 focus:ring-2 focus:ring-amber-500 outline-none">
                            <option>År: 2026</option>
                            <option>År: 2025</option>
                        </select>
                        <button className="px-5 py-3 border border-gray-200 rounded-lg text-gray-700 text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors bg-white shadow-sm">
                            <Filter className="w-4 h-4" />
                            Fler filter
                        </button>
                    </div>
                </div>

                {/* Full-width Table Card */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden w-full">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-slate-50 border-b border-gray-200 text-gray-800 uppercase text-xs font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-5">Datum</th>
                                    <th className="px-6 py-5">Bigård & Kupa</th>
                                    <th className="px-6 py-5">Behandling</th>
                                    <th className="px-6 py-5">Status</th>
                                    <th className="px-6 py-5">Anteckning</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {treatments.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-5 font-bold text-gray-900 whitespace-nowrap">{t.date}</td>
                                        <td className="px-6 py-5">
                                            <span className="font-bold text-amber-600 block text-base">{t.apiary}</span>
                                            <span className="text-gray-500 font-medium">{t.hive}</span>
                                        </td>
                                        <td className="px-6 py-5 font-bold text-gray-800 text-base">{t.type}</td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold border shadow-sm ${t.status === 'Slutförd' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                {t.status === 'Slutförd' ? <CheckCircle2 className="w-4 h-4" /> : <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>}
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 max-w-md" title={t.notes}>
                                            <span className="text-gray-600 line-clamp-2">{t.notes}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-slate-50 border-t border-gray-100 p-5 text-center">
                        <button className="text-sm font-bold text-amber-600 hover:text-amber-700 hover:underline px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors">
                            Ladda fler behandlingar...
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
