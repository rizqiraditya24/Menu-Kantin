'use client';

import { useState, useEffect } from 'react';
import { supabase, Category, Product } from '@/lib/supabase';
import Modal from '@/components/Modal';
import ImageUpload from '@/components/ImageUpload';

export default function ProdukPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        category_id: '',
        description: '',
        price: '',
        image_url: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [productsResult, categoriesResult] = await Promise.all([
                supabase.from('products').select('*, category:categories(*)').order('name'),
                supabase.from('categories').select('*').order('name'),
            ]);

            if (productsResult.data) setProducts(productsResult.data);
            if (categoriesResult.data) setCategories(categoriesResult.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            category_id: categories[0]?.id || '',
            description: '',
            price: '',
            image_url: '',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            category_id: product.category_id,
            description: product.description || '',
            price: product.price.toString(),
            image_url: product.image_url || '',
        });
        setIsModalOpen(true);
    };

    const openViewModal = (product: Product) => {
        setViewingProduct(product);
        setIsViewModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.category_id || !formData.price) return;

        setSaving(true);
        try {
            const productData = {
                name: formData.name.trim(),
                category_id: formData.category_id,
                description: formData.description.trim() || null,
                price: parseFloat(formData.price),
                image_url: formData.image_url || null,
            };

            if (editingProduct) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', editingProduct.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert(productData);

                if (error) throw error;
            }

            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            console.error('Error saving product:', error);
            alert(error.message || 'Gagal menyimpan produk');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (product: Product) => {
        if (!confirm(`Yakin ingin menghapus produk "${product.name}"?`)) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', product.id);

            if (error) throw error;

            fetchData();
        } catch (error: any) {
            console.error('Error deleting product:', error);
            alert(error.message || 'Gagal menghapus produk');
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Produk</h2>
                    <p className="text-gray-600">Kelola produk menu</p>
                </div>
                <button
                    onClick={openAddModal}
                    disabled={categories.length === 0}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-primary-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Tambah Produk
                </button>
            </div>

            {categories.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <p className="text-yellow-800">
                        ⚠️ Anda perlu membuat kategori terlebih dahulu sebelum menambah produk.
                    </p>
                </div>
            )}

            {/* Product Cards (Mobile) / Table (Desktop) */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                {/* Mobile Cards */}
                <div className="block md:hidden divide-y divide-gray-100">
                    {products.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-500">
                            <span className="text-4xl block mb-2">🍜</span>
                            Belum ada produk. Tambahkan produk pertama Anda!
                        </div>
                    ) : (
                        products.map(product => (
                            <div key={product.id} className="p-4">
                                <div className="flex gap-4">
                                    <div className="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl">
                                                🍽️
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
                                        <p className="text-sm text-gray-500">{product.category?.name}</p>
                                        <p className="text-primary-600 font-bold mt-1">{formatPrice(product.price)}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => openViewModal(product)}
                                        className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Lihat
                                    </button>
                                    <button
                                        onClick={() => openEditModal(product)}
                                        className="flex-1 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product)}
                                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg text-sm font-medium transition-colors"
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
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Produk</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Kategori</th>
                                <th className="text-right px-6 py-4 font-semibold text-gray-700">Harga</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-700">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <span className="text-4xl block mb-2">🍜</span>
                                        Belum ada produk. Tambahkan produk pertama Anda!
                                    </td>
                                </tr>
                            ) : (
                                products.map(product => (
                                    <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                                                    {product.image_url ? (
                                                        <img
                                                            src={product.image_url}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-2xl">
                                                            🍽️
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800">{product.name}</p>
                                                    {product.description && (
                                                        <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block bg-secondary-100 text-secondary-700 px-3 py-1 rounded-full text-sm font-medium">
                                                {product.category?.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-primary-600">{formatPrice(product.price)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openViewModal(product)}
                                                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Lihat
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(product)}
                                                    className="bg-secondary-100 hover:bg-secondary-200 text-secondary-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product)}
                                                    className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
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
                title={editingProduct ? 'Edit Produk' : 'Tambah Produk'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nama Produk
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Masukkan nama produk"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kategori
                        </label>
                        <select
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                        >
                            <option value="">Pilih kategori</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Deskripsi
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Masukkan deskripsi produk (opsional)"
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Harga (Rp)
                        </label>
                        <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder="Masukkan harga"
                            min="0"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <ImageUpload
                        currentImageUrl={formData.image_url}
                        onImageUploaded={(url) => setFormData({ ...formData, image_url: url })}
                    />

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
                title="Detail Produk"
            >
                {viewingProduct && (
                    <div className="space-y-4">
                        {viewingProduct.image_url && (
                            <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                                <img
                                    src={viewingProduct.image_url}
                                    alt={viewingProduct.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Nama Produk</label>
                            <p className="text-lg font-semibold text-gray-800">{viewingProduct.name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Kategori</label>
                            <p className="text-gray-800">{viewingProduct.category?.name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Harga</label>
                            <p className="text-xl font-bold text-primary-600">{formatPrice(viewingProduct.price)}</p>
                        </div>
                        {viewingProduct.description && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Deskripsi</label>
                                <p className="text-gray-800">{viewingProduct.description}</p>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Dibuat Pada</label>
                            <p className="text-gray-800">
                                {new Date(viewingProduct.created_at).toLocaleDateString('id-ID', {
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
