import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import {
  Activity,
  Lock,
  User,
  Mail,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  DollarSign,
  UserPlus,
  LogIn,
  CheckCircle2
} from 'lucide-react';

export const Login = ({ initialTab = 'login' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { success, error: toastError } = useToast();

  // Detect tab from props, route, or query param (?tab=register)
  const isRegisterRoute = location.pathname.includes('/register') || new URLSearchParams(location.search).get('tab') === 'register';
  const [activeTab, setActiveTab] = useState(isRegisterRoute || initialTab === 'register' ? 'register' : 'login');

  useEffect(() => {
    if (location.pathname.includes('/register')) {
      setActiveTab('register');
    } else if (location.pathname.includes('/login')) {
      setActiveTab('login');
    }
  }, [location.pathname]);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('RECEPTIONIST');

  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword) {
      toastError('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const userInfo = await login(loginUsername.trim(), loginPassword);
      success(`Welcome back, ${userInfo.fullName || userInfo.username}!`);
      navigate(from, { replace: true });
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regFullName.trim() || !regEmail.trim() || !regUsername.trim() || !regPassword) {
      toastError('Please fill in all required fields');
      return;
    }
    if (regPassword.length < 6) {
      toastError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        username: regUsername.trim(),
        password: regPassword,
        role: regRole
      };
      const userInfo = await register(payload);
      success(`Account created successfully! Welcome to MediCare, ${userInfo.fullName || userInfo.username}!`);
      navigate(from, { replace: true });
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Autofill demo accounts
  const handleQuickLogin = (user, pass) => {
    setActiveTab('login');
    setLoginUsername(user);
    setLoginPassword(pass);
  };

  return (
    <div className="w-full max-w-md my-8">
      {/* Brand Header: Logo & App Name */}
      <div className="text-center mb-6">
        <div className="relative inline-flex items-center justify-center mb-3">
          <div className="absolute inset-0 rounded-3xl bg-teal-500/20 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-400 border border-teal-300/30 flex items-center justify-center text-white shadow-xl shadow-teal-500/20">
            <Activity className="w-9 h-9" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          MediCare <span className="text-teal-400">HMS</span>
        </h1>
        <p className="mt-1 text-sm text-slate-300 font-medium">
          Smart Hospital Management, Simplified.
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100/10 backdrop-blur-sm">
        {/* Navigation Tabs: Sign In / Create Account */}
        <div className="flex p-1.5 mb-6 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeTab === 'login'
                ? 'bg-white text-teal-700 shadow-sm shadow-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeTab === 'register'
                ? 'bg-white text-teal-700 shadow-sm shadow-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>

        {/* TAB 1: SIGN IN FORM */}
        {activeTab === 'login' && (
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign in to your account</h2>
              <p className="text-xs text-slate-500 mt-0.5">Enter your hospital staff credentials to continue.</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="e.g. admin or dr.robert"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/20 shadow-md shadow-teal-600/20 transition disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-4 text-center">
              <span className="text-xs text-slate-500">Don't have an account? </span>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
              >
                Create one now →
              </button>
            </div>

            {/* Quick Demo Autofill Selector */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
                1-Click Quick Demo Login
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'Admin@123')}
                  className="flex items-center gap-2 p-2 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-100/70 text-purple-800 font-medium transition text-left"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Admin</div>
                    <div className="text-[10px] text-purple-600/80">admin</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('dr.robert', 'Doctor@123')}
                  className="flex items-center gap-2 p-2 rounded-xl border border-teal-100 bg-teal-50/50 hover:bg-teal-100/70 text-teal-800 font-medium transition text-left"
                >
                  <Stethoscope className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Doctor</div>
                    <div className="text-[10px] text-teal-600/80">dr.robert</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('receptionist', 'Staff@123')}
                  className="flex items-center gap-2 p-2 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-100/70 text-blue-800 font-medium transition text-left"
                >
                  <UserCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Receptionist</div>
                    <div className="text-[10px] text-blue-600/80">receptionist</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('billing', 'Staff@123')}
                  className="flex items-center gap-2 p-2 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-100/70 text-amber-800 font-medium transition text-left"
                >
                  <DollarSign className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Billing</div>
                    <div className="text-[10px] text-amber-600/80">billing</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CREATE ACCOUNT FORM */}
        {activeTab === 'register' && (
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create Staff Account</h2>
              <p className="text-xs text-slate-500 mt-0.5">Register a new profile to access MediCare HMS.</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Dr. Alex Morgan"
                    required
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. alex.morgan@medicare.com"
                    required
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. amorgan"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Staff Role *
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                >
                  <option value="RECEPTIONIST">Receptionist — Patient Intake & Appointments</option>
                  <option value="DOCTOR">Doctor — Clinical Records & EMR Prescriptions</option>
                  <option value="BILLING_STAFF">Billing Staff — Invoices & Payments</option>
                  <option value="ADMIN">Administrator — Full System Governance</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/20 shadow-md shadow-teal-600/20 transition disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account & Sign In'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-4 text-center">
              <span className="text-xs text-slate-500">Already have an account? </span>
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
              >
                Sign in here →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Credentials Info */}
      <p className="mt-6 text-center text-xs text-slate-400">
        MediCare Hospital Management System • Secured with JWT & BCrypt
      </p>
    </div>
  );
};
