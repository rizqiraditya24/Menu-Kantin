'use client';

import { useState, useEffect } from 'react';
import { supabase, Order, OrderItem, formatPrice } from '@/lib/supabase';
import Modal from '@/components/Modal';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; emoji: string }> = {
    pending: { label: 'Menunggu', bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '⏳' },
    confirmed: { label: 'Dikonfirmasi', bg: 'bg-blue-100', text: 'text-blue-700', emoji: '✅' },
    processing: { label: 'Diproses', bg: 'bg-purple-100', text: 'text-purple-700', emoji: '👨‍🍳' },
    completed: { label: 'Selesai', bg: 'bg-green-100', text: 'text-green-700', emoji: '✔️' },
    cancelled: { label: 'Dibatalkan', bg: 'bg-red-100', text: 'text-red-700', emoji: '❌' },
};

const STATUS_ORDER: string[] = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];

export default function PesananPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderItems = async (orderId: string) => {
        setLoadingItems(true);
        try {
            const { data, error } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', orderId)
                .order('id');

            if (error) throw error;
            setOrderItems(data || []);
        } catch (error) {
            console.error('Error fetching order items:', error);
        } finally {
            setLoadingItems(false);
        }
    };

    const handleViewOrder = async (order: Order) => {
        setViewingOrder(order);
        await fetchOrderItems(order.id);
    };

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        setUpdatingStatus(orderId);
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            if (error) throw error;

            // Update local state
            setOrders(prev =>
                prev.map(order =>
                    order.id === orderId ? { ...order, status: newStatus as Order['status'] } : order
                )
            );

            // Update viewing order if applicable
            if (viewingOrder?.id === orderId) {
                setViewingOrder(prev => prev ? { ...prev, status: newStatus as Order['status'] } : null);
            }
        } catch (error: any) {
            console.error('Error updating status:', error);
            alert('Gagal mengupdate status: ' + (error.message || 'Terjadi kesalahan'));
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (!confirm('Yakin ingin menghapus pesanan ini?')) return;

        try {
            // Delete order items first
            await supabase.from('order_items').delete().eq('order_id', orderId);
            // Then delete order
            const { error } = await supabase.from('orders').delete().eq('id', orderId);
            if (error) throw error;

            setOrders(prev => prev.filter(o => o.id !== orderId));
            if (viewingOrder?.id === orderId) {
                setViewingOrder(null);
            }
        } catch (error: any) {
            console.error('Error deleting order:', error);
            alert('Gagal menghapus pesanan: ' + (error.message || 'Terjadi kesalahan'));
        }
    };

    const filteredOrders = statusFilter === 'all'
        ? orders
        : orders.filter(o => o.status === statusFilter);

    const orderCounts = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

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
                    <h2 className="text-2xl font-bold text-gray-800">Pesanan</h2>
                    <p className="text-gray-600">Kelola pesanan dari pelanggan</p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {STATUS_ORDER.map(status => {
                    const config = STATUS_CONFIG[status];
                    return (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                            className={`p-3 rounded-xl border-2 transition-all text-center ${statusFilter === status
                                ? 'border-primary-500 bg-primary-50 shadow-md'
                                : 'border-gray-100 bg-white hover:border-gray-200'
                                }`}
                        >
                            <span className="text-xl">{config.emoji}</span>
                            <p className="text-xs font-medium text-gray-500 mt-1">{config.label}</p>
                            <p className="text-lg font-bold text-gray-800">{orderCounts[status] || 0}</p>
                        </button>
                    );
                })}
            </div>

            {statusFilter !== 'all' && (
                <div className="mb-4 flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                        Filter: <strong>{STATUS_CONFIG[statusFilter]?.label}</strong>
                    </span>
                    <button
                        onClick={() => setStatusFilter('all')}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                        Hapus Filter ✕
                    </button>
                </div>
            )}

            {/* Orders List */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                {/* Mobile Cards */}
                <div className="block md:hidden divide-y divide-gray-100">
                    {filteredOrders.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-500">
                            <span className="text-4xl block mb-2">📋</span>
                            {statusFilter !== 'all' ? 'Tidak ada pesanan dengan status ini' : 'Belum ada pesanan'}
                        </div>
                    ) : (
                        filteredOrders.map(order => {
                            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                            return (
                                <div key={order.id} className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{order.customer_name}</h3>
                                            <p className="text-xs text-gray-500">
                                                {new Date(order.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                        <span className={`${config.bg} ${config.text} px-2.5 py-1 rounded-full text-xs font-medium`}>
                                            {config.emoji} {config.label}
                                        </span>
                                    </div>
                                    <p className="text-green-600 font-bold mb-3">{formatPrice(order.total_price)}</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleViewOrder(order)}
                                            className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Detail
                                        </button>
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                            disabled={updatingStatus === order.id}
                                            className="flex-1 bg-white border border-gray-200 rounded-lg text-sm py-2 px-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            {STATUS_ORDER.map(s => (
                                                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Pelanggan</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Tanggal</th>
                                <th className="text-right px-6 py-4 font-semibold text-gray-700">Total</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-700">Status</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-700">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <span className="text-4xl block mb-2">📋</span>
                                        {statusFilter !== 'all' ? 'Tidak ada pesanan dengan status ini' : 'Belum ada pesanan'}
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => {
                                    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                                    return (
                                        <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-800">{order.customer_name}</p>
                                                {order.customer_note && (
                                                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">📝 {order.customer_note}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(order.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-green-600">{formatPrice(order.total_price)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                                    disabled={updatingStatus === order.id}
                                                    className={`${config.bg} ${config.text} px-3 py-1.5 rounded-full text-sm font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500`}
                                                >
                                                    {STATUS_ORDER.map(s => (
                                                        <option key={s} value={s}>{STATUS_CONFIG[s].emoji} {STATUS_CONFIG[s].label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleViewOrder(order)}
                                                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        Detail
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteOrder(order.id)}
                                                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Detail Modal */}
            <Modal
                isOpen={!!viewingOrder}
                onClose={() => setViewingOrder(null)}
                title="Detail Pesanan"
            >
                {viewingOrder && (
                    <div className="space-y-4">
                        {/* Customer Info */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">Pelanggan</label>
                                    <p className="font-semibold text-gray-800">{viewingOrder.customer_name}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">Status</label>
                                    <span className={`inline-block mt-0.5 ${STATUS_CONFIG[viewingOrder.status]?.bg} ${STATUS_CONFIG[viewingOrder.status]?.text} px-2.5 py-1 rounded-full text-xs font-medium`}>
                                        {STATUS_CONFIG[viewingOrder.status]?.emoji} {STATUS_CONFIG[viewingOrder.status]?.label}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">Tanggal</label>
                                    <p className="text-sm text-gray-700">
                                        {new Date(viewingOrder.created_at).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">Total</label>
                                    <p className="font-bold text-green-600 text-lg">{formatPrice(viewingOrder.total_price)}</p>
                                </div>
                            </div>
                            {viewingOrder.customer_note && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <label className="block text-xs font-medium text-gray-500">Catatan</label>
                                    <p className="text-sm text-gray-700 mt-1">📝 {viewingOrder.customer_note}</p>
                                </div>
                            )}
                        </div>

                        {/* Order Items */}
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-3 text-sm">Daftar Produk</h4>
                            {loadingItems ? (
                                <div className="flex items-center justify-center py-6">
                                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {orderItems.map(item => (
                                        <div key={item.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3">
                                            <div>
                                                <p className="font-medium text-gray-800 text-sm">{item.product_name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {item.quantity}x {formatPrice(item.product_price)}
                                                </p>
                                            </div>
                                            <span className="font-bold text-gray-800 text-sm">
                                                {formatPrice(item.subtotal)}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                        <span className="font-bold text-gray-700">Total</span>
                                        <span className="font-bold text-green-600 text-lg">
                                            {formatPrice(viewingOrder.total_price)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Update Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                            <div className="flex flex-wrap gap-2">
                                {STATUS_ORDER.map(status => {
                                    const config = STATUS_CONFIG[status];
                                    const isActive = viewingOrder.status === status;
                                    return (
                                        <button
                                            key={status}
                                            onClick={() => handleUpdateStatus(viewingOrder.id, status)}
                                            disabled={updatingStatus === viewingOrder.id || isActive}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive
                                                ? `${config.bg} ${config.text} ring-2 ring-offset-1 ring-primary-500`
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                } disabled:opacity-50`}
                                        >
                                            {config.emoji} {config.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            onClick={() => setViewingOrder(null)}
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
