import Sidebar from '../../components/layout/Sidebar';
import { Settings, User, Bell, Shield, Database } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2 flex items-center gap-3">
                        <Settings className="w-8 h-8 text-amber-500" />
                        Inställningar
                    </h1>
                    <p className="text-gray-500 text-lg">Hantera ditt konto, synkronisering och app-preferenser.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Settings Nav Area */}
                    <div className="md:col-span-1 space-y-1.5">
                        <button className="w-full text-left px-5 py-3.5 bg-white rounded-xl font-bold text-amber-600 shadow-md border border-amber-100 flex items-center gap-3">
                            <User className="w-5 h-5 text-amber-500" />
                            Kontouppgifter
                        </button>
                        <button className="w-full text-left px-5 py-3.5 rounded-xl font-bold text-gray-600 hover:bg-slate-100 flex items-center gap-3 transition-colors">
                            <Database className="w-5 h-5 text-gray-400" />
                            Data & Synk
                        </button>
                        <button className="w-full text-left px-5 py-3.5 rounded-xl font-bold text-gray-600 hover:bg-slate-100 flex items-center gap-3 transition-colors">
                            <Bell className="w-5 h-5 text-gray-400" />
                            Notiser
                        </button>
                        <button className="w-full text-left px-5 py-3.5 rounded-xl font-bold text-gray-600 hover:bg-slate-100 flex items-center gap-3 transition-colors">
                            <Shield className="w-5 h-5 text-gray-400" />
                            Säkerhet
                        </button>
                    </div>

                    {/* Settings Content Area */}
                    <div className="md:col-span-3">
                        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 sm:p-10">
                            <h2 className="text-2xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-100">Kontouppgifter</h2>

                            <form className="space-y-6 max-w-lg">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Förnamn</label>
                                        <input type="text" defaultValue="Anders" className="w-full bg-slate-50 border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm font-medium transition-shadow" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Efternamn</label>
                                        <input type="text" defaultValue="Biodlare" className="w-full bg-slate-50 border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm font-medium transition-shadow" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">E-postadress</label>
                                    <input type="email" defaultValue="anders@biodling.se" className="w-full bg-slate-50 border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm font-medium transition-shadow" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Biodlarkod (CBD-nr)</label>
                                    <input type="text" defaultValue="SE-123456" className="w-full bg-slate-50 border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm font-medium font-mono text-gray-800 transition-shadow" />
                                    <p className="text-sm text-gray-500 mt-2 font-medium">Ditt unika nummer hos Jordbruksverket. Används vid PDF-export.</p>
                                </div>

                                <div className="pt-8 mt-8 border-t border-gray-100">
                                    <button type="button" className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3 rounded-lg transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-amber-500/20">
                                        Spara ändringar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
