'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Layers, FileText, Settings, Hexagon } from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-gray-900 text-gray-100 min-h-screen flex flex-col p-4 shadow-xl z-10 relative">
            {/* Logo/Brand */}
            <div className="flex items-center gap-2 mb-10 px-2 mt-4 text-amber-500">
                <Hexagon className="w-8 h-8 fill-amber-500" />
                <span className="text-2xl font-bold tracking-wide text-white">BiKwiq</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                <Link
                    href="/"
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-colors ${pathname === '/'
                            ? 'bg-gray-800 text-amber-400'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-amber-400'
                        }`}
                >
                    <Home className="w-5 h-5" />
                    Dashboard
                </Link>
                <Link
                    href="/hives"
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-colors ${pathname?.startsWith('/hives')
                            ? 'bg-gray-800 text-amber-400'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-amber-400'
                        }`}
                >
                    <Layers className="w-5 h-5" />
                    Bigårdar & Kupor
                </Link>
                <Link
                    href="/journal"
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-colors ${pathname?.startsWith('/journal')
                            ? 'bg-gray-800 text-amber-400'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-amber-400'
                        }`}
                >
                    <FileText className="w-5 h-5" />
                    Läkemedelsjournal
                </Link>
            </nav>

            {/* Footer Nav */}
            <div className="mt-auto border-t border-gray-800 pt-4">
                <Link
                    href="/settings"
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-colors ${pathname?.startsWith('/settings')
                            ? 'bg-gray-800 text-amber-400'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-amber-400'
                        }`}
                >
                    <Settings className="w-5 h-5" />
                    Inställningar
                </Link>
            </div>
        </aside>
    );
}
