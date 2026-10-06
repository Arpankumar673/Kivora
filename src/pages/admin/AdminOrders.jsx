import React, { useState, useEffect } from 'react';
import { adminFetchOrders, adminUpdateOrderStatus } from '../../services/adminService';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatters';
import { Search, Eye, Loader2, X, Clock, MapPin, Package, CheckCircle2, AlertCircle, Radio } from 'lucide-react';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Order Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetchOrders({ status: statusFilter, search: searchQuery });
      setOrders(data);
    } catch (err) {
      console.error('Failed to load admin orders:', err);
      setError(err.message || 'Failed to fetch orders list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    // Supabase Realtime channel subscription for live order updates
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.info('Realtime order update event:', payload);
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter, searchQuery]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const updated = await adminUpdateOrderStatus(orderId, newStatus);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated);
      }
      await loadOrders();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(err.message || 'Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Delivered</span>;
      case 'SHIPPED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">Shipped</span>;
      case 'PROCESSING':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">Processing</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">Confirmed</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Pending</span>;
    }
  };

  const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  return (
    <div className="space-y-6">
      {/* Header with Realtime Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Order Fulfillment Management</h1>
          <p className="text-gray-500 text-xs mt-0.5">View customer orders, filter status, and update fulfillment lifecycles</p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-semibold self-start sm:self-auto">
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
          <span>Realtime Listener Active</span>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID or Customer Name..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
          >
            <option value="">All Order Statuses</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
            <p className="text-gray-500 text-xs">Loading customer orders...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-xs font-semibold">{error}</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">No orders found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Status Update</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const createdDate = new Date(order.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{order.id.slice(0, 8)}...</td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {order.shipping_address?.full_name || order.profiles?.full_name || 'Customer'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">{createdDate}</td>
                      <td className="py-3.5 px-4 text-gray-700">{order.order_items?.length || 0} item(s)</td>
                      <td className="py-3.5 px-4 font-extrabold text-gray-900">{formatCurrency(order.total_amount)}</td>
                      <td className="py-3.5 px-4">
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="px-2.5 py-1 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg font-semibold flex items-center justify-end gap-1 transition ml-auto"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Admin Order Fulfillment View</h3>
                <p className="text-xs text-gray-500 font-mono">ID: {selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Update Control Bar */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-gray-700">Current Status</p>
                <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Update Status:</span>
                <select
                  value={selectedOrder.status}
                  disabled={updatingId === selectedOrder.id}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Line Item Snapshots</h4>
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                {selectedOrder.order_items?.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-900">{item.product_name}</p>
                      <p className="text-[11px] text-gray-500">Unit Price: {formatCurrency(item.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{item.quantity}x</p>
                      <p className="font-extrabold text-sky-600">{formatCurrency(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2 flex justify-between font-extrabold text-sm text-gray-900">
                <span>Order Total:</span>
                <span className="text-sky-600">{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
            </div>

            {/* Shipping Address */}
            {selectedOrder.shipping_address && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 space-y-1">
                <p className="font-bold text-gray-900">Shipping Recipient:</p>
                <p className="font-medium">{selectedOrder.shipping_address.full_name} ({selectedOrder.shipping_address.phone})</p>
                <p>{selectedOrder.shipping_address.address_line1} {selectedOrder.shipping_address.address_line2}</p>
                <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.postal_code}, {selectedOrder.shipping_address.country}</p>
              </div>
            )}

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
