import { FileText, Download, ShieldCheck } from 'lucide-react';

export default function DocumentSection() {
    return (
        <div className="bg-white rounded-xl border-t-4 border-t-forest-600 border-green-600 shadow-md relative overflow-hidden">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <ShieldCheck className="w-7 h-7 text-green-600" />
                    <h2 className="text-xl font-bold text-gray-900">Läkemedelsjournal</h2>
                </div>

                <p className="text-gray-600 text-sm mb-6 max-w-sm leading-relaxed">
                    Enligt Jordbruksverkets regler måste alla behandlingar av bisamhällen dokumenteras.
                    Här kan du generera en komplett PDF-rapport baserad på dina senaste AI-loggar.
                </p>

                <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-600">Behandlingar i år:</span>
                        <span className="font-bold text-green-700">8 loggade</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-2">
                        <span className="font-medium text-gray-600">Senaste uppdatering:</span>
                        <span className="text-gray-500">Idag, 14:30</span>
                    </div>
                </div>

                <button className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm">
                    <Download className="w-5 h-5" />
                    Exportera Journal (PDF)
                </button>
            </div>

            {/* Decorative background element, light subtle */}
            <div className="absolute top-[-20px] right-[-20px] opacity-5 pointer-events-none">
                <FileText className="w-48 h-48 text-green-600" />
            </div>
        </div>
    );
}
