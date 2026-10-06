import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-sm">
        <AlertCircle className="w-10 h-10" />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">404 — Page Not Found</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          The page you are looking for does not exist or has been moved to another location.
        </p>
      </div>

      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-700 transition-colors shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Homepage</span>
      </Link>
    </div>
  );
}
