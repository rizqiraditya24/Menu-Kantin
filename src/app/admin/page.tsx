'use client';

import { useState, useEffect } from 'react';
import { supabase, formatPrice } from '@/lib/supabase';
import Link from 'next/link';

interface Stats {
    totalCategories: number;
    totalProducts: number;
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({
        totalCategories: 0,
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [categoriesResult, productsResult, ordersResult, pendingResult] = await Promise.all([
                supabase.from('categories').select('*', { count: 'exact', head: true }),
                supabase.from('products').select('*', { count: 'exact', head: true }),
                supabase.from('orders').select('*', { count: 'exact', head: true }),
                supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            ]);

            // Calc revenue from completed orders
            const { data: completedOrders } = await supabase
                .from('orders')
                .select('total_price')
                .eq('status', 'completed');

            const totalRevenue = completedOrders?.reduce((sum: number, o: { total_price: number }) => sum + (o.total_price || 0), 0) || 0;

            setStats({
                totalCategories: categoriesResult.count || 0,
                totalProducts: productsResult.count || 0,
                totalOrders: ordersResult.count || 0,
                pendingOrders: pendingResult.count || 0,
                totalRevenue,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h2>
                <p className="text-gray-600">Selamat datang di Admin Panel</p>
            </div>

            {/* Pending Orders Alert */}
            {stats.pendingOrders > 0 && (
                <Link href="/admin/pesanan" className="block mb-6">
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="bg-yellow-100 p-3 rounded-xl">
                            <span className="text-3xl">⏳</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-yellow-800 text-lg">{stats.pendingOrders} Pesanan Menunggu</h3>
                            <p className="text-yellow-600 text-sm">Pesanan baru perlu dikonfirmasi</p>
                        </div>
                        <span className="text-yellow-400 text-2xl hidden sm:block">→</span>
                    </div>
                </Link>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                <Link href="/admin/kategori" className="block bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-white/80 text-xs sm:text-sm font-medium">Total Kategori</p>
                            <p className="text-2xl sm:text-4xl font-bold mt-1">{stats.totalCategories}</p>
                        </div>
                        <span className="hidden sm:block text-3xl sm:text-5xl opacity-80 shrink-0">📁</span>
                    </div>
                    <p className="text-white/70 text-[10px] sm:text-xs mt-2 sm:mt-3">Kategori menu aktif</p>
                </Link>

                <Link href="/admin/produk" className="block bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-white/80 text-xs sm:text-sm font-medium">Total Produk</p>
                            <p className="text-2xl sm:text-4xl font-bold mt-1">{stats.totalProducts}</p>
                        </div>
                        <span className="hidden sm:block text-3xl sm:text-5xl opacity-80 shrink-0">🍜</span>
                    </div>
                    <p className="text-white/70 text-[10px] sm:text-xs mt-2 sm:mt-3">Item menu tersedia</p>
                </Link>

                <Link href="/admin/pesanan" className="block bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-white/80 text-xs sm:text-sm font-medium">Total Pesanan</p>
                            <p className="text-2xl sm:text-4xl font-bold mt-1">{stats.totalOrders}</p>
                        </div>
                        <span className="hidden sm:block text-3xl sm:text-5xl opacity-80 shrink-0">📋</span>
                    </div>
                    <p className="text-white/70 text-[10px] sm:text-xs mt-2 sm:mt-3">Semua riwayat pesanan</p>
                </Link>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-white/80 text-xs sm:text-sm font-medium">Pendapatan</p>
                            <p className="text-lg sm:text-2xl font-bold mt-1">{formatPrice(stats.totalRevenue)}</p>
                        </div>
                        <span className="hidden sm:block text-3xl sm:text-5xl opacity-80 shrink-0">💰</span>
                    </div>
                    <p className="text-white/70 text-[10px] sm:text-xs mt-2 sm:mt-3">Dari pesanan selesai</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Aksi Cepat</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    <Link
                        href="/admin/kategori"
                        className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 p-3 sm:p-4 rounded-xl border border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50 transition-colors text-center sm:text-left"
                    >
                        <span className="text-xl sm:text-2xl">➕</span>
                        <div>
                            <p className="font-medium text-gray-800 text-xs sm:text-base">Tambah Kategori</p>
                            <p className="text-[10px] sm:text-sm text-gray-500 hidden sm:block">Buat kategori baru</p>
                        </div>
                    </Link>
                    <Link
                        href="/admin/produk"
                        className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 p-3 sm:p-4 rounded-xl border border-gray-200 bg-white hover:border-secondary-300 hover:bg-secondary-50 transition-colors text-center sm:text-left"
                    >
                        <span className="text-xl sm:text-2xl">➕</span>
                        <div>
                            <p className="font-medium text-gray-800 text-xs sm:text-base">Tambah Produk</p>
                            <p className="text-[10px] sm:text-sm text-gray-500 hidden sm:block">Buat produk baru</p>
                        </div>
                    </Link>
                    <Link
                        href="/admin/pesanan"
                        className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 p-3 sm:p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-colors text-center sm:text-left"
                    >
                        <span className="text-xl sm:text-2xl">📋</span>
                        <div>
                            <p className="font-medium text-gray-800 text-xs sm:text-base">Lihat Pesanan</p>
                            <p className="text-[10px] sm:text-sm text-gray-500 hidden sm:block">Kelola pesanan masuk</p>
                        </div>
                    </Link>
                    <Link
                        href="/admin/pengaturan"
                        className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 p-3 sm:p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50 transition-colors text-center sm:text-left"
                    >
                        <span className="text-xl sm:text-2xl">⚙️</span>
                        <div>
                            <p className="font-medium text-gray-800 text-xs sm:text-base">Pengaturan</p>
                            <p className="text-[10px] sm:text-sm text-gray-500 hidden sm:block">Atur informasi situs</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
