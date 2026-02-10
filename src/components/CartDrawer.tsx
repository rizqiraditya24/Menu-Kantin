'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/lib/CartContext';
import { formatPrice } from '@/lib/supabase';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onCheckout: () => void;
}

export default function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
    const { items, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();
    const drawerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                ref={drawerRef}
                className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slideInRight"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🛒</span>
                        <div>
                            <h2 className="text-lg font-bold text-white">Keranjang</h2>
                            <p className="text-white/80 text-xs">{totalItems} item</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white text-2xl font-bold transition-colors"
                    >
                        ×
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {items.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="text-6xl block mb-4">🛒</span>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                Keranjang Kosong
                            </h3>
                            <p className="text-gray-500 text-sm">
                                Tambahkan menu favorit kamu ke keranjang
                            </p>
                        </div>
                    ) : (
                        items.map(item => (
                            <div
                                key={item.product.id}
                                className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                            >
                                <div className="flex gap-3">
                                    {/* Image */}
                                    <div className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
                                        {item.product.image_url ? (
                                            <img
                                                src={item.product.image_url}
                                                alt={item.product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl">
                                                🍽️
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-800 text-sm truncate">
                                            {item.product.name}
                                        </h4>
                                        <p className="text-green-600 font-bold text-sm mt-0.5">
                                            {formatPrice(item.product.price)}
                                        </p>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm flex items-center justify-center transition-colors"
                                            >
                                                −
                                            </button>
                                            <span className="font-semibold text-gray-800 text-sm w-8 text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                className="w-7 h-7 rounded-lg bg-primary-100 hover:bg-primary-200 text-primary-700 font-bold text-sm flex items-center justify-center transition-colors"
                                            >
                                                +
                                            </button>
                                            <span className="ml-auto text-sm font-bold text-gray-800">
                                                {formatPrice(item.product.price * item.quantity)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Remove */}
                                    <button
                                        onClick={() => removeFromCart(item.product.id)}
                                        className="text-red-400 hover:text-red-600 text-lg self-start transition-colors"
                                        title="Hapus"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t border-gray-200 p-4 bg-white space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 font-medium">Total</span>
                            <span className="text-xl font-bold text-green-600">
                                {formatPrice(totalPrice)}
                            </span>
                        </div>
                        <button
                            onClick={onCheckout}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold text-base transition-colors shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                        >
                            <span>📱</span> Selesaikan Pesanan
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
