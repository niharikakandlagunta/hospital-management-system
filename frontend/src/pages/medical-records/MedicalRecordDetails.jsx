import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { medicalRecordService } from '../../services/medicalRecordService';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import { getErrorMessage } from '../../services/api';
import {
  ArrowLeft,
  Printer,
  Calendar,
  User,
  Stethoscope,
  Pill,
  Clock,
  Activity
} from 'lucide-react';

export const MedicalRecordDetails = () => {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const { error: toastError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      try {
        const res = await medicalRecordService.getMedicalRecordById(id);
        setRecord(res.data);
      } catch (err) {
        toastError(getErrorMessage(err));
        navigate('/medical-records');
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Action Header */}
      <div className="no-print flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/medical-records')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Encounter Record</h1>
            <p className="text-xs text-slate-500">Visit Date: {formatDate(record.visitDate)}</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-sm"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          Print Prescription (Rx)
        </button>
      </div>

      {/* Main Prescription & Clinical Pad Layout */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Hospital Branding Header (Visible in Print) */}
        <div className="flex items-start justify-between pb-6 border-b-2 border-teal-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white font-bold">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">MediCare HMS</h2>
              <p className="text-xs text-slate-500 font-medium">Super Specialty Clinical Center</p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500 space-y-0.5">
            <div className="font-semibold text-slate-800">Emergency & OPD Department</div>
            <div>Phone: +1 (800) 555-CARE</div>
            <div>Web: www.medicare-hms.local</div>
          </div>
        </div>

        {/* Patient & Doctor Meta */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-100 text-xs">
          <div>
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Patient Details</span>
            <div className="text-sm font-bold text-slate-900">{record.patientName}</div>
            <div className="text-slate-500 font-mono mt-0.5">Reg ID: {record.patientRegistrationNumber}</div>
          </div>
          <div className="text-right">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Attending Physician</span>
            <div className="text-sm font-bold text-teal-800">{record.doctorName}</div>
            <div className="text-slate-500 mt-0.5">{record.doctorSpecialization}</div>
          </div>
        </div>

        {/* Clinical Summary */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Chief Complaint</h3>
            <p className="text-sm text-slate-800 bg-slate-50/40 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
              {record.chiefComplaint}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Physical Examination & Findings</h3>
            <p className="text-sm text-slate-800 bg-slate-50/40 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
              {record.clinicalNotes}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
            <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-1">Primary Diagnosis</h3>
            <p className="text-base font-bold text-teal-950">
              {record.diagnosis}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Treatment Protocol & Advice</h3>
            <p className="text-sm text-slate-800 bg-slate-50/40 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
              {record.treatmentPlan}
            </p>
          </div>
        </div>

        {/* Structured Rx Prescriptions */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <span className="font-serif italic font-extrabold text-2xl text-teal-700">℞</span>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Prescribed Medications</h3>
          </div>

          {record.prescriptions && record.prescriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                    <th className="py-2.5 px-3">Medication</th>
                    <th className="py-2.5 px-3">Dosage</th>
                    <th className="py-2.5 px-3">Frequency</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {record.prescriptions.map((rx, idx) => (
                    <tr key={rx.id || idx}>
                      <td className="py-3 px-3 font-bold text-slate-900">{rx.medicineName}</td>
                      <td className="py-3 px-3 text-slate-700">{rx.dosage}</td>
                      <td className="py-3 px-3 text-slate-700">{rx.frequency}</td>
                      <td className="py-3 px-3 text-slate-700">{rx.duration}</td>
                      <td className="py-3 px-3 text-slate-500 italic">{rx.instructions || 'As advised'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">No medicinal prescriptions issued for this visit.</div>
          )}
        </div>

        {/* Follow-up & Doctor Signature Pad */}
        <div className="pt-8 border-t border-slate-100 flex items-end justify-between">
          <div className="text-xs text-slate-500">
            {record.followUpDate && (
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                Review Date: <strong>{formatDate(record.followUpDate)}</strong>
              </div>
            )}
            <div className="mt-1 text-slate-400">Record Timestamp: {formatDate(record.createdAt)}</div>
          </div>

          <div className="text-right">
            <div className="w-48 border-b border-slate-400 mb-1"></div>
            <div className="text-xs font-bold text-slate-800">{record.doctorName}</div>
            <div className="text-[10px] text-slate-500">Authorized Medical Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
};
