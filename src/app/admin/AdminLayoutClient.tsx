'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase, getSiteSettings } from '@/lib/supabase';

interface AdminLayoutClientProps {
    initialSettings: { logo_url: string | null; site_name: string };
    children: ReactNode;
}

export default function AdminLayoutClient({
    initialSettings,
    children,
}: AdminLayoutClientProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loginError, setLoginError] = useState('');
    const [user, setUser] = useState<any>(null);
    const [settings, setSettings] = useState(initialSettings);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const freshData = await getSiteSettings();
                if (freshData) {
                    const newSettings = {
                        logo_url: freshData.logo_url || null,
                        site_name: freshData.site_name || 'Pesan Warung'
                    };
                    setSettings(newSettings);
                    localStorage.setItem('siteSettings', JSON.stringify(newSettings));
                }
            } catch (error) {
                console.error('Error fetching fresh settings:', error);
            }
        };

        // Listen for updates from pengaturan page
        window.addEventListener('siteSettingsUpdated', loadSettings);

        checkUser();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('siteSettingsUpdated', loadSettings);
        };
    }, []);

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const checkUser = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
        } catch (error) {
            console.error('Error checking session:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setLoginError(error.message === 'Invalid login credentials'
                    ? 'Email atau password salah'
                    : error.message);
            }
        } catch (error: any) {
            setLoginError('Terjadi kesalahan saat login');
            console.error('Login error:', error);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/menu');
    };

    const navItems = [
        { href: '/admin', label: 'Dashboard', emoji: '📊' },
        { href: '/admin/kategori', label: 'Kategori', emoji: '📁' },
        { href: '/admin/produk', label: 'Produk', emoji: '🍜' },
        { href: '/admin/pesanan', label: 'Pesanan', emoji: '📋' },
        { href: '/admin/pengaturan', label: 'Pengaturan', emoji: '⚙️' },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    // Login form
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 flex items-center justify-center p-5">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fadeIn">
                    <div className="text-center mb-8">
                        {settings.logo_url ? (
                            <img src={settings.logo_url} alt="Logo" className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 bg-gray-50 border-2 border-gray-100" />
                        ) : (
                            <span className="text-5xl block mb-4">🍜</span>
                        )}
                        <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
                        <p className="text-gray-500 text-sm ">{settings.site_name}</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {loginError && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                                {loginError}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@email.com"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan password"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-12"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xl hover:scale-110 transition-transform focus:outline-none"
                                    title={showPassword ? "Sembunyikan password" : "Lihat password"}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-xl font-medium transition-colors"
                        >
                            Masuk
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            href="/menu"
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                            ← Kembali ke Menu
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo & Site Name */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {settings.logo_url ? (
                                <img src={settings.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-cover bg-gray-50 border border-gray-200" />
                            ) : (
                                <span className="text-xl sm:text-2xl">🍜</span>
                            )}
                            <div>
                                <h1 className="text-base sm:text-lg font-bold text-gray-800 leading-tight">Admin Panel</h1>
                                <p className="text-[10px] sm:text-xs text-gray-500 hidden xs:block">{settings.site_name}</p>
                            </div>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center gap-3">
                            <Link
                                href="/menu"
                                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                            >
                                Lihat Menu
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Logout
                            </button>
                        </div>

                        {/* Mobile Burger Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <span className="text-2xl">☰</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden animate-fadeIn">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setMobileMenuOpen(false)}
                    ></div>

                    {/* Drawer */}
                    <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-2xl p-5 flex flex-col animate-slideInRight">
                        <div className="flex justify-between items-center mb-6">
                            <span className="font-bold text-lg text-gray-800">Menu Admin</span>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                            >
                                ✕
                            </button>
                        </div>

                        <nav className="flex-1 space-y-2 overflow-y-auto">
                            {navItems.map(item => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                                        ${pathname === item.href
                                            ? 'bg-primary-50 text-primary-700 border border-primary-100'
                                            : 'text-gray-600 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    <span className="text-xl">{item.emoji}</span>
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                            <Link
                                href="/menu"
                                className="flex items-center justify-center gap-2 w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                            >
                                🍽️ Lihat Menu
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                            >
                                🚪 Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Navigation */}
            <nav className="hidden md:block bg-white border-b border-gray-200">
                <div className="container mx-auto px-5 sm:px-6 lg:px-8">
                    <div className="flex gap-1 overflow-x-auto py-3">
                        {navItems.map(item => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                                    ${pathname === item.href
                                        ? 'bg-primary-100 text-primary-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }
                                `}
                            >
                                <span>{item.emoji}</span>
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 min-h-[calc(100vh-12rem)]">
                    {children}
                </div>
            </main>
        </div>
    );
}
