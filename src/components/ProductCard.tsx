'use client';

import { Product, formatPrice } from '@/lib/supabase';
import { useState } from 'react';

interface ProductCardProps {
    product: Product;
    onViewDetail?: () => void;
    onAddToCart?: (product: Product) => void;
}

export default function ProductCard({ product, onViewDetail, onAddToCart }: ProductCardProps) {
    const [addedAnim, setAddedAnim] = useState(false);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onAddToCart) {
            onAddToCart(product);
            setAddedAnim(true);
            setTimeout(() => setAddedAnim(false), 700);
        }
    };

    return (
        <div
            onClick={onViewDetail}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-secondary-100 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col"
        >
            {/* Image */}
            <div className="relative aspect-[4/3] bg-gradient-to-br from-secondary-100 to-secondary-200 overflow-hidden">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-5xl bg-gray-100">
                        🍽️
                    </div>
                )}
                {/* Price Tag */}
                <div className="absolute bottom-2 right-2 bg-primary-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-md">
                    {formatPrice(product.price)}
                </div>
            </div>

            {/* Content */}
            <div className="p-3 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-800 text-sm sm:text-base leading-tight mb-1 line-clamp-2">
                    {product.name}
                </h3>
                {product.category && (
                    <p className="text-secondary-500 text-xs font-medium mb-1">
                        {product.category.name}
                    </p>
                )}
                {product.description && (
                    <p className="text-gray-500 text-xs sm:text-sm line-clamp-2 leading-snug mb-2">
                        {product.description}
                    </p>
                )}

                {/* Add to Cart Button */}
                <div className="mt-auto pt-2">
                    <button
                        onClick={handleAddToCart}
                        className={`
                            w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-sm
                            transition-all duration-300 active:scale-95
                            ${addedAnim
                                ? 'bg-green-500 text-white shadow-lg shadow-green-200 scale-105'
                                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-200 hover:shadow-lg hover:shadow-primary-300'
                            }
                        `}
                    >
                        {addedAnim ? (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Ditambahkan!</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                                </svg>
                                <span className="hidden sm:inline">+ Keranjang</span>
                                <span className="sm:hidden">+</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
