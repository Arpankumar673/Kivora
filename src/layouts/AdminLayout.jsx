import React from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, Folders, ShoppingBag, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function AdminLayout() {
  const adminNavLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
      isActive
        ? 'bg-sky-600 text-white shadow-sm'
        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
    }`;

  return (
    <div className="space-y-6">
      {/* Admin Sub-Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-gray-900 text-lg leading-tight">Admin Management Panel</h2>
              <p className="text-[11px] text-gray-500 font-medium">Role-based controls & inventory metrics</p>
            </div>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Storefront</span>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap gap-2 pt-1">
          <NavLink to="/admin" end className={adminNavLinkClass}>
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview Dashboard</span>
          </NavLink>

          <NavLink to="/admin/products" className={adminNavLinkClass}>
            <Package className="w-4 h-4" />
            <span>Products & Stock</span>
          </NavLink>

          <NavLink to="/admin/categories" className={adminNavLinkClass}>
            <Folders className="w-4 h-4" />
            <span>Categories</span>
          </NavLink>

          <NavLink to="/admin/orders" className={adminNavLinkClass}>
            <ShoppingBag className="w-4 h-4" />
            <span>Order Fulfillment</span>
          </NavLink>
        </nav>
      </div>

      {/* Admin Page Content */}
      <div>
        <Outlet />
      </div>
    </div>
  );
}
