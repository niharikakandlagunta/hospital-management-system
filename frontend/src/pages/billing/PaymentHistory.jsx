import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt,
  ArrowLeft,
  Filter,
  DollarSign,
  Calendar,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { billingService } from '../../services/billingService';
import { useToast } from '../../context/ToastContext';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/EmptyState';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const PaymentHistory = () => {
  const { error } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [paymentMethod, setPaymentMethod] = useState('');

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        size: 15
      };
      if (paymentMethod) params.paymentMethod = paymentMethod;

      const res = await billingService.getAllPayments(params);
      if (res && res.data) {
        setPayments(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
        setTotalElements(res.data.totalElements || 0);
      }
    } catch (err) {
      error('Failed to load payment transactions: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [currentPage, paymentMethod, error]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const totalCollectedOnPage = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/billing"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Invoices</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Transactions Log</h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit trail of all recorded financial collections, transaction references, and payment methods.
          </p>
        </div>

        {/* Page Summary */}
        <div className="px-5 py-3 rounded-2xl bg-teal-50 border border-teal-200/80 text-right">
          <p className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Page Collection</p>
          <p className="text-xl font-bold font-mono text-teal-900 mt-0.5">
            {formatCurrency(totalCollectedOnPage)}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              setCurrentPage(0);
            }}
            className="py-2 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="">All Payment Methods</option>
            <option value="CASH">Cash</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="DEBIT_CARD">Debit Card</option>
            <option value="UPI">UPI / Digital Wallet</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="INSURANCE">Insurance Claim</option>
          </select>
        </div>

        <button
          onClick={() => {
            setPaymentMethod('');
            fetchPayments();
          }}
          title="Reset"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium animate-pulse">
            Loading payment transactions...
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No Transactions Found"
            description="There are no payment records matching your selected filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Receipt No</th>
                  <th className="py-3.5 px-4">Invoice No</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Cashier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {p.billId ? (
                        <Link to={`/billing/${p.billId}`} className="hover:text-teal-600 hover:underline">
                          {p.billNumber || `BILL-${p.billId}`}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {p.patientName || 'Hospital Patient'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        <CreditCard className="w-3 h-3 text-slate-500" />
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-500">
                      {p.transactionReference || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(p.paymentTimestamp)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 font-medium">
                      {p.recordedByName || 'Billing Staff'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalElements={totalElements}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
export default PaymentHistory;
