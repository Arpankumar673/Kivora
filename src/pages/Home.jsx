import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-8 py-4">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-sky-600 to-indigo-700 rounded-2xl p-8 sm:p-12 text-white shadow-lg">
        <div className="max-w-2xl space-y-4">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold uppercase tracking-wider">
            Phase 1 Initialized
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Welcome to Kivora
          </h1>
          <p className="text-sky-100 text-base sm:text-lg">
            Discover quality products with seamless shopping, real-time updates, and robust security.
          </p>
          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-sky-700 font-semibold rounded-xl hover:bg-sky-50 transition-colors shadow"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Explore Catalog</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 text-lg mb-2">Product Catalog</h3>
          <p className="text-gray-600 text-sm">
            Browse through items with categories, search, and intuitive filtering.
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 text-lg mb-2">Order Tracking</h3>
          <p className="text-gray-600 text-sm">
            Track your purchases from pending to delivery with status timelines.
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 text-lg mb-2">Admin Dashboard</h3>
          <p className="text-gray-600 text-sm">
            Role-based administration for inventory, categories, and fulfillment.
          </p>
        </div>
      </div>
    </div>
  );
}
