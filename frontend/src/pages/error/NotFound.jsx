import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
        404 - Not Found
      </span>
      <h1 className="text-2xl font-bold text-slate-900 mt-2">Page Does Not Exist</h1>
      <p className="text-sm text-slate-500 max-w-md mt-2 leading-relaxed">
        The requested module or resource was moved, removed, or does not exist in this MediCare HMS deployment.
      </p>

      <div className="mt-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm transition"
        >
          <Home className="w-4 h-4" />
          <span>Go to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
export default NotFound;
