import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { ShoppingBag, ShoppingCart, User, Package, Home, Store, Shield, LogOut, LogIn, UserPlus } from 'lucide-react';

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'text-sky-600 border-b-2 border-sky-600' : 'text-gray-600 hover:text-gray-900'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              K
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">KIVORA</span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <NavLink to="/" end className={navLinkClass}>
              <Home className="w-4 h-4" />
              <span>Home</span>
            </NavLink>
            <NavLink to="/products" className={navLinkClass}>
              <Store className="w-4 h-4" />
              <span>Products</span>
            </NavLink>
            <NavLink to="/cart" className={navLinkClass}>
              <div className="relative flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4" />
                <span>Cart</span>
                {user && cartCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 bg-sky-600 text-white rounded-full text-[11px] font-bold">
                    {cartCount}
                  </span>
                )}
              </div>
            </NavLink>

            {/* Authenticated Customer Links */}
            {user && (
              <NavLink to="/orders" className={navLinkClass}>
                <Package className="w-4 h-4" />
                <span>Orders</span>
              </NavLink>
            )}

            {/* Admin Dedicated Link */}
            {user && isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>
                <Shield className="w-4 h-4 text-amber-600" />
                <span className="text-amber-700 font-semibold">Admin</span>
              </NavLink>
            )}
          </nav>

          {/* User Auth Section */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-gray-900 leading-tight">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    {isAdmin ? (
                      <span className="text-amber-600 font-bold">ADMIN</span>
                    ) : (
                      'CUSTOMER'
                    )}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:text-red-600 transition shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-sky-600 transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
