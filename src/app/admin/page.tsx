'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Stats {
    totalCategories: number;
    totalProducts: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({ totalCategories: 0, totalProducts: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [categoriesResult, productsResult] = await Promise.all([
                supabase.from('categories').select('*', { count: 'exact', head: true }),
                supabase.from('products').select('*', { count: 'exact', head: true }),
            ]);

            setStats({
                totalCategories: categoriesResult.count || 0,
                totalProducts: productsResult.count || 0,
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
                <p className="text-gray-600">Selamat datang di Admin Panel Menu Warung</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/80 text-sm font-medium">Total Kategori</p>
                            <p className="text-4xl font-bold mt-1">{stats.totalCategories}</p>
                        </div>
                        <span className="text-5xl opacity-80">📁</span>
                    </div>
                    <Link
                        href="/admin/kategori"
                        className="inline-block mt-4 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Kelola Kategori
                    </Link>
                </div>

                <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/80 text-sm font-medium">Total Produk</p>
                            <p className="text-4xl font-bold mt-1">{stats.totalProducts}</p>
                        </div>
                        <span className="text-5xl opacity-80">🍜</span>
                    </div>
                    <Link
                        href="/admin/produk"
                        className="inline-block mt-4 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Kelola Produk
                    </Link>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Aksi Cepat</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link
                        href="/admin/kategori"
                        className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                        <span className="text-2xl">➕</span>
                        <div>
                            <p className="font-medium text-gray-800">Tambah Kategori</p>
                            <p className="text-sm text-gray-500">Buat kategori baru</p>
                        </div>
                    </Link>
                    <Link
                        href="/admin/produk"
                        className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-secondary-300 hover:bg-secondary-50 transition-colors"
                    >
                        <span className="text-2xl">➕</span>
                        <div>
                            <p className="font-medium text-gray-800">Tambah Produk</p>
                            <p className="text-sm text-gray-500">Buat produk baru</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
