import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  Building2,
  FileCheck,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { billingService } from '../../services/billingService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const BillDetails = () => {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const { success, error } = useToast();

  const [bill, setBill] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    transactionReference: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBillData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await billingService.getBillById(id);
      if (res && res.data) {
        setBill(res.data);
      }
      const payRes = await billingService.getBillPayments(id);
      if (payRes && payRes.data) {
        setPayments(payRes.data);
      }
    } catch (err) {
      error('Failed to load bill details: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [id, error]);

  useEffect(() => {
    fetchBillData();
  }, [fetchBillData]);

  const handlePrint = () => {
    window.print();
  };

  const openPaymentModal = () => {
    setPaymentData({
      amount: bill?.balanceDue > 0 ? bill.balanceDue : '',
      paymentMethod: 'CASH',
      transactionReference: '',
      notes: ''
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentData.amount || Number(paymentData.amount) <= 0) {
      error('Please enter a valid amount');
      return;
    }
    if (Number(paymentData.amount) > Number(bill.balanceDue)) {
      error('Amount cannot exceed balance due of ' + formatCurrency(bill.balanceDue));
      return;
    }

    try {
      setIsSubmitting(true);
      await billingService.recordPayment(bill.id, {
        amount: Number(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,
        transactionReference: paymentData.transactionReference,
        notes: paymentData.notes
      });
      success('Payment recorded successfully');
      setIsPaymentModalOpen(false);
      fetchBillData();
    } catch (err) {
      error('Payment recording failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-medium animate-pulse">
        Loading invoice details...
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="p-12 text-center text-slate-500">
        Invoice not found.
        <div className="mt-4">
          <Link to="/billing" className="text-teal-600 font-medium hover:underline">
            Back to Billing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation & Actions (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <Link
          to="/billing"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 shadow-sm transition"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Invoice</span>
          </button>
          {hasRole('ADMIN', 'BILLING_STAFF') && bill.paymentStatus !== 'PAID' && bill.paymentStatus !== 'CANCELLED' && (
            <button
              onClick={openPaymentModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm transition"
            >
              <DollarSign className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Printable Invoice Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 sm:p-12 print:border-none print:shadow-none print:p-0">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg">
                M+
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">MediCare Hospital</h1>
                <p className="text-xs text-slate-500">Smart Hospital Management, Simplified.</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mt-3">
              100 Healthcare Parkway, Medical District<br />
              Metro City, MC 10001<br />
              Phone: +1 (555) 019-2834 | contact@medicare-hms.com
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-600">Tax Invoice</span>
            <h2 className="text-2xl font-mono font-bold text-slate-900 mt-1">{bill.billNumber}</h2>
            <div className="mt-2">
              <Badge variant={bill.paymentStatus}>{bill.paymentStatus}</Badge>
            </div>
            <div className="mt-3 text-xs text-slate-500 space-y-1">
              <div>Issue Date: <span className="font-semibold text-slate-800">{formatDate(bill.createdAt)}</span></div>
              {bill.dueDate && (
                <div>Due Date: <span className="font-semibold text-slate-800">{formatDate(bill.dueDate)}</span></div>
              )}
            </div>
          </div>
        </div>

        {/* Patient and Appointment Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Billed To (Patient)</span>
            <h3 className="text-base font-bold text-slate-900 mt-1">{bill.patientName}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Reg ID: {bill.patientRegistrationNumber}</p>
            {bill.patientPhone && <p className="text-xs text-slate-500 mt-1">Phone: {bill.patientPhone}</p>}
            {bill.patientAddress && <p className="text-xs text-slate-500 mt-0.5">Address: {bill.patientAddress}</p>}
          </div>

          <div className="sm:text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Service Info</span>
            {bill.appointmentNumber ? (
              <div className="mt-1 space-y-1 text-xs text-slate-600">
                <p className="font-semibold text-slate-900">Appointment #{bill.appointmentNumber}</p>
                {bill.doctorName && <p>Attending: Dr. {bill.doctorName}</p>}
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-1">Direct Outpatient / Walk-in Services</p>
            )}
            {bill.notes && (
              <div className="mt-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600 inline-block text-left">
                <span className="font-semibold block text-[10px] text-slate-400 uppercase">Notes</span>
                {bill.notes}
              </div>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        <div className="py-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-2">Item Description</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-2 text-right">Unit Price</th>
                <th className="py-2.5 px-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {bill.consultationCharge > 0 && (
                <tr>
                  <td className="py-3 px-2 text-slate-400 text-xs">1</td>
                  <td className="py-3 px-2 font-medium text-slate-800">
                    Professional Medical Consultation
                  </td>
                  <td className="py-3 px-2 text-center text-slate-600">1</td>
                  <td className="py-3 px-2 text-right text-slate-600 font-mono">
                    {formatCurrency(bill.consultationCharge)}
                  </td>
                  <td className="py-3 px-2 text-right font-semibold text-slate-900 font-mono">
                    {formatCurrency(bill.consultationCharge)}
                  </td>
                </tr>
              )}
              {bill.items && bill.items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="py-3 px-2 text-slate-400 text-xs">
                    {(bill.consultationCharge > 0 ? 2 : 1) + idx}
                  </td>
                  <td className="py-3 px-2 font-medium text-slate-800">
                    {item.itemDescription}
                  </td>
                  <td className="py-3 px-2 text-center text-slate-600">{item.quantity}</td>
                  <td className="py-3 px-2 text-right text-slate-600 font-mono">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-3 px-2 text-right font-semibold text-slate-900 font-mono">
                    {formatCurrency(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary Calculation */}
        <div className="border-t border-slate-200 pt-6 flex justify-end">
          <div className="w-full sm:w-72 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">{formatCurrency(bill.subtotal)}</span>
            </div>
            {Number(bill.discount) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span className="font-mono font-medium">-{formatCurrency(bill.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Tax ({bill.taxRate}%):</span>
              <span className="font-mono font-medium">+{formatCurrency(bill.taxAmount)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-base text-slate-900">
              <span>Grand Total:</span>
              <span className="font-mono">{formatCurrency(bill.totalAmount)}</span>
            </div>
            <div className="flex justify-between font-semibold text-emerald-600 text-sm">
              <span>Paid to Date:</span>
              <span className="font-mono">-{formatCurrency(bill.paidAmount)}</span>
            </div>
            <div className="border-t-2 border-slate-900 pt-2 flex justify-between font-bold text-lg text-rose-600">
              <span>Balance Due:</span>
              <span className="font-mono">{formatCurrency(bill.balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Payments Recorded */}
        <div className="mt-10 pt-6 border-t border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Payment Receipts & Transactions
          </h3>
          {payments.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No payments have been recorded for this invoice yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                    <th className="py-2">Receipt No</th>
                    <th className="py-2">Date & Time</th>
                    <th className="py-2">Method</th>
                    <th className="py-2">Reference</th>
                    <th className="py-2">Received By</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 font-mono font-semibold text-teal-700">{p.receiptNumber}</td>
                      <td className="py-2.5 text-slate-500">{formatDate(p.paymentTimestamp)}</td>
                      <td className="py-2.5 font-medium text-slate-800">{p.paymentMethod}</td>
                      <td className="py-2.5 text-slate-500 font-mono">{p.transactionReference || '-'}</td>
                      <td className="py-2.5 text-slate-600">{p.recordedByName || 'Staff'}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-600">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Authorized Signatures for Print */}
        <div className="mt-16 pt-8 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-500">
          <div>
            <div className="h-12"></div>
            <div className="border-t border-dashed border-slate-300 w-48 mx-auto pt-1 font-semibold text-slate-700">
              Patient / Representative
            </div>
          </div>
          <div>
            <div className="h-12"></div>
            <div className="border-t border-dashed border-slate-300 w-48 mx-auto pt-1 font-semibold text-slate-700">
              Hospital Cashier / Accounts
            </div>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment Receipt"
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Invoice Number:</span>
              <span className="font-mono font-semibold text-slate-900">{bill.billNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Patient:</span>
              <span className="font-semibold text-slate-900">{bill.patientName}</span>
            </div>
            <div className="flex justify-between font-bold text-rose-600 pt-1 border-t border-slate-200">
              <span>Current Balance:</span>
              <span>{formatCurrency(bill.balanceDue)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Amount ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={bill.balanceDue}
              value={paymentData.amount}
              onChange={(e) => setPaymentData((prev) => ({ ...prev, amount: e.target.value }))}
              required
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm font-mono font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Method *
            </label>
            <select
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
              required
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="CASH">Cash</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="DEBIT_CARD">Debit Card</option>
              <option value="UPI">UPI / Digital Wallet</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="INSURANCE">Insurance Claim</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Transaction Reference / Check #
            </label>
            <input
              type="text"
              placeholder="e.g. TXN-984321 / Receipt #44"
              value={paymentData.transactionReference}
              onChange={(e) => setPaymentData((prev) => ({ ...prev, transactionReference: e.target.value }))}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Notes
            </label>
            <input
              type="text"
              placeholder="Optional payment notes"
              value={paymentData.notes}
              onChange={(e) => setPaymentData((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-sm transition"
            >
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default BillDetails;
