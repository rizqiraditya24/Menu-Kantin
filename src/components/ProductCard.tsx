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
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-secondary-100 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
        >
            {/* Image */}
            <div className="relative aspect-[4/3] bg-gradient-to-br from-secondary-100 to-secondary-200">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-5xl bg-gray-100">
                        🍽️
                    </div>
                )}
                {/* Price Tag */}
                <div className="absolute bottom-2 right-2 bg-primary-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-md">
                    {formatPrice(product.price)}
                </div>
            </div>

            {/* Content */}
            <div className="p-3">
                <h3 className="font-bold text-gray-800 text-sm sm:text-base leading-tight mb-1 line-clamp-2">
                    {product.name}
                </h3>
                {product.category && (
                    <p className="text-secondary-500 text-xs font-medium mb-1">
                        {product.category.name}
                    </p>
                )}
                {product.description && (
                    <p className="text-gray-500 text-xs sm:text-sm line-clamp-2 leading-snug">
                        {product.description}
                    </p>
                )}
            </div>
        </div>
    );
}
