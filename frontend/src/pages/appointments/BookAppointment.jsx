import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import { doctorService } from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatTime, formatDate } from '../../utils/formatters';
import { getErrorMessage } from '../../services/api';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Stethoscope,
  FileText,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Sparkles
} from 'lucide-react';

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const BookAppointment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const preSelectedPatientId = location.state?.preSelectedPatientId ? String(location.state.preSelectedPatientId) : '';
  const preSelectedDoctorId = location.state?.preSelectedDoctorId ? String(location.state.preSelectedDoctorId) : '';

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const todayStr = getLocalDateString(new Date());

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrowDate);

  const dayAfterDate = new Date();
  dayAfterDate.setDate(dayAfterDate.getDate() + 2);
  const dayAfterStr = getLocalDateString(dayAfterDate);

  // If local time is already 17:00 or later, default to tomorrow
  const initialDate = new Date().getHours() >= 17 ? tomorrowStr : todayStr;

  const [selectedPatientId, setSelectedPatientId] = useState(preSelectedPatientId);
  const [selectedDoctorId, setSelectedDoctorId] = useState(preSelectedDoctorId);
  const [appointmentDate, setAppointmentDate] = useState(initialDate);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('');

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load patients and doctors list
  useEffect(() => {
    patientService.getPatients({ size: 100, active: true })
      .then((res) => {
        if (res && res.data && res.data.content) {
          const list = res.data.content;
          setPatients(list);
          if (!preSelectedPatientId && list.length > 0) {
            setSelectedPatientId(String(list[0].id));
          }
        }
      })
      .catch(() => {});

    doctorService.getDoctors({ size: 100, available: true })
      .then((res) => {
        if (res && res.data && res.data.content) {
          const list = res.data.content;
          setDoctors(list);
          if (!preSelectedDoctorId && list.length > 0) {
            setSelectedDoctorId(String(list[0].id));
          }
        }
      })
      .catch(() => {});
  }, [preSelectedPatientId, preSelectedDoctorId]);

  // When doctor or date changes, query availability
  useEffect(() => {
    if (selectedDoctorId && appointmentDate) {
      setLoadingSlots(true);
      setSelectedSlot('');
      doctorService.getDoctorAvailability(selectedDoctorId, appointmentDate)
        .then((res) => {
          setAvailableSlots(res.data || []);
        })
        .catch(() => {
          setAvailableSlots([]);
        })
        .finally(() => {
          setLoadingSlots(false);
        });
    } else {
      setAvailableSlots([]);
      setSelectedSlot('');
    }
  }, [selectedDoctorId, appointmentDate]);

  const selectedDoctor = doctors.find((d) => String(d.id) === String(selectedDoctorId));
  const selectedPatient = patients.find((p) => String(p.id) === String(selectedPatientId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      toastError('Please select a registered patient');
      return;
    }
    if (!selectedDoctorId) {
      toastError('Please select an attending physician');
      return;
    }
    if (!appointmentDate) {
      toastError('Please select a consultation date');
      return;
    }
    if (!selectedSlot) {
      toastError('Please select an available consultation time slot');
      return;
    }
    if (!reasonForVisit.trim()) {
      toastError('Please describe the purpose or chief complaint for this visit');
      return;
    }

    setSubmitting(true);
    try {
      const res = await appointmentService.bookAppointment({
        patientId: parseInt(selectedPatientId, 10),
        doctorId: parseInt(selectedDoctorId, 10),
        appointmentDate: appointmentDate,
        startTime: selectedSlot,
        durationMinutes: 30,
        reasonForVisit: reasonForVisit.trim()
      });

      success(`Appointment ${res.data.appointmentReference} booked successfully!`);
      navigate(`/appointments/${res.data.id}`);
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Schedule Clinical Consultation
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              <Sparkles className="w-3 h-3 text-teal-500" /> Real-time Slots
            </span>
          </h1>
          <p className="text-sm text-slate-500">
            Book appointments across departments with conflict detection and automated working hours validation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Booking Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Patient Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600" />
                1. Select Patient *
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              >
                <option value="">-- Choose registered patient --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.registrationNumber}) • {p.phone}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Doctor Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                2. Select Attending Physician *
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              >
                <option value="">-- Choose specialist --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} ({d.specialization}) • {formatCurrency(d.consultationFee)}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Appointment Date & Quick Selectors */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  3. Select Date *
                </label>
                {/* Quick Date Pills */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAppointmentDate(todayStr)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      appointmentDate === todayStr
                        ? 'bg-teal-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppointmentDate(tomorrowStr)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      appointmentDate === tomorrowStr
                        ? 'bg-teal-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppointmentDate(dayAfterStr)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      appointmentDate === dayAfterStr
                        ? 'bg-teal-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Day After
                  </button>
                </div>
              </div>
              <input
                type="date"
                min={todayStr}
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              />
            </div>

            {/* 4. Available Slots Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  4. Consultation Time Slot *
                </label>
                {availableSlots.length > 0 && (
                  <span className="text-xs text-teal-700 font-medium">
                    {availableSlots.length} slot{availableSlots.length > 1 ? 's' : ''} available
                  </span>
                )}
              </div>

              {loadingSlots ? (
                <div className="p-6 rounded-2xl border border-dashed border-teal-200 bg-teal-50/30 text-center text-xs text-teal-700">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-teal-600 border-t-transparent mx-auto mb-2"></div>
                  Checking doctor working schedule and existing active bookings...
                </div>
              ) : !selectedDoctorId ? (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 text-center">
                  Select a physician above to calculate open booking slots.
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                  <div className="flex items-start gap-2.5 text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-800">
                        {appointmentDate === todayStr
                          ? 'No remaining slots available today'
                          : 'No available slots on this date'}
                      </p>
                      <p className="text-amber-700/90 mt-0.5">
                        {appointmentDate === todayStr
                          ? 'All clinical consultation slots for today have either passed clinic hours or are booked. Please book for tomorrow.'
                          : 'The doctor is either fully booked or off-duty on this date.'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setAppointmentDate(tomorrowStr)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition shadow-sm"
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      Switch to Tomorrow ({formatDate(tomorrowStr)})
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1 border border-slate-100 rounded-2xl bg-slate-50/50">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-medium border text-center transition flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'border-teal-600 bg-teal-600 text-white font-bold shadow-md shadow-teal-600/20'
                            : 'border-slate-200 bg-white hover:border-teal-500 hover:text-teal-700 text-slate-700'
                        }`}
                      >
                        <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        <span>{formatTime(slot)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. Reason for Visit */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                5. Reason for Visit *
              </label>
              <textarea
                rows="3"
                value={reasonForVisit}
                onChange={(e) => setReasonForVisit(e.target.value)}
                required
                placeholder="Describe patient chief complaint, symptoms, or consultation purpose..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedSlot}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition shadow-md shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submitting
                  ? 'Confirming Booking...'
                  : !selectedSlot
                  ? 'Select Time Slot to Confirm'
                  : 'Confirm Appointment'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Booking Summary Sidebar */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider pb-2 border-b border-slate-800">
              Booking Summary
            </h3>

            <div>
              <div className="text-[11px] text-slate-400 uppercase">Patient</div>
              <div className="font-semibold text-sm text-white mt-0.5">
                {selectedPatient ? selectedPatient.fullName : 'Not selected yet'}
              </div>
              {selectedPatient && (
                <div className="text-xs text-teal-400 font-mono mt-0.5">
                  {selectedPatient.registrationNumber} • {selectedPatient.phone}
                </div>
              )}
            </div>

            <div>
              <div className="text-[11px] text-slate-400 uppercase">Physician</div>
              <div className="font-semibold text-sm text-white mt-0.5">
                {selectedDoctor ? selectedDoctor.fullName : 'Not selected yet'}
              </div>
              {selectedDoctor && (
                <div className="text-xs text-slate-300 mt-0.5">
                  {selectedDoctor.specialization} ({selectedDoctor.qualifications})
                </div>
              )}
            </div>

            <div>
              <div className="text-[11px] text-slate-400 uppercase">Appointment Schedule</div>
              <div className="font-semibold text-sm text-white mt-0.5">
                {appointmentDate ? formatDate(appointmentDate) : 'Select date'}
                {selectedSlot ? ` at ${formatTime(selectedSlot)}` : ' (Slot pending)'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Consultation Duration: 30 minutes</div>
            </div>

            {selectedDoctor && (
              <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-300">Consultation Fee</span>
                <span className="text-base font-bold text-teal-400">
                  {formatCurrency(selectedDoctor.consultationFee)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
