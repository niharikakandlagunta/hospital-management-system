import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doctorService } from '../../services/doctorService';
import { Badge } from '../../components/Badge';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { getErrorMessage } from '../../services/api';
import {
  Search,
  Plus,
  Stethoscope,
  Phone,
  Mail,
  Award,
  Calendar,
  Clock,
  Filter,
  Eye,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [availableFilter, setAvailableFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const { hasRole } = useAuth();
  const { error: toastError, success } = useToast();
  const navigate = useNavigate();

  const fetchDoctors = async (pageNum = page) => {
    setLoading(true);
    try {
      const params = {
        page: pageNum,
        size: 9,
        search: search.trim() || undefined,
        available: availableFilter === '' ? undefined : availableFilter === 'true'
      };
      const res = await doctorService.getDoctors(params);
      if (res && res.data) {
        setDoctors(res.data.content);
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
    fetchDoctors(0);
  }, [search, availableFilter]);

  const handleToggleAvailability = async (doctor) => {
    try {
      const newStatus = !doctor.available;
      await doctorService.setDoctorAvailability(doctor.id, newStatus);
      success(`${doctor.fullName} is now ${newStatus ? 'available' : 'unavailable'}`);
      fetchDoctors(page);
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Medical Specialists</h1>
          <p className="text-sm text-slate-500">Directory of certified hospital physicians, departments, and schedules</p>
        </div>
        {hasRole('ADMIN') && (
          <button
            onClick={() => navigate('/doctors/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition shadow-sm shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Doctor
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or specialty..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            Availability:
          </div>
          <select
            value={availableFilter}
            onChange={(e) => setAvailableFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">All Statuses</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="p-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      ) : doctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors found"
          description="Try modifying your search criteria or filter options."
          actionText={hasRole('ADMIN') ? 'Add New Doctor' : undefined}
          onAction={hasRole('ADMIN') ? () => navigate('/doctors/new') : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg shadow-inner">
                      {doc.fullName.replace('Dr. ', '').charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">{doc.fullName}</h3>
                      <p className="text-xs text-teal-700 font-semibold mt-0.5">{doc.specialization}</p>
                    </div>
                  </div>
                  <Badge variant={doc.available ? 'AVAILABLE' : 'UNAVAILABLE'} size="sm">
                    {doc.available ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>

                {/* Badges / Department */}
                <div className="text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span>Dept: <strong className="text-slate-800">{doc.departmentName || 'General'}</strong></span>
                  <span>Exp: <strong className="text-slate-800">{doc.yearsOfExperience} yrs</strong></span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-slate-600 mb-6">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{doc.qualifications}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{doc.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{doc.email}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Fee</span>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(doc.consultationFee)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasRole('ADMIN', 'RECEPTIONIST') && doc.available && (
                    <button
                      onClick={() => navigate('/appointments/book', { state: { preSelectedDoctorId: doc.id } })}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition shadow-sm"
                    >
                      Book Slot
                    </button>
                  )}
                  <Link
                    to={`/doctors/${doc.id}`}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    title="View Doctor Schedule & Profile"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  {hasRole('ADMIN') && (
                    <button
                      onClick={() => handleToggleAvailability(doc)}
                      className={`p-1.5 rounded-xl transition ${
                        doc.available
                          ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={doc.available ? 'Set Unavailable' : 'Set Available'}
                    >
                      {doc.available ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={9}
        onPageChange={(p) => fetchDoctors(p)}
      />
    </div>
  );
};
