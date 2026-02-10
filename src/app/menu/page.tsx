'use client';

import { useState, useEffect } from 'react';
import { supabase, Category, Product } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import CategoryCard from '@/components/CategoryCard';
import Modal from '@/components/Modal';

export default function MenuPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch categories with product count
            const { data: categoriesData } = await supabase
                .from('categories')
                .select('*, products(count)')
                .order('name');

            if (categoriesData) {
                const categoriesWithCount = categoriesData.map((cat: any) => ({
                    ...cat,
                    product_count: cat.products?.[0]?.count || 0,
                }));
                setCategories(categoriesWithCount);
            }

            // Fetch products with category
            const { data: productsData } = await supabase
                .from('products')
                .select('*, category:categories(*)')
                .order('name');

            if (productsData) {
                setProducts(productsData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
        const matchesSearch = !searchQuery ||
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-500">Memuat menu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Cari menu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 pl-12 rounded-xl border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
                </div>
            </div>

            {/* Category Filter */}
            <div className="mb-6 overflow-x-auto pb-2">
                <div className="flex gap-2 min-w-max">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`
              px-4 py-2 rounded-full font-medium text-sm transition-all whitespace-nowrap
              ${!selectedCategory
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                                : 'bg-white text-gray-700 hover:bg-secondary-100 border border-secondary-200'
                            }
            `}
                    >
                        Semua
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${!selectedCategory ? 'bg-white/20' : 'bg-secondary-100'
                            }`}>
                            {products.length}
                        </span>
                    </button>
                    {categories.map(category => (
                        <CategoryCard
                            key={category.id}
                            category={category}
                            isActive={selectedCategory === category.id}
                            onClick={() => setSelectedCategory(category.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {filteredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onClick={() => setViewingProduct(product)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">🍽️</span>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Menu Tidak Ditemukan</h3>
                    <p className="text-gray-500">
                        {searchQuery
                            ? `Tidak ada menu yang cocok dengan "${searchQuery}"`
                            : 'Tidak ada menu dalam kategori ini'
                        }
                    </p>
                </div>
            )}

            {/* Product Detail Modal */}
            <Modal
                isOpen={!!viewingProduct}
                onClose={() => setViewingProduct(null)}
                title="Detail Menu"
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
                            <label className="block text-sm font-medium text-gray-500 mb-1">Nama Menu</label>
                            <p className="text-lg font-semibold text-gray-800">{viewingProduct.name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Kategori</label>
                            <span className="inline-block bg-secondary-100 text-secondary-700 px-3 py-1 rounded-full text-sm font-medium">
                                {viewingProduct.category?.name}
                            </span>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Harga</label>
                            <p className="text-2xl font-bold text-primary-600">
                                {new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                }).format(viewingProduct.price)}
                            </p>
                        </div>
                        {viewingProduct.description && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Deskripsi</label>
                                <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    {viewingProduct.description}
                                </p>
                            </div>
                        )}
                        <button
                            onClick={() => setViewingProduct(null)}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-xl font-medium transition-colors mt-6 shadow-lg shadow-primary-200"
                        >
                            Tutup
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
