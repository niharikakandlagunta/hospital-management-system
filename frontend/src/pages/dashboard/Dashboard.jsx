import React, { useEffect, useState } from 'react';
import { reportService } from '../../services/reportService';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  TrendingUp,
  PlusCircle,
  CalendarPlus,
  FilePlus,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { hasRole, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await reportService.getDashboardStats();
        if (res && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const COLORS = ['#0D9488', '#3B82F6', '#10B981', '#F43F5E', '#64748B'];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 md:p-8 rounded-3xl text-white shadow-xl">
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 mb-3">
            Hospital Operations Control Center
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.fullName || 'Colleague'}
          </h1>
          <p className="mt-1 text-sm text-slate-300 max-w-xl">
            Live overview of clinic admissions, scheduled doctor appointments, clinical visits, and revenue streams.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {hasRole('ADMIN', 'RECEPTIONIST') && (
            <button
              onClick={() => navigate('/appointments/book')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 transition shadow-md shadow-teal-900/30"
            >
              <CalendarPlus className="w-4 h-4" />
              Book Appointment
            </button>
          )}
          {hasRole('ADMIN', 'RECEPTIONIST') && (
            <button
              onClick={() => navigate('/patients/new')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 transition shadow-md"
            >
              <PlusCircle className="w-4 h-4 text-teal-600" />
              Register Patient
            </button>
          )}
          {hasRole('ADMIN', 'BILLING_STAFF') && (
            <button
              onClick={() => navigate('/billing')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-teal-300 bg-teal-950/60 border border-teal-500/30 hover:bg-teal-900/50 transition"
            >
              <CreditCard className="w-4 h-4" />
              Billing
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value={stats?.totalPatients || 0}
          icon={Users}
          color="brand"
          subtitle="Registered in MediCare"
        />
        <StatCard
          title="Active Doctors"
          value={stats?.activeDoctors || 0}
          icon={UserCheck}
          color="blue"
          subtitle="On duty across departments"
        />
        <StatCard
          title="Today's Appointments"
          value={stats?.todayAppointments || 0}
          icon={Calendar}
          color="purple"
          subtitle="Scheduled for today"
        />
        <StatCard
          title="Completed Visits"
          value={stats?.completedAppointments || 0}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Clinical consultations finished"
        />
        <StatCard
          title="Pending Appointments"
          value={stats?.pendingAppointments || 0}
          icon={Clock}
          color="amber"
          subtitle="Awaiting doctor consultation"
        />
        <StatCard
          title="Pending Bills"
          value={stats?.pendingBills || 0}
          icon={AlertCircle}
          color="rose"
          subtitle="Unpaid or partial invoices"
        />
        <StatCard
          title="Revenue Collected"
          value={formatCurrency(stats?.revenueCollected || 0)}
          icon={TrendingUp}
          color="emerald"
          subtitle="Settled transactions"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(stats?.outstandingBalance || 0)}
          icon={CreditCard}
          color="amber"
          subtitle="Total receivables due"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments by Day (Past 7 days) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Appointments Trend (Past 7 Days)</h2>
              <p className="text-xs text-slate-500">Daily appointment booking volume</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              Live Data
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.appointmentsByDay || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#0D9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorApt)" name="Appointments" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointment Status Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">Status Distribution</h2>
            <p className="text-xs text-slate-500">Appointment outcomes</p>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.appointmentStatusDistribution?.filter((d) => d.count > 0) || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="status"
                >
                  {stats?.appointmentStatusDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Doctor Workload Bar Chart */}
      {stats?.doctorWorkload && stats.doctorWorkload.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Doctor Patient Load</h2>
              <p className="text-xs text-slate-500">Total appointments assigned to medical specialists</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.doctorWorkload} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="doctorName" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="appointmentCount" fill="#0D9488" radius={[8, 8, 0, 0]} name="Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Two Column Lists: Today & Upcoming Appointments vs Recent Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Upcoming Appointments</h2>
              <p className="text-xs text-slate-500">Next scheduled patient visits</p>
            </div>
            <Link
              to="/appointments"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {stats?.upcomingAppointments?.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No upcoming appointments scheduled</div>
            ) : (
              stats?.upcomingAppointments?.map((apt) => (
                <div key={apt.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                      {formatTime(apt.startTime)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{apt.patientName}</h4>
                      <p className="text-xs text-slate-500">
                        {apt.doctorName} • {formatDate(apt.appointmentDate)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={apt.status}>{apt.status}</Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recently Registered Patients */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recently Registered Patients</h2>
              <p className="text-xs text-slate-500">New patient intake records</p>
            </div>
            <Link
              to="/patients"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {stats?.recentlyRegisteredPatients?.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No recently registered patients</div>
            ) : (
              stats?.recentlyRegisteredPatients?.map((p) => (
                <div key={p.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{p.fullName}</h4>
                    <p className="text-xs text-slate-500">
                      ID: <span className="font-mono">{p.registrationNumber}</span> • {p.gender} • {p.age} yrs
                    </p>
                  </div>
                  <Badge variant={p.active ? 'ACTIVE' : 'INACTIVE'}>
                    {p.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
