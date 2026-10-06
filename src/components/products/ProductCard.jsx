import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatters';
import { ShoppingCart, ArrowRight, Package, Check, Loader2 } from 'lucide-react';

export default function ProductCard({ product }) {
  const { id, name, description, price, stock, image_url, categories, is_active } = product;
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMsg('');

    if (!user) {
      // Redirect guest to login preserving target return location
      navigate('/login', { state: { from: location } });
      return;
    }

    if (stock <= 0 || !is_active) return;

    setIsAdding(true);
    try {
      await addItem(id, 1, stock);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } catch (err) {
      console.error('Failed to add item:', err);
      setErrorMsg(err.message || 'Failed to add item');
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setIsAdding(false);
    }
  };

  const getStockBadge = () => {
    if (stock <= 0) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
          Out of Stock
        </span>
      );
    }
    if (stock <= 5) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          Only {stock} left
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
        In Stock
      </span>
    );
  };

  return (
    <article className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-200 flex flex-col h-full">
      {/* Product Image Container */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package className="w-12 h-12" />
          </div>
        )}
        <div className="absolute top-3 left-3">{getStockBadge()}</div>
      </div>

      {/* Product Content Container */}
      <div className="p-5 flex flex-col flex-grow space-y-3">
        {categories?.name && (
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
            {categories.name}
          </span>
        )}

        <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-1 group-hover:text-sky-600 transition">
          <Link to={`/product/${id}`}>{name}</Link>
        </h3>

        <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed flex-grow">
          {description || 'No description available for this item.'}
        </p>

        {errorMsg && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 p-1.5 rounded-lg text-center">
            {errorMsg}
          </p>
        )}

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-auto gap-2">
          <div className="text-lg font-extrabold text-gray-900 tracking-tight">
            {formatCurrency(price)}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleAddToCart}
              disabled={isAdding || stock <= 0 || !is_active}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                justAdded
                  ? 'bg-emerald-600 text-white'
                  : stock <= 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm'
              }`}
            >
              {isAdding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Add</span>
                </>
              )}
            </button>

            <Link
              to={`/product/${id}`}
              className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs transition"
              title="View Details"
            >
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
