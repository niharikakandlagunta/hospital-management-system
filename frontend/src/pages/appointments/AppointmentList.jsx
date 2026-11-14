import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { appointmentService } from '../../services/appointmentService';
import { doctorService } from '../../services/doctorService';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatTime } from '../../utils/formatters';
import { APPOINTMENT_STATUSES } from '../../utils/constants';
import { getErrorMessage } from '../../services/api';
import {
  Search,
  Plus,
  Calendar,
  Clock,
  Filter,
  CheckCircle,
  XCircle,
  CalendarClock,
  AlertOctagon,
  Eye,
  CheckCircle2,
  CalendarPlus
} from 'lucide-react';

export const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [doctorIdFilter, setDoctorIdFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modals
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelTargetApt, setCancelTargetApt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleTargetApt, setRescheduleTargetApt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const { hasRole } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  // Load doctors for dropdown
  useEffect(() => {
    doctorService.getDoctors({ size: 100 }).then((res) => {
      if (res && res.data) setDoctors(res.data.content);
    }).catch(() => {});
  }, []);

  const fetchAppointments = async (pageNum = page) => {
    setLoading(true);
    try {
      const params = {
        page: pageNum,
        size: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        doctorId: doctorIdFilter || undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined
      };
      const res = await appointmentService.getAppointments(params);
      if (res && res.data) {
        setAppointments(res.data.content);
        setPage(res.data.pageNumber);
        setTotalPages(res.data.totalPages);
        setTotalElements(res.data.totalElements);
      }
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(0);
  }, [search, statusFilter, doctorIdFilter, startDateFilter, endDateFilter]);

  // Handle Cancel
  const handleOpenCancel = (apt) => {
    setCancelTargetApt(apt);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      toastError('Please provide a reason for cancellation');
      return;
    }
    setActionLoading(true);
    try {
      await appointmentService.cancelAppointment(cancelTargetApt.id, cancelReason.trim());
      success(`Appointment ${cancelTargetApt.appointmentReference} cancelled`);
      setIsCancelModalOpen(false);
      fetchAppointments(page);
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reschedule
  const handleOpenReschedule = async (apt) => {
    setRescheduleTargetApt(apt);
    setRescheduleDate(apt.appointmentDate);
    setRescheduleTime(apt.startTime);
    setIsRescheduleModalOpen(true);
    loadSlots(apt.doctorId, apt.appointmentDate);
  };

  const loadSlots = async (doctorId, date) => {
    if (!doctorId || !date) return;
    setLoadingSlots(true);
    try {
      const res = await doctorService.getDoctorAvailability(doctorId, date);
      setAvailableSlots(res.data || []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await appointmentService.rescheduleAppointment(rescheduleTargetApt.id, {
        newDate: rescheduleDate,
        newStartTime: rescheduleTime
      });
      success(`Appointment rescheduled to ${formatDate(rescheduleDate)} ${formatTime(rescheduleTime)}`);
      setIsRescheduleModalOpen(false);
      fetchAppointments(page);
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Status Actions
  const handleComplete = async (apt) => {
    try {
      await appointmentService.completeAppointment(apt.id);
      success(`Appointment ${apt.appointmentReference} completed`);
      fetchAppointments(page);
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  };

  const handleNoShow = async (apt) => {
    try {
      await appointmentService.markNoShow(apt.id);
      success(`Appointment ${apt.appointmentReference} marked as NO-SHOW`);
      fetchAppointments(page);
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointments Management</h1>
          <p className="text-sm text-slate-500">Track hospital bookings, daily consultations, and visit outcomes</p>
        </div>
        {hasRole('ADMIN', 'RECEPTIONIST') && (
          <button
            onClick={() => navigate('/appointments/book')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition shadow-sm shadow-teal-500/20"
          >
            <CalendarPlus className="w-4 h-4" />
            Book Appointment
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ref, patient or doctor..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No-Show</option>
            </select>
          </div>

          {/* Doctor Filter */}
          <div>
            <select
              value={doctorIdFilter}
              onChange={(e) => setDoctorIdFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.fullName}</option>
              ))}
            </select>
          </div>

          {/* Date range start */}
          <div>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              title="Start Date"
            />
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No appointments found"
            description="No bookings match the selected filters or date ranges."
            actionText={hasRole('ADMIN', 'RECEPTIONIST') ? 'Book New Appointment' : undefined}
            onAction={hasRole('ADMIN', 'RECEPTIONIST') ? () => navigate('/appointments/book') : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Reference</th>
                  <th className="py-3.5 px-6">Patient</th>
                  <th className="py-3.5 px-6">Attending Doctor</th>
                  <th className="py-3.5 px-6">Date & Slot</th>
                  <th className="py-3.5 px-6">Reason for Visit</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6 font-mono text-xs font-bold text-teal-700">
                      {apt.appointmentReference}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{apt.patientName}</div>
                      <div className="text-xs text-slate-400 font-mono">{apt.patientRegistrationNumber}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800">{apt.doctorName}</div>
                      <div className="text-xs text-teal-600 font-medium">{apt.doctorSpecialization}</div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      <div className="font-medium text-slate-900">{formatDate(apt.appointmentDate)}</div>
                      <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatTime(apt.startTime)} ({apt.durationMinutes} min)
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 max-w-xs truncate">
                      {apt.reasonForVisit}
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={apt.status}>{apt.status}</Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/appointments/${apt.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Complete button */}
                        {hasRole('ADMIN', 'DOCTOR') && (apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED') && (
                          <button
                            onClick={() => handleComplete(apt)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                            title="Mark as Completed"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </button>
                        )}

                        {/* Reschedule button */}
                        {hasRole('ADMIN', 'RECEPTIONIST') && (apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED') && (
                          <button
                            onClick={() => handleOpenReschedule(apt)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Reschedule Appointment"
                          >
                            <CalendarClock className="w-4 h-4 text-blue-600" />
                          </button>
                        )}

                        {/* Cancel button */}
                        {hasRole('ADMIN', 'RECEPTIONIST') && (apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED') && (
                          <button
                            onClick={() => handleOpenCancel(apt)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Cancel Appointment"
                          >
                            <XCircle className="w-4 h-4 text-rose-500" />
                          </button>
                        )}

                        {/* No show button */}
                        {hasRole('ADMIN', 'RECEPTIONIST') && (apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED') && (
                          <button
                            onClick={() => handleNoShow(apt)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                            title="Mark as No-Show"
                          >
                            <AlertOctagon className="w-4 h-4 text-amber-600" />
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

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={10}
          onPageChange={(p) => fetchAppointments(p)}
        />
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={`Cancel Appointment: ${cancelTargetApt?.appointmentReference}`}
      >
        <form onSubmit={handleConfirmCancel} className="space-y-4">
          <p className="text-sm text-slate-600">
            Please enter a reason for cancelling this appointment for <strong>{cancelTargetApt?.patientName}</strong>.
            Cancelled slots are made immediately available for other patients.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Cancellation Reason *
            </label>
            <textarea
              rows="3"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
              placeholder="e.g. Patient called to reschedule due to emergency travel"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Keep Appointment
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
            >
              {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title={`Reschedule ${rescheduleTargetApt?.appointmentReference}`}
      >
        <form onSubmit={handleConfirmReschedule} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              New Appointment Date *
            </label>
            <input
              type="date"
              value={rescheduleDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setRescheduleDate(e.target.value);
                loadSlots(rescheduleTargetApt?.doctorId, e.target.value);
              }}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Available Time Slot *
            </label>
            {loadingSlots ? (
              <div className="p-3 text-xs text-slate-400">Checking available slots...</div>
            ) : availableSlots.length === 0 ? (
              <div className="p-3 text-xs text-rose-500 bg-rose-50 rounded-xl border border-rose-100">
                No slots available on this date. Please pick another date.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setRescheduleTime(slot)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition ${
                      rescheduleTime === slot
                        ? 'border-teal-600 bg-teal-600 text-white font-bold'
                        : 'border-slate-200 bg-white hover:border-teal-500 text-slate-700'
                    }`}
                  >
                    {formatTime(slot)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRescheduleModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading || !rescheduleTime}
              className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Updating...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
