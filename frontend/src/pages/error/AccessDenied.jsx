import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AccessDenied = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600">
        403 - Forbidden Access
      </span>
      <h1 className="text-2xl font-bold text-slate-900 mt-2">Access Denied</h1>
      <p className="text-sm text-slate-500 max-w-md mt-2 leading-relaxed">
        Your role <span className="font-semibold text-slate-800 font-mono">[{user?.role || 'GUEST'}]</span> does not have sufficient permissions to access this hospital resource. In accordance with clinical data protection guidelines, non-clinical personnel are restricted from unauthorized records.
      </p>

      <div className="flex items-center gap-3 mt-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm transition"
        >
          <Home className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
export default AccessDenied;
