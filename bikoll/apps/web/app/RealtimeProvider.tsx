'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Toast {
    id: number;
    message: string;
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const channel = supabase
            .channel('inspections-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'inspections' },
                (payload) => {
                    console.log('[Realtime] New inspection inserted:', payload.new);
                    const toastId = Date.now();
                    setToasts((prev) => [...prev, { id: toastId, message: 'New inspection received' }]);
                    router.refresh();

                    // Auto-dismiss after 5s
                    setTimeout(() => {
                        setToasts((prev) => prev.filter((t) => t.id !== toastId));
                    }, 5000);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [router]);

    return (
        <>
            {children}

            {/* Toast container */}
            <div
                style={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                }}
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        style={{
                            background: 'linear-gradient(135deg, #1a5e1a, #2d8a2d)',
                            color: '#fff',
                            padding: '14px 20px',
                            borderRadius: 10,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                            fontSize: 14,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            animation: 'slideIn 0.3s ease-out',
                        }}
                    >
                        <span>🐝</span>
                        <span>{toast.message}</span>
                        <button
                            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.7)',
                                cursor: 'pointer',
                                marginLeft: 8,
                                fontSize: 16,
                            }}
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </>
    );
}
