import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { appointmentService } from '../../services/appointmentService';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatTime } from '../../utils/formatters';
import { getErrorMessage } from '../../services/api';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Stethoscope,
  FileText,
  CreditCard,
  XCircle,
  CalendarClock,
  CheckCircle2,
  AlertOctagon,
  FilePlus
} from 'lucide-react';

export const AppointmentDetails = () => {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cancel Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { hasRole } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const fetchAppointment = async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getAppointmentById(id);
      setAppointment(res.data);
    } catch (err) {
      toastError(getErrorMessage(err));
      navigate('/appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id === 'book' || id === 'new') {
      navigate('/appointments/book', { replace: true });
      return;
    }
    fetchAppointment();
  }, [id]);

  const handleComplete = async () => {
    try {
      await appointmentService.completeAppointment(id);
      success('Appointment marked as COMPLETED');
      fetchAppointment();
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) return;
    setActionLoading(true);
    try {
      await appointmentService.cancelAppointment(id, cancelReason.trim());
      success('Appointment cancelled');
      setIsCancelModalOpen(false);
      fetchAppointment();
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!appointment) return null;

  const isActionable = appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/appointments')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
                {appointment.appointmentReference}
              </h1>
              <Badge variant={appointment.status}>{appointment.status}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Scheduled for {formatDate(appointment.appointmentDate)} at {formatTime(appointment.startTime)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Complete button */}
          {hasRole('ADMIN', 'DOCTOR') && isActionable && (
            <button
              onClick={handleComplete}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark Completed
            </button>
          )}

          {/* Cancel button */}
          {hasRole('ADMIN', 'RECEPTIONIST') && isActionable && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition"
            >
              <XCircle className="w-4 h-4" />
              Cancel Visit
            </button>
          )}
        </div>
      </div>

      {/* Appointment Information Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
          {/* Patient Card */}
          <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-teal-600" />
                Patient
              </span>
              <Link
                to={`/patients/${appointment.patientId}`}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700"
              >
                Profile →
              </Link>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{appointment.patientName}</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {appointment.patientRegistrationNumber}</p>
              <p className="text-xs text-slate-600 mt-1">Phone: {appointment.patientPhone}</p>
            </div>
          </div>

          {/* Doctor Card */}
          <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                Specialist
              </span>
              <Link
                to={`/doctors/${appointment.doctorId}`}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700"
              >
                Details →
              </Link>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{appointment.doctorName}</h3>
              <p className="text-xs text-teal-700 font-semibold mt-0.5">{appointment.doctorSpecialization}</p>
            </div>
          </div>
        </div>

        {/* Schedule & Timing Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date
            </div>
            <div className="font-semibold text-slate-800 mt-1">{formatDate(appointment.appointmentDate)}</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Time Slot
            </div>
            <div className="font-semibold text-slate-800 mt-1">
              {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40">
            <div className="text-xs text-slate-500">Duration</div>
            <div className="font-semibold text-slate-800 mt-1">{appointment.durationMinutes} Minutes</div>
          </div>
        </div>

        {/* Reason for Visit */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reason for Visit</h4>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-800 leading-relaxed">
            {appointment.reasonForVisit}
          </div>
        </div>

        {/* Cancellation Reason if cancelled */}
        {appointment.cancellationReason && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm">
            <div className="font-bold text-rose-800 mb-1">Cancellation Reason:</div>
            <p className="text-rose-700">{appointment.cancellationReason}</p>
          </div>
        )}

        {/* Clinical Next Steps */}
        <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Created by: <span className="font-semibold text-slate-600">{appointment.createdByName || 'Hospital Staff'}</span>
          </div>

          <div className="flex items-center gap-3">
            {hasRole('ADMIN', 'DOCTOR') && appointment.status === 'COMPLETED' && (
              <button
                onClick={() => navigate('/medical-records/new', {
                  state: {
                    preSelectedPatientId: appointment.patientId,
                    preSelectedAppointmentId: appointment.id
                  }
                })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition shadow-sm"
              >
                <FilePlus className="w-4 h-4" />
                Create Medical Record
              </button>
            )}

            {hasRole('ADMIN', 'BILLING_STAFF') && (
              <button
                onClick={() => navigate('/billing', {
                  state: {
                    preSelectedPatientId: appointment.patientId,
                    preSelectedAppointmentId: appointment.id
                  }
                })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                <CreditCard className="w-4 h-4" />
                Generate Bill
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={`Cancel Appointment: ${appointment.appointmentReference}`}
      >
        <form onSubmit={handleConfirmCancel} className="space-y-4">
          <p className="text-sm text-slate-600">
            Please enter a reason for cancelling this appointment.
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
              placeholder="e.g. Patient emergency / travel conflict"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Keep
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
            >
              {actionLoading ? 'Cancelling...' : 'Confirm'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
