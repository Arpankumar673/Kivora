import React, { useState, useEffect } from 'react';
import { fetchProducts, fetchCategories } from '../services/productService';
import ProductCard from '../components/products/ProductCard';
import ProductFilter from '../components/products/ProductFilter';
import { Loader2, PackageX, Store, AlertCircle } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Load Categories on mount
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const cats = await fetchCategories();
        if (isMounted) setCategories(cats);
      } catch (err) {
        console.warn('Failed to load categories:', err);
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load Products whenever filter state changes
  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchProducts({
          categoryId: selectedCategory,
          searchQuery,
          minPrice,
          maxPrice,
          sortBy,
        });
        if (isMounted) setProducts(data);
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load product catalog.');
          setProducts([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(loadProducts, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedCategory, searchQuery, minPrice, maxPrice, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 text-sky-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>Storefront Catalog</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Explore Products</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Showing <span className="font-semibold text-gray-900">{products.length}</span> active items
        </p>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <ProductFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            minPrice={minPrice}
            onMinPriceChange={setMinPrice}
            maxPrice={maxPrice}
            onMaxPriceChange={setMaxPrice}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* Product Catalog Grid */}
        <div className="lg:col-span-3">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm mb-6">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3 bg-white rounded-2xl border border-gray-200">
              <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
              <p className="text-gray-500 text-sm font-medium">Fetching catalog items...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-white border border-gray-200 rounded-2xl text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                <PackageX className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">No Products Found</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                  We couldn't find any products matching your selected search or filter criteria.
                </p>
              </div>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-sky-600 text-white font-semibold text-xs rounded-xl hover:bg-sky-700 transition shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
