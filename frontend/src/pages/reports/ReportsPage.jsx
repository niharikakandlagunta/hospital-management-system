import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Calendar,
  CreditCard,
  Download,
  Filter,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import api from '../../services/api';
import { reportService } from '../../services/reportService';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const ReportsPage = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' | 'billing'

  // Appointment filters
  const [aptStartDate, setAptStartDate] = useState('');
  const [aptEndDate, setAptEndDate] = useState('');
  const [aptReport, setAptReport] = useState(null);
  const [loadingApt, setLoadingApt] = useState(false);

  // Billing filters
  const [billStartDate, setBillStartDate] = useState('');
  const [billEndDate, setBillEndDate] = useState('');
  const [billReport, setBillReport] = useState(null);
  const [loadingBill, setLoadingBill] = useState(false);

  // Exporting state
  const [isExporting, setIsExporting] = useState(false);

  const fetchAppointmentReport = useCallback(async () => {
    try {
      setLoadingApt(true);
      const params = {};
      if (aptStartDate) params.startDate = aptStartDate;
      if (aptEndDate) params.endDate = aptEndDate;
      const res = await reportService.getAppointmentReport(params);
      if (res && res.data) {
        setAptReport(res.data);
      }
    } catch (err) {
      error('Failed to load appointment report: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingApt(false);
    }
  }, [aptStartDate, aptEndDate, error]);

  const fetchBillingReport = useCallback(async () => {
    try {
      setLoadingBill(true);
      const params = {};
      if (billStartDate) params.startDate = billStartDate + 'T00:00:00';
      if (billEndDate) params.endDate = billEndDate + 'T23:59:59';
      const res = await reportService.getBillingReport(params);
      if (res && res.data) {
        setBillReport(res.data);
      }
    } catch (err) {
      error('Failed to load billing report: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingBill(false);
    }
  }, [billStartDate, billEndDate, error]);

  useEffect(() => {
    if (activeTab === 'appointments') {
      fetchAppointmentReport();
    } else {
      fetchBillingReport();
    }
  }, [activeTab, fetchAppointmentReport, fetchBillingReport]);

  const handleExportAppointmentsCsv = async () => {
    try {
      setIsExporting(true);
      const params = {};
      if (aptStartDate) params.startDate = aptStartDate;
      if (aptEndDate) params.endDate = aptEndDate;

      const response = await api.get('/reports/appointments/export', {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appointments_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      success('Appointments CSV exported successfully');
    } catch (err) {
      error('Export failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportBillingCsv = async () => {
    try {
      setIsExporting(true);
      const params = {};
      if (billStartDate) params.startDate = billStartDate + 'T00:00:00';
      if (billEndDate) params.endDate = billEndDate + 'T23:59:59';

      const response = await api.get('/reports/billing/export', {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billing_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      success('Billing CSV exported successfully');
    } catch (err) {
      error('Export failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Clinical Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate audit-ready reports, analyze hospital throughput, and export CSV spreadsheets.
          </p>
        </div>

        {/* Tab selection */}
        <div className="inline-flex p-1 bg-slate-200/70 rounded-2xl">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'appointments'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Appointments</span>
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'billing'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Billing & Revenue</span>
          </button>
        </div>
      </div>

      {/* APPOINTMENTS REPORT TAB */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span>From:</span>
                <input
                  type="date"
                  value={aptStartDate}
                  onChange={(e) => setAptStartDate(e.target.value)}
                  className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span>To:</span>
                <input
                  type="date"
                  value={aptEndDate}
                  onChange={(e) => setAptEndDate(e.target.value)}
                  className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
              <button
                onClick={fetchAppointmentReport}
                className="p-2 text-slate-600 hover:text-teal-600 hover:bg-slate-100 rounded-xl transition"
                title="Refresh Report"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleExportAppointmentsCsv}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm shadow-teal-500/20 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Export Appointments CSV'}</span>
            </button>
          </div>

          {/* Metric Tiles */}
          {aptReport && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total</span>
                <span className="text-xl font-bold text-slate-900 mt-1 block">{aptReport.totalAll}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center">
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block">Scheduled</span>
                <span className="text-xl font-bold text-blue-700 mt-1 block">{aptReport.totalScheduled}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center">
                <span className="text-[10px] font-bold text-teal-500 uppercase tracking-wider block">Confirmed</span>
                <span className="text-xl font-bold text-teal-700 mt-1 block">{aptReport.totalConfirmed}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center">
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">Completed</span>
                <span className="text-xl font-bold text-emerald-700 mt-1 block">{aptReport.totalCompleted}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Cancelled</span>
                <span className="text-xl font-bold text-rose-700 mt-1 block">{aptReport.totalCancelled}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">No-Show</span>
                <span className="text-xl font-bold text-amber-700 mt-1 block">{aptReport.totalNoShow}</span>
              </div>
            </div>
          )}

          {/* Appointments Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Appointment Records Breakdown</h3>
              <span className="text-xs text-slate-400">
                {aptReport?.appointments?.length || 0} visits listed
              </span>
            </div>

            {loadingApt ? (
              <div className="p-12 text-center text-slate-400 font-medium animate-pulse">
                Compiling appointments analytics...
              </div>
            ) : !aptReport?.appointments || aptReport.appointments.length === 0 ? (
              <div className="p-12 text-center text-slate-400">No appointments found for the selected period.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Ref #</th>
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Doctor</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {aptReport.appointments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/75 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-semibold text-teal-700">
                          {a.appointmentNumber}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900">{a.patientName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{a.patientRegistrationNumber}</div>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">
                          Dr. {a.doctorName}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap text-slate-600">
                          {formatDate(a.appointmentDate)} {a.startTime?.substring(0, 5)}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge variant={a.status}>{a.status}</Badge>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate">
                          {a.reason || 'General Checkup'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BILLING REPORT TAB */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span>From:</span>
                <input
                  type="date"
                  value={billStartDate}
                  onChange={(e) => setBillStartDate(e.target.value)}
                  className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span>To:</span>
                <input
                  type="date"
                  value={billEndDate}
                  onChange={(e) => setBillEndDate(e.target.value)}
                  className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
              <button
                onClick={fetchBillingReport}
                className="p-2 text-slate-600 hover:text-teal-600 hover:bg-slate-100 rounded-xl transition"
                title="Refresh Report"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleExportBillingCsv}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm shadow-teal-500/20 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Export Billing CSV'}</span>
            </button>
          </div>

          {/* Financial KPI Cards */}
          {billReport && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Billed</p>
                <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                  {formatCurrency(billReport.totalBilled)}
                </p>
                <p className="text-xs text-slate-500 mt-1">{billReport.totalBillsCount} total invoices</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Revenue Collected</p>
                <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                  {formatCurrency(billReport.totalCollected)}
                </p>
                <p className="text-xs text-slate-500 mt-1">{billReport.paidBillsCount} paid invoices</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Total Outstanding</p>
                <p className="text-2xl font-bold font-mono text-rose-600 mt-1">
                  {formatCurrency(billReport.totalOutstanding)}
                </p>
                <p className="text-xs text-slate-500 mt-1">{billReport.pendingBillsCount} pending invoices</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <p className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">Collection Ratio</p>
                <p className="text-2xl font-bold font-mono text-teal-700 mt-1">
                  {Number(billReport.totalBilled) > 0
                    ? Math.round((Number(billReport.totalCollected) / Number(billReport.totalBilled)) * 100)
                    : 0}
                  %
                </p>
                <p className="text-xs text-slate-500 mt-1">Settled vs billed revenue</p>
              </div>
            </div>
          )}

          {/* Bills Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Invoice Ledger Summary</h3>
              <span className="text-xs text-slate-400">
                {billReport?.bills?.length || 0} invoices listed
              </span>
            </div>

            {loadingBill ? (
              <div className="p-12 text-center text-slate-400 font-medium animate-pulse">
                Compiling billing ledger data...
              </div>
            ) : !billReport?.bills || billReport.bills.length === 0 ? (
              <div className="p-12 text-center text-slate-400">No invoices found for the selected period.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Bill No</th>
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Paid</th>
                      <th className="py-3 px-4">Balance</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {billReport.bills.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/75 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-semibold text-teal-700">
                          {b.billNumber}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-900">
                          {b.patientName}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                          {formatCurrency(b.totalAmount)}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-semibold text-emerald-600">
                          {formatCurrency(b.paidAmount)}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-semibold text-rose-600">
                          {formatCurrency(b.balanceDue)}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge variant={b.paymentStatus}>{b.paymentStatus}</Badge>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                          {formatDate(b.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default ReportsPage;
