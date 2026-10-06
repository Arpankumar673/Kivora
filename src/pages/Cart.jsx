import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatters';
import { ShoppingBag, ShoppingCart, Trash2, ArrowRight, ArrowLeft, Minus, Plus, AlertTriangle, Loader2, Package, ShieldCheck } from 'lucide-react';

export default function Cart() {
  const { cartItems, cartTotal, cartCount, loading, updateItem, removeItem, clearUserCart } = useCart();
  const navigate = useNavigate();

  const [updatingId, setUpdatingId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Check for any inventory stock conflict across cart items
  const stockConflicts = cartItems.filter(
    (item) => item.products && (item.products.stock < item.quantity || !item.products.is_active)
  );

  const handleDecreaseQuantity = async (item) => {
    if (item.quantity <= 1) {
      await handleRemoveItem(item.id);
      return;
    }
    setUpdatingId(item.id);
    try {
      await updateItem(item.id, item.quantity - 1);
    } catch (err) {
      console.error('Update quantity error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleIncreaseQuantity = async (item) => {
    const maxStock = item.products?.stock ?? 999;
    if (item.quantity >= maxStock) return;

    setUpdatingId(item.id);
    try {
      await updateItem(item.id, item.quantity + 1);
    } catch (err) {
      console.error('Update quantity error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    setUpdatingId(cartItemId);
    try {
      await removeItem(cartItemId);
    } catch (err) {
      console.error('Remove item error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearCartConfirm = async () => {
    try {
      await clearUserCart();
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Clear cart error:', err);
    }
  };

  const handleProceedToCheckout = () => {
    if (stockConflicts.length > 0) return;
    navigate('/checkout');
  };

  if (loading && cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3 bg-white rounded-2xl border border-gray-200">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Loading your shopping cart...</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-8 bg-white border border-gray-200 rounded-2xl text-center space-y-5 shadow-sm max-w-2xl mx-auto my-8">
        <div className="w-20 h-20 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center shadow-inner">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold text-gray-900">Your Shopping Cart is Empty</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            Looks like you haven't added any items to your cart yet. Explore our product catalog to discover great deals!
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl transition shadow-sm"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Explore Product Catalog</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Shopping Cart</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            You have <span className="font-semibold text-gray-900">{cartCount}</span> item(s) in your cart
          </p>
        </div>

        <button
          onClick={() => setShowClearConfirm(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition self-start sm:self-auto"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Cart</span>
        </button>
      </div>

      {/* Stock Conflict Warning Banner */}
      {stockConflicts.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Inventory Conflict Detected</p>
            <p className="text-xs text-amber-700 mt-0.5">
              One or more products in your cart have exceeded current available stock or become inactive. Please adjust quantities before proceeding to checkout.
            </p>
          </div>
        </div>
      )}

      {/* Cart Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart Item List */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            const product = item.products || {};
            const isStockExceeded = product.stock !== undefined && item.quantity > product.stock;
            const isInactive = product.is_active === false;
            const itemPrice = product.price ?? 0;
            const itemSubtotal = itemPrice * item.quantity;

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-sm transition flex flex-col sm:flex-row items-start sm:items-center gap-4 ${
                  isStockExceeded || isInactive ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'
                }`}
              >
                {/* Thumbnail Image */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name || 'Product'}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Info & Title */}
                <div className="flex-grow space-y-1 w-full sm:w-auto">
                  {product.categories?.name && (
                    <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">
                      {product.categories.name}
                    </span>
                  )}

                  <h3 className="font-bold text-gray-900 text-base leading-snug">
                    <Link to={`/product/${product.id}`} className="hover:text-sky-600 transition">
                      {product.name || 'Product Item'}
                    </Link>
                  </h3>

                  <p className="text-xs text-gray-500">
                    Unit Price: <span className="font-semibold text-gray-700">{formatCurrency(itemPrice)}</span>
                  </p>

                  {isInactive && (
                    <span className="inline-block text-[11px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full mt-1">
                      Item is currently inactive
                    </span>
                  )}

                  {isStockExceeded && (
                    <span className="inline-block text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full mt-1">
                      Max stock available: {product.stock}
                    </span>
                  )}
                </div>

                {/* Quantity Controls & Subtotal */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-gray-50">
                    <button
                      type="button"
                      onClick={() => handleDecreaseQuantity(item)}
                      disabled={updatingId === item.id}
                      className="p-1.5 hover:bg-gray-200 text-gray-700 disabled:opacity-40 transition"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span className="px-3 text-xs font-bold text-gray-900 min-w-[2rem] text-center select-none">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleIncreaseQuantity(item)}
                      disabled={updatingId === item.id || item.quantity >= (product.stock ?? 999)}
                      className="p-1.5 hover:bg-gray-200 text-gray-700 disabled:opacity-40 transition"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-gray-900 tracking-tight">
                      {formatCurrency(itemSubtotal)}
                    </span>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={updatingId === item.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition rounded-lg hover:bg-gray-100"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-extrabold text-gray-900 pb-3 border-b border-gray-100">
            Order Summary
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Items Total ({cartCount})</span>
              <span className="font-semibold text-gray-900">{formatCurrency(cartTotal)}</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Estimated Shipping</span>
              <span className="font-semibold text-emerald-600">FREE</span>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-between text-base font-extrabold text-gray-900">
              <span>Cart Total</span>
              <span className="text-sky-600">{formatCurrency(cartTotal)}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleProceedToCheckout}
              disabled={stockConflicts.length > 0}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              to="/products"
              className="w-full py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2 text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </Link>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Encrypted RLS Database Security</span>
          </div>
        </div>
      </div>

      {/* Clear Cart Modal Confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Clear Shopping Cart?</h3>
              <p className="text-gray-500 text-xs">
                Are you sure you want to remove all items from your cart? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleClearCartConfirm}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl transition shadow-sm"
              >
                Yes, Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
