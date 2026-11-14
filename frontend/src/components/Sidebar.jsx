import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarCheck,
  FileText,
  CreditCard,
  BarChart3,
  ShieldCheck,
  Activity,
  X
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { hasRole } = useAuth();

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: 'Patients',
      path: '/patients',
      icon: Users,
      show: true,
    },
    {
      name: 'Doctors',
      path: '/doctors',
      icon: UserCheck,
      show: true,
    },
    {
      name: 'Appointments',
      path: '/appointments',
      icon: CalendarCheck,
      show: true,
    },
    {
      name: 'Medical Records',
      path: '/medical-records',
      icon: FileText,
      show: hasRole('ADMIN', 'DOCTOR'),
    },
    {
      name: 'Billing & Invoices',
      path: '/billing',
      icon: CreditCard,
      show: hasRole('ADMIN', 'BILLING_STAFF', 'RECEPTIONIST'),
    },
    {
      name: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      show: hasRole('ADMIN', 'BILLING_STAFF'),
    },
    {
      name: 'User Management',
      path: '/users',
      icon: ShieldCheck,
      show: hasRole('ADMIN'),
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-slate-100 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">MediCare HMS</h1>
              <p className="text-[10px] text-teal-400 font-medium tracking-wide uppercase">Smart Healthcare</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Hospital Modules
          </div>
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-sm shadow-teal-500/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
        </nav>

        {/* System Version Footer */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>MediCare v1.0.0</span>
          <span className="flex items-center gap-1.5 text-teal-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            Online
          </span>
        </div>
      </aside>
    </>
  );
};
