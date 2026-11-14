import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from './Badge';
import { Menu, LogOut, User as UserIcon, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">MediCare HMS</span>
          <span className="text-sm font-bold text-slate-800">Hospital Administration</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition relative"
            title="System Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500"></span>
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-sm">
              {user.fullName ? user.fullName.charAt(0) : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">{user.fullName}</span>
              <div className="mt-0.5">
                <Badge variant={user.role} size="sm">{user.role}</Badge>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
