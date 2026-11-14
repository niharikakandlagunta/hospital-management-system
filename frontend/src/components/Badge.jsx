import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-sm font-semibold'
  }[size] || 'px-2.5 py-1 text-xs font-medium';

  const variantMap = {
    // Appointments
    SCHEDULED: 'bg-amber-50 text-amber-700 border-amber-200',
    CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
    NO_SHOW: 'bg-slate-100 text-slate-700 border-slate-300',

    // Bills
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PARTIALLY_PAID: 'bg-amber-50 text-amber-700 border-amber-200',
    UNPAID: 'bg-rose-50 text-rose-700 border-rose-200',
    VOID: 'bg-slate-100 text-slate-600 border-slate-300',

    // General
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    INACTIVE: 'bg-slate-100 text-slate-600 border-slate-300',
    AVAILABLE: 'bg-teal-50 text-teal-700 border-teal-200',
    UNAVAILABLE: 'bg-amber-50 text-amber-700 border-amber-200',

    // Roles
    ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
    DOCTOR: 'bg-teal-50 text-teal-700 border-teal-200',
    RECEPTIONIST: 'bg-blue-50 text-blue-700 border-blue-200',
    BILLING_STAFF: 'bg-amber-50 text-amber-700 border-amber-200',

    default: 'bg-slate-50 text-slate-700 border-slate-200'
  };

  const key = typeof children === 'string' ? children.toUpperCase().replace(/\s+/g, '_') : variant;
  const classes = variantMap[variant] || variantMap[key] || variantMap.default;

  return (
    <span className={`inline-flex items-center rounded-full border ${classes} ${sizeClasses}`}>
      {children}
    </span>
  );
};
