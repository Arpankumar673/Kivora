import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-wide">KIVORA</span>
            <span className="text-gray-500">|</span>
            <span>E-Commerce Internship Project</span>
          </div>
          <div className="flex items-center gap-6 text-gray-400">
            <Link to="/products" className="hover:text-white transition-colors">Products</Link>
            <Link to="/cart" className="hover:text-white transition-colors">Cart</Link>
            <Link to="/admin" className="hover:text-white transition-colors">Admin</Link>
          </div>
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} Kivora. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
