import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { medicalRecordService } from '../../services/medicalRecordService';
import { patientService } from '../../services/patientService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  FileText,
  Pill,
  Calendar,
  User,
  HeartPulse
} from 'lucide-react';

export const CreateMedicalRecord = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const preSelectedPatientId = location.state?.preSelectedPatientId || '';
  const preSelectedAppointmentId = location.state?.preSelectedAppointmentId || '';

  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    patientId: preSelectedPatientId,
    appointmentId: preSelectedAppointmentId ? parseInt(preSelectedAppointmentId, 10) : null,
    visitDate: new Date().toISOString().split('T')[0],
    chiefComplaint: '',
    clinicalNotes: '',
    diagnosis: '',
    treatmentPlan: '',
    followUpDate: '',
    prescriptions: [
      { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    patientService.getPatients({ size: 100, active: true }).then((res) => {
      if (res && res.data) setPatients(res.data.content);
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrescriptionChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.prescriptions];
      updated[index][field] = value;
      return { ...prev, prescriptions: updated };
    });
  };

  const addPrescriptionRow = () => {
    setFormData((prev) => ({
      ...prev,
      prescriptions: [
        ...prev.prescriptions,
        { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }
      ]
    }));
  };

  const removePrescriptionRow = (index) => {
    if (formData.prescriptions.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      prescriptions: prev.prescriptions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId) {
      toastError('Please select a patient');
      return;
    }
    if (!formData.chiefComplaint.trim()) {
      toastError('Please enter the chief complaint');
      return;
    }
    if (!formData.diagnosis.trim()) {
      toastError('Please record a clinical diagnosis');
      return;
    }

    // Filter out completely empty prescription rows
    const cleanedPrescriptions = formData.prescriptions.filter(
      (p) => p.medicineName.trim() && p.dosage.trim()
    );

    setSubmitting(true);
    try {
      const payload = {
        patientId: parseInt(formData.patientId, 10),
        appointmentId: formData.appointmentId || null,
        visitDate: formData.visitDate,
        chiefComplaint: formData.chiefComplaint.trim(),
        clinicalNotes: formData.clinicalNotes.trim(),
        diagnosis: formData.diagnosis.trim(),
        treatmentPlan: formData.treatmentPlan.trim(),
        followUpDate: formData.followUpDate || null,
        prescriptions: cleanedPrescriptions
      };

      const res = await medicalRecordService.createMedicalRecord(payload);
      success('Clinical encounter record created successfully');
      navigate(`/medical-records/${res.data.id}`);
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Clinical Record</h1>
          <p className="text-sm text-slate-500">Record physician notes, diagnosis, and issue structured prescriptions</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-teal-600" />
                Patient *
              </label>
              <select
                name="patientId"
                value={formData.patientId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              >
                <option value="">-- Choose patient --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.registrationNumber}) • {p.gender}, {p.age} yrs
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                Visit Date *
              </label>
              <input
                type="date"
                name="visitDate"
                value={formData.visitDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              />
            </div>
          </div>

          {/* Chief Complaint */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Chief Complaint *
            </label>
            <textarea
              rows="2"
              name="chiefComplaint"
              value={formData.chiefComplaint}
              onChange={handleChange}
              required
              placeholder="Primary symptoms or reasons stated by patient..."
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Clinical Findings / Examination Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Clinical Findings & Examination Notes *
            </label>
            <textarea
              rows="3"
              name="clinicalNotes"
              value={formData.clinicalNotes}
              onChange={handleChange}
              required
              placeholder="Physical examination notes, vital signs (BP, Pulse), observations..."
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Diagnosis & Treatment Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Clinical Diagnosis *
              </label>
              <input
                type="text"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                required
                placeholder="e.g. Essential Hypertension (ICD-10 I10)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Follow-up Date (Optional)
              </label>
              <input
                type="date"
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Treatment Plan & Advice *
              </label>
              <textarea
                rows="2"
                name="treatmentPlan"
                value={formData.treatmentPlan}
                onChange={handleChange}
                required
                placeholder="Lifestyle modifications, dietary restrictions, therapy protocols..."
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Prescriptions Structured Section */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 text-teal-700">
                  <Pill className="w-4 h-4" />
                  Prescribed Medications
                </h3>
                <p className="text-xs text-slate-500">Structured medication dosing instructions</p>
              </div>
              <button
                type="button"
                onClick={addPrescriptionRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition border border-teal-200"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Medication
              </button>
            </div>

            <div className="space-y-3">
              {formData.prescriptions.map((rx, index) => (
                <div
                  key={index}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                >
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Medicine Name
                    </label>
                    <input
                      type="text"
                      value={rx.medicineName}
                      onChange={(e) => handlePrescriptionChange(index, 'medicineName', e.target.value)}
                      placeholder="e.g. Amlodipine"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={rx.dosage}
                      onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                      placeholder="e.g. 5 mg"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Frequency
                    </label>
                    <input
                      type="text"
                      value={rx.frequency}
                      onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                      placeholder="e.g. Once daily morning"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={rx.duration}
                      onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                      placeholder="e.g. 30 days"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => removePrescriptionRow(index)}
                      disabled={formData.prescriptions.length <= 1}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-30"
                      title="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition shadow-sm shadow-teal-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'Saving Encounter...' : 'Save Medical Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
