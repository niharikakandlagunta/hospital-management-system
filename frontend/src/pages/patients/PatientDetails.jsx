import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import { medicalRecordService } from '../../services/medicalRecordService';
import { Badge } from '../../components/Badge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatTime } from '../../utils/formatters';
import { getErrorMessage } from '../../services/api';
import {
  ArrowLeft,
  Edit,
  UserX,
  UserCheck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  CalendarPlus,
  FileText,
  Clock,
  ShieldAlert
} from 'lucide-react';

export const PatientDetails = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' | 'medical'
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { hasRole } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const patientRes = await patientService.getPatientById(id);
      setPatient(patientRes.data);

      const aptRes = await patientService.getPatientAppointments(id);
      setAppointments(aptRes.data || []);

      if (hasRole('ADMIN', 'DOCTOR')) {
        try {
          const medRes = await medicalRecordService.getPatientMedicalRecords(id);
          setMedicalRecords(medRes.data || []);
        } catch {
          // non-critical or forbidden
        }
      }
    } catch (err) {
      toastError(getErrorMessage(err));
      navigate('/patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!patient) return;
    setActionLoading(true);
    try {
      const newStatus = !patient.active;
      await patientService.setPatientStatus(patient.id, newStatus);
      success(`Patient ${newStatus ? 'activated' : 'deactivated'} successfully`);
      setIsConfirmOpen(false);
      fetchPatientData();
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

  if (!patient) return null;

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{patient.fullName}</h1>
              <Badge variant={patient.active ? 'ACTIVE' : 'INACTIVE'}>
                {patient.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Registration Number: <span className="font-semibold text-teal-700">{patient.registrationNumber}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasRole('ADMIN', 'RECEPTIONIST') && (
            <button
              onClick={() => navigate('/appointments/book', { state: { preSelectedPatientId: patient.id } })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition shadow-sm shadow-teal-500/20"
            >
              <CalendarPlus className="w-4 h-4" />
              Book Visit
            </button>
          )}
          {hasRole('ADMIN', 'RECEPTIONIST') && (
            <button
              onClick={() => navigate(`/patients/${patient.id}/edit`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition"
            >
              <Edit className="w-4 h-4 text-slate-500" />
              Edit
            </button>
          )}
          {hasRole('ADMIN', 'RECEPTIONIST') && (
            <button
              onClick={() => setIsConfirmOpen(true)}
              className={`p-2 rounded-xl border transition ${
                patient.active
                  ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
              }`}
              title={patient.active ? 'Deactivate Patient' : 'Activate Patient'}
            >
              {patient.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Patient Profile Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Demographics */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
            Demographics
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Age / Gender</span>
              <span className="font-semibold text-slate-800">{patient.age} yrs • {patient.gender}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Date of Birth</span>
              <span className="font-semibold text-slate-800">{formatDate(patient.dateOfBirth)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Blood Group</span>
              <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg text-xs">
                {patient.bloodGroup || 'Unspecified'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Enrolled On</span>
              <span className="text-slate-700">{formatDate(patient.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Contact Details */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
            Contact Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-slate-500">Primary Phone</div>
                <div className="font-semibold text-slate-800">{patient.phone}</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-slate-500">Email Address</div>
                <div className="font-semibold text-slate-800">{patient.email || 'None on file'}</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-slate-500">Residential Address</div>
                <div className="text-slate-800">{patient.address}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Emergency Contact */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
            Emergency Contact
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2.5">
              <Heart className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-slate-500">Contact Person</div>
                <div className="font-semibold text-slate-800">{patient.emergencyContactName}</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-slate-500">Emergency Phone</div>
                <div className="font-semibold text-slate-800">{patient.emergencyContactPhone}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === 'appointments'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Appointments History ({appointments.length})
          </button>

          {hasRole('ADMIN', 'DOCTOR') && (
            <button
              onClick={() => setActiveTab('medical')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === 'medical'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              Clinical Records ({medicalRecords.length})
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content 1: Appointments */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {appointments.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">
              No appointments recorded for this patient yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-6">Reference</th>
                    <th className="py-3.5 px-6">Doctor</th>
                    <th className="py-3.5 px-6">Date & Time</th>
                    <th className="py-3.5 px-6">Reason</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-teal-700">
                        {apt.appointmentReference}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{apt.doctorName}</div>
                        <div className="text-xs text-slate-500">{apt.doctorSpecialization}</div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600">
                        <div>{formatDate(apt.appointmentDate)}</div>
                        <div className="text-slate-400">{formatTime(apt.startTime)} ({apt.durationMinutes} min)</div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 max-w-xs truncate">
                        {apt.reasonForVisit}
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={apt.status}>{apt.status}</Badge>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/appointments/${apt.id}`}
                          className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                        >
                          Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Medical Records (Clinical Encounters) */}
      {activeTab === 'medical' && hasRole('ADMIN', 'DOCTOR') && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => navigate('/medical-records/new', { state: { preSelectedPatientId: patient.id } })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Add Medical Record
            </button>
          </div>

          {medicalRecords.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/80 text-sm text-slate-400">
              No clinical encounter records found for this patient.
            </div>
          ) : (
            <div className="space-y-4">
              {medicalRecords.map((mr) => (
                <div key={mr.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <div className="text-xs text-slate-400 font-medium">
                        Visit Date: <span className="font-semibold text-slate-700">{formatDate(mr.visitDate)}</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-0.5">{mr.diagnosis}</h4>
                    </div>
                    <div className="text-xs text-slate-500">
                      Attending: <span className="font-semibold text-teal-700">{mr.doctorName}</span> ({mr.doctorSpecialization})
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <div className="font-bold text-slate-500 uppercase tracking-wider mb-1">Chief Complaint</div>
                      <p className="text-slate-800 leading-relaxed">{mr.chiefComplaint}</p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <div className="font-bold text-slate-500 uppercase tracking-wider mb-1">Treatment Plan</div>
                      <p className="text-slate-800 leading-relaxed">{mr.treatmentPlan}</p>
                    </div>
                  </div>

                  {mr.clinicalNotes && (
                    <div className="text-xs text-slate-600 bg-teal-50/30 p-3.5 rounded-xl border border-teal-100">
                      <span className="font-bold text-teal-800 uppercase tracking-wider">Clinical Notes: </span>
                      {mr.clinicalNotes}
                    </div>
                  )}

                  {mr.prescriptions && mr.prescriptions.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Prescriptions</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {mr.prescriptions.map((rx) => (
                          <div key={rx.id} className="p-3 rounded-xl border border-slate-200 text-xs bg-white">
                            <div className="font-bold text-slate-900">{rx.medicineName} ({rx.dosage})</div>
                            <div className="text-slate-500 mt-0.5">{rx.frequency} • {rx.duration}</div>
                            {rx.instructions && (
                              <div className="text-slate-400 italic mt-0.5">Note: {rx.instructions}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {mr.followUpDate && (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-2">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      Follow-up scheduled on: <span className="font-semibold text-slate-800">{formatDate(mr.followUpDate)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirm Deactivation / Activation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleToggleStatus}
        title={patient?.active ? 'Deactivate Patient' : 'Activate Patient'}
        message={
          patient?.active
            ? `Are you sure you want to deactivate patient "${patient?.fullName}"?`
            : `Are you sure you want to activate patient "${patient?.fullName}"?`
        }
        confirmText={patient?.active ? 'Deactivate' : 'Activate'}
        danger={patient?.active}
        loading={actionLoading}
      />
    </div>
  );
};
