'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/CartContext';
import { supabase, formatPrice, getSiteSettings } from '@/lib/supabase';
import Modal from './Modal';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
    const { items, totalPrice, clearCart } = useCart();
    const [customerName, setCustomerName] = useState('');
    const [customerNote, setCustomerNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
    const [siteName, setSiteName] = useState('Menu Warung');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
            setSuccess(false);
        }
    }, [isOpen]);

    const fetchSettings = async () => {
        const settings = await getSiteSettings();
        if (settings) {
            setWhatsappNumber(settings.whatsapp_number);
            if (settings.site_name) setSiteName(settings.site_name);
        }
    };

    const formatWhatsAppNumber = (number: string) => {
        // Remove all non-digits
        let clean = number.replace(/\D/g, '');
        // Convert leading 0 to 62 (Indonesia)
        if (clean.startsWith('0')) {
            clean = '62' + clean.substring(1);
        }
        // Add 62 if not already prefixed
        if (!clean.startsWith('62')) {
            clean = '62' + clean;
        }
        return clean;
    };

    const buildWhatsAppMessage = () => {
        let message = `*Pesanan Baru dari ${siteName}*\n\n`;
        message += `*Nama:* ${customerName}\n`;
        message += `*Tanggal:* ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\n\n`;
        message += `*Daftar Pesanan:*\n`;
        message += `${'─'.repeat(25)}\n`;

        items.forEach((item, index) => {
            message += `${index + 1}. ${item.product.name}\n`;
            message += `   ${item.quantity}x ${formatPrice(item.product.price)} = ${formatPrice(item.product.price * item.quantity)}\n`;
        });

        message += `${'─'.repeat(25)}\n`;
        message += `*Total: ${formatPrice(totalPrice)}*\n`;

        if (customerNote) {
            message += `\n*Catatan:* ${customerNote}\n`;
        }

        message += `\nTerima kasih!`;

        return encodeURIComponent(message);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0 || !customerName.trim()) return;

        setIsSubmitting(true);
        try {
            // Save order to database
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    customer_name: customerName.trim(),
                    customer_note: customerNote.trim() || null,
                    total_price: totalPrice,
                    status: 'pending',
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // Save order items
            const orderItems = items.map(item => ({
                order_id: order.id,
                product_id: item.product.id,
                product_name: item.product.name,
                product_price: item.product.price,
                quantity: item.quantity,
                subtotal: item.product.price * item.quantity,
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // Open WhatsApp
            if (whatsappNumber) {
                const waNumber = formatWhatsAppNumber(whatsappNumber);
                const message = buildWhatsAppMessage();
                window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
            }

            setSuccess(true);
            clearCart();
        } catch (error: any) {
            console.error('Error creating order:', error);
            alert('Gagal membuat pesanan: ' + (error.message || 'Terjadi kesalahan'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setCustomerName('');
        setCustomerNote('');
        setSuccess(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Selesaikan Pesanan">
            {success ? (
                <div className="text-center py-6 space-y-4">
                    <span className="text-6xl block">✅</span>
                    <h3 className="text-xl font-bold text-gray-800">Pesanan Berhasil!</h3>
                    <p className="text-gray-600">
                        Pesanan kamu telah dikirim. Silakan konfirmasi via WhatsApp yang telah terbuka.
                    </p>
                    {!whatsappNumber && (
                        <p className="text-yellow-600 text-sm bg-yellow-50 p-3 rounded-xl">
                            ⚠️ Nomor WhatsApp belum diatur di pengaturan. Hubungi admin untuk konfirmasi pesanan.
                        </p>
                    )}
                    <button
                        onClick={handleClose}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-medium transition-colors mt-4"
                    >
                        Tutup
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Order Summary */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <h4 className="font-semibold text-gray-700 mb-3 text-sm">Ringkasan Pesanan</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {items.map(item => (
                                <div key={item.product.id} className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        {item.product.name} x{item.quantity}
                                    </span>
                                    <span className="font-medium text-gray-800">
                                        {formatPrice(item.product.price * item.quantity)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between">
                            <span className="font-bold text-gray-700">Total</span>
                            <span className="font-bold text-green-600 text-lg">
                                {formatPrice(totalPrice)}
                            </span>
                        </div>
                    </div>

                    {/* Customer Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nama Pemesan <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Masukkan nama kamu"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Catatan (opsional)
                        </label>
                        <textarea
                            value={customerNote}
                            onChange={(e) => setCustomerNote(e.target.value)}
                            placeholder="Contoh: tidak pakai sambal, extra nasi, dll"
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* WhatsApp Info */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <p className="text-green-700 text-sm flex items-center gap-2">
                            <span className="text-lg">📱</span>
                            Pesanan akan dikonfirmasi via WhatsApp
                            {whatsappNumber && (
                                <span className="font-semibold">({whatsappNumber})</span>
                            )}
                        </p>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || items.length === 0}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                'Memproses...'
                            ) : (
                                <>
                                    <span>📱</span> Konfirmasi via WA
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
