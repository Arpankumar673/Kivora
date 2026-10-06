import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../services/orderService';
import { formatCurrency } from '../utils/formatters';
import { Package, Clock, ArrowRight, Loader2, AlertCircle, CheckCircle2, ShoppingBag } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchOrders();
        if (isMounted) setOrders(data);
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load order history.');
          setOrders([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Delivered</span>;
      case 'SHIPPED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">Shipped</span>;
      case 'PROCESSING':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">Processing</span>;
      case 'CONFIRMED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Confirmed</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">Cancelled</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3 bg-white rounded-2xl border border-gray-200">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Fetching order history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm max-w-xl mx-auto my-8">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>{error}</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-8 bg-white border border-gray-200 rounded-2xl text-center space-y-5 shadow-sm max-w-2xl mx-auto my-8">
        <div className="w-20 h-20 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center shadow-inner">
          <Package className="w-10 h-10" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold text-gray-900">No Orders Placed Yet</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            You haven't placed any orders with Kivora yet. Browse our catalog to place your first order!
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl transition shadow-sm"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Explore Products</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Order History</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Showing <span className="font-semibold text-gray-900">{orders.length}</span> order(s)
        </p>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const itemCount = order.order_items?.length || 0;
          const createdDate = new Date(order.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });

          return (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID:</span>
                    <span className="text-xs font-mono font-bold text-gray-900">{order.id}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Placed on {createdDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(order.status)}
                  <span className="text-lg font-extrabold text-gray-900">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-gray-600">
                  <span className="font-semibold text-gray-900">{itemCount} item(s):</span>{' '}
                  {order.order_items?.map((item) => item.product_name).join(', ')}
                </div>

                <Link
                  to={`/orders/${order.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold rounded-xl text-xs transition shrink-0"
                >
                  <span>View Details & Tracking</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
