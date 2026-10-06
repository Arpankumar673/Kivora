import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { createOrder } from '../services/orderService';
import { formatCurrency } from '../utils/formatters';
import { ShoppingBag, ArrowLeft, ShieldCheck, Truck, AlertCircle, Loader2, CreditCard, CheckCircle2 } from 'lucide-react';

export default function Checkout() {
  const { cartItems, cartTotal, cartCount, refreshCart } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');

    const { fullName, phone, addressLine1, city, state, postalCode, country } = formData;

    // Field Validations
    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!phone.trim() || phone.length < 7) {
      setError('Please enter a valid phone number.');
      return;
    }
    if (!addressLine1.trim()) {
      setError('Street Address Line 1 is required.');
      return;
    }
    if (!city.trim() || !state.trim()) {
      setError('City and State/Province are required.');
      return;
    }
    if (!postalCode.trim()) {
      setError('Postal/ZIP Code is required.');
      return;
    }

    if (cartItems.length === 0) {
      setError('Your shopping cart is empty.');
      return;
    }

    setIsSubmitting(true);

    try {
      const shippingPayload = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        address_line1: addressLine1.trim(),
        address_line2: formData.addressLine2.trim(),
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
        country: country.trim(),
      };

      const newOrder = await createOrder(shippingPayload);

      // Refresh cart context so cart count becomes 0
      await refreshCart();

      // Redirect to Order Confirmation / Tracking page
      navigate(`/orders/${newOrder.id}`);
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-white border border-gray-200 rounded-2xl text-center space-y-4 shadow-sm max-w-xl mx-auto my-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900">Your Cart is Empty</h2>
          <p className="text-gray-500 text-sm">You cannot proceed to checkout without items in your cart.</p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white font-semibold text-xs rounded-xl hover:bg-sky-700 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse Products</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Checkout</h1>
          <p className="text-gray-500 text-sm mt-0.5">Provide shipping details to place your order</p>
        </div>
        <Link to="/cart" className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Cart</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Main Layout Grid */}
      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Shipping Form */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-lg pb-3 border-b border-gray-100">
            <Truck className="w-5 h-5 text-sky-600" />
            <span>Shipping Address</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Jane Doe"
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Street Address Line 1 *
              </label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                placeholder="123 Market Street, Apt 4B"
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Street Address Line 2 (Optional)
              </label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                placeholder="Suite, Building, Floor..."
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="New York"
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                State / Province *
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="NY"
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Postal / ZIP Code *
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="10001"
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Country *
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Order Summary & Place Order */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-extrabold text-gray-900 pb-3 border-b border-gray-100">
            Order Items ({cartCount})
          </h2>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50">
                <div className="pr-2 line-clamp-1">
                  <span className="font-bold text-gray-900">{item.quantity}x</span>{' '}
                  <span className="text-gray-700">{item.products?.name}</span>
                </div>
                <span className="font-semibold text-gray-900 shrink-0">
                  {formatCurrency((item.products?.price ?? 0) * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-3 border-t border-gray-100 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Items Total</span>
              <span className="font-semibold text-gray-900">{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className="font-semibold text-emerald-600">FREE</span>
            </div>
            <div className="pt-2 border-t border-gray-100 flex justify-between text-base font-extrabold text-gray-900">
              <span>Order Total</span>
              <span className="text-sky-600">{formatCurrency(cartTotal)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing Order...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Place Order</span>
              </>
            )}
          </button>

          <div className="pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Authenticated Order & RLS Authorization</span>
          </div>
        </div>
      </form>
    </div>
  );
}
