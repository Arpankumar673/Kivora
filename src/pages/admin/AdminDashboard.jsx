import React, { useState, useEffect } from 'react';
import { fetchDashboardMetrics } from '../../services/adminService';
import { formatCurrency } from '../../utils/formatters';
import { Package, Folders, ShoppingBag, DollarSign, AlertTriangle, Loader2, RefreshCw, CheckCircle2, Clock, Truck, XCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
      setError('Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3 bg-white rounded-2xl border border-gray-200 p-8">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Calculating dashboard metrics...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8 bg-white border border-gray-200 rounded-2xl text-center space-y-4 shadow-sm">
        <p className="text-red-600 font-semibold text-sm">{error || 'Unable to load metrics'}</p>
        <button
          onClick={loadMetrics}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white font-semibold text-xs rounded-xl hover:bg-sky-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  const {
    totalProducts,
    activeProducts,
    lowStockProducts,
    totalCategories,
    totalOrders,
    pendingOrders,
    confirmedOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue,
  } = metrics;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{formatCurrency(totalRevenue)}</p>
          <p className="text-[11px] text-gray-500">Excludes cancelled order totals</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{totalOrders}</p>
          <p className="text-[11px] text-gray-500">{pendingOrders} pending fulfillment</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Products</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{totalProducts}</p>
          <p className="text-[11px] text-emerald-600 font-medium">{activeProducts} active in catalog</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Inventory Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{lowStockProducts}</p>
          <p className="text-[11px] text-amber-700 font-medium">Products with stock ≤ 5</p>
        </div>
      </div>

      {/* Order Status Breakdown Grid */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-gray-900 pb-3 border-b border-gray-100">
          Order Status Fulfillment Pipeline
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1">
            <Clock className="w-5 h-5 text-amber-600 mx-auto" />
            <p className="text-lg font-bold text-gray-900">{pendingOrders}</p>
            <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Pending</p>
          </div>

          <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-1">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mx-auto" />
            <p className="text-lg font-bold text-gray-900">{confirmedOrders}</p>
            <p className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">Confirmed</p>
          </div>

          <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-1">
            <RefreshCw className="w-5 h-5 text-indigo-600 mx-auto" />
            <p className="text-lg font-bold text-gray-900">{processingOrders}</p>
            <p className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wider">Processing</p>
          </div>

          <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-xl space-y-1">
            <Truck className="w-5 h-5 text-sky-600 mx-auto" />
            <p className="text-lg font-bold text-gray-900">{shippedOrders}</p>
            <p className="text-[11px] font-semibold text-sky-800 uppercase tracking-wider">Shipped</p>
          </div>

          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
            <p className="text-lg font-bold text-gray-900">{deliveredOrders}</p>
            <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Delivered</p>
          </div>

          <div className="p-4 bg-red-50/50 border border-red-200 rounded-xl space-y-1">
            <XCircle className="w-5 h-5 text-red-600 mx-auto" />
            <p className="text-lg font-bold text-gray-900">{cancelledOrders}</p>
            <p className="text-[11px] font-semibold text-red-800 uppercase tracking-wider">Cancelled</p>
          </div>
        </div>
      </div>
    </div>
  );
}
