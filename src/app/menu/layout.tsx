'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CartProvider } from '@/lib/CartContext';
import { getSiteSettings, SiteSettings } from '@/lib/supabase';

const SETTINGS_CACHE_KEY = 'menu_kantin_settings';

function MenuHeader() {
    const [settings, setSettings] = useState<SiteSettings | null>(null);

    useEffect(() => {
        // Load from cache first to avoid flicker if possible
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
            if (cached) {
                try {
                    setSettings(JSON.parse(cached));
                } catch (e) {
                    console.error('Error parsing cached settings:', e);
                }
            }
        }

        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        const s = await getSiteSettings();
        if (s) {
            setSettings(s);
            // Cache the new settings
            localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(s));
        }
    };

    const siteName = settings?.site_name || 'Menu Warung';
    const slogan = settings?.slogan || 'Makanan Enak & Terjangkau';

    return (
        <header className="sticky top-0 z-40 bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 shadow-lg">
            <div className="container mx-auto px-5 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {settings?.logo_url ? (
                            <img
                                src={settings.logo_url}
                                alt={siteName}
                                className="w-10 h-10 rounded-xl object-cover border-2 border-white/30"
                            />
                        ) : (
                            <span className="text-3xl">🍜</span>
                        )}
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-white">
                                {siteName}
                            </h1>
                            <p className="text-xs text-white/80 hidden sm:block">
                                {slogan}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/admin"
                        className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors backdrop-blur-sm"
                    >
                        Admin
                    </Link>
                </div>
            </div>
        </header>
    );
}

export default function MenuLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <CartProvider>
            <div className="min-h-screen flex flex-col">
                <MenuHeader />

                {/* Main Content */}
                <main className="flex-grow container mx-auto px-5 sm:px-6 lg:px-8 py-8">
                    {children}
                </main>

                {/* Footer */}
                <footer className="bg-gray-900 text-white py-6 mt-auto">
                    <div className="container mx-auto px-5 sm:px-6 lg:px-8 text-center">
                        <p className="text-gray-400 text-sm">
                            © 2026 Menu Warung. Made with ❤️
                        </p>
                    </div>
                </footer>
            </div>
        </CartProvider>
    );
}
