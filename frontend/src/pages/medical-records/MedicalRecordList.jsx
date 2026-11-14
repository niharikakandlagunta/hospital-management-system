import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { medicalRecordService } from '../../services/medicalRecordService';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import { getErrorMessage } from '../../services/api';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  User,
  Stethoscope,
  Eye,
  Pill
} from 'lucide-react';

export const MedicalRecordList = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const { hasRole } = useAuth();
  const { error: toastError } = useToast();
  const navigate = useNavigate();

  const fetchRecords = async (pageNum = page) => {
    setLoading(true);
    try {
      const params = {
        page: pageNum,
        size: 10,
        search: search.trim() || undefined,
        visitDate: visitDate || undefined
      };
      const res = await medicalRecordService.getMedicalRecords(params);
      if (res && res.data) {
        setRecords(res.data.content);
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
    fetchRecords(0);
  }, [search, visitDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Medical Records</h1>
          <p className="text-sm text-slate-500">Authorized medical encounters, physician diagnoses, and structured prescriptions</p>
        </div>
        {hasRole('ADMIN', 'DOCTOR') && (
          <button
            onClick={() => navigate('/medical-records/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition shadow-sm shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" />
            New Medical Record
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search diagnosis, complaint, or patient..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Date:</span>
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No medical records found"
            description="No clinical records match your query."
            actionText={hasRole('ADMIN', 'DOCTOR') ? 'Create Medical Record' : undefined}
            onAction={hasRole('ADMIN', 'DOCTOR') ? () => navigate('/medical-records/new') : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Visit Date</th>
                  <th className="py-3.5 px-6">Patient</th>
                  <th className="py-3.5 px-6">Attending Physician</th>
                  <th className="py-3.5 px-6">Clinical Diagnosis</th>
                  <th className="py-3.5 px-6">Prescriptions</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6 text-xs font-semibold text-slate-800 whitespace-nowrap">
                      {formatDate(r.visitDate)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{r.patientName}</div>
                      <div className="text-xs text-slate-400 font-mono">{r.patientRegistrationNumber}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800">{r.doctorName}</div>
                      <div className="text-xs text-teal-600">{r.doctorSpecialization}</div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-700 max-w-xs truncate font-medium">
                      {r.diagnosis}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-100">
                        <Pill className="w-3 h-3 text-teal-600" />
                        {r.prescriptions?.length || 0} Meds
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/medical-records/${r.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 p-1.5 rounded-lg hover:bg-teal-50"
                      >
                        <Eye className="w-4 h-4" /> View
                      </Link>
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
          onPageChange={(p) => fetchRecords(p)}
        />
      </div>
    </div>
  );
};
