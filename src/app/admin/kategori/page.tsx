'use client';

import { useState, useEffect } from 'react';
import { supabase, Category } from '@/lib/supabase';
import Modal from '@/components/Modal';

export default function KategoriPage() {
    const [categories, setCategories] = useState<(Category & { product_count: number })[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [viewingCategory, setViewingCategory] = useState<(Category & { product_count: number }) | null>(null);
    const [formData, setFormData] = useState({ name: '' });
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*, products(count)')
                .order('name');

            if (error) throw error;

            const categoriesWithCount = data?.map((cat: any) => ({
                ...cat,
                product_count: cat.products?.[0]?.count || 0,
            })) || [];

            setCategories(categoriesWithCount);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingCategory(null);
        setFormData({ name: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setFormData({ name: category.name });
        setIsModalOpen(true);
    };

    const openViewModal = (category: Category & { product_count: number }) => {
        setViewingCategory(category);
        setIsViewModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setSaving(true);
        try {
            if (editingCategory) {
                const { error } = await supabase
                    .from('categories')
                    .update({ name: formData.name.trim() })
                    .eq('id', editingCategory.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('categories')
                    .insert({ name: formData.name.trim() });

                if (error) throw error;
            }

            setIsModalOpen(false);
            fetchCategories();
        } catch (error: any) {
            console.error('Error saving category:', error);
            alert(error.message || 'Gagal menyimpan kategori');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (category: Category & { product_count: number }) => {
        if (category.product_count > 0) {
            alert(`Tidak dapat menghapus kategori "${category.name}" karena masih memiliki ${category.product_count} produk.`);
            return;
        }

        if (!confirm(`Yakin ingin menghapus kategori "${category.name}"?`)) return;

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', category.id);

            if (error) throw error;

            fetchCategories();
        } catch (error: any) {
            console.error('Error deleting category:', error);
            alert(error.message || 'Gagal menghapus kategori');
        }
    };

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Kategori</h2>
                    <p className="text-gray-600">Kelola kategori produk</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-primary-200"
                >
                    Tambah Kategori
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Cari kategori..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                {/* Mobile Cards */}
                <div className="block md:hidden divide-y divide-gray-100">
                    {filteredCategories.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-500">
                            <span className="text-4xl block mb-2">📁</span>
                            {searchTerm ? 'Tidak ada kategori yang cocok' : 'Belum ada kategori. Tambahkan kategori pertama Anda!'}
                        </div>
                    ) : (
                        filteredCategories.map(category => (
                            <div key={category.id} className="p-4">
                                <div className="flex gap-4 items-center">
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h3 className="font-semibold text-gray-800 truncate text-lg">{category.name}</h3>
                                        <p className="text-sm text-gray-500">{category.product_count} produk</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => openViewModal(category)}
                                        className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        Lihat
                                    </button>
                                    <button
                                        onClick={() => openEditModal(category)}
                                        className="flex-1 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category)}
                                        disabled={category.product_count > 0}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${category.product_count > 0
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-red-100 hover:bg-red-200 text-red-700'
                                            }`}
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Nama Kategori</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-700">Jumlah Produk</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-700">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                        <span className="text-4xl block mb-2">📁</span>
                                        {searchTerm ? 'Tidak ada kategori yang cocok' : 'Belum ada kategori. Tambahkan kategori pertama Anda!'}
                                    </td>
                                </tr>
                            ) : (
                                filteredCategories.map(category => (
                                    <tr key={category.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-gray-800">{category.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center bg-secondary-100 text-secondary-700 px-3 py-1 rounded-full text-sm font-medium">
                                                {category.product_count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openViewModal(category)}
                                                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Lihat
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(category)}
                                                    className="bg-secondary-100 hover:bg-secondary-200 text-secondary-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category)}
                                                    disabled={category.product_count > 0}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${category.product_count > 0
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-red-100 hover:bg-red-200 text-red-700'
                                                        }`}
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nama Kategori
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ name: e.target.value })}
                            placeholder="Masukkan nama kategori"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* View Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Detail Kategori"
            >
                {viewingCategory && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Nama Kategori</label>
                            <p className="text-lg font-semibold text-gray-800">{viewingCategory.name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Jumlah Produk</label>
                            <p className="text-lg font-semibold text-gray-800">{viewingCategory.product_count} produk</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Dibuat Pada</label>
                            <p className="text-gray-800">
                                {new Date(viewingCategory.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsViewModalOpen(false)}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium transition-colors mt-4"
                        >
                            Tutup
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
