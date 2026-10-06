import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { fetchProductById } from '../services/productService';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatters';
import { ArrowLeft, Package, Check, AlertCircle, Loader2, Tag, ShieldCheck, Truck, ShoppingCart, Minus, Plus } from 'lucide-react';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [addError, setAddError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const getProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchProductById(id);
        if (isMounted) setProduct(data);
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Product not found or unavailable.');
          setProduct(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    getProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleDecreaseQuantity = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  const handleIncreaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleAddToCart = async () => {
    setAddError('');
    setSuccessMsg('');

    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!product || product.stock <= 0) return;

    setIsAdding(true);
    try {
      await addItem(product.id, quantity, product.stock);
      setSuccessMsg(`Added ${quantity} item(s) to your shopping cart!`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setAddError(err.message || 'Failed to add item to cart.');
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3 bg-white rounded-2xl border border-gray-200">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-white border border-gray-200 rounded-2xl text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900">Product Not Found</h2>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            {error || 'The requested product could not be located in our inventory.'}
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white font-semibold text-xs rounded-xl hover:bg-sky-700 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Product Catalog</span>
        </Link>
      </div>
    );
  }

  const { name, description, price, stock, image_url, categories } = product;

  return (
    <div className="space-y-6">
      {/* Back Navigation Button */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-sky-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Catalog</span>
      </Link>

      {/* Feedback Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 text-sm">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <Link to="/cart" className="text-xs font-bold text-emerald-700 underline hover:text-emerald-900">
            View Cart & Checkout
          </Link>
        </div>
      )}

      {addError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>{addError}</div>
        </div>
      )}

      {/* Main Product Section */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Package className="w-16 h-16" />
            </div>
          )}
        </div>

        {/* Product Info & Controls */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {categories?.name && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5" />
                <span>{categories.name}</span>
              </div>
            )}

            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
              {name}
            </h1>

            <div className="flex items-center gap-4">
              <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {formatCurrency(price)}
              </span>

              {stock > 0 ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                  <Check className="w-3.5 h-3.5" />
                  In Stock ({stock} available)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                  Out of Stock
                </span>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {description || 'No detailed description available for this item.'}
              </p>
            </div>
          </div>

          {/* Quantity Selector & Add to Cart Action */}
          <div className="pt-6 border-t border-gray-100 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-gray-50">
                <button
                  type="button"
                  onClick={handleDecreaseQuantity}
                  disabled={quantity <= 1 || stock <= 0}
                  className="p-2.5 hover:bg-gray-200 text-gray-700 disabled:opacity-40 transition"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <span className="px-4 text-sm font-extrabold text-gray-900 min-w-[2.5rem] text-center select-none">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={handleIncreaseQuantity}
                  disabled={quantity >= stock || stock <= 0}
                  className="p-2.5 hover:bg-gray-200 text-gray-700 disabled:opacity-40 transition"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAdding || stock <= 0}
                className="flex-1 py-3 px-6 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Adding to Cart...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            </div>

            {/* Merchant Assurances */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Truck className="w-5 h-5 text-sky-600" />
                <div>
                  <p className="text-xs font-bold text-gray-900">Fast Shipping</p>
                  <p className="text-[11px] text-gray-500">Shipped with order tracking</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-gray-900">Secure Checkout</p>
                  <p className="text-[11px] text-gray-500">Protected RLS database</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
