import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorService } from '../../services/doctorService';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';
import { getErrorMessage } from '../../services/api';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Phone,
  Mail,
  Award,
  DollarSign,
  Plus,
  Save,
  CheckCircle2,
  CalendarPlus
} from 'lucide-react';

export const DoctorDetails = () => {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Schedule modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '17:00',
    slotDurationMinutes: 30,
    active: true
  });
  const [modalLoading, setModalLoading] = useState(false);

  const { hasRole } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const fetchDoctorData = async () => {
    setLoading(true);
    try {
      const docRes = await doctorService.getDoctorById(id);
      setDoctor(docRes.data);

      const schRes = await doctorService.getDoctorSchedules(id);
      setSchedules(schRes.data || []);

      const aptRes = await doctorService.getDoctorAppointments(id);
      setAppointments(aptRes.data || []);
    } catch (err) {
      toastError(getErrorMessage(err));
      navigate('/doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [id]);

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await doctorService.addOrUpdateSchedule(id, scheduleForm);
      success('Schedule updated successfully');
      setIsScheduleModalOpen(false);
      fetchDoctorData();
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!doctor) return null;

  const DAYS_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/doctors')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{doctor.fullName}</h1>
              <Badge variant={doctor.available ? 'AVAILABLE' : 'UNAVAILABLE'}>
                {doctor.available ? 'Available' : 'Unavailable'}
              </Badge>
            </div>
            <p className="text-xs text-teal-700 font-semibold mt-0.5">
              {doctor.specialization} • Department of {doctor.departmentName || 'Medicine'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasRole('ADMIN', 'RECEPTIONIST') && doctor.available && (
            <button
              onClick={() => navigate('/appointments/book', { state: { preSelectedDoctorId: doctor.id } })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition shadow-sm"
            >
              <CalendarPlus className="w-4 h-4" />
              Book Appointment
            </button>
          )}
          {hasRole('ADMIN') && (
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition"
            >
              <Clock className="w-4 h-4 text-slate-500" />
              Configure Hours
            </button>
          )}
        </div>
      </div>

      {/* Doctor Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm text-center">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-extrabold text-2xl shadow-inner mb-4">
            {doctor.fullName.replace('Dr. ', '').charAt(0)}
          </div>
          <h3 className="font-bold text-slate-900 text-base">{doctor.fullName}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{doctor.specialization}</p>

          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-left text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{doctor.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="truncate">{doctor.email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Award className="w-4 h-4 text-slate-400" />
              <span>{doctor.yearsOfExperience} Years Clinical Exp</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span>Fee: <strong className="text-slate-800">{formatCurrency(doctor.consultationFee)}</strong></span>
            </div>
          </div>
        </div>

        {/* Working Hours Schedule */}
        <div className="md:col-span-3 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Weekly Working Schedule</h3>
              <p className="text-xs text-slate-500">Configured duty shifts and consultation duration</p>
            </div>
            {hasRole('ADMIN') && (
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Set Day Schedule
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DAYS_ORDER.map((day) => {
              const sch = schedules.find((s) => s.dayOfWeek === day);
              return (
                <div
                  key={day}
                  className={`p-4 rounded-2xl border text-xs transition ${
                    sch && sch.active
                      ? 'border-teal-200 bg-teal-50/30 text-slate-800'
                      : 'border-slate-100 bg-slate-50/50 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className={sch && sch.active ? 'text-teal-900' : 'text-slate-500'}>{day}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${sch && sch.active ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-600'}`}>
                      {sch && sch.active ? 'On Duty' : 'Off'}
                    </span>
                  </div>
                  {sch && sch.active ? (
                    <div className="mt-2 space-y-1">
                      <div className="text-slate-700 font-semibold">
                        {formatTime(sch.startTime)} - {formatTime(sch.endTime)}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Slot: {sch.slotDurationMinutes} mins
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] text-slate-400">No active hours</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Assigned Appointments */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Assigned Patient Appointments</h3>
            <p className="text-xs text-slate-500">Scheduled clinical appointments ({appointments.length})</p>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No appointments assigned to this physician.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Reference</th>
                  <th className="py-3.5 px-6">Patient</th>
                  <th className="py-3.5 px-6">Date & Time</th>
                  <th className="py-3.5 px-6">Reason for Visit</th>
                  <th className="py-3.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-teal-700">
                      {apt.appointmentReference}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-900">
                      {apt.patientName}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      <div>{formatDate(apt.appointmentDate)}</div>
                      <div className="text-slate-400">{formatTime(apt.startTime)}</div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 max-w-xs truncate">
                      {apt.reasonForVisit}
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={apt.status}>{apt.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Configuration Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={`Set Working Schedule for ${doctor.fullName}`}
      >
        <form onSubmit={handleSaveSchedule} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Day of Week
            </label>
            <select
              value={scheduleForm.dayOfWeek}
              onChange={(e) => setScheduleForm({ ...scheduleForm, dayOfWeek: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
            >
              {DAYS_ORDER.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={scheduleForm.startTime}
                onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                End Time
              </label>
              <input
                type="time"
                value={scheduleForm.endTime}
                onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Slot Duration (Minutes)
            </label>
            <input
              type="number"
              min="10"
              max="120"
              step="5"
              value={scheduleForm.slotDurationMinutes}
              onChange={(e) => setScheduleForm({ ...scheduleForm, slotDurationMinutes: parseInt(e.target.value, 10) || 30 })}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={scheduleForm.active}
                onChange={(e) => setScheduleForm({ ...scheduleForm, active: e.target.checked })}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">Schedule Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm"
            >
              {modalLoading ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
