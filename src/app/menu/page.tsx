'use client';

import { useState, useEffect } from 'react';
import { supabase, Category, Product, formatPrice, getSiteSettings, SiteSettings } from '@/lib/supabase';
import { useCart } from '@/lib/CartContext';
import ProductCard from '@/components/ProductCard';
import Modal from '@/components/Modal';
import CartDrawer from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';

export default function MenuPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

    const { addToCart, totalItems } = useCart();

    useEffect(() => {
        fetchData();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('#category-dropdown-wrapper')) {
                setIsCategoryDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch categories with active product count
            const { data: catsWithProducts } = await supabase
                .from('categories')
                .select('*, products!inner(count)')
                .eq('is_active', true)
                .eq('products.is_active', true)
                .order('name');

            const { data: allActiveCats } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (allActiveCats) {
                const countMap: Record<string, number> = {};
                catsWithProducts?.forEach((cat: any) => {
                    countMap[cat.id] = cat.products?.[0]?.count || 0;
                });

                const categoriesWithCount = allActiveCats.map((cat: any) => ({
                    ...cat,
                    product_count: countMap[cat.id] || 0,
                }));
                setCategories(categoriesWithCount);
            }

            // Fetch products with category
            const { data: productsData } = await supabase
                .from('products')
                .select('*, category:categories(*)')
                .eq('is_active', true)
                .order('name');

            if (productsData) {
                setProducts(productsData);
            }

            // Fetch site settings
            const settings = await getSiteSettings();
            if (settings) setSiteSettings(settings);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCategory = (categoryId: string) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const removeCategory = (categoryId: string) => {
        setSelectedCategories(prev => prev.filter(id => id !== categoryId));
    };

    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category_id);
        const matchesSearch = !searchQuery ||
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleAddToCart = (product: Product) => {
        addToCart(product);
    };

    const handleCheckout = () => {
        setIsCartOpen(false);
        setIsCheckoutOpen(true);
    };

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
            {/* Search & Category Filter Card */}
            <div className="mb-4 bg-white rounded-xl shadow-sm border border-secondary-200 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Cari menu..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2.5 pl-11 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 text-sm"
                        />
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">🔍</span>
                    </div>

                    {/* Category Dropdown */}
                    <div className="relative sm:w-1/2" id="category-dropdown-wrapper">
                        <button
                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                            className="w-full px-4 py-2.5 pr-9 rounded-lg border border-secondary-200 bg-gray-50 text-sm font-medium text-gray-700 text-left cursor-pointer transition-all hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            {selectedCategories.length === 0
                                ? 'Semua Kategori'
                                : `${selectedCategories.length} kategori dipilih`
                            }
                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}>▾</span>
                        </button>

                        {/* Dropdown Menu */}
                        {isCategoryDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-lg border border-secondary-200 shadow-lg z-20 overflow-hidden animate-fadeIn">
                                <div className="max-h-56 overflow-y-auto">
                                    {categories.map(category => (
                                        <label
                                            key={category.id}
                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary-50 cursor-pointer transition-colors text-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(category.id)}
                                                onChange={() => toggleCategory(category.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                            />
                                            <span className="flex-1 font-medium text-gray-700">{category.name}</span>
                                            {category.product_count !== undefined && (
                                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{category.product_count}</span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                                {selectedCategories.length > 0 && (
                                    <div className="border-t border-secondary-100 px-4 py-2">
                                        <button
                                            onClick={() => setSelectedCategories([])}
                                            className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                                        >
                                            Reset Filter
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Selected Category Tags */}
                {selectedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-secondary-100">
                        {selectedCategories.map(catId => {
                            const cat = categories.find(c => c.id === catId);
                            if (!cat) return null;
                            return (
                                <span
                                    key={catId}
                                    className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-medium border border-primary-100 transition-all hover:bg-primary-100"
                                >
                                    {cat.name}
                                    <button
                                        onClick={() => removeCategory(catId)}
                                        className="text-primary-400 hover:text-primary-600 transition-colors ml-0.5"
                                    >
                                        ✕
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {filteredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onViewDetail={() => setViewingProduct(product)}
                            onAddToCart={handleAddToCart}
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

            {/* Floating Cart Button */}
            {totalItems > 0 && (
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white w-16 h-16 rounded-full shadow-2xl shadow-primary-400 flex items-center justify-center text-2xl transition-all hover:scale-110 z-30 animate-fadeIn"
                >
                    🛒
                    <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                        {totalItems}
                    </span>
                </button>
            )}

            {/* Product Detail Modal */}
            <Modal
                isOpen={!!viewingProduct}
                onClose={() => setViewingProduct(null)}
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
                            <p className="text-2xl font-bold text-green-600">
                                {formatPrice(viewingProduct.price)}
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
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setViewingProduct(null)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium transition-colors"
                            >
                                Tutup
                            </button>
                            <button
                                onClick={() => {
                                    handleAddToCart(viewingProduct);
                                    setViewingProduct(null);
                                }}
                                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-primary-200"
                            >
                                + Keranjang
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Cart Drawer */}
            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                onCheckout={handleCheckout}
            />

            {/* Checkout Modal */}
            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
            />
        </div>
    );
}
