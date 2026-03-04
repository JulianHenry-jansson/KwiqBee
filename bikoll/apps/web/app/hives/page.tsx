import Link from 'next/link';
import Sidebar from '../../components/layout/Sidebar';
import { Layers, Search, Filter, Plus, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function HivesPage() {
    const apiaries = [
        {
            id: 'a1',
            name: 'Bigård Ängen',
            location: 'Södra skiftet',
            colonyCount: 12,
            status: 'Bra',
            hives: Array.from({ length: 12 }).map((_, i) => ({
                id: `h-a1-${i + 1}`,
                dbId: (i + 1).toString(),
                name: `Kupa ${i + 1}`,
                strength: i % 3 === 0 ? 'Starkt' : 'Normalt',
                lastChecked: 'Idag, 14:30',
                varroa: (Math.random() * 2).toFixed(1) + '%',
            }))
        },
        {
            id: 'a2',
            name: 'Skogskanten',
            location: 'Norra ängen',
            colonyCount: 8,
            status: 'Kräver tillsyn',
            hives: Array.from({ length: 8 }).map((_, i) => ({
                id: `h-a2-${i + 1}`,
                dbId: (i + 1).toString(),
                name: `Kupa ${i + 1}`,
                strength: i % 4 === 0 ? 'Svagt' : 'Normalt',
                lastChecked: 'Igår',
                varroa: (Math.random() * 3).toFixed(1) + '%',
            }))
        }
    ];

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Bigårdar & Kupor</h1>
                        <p className="text-gray-500 text-lg">Översikt, status och detaljer för alla dina bisamhällen.</p>
                    </div>
                    <button className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-md flex items-center gap-2 transition-all hover:shadow-lg">
                        <Plus className="w-5 h-5" />
                        Ny Bigård
                    </button>
                </header>

                {/* Toolbar */}
                <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 flex gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Sök bigård eller kupa..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                    </div>
                    <button className="px-6 py-3 border border-gray-200 bg-white rounded-lg text-gray-700 text-sm font-bold flex items-center gap-2 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm">
                        <Filter className="w-5 h-5" />
                        Filtrera
                    </button>
                </div>

                {/* Apiaries List */}
                <div className="space-y-8">
                    {apiaries.map((apiary) => (
                        <section key={apiary.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                            {/* Apiary Header */}
                            <div className="border-b border-gray-100 p-6 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="bg-amber-100 p-3 rounded-xl text-amber-600 shadow-sm">
                                        <Layers className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">{apiary.name}</h2>
                                        <p className="text-sm text-gray-500 mt-1 font-medium">{apiary.location} • {apiary.colonyCount} samhällen</p>
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border ${apiary.status === 'Bra'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'} shadow-sm`}>
                                    {apiary.status === 'Bra' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                    {apiary.status}
                                </div>
                            </div>

                            {/* Hives Grid */}
                            <div className="p-8">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                                    {apiary.hives.map((hive) => (
                                        <Link href={`/hives/${hive.dbId}`} key={hive.id} className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group flex flex-col">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="font-bold text-gray-900 text-lg">{hive.name}</span>
                                                {/* Status Icon Indicator */}
                                                <div title={hive.strength}>
                                                    {hive.strength === 'Starkt' ? (
                                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                    ) : hive.strength === 'Normalt' ? (
                                                        <Info className="w-5 h-5 text-blue-400" />
                                                    ) : (
                                                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-500 space-y-1.5 flex-1">
                                                <p className="flex justify-between">Styrka: <span className="font-semibold text-gray-800">{hive.strength}</span></p>
                                                <p className="flex justify-between">Varroa: <span className="font-semibold text-gray-800">{hive.varroa}</span></p>
                                            </div>
                                            <p className="pt-3 mt-3 border-t border-gray-100 text-xs text-gray-400 font-medium group-hover:text-amber-600 transition-colors">Tittad: {hive.lastChecked}</p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </section>
                    ))}
                </div>
            </main>
        </div>
    );
}
