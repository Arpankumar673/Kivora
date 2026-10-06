import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchOrderById } from '../services/orderService';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/formatters';
import { ArrowLeft, Clock, MapPin, Package, CheckCircle2, AlertCircle, Loader2, XCircle, ShoppingBag, Truck, Radio } from 'lucide-react';

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchOrderById(id);
      setOrder(data);
    } catch (err) {
      setError(err.message || 'Order not found or access denied.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getOrder();

    // Supabase Realtime channel subscription for live order tracking status changes
    const channel = supabase
      .channel(`order-tracking-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload) => {
          console.info('Realtime order status update:', payload);
          getOrder();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading && !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3 bg-white rounded-2xl border border-gray-200">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Fetching order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-white border border-gray-200 rounded-2xl text-center space-y-4 shadow-sm max-w-lg mx-auto my-8">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900">Order Not Found</h2>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            {error || 'The requested order could not be located or does not belong to your account.'}
          </p>
        </div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white font-semibold text-xs rounded-xl hover:bg-sky-700 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Order History</span>
        </Link>
      </div>
    );
  }

  const { total_amount, status, shipping_address, created_at, order_items } = order;
  const createdDate = new Date(created_at).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const currentStepIndex = STEPS.indexOf(status?.toUpperCase());
  const isCancelled = status?.toUpperCase() === 'CANCELLED';

  return (
    <div className="space-y-6">
      {/* Header & Back Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="space-y-1">
          <Link to="/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Orders</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Order Details</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[10px] font-semibold">
              <Radio className="w-3 h-3 animate-pulse text-emerald-600" />
              <span>Live Tracking</span>
            </span>
          </div>
          <p className="text-xs text-gray-500 font-mono">ID: {order.id}</p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">Placed on {createdDate}</p>
          <p className="text-xl font-extrabold text-gray-900 mt-0.5">{formatCurrency(total_amount)}</p>
        </div>
      </div>

      {/* Visual Order Tracking Stepper */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
          <Truck className="w-5 h-5 text-sky-600" />
          <span>Order Status Timeline</span>
        </h2>

        {isCancelled ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800 text-sm">
            <XCircle className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <p className="font-bold">This Order Has Been Cancelled</p>
              <p className="text-xs text-red-700 mt-0.5">
                The order processing was cancelled. Please contact customer support if you need further assistance.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative py-4">
            {/* Timeline Stepper */}
            <div className="grid grid-cols-5 gap-2 text-center relative z-10">
              {STEPS.map((stepName, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={stepName} className="flex flex-col items-center space-y-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        isCompleted
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-400 border border-gray-200'
                      } ${isCurrent ? 'ring-4 ring-sky-100' : ''}`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[11px] sm:text-xs font-bold capitalize ${
                        isCompleted ? 'text-sky-700' : 'text-gray-400'
                      }`}
                    >
                      {stepName.toLowerCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Order Details & Shipping Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Line Items Table */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-extrabold text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-sky-600" />
            <span>Ordered Items Snapshot</span>
          </h2>

          <div className="divide-y divide-gray-100">
            {order_items?.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between text-sm gap-4">
                <div className="space-y-0.5">
                  <p className="font-bold text-gray-900">{item.product_name}</p>
                  <p className="text-xs text-gray-500">
                    Unit Price Snapshot: <span className="font-semibold text-gray-700">{formatCurrency(item.price)}</span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500">Qty: <span className="font-bold text-gray-900">{item.quantity}</span></p>
                  <p className="font-extrabold text-gray-900 mt-0.5">{formatCurrency(item.subtotal)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-base font-extrabold text-gray-900">
            <span>Total Amount</span>
            <span className="text-sky-600 text-lg">{formatCurrency(total_amount)}</span>
          </div>
        </div>

        {/* Shipping Address Container */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-extrabold text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-600" />
            <span>Shipping Address</span>
          </h2>

          {shipping_address ? (
            <div className="text-xs text-gray-700 space-y-1.5 leading-relaxed">
              <p className="font-bold text-sm text-gray-900">{shipping_address.full_name}</p>
              <p>{shipping_address.address_line1}</p>
              {shipping_address.address_line2 && <p>{shipping_address.address_line2}</p>}
              <p>
                {shipping_address.city}, {shipping_address.state} {shipping_address.postal_code}
              </p>
              <p className="font-semibold">{shipping_address.country}</p>
              <p className="text-gray-500 pt-1">Phone: {shipping_address.phone}</p>
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">No shipping address recorded.</p>
          )}

          <div className="pt-4 border-t border-gray-100">
            <Link
              to="/products"
              className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
