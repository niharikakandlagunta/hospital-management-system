import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
  Trash2,
  RefreshCw,
  Receipt
} from 'lucide-react';
import { billingService } from '../../services/billingService';
import { patientService } from '../../services/patientService';
import { appointmentService } from '../../services/appointmentService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/EmptyState';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const BillingDashboard = () => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);

  // Data for Generate Modal
  const [patients, setPatients] = useState([]);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentId: '',
    consultationCharge: 50.0,
    discount: 0,
    taxRate: 5.0,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    items: [
      { itemDescription: 'General Consultation', quantity: 1, unitPrice: 50.0 }
    ]
  });

  // Payment Form
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    transactionReference: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        size: 10,
        sortBy: 'createdAt',
        direction: 'desc'
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await billingService.getBills(params);
      if (res && res.data) {
        setBills(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
        setTotalElements(res.data.totalElements || 0);
      }
    } catch (err) {
      error('Failed to load bills: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, error]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // Load patients for generate invoice
  const openGenerateModal = async () => {
    try {
      const res = await patientService.getPatients({ size: 100, activeOnly: true });
      if (res && res.data) {
        setPatients(res.data.content || []);
      }
      setIsGenerateModalOpen(true);
    } catch {
      error('Could not load patient list');
    }
  };

  const handlePatientSelect = async (patientId) => {
    setFormData((prev) => ({ ...prev, patientId, appointmentId: '' }));
    if (!patientId) {
      setPatientAppointments([]);
      return;
    }
    try {
      const res = await appointmentService.getAppointments({ patientId, size: 20 });
      if (res && res.data) {
        setPatientAppointments(res.data.content || []);
      }
    } catch {
      setPatientAppointments([]);
    }
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { itemDescription: '', quantity: 1, unitPrice: 0 }]
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = field === 'itemDescription' ? value : Number(value);
    setFormData((prev) => ({ ...prev, items: updated }));
  };

  // Live calculations for generate modal
  const itemsSubtotal = formData.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const consultation = Number(formData.consultationCharge) || 0;
  const subtotal = itemsSubtotal + consultation;
  const discountAmt = Number(formData.discount) || 0;
  const taxable = Math.max(0, subtotal - discountAmt);
  const taxRate = Number(formData.taxRate) || 0;
  const taxAmt = (taxable * taxRate) / 100;
  const grandTotal = Math.max(0, taxable + taxAmt);

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId) {
      error('Please select a patient');
      return;
    }
    if (formData.items.some((i) => !i.itemDescription.trim())) {
      error('Please enter description for all items');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        patientId: Number(formData.patientId),
        appointmentId: formData.appointmentId ? Number(formData.appointmentId) : null,
        consultationCharge: consultation,
        discount: discountAmt,
        taxRate: taxRate,
        dueDate: formData.dueDate || null,
        notes: formData.notes,
        items: formData.items.map((i) => ({
          itemDescription: i.itemDescription,
          quantity: Number(i.quantity) || 1,
          unitPrice: Number(i.unitPrice) || 0
        }))
      };

      await billingService.generateBill(payload);
      success('Bill & Invoice generated successfully');
      setIsGenerateModalOpen(false);
      fetchBills();
    } catch (err) {
      error('Failed to generate bill: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPaymentModal = (bill) => {
    setSelectedBillForPayment(bill);
    setPaymentData({
      amount: bill.balanceDue > 0 ? bill.balanceDue : '',
      paymentMethod: 'CASH',
      transactionReference: '',
      notes: ''
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentData.amount || Number(paymentData.amount) <= 0) {
      error('Please enter a valid payment amount');
      return;
    }
    if (Number(paymentData.amount) > Number(selectedBillForPayment.balanceDue)) {
      error('Payment amount cannot exceed the balance due of ' + formatCurrency(selectedBillForPayment.balanceDue));
      return;
    }

    try {
      setIsSubmitting(true);
      await billingService.recordPayment(selectedBillForPayment.id, {
        amount: Number(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,
        transactionReference: paymentData.transactionReference,
        notes: paymentData.notes
      });
      success('Payment recorded successfully');
      setIsPaymentModalOpen(false);
      fetchBills();
    } catch (err) {
      error('Payment recording failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics summary
  const totalBilled = bills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0);
  const totalPaid = bills.reduce((acc, b) => acc + (Number(b.paidAmount) || 0), 0);
  const totalOutstanding = bills.reduce((acc, b) => acc + (Number(b.balanceDue) || 0), 0);
  const unpaidCount = bills.filter((b) => b.paymentStatus === 'UNPAID' || b.paymentStatus === 'PARTIALLY_PAID').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing & Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage hospital bills, patient invoices, fee breakdowns, and payment collection.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/billing/payments"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 shadow-sm transition"
          >
            <Receipt className="w-4 h-4 text-slate-500" />
            <span>Payment Log</span>
          </Link>
          {hasRole('ADMIN', 'BILLING_STAFF') && (
            <button
              onClick={openGenerateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm shadow-teal-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Page Total Billed</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalBilled)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Page Paid Amount</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Page Outstanding</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(totalOutstanding)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Bills</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{unpaidCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by bill number or patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="">All Payment Statuses</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              fetchBills();
            }}
            title="Reset Filters"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium animate-pulse">
            Loading bills and invoices...
          </div>
        ) : bills.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No Invoices Found"
            description="No billing records match your selected filter criteria. Generate a new bill or clear search."
            actionText={hasRole('ADMIN', 'BILLING_STAFF') ? 'Generate Invoice' : undefined}
            onAction={hasRole('ADMIN', 'BILLING_STAFF') ? openGenerateModal : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Bill No</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Paid</th>
                  <th className="py-3.5 px-4">Balance Due</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-teal-700">
                      <Link to={`/billing/${bill.id}`} className="hover:underline">
                        {bill.billNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{bill.patientName}</div>
                      <div className="text-xs text-slate-500 font-mono">{bill.patientRegistrationNumber}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {formatCurrency(bill.totalAmount)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">
                      {formatCurrency(bill.paidAmount)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-rose-600">
                      {formatCurrency(bill.balanceDue)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={bill.paymentStatus}>{bill.paymentStatus}</Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(bill.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/billing/${bill.id}`}
                          title="View / Print Invoice"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {hasRole('ADMIN', 'BILLING_STAFF') && bill.paymentStatus !== 'PAID' && bill.paymentStatus !== 'CANCELLED' && (
                          <button
                            onClick={() => openPaymentModal(bill)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200/80 rounded-lg hover:bg-teal-100 transition"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Collect</span>
                          </button>
                        )}
                      </div>
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

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate New Hospital Invoice"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleGenerateSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Patient *
              </label>
              <select
                value={formData.patientId}
                onChange={(e) => handlePatientSelect(e.target.value)}
                required
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="">-- Choose Patient --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.registrationNumber}) - {p.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Related Appointment (Optional)
              </label>
              <select
                value={formData.appointmentId}
                onChange={(e) => setFormData((prev) => ({ ...prev, appointmentId: e.target.value }))}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="">-- None / Standalone Bill --</option>
                {patientAppointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.appointmentNumber} ({a.doctorName} - {formatDate(a.appointmentDate)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Consultation Fee ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.consultationCharge}
                onChange={(e) => setFormData((prev) => ({ ...prev, consultationCharge: e.target.value }))}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Discount Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.discount}
                onChange={(e) => setFormData((prev) => ({ ...prev, discount: e.target.value }))}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.taxRate}
                onChange={(e) => setFormData((prev) => ({ ...prev, taxRate: e.target.value }))}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Line Items Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Itemized Charges & Services
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    placeholder="Description (e.g. Lab Test, Medication)"
                    value={item.itemDescription}
                    onChange={(e) => handleItemChange(idx, 'itemDescription', e.target.value)}
                    required
                    className="flex-1 py-1.5 px-3 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    required
                    className="w-16 py-1.5 px-2 rounded-lg border border-slate-300 text-sm text-center focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                    required
                    className="w-24 py-1.5 px-2 rounded-lg border border-slate-300 text-sm text-right focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                  />
                  <span className="w-20 text-right text-xs font-mono font-semibold text-slate-700">
                    {formatCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={formData.items.length <= 1}
                    className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Due date and notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Invoice Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Standard outpatient visit"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Grand Total Summary Box */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-300 space-y-0.5">
              <div>Subtotal: {formatCurrency(subtotal)}</div>
              <div>Discount: -{formatCurrency(discountAmt)} | Tax ({taxRate}%): +{formatCurrency(taxAmt)}</div>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase tracking-wider text-teal-400 font-semibold block">Total Payable</span>
              <span className="text-2xl font-bold font-mono text-white">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-sm transition"
            >
              {isSubmitting ? 'Generating...' : 'Generate & Issue Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment Receipt"
        maxWidth="max-w-md"
      >
        {selectedBillForPayment && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Bill Number:</span>
                <span className="font-mono font-semibold text-slate-900">{selectedBillForPayment.billNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Patient:</span>
                <span className="font-semibold text-slate-900">{selectedBillForPayment.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Invoice:</span>
                <span>{formatCurrency(selectedBillForPayment.totalAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-600 pt-1 border-t border-slate-200">
                <span>Balance Due:</span>
                <span>{formatCurrency(selectedBillForPayment.balanceDue)}</span>
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
                max={selectedBillForPayment.balanceDue}
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
        )}
      </Modal>
    </div>
  );
};
export default BillingDashboard;
