import { Hash, Activity, Bug } from 'lucide-react';

export default function KPICards() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Card 1 */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 flex items-center justify-between hover:shadow-lg transition-shadow">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Totalt antal samhällen</p>
                    <p className="text-4xl font-bold text-gray-900">24</p>
                </div>
                <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
                    <Hash className="w-7 h-7" />
                </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 flex items-center justify-between hover:shadow-lg transition-shadow">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Loggade behandlingar 2026</p>
                    <p className="text-4xl font-bold text-gray-900">8</p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl text-forest-700 text-green-700">
                    <Activity className="w-7 h-7" />
                </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 flex items-center justify-between hover:shadow-lg transition-shadow">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Genomsnittligt varroa-tal</p>
                    <p className="text-4xl font-bold text-gray-900">1.2%</p>
                </div>
                <div className="bg-red-50 p-3 rounded-xl text-red-500">
                    <Bug className="w-7 h-7" />
                </div>
            </div>
        </div>
    );
}
